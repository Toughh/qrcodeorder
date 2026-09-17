// ==========================================
// QR RESTAURANT SAAS
// PREMIUM OWNER REPORTS
// ==========================================


// ==========================================
// CONFIGURATION
// ==========================================

const N8N_REPORTS_WEBHOOK =
    `${N8N_BASE_URL}/owner-reports`;

const SESSION_TOKEN_KEY =
    "qro_session_token";

const SESSION_DATA_KEY =
    "qro_session_data";


// ==========================================
// STATE
// ==========================================

let reportData = null;

let performanceChart = null;
let statusChart = null;

let activeChart = "orders";

let selectedDateRange = "30";
let selectedBranchId = "";


// ==========================================
// DOM
// ==========================================

const loadingState =
    document.getElementById("loadingState");

const errorState =
    document.getElementById("errorState");

const errorMessage =
    document.getElementById("errorMessage");

const reportContent =
    document.getElementById("reportContent");

const dateRangeSelect =
    document.getElementById("dateRange");

const branchFilter =
    document.getElementById("branchFilter");

const ownerNameElement =
    document.getElementById("ownerName");

const ownerAvatar =
    document.getElementById("ownerAvatar");


// ==========================================
// INITIALIZE
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    initializeReports
);


async function initializeReports() {

    const sessionToken =
        localStorage.getItem(
            SESSION_TOKEN_KEY
        );

    if (!sessionToken) {

        redirectToLogin();

        return;
    }


    loadOwnerInformation();

    bindEvents();

    await loadReports();

}


// ==========================================
// EVENTS
// ==========================================

function bindEvents() {

    dateRangeSelect.addEventListener(
        "change",
        async () => {

            selectedDateRange =
                dateRangeSelect.value;

            selectedBranchId =
                branchFilter.value;

            await loadReports();

        }
    );


    branchFilter.addEventListener(
        "change",
        async () => {

            selectedBranchId =
                branchFilter.value;

            await loadReports();

        }
    );


    document
        .getElementById("refreshReport")
        .addEventListener(
            "click",
            loadReports
        );


    document
        .getElementById("retryReport")
        .addEventListener(
            "click",
            loadReports
        );


    document
        .getElementById("exportReport")
        .addEventListener(
            "click",
            exportReport
        );


    document
        .querySelectorAll(".chart-toggle")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".chart-toggle"
                        )
                        .forEach(item =>
                            item.classList.remove(
                                "active"
                            )
                        );

                    button.classList.add(
                        "active"
                    );

                    activeChart =
                        button.dataset.chart;

                    renderPerformanceChart();

                }
            );

        });

}


// ==========================================
// OWNER INFORMATION
// ==========================================

function loadOwnerInformation() {

    try {

        const sessionData =
            JSON.parse(
                localStorage.getItem(
                    SESSION_DATA_KEY
                ) || "{}"
            );


        const ownerName =
            sessionData.ownerName ||
            sessionData.OwnerName ||
            sessionData.name ||
            sessionData.Name ||
            "Owner";


        ownerNameElement.textContent =
            ownerName;


        ownerAvatar.textContent =
            getInitials(ownerName);


    } catch (error) {

        ownerNameElement.textContent =
            "Owner";

        ownerAvatar.textContent =
            "O";

    }

}


function getInitials(name) {

    const parts =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (!parts.length) {
        return "O";
    }


    if (parts.length === 1) {
        return parts[0]
            .substring(0, 1)
            .toUpperCase();
    }


    return (
        parts[0].substring(0, 1) +
        parts[parts.length - 1]
            .substring(0, 1)
    ).toUpperCase();

}


// ==========================================
// LOAD REPORTS
// ==========================================

async function loadReports() {

    const sessionToken =
        localStorage.getItem(
            SESSION_TOKEN_KEY
        );


    if (!sessionToken) {

        redirectToLogin();

        return;
    }


    showLoading();


    try {

        const response =
            await fetch(
                N8N_REPORTS_WEBHOOK,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        sessionToken,
                        dateRange:
                            selectedDateRange,
                        branchId:
                            selectedBranchId
                    })
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        if (
            !data ||
            data.success !== true
        ) {

            handleReportError(
                data?.message ||
                "Unable to load report data."
            );

            return;
        }


        reportData = data;


        populateBranches(
            data.branches || []
        );


        renderReports(data);


        showReportContent();


    } catch (error) {

        console.error(
            "Reports load error:",
            error
        );


        handleReportError(
            "Unable to connect to the reporting service."
        );

    }

}


// ==========================================
// BRANCHES
// ==========================================

function populateBranches(branches) {

    const currentValue =
        selectedBranchId;


    branchFilter.innerHTML =
        `<option value="">All Branches</option>`;


    branches.forEach(branch => {

        if (!branch.branchId) {
            return;
        }


        const option =
            document.createElement(
                "option"
            );


        option.value =
            branch.branchId;


        option.textContent =
            branch.branchName ||
            branch.branchId;


        branchFilter.appendChild(
            option
        );

    });


    branchFilter.value =
        currentValue;


    if (
        branchFilter.value !==
        currentValue
    ) {

        selectedBranchId = "";

    }

}


// ==========================================
// RENDER ALL REPORTS
// ==========================================

function renderReports(data) {

    const reports =
        data.reports || {};


    renderExecutiveSummary(
        reports.executiveSummary || {}
    );


    renderPerformanceChart();


    renderDailyOrders(
        reports.performance?.daily || []
    );


    renderStatus(
        reports.orderPerformance?.statuses || []
    );


    renderMenuPerformance(
        reports.menuPerformance || {}
    );


    renderBranchPerformance(
        reports.branchPerformance || []
    );


    updatePeriodLabels(
        data.reportDateRange || {}
    );

}


// ==========================================
// EXECUTIVE SUMMARY
// ==========================================

function renderExecutiveSummary(summary) {

    setText(
        "totalOrders",
        formatNumber(
            summary.totalOrders || 0
        )
    );


    setText(
        "totalRevenue",
        formatCurrency(
            summary.totalRevenue || 0
        )
    );


    setText(
        "averageOrderValue",
        formatCurrency(
            summary.averageOrderValue || 0
        )
    );


    setText(
        "totalCustomers",
        formatNumber(
            summary.customers || 0
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


// ==========================================
// CHANGE INDICATOR
// ==========================================

function renderChange(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (
        value === undefined ||
        value === null ||
        Number.isNaN(Number(value))
    ) {

        element.textContent = "—";

        element.className =
            "kpi-change neutral";

        return;

    }


    const numericValue =
        Number(value);


    if (
        numericValue === 0
    ) {

        element.textContent =
            "0.0%";

        element.className =
            "kpi-change neutral";

        return;

    }


    const arrow =
        numericValue > 0
            ? "↑"
            : "↓";


    element.textContent =
        `${arrow} ${Math.abs(numericValue).toFixed(1)}%`;


    element.className =
        `kpi-change ${
            numericValue > 0
                ? "positive"
                : "negative"
        }`;

}


// ==========================================
// PERFORMANCE CHART
// ==========================================

function renderPerformanceChart() {

    if (!reportData) {
        return;
    }


    const daily =
        reportData
            .reports
            ?.performance
            ?.daily || [];


    const labels =
        daily.map(
            item =>
                formatShortDate(
                    item.date
                )
        );


    const values =
        daily.map(item => {

            if (
                activeChart ===
                "revenue"
            ) {

                return Number(
                    item.revenue || 0
                );

            }

            return Number(
                item.orders || 0
            );

        });


    const total =
        values.reduce(
            (sum, value) =>
                sum + value,
            0
        );


    setText(
        "chartMetricLabel",
        activeChart === "revenue"
            ? "Total Revenue"
            : "Total Orders"
    );


    setText(
        "chartMetricValue",
        activeChart === "revenue"
            ? formatCurrency(total)
            : formatNumber(total)
    );


    if (performanceChart) {

        performanceChart.destroy();

    }


    const canvas =
        document.getElementById(
            "performanceChart"
        );


    const context =
        canvas.getContext("2d");


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
                                activeChart ===
                                "revenue"
                                    ? "Revenue"
                                    : "Orders",

                            data: values,

                            borderColor:
                                "#6366f1",

                            backgroundColor:
                                "rgba(99,102,241,0.08)",

                            borderWidth: 2,

                            fill: true,

                            tension: 0.4,

                            pointRadius: 3,

                            pointHoverRadius: 5,

                            pointBackgroundColor:
                                "#6366f1"
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
                                "#111827",

                            padding: 11,

                            titleFont: {
                                size: 11
                            },

                            bodyFont: {
                                size: 11
                            },

                            callbacks: {

                                label:
                                    context => {

                                        const value =
                                            context.parsed.y;

                                        return activeChart ===
                                            "revenue"
                                            ? ` Revenue: ${formatCurrency(value)}`
                                            : ` Orders: ${formatNumber(value)}`;

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
                                color: "#9ca3af",
                                font: {
                                    size: 10
                                },
                                maxRotation: 0
                            }

                        },

                        y: {

                            beginAtZero: true,

                            grid: {
                                color:
                                    "#eef0f4"
                            },

                            ticks: {

                                color:
                                    "#9ca3af",

                                font: {
                                    size: 10
                                },

                                callback:
                                    value =>
                                        activeChart ===
                                        "revenue"
                                            ? `AED ${formatCompact(value)}`
                                            : value

                            }

                        }

                    }

                }

            }
        );

}


// ==========================================
// DAILY ORDERS
// ==========================================

function renderDailyOrders(daily) {

    const container =
        document.getElementById(
            "dailyOrdersList"
        );


    container.innerHTML = "";


    if (!daily.length) {

        container.innerHTML =
            `<div class="empty-state">
                No order activity available.
            </div>`;

        return;

    }


    const maxOrders =
        Math.max(
            ...daily.map(
                item =>
                    Number(
                        item.orders || 0
                    )
            ),
            1
        );


    daily.forEach(item => {

        const orders =
            Number(
                item.orders || 0
            );


        const percentage =
            Math.max(
                0,
                Math.min(
                    100,
                    (orders / maxOrders) * 100
                )
            );


        const row =
            document.createElement(
                "div"
            );


        row.className =
            "daily-row";


        row.innerHTML = `
            <span class="daily-date">
                ${formatShortDate(item.date)}
            </span>

            <div class="daily-bar-container">
                <div
                    class="daily-bar"
                    style="width:${percentage}%">
                </div>
            </div>

            <span class="daily-count">
                ${formatNumber(orders)}
            </span>
        `;


        container.appendChild(row);

    });

}


// ==========================================
// STATUS CHART
// ==========================================

function renderStatus(statuses) {

    const normalized =
        statuses.map(item => ({
            status:
                item.status ||
                "Unknown",

            count:
                Number(
                    item.count || 0
                ),

            percentage:
                Number(
                    item.percentage || 0
                )
        }))
        .filter(
            item =>
                item.count > 0
        );


    const total =
        normalized.reduce(
            (sum, item) =>
                sum + item.count,
            0
        );


    if (statusChart) {

        statusChart.destroy();

    }


    const canvas =
        document.getElementById(
            "statusChart"
        );


    statusChart =
        new Chart(
            canvas,
            {
                type: "doughnut",

                data: {

                    labels:
                        normalized.map(
                            item =>
                                item.status
                        ),

                    datasets: [
                        {
                            data:
                                normalized.map(
                                    item =>
                                        item.count
                                ),

                            backgroundColor: [
                                "#6366f1",
                                "#818cf8",
                                "#a5b4fc",
                                "#f59e0b",
                                "#ef4444",
                                "#9ca3af"
                            ],

                            borderWidth: 0,

                            hoverOffset: 4
                        }
                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    cutout: "72%",

                    plugins: {

                        legend: {
                            display: false
                        }

                    }

                }

            }
        );


    const legend =
        document.getElementById(
            "statusLegend"
        );


    legend.innerHTML = "";


    if (!normalized.length) {

        legend.innerHTML =
            `<div class="empty-state">
                No status data available.
            </div>`;

        return;

    }


    normalized.forEach(
        (item, index) => {

            const percentage =
                total > 0
                    ? (
                        item.count /
                        total *
                        100
                    )
                    : 0;


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "status-item";


            row.innerHTML = `

                <div class="status-name">

                    <span
                        class="status-dot"
                        style="
                            background:
                            ${getStatusColor(index)};
                        ">
                    </span>

                    ${escapeHtml(
                        item.status
                    )}

                </div>

                <span class="status-value">
                    ${percentage.toFixed(1)}%
                </span>

            `;


            legend.appendChild(row);

        }
    );

}


// ==========================================
// MENU PERFORMANCE
// ==========================================

function renderMenuPerformance(menuPerformance) {

    const topSelling =
        menuPerformance.topSellingItems ||
        [];


    renderItemList(
        "topSellingItems",
        topSelling,
        "quantity"
    );


    renderItemList(
        "revenueItems",
        [...topSelling].sort(
            (a, b) =>
                Number(
                    b.revenue || 0
                ) -
                Number(
                    a.revenue || 0
                )
        ),
        "revenue"
    );

}


function renderItemList(
    elementId,
    items,
    valueType
) {

    const container =
        document.getElementById(
            elementId
        );


    container.innerHTML = "";


    if (!items.length) {

        container.innerHTML =
            `<div class="empty-state">
                No menu performance data available.
            </div>`;

        return;

    }


    items
        .slice(0, 5)
        .forEach(
            (item, index) => {

                const quantity =
                    Number(
                        item.quantity ||
                        item.orders ||
                        0
                    );


                const revenue =
                    Number(
                        item.revenue ||
                        0
                    );


                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "item-row";


                row.innerHTML = `

                    <div class="item-rank">
                        ${index + 1}
                    </div>

                    <div class="item-info">

                        <div class="item-name">
                            ${escapeHtml(
                                item.itemName ||
                                item.name ||
                                "Unknown Item"
                            )}
                        </div>

                        <div class="item-meta">
                            ${formatNumber(quantity)}
                            sold
                        </div>

                    </div>

                    <div class="item-value">

                        ${
                            valueType ===
                            "revenue"
                                ? formatCurrency(
                                    revenue
                                )
                                : formatNumber(
                                    quantity
                                )
                        }

                    </div>

                `;


                container.appendChild(
                    row
                );

            }
        );

}


// ==========================================
// BRANCH PERFORMANCE
// ==========================================

function renderBranchPerformance(
    branches
) {

    const tbody =
        document.getElementById(
            "branchTableBody"
        );


    const empty =
        document.getElementById(
            "branchEmptyState"
        );


    tbody.innerHTML = "";


    if (!branches.length) {

        empty.classList.remove(
            "hidden"
        );

        return;

    }


    empty.classList.add(
        "hidden"
    );


    branches.forEach(branch => {

        const orders =
            Number(
                branch.orders || 0
            );


        const revenue =
            Number(
                branch.revenue || 0
            );


        const average =
            Number(
                branch.averageOrderValue ||
                branch.avgOrderValue ||
                (
                    orders > 0
                        ? revenue / orders
                        : 0
                )
            );


        const row =
            document.createElement(
                "tr"
            );


        row.innerHTML = `

            <td>

                <span class="branch-name">
                    ${escapeHtml(
                        branch.branchName ||
                        branch.name ||
                        "Unknown Branch"
                    )}
                </span>

                ${
                    branch.city
                        ? `
                            <span class="branch-city">
                                ${escapeHtml(
                                    branch.city
                                )}
                            </span>
                          `
                        : ""
                }

            </td>

            <td>
                ${formatNumber(orders)}
            </td>

            <td>
                ${formatCurrency(revenue)}
            </td>

            <td>
                ${formatCurrency(average)}
            </td>

        `;


        tbody.appendChild(row);

    });

}


// ==========================================
// PERIOD LABELS
// ==========================================

function updatePeriodLabels(
    dateRange
) {

    const days =
        Number(
            dateRange.days ||
            selectedDateRange ||
            30
        );


    const label =
        `Last ${days} Days`;


    setText(
        "periodLabel",
        label
    );


    setText(
        "chartDateLabel",
        label
    );

}


// ==========================================
// EXPORT
// ==========================================

function exportReport() {

    if (!reportData) {
        return;
    }


    const reports =
        reportData.reports || {};


    const summary =
        reports.executiveSummary || {};


    const rows = [];


    rows.push([
        "QR Restaurant SaaS Report"
    ]);


    rows.push([
        "Reporting Period",
        `Last ${selectedDateRange} Days`
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


    rows.push([
        "Branch Performance"
    ]);


    rows.push([
        "Branch",
        "Orders",
        "Revenue",
        "Average Order"
    ]);


    (
        reports.branchPerformance ||
        []
    ).forEach(branch => {

        const orders =
            Number(
                branch.orders || 0
            );


        const revenue =
            Number(
                branch.revenue || 0
            );


        rows.push([
            branch.branchName ||
                branch.name ||
                "",

            orders,

            revenue,

            orders > 0
                ? revenue / orders
                : 0
        ]);

    });


    const csv =
        rows
            .map(row =>
                row
                    .map(csvEscape)
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
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;


    link.download =
        `restaurant-report-${selectedDateRange}-days.csv`;


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    URL.revokeObjectURL(url);

}


// ==========================================
// CSV ESCAPE
// ==========================================

function csvEscape(value) {

    const text =
        String(
            value ?? ""
        );


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


// ==========================================
// FORMATTERS
// ==========================================

function formatNumber(value) {

    return Number(
        value || 0
    ).toLocaleString(
        "en-US"
    );

}


function formatCurrency(value) {

    return `AED ${Number(
        value || 0
    ).toLocaleString(
        "en-US",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    )}`;

}


function formatCompact(value) {

    const number =
        Number(value || 0);


    if (number >= 1000000) {

        return (
            number / 1000000
        ).toFixed(1) + "M";

    }


    if (number >= 1000) {

        return (
            number / 1000
        ).toFixed(1) + "K";

    }


    return number.toFixed(0);

}


function formatShortDate(value) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);

    }


    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric"
        }
    );

}


// ==========================================
// STATUS COLORS
// ==========================================

function getStatusColor(index) {

    const colors = [
        "#6366f1",
        "#818cf8",
        "#a5b4fc",
        "#f59e0b",
        "#ef4444",
        "#9ca3af"
    ];


    return colors[
        index % colors.length
    ];

}


// ==========================================
// SAFE TEXT
// ==========================================

function escapeHtml(value) {

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


// ==========================================
// DOM HELPER
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
// UI STATE
// ==========================================

function showLoading() {

    loadingState.classList.remove(
        "hidden"
    );

    reportContent.classList.add(
        "hidden"
    );

    errorState.classList.add(
        "hidden"
    );

}


function showReportContent() {

    loadingState.classList.add(
        "hidden"
    );

    errorState.classList.add(
        "hidden"
    );

    reportContent.classList.remove(
        "hidden"
    );

}


function handleReportError(
    message
) {

    loadingState.classList.add(
        "hidden"
    );

    reportContent.classList.add(
        "hidden"
    );

    errorState.classList.remove(
        "hidden"
    );


    errorMessage.textContent =
        message;

}


// ==========================================
// LOGIN REDIRECT
// ==========================================

function redirectToLogin() {

    window.location.href =
        "../login/login.html";

}