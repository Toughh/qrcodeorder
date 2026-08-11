// ==========================================
// QR ORDER SAAS
// OWNER DASHBOARD
// ==========================================


document.addEventListener(
    "DOMContentLoaded",
    async function () {


        // ==================================
        // AUTHENTICATE USER
        // ==================================

        const session =
            await requireAuthentication();


        // If authentication failed,
        // requireAuthentication() redirects
        // to login.html.

        if (!session) {

            return;

        }


        console.log(
            "Authenticated session:",
            session
        );


        // ==================================
        // DISPLAY USER
        // ==================================

        const userName =
            document.getElementById(
                "userName"
            );

        const userRole =
            document.getElementById(
                "userRole"
            );

        const welcomeMessage =
            document.getElementById(
                "welcomeMessage"
            );

        const userId =
            document.getElementById(
                "userId"
            );

        const email =
            document.getElementById(
                "email"
            );

        const restaurantId =
            document.getElementById(
                "restaurantId"
            );

        const tenantRestaurantId =
            document.getElementById(
                "tenantRestaurantId"
            );

        const clientId =
            document.getElementById(
                "clientId"
            );

        const role =
            document.getElementById(
                "role"
            );


        // ==================================
        // POPULATE UI
        // ==================================

        if (userName) {

            userName.textContent =
                session.name || "User";

        }


        if (userRole) {

            userRole.textContent =
                session.role || "User";

        }


        if (welcomeMessage) {

            welcomeMessage.textContent =
                `Welcome back, ${session.name || "User"}!`;

        }


        if (userId) {

            userId.textContent =
                session.userId || "—";

        }


        if (email) {

            email.textContent =
                session.email || "—";

        }


        if (restaurantId) {

            restaurantId.textContent =
                session.restaurantId || "—";

        }


        if (tenantRestaurantId) {

            tenantRestaurantId.textContent =
                session.restaurantId || "—";

        }


        if (clientId) {

            clientId.textContent =
                session.clientId || "—";

        }


        if (role) {

            role.textContent =
                session.role || "—";

        }


        // ==================================
        // LOGOUT
        // ==================================

        const logoutBtn =
            document.getElementById(
                "logoutBtn"
            );


        if (logoutBtn) {

            logoutBtn.addEventListener(
                "click",
                function () {

                    clearSession();

                    window.location.href =
                        "login.html";

                }
            );

        }

    }
);