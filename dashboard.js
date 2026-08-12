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
        // CLIENT DATA
        // ==================================

        const client =
            session.client ||
            {};


        // ==================================
        // RESTAURANT DATA
        // ==================================

        const restaurant =
            session.restaurant ||
            {};


        // ==================================
        // PLAN DATA
        // ==================================

        const plan =
            session.plan ||
            {};


        // ==================================
        // OWNER NAME
        // ==================================

        const userName =
            document.getElementById(
                "userName"
            );


        if (userName) {

            userName.textContent =
                client.ownerName ||
                "Owner";

        }


        // ==================================
        // OWNER EMAIL
        // ==================================

        const userEmail =
            document.getElementById(
                "userEmail"
            );


        if (userEmail) {

            userEmail.textContent =
                client.email ||
                "";

        }


        // ==================================
        // MOBILE
        // ==================================

        const userMobile =
            document.getElementById(
                "userMobile"
            );


        if (userMobile) {

            userMobile.textContent =
                client.mobile ||
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
        // RESTAURANT STATUS
        // ==================================

        const restaurantStatus =
            document.getElementById(
                "restaurantStatus"
            );


        if (restaurantStatus) {

            restaurantStatus.textContent =
                restaurant.status ||
                "Active";

        }


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
        // PLAN PRICE
        // ==================================

        const planPrice =
            document.getElementById(
                "planPrice"
            );


        if (planPrice) {

            planPrice.textContent =
                `${restaurant.currency || "AED"} ${plan.price ?? 0}`;

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
        // VAT
        // ==================================

        const vat =
            document.getElementById(
                "vat"
            );


        if (vat) {

            vat.textContent =
                `${restaurant.vat ?? 0}%`;

        }


        // ==================================
        // TIMEZONE
        // ==================================

        const timezone =
            document.getElementById(
                "timezone"
            );


        if (timezone) {

            timezone.textContent =
                restaurant.timezone ||
                "Asia/Dubai";

        }


        // ==================================
        // FEATURES
        // ==================================

        const pickupEnabled =
            document.getElementById(
                "pickupEnabled"
            );


        if (pickupEnabled) {

            pickupEnabled.textContent =
                restaurant.pickupEnabled
                    ? "Enabled"
                    : "Disabled";

        }


        const deliveryEnabled =
            document.getElementById(
                "deliveryEnabled"
            );


        if (deliveryEnabled) {

            deliveryEnabled.textContent =
                restaurant.deliveryEnabled
                    ? "Enabled"
                    : "Disabled";

        }


        const kitchenEnabled =
            document.getElementById(
                "kitchenEnabled"
            );


        if (kitchenEnabled) {

            kitchenEnabled.textContent =
                restaurant.kitchenEnabled
                    ? "Enabled"
                    : "Disabled";

        }


        const whatsappEnabled =
            document.getElementById(
                "whatsappEnabled"
            );


        if (whatsappEnabled) {

            whatsappEnabled.textContent =
                restaurant.whatsappEnabled
                    ? "Enabled"
                    : "Disabled";

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