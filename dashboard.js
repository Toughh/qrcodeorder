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
        // UPDATE RESTAURANT ID CARD
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
        // UPDATE CLIENT ID CARD
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


        // ==========================================
        // LOAD BUSINESS DASHBOARD DATA
        // ==========================================

        const dashboardData =
            await loadDashboardData();


        console.log(
            "DASHBOARD BUSINESS DATA:",
            dashboardData
        );


        // ==========================================
        // IMPORTANT:
        // DO NOT MODIFY METRICS HERE.
        //
        // Metrics are already returned by n8n.
        // We only use dashboardData to ensure
        // authentication details are displayed.
        // ==========================================


        if (dashboardData) {

            console.log(
                "DASHBOARD: API data received."
            );


            // ==================================
            // USER ID
            // ==================================

            const verifiedUserId =
                dashboardData.userId ||
                userId;


            const verifiedUserIdElement =
                document.getElementById(
                    "userId"
                );


            if (verifiedUserIdElement) {

                verifiedUserIdElement.textContent =
                    verifiedUserId;

            }


            // ==================================
            // EMAIL
            // ==================================

            const verifiedEmail =
                dashboardData.client &&
                dashboardData.client.email
                    ? dashboardData.client.email
                    : ownerEmail;


            const verifiedEmailElement =
                document.getElementById(
                    "email"
                );


            if (verifiedEmailElement) {

                verifiedEmailElement.textContent =
                    verifiedEmail;

            }


            // ==================================
            // RESTAURANT ID
            // ==================================

            const verifiedRestaurantId =
                dashboardData.restaurantId ||
                restaurantId;


            const verifiedRestaurantIdElement =
                document.getElementById(
                    "tenantRestaurantId"
                );


            if (verifiedRestaurantIdElement) {

                verifiedRestaurantIdElement.textContent =
                    verifiedRestaurantId;

            }


            // ==================================
            // OWNER NAME
            // ==================================

            const apiOwnerName =
                dashboardData.client &&
                dashboardData.client.ownerName
                    ? dashboardData.client.ownerName
                    : ownerName;


            const dashboardUserName =
                document.getElementById(
                    "userName"
                );


            if (dashboardUserName) {

                dashboardUserName.textContent =
                    apiOwnerName;

            }


            const dashboardWelcome =
                document.getElementById(
                    "welcomeMessage"
                );


            if (dashboardWelcome) {

                dashboardWelcome.textContent =
                    `Welcome back, ${apiOwnerName}!`;

            }


            const dashboardAvatar =
                document.querySelector(
                    ".user-avatar"
                );


            if (dashboardAvatar) {

                dashboardAvatar.textContent =
                    apiOwnerName
                        .charAt(0)
                        .toUpperCase();

            }

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
        // CALL n8n OWNER DASHBOARD WEBHOOK
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
        // NORMALIZE n8n RESPONSE
        // ==================================

        const result =
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
                "=================================="
            );

            console.log(
                "DASHBOARD: Business data loaded successfully."
            );

            console.log(
                "=================================="
            );


            // IMPORTANT:
            // Return the COMPLETE data object.
            //
            // This includes:
            // client
            // restaurant
            // plan
            // metrics
            // userId
            // clientId
            // restaurantId
            // role

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