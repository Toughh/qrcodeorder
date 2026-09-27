// ==========================================
// QR ORDER SAAS
// PREMIUM OWNER MENU MANAGEMENT
// ==========================================


// ==========================================
// CONFIGURATION
// ==========================================

const MENU_MANAGE_WEBHOOK =
    `${N8N_BASE_URL}/owner-menu-manage`;

const SESSION_TOKEN_KEY =
    "qro_session_token";


// ==========================================
// STATE
// ==========================================

let menuData = null;

let menuItems = [];

let branches = [];

let editingItem = null;

let deletingItem = null;


// ==========================================
// DOM HELPER
// ==========================================

function $(id) {

    return document.getElementById(id);

}


// ==========================================
// SESSION
// ==========================================

function getSessionToken() {

    return localStorage.getItem(
        SESSION_TOKEN_KEY
    ) || "";

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ==========================================
// INITIALIZE
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeEvents();

        loadMenu();

    }
);


// ==========================================
// EVENTS
// ==========================================

function initializeEvents() {


    $("branchFilter")
        ?.addEventListener(
            "change",
            () => {

                loadMenu(
                    $("branchFilter").value
                );

            }
        );


    $("categoryFilter")
        ?.addEventListener(
            "change",
            renderMenu
        );


    $("menuSearch")
        ?.addEventListener(
            "input",
            renderMenu
        );


    $("refreshMenuBtn")
        ?.addEventListener(
            "click",
            () => {

                loadMenu(
                    $("branchFilter")?.value || ""
                );

            }
        );


    $("addMenuItemBtn")
        ?.addEventListener(
            "click",
            () => openAddModal()
        );


    $("emptyAddBtn")
        ?.addEventListener(
            "click",
            () => openAddModal()
        );


    $("menuForm")
        ?.addEventListener(
            "submit",
            handleFormSubmit
        );


    $("cancelMenuModal")
        ?.addEventListener(
            "click",
            closeMenuModal
        );


    $("cancelDelete")
        ?.addEventListener(
            "click",
            closeDeleteModal
        );


    $("confirmDelete")
        ?.addEventListener(
            "click",
            confirmDelete
        );


    $("logoutBtn")
        ?.addEventListener(
            "click",
            handleLogout
        );


    $("menuModal")
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target.id ===
                    "menuModal"
                ) {

                    closeMenuModal();

                }

            }
        );


    $("deleteModal")
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target.id ===
                    "deleteModal"
                ) {

                    closeDeleteModal();

                }

            }
        );


    document.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Escape") {
                return;
            }

            closeMenuModal();
            closeDeleteModal();

        }
    );

}


// ==========================================
// LOAD MENU
// ==========================================

async function loadMenu(
    branchId = ""
) {

    const sessionToken =
        getSessionToken();


    if (!sessionToken) {

        redirectToLogin();

        return;
    }


    showLoading();


    try {

        const data =
            await menuRequest(
                "list",
                {
                    branchId
                }
            );


        if (
            !data.success
        ) {

            handleApiError(data);

            return;
        }


        menuData = data;

        menuItems =
            Array.isArray(data.items)
                ? data.items
                : [];


        branches =
            Array.isArray(data.branches)
                ? data.branches
                : [];


        populateUser(data);

        populateBranches();

        populateCategories();

        populateMetrics();

        renderMenu();

        hideLoading();


        showMessage(
            "Menu data loaded successfully.",
            "success"
        );

    }
    catch (error) {

        console.error(
            "Menu load error:",
            error
        );

        hideLoading();


        showMessage(
            error.message ||
            "Unable to load menu.",
            "error"
        );

    }

}


// ==========================================
// API REQUEST
// ==========================================

async function menuRequest(
    action,
    values = {}
) {

    const sessionToken =
        getSessionToken();


    const body = {

        sessionToken,

        action,

        branchId:
            values.branchId || "",

        itemId:
            values.itemId || "",

        itemName:
            values.itemName || "",

        category:
            values.category || "",

        description:
            values.description || "",

        imageURL:
            values.imageURL || "",

        price:
            values.price !== undefined
                ? values.price
                : "",

        available:
            values.available !== undefined
                ? values.available
                : ""

    };


    const response =
        await fetch(
            MENU_MANAGE_WEBHOOK,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(body)
            }
        );


    let data;

    try {

        data =
            await response.json();

    }
    catch {

        throw new Error(
            "Invalid response received from menu service."
        );

    }


    if (
        data.code ===
        "INVALID_SESSION"
    ) {

        redirectToLogin();

        return data;
    }


    if (
        !response.ok
    ) {

        throw new Error(
            data.message ||
            "Menu request failed."
        );

    }


    return data;

}


// ==========================================
// USER
// ==========================================

function populateUser(data) {

    const profile =
        data.profile || {};


    /*
     * The current menu workflow primarily
     * returns restaurant/menu information.
     *
     * If session profile data exists locally,
     * use it for the topbar.
     */

    let sessionData = null;


    try {

        sessionData =
            JSON.parse(
                localStorage.getItem(
                    "qro_session_data"
                ) || "null"
            );

    }
    catch {

        sessionData = null;

    }


    const ownerName =
        profile.ownerName ||
        sessionData?.ownerName ||
        sessionData?.Name ||
        sessionData?.name ||
        "Owner";


    const role =
        sessionData?.Role ||
        sessionData?.role ||
        "Owner";


    setText(
        "userName",
        ownerName
    );


    setText(
        "userRole",
        role
    );


    setText(
        "userAvatar",
        getInitial(ownerName)
    );

}


// ==========================================
// BRANCHES
// ==========================================

function populateBranches() {

    const filter =
        $("branchFilter");

    const modalBranch =
        $("itemBranch");


    if (!filter) {
        return;
    }


    const currentFilter =
        filter.value;


    filter.innerHTML = `
        <option value="">
            All Branches
        </option>
    `;


    if (modalBranch) {

        modalBranch.innerHTML = `
            <option value="">
                Select Branch
            </option>
        `;

    }


    branches.forEach(
        branch => {

            const branchId =
                String(
                    branch.branchId ||
                    branch.BranchId ||
                    ""
                ).trim();


            const branchName =
                String(
                    branch.branchName ||
                    branch.BranchName ||
                    branchId
                ).trim();


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


            filter.appendChild(
                option
            );


            if (modalBranch) {

                const modalOption =
                    option.cloneNode(true);

                modalBranch.appendChild(
                    modalOption
                );

            }

        }
    );


    /*
     * Preserve current branch filter.
     */

    if (
        currentFilter &&
        [...filter.options]
            .some(
                option =>
                    option.value ===
                    currentFilter
            )
    ) {

        filter.value =
            currentFilter;

    }

}


// ==========================================
// CATEGORIES
// ==========================================

function populateCategories() {

    const select =
        $("categoryFilter");


    if (!select) {
        return;
    }


    const currentValue =
        select.value;


    const categories =
        [
            ...new Set(
                menuItems
                    .map(
                        item =>
                            String(
                                item.Category ||
                                item.category ||
                                ""
                            ).trim()
                    )
                    .filter(Boolean)
            )
        ]
        .sort(
            (a, b) =>
                a.localeCompare(b)
        );


    select.innerHTML = `
        <option value="">
            All Categories
        </option>
    `;


    categories.forEach(
        category => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                category;

            option.textContent =
                category;


            select.appendChild(
                option
            );

        }
    );


    if (
        categories.includes(
            currentValue
        )
    ) {

        select.value =
            currentValue;

    }

}


// ==========================================
// METRICS
// ==========================================

function populateMetrics() {

    const metrics =
        menuData?.metrics || {};


    setText(
        "totalItems",
        Number(
            metrics.totalItems || 0
        )
    );


    setText(
        "availableItems",
        Number(
            metrics.availableItems || 0
        )
    );


    setText(
        "unavailableItems",
        Number(
            metrics.unavailableItems || 0
        )
    );


    setText(
        "categoryCount",
        Number(
            metrics.categories || 0
        )
    );


    setText(
        "averagePrice",
        `AED ${Number(
            metrics.averagePrice || 0
        ).toFixed(2)}`
    );


    setText(
        "availabilityRate",
        `${Number(
            metrics.availabilityRate || 0
        ).toFixed(1)}%`
    );


    const total =
        Number(
            metrics.totalItems || 0
        );


    setText(
        "menuSummary",
        total === 0
            ? "No menu items have been added yet."
            : `${total} menu item${total === 1 ? "" : "s"} across your restaurant branches.`
    );

}


// ==========================================
// RENDER MENU
// ==========================================

function renderMenu() {

    const tbody =
        $("menuTableBody");


    if (!tbody) {
        return;
    }


    const search =
        String(
            $("menuSearch")?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const category =
        String(
            $("categoryFilter")?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const branch =
        String(
            $("branchFilter")?.value ||
            ""
        )
            .trim();


    const filtered =
        menuItems.filter(
            item => {

                const itemName =
                    String(
                        item.ItemName ||
                        item.itemName ||
                        ""
                    ).toLowerCase();


                const itemCategory =
                    String(
                        item.Category ||
                        item.category ||
                        ""
                    ).toLowerCase();


                const description =
                    String(
                        item.Description ||
                        item.description ||
                        ""
                    ).toLowerCase();


                const itemBranch =
                    String(
                        item.BranchId ||
                        item.branchId ||
                        ""
                    ).trim();


                const matchesSearch =
                    !search ||
                    itemName.includes(search) ||
                    itemCategory.includes(search) ||
                    description.includes(search);


                const matchesCategory =
                    !category ||
                    itemCategory === category;


                const matchesBranch =
                    !branch ||
                    itemBranch === branch;


                return (
                    matchesSearch &&
                    matchesCategory &&
                    matchesBranch
                );

            }
        );


    tbody.innerHTML = "";


    if (
        menuItems.length === 0
    ) {

        showEmptyState();

        return;

    }


    hideEmptyState();


    if (
        filtered.length === 0
    ) {

        $("menuTableContainer")
            ?.classList.add("hidden");

        $("noFilterResults")
            ?.classList.remove("hidden");

        return;

    }


    $("menuTableContainer")
        ?.classList.remove("hidden");

    $("noFilterResults")
        ?.classList.add("hidden");


    filtered.forEach(
        item => {

            tbody.appendChild(
                createMenuRow(item)
            );

        }
    );

}


// ==========================================
// CREATE TABLE ROW
// ==========================================

function createMenuRow(item) {

    const row =
        document.createElement(
            "tr"
        );


    const itemId =
        getItemId(item);


    const itemName =
        getItemName(item);


    const category =
        getItemCategory(item);


    const description =
        getItemDescription(item);


    const branchId =
        getItemBranch(item);


    const price =
        Number(
            item.Price ??
            item.price ??
            0
        );


    const available =
        isItemAvailable(item);


    const branchName =
        getBranchName(branchId);


    const imageUrl =
        getImageUrl(item);


    const imageHtml =
        imageUrl
            ? `
                <img
                    class="item-image"
                    src="${escapeHtml(imageUrl)}"
                    alt="${escapeHtml(itemName)}"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                >
                <div
                    class="item-image-placeholder"
                    style="display:none;"
                >
                    ${escapeHtml(
                        getInitial(itemName)
                    )}
                </div>
              `
            : `
                <div class="item-image-placeholder">
                    ${escapeHtml(
                        getInitial(itemName)
                    )}
                </div>
              `;


    row.innerHTML = `

        <td>

            <div class="menu-item-cell">

                ${imageHtml}

                <div class="menu-item-info">

                    <strong>
                        ${escapeHtml(itemName)}
                    </strong>

                    <span>
                        ${escapeHtml(
                            description ||
                            "No description added."
                        )}
                    </span>

                </div>

            </div>

        </td>


        <td>

            <span class="category-badge">
                ${escapeHtml(
                    category ||
                    "Uncategorized"
                )}
            </span>

        </td>


        <td>

            <span class="branch-name">
                ${escapeHtml(
                    branchName
                )}
            </span>

        </td>


        <td>

            <strong class="price-value">
                AED ${price.toFixed(2)}
            </strong>

        </td>


        <td>

            <div class="status-cell">

                <span class="status-badge ${available ? "available" : "unavailable"}">

                    <span class="status-dot"></span>

                    ${available
                        ? "Available"
                        : "Unavailable"
                    }

                </span>

            </div>

        </td>


        <td>

            <div class="row-actions">

                <button
                    type="button"
                    class="icon-action"
                    title="Edit"
                    data-action="edit"
                    data-item-id="${escapeHtml(itemId)}"
                    data-branch-id="${escapeHtml(branchId)}"
                >
                    ✎
                </button>


                <button
                    type="button"
                    class="icon-action"
                    title="${available ? "Disable" : "Enable"}"
                    data-action="toggle"
                    data-item-id="${escapeHtml(itemId)}"
                    data-branch-id="${escapeHtml(branchId)}"
                >
                    ${available ? "◉" : "○"}
                </button>


                <button
                    type="button"
                    class="icon-action delete-action"
                    title="Delete"
                    data-action="delete"
                    data-item-id="${escapeHtml(itemId)}"
                    data-branch-id="${escapeHtml(branchId)}"
                >
                    ×
                </button>

            </div>

        </td>

    `;


    row.querySelectorAll(
        "[data-action]"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const action =
                            button.dataset.action;


                        if (
                            action ===
                            "edit"
                        ) {

                            openEditModal(
                                item
                            );

                        }


                        if (
                            action ===
                            "toggle"
                        ) {

                            toggleItem(
                                item
                            );

                        }


                        if (
                            action ===
                            "delete"
                        ) {

                            openDeleteModal(
                                item
                            );

                        }

                    }
                );

            }
        );


    return row;

}


// ==========================================
// EMPTY STATE
// ==========================================

function showEmptyState() {

    $("menuTableContainer")
        ?.classList.add("hidden");


    $("noFilterResults")
        ?.classList.add("hidden");


    $("menuEmpty")
        ?.classList.remove("hidden");

}


function hideEmptyState() {

    $("menuEmpty")
        ?.classList.add("hidden");

}


// ==========================================
// ADD MODAL
// ==========================================

function openAddModal() {

    editingItem = null;


    $("menuForm")?.reset();


    $("itemId").value =
        "";


    $("modalEyebrow").textContent =
        "NEW MENU ITEM";


    $("modalTitle").textContent =
        "Add Menu Item";


    $("modalDescription").textContent =
        "Add a new item to your restaurant menu.";


    $("saveMenuItemBtn").innerHTML =
        `<span>✓</span> Save Menu Item`;


    $("itemAvailable").checked =
        true;


    $("formError").textContent =
        "";


    const selectedBranch =
        $("branchFilter")?.value ||
        "";


    if (selectedBranch) {

        $("itemBranch").value =
            selectedBranch;

    }


    openModal(
        "menuModal"
    );


    setTimeout(
        () => {

            $("itemName")
                ?.focus();

        },
        100
    );

}


// ==========================================
// EDIT MODAL
// ==========================================

function openEditModal(item) {

    editingItem =
        item;


    const itemId =
        getItemId(item);


    $("itemId").value =
        itemId;


    $("itemBranch").value =
        getItemBranch(item);


    $("itemCategory").value =
        getItemCategory(item);


    $("itemName").value =
        getItemName(item);


    $("itemPrice").value =
        Number(
            item.Price ??
            item.price ??
            0
        );


    $("itemImage").value =
        getImageUrl(item);


    $("itemDescription").value =
        getItemDescription(item);


    $("itemAvailable").checked =
        isItemAvailable(item);


    $("modalEyebrow").textContent =
        "EDIT MENU ITEM";


    $("modalTitle").textContent =
        "Update Menu Item";


    $("modalDescription").textContent =
        "Update the details of this menu item.";


    $("saveMenuItemBtn").innerHTML =
        `<span>✓</span> Update Menu Item`;


    $("formError").textContent =
        "";


    openModal(
        "menuModal"
    );

}


// ==========================================
// FORM SUBMIT
// ==========================================

async function handleFormSubmit(
    event
) {

    event.preventDefault();


    const branchId =
        $("itemBranch")?.value.trim();


    const itemName =
        $("itemName")?.value.trim();


    const category =
        $("itemCategory")?.value.trim();


    const price =
        Number(
            $("itemPrice")?.value
        );


    const description =
        $("itemDescription")?.value.trim();


    const imageURL =
        $("itemImage")?.value.trim();


    const available =
        $("itemAvailable")?.checked === true;


    const error =
        $("formError");


    error.textContent =
        "";


    if (!branchId) {

        error.textContent =
            "Please select a branch.";

        return;

    }


    if (!itemName) {

        error.textContent =
            "Menu item name is required.";

        return;

    }


    if (!category) {

        error.textContent =
            "Category is required.";

        return;

    }


    if (
        Number.isNaN(price) ||
        price < 0
    ) {

        error.textContent =
            "Please enter a valid price.";

        return;

    }


    const button =
        $("saveMenuItemBtn");


    button.disabled =
        true;


    button.innerHTML =
        `<span>⟳</span> ${
            editingItem
                ? "Updating..."
                : "Saving..."
        }`;


    try {

        let data;


        if (editingItem) {

            data =
                await menuRequest(
                    "update",
                    {
                        branchId,

                        itemId:
                            getItemId(
                                editingItem
                            ),

                        itemName,

                        category,

                        description,

                        imageURL,

                        price,

                        available
                    }
                );

        }
        else {

            data =
                await menuRequest(
                    "create",
                    {
                        branchId,

                        itemName,

                        category,

                        description,

                        imageURL,

                        price,

                        available
                    }
                );

        }


        if (
            !data ||
            !data.success
        ) {

            error.textContent =
                data?.message ||
                "Unable to save menu item.";

            return;

        }


        closeMenuModal();


        showMessage(
            data.message ||
            "Menu item saved successfully.",
            "success"
        );


        await loadMenu(
            branchId
        );

    }
    catch (errorObject) {

        console.error(
            "Menu save error:",
            errorObject
        );


        error.textContent =
            errorObject.message ||
            "Unable to save menu item.";

    }
    finally {

        button.disabled =
            false;


        button.innerHTML =
            editingItem
                ? `<span>✓</span> Update Menu Item`
                : `<span>✓</span> Save Menu Item`;

    }

}


// ==========================================
// TOGGLE
// ==========================================

async function toggleItem(item) {

    const itemId =
        getItemId(item);


    const branchId =
        getItemBranch(item);


    if (
        !itemId ||
        !branchId
    ) {

        showMessage(
            "Menu item information is incomplete.",
            "error"
        );

        return;

    }


    const current =
        isItemAvailable(item);


    try {

        showMessage(
            current
                ? "Disabling menu item..."
                : "Enabling menu item...",
            "success"
        );


        const data =
            await menuRequest(
                "toggle",
                {
                    branchId,

                    itemId
                }
            );


        if (
            !data ||
            !data.success
        ) {

            throw new Error(
                data?.message ||
                "Unable to change item availability."
            );

        }


        showMessage(
            data.message ||
            "Menu availability updated.",
            "success"
        );


        await loadMenu(
            $("branchFilter")?.value || ""
        );

    }
    catch (error) {

        console.error(
            "Menu toggle error:",
            error
        );


        showMessage(
            error.message ||
            "Unable to change item availability.",
            "error"
        );

    }

}


// ==========================================
// DELETE MODAL
// ==========================================

function openDeleteModal(item) {

    deletingItem =
        item;


    $("deleteItemName").textContent =
        getItemName(item);


    $("deleteItemCategory").textContent =
        getItemCategory(item) ||
        "Uncategorized";


    $("deleteError").textContent =
        "";


    $("confirmDelete").disabled =
        false;


    $("confirmDelete").textContent =
        "Delete Item";


    openModal(
        "deleteModal"
    );

}


function closeDeleteModal() {

    closeModal(
        "deleteModal"
    );


    deletingItem =
        null;

}


// ==========================================
// CONFIRM DELETE
// ==========================================

async function confirmDelete() {

    if (!deletingItem) {
        return;
    }


    const item =
        deletingItem;


    const itemId =
        getItemId(item);


    const branchId =
        getItemBranch(item);


    const button =
        $("confirmDelete");


    const error =
        $("deleteError");


    if (
        !itemId ||
        !branchId
    ) {

        error.textContent =
            "Menu item information is incomplete.";

        return;

    }


    button.disabled =
        true;


    button.textContent =
        "Deleting...";


    error.textContent =
        "";


    try {

        const data =
            await menuRequest(
                "delete",
                {
                    branchId,

                    itemId
                }
            );


        if (
            !data ||
            !data.success
        ) {

            throw new Error(
                data?.message ||
                "Unable to delete menu item."
            );

        }


        closeDeleteModal();


        showMessage(
            data.message ||
            "Menu item deleted successfully.",
            "success"
        );


        await loadMenu(
            $("branchFilter")?.value || ""
        );

    }
    catch (errorObject) {

        console.error(
            "Menu delete error:",
            errorObject
        );


        error.textContent =
            errorObject.message ||
            "Unable to delete menu item.";

    }
    finally {

        button.disabled =
            false;


        button.textContent =
            "Delete Item";

    }

}


// ==========================================
// ITEM HELPERS
// ==========================================

function getItemId(item) {

    return String(
        item.ItemID ||
        item["\ufeffItemID"] ||
        item.itemId ||
        ""
    ).trim();

}


function getItemName(item) {

    return String(
        item.ItemName ||
        item.itemName ||
        ""
    ).trim();

}


function getItemCategory(item) {

    return String(
        item.Category ||
        item.category ||
        ""
    ).trim();

}


function getItemDescription(item) {

    return String(
        item.Description ||
        item.description ||
        ""
    ).trim();

}


function getItemBranch(item) {

    return String(
        item.BranchId ||
        item.branchId ||
        ""
    ).trim();

}


function getImageUrl(item) {

    const value =
        item.ImageURL ||
        item.imageURL ||
        "";


    if (
        Array.isArray(value)
    ) {

        return String(
            value[0]?.url ||
            value[0] ||
            ""
        ).trim();

    }


    return String(
        value
    ).trim();

}


function isItemAvailable(item) {

    const value =
        item.Available ??
        item.available;


    return (
        value === true ||
        String(value)
            .toLowerCase()
            .trim() === "true" ||
        String(value)
            .toLowerCase()
            .trim() === "checked"
    );

}


function getBranchName(
    branchId
) {

    const branch =
        branches.find(
            branch =>
                String(
                    branch.branchId ||
                    branch.BranchId ||
                    ""
                ).trim() ===
                String(
                    branchId
                ).trim()
        );


    return (
        branch?.branchName ||
        branch?.BranchName ||
        branchId ||
        "Unknown Branch"
    );

}


// ==========================================
// MODAL HELPERS
// ==========================================

function openModal(id) {

    const modal =
        $(id);


    if (!modal) {
        return;
    }


    modal.classList.add(
        "active"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}


function closeModal(id) {

    const modal =
        $(id);


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "active"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );

}


function closeMenuModal() {

    closeModal(
        "menuModal"
    );


    editingItem =
        null;

}


// ==========================================
// LOADING
// ==========================================

function showLoading() {

    $("menuLoading")
        ?.classList.remove(
            "hidden"
        );


    $("menuTableContainer")
        ?.classList.add(
            "hidden"
        );


    $("menuEmpty")
        ?.classList.add(
            "hidden"
        );


    $("noFilterResults")
        ?.classList.add(
            "hidden"
        );

}


function hideLoading() {

    $("menuLoading")
        ?.classList.add(
            "hidden"
        );

}


// ==========================================
// MESSAGE
// ==========================================

function showMessage(
    message,
    type = "success"
) {

    const bar =
        $("menuMessageBar");


    const element =
        $("menuMessage");


    if (!bar || !element) {
        return;
    }


    element.textContent =
        message;


    bar.classList.remove(
        "error",
        "success"
    );


    bar.classList.add(
        type === "error"
            ? "error"
            : "success"
    );

}


// ==========================================
// API ERROR
// ==========================================

function handleApiError(
    data
) {

    if (
        data?.code ===
        "INVALID_SESSION"
    ) {

        redirectToLogin();

        return;

    }


    showMessage(
        data?.message ||
        "Unable to process menu request.",
        "error"
    );

}


// ==========================================
// TEXT
// ==========================================

function setText(
    id,
    value
) {

    const element =
        $(id);


    if (element) {

        element.textContent =
            value ?? "";

    }

}


// ==========================================
// INITIAL
// ==========================================

function getInitial(
    name
) {

    const value =
        String(
            name ||
            "A"
        )
            .trim();


    return (
        value.charAt(0)
            .toUpperCase() ||
        "A"
    );

}


// ==========================================
// LOGIN
// ==========================================

function redirectToLogin() {

    window.location.href =
        "../../login/login.html";

}


// ==========================================
// LOGOUT
// ==========================================

function handleLogout() {

    try {

        if (
            typeof logout ===
            "function"
        ) {

            logout();

            return;

        }

    }
    catch (error) {

        console.error(
            "Logout error:",
            error
        );

    }


    localStorage.removeItem(
        SESSION_TOKEN_KEY
    );


    localStorage.removeItem(
        "qro_session_data"
    );


    localStorage.removeItem(
        "qro_validated_session"
    );


    redirectToLogin();

}