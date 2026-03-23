/* INITIAL LOAD */
window.onload = async function () {
    try {
        await loadRestaurantConfig();
        await fetchMenuFromAPI();
        restoreTimer();
    } catch (err) {
        console.error("Initialization failed:", err);
        alert("Something went wrong loading the menu.");
    }
};