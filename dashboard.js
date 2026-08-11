// ==========================================
// QR RESTAURANT SAAS
// OWNER DASHBOARD
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "=================================="
        );

        console.log(
            "DASHBOARD: Page loaded"
        );

        console.log(
            "=================================="
        );


        // ==================================
        // CHECK CURRENT SESSION
        // ==================================

        console.log(
            "DASHBOARD: Checking authentication..."
        );


        const session =
            await requireAuthentication();


        // ==================================
        // AUTHENTICATION FAILED
        // ==================================

        if (!session) {

            console.warn(
                "DASHBOARD: Authentication failed."
            );

            return;

        }


        // ==================================
        // AUTHENTICATION SUCCESSFUL
        // ==================================

        console.log(
            "DASHBOARD: Authentication successful."
        );


        console.log(
            "DASHBOARD SESSION:",
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
                        "DASHBOARD: Logging out."
                    );


                    clearSession();


                    window.location.href =
                        "login.html";

                }
            );

        }

    }
);
