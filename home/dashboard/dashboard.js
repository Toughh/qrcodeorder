// ==========================================
// QR RESTAURANT SAAS
// PREMIUM OWNER DASHBOARD
// ==========================================


// ==========================================
// n8n OWNER DASHBOARD WEBHOOK
// ==========================================

const N8N_DASHBOARD_WEBHOOK =
    `${N8N_BASE_URL}/owner-dashboard`;


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

        const dashboardData = await loadDashboardData(7);


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
            dashboardData.client?.ownerName ||
            dashboardData.client?.OwnerName ||
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
        // UPDATE ORDER ANALYTICS
        // ==========================================

        updateOrderAnalytics(
            dashboardData.analytics || {},
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
                        "../../login/login.html";

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

async function loadDashboardData(analyticsDays = 7) {

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
                                sessionToken,

                            analyticsDays:
                                analyticsDays

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

}


// ==========================================
// ORDER ANALYTICS
// ==========================================

let ordersAnalyticsChart = null;


// ==========================================
// UPDATE ORDER ANALYTICS
// ==========================================

function updateOrderAnalytics(
    analytics,
    restaurant
) {

    const dailyOrders =
        analytics.dailyOrders || [];


    const currency =
        restaurant.currency ||
        "AED";


    // ======================================
    // TOTALS
    // ======================================

    let totalOrders = 0;
    let acceptedOrders = 0;
    let rejectedOrders = 0;
    let pendingOrders = 0;
    let totalRevenue = 0;


    dailyOrders.forEach(day => {

        totalOrders +=
            Number(day.total) || 0;

        acceptedOrders +=
            Number(day.accepted) || 0;

        rejectedOrders +=
            Number(day.rejected) || 0;

        pendingOrders +=
            Number(day.pending) || 0;

        totalRevenue +=
            Number(day.revenue) || 0;

    });


    totalRevenue =
        Number(
            totalRevenue.toFixed(2)
        );


    // ======================================
    // UPDATE SUMMARY
    // ======================================

    const totalElement =
        document.getElementById(
            "analyticsTotalOrders"
        );

    if (totalElement) {

        totalElement.textContent =
            totalOrders;

    }


    const acceptedElement =
        document.getElementById(
            "analyticsAcceptedOrders"
        );

    if (acceptedElement) {

        acceptedElement.textContent =
            acceptedOrders;

    }


    const rejectedElement =
        document.getElementById(
            "analyticsRejectedOrders"
        );

    if (rejectedElement) {

        rejectedElement.textContent =
            rejectedOrders;

    }


    const revenueElement =
        document.getElementById(
            "analyticsRevenue"
        );

    if (revenueElement) {

        revenueElement.textContent =
            `${currency} ${totalRevenue.toFixed(2)}`;

    }


    // ======================================
    // STATUS CARD
    // ======================================

    setText(
        "analyticsPending",
        pendingOrders
    );

    setText(
        "analyticsAccepted",
        acceptedOrders
    );

    setText(
        "analyticsRejected",
        rejectedOrders
    );


    // ======================================
    // STATUS BAR WIDTH
    // ======================================

    const statusTotal =
        pendingOrders +
        acceptedOrders +
        rejectedOrders;


    setBarWidth(
        "pendingBar",
        pendingOrders,
        statusTotal
    );

    setBarWidth(
        "acceptedBar",
        acceptedOrders,
        statusTotal
    );

    setBarWidth(
        "rejectedBar",
        rejectedOrders,
        statusTotal
    );


    // ======================================
    // REVENUE HIGHLIGHT
    // ======================================

    setText(
        "revenueHighlight",
        `${currency} ${totalRevenue.toFixed(2)}`
    );


    // ======================================
    // AVERAGE DAILY REVENUE
    // ======================================

    const days =
        dailyOrders.length || 1;


    const averageDailyRevenue =
        totalRevenue / days;


    setText(
        "averageDailyRevenue",
        `${currency} ${averageDailyRevenue.toFixed(2)}`
    );


    // ======================================
    // AVERAGE ORDER
    // ======================================

    const averageOrder =
        totalOrders > 0
            ? totalRevenue / totalOrders
            : 0;


    setText(
        "analyticsAverageOrder",
        `${currency} ${averageOrder.toFixed(2)}`
    );


    // ======================================
    // RENDER CHART
    // ======================================

    renderOrdersChart(
        dailyOrders,
        currency
    );

}


// ==========================================
// SAFE TEXT HELPER
// ==========================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value;

    }

}


// ==========================================
// BAR WIDTH
// ==========================================

function setBarWidth(
    id,
    value,
    total
) {

    const element =
        document.getElementById(id);

    if (!element) {

        return;

    }


    const percentage =
        total > 0
            ? (
                value /
                total
            ) * 100
            : 0;


    element.style.width =
        `${percentage}%`;

}


// ==========================================
// RENDER ORDERS CHART
// ==========================================

function renderOrdersChart(
    dailyOrders,
    currency
) {

    const canvas =
        document.getElementById(
            "ordersAnalyticsChart"
        );


    if (!canvas) {

        return;

    }

    if (typeof Chart === "undefined") {

        console.error(
            "Chart.js is not loaded."
        );

        return;
    }


    const ctx =
        canvas.getContext("2d");


    // ======================================
    // DESTROY OLD CHART
    // ======================================

    if (
        ordersAnalyticsChart
    ) {

        ordersAnalyticsChart.destroy();

    }


    // ======================================
    // LABELS
    // ======================================

    const labels =
        dailyOrders.map(
            day => formatChartDate(
                day.date
            )
        );


    // ======================================
    // DATASETS
    // ======================================

    ordersAnalyticsChart =
        new Chart(
            ctx,
            {

                type: "line",

                data: {

                    labels,

                    datasets: [

                        {

                            label:
                                "Total Orders",

                            data:
                                dailyOrders.map(
                                    day =>
                                        day.total
                                ),

                            borderWidth: 3,

                            tension: 0.4,

                            fill: true,

                            pointRadius: 4,

                            pointHoverRadius: 7

                        },


                        {

                            label:
                                "Accepted",

                            data:
                                dailyOrders.map(
                                    day =>
                                        day.accepted
                                ),

                            borderWidth: 2,

                            tension: 0.4,

                            fill: false,

                            pointRadius: 3,

                            pointHoverRadius: 6

                        },


                        {

                            label:
                                "Rejected",

                            data:
                                dailyOrders.map(
                                    day =>
                                        day.rejected
                                ),

                            borderWidth: 2,

                            tension: 0.4,

                            fill: false,

                            pointRadius: 3,

                            pointHoverRadius: 6

                        }

                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    interaction: {

                        mode:
                            "index",

                        intersect:
                            false

                    },


                    plugins: {

                        legend: {

                            display:
                                false

                        },


                        tooltip: {

                            padding: 12,

                            displayColors:
                                true,

                            callbacks: {

                                title:
                                    function (
                                        items
                                    ) {

                                        return items[0]
                                            .label;

                                    },


                                label:
                                    function (
                                        context
                                    ) {

                                        return ` ${context.dataset.label}: ${context.parsed.y}`;

                                    }

                            }

                        }

                    },


                    scales: {

                        x: {

                            grid: {

                                display:
                                    false

                            },

                            border: {

                                display:
                                    false

                            }

                        },


                        y: {

                            beginAtZero:
                                true,

                            ticks: {

                                precision:
                                    0

                            },

                            grid: {

                                drawBorder:
                                    false

                            },

                            border: {

                                display:
                                    false

                            }

                        }

                    }

                }

            }
        );

}


// ==========================================
// FORMAT CHART DATE
// ==========================================

function formatChartDate(
    dateString
) {

    const date =
        new Date(
            `${dateString}T00:00:00`
        );


    return date.toLocaleDateString(
        "en-US",
        {

            month: "short",

            day: "numeric"

        }
    );

}

// ==========================================
// ANALYTICS RANGE BUTTONS
// ==========================================

document.addEventListener(
    "click",
    async function (event) {

        const button =
            event.target.closest(
                ".range-btn"
            );


        if (!button) {

            return;

        }


        const days =
            Number(
                button.dataset.days
            );


        if (!days) {

            return;

        }


        // ==================================
        // ACTIVE BUTTON
        // ==================================

        document
            .querySelectorAll(
                ".range-btn"
            )
            .forEach(
                btn =>
                    btn.classList.remove(
                        "active"
                    )
            );


        button.classList.add(
            "active"
        );


        // ==================================
        // LOAD DATA
        // ==================================

        const dashboardData =
            await loadDashboardData(
                days
            );


        if (!dashboardData) {

            return;

        }


        // ==================================
        // UPDATE ANALYTICS ONLY
        // ==================================

        updateOrderAnalytics(
            dashboardData.analytics ||
            {},
            dashboardData.restaurant ||
            {}
        );

    }
);