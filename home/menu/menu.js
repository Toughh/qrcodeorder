// ==========================================
// QR RESTAURANT SAAS
// OWNER — MENU PAGE
// ==========================================

// ==========================================
// N8N OWNER MENU WEBHOOK
// ==========================================

const N8N_MENU_WEBHOOK =
`${N8N_BASE_URL}/owner-menu`;

// ==========================================
// N8N OWNER BRANCHES WEBHOOK
// ==========================================

const N8N_BRANCHES_WEBHOOK =
`${N8N_BASE_URL}/owner-branches`;

// ==========================================
// PAGE STATE
// ==========================================

let currentSession = null;

let allMenuItems = [];

// ==========================================
// PAGE LOAD
// ==========================================

document.addEventListener(
"DOMContentLoaded",
async function () {


    console.log("==================================");
    console.log("MENU PAGE: Page loaded");
    console.log("==================================");


    try {

        // ==================================
        // AUTHENTICATION
        // ==================================

        console.log(
            "MENU PAGE: Checking authentication..."
        );


        const session =
            await requireAuthentication();


        if (!session) {

            console.warn(
                "MENU PAGE: Authentication failed."
            );

            return;

        }


        currentSession =
            session;


        console.log(
            "MENU PAGE: Authentication successful."
        );


        console.log(
            "MENU AUTH SESSION:",
            session
        );


        // ==================================
        // USER INFORMATION
        // ==================================

        loadUserInformation(
            session
        );


        // ==================================
        // EVENT LISTENERS
        // ==================================

        setupEventListeners();


        // ==================================
        // LOAD BRANCHES
        // ==================================

        await loadBranchesForMenu();


        console.log("==================================");
        console.log(
            "MENU PAGE: Initialization completed."
        );
        console.log("==================================");

    }


    catch (error) {

        console.error(
            "MENU PAGE: Initialization error:",
            error
        );


        showError(
            "Unable to load the menu. Please try again."
        );

    }

}


);

// ==========================================
// LOAD USER INFORMATION
// ==========================================

function loadUserInformation(
session
) {


console.log(
    "MENU PAGE: Loading user information..."
);


const ownerName =
    session?.ownerName ||
    session?.OwnerName ||
    session?.name ||
    session?.userName ||
    session?.user?.ownerName ||
    localStorage.getItem("ownerName") ||
    localStorage.getItem("userName") ||
    "Owner";


const role =
    session?.role ||
    session?.Role ||
    session?.user?.role ||
    localStorage.getItem("role") ||
    "Owner";


// ==================================
// USER NAME
// ==================================

const userNameElement =
    document.getElementById(
        "userName"
    );


if (userNameElement) {

    userNameElement.textContent =
        ownerName;

}


// ==================================
// USER ROLE
// ==================================

const userRoleElement =
    document.getElementById(
        "userRole"
    );


if (userRoleElement) {

    userRoleElement.textContent =
        role;

}


// ==================================
// AVATAR
// ==================================

const avatar =
    document.getElementById(
        "userAvatar"
    );


if (avatar) {

    avatar.textContent =
        ownerName
            .charAt(0)
            .toUpperCase();

}


}

// ==========================================
// GET SESSION TOKEN
// ==========================================

function getMenuSessionToken() {


/*
 * Prefer the existing auth.js helper.
 */

if (
    typeof getSessionToken ===
    "function"
) {

    const token =
        getSessionToken();

    if (token) {

        return token;

    }

}


/*
 * Fallbacks.
 */

return (
    localStorage.getItem(
        "qro_session_token"
    ) ||

    localStorage.getItem(
        "sessionToken"
    ) ||

    ""
);


}

// ==========================================
// LOAD BRANCHES
// ==========================================

async function loadBranchesForMenu() {


console.log("==================================");
console.log(
    "MENU PAGE: Loading branches..."
);
console.log("==================================");


const sessionToken =
    getMenuSessionToken();


if (!sessionToken) {

    console.error(
        "MENU PAGE: No session token found."
    );


    showError(
        "Your session could not be found. Please login again."
    );


    return;

}


const branchSelect =
    document.getElementById(
        "branchSelect"
    );


if (!branchSelect) {

    console.error(
        "MENU PAGE: branchSelect not found."
    );


    showError(
        "Branch selector could not be found."
    );


    return;

}


showLoading();


try {

    console.log(
        "MENU PAGE: Calling owner-branches..."
    );


    const response =
        await fetch(
            N8N_BRANCHES_WEBHOOK,
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
        "MENU BRANCH API HTTP STATUS:",
        response.status
    );


    const rawResult =
        await response.json();


    console.log(
        "MENU BRANCH API RAW RESPONSE:",
        rawResult
    );


    const result =
        normalizeApiResponse(
            rawResult
        );


    console.log(
        "MENU BRANCH API NORMALIZED RESPONSE:",
        result
    );


    // ==================================
    // API ERROR
    // ==================================

    if (
        !response.ok ||
        !result ||
        result.success !== true
    ) {

        console.error(
            "MENU BRANCH API ERROR:",
            result
        );


        if (
            isInvalidSessionResponse(
                result
            )
        ) {

            handleInvalidSession();

            return;

        }


        hideLoading();


        showError(
            result?.message ||
            "Unable to load branches."
        );


        return;

    }


    // ==================================
    // EXTRACT BRANCHES
    // ==================================

    const branches =
        extractBranches(
            result
        );


    console.log(
        "MENU PAGE: Branches received:",
        branches
    );


    // ==================================
    // NO BRANCHES
    // ==================================

    if (
        branches.length === 0
    ) {

        branchSelect.innerHTML =
            "";


        const option =
            document.createElement(
                "option"
            );


        option.value =
            "";


        option.textContent =
            "No branches available";


        branchSelect.appendChild(
            option
        );


        hideLoading();


        resetMenuDisplay();


        showBranchRequiredMessage(
            "No branches are available for this restaurant."
        );


        return;

    }


    // ==================================
    // POPULATE BRANCHES
    // ==================================

    branchSelect.innerHTML =
        "";


    branches.forEach(
        function (branch) {

            const branchId =
                branch.branchId ||
                branch.BranchId ||
                branch.id ||
                branch.Id ||
                "";


            const branchName =
                branch.branchName ||
                branch.BranchName ||
                branch.name ||
                branch.Name ||
                "Unnamed Branch";


            if (!branchId) {

                console.warn(
                    "MENU PAGE: Branch without ID:",
                    branch
                );


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


            branchSelect.appendChild(
                option
            );

        }
    );


    // ==================================
    // VERIFY BRANCHES
    // ==================================

    if (
        branchSelect.options.length === 0
    ) {

        hideLoading();


        showError(
            "No valid branches were returned."
        );


        return;

    }


    // ==================================
    // RESTORE PREVIOUS BRANCH
    // ==================================

    const savedBranchId =
        localStorage.getItem(
            "menuBranchId"
        );


    let selectedBranchId =
        "";


    if (
        savedBranchId &&
        Array.from(
            branchSelect.options
        ).some(
            function (option) {

                return (
                    option.value ===
                    savedBranchId
                );

            }
        )
    ) {

        selectedBranchId =
            savedBranchId;

    }


    // ==================================
    // DEFAULT FIRST BRANCH
    // ==================================

    if (!selectedBranchId) {

        selectedBranchId =
            branchSelect
                .options[0]
                .value;

    }


    // ==================================
    // SET BRANCH
    // ==================================

    branchSelect.value =
        selectedBranchId;


    localStorage.setItem(
        "menuBranchId",
        selectedBranchId
    );


    updateSelectedBranchName(
        branchSelect
    );


    // ==================================
    // LOAD MENU
    // ==================================

    await loadMenu(
        selectedBranchId
    );

}


catch (error) {

    console.error(
        "MENU PAGE: Branch loading error:",
        error
    );


    hideLoading();


    showError(
        "Unable to connect to the branch service."
    );

}


}

// ==========================================
// EXTRACT BRANCHES
// ==========================================

function extractBranches(
result
) {


/*
 * Supports the existing owner-branches
 * response structure:
 *
 * {
 *   success: true,
 *   data: {
 *      branches: [...]
 *   }
 * }
 *
 * Also supports branches directly on
 * the response if the workflow changes later.
 */

if (
    Array.isArray(
        result?.branches
    )
) {

    return result.branches;

}


if (
    Array.isArray(
        result?.data?.branches
    )
) {

    return result.data.branches;

}


return [];


}

// ==========================================
// LOAD MENU
// ==========================================

async function loadMenu(
selectedBranchId
) {


console.log("==================================");
console.log(
    "MENU PAGE: Loading menu..."
);
console.log("==================================");


const sessionToken =
    getMenuSessionToken();


if (!sessionToken) {

    console.error(
        "MENU PAGE: No session token found."
    );


    showError(
        "Your session could not be found. Please login again."
    );


    return;

}


const branchId =
    selectedBranchId ||
    "";


if (!branchId) {

    resetMenuDisplay();


    showBranchRequiredMessage();


    return;

}


localStorage.setItem(
    "menuBranchId",
    branchId
);


const branchSelect =
    document.getElementById(
        "branchSelect"
    );


if (branchSelect) {

    branchSelect.value =
        branchId;


    updateSelectedBranchName(
        branchSelect
    );

}


showLoading();


/*
 * IMPORTANT:
 *
 * The completed n8n Owner Menu workflow
 * only requires:
 *
 * sessionToken
 * branchId
 *
 * restaurantId is determined securely
 * by n8n from the authenticated session.
 */

const requestBody = {

    sessionToken:
        sessionToken,

    branchId:
        branchId

};


console.log(
    "MENU API REQUEST:",
    {
        ...requestBody,
        sessionToken:
            "[HIDDEN]"
    }
);


try {

    console.log(
        "MENU PAGE: Calling owner-menu..."
    );


    const response =
        await fetch(
            N8N_MENU_WEBHOOK,
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify(
                        requestBody
                    )

            }
        );


    console.log(
        "MENU API HTTP STATUS:",
        response.status
    );


    const rawResult =
        await response.json();


    console.log(
        "MENU API RAW RESPONSE:",
        rawResult
    );


    const result =
        normalizeApiResponse(
            rawResult
        );


    console.log(
        "MENU API NORMALIZED RESPONSE:",
        result
    );


    // ==================================
    // SUCCESS
    // ==================================

    if (
        response.ok &&
        result &&
        result.success === true
    ) {

        console.log(
            "MENU PAGE: Menu loaded successfully."
        );


        const menuItems =
            Array.isArray(
                result.menuItems
            )
                ? result.menuItems
                : [];


        allMenuItems =
            menuItems;


        hideMessage();


        populateCategoryFilter(
            allMenuItems
        );


        updateSummary(
            allMenuItems
        );


        renderFilteredMenu(
            allMenuItems
        );


        hideLoading();


        return;

    }


    // ==================================
    // INVALID SESSION
    // ==================================

    if (
        isInvalidSessionResponse(
            result
        )
    ) {

        console.warn(
            "MENU PAGE: Session invalid or expired."
        );


        handleInvalidSession();


        return;

    }


    // ==================================
    // INVALID BRANCH
    // ==================================

    if (
        result &&
        result.success === false &&
        result.code ===
            "INVALID_BRANCH"
    ) {

        console.warn(
            "MENU PAGE: Invalid branch."
        );


        allMenuItems =
            [];


        resetMenuDisplay();


        hideLoading();


        showError(
            result.message ||
            "Selected branch does not belong to this restaurant."
        );


        return;

    }


    // ==================================
    // OTHER API ERROR
    // ==================================

    console.error(
        "MENU API ERROR:",
        result
    );


    allMenuItems =
        [];


    resetMenuDisplay();


    hideLoading();


    showError(
        result?.message ||
        "Unable to load menu."
    );

}


catch (error) {

    console.error(
        "MENU API CONNECTION ERROR:",
        error
    );


    hideLoading();


    showError(
        "Unable to connect to the menu service."
    );

}


}

// ==========================================
// NORMALIZE API RESPONSE
// ==========================================

function normalizeApiResponse(
rawResult
) {


if (
    Array.isArray(rawResult)
) {

    return rawResult[0] || {};

}


return rawResult || {};


}

// ==========================================
// INVALID SESSION CHECK
// ==========================================

function isInvalidSessionResponse(
result
) {


if (
    !result ||
    result.success !== false
) {

    return false;

}


return (
    result.code ===
        "INVALID_SESSION"

    ||

    result.code ===
        "RESTAURANT_SESSION_INVALID"

    ||

    result.code ===
        "SESSION_TOKEN_MISSING"

    ||

    result.code ===
        "SESSION_EXPIRED"
);


}

// ==========================================
// UPDATE SELECTED BRANCH NAME
// ==========================================

function updateSelectedBranchName(
branchSelect
) {


if (!branchSelect) {

    return;

}


const selectedOption =
    branchSelect.options[
        branchSelect.selectedIndex
    ];


const branchNameElement =
    document.getElementById(
        "branchName"
    );


if (!branchNameElement) {

    return;

}


if (
    selectedOption &&
    selectedOption.value
) {

    branchNameElement.textContent =
        selectedOption.textContent;

}


}

// ==========================================
// HANDLE INVALID SESSION
// ==========================================

function handleInvalidSession() {


console.warn(
    "MENU PAGE: Clearing invalid session."
);


if (
    typeof clearSession ===
    "function"
) {

    clearSession();

}

else {

    localStorage.removeItem(
        "qro_session_token"
    );

    localStorage.removeItem(
        "qro_session_data"
    );

    localStorage.removeItem(
        "qro_validated_session"
    );

    localStorage.removeItem(
        "sessionToken"
    );

}


window.location.href =
    "../../login/login.html";


}

// ==========================================
// RENDER MENU
// ==========================================

function renderFilteredMenu(
items
) {


const menuGrid =
    document.getElementById(
        "menuGrid"
    );


const emptyState =
    document.getElementById(
        "emptyState"
    );


const menuItemCount =
    document.getElementById(
        "menuItemCount"
    );


if (!menuGrid) {

    return;

}


menuGrid.innerHTML =
    "";


const itemCount =
    items.length;


if (menuItemCount) {

    menuItemCount.textContent =
        `${itemCount} ${
            itemCount === 1
                ? "item"
                : "items"
        }`;

}


if (
    itemCount === 0
) {

    if (emptyState) {

        emptyState.classList.remove(
            "hidden"
        );

    }


    return;

}


if (emptyState) {

    emptyState.classList.add(
        "hidden"
    );

}


items.forEach(
    function (item) {

        menuGrid.appendChild(
            createMenuCard(
                item
            )
        );

    }
);


}

// ==========================================
// CREATE MENU CARD
// ==========================================

function createMenuCard(
item
) {


const card =
    document.createElement(
        "div"
    );


card.className =
    "menu-card";


// ==================================
// IMAGE
// ==================================

const imageWrapper =
    document.createElement(
        "div"
    );


imageWrapper.className =
    "menu-image-wrapper";


let imageURL =
    item.imageURL ||
    item.ImageURL ||
    "";


// ==================================
// HANDLE AIRTABLE IMAGE FORMAT
// ==================================

if (Array.isArray(imageURL)) {

    imageURL =
        imageURL[0]?.url ||
        "";

}


// ==================================
// HANDLE AIRTABLE STRING FORMAT
// Example:
// ZingerBerger.png (https://....)
// ==================================

if (typeof imageURL === "string") {

    imageURL =
        imageURL.trim();


    const urlMatch =
        imageURL.match(
            /\((https?:\/\/[^)]+)\)/
        );


    if (urlMatch) {

        imageURL =
            urlMatch[1];

    }

}


// ==================================
// CREATE IMAGE
// ==================================

if (imageURL) {

    const image =
        document.createElement(
            "img"
        );


    image.className =
        "menu-image";


    image.src =
        imageURL;


    image.alt =
        item.itemName ||
        item.ItemName ||
        "Menu item";


    image.loading =
        "lazy";


    image.onerror =
        function () {

            image.remove();


            createImagePlaceholder(
                imageWrapper
            );

        };


    imageWrapper.appendChild(
        image
    );

}

else {

    createImagePlaceholder(
        imageWrapper
    );

}


// ==================================
// CONTENT
// ==================================

const content =
    document.createElement(
        "div"
    );


content.className =
    "menu-card-content";


// ==================================
// CATEGORY
// ==================================

const category =
    document.createElement(
        "div"
    );


category.className =
    "menu-category";


category.textContent =
    item.category ||
    item.Category ||
    "Menu";


// ==================================
// NAME
// ==================================

const name =
    document.createElement(
        "div"
    );


name.className =
    "menu-name";


name.textContent =
    item.itemName ||
    item.ItemName ||
    "Unnamed Item";


// ==================================
// DESCRIPTION
// ==================================

const description =
    document.createElement(
        "div"
    );


description.className =
    "menu-description";


description.textContent =
    item.description ||
    item.Description ||
    "No description available.";


// ==================================
// FOOTER
// ==================================

const footer =
    document.createElement(
        "div"
    );


footer.className =
    "menu-card-footer";


// ==================================
// PRICE
// ==================================

const price =
    document.createElement(
        "div"
    );


price.className =
    "menu-price";


const itemPrice =
    item.price ??
    item.Price ??
    0;


price.textContent =
    formatPrice(
        itemPrice
    );


// ==================================
// AVAILABILITY
// ==================================

const badge =
    document.createElement(
        "span"
    );


const available =
    isItemAvailable(
        item.available ??
        item.Available
    );


badge.className =
    `availability-badge ${
        available
            ? "available"
            : "unavailable"
    }`;


badge.textContent =
    available
        ? "Available"
        : "Unavailable";


// ==================================
// BUILD CARD
// ==================================

footer.appendChild(
    price
);


footer.appendChild(
    badge
);


content.appendChild(
    category
);


content.appendChild(
    name
);


content.appendChild(
    description
);


content.appendChild(
    footer
);


card.appendChild(
    imageWrapper
);


card.appendChild(
    content
);


return card;


}

// ==========================================
// IMAGE PLACEHOLDER
// ==========================================

function createImagePlaceholder(
imageWrapper
) {


const placeholder =
    document.createElement(
        "div"
    );


placeholder.className =
    "menu-image-placeholder";


placeholder.textContent =
    "🍽️";


imageWrapper.appendChild(
    placeholder
);


}

// ==========================================
// AVAILABILITY
// ==========================================

function isItemAvailable(
value
) {


if (
    value === false ||
    value === "false" ||
    value === "False" ||
    value === "0" ||
    value === 0
) {

    return false;

}


return true;


}

// ==========================================
// FORMAT PRICE
// ==========================================

function formatPrice(
price
) {


const numericPrice =
    Number(
        price || 0
    );


return new Intl.NumberFormat(
    "en-AE",
    {

        style:
            "currency",

        currency:
            "AED",

        minimumFractionDigits:
            2

    }
).format(
    numericPrice
);


}

// ==========================================
// UPDATE SUMMARY
// ==========================================

function updateSummary(
menuItems
) {


const total =
    menuItems.length;


const available =
    menuItems.filter(
        function (item) {

            return isItemAvailable(
                item.available ??
                item.Available
            );

        }
    ).length;


const unavailable =
    total -
    available;


setText(
    "totalItems",
    total
);


setText(
    "availableItems",
    available
);


setText(
    "unavailableItems",
    unavailable
);


}

// ==========================================
// CATEGORY FILTER
// ==========================================

function populateCategoryFilter(
menuItems
) {


const categoryFilter =
    document.getElementById(
        "categoryFilter"
    );


if (!categoryFilter) {

    return;

}


const categories =
    [
        ...new Set(
            menuItems
                .map(
                    function (item) {

                        return (
                            item.category ||
                            item.Category ||
                            ""
                        ).trim();

                    }
                )
                .filter(Boolean)
        )
    ]
    .sort(
        function (a, b) {

            return a.localeCompare(
                b
            );

        }
    );


categoryFilter.innerHTML =
    "";


const allOption =
    document.createElement(
        "option"
    );


allOption.value =
    "";


allOption.textContent =
    "All Categories";


categoryFilter.appendChild(
    allOption
);


categories.forEach(
    function (category) {

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


}

// ==========================================
// SEARCH / FILTER
// ==========================================

function applyMenuFilters() {


const searchInput =
    document.getElementById(
        "menuSearch"
    );


const categoryFilter =
    document.getElementById(
        "categoryFilter"
    );


if (!searchInput) {

    return;

}


const searchText =
    searchInput.value
        .trim()
        .toLowerCase();


const selectedCategory =
    categoryFilter?.value ||
    "";


const filteredItems =
    allMenuItems.filter(
        function (item) {

            const name =
                (
                    item.itemName ||
                    item.ItemName ||
                    ""
                )
                .toLowerCase();


            const description =
                (
                    item.description ||
                    item.Description ||
                    ""
                )
                .toLowerCase();


            const category =
                item.category ||
                item.Category ||
                "";


            const matchesSearch =
                !searchText ||
                name.includes(
                    searchText
                ) ||
                description.includes(
                    searchText
                );


            const matchesCategory =
                !selectedCategory ||
                category ===
                    selectedCategory;


            return (
                matchesSearch &&
                matchesCategory
            );

        }
    );


renderFilteredMenu(
    filteredItems
);


}

// ==========================================
// RESET MENU DISPLAY
// ==========================================

function resetMenuDisplay() {


allMenuItems =
    [];


setText(
    "totalItems",
    0
);


setText(
    "availableItems",
    0
);


setText(
    "unavailableItems",
    0
);


setText(
    "menuItemCount",
    "0 items"
);


const menuGrid =
    document.getElementById(
        "menuGrid"
    );


if (menuGrid) {

    menuGrid.innerHTML =
        "";

}


const emptyState =
    document.getElementById(
        "emptyState"
    );


if (emptyState) {

    emptyState.classList.add(
        "hidden"
    );

}


const categoryFilter =
    document.getElementById(
        "categoryFilter"
    );


if (categoryFilter) {

    categoryFilter.innerHTML =
        `<option value="">All Categories</option>`;

}


}

// ==========================================
// SHOW LOADING
// ==========================================

function showLoading() {


const loadingState =
    document.getElementById(
        "loadingState"
    );


const emptyState =
    document.getElementById(
        "emptyState"
    );


const menuGrid =
    document.getElementById(
        "menuGrid"
    );


if (loadingState) {

    loadingState.classList.remove(
        "hidden"
    );

}


if (emptyState) {

    emptyState.classList.add(
        "hidden"
    );

}


if (menuGrid) {

    menuGrid.innerHTML =
        "";

}


hideMessage();


}

// ==========================================
// HIDE LOADING
// ==========================================

function hideLoading() {


const loadingState =
    document.getElementById(
        "loadingState"
    );


if (loadingState) {

    loadingState.classList.add(
        "hidden"
    );

}


}

// ==========================================
// ERROR MESSAGE
// ==========================================

function showError(
message
) {


hideLoading();


const messageBox =
    document.getElementById(
        "messageBox"
    );


if (!messageBox) {

    console.error(
        "MENU PAGE ERROR:",
        message
    );


    return;

}


messageBox.textContent =
    message;


messageBox.className =
    "message-box error";


messageBox.classList.remove(
    "hidden"
);


}

// ==========================================
// BRANCH REQUIRED MESSAGE
// ==========================================

function showBranchRequiredMessage(
message =
"Please select a branch to view its menu."
) {


hideLoading();


const messageBox =
    document.getElementById(
        "messageBox"
    );


if (!messageBox) {

    return;

}


messageBox.textContent =
    message;


messageBox.className =
    "message-box";


messageBox.classList.remove(
    "hidden"
);


}

// ==========================================
// HIDE MESSAGE
// ==========================================

function hideMessage() {


const messageBox =
    document.getElementById(
        "messageBox"
    );


if (!messageBox) {

    return;

}


messageBox.classList.add(
    "hidden"
);


messageBox.textContent =
    "";


}

// ==========================================
// EVENT LISTENERS
// ==========================================

function setupEventListeners() {


// ==================================
// LOGOUT
// ==================================

const logoutButton =
    document.getElementById(
        "logoutBtn"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        function () {

            console.log(
                "MENU PAGE: Logging out."
            );


            if (
                typeof clearSession ===
                "function"
            ) {

                clearSession();

            }

            else {

                localStorage.removeItem(
                    "qro_session_token"
                );

                localStorage.removeItem(
                    "qro_session_data"
                );

                localStorage.removeItem(
                    "qro_validated_session"
                );

                localStorage.removeItem(
                    "sessionToken"
                );

            }


            window.location.href =
                "../../login/login.html";

        }
    );

}


// ==================================
// MOBILE MENU
// ==================================

const mobileMenuButton =
    document.getElementById(
        "mobileMenuBtn"
    );


if (mobileMenuButton) {

    mobileMenuButton.addEventListener(
        "click",
        function () {

            const sidebar =
                document.querySelector(
                    ".sidebar"
                );


            if (!sidebar) {

                return;

            }


            const isOpen =
                sidebar.classList.toggle(
                    "open"
                );


            mobileMenuButton.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

        }
    );

}


// ==================================
// BRANCH SELECTOR
// ==================================

const branchSelect =
    document.getElementById(
        "branchSelect"
    );


if (branchSelect) {

    branchSelect.addEventListener(
        "change",
        async function () {

            const selectedBranchId =
                this.value;


            console.log(
                "=================================="
            );


            console.log(
                "MENU PAGE: Branch changed:",
                selectedBranchId
            );


            console.log(
                "=================================="
            );


            if (!selectedBranchId) {

                resetMenuDisplay();


                showBranchRequiredMessage();


                return;

            }


            localStorage.setItem(
                "menuBranchId",
                selectedBranchId
            );


            updateSelectedBranchName(
                branchSelect
            );


            await loadMenu(
                selectedBranchId
            );

        }
    );

}


// ==================================
// SEARCH
// ==================================

const searchInput =
    document.getElementById(
        "menuSearch"
    );


if (searchInput) {

    searchInput.addEventListener(
        "input",
        function () {

            applyMenuFilters();

        }
    );

}


// ==================================
// CATEGORY FILTER
// ==================================

const categoryFilter =
    document.getElementById(
        "categoryFilter"
    );


if (categoryFilter) {

    categoryFilter.addEventListener(
        "change",
        function () {

            applyMenuFilters();

        }
    );

}


}

// ==========================================
// HELPER — SET TEXT
// ==========================================

function setText(
elementId,
value
) {


const element =
    document.getElementById(
        elementId
    );


if (element) {

    element.textContent =
        value ?? "-";

}


}
