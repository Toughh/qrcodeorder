// ==========================================
// QR ORDER SAAS
// OWNER PORTAL — MENU
// ==========================================


// ==========================================
// n8n OWNER MENU WEBHOOK
// ==========================================

const MENU_WEBHOOK_URL =
    "https://maatapita.app.n8n.cloud/webhook/owner-menu";


// ==========================================
// GLOBAL STATE
// ==========================================

let branches = [];

let menuItems = [];


// ==========================================
// DOM READY
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "MENU: Page loaded."
        );


        // ==================================
        // EVENT LISTENERS
        // ==================================

        setupEventListeners();


        // ==================================
        // AUTHENTICATION
        // ==================================

        const session =
            await requireAuthentication();


        // ==================================
        // AUTH FAILED
        // ==================================

        if (!session) {

            return;

        }


        console.log(
            "MENU: Authentication successful.",
            session
        );


        // ==================================
        // LOAD BRANCHES
        // ==================================

        await loadBranches();

    }
);


// ==========================================
// EVENT LISTENERS
// ==========================================

function setupEventListeners() {

    // ==================================
    // BRANCH SELECT
    // ==================================

    const branchSelect =
        document.getElementById(
            "branchSelect"
        );


    if (branchSelect) {

        branchSelect.addEventListener(
            "change",
            handleBranchChange
        );

    }


    // ==================================
    // RETRY
    // ==================================

    const retryBtn =
        document.getElementById(
            "retryMenuBtn"
        );


    if (retryBtn) {

        retryBtn.addEventListener(
            "click",
            () => {

                loadBranches();

            }
        );

    }


    // ==================================
    // ADD MENU ITEM
    // ==================================

    const addMenuItemBtn =
        document.getElementById(
            "addMenuItemBtn"
        );


    if (addMenuItemBtn) {

        addMenuItemBtn.addEventListener(
            "click",
            () => {

                openMenuItemModal();

            }
        );

    }


    // ==================================
    // EMPTY ADD MENU ITEM
    // ==================================

    const emptyAddMenuBtn =
        document.getElementById(
            "emptyAddMenuBtn"
        );


    if (emptyAddMenuBtn) {

        emptyAddMenuBtn.addEventListener(
            "click",
            () => {

                openMenuItemModal();

            }
        );

    }


    // ==================================
    // CLOSE MODAL
    // ==================================

    const closeModalBtn =
        document.getElementById(
            "closeModalBtn"
        );


    if (closeModalBtn) {

        closeModalBtn.addEventListener(
            "click",
            closeMenuItemModal
        );

    }


    // ==================================
    // CANCEL MODAL
    // ==================================

    const cancelModalBtn =
        document.getElementById(
            "cancelModalBtn"
        );


    if (cancelModalBtn) {

        cancelModalBtn.addEventListener(
            "click",
            closeMenuItemModal
        );

    }


    // ==================================
    // MODAL OVERLAY
    // ==================================

    const modalOverlay =
        document.querySelector(
            ".modal-overlay"
        );


    if (modalOverlay) {

        modalOverlay.addEventListener(
            "click",
            closeMenuItemModal
        );

    }


    // ==================================
    // LOGOUT
    // ==================================

    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );


    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            handleLogout
        );

    }

}


// ==========================================
// LOAD BRANCHES
// ==========================================

async function loadBranches() {

    console.log(
        "MENU: Loading branches..."
    );


    showLoading();

    hideError();

    hideEmpty();


    try {

        // ==================================
        // GET SESSION TOKEN
        // ==================================

        const sessionToken =
            getSessionToken();


        if (!sessionToken) {

            console.error(
                "MENU: Session token missing."
            );


            handleUnauthorized();

            return;

        }


        console.log(
            "MENU: Session token found."
        );


        // ==================================
        // CALL n8n
        // ==================================

        const response =
            await fetch(
                MENU_WEBHOOK_URL,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            sessionToken:
                                sessionToken

                        })

                }
            );


        console.log(
            "MENU: Branch response status:",
            response.status
        );


        // ==================================
        // READ RESPONSE
        // ==================================

        const rawResult =
            await response.json();


        console.log(
            "MENU: Raw branch response:",
            rawResult
        );


        // ==================================
        // NORMALIZE RESPONSE
        // ==================================

        const result =
            Array.isArray(rawResult)
                ? rawResult[0]
                : rawResult;


        console.log(
            "MENU: Normalized branch response:",
            result
        );


        // ==================================
        // HTTP ERROR
        // ==================================

        if (!response.ok) {

            throw new Error(
                result?.message ||
                "Unable to load branches."
            );

        }


        // ==================================
        // UNAUTHORIZED
        // ==================================

        if (
            result?.success === false &&
            result?.code === "UNAUTHORIZED"
        ) {

            handleUnauthorized();

            return;

        }


        // ==================================
        // OTHER ERROR
        // ==================================

        if (
            !result ||
            result.success !== true
        ) {

            throw new Error(
                result?.message ||
                "Unable to load branches."
            );

        }


        // ==================================
        // STORE BRANCHES
        // ==================================

        branches =
            Array.isArray(
                result.branches
            )
                ? result.branches
                : [];


        console.log(
            "MENU: Branches:",
            branches
        );


        // ==================================
        // POPULATE DROPDOWN
        // ==================================

        populateBranchDropdown();


        hideLoading();


        // ==================================
        // NO BRANCHES
        // ==================================

        if (!branches.length) {

            showEmptyState(
                "No branches found for this restaurant."
            );

            return;

        }


        // ==================================
        // SELECT FIRST ACTIVE BRANCH
        // ==================================

        const activeBranch =
            branches.find(
                branch =>
                    branch.active !== false
            );


        if (activeBranch) {

            const branchSelect =
                document.getElementById(
                    "branchSelect"
                );


            if (branchSelect) {

                branchSelect.value =
                    activeBranch.branchId;

            }


            await loadMenu(
                activeBranch.branchId
            );

        }

    }
    catch (error) {

        console.error(
            "MENU: Load branches failed:",
            error
        );


        hideLoading();


        showError(
            error.message ||
            "Unable to load branches."
        );

    }

}


// ==========================================
// POPULATE BRANCH DROPDOWN
// ==========================================

function populateBranchDropdown() {

    const branchSelect =
        document.getElementById(
            "branchSelect"
        );


    if (!branchSelect) {

        return;

    }


    branchSelect.innerHTML = "";


    // ==================================
    // PLACEHOLDER
    // ==================================

    const placeholder =
        document.createElement(
            "option"
        );


    placeholder.value =
        "";


    placeholder.textContent =
        "Select Branch";


    branchSelect.appendChild(
        placeholder
    );


    // ==================================
    // BRANCHES
    // ==================================

    branches.forEach(
        branch => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                branch.branchId;


            option.textContent =
                branch.branchName ||
                branch.branchId ||
                "Unnamed Branch";


            // ==================================
            // INACTIVE
            // ==================================

            if (
                branch.active === false
            ) {

                option.textContent +=
                    " (Inactive)";


                option.disabled =
                    true;

            }


            branchSelect.appendChild(
                option
            );

        }
    );

}


// ==========================================
// BRANCH CHANGE
// ==========================================

async function handleBranchChange(
    event
) {

    const branchId =
        event.target.value;


    console.log(
        "MENU: Branch selected:",
        branchId
    );


    // ==================================
    // NO BRANCH
    // ==================================

    if (!branchId) {

        resetMenuDisplay();

        return;

    }


    // ==================================
    // LOAD MENU
    // ==================================

    await loadMenu(
        branchId
    );

}


// ==========================================
// LOAD MENU
// ==========================================

async function loadMenu(
    branchId
) {

    console.log(
        "MENU: Loading menu for branch:",
        branchId
    );


    showLoading();

    hideError();

    hideEmpty();


    try {

        // ==================================
        // SESSION TOKEN
        // ==================================

        const sessionToken =
            getSessionToken();


        if (!sessionToken) {

            handleUnauthorized();

            return;

        }


        // ==================================
        // CALL n8n
        // ==================================

        const response =
            await fetch(
                MENU_WEBHOOK_URL,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            sessionToken:
                                sessionToken,

                            branchId:
                                branchId

                        })

                }
            );


        console.log(
            "MENU: Menu response status:",
            response.status
        );


        // ==================================
        // READ RESPONSE
        // ==================================

        const rawResult =
            await response.json();


        console.log(
            "MENU: Raw menu response:",
            rawResult
        );


        // ==================================
        // NORMALIZE RESPONSE
        // ==================================

        const result =
            Array.isArray(rawResult)
                ? rawResult[0]
                : rawResult;


        console.log(
            "MENU: Normalized menu response:",
            result
        );


        // ==================================
        // HTTP ERROR
        // ==================================

        if (!response.ok) {

            throw new Error(
                result?.message ||
                "Unable to load menu."
            );

        }


        // ==================================
        // UNAUTHORIZED
        // ==================================

        if (
            result?.success === false &&
            result?.code === "UNAUTHORIZED"
        ) {

            handleUnauthorized();

            return;

        }


        // ==================================
        // BRANCH NOT FOUND
        // ==================================

        if (
            result?.success === false &&
            result?.code === "BRANCH_NOT_FOUND"
        ) {

            throw new Error(
                result.message ||
                "Selected branch was not found."
            );

        }


        // ==================================
        // OTHER ERROR
        // ==================================

        if (
            !result ||
            result.success !== true
        ) {

            throw new Error(
                result?.message ||
                "Unable to load menu."
            );

        }


        // ==================================
        // STORE MENU ITEMS
        // ==================================

        menuItems =
            Array.isArray(
                result.menuItems
            )
                ? result.menuItems
                : [];


        console.log(
            "MENU: Menu items:",
            menuItems
        );


        // ==================================
        // UPDATE BRANCH NAME
        // ==================================

        updateSelectedBranch(
            branchId
        );


        // ==================================
        // UPDATE SUMMARY
        // ==================================

        updateSummary(
            menuItems
        );


        hideLoading();


        // ==================================
        // NO MENU ITEMS
        // ==================================

        if (!menuItems.length) {

            showEmptyState();

            return;

        }


        // ==================================
        // RENDER MENU
        // ==================================

        renderMenu(
            menuItems
        );

    }
    catch (error) {

        console.error(
            "MENU: Load menu failed:",
            error
        );


        hideLoading();


        showError(
            error.message ||
            "Unable to load menu."
        );

    }

}


// ==========================================
// UPDATE SELECTED BRANCH
// ==========================================

function updateSelectedBranch(
    branchId
) {

    const branch =
        branches.find(
            item =>
                item.branchId ===
                branchId
        );


    const branchName =
        document.getElementById(
            "selectedBranchName"
        );


    if (!branchName) {

        return;

    }


    branchName.textContent =
        branch?.branchName ||
        "Selected Branch";

}


// ==========================================
// UPDATE SUMMARY
// ==========================================

function updateSummary(
    items
) {

    const totalItems =
        items.length;


    const availableItems =
        items.filter(
            item =>
                item.available !== false
        ).length;


    const unavailableItems =
        totalItems -
        availableItems;


    const categories =
        new Set(
            items.map(
                item =>
                    item.category ||
                    "Uncategorized"
            )
        );


    setText(
        "totalItems",
        totalItems
    );


    setText(
        "availableItems",
        availableItems
    );


    setText(
        "unavailableItems",
        unavailableItems
    );


    setText(
        "totalCategories",
        categories.size
    );

}


// ==========================================
// RENDER MENU
// ==========================================

function renderMenu(
    items
) {

    const container =
        document.getElementById(
            "menuContainer"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    // ==================================
    // GROUP BY CATEGORY
    // ==================================

    const grouped =
        {};


    items.forEach(
        item => {

            const category =
                item.category ||
                "Uncategorized";


            if (!grouped[category]) {

                grouped[category] = [];

            }


            grouped[category].push(
                item
            );

        }
    );


    // ==================================
    // RENDER CATEGORIES
    // ==================================

    Object.keys(grouped)
        .sort()
        .forEach(
            category => {

                const categoryItems =
                    grouped[category];


                const categoryElement =
                    document.createElement(
                        "div"
                    );


                categoryElement.className =
                    "menu-category";


                categoryElement.innerHTML = `

                    <div class="menu-category-header">

                        <h3>
                            ${escapeHtml(
                                category
                            )}
                        </h3>

                        <span class="category-count">

                            ${categoryItems.length}

                            item${
                                categoryItems.length !== 1
                                    ? "s"
                                    : ""
                            }

                        </span>

                    </div>

                `;


                // ==================================
                // MENU ITEMS
                // ==================================

                categoryItems.forEach(
                    item => {

                        categoryElement.appendChild(
                            createMenuItemElement(
                                item
                            )
                        );

                    }
                );


                container.appendChild(
                    categoryElement
                );

            }
        );


    container.classList.remove(
        "hidden"
    );

}


// ==========================================
// CREATE MENU ITEM ELEMENT
// ==========================================

function createMenuItemElement(
    item
) {

    const element =
        document.createElement(
            "div"
        );


    element.className =
        "menu-item";


    const available =
        item.available !== false;


    // ==================================
    // IMAGE
    // ==================================

    let imageHtml =
        "🍽️";


    if (item.imageURL) {

        imageHtml = `

            <img
                src="${escapeAttribute(
                    item.imageURL
                )}"

                alt="${escapeAttribute(
                    item.itemName ||
                    "Menu item"
                )}"

                onerror="
                    this.style.display='none';
                    this.parentElement.innerHTML='🍽️';
                "
            >

        `;

    }


    // ==================================
    // HTML
    // ==================================

    element.innerHTML = `

        <div class="menu-item-image">

            ${imageHtml}

        </div>


        <div class="menu-item-details">

            <h4 class="menu-item-name">

                ${escapeHtml(
                    item.itemName ||
                    "Unnamed Item"
                )}

            </h4>


            <p class="menu-item-description">

                ${escapeHtml(
                    item.description ||
                    "No description available."
                )}

            </p>


            <div class="menu-item-price">

                AED
                ${formatPrice(
                    item.price
                )}

            </div>

        </div>


        <div class="menu-item-actions">

            <span
                class="availability-pill ${
                    available
                        ? "available"
                        : "unavailable"
                }">

                ${
                    available
                        ? "● Available"
                        : "● Unavailable"
                }

            </span>


            <button
                type="button"
                class="edit-btn">

                Edit

            </button>

        </div>

    `;


    // ==================================
    // EDIT BUTTON
    // ==================================

    const editButton =
        element.querySelector(
            ".edit-btn"
        );


    if (editButton) {

        editButton.addEventListener(
            "click",
            () => {

                openMenuItemModal(
                    item
                );

            }
        );

    }


    return element;

}


// ==========================================
// MENU ITEM MODAL
// ==========================================

function openMenuItemModal(
    item = null
) {

    const modal =
        document.getElementById(
            "menuItemModal"
        );


    if (!modal) {

        return;

    }


    modal.classList.remove(
        "hidden"
    );


    console.log(
        "MENU: Menu item:",
        item
    );

}


function closeMenuItemModal() {

    const modal =
        document.getElementById(
            "menuItemModal"
        );


    if (!modal) {

        return;

    }


    modal.classList.add(
        "hidden"
    );

}


// ==========================================
// LOADING
// ==========================================

function showLoading() {

    const loading =
        document.getElementById(
            "menuLoading"
        );


    const container =
        document.getElementById(
            "menuContainer"
        );


    if (loading) {

        loading.classList.remove(
            "hidden"
        );

    }


    if (container) {

        container.classList.add(
            "hidden"
        );

    }

}


function hideLoading() {

    const loading =
        document.getElementById(
            "menuLoading"
        );


    if (loading) {

        loading.classList.add(
            "hidden"
        );

    }

}


// ==========================================
// ERROR
// ==========================================

function showError(
    message
) {

    const error =
        document.getElementById(
            "menuError"
        );


    const errorMessage =
        document.getElementById(
            "menuErrorMessage"
        );


    if (errorMessage) {

        errorMessage.textContent =
            message;

    }


    if (error) {

        error.classList.remove(
            "hidden"
        );

    }

}


function hideError() {

    const error =
        document.getElementById(
            "menuError"
        );


    if (error) {

        error.classList.add(
            "hidden"
        );

    }

}


// ==========================================
// EMPTY STATE
// ==========================================

function showEmptyState(
    message = null
) {

    const empty =
        document.getElementById(
            "menuEmpty"
        );


    if (!empty) {

        return;

    }


    if (message) {

        const paragraph =
            empty.querySelector(
                "p"
            );


        if (paragraph) {

            paragraph.textContent =
                message;

        }

    }


    empty.classList.remove(
        "hidden"
    );

}


function hideEmpty() {

    const empty =
        document.getElementById(
            "menuEmpty"
        );


    if (empty) {

        empty.classList.add(
            "hidden"
        );

    }

}


// ==========================================
// RESET MENU DISPLAY
// ==========================================

function resetMenuDisplay() {

    const container =
        document.getElementById(
            "menuContainer"
        );


    if (container) {

        container.classList.add(
            "hidden"
        );


        container.innerHTML =
            "";

    }


    hideEmpty();

    hideError();


    setText(
        "selectedBranchName",
        "Select a Branch"
    );


    updateSummary(
        []
    );

}


// ==========================================
// UNAUTHORIZED
// ==========================================

function handleUnauthorized() {

    console.warn(
        "MENU: Session is invalid."
    );


    // Use the existing auth.js
    // session cleanup.

    clearSession();


    window.location.href =
        "login.html";

}


// ==========================================
// LOGOUT
// ==========================================

function handleLogout() {

    console.log(
        "MENU: Logging out."
    );


    clearSession();


    window.location.href =
        "login.html";

}


// ==========================================
// SET TEXT
// ==========================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


// ==========================================
// FORMAT PRICE
// ==========================================

function formatPrice(
    price
) {

    const number =
        Number(price);


    if (
        Number.isNaN(number)
    ) {

        return "0.00";

    }


    return number.toFixed(
        2
    );

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHtml(
    value
) {

    return String(
        value
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


// ==========================================
// ESCAPE ATTRIBUTE
// ==========================================

function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );

}