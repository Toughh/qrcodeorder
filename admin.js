async function loadOrders(){

try{

const res = await fetch("https://aviemail.app.n8n.cloud/webhook/get-orders");

const data = await res.json();

const container = document.getElementById("orders");

container.innerHTML = "";

if(!data || data.length === 0){
container.innerHTML = "<p>No Live Orders</p>";
return;
}

data.forEach(order=>{

container.innerHTML += `
<div class="order">

<b>Mobile:</b> ${order.mobile}<br>
<b>Table:</b> ${order.table}<br>
<b>Branch:</b> ${order.branch}<br>
<b>Items:</b><br>
<pre>${order.items}</pre>

<b>Total:</b> AED ${order.total}<br>
<b>Status:</b> ${order.status}<br>

<b>Address:</b> ${order.address || "-"}<br>
<b>Custom Request:</b> ${order.custom || "-"}<br>

<button onclick="updateOrder('${order.recordId}','Accepted')">Accept</button>

<button onclick="updateOrder('${order.recordId}','Ready')">Ready</button>

<button onclick="updateOrder('${order.recordId}','Cancelled')">Cancel</button>

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