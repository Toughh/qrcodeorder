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
        // AUTHENTICATION
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
        // USER
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


        const userEmail =
            document.getElementById(
                "userEmail"
            );


        if (userEmail) {

            userEmail.textContent =
                session.email ||
                "";

        }


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
        // RESTAURANT
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
        // RESTAURANT SETTINGS
        // ==================================

        const restaurant =
            session.restaurant ||
            {};


        console.log(
            "DASHBOARD RESTAURANT:",
            restaurant
        );


        // ==================================
        // PLAN
        // ==================================

        const plan =
            session.plan ||
            {};


        console.log(
            "DASHBOARD PLAN:",
            plan
        );


        // ==================================
        // PLAN NAME
        // ==================================

        const planName =
            document.getElementById(
                "planName"
            );


        if (planName) {

            planName.textContent =
                plan.planName ||
                "Starter";

        }


        // ==================================
        // MAX BRANCHES
        // ==================================

        const maxBranches =
            document.getElementById(
                "maxBranches"
            );


        if (maxBranches) {

            maxBranches.textContent =
                plan.maxBranches ??
                "-";

        }


        // ==================================
        // MAX ORDERS
        // ==================================

        const maxOrders =
            document.getElementById(
                "maxOrders"
            );


        if (maxOrders) {

            maxOrders.textContent =
                plan.maxOrders ??
                "-";

        }


        // ==================================
        // CURRENCY
        // ==================================

        const currency =
            document.getElementById(
                "currency"
            );


        if (currency) {

            currency.textContent =
                restaurant.currency ||
                "AED";

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