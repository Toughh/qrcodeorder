/* PLACE ORDER */
function placeOrder() {

    if (Object.keys(cart).length === 0) {
        showDialog("Please select at least one menu item.");
        return;
    }

    const name = document.getElementById("customerName").value.trim();
    const mobile = document.getElementById("mobile").value.trim();
    const whatsapp = document.getElementById("whatsapp").value.trim();
    const address = document.getElementById("address").value.trim();
    const tableNumber = document.getElementById("tableNumber").value;

    // ⭐ CONTACT VALIDATION
    if (!mobile && !whatsapp) {

        const mobileField = document.getElementById("mobile");
        const whatsappField = document.getElementById("whatsapp");

        const mobileLabel = document.getElementById("mobileLabel");
        const whatsappLabel = document.getElementById("whatsappLabel");

        mobileLabel?.classList.add("label-error");
        whatsappLabel?.classList.add("label-error");

        mobileField.parentElement.classList.add("input-error");
        whatsappField.parentElement.classList.add("input-error");

        mobileField.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        setTimeout(() => mobileField.focus(), 400);

        showDialog("Please enter either Mobile Number or WhatsApp Number.");

        return;
    }

    // ⭐ UAE detection logic (unchanged)
    const isUAE = (num) => {
        return num.startsWith("+971") || num.startsWith("971") || num.startsWith("05");
    };

    let contactNote = "";

    if (isUAE(mobile) && whatsapp && !isUAE(whatsapp)) {
        contactNote = "Customer has UAE mobile but international WhatsApp.";
    }
    else if (isUAE(mobile) && whatsapp && isUAE(whatsapp)) {
        contactNote = "Customer mobile & WhatsApp both UAE numbers.";
    }
    else if (!isUAE(mobile)) {
        contactNote = "International mobile number.";
    }

    const customMes = document.getElementById("customNote").value.trim();
    const subtotal = document.getElementById("subtotal").innerText;
    const vat = document.getElementById("vat").innerText;
    const total = document.getElementById("total").innerText;

    if (!navigator.geolocation) {
        showDialog("Location not supported. Please enable GPS.");
        return;
    }

    navigator.geolocation.getCurrentPosition(position => {

        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;

        let nearestBranch = null;
        let shortestDistance = Infinity;

        branches.forEach(branch => {
            const distance = getDistance(userLat, userLon, branch.lat, branch.lon);
            if (distance < shortestDistance) {
                shortestDistance = distance;
                nearestBranch = branch;
            }
        });

        // ===== SEND TO n8n =====
        fetch("https://rimmyemail01.app.n8n.cloud/webhook/restaurant-qrcode-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                mobile,
                whatsapp,
                address,
                contactNote,
                customMes,
                subtotal,
                vat,
                total,
                cart,
                branch: nearestBranch.name,
                latitude: userLat,
                longitude: userLon,
                tableNumber,
                orderTime,
                orderId,
                restaurantId
            })
        });

        const endTime = Date.now() + 120000;
        localStorage.setItem("orderEndTime", endTime);

        showDialog(
            `Order Placed Successfully!!!

Branch: ${nearestBranch.name}
Subtotal: ${subtotal} AED
VAT: ${vat} AED
Total: ${total} AED

Expected time: 20 mins`
        );

        startTimer();
        resetOrder();

    }, () => {
        showDialog("Please allow location access to place order.");
    });
}


// ===== DISTANCE FUNCTION =====
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/* TIMER */
function startTimer() {

    const btn = document.getElementById("placeBtn");
    const info = document.getElementById("infoText");

    let endTime = localStorage.getItem("orderEndTime");

    if (!endTime) return;

    endTime = parseInt(endTime);

    btn.disabled = true;

    clearInterval(timerInterval);

    timerInterval = setInterval(() => {

        const remaining = Math.floor((endTime - Date.now()) / 1000);

        if (remaining <= 0) {

            clearInterval(timerInterval);

            btn.disabled = false;
            btn.innerText = "Place Order";

            if (info) info.innerText = "";

            localStorage.removeItem("orderEndTime");

            return;
        }

        // ⭐ BUTTON COUNTDOWN
        btn.innerText = "Place Order (" + remaining + "s)";

        // ⭐ STATUS MESSAGE
        if (info) {
            info.innerText =
                "⏳ Order placed. You can place a new order after " +
                remaining +
                " seconds.";
        }

    }, 1000);
}

function restoreTimer() {

    const endTime = localStorage.getItem("orderEndTime");

    if (!endTime) return;

    if (Date.now() < endTime) {
        startTimer();
    } else {
        localStorage.removeItem("orderEndTime");
    }
}

function resetOrder() {

    cart = {};

    localStorage.removeItem("cart");

    document.getElementById("subtotal").innerText = "0.00";
    document.getElementById("vat").innerText = "0.00";
    document.getElementById("total").innerText = "0.00";

    document.querySelectorAll(".qty").forEach(e => {
        e.innerText = "0";
    });

    document.getElementById("resetBtn").disabled = true;

    // 6️⃣ Force reload of current category (clean state)
    loadMenu(menuData[currentCategory]);
}

const now = new Date();

const orderTime =
    now.getDate() + "-" +
    now.toLocaleString("en-US", { month: "short" }) + "-" +
    now.getFullYear() + ", " +
    now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });

const orderId = "ORD-" + now;