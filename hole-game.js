const HOLE_API_URL = window.RETRO_SNACKS_CONFIG.API_URL;
const HOLE_COUNT = 9;

const holeGrid = document.getElementById("holeGrid");
const statusEl = document.getElementById("holeGameStatus");
const resultEl = document.getElementById("holeGameResult");
const userEl = document.getElementById("holeGameUser");
const historyEl = document.getElementById("holeGameHistory");

function getAuthToken() {
    return localStorage.getItem("authToken");
}

function getLoginUser() {
    return localStorage.getItem("loginUser");
}

function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.exp && payload.exp * 1000 < Date.now();
    } catch (err) {
        return true;
    }
}

function getAuthHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAuthToken()}`
    };
}

function setStatus(message) {
    statusEl.innerText = message;
}

function setResult(record) {
    if (!record) {
        resultEl.innerHTML = "";
        return;
    }

    const title = record.isWinner ? "恭喜中獎" : "謝謝參加";
    resultEl.innerHTML = `
        <strong>${title}</strong>
        <span>今日結果：${record.prizeName}</span>
    `;
}

function setBoardDisabled(disabled) {
    document.querySelectorAll(".hole-cell").forEach(button => {
        button.disabled = disabled;
    });
}

function revealPlayedBoard(record) {
    setBoardDisabled(true);
    const firstHole = document.querySelector(".hole-cell");
    if (firstHole && record) {
        firstHole.classList.add("is-open");
        firstHole.innerHTML = `<span>${record.prizeName}</span>`;
    }
}

function renderHistory(records) {
    if (!historyEl) return;

    if (!records || records.length === 0) {
        historyEl.innerHTML = `<div class="hole-history-empty">目前還沒有中獎紀錄。</div>`;
        return;
    }

    historyEl.innerHTML = records.map(record => `
        <div class="hole-history-item">
            <strong>${record.prizeName}</strong>
            <span>${record.playDate}</span>
        </div>
    `).join("");
}

async function loadHistory() {
    if (!historyEl) return;

    try {
        const response = await fetch(`${HOLE_API_URL}/hole-game/records`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();

        if (response.status === 401) {
            historyEl.innerHTML = `<div class="hole-history-empty">登入後可查看紀錄。</div>`;
            return;
        }

        if (!data.success) {
            historyEl.innerHTML = `<div class="hole-history-empty">${data.message || "讀取紀錄失敗。"}</div>`;
            return;
        }

        renderHistory(data.records);
    } catch (err) {
        historyEl.innerHTML = `<div class="hole-history-empty">伺服器連線失敗，暫時無法讀取紀錄。</div>`;
    }
}

function renderBoard() {
    holeGrid.innerHTML = "";
    for (let i = 0; i < HOLE_COUNT; i++) {
        const button = document.createElement("button");
        button.className = "hole-cell";
        button.type = "button";
        button.innerHTML = `<span>戳</span>`;
        button.onclick = () => playHole(button);
        holeGrid.appendChild(button);
    }
}

function showLoginRequired() {
    setStatus("請先登入後再參加活動。");
    resultEl.innerHTML = `<a class="hole-game-link" href="index.html">回首頁登入</a>`;
    if (historyEl) historyEl.innerHTML = `<div class="hole-history-empty">登入後可查看紀錄。</div>`;
    setBoardDisabled(true);
}

async function loadStatus() {
    const token = getAuthToken();
    const user = getLoginUser();

    renderBoard();
    userEl.innerText = user ? `會員：${user}` : "";

    if (!token || isTokenExpired(token)) {
        showLoginRequired();
        return;
    }

    try {
        loadHistory();
        const response = await fetch(`${HOLE_API_URL}/hole-game/status`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();

        if (response.status === 401) {
            showLoginRequired();
            return;
        }

        if (!data.success) {
            setStatus(data.message || "讀取活動狀態失敗。");
            setBoardDisabled(true);
            return;
        }

        if (data.played) {
            setStatus("你今天已經玩過洞洞樂。");
            setResult(data.record);
            revealPlayedBoard(data.record);
            return;
        }

        setStatus("請選一個洞戳下去。");
        setBoardDisabled(false);
    } catch (err) {
        setStatus("伺服器連線失敗，請稍後再試。");
        setBoardDisabled(true);
    }
}

async function playHole(button) {
    setBoardDisabled(true);
    button.classList.add("is-opening");
    button.innerHTML = `<span>開獎中</span>`;
    setStatus("開獎中...");

    try {
        const response = await fetch(`${HOLE_API_URL}/hole-game/play`, {
            method: "POST",
            headers: getAuthHeaders()
        });
        const data = await response.json();

        if (response.status === 401) {
            button.classList.remove("is-opening");
            showLoginRequired();
            return;
        }

        if (data.record) {
            button.classList.remove("is-opening");
            button.classList.add("is-open");
            button.innerHTML = `<span>${data.record.prizeName}</span>`;
            setResult(data.record);
            setStatus(data.success ? "今天的洞洞樂完成。" : data.message);
            loadHistory();
            return;
        }

        setStatus(data.message || "抽獎失敗，請稍後再試。");
        button.classList.remove("is-opening");
        button.innerHTML = `<span>戳</span>`;
        setBoardDisabled(false);
    } catch (err) {
        setStatus("伺服器連線失敗，請稍後再試。");
        button.classList.remove("is-opening");
        button.innerHTML = `<span>戳</span>`;
        setBoardDisabled(false);
    }
}

loadStatus();
