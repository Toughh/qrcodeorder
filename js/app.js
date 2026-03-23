/* INITIAL LOAD */
window.onload = async function () {
    try {
        await Promise.all([
            loadRestaurantConfig(),
            fetchMenuFromAPI()
        ]);
        document.getElementById("loadingBox").style.display = "none";
        restoreTimer();
    } catch (err) {
        console.error("Initialization failed:", err);
        alert("Something went wrong loading the menu.");
    }
};