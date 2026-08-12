// ==========================================
// QR RESTAURANT SAAS
// PREMIUM OWNER DASHBOARD
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
        // CHECK AUTHENTICATION
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
        // GET SESSION SECTIONS
        // ==================================

        const client =
            session.client || {};

        const restaurant =
            session.restaurant || {};

        const plan =
            session.plan || {};


        // ==================================
        // OWNER NAME
        // ==================================

        const ownerName =
            client.ownerName ||
            "Owner";


        // ==================================
        // OWNER EMAIL
        // ==================================

        const ownerEmail =
            client.email ||
            "";


        // ==================================
        // USER ID
        // ==================================

        const userId =
            session.userId ||
            "-";


        // ==================================
        // CLIENT ID
        // ==================================

        const clientId =
            session.clientId ||
            "-";


        // ==================================
        // RESTAURANT ID
        // ==================================

        const restaurantId =
            session.restaurantId ||
            "-";


        // ==================================
        // ROLE
        // ==================================

        const role =
            session.role ||
            "Owner";


        // ==================================
        // RESTAURANT STATUS
        // ==================================

        const restaurantStatus =
            restaurant.status ||
            "Active";


        // ==================================
        // UPDATE TOP USER NAME
        // ==================================

        const userName =
            document.getElementById(
                "userName"
            );


        if (userName) {

            userName.textContent =
                ownerName;

        }


        // ==================================
        // UPDATE TOP USER ROLE
        // ==================================

        const userRole =
            document.getElementById(
                "userRole"
            );


        if (userRole) {

            userRole.textContent =
                role;

        }


        // ==================================
        // UPDATE WELCOME MESSAGE
        // ==================================

        const welcomeMessage =
            document.getElementById(
                "welcomeMessage"
            );


        if (welcomeMessage) {

            welcomeMessage.textContent =
                `Welcome back, ${ownerName}!`;

        }


        // ==================================
        // UPDATE RESTAURANT ID
        // ==================================

        const restaurantIdElement =
            document.getElementById(
                "restaurantId"
            );


        if (restaurantIdElement) {

            restaurantIdElement.textContent =
                restaurantId;

        }


        // ==================================
        // UPDATE CLIENT ID
        // ==================================

        const clientIdElement =
            document.getElementById(
                "clientId"
            );


        if (clientIdElement) {

            clientIdElement.textContent =
                clientId;

        }


        // ==================================
        // UPDATE ROLE CARD
        // ==================================

        const roleElement =
            document.getElementById(
                "role"
            );


        if (roleElement) {

            roleElement.textContent =
                role;

        }


        // ==================================
        // UPDATE USER ID
        // ==================================

        const userIdElement =
            document.getElementById(
                "userId"
            );


        if (userIdElement) {

            userIdElement.textContent =
                userId;

        }


        // ==================================
        // UPDATE EMAIL
        // ==================================

        const emailElement =
            document.getElementById(
                "email"
            );


        if (emailElement) {

            emailElement.textContent =
                ownerEmail;

        }


        // ==================================
        // UPDATE TENANT RESTAURANT ID
        // ==================================

        const tenantRestaurantIdElement =
            document.getElementById(
                "tenantRestaurantId"
            );


        if (tenantRestaurantIdElement) {

            tenantRestaurantIdElement.textContent =
                restaurantId;

        }


        // ==================================
        // UPDATE AVATAR
        // ==================================

        const avatar =
            document.querySelector(
                ".user-avatar"
            );


        if (avatar) {

            avatar.textContent =
                ownerName
                    .charAt(0)
                    .toUpperCase();

        }


        // ==================================
        // UPDATE RESTAURANT STATUS
        // ==================================

        const restaurantStatusElement =
            document.getElementById(
                "restaurantStatus"
            );


        if (restaurantStatusElement) {

            restaurantStatusElement.textContent =
                restaurantStatus;

        }


        // ==================================
        // PLAN NAME
        // ==================================

        const planNameElement =
            document.getElementById(
                "planName"
            );


        if (planNameElement) {

            planNameElement.textContent =
                plan.planName ||
                "Starter";

        }


        // ==================================
        // PLAN PRICE
        // ==================================

        const planPriceElement =
            document.getElementById(
                "planPrice"
            );


        if (planPriceElement) {

            planPriceElement.textContent =
                `${restaurant.currency || "AED"} ${plan.price ?? 0}`;

        }


        // ==================================
        // MAX ORDERS
        // ==================================

        const maxOrdersElement =
            document.getElementById(
                "maxOrders"
            );


        if (maxOrdersElement) {

            maxOrdersElement.textContent =
                plan.maxOrders ??
                "-";

        }


        // ==================================
        // MAX BRANCHES
        // ==================================

        const maxBranchesElement =
            document.getElementById(
                "maxBranches"
            );


        if (maxBranchesElement) {

            maxBranchesElement.textContent =
                plan.maxBranches ??
                "-";

        }


        // ==================================
        // LOGOUT
        // ==================================

        const logoutButton =
            document.getElementById(
                "logoutBtn"
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


        // ==================================
        // FINAL DEBUG
        // ==================================

        console.log(
            "DASHBOARD: UI populated successfully."
        );

        console.log(
            "Owner:",
            ownerName
        );

        console.log(
            "Email:",
            ownerEmail
        );

        console.log(
            "User ID:",
            userId
        );

        console.log(
            "Client ID:",
            clientId
        );

        console.log(
            "Restaurant ID:",
            restaurantId
        );

        console.log(
            "Role:",
            role
        );

        console.log(
            "Plan:",
            plan.planName
        );

    }
);