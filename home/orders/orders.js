// ==========================================
// QR RESTAURANT SAAS
// PREMIUM OWNER ORDERS
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


// ==========================================
// STATE
// ==========================================

let allOrders = [];

let filteredOrders = [];

let currentPage = 1;

const ordersPerPage = 10;


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

        showOrdersError();

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

                        sessionToken

                    })
                }
            );


        if (
            response.status === 401
        ) {

            handleSessionExpired();

            return;
        }


        if (!response.ok) {

            throw new Error(
                `Orders API returned ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "Orders API Response:",
            data
        );


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


        allOrders =
            Array.isArray(data.orders)
                ? data.orders
                : [];


        // ----------------------------------
        // Normalize orders
        // ----------------------------------

        allOrders =
            allOrders.map(
                normalizeOrder
            );


        // ----------------------------------
        // Sort newest first
        // ----------------------------------

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


        // ----------------------------------
        // Populate branch filter
        // ----------------------------------

        populateBranchFilter();


        // ----------------------------------
        // Update KPI
        // ----------------------------------

        updateOrderMetrics();


        // ----------------------------------
        // Apply filters
        // ----------------------------------

        applyFilters();


    } catch (error) {

        console.error(
            "Failed to load orders:",
            error
        );

        showOrdersError();

    }

}


// ==========================================
// NORMALIZE ORDER
// ==========================================

function normalizeOrder(order) {

    return {

        orderId:
            String(
                order?.orderId ||
                ""
            ).trim(),

        restaurantId:
            String(
                order?.restaurantId ||
                ""
            ).trim(),

        branchOutlet:
            String(
                order?.branchOutlet ||
                ""
            ).trim(),

        customerName:
            String(
                order?.customerName ||
                ""
            ).trim(),

        mobileNumber:
            String(
                order?.mobileNumber ||
                ""
            ).trim(),

        whatsappNumber:
            String(
                order?.whatsappNumber ||
                ""
            ).trim(),

        orderedItems:
            String(
                order?.orderedItems ||
                ""
            ).trim(),

        customizedRequest:
            String(
                order?.customizedRequest ||
                ""
            ).trim(),

        tableNumber:
            String(
                order?.tableNumber ||
                ""
            ).trim(),

        deliveryAddress:
            String(
                order?.deliveryAddress ||
                ""
            ).trim(),

        subTotal:
            Number(
                order?.subTotal
            ) || 0,

        taxTotal:
            Number(
                order?.taxTotal
            ) || 0,

        total:
            Number(
                order?.total
            ) || 0,

        taxDetails:
            String(
                order?.taxDetails ||
                ""
            ).trim(),

        status:
            String(
                order?.status ||
                ""
            )
                .trim()
                .toLowerCase(),

        orderDate:
            order?.orderDate ||
            ""

    };

}


// ==========================================
// KPI METRICS
// ==========================================

function updateOrderMetrics() {

    const total =
        allOrders.length;


    const pending =
        allOrders.filter(
            order =>
                order.status ===
                "pending"
        ).length;


    const preparing =
        allOrders.filter(
            order =>
                order.status ===
                "preparing"
        ).length;


    const ready =
        allOrders.filter(
            order =>
                order.status ===
                "ready"
        ).length;


    const completed =
        allOrders.filter(
            order =>
                order.status ===
                "completed"
        ).length;


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

    allOption.value = "";

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
        branches.includes(
            currentValue
        )
    ) {

        branchFilter.value =
            currentValue;

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
            ""
        ).trim();


    const status =
        String(
            statusFilter?.value ||
            ""
        ).trim()
        .toLowerCase();


    const dateRange =
        String(
            dateFilter?.value ||
            "all"
        ).trim()
        .toLowerCase();


    filteredOrders =
        allOrders.filter(
            order => {

                // --------------------------
                // Search
                // --------------------------

                if (search) {

                    const searchableText =
                        [

                            order.orderId,

                            order.customerName,

                            order.mobileNumber,

                            order.whatsappNumber,

                            order.branchOutlet,

                            order.tableNumber,

                            order.orderedItems,

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


                // --------------------------
                // Branch
                // --------------------------

                if (
                    branch &&
                    order.branchOutlet !==
                        branch
                ) {

                    return false;

                }


                // --------------------------
                // Status
                // --------------------------

                if (
                    status &&
                    order.status !==
                        status
                ) {

                    return false;

                }


                // --------------------------
                // Date
                // --------------------------

                if (
                    !matchesDateFilter(
                        order.orderDate,
                        dateRange
                    )
                ) {

                    return false;

                }


                return true;

            }
        );


    renderOrders();

}


// ==========================================
// DATE FILTER
// ==========================================

function matchesDateFilter(
    orderDate,
    filter
) {

    if (
        !orderDate ||
        filter === "all"
    ) {

        return true;

    }


    const orderTime =
        new Date(
            orderDate
        ).getTime();


    if (
        Number.isNaN(
            orderTime
        )
    ) {

        return false;

    }


    const now =
        new Date();


    // --------------------------------------
    // Dubai business timezone handling
    // --------------------------------------

    const todayDubai =
        getDubaiDateKey(
            now
        );

    const orderDubai =
        getDubaiDateKey(
            new Date(
                orderDate
            )
        );


    if (
        filter === "today"
    ) {

        return (
            todayDubai ===
            orderDubai
        );

    }


    // --------------------------------------
    // Rolling day ranges
    // --------------------------------------

    const days =
        Number(
            filter
        );


    if (
        !Number.isFinite(days)
    ) {

        return true;

    }


    const cutoff =
        Date.now() -
        (
            days *
            24 *
            60 *
            60 *
            1000
        );


    return (
        orderTime >=
        cutoff
    );

}


// ==========================================
// DUBAI DATE KEY
// ==========================================

function getDubaiDateKey(
    date
) {

    return new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone:
                "Asia/Dubai",

            year:
                "numeric",

            month:
                "2-digit",

            day:
                "2-digit"
        }
    ).format(date);

}


// ==========================================
// RENDER ORDERS
// ==========================================

function renderOrders() {

    if (!ordersTableBody) {
        return;
    }


    // ==========================================
    // CLEAR TABLE
    // ==========================================

    ordersTableBody.innerHTML = "";


    // ==========================================
    // NO ORDERS AFTER FILTER
    // ==========================================

    if (
        !Array.isArray(filteredOrders) ||
        filteredOrders.length === 0
    ) {

        showEmptyState();

        updatePagination();

        return;

    }


    // ==========================================
    // HIDE EMPTY STATE
    // ==========================================

    hideEmptyState();


    // ==========================================
    // TOTAL PAGES
    // ==========================================

    const totalPages =
        Math.ceil(
            filteredOrders.length /
            ordersPerPage
        );


    if (
        currentPage >
        totalPages
    ) {

        currentPage =
            totalPages;

    }


    if (
        currentPage < 1
    ) {

        currentPage =
            1;

    }


    // ==========================================
    // CURRENT PAGE RANGE
    // ==========================================

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


    // ==========================================
    // RENDER ROWS
    // ==========================================

    pageOrders.forEach(
        order => {

            const row =
                createOrderRow(
                    order
                );

            ordersTableBody.appendChild(
                row
            );

        }
    );


    // ==========================================
    // UPDATE PAGINATION
    // ==========================================

    updatePagination();

}

// ==========================================
// CREATE ORDER ROW
// ==========================================

function createOrderRow(
    order
) {

    const row =
        document.createElement(
            "tr"
        );


    // --------------------------------------
    // Order ID
    // --------------------------------------

    const orderCell =
        document.createElement(
            "td"
        );

    orderCell.innerHTML = `
        <div class="order-id-cell">
            <span class="order-id">
                ${escapeHtml(
                    order.orderId ||
                    "—"
                )}
            </span>
        </div>
    `;


    // --------------------------------------
    // Customer
    // --------------------------------------

    const customerCell =
        document.createElement(
            "td"
        );


    const customerName =
        order.customerName ||
        "Walk-in Customer";


    const avatarLetter =
        customerName
            .charAt(0)
            .toUpperCase();


    const mobile =
        order.mobileNumber ||
        order.whatsappNumber ||
        "";


    customerCell.innerHTML = `
        <div class="customer-cell">
            <div class="customer-avatar">
                ${escapeHtml(
                    avatarLetter
                )}
            </div>

            <div class="customer-info">
                <span class="customer-name">
                    ${escapeHtml(
                        customerName
                    )}
                </span>

                ${
                    mobile
                        ? `
                        <span class="customer-mobile">
                            ${escapeHtml(
                                mobile
                            )}
                        </span>
                        `
                        : ""
                }
            </div>
        </div>
    `;


    // --------------------------------------
    // Branch
    // --------------------------------------

    const branchCell =
        document.createElement(
            "td"
        );

    branchCell.innerHTML = `
        <span class="branch-name">
            ${escapeHtml(
                order.branchOutlet ||
                "—"
            )}
        </span>
    `;


    // --------------------------------------
    // Table
    // --------------------------------------

    const tableCell =
        document.createElement(
            "td"
        );

    tableCell.innerHTML = `
        <span class="table-number">
            ${
                order.tableNumber
                    ? `Table ${escapeHtml(
                        order.tableNumber
                    )}`
                    : "—"
            }
        </span>
    `;


    // --------------------------------------
    // Amount
    // --------------------------------------

    const amountCell =
        document.createElement(
            "td"
        );

    amountCell.innerHTML = `
        <span class="order-amount">
            ${formatCurrency(
                order.total
            )}
        </span>
    `;


    // --------------------------------------
    // Status
    // --------------------------------------

    const statusCell =
        document.createElement(
            "td"
        );

    statusCell.innerHTML =
        createStatusBadge(
            order.status
        );


    // --------------------------------------
    // Time
    // --------------------------------------

    const timeCell =
        document.createElement(
            "td"
        );

    timeCell.innerHTML = `
        <span class="order-time">
            ${formatOrderDate(
                order.orderDate
            )}
        </span>
    `;


    // --------------------------------------
    // Action
    // --------------------------------------

    const actionCell =
        document.createElement(
            "td"
        );


    const viewButton =
        document.createElement(
            "button"
        );


    viewButton.type =
        "button";

    viewButton.className =
        "order-view-btn";

    viewButton.innerHTML =
        "View";

    viewButton.addEventListener(
        "click",
        () => openOrderModal(order)
    );


    actionCell.appendChild(
        viewButton
    );


    // --------------------------------------
    // Append cells
    // --------------------------------------

    row.appendChild(
        orderCell
    );

    row.appendChild(
        customerCell
    );

    row.appendChild(
        branchCell
    );

    row.appendChild(
        tableCell
    );

    row.appendChild(
        amountCell
    );

    row.appendChild(
        statusCell
    );

    row.appendChild(
        timeCell
    );

    row.appendChild(
        actionCell
    );


    return row;

}


// ==========================================
// STATUS BADGE
// ==========================================

function createStatusBadge(
    status
) {

    const normalized =
        String(
            status ||
            ""
        )
            .trim()
            .toLowerCase();


    const label =
        normalized
            ? capitalizeStatus(
                normalized
            )
            : "Unknown";


    return `
        <span class="
            status-badge
            status-${escapeHtml(
                normalized ||
                "unknown"
            )}
        ">
            <span class="status-dot"></span>
            ${escapeHtml(
                label
            )}
        </span>
    `;

}


function capitalizeStatus(
    status
) {

    return status
        .charAt(0)
        .toUpperCase() +
        status.slice(1);

}


// ==========================================
// PAGINATION
// ==========================================

function updatePagination() {

    const total =
        filteredOrders.length;


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                total /
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


    const start =
        total === 0
            ? 0
            : (
                (
                    currentPage -
                    1
                ) *
                ordersPerPage
            ) + 1;


    const end =
        total === 0
            ? 0
            : Math.min(
                currentPage *
                    ordersPerPage,

                total
            );


    if (ordersFrom) {
        ordersFrom.textContent =
            start;
    }

    if (ordersTo) {
        ordersTo.textContent =
            end;
    }

    if (ordersTotal) {
        ordersTotal.textContent =
            total;
    }


    // --------------------------------------
    // Previous
    // --------------------------------------

    if (previousPage) {

        previousPage.disabled =
            currentPage <= 1 ||
            total === 0;

    }


    // --------------------------------------
    // Next
    // --------------------------------------

    if (nextPage) {

        nextPage.disabled =
            currentPage >=
                totalPages ||
            total === 0;

    }


    // --------------------------------------
    // Page numbers
    // --------------------------------------

    if (!paginationPages) {
        return;
    }


    paginationPages.innerHTML =
        "";


    if (total === 0) {
        return;
    }


    const pages =
        getPaginationPages(
            currentPage,
            totalPages
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
                page ===
                currentPage
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
// PAGINATION RANGE
// ==========================================

function getPaginationPages(
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


    pages.push(
        total
    );


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
                currentPage > 1
            ) {

                currentPage--;

                renderOrders();

            }

        }
    );

}


if (nextPage) {

    nextPage.addEventListener(
        "click",
        () => {

            const totalPages =
                Math.ceil(
                    filteredOrders.length /
                    ordersPerPage
                );


            if (
                currentPage <
                totalPages
            ) {

                currentPage++;

                renderOrders();

            }

        }
    );

}


// ==========================================
// RESET FILTERS
// ==========================================

function resetAllFilters() {

    if (orderSearch) {
        orderSearch.value = "";
    }

    if (branchFilter) {
        branchFilter.value = "";
    }

    if (statusFilter) {
        statusFilter.value = "";
    }

    if (dateFilter) {
        dateFilter.value = "today";
    }


    currentPage = 1;

    applyFilters();

}


// ==========================================
// ORDER MODAL
// ==========================================

function openOrderModal(
    order
) {

    if (!orderModal) {
        return;
    }


    // --------------------------------------
    // Order ID
    // --------------------------------------

    if (modalOrderId) {

        modalOrderId.textContent =
            order.orderId ||
            "—";

    }


    // --------------------------------------
    // Status
    // --------------------------------------

    if (modalOrderStatus) {

        modalOrderStatus.innerHTML =
            createStatusBadge(
                order.status
            );

    }


    // --------------------------------------
    // Customer
    // --------------------------------------

    if (modalCustomer) {

        modalCustomer.textContent =
            order.customerName ||
            "Walk-in Customer";

    }


    // --------------------------------------
    // Mobile
    // --------------------------------------

    if (modalMobile) {

        modalMobile.textContent =
            order.mobileNumber ||
            order.whatsappNumber ||
            "—";

    }


    // --------------------------------------
    // Branch
    // --------------------------------------

    if (modalBranch) {

        modalBranch.textContent =
            order.branchOutlet ||
            "—";

    }


    // --------------------------------------
    // Table
    // --------------------------------------

    if (modalTable) {

        modalTable.textContent =
            order.tableNumber
                ? `Table ${order.tableNumber}`
                : "—";

    }


    // --------------------------------------
    // Order time
    // --------------------------------------

    if (modalOrderTime) {

        modalOrderTime.textContent =
            formatOrderDate(
                order.orderDate,
                true
            );

    }


    // --------------------------------------
    // Ordered Items
    // --------------------------------------

    renderModalItems(
        order.orderedItems
    );


    // --------------------------------------
    // Customized Request
    // --------------------------------------

    if (
        modalRequestSection &&
        modalRequest
    ) {

        if (
            order.customizedRequest
        ) {

            modalRequest.textContent =
                order.customizedRequest;

            modalRequestSection.style.display =
                "";

        } else {

            modalRequest.textContent =
                "";

            modalRequestSection.style.display =
                "none";

        }

    }


    // --------------------------------------
    // Billing
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
    // Show modal
    // --------------------------------------

    orderModal.classList.add(
        "open"
    );

    document.body.classList.add(
        "modal-open"
    );

}


// ==========================================
// RENDER MODAL ITEMS
// ==========================================

function renderModalItems(
    itemsText
) {

    if (!modalItems) {
        return;
    }


    modalItems.innerHTML =
        "";


    if (!itemsText) {

        modalItems.innerHTML = `
            <div class="modal-item-empty">
                No item details available.
            </div>
        `;

        return;

    }


    const lines =
        String(
            itemsText
        )
            .split(
                /\r?\n|;/
            )
            .map(
                item =>
                    item.trim()
            )
            .filter(Boolean);


    if (
        lines.length === 0
    ) {

        modalItems.innerHTML = `
            <div class="modal-item-empty">
                No item details available.
            </div>
        `;

        return;

    }


    lines.forEach(
        line => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "modal-order-item";


            item.textContent =
                line;


            modalItems.appendChild(
                item
            );

        }
    );

}


// ==========================================
// CLOSE MODAL
// ==========================================

function closeOrderDetails() {

    if (!orderModal) {
        return;
    }


    orderModal.classList.remove(
        "open"
    );


    document.body.classList.remove(
        "modal-open"
    );

}


if (closeOrderModal) {

    closeOrderModal.addEventListener(
        "click",
        closeOrderDetails
    );

}


if (modalCloseButton) {

    modalCloseButton.addEventListener(
        "click",
        closeOrderDetails
    );

}


if (orderModal) {

    orderModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                orderModal
            ) {

                closeOrderDetails();

            }

        }
    );

}


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            closeOrderDetails();

        }

    }
);


// ==========================================
// FORMAT CURRENCY
// ==========================================

function formatCurrency(
    amount
) {

    const value =
        Number(
            amount
        ) || 0;


    return new Intl.NumberFormat(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ).format(value);

}


// ==========================================
// FORMAT ORDER DATE
// ==========================================

function formatOrderDate(
    value,
    detailed = false
) {

    if (!value) {
        return "—";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    if (detailed) {

        return new Intl.DateTimeFormat(
            "en-GB",
            {
                timeZone:
                    "Asia/Dubai",

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
        ).format(date);

    }


    return new Intl.DateTimeFormat(
        "en-GB",
        {
            timeZone:
                "Asia/Dubai",

            day:
                "2-digit",

            month:
                "short",

            hour:
                "2-digit",

            minute:
                "2-digit",

            hour12:
                true
        }
    ).format(date);

}


// ==========================================
// LOADING STATE
// ==========================================

function showLoadingState() {

    if (!ordersTableBody) {
        return;
    }


    hideEmptyState();


    ordersTableBody.innerHTML = `
        <tr>
            <td
                colspan="8"
                class="orders-loading"
            >
                <div class="loading-spinner"></div>
                <span>
                    Loading customer orders...
                </span>
            </td>
        </tr>
    `;

}


// ==========================================
// EMPTY STATE
// ==========================================

function showEmptyState() {

    if (ordersEmpty) {

        ordersEmpty.hidden =
            false;

        ordersEmpty.style.display =
            "";

    }


    if (ordersTableBody) {

        ordersTableBody.innerHTML =
            "";

    }

}

function hideEmptyState() {

    if (!ordersEmpty) {
        return;
    }

    ordersEmpty.style.display =
        "none";

    ordersEmpty.hidden =
        true;

}

// ==========================================
// ERROR STATE
// ==========================================

function showOrdersError() {

    if (ordersEmpty) {

        ordersEmpty.style.display =
            "";

        const title =
            ordersEmpty.querySelector(
                "h3"
            );

        const message =
            ordersEmpty.querySelector(
                "p"
            );


        if (title) {

            title.textContent =
                "Unable to load orders";

        }


        if (message) {

            message.textContent =
                "Please refresh the page and try again.";

        }

    }


    if (ordersTableBody) {

        ordersTableBody.innerHTML =
            "";

    }

}


// ==========================================
// SESSION EXPIRED
// ==========================================

function handleSessionExpired() {

    console.warn(
        "Restaurant session expired."
    );


    localStorage.removeItem(
        SESSION_TOKEN_KEY
    );

    localStorage.removeItem(
        SESSION_DATA_KEY
    );

    localStorage.removeItem(
        "qro_validated_session"
    );


    redirectToLogin();

}


// ==========================================
// REDIRECT LOGIN
// ==========================================

function redirectToLogin() {

    window.location.href =
        "../login/login.html";

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