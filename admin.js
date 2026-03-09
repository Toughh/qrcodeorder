let lastOrderCount = 0;

async function loadOrders() {
    try {
        const res = await fetch("https://aviemail.app.n8n.cloud/webhook/get-orders?ts=" + Date.now());

        const data = await res.json();

        const pending = document.getElementById("pending");
        const accepted = document.getElementById("accepted");
        const ready = document.getElementById("ready");

        pending.innerHTML = "";
        accepted.innerHTML = "";
        ready.innerHTML = "";

        if (!data || data.length === 0) {
            pending.innerHTML = "<p>No Live Orders</p>";
            return;
        }

        /* 🔔 New Order Detection */

        let newOrderIds = [];

        if (data.length > lastOrderCount) {
            document.getElementById("newOrderSound").play();

            newOrderIds = data.map((o) => o.recordId);
        }

        lastOrderCount = data.length;

        /* Render Orders */

        data.forEach((order) => {
            let highlight = newOrderIds.includes(order.recordId) ? "newOrder" : "";

            let statusClass = "pending";

            if (order.status === "Accepted") statusClass = "accepted";
            if (order.status === "Ready") statusClass = "ready";

            let card = `
				<div class="order ${statusClass} ${highlight}">

				<h3>Table ${order.table}</h3>

				<b>Status:</b> ${order.status}<br><br>

				<b>Items:</b>
				<pre>${order.items}</pre>

				<b>Customized Request:</b> ${order.customizationRequest || "-"}<br>

				<b>Mobile:</b> ${order.mobile}<br>

				<b>Waiting:</b> ${getWaitingTime(order.orderTime)}<br><br>

				<button onclick="updateOrder('${order.recordId}','Accepted')">Accept</button>

				<button onclick="updateOrder('${order.recordId}','Ready')">Ready</button>

				<button onclick="updateOrder('${order.recordId}','Completed')">Done</button>

				</div>
			`;

            if (order.status === "Pending") {
                pending.innerHTML += card;
            } else if (order.status === "Accepted") {
                accepted.innerHTML += card;
            } else if (order.status === "Ready") {
                ready.innerHTML += card;
            }
        });
    } catch (err) {
        console.error(err);

        document.getElementById("pending").innerHTML = "<p>⚠️ Error Loading Orders</p>";
    }
}

loadOrders();

setInterval(loadOrders, 5000);

async function updateOrder(recordId, status) {
    try {
        await fetch("https://aviemail.app.n8n.cloud/webhook/update-order", {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
            },

            body: JSON.stringify({
                recordId: recordId,
                status: status,
            }),
        });

        loadOrders();
    } catch (err) {
        console.error(err);

        alert("Failed to update order");
    }
}

function getWaitingTime(orderTime) {
    const now = new Date();
    const orderDate = new Date(orderTime);

    const diff = Math.floor((now - orderDate) / 1000);

    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;

    return minutes + "m " + seconds + "s";
}
