let lastOrderCount = 0;

/* Convert Airtable Date → JS Date */
function parseAirtableDate(str) {
    if (!str || !str.includes(",")) return new Date();

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

        const res = await fetch(
            "https://avipitaji.app.n8n.cloud/webhook/get-orders?token=" +
            window.adminToken +
            "&ts=" + Date.now()
        );

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
            document.getElementById("newOrderSound")?.play();
            newOrderIds = data.map(o => o.OrderId);
        }

        lastOrderCount = data.length;

        /* Render Orders */
        data.forEach(order => {

            const mapped = {
                orderId: order.OrderId,
                status: order.Status,
                items: order.OrderedItems || "No items",
                table: order.TableNumber || order.BranchOutlet || "-",
                mobile: order.MobileNumber,
                whatsapp: order.WhatsappNumber,
                customizationRequest: order.CustomizedRequest || "-",
                total: order.Total
            };

            let statusClass = "pending";
            if (mapped.status === "Accepted" || mapped.status === "Preparing") statusClass = "accepted";
            if (mapped.status === "Ready") statusClass = "ready";

            let card = `
        <div class="order ${statusClass}">

            <h3>${mapped.table}</h3>

            <b>Status:</b> ${mapped.status}<br><br>

            <b>Items:</b>
            <pre>${mapped.items}</pre>

            <b>Customer:</b> ${order.CustomerName || "-"}<br>

            <b>Mobile:</b> ${mapped.mobile}<br>
            <b>Whatsapp:</b> ${mapped.whatsapp}<br>

            <b>Total:</b> ${mapped.total}<br><br>

            <button onclick="updateOrder('${mapped.orderId}','Preparing')">Accept</button>
            <button onclick="updateOrder('${mapped.orderId}','Rejected')">Reject</button>
            <button onclick="updateOrder('${mapped.orderId}','Ready')">Ready</button>
            <button onclick="updateOrder('${mapped.orderId}','Completed')">Done</button>

        </div>
    `;

            if (mapped.status === "Pending") {
                pending.innerHTML += card;
            } else if (mapped.status === "Accepted" || mapped.status === "Preparing") {
                accepted.innerHTML += card;
            } else if (mapped.status === "Ready") {
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
        await fetch(
            "https://avipitaji.app.n8n.cloud/webhook/update-order?token=" +
            window.adminToken,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ orderId, status }),
            }
        );

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

    return `${minutes}m ${seconds}s`;
}