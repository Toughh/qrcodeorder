let lastOrderCount = 0;

async function loadOrders(){

try{

const res = await fetch("https://aviemail.app.n8n.cloud/webhook/get-orders?ts=" + Date.now());

const data = await res.json();

const container = document.getElementById("orders");

container.innerHTML="";

if(!data || data.length===0){
container.innerHTML="<p>No Live Orders</p>";
return;
}

/* 🔔 New Order Detection */

if(data.length > lastOrderCount){

document.getElementById("newOrderSound").play();

}

lastOrderCount = data.length;

/* Render Orders */

data.forEach(order=>{

container.innerHTML += `
<div class="order">

<b>Status:</b> ${order.status}<br>
<b>Items:</b><br>
<pre>${order.items}</pre>
<b>CustomizedRequest:</b> ${order.customizationRequest}<br>
<b>Table:</b> ${order.table}<br>
<b>Mobile:</b> ${order.mobile}<br>

<button onclick="updateOrder('${order.recordId}','Accepted')">Accept</button>

<button onclick="updateOrder('${order.recordId}','Ready')">Ready</button>

<button onclick="updateOrder('${order.recordId}','Completed')">Done</button>

</div>
`;

});

}catch(err){

console.error(err);

document.getElementById("orders").innerHTML =
"<p>⚠️ Error Loading Orders</p>";

}

}

loadOrders();

setInterval(loadOrders,5000);


async function updateOrder(recordId,status){

try{

await fetch("https://aviemail.app.n8n.cloud/webhook/update-order",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
recordId:recordId,
status:status
})

});

loadOrders();

}catch(err){

console.error(err);

alert("Failed to update order");

}

}