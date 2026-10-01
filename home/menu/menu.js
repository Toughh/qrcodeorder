/* =========================================================
   QR RESTAURANT SAAS - PREMIUM MENU MANAGEMENT
   Backend: POST /owner-menu-manage
   ========================================================= */

const MENU_WEBHOOK =
    `${N8N_BASE_URL}/owner-menu-manage`;

const SESSION_TOKEN_KEY =
    "qro_session_token";

const SESSION_DATA_KEY =
    "qro_session_data";


/* =========================================================
   STATE
   ========================================================= */

const state = {

    items: [],

    branches: [],

    metrics: {},

    editing: null,

    confirmAction: null,

    currentBranchId: "",

    userName: "",

    currency: "AED"

};


/* =========================================================
   HELPERS
   ========================================================= */

const $ = id =>
    document.getElementById(id);


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


/* =========================================================
   AVAILABILITY
   ========================================================= */

const isAvailable = value =>

    value === true ||

    String(value ?? "")
        .toLowerCase() === "true" ||

    String(value ?? "")
        .toLowerCase() === "checked";


/* =========================================================
   ITEM ID
   Handles normal ItemID + BOM ItemID
   ========================================================= */

const itemIdOf = item =>

    String(
        item.ItemID ||
        item["\ufeffItemID"] ||
        ""
    ).trim();


/* =========================================================
   BRANCH ID
   Handles normal BranchId + BOM BranchId
   ========================================================= */

const branchIdOf = item =>

    String(
        item.branchId ||
        item.BranchId ||
        item["\ufeffBranchId"] ||
        ""
    ).trim();


/* =========================================================
   IMAGE URL
   Airtable ImageURL is an Attachment / Files field.

   Airtable can return:
   - Array of attachment objects
   - Single attachment object
   - Plain string
   ========================================================= */

function imageUrlOf(value) {

    if (!value) {
        return "";
    }


    /* -----------------------------------------------------
       Plain URL string
       ----------------------------------------------------- */

    if (typeof value === "string") {

        return value.trim();

    }


    /* -----------------------------------------------------
       Airtable attachment array
       ----------------------------------------------------- */

    if (Array.isArray(value)) {

        const first = value[0];

        if (!first) {
            return "";
        }


        if (typeof first === "string") {

            return first.trim();

        }


        if (typeof first === "object") {

            return String(

                first.url ||

                first.thumbnails?.large?.url ||

                first.thumbnails?.full?.url ||

                first.thumbnails?.small?.url ||

                ""

            ).trim();

        }

    }


    /* -----------------------------------------------------
       Airtable attachment object
       ----------------------------------------------------- */

    if (typeof value === "object") {

        return String(

            value.url ||

            value.thumbnails?.large?.url ||

            value.thumbnails?.full?.url ||

            value.thumbnails?.small?.url ||

            ""

        ).trim();

    }


    return "";

}


/* =========================================================
   MONEY
   ========================================================= */

function money(value) {

    const amount =
        Number(value || 0);

    const currency =
        String(
            state.currency || "AED"
        )
            .trim()
            .toUpperCase();

    return `${currency} ${amount.toFixed(2)}`;
}


/* =========================================================
   SESSION
   ========================================================= */

function sessionToken() {

    return String(

        localStorage.getItem(
            SESSION_TOKEN_KEY
        ) || ""

    ).trim();

}


function sessionData() {

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


/* =========================================================
   OWNER NAME
   ========================================================= */

function ownerName() {

    const s =
        sessionData();

    return (

        s.ownerName ||

        s.OwnerName ||

        s.Name ||

        s.name ||

        s.userName ||

        s.UserName ||

        "Owner"

    );

}


/* =========================================================
   ROLE
   ========================================================= */

function roleName() {

    const s =
        sessionData();

    return (

        s.role ||

        s.Role ||

        "Owner"

    );

}


/* =========================================================
   API
   ========================================================= */

async function api(
    action,
    payload = {}
) {

    const token =
        sessionToken();


    if (!token) {

        throw new Error(
            "Your session has expired. Please sign in again."
        );

    }


    const response =
        await fetch(

            MENU_WEBHOOK,

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify({

                        sessionToken:
                            token,

                        action,

                        ...payload

                    })

            }

        );


    let data = {};


    try {

        data =
            await response.json();

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

    const el =
        $("pageMessage");


    if (!el) {
        return;
    }


    el.textContent =
        message;


    el.className =
        `page-message ${type}`;


    el.hidden =
        false;


    clearTimeout(
        showPageMessage.timer
    );


    showPageMessage.timer =

        setTimeout(

            () => {

                el.hidden =
                    true;

            },

            5000

        );

}


/* =========================================================
   LOADING
   ========================================================= */

function setLoading(on) {

    const loading =
        $("loadingState");

    if (!loading) {
        return;
    }

    if (on) {

        loading.hidden = false;

        loading.style.display = "flex";

    } else {

        loading.hidden = true;

        loading.style.display = "none";

    }
}


/* =========================================================
   TOPBAR
   ========================================================= */

function setTopbar() {

    const name =
        state.userName ||
        "Owner";

    const role =
        roleName();

    const nameElement =
        $("topbarUserName");

    const roleElement =
        $("topbarUserRole");

    const avatarElement =
        $("topbarUserAvatar");


    if (nameElement) {

        nameElement.textContent =
            name;

    }


    if (roleElement) {

        roleElement.textContent =
            role;

    }


    if (avatarElement) {

        avatarElement.textContent =
            name.charAt(0).toUpperCase();

    }

}


/* =========================================================
   BRANCH NAME
   ========================================================= */

function branchName(id) {

    const branch =

        state.branches.find(

            x =>

                branchIdOf(x) ===
                String(id)

        );


    return (

        branch?.BranchName ||

        branch?.Name ||

        id ||

        "—"

    );

}


/* =========================================================
   POPULATE BRANCHES
   ========================================================= */

function populateBranches() {

    const filter =
        $("branchFilter");

    const modal =
        $("modalBranch");

    if (!filter || !modal) {
        return;
    }

    const selected =
        state.currentBranchId;


    /* =====================================================
       BRANCH FILTER DROPDOWN
       ===================================================== */

    filter.innerHTML =
        `<option value="">
            All branches
        </option>` +

        state.branches
            .map(branch => {

                const id =
                    branchIdOf(branch);

                const name =
                    branch.branchName ||
                    branch.BranchName ||
                    branch.Name ||
                    id;

                return `
                    <option
                        value="${esc(id)}"
                    >
                        ${esc(name)}
                    </option>
                `;

            })
            .join("");


    /* =====================================================
       ADD / EDIT MODAL BRANCH DROPDOWN
       ===================================================== */

    modal.innerHTML =
        `<option value="">
            Select branch
        </option>` +

        state.branches
            .map(branch => {

                const id =
                    branchIdOf(branch);

                const name =
                    branch.branchName ||
                    branch.BranchName ||
                    branch.Name ||
                    id;

                return `
                    <option
                        value="${esc(id)}"
                    >
                        ${esc(name)}
                    </option>
                `;

            })
            .join("");


    /* =====================================================
       RESTORE CURRENT FILTER
       ===================================================== */

    filter.value =
        selected;

}


/* =========================================================
   RENDER METRICS
   ========================================================= */

function renderMetrics(
    metrics = {}
) {

    if ($("totalItems")) {

        $("totalItems").textContent =
            metrics.totalItems ?? 0;

    }


    if ($("availableItems")) {

        $("availableItems").textContent =
            metrics.availableItems ?? 0;

    }


    if ($("unavailableItems")) {

        $("unavailableItems").textContent =
            metrics.unavailableItems ?? 0;

    }


    if ($("categories")) {

        $("categories").textContent =
            metrics.categories ?? 0;

    }


    if ($("availabilityRate")) {

        $("availabilityRate").textContent =

            `${metrics.availabilityRate ?? "0.0"}%`;

    }


    if ($("averagePrice")) {

        $("averagePrice").textContent =

            money(
                metrics.averagePrice
            );

    }

}


/* =========================================================
   RENDER BRANCH SUMMARY
   ========================================================= */

function renderBranches(
    branches = []
) {

    const el =
        $("branchSummary");


    if (!el) {
        return;
    }


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

                b => {

                    const rate =
                        Number(
                            b.availability
                        ) || 0;


                    return `

                        <div
                            class="branch-summary"
                        >

                            <div
                                class="branch-summary-top"
                            >

                                <span
                                    class="branch-summary-name"
                                >
                                    ${esc(
                        b.branchName ||
                        b.branchId
                    )}
                                </span>

                                <span
                                    class="branch-summary-rate"
                                >
                                    ${esc(
                        b.availability
                    )}%
                                </span>

                            </div>


                            <div
                                class="branch-summary-meta"
                            >

                                ${b.totalItems || 0}
                                items ·

                                ${b.availableItems || 0}
                                available ·

                                ${b.unavailableItems || 0}
                                unavailable

                            </div>


                            <div
                                class="progress"
                            >

                                <span
                                    style="
                                        width:${Math.min(
                        100,
                        Math.max(
                            0,
                            rate
                        )
                    )}%
                                    "
                                ></span>

                            </div>

                        </div>

                    `;

                }

            )

            .join("");

}


/* =========================================================
   RENDER MENU ITEMS
   ========================================================= */

function renderItems() {

    const body =
        $("menuTableBody");


    const empty =
        $("emptyState");


    if (!body || !empty) {
        return;
    }


    const visible =
        state.items;


    const resultText =
        $("menuResultText");


    if (resultText) {

        resultText.textContent =

            `${visible.length} menu item${visible.length === 1
                ? ""
                : "s"
            } · Live branch catalog`;

    }


    if (!visible.length) {

        body.innerHTML =
            "";

        empty.hidden =
            false;

        return;

    }


    empty.hidden =
        true;


    body.innerHTML =

        visible

            .map(item => {

                const id =
                    itemIdOf(item);


                const available =
                    isAvailable(
                        item.Available
                    );


                /* -------------------------------------------------
                   IMPORTANT:
                   ImageURL is Airtable Attachment / Files
                   ------------------------------------------------- */

                const image =
                    imageUrlOf(
                        item.ImageURL
                    );


                let imageHtml;


                if (image) {

                    imageHtml = `

                        <div
                            class="item-image-wrapper"
                        >

                            <img

                                class="item-image"

                                src="${esc(image)}"

                                alt="${esc(
                        item.ItemName ||
                        "Menu item"
                    )}"

                                loading="lazy"

                                onerror="
                                    this.style.display='none';
                                    this.nextElementSibling.hidden=false;
                                "
                            >

                            <div
                                class="
                                    item-image
                                    item-image-placeholder
                                "
                                hidden
                            >
                                ◆
                            </div>

                        </div>

                    `;

                } else {

                    imageHtml = `

                        <div
                            class="
                                item-image
                                item-image-placeholder
                            "
                        >
                            ◆
                        </div>

                    `;

                }


                return `

                    <tr>

                        <td>

                            <div
                                class="item-cell"
                            >

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

                            <span
                                class="category-badge"
                            >
                                ${esc(
                    item.Category ||
                    "Uncategorized"
                )}
                            </span>

                        </td>


                        <td>

                            <span
                                class="branch-name"
                            >
                                ${esc(
                    branchName(
                        branchIdOf(item)
                    )
                )}
                            </span>

                        </td>


                        <td>

                            <span
                                class="price"
                            >
                                ${money(
                    item.Price
                )}
                            </span>

                        </td>


                        <td>

                            <span
                                class="
                                    status-badge
                                    ${available
                        ? "available"
                        : "unavailable"
                    }
                                "
                            >

                                <b>
                                    ●
                                </b>

                                ${available
                        ? "Available"
                        : "Unavailable"
                    }

                            </span>

                        </td>


                        <td>

                            <div
                                class="actions"
                            >

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

                                    ${available
                        ? "◉"
                        : "○"
                    }

                                </button>


                                <button

                                    class="
                                        icon-button
                                        delete
                                    "

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


        // ==========================================
        // USER NAME FROM BACKEND
        // ==========================================

        state.userName =
            String(
                data.userName || ""
            ).trim();


        // ==========================================
        // CURRENCY FROM BACKEND
        // ==========================================

        state.currency =
            String(
                data.currency ||
                "AED"
            )
                .trim()
                .toUpperCase();


        // ==========================================
        // MENU ITEMS
        // ==========================================

        state.items =
            Array.isArray(
                data.items
            )
                ? data.items
                : [];


        // ==========================================
        // BRANCHES
        // ==========================================

        state.branches =
            Array.isArray(
                data.branches
            )
                ? data.branches
                : [];


        // ==========================================
        // METRICS
        // ==========================================

        state.metrics =
            data.metrics || {};


        // ==========================================
        // TOP BAR
        // ==========================================

        setTopbar();


        // ==========================================
        // RENDER
        // ==========================================

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
            error.message ||
            "Unable to load menu.",
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

function openModal(
    item = null
) {

    state.editing =
        item;


    const modal =
        $("menuItemModal");


    if (!modal) {
        return;
    }


    modal.hidden =
        false;


    document.body.classList.add(
        "modal-open"
    );


    $("modalError").hidden =
        true;


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


    /*
       For editing, ImageURL is an Airtable
       attachment. We cannot put an attachment
       object directly into the text field.
       Extract its URL.
    */

    $("imageURL").value =

        imageUrlOf(
            item?.ImageURL
        );


    $("available").checked =

        item

            ? isAvailable(
                item.Available
            )

            : true;


    $("modalBranch").value =

        item

            ? branchIdOf(item)

            : state.currentBranchId || "";


    setTimeout(

        () => {

            $("itemName")?.focus();

        },

        50

    );

}


/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closeModal() {

    const modal =
        $("menuItemModal");


    if (modal) {

        modal.hidden =
            true;

    }


    document.body.classList.remove(
        "modal-open"
    );


    state.editing =
        null;

}


/* =========================================================
   MODAL ERROR
   ========================================================= */

function modalError(
    message
) {

    const el =
        $("modalError");


    if (!el) {
        return;
    }


    el.textContent =
        message;


    el.hidden =
        false;

}


/* =========================================================
   SAVE MENU ITEM
   ========================================================= */

async function saveItem(
    event
) {

    event.preventDefault();


    $("modalError").hidden =
        true;


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


    const button =
        $("saveMenuItemButton");


    if (button) {

        button.disabled =
            true;

    }


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

            error.message ||

            "Unable to save menu item."

        );


    } finally {

        if (button) {

            button.disabled =
                false;

        }

    }

}


/* =========================================================
   FIND ITEM
   ========================================================= */

function findItem(id) {

    return state.items.find(

        item =>

            itemIdOf(item) ===
            String(id)

    );

}


/* =========================================================
   TOGGLE ITEM
   ========================================================= */

async function toggleItem(
    id
) {

    const item =
        findItem(id);


    if (!item) {
        return;
    }


    try {

        const data =

            await api(

                "toggle",

                {

                    branchId:
                        branchIdOf(item),

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

            error.message ||

            "Unable to update availability."

        );

    }

}


/* =========================================================
   DELETE CONFIRMATION
   ========================================================= */

function askDelete(
    item
) {

    state.confirmAction =

        async () => {

            try {

                const data =

                    await api(

                        "delete",

                        {

                            branchId:
                                branchIdOf(item),

                            itemId:
                                itemIdOf(item)

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

                    error.message ||

                    "Unable to delete menu item."

                );

            }

        };


    $("confirmTitle").textContent =
        "Delete menu item?";


    $("confirmMessage").textContent =

        `“${item.ItemName ||
        "This item"
        }” will be permanently removed from the menu catalog.`;


    $("confirmModal").hidden =
        false;


    document.body.classList.add(
        "modal-open"
    );

}


/* =========================================================
   CLOSE CONFIRM
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
        ?.addEventListener(

            "click",

            () =>
                openModal()

        );


    /* -----------------------------------------------------
       EMPTY STATE ADD BUTTON
       ----------------------------------------------------- */

    $("emptyAddButton")
        ?.addEventListener(

            "click",

            () =>
                openModal()

        );


    /* -----------------------------------------------------
       REFRESH
       ----------------------------------------------------- */

    $("refreshButton")
        ?.addEventListener(

            "click",

            loadMenu

        );


    /* -----------------------------------------------------
       BRANCH FILTER
       ----------------------------------------------------- */

    $("branchFilter")
        ?.addEventListener(

            "change",

            event => {

                state.currentBranchId =
                    event.target.value;


                loadMenu();

            }

        );


    /* -----------------------------------------------------
       CLOSE EDIT MODAL
       ----------------------------------------------------- */

    $("modalCloseButton")
        ?.addEventListener(

            "click",

            closeModal

        );


    $("cancelModalButton")
        ?.addEventListener(

            "click",

            closeModal

        );


    /* -----------------------------------------------------
       SAVE FORM
       ----------------------------------------------------- */

    $("menuItemForm")
        ?.addEventListener(

            "submit",

            saveItem

        );


    /* -----------------------------------------------------
       TABLE ACTIONS
       ----------------------------------------------------- */

    $("menuTableBody")
        ?.addEventListener(

            "click",

            event => {

                const button =

                    event.target.closest(

                        "button[data-action]"

                    );


                if (!button) {
                    return;
                }


                const item =

                    findItem(
                        button.dataset.id
                    );


                if (!item) {
                    return;
                }


                const action =
                    button.dataset.action;


                if (
                    action ===
                    "edit"
                ) {

                    openModal(item);

                }


                if (
                    action ===
                    "toggle"
                ) {

                    toggleItem(
                        button.dataset.id
                    );

                }


                if (
                    action ===
                    "delete"
                ) {

                    askDelete(item);

                }

            }

        );


    /* -----------------------------------------------------
       CONFIRM DELETE
       ----------------------------------------------------- */

    $("confirmCancelButton")
        ?.addEventListener(

            "click",

            closeConfirm

        );


    $("confirmOkButton")
        ?.addEventListener(

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
       MOBILE MENU
       ----------------------------------------------------- */

    $("mobileMenuButton")
        ?.addEventListener(

            "click",

            () => {

                $("sidebar")
                    ?.classList
                    .toggle("open");

            }

        );


    /* -----------------------------------------------------
       LOGOUT
       ----------------------------------------------------- */

    $("logoutBtn")
        ?.addEventListener(

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
       MODAL BACKDROP CLICK
       ----------------------------------------------------- */

    [
        $("menuItemModal"),
        $("confirmModal")

    ].forEach(

        modal => {

            if (!modal) {
                return;
            }


            modal.addEventListener(

                "click",

                event => {

                    if (
                        event.target ===
                        modal
                    ) {

                        if (
                            modal.id ===
                            "menuItemModal"
                        ) {

                            closeModal();

                        }


                        if (
                            modal.id ===
                            "confirmModal"
                        ) {

                            closeConfirm();

                        }

                    }

                }

            );

        }

    );


    /* -----------------------------------------------------
       ESCAPE KEY
       ----------------------------------------------------- */

    document.addEventListener(

        "keydown",

        event => {

            if (
                event.key !==
                "Escape"
            ) {

                return;

            }


            const editModal =
                $("menuItemModal");


            const confirmModal =
                $("confirmModal");


            if (
                editModal &&
                !editModal.hidden
            ) {

                closeModal();

            }


            if (
                confirmModal &&
                !confirmModal.hidden
            ) {

                closeConfirm();

            }

        }

    );


    /* -----------------------------------------------------
       INITIAL LOAD
       ----------------------------------------------------- */

    loadMenu();

}


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener(

    "DOMContentLoaded",

    setup

);