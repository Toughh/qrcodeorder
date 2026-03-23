/* DIALOG */
function showDialog(msg) {
    document.getElementById("dialogMsg").innerText = msg;
    document.getElementById("dialog").style.display = "flex";
}
function closeDialog() {
    document.getElementById("dialog").style.display = "none";
}

/* DATE & TIME */
function updateDateTime() {
    const now = new Date();
    document.getElementById("datetime").innerText = now.toLocaleString();
}
setInterval(updateDateTime, 1000);
updateDateTime();

/* Clear error styling when user types */

["mobile", "whatsapp"].forEach(id => {

    const field = document.getElementById(id);

    field.addEventListener("input", () => {

        document.getElementById("mobileLabel")?.classList.remove("label-error");
        document.getElementById("whatsappLabel")?.classList.remove("label-error");

        field.parentElement.classList.remove("input-error");

    });

});