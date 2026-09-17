// ============================================================
// QR ORDER SAAS
// PREMIUM OWNER REPORTS
// ============================================================

// ============================================================
// CONFIGURATION
// ============================================================

const REPORTS_WEBHOOK =
    `${N8N_BASE_URL}/owner-reports`;

const SESSION_TOKEN_KEY =
    "qro_session_token";

const SESSION_DATA_KEY =
    "qro_session_data";

const VALIDATED_SESSION_KEY =
    "qro_validated_session";


// ============================================================
// STATE
// ============================================================

const state = {
    reportData: null,
    chartMetric: "orders",
    performanceChart: null,
    statusChart: null,
    loading: false,
    requestId: 0,
    abortController: null,
    currency: "AED"
};


// ============================================================
// DOM REFERENCES
// ============================================================

const dateRangeSelect =
    document.getElementById("dateRange");

const branchFilter =
    document.getElementById("branchFilter");

const refreshReportBtn =
    document.getElementById("refreshReport");

const exportReportBtn =
    document.getElementById("exportReport");

const retryReportBtn =
    document.getElementById("retryReport");

const loadingState =
    document.getElementById("loadingState");

const errorState =
    document.getElementById("errorState");

const errorMessage =
    document.getElementById("errorMessage");

const reportContent =
    document.getElementById("reportContent");

const userName =
    document.getElementById("userName");

const userRole =
    document.getElementById("userRole");

const userAvatar =
    document.getElementById("userAvatar");

const periodLabel =
    document.getElementById("periodLabel");

const chartDateLabel =
    document.getElementById("chartDateLabel");

const chartMetricLabel =
    document.getElementById("chartMetricLabel");

const chartMetricValue =
    document.getElementById("chartMetricValue");


// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    initializeUser();

    setupEventListeners();

    loadReports();

});


// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {

    if (dateRangeSelect) {
        dateRangeSelect.addEventListener(
            "change",
            loadReports
        );
    }

    if (branchFilter) {
        branchFilter.addEventListener(
            "change",
            loadReports
        );
    }

    if (refreshReportBtn) {
        refreshReportBtn.addEventListener(
            "click",
            loadReports
        );
    }

    if (retryReportBtn) {
        retryReportBtn.addEventListener(
            "click",
            loadReports
        );
    }

    if (exportReportBtn) {
        exportReportBtn.addEventListener(
            "click",
            exportReport
        );
    }

    document
        .querySelectorAll(".chart-toggle-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(".chart-toggle-btn")
                        .forEach(btn =>
                            btn.classList.remove("active")
                        );

                    button.classList.add("active");

                    state.chartMetric =
                        button.dataset.chart || "orders";

                    renderPerformanceChart();

                }
            );

        });


    // Logout
    const logoutBtn =
        document.getElementById("logoutBtn");

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            handleLogout
        );

    }

}


// ============================================================
// USER INFORMATION
// ============================================================

function initializeUser() {

    let sessionData = {};

    try {

        sessionData =
            JSON.parse(
                localStorage.getItem(
                    SESSION_DATA_KEY
                ) || "{}"
            );

    } catch (error) {

        sessionData = {};

    }


    const owner =
        sessionData.ownerName ||
        sessionData.OwnerName ||
        sessionData.client?.ownerName ||
        sessionData.client?.OwnerName ||
        "Owner";


    const role =
        sessionData.role ||
        sessionData.Role ||
        "Owner";


    if (userName) {
        userName.textContent = owner;
    }

    if (userRole) {
        userRole.textContent = role;
    }

    if (userAvatar) {

        userAvatar.textContent =
            owner
                .trim()
                .charAt(0)
                .toUpperCase() || "O";

    }

}


// ============================================================
// LOAD REPORTS
// ============================================================

async function loadReports() {

    const sessionToken =
        localStorage.getItem(
            SESSION_TOKEN_KEY
        );


    if (!sessionToken) {

        redirectToLogin();

        return;

    }


    const dateRange =
        dateRangeSelect?.value || "30";

    const branchId =
        branchFilter?.value || "";


    const requestId =
        ++state.requestId;


    // Abort previous request
    if (state.abortController) {

        state.abortController.abort();

    }

    state.abortController =
        new AbortController();


    setLoadingState(true);


    try {

        const response =
            await fetch(
                REPORTS_WEBHOOK,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        sessionToken,
                        dateRange,
                        branchId
                    }),

                    signal:
                        state.abortController.signal
                }
            );


        const data =
            await response.json();


        // Ignore stale request
        if (
            requestId !==
            state.requestId
        ) {
            return;
        }


        if (!response.ok) {

            throw new Error(
                data?.message ||
                "Unable to load report data."
            );

        }


        if (
            !data ||
            data.success !== true
        ) {

            if (
                data?.code ===
                "INVALID_SESSION"
            ) {

                handleInvalidSession();

                return;

            }

            throw new Error(
                data?.message ||
                "Report data could not be loaded."
            );

        }


        state.reportData = data;


        // Update user from authoritative response
        updateUserFromResponse(data);


        // Currency
        state.currency =
            data.restaurant?.currency ||
            "AED";


        // Populate branches
        populateBranchFilter(
            data.branches || [],
            branchId
        );


        // Render everything
        renderReports(data);


        showReportContent();


    } catch (error) {

        if (
            error.name ===
            "AbortError"
        ) {
            return;
        }


        console.error(
            "Reports load error:",
            error
        );


        showError(
            error.message ||
            "Something went wrong while loading reports."
        );


    } finally {

        if (
            requestId ===
            state.requestId
        ) {

            setLoadingState(false);

        }

    }

}


// ============================================================
// RENDER REPORTS
// ============================================================

function renderReports(data) {

    const reports =
        data.reports || {};

    const summary =
        reports.executiveSummary || {};

    const reportRange =
        data.reportDateRange || {};


    // --------------------------------------------------------
    // Executive Summary
    // --------------------------------------------------------

    setText(
        "totalOrders",
        formatNumber(
            summary.totalOrders
        )
    );


    setText(
        "totalRevenue",
        formatCurrency(
            summary.totalRevenue
        )
    );


    setText(
        "averageOrderValue",
        formatCurrency(
            summary.averageOrderValue
        )
    );


    setText(
        "totalCustomers",
        formatNumber(
            summary.customers
        )
    );


    renderChange(
        "ordersChange",
        summary.changes?.orders
    );


    renderChange(
        "revenueChange",
        summary.changes?.revenue
    );


    renderChange(
        "averageChange",
        summary.changes?.averageOrderValue
    );


    renderChange(
        "customersChange",
        summary.changes?.customers
    );


    // --------------------------------------------------------
    // Period
    // --------------------------------------------------------

    const days =
        Number(
            reportRange.days ||
            dateRangeSelect?.value ||
            30
        );


    const periodText =
        `Last ${days} Days`;


    if (periodLabel) {
        periodLabel.textContent =
            periodText;
    }


    if (chartDateLabel) {
        chartDateLabel.textContent =
            reportRange.displayStart &&
            reportRange.displayEnd
                ? `${reportRange.displayStart} – ${reportRange.displayEnd}`
                : periodText;
    }


    // --------------------------------------------------------
    // Charts
    // --------------------------------------------------------

    renderPerformanceChart();

    renderStatusChart();


    // --------------------------------------------------------
    // Lists
    // --------------------------------------------------------

    renderDailyOrders(
        reports.performance?.daily || []
    );


    renderTopSellingItems(
        reports.menuPerformance
            ?.topSellingItems || []
    );


    renderRevenueItems(
        reports.menuPerformance
            ?.topSellingItems || []
    );


    // --------------------------------------------------------
    // Branch Table
    // --------------------------------------------------------

    renderBranchPerformance(
        reports.branchPerformance || []
    );

}


// ============================================================
// UPDATE USER FROM RESPONSE
// ============================================================

function updateUserFromResponse(data) {

    const owner =
        data.client?.ownerName ||
        data.client?.OwnerName ||
        "Owner";


    const role =
        data.role ||
        "Owner";


    if (userName) {
        userName.textContent =
            owner;
    }


    if (userRole) {
        userRole.textContent =
            role;
    }


    if (userAvatar) {

        userAvatar.textContent =
            owner
                .trim()
                .charAt(0)
                .toUpperCase() || "O";

    }

}


// ============================================================
// BRANCH FILTER
// ============================================================

function populateBranchFilter(
    branches,
    selectedBranchId
) {

    if (!branchFilter) {
        return;
    }


    const currentValue =
        selectedBranchId ||
        branchFilter.value ||
        "";


    branchFilter.innerHTML =
        `<option value="">All Branches</option>`;


    branches.forEach(branch => {

        const branchId =
            branch.branchId ||
            branch.BranchId ||
            "";


        const branchName =
            branch.branchName ||
            branch.BranchName ||
            branchId ||
            "Unnamed Branch";


        if (!branchId) {
            return;
        }


        const option =
            document.createElement("option");


        option.value =
            branchId;


        option.textContent =
            branchName;


        branchFilter.appendChild(
            option
        );

    });


    const exists =
        Array.from(
            branchFilter.options
        ).some(
            option =>
                option.value ===
                currentValue
        );


    if (exists) {

        branchFilter.value =
            currentValue;

    } else {

        branchFilter.value = "";

    }

}


// ============================================================
// PERFORMANCE CHART
// ============================================================

function renderPerformanceChart() {

    const canvas =
        document.getElementById(
            "performanceChart"
        );


    if (!canvas) {
        return;
    }


    const daily =
        state.reportData
            ?.reports
            ?.performance
            ?.daily || [];


    const metric =
        state.chartMetric;


    const values =
        daily.map(item =>
            Number(
                metric === "revenue"
                    ? item.revenue || 0
                    : item.orders || 0
            )
        );


    const hasData =
        values.some(
            value => value > 0
        );


    updateChartMetricHeader(
        metric,
        values
    );


    // Destroy previous chart
    if (state.performanceChart) {

        state.performanceChart.destroy();

        state.performanceChart = null;

    }


    removeChartEmptyState(
        canvas
    );


    if (!hasData) {

        canvas.style.display =
            "none";

        showChartEmptyState(
            canvas,
            "No performance data yet",
            "Orders and revenue will appear here once your restaurant starts receiving orders."
        );

        return;

    }


    canvas.style.display =
        "block";


    const context =
        canvas.getContext("2d");


    let gradient;


    if (metric === "revenue") {

        gradient =
            context.createLinearGradient(
                0,
                0,
                0,
                320
            );

        gradient.addColorStop(
            0,
            "rgba(184, 138, 68, 0.24)"
        );

        gradient.addColorStop(
            1,
            "rgba(184, 138, 68, 0)"
        );

    } else {

        gradient =
            context.createLinearGradient(
                0,
                0,
                0,
                320
            );

        gradient.addColorStop(
            0,
            "rgba(23, 32, 51, 0.16)"
        );

        gradient.addColorStop(
            1,
            "rgba(23, 32, 51, 0)"
        );

    }


    state.performanceChart =
        new Chart(
            context,
            {
                type: "line",

                data: {

                    labels:
                        daily.map(
                            item =>
                                item.label ||
                                item.date ||
                                ""
                        ),

                    datasets: [
                        {
                            label:
                                metric === "revenue"
                                    ? "Revenue"
                                    : "Orders",

                            data:
                                values,

                            borderColor:
                                metric === "revenue"
                                    ? "#b88a44"
                                    : "#172033",

                            backgroundColor:
                                gradient,

                            fill: true,

                            tension: 0.35,

                            borderWidth: 2.5,

                            pointRadius: 0,

                            pointHoverRadius: 5,

                            pointHoverBorderWidth: 2,

                            pointHoverBackgroundColor:
                                "#ffffff",

                            pointHoverBorderColor:
                                metric === "revenue"
                                    ? "#b88a44"
                                    : "#172033"
                        }
                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    interaction: {
                        intersect: false,
                        mode: "index"
                    },

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {

                            backgroundColor:
                                "#172033",

                            titleColor:
                                "#ffffff",

                            bodyColor:
                                "#e2e8f0",

                            padding: 12,

                            cornerRadius: 10,

                            displayColors: false,

                            callbacks: {

                                label:
                                    context => {

                                        const value =
                                            context.parsed.y || 0;

                                        return metric === "revenue"
                                            ? formatCurrency(value)
                                            : `${formatNumber(value)} orders`;

                                    }

                            }

                        }

                    },

                    scales: {

                        x: {

                            grid: {
                                display: false
                            },

                            border: {
                                display: false
                            },

                            ticks: {

                                color:
                                    "#7a8496",

                                font: {
                                    size: 11
                                },

                                maxTicksLimit: 10

                            }

                        },

                        y: {

                            beginAtZero: true,

                            grid: {

                                color:
                                    "rgba(148, 163, 184, 0.14)"

                            },

                            border: {
                                display: false
                            },

                            ticks: {

                                color:
                                    "#7a8496",

                                font: {
                                    size: 11
                                },

                                callback:
                                    value =>
                                        metric === "revenue"
                                            ? formatCompactCurrency(value)
                                            : formatNumber(value)

                            }

                        }

                    }

                }

            }
        );

}


// ============================================================
// CHART METRIC HEADER
// ============================================================

function updateChartMetricHeader(
    metric,
    values
) {

    const total =
        values.reduce(
            (sum, value) =>
                sum + Number(value || 0),
            0
        );


    if (chartMetricLabel) {

        chartMetricLabel.textContent =
            metric === "revenue"
                ? "Total Revenue"
                : "Total Orders";

    }


    if (chartMetricValue) {

        chartMetricValue.textContent =
            metric === "revenue"
                ? formatCurrency(total)
                : formatNumber(total);

    }

}


// ============================================================
// STATUS CHART
// ============================================================

function renderStatusChart() {

    const canvas =
        document.getElementById(
            "statusChart"
        );


    const legend =
        document.getElementById(
            "statusLegend"
        );


    if (!canvas) {
        return;
    }


    const statuses =
        state.reportData
            ?.reports
            ?.orderPerformance
            ?.statuses || [];


    if (state.statusChart) {

        state.statusChart.destroy();

        state.statusChart = null;

    }


    removeChartEmptyState(
        canvas
    );


    if (legend) {
        legend.innerHTML = "";
    }


    const normalized =
        statuses.map(item => ({

            status:
                item.status ||
                item.Status ||
                "Unknown",

            count:
                Number(
                    item.count ??
                    item.orders ??
                    item.total ??
                    0
                ),

            percentage:
                Number(
                    item.percentage ??
                    item.percent ??
                    0
                )

        }));


    const total =
        normalized.reduce(
            (sum, item) =>
                sum + item.count,
            0
        );


    if (
        normalized.length === 0 ||
        total === 0
    ) {

        canvas.style.display =
            "none";


        showChartEmptyState(
            canvas,
            "No order activity",
            "Order status distribution will appear once orders are received."
        );


        if (legend) {

            legend.innerHTML =
                `<div class="status-empty-text">No status data available</div>`;

        }

        return;

    }


    canvas.style.display =
        "block";


    const labels =
        normalized.map(
            item => item.status
        );


    const values =
        normalized.map(
            item => item.count
        );


    const colors =
        normalized.map(
            item =>
                getStatusColor(
                    item.status
                )
        );


    state.statusChart =
        new Chart(
            canvas.getContext("2d"),
            {
                type: "doughnut",

                data: {

                    labels,

                    datasets: [
                        {
                            data: values,

                            backgroundColor:
                                colors,

                            borderColor:
                                "#ffffff",

                            borderWidth: 3,

                            hoverOffset: 5
                        }
                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    cutout: "72%",

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {

                            backgroundColor:
                                "#172033",

                            padding: 12,

                            cornerRadius: 10,

                            callbacks: {

                                label:
                                    context => {

                                        const item =
                                            normalized[
                                                context.dataIndex
                                            ];

                                        const percent =
                                            total > 0
                                                ? (
                                                    item.count /
                                                    total *
                                                    100
                                                ).toFixed(1)
                                                : 0;

                                        return `${item.count} orders (${percent}%)`;

                                    }

                            }

                        }

                    }

                }

            }
        );


    renderStatusLegend(
        normalized,
        total
    );

}


// ============================================================
// STATUS LEGEND
// ============================================================

function renderStatusLegend(
    statuses,
    total
) {

    const container =
        document.getElementById(
            "statusLegend"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        statuses
            .map(item => {

                const percentage =
                    total > 0
                        ? (
                            item.count /
                            total *
                            100
                        ).toFixed(1)
                        : 0;


                return `
                    <div class="status-legend-item">

                        <div class="status-legend-left">

                            <span
                                class="status-dot"
                                style="
                                    background:${getStatusColor(item.status)};
                                "
                            ></span>

                            <span>
                                ${escapeHtml(item.status)}
                            </span>

                        </div>

                        <div class="status-legend-value">

                            <strong>
                                ${formatNumber(item.count)}
                            </strong>

                            <span>
                                ${percentage}%
                            </span>

                        </div>

                    </div>
                `;

            })
            .join("");

}


// ============================================================
// DAILY ORDERS
// ============================================================

function renderDailyOrders(
    daily
) {

    const container =
        document.getElementById(
            "dailyOrdersList"
        );


    if (!container) {
        return;
    }


    if (!daily.length) {

        container.innerHTML =
            createListEmptyState(
                "No daily activity",
                "Daily order activity will appear here once orders are received."
            );

        return;

    }


    const hasAnyOrders =
        daily.some(
            item =>
                Number(
                    item.orders || 0
                ) > 0
        );


    if (!hasAnyOrders) {

        container.innerHTML =
            createListEmptyState(
                "No orders in this period",
                "There are no recorded orders for the selected reporting period."
            );

        return;

    }


    container.innerHTML =
        daily
            .slice()
            .reverse()
            .map(item => {

                const orders =
                    Number(
                        item.orders || 0
                    );


                const revenue =
                    Number(
                        item.revenue || 0
                    );


                return `
                    <div class="daily-order-row">

                        <div class="daily-order-date">

                            <strong>
                                ${escapeHtml(
                                    item.label ||
                                    item.date ||
                                    "—"
                                )}
                            </strong>

                            <span>
                                ${formatDate(
                                    item.date
                                )}
                            </span>

                        </div>

                        <div class="daily-order-stats">

                            <strong>
                                ${formatNumber(orders)}
                            </strong>

                            <span>
                                orders
                            </span>

                        </div>

                        <div class="daily-order-revenue">

                            ${formatCurrency(revenue)}

                        </div>

                    </div>
                `;

            })
            .join("");

}


// ============================================================
// TOP SELLING ITEMS
// ============================================================

function renderTopSellingItems(
    items
) {

    const container =
        document.getElementById(
            "topSellingItems"
        );


    if (!container) {
        return;
    }


    const normalized =
        normalizeMenuItems(items);


    const sorted =
        normalized
            .filter(
                item =>
                    item.quantity > 0
            )
            .sort(
                (a, b) =>
                    b.quantity -
                    a.quantity
            );


    if (!sorted.length) {

        container.innerHTML =
            createListEmptyState(
                "No item sales yet",
                "Top selling menu items will appear once orders are received."
            );

        return;

    }


    container.innerHTML =
        sorted
            .slice(0, 10)
            .map((item, index) => {

                return `
                    <div class="item-ranking-row">

                        <div class="item-rank">
                            ${index + 1}
                        </div>

                        <div class="item-ranking-main">

                            <strong>
                                ${escapeHtml(item.name)}
                            </strong>

                            <span>
                                ${formatNumber(item.quantity)}
                                ${item.quantity === 1 ? "item" : "items"} sold
                            </span>

                        </div>

                        <div class="item-ranking-value">

                            ${formatCurrency(item.revenue)}

                        </div>

                    </div>
                `;

            })
            .join("");

}


// ============================================================
// REVENUE ITEMS
// ============================================================

function renderRevenueItems(
    items
) {

    const container =
        document.getElementById(
            "revenueItems"
        );


    if (!container) {
        return;
    }


    const normalized =
        normalizeMenuItems(items);


    const sorted =
        normalized
            .filter(
                item =>
                    item.revenue > 0
            )
            .sort(
                (a, b) =>
                    b.revenue -
                    a.revenue
            );


    if (!sorted.length) {

        container.innerHTML =
            createListEmptyState(
                "No revenue data yet",
                "Revenue contribution by menu item will appear once sales are recorded."
            );

        return;

    }


    container.innerHTML =
        sorted
            .slice(0, 10)
            .map((item, index) => {

                return `
                    <div class="item-ranking-row">

                        <div class="item-rank">
                            ${index + 1}
                        </div>

                        <div class="item-ranking-main">

                            <strong>
                                ${escapeHtml(item.name)}
                            </strong>

                            <span>
                                ${formatNumber(item.quantity)}
                                ${item.quantity === 1 ? "item" : "items"} sold
                            </span>

                        </div>

                        <div class="item-ranking-value revenue">

                            ${formatCurrency(item.revenue)}

                        </div>

                    </div>
                `;

            })
            .join("");

}


// ============================================================
// NORMALIZE MENU ITEMS
// ============================================================

function normalizeMenuItems(
    items
) {

    return items.map(item => {

        const name =
            item.itemName ||
            item.ItemName ||
            item.name ||
            item.Name ||
            "Unnamed Item";


        const quantity =
            Number(
                item.quantity ??
                item.qty ??
                item.Qty ??
                item.totalQuantity ??
                item.unitsSold ??
                0
            );


        const revenue =
            Number(
                item.revenue ??
                item.totalRevenue ??
                item.Revenue ??
                0
            );


        return {
            name,
            quantity,
            revenue
        };

    });

}


// ============================================================
// BRANCH PERFORMANCE
// ============================================================

function renderBranchPerformance(
    branches
) {

    const tbody =
        document.getElementById(
            "branchTableBody"
        );


    const emptyState =
        document.getElementById(
            "branchEmptyState"
        );


    const tableWrapper =
        document.querySelector(
            ".reports-table-wrapper"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    if (!branches.length) {

        if (tableWrapper) {
            tableWrapper.style.display =
                "none";
        }

        if (emptyState) {
            emptyState.classList.remove(
                "hidden"
            );
        }

        return;

    }


    const normalized =
        branches.map(branch => {

            const orders =
                Number(
                    branch.orders ??
                    branch.totalOrders ??
                    0
                );


            const revenue =
                Number(
                    branch.revenue ??
                    branch.totalRevenue ??
                    0
                );


            const averageOrderValue =
                Number(
                    branch.averageOrderValue ??
                    branch.avgOrderValue ??
                    (
                        orders > 0
                            ? revenue / orders
                            : 0
                    )
                );


            return {

                branchName:
                    branch.branchName ||
                    branch.BranchName ||
                    branch.branchId ||
                    "Unnamed Branch",

                orders,

                revenue,

                averageOrderValue

            };

        });


    if (tableWrapper) {
        tableWrapper.style.display =
            "";
    }

    if (emptyState) {
        emptyState.classList.add(
            "hidden"
        );
    }


    tbody.innerHTML =
        normalized
            .map(branch => {

                return `
                    <tr>

                        <td>
                            <div class="branch-name-cell">
                                <strong>
                                    ${escapeHtml(
                                        branch.branchName
                                    )}
                                </strong>
                            </div>
                        </td>

                        <td>
                            ${formatNumber(
                                branch.orders
                            )}
                        </td>

                        <td>
                            <strong>
                                ${formatCurrency(
                                    branch.revenue
                                )}
                            </strong>
                        </td>

                        <td>
                            ${formatCurrency(
                                branch.averageOrderValue
                            )}
                        </td>

                    </tr>
                `;

            })
            .join("");

}


// ============================================================
// CHANGE INDICATOR
// ============================================================

function renderChange(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {
        return;
    }


    if (
        value === null ||
        value === undefined ||
        value === "" ||
        Number.isNaN(
            Number(value)
        )
    ) {

        element.textContent =
            "—";

        element.className =
            "kpi-change neutral";

        return;

    }


    const numericValue =
        Number(value);


    let display;


    if (numericValue > 0) {

        display =
            `+${numericValue.toFixed(1)}%`;

        element.className =
            "kpi-change positive";

    } else if (numericValue < 0) {

        display =
            `${numericValue.toFixed(1)}%`;

        element.className =
            "kpi-change negative";

    } else {

        display =
            "0.0%";

        element.className =
            "kpi-change neutral";

    }


    element.textContent =
        display;

}


// ============================================================
// CHART EMPTY STATE
// ============================================================

function showChartEmptyState(
    canvas,
    title,
    message
) {

    const wrapper =
        canvas.parentElement;


    if (!wrapper) {
        return;
    }


    const empty =
        document.createElement(
            "div"
        );


    empty.className =
        "reports-chart-empty";


    empty.innerHTML = `
        <div class="reports-chart-empty-icon">
            ◌
        </div>

        <strong>
            ${escapeHtml(title)}
        </strong>

        <span>
            ${escapeHtml(message)}
        </span>
    `;


    wrapper.appendChild(
        empty
    );

}


function removeChartEmptyState(
    canvas
) {

    const wrapper =
        canvas.parentElement;


    if (!wrapper) {
        return;
    }


    const empty =
        wrapper.querySelector(
            ".reports-chart-empty"
        );


    if (empty) {
        empty.remove();
    }

}


// ============================================================
// GENERIC EMPTY STATE
// ============================================================

function createListEmptyState(
    title,
    message
) {

    return `
        <div class="reports-list-empty">

            <div class="reports-list-empty-icon">
                ◌
            </div>

            <strong>
                ${escapeHtml(title)}
            </strong>

            <span>
                ${escapeHtml(message)}
            </span>

        </div>
    `;

}


// ============================================================
// STATUS COLORS
// ============================================================

function getStatusColor(
    status
) {

    const value =
        String(status || "")
            .toLowerCase();


    if (
        value.includes("pending") ||
        value.includes("waiting")
    ) {
        return "#b88a44";
    }


    if (
        value.includes("accept") ||
        value.includes("ready") ||
        value.includes("complete") ||
        value.includes("deliver")
    ) {
        return "#5f8f72";
    }


    if (
        value.includes("reject") ||
        value.includes("cancel")
    ) {
        return "#b96b6b";
    }


    if (
        value.includes("process") ||
        value.includes("prepar")
    ) {
        return "#7187a5";
    }


    return "#7a8496";

}


// ============================================================
// LOADING STATE
// ============================================================

function setLoadingState(
    isLoading
) {

    state.loading =
        isLoading;


    if (loadingState) {

        loadingState.classList.toggle(
            "hidden",
            !isLoading
        );

    }


    if (errorState) {

        errorState.classList.add(
            "hidden"
        );

    }


    if (isLoading) {

        if (reportContent) {

            reportContent.classList.add(
                "hidden"
            );

        }

    }


    if (refreshReportBtn) {

        refreshReportBtn.disabled =
            isLoading;

        refreshReportBtn.innerHTML =
            isLoading
                ? "↻ Loading..."
                : "↻ Refresh";

    }

}


// ============================================================
// SUCCESS STATE
// ============================================================

function showReportContent() {

    if (loadingState) {

        loadingState.classList.add(
            "hidden"
        );

    }


    if (errorState) {

        errorState.classList.add(
            "hidden"
        );

    }


    if (reportContent) {

        reportContent.classList.remove(
            "hidden"
        );

    }

}


// ============================================================
// ERROR STATE
// ============================================================

function showError(
    message
) {

    if (loadingState) {

        loadingState.classList.add(
            "hidden"
        );

    }


    if (reportContent) {

        reportContent.classList.add(
            "hidden"
        );

    }


    if (errorState) {

        errorState.classList.remove(
            "hidden"
        );

    }


    if (errorMessage) {

        errorMessage.textContent =
            message ||
            "Something went wrong.";

    }

}


// ============================================================
// INVALID SESSION
// ============================================================

function handleInvalidSession() {

    localStorage.removeItem(
        SESSION_TOKEN_KEY
    );

    localStorage.removeItem(
        SESSION_DATA_KEY
    );

    localStorage.removeItem(
        VALIDATED_SESSION_KEY
    );


    redirectToLogin();

}


// ============================================================
// LOGOUT
// ============================================================

function handleLogout() {

    localStorage.removeItem(
        SESSION_TOKEN_KEY
    );

    localStorage.removeItem(
        SESSION_DATA_KEY
    );

    localStorage.removeItem(
        VALIDATED_SESSION_KEY
    );


    redirectToLogin();

}


// ============================================================
// LOGIN REDIRECT
// ============================================================

function redirectToLogin() {

    window.location.href =
        "../login/login.html";

}


// ============================================================
// EXPORT REPORT
// ============================================================

function exportReport() {

    if (!state.reportData) {

        alert(
            "Please load the report before exporting."
        );

        return;

    }


    const data =
        state.reportData;

    const reports =
        data.reports || {};

    const summary =
        reports.executiveSummary || {};

    const daily =
        reports.performance?.daily || [];

    const statuses =
        reports.orderPerformance?.statuses || [];

    const items =
        normalizeMenuItems(
            reports.menuPerformance
                ?.topSellingItems || []
        );

    const branches =
        reports.branchPerformance || [];


    const rows = [];


    // --------------------------------------------------------
    // Report Header
    // --------------------------------------------------------

    rows.push([
        "QR Order SaaS - Restaurant Report"
    ]);

    rows.push([]);

    rows.push([
        "Restaurant",
        data.restaurant?.restaurantId || ""
    ]);

    rows.push([
        "Owner",
        data.client?.ownerName || ""
    ]);

    rows.push([
        "Reporting Period",
        data.reportDateRange?.displayStart || "",
        data.reportDateRange?.displayEnd || ""
    ]);

    rows.push([]);


    // --------------------------------------------------------
    // Executive Summary
    // --------------------------------------------------------

    rows.push([
        "EXECUTIVE SUMMARY"
    ]);

    rows.push([
        "Metric",
        "Value"
    ]);

    rows.push([
        "Total Orders",
        summary.totalOrders || 0
    ]);

    rows.push([
        "Total Revenue",
        summary.totalRevenue || 0
    ]);

    rows.push([
        "Average Order Value",
        summary.averageOrderValue || 0
    ]);

    rows.push([
        "Customers",
        summary.customers || 0
    ]);

    rows.push([]);


    // --------------------------------------------------------
    // Daily Performance
    // --------------------------------------------------------

    rows.push([
        "DAILY PERFORMANCE"
    ]);

    rows.push([
        "Date",
        "Orders",
        "Revenue"
    ]);


    daily.forEach(item => {

        rows.push([
            item.date || "",
            item.orders || 0,
            item.revenue || 0
        ]);

    });


    rows.push([]);


    // --------------------------------------------------------
    // Order Status
    // --------------------------------------------------------

    rows.push([
        "ORDER STATUS"
    ]);

    rows.push([
        "Status",
        "Orders",
        "Percentage"
    ]);


    statuses.forEach(item => {

        rows.push([
            item.status ||
                item.Status ||
                "",
            item.count ||
                item.orders ||
                0,
            item.percentage ||
                item.percent ||
                ""
        ]);

    });


    rows.push([]);


    // --------------------------------------------------------
    // Menu Performance
    // --------------------------------------------------------

    rows.push([
        "MENU PERFORMANCE"
    ]);

    rows.push([
        "Item",
        "Quantity Sold",
        "Revenue"
    ]);


    items
        .sort(
            (a, b) =>
                b.revenue -
                a.revenue
        )
        .forEach(item => {

            rows.push([
                item.name,
                item.quantity,
                item.revenue
            ]);

        });


    rows.push([]);


    // --------------------------------------------------------
    // Branch Performance
    // --------------------------------------------------------

    rows.push([
        "BRANCH PERFORMANCE"
    ]);

    rows.push([
        "Branch",
        "Orders",
        "Revenue",
        "Average Order Value"
    ]);


    branches.forEach(branch => {

        const orderCount =
            Number(
                branch.orders ||
                branch.totalOrders ||
                0
            );


        const revenue =
            Number(
                branch.revenue ||
                branch.totalRevenue ||
                0
            );


        const average =
            Number(
                branch.averageOrderValue ||
                branch.avgOrderValue ||
                (
                    orderCount > 0
                        ? revenue / orderCount
                        : 0
                )
            );


        rows.push([
            branch.branchName ||
                branch.branchId ||
                "",
            orderCount,
            revenue,
            average
        ]);

    });


    // --------------------------------------------------------
    // CSV
    // --------------------------------------------------------

    const csv =
        rows
            .map(row =>
                row
                    .map(csvEscape)
                    .join(",")
            )
            .join("\r\n");


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    const today =
        new Date()
            .toISOString()
            .slice(0, 10);


    const days =
        dateRangeSelect?.value ||
        "30";


    link.href =
        url;


    link.download =
        `qr-order-report-${days}d-${today}.csv`;


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    URL.revokeObjectURL(
        url
    );

}


// ============================================================
// CSV ESCAPE
// ============================================================

function csvEscape(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }


    const text =
        String(value);


    if (
        text.includes(",") ||
        text.includes('"') ||
        text.includes("\n")
    ) {

        return `"${text.replace(
            /"/g,
            '""'
        )}"`;

    }


    return text;

}


// ============================================================
// FORMATTING
// ============================================================

function formatNumber(
    value
) {

    const number =
        Number(value || 0);


    return new Intl.NumberFormat(
        "en-US",
        {
            maximumFractionDigits: 0
        }
    ).format(number);

}


function formatCurrency(
    value
) {

    const number =
        Number(value || 0);


    try {

        return new Intl.NumberFormat(
            "en-AE",
            {
                style: "currency",
                currency: state.currency || "AED",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        ).format(number);

    } catch (error) {

        return `${state.currency || "AED"} ${number.toFixed(2)}`;

    }

}


function formatCompactCurrency(
    value
) {

    const number =
        Number(value || 0);


    if (Math.abs(number) >= 1000000) {

        return `${state.currency} ${(number / 1000000).toFixed(1)}M`;

    }


    if (Math.abs(number) >= 1000) {

        return `${state.currency} ${(number / 1000).toFixed(1)}K`;

    }


    return `${state.currency} ${number}`;

}


function formatDate(
    date
) {

    if (!date) {
        return "";
    }


    const parsed =
        new Date(date);


    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {

        return date;

    }


    return parsed.toLocaleDateString(
        "en-AE",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


// ============================================================
// TEXT HELPERS
// ============================================================

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


function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}