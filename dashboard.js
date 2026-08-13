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
            "DASHBOARD AUTH SESSION:",
            session
        );


        // ==========================================
        // LOAD COMPLETE DASHBOARD DATA
        // ==========================================

        const dashboardData =
            await loadDashboardData();


        // ==========================================
        // DASHBOARD API FAILED
        // ==========================================

        if (!dashboardData) {

            console.error(
                "DASHBOARD: Unable to load dashboard data."
            );

            return;

        }


        console.log(
            "=================================="
        );

        console.log(
            "DASHBOARD DATA RECEIVED:"
        );

        console.log(
            dashboardData
        );

        console.log(
            "=================================="
        );


        // ==========================================
        // IMPORTANT
        //
        // The Owner Dashboard API is now the
        // authoritative source for dashboard data.
        //
        // Structure:
        //
        // dashboardData
        //   ├── sessionId
        //   ├── userId
        //   ├── clientId
        //   ├── restaurantId
        //   ├── role
        //   ├── client
        //   ├── restaurant
        //   ├── plan
        //   └── metrics
        // ==========================================


        // ==================================
        // GET CLIENT
        // ==================================

        const client =
            dashboardData.client || {};


        // ==================================
        // GET RESTAURANT
        // ==================================

        const restaurant =
            dashboardData.restaurant || {};


        // ==================================
        // GET PLAN
        // ==================================

        const plan =
            dashboardData.plan || {};


        // ==================================
        // GET METRICS
        // ==================================

        const metrics =
            dashboardData.metrics || {};


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
            dashboardData.userId ||
            "-";


        // ==================================
        // CLIENT ID
        // ==================================

        const clientId =
            dashboardData.clientId ||
            "-";


        // ==================================
        // RESTAURANT ID
        // ==================================

        const restaurantId =
            dashboardData.restaurantId ||
            "-";


        // ==================================
        // ROLE
        // ==================================

        const role =
            dashboardData.role ||
            "Owner";


        // ==================================
        // RESTAURANT STATUS
        // ==================================

        const restaurantStatus =
            restaurant.status ||
            "Active";


        // ==========================================
        // UPDATE TOP USER NAME
        // ==========================================

        const userName =
            document.getElementById(
                "userName"
            );


        if (userName) {

            userName.textContent =
                ownerName;

        }


        // ==========================================
        // UPDATE TOP USER ROLE
        // ==========================================

        const userRole =
            document.getElementById(
                "userRole"
            );


        if (userRole) {

            userRole.textContent =
                role;

        }


        // ==========================================
        // UPDATE WELCOME MESSAGE
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
        // UPDATE RESTAURANT ID
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
        // UPDATE CLIENT ID
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
        // UPDATE ROLE CARD
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
        // UPDATE USER ID
        // ==========================================

        const userIdElement =
            document.getElementById(
                "userId"
            );


        if (userIdElement) {

            userIdElement.textContent =
                userId;

        }


        // ==========================================
        // UPDATE EMAIL
        // ==========================================

        const emailElement =
            document.getElementById(
                "email"
            );


        if (emailElement) {

            emailElement.textContent =
                ownerEmail;

        }


        // ==========================================
        // UPDATE SECURE SESSION DETAILS
        // ==========================================

        // ==================================
        // USER ID
        // ==================================

        const secureUserIdElement =
            document.getElementById(
                "userId"
            );

        if (secureUserIdElement) {

            secureUserIdElement.textContent =
                dashboardData.userId ||
                "-";

        }


        // ==================================
        // EMAIL
        // ==================================

        const secureEmailElement =
            document.getElementById(
                "email"
            );

        if (secureEmailElement) {

            secureEmailElement.textContent =
                client.email ||
                "-";

        }


        // ==================================
        // RESTAURANT ID
        // ==================================

        const secureRestaurantIdElement =
            document.getElementById(
                "tenantRestaurantId"
            );

        if (secureRestaurantIdElement) {

            secureRestaurantIdElement.textContent =
                dashboardData.restaurantId ||
                "-";

        }


        // ==================================
        // DEBUG SECURE SESSION
        // ==================================

        console.log(
            "SECURE SESSION USER ID:",
            dashboardData.userId
        );

        console.log(
            "SECURE SESSION EMAIL:",
            client.email
        );

        console.log(
            "SECURE SESSION RESTAURANT ID:",
            dashboardData.restaurantId
        );


        // ==========================================
        // UPDATE AVATAR
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
        // UPDATE RESTAURANT STATUS
        // ==========================================

        const restaurantStatusElement =
            document.getElementById(
                "restaurantStatus"
            );


        if (restaurantStatusElement) {

            restaurantStatusElement.textContent =
                restaurantStatus;

        }


        // ==========================================
        // UPDATE PLAN NAME
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
        // UPDATE PLAN PRICE
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
        // UPDATE MAX ORDERS
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
        // UPDATE MAX BRANCHES
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
        // UPDATE DASHBOARD METRICS
        // ==========================================

        updateDashboardMetrics(
            metrics,
            restaurant
        );


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
        // FINAL DEBUG
        // ==========================================

        console.log(
            "=================================="
        );

        console.log(
            "DASHBOARD: UI populated successfully."
        );

        console.log(
            "=================================="
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
            "Restaurant:",
            restaurant
        );


        console.log(
            "Plan:",
            plan.planName
        );


        console.log(
            "Metrics:",
            metrics
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


            // ==================================
            // RETURN DATA OBJECT
            // ==================================

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


// ==========================================
// UPDATE DASHBOARD METRICS
// ==========================================

function updateDashboardMetrics(
    metrics,
    restaurant
) {

    // ==================================
    // TOTAL ORDERS
    // ==================================

    const totalOrdersElement =
        document.getElementById(
            "totalOrders"
        );


    if (totalOrdersElement) {

        totalOrdersElement.textContent =
            metrics.totalOrders ?? 0;

    }


    // ==================================
    // TOTAL REVENUE
    // ==================================

    const totalRevenueElement =
        document.getElementById(
            "totalRevenue"
        );


    if (totalRevenueElement) {

        totalRevenueElement.textContent =
            `${restaurant.currency || "AED"} ${metrics.totalRevenue ?? 0}`;

    }


    // ==================================
    // PENDING ORDERS
    // ==================================

    const pendingOrdersElement =
        document.getElementById(
            "pendingOrders"
        );


    if (pendingOrdersElement) {

        pendingOrdersElement.textContent =
            metrics.pendingOrders ?? 0;

    }


    // ==================================
    // PREPARING ORDERS
    // ==================================

    const preparingOrdersElement =
        document.getElementById(
            "preparingOrders"
        );


    if (preparingOrdersElement) {

        preparingOrdersElement.textContent =
            metrics.preparingOrders ?? 0;

    }


    // ==================================
    // READY ORDERS
    // ==================================

    const readyOrdersElement =
        document.getElementById(
            "readyOrders"
        );


    if (readyOrdersElement) {

        readyOrdersElement.textContent =
            metrics.readyOrders ?? 0;

    }


    // ==================================
    // COMPLETED ORDERS
    // ==================================

    const completedOrdersElement =
        document.getElementById(
            "completedOrders"
        );


    if (completedOrdersElement) {

        completedOrdersElement.textContent =
            metrics.completedOrders ?? 0;

    }


    // ==================================
    // REJECTED ORDERS
    // ==================================

    const rejectedOrdersElement =
        document.getElementById(
            "rejectedOrders"
        );


    if (rejectedOrdersElement) {

        rejectedOrdersElement.textContent =
            metrics.rejectedOrders ?? 0;

    }


    // ==================================
    // AVERAGE ORDER VALUE
    // ==================================

    const averageOrderValueElement =
        document.getElementById(
            "averageOrderValue"
        );


    if (averageOrderValueElement) {

        averageOrderValueElement.textContent =
            `${restaurant.currency || "AED"} ${metrics.averageOrderValue ?? 0}`;

    }

    console.log("========== SECURE SESSION UI DEBUG ==========");

    console.log(
        "userId value:",
        userId
    );

    console.log(
        "email value:",
        ownerEmail
    );

    console.log(
        "restaurantId value:",
        restaurantId
    );

    console.log(
        "userId element:",
        document.getElementById("userId")
    );

    console.log(
        "email element:",
        document.getElementById("email")
    );

    console.log(
        "tenantRestaurantId element:",
        document.getElementById("tenantRestaurantId")
    );

    console.log("============================================");

}