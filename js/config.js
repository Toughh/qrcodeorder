async function loadRestaurantConfig() {
    const response = await fetch(
        `https://rimmyemail01.app.n8n.cloud/webhook/getRestaurantConfig?rid=${restaurantId}&bid=${finalBranchId}`
    );
    const config = await response.json();
    applySettings(config);
}

function applySettings(config) {

    const root = Array.isArray(config) ? config[0] : config;
    const settings = root?.settings || {};

    // 🔹 Use SAFE container hiding (no layout break)

    const nameContainer = document.getElementById("customerName")?.closest(".form-group");
    if (nameContainer)
        nameContainer.style.display = settings.requireName === false ? "none" : "block";

    const mobileContainer = document.getElementById("mobile")?.closest(".form-group");
    if (mobileContainer)
        mobileContainer.style.display = settings.requireMobile === false ? "none" : "block";

    const whatsappContainer = document.getElementById("whatsapp")?.closest(".form-group");
    if (whatsappContainer)
        whatsappContainer.style.display = settings.requireWhatsapp === false ? "none" : "block";

    const addressContainer = document.getElementById("address")?.closest(".form-group");
    if (addressContainer)
        addressContainer.style.display = settings.requireDelivery === false ? "none" : "block";

    const tableContainer = document.getElementById("tableNumberContainer");

    if (tableContainer) {

        // 🏆 QR parameter ALWAYS wins
        if (table) {
            tableContainer.style.display = "none";
        }
        else {
            // Otherwise follow restaurant settings
            tableContainer.style.display =
                settings.requireTable === false ? "none" : "block";
        }
    }

    // 🔹 Theme color (optional)
    if (settings.themeColor) {
        document.documentElement.style.setProperty("--primary-color", settings.themeColor);
    }

    // 🔹 Layout flag (optional)
    if (settings.layout) {
        document.body.setAttribute("data-layout", settings.layout);
    }

    console.log("Restaurant settings applied:", settings);
}

const params = new URLSearchParams(window.location.search);

const restaurantId = params.get("rid");
const branchId = params.get("bid");

// Validate
if (!restaurantId) {
    alert("Restaurant ID missing in URL");
    throw new Error("Missing rid parameter");
}

// If bid not provided, you can set default branch
const finalBranchId = branchId;

const urlParams = new URLSearchParams(window.location.search);
const table = urlParams.get("table");

if (table) {
    document.getElementById("tableNumber").value = table;
    document.getElementById("tableNumberContainer").style.display = "none";
}