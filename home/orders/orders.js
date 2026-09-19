// =========================================================
// QR RESTAURANT SAAS
// PREMIUM OWNER ORDERS
// =========================================================

// =========================================================
// CONFIGURATION
// =========================================================

const N8N_ORDERS_WEBHOOK =
    `${N8N_BASE_URL}/owner-orders`;

const SESSION_TOKEN_KEY =
    "qro_session_token";

const SESSION_DATA_KEY =
    "qro_session_data";

const VALIDATED_SESSION_KEY =
    "qro_validated_session";

const ORDERS_PAGE_SIZE = 10;

const DUBAI_TIME_ZONE = "Asia/Dubai";


// =========================================================
// PAGE STATE
// =========================================================

let allOrders = [];
let filteredOrders = [];

let currentPage = 1;

let currentFilters = {
    search: "",
    branch: "all",
    status: "all",
    date: "all"
};

let selectedOrder = null;


// =========================================================
// INITIALIZATION
// =========================================================

document.addEventListener("DOMContentLoaded", async () => {

    console.log("[Orders] Initializing Owner Orders page...");

    try {

        const session = await requireAuthentication();

        if (!session) {
            return;
        }

        initializeOrdersEvents();

        await loadOrders();

    } catch (error) {

        console.error("[Orders] Initialization failed:", error);

        showOrdersError(
            "Unable to load orders. Please try again."
        );
    }
});


// =========================================================
// EVENT INITIALIZATION
// =========================================================

function initializeOrdersEvents() {

    const searchInput =
        document.getElementById("orderSearch");

    const branchFilter =
        document.getElementById("branchFilter");

    const statusFilter =
        document.getElementById("statusFilter");

    const dateFilter =
        document.getElementById("dateFilter");

    const resetButton =
        document.getElementById("resetFilters");

    const previousButton =
        document.getElementById("previousPage");

    const nextButton =
        document.getElementById("nextPage");

    const closeModalButton =
        document.getElementById("closeOrderModal");

    const modalCloseButton =
        document.getElementById("modalCloseButton");

    const modal =
        document.getElementById("orderModal");

    const logoutButton =
        document.getElementById("logoutBtn");

    // ---------------------------------------------------------
    // Search
    // ---------------------------------------------------------

    if (searchInput) {

        searchInput.addEventListener("input", () => {

            currentFilters.search =
                searchInput.value.trim();

            currentPage = 1;

            applyFiltersAndRender();
        });
    }


    // ---------------------------------------------------------
    // Branch
    // ---------------------------------------------------------

    if (branchFilter) {

        branchFilter.addEventListener("change", () => {

            currentFilters.branch =
                branchFilter.value || "all";

            currentPage = 1;

            applyFiltersAndRender();
        });
    }


    // ---------------------------------------------------------
    // Status
    // ---------------------------------------------------------

    if (statusFilter) {

        statusFilter.addEventListener("change", () => {

            currentFilters.status =
                statusFilter.value || "all";

            currentPage = 1;

            applyFiltersAndRender();
        });
    }


    // ---------------------------------------------------------
    // Date
    // ---------------------------------------------------------

    if (dateFilter) {

        dateFilter.addEventListener("change", () => {

            currentFilters.date =
                dateFilter.value || "all";

            currentPage = 1;

            applyFiltersAndRender();
        });
    }


    // ---------------------------------------------------------
    // Reset Filters
    // ---------------------------------------------------------

    if (resetButton) {

        resetButton.addEventListener("click", () => {

            resetFilters();
        });
    }


    // ---------------------------------------------------------
    // Pagination
    // ---------------------------------------------------------

    if (previousButton) {

        previousButton.addEventListener("click", () => {

            if (currentPage > 1) {

                currentPage--;

                renderOrdersTable();
            }
        });
    }


    if (nextButton) {

        nextButton.addEventListener("click", () => {

            const totalPages =
                Math.max(
                    1,
                    Math.ceil(
                        filteredOrders.length /
                        ORDERS_PAGE_SIZE
                    )
                );

            if (currentPage < totalPages) {

                currentPage++;

                renderOrdersTable();
            }
        });
    }


    // ---------------------------------------------------------
    // Modal
    // ---------------------------------------------------------

    if (closeModalButton) {

        closeModalButton.addEventListener(
            "click",
            closeOrderModal
        );
    }


    if (modalCloseButton) {

        modalCloseButton.addEventListener(
            "click",
            closeOrderModal
        );
    }


    if (modal) {

        modal.addEventListener("click", (event) => {

            if (event.target === modal) {

                closeOrderModal();
            }
        });
    }


    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {

            closeOrderModal();
        }
    });


    // ---------------------------------------------------------
    // Logout
    // ---------------------------------------------------------

    if (logoutButton) {

        logoutButton.addEventListener("click", () => {

            clearSession();

            window.location.href =
                "../../login/login.html";
        });
    }
}


// =========================================================
// LOAD ORDERS
// =========================================================

async function loadOrders() {

    showOrdersLoading();

    const sessionToken =
        localStorage.getItem(
            SESSION_TOKEN_KEY
        );

    if (!sessionToken) {

        redirectToLogin();

        return;
    }


    try {

        const response = await fetch(
            N8N_ORDERS_WEBHOOK,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    sessionToken
                })
            }
        );


        if (
            response.status === 401 ||
            response.status === 403
        ) {

            handleSessionExpired();

            return;
        }


        if (!response.ok) {

            throw new Error(
                `Orders request failed: HTTP ${response.status}`
            );
        }


        const result =
            await response.json();


        const ordersData =
            result?.data || result;


        if (
            ordersData?.code ===
            "INVALID_SESSION" ||
            ordersData?.code ===
            "SESSION_EXPIRED"
        ) {

            handleSessionExpired();

            return;
        }


        if (!ordersData?.success) {

            throw new Error(
                ordersData?.message ||
                "Orders data could not be loaded."
            );
        }


        // -----------------------------------------------------
        // Normalize response
        // -----------------------------------------------------

        const rawOrders =
            Array.isArray(ordersData.orders)
                ? ordersData.orders
                : Array.isArray(ordersData.data)
                    ? ordersData.data
                    : [];


        allOrders =
            rawOrders
                .map(normalizeOrder)
                .filter(Boolean)
                .sort(
                    (a, b) =>
                        getTimestamp(b.orderDate) -
                        getTimestamp(a.orderDate)
                );


        // -----------------------------------------------------
        // Owner / Restaurant context
        // -----------------------------------------------------

        updateOwnerContext(ordersData);


        // -----------------------------------------------------
        // Branch filter
        // -----------------------------------------------------

        populateBranchFilter(
            allOrders
        );


        // -----------------------------------------------------
        // Render
        // -----------------------------------------------------

        currentPage = 1;

        applyFiltersAndRender();


        console.log(
            `[Orders] Loaded ${allOrders.length} orders.`
        );

    } catch (error) {

        console.error(
            "[Orders] Failed to load orders:",
            error
        );

        showOrdersError(
            "Unable to load orders. Please try again."
        );
    }
}


// =========================================================
// NORMALIZE ORDER
// =========================================================

function normalizeOrder(order) {

    if (!order || typeof order !== "object") {
        return null;
    }


    const orderId =
        firstValue(
            order.orderId,
            order.OrderId,
            order.id,
            order.ID,
            order.OrderID
        );


    if (!orderId) {
        return null;
    }


    const customerName =
        firstValue(
            order.customerName,
            order.CustomerName,
            order.customer,
            order.Customer,
            "Guest"
        );


    const mobileNumber =
        firstValue(
            order.mobileNumber,
            order.MobileNumber,
            order.mobile,
            order.Mobile,
            order.phone,
            order.Phone,
            ""
        );


    const branchOutlet =
        firstValue(
            order.branchOutlet,
            order.BranchOutlet,
            order.branchName,
            order.BranchName,
            order.branch,
            order.Branch,
            "Main Branch"
        );


    const tableNumber =
        firstValue(
            order.tableNumber,
            order.TableNumber,
            order.table,
            order.Table,
            order.tableNo,
            order.TableNo,
            ""
        );


    const amount =
        toNumber(
            firstValue(
                order.totalAmount,
                order.TotalAmount,
                order.total,
                order.Total,
                order.amount,
                order.Amount,
                order.grandTotal,
                order.GrandTotal,
                0
            )
        );


    const subtotal =
        toNumber(
            firstValue(
                order.subtotal,
                order.Subtotal,
                order.subTotal,
                order.SubTotal,
                0
            )
        );


    const tax =
        toNumber(
            firstValue(
                order.tax,
                order.Tax,
                order.taxAmount,
                order.TaxAmount,
                order.taxTotal,
                order.TaxTotal,
                0
            )
        );


    const status =
        normalizeStatus(
            firstValue(
                order.status,
                order.Status,
                order.orderStatus,
                order.OrderStatus,
                "pending"
            )
        );


    const orderDate =
        firstValue(
            order.orderDate,
            order.OrderDate,
            order.createdAt,
            order.CreatedAt,
            order.timestamp,
            order.Timestamp,
            order.created,
            order.Created,
            ""
        );


    const orderedItems =
        normalizeOrderedItems(
            firstValue(
                order.orderedItems,
                order.OrderedItems,
                order.items,
                order.Items,
                order.orderItems,
                order.OrderItems,
                []
            )
        );


    const customRequest =
        firstValue(
            order.customRequest,
            order.CustomRequest,
            order.specialRequest,
            order.SpecialRequest,
            order.customerRequest,
            order.CustomerRequest,
            order.notes,
            order.Notes,
            ""
        );


    return {

        ...order,

        orderId: String(orderId),

        customerName:
            String(customerName || "Guest"),

        mobileNumber:
            String(mobileNumber || ""),

        branchOutlet:
            String(branchOutlet || "Main Branch"),

        tableNumber:
            String(tableNumber || ""),

        amount,

        subtotal,

        tax,

        status,

        orderDate,

        orderedItems,

        customRequest
    };
}


// =========================================================
// APPLY FILTERS
// =========================================================

function applyFiltersAndRender() {

    const search =
        currentFilters.search
            .toLowerCase()
            .trim();


    filteredOrders =
        allOrders.filter(order => {

            // -------------------------------------------------
            // Search
            // -------------------------------------------------

            if (search) {

                const searchableText =
                    [
                        order.orderId,
                        order.customerName,
                        order.mobileNumber,
                        order.branchOutlet,
                        order.tableNumber,
                        stringifyItems(
                            order.orderedItems
                        ),
                        order.customRequest
                    ]
                        .join(" ")
                        .toLowerCase();


                if (
                    !searchableText.includes(search)
                ) {

                    return false;
                }
            }


            // -------------------------------------------------
            // Branch
            // -------------------------------------------------

            if (
                currentFilters.branch !== "all" &&
                currentFilters.branch !== "" &&
                order.branchOutlet !==
                currentFilters.branch
            ) {

                return false;
            }


            // -------------------------------------------------
            // Status
            // -------------------------------------------------

            if (
                currentFilters.status !== "all" &&
                normalizeStatus(order.status) !==
                normalizeStatus(
                    currentFilters.status
                )
            ) {

                return false;
            }


            // -------------------------------------------------
            // Date
            // -------------------------------------------------

            if (
                !matchesDateFilter(
                    order.orderDate,
                    currentFilters.date
                )
            ) {

                return false;
            }


            return true;
        });


    updateOrderMetrics(
        filteredOrders
    );


    currentPage = Math.min(
        currentPage,
        Math.max(
            1,
            Math.ceil(
                filteredOrders.length /
                ORDERS_PAGE_SIZE
            )
        )
    );


    renderOrdersTable();
}

// ==========================================
// KPI METRICS
// ==========================================
// Customer Orders KPIs are RESTAURANT-WIDE.
// They are NOT affected by Order Management filters.
//
// allOrders = complete restaurant order history
// filteredOrders = only the currently filtered table records
// ==========================================

function updateOrderMetrics() {

    // --------------------------------------
    // CUSTOMER ORDERS — RESTAURANT TOTALS
    // --------------------------------------

    const source =
        Array.isArray(allOrders)
            ? allOrders
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


    // --------------------------------------
    // UPDATE CUSTOMER ORDERS KPI CARDS
    // --------------------------------------

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

// =========================================================
// RENDER ORDERS TABLE
// =========================================================

function renderOrdersTable() {

    const tableBody =
        document.getElementById(
            "ordersTableBody"
        );


    if (!tableBody) {
        return;
    }


    if (!filteredOrders.length) {

        tableBody.innerHTML = "";

        showOrdersEmpty();

        updatePagination(
            0,
            0,
            0
        );

        return;
    }


    hideOrdersEmpty();


    const startIndex =
        (currentPage - 1) *
        ORDERS_PAGE_SIZE;


    const endIndex =
        Math.min(
            startIndex +
            ORDERS_PAGE_SIZE,
            filteredOrders.length
        );


    const pageOrders =
        filteredOrders.slice(
            startIndex,
            endIndex
        );


    const currency =
        getRestaurantCurrency();


    tableBody.innerHTML =
        pageOrders
            .map(order =>
                createOrderRow(
                    order,
                    currency
                )
            )
            .join("");


    tableBody
        .querySelectorAll(
            ".order-view-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const orderId =
                        button.dataset.orderId;

                    openOrderModal(
                        orderId
                    );
                }
            );
        });


    updatePagination(
        startIndex + 1,
        endIndex,
        filteredOrders.length
    );
}


// =========================================================
// CREATE ORDER ROW
// =========================================================

function createOrderRow(
    order,
    currency
) {

    const status =
        normalizeStatus(
            order.status
        );


    const statusLabel =
        formatStatusLabel(
            status
        );


    const customerName =
        escapeHtml(
            order.customerName
        );


    const mobile =
        escapeHtml(
            order.mobileNumber
        );


    const branch =
        escapeHtml(
            order.branchOutlet
        );


    const table =
        order.tableNumber
            ? escapeHtml(
                order.tableNumber
            )
            : "Takeaway";


    const orderId =
        escapeHtml(
            order.orderId
        );


    const amount =
        formatCurrency(
            order.amount,
            currency
        );


    const time =
        formatOrderDate(
            order.orderDate
        );


    return `
        <tr>

            <td class="order-id-cell">
                <strong>
                    ${orderId}
                </strong>
            </td>


            <td class="customer-cell">

                <div class="customer-name">
                    ${customerName}
                </div>

                ${mobile
            ? `
                            <div class="customer-contact">
                                ${mobile}
                            </div>
                          `
            : ""
        }

            </td>


            <td class="branch-name">
                ${branch}
            </td>


            <td class="table-number">
                ${table}
            </td>


            <td class="order-amount">
                ${amount}
            </td>


            <td>
                <span
                    class="status-badge status-${escapeHtml(status)}"
                >
                    ${escapeHtml(statusLabel)}
                </span>
            </td>


            <td class="order-time">
                ${escapeHtml(time)}
            </td>


            <td>

                <button
                    type="button"
                    class="order-view-btn"
                    data-order-id="${escapeHtml(order.orderId)}"
                >
                    View
                </button>

            </td>

        </tr>
    `;
}


// =========================================================
// OPEN ORDER MODAL
// =========================================================

function openOrderModal(orderId) {

    const order =
        allOrders.find(
            item =>
                String(item.orderId) ===
                String(orderId)
        );


    if (!order) {
        return;
    }


    selectedOrder = order;


    const currency =
        getRestaurantCurrency();


    setText(
        "modalOrderId",
        order.orderId
    );


    const status =
        normalizeStatus(
            order.status
        );


    const statusElement =
        document.getElementById(
            "modalOrderStatus"
        );


    if (statusElement) {

        statusElement.textContent =
            formatStatusLabel(status);


        statusElement.className =
            `status-badge status-${status}`;
    }


    setText(
        "modalCustomer",
        order.customerName
    );


    setText(
        "modalMobile",
        order.mobileNumber || "—"
    );


    setText(
        "modalBranch",
        order.branchOutlet || "—"
    );


    setText(
        "modalTable",
        order.tableNumber
            ? order.tableNumber
            : "Takeaway"
    );


    setText(
        "modalOrderTime",
        formatOrderDate(
            order.orderDate,
            true
        )
    );


    renderModalItems(
        order.orderedItems,
        currency
    );


    // ---------------------------------------------------------
    // Customer Request
    // ---------------------------------------------------------

    const requestSection =
        document.getElementById(
            "modalRequestSection"
        );


    const requestElement =
        document.getElementById(
            "modalRequest"
        );


    if (
        requestSection &&
        requestElement
    ) {

        if (
            order.customRequest &&
            String(
                order.customRequest
            ).trim()
        ) {

            requestElement.textContent =
                String(
                    order.customRequest
                );

            requestSection.style.display =
                "";
        } else {

            requestElement.textContent =
                "";

            requestSection.style.display =
                "none";
        }
    }


    // ---------------------------------------------------------
    // Financial Summary
    // ---------------------------------------------------------

    setText(
        "modalSubtotal",
        formatCurrency(
            order.subtotal,
            currency
        )
    );


    setText(
        "modalTax",
        formatCurrency(
            order.tax,
            currency
        )
    );


    setText(
        "modalTotal",
        formatCurrency(
            order.amount,
            currency
        )
    );


    // ---------------------------------------------------------
    // IMPORTANT:
    // HTML has inline display:none.
    // Explicitly override it here.
    // ---------------------------------------------------------

    const modal =
        document.getElementById(
            "orderModal"
        );


    if (modal) {

        modal.style.display =
            "flex";

        modal.classList.add(
            "active"
        );

        document.body.style.overflow =
            "hidden";
    }
}


// =========================================================
// CLOSE ORDER MODAL
// =========================================================

function closeOrderModal() {

    const modal =
        document.getElementById(
            "orderModal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

        // Required because HTML contains
        // inline style="display:none;"
        modal.style.display =
            "none";
    }


    document.body.style.overflow =
        "";


    selectedOrder = null;
}


// =========================================================
// RENDER MODAL ITEMS
// =========================================================

function renderModalItems(
    items,
    currency
) {

    const container =
        document.getElementById(
            "modalItems"
        );


    if (!container) {
        return;
    }


    if (!items) {

        container.innerHTML =
            `<div class="order-item-empty">
                No item details available.
             </div>`;

        return;
    }


    // ---------------------------------------------------------
    // Array
    // ---------------------------------------------------------

    if (Array.isArray(items)) {

        if (!items.length) {

            container.innerHTML =
                `<div class="order-item-empty">
                    No item details available.
                 </div>`;

            return;
        }


        container.innerHTML =
            items
                .map(
                    item =>
                        createModalItem(
                            item,
                            currency
                        )
                )
                .join("");

        return;
    }


    // ---------------------------------------------------------
    // Object
    // ---------------------------------------------------------

    if (
        typeof items ===
        "object"
    ) {

        if (
            Array.isArray(
                items.items
            )
        ) {

            renderModalItems(
                items.items,
                currency
            );

            return;
        }


        container.innerHTML =
            `<div class="order-item-empty">
                ${escapeHtml(
                stringifyItems(items)
            )}
             </div>`;

        return;
    }


    // ---------------------------------------------------------
    // String
    // ---------------------------------------------------------

    container.innerHTML =
        `<div class="order-item-text">
            ${escapeHtml(
            String(items)
        )}
         </div>`;
}


// =========================================================
// CREATE MODAL ITEM
// =========================================================

function createModalItem(
    item,
    currency
) {

    if (
        item === null ||
        item === undefined
    ) {

        return "";
    }


    if (
        typeof item !== "object"
    ) {

        return `
            <div class="order-item-row">
                <div class="order-item-name">
                    ${escapeHtml(
            String(item)
        )}
                </div>
            </div>
        `;
    }


    const name =
        firstValue(
            item.name,
            item.itemName,
            item.ItemName,
            item.title,
            item.Title,
            item.productName,
            item.ProductName,
            "Item"
        );


    const quantity =
        toNumber(
            firstValue(
                item.quantity,
                item.Quantity,
                item.qty,
                item.Qty,
                1
            )
        );


    const price =
        toNumber(
            firstValue(
                item.price,
                item.Price,
                item.unitPrice,
                item.UnitPrice,
                0
            )
        );


    const total =
        toNumber(
            firstValue(
                item.total,
                item.Total,
                item.amount,
                item.Amount,
                price * quantity
            )
        );


    return `
        <div class="order-item-row">

            <div class="order-item-main">

                <div class="order-item-name">
                    ${escapeHtml(
        String(name)
    )}
                </div>

                <div class="order-item-quantity">
                    Qty: ${quantity}
                </div>

            </div>


            <div class="order-item-price">

                ${price > 0
            ? `
                            <div class="order-item-unit-price">
                                ${formatCurrency(
                price,
                currency
            )}
                            </div>
                          `
            : ""
        }

                <strong>
                    ${formatCurrency(
            total,
            currency
        )}
                </strong>

            </div>

        </div>
    `;
}


// =========================================================
// BRANCH FILTER
// =========================================================

function populateBranchFilter(
    orders
) {

    const branchFilter =
        document.getElementById(
            "branchFilter"
        );


    if (!branchFilter) {
        return;
    }


    const currentValue =
        branchFilter.value || "all";


    const branches =
        [
            ...new Set(
                orders
                    .map(
                        order =>
                            order.branchOutlet
                    )
                    .filter(Boolean)
            )
        ]
            .sort(
                (a, b) =>
                    String(a).localeCompare(
                        String(b)
                    )
            );


    branchFilter.innerHTML = `
        <option value="all">
            All Branches
        </option>
    `;


    branches.forEach(branch => {

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
    });


    const stillExists =
        [
            ...branchFilter.options
        ].some(
            option =>
                option.value ===
                currentValue
        );


    branchFilter.value =
        stillExists
            ? currentValue
            : "all";
}


// =========================================================
// RESET FILTERS
// =========================================================

function resetFilters() {

    currentFilters = {
        search: "",
        branch: "all",
        status: "all",
        date: "all"
    };


    currentPage = 1;


    const searchInput =
        document.getElementById(
            "orderSearch"
        );


    const branchFilter =
        document.getElementById(
            "branchFilter"
        );


    const statusFilter =
        document.getElementById(
            "statusFilter"
        );


    const dateFilter =
        document.getElementById(
            "dateFilter"
        );


    if (searchInput) {
        searchInput.value = "";
    }


    if (branchFilter) {
        branchFilter.value = "all";
    }


    if (statusFilter) {
        statusFilter.value = "all";
    }


    if (dateFilter) {
        dateFilter.value = "all";
    }


    applyFiltersAndRender();
}


// =========================================================
// PAGINATION
// =========================================================

function updatePagination(
    from,
    to,
    total
) {

    setText(
        "ordersFrom",
        total > 0 ? from : 0
    );


    setText(
        "ordersTo",
        total > 0 ? to : 0
    );


    setText(
        "ordersTotal",
        total
    );


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                total /
                ORDERS_PAGE_SIZE
            )
        );


    const previousButton =
        document.getElementById(
            "previousPage"
        );


    const nextButton =
        document.getElementById(
            "nextPage"
        );


    if (previousButton) {

        previousButton.disabled =
            currentPage <= 1;
    }


    if (nextButton) {

        nextButton.disabled =
            currentPage >= totalPages;
    }


    renderPaginationPages(
        totalPages
    );
}


// =========================================================
// PAGINATION PAGE NUMBERS
// =========================================================

function renderPaginationPages(
    totalPages
) {

    const container =
        document.getElementById(
            "paginationPages"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    const maxVisiblePages = 5;


    let startPage =
        Math.max(
            1,
            currentPage -
            Math.floor(
                maxVisiblePages / 2
            )
        );


    let endPage =
        Math.min(
            totalPages,
            startPage +
            maxVisiblePages -
            1
        );


    if (
        endPage - startPage + 1 <
        maxVisiblePages
    ) {

        startPage =
            Math.max(
                1,
                endPage -
                maxVisiblePages +
                1
            );
    }


    for (
        let page = startPage;
        page <= endPage;
        page++
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.type = "button";

        button.textContent =
            page;


        button.className =
            page === currentPage
                ? "active"
                : "";


        button.addEventListener(
            "click",
            () => {

                currentPage =
                    page;

                renderOrdersTable();
            }
        );


        container.appendChild(
            button
        );
    }
}


// =========================================================
// EMPTY STATE
// =========================================================

function showOrdersEmpty() {

    const emptyState =
        document.getElementById(
            "ordersEmpty"
        );


    if (!emptyState) {
        return;
    }


    const hasFilters =
        Boolean(
            currentFilters.search ||
            currentFilters.branch !== "all" ||
            currentFilters.status !== "all" ||
            currentFilters.date !== "all"
        );


    const title =
        emptyState.querySelector(
            ".orders-empty-title"
        );


    const text =
        emptyState.querySelector(
            ".orders-empty-text"
        );


    if (title) {

        title.textContent =
            hasFilters
                ? "No orders found"
                : "No orders yet";
    }


    if (text) {

        text.textContent =
            hasFilters
                ? "No orders match the selected filters. Try adjusting your search or filters."
                : "New customer orders will appear here as soon as they are received.";
    }


    emptyState.style.display =
        "";
}


function hideOrdersEmpty() {

    const emptyState =
        document.getElementById(
            "ordersEmpty"
        );


    if (emptyState) {

        emptyState.style.display =
            "none";
    }
}


// =========================================================
// LOADING STATE
// =========================================================

function showOrdersLoading() {

    const tableBody =
        document.getElementById(
            "ordersTableBody"
        );


    if (!tableBody) {
        return;
    }


    hideOrdersEmpty();


    tableBody.innerHTML = `
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
}


// =========================================================
// ERROR STATE
// =========================================================

function showOrdersError(
    message
) {

    const tableBody =
        document.getElementById(
            "ordersTableBody"
        );


    if (!tableBody) {
        return;
    }


    hideOrdersEmpty();


    tableBody.innerHTML = `
        <tr>

            <td
                colspan="8"
                class="orders-loading"
            >

                <div class="orders-loading-icon">
                    !
                </div>

                <span>
                    ${escapeHtml(message)}
                </span>

            </td>

        </tr>
    `;
}


// =========================================================
// OWNER CONTEXT
// =========================================================

function updateOwnerContext(
    data
) {

    const client =
        data?.client || {};


    const storedSession =
        getStoredSession();


    const ownerName =
        firstValue(
            client.ownerName,
            client.OwnerName,
            data?.ownerName,
            data?.OwnerName,
            storedSession?.ownerName,
            storedSession?.OwnerName,
            storedSession?.userName,
            storedSession?.name,
            "Owner"
        );


    const ownerRole =
        firstValue(
            data?.role,
            client.role,
            client.Role,
            storedSession?.role,
            storedSession?.Role,
            "Owner"
        );


    const avatar =
        document.getElementById(
            "topbarUserAvatar"
        );


    const nameElement =
        document.getElementById(
            "topbarUserName"
        );


    const roleElement =
        document.getElementById(
            "topbarUserRole"
        );


    if (nameElement) {

        nameElement.textContent =
            ownerName;
    }


    if (roleElement) {

        roleElement.textContent =
            ownerRole;
    }


    if (avatar) {

        avatar.textContent =
            String(
                ownerName
            )
                .trim()
                .charAt(0)
                .toUpperCase() || "O";
    }
}


// =========================================================
// DATE FILTER
// =========================================================

function matchesDateFilter(
    dateValue,
    filter
) {

    if (
        !filter ||
        filter === "all"
    ) {

        return true;
    }


    if (!dateValue) {
        return false;
    }


    const orderDate =
        getDubaiDateKey(
            dateValue
        );


    if (!orderDate) {
        return false;
    }


    const today =
        getDubaiDateKey(
            new Date()
        );


    if (filter === "today") {

        return (
            orderDate ===
            today
        );
    }


    const todayDate =
        parseDateKey(today);


    const orderDateObject =
        parseDateKey(orderDate);


    if (
        !todayDate ||
        !orderDateObject
    ) {

        return false;
    }


    const difference =
        Math.floor(
            (
                todayDate -
                orderDateObject
            ) /
            (
                24 *
                60 *
                60 *
                1000
            )
        );


    if (filter === "7") {

        return (
            difference >= 0 &&
            difference < 7
        );
    }


    if (filter === "14") {

        return (
            difference >= 0 &&
            difference < 14
        );
    }


    if (filter === "30") {

        return (
            difference >= 0 &&
            difference < 30
        );
    }


    return true;
}


// =========================================================
// DATE HELPERS
// =========================================================

function getDubaiDateKey(
    value
) {

    try {

        const date =
            value instanceof Date
                ? value
                : new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "";
        }


        const parts =
            new Intl.DateTimeFormat(
                "en-CA",
                {
                    timeZone:
                        DUBAI_TIME_ZONE,

                    year: "numeric",

                    month: "2-digit",

                    day: "2-digit"
                }
            )
                .formatToParts(date);


        const result = {};


        parts.forEach(part => {

            if (
                part.type !==
                "literal"
            ) {

                result[part.type] =
                    part.value;
            }
        });


        return `${result.year}-${result.month}-${result.day}`;

    } catch {

        return "";
    }
}


function parseDateKey(
    dateKey
) {

    const match =
        /^(\d{4})-(\d{2})-(\d{2})$/
            .exec(dateKey);


    if (!match) {
        return null;
    }


    return new Date(
        Date.UTC(
            Number(match[1]),
            Number(match[2]) - 1,
            Number(match[3])
        )
    );
}


// =========================================================
// FORMAT ORDER DATE
// =========================================================

function formatOrderDate(
    value,
    includeDate = false
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

        return String(value);
    }


    try {

        return new Intl.DateTimeFormat(
            "en-AE",
            {
                timeZone:
                    DUBAI_TIME_ZONE,

                day:
                    includeDate
                        ? "2-digit"
                        : undefined,

                month:
                    includeDate
                        ? "short"
                        : undefined,

                year:
                    includeDate
                        ? "numeric"
                        : undefined,

                hour: "2-digit",

                minute: "2-digit",

                hour12: true
            }
        ).format(date);

    } catch {

        return date.toLocaleString();
    }
}


// =========================================================
// CURRENCY
// =========================================================

function getRestaurantCurrency() {

    const session =
        getStoredSession();


    return firstValue(
        session?.restaurant?.currency,
        session?.currency,
        "AED"
    );
}


function formatCurrency(
    amount,
    currency = "AED"
) {

    const numericAmount =
        toNumber(amount);


    try {

        return new Intl.NumberFormat(
            "en-AE",
            {
                style: "currency",
                currency:
                    String(
                        currency ||
                        "AED"
                    )
                        .toUpperCase(),

                minimumFractionDigits: 2,

                maximumFractionDigits: 2
            }
        ).format(
            numericAmount
        );

    } catch {

        return `${currency} ${numericAmount.toFixed(2)}`;
    }
}


// =========================================================
// STATUS HELPERS
// =========================================================

function normalizeStatus(
    status
) {

    const value =
        String(
            status || "pending"
        )
            .trim()
            .toLowerCase();


    if (
        value === "cancelled" ||
        value === "canceled"
    ) {

        return "cancelled";
    }


    if (
        value === "in preparation" ||
        value === "in_preparation" ||
        value === "in-preparation"
    ) {

        return "preparing";
    }


    return value;
}


function formatStatusLabel(
    status
) {

    const normalized =
        normalizeStatus(status);


    const labels = {

        pending:
            "Pending",

        preparing:
            "Preparing",

        ready:
            "Ready",

        completed:
            "Completed",

        rejected:
            "Rejected",

        cancelled:
            "Cancelled",

        cancelled_by_customer:
            "Cancelled",

        accepted:
            "Accepted"
    };


    return (
        labels[normalized] ||
        normalized
            .replace(
                /[_-]/g,
                " "
            )
            .replace(
                /\b\w/g,
                letter =>
                    letter.toUpperCase()
            )
    );
}


function countStatus(
    orders,
    status
) {

    return orders.filter(
        order =>
            normalizeStatus(
                order.status
            ) === status
    ).length;
}


// =========================================================
// ORDERED ITEMS HELPERS
// =========================================================

function normalizeOrderedItems(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return [];
    }


    if (Array.isArray(value)) {

        return value;
    }


    if (
        typeof value === "object"
    ) {

        if (
            Array.isArray(
                value.items
            )
        ) {

            return value.items;
        }


        return value;
    }


    if (
        typeof value === "string"
    ) {

        const trimmed =
            value.trim();


        if (!trimmed) {
            return [];
        }


        try {

            const parsed =
                JSON.parse(trimmed);


            if (
                Array.isArray(parsed)
            ) {

                return parsed;
            }


            if (
                parsed &&
                Array.isArray(
                    parsed.items
                )
            ) {

                return parsed.items;
            }


            return parsed;

        } catch {

            return trimmed;
        }
    }


    return value;
}


function stringifyItems(
    items
) {

    if (
        items === null ||
        items === undefined
    ) {

        return "";
    }


    if (
        typeof items === "string"
    ) {

        return items;
    }


    if (Array.isArray(items)) {

        return items
            .map(item => {

                if (
                    typeof item !==
                    "object"
                ) {

                    return String(item);
                }


                return firstValue(
                    item.name,
                    item.itemName,
                    item.ItemName,
                    item.title,
                    item.Title,
                    JSON.stringify(item)
                );
            })
            .join(" ");
    }


    try {

        return JSON.stringify(
            items
        );

    } catch {

        return String(items);
    }
}


// =========================================================
// SESSION HELPERS
// =========================================================

function getStoredSession() {

    try {

        const raw =
            localStorage.getItem(
                SESSION_DATA_KEY
            );


        if (!raw) {
            return null;
        }


        return JSON.parse(raw);

    } catch {

        return null;
    }
}


function handleSessionExpired() {

    console.warn(
        "[Orders] Session expired."
    );


    clearSession();


    redirectToLogin();
}


function redirectToLogin() {

    window.location.href =
        "../../login/login.html";
}


// =========================================================
// GENERIC HELPERS
// =========================================================

function firstValue(
    ...values
) {

    for (const value of values) {

        if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        ) {

            return value;
        }
    }


    return "";
}


function toNumber(
    value
) {

    if (
        typeof value ===
        "number"
    ) {

        return Number.isFinite(value)
            ? value
            : 0;
    }


    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return 0;
    }


    const cleaned =
        String(value)
            .replace(
                /[^\d.-]/g,
                ""
            );


    const number =
        Number(cleaned);


    return Number.isFinite(number)
        ? number
        : 0;
}


function getTimestamp(
    value
) {

    if (!value) {
        return 0;
    }


    const timestamp =
        new Date(value).getTime();


    return Number.isFinite(timestamp)
        ? timestamp
        : 0;
}


function formatNumber(
    value,
    decimals = 0
) {

    return Number(
        value || 0
    ).toLocaleString(
        "en-AE",
        {
            minimumFractionDigits:
                decimals,

            maximumFractionDigits:
                decimals
        }
    );
}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value ?? "";
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