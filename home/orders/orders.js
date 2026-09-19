// ==========================================
// QR RESTAURANT SAAS
// PREMIUM OWNER ORDERS
// Dashboard / Reports Visual Language
// ==========================================


// ==========================================
// CONFIGURATION
// ==========================================

const N8N_ORDERS_WEBHOOK =
    `${N8N_BASE_URL}/owner-orders`;

const SESSION_TOKEN_KEY =
    "qro_session_token";

const SESSION_DATA_KEY =
    "qro_session_data";

const VALIDATED_SESSION_KEY =
    "qro_validated_session";

const RESTAURANT_TIMEZONE =
    "Asia/Dubai";


// ==========================================
// STATE
// ==========================================

let allOrders = [];

let filteredOrders = [];

let currentPage = 1;

const ordersPerPage = 10;

let currentCurrency = "AED";


// ==========================================
// ELEMENTS
// ==========================================

// KPI cards

const totalOrdersEl =
    document.getElementById("totalOrders");

const pendingOrdersEl =
    document.getElementById("pendingOrders");

const preparingOrdersEl =
    document.getElementById("preparingOrders");

const readyOrdersEl =
    document.getElementById("readyOrders");

const completedOrdersEl =
    document.getElementById("completedOrders");


// Business snapshot

const ordersFilteredRevenueEl =
    document.getElementById("ordersFilteredRevenue");

const ordersAverageValueEl =
    document.getElementById("ordersAverageValue");

const ordersActiveCountEl =
    document.getElementById("ordersActiveCount");

const ordersCompletionRateEl =
    document.getElementById("ordersCompletionRate");


// Filters

const orderSearch =
    document.getElementById("orderSearch");

const branchFilter =
    document.getElementById("branchFilter");

const statusFilter =
    document.getElementById("statusFilter");

const dateFilter =
    document.getElementById("dateFilter");

const resetFilters =
    document.getElementById("resetFilters");


// Table

const ordersTableBody =
    document.getElementById("ordersTableBody");

const ordersEmpty =
    document.getElementById("ordersEmpty");


// Footer

const ordersFrom =
    document.getElementById("ordersFrom");

const ordersTo =
    document.getElementById("ordersTo");

const ordersTotal =
    document.getElementById("ordersTotal");


// Pagination

const previousPage =
    document.getElementById("previousPage");

const paginationPages =
    document.getElementById("paginationPages");

const nextPage =
    document.getElementById("nextPage");


// Modal

const orderModal =
    document.getElementById("orderModal");

const modalOrderId =
    document.getElementById("modalOrderId");

const modalOrderStatus =
    document.getElementById("modalOrderStatus");

const modalCustomer =
    document.getElementById("modalCustomer");

const modalMobile =
    document.getElementById("modalMobile");

const modalBranch =
    document.getElementById("modalBranch");

const modalTable =
    document.getElementById("modalTable");

const modalOrderTime =
    document.getElementById("modalOrderTime");

const modalItems =
    document.getElementById("modalItems");

const modalRequestSection =
    document.getElementById("modalRequestSection");

const modalRequest =
    document.getElementById("modalRequest");

const modalSubtotal =
    document.getElementById("modalSubtotal");

const modalTax =
    document.getElementById("modalTax");

const modalTotal =
    document.getElementById("modalTotal");

const closeOrderModal =
    document.getElementById("closeOrderModal");

const modalCloseButton =
    document.getElementById("modalCloseButton");


// ==========================================
// INITIALIZE
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    initializeOrdersPage
);


// ==========================================
// TOPBAR OWNER
// ==========================================

function updateOrdersTopbarOwner(
    ownerNameFromResponse = null
) {

    let sessionData = null;

    try {

        const storedSession =
            localStorage.getItem(
                SESSION_DATA_KEY
            );

        if (storedSession) {

            sessionData =
                JSON.parse(
                    storedSession
                );

        }

    } catch (error) {

        console.warn(
            "Unable to read session data:",
            error
        );

    }


    const ownerName =
        String(
            ownerNameFromResponse ||
            sessionData?.ownerName ||
            sessionData?.OwnerName ||
            sessionData?.name ||
            sessionData?.Name ||
            "Owner"
        ).trim() || "Owner";


    const ownerRole =
        String(
            sessionData?.role ||
            sessionData?.Role ||
            "Owner"
        ).trim() || "Owner";


    const topbarUserName =
        document.getElementById(
            "topbarUserName"
        );

    if (topbarUserName) {

        topbarUserName.textContent =
            ownerName;

    }


    const topbarUserRole =
        document.getElementById(
            "topbarUserRole"
        );

    if (topbarUserRole) {

        topbarUserRole.textContent =
            ownerRole;

    }


    const topbarUserAvatar =
        document.getElementById(
            "topbarUserAvatar"
        );

    if (topbarUserAvatar) {

        topbarUserAvatar.textContent =
            ownerName
                .charAt(0)
                .toUpperCase();

    }

}


// ==========================================
// INITIALIZE PAGE
// ==========================================

async function initializeOrdersPage() {

    try {

        // ----------------------------------
        // Authentication
        // ----------------------------------

        if (
            typeof requireAuthentication ===
            "function"
        ) {

            const authenticated =
                await requireAuthentication();

            if (authenticated === false) {

                return;

            }

        }


        // ----------------------------------
        // Load Orders
        // ----------------------------------

        await loadOrders();

    } catch (error) {

        console.error(
            "Orders initialization failed:",
            error
        );

        showOrdersError(
            error?.message ||
            "Unable to initialize the Orders page."
        );

    }

}


// ==========================================
// LOAD ORDERS
// ==========================================

async function loadOrders() {

    showLoadingState();

    try {

        const sessionToken =
            localStorage.getItem(
                SESSION_TOKEN_KEY
            );


        if (!sessionToken) {

            redirectToLogin();

            return;

        }


        const response =
            await fetch(
                N8N_ORDERS_WEBHOOK,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        // ----------------------------------
                        // IMPORTANT:
                        // Authorization remains session-based.
                        // Do NOT send restaurantId from Clients.
                        // ----------------------------------

                        sessionToken

                    })

                }
            );


        // ----------------------------------
        // HTTP SESSION FAILURE
        // ----------------------------------

        if (
            response.status === 401 ||
            response.status === 403
        ) {

            handleSessionExpired();

            return;

        }


        if (!response.ok) {

            throw new Error(
                `Orders API returned ${response.status}`
            );

        }


        let rawData =
            await response.json();


        console.log(
            "Orders API Response:",
            rawData
        );


        // ----------------------------------
        // Support n8n array/object response
        // ----------------------------------

        const data =
            Array.isArray(rawData)
                ? rawData[0]
                : rawData;


        if (
            !data ||
            data.success !== true
        ) {

            if (
                data?.code ===
                "INVALID_SESSION"
            ) {

                handleSessionExpired();

                return;

            }


            throw new Error(
                data?.message ||
                "Unable to load orders."
            );

        }


        // ==================================
        // CURRENCY
        // ==================================

        currentCurrency =
            String(
                data.currency ||
                data.settings?.currency ||
                data.restaurant?.currency ||
                data.restaurantSettings?.currency ||
                "AED"
            )
                .trim()
                .toUpperCase() ||
            "AED";


        // ==================================
        // OWNER NAME
        // Display only
        // ==================================

        updateOrdersTopbarOwner(

            data.ownerName ||

            data.OwnerName ||

            data.client?.ownerName ||

            data.client?.OwnerName ||

            null

        );


        // ==================================
        // ORDERS
        // ==================================

        allOrders =
            Array.isArray(data.orders)
                ? data.orders
                    .map(normalizeOrder)
                    .filter(order =>
                        Boolean(
                            order.orderId ||
                            order.orderDate ||
                            order.customerName
                        )
                    )
                : [];


        // ==================================
        // NEWEST FIRST
        // ==================================

        allOrders.sort(
            (a, b) => {

                const dateA =
                    new Date(
                        a.orderDate
                    ).getTime() || 0;

                const dateB =
                    new Date(
                        b.orderDate
                    ).getTime() || 0;

                return dateB - dateA;

            }
        );


        console.log(
            "Normalized Orders:",
            allOrders
        );


        console.log(
            "Orders Count:",
            allOrders.length
        );


        // ==================================
        // BRANCH FILTER
        // ==================================

        populateBranchFilter();


        // ==================================
        // APPLY CURRENT FILTERS
        // ==================================

        applyFilters();


    } catch (error) {

        console.error(
            "Failed to load orders:",
            error
        );

        showOrdersError(
            error?.message ||
            "Unable to load orders. Please try again."
        );

    }

}


// ==========================================
// NORMALIZE ORDER
// ==========================================

function normalizeOrder(order) {

    const source =
        order || {};


    // --------------------------------------
    // Preserve structured orderedItems
    // --------------------------------------

    let orderedItems =
        source.orderedItems ??
        source.OrderedItems ??
        "";


    if (
        orderedItems === null ||
        orderedItems === undefined
    ) {

        orderedItems = "";

    }


    return {

        orderId:
            String(
                source.orderId ??
                source.OrderId ??
                source.id ??
                source.ID ??
                ""
            ).trim(),


        restaurantId:
            String(
                source.restaurantId ??
                source.RestaurantId ??
                ""
            ).trim(),


        branchOutlet:
            String(
                source.branchOutlet ??
                source.BranchOutlet ??
                source.branch ??
                source.Branch ??
                ""
            ).trim(),


        customerName:
            String(
                source.customerName ??
                source.CustomerName ??
                source.customer ??
                source.Customer ??
                ""
            ).trim(),


        mobileNumber:
            String(
                source.mobileNumber ??
                source.MobileNumber ??
                source.mobile ??
                source.Mobile ??
                ""
            ).trim(),


        whatsappNumber:
            String(
                source.whatsappNumber ??
                source.WhatsappNumber ??
                source.WhatsAppNumber ??
                ""
            ).trim(),


        orderedItems:
            orderedItems,


        customizedRequest:
            String(
                source.customizedRequest ??
                source.CustomizedRequest ??
                source.specialRequest ??
                source.SpecialRequest ??
                ""
            ).trim(),


        tableNumber:
            String(
                source.tableNumber ??
                source.TableNumber ??
                source.table ??
                source.Table ??
                ""
            ).trim(),


        deliveryAddress:
            String(
                source.deliveryAddress ??
                source.DeliveryAddress ??
                ""
            ).trim(),


        subTotal:
            toNumber(
                source.subTotal ??
                source.SubTotal ??
                source.subtotal ??
                source.Subtotal
            ),


        taxTotal:
            toNumber(
                source.taxTotal ??
                source.TaxTotal ??
                source.tax ??
                source.Tax
            ),


        total:
            toNumber(
                source.total ??
                source.Total ??
                source.orderTotal ??
                source.OrderTotal
            ),


        taxDetails:
            String(
                source.taxDetails ??
                source.TaxDetails ??
                ""
            ).trim(),


        status:
            String(
                source.status ??
                source.Status ??
                ""
            )
                .trim()
                .toLowerCase(),


        orderDate:
            source.orderDate ??
            source.OrderDate ??
            source.createdAt ??
            source.CreatedAt ??
            ""

    };

}


// ==========================================
// NUMBER NORMALIZATION
// ==========================================

function toNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return 0;

    }


    if (
        typeof value === "number"
    ) {

        return Number.isFinite(value)
            ? value
            : 0;

    }


    const cleaned =
        String(value)
            .replace(
                /[^0-9.-]/g,
                ""
            );


    const number =
        Number(cleaned);


    return Number.isFinite(number)
        ? number
        : 0;

}


// ==========================================
// KPI METRICS
// ==========================================

function updateOrderMetrics(
    orders = filteredOrders
) {

    const source =
        Array.isArray(orders)
            ? orders
            : [];


    const total =
        source.length;


    const pending =
        source.filter(
            order =>
                order.status === "pending"
        ).length;


    const preparing =
        source.filter(
            order =>
                order.status === "preparing"
        ).length;


    const ready =
        source.filter(
            order =>
                order.status === "ready"
        ).length;


    const completed =
        source.filter(
            order =>
                order.status === "completed"
        ).length;


    const active =
        pending +
        preparing +
        ready;


    const revenue =
        source.reduce(
            (sum, order) =>
                sum +
                toNumber(order.total),
            0
        );


    const averageOrderValue =
        total > 0
            ? revenue / total
            : 0;


    const completionRate =
        total > 0
            ? (
                completed /
                total
            ) * 100
            : 0;


    if (totalOrdersEl) {

        totalOrdersEl.textContent =
            total;

    }


    if (pendingOrdersEl) {

        pendingOrdersEl.textContent =
            pending;

    }


    if (preparingOrdersEl) {

        preparingOrdersEl.textContent =
            preparing;

    }


    if (readyOrdersEl) {

        readyOrdersEl.textContent =
            ready;

    }


    if (completedOrdersEl) {

        completedOrdersEl.textContent =
            completed;

    }


    if (ordersFilteredRevenueEl) {

        ordersFilteredRevenueEl.textContent =
            formatCurrency(
                revenue
            );

    }


    if (ordersAverageValueEl) {

        ordersAverageValueEl.textContent =
            formatCurrency(
                averageOrderValue
            );

    }


    if (ordersActiveCountEl) {

        ordersActiveCountEl.textContent =
            active;

    }


    if (ordersCompletionRateEl) {

        ordersCompletionRateEl.textContent =
            `${completionRate.toFixed(1)}%`;

    }

}


// ==========================================
// BRANCH FILTER
// ==========================================

function populateBranchFilter() {

    if (!branchFilter) {

        return;

    }


    const currentValue =
        branchFilter.value;


    const branches =
        [
            ...new Set(
                allOrders
                    .map(
                        order =>
                            order.branchOutlet
                    )
                    .filter(Boolean)
            )
        ]
            .sort(
                (a, b) =>
                    a.localeCompare(b)
            );


    branchFilter.innerHTML = "";


    const allOption =
        document.createElement(
            "option"
        );


    allOption.value =
        "all";


    allOption.textContent =
        "All Branches";


    branchFilter.appendChild(
        allOption
    );


    branches.forEach(
        branch => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                branch;


            option.textContent =
                branch;


            branchFilter.appendChild(
                option
            );

        }
    );


    if (
        currentValue &&
        currentValue !== "all" &&
        branches.includes(
            currentValue
        )
    ) {

        branchFilter.value =
            currentValue;

    } else {

        branchFilter.value =
            "all";

    }

}


// ==========================================
// FILTER EVENTS
// ==========================================

if (orderSearch) {

    orderSearch.addEventListener(
        "input",
        handleFilterChange
    );

}


if (branchFilter) {

    branchFilter.addEventListener(
        "change",
        handleFilterChange
    );

}


if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        handleFilterChange
    );

}


if (dateFilter) {

    dateFilter.addEventListener(
        "change",
        handleFilterChange
    );

}


if (resetFilters) {

    resetFilters.addEventListener(
        "click",
        resetAllFilters
    );

}


function handleFilterChange() {

    currentPage = 1;

    applyFilters();

}


// ==========================================
// APPLY FILTERS
// ==========================================

function applyFilters() {

    const search =
        String(
            orderSearch?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const branch =
        String(
            branchFilter?.value ||
            "all"
        ).trim();


    const status =
        String(
            statusFilter?.value ||
            "all"
        )
            .trim()
            .toLowerCase();


    const dateRange =
        String(
            dateFilter?.value ||
            "today"
        )
            .trim()
            .toLowerCase();


    filteredOrders =
        allOrders.filter(
            order => {

                // ----------------------------------
                // SEARCH
                // ----------------------------------

                if (search) {

                    const searchableText =
                        [

                            order.orderId,

                            order.customerName,

                            order.mobileNumber,

                            order.whatsappNumber,

                            order.branchOutlet,

                            order.tableNumber,

                            getOrderedItemsSearchText(
                                order.orderedItems
                            ),

                            order.customizedRequest

                        ]
                            .join(" ")
                            .toLowerCase();


                    if (
                        !searchableText.includes(
                            search
                        )
                    ) {

                        return false;

                    }

                }


                // ----------------------------------
                // BRANCH
                // ----------------------------------

                if (
                    branch &&
                    branch !== "all" &&
                    order.branchOutlet !==
                    branch
                ) {

                    return false;

                }


                // ----------------------------------
                // STATUS
                // ----------------------------------

                if (
                    status &&
                    status !== "all" &&
                    order.status !==
                    status
                ) {

                    return false;

                }


                // ----------------------------------
                // DATE
                // ----------------------------------

                if (
                    !matchesDateFilter(
                        order,
                        dateRange
                    )
                ) {

                    return false;

                }


                return true;

            }
        );


    // --------------------------------------
    // BUSINESS METRICS
    // --------------------------------------

    updateOrderMetrics(
        filteredOrders
    );


    // --------------------------------------
    // RENDER
    // --------------------------------------

    renderOrders();

}


// ==========================================
// ORDER ITEM SEARCH TEXT
// ==========================================

function getOrderedItemsSearchText(
    items
) {

    if (
        items === null ||
        items === undefined
    ) {

        return "";

    }


    if (
        Array.isArray(items)
    ) {

        return items
            .map(
                item =>
                    [

                        item?.name,

                        item?.itemName,

                        item?.ItemName,

                        item?.title,

                        item?.Title

                    ]
                        .filter(Boolean)
                        .join(" ")
            )
            .join(" ");

    }


    if (
        typeof items === "object"
    ) {

        return JSON.stringify(
            items
        );

    }


    return String(items);

}


// ==========================================
// DATE FILTER
// ==========================================

function matchesDateFilter(
    order,
    filter
) {

    if (
        !filter ||
        filter === "all"
    ) {

        return true;

    }


    const orderDate =
        new Date(
            order.orderDate
        );


    if (
        Number.isNaN(
            orderDate.getTime()
        )
    ) {

        return false;

    }


    const todayKey =
        getDubaiDateKey(
            new Date()
        );


    const orderKey =
        getDubaiDateKey(
            orderDate
        );


    // --------------------------------------
    // TODAY
    // --------------------------------------

    if (
        filter === "today"
    ) {

        return (
            orderKey ===
            todayKey
        );

    }


    // --------------------------------------
    // ROLLING RANGES
    // --------------------------------------

    const days =
        filter === "7"
            ? 7
            : filter === "14"
                ? 14
                : filter === "30"
                    ? 30
                    : null;


    if (!days) {

        return true;

    }


    const startKey =
        shiftDubaiDateKey(
            todayKey,
            -(days - 1)
        );


    return (
        orderKey >= startKey &&
        orderKey <= todayKey
    );

}


// ==========================================
// DUBAI DATE KEY
// ==========================================

function getDubaiDateKey(
    date
) {

    try {

        const parts =
            new Intl.DateTimeFormat(
                "en-CA",
                {
                    timeZone:
                        RESTAURANT_TIMEZONE,

                    year:
                        "numeric",

                    month:
                        "2-digit",

                    day:
                        "2-digit"
                }
            )
                .formatToParts(
                    date
                );


        const values = {};


        parts.forEach(
            part => {

                if (
                    part.type !==
                    "literal"
                ) {

                    values[
                        part.type
                    ] =
                        part.value;

                }

            }
        );


        return (
            `${values.year}-${values.month}-${values.day}`
        );

    } catch (error) {

        console.warn(
            "Unable to create Dubai date key:",
            error
        );

        return "";

    }

}


// ==========================================
// SHIFT DUBAI DATE KEY
// ==========================================

function shiftDubaiDateKey(
    dateKey,
    offsetDays
) {

    const [
        year,
        month,
        day
    ] =
        String(
            dateKey
        )
            .split("-")
            .map(Number);


    const date =
        new Date(
            Date.UTC(
                year,
                month - 1,
                day
            )
        );


    date.setUTCDate(
        date.getUTCDate() +
        offsetDays
    );


    return [

        date.getUTCFullYear(),

        String(
            date.getUTCMonth() + 1
        ).padStart(
            2,
            "0"
        ),

        String(
            date.getUTCDate()
        ).padStart(
            2,
            "0"
        )

    ].join("-");

}


// ==========================================
// RESET FILTERS
// ==========================================

function resetAllFilters() {

    if (orderSearch) {

        orderSearch.value =
            "";

    }


    if (branchFilter) {

        branchFilter.value =
            "all";

    }


    if (statusFilter) {

        statusFilter.value =
            "all";

    }


    if (dateFilter) {

        // Match HTML default.
        dateFilter.value =
            "today";

    }


    currentPage = 1;

    applyFilters();

}


// ==========================================
// RENDER ORDERS
// ==========================================

function renderOrders() {

    if (!ordersTableBody) {

        return;

    }


    ordersTableBody.innerHTML =
        "";


    // --------------------------------------
    // EMPTY STATE
    // --------------------------------------

    if (
        !filteredOrders.length
    ) {

        showOrdersEmpty();

        updatePagination(
            0
        );

        updateOrdersFooter(
            0,
            0,
            0
        );

        return;

    }


    hideOrdersEmpty();


    // --------------------------------------
    // PAGINATION
    // --------------------------------------

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filteredOrders.length /
                ordersPerPage
            )
        );


    if (
        currentPage >
        totalPages
    ) {

        currentPage =
            totalPages;

    }


    const startIndex =
        (
            currentPage -
            1
        ) *
        ordersPerPage;


    const endIndex =
        Math.min(
            startIndex +
            ordersPerPage,
            filteredOrders.length
        );


    const pageOrders =
        filteredOrders.slice(
            startIndex,
            endIndex
        );


    // --------------------------------------
    // RENDER ROWS
    // --------------------------------------

    pageOrders.forEach(
        order => {

            const row =
                document.createElement(
                    "tr"
                );


            const statusClass =
                normalizeStatusClass(
                    order.status
                );


            const statusLabel =
                capitalizeStatus(
                    order.status
                );


            row.innerHTML = `

                <td>
                    <div class="order-id-cell">
                        ${escapeHtml(
                            order.orderId ||
                            "—"
                        )}
                    </div>
                </td>


                <td>
                    <div class="customer-cell">

                        <div class="customer-name">
                            ${escapeHtml(
                                order.customerName ||
                                "Guest"
                            )}
                        </div>

                        ${
                            order.mobileNumber ||
                            order.whatsappNumber
                                ? `
                                    <div class="customer-contact">
                                        ${escapeHtml(
                                            order.mobileNumber ||
                                            order.whatsappNumber
                                        )}
                                    </div>
                                  `
                                : ""
                        }

                    </div>
                </td>


                <td>
                    <span class="branch-name">
                        ${escapeHtml(
                            order.branchOutlet ||
                            "—"
                        )}
                    </span>
                </td>


                <td>
                    <span class="table-number">
                        ${
                            order.tableNumber
                                ? `Table ${escapeHtml(
                                    order.tableNumber
                                )}`
                                : "—"
                        }
                    </span>
                </td>


                <td>
                    <span class="order-amount">
                        ${formatCurrency(
                            order.total
                        )}
                    </span>
                </td>


                <td>
                    <span class="status-badge status-${statusClass}">
                        ${escapeHtml(
                            statusLabel
                        )}
                    </span>
                </td>


                <td>
                    <span class="order-time">
                        ${formatOrderDate(
                            order.orderDate
                        )}
                    </span>
                </td>


                <td>
                    <button
                        type="button"
                        class="order-view-btn"
                        data-order-id="${escapeHtml(
                            order.orderId
                        )}"
                    >
                        View
                    </button>
                </td>

            `;


            ordersTableBody.appendChild(
                row
            );

        }
    );


    // --------------------------------------
    // VIEW BUTTONS
    // --------------------------------------

    ordersTableBody
        .querySelectorAll(
            ".order-view-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openOrderModal(
                            button.dataset.orderId
                        );

                    }
                );

            }
        );


    // --------------------------------------
    // FOOTER
    // --------------------------------------

    updateOrdersFooter(
        startIndex,
        endIndex,
        filteredOrders.length
    );


    // --------------------------------------
    // PAGINATION
    // --------------------------------------

    updatePagination(
        totalPages
    );

}


// ==========================================
// STATUS CLASS
// ==========================================

function normalizeStatusClass(
    status
) {

    const normalized =
        String(
            status || ""
        )
            .trim()
            .toLowerCase();


    const allowed = [

        "pending",

        "preparing",

        "ready",

        "completed",

        "rejected",

        "cancelled",

        "canceled"

    ];


    if (
        allowed.includes(
            normalized
        )
    ) {

        return normalized;

    }


    return "unknown";

}


// ==========================================
// CAPITALIZE STATUS
// ==========================================

function capitalizeStatus(
    status
) {

    const value =
        String(
            status || ""
        )
            .trim()
            .toLowerCase();


    if (!value) {

        return "Unknown";

    }


    return (
        value
            .charAt(0)
            .toUpperCase() +
        value.slice(1)
    );

}


// ==========================================
// UPDATE ORDERS FOOTER
// ==========================================

function updateOrdersFooter(
    startIndex,
    endIndex,
    total
) {

    if (ordersFrom) {

        ordersFrom.textContent =
            total > 0
                ? startIndex + 1
                : 0;

    }


    if (ordersTo) {

        ordersTo.textContent =
            total > 0
                ? endIndex
                : 0;

    }


    if (ordersTotal) {

        ordersTotal.textContent =
            total;

    }

}


// ==========================================
// PAGINATION
// ==========================================

function updatePagination(
    totalPages
) {

    if (!paginationPages) {

        return;

    }


    paginationPages.innerHTML =
        "";


    const safeTotalPages =
        Math.max(
            1,
            Number(totalPages) || 1
        );


    if (previousPage) {

        previousPage.disabled =
            currentPage <= 1;

    }


    if (nextPage) {

        nextPage.disabled =
            currentPage >=
            safeTotalPages;

    }


    const pages =
        buildPaginationPages(
            currentPage,
            safeTotalPages
        );


    pages.forEach(
        page => {

            if (
                page === "..."
            ) {

                const ellipsis =
                    document.createElement(
                        "span"
                    );


                ellipsis.className =
                    "pagination-ellipsis";


                ellipsis.textContent =
                    "…";


                paginationPages.appendChild(
                    ellipsis
                );


                return;

            }


            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "pagination-page";


            if (
                page === currentPage
            ) {

                button.classList.add(
                    "active"
                );

            }


            button.textContent =
                page;


            button.addEventListener(
                "click",
                () => {

                    currentPage =
                        page;

                    renderOrders();

                }
            );


            paginationPages.appendChild(
                button
            );

        }
    );

}


// ==========================================
// BUILD PAGINATION
// ==========================================

function buildPaginationPages(
    current,
    total
) {

    if (
        total <= 7
    ) {

        return Array.from(
            {
                length: total
            },
            (_, index) =>
                index + 1
        );

    }


    const pages = [];


    pages.push(1);


    if (
        current > 4
    ) {

        pages.push("...");

    }


    const start =
        Math.max(
            2,
            current - 1
        );


    const end =
        Math.min(
            total - 1,
            current + 1
        );


    for (
        let page = start;
        page <= end;
        page++
    ) {

        pages.push(page);

    }


    if (
        current <
        total - 3
    ) {

        pages.push("...");

    }


    pages.push(total);


    return pages;

}


// ==========================================
// PAGINATION EVENTS
// ==========================================

if (previousPage) {

    previousPage.addEventListener(
        "click",
        () => {

            if (
                currentPage <= 1
            ) {

                return;

            }


            currentPage--;

            renderOrders();

        }
    );

}


if (nextPage) {

    nextPage.addEventListener(
        "click",
        () => {

            const totalPages =
                Math.max(
                    1,
                    Math.ceil(
                        filteredOrders.length /
                        ordersPerPage
                    )
                );


            if (
                currentPage >=
                totalPages
            ) {

                return;

            }


            currentPage++;

            renderOrders();

        }
    );

}


// ==========================================
// ORDER MODAL
// ==========================================

function openOrderModal(
    orderId
) {

    const order =
        allOrders.find(
            item =>
                String(
                    item.orderId
                ) ===
                String(
                    orderId
                )
        );


    if (!order) {

        console.warn(
            "Order not found:",
            orderId
        );

        return;

    }


    // --------------------------------------
    // ORDER ID
    // --------------------------------------

    if (modalOrderId) {

        modalOrderId.textContent =
            order.orderId ||
            "Order";

    }


    // --------------------------------------
    // STATUS
    // --------------------------------------

    if (modalOrderStatus) {

        const statusClass =
            normalizeStatusClass(
                order.status
            );


        const statusLabel =
            capitalizeStatus(
                order.status
            );


        modalOrderStatus.className =
            `modal-order-status status-badge status-${statusClass}`;


        modalOrderStatus.textContent =
            statusLabel;

    }


    // --------------------------------------
    // CUSTOMER
    // --------------------------------------

    if (modalCustomer) {

        modalCustomer.textContent =
            order.customerName ||
            "Guest";

    }


    // --------------------------------------
    // MOBILE
    // --------------------------------------

    if (modalMobile) {

        modalMobile.textContent =
            order.mobileNumber ||
            order.whatsappNumber ||
            "—";

    }


    // --------------------------------------
    // BRANCH
    // --------------------------------------

    if (modalBranch) {

        modalBranch.textContent =
            order.branchOutlet ||
            "—";

    }


    // --------------------------------------
    // TABLE
    // --------------------------------------

    if (modalTable) {

        modalTable.textContent =
            order.tableNumber
                ? `Table ${order.tableNumber}`
                : "—";

    }


    // --------------------------------------
    // ORDER TIME
    // --------------------------------------

    if (modalOrderTime) {

        modalOrderTime.textContent =
            formatOrderDate(
                order.orderDate
            );

    }


    // --------------------------------------
    // ITEMS
    // --------------------------------------

    renderModalItems(
        order
    );


    // --------------------------------------
    // SPECIAL REQUEST
    // --------------------------------------

    if (modalRequestSection) {

        const hasRequest =
            Boolean(
                String(
                    order.customizedRequest ||
                    ""
                ).trim()
            );


        modalRequestSection.style.display =
            hasRequest
                ? ""
                : "none";

    }


    if (modalRequest) {

        modalRequest.textContent =
            order.customizedRequest ||
            "";

    }


    // --------------------------------------
    // BILLING
    // --------------------------------------

    if (modalSubtotal) {

        modalSubtotal.textContent =
            formatCurrency(
                order.subTotal
            );

    }


    if (modalTax) {

        modalTax.textContent =
            formatCurrency(
                order.taxTotal
            );

    }


    if (modalTotal) {

        modalTotal.textContent =
            formatCurrency(
                order.total
            );

    }


    // --------------------------------------
    // SHOW MODAL
    // IMPORTANT:
    // HTML has inline display:none.
    // Therefore we explicitly override it.
    // --------------------------------------

    if (orderModal) {

        orderModal.style.display =
            "flex";


        orderModal.classList.add(
            "active"
        );


        document.body.classList.add(
            "modal-open"
        );

    }

}


// ==========================================
// RENDER MODAL ITEMS
// ==========================================

function renderModalItems(
    order
) {

    if (!modalItems) {

        return;

    }


    modalItems.innerHTML =
        "";


    const rawItems =
        order?.orderedItems;


    if (
        rawItems === null ||
        rawItems === undefined ||
        rawItems === ""
    ) {

        showModalEmptyItems();

        return;

    }


    // --------------------------------------
    // Already structured array
    // --------------------------------------

    if (
        Array.isArray(rawItems)
    ) {

        renderStructuredModalItems(
            rawItems
        );

        return;

    }


    // --------------------------------------
    // Already structured object
    // --------------------------------------

    if (
        typeof rawItems ===
        "object"
    ) {

        renderStructuredModalItems(
            [rawItems]
        );

        return;

    }


    const rawText =
        String(
            rawItems
        ).trim();


    if (!rawText) {

        showModalEmptyItems();

        return;

    }


    // --------------------------------------
    // Try JSON string
    // --------------------------------------

    try {

        const parsed =
            JSON.parse(
                rawText
            );


        if (
            Array.isArray(parsed)
        ) {

            renderStructuredModalItems(
                parsed
            );

            return;

        }


        if (
            parsed &&
            typeof parsed ===
            "object"
        ) {

            renderStructuredModalItems(
                [parsed]
            );

            return;

        }

    } catch {
        // Continue to plain-text fallback.
    }


    // --------------------------------------
    // Plain text fallback
    // --------------------------------------

    const textItems =
        rawText
            .split(
                /\r?\n|,\s*(?=[A-Za-z])/
            )
            .map(
                item =>
                    item.trim()
            )
            .filter(Boolean);


    if (
        !textItems.length
    ) {

        showModalEmptyItems();

        return;

    }


    textItems.forEach(
        itemText => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "modal-item-row";


            row.innerHTML = `

                <div class="modal-item-info">

                    <div class="modal-item-name">
                        ${escapeHtml(
                            itemText
                        )}
                    </div>

                </div>

            `;


            modalItems.appendChild(
                row
            );

        }
    );

}


// ==========================================
// STRUCTURED MODAL ITEMS
// ==========================================

function renderStructuredModalItems(
    items
) {

    if (
        !Array.isArray(items) ||
        !items.length
    ) {

        showModalEmptyItems();

        return;

    }


    items.forEach(
        item => {

            const itemName =
                String(
                    item?.name ??
                    item?.itemName ??
                    item?.ItemName ??
                    item?.title ??
                    item?.Title ??
                    "Item"
                );


            const quantity =
                toNumber(
                    item?.quantity ??
                    item?.qty ??
                    item?.Quantity ??
                    1
                ) || 1;


            const price =
                toNumber(
                    item?.price ??
                    item?.Price ??
                    0
                );


            const suppliedTotal =
                item?.total ??
                item?.Total;


            const itemTotal =
                suppliedTotal !== undefined &&
                suppliedTotal !== null &&
                suppliedTotal !== ""
                    ? toNumber(
                        suppliedTotal
                    )
                    : price * quantity;


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "modal-item-row";


            row.innerHTML = `

                <div class="modal-item-info">

                    <div class="modal-item-name">
                        ${escapeHtml(
                            itemName
                        )}
                    </div>

                    <div class="modal-item-quantity">
                        Qty: ${escapeHtml(
                            quantity
                        )}
                    </div>

                </div>


                <div class="modal-item-price">
                    ${formatCurrency(
                        itemTotal
                    )}
                </div>

            `;


            modalItems.appendChild(
                row
            );

        }
    );

}


// ==========================================
// MODAL EMPTY ITEMS
// ==========================================

function showModalEmptyItems() {

    if (!modalItems) {

        return;

    }


    modalItems.innerHTML = `

        <div class="modal-empty-items">
            No item details available.
        </div>

    `;

}


// ==========================================
// CLOSE ORDER MODAL
// ==========================================

function closeOrderModalHandler() {

    if (orderModal) {

        orderModal.classList.remove(
            "active"
        );


        // Required because HTML contains
        // inline style="display:none".
        orderModal.style.display =
            "none";

    }


    document.body.classList.remove(
        "modal-open"
    );

}


// ==========================================
// MODAL EVENTS
// ==========================================

if (closeOrderModal) {

    closeOrderModal.addEventListener(
        "click",
        closeOrderModalHandler
    );

}


if (modalCloseButton) {

    modalCloseButton.addEventListener(
        "click",
        closeOrderModalHandler
    );

}


// ==========================================
// CLOSE ON OVERLAY CLICK
// ==========================================

if (orderModal) {

    orderModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                orderModal
            ) {

                closeOrderModalHandler();

            }

        }
    );

}


// ==========================================
// CLOSE WITH ESCAPE
// ==========================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape" &&
            orderModal?.classList.contains(
                "active"
            )
        ) {

            closeOrderModalHandler();

        }

    }
);


// ==========================================
// LOADING STATE
// ==========================================

function showLoadingState() {

    if (!ordersTableBody) {

        return;

    }


    hideOrdersEmpty();


    ordersTableBody.innerHTML = `

        <tr>

            <td
                colspan="8"
                class="orders-loading"
            >

                <div class="orders-loading-icon">
                    ◌
                </div>

                <span>
                    Loading orders...
                </span>

            </td>

        </tr>

    `;


    updateOrdersFooter(
        0,
        0,
        0
    );


    updateOrderMetrics(
        []
    );

}


// ==========================================
// EMPTY STATE
// ==========================================

function showOrdersEmpty() {

    if (ordersEmpty) {

        ordersEmpty.style.display =
            "flex";


        const title =
            ordersEmpty.querySelector(
                ".orders-empty-title"
            );


        const text =
            ordersEmpty.querySelector(
                ".orders-empty-text"
            );


        const hasOrders =
            allOrders.length > 0;


        if (title) {

            title.textContent =
                hasOrders
                    ? "No orders match your filters"
                    : "No orders yet";

        }


        if (text) {

            text.textContent =
                hasOrders
                    ? "Try adjusting the search, branch, status or period filter."
                    : "New customer orders will appear here as soon as they are received.";

        }

    }


    if (ordersTableBody) {

        ordersTableBody.innerHTML =
            "";

    }


    updateOrdersFooter(
        0,
        0,
        0
    );

}


function hideOrdersEmpty() {

    if (ordersEmpty) {

        ordersEmpty.style.display =
            "none";

    }

}


// ==========================================
// ERROR STATE
// ==========================================

function showOrdersError(
    message =
        "Unable to load orders. Please try again."
) {

    hideOrdersEmpty();


    if (!ordersTableBody) {

        return;

    }


    ordersTableBody.innerHTML = `

        <tr>

            <td
                colspan="8"
                class="orders-loading"
            >

                <div class="orders-error">

                    <div class="orders-error-icon">
                        !
                    </div>

                    <div class="orders-error-title">
                        Unable to load orders
                    </div>

                    <div class="orders-error-message">
                        ${escapeHtml(
                            message
                        )}
                    </div>

                    <button
                        type="button"
                        class="orders-retry-btn"
                        id="ordersRetryButton"
                    >
                        Try Again
                    </button>

                </div>

            </td>

        </tr>

    `;


    const retryButton =
        document.getElementById(
            "ordersRetryButton"
        );


    if (retryButton) {

        retryButton.addEventListener(
            "click",
            () => {

                loadOrders();

            }
        );

    }


    updateOrdersFooter(
        0,
        0,
        0
    );

}


// ==========================================
// SESSION EXPIRED
// ==========================================

function handleSessionExpired() {

    console.warn(
        "Orders session expired."
    );


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


// ==========================================
// REDIRECT TO LOGIN
// ==========================================

function redirectToLogin() {

    window.location.href =
        "../login/login.html";

}


// ==========================================
// CURRENCY FORMAT
// ==========================================

function formatCurrency(
    amount
) {

    const numericAmount =
        toNumber(
            amount
        );


    return `${currentCurrency} ${numericAmount.toLocaleString(
        "en-AE",
        {
            minimumFractionDigits:
                2,

            maximumFractionDigits:
                2
        }
    )}`;

}


// ==========================================
// DATE FORMAT
// ==========================================

function formatOrderDate(
    value
) {

    if (!value) {

        return "—";

    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    try {

        return new Intl.DateTimeFormat(
            "en-AE",
            {

                timeZone:
                    RESTAURANT_TIMEZONE,

                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric",

                hour:
                    "2-digit",

                minute:
                    "2-digit",

                hour12:
                    true

            }
        ).format(
            date
        );

    } catch {

        return date.toLocaleString();

    }

}


// ==========================================
// HTML ESCAPE
// ==========================================

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

