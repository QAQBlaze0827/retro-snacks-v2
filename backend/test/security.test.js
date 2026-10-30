const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const mongoose = require("mongoose");

const source = fs.readFileSync(path.join(__dirname, "../server.js"), "utf8");

// Execute the real server source without opening ports, connecting to MongoDB,
// loading .env, or sending email. Route handlers and JWT code remain unchanged.
function loadServer(env = { JWT_SECRET: "isolated-test-secret" }) {
  const routes = new Map();
  const state = { queries: [], saves: 0, connects: 0, listens: 0, user: null };
  const app = {
    use() {},
    get(route, ...handlers) { routes.set(`GET ${route}`, handlers); },
    post(route, ...handlers) { routes.set(`POST ${route}`, handlers); },
    put(route, ...handlers) { routes.set(`PUT ${route}`, handlers); },
    listen() { state.listens++; },
  };
  const express = () => app;
  express.json = () => () => {};
  const models = {
    User: {
      async findOne(filter) {
        state.queries.push(filter);
        const user = state.user;
        if (!user || Object.entries(filter).some(([key, value]) => user[key] !== value)) {
          return null;
        }
        return user;
      },
    },
  };
  const dependencies = {
    dns: { setDefaultResultOrder() {} },
    express,
    mongoose: {
      Schema: mongoose.Schema,
      model: (name) => models[name] || {},
      connect() {
        state.connects++;
        return new Promise(() => {});
      },
    },
    dotenv: { config() {} },
    "@sendgrid/mail": {
      setApiKey() {},
      send() { throw new Error("Email must not be sent by unit tests"); },
    },
  };
  const context = vm.createContext({
    require: (name) => dependencies[name] || require(name),
    process: { env },
    console: { log() {}, warn() {}, error() {} },
    Date,
  });
  let error;
  try {
    vm.runInContext(source, context, { filename: "server.js" });
  } catch (err) {
    error = err;
  }
  return { routes, state, context, error };
}

function pendingUser(server, overrides = {}) {
  server.state.user = {
    username: "member",
    verificationCode: "123456",
    codeExpires: new Date(Date.now() + 60000),
    isVerified: false,
    async save() { server.state.saves++; },
    ...overrides,
  };
  return server.state.user;
}

async function verify(server, body) {
  assert.equal(server.error, undefined);
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
  };
  await server.routes.get("POST /api/verify")[0]({ body }, response);
  return response;
}

const invalidInputs = [
  ["missing body", undefined],
  ["null body", null],
  ["missing fields", {}],
  ["blank username", { username: "  ", code: "123456" }],
  ["object username with test code", { username: { $ne: null }, code: "000000" }],
  ["array username", { username: ["member"], code: "123456" }],
  ["object code", { username: "member", code: { $ne: null } }],
  ["array code", { username: "member", code: ["123456"] }],
  ["numeric code", { username: "member", code: 123456 }],
  ["short code", { username: "member", code: "12345" }],
  ["non-digit code", { username: "member", code: "abcdef" }],
  ["code with trailing newline", { username: "member", code: "123456\n" }],
];

for (const [label, body] of invalidInputs) {
  test(`verification rejects ${label} before querying`, async () => {
    const server = loadServer();
    pendingUser(server);
    const response = await verify(server, body);
    assert.equal(response.statusCode, 400);
    assert.equal(server.state.queries.length, 0);
    assert.equal(server.state.saves, 0);
  });
}

for (const [label, expiry] of [
  ["expired", new Date(0)],
  ["already due", new Date()],
  ["missing", undefined],
  ["null", null],
  ["invalid", new Date(NaN)],
  ["wrong type", "2099-01-01"],
]) {
  test(`verification rejects ${label} expiry`, async () => {
    const server = loadServer();
    const user = pendingUser(server, { codeExpires: expiry });
    const response = await verify(server, { username: "member", code: "123456" });
    assert.equal(response.statusCode, 400);
    assert.equal(user.isVerified, false);
    assert.equal(server.state.saves, 0);
  });
}

test("valid code verifies once and clears the pending code", async () => {
  const server = loadServer();
  const user = pendingUser(server);
  const body = { username: "member", code: "123456" };
  assert.equal((await verify(server, body)).body.success, true);
  assert.equal(user.isVerified, true);
  assert.equal(user.verificationCode, undefined);
  assert.equal(user.codeExpires, undefined);
  assert.equal((await verify(server, body)).statusCode, 400);
  assert.equal(server.state.saves, 1);
});

test("wrong code and unknown user cannot verify", async () => {
  const server = loadServer();
  pendingUser(server);
  assert.equal((await verify(server, { username: "member", code: "654321" })).statusCode, 400);
  assert.equal((await verify(server, { username: "unknown", code: "123456" })).statusCode, 400);
  assert.equal(server.state.saves, 0);
});

test("test code 000000 remains available for an existing account", async () => {
  const server = loadServer();
  const user = pendingUser(server, { codeExpires: new Date(0) });
  assert.equal((await verify(server, { username: "member", code: "000000" })).body.success, true);
  assert.equal(user.isVerified, true);
  assert.equal(user.verificationCode, undefined);
  assert.equal((await verify(server, { username: "unknown", code: "000000" })).statusCode, 400);
});

for (const mode of ["development", "production"]) {
  for (const [label, secret] of [
    ["missing", undefined],
    ["empty", ""],
    ["whitespace", " \t\n"],
    ["old default", "dev_jwt_secret_change_me"],
    ["padded old default", " dev_jwt_secret_change_me "],
  ]) {
    test(`${mode} refuses ${label} JWT secret before DB connection or listening`, () => {
      const server = loadServer({ NODE_ENV: mode, JWT_SECRET: secret });
      assert.match(server.error?.message || "", /JWT_SECRET/);
      assert.equal(server.state.connects, 0);
      assert.equal(server.state.listens, 0);
    });
  }
}

test("missing NODE_ENV does not enable the old JWT fallback", () => {
  const server = loadServer({});
  assert.match(server.error?.message || "", /JWT_SECRET/);
  assert.equal(server.state.connects, 0);
  assert.equal(server.state.listens, 0);
});

test("configured JWT secret is preserved exactly and signs verifiable tokens", () => {
  const jwt = require("jsonwebtoken");
  const secret = "  isolated-long-test-secret-do-not-deploy  ";
  const server = loadServer({ JWT_SECRET: secret });
  assert.equal(server.error, undefined);
  server.context.testUser = { _id: "507f1f77bcf86cd799439011", username: "member" };
  const token = vm.runInContext("createToken(testUser)", server.context);
  const payload = jwt.verify(token, secret);
  assert.equal(payload.id, server.context.testUser._id);
  assert.equal(payload.exp - payload.iat, 7 * 24 * 60 * 60);
  assert.throws(() => jwt.verify(token, "dev_jwt_secret_change_me"));

  const authenticate = server.routes.get("GET /api/user/me")[0];
  const response = {
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; },
  };
  let accepted = false;
  authenticate({ headers: { authorization: `Bearer ${token}` } }, response, () => { accepted = true; });
  assert.equal(accepted, true);
  accepted = false;
  const forged = jwt.sign({ id: payload.id }, "dev_jwt_secret_change_me");
  authenticate({ headers: { authorization: `Bearer ${forged}` } }, response, () => { accepted = true; });
  assert.equal(accepted, false);
  assert.equal(response.statusCode, 401);
});
