// ==========================================
// QR ORDER SAAS
// PREMIUM OWNER SETTINGS
// ==========================================


// ==========================================
// CONFIGURATION
// ==========================================

const SETTINGS_GET_WEBHOOK =
    `${N8N_BASE_URL}/owner-settings`;

const SETTINGS_UPDATE_WEBHOOK =
    `${N8N_BASE_URL}/owner-settings-update`;

const SETTINGS_DEACTIVATE_WEBHOOK =
    `${N8N_BASE_URL}/owner-restaurant-deactivate`;

const SESSION_TOKEN_KEY =
    "qro_session_token";


// ==========================================
// STATE
// ==========================================

let settingsData = null;


// ==========================================
// DOM HELPERS
// ==========================================

function $(id) {
    return document.getElementById(id);
}


// ==========================================
// SESSION TOKEN
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

        initializeNavigation();

        initializeEvents();

        loadSettings();

    }
);


// ==========================================
// NAVIGATION
// ==========================================

function initializeNavigation() {

    const buttons =
        document.querySelectorAll(
            ".settings-nav-item"
        );

    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const section =
                    button.dataset.section;

                activateSection(section);

            }
        );

    });
}


function activateSection(section) {

    document
        .querySelectorAll(
            ".settings-nav-item"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.section === section
            );

        });


    document
        .querySelectorAll(
            ".settings-panel"
        )
        .forEach(panel => {

            panel.classList.toggle(
                "active",
                panel.id ===
                `section-${section}`
            );

        });

}


// ==========================================
// EVENTS
// ==========================================

function initializeEvents() {

    $("saveSettings")
        ?.addEventListener(
            "click",
            saveSettings
        );

    $("changePasswordBtn")
        ?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "../../login/reset-credentials/forgot-password.html";

            }
        );


    $("logoutBtn")
        ?.addEventListener(
            "click",
            handleLogout
        );


    // Keep service Kitchen switch
    // synchronized with Order Settings.

    $("kitchenEnabled")
        ?.addEventListener(
            "change",
            event => {

                const value =
                    event.target.checked;

                if ($("serviceKitchenEnabled")) {

                    $("serviceKitchenEnabled")
                        .checked = value;

                }

            }
        );


    $("serviceKitchenEnabled")
        ?.addEventListener(
            "change",
            event => {

                const value =
                    event.target.checked;

                if ($("kitchenEnabled")) {

                    $("kitchenEnabled")
                        .checked = value;

                }

            }
        );

    $("deactivateRestaurantBtn")
        ?.addEventListener(
            "click",
            openDeactivateModal
        );

    $("cancelDeactivate")
        ?.addEventListener(
            "click",
            closeDeactivateModal
        );

    $("confirmDeactivate")
        ?.addEventListener(
            "click",
            deactivateRestaurant
        );

    $("deactivateModal")
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target.id ===
                    "deactivateModal"
                ) {
                    closeDeactivateModal();
                }

            }
        );

}


// ==========================================
// LOAD SETTINGS
// ==========================================

async function loadSettings() {

    const sessionToken =
        getSessionToken();


    if (!sessionToken) {

        redirectToLogin();

        return;
    }


    showLoadingState();


    try {

        const response =
            await fetch(
                SETTINGS_GET_WEBHOOK,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        sessionToken
                    })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            if (
                data.code ===
                "INVALID_SESSION"
            ) {

                redirectToLogin();

                return;
            }

            throw new Error(
                data.message ||
                "Unable to load settings."
            );

        }


        settingsData = data;

        console.log("SETTINGS API RESPONSE:", data);

        populateSettings(data);

        hideLoadingState();

    }
    catch (error) {

        console.error(
            "Settings load error:",
            error
        );

        showSaveMessage(
            error.message ||
            "Unable to load settings.",
            "error"
        );

    }

}


// ==========================================
// POPULATE SETTINGS
// ==========================================

function populateSettings(data) {

    const profile =
        data.profile || {};

    const settings =
        data.settings || {};

    const restaurant =
        data.restaurant || {};


    // --------------------------------------
    // TOP USER
    // --------------------------------------

    const ownerName =
        profile.ownerName ||
        "Owner";

    setText(
        "userName",
        ownerName
    );

    setText(
        "userRole",
        data.role || "Owner"
    );

    setText(
        "userAvatar",
        getInitial(ownerName)
    );

    // --------------------------------------
    // STATUS
    // --------------------------------------

    // --------------------------------------
    // STATUS
    // --------------------------------------

    const status =
        String(
            restaurant.status ||
            profile.status ||
            "Active"
        ).trim();

    const normalizedStatus =
        status.toLowerCase();

    const deactivateButton =
        $("deactivateRestaurantBtn");

    if (deactivateButton) {

        if (normalizedStatus === "active") {

            deactivateButton.disabled = false;

            deactivateButton.textContent =
                "Deactivate Restaurant";

        }
        else if (normalizedStatus === "inactive") {

            deactivateButton.disabled = true;

            deactivateButton.textContent =
                "Restaurant Deactivated";

        }
        else {

            // Unknown/loading status
            deactivateButton.disabled = true;

            deactivateButton.textContent =
                "Deactivate Restaurant";

        }
    }

    setText(
        "restaurantStatus",
        status
    );

    setText(
        "generalStatus",
        status
    );

    const statusDot =
        $("restaurantStatusDot");

    if (statusDot) {

        statusDot.classList.toggle(
            "inactive",
            normalizedStatus !== "active"
        );

    }


    // --------------------------------------
    // BRANCHES
    // --------------------------------------

    const branchCount =
        Number(
            profile.totalBranches || 0
        );

    const branchLimit =
        getBranchLimit(
            plan
        );

    setText(
        "branchUsage",
        `${branchCount} / ${branchLimit}`
    );

    setText(
        "subscriptionBranches",
        `${branchCount} / ${branchLimit}`
    );


    const branchPercentage =
        branchLimit > 0
            ? Math.min(
                100,
                (branchCount / branchLimit) * 100
            )
            : 0;

    const branchBar =
        $("branchUsageBar");

    if (branchBar) {

        branchBar.style.width =
            `${branchPercentage}%`;

    }


    // --------------------------------------
    // GENERAL PROFILE
    // --------------------------------------

    setValue(
        "restaurantId",
        profile.restaurantId ||
        data.restaurantId ||
        ""
    );

    setValue(
        "ownerName",
        profile.ownerName
    );

    setValue(
        "ownerEmail",
        profile.email
    );

    setValue(
        "ownerMobile",
        profile.mobile
    );

    setValue(
        "businessType",
        profile.businessType
    );

    setValue(
        "city",
        profile.city
    );

    setValue(
        "website",
        profile.website
    );


    // --------------------------------------
    // ACCOUNT
    // --------------------------------------

    setText(
        "accountOwnerName",
        profile.ownerName ||
        "Owner"
    );

    setText(
        "accountEmail",
        profile.email ||
        "—"
    );

    setText(
        "accountRole",
        data.role ||
        "Owner"
    );


    // --------------------------------------
    // ORDER SETTINGS
    // --------------------------------------

    setChecked(
        "acceptOrders",
        settings.acceptOrders
    );

    setChecked(
        "kitchenEnabled",
        settings.kitchenEnabled
    );

    setChecked(
        "serviceKitchenEnabled",
        settings.kitchenEnabled
    );


    // --------------------------------------
    // SERVICES
    // --------------------------------------

    setChecked(
        "pickupEnabled",
        settings.pickupEnabled
    );

    setChecked(
        "deliveryEnabled",
        settings.deliveryEnabled
    );

    setChecked(
        "whatsappEnabled",
        settings.whatsappEnabled
    );


    // --------------------------------------
    // REGIONAL
    // --------------------------------------

    setValue(
        "currency",
        settings.currency ||
        "AED"
    );

    setValue(
        "language",
        settings.language ||
        "English"
    );

    setValue(
        "timezone",
        settings.timezone ||
        "Asia/Dubai"
    );

    setValue(
        "vat",
        settings.vat ?? 0
    );


    // --------------------------------------
    // SAVE MESSAGE
    // --------------------------------------

    showSaveMessage(
        "Settings loaded successfully.",
        "success"
    );

}


// ==========================================
// SAVE SETTINGS
// ==========================================

async function saveSettings() {

    const sessionToken =
        getSessionToken();


    if (!sessionToken) {

        redirectToLogin();

        return;
    }


    const button =
        $("saveSettings");


    if (button) {

        button.disabled = true;

        button.innerHTML =
            `<span>⟳</span> Saving...`;

    }


    const settings = {

        // Order
        acceptOrders:
            $("acceptOrders")?.checked === true,

        kitchenEnabled:
            $("kitchenEnabled")?.checked === true,


        // Services
        pickupEnabled:
            $("pickupEnabled")?.checked === true,

        deliveryEnabled:
            $("deliveryEnabled")?.checked === true,

        whatsappEnabled:
            $("whatsappEnabled")?.checked === true,


        // Regional
        currency:
            $("currency")?.value ||
            "AED",

        language:
            $("language")?.value ||
            "English",

        timezone:
            $("timezone")?.value ||
            "Asia/Dubai",

        vat:
            Number(
                $("vat")?.value || 0
            )
    };


    try {

        const response =
            await fetch(
                SETTINGS_UPDATE_WEBHOOK,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        sessionToken,

                        settings

                    })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            if (
                data.code ===
                "INVALID_SESSION"
            ) {

                redirectToLogin();

                return;
            }

            throw new Error(
                data.message ||
                "Unable to save settings."
            );

        }


        showSaveMessage(
            "✓ Settings saved successfully.",
            "success"
        );


        // Reload authoritative values
        // from backend.

        await loadSettings();

    }
    catch (error) {

        console.error(
            "Settings save error:",
            error
        );

        showSaveMessage(
            error.message ||
            "Unable to save settings.",
            "error"
        );

    }
    finally {

        if (button) {

            button.disabled = false;

            button.innerHTML =
                `<span>✓</span> Save Changes`;

        }

    }

}


// ==========================================
// BRANCH LIMIT
// ==========================================

function getBranchLimit(plan) {

    const limits = {

        Starter: 1,

        Growth: 5,

        Professional: 15,

        Enterprise: 999

    };

    return (
        limits[plan] ||
        1
    );
}


// ==========================================
// UI HELPERS
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


function setValue(
    id,
    value
) {

    const element =
        $(id);

    if (element) {

        element.value =
            value ?? "";

    }

}


function setChecked(
    id,
    value
) {

    const element =
        $(id);

    if (element) {

        element.checked =
            value === true;

    }

}


function getInitial(name) {

    const value =
        String(name || "A")
            .trim();

    return (
        value.charAt(0)
            .toUpperCase() ||
        "A"
    );

}


// ==========================================
// LOADING
// ==========================================

function showLoadingState() {

    document.body
        .classList.add(
            "settings-loading"
        );

}

function hideLoadingState() {

    document.body
        .classList.remove(
            "settings-loading"
        );

}


// ==========================================
// SAVE MESSAGE
// ==========================================

function showSaveMessage(
    message,
    type = "success"
) {

    const element =
        $("saveMessage");

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.style.color =
        type === "error"
            ? "#dc2626"
            : "#7a8496";

}


// ==========================================
// LOGIN REDIRECT
// ==========================================

function redirectToLogin() {

    window.location.href =
        "../login/login.html";

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

// ==========================================
// DEACTIVATION MODAL
// ==========================================

function openDeactivateModal() {

    const modal =
        $("deactivateModal");

    if (!modal) {
        return;
    }

    const input =
        $("deactivateConfirmation");

    const error =
        $("deactivateError");

    if (input) {
        input.value = "";
    }

    if (error) {
        error.textContent = "";
    }

    modal.classList.add("active");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    setTimeout(() => {

        input?.focus();

    }, 100);
}


function closeDeactivateModal() {

    const modal =
        $("deactivateModal");

    if (!modal) {
        return;
    }

    modal.classList.remove("active");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );
}


// ==========================================
// DEACTIVATE RESTAURANT
// ==========================================

async function deactivateRestaurant() {

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {

        redirectToLogin();

        return;
    }


    const input =
        $("deactivateConfirmation");

    const error =
        $("deactivateError");

    const button =
        $("confirmDeactivate");

    const confirmation =
        String(
            input?.value || ""
        )
            .trim()
            .toUpperCase();


    if (
        confirmation !==
        "DEACTIVATE"
    ) {

        if (error) {

            error.textContent =
                "Please type DEACTIVATE exactly to continue.";

        }

        input?.focus();

        return;
    }


    if (button) {

        button.disabled = true;

        button.textContent =
            "Deactivating...";

    }


    if (error) {

        error.textContent = "";

    }


    try {

        const response =
            await fetch(
                SETTINGS_DEACTIVATE_WEBHOOK,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        sessionToken,

                        confirmation:
                            "DEACTIVATE"

                    })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            if (
                data.code ===
                "INVALID_SESSION"
            ) {

                redirectToLogin();

                return;
            }

            throw new Error(
                data.message ||
                "Unable to deactivate restaurant."
            );
        }


        closeDeactivateModal();


        showSaveMessage(
            "Restaurant has been deactivated successfully.",
            "success"
        );


        // Refresh authoritative backend state.

        await loadSettings();


    }
    catch (errorObject) {

        console.error(
            "Restaurant deactivation error:",
            errorObject
        );

        if (error) {

            error.textContent =
                errorObject.message ||
                "Unable to deactivate restaurant.";

        }

    }
    finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                "Deactivate Restaurant";

        }

    }

}