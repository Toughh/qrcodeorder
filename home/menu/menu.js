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
// PAGE LOAD
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log("==================================");
        console.log("MENU PAGE: Page loaded");
        console.log("==================================");


        // ==================================
        // CHECK AUTHENTICATION
        // ==================================

        console.log(
            "MENU PAGE: Checking authentication..."
        );


        try {

            const session =
                await requireAuthentication();


            // ==================================
            // AUTHENTICATION FAILED
            // ==================================

            if (!session) {

                console.warn(
                    "MENU PAGE: Authentication failed."
                );

                return;

            }


            // ==================================
            // AUTHENTICATION SUCCESSFUL
            // ==================================

            console.log(
                "MENU PAGE: Authentication successful."
            );

            console.log(
                "MENU AUTH SESSION:",
                session
            );


            // ==================================
            // INITIALIZE USER INFORMATION
            // ==================================

            loadUserInformation(
                session
            );


            // ==================================
            // SETUP UI
            // ==================================

            setupEventListeners();


            // ==================================
            // LOAD BRANCHES FIRST
            // ==================================

            await loadBranchesForMenu(
                session
            );


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


            /*
             * IMPORTANT:
             *
             * Do NOT redirect here.
             *
             * If menu API fails, keep the page visible
             * and show the error message.
             */

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


    /*
     * Try values from authentication session first.
     * Then fall back to existing localStorage values.
     */

    const ownerName =
        session?.ownerName ||
        session?.OwnerName ||
        session?.name ||
        session?.userName ||
        localStorage.getItem("ownerName") ||
        localStorage.getItem("userName") ||
        "Owner";


    const role =
        session?.role ||
        session?.Role ||
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
        document.querySelector(
            ".user-avatar"
        );


    if (avatar) {

        avatar.textContent =
            ownerName
                .charAt(0)
                .toUpperCase();

    }

}


// ==========================================
// LOAD BRANCHES FOR MENU
// ==========================================

async function loadBranchesForMenu(
    session
) {

    console.log("==================================");
    console.log(
        "MENU PAGE: Loading branches..."
    );
    console.log("==================================");


    // ==================================
    // GET SESSION TOKEN
    // ==================================

    const sessionToken =
        getSessionToken();


    if (!sessionToken) {

        console.error(
            "MENU PAGE: No session token found."
        );


        showError(
            "Your session could not be found. Please login again."
        );


        return;

    }


    console.log(
        "MENU PAGE: Session token found."
    );


    // ==================================
    // GET BRANCH SELECT
    // ==================================

    const branchSelect =
        document.getElementById(
            "branchSelect"
        );


    if (!branchSelect) {

        console.error(
            "MENU PAGE: branchSelect element not found."
        );


        showError(
            "Branch selector could not be found."
        );


        return;

    }


    // ==================================
    // SHOW LOADING
    // ==================================

    showLoading();


    try {

        // ==================================
        // CALL OWNER BRANCHES N8N
        // ==================================

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


        // ==================================
        // HTTP STATUS
        // ==================================

        console.log(
            "MENU BRANCH API HTTP STATUS:",
            response.status
        );


        // ==================================
        // READ RESPONSE
        // ==================================

        const rawResult =
            await response.json();


        console.log(
            "MENU BRANCH API RAW RESPONSE:",
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


            // ==================================
            // INVALID SESSION
            // ==================================

            if (
                result &&
                result.success === false &&
                (
                    result.code ===
                        "INVALID_SESSION"
                    ||
                    result.code ===
                        "RESTAURANT_SESSION_INVALID"
                )
            ) {

                handleInvalidSession();

                return;

            }


            showError(
                result?.message ||
                "Unable to load branches."
            );


            return;

        }


        // ==================================
        // GET DATA
        // ==================================

        const data =
            result.data || {};


        const branches =
            Array.isArray(
                data.branches
            )
                ? data.branches
                : [];


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

            console.warn(
                "MENU PAGE: No branches found."
            );


            branchSelect.innerHTML = "";


            const option =
                document.createElement(
                    "option"
                );


            option.value = "";


            option.textContent =
                "No branches available";


            branchSelect.appendChild(
                option
            );


            hideLoading();


            showBranchRequiredMessage();


            return;

        }


        // ==================================
        // CLEAR EXISTING OPTIONS
        // ==================================

        branchSelect.innerHTML = "";


        // ==================================
        // ADD BRANCHES TO DROPDOWN
        // ==================================

        branches.forEach(
            function (branch) {

                const branchId =
                    branch.branchId ||
                    branch.BranchId ||
                    "";


                const branchName =
                    branch.branchName ||
                    branch.BranchName ||
                    branch.name ||
                    branch.Name ||
                    "Unnamed Branch";


                if (!branchId) {

                    console.warn(
                        "MENU PAGE: Branch without BranchId:",
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
        // VERIFY VALID OPTIONS
        // ==================================

        if (
            branchSelect.options.length === 0
        ) {

            console.error(
                "MENU PAGE: No valid branch IDs received."
            );


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


        let selectedBranchId = "";


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
        // OTHERWISE SELECT FIRST BRANCH
        // ==================================

        if (!selectedBranchId) {

            selectedBranchId =
                branchSelect
                    .options[0]
                    .value;

        }


        // ==================================
        // SET SELECTED BRANCH
        // ==================================

        branchSelect.value =
            selectedBranchId;


        // ==================================
        // SAVE SELECTED BRANCH
        // ==================================

        localStorage.setItem(
            "menuBranchId",
            selectedBranchId
        );


        console.log(
            "MENU PAGE: Selected Branch ID:",
            selectedBranchId
        );


        // ==================================
        // UPDATE BRANCH NAME
        // ==================================

        updateSelectedBranchName(
            branchSelect
        );


        // ==================================
        // LOAD MENU FOR BRANCH
        // ==================================

        await loadMenu(
            session,
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
// LOAD MENU
// ==========================================

async function loadMenu(
    session,
    selectedBranchId = ""
) {

    console.log("==================================");
    console.log(
        "MENU PAGE: Loading menu..."
    );
    console.log("==================================");


    // ==================================
    // GET SESSION TOKEN
    // ==================================

    const sessionToken =
        getSessionToken();


    if (!sessionToken) {

        console.error(
            "MENU PAGE: No session token found."
        );


        showError(
            "Your session could not be found. Please login again."
        );


        return;

    }


    console.log(
        "MENU PAGE: Session token found."
    );


    // ==================================
    // GET RESTAURANT ID
    // ==================================

    const restaurantId =
        getRestaurantId(
            session
        );


    console.log(
        "MENU PAGE: Restaurant ID:",
        restaurantId
    );


    if (!restaurantId) {

        console.error(
            "MENU PAGE: Restaurant ID not found."
        );


        showError(
            "Restaurant information could not be determined."
        );


        return;

    }


    // ==================================
    // GET BRANCH ID
    // ==================================

    const branchId =
        selectedBranchId ||
        getBranchId(
            session
        );


    console.log(
        "MENU PAGE: Branch ID:",
        branchId
    );


    if (!branchId) {

        console.error(
            "MENU PAGE: Branch ID not available."
        );


        showBranchRequiredMessage();


        return;

    }


    // ==================================
    // SAVE BRANCH ID
    // ==================================

    localStorage.setItem(
        "menuBranchId",
        branchId
    );


    // ==================================
    // UPDATE BRANCH NAME
    // ==================================

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


    // ==================================
    // SHOW LOADING
    // ==================================

    showLoading();


    // ==================================
    // REQUEST BODY
    // ==================================

    const requestBody = {

        sessionToken:
            sessionToken,

        restaurantId:
            restaurantId,

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


    // ==================================
    // CALL N8N
    // ==================================

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


        // ==================================
        // HTTP STATUS
        // ==================================

        console.log(
            "MENU API HTTP STATUS:",
            response.status
        );


        // ==================================
        // READ RESPONSE
        // ==================================

        const rawResult =
            await response.json();


        console.log(
            "MENU API RAW RESPONSE:",
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
            "MENU API NORMALIZED RESPONSE:",
            result
        );


        // ==========================================
        // SUCCESS
        // ==========================================

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


            renderMenu(
                menuItems
            );


            hideLoading();


            return;

        }


        // ==========================================
        // INVALID / EXPIRED SESSION
        // ==========================================

        if (
            result &&
            result.success === false &&
            (
                result.code ===
                    "INVALID_SESSION"
                ||
                result.code ===
                    "RESTAURANT_SESSION_INVALID"
            )
        ) {

            console.warn(
                "MENU PAGE: Session is invalid or expired."
            );


            handleInvalidSession();


            return;

        }


        // ==========================================
        // OTHER API ERROR
        // ==========================================

        console.error(
            "MENU API ERROR:",
            result
        );


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
// GET RESTAURANT ID
// ==========================================

function getRestaurantId(
    session
) {

    /*
     * Follow the same flexible structure
     * used by restaurant.js.
     */

    const restaurant =
        session?.restaurant ||
        {};


    const restaurantId =
        session?.restaurantId ||
        session?.RestaurantId ||
        restaurant.restaurantId ||
        restaurant.RestaurantId ||
        localStorage.getItem(
            "restaurantId"
        ) ||
        localStorage.getItem(
            "RestaurantId"
        ) ||
        "";


    return restaurantId;

}


// ==========================================
// GET BRANCH ID
// ==========================================

function getBranchId(
    session
) {

    // ==================================
    // SESSION LEVEL
    // ==================================

    let branchId =
        session?.branchId ||
        session?.BranchId ||
        "";


    // ==================================
    // RESTAURANT OBJECT
    // ==================================

    if (!branchId) {

        const restaurant =
            session?.restaurant ||
            {};


        branchId =
            restaurant.branchId ||
            restaurant.BranchId ||
            "";

    }


    // ==================================
    // URL PARAMETER
    // ==================================

    if (!branchId) {

        const params =
            new URLSearchParams(
                window.location.search
            );


        branchId =
            params.get(
                "branchId"
            ) ||
            "";

    }


    // ==================================
    // GENERIC LOCAL STORAGE
    // ==================================

    if (!branchId) {

        branchId =
            localStorage.getItem(
                "branchId"
            ) ||
            localStorage.getItem(
                "BranchId"
            ) ||
            "";

    }


    // ==================================
    // MENU-SPECIFIC LOCAL STORAGE
    // ==================================

    if (!branchId) {

        branchId =
            localStorage.getItem(
                "menuBranchId"
            ) ||
            "";

    }


    return branchId;

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
            "sessionToken"
        );

    }


    window.location.href =
        "login.html";

}


// ==========================================
// RENDER MENU
// ==========================================

function renderMenu(
    menuItems
) {

    console.log(
        "MENU PAGE: Rendering menu items:",
        menuItems
    );


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

        console.error(
            "MENU PAGE: menuGrid element not found."
        );


        return;

    }


    // ==================================
    // CLEAR EXISTING MENU
    // ==================================

    menuGrid.innerHTML = "";


    // ==================================
    // UPDATE COUNT
    // ==================================

    if (menuItemCount) {

        menuItemCount.textContent =
            `${menuItems.length} ${
                menuItems.length === 1
                    ? "item"
                    : "items"
            }`;

    }


    // ==================================
    // EMPTY MENU
    // ==================================

    if (
        !menuItems ||
        menuItems.length === 0
    ) {

        if (emptyState) {

            emptyState.classList.remove(
                "hidden"
            );

        }


        updateSummary(
            []
        );


        return;

    }


    // ==================================
    // HIDE EMPTY STATE
    // ==================================

    if (emptyState) {

        emptyState.classList.add(
            "hidden"
        );

    }


    // ==================================
    // RENDER ITEMS
    // ==================================

    menuItems.forEach(
        function (item) {

            const card =
                createMenuCard(
                    item
                );


            menuGrid.appendChild(
                card
            );

        }
    );


    // ==================================
    // UPDATE SUMMARY
    // ==================================

    updateSummary(
        menuItems
    );


    // ==================================
    // UPDATE CATEGORIES
    // ==================================

    populateCategoryFilter(
        menuItems
    );


    // ==================================
    // SETUP SEARCH
    // ==================================

    applyMenuFilters(
        menuItems
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


    const imageURL =
        item.imageURL ||
        item.ImageURL ||
        "";


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


        image.onerror =
            function () {

                image.remove();


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

            };


        imageWrapper.appendChild(
            image
        );

    }

    else {

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
// AVAILABILITY
// ==========================================

function isItemAvailable(
    value
) {

    if (
        value === false ||
        value === "false" ||
        value === "False" ||
        value === "0"
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
            style: "currency",
            currency: "AED",
            minimumFractionDigits: 2
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
                            );

                        }
                    )
                    .filter(Boolean)
            )
        ]
        .sort();


    categoryFilter.innerHTML =
        `<option value="">All Categories</option>`;


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

function applyMenuFilters(
    menuItems
) {

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


    function filterItems() {

        const searchText =
            searchInput.value
                .trim()
                .toLowerCase();


        const category =
            categoryFilter?.value ||
            "";


        const filteredItems =
            menuItems.filter(
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


                    const itemCategory =
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
                        !category ||
                        itemCategory ===
                            category;


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


    searchInput.oninput =
        filterItems;


    if (categoryFilter) {

        categoryFilter.onchange =
            filterItems;

    }

}


// ==========================================
// RENDER FILTERED MENU
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


    if (menuItemCount) {

        menuItemCount.textContent =
            `${items.length} ${
                items.length === 1
                    ? "item"
                    : "items"
            }`;

    }


    if (
        !items ||
        items.length === 0
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

function showBranchRequiredMessage() {

    hideLoading();


    const messageBox =
        document.getElementById(
            "messageBox"
        );


    if (!messageBox) {

        return;

    }


    messageBox.textContent =
        "Please select a branch to view its menu.";


    messageBox.className =
        "message-box";


    messageBox.classList.remove(
        "hidden"
    );

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
                        "sessionToken"
                    );

                }


                window.location.href =
                    "../login/login.html";

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


                if (sidebar) {

                    sidebar.classList.toggle(
                        "open"
                    );

                }

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

                    showBranchRequiredMessage();

                    return;

                }


                // ==================================
                // SAVE BRANCH
                // ==================================

                localStorage.setItem(
                    "menuBranchId",
                    selectedBranchId
                );


                // ==================================
                // UPDATE BRANCH NAME
                // ==================================

                updateSelectedBranchName(
                    branchSelect
                );


                // ==================================
                // GET SESSION
                // ==================================

                let session = null;


                try {

                    session =
                        JSON.parse(
                            localStorage.getItem(
                                "userSession"
                            ) || "{}"
                        );

                }

                catch (error) {

                    console.warn(
                        "MENU PAGE: Unable to read userSession."
                    );

                }


                // ==================================
                // LOAD SELECTED BRANCH MENU
                // ==================================

                await loadMenu(
                    session,
                    selectedBranchId
                );

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