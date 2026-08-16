/* =========================================================
   MENU CONFIGURATION
========================================================= */

const N8N_MENU_WEBHOOK_URL =
    "https://maatapita.app.n8n.cloud/webhook/owner-menu";


/* =========================================================
   STATE
========================================================= */

let menuItems = [];
let selectedBranchId = "";
let branches = [];


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializePage();

});


/* =========================================================
   INITIALIZE
========================================================= */

function initializePage() {

    requireAuthentication();

    loadUserInformation();

    loadBranches();

    setupEventListeners();

}


/* =========================================================
   AUTHENTICATION
========================================================= */

function requireAuthentication() {

    const sessionToken = localStorage.getItem("sessionToken");

    if (!sessionToken) {

        window.location.href = "login.html";

        return false;
    }

    return true;
}


/* =========================================================
   USER INFORMATION
========================================================= */

function loadUserInformation() {

    const userName =
        localStorage.getItem("userName") ||
        localStorage.getItem("name") ||
        "Owner";

    const userRole =
        localStorage.getItem("role") ||
        "Owner";

    const userNameElement =
        document.getElementById("userName");

    const userRoleElement =
        document.getElementById("userRole");

    const userAvatar =
        document.getElementById("userAvatar");

    if (userNameElement) {

        userNameElement.textContent = userName;

    }

    if (userRoleElement) {

        userRoleElement.textContent = userRole;

    }

    if (userAvatar) {

        userAvatar.textContent =
            userName.charAt(0).toUpperCase();

    }
}


/* =========================================================
   LOAD BRANCHES
========================================================= */

function loadBranches() {

    /*
     * We expect branches to have been stored after login /
     * restaurant loading.
     *
     * Example:
     *
     * localStorage.setItem(
     *     "branches",
     *     JSON.stringify(branches)
     * );
     */

    const storedBranches =
        localStorage.getItem("branches");

    if (storedBranches) {

        try {

            branches = JSON.parse(storedBranches);

        } catch (error) {

            console.error(
                "Unable to parse branches:",
                error
            );

            branches = [];

        }

    }

    populateBranchSelector();

}


/* =========================================================
   POPULATE BRANCH SELECT
========================================================= */

function populateBranchSelector() {

    const branchSelect =
        document.getElementById("branchSelect");

    if (!branchSelect) {
        return;
    }

    branchSelect.innerHTML =
        `<option value="">Select Branch</option>`;

    branches.forEach(branch => {

        const branchId =
            branch.id ||
            branch.BranchId ||
            branch.branchId;

        const branchName =
            branch.Name ||
            branch.BranchName ||
            branch.name ||
            branch.branchName ||
            "Branch";

        if (!branchId) {
            return;
        }

        const option =
            document.createElement("option");

        option.value = branchId;

        option.textContent = branchName;

        branchSelect.appendChild(option);

    });

    /*
     * If only one branch exists,
     * automatically select it.
     */

    if (branches.length === 1) {

        const branch =
            branches[0];

        selectedBranchId =
            branch.id ||
            branch.BranchId ||
            branch.branchId;

        branchSelect.value =
            selectedBranchId;

        updateBranchName();

        loadMenu();

    }

}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEventListeners() {

    const branchSelect =
        document.getElementById("branchSelect");

    const searchInput =
        document.getElementById("menuSearch");

    const categoryFilter =
        document.getElementById("categoryFilter");

    const logoutBtn =
        document.getElementById("logoutBtn");

    const mobileMenuBtn =
        document.getElementById("mobileMenuBtn");


    if (branchSelect) {

        branchSelect.addEventListener(
            "change",
            event => {

                selectedBranchId =
                    event.target.value;

                updateBranchName();

                if (selectedBranchId) {

                    loadMenu();

                } else {

                    clearMenu();

                }

            }
        );

    }


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            renderFilteredMenu
        );

    }


    if (categoryFilter) {

        categoryFilter.addEventListener(
            "change",
            renderFilteredMenu
        );

    }


    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            logout
        );

    }


    if (mobileMenuBtn) {

        mobileMenuBtn.addEventListener(
            "click",
            toggleMobileMenu
        );

    }

}


/* =========================================================
   LOAD MENU FROM N8N
========================================================= */

async function loadMenu() {

    const sessionToken =
        localStorage.getItem("sessionToken");

    const restaurantId =
        getRestaurantId();

    const branchId =
        selectedBranchId;

    if (!sessionToken) {

        showError(
            "Your session has expired. Please login again."
        );

        return;

    }


    if (!restaurantId) {

        showError(
            "Restaurant information is missing."
        );

        return;

    }


    if (!branchId) {

        showError(
            "Please select a branch."
        );

        return;

    }


    showLoading();


    try {

        const requestBody = {

            sessionToken,

            restaurantId,

            branchId

        };


        console.log(
            "Menu request:",
            requestBody
        );


        const response =
            await fetch(
                N8N_MENU_WEBHOOK_URL,
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


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const result =
            await response.json();


        console.log(
            "Menu API response:",
            result
        );


        /*
         * INVALID SESSION
         */

        if (
            result.success === false &&
            result.code === "INVALID_SESSION"
        ) {

            handleInvalidSession();

            return;

        }


        /*
         * SUCCESS
         */

        if (
            result.success === true &&
            result.code === "MENU_DATA_READY"
        ) {

            menuItems =
                Array.isArray(
                    result.menuItems
                )
                    ? result.menuItems
                    : [];

            populateCategoryFilter();

            updateSummary();

            renderFilteredMenu();

            hideLoading();

            return;

        }


        /*
         * UNKNOWN RESPONSE
         */

        throw new Error(
            result.message ||
            "Unexpected response from server."
        );


    } catch (error) {

        console.error(
            "Menu loading error:",
            error
        );

        showError(
            "Unable to load menu. Please try again."
        );

    }

}


/* =========================================================
   GET RESTAURANT ID
========================================================= */

function getRestaurantId() {

    /*
     * Try the most common storage locations
     */

    return (
        localStorage.getItem("restaurantId") ||
        localStorage.getItem("RestaurantId") ||
        sessionStorage.getItem("restaurantId") ||
        ""
    );

}


/* =========================================================
   UPDATE BRANCH NAME
========================================================= */

function updateBranchName() {

    const branchNameElement =
        document.getElementById("branchName");

    if (!branchNameElement) {
        return;
    }


    const selectedBranch =
        branches.find(branch => {

            const id =
                branch.id ||
                branch.BranchId ||
                branch.branchId;

            return id === selectedBranchId;

        });


    if (!selectedBranch) {

        branchNameElement.textContent =
            "Select a branch to view menu";

        return;

    }


    const branchName =
        selectedBranch.Name ||
        selectedBranch.BranchName ||
        selectedBranch.name ||
        selectedBranch.branchName ||
        "Selected Branch";


    branchNameElement.textContent =
        branchName;

}


/* =========================================================
   POPULATE CATEGORIES
========================================================= */

function populateCategoryFilter() {

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
                    .map(item =>
                        item.category
                    )
                    .filter(Boolean)
            )
        ]
        .sort();


    categoryFilter.innerHTML =
        `<option value="">All Categories</option>`;


    categories.forEach(category => {

        const option =
            document.createElement("option");

        option.value = category;

        option.textContent = category;

        categoryFilter.appendChild(option);

    });

}


/* =========================================================
   FILTER MENU
========================================================= */

function renderFilteredMenu() {

    const searchInput =
        document.getElementById(
            "menuSearch"
        );

    const categoryFilter =
        document.getElementById(
            "categoryFilter"
        );


    const searchTerm =
        (
            searchInput?.value ||
            ""
        )
        .trim()
        .toLowerCase();


    const category =
        categoryFilter?.value ||
        "";


    const filteredItems =
        menuItems.filter(item => {

            const name =
                (
                    item.itemName ||
                    ""
                )
                .toLowerCase();

            const description =
                (
                    item.description ||
                    ""
                )
                .toLowerCase();

            const itemCategory =
                item.category ||
                "";


            const matchesSearch =
                !searchTerm ||
                name.includes(searchTerm) ||
                description.includes(searchTerm);


            const matchesCategory =
                !category ||
                itemCategory === category;


            return (
                matchesSearch &&
                matchesCategory
            );

        });


    renderMenu(filteredItems);

}


/* =========================================================
   RENDER MENU
========================================================= */

function renderMenu(items) {

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


    menuGrid.innerHTML = "";


    if (menuItemCount) {

        menuItemCount.textContent =
            `${items.length} ${
                items.length === 1
                    ? "item"
                    : "items"
            }`;

    }


    if (!items.length) {

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


    items.forEach(item => {

        menuGrid.appendChild(
            createMenuCard(item)
        );

    });

}


/* =========================================================
   CREATE MENU CARD
========================================================= */

function createMenuCard(item) {

    const card =
        document.createElement("div");

    card.className =
        "menu-card";


    const imageWrapper =
        document.createElement("div");

    imageWrapper.className =
        "menu-image-wrapper";


    if (item.imageURL) {

        const image =
            document.createElement("img");

        image.className =
            "menu-image";

        image.src =
            item.imageURL;

        image.alt =
            item.itemName ||
            "Menu item";


        image.onerror = () => {

            image.remove();

            const placeholder =
                document.createElement("div");

            placeholder.className =
                "menu-image-placeholder";

            placeholder.textContent =
                "🍽️";

            imageWrapper.appendChild(
                placeholder
            );

        };


        imageWrapper.appendChild(image);

    } else {

        const placeholder =
            document.createElement("div");

        placeholder.className =
            "menu-image-placeholder";

        placeholder.textContent =
            "🍽️";

        imageWrapper.appendChild(
            placeholder
        );

    }


    const content =
        document.createElement("div");

    content.className =
        "menu-card-content";


    const category =
        document.createElement("div");

    category.className =
        "menu-category";

    category.textContent =
        item.category ||
        "Menu";


    const name =
        document.createElement("div");

    name.className =
        "menu-name";

    name.textContent =
        item.itemName ||
        "Unnamed Item";


    const description =
        document.createElement("div");

    description.className =
        "menu-description";

    description.textContent =
        item.description ||
        "No description available.";


    const footer =
        document.createElement("div");

    footer.className =
        "menu-card-footer";


    const price =
        document.createElement("div");

    price.className =
        "menu-price";

    price.textContent =
        formatPrice(item.price);


    const badge =
        document.createElement("span");

    const available =
        isItemAvailable(
            item.available
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


    footer.appendChild(price);

    footer.appendChild(badge);


    content.appendChild(category);

    content.appendChild(name);

    content.appendChild(description);

    content.appendChild(footer);


    card.appendChild(imageWrapper);

    card.appendChild(content);


    return card;

}


/* =========================================================
   AVAILABILITY
========================================================= */

function isItemAvailable(value) {

    if (value === false) {
        return false;
    }

    if (
        value === "false" ||
        value === "False" ||
        value === "0"
    ) {
        return false;
    }

    return true;

}


/* =========================================================
   PRICE
========================================================= */

function formatPrice(price) {

    const numericPrice =
        Number(price || 0);


    return new Intl.NumberFormat(
        "en-AE",
        {
            style: "currency",
            currency: "AED",
            minimumFractionDigits: 2
        }
    ).format(numericPrice);

}


/* =========================================================
   SUMMARY
========================================================= */

function updateSummary() {

    const total =
        menuItems.length;


    const available =
        menuItems.filter(
            item =>
                isItemAvailable(
                    item.available
                )
        ).length;


    const unavailable =
        total - available;


    const totalElement =
        document.getElementById(
            "totalItems"
        );

    const availableElement =
        document.getElementById(
            "availableItems"
        );

    const unavailableElement =
        document.getElementById(
            "unavailableItems"
        );


    if (totalElement) {

        totalElement.textContent =
            total;

    }


    if (availableElement) {

        availableElement.textContent =
            available;

    }


    if (unavailableElement) {

        unavailableElement.textContent =
            unavailable;

    }

}


/* =========================================================
   LOADING
========================================================= */

function showLoading() {

    document
        .getElementById("loadingState")
        ?.classList.remove("hidden");


    document
        .getElementById("emptyState")
        ?.classList.add("hidden");


    document
        .getElementById("menuGrid")
        .innerHTML = "";

}


/* =========================================================
   HIDE LOADING
========================================================= */

function hideLoading() {

    document
        .getElementById("loadingState")
        ?.classList.add("hidden");

}


/* =========================================================
   CLEAR MENU
========================================================= */

function clearMenu() {

    menuItems = [];

    updateSummary();

    renderMenu([]);

    hideLoading();

}


/* =========================================================
   ERROR
========================================================= */

function showError(message) {

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
        "message-box error";


    messageBox.classList.remove(
        "hidden"
    );

}


/* =========================================================
   INVALID SESSION
========================================================= */

function handleInvalidSession() {

    localStorage.removeItem(
        "sessionToken"
    );

    localStorage.removeItem(
        "sessionExpiresAt"
    );

    alert(
        "Your session has expired. Please login again."
    );

    window.location.href =
        "login.html";

}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    localStorage.removeItem(
        "sessionToken"
    );

    localStorage.removeItem(
        "sessionExpiresAt"
    );

    window.location.href =
        "login.html";

}


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

function toggleMobileMenu() {

    const sidebar =
        document.querySelector(
            ".sidebar"
        );

    if (!sidebar) {
        return;
    }

    sidebar.classList.toggle(
        "open"
    );

}