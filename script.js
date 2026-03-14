let images=[
"images/banner1.jpg",
"images/banner2.jpg",
"images/banner3.jpg"
]

let index=0

setInterval(()=>{
index++
if(index>=images.length){index=0}
document.getElementById("slide").src=images[index]
},3000)


function showProduct(name,text,img,price){

document.getElementById("popup").style.display="block"

document.getElementById("pname").innerText=name
document.getElementById("ptext").innerText=text
document.getElementById("pimg").src=img
document.getElementById("pprice").innerText="價格 $"+price

}

function closePopup(){
document.getElementById("popup").style.display="none"
}


function filterCategory(type){

let cards=document.querySelectorAll(".card")

cards.forEach(card=>{

if(type==="all"){
card.style.display="block"
}
else if(card.classList.contains(type)){
card.style.display="block"
}
else{
card.style.display="none"
}

})

}


function searchProduct(){

let input=document.getElementById("searchInput").value.toLowerCase()

let cards=document.querySelectorAll(".card")

cards.forEach(card=>{

let name=card.dataset.name.toLowerCase()

if(name.includes(input)){
card.style.display="block"
}else{
card.style.display="none"
}

})

}


function addToCart(name,price){

let cart=JSON.parse(localStorage.getItem("cart")) || []

cart.push({name,price})

localStorage.setItem("cart",JSON.stringify(cart))

updateCartCount()

alert(name+" 已加入購物車")

}


function updateCartCount(){
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let countElement = document.getElementById("cartCount");
    
    // 加上 if 判斷：如果有找到 cartCount 這個標籤，才去更新數字
    if (countElement) {
        countElement.innerText = cart.length;
    }
}


function openCart(){

let cart=JSON.parse(localStorage.getItem("cart")) || []

let html=""
let total=0

cart.forEach((item,i)=>{

html+=`
<p>
${item.name} - $${item.price}
<button onclick="removeItem(${i})">刪除</button>
</p>
`

total+=item.price

})

document.getElementById("cartItems").innerHTML=html
document.getElementById("cartTotal").innerText="總金額 $"+total

document.getElementById("cartModal").style.display="block"

}


function closeCart(){
document.getElementById("cartModal").style.display="none"
}


function removeItem(i){

let cart=JSON.parse(localStorage.getItem("cart")) || []

cart.splice(i,1)

localStorage.setItem("cart",JSON.stringify(cart))

openCart()
updateCartCount()

}


function checkout(){

alert("結帳成功！")

localStorage.removeItem("cart")

updateCartCount()

closeCart()

}


function openLogin(){
document.getElementById("loginModal").style.display="block"
}

function openRegister(){
document.getElementById("registerModal").style.display="block"
}

function closeModal(){
document.getElementById("loginModal").style.display="none"
document.getElementById("registerModal").style.display="none"
}

function switchRegister(){
closeModal()
openRegister()
}

function switchLogin(){
    closeModal()
    openLogin()
}


function register(){

    let user=document.getElementById("regUser").value.trim()
    let pass=document.getElementById("regPass").value.trim()

    let accounts=JSON.parse(localStorage.getItem("accounts")) || {}

    accounts[user]={password:pass}

    localStorage.setItem("accounts",JSON.stringify(accounts))

    alert("註冊成功")

    closeModal()

}


function login(){

    let user=document.getElementById("loginUser").value.trim()
    let pass=document.getElementById("loginPass").value.trim()

    let accounts=JSON.parse(localStorage.getItem("accounts")) || {}

    if(!accounts[user]){
    alert("帳號不存在")
    return
    }

    if(accounts[user].password!==pass){
    alert("密碼錯誤")
    return
    }

    localStorage.setItem("loginUser",user)

    showUser()

    closeModal()

}


function showUser(){
    let user = localStorage.getItem("loginUser");
    let loginBtn = document.getElementById("loginBtn");
    let regBtn = document.getElementById("regBtn");
    let cartBtn = document.getElementById("cartBtn"); // 抓取購物車按鈕

    if(user){
        // 登入後：顯示大頭貼(加上 margin-right 增加間距)，隱藏登入註冊，顯示購物車
        document.getElementById("userArea").innerHTML = `
            <img src="images/user-icon.jpg" style="width: 50px; height: 50px; border-radius: 50%; cursor: pointer; vertical-align: middle; margin-right: 20px;" onclick="location.href='profile.html'" alt="個人資訊">
        `;
        if(loginBtn) loginBtn.style.display = "none";
        if(regBtn) regBtn.style.display = "none";
        if(cartBtn) cartBtn.style.display = "inline-block"; // 顯示購物車
    } else {
        // 未登入：清空大頭貼，顯示登入註冊，隱藏購物車
        document.getElementById("userArea").innerHTML = "";
        if(loginBtn) loginBtn.style.display = "inline-block";
        if(regBtn) regBtn.style.display = "inline-block";
        if(cartBtn) cartBtn.style.display = "none"; // 隱藏購物車
    }
}

function logout(){

localStorage.removeItem("loginUser")

location.reload()

}


updateCartCount()
showUser()
