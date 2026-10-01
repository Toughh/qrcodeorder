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

const branchIdOf = item => {

    const source =
        item?.fields ||
        item ||
        {};

    return String(
        source.branchId ||
        source.BranchId ||
        source["\ufeffBranchId"] ||
        ""
    ).trim();

};


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
   CURRENCY LABELS
   ========================================================= */

function setCurrencyLabels() {

    const currency =
        String(state.currency || "AED")
            .trim().toUpperCase();

    const averagePriceCurrency =
        $("averagePriceCurrency");

    const priceCurrency =
        $("priceCurrency");

    if (averagePriceCurrency) {
        averagePriceCurrency.textContent = currency;
    }

    if (priceCurrency) {
        priceCurrency.textContent = currency;
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
    summaries = []
) {

    const el =
        $("branchSummary");

    if (!el) {
        return;
    }

    const summary =
        summaries.find(
            b =>
                String(b.branchId || "").trim() ===
                String(state.currentBranchId || "").trim()
        ) || summaries[0];

    if (!summary) {

        el.innerHTML = `
            <div class="branch-summary-empty">
                <span class="branch-summary-empty-label">BRANCH OVERVIEW</span>
                <strong>Select a branch to view menu coverage.</strong>
            </div>
        `;

        return;
    }

    const rate =
        Number(summary.availability) || 0;

    el.innerHTML = `
        <div class="branch-summary selected">
            <div class="branch-summary-top">
                <div>
                    <span class="branch-summary-label">SELECTED BRANCH</span>
                    <span class="branch-summary-name">
                        ${esc(summary.branchName || branchName(summary.branchId))}
                    </span>
                </div>
                <span class="branch-summary-rate">${esc(summary.availability || "0.0")}%</span>
            </div>

            <div class="branch-summary-stats">
                <span><strong>${summary.totalItems || 0}</strong> Items</span>
                <span><strong>${summary.availableItems || 0}</strong> Available</span>
                <span><strong>${summary.unavailableItems || 0}</strong> Unavailable</span>
            </div>

            <div class="progress">
                <span style="width:${Math.min(100, Math.max(0, rate))}%"></span>
            </div>
        </div>
    `;

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
                                class="branch-badge"
                            >
                                ${esc(
                    branchName(
                        branchIdOf(item)
                    )
                )}
                            </span>

                        </td>


                        <td>

                            <strong
                                class="item-price"
                            >
                                ${money(
                    item.Price
                )}
                            </strong>

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

                                ${available
                        ? "Available"
                        : "Unavailable"
                    }

                            </span>

                        </td>


                        <td>

                            <div
                                class="row-actions"
                            >

                                <button
                                    type="button"
                                    class="table-action edit"
                                    data-action="edit"
                                    data-id="${esc(id)}"
                                    title="Edit item"
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    class="table-action toggle"
                                    data-action="toggle"
                                    data-id="${esc(id)}"
                                    title="Toggle availability"
                                >
                                    ${available
                        ? "Disable"
                        : "Enable"
                    }
                                </button>

                                <button
                                    type="button"
                                    class="table-action delete"
                                    data-action="delete"
                                    data-id="${esc(id)}"
                                    title="Delete menu item"
                                >
                                    Delete
                                </button>

                            </div>

                        </td>

                    </tr>

                `;

            })

            .join("");

}


/* =========================================================
   POPULATE CATEGORY
   ========================================================= */

function populateCategorySelect(
    selected = ""
) {

    const select =
        $("itemCategory");

    if (!select) {
        return;
    }


    const categories =

        [...new Set(

            state.items

                .map(
                    item =>
                        String(
                            item.Category ||
                            ""
                        ).trim()
                )

                .filter(Boolean)

        )]

            .sort(
                (a, b) =>
                    a.localeCompare(b)
            );


    select.innerHTML =

        `<option value="">
            Select category
        </option>` +

        categories

            .map(

                category => `

                    <option
                        value="${esc(category)}"
                    >
                        ${esc(category)}
                    </option>

                `

            )

            .join("") +

        `<option value="__new__">
            + Add new category
        </option>`;


    if (selected) {

        select.value =
            selected;

    }

}
/* =========================================================
   LOAD MENU
   ========================================================= */

async function loadMenu() {

    setLoading(true);

    try {

        /* -----------------------------------------------------
           Always obtain branch metadata first. The backend will
           return no catalog items when no branch is selected.
           ----------------------------------------------------- */

        const data =
            await api(
                "list",
                state.currentBranchId
                    ? { branchId: state.currentBranchId }
                    : {}
            );

        state.userName =
            String(
                data.userName ||
                state.userName ||
                ""
            ).trim();

        state.currency =
            String(
                data.currency ||
                state.currency ||
                "AED"
            ).trim().toUpperCase();

        state.branches =
            Array.isArray(data.branches)
                ? data.branches
                : [];

        /* -----------------------------------------------------
           Select the first branch automatically on first load.
           ----------------------------------------------------- */

        if (
            !state.currentBranchId ||
            !state.branches.some(
                branch =>
                    branchIdOf(branch) ===
                    state.currentBranchId
            )
        ) {
            state.currentBranchId =
                state.branches.length
                    ? branchIdOf(state.branches[0])
                    : "";
        }

        populateBranches();
        setTopbar();
        setCurrencyLabels();

        /* -----------------------------------------------------
           If a branch was just selected, fetch its catalog.
           ----------------------------------------------------- */

        if (state.currentBranchId) {

            const branchData =
                await api(
                    "list",
                    { branchId: state.currentBranchId }
                );

            state.userName =
                String(
                    branchData.userName ||
                    state.userName ||
                    ""
                ).trim();

            state.currency =
                String(
                    branchData.currency ||
                    state.currency ||
                    "AED"
                ).trim().toUpperCase();

            state.items =
                Array.isArray(branchData.items)
                    ? branchData.items
                    : [];

            state.metrics =
                branchData.metrics || {};

            state.branches =
                Array.isArray(branchData.branches)
                    ? branchData.branches
                    : state.branches;

            setTopbar();
            setCurrencyLabels();
            populateBranches();
            renderMetrics(state.metrics);

            renderBranches(
                Array.isArray(branchData.branchSummary)
                    ? branchData.branchSummary
                    : []
            );

            renderItems();

        } else {

            state.items = [];
            state.metrics = {};

            renderMetrics({});
            renderBranches([]);
            renderItems();

        }

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
            ? isAvailable(item.Available)
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
        modal.hidden = true;
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
        Number.isNaN(Number(payload.price))
    ) {

        return modalError(
            "Please enter a valid price."
        );

    }

    const button =
        $("saveMenuItemButton");

    if (button) {
        button.disabled = true;
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
            button.disabled = false;
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