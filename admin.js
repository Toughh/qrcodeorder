// Load Orders from n8n (which fetches from Airtable securely)

async function loadOrders() {

try {

const res = await fetch("https://aviemail.app.n8n.cloud/webhook-test/get-orders");

const data = await res.json();

const container = document.getElementById("orders");
container.innerHTML = "";

if(!data || data.length === 0){
container.innerHTML = "<p>No live orders</p>";
return;
}

data.forEach(order => {

container.innerHTML += `
<div class="order">

<b>Order:</b> ${order.OrderID}<br>
<b>Customer:</b> ${order.CustomerName}<br>
<b>Items:</b> ${order.Items}<br>
<b>Status:</b> ${order.Status}<br><br>

<button onclick="updateOrder('${order.recordId}','Accepted')">
Accept
</button>

<button onclick="updateOrder('${order.recordId}','Ready')">
Ready
</button>

<button onclick="updateOrder('${order.recordId}','Cancelled')">
Cancel
</button>

</div>
`;

});

} catch(err){

console.error("Error loading orders:", err);

document.getElementById("orders").innerHTML =
"<p>⚠️ Error loading orders</p>";

}

}


// Refresh orders every 5 seconds
loadOrders();
setInterval(loadOrders,5000);


// Update Order Status

async function updateOrder(recordId,status){

try{

await fetch("https://aviemail.app.n8n.cloud/webhook-test/update-orders",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
recordId:recordId,
status:status
})

});

alert("Order updated");

loadOrders();

}catch(err){

console.error("Update failed",err);

alert("Failed to update order");

}

}