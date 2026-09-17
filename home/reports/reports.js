/* ==========================================
   QR ORDER SAAS
   PREMIUM OWNER REPORTS
   ========================================== */


/* ==========================================
   CONFIGURATION
   ========================================== */

const REPORTS_WEBHOOK =
    `${N8N_BASE_URL}/owner-reports`;

const SESSION_TOKEN_KEY =
    "qro_session_token";

const SESSION_DATA_KEY =
    "qro_session_data";


/* ==========================================
   STATE
   ========================================== */

let reportData = null;
let performanceChart = null;
let statusChart = null;

let selectedChart =
    "orders";

let currentCurrency =
    "AED";

let currentDateRange =
    "30";

let currentBranchId =
    "";


/* ==========================================
   DOM
   ========================================== */

const dateRange =
    document.getElementById("dateRange");

const branchFilter =
    document.getElementById("branchFilter");

const refreshReport =
    document.getElementById("refreshReport");

const exportReport =
    document.getElementById("exportReport");

const retryReport =
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


/* ==========================================
   INITIALIZATION
   ========================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeReports();

    }
);


/* ==========================================
   INITIALIZE REPORTS
   ========================================== */

async function initializeReports() {

    try {

        loadStoredUser();

        bindEvents();

        currentDateRange =
            dateRange?.value || "30";

        await loadReports();

    } catch (error) {

        console.error(
            "Reports initialization failed:",
            error
        );

        showError(
            "Unable to initialize reports."
        );

    }

}


/* ==========================================
   EVENTS
   ========================================== */

function bindEvents() {

    if (dateRange) {

        dateRange.addEventListener(
            "change",
            async () => {

                currentDateRange =
                    dateRange.value || "30";

                await loadReports();

            }
        );

    }


    if (branchFilter) {

        branchFilter.addEventListener(
            "change",
            async () => {

                currentBranchId =
                    branchFilter.value || "";

                await loadReports();

            }
        );

    }


    if (refreshReport) {

        refreshReport.addEventListener(
            "click",
            async () => {

                await loadReports();

            }
        );

    }


    if (retryReport) {

        retryReport.addEventListener(
            "click",
            async () => {

                await loadReports();

            }
        );

    }


    if (exportReport) {

        exportReport.addEventListener(
            "click",
            exportReportsCSV
        );

    }


    document
        .querySelectorAll(
            ".chart-toggle-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const chartType =
                        button.dataset.chart;

                    if (!chartType) {
                        return;
                    }

                    selectedChart =
                        chartType;

                    document
                        .querySelectorAll(
                            ".chart-toggle-btn"
                        )
                        .forEach(btn => {

                            btn.classList.toggle(
                                "active",
                                btn === button
                            );

                        });

                    renderPerformanceChart();

                }
            );

        });

}


/* ==========================================
   STORED USER
   ========================================== */

function loadStoredUser() {

    try {

        const raw =
            localStorage.getItem(
                SESSION_DATA_KEY
            );

        if (!raw) {
            return;
        }

        const session =
            JSON.parse(raw);

        const ownerName =
            session?.ownerName ||
            session?.OwnerName ||
            session?.client?.ownerName ||
            session?.client?.OwnerName ||
            session?.name ||
            session?.Name ||
            "";

        const role =
            session?.role ||
            session?.Role ||
            "Owner";

        if (
            ownerName &&
            userName
        ) {

            userName.textContent =
                ownerName;

            if (userAvatar) {

                userAvatar.textContent =
                    getInitial(
                        ownerName
                    );

            }

        }

        if (userRole) {

            userRole.textContent =
                role;

        }

    } catch (error) {

        console.warn(
            "Unable to read stored session data:",
            error
        );

    }

}


/* ==========================================
   LOAD REPORTS
   ========================================== */

async function loadReports() {

    const sessionToken =
        localStorage.getItem(
            SESSION_TOKEN_KEY
        );

    if (!sessionToken) {

        showError(
            "Your session has expired. Please sign in again."
        );

        return;

    }


    showLoading();


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
                        dateRange:
                            currentDateRange,
                        branchId:
                            currentBranchId
                    })
                }
            );


        if (!response.ok) {

            throw new Error(
                `Request failed with status ${response.status}.`
            );

        }


        const data =
            await response.json();


        console.log(
            "Owner Reports response:",
            data
        );


        if (
            !data ||
            data.success !== true
        ) {

            handleReportsError(
                data
            );

            return;

        }


        if (
            data.code !==
            "REPORTS_DATA_READY"
        ) {

            handleReportsError(
                data
            );

            return;

        }


        reportData =
            data;


        currentCurrency =
            data.restaurant?.currency ||
            "AED";


        currentDateRange =
            String(
                data.reportDateRange?.days ||
                currentDateRange ||
                "30"
            );


        populateBranchFilter(
            data.branches || []
        );


        renderReports();


        hideError();

        hideLoading();

        reportContent
            ?.classList.remove(
                "hidden"
            );

    } catch (error) {

        console.error(
            "Reports request failed:",
            error
        );

        showError(
            "Unable to load report data. Please try again."
        );

    }

}


/* ==========================================
   REPORTS ERROR
   ========================================== */

function handleReportsError(
    data
) {

    const code =
        data?.code || "";

    const message =
        data?.message ||
        "Unable to load report data.";


    if (
        code ===
            "INVALID_SESSION" ||
        code ===
            "SESSION_TOKEN_MISSING"
    ) {

        showError(
            "Your session is invalid or expired. Please sign in again."
        );

        return;

    }


    showError(
        message
    );

}


/* ==========================================
   RENDER REPORTS
   ========================================== */

function renderReports() {

    renderExecutiveSummary();

    renderPeriodInformation();

    renderPerformanceChart();

    renderDailyOrders();

    renderStatusChart();

    renderMenuPerformance();

    renderBranchPerformance();

    updateOwnerInformation();

}


/* ==========================================
   OWNER INFORMATION
   ========================================== */

function updateOwnerInformation() {

    const ownerNameValue =
        reportData?.client?.ownerName ||
        reportData?.client?.OwnerName ||
        "";

    const role =
        reportData?.role ||
        "Owner";


    if (
        ownerNameValue &&
        userName
    ) {

        userName.textContent =
            ownerNameValue;

        if (userAvatar) {

            userAvatar.textContent =
                getInitial(
                    ownerNameValue
                );

        }

    }


    if (userRole) {

        userRole.textContent =
            role;

    }

}


/* ==========================================
   EXECUTIVE SUMMARY
   ========================================== */

function renderExecutiveSummary() {

    const summary =
        reportData?.reports
            ?.executiveSummary ||
        {};


    const totalOrders =
        Number(
            summary.totalOrders || 0
        );

    const totalRevenue =
        Number(
            summary.totalRevenue || 0
        );

    const averageOrderValue =
        Number(
            summary.averageOrderValue || 0
        );

    const customers =
        Number(
            summary.customers || 0
        );


    setText(
        "totalOrders",
        formatNumber(
            totalOrders
        )
    );


    setText(
        "totalRevenue",
        formatCurrency(
            totalRevenue
        )
    );


    setText(
        "averageOrderValue",
        formatCurrency(
            averageOrderValue
        )
    );


    setText(
        "totalCustomers",
        formatNumber(
            customers
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

}


/* ==========================================
   PERIOD INFORMATION
   ========================================== */

function renderPeriodInformation() {

    const range =
        reportData?.reportDateRange ||
        {};

    const days =
        Number(
            range.days ||
            currentDateRange ||
            30
        );

    const label =
        getDateRangeLabel(
            days
        );


    setText(
        "periodLabel",
        label
    );

    setText(
        "chartDateLabel",
        label
    );


    if (dateRange) {

        dateRange.value =
            String(days);

    }

}


/* ==========================================
   PERFORMANCE CHART
   ========================================== */

function renderPerformanceChart() {

    if (
        typeof Chart ===
        "undefined"
    ) {

        console.warn(
            "Chart.js is not available."
        );

        return;

    }


    const canvas =
        document.getElementById(
            "performanceChart"
        );

    if (!canvas) {
        return;
    }


    const performance =
        reportData?.reports
            ?.performance || {};


    const daily =
        Array.isArray(
            performance.daily
        )
            ? performance.daily
            : [];


    const labels =
        daily.map(
            item =>
                formatChartDate(
                    item.date
                )
        );


    const values =
        daily.map(
            item => {

                if (
                    selectedChart ===
                    "revenue"
                ) {

                    return Number(
                        item.revenue || 0
                    );

                }

                return Number(
                    item.orders || 0
                );

            }
        );


    const total =
        values.reduce(
            (sum, value) =>
                sum + value,
            0
        );


    if (
        selectedChart ===
        "revenue"
    ) {

        setText(
            "chartMetricLabel",
            "Total Revenue"
        );

        setText(
            "chartMetricValue",
            formatCurrency(
                total
            )
        );

    } else {

        setText(
            "chartMetricLabel",
            "Total Orders"
        );

        setText(
            "chartMetricValue",
            formatNumber(
                total
            )
        );

    }


    if (performanceChart) {

        performanceChart.destroy();

        performanceChart =
            null;

    }


    const context =
        canvas.getContext(
            "2d"
        );


    performanceChart =
        new Chart(
            context,
            {
                type: "line",

                data: {
                    labels,

                    datasets: [
                        {
                            label:
                                selectedChart ===
                                "revenue"
                                    ? "Revenue"
                                    : "Orders",

                            data: values,

                            borderColor:
                                "#172033",

                            backgroundColor:
                                "rgba(23, 32, 51, 0.07)",

                            borderWidth: 2,

                            fill: true,

                            tension: 0.4,

                            pointRadius:
                                daily.length <=
                                14
                                    ? 3
                                    : 0,

                            pointHoverRadius: 5,

                            pointBackgroundColor:
                                "#b8892d",

                            pointBorderColor:
                                "#ffffff",

                            pointBorderWidth: 2
                        }
                    ]
                },

                options: {
                    responsive: true,

                    maintainAspectRatio:
                        false,

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

                            borderColor:
                                "rgba(212, 175, 55, 0.35)",

                            borderWidth: 1,

                            padding: 12,

                            displayColors:
                                false,

                            callbacks: {

                                label:
                                    context => {

                                        const value =
                                            Number(
                                                context.raw ||
                                                0
                                            );

                                        if (
                                            selectedChart ===
                                            "revenue"
                                        ) {

                                            return (
                                                "Revenue: " +
                                                formatCurrency(
                                                    value
                                                )
                                            );

                                        }

                                        return (
                                            "Orders: " +
                                            formatNumber(
                                                value
                                            )
                                        );

                                    }

                            }

                        }

                    },

                    scales: {

                        x: {

                            grid: {
                                display: false
                            },

                            ticks: {

                                color:
                                    "#8992a2",

                                font: {
                                    size: 10
                                },

                                maxTicksLimit:
                                    10
                            }

                        },

                        y: {

                            beginAtZero: true,

                            grid: {

                                color:
                                    "rgba(23, 32, 51, 0.06)"
                            },

                            ticks: {

                                color:
                                    "#8992a2",

                                font: {
                                    size: 10
                                },

                                precision: 0,

                                callback:
                                    value => {

                                        if (
                                            selectedChart ===
                                            "revenue"
                                        ) {

                                            return formatCompactCurrency(
                                                value
                                            );

                                        }

                                        return formatCompactNumber(
                                            value
                                        );

                                    }

                            }

                        }

                    }
                }
            }
        );

}


/* ==========================================
   DAILY ORDERS
   ========================================== */

function renderDailyOrders() {

    const container =
        document.getElementById(
            "dailyOrdersList"
        );

    if (!container) {
        return;
    }


    const daily =
        reportData?.reports
            ?.performance
            ?.daily;


    if (
        !Array.isArray(daily) ||
        daily.length === 0
    ) {

        container.innerHTML =
            createEmptyState(
                "📊",
                "No order activity",
                "There are no orders available for the selected reporting period."
            );

        return;

    }


    const normalized =
        daily.map(
            item => ({
                date:
                    item.date,

                orders:
                    Number(
                        item.orders || 0
                    )
            })
        );


    const maxOrders =
        Math.max(
            ...normalized.map(
                item =>
                    item.orders
            ),
            1
        );


    container.innerHTML =
        normalized
            .map(
                item => {

                    const percentage =
                        Math.max(
                            0,
                            Math.min(
                                100,
                                (
                                    item.orders /
                                    maxOrders
                                ) *
                                100
                            )
                        );


                    return `
                        <div class="daily-order-row">

                            <span class="daily-order-date">
                                ${escapeHTML(
                                    formatReadableDate(
                                        item.date
                                    )
                                )}
                            </span>

                            <div class="daily-order-track">
                                <div
                                    class="daily-order-fill"
                                    style="width:${percentage}%"
                                ></div>
                            </div>

                            <strong class="daily-order-value">
                                ${formatNumber(
                                    item.orders
                                )}
                            </strong>

                        </div>
                    `;

                }
            )
            .join("");

}


/* ==========================================
   STATUS CHART
   ========================================== */

function renderStatusChart() {

    if (
        typeof Chart ===
        "undefined"
    ) {
        return;
    }


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
        reportData?.reports
            ?.orderPerformance
            ?.statuses;


    const normalized =
        Array.isArray(statuses)
            ? statuses
            : [];


    const statusData =
        normalized
            .map(
                item => ({
                    status:
                        item.status ||
                        "Unknown",

                    count:
                        Number(
                            item.count ||
                            item.orders ||
                            0
                        )
                })
            )
            .filter(
                item =>
                    item.count > 0
            );


    if (
        statusChart
    ) {

        statusChart.destroy();

        statusChart =
            null;

    }


    if (
        statusData.length === 0
    ) {

        if (legend) {

            legend.innerHTML =
                createEmptyState(
                    "📦",
                    "No order statuses",
                    "No order status data is available for this period."
                );

        }

        return;

    }


    const labels =
        statusData.map(
            item =>
                formatStatus(
                    item.status
                )
        );


    const values =
        statusData.map(
            item =>
                item.count
        );


    const colors =
        statusData.map(
            item =>
                getStatusColor(
                    item.status
                )
        );


    const context =
        canvas.getContext(
            "2d"
        );


    statusChart =
        new Chart(
            context,
            {
                type: "doughnut",

                data: {

                    labels,

                    datasets: [
                        {
                            data:
                                values,

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

                    maintainAspectRatio:
                        false,

                    cutout:
                        "68%",

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {

                            backgroundColor:
                                "#172033",

                            padding: 11,

                            displayColors:
                                true,

                            callbacks: {

                                label:
                                    context => {

                                        return (
                                            " " +
                                            formatNumber(
                                                context.raw
                                            ) +
                                            " orders"
                                        );

                                    }

                            }

                        }

                    }

                }

            }
        );


    if (legend) {

        const total =
            values.reduce(
                (sum, value) =>
                    sum + value,
                0
            );


        legend.innerHTML =
            statusData
                .map(
                    item => {

                        const percentage =
                            total > 0
                                ? (
                                    item.count /
                                    total
                                ) *
                                100
                                : 0;


                        return `
                            <div class="status-legend-item">

                                <span class="status-legend-name">

                                    <span
                                        class="status-legend-dot"
                                        style="background:${getStatusColor(
                                            item.status
                                        )}"
                                    ></span>

                                    ${escapeHTML(
                                        formatStatus(
                                            item.status
                                        )
                                    )}

                                </span>

                                <span class="status-legend-value">

                                    ${formatNumber(
                                        item.count
                                    )}
                                    <small style="
                                        color:#94a3b8;
                                        font-weight:500;
                                        margin-left:4px;
                                    ">
                                        ${percentage.toFixed(
                                            0
                                        )}%
                                    </small>

                                </span>

                            </div>
                        `;

                    }
                )
                .join("");

    }

}


/* ==========================================
   MENU PERFORMANCE
   ========================================== */

function renderMenuPerformance() {

    const topSellingContainer =
        document.getElementById(
            "topSellingItems"
        );

    const revenueContainer =
        document.getElementById(
            "revenueItems"
        );


    const menuPerformance =
        reportData?.reports
            ?.menuPerformance ||
        {};


    const topSelling =
        Array.isArray(
            menuPerformance.topSellingItems
        )
            ? menuPerformance.topSellingItems
            : [];


    const revenueItems =
        Array.isArray(
            menuPerformance.revenueItems
        )
            ? menuPerformance.revenueItems
            : [];


    if (
        topSellingContainer
    ) {

        renderItemRanking(
            topSellingContainer,
            topSelling,
            "quantity"
        );

    }


    if (
        revenueContainer
    ) {

        renderItemRanking(
            revenueContainer,
            revenueItems,
            "revenue"
        );

    }

}


/* ==========================================
   ITEM RANKING
   ========================================== */

function renderItemRanking(
    container,
    items,
    metric
) {

    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        container.innerHTML =
            createEmptyState(
                "🍽️",
                "No menu data",
                "No menu performance data is available for this period."
            );

        return;

    }


    container.innerHTML =
        items
            .slice(0, 10)
            .map(
                (item, index) => {

                    const name =
                        item.itemName ||
                        item.ItemName ||
                        item.name ||
                        "Unknown Item";


                    const quantity =
                        Number(
                            item.quantity ||
                            item.qty ||
                            item.units ||
                            0
                        );


                    const revenue =
                        Number(
                            item.revenue ||
                            item.totalRevenue ||
                            0
                        );


                    let value =
                        "";

                    let meta =
                        "";


                    if (
                        metric ===
                        "revenue"
                    ) {

                        value =
                            formatCurrency(
                                revenue
                            );

                        meta =
                            `${formatNumber(
                                quantity
                            )} sold`;

                    } else {

                        value =
                            formatNumber(
                                quantity
                            );

                        meta =
                            "units sold";

                    }


                    return `
                        <div class="item-ranking-row">

                            <div class="item-ranking-position">
                                ${index + 1}
                            </div>

                            <div class="item-ranking-info">

                                <span
                                    class="item-ranking-name"
                                    title="${escapeAttribute(
                                        name
                                    )}"
                                >
                                    ${escapeHTML(
                                        name
                                    )}
                                </span>

                                <span class="item-ranking-meta">
                                    ${escapeHTML(
                                        meta
                                    )}
                                </span>

                            </div>

                            <strong class="item-ranking-value">
                                ${escapeHTML(
                                    value
                                )}
                            </strong>

                        </div>
                    `;

                }
            )
            .join("");

}


/* ==========================================
   BRANCH PERFORMANCE
   ========================================== */

function renderBranchPerformance() {

    const tbody =
        document.getElementById(
            "branchTableBody"
        );

    const emptyState =
        document.getElementById(
            "branchEmptyState"
        );


    if (!tbody) {
        return;
    }


    const branchPerformance =
        reportData?.reports
            ?.branchPerformance;


    const branches =
        Array.isArray(
            branchPerformance
        )
            ? branchPerformance
            : [];


    if (
        branches.length === 0
    ) {

        tbody.innerHTML =
            "";

        if (emptyState) {

            emptyState.classList.remove(
                "hidden"
            );

        }

        return;

    }


    if (emptyState) {

        emptyState.classList.add(
            "hidden"
        );

    }


    tbody.innerHTML =
        branches
            .map(
                branch => {

                    const name =
                        branch.branchName ||
                        branch.BranchName ||
                        "Unknown Branch";


                    const orders =
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
                            branch.average ||
                            (
                                orders > 0
                                    ? revenue /
                                      orders
                                    : 0
                            )
                        );


                    return `
                        <tr>

                            <td>
                                ${escapeHTML(
                                    name
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    orders
                                )}
                            </td>

                            <td>
                                ${formatCurrency(
                                    revenue
                                )}
                            </td>

                            <td>
                                ${formatCurrency(
                                    average
                                )}
                            </td>

                        </tr>
                    `;

                }
            )
            .join("");

}


/* ==========================================
   BRANCH FILTER
   ========================================== */

function populateBranchFilter(
    branches
) {

    if (!branchFilter) {
        return;
    }


    const previousValue =
        currentBranchId ||
        branchFilter.value ||
        "";


    branchFilter.innerHTML =
        `
            <option value="">
                All Branches
            </option>
        `;


    if (
        !Array.isArray(branches)
    ) {
        return;
    }


    branches
        .forEach(
            branch => {

                const branchId =
                    branch.branchId ||
                    branch.BranchId ||
                    branch.BranchID ||
                    "";


                const branchName =
                    branch.branchName ||
                    branch.BranchName ||
                    branch.BranchOutlet ||
                    branch.name ||
                    "Branch";


                if (!branchId) {
                    return;
                }


                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    branchId;

                option.textContent =
                    branchName;


                branchFilter.appendChild(
                    option
                );

            }
        );


    const exists =
        Array.from(
            branchFilter.options
        ).some(
            option =>
                option.value ===
                previousValue
        );


    if (exists) {

        branchFilter.value =
            previousValue;

        currentBranchId =
            previousValue;

    } else {

        branchFilter.value =
            "";

        currentBranchId =
            "";

    }

}


/* ==========================================
   CHANGE RENDERING
   ========================================== */

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


    const numeric =
        Number(value);


    element.classList.remove(
        "positive",
        "negative",
        "neutral"
    );


    if (
        !Number.isFinite(
            numeric
        )
    ) {

        element.textContent =
            "—";

        element.classList.add(
            "neutral"
        );

        return;

    }


    if (numeric > 0) {

        element.textContent =
            `↑ ${formatPercentage(
                numeric
            )}`;

        element.classList.add(
            "positive"
        );

        return;

    }


    if (numeric < 0) {

        element.textContent =
            `↓ ${formatPercentage(
                Math.abs(
                    numeric
                )
            )}`;

        element.classList.add(
            "negative"
        );

        return;

    }


    element.textContent =
        "0%";

    element.classList.add(
        "neutral"
    );

}


/* ==========================================
   LOADING STATE
   ========================================== */

function showLoading() {

    loadingState
        ?.classList.remove(
            "hidden"
        );

    errorState
        ?.classList.add(
            "hidden"
        );

    reportContent
        ?.classList.add(
            "hidden"
        );

}


function hideLoading() {

    loadingState
        ?.classList.add(
            "hidden"
        );

}


/* ==========================================
   ERROR STATE
   ========================================== */

function showError(
    message
) {

    hideLoading();


    if (errorMessage) {

        errorMessage.textContent =
            message;

    }


    errorState
        ?.classList.remove(
            "hidden"
        );

    reportContent
        ?.classList.add(
            "hidden"
        );

}


function hideError() {

    errorState
        ?.classList.add(
            "hidden"
        );

}


/* ==========================================
   EMPTY STATE
   ========================================== */

function createEmptyState(
    icon,
    title,
    message
) {

    return `
        <div class="reports-empty-state">

            <div class="reports-empty-icon">
                ${icon}
            </div>

            <div class="reports-empty-title">
                ${escapeHTML(
                    title
                )}
            </div>

            <div class="reports-empty-text">
                ${escapeHTML(
                    message
                )}
            </div>

        </div>
    `;

}


/* ==========================================
   CSV EXPORT
   ========================================== */

function exportReportsCSV() {

    if (!reportData) {

        showError(
            "There is no report data available to export."
        );

        return;

    }


    const rows = [];


    const summary =
        reportData.reports
            ?.executiveSummary ||
        {};


    rows.push([
        "QR Order SaaS Report"
    ]);

    rows.push([
        "Reporting Period",
        getDateRangeLabel(
            reportData.reportDateRange
                ?.days || currentDateRange
        )
    ]);

    rows.push([]);

    rows.push([
        "Executive Summary"
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
        formatCurrency(
            summary.totalRevenue || 0
        )
    ]);

    rows.push([
        "Average Order Value",
        formatCurrency(
            summary.averageOrderValue || 0
        )
    ]);

    rows.push([
        "Customers",
        summary.customers || 0
    ]);

    rows.push([]);

    rows.push([
        "Daily Performance"
    ]);

    rows.push([
        "Date",
        "Orders",
        "Revenue"
    ]);


    const daily =
        reportData.reports
            ?.performance
            ?.daily || [];


    daily.forEach(
        item => {

            rows.push([
                item.date || "",
                Number(
                    item.orders || 0
                ),
                formatCurrencyValue(
                    item.revenue || 0
                )
            ]);

        }
    );


    rows.push([]);

    rows.push([
        "Branch Performance"
    ]);

    rows.push([
        "Branch",
        "Orders",
        "Revenue",
        "Average Order Value"
    ]);


    const branches =
        reportData.reports
            ?.branchPerformance || [];


    branches.forEach(
        branch => {

            const orders =
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
                orders > 0
                    ? revenue / orders
                    : 0;


            rows.push([
                branch.branchName ||
                    branch.BranchName ||
                    "",
                orders,
                formatCurrencyValue(
                    revenue
                ),
                formatCurrencyValue(
                    average
                )
            ]);

        }
    );


    const csv =
        rows
            .map(
                row =>
                    row
                        .map(
                            value =>
                                csvEscape(
                                    value
                                )
                        )
                        .join(",")
            )
            .join("\n");


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

    link.href =
        url;

    link.download =
        `QR-Order-Reports-${getFileDate()}.csv`;


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


/* ==========================================
   FORMATTING
   ========================================== */

function formatCurrency(
    value
) {

    const numeric =
        Number(value || 0);


    try {

        return new Intl.NumberFormat(
            "en-AE",
            {
                style: "currency",

                currency:
                    currentCurrency,

                maximumFractionDigits:
                    2
            }
        ).format(
            numeric
        );

    } catch (error) {

        return `${currentCurrency} ${numeric.toFixed(2)}`;

    }

}


function formatCurrencyValue(
    value
) {

    return Number(
        value || 0
    ).toFixed(2);

}


function formatNumber(
    value
) {

    const numeric =
        Number(value || 0);


    return new Intl.NumberFormat(
        "en-US"
    ).format(
        numeric
    );

}


function formatPercentage(
    value
) {

    const numeric =
        Number(value || 0);


    return `${numeric.toFixed(
        1
    )}%`;

}


function formatCompactNumber(
    value
) {

    const numeric =
        Number(value || 0);


    if (
        Math.abs(
            numeric
        ) >= 1000000
    ) {

        return (
            (
                numeric /
                1000000
            ).toFixed(1) +
            "M"
        );

    }


    if (
        Math.abs(
            numeric
        ) >= 1000
    ) {

        return (
            (
                numeric /
                1000
            ).toFixed(1) +
            "K"
        );

    }


    return formatNumber(
        numeric
    );

}


function formatCompactCurrency(
    value
) {

    const numeric =
        Number(value || 0);


    if (
        Math.abs(
            numeric
        ) >= 1000000
    ) {

        return (
            currentCurrency +
            " " +
            (
                numeric /
                1000000
            ).toFixed(1) +
            "M"
        );

    }


    if (
        Math.abs(
            numeric
        ) >= 1000
    ) {

        return (
            currentCurrency +
            " " +
            (
                numeric /
                1000
            ).toFixed(1) +
            "K"
        );

    }


    return (
        currentCurrency +
        " " +
        numeric.toFixed(0)
    );

}


/* ==========================================
   DATE FORMATTING
   ========================================== */

function formatChartDate(
    dateValue
) {

    if (!dateValue) {
        return "";
    }


    const date =
        parseDateValue(
            dateValue
        );


    if (!date) {
        return String(
            dateValue
        );
    }


    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric"
        }
    );

}


function formatReadableDate(
    dateValue
) {

    if (!dateValue) {
        return "Unknown";
    }


    const date =
        parseDateValue(
            dateValue
        );


    if (!date) {

        return String(
            dateValue
        );

    }


    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric"
        }
    );

}


function parseDateValue(
    value
) {

    if (
        value instanceof Date
    ) {

        return isNaN(
            value.getTime()
        )
            ? null
            : value;

    }


    const date =
        new Date(
            value
        );


    return isNaN(
        date.getTime()
    )
        ? null
        : date;

}


function getDateRangeLabel(
    days
) {

    const numeric =
        Number(days);


    switch (numeric) {

        case 7:
            return "Last 7 Days";

        case 14:
            return "Last 14 Days";

        case 30:
            return "Last 30 Days";

        case 90:
            return "Last 90 Days";

        default:
            return `Last ${numeric} Days`;

    }

}


function getFileDate() {

    const date =
        new Date();


    return [
        date.getFullYear(),

        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        ),

        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        )
    ].join("-");

}


/* ==========================================
   STATUS HELPERS
   ========================================== */

function formatStatus(
    status
) {

    if (!status) {
        return "Unknown";
    }


    return String(
        status
    )
        .trim()
        .replace(
            /[_-]+/g,
            " "
        )
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        );

}


function getStatusColor(
    status
) {

    const normalized =
        String(
            status || ""
        )
            .trim()
            .toLowerCase();


    if (
        normalized.includes(
            "pending"
        )
    ) {

        return "#c9a65d";

    }


    if (
        normalized.includes(
            "accept"
        )
    ) {

        return "#526a55";

    }


    if (
        normalized.includes(
            "ready"
        )
    ) {

        return "#3f7d58";

    }


    if (
        normalized.includes(
            "prepar"
        )
    ) {

        return "#526b8f";

    }


    if (
        normalized.includes(
            "reject"
        )
    ) {

        return "#bd6464";

    }


    if (
        normalized.includes(
            "cancel"
        )
    ) {

        return "#9a6570";

    }


    if (
        normalized.includes(
            "complete"
        ) ||
        normalized.includes(
            "deliver"
        )
    ) {

        return "#567a65";

    }


    return "#7a8496";

}


/* ==========================================
   GENERAL HELPERS
   ========================================== */

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );

    if (element) {

        element.textContent =
            value;

    }

}


function getInitial(
    name
) {

    if (!name) {
        return "A";
    }


    return String(
        name
    )
        .trim()
        .charAt(0)
        .toUpperCase();

}


function csvEscape(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    const stringValue =
        String(
            value
        );


    if (
        /[",\n]/.test(
            stringValue
        )
    ) {

        return `"${stringValue.replace(
            /"/g,
            '""'
        )}"`;

    }


    return stringValue;

}


function escapeHTML(
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


function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}