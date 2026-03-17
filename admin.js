let lastOrderCount = 0;

/* Convert Airtable Date (6-Mar-2026, 8:06:52 AM) → JS Date */

function parseAirtableDate(str) {

    const months = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };

    const parts = str.split(",");
    const datePart = parts[0].trim();
    const timePart = parts[1].trim();

    const [day, mon, year] = datePart.split("-");
    const month = months[mon];

    return new Date(`${year}-${month + 1}-${day} ${timePart}`);

}


async function loadOrders() {

    try {

        const res = await fetch("https://aviemail.app.n8n.cloud/webhook/get-orders?token="
            + window.adminToken +
            "&ts=" + Date.now());

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

            newOrderIds = data.map((o) => o.orderId);

        }

        lastOrderCount = data.length;

        /* Render Orders */

        data.forEach((order) => {

            let highlight = newOrderIds.includes(order.orderId) ? "newOrder" : "";

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
		<b>Whatsapp:</b> ${order.whatsapp}<br>

        <b>Waiting:</b> ${getWaitingTime(order.orderTime)}<br><br>

        <button onclick="updateOrder('${order.orderId}','Preparing')">Accept</button>
        <button onclick="updateOrder('${order.orderId}','Rejected')">Reject</button>
        <button onclick="updateOrder('${order.orderId}','Ready')">Ready</button>
        <button onclick="updateOrder('${order.orderId}','Completed')">Done</button>

        </div>
    `;

            if (order.status === "Pending") {
                pending.innerHTML += card;
            } else if (order.status === "Accepted" || order.status === "Preparing") {
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

setInterval(loadOrders, 8000);


async function updateOrder(orderId, status) {

    try {

        await fetch("https://aviemail.app.n8n.cloud/webhook/update-order?token=" +
            window.adminToken,
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                },

                body: JSON.stringify({
                    orderId: orderId,
                    status: status,
                }),

            });

        loadOrders();

    } catch (err) {

        console.error(err);

        alert("Failed to update order");

    }

}


/* Waiting Time */

function getWaitingTime(orderTime) {

    const now = new Date();

    const orderDate = parseAirtableDate(orderTime);

    const diff = Math.floor((now - orderDate) / 1000);

    const minutes = Math.floor(diff / 60);

    const seconds = diff % 60;

    return minutes + "m " + seconds + "s";

}