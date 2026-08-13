// ==========================================
// QR RESTAURANT SAAS
// PREMIUM OWNER DASHBOARD
// ==========================================

// ==========================================
// n8n OWNER DASHBOARD WEBHOOK
// ==========================================

const N8N_DASHBOARD_WEBHOOK =
    "https://maatapita.app.n8n.cloud/webhook/owner-dashboard";


// ==========================================
// PAGE LOAD
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
        // INITIAL SESSION DATA
        // ==================================

        const sessionClient =
            session.client || {};

        const sessionRestaurant =
            session.restaurant || {};

        const sessionPlan =
            session.plan || {};


        // ==================================
        // INITIAL VALUES
        // ==================================

        let ownerName =
            sessionClient.ownerName ||
            "Owner";

        let ownerEmail =
            sessionClient.email ||
            "";

        let userId =
            session.userId ||
            "-";

        let clientId =
            session.clientId ||
            "-";

        let restaurantId =
            session.restaurantId ||
            "-";

        let role =
            session.role ||
            "Owner";


        // ==================================
        // LOAD BUSINESS DASHBOARD DATA
        // ==================================

        const dashboardData =
            await loadDashboardData();


        console.log(
            "=================================="
        );

        console.log(
            "DASHBOARD BUSINESS DATA:"
        );

        console.log(
            dashboardData
        );

        console.log(
            "=================================="
        );


        // ==================================
        // UPDATE FROM DASHBOARD API
        // ==================================

        if (dashboardData) {

            console.log(
                "DASHBOARD: Applying API dashboard data..."
            );


            // ----------------------------------
            // USER ID
            // ----------------------------------

            if (
                dashboardData.userId !== undefined &&
                dashboardData.userId !== null
            ) {

                userId =
                    dashboardData.userId;

            }


            // ----------------------------------
            // CLIENT ID
            // ----------------------------------

            if (
                dashboardData.clientId !== undefined &&
                dashboardData.clientId !== null
            ) {

                clientId =
                    dashboardData.clientId;

            }


            // ----------------------------------
            // RESTAURANT ID
            // ----------------------------------

            if (
                dashboardData.restaurantId !== undefined &&
                dashboardData.restaurantId !== null
            ) {

                restaurantId =
                    dashboardData.restaurantId;

            }


            // ----------------------------------
            // ROLE
            // ----------------------------------

            if (
                dashboardData.role !== undefined &&
                dashboardData.role !== null
            ) {

                role =
                    dashboardData.role;

            }


            // ----------------------------------
            // CLIENT
            // ----------------------------------

            const apiClient =
                dashboardData.client || {};


            // Owner Name
            if (
                apiClient.ownerName !== undefined &&
                apiClient.ownerName !== null &&
                apiClient.ownerName !== ""
            ) {

                ownerName =
                    apiClient.ownerName;

            }


            // Email
            if (
                apiClient.email !== undefined &&
                apiClient.email !== null &&
                apiClient.email !== ""
            ) {

                ownerEmail =
                    apiClient.email;

            }

        }


        // ==========================================
        // FINAL DEBUG
        // ==========================================

        console.log(
            "=================================="
        );

        console.log(
            "FINAL DASHBOARD VALUES"
        );

        console.log(
            "Owner Name:",
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
            "=================================="
        );


        // ==========================================
        // RESTAURANT / PLAN
        // ==========================================

        const restaurant =
            dashboardData?.restaurant ||
            sessionRestaurant ||
            {};

        const plan =
            dashboardData?.plan ||
            sessionPlan ||
            {};


        // ==========================================
        // OWNER NAME
        // ==========================================

        const userNameElement =
            document.getElementById(
                "userName"
            );

        if (userNameElement) {

            userNameElement.textContent =
                ownerName;

        }


        // ==========================================
        // OWNER ROLE
        // ==========================================

        const userRoleElement =
            document.getElementById(
                "userRole"
            );

        if (userRoleElement) {

            userRoleElement.textContent =
                role;

        }


        // ==========================================
        // WELCOME MESSAGE
        // ==========================================

        const welcomeMessage =
            document.getElementById(
                "welcomeMessage"
            );

        if (welcomeMessage) {

            welcomeMessage.textContent =
                `Welcome back, ${ownerName}!`;

        }


        // ==========================================
        // AVATAR
        // ==========================================

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


        // ==========================================
        // RESTAURANT ID CARD
        // ==========================================

        const restaurantIdElement =
            document.getElementById(
                "restaurantId"
            );

        if (restaurantIdElement) {

            restaurantIdElement.textContent =
                restaurantId;

        }


        // ==========================================
        // CLIENT ID CARD
        // ==========================================

        const clientIdElement =
            document.getElementById(
                "clientId"
            );

        if (clientIdElement) {

            clientIdElement.textContent =
                clientId;

        }


        // ==========================================
        // ROLE CARD
        // ==========================================

        const roleElement =
            document.getElementById(
                "role"
            );

        if (roleElement) {

            roleElement.textContent =
                role;

        }


        // ==========================================
        // AUTHENTICATION VERIFIED
        // ==========================================

        const verifiedUserIdElement =
            document.getElementById(
                "userId"
            );

        if (verifiedUserIdElement) {

            verifiedUserIdElement.textContent =
                userId;

        }


        // ==========================================
        // VERIFIED EMAIL
        // ==========================================

        const verifiedEmailElement =
            document.getElementById(
                "email"
            );

        if (verifiedEmailElement) {

            verifiedEmailElement.textContent =
                ownerEmail;

        }


        // ==========================================
        // VERIFIED RESTAURANT ID
        // ==========================================

        const verifiedRestaurantIdElement =
            document.getElementById(
                "tenantRestaurantId"
            );

        if (verifiedRestaurantIdElement) {

            verifiedRestaurantIdElement.textContent =
                restaurantId;

        }


        // ==========================================
        // RESTAURANT STATUS
        // ==========================================

        const restaurantStatusElement =
            document.getElementById(
                "restaurantStatus"
            );

        if (restaurantStatusElement) {

            restaurantStatusElement.textContent =
                restaurant.status ||
                "Active";

        }


        // ==========================================
        // PLAN NAME
        // ==========================================

        const planNameElement =
            document.getElementById(
                "planName"
            );

        if (planNameElement) {

            planNameElement.textContent =
                plan.planName ||
                "Starter";

        }


        // ==========================================
        // PLAN PRICE
        // ==========================================

        const planPriceElement =
            document.getElementById(
                "planPrice"
            );

        if (planPriceElement) {

            planPriceElement.textContent =
                `${restaurant.currency || "AED"} ${plan.price ?? 0}`;

        }


        // ==========================================
        // MAX ORDERS
        // ==========================================

        const maxOrdersElement =
            document.getElementById(
                "maxOrders"
            );

        if (maxOrdersElement) {

            maxOrdersElement.textContent =
                plan.maxOrders ??
                "-";

        }


        // ==========================================
        // MAX BRANCHES
        // ==========================================

        const maxBranchesElement =
            document.getElementById(
                "maxBranches"
            );

        if (maxBranchesElement) {

            maxBranchesElement.textContent =
                plan.maxBranches ??
                "-";

        }


        // ==========================================
        // LOGOUT
        // ==========================================

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


        // ==========================================
        // FINAL UI DEBUG
        // ==========================================

        console.log(
            "DASHBOARD: UI populated successfully."
        );

    }

);


// ==========================================
// LOAD DASHBOARD BUSINESS DATA
// ==========================================

async function loadDashboardData() {

    try {

        console.log(
            "=================================="
        );

        console.log(
            "DASHBOARD: Calling Owner Dashboard API..."
        );

        console.log(
            "=================================="
        );


        // ==================================
        // GET SESSION TOKEN
        // ==================================

        const sessionToken =
            getSessionToken();


        if (!sessionToken) {

            console.error(
                "DASHBOARD: No session token found."
            );

            return null;

        }


        console.log(
            "DASHBOARD: Session token found."
        );


        // ==================================
        // CALL n8n
        // ==================================

        const response =
            await fetch(
                N8N_DASHBOARD_WEBHOOK,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            sessionToken:
                                sessionToken

                        })

                }
            );


        // ==================================
        // HTTP STATUS
        // ==================================

        console.log(
            "DASHBOARD API HTTP STATUS:",
            response.status
        );


        // ==================================
        // READ RESPONSE
        // ==================================

        const rawResult =
            await response.json();


        console.log(
            "DASHBOARD API RAW RESPONSE:",
            rawResult
        );


        // ==================================
        // NORMALIZE RESPONSE
        // ==================================

        let result =
            Array.isArray(rawResult)
                ? rawResult[0]
                : rawResult;


        console.log(
            "DASHBOARD API NORMALIZED RESPONSE:",
            result
        );


        // ==================================
        // SUCCESS
        // ==================================

        if (
            response.ok &&
            result &&
            result.success === true
        ) {

            console.log(
                "DASHBOARD: API SUCCESS"
            );


            console.log(
                "DASHBOARD DATA OBJECT:",
                result.data
            );


            return result.data || {};

        }


        // ==================================
        // API ERROR
        // ==================================

        console.error(
            "DASHBOARD API ERROR:",
            result
        );


        return null;

    }


    catch (error) {

        console.error(
            "=================================="
        );

        console.error(
            "DASHBOARD API CONNECTION ERROR:",
            error
        );

        console.error(
            "=================================="
        );


        return null;

    }

}