/* =========================================================
   QR RESTAURANT SAAS - PREMIUM MENU MANAGEMENT
   Backend: POST /owner-menu-manage
   ========================================================= */

const MENU_WEBHOOK = `${N8N_BASE_URL}/owner-menu-manage`;
const SESSION_TOKEN_KEY = "qro_session_token";
const SESSION_DATA_KEY = "qro_session_data";

const state = {
    items: [],
    branches: [],
    metrics: {},
    editing: null,
    confirmAction: null,
    currentBranchId: ""
};

const $ = id => document.getElementById(id);

const esc = value =>
    String(value ?? "").replace(
        /[&<>"']/g,
        c => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[c])
    );

const isAvailable = value =>
    value === true ||
    String(value ?? "").toLowerCase() === "true" ||
    String(value ?? "").toLowerCase() === "checked";

const itemIdOf = item =>
    String(
        item.ItemID ||
        item["\ufeffItemID"] ||
        ""
    ).trim();

const money = value =>
    `AED ${Number(value || 0).toFixed(2)}`;


/* =========================================================
   SESSION
   ========================================================= */

function sessionToken() {
    return String(
        localStorage.getItem(SESSION_TOKEN_KEY) || ""
    ).trim();
}

function sessionData() {
    try {
        return JSON.parse(
            localStorage.getItem(SESSION_DATA_KEY) || "{}"
        );
    } catch {
        return {};
    }
}

function ownerName() {
    const s = sessionData();

    return (
        s.ownerName ||
        s.Name ||
        s.name ||
        s.userName ||
        s.UserName ||
        "Owner"
    );
}

function roleName() {
    const s = sessionData();

    return (
        s.role ||
        s.Role ||
        "Owner"
    );
}


/* =========================================================
   API
   ========================================================= */

async function api(action, payload = {}) {

    const token = sessionToken();

    if (!token) {
        throw new Error(
            "Your session has expired. Please sign in again."
        );
    }

    const response = await fetch(
        MENU_WEBHOOK,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                sessionToken: token,
                action,
                ...payload
            })
        }
    );

    let data = {};

    try {
        data = await response.json();
    } catch {
        throw new Error(
            "The menu service returned an invalid response."
        );
    }

    if (
        !response.ok ||
        data.success === false
    ) {
        throw new Error(
            data.message ||
            "Menu operation failed."
        );
    }

    return data;
}


/* =========================================================
   PAGE MESSAGE
   ========================================================= */

function showPageMessage(
    message,
    type = "error"
) {

    const el = $("pageMessage");

    el.textContent = message;

    el.className =
        `page-message ${type}`;

    el.hidden = false;

    clearTimeout(
        showPageMessage.timer
    );

    showPageMessage.timer =
        setTimeout(
            () => {
                el.hidden = true;
            },
            5000
        );
}


/* =========================================================
   LOADING
   ========================================================= */

function setLoading(on) {

    $("loadingState").hidden = !on;
}


/* =========================================================
   TOP BAR
   ========================================================= */

function setTopbar() {

    const name = ownerName();

    $("topbarUserName").textContent =
        name;

    $("topbarUserRole").textContent =
        roleName();

    $("topbarUserAvatar").textContent =
        name.charAt(0).toUpperCase();
}


/* =========================================================
   BRANCH
   ========================================================= */

function branchName(id) {

    const b =
        state.branches.find(
            x =>
                String(x.BranchId) ===
                String(id)
        );

    return (
        b?.BranchName ||
        b?.Name ||
        id ||
        "—"
    );
}


function populateBranches() {

    const filter =
        $("branchFilter");

    const modal =
        $("modalBranch");

    const selected =
        state.currentBranchId;

    filter.innerHTML =
        `<option value="">All branches</option>` +
        state.branches
            .map(
                b =>
                    `<option value="${esc(
                        b.BranchId
                    )}">
                        ${esc(
                            b.BranchName ||
                            b.BranchId
                        )}
                    </option>`
            )
            .join("");

    modal.innerHTML =
        `<option value="">Select branch</option>` +
        state.branches
            .map(
                b =>
                    `<option value="${esc(
                        b.BranchId
                    )}">
                        ${esc(
                            b.BranchName ||
                            b.BranchId
                        )}
                    </option>`
            )
            .join("");

    filter.value = selected;
}


/* =========================================================
   KPI METRICS
   ========================================================= */

function renderMetrics(metrics = {}) {

    $("totalItems").textContent =
        metrics.totalItems ?? 0;

    $("availableItems").textContent =
        metrics.availableItems ?? 0;

    $("unavailableItems").textContent =
        metrics.unavailableItems ?? 0;

    $("categories").textContent =
        metrics.categories ?? 0;

    $("availabilityRate").textContent =
        `${metrics.availabilityRate ?? "0.0"}%`;

    $("averagePrice").textContent =
        money(metrics.averagePrice);
}


/* =========================================================
   BRANCH PERFORMANCE
   ========================================================= */

function renderBranches(branches = []) {

    const el =
        $("branchSummary");

    if (!branches.length) {

        el.innerHTML =
            `<div class="empty-state">
                <p>
                    No active branches found
                    for this restaurant.
                </p>
            </div>`;

        return;
    }

    el.innerHTML =
        branches
            .map(
                b =>
                    `<div class="branch-summary">

                        <div class="branch-summary-top">

                            <span class="branch-summary-name">
                                ${esc(
                                    b.branchName ||
                                    b.branchId
                                )}
                            </span>

                            <span class="branch-summary-rate">
                                ${esc(
                                    b.availability
                                )}%
                            </span>

                        </div>

                        <div class="branch-summary-meta">
                            ${b.totalItems || 0}
                            items ·
                            ${b.availableItems || 0}
                            available ·
                            ${b.unavailableItems || 0}
                            unavailable
                        </div>

                        <div class="progress">

                            <span
                                style="
                                    width:${Math.min(
                                        100,
                                        Math.max(
                                            0,
                                            Number(
                                                b.availability
                                            ) || 0
                                        )
                                    )}%
                                "
                            ></span>

                        </div>

                    </div>`
            )
            .join("");
}


/* =========================================================
   MENU ITEMS TABLE
   ========================================================= */

function renderItems() {

    const body =
        $("menuTableBody");

    const empty =
        $("emptyState");

    const visible =
        state.items;

    $("menuResultText").textContent =
        `${visible.length} menu item${
            visible.length === 1
                ? ""
                : "s"
        } · Live branch catalog`;

    if (!visible.length) {

        body.innerHTML = "";

        empty.hidden = false;

        return;
    }

    empty.hidden = true;

    body.innerHTML =
        visible
            .map(item => {

                const id =
                    itemIdOf(item);

                const available =
                    isAvailable(
                        item.Available
                    );

                const image =
                    String(
                        item.ImageURL || ""
                    ).trim();

                const imageHtml =
                    image
                        ? `<img
                                class="item-image"
                                src="${esc(image)}"
                                alt=""
                                onerror="
                                    this.outerHTML=
                                    '<div class=\\'item-image item-image-placeholder\\'>◆</div>'
                                "
                           >`
                        : `<div class="item-image item-image-placeholder">
                                ◆
                           </div>`;

                return `
                    <tr>

                        <td>

                            <div class="item-cell">

                                ${imageHtml}

                                <div>

                                    <strong>
                                        ${esc(
                                            item.ItemName ||
                                            "Unnamed item"
                                        )}
                                    </strong>

                                    <small>
                                        ${esc(
                                            item.Description ||
                                            "No description added"
                                        )}
                                    </small>

                                </div>

                            </div>

                        </td>

                        <td>

                            <span class="category-badge">
                                ${esc(
                                    item.Category ||
                                    "Uncategorized"
                                )}
                            </span>

                        </td>

                        <td>

                            <span class="branch-name">
                                ${esc(
                                    branchName(
                                        item.BranchId
                                    )
                                )}
                            </span>

                        </td>

                        <td>

                            <span class="price">
                                ${money(
                                    item.Price
                                )}
                            </span>

                        </td>

                        <td>

                            <span
                                class="
                                    status-badge
                                    ${
                                        available
                                            ? "available"
                                            : "unavailable"
                                    }
                                "
                            >

                                <b>●</b>

                                ${
                                    available
                                        ? "Available"
                                        : "Unavailable"
                                }

                            </span>

                        </td>

                        <td>

                            <div class="actions">

                                <button
                                    class="icon-button"
                                    title="Edit item"
                                    data-action="edit"
                                    data-id="${esc(id)}"
                                >
                                    ✎
                                </button>

                                <button
                                    class="icon-button"
                                    title="Toggle availability"
                                    data-action="toggle"
                                    data-id="${esc(id)}"
                                >
                                    ${
                                        available
                                            ? "◉"
                                            : "○"
                                    }
                                </button>

                                <button
                                    class="icon-button delete"
                                    title="Delete item"
                                    data-action="delete"
                                    data-id="${esc(id)}"
                                >
                                    ×
                                </button>

                            </div>

                        </td>

                    </tr>
                `;
            })
            .join("");
}


/* =========================================================
   LOAD MENU
   ========================================================= */

async function loadMenu() {

    setLoading(true);

    try {

        const data =
            await api(
                "list",
                state.currentBranchId
                    ? {
                        branchId:
                            state.currentBranchId
                    }
                    : {}
            );

        state.items =
            Array.isArray(data.items)
                ? data.items
                : [];

        state.branches =
            Array.isArray(data.branches)
                ? data.branches
                : [];

        state.metrics =
            data.metrics || {};

        populateBranches();

        renderMetrics(
            state.metrics
        );

        renderBranches(
            state.branches
        );

        renderItems();

    } catch (error) {

        showPageMessage(
            error.message,
            "error"
        );

        state.items = [];

        renderItems();

    } finally {

        setLoading(false);
    }
}


/* =========================================================
   OPEN ADD / EDIT MODAL
   ========================================================= */

function openModal(item = null) {

    state.editing = item;

    $("menuItemModal").hidden = false;

    document.body.classList.add(
        "modal-open"
    );

    $("modalError").hidden = true;

    $("modalTitle").textContent =
        item
            ? "Edit Menu Item"
            : "Add Menu Item";

    $("modalEyebrow").textContent =
        item
            ? "UPDATE MENU ITEM"
            : "CREATE MENU ITEM";

    $("modalSubtitle").textContent =
        item
            ? "Keep pricing, descriptions and availability accurate for customers."
            : "Create a new item and publish it to the selected branch.";

    $("saveButtonText").textContent =
        item
            ? "Save Changes"
            : "Create Item";

    $("itemId").value =
        item
            ? itemIdOf(item)
            : "";

    $("itemName").value =
        item?.ItemName || "";

    $("category").value =
        item?.Category || "";

    $("price").value =
        item?.Price ?? "";

    $("description").value =
        item?.Description || "";

    $("imageURL").value =
        item?.ImageURL || "";

    $("available").checked =
        item
            ? isAvailable(
                item.Available
            )
            : true;

    $("modalBranch").value =
        item?.BranchId ||
        state.currentBranchId ||
        "";

    setTimeout(
        () =>
            $("itemName").focus(),
        50
    );
}


/* =========================================================
   CLOSE ADD / EDIT MODAL
   ========================================================= */

function closeModal() {

    $("menuItemModal").hidden = true;

    document.body.classList.remove(
        "modal-open"
    );

    state.editing = null;
}


/* =========================================================
   MODAL ERROR
   ========================================================= */

function modalError(message) {

    const el =
        $("modalError");

    el.textContent =
        message;

    el.hidden = false;
}


/* =========================================================
   CREATE / UPDATE MENU ITEM
   ========================================================= */

async function saveItem(event) {

    event.preventDefault();

    $("modalError").hidden = true;

    const payload = {

        branchId:
            $("modalBranch")
                .value
                .trim(),

        itemId:
            $("itemId")
                .value
                .trim(),

        itemName:
            $("itemName")
                .value
                .trim(),

        category:
            $("category")
                .value
                .trim(),

        price:
            $("price")
                .value,

        description:
            $("description")
                .value
                .trim(),

        imageURL:
            $("imageURL")
                .value
                .trim(),

        available:
            $("available")
                .checked
    };


    /* -----------------------------------------------------
       FRONTEND VALIDATION
       ----------------------------------------------------- */

    if (!payload.branchId) {

        return modalError(
            "Please select a branch."
        );
    }

    if (!payload.itemName) {

        return modalError(
            "Menu item name is required."
        );
    }

    if (!payload.category) {

        return modalError(
            "Category is required."
        );
    }

    if (
        payload.price === "" ||
        Number(payload.price) < 0 ||
        Number.isNaN(
            Number(payload.price)
        )
    ) {

        return modalError(
            "Please enter a valid price."
        );
    }


    /* -----------------------------------------------------
       SAVE
       ----------------------------------------------------- */

    const button =
        $("saveMenuItemButton");

    button.disabled = true;

    try {

        const data =
            await api(
                state.editing
                    ? "update"
                    : "create",
                payload
            );

        closeModal();

        showPageMessage(
            data.message ||
            "Menu item saved successfully.",
            "success"
        );

        state.currentBranchId =
            payload.branchId;

        await loadMenu();

    } catch (error) {

        modalError(
            error.message
        );

    } finally {

        button.disabled = false;
    }
}


/* =========================================================
   FIND ITEM
   ========================================================= */

function findItem(id) {

    return state.items.find(
        i =>
            itemIdOf(i) ===
            String(id)
    );
}


/* =========================================================
   TOGGLE AVAILABILITY
   ========================================================= */

async function toggleItem(id) {

    const item =
        findItem(id);

    if (!item) return;

    try {

        const data =
            await api(
                "toggle",
                {
                    branchId:
                        item.BranchId,

                    itemId:
                        id
                }
            );

        showPageMessage(
            data.message ||
            "Availability updated.",
            "success"
        );

        await loadMenu();

    } catch (error) {

        showPageMessage(
            error.message
        );
    }
}


/* =========================================================
   DELETE CONFIRMATION
   ========================================================= */

function askDelete(item) {

    state.confirmAction =
        async () => {

            try {

                const data =
                    await api(
                        "delete",
                        {
                            branchId:
                                item.BranchId,

                            itemId:
                                itemIdOf(
                                    item
                                )
                        }
                    );

                closeConfirm();

                showPageMessage(
                    data.message ||
                    "Menu item deleted successfully.",
                    "success"
                );

                await loadMenu();

            } catch (error) {

                closeConfirm();

                showPageMessage(
                    error.message
                );
            }
        };


    $("confirmTitle").textContent =
        "Delete menu item?";

    $("confirmMessage").textContent =
        `“${
            item.ItemName ||
            "This item"
        }” will be permanently removed from the menu catalog.`;

    $("confirmModal").hidden =
        false;

    document.body.classList.add(
        "modal-open"
    );
}


/* =========================================================
   CLOSE DELETE CONFIRMATION
   ========================================================= */

function closeConfirm() {

    $("confirmModal").hidden =
        true;

    if (
        $("menuItemModal").hidden
    ) {

        document.body.classList.remove(
            "modal-open"
        );
    }

    state.confirmAction =
        null;
}


/* =========================================================
   SETUP
   ========================================================= */

function setup() {

    setTopbar();


    /* -----------------------------------------------------
       ADD MENU ITEM
       ----------------------------------------------------- */

    $("addMenuItemButton")
        .addEventListener(
            "click",
            () => openModal()
        );


    $("emptyAddButton")
        .addEventListener(
            "click",
            () => openModal()
        );


    /* -----------------------------------------------------
       REFRESH
       ----------------------------------------------------- */

    $("refreshButton")
        .addEventListener(
            "click",
            loadMenu
        );


    /* -----------------------------------------------------
       BRANCH FILTER
       ----------------------------------------------------- */

    $("branchFilter")
        .addEventListener(
            "change",
            e => {

                state.currentBranchId =
                    e.target.value;

                loadMenu();
            }
        );


    /* -----------------------------------------------------
       MODAL
       ----------------------------------------------------- */

    $("modalCloseButton")
        .addEventListener(
            "click",
            closeModal
        );

    $("cancelModalButton")
        .addEventListener(
            "click",
            closeModal
        );

    $("menuItemForm")
        .addEventListener(
            "submit",
            saveItem
        );


    /* -----------------------------------------------------
       TABLE ACTIONS
       ----------------------------------------------------- */

    $("menuTableBody")
        .addEventListener(
            "click",
            e => {

                const btn =
                    e.target.closest(
                        "button[data-action]"
                    );

                if (!btn) return;

                const item =
                    findItem(
                        btn.dataset.id
                    );

                if (!item) return;


                if (
                    btn.dataset.action ===
                    "edit"
                ) {

                    openModal(item);
                }


                if (
                    btn.dataset.action ===
                    "toggle"
                ) {

                    toggleItem(
                        btn.dataset.id
                    );
                }


                if (
                    btn.dataset.action ===
                    "delete"
                ) {

                    askDelete(item);
                }
            }
        );


    /* -----------------------------------------------------
       DELETE CONFIRMATION
       ----------------------------------------------------- */

    $("confirmCancelButton")
        .addEventListener(
            "click",
            closeConfirm
        );

    $("confirmOkButton")
        .addEventListener(
            "click",
            () => {

                if (
                    state.confirmAction
                ) {

                    state.confirmAction();
                }
            }
        );


    /* -----------------------------------------------------
       MOBILE SIDEBAR
       ----------------------------------------------------- */

    $("mobileMenuButton")
        .addEventListener(
            "click",
            () =>
                $("sidebar")
                    .classList
                    .toggle("open")
        );


    /* -----------------------------------------------------
       LOGOUT
       ----------------------------------------------------- */

    $("logoutBtn")
        .addEventListener(
            "click",
            () => {

                localStorage.removeItem(
                    SESSION_TOKEN_KEY
                );

                localStorage.removeItem(
                    SESSION_DATA_KEY
                );

                localStorage.removeItem(
                    "qro_validated_session"
                );

                location.href =
                    "../login/login.html";
            }
        );


    /* -----------------------------------------------------
       CLICK OUTSIDE MODAL
       ----------------------------------------------------- */

    [
        $("menuItemModal"),
        $("confirmModal")
    ].forEach(
        m =>

            m.addEventListener(
                "click",
                e => {

                    if (
                        e.target === m &&
                        m.id ===
                            "menuItemModal"
                    ) {

                        closeModal();
                    }

                    if (
                        e.target === m &&
                        m.id ===
                            "confirmModal"
                    ) {

                        closeConfirm();
                    }
                }
            )
    );


    /* -----------------------------------------------------
       ESCAPE KEY
       ----------------------------------------------------- */

    document.addEventListener(
        "keydown",
        e => {

            if (
                e.key ===
                "Escape"
            ) {

                if (
                    !$(
                        "menuItemModal"
                    ).hidden
                ) {

                    closeModal();
                }

                if (
                    !$(
                        "confirmModal"
                    ).hidden
                ) {

                    closeConfirm();
                }
            }
        }
    );


    /* -----------------------------------------------------
       INITIAL LOAD
       ----------------------------------------------------- */

    loadMenu();
}


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    setup
);