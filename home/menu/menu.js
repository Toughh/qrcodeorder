// =========================================================
// QR RESTAURANT SAAS
// PREMIUM MENU COMMAND CENTER
// =========================================================

const MENU_WEBHOOK =
    `${N8N_BASE_URL}/owner-menu-manage`;

const SESSION_TOKEN_KEY =
    "qro_session_token";

const SESSION_DATA_KEY =
    "qro_session_data";


// =========================================================
// STATE
// =========================================================

let sessionToken =
    localStorage.getItem(
        SESSION_TOKEN_KEY
    );

let branches = [];
let menuItems = [];

let selectedBranchId = "";

let editingItemId = null;


// =========================================================
// ELEMENTS
// =========================================================

const branchSelect =
    document.getElementById("branchSelect");

const addItemButton =
    document.getElementById("addItemButton");

const searchInput =
    document.getElementById("searchInput");

const categoryFilter =
    document.getElementById("categoryFilter");

const availabilityFilter =
    document.getElementById("availabilityFilter");

const menuTable =
    document.getElementById("menuTable");

const emptyState =
    document.getElementById("emptyState");

const itemModal =
    document.getElementById("itemModal");

const closeModal =
    document.getElementById("closeModal");

const cancelModal =
    document.getElementById("cancelModal");

const itemForm =
    document.getElementById("itemForm");


// =========================================================
// INIT
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    init
);


async function init() {

    sessionToken =
        localStorage.getItem(
            SESSION_TOKEN_KEY
        );

    if (!sessionToken) {

        window.location.href =
            "../login/login.html";

        return;

    }

    bindEvents();

    await loadMenu();

}


// =========================================================
// EVENTS
// =========================================================

function bindEvents() {

    branchSelect?.addEventListener(
        "change",
        async () => {

            selectedBranchId =
                branchSelect.value;

            await loadMenu();

        }
    );


    searchInput?.addEventListener(
        "input",
        renderMenu
    );


    categoryFilter?.addEventListener(
        "change",
        renderMenu
    );


    availabilityFilter?.addEventListener(
        "change",
        renderMenu
    );


    addItemButton?.addEventListener(
        "click",
        () => {

            if (!selectedBranchId) {

                alert(
                    "Please select a specific branch before adding a menu item."
                );

                return;

            }

            openAddModal();

        }
    );


    closeModal?.addEventListener(
        "click",
        closeItemModal
    );


    cancelModal?.addEventListener(
        "click",
        closeItemModal
    );


    itemForm?.addEventListener(
        "submit",
        saveItem
    );

}


// =========================================================
// LOAD MENU
// =========================================================

async function loadMenu() {

    setLoading(true);

    try {

        const result =
            await callMenuAPI({
                action: "list",
                branchId:
                    selectedBranchId
            });


        if (!result.success) {

            throw new Error(
                result.message ||
                "Unable to load menu."
            );

        }


        branches =
            result.branches ||
            [];

        menuItems =
            result.items ||
            [];


        populateBranches();

        updateMetrics(
            result.metrics ||
            {}
        );

        populateCategoryFilter();

        renderBranchSummary(
            result.branches ||
            []
        );

        renderMenu();


    } catch (error) {

        console.error(
            error
        );

        showPageError(
            error.message
        );

    } finally {

        setLoading(false);

    }

}


// =========================================================
// API
// =========================================================

async function callMenuAPI(payload) {

    const response =
        await fetch(
            MENU_WEBHOOK,
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    sessionToken,

                    ...payload

                })

            }
        );


    const raw =
        await response.json();


    const result =
        Array.isArray(raw)
            ? raw[0]
            : raw;


    if (
        !response.ok ||
        !result
    ) {

        throw new Error(
            result?.message ||
            "Menu service unavailable."
        );

    }


    if (
        result.code ===
        "INVALID_SESSION"
    ) {

        localStorage.removeItem(
            SESSION_TOKEN_KEY
        );

        localStorage.removeItem(
            SESSION_DATA_KEY
        );

        window.location.href =
            "../login/login.html";

        return;

    }


    return result;

}


// =========================================================
// BRANCHES
// =========================================================

function populateBranches() {

    const current =
        selectedBranchId;

    branchSelect.innerHTML =
        `<option value="">
            All Branches
        </option>`;


    branches.forEach(
        branch => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                branch.branchId ||
                branch.BranchId;

            option.textContent =
                branch.branchName ||
                branch.BranchName ||
                option.value;

            branchSelect.appendChild(
                option
            );

        }
    );


    branchSelect.value =
        current;

}


// =========================================================
// CATEGORY FILTER
// =========================================================

function populateCategoryFilter() {

    const current =
        categoryFilter.value;

    const categories =
        [
            ...new Set(
                menuItems
                    .map(
                        item =>
                            item.Category
                    )
                    .filter(Boolean)
            )
        ]
        .sort(
            (a, b) =>
                String(a)
                    .localeCompare(
                        String(b)
                    )
        );


    categoryFilter.innerHTML =
        `<option value="">
            All Categories
        </option>`;


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

            categoryFilter.appendChild(
                option
            );

        }
    );


    categoryFilter.value =
        current;

}


// =========================================================
// METRICS
// =========================================================

function updateMetrics(metrics) {

    document.getElementById(
        "totalItems"
    ).textContent =
        metrics.totalItems ??
        0;


    document.getElementById(
        "availableItems"
    ).textContent =
        metrics.availableItems ??
        0;


    document.getElementById(
        "unavailableItems"
    ).textContent =
        metrics.unavailableItems ??
        0;


    document.getElementById(
        "categoryCount"
    ).textContent =
        metrics.categories ??
        0;


    document.getElementById(
        "availabilityRate"
    ).textContent =
        `${metrics.availabilityRate ?? 0}%`;


    document.getElementById(
        "healthAvailability"
    ).textContent =
        `${metrics.availabilityRate ?? 0}%`;


    document.getElementById(
        "missingImages"
    ).textContent =
        metrics.missingImages ??
        0;


    document.getElementById(
        "missingDescriptions"
    ).textContent =
        metrics.missingDescriptions ??
        0;


    const sessionData =
        getSessionData();


    const currency =
        sessionData?.currency ||
        "AED";


    document.getElementById(
        "averagePrice"
    ).textContent =
        `${currency} ${Number(
            metrics.averagePrice || 0
        ).toFixed(2)}`;

}


// =========================================================
// BRANCH SUMMARY
// =========================================================

function renderBranchSummary(summary) {

    const container =
        document.getElementById(
            "branchSummary"
        );


    if (
        selectedBranchId ||
        !summary.length
    ) {

        container.innerHTML = "";

        document.getElementById(
            "branchSummaryPanel"
        ).hidden = true;

        return;

    }


    document.getElementById(
        "branchSummaryPanel"
    ).hidden = false;


    container.innerHTML = `

        <div class="branch-row header">

            <div>BRANCH</div>
            <div>ITEMS</div>
            <div>AVAILABLE</div>
            <div>UNAVAILABLE</div>
            <div>AVAILABILITY</div>

        </div>

        ${
            summary.map(
                branch => `

                    <div class="branch-row">

                        <div class="branch-name">
                            ${escapeHTML(
                                branch.branchName
                            )}
                        </div>

                        <div>
                            ${branch.totalItems}
                        </div>

                        <div>
                            ${branch.availableItems}
                        </div>

                        <div>
                            ${branch.unavailableItems}
                        </div>

                        <div class="branch-availability">
                            ${branch.availability}%
                        </div>

                    </div>

                `
            ).join("")
        }

    `;

}


// =========================================================
// RENDER MENU
// =========================================================

function renderMenu() {

    const search =
        String(
            searchInput.value || ""
        )
        .trim()
        .toLowerCase();


    const category =
        categoryFilter.value;


    const availability =
        availabilityFilter.value;


    const filtered =
        menuItems.filter(
            item => {

                const name =
                    String(
                        item.ItemName ||
                        ""
                    )
                    .toLowerCase();


                const description =
                    String(
                        item.Description ||
                        ""
                    )
                    .toLowerCase();


                const itemCategory =
                    String(
                        item.Category ||
                        ""
                    );


                const available =
                    item.Available === true ||
                    item.Available === "true";


                if (
                    search &&
                    !name.includes(search) &&
                    !description.includes(search)
                ) {
                    return false;
                }


                if (
                    category &&
                    itemCategory !== category
                ) {
                    return false;
                }


                if (
                    availability === "available" &&
                    !available
                ) {
                    return false;
                }


                if (
                    availability === "unavailable" &&
                    available
                ) {
                    return false;
                }


                return true;

            }
        );


    document.getElementById(
        "itemCountLabel"
    ).textContent =
        `${filtered.length} item${filtered.length === 1 ? "" : "s"}`;


    if (!filtered.length) {

        menuTable.innerHTML = "";

        emptyState.hidden = false;

        return;

    }


    emptyState.hidden = true;


    menuTable.innerHTML = `

        <div class="menu-table-header">

            <div>ITEM</div>
            <div>CATEGORY</div>
            <div>PRICE</div>
            <div>BRANCH</div>
            <div>STATUS</div>
            <div>ACTIONS</div>

        </div>

        ${
            filtered
                .map(
                    item =>
                        renderMenuRow(item)
                )
                .join("")
        }

    `;


    bindRowActions();

}


// =========================================================
// MENU ROW
// =========================================================

function renderMenuRow(item) {

    const available =
        item.Available === true ||
        item.Available === "true";


    const branch =
        branches.find(
            b =>
                (
                    b.branchId ||
                    b.BranchId
                ) ===
                item.BranchId
        );


    const branchName =
        branch?.branchName ||
        branch?.BranchName ||
        item.BranchId ||
        "—";


    const image =
        item.ImageURL
            ? `
                <img
                    src="${escapeAttribute(
                        item.ImageURL
                    )}"
                    alt=""
                    onerror="this.style.display='none'"
                >
              `
            : "✦";


    return `

        <div class="menu-row">

            <div class="menu-item-info">

                <div class="menu-image">
                    ${image}
                </div>

                <div>

                    <div class="menu-item-name">
                        ${escapeHTML(
                            item.ItemName ||
                            "Unnamed item"
                        )}
                    </div>

                    <div class="menu-item-description">
                        ${escapeHTML(
                            item.Description ||
                            "No description"
                        )}
                    </div>

                </div>

            </div>


            <div class="menu-cell">
                ${escapeHTML(
                    item.Category ||
                    "—"
                )}
            </div>


            <div class="menu-cell menu-price">
                ${formatCurrency(
                    item.Price
                )}
            </div>


            <div class="menu-cell">
                ${escapeHTML(
                    branchName
                )}
            </div>


            <div>

                <span
                    class="status-pill ${
                        available
                            ? "available"
                            : "unavailable"
                    }"
                >
                    ${
                        available
                            ? "Available"
                            : "Unavailable"
                    }
                </span>

            </div>


            <div class="row-actions">

                ${
                    selectedBranchId
                        ? `
                            <button
                                class="action-button"
                                data-action="edit"
                                data-id="${escapeAttribute(
                                    item.ItemID
                                )}"
                            >
                                Edit
                            </button>

                            <button
                                class="action-button"
                                data-action="toggle"
                                data-id="${escapeAttribute(
                                    item.ItemID
                                )}"
                            >
                                ${
                                    available
                                        ? "Disable"
                                        : "Enable"
                                }
                            </button>

                            <button
                                class="action-button danger"
                                data-action="delete"
                                data-id="${escapeAttribute(
                                    item.ItemID
                                )}"
                            >
                                Delete
                            </button>
                        `
                        : `
                            <span class="section-note">
                                Select branch to manage
                            </span>
                        `
                }

            </div>

        </div>

    `;

}


// =========================================================
// ROW ACTIONS
// =========================================================

function bindRowActions() {

    document
        .querySelectorAll(
            ".action-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const id =
                            button.dataset.id;

                        const action =
                            button.dataset.action;


                        if (
                            action === "edit"
                        ) {

                            openEditModal(
                                id
                            );

                        }


                        if (
                            action === "toggle"
                        ) {

                            await toggleItem(
                                id
                            );

                        }


                        if (
                            action === "delete"
                        ) {

                            await deleteItem(
                                id
                            );

                        }

                    }
                );

            }
        );

}


// =========================================================
// ADD MODAL
// =========================================================

function openAddModal() {

    editingItemId = null;

    document.getElementById(
        "modalTitle"
    ).textContent =
        "Add Menu Item";


    itemForm.reset();


    document.getElementById(
        "itemAvailable"
    ).checked = true;


    populateModalBranches();


    document.getElementById(
        "itemBranch"
    ).value =
        selectedBranchId;


    itemModal.hidden = false;

}


// =========================================================
// EDIT MODAL
// =========================================================

function openEditModal(itemId) {

    const item =
        menuItems.find(
            item =>
                item.ItemID === itemId
        );


    if (!item) {
        return;
    }


    editingItemId =
        itemId;


    document.getElementById(
        "modalTitle"
    ).textContent =
        "Edit Menu Item";


    populateModalBranches();


    document.getElementById(
        "itemBranch"
    ).value =
        item.BranchId || "";


    document.getElementById(
        "itemCategory"
    ).value =
        item.Category || "";


    document.getElementById(
        "itemName"
    ).value =
        item.ItemName || "";


    document.getElementById(
        "itemPrice"
    ).value =
        item.Price ?? "";


    document.getElementById(
        "itemImage"
    ).value =
        item.ImageURL || "";


    document.getElementById(
        "itemDescription"
    ).value =
        item.Description || "";


    document.getElementById(
        "itemAvailable"
    ).checked =
        item.Available === true ||
        item.Available === "true";


    itemModal.hidden = false;

}


// =========================================================
// MODAL BRANCHES
// =========================================================

function populateModalBranches() {

    const select =
        document.getElementById(
            "itemBranch"
        );


    select.innerHTML =
        "";


    branches.forEach(
        branch => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                branch.branchId ||
                branch.BranchId;

            option.textContent =
                branch.branchName ||
                branch.BranchName;

            select.appendChild(
                option
            );

        }
    );

}


// =========================================================
// SAVE
// =========================================================

async function saveItem(event) {

    event.preventDefault();


    const payload = {

        action:
            editingItemId
                ? "update"
                : "create",

        branchId:
            document.getElementById(
                "itemBranch"
            ).value,

        itemId:
            editingItemId || "",

        itemName:
            document.getElementById(
                "itemName"
            ).value.trim(),

        category:
            document.getElementById(
                "itemCategory"
            ).value.trim(),

        price:
            Number(
                document.getElementById(
                    "itemPrice"
                ).value
            ),

        imageURL:
            document.getElementById(
                "itemImage"
            ).value.trim(),

        description:
            document.getElementById(
                "itemDescription"
            ).value.trim(),

        available:
            document.getElementById(
                "itemAvailable"
            ).checked

    };


    try {

        const result =
            await callMenuAPI(
                payload
            );


        if (!result.success) {

            throw new Error(
                result.message ||
                "Unable to save menu item."
            );

        }


        closeItemModal();

        await loadMenu();


    } catch (error) {

        document.getElementById(
            "modalError"
        ).textContent =
            error.message;

        document.getElementById(
            "modalError"
        ).hidden = false;

    }

}


// =========================================================
// TOGGLE
// =========================================================

async function toggleItem(itemId) {

    const item =
        menuItems.find(
            item =>
                item.ItemID === itemId
        );


    if (!item) {
        return;
    }


    const available =
        item.Available === true ||
        item.Available === "true";


    try {

        const result =
            await callMenuAPI({

                action: "toggle",

                itemId,

                branchId:
                    selectedBranchId,

                available:
                    !available

            });


        if (!result.success) {

            throw new Error(
                result.message ||
                "Unable to update availability."
            );

        }


        await loadMenu();


    } catch (error) {

        alert(
            error.message
        );

    }

}


// =========================================================
// DELETE
// =========================================================

async function deleteItem(itemId) {

    const item =
        menuItems.find(
            item =>
                item.ItemID === itemId
        );


    if (!item) {
        return;
    }


    const confirmed =
        confirm(
            `Delete "${item.ItemName}"?\n\n` +
            "This will permanently remove the item " +
            "from this branch menu."
        );


    if (!confirmed) {
        return;
    }


    try {

        const result =
            await callMenuAPI({

                action: "delete",

                itemId,

                branchId:
                    selectedBranchId

            });


        if (!result.success) {

            throw new Error(
                result.message ||
                "Unable to delete menu item."
            );

        }


        await loadMenu();


    } catch (error) {

        alert(
            error.message
        );

    }

}


// =========================================================
// CLOSE MODAL
// =========================================================

function closeItemModal() {

    itemModal.hidden = true;

    editingItemId = null;

}


// =========================================================
// LOADING
// =========================================================

function setLoading(isLoading) {

    if (!isLoading) {
        return;
    }

    menuTable.innerHTML = `
        <div class="empty-state">
            <div class="loader"></div>
            <p>Loading menu...</p>
        </div>
    `;

}


// =========================================================
// PAGE ERROR
// =========================================================

function showPageError(message) {

    menuTable.innerHTML = `

        <div class="empty-state">

            <div class="empty-icon">
                !
            </div>

            <h3>
                Unable to load menu
            </h3>

            <p>
                ${escapeHTML(
                    message ||
                    "Please try again."
                )}
            </p>

        </div>

    `;

}


// =========================================================
// SESSION
// =========================================================

function getSessionData() {

    try {

        return JSON.parse(
            localStorage.getItem(
                SESSION_DATA_KEY
            ) || "{}"
        );

    } catch {

        return {};

    }

}


// =========================================================
// CURRENCY
// =========================================================

function formatCurrency(value) {

    const session =
        getSessionData();

    const currency =
        session?.currency ||
        "AED";


    return `${currency} ${Number(
        value || 0
    ).toFixed(2)}`;

}


// =========================================================
// HTML SAFETY
// =========================================================

function escapeHTML(value) {

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


function escapeAttribute(value) {

    return escapeHTML(
        value
    );

}