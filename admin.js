const data = await res.json();

const container = document.getElementById("orders");
container.innerHTML="";

data.records.forEach(order=>{

const o = order.fields;

container.innerHTML += `
<div class="order">

<b>Order:</b> ${o.OrderID}<br>
<b>Customer:</b> ${o.CustomerName}<br>
<b>Items:</b> ${o.Items}<br>
<b>Status:</b> ${o.Status}<br>

<button onclick="updateOrder('${order.id}','Accepted')">
Accept
</button>

<button onclick="updateOrder('${order.id}','Ready')">
Ready
</button>

<button onclick="updateOrder('${order.id}','Cancelled')">
Cancel
</button>

</div>
`;

});

}

loadOrders();
setInterval(loadOrders,5000);

async function updateOrder(recordId,status){

await fetch("https://aviemail.app.n8n.cloud/webhook-test/get-orders",{

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

}