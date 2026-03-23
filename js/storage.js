/* RESTORE CUSTOMER DETAILS */
document.getElementById("customerName").value = localStorage.getItem("customerName") || "";
document.getElementById("mobile").value = localStorage.getItem("mobile") || "";
document.getElementById("whatsapp").value = localStorage.getItem("whatsapp") || "";
document.getElementById("address").value = localStorage.getItem("address") || "";

/* SAVE INPUTS LIVE */
["customerName", "mobile", "whatsapp", "address"].forEach(id => {
    document.getElementById(id).addEventListener("input", function () {
        localStorage.setItem(id, this.value);
    });
});

/* STORAGE SYNC (MULTI BROWSER TAB SUPPORT) */
window.addEventListener("storage", function () {
    cart = JSON.parse(localStorage.getItem("cart")) || {};
    document.getElementById("customerName").value = localStorage.getItem("customerName") || "";
    document.getElementById("mobile").value = localStorage.getItem("mobile") || "";
    document.getElementById("whatsapp").value = localStorage.getItem("whatsapp") || "";
    document.getElementById("address").value = localStorage.getItem("address") || "";
    loadMenu(menuData[currentCategory]);
    restoreTimer();
});