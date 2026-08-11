// ==========================================
// QR RESTAURANT SAAS
// OWNER DASHBOARD
// ==========================================


document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "DASHBOARD: Page loaded."
        );


        // ==================================
        // AUTHENTICATION CHECK
        // ==================================

        const session =
            await requireAuthentication();


        // ==================================
        // STOP IF NOT AUTHENTICATED
        // ==================================

        if (!session) {

            console.warn(
                "DASHBOARD: No valid session."
            );

            return;

        }


        console.log(
            "DASHBOARD: Valid session:",
            session
        );


        // ==================================
        // USER NAME
        // ==================================

        const userName =
            document.getElementById(
                "userName"
            );


        if (userName) {

            userName.textContent =
                session.name ||
                "Owner";

        }


        // ==================================
        // USER EMAIL
        // ==================================

        const userEmail =
            document.getElementById(
                "userEmail"
            );


        if (userEmail) {

            userEmail.textContent =
                session.email ||
                "";

        }


        // ==================================
        // RESTAURANT ID
        // ==================================

        const restaurantId =
            document.getElementById(
                "restaurantId"
            );


        if (restaurantId) {

            restaurantId.textContent =
                session.restaurantId ||
                "-";

        }


        // ==================================
        // CLIENT ID
        // ==================================

        const clientId =
            document.getElementById(
                "clientId"
            );


        if (clientId) {

            clientId.textContent =
                session.clientId ||
                "-";

        }


        // ==================================
        // ROLE
        // ==================================

        const userRole =
            document.getElementById(
                "userRole"
            );


        if (userRole) {

            userRole.textContent =
                session.role ||
                "Owner";

        }


        // ==================================
        // LOGOUT
        // ==================================

        const logoutButton =
            document.getElementById(
                "logoutButton"
            );


        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                function () {

                    console.log(
                        "DASHBOARD: Logging out..."
                    );


                    clearSession();


                    window.location.href =
                        "login.html";

                }
            );

        }

    }
);
