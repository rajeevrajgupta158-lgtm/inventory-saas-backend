const API = "/api";
let inventory = [];
let chart;

// ================= LOGIN SYSTEM =================

async function login() {
const username = document.getElementById("username").value;
const password = document.getElementById("password").value;

const res = await fetch(`${API}/auth/login`, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ username, password })
});

const data = await res.json();

if (data.token) {
localStorage.setItem("token", data.token);
document.getElementById("loginPage").classList.add("hidden");
document.getElementById("app").classList.remove("hidden");
loadProducts();
showToast("Login Successful 🚀");
} else {
showToast("Invalid credentials ❌");
}
}

function logout() {
localStorage.removeItem("token");
document.getElementById("app").classList.add("hidden");
document.getElementById("loginPage").classList.remove("hidden");
showToast("Logged out");
}

// ================= LOAD PRODUCTS =================

async function loadProducts() {
const res = await fetch(`${API}/products`);
inventory = await res.json();
renderAll();
}

// ================= TOAST =================

function showToast(message) {
let toast = document.createElement("div");
toast.className = "toast";
toast.innerText = message;
document.body.appendChild(toast);

setTimeout(() => toast.classList.add("show"), 100);
setTimeout(() => {
toast.classList.remove("show");
setTimeout(()=> toast.remove(), 300);
}, 2500);
}

// ================= SAVE PRODUCT =================

async function saveProduct() {
const product = {
name: nameInput.value,
cost: +costInput.value,
price: +priceInput.value,
quantity: +quantityInput.value,
category: categoryInput.value,
img: ""
};

await fetch(`${API}/products`, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify(product)
});

clearForm();
loadProducts();
showToast("Product Added ✅");
}

// ================= CLEAR FORM =================

function clearForm() {
nameInput.value = "";
costInput.value = "";
priceInput.value = "";
quantityInput.value = "";
categoryInput.value = "";
imageFile.value = "";
}

// ================= DELETE =================

async function deleteProduct(index) {
const id = inventory[index]._id;
await fetch(`${API}/products/${id}`, { method: "DELETE" });
loadProducts();
showToast("Product Deleted 🗑");
}

// ================= EDIT =================

function editProduct(index) {
const p = inventory[index];

nameInput.value = p.name;
costInput.value = p.cost;
priceInput.value = p.price;
quantityInput.value = p.quantity;
categoryInput.value = p.category;

deleteProduct(index);
showToast("Editing Product ✏");
}

// ================= STOCK =================

async function stockIn(index) {
const id = inventory[index]._id;
await fetch(`${API}/products/stock/in/${id}`, { method: "PATCH" });
loadProducts();
}

async function stockOut(index) {
const id = inventory[index]._id;
await fetch(`${API}/products/stock/out/${id}`, { method: "PATCH" });
loadProducts();
}

// ================= CLEAR ALL =================

async function clearAll() {
for (let p of inventory) {
await fetch(`${API}/products/${p._id}`, { method: "DELETE" });
}
loadProducts();
showToast("Inventory Cleared");
}

// ================= EXPORT CSV =================

function exportCSV(){
let csv="Name,Cost,Price,Quantity,Category\n";
inventory.forEach(p=>{
csv+=`${p.name},${p.cost},${p.price},${p.quantity},${p.category}\n`;
});
let blob=new Blob([csv],{type:"text/csv"});
let a=document.createElement("a");
a.href=URL.createObjectURL(blob);
a.download="inventory.csv";
a.click();
showToast("CSV Exported");
}

// ================= IMPORT CSV =================

function handleCSVUpload(){
const file=csvFile.files[0];
if(!file){ showToast("Select CSV first"); return; }

const reader=new FileReader();
reader.onload=async function(e){
const rows=e.target.result.split("\n").slice(1);

for(let row of rows){
const cols=row.split(",");
if(cols.length>=5){
await fetch(`${API}/products`,{
method:"POST",
headers:{ "Content-Type":"application/json"},
body:JSON.stringify({
name:cols[0],
cost:+cols[1],
price:+cols[2],
quantity:+cols[3],
category:cols[4],
img:""
})
});
}
}

loadProducts();
showToast("CSV Imported");
};
reader.readAsText(file);
}

// ================= STATUS =================

function getStatus(q){
if(q===0) return "Out of Stock";
if(q<5) return "Low Stock";
return "In Stock";
}

// ================= RENDER TABLE =================

function renderTable(){
let table=inventoryTable;
let search=searchInput.value.toLowerCase();
let filter=filterCategory.value;
let sort=sortBy.value;

let filtered=inventory
.map((p,i)=>({...p,index:i}))
.filter(p=>p.name.toLowerCase().includes(search)&&
(filter===""||p.category===filter));

if(sort) filtered.sort((a,b)=>a[sort]-b[sort]);

table.innerHTML="";

filtered.forEach(p=>{
let profit=(p.price-p.cost)*p.quantity;
table.innerHTML+=`
<tr>
<td>${p.img?`<img src="${p.img}" class="product-img">`:""}</td>
<td>${p.name}</td>
<td>₹${p.price}</td>
<td>${p.quantity}</td>
<td>${p.category}</td>
<td>₹${profit}</td>
<td>${getStatus(p.quantity)}</td>
<td>
<button onclick="showQR(${p.index})" style="background: #8b5cf6;">QR</button>
<button onclick="editProduct(${p.index})">Edit</button>
<button onclick="stockIn(${p.index})">+</button>
<button onclick="stockOut(${p.index})">-</button>
<button onclick="deleteProduct(${p.index})">Delete</button>
</td>
</tr>`;
});

updateDashboard();
updateCategoryFilter();
updateInvoiceDropdown();
}

// ================= DASHBOARD =================

function updateDashboard(){
animateValue("totalProducts",inventory.length);

let value=0,profit=0,low=0;

inventory.forEach(p=>{
value+=p.price*p.quantity;
profit+=(p.price-p.cost)*p.quantity;
if(p.quantity<5) low++;
});

animateValue("totalValue",value,true);
animateValue("totalProfit",profit,true);
animateValue("lowStock",low);
}

// ================= SMART QR GENERATOR =================

function showQR(index) {
    let p = inventory[index];
    document.getElementById("qrTitle").innerText = p.name;
    document.getElementById("qrcode").innerHTML = ""; // Clear old QR code

    // We dynamically grab your Cloudflare URL so the phone knows exactly where to go!
    let host = window.location.origin;
    
    // This creates a link to a special mobile page we are about to build
    let scanUrl = `${host}/scan.html?id=${p._id}`;

    // Draw the QR Code
    new QRCode(document.getElementById("qrcode"), {
        text: scanUrl,
        width: 180,
        height: 180,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });

    document.getElementById("qrModal").classList.remove("hidden");
}

// ================= COUNTER ANIMATION =================

function animateValue(id,end,isCurrency=false){
let el=document.getElementById(id);
let start=0;
let duration=500;
let stepTime=20;
let increment=end/(duration/stepTime);

let counter=setInterval(()=>{
start+=increment;
if(start>=end){
start=end;
clearInterval(counter);
}
el.innerText=isCurrency?"₹"+Math.floor(start):Math.floor(start);
},stepTime);
}

// ================= CATEGORY FILTER =================

function updateCategoryFilter(){
let cats=[...new Set(inventory.map(p=>p.category))];
filterCategory.innerHTML=`<option value="">All Categories</option>`;
cats.forEach(c=>{
filterCategory.innerHTML+=`<option value="${c}">${c}</option>`;
});
}

// ================= INVOICE =================

function updateInvoiceDropdown(){
invoiceProduct.innerHTML="";
inventory.forEach((p,i)=>{
invoiceProduct.innerHTML+=`<option value="${i}">${p.name}</option>`;
});
}

// ================= UPGRADED INVOICE =================

function generateInvoice() {
    let index = invoiceProduct.value;
    let qty = parseInt(invoiceQty.value);

    // 1. Safety Check: Did they enter a valid number?
    if (index === "" || isNaN(qty) || qty <= 0) {
        showToast("❌ Please enter a valid quantity.");
        return;
    }

    let p = inventory[index];

    // 2. Inventory Check: Do we actually have enough stock?
    if (qty > p.quantity) {
        showToast(`⚠️ Not enough stock! Only ${p.quantity} available.`);
        return;
    }

    // 3. Generate the Invoice
    let total = p.price * qty;
    
    // Use an Alert for a more "permanent" invoice receipt feel, 
    // or you can eventually upgrade this to a printed PDF!
    let receipt = `🧾 INVOICE SUMMARY 🧾\n\n` +
                  `Product: ${p.name}\n` +
                  `Price per unit: ₹${p.price}\n` +
                  `Quantity: ${qty}\n` +
                  `-------------------------\n` +
                  `GRAND TOTAL: ₹${total}\n` +
                  `-------------------------`;
    
    alert(receipt);

    // 4. Clear the input box after success
    invoiceQty.value = "";
}

// ================= DOWNLOAD INVOICE =================

function downloadInvoice() {
    let index = invoiceProduct.value;
    let qty = parseInt(invoiceQty.value);

    // 1. Safety & Stock Checks
    if (index === "" || isNaN(qty) || qty <= 0) {
        showToast("❌ Please enter a valid quantity.");
        return;
    }

    let p = inventory[index];

    if (qty > p.quantity) {
        showToast(`⚠️ Not enough stock! Only ${p.quantity} available.`);
        return;
    }

    // 2. Calculate and Format the Receipt
    let total = p.price * qty;
    let date = new Date().toLocaleDateString();
    
    let receiptText = 
`=================================
     ULTIMATE INVOICE RECEIPT    
=================================
Date: ${date}

Product: ${p.name}
Category: ${p.category}
Price per unit: ₹${p.price}
Quantity: ${qty}
---------------------------------
GRAND TOTAL: ₹${total}
=================================
Thank you for your business!`;

    // 3. Create the file and force download (Same logic as your CSV export!)
    let blob = new Blob([receiptText], { type: "text/plain" });
    let a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    
    // Names the file dynamically (e.g., "Invoice_Laptop_1710604500.txt")
    a.download = `Invoice_${p.name.replace(/\s+/g, '_')}_${Date.now()}.txt`; 
    a.click();
    
    // Clean up
    URL.revokeObjectURL(a.href);
    showToast("Invoice Downloaded 📄");
    invoiceQty.value = "";
}

// ================= CHART =================

function updateChart(){
const ctx=document.getElementById("chart").getContext("2d");
const type=chartType.value;

if(chart) chart.destroy();

chart=new Chart(ctx,{
type:type,
data:{
labels:inventory.map(p=>p.name),
datasets:[{
label:"Stock Quantity",
data:inventory.map(p=>p.quantity)
}]
},
options:{responsive:true}
});
}

// ================= VIEW =================

function changeViewMode(){
let mode=viewMode.value;

["tableContainer","cardContainer","listContainer","summaryContainer","chartContainer"]
.forEach(id=>document.getElementById(id).classList.add("hidden"));

if(mode==="table") tableContainer.classList.remove("hidden");
if(mode==="chart") chartContainer.classList.remove("hidden");
if(mode==="cards"){ renderCards(); cardContainer.classList.remove("hidden"); }
if(mode==="list"){ renderList(); listContainer.classList.remove("hidden"); }
if(mode==="summary"){ renderSummary(); summaryContainer.classList.remove("hidden"); }
}

function renderCards(){
cardContainer.innerHTML="";
inventory.forEach(p=>{
cardContainer.innerHTML+=`
<div class="product-card">
<h3>${p.name}</h3>
<p>₹${p.price}</p>
<p>Stock: ${p.quantity}</p>
</div>`;
});
}

function renderList(){
listContainer.innerHTML="";
inventory.forEach(p=>{
listContainer.innerHTML+=`
<div class="compact-item">
${p.name} | ₹${p.price} | ${p.quantity}
</div>`;
});
}

function renderSummary(){
let total=inventory.reduce((sum,p)=>sum+p.price*p.quantity,0);
summaryContainer.innerHTML=`<div class="summary-box">Total Inventory Value: ₹${total}</div>`;
}

// ================= MASTER =================

function renderAll(){
renderTable();
updateChart();
}

window.onload = () => {
const token = localStorage.getItem("token");
if(token){
document.getElementById("loginPage").classList.add("hidden");
document.getElementById("app").classList.remove("hidden");
loadProducts();
}
};