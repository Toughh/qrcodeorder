// ==========================================
// QR RESTAURANT SAAS
// OWNER — BRANCHES PAGE
// ==========================================


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
        console.log("BRANCHES PAGE: Page loaded");
        console.log("==================================");


        // ==================================
        // CHECK AUTHENTICATION
        // ==================================

        console.log(
            "BRANCHES PAGE: Checking authentication..."
        );


        const session =
            await requireAuthentication();


        // ==================================
        // AUTHENTICATION FAILED
        // ==================================

        if (!session) {

            console.warn(
                "BRANCHES PAGE: Authentication failed."
            );

            return;
        }


        console.log(
            "BRANCHES PAGE: Authentication successful."
        );


        // ==================================
        // LOAD BRANCHES
        // ==================================

        await loadBranches();


        // ==================================
        // LOGOUT
        // ==================================

        const logoutButton =
            document.getElementById("logoutBtn");


        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                function () {

                    console.log(
                        "BRANCHES PAGE: Logging out."
                    );


                    if (
                        typeof clearSession ===
                        "function"
                    ) {

                        clearSession();

                    } else {

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
        // RETRY
        // ==================================

        const retryButton =
            document.getElementById("retryBtn");


        if (retryButton) {

            retryButton.addEventListener(
                "click",
                function () {

                    loadBranches();

                }
            );

        }

    }
);


// ==========================================
// LOAD BRANCHES
// ==========================================

async function loadBranches() {

    console.log("==================================");

    console.log(
        "BRANCHES PAGE: Loading branches..."
    );

    console.log("==================================");


    showLoading();


    try {

        // ==================================
        // GET SESSION TOKEN
        // ==================================

        const sessionToken =
            getSessionToken();


        if (!sessionToken) {

            console.error(
                "BRANCHES PAGE: No session token found."
            );


            showError(
                "Your session could not be found. Please login again."
            );


            return;
        }


        console.log(
            "BRANCHES PAGE: Session token found."
        );


        // ==================================
        // CALL N8N
        // ==================================

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
            "BRANCHES API HTTP STATUS:",
            response.status
        );


        // ==================================
        // READ RESPONSE
        // ==================================

        const rawResult =
            await response.json();


        console.log(
            "BRANCHES API RAW RESPONSE:",
            rawResult
        );


        // ==================================
        // NORMALIZE
        // ==================================

        const result =
            Array.isArray(rawResult)
                ? rawResult[0]
                : rawResult;


        console.log(
            "BRANCHES API NORMALIZED RESPONSE:",
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
                "BRANCHES API ERROR:",
                result
            );


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
            Array.isArray(data.branches)
                ? data.branches
                : [];


        console.log(
            "BRANCHES RECEIVED:",
            branches
        );


        // ==================================
        // UPDATE USER
        // ==================================

        updateUserInformation();


        // ==================================
        // DISPLAY BRANCHES
        // ==================================

        renderBranches(
            branches
        );

    }


    catch (error) {

        console.error(
            "BRANCHES PAGE: Connection error:",
            error
        );


        showError(
            "Unable to connect to the server. Please try again."
        );

    }

}


// ==========================================
// UPDATE USER INFORMATION
// ==========================================

function updateUserInformation() {

    let ownerName =
        "Owner";


    let role =
        "Owner";


    // ==================================
    // TRY SESSION DATA
    // ==================================

    try {

        const session =
            JSON.parse(
                localStorage.getItem(
                    "userSession"
                )
            );


        if (session) {

            ownerName =
                session.ownerName ||
                session.OwnerName ||
                session.name ||
                session.Name ||
                ownerName;


            role =
                session.role ||
                session.Role ||
                role;

        }

    }

    catch (error) {

        console.warn(
            "BRANCHES PAGE: Unable to read local session details."
        );

    }


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
// RENDER BRANCHES
// ==========================================

function renderBranches(
    branches
) {

    const container =
        document.getElementById(
            "branchesContainer"
        );


    const countElement =
        document.getElementById(
            "branchCount"
        );


    // ==================================
    // COUNT
    // ==================================

    if (countElement) {

        countElement.textContent =
            `${branches.length} ${
                branches.length === 1
                    ? "Branch"
                    : "Branches"
            }`;

    }


    // ==================================
    // EMPTY
    // ==================================

    if (
        !branches ||
        branches.length === 0
    ) {

        showEmpty();

        return;

    }


    // ==================================
    // CLEAR CONTAINER
    // ==================================

    container.innerHTML = "";


    // ==================================
    // CREATE CARDS
    // ==================================

    branches.forEach(
        function (branch) {

            const card =
                createBranchCard(
                    branch
                );


            container.appendChild(
                card
            );

        }
    );


    // ==================================
    // SHOW
    // ==================================

    hideAllStates();

    container.classList.remove(
        "hidden"
    );

}


// ==========================================
// CREATE BRANCH CARD
// ==========================================

function createBranchCard(
    branch
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "branch-card";


    const status =
        branch.status ||
        "Active";


    const statusClass =
        normalizeStatusClass(
            status
        );


    const branchId =
        branch.branchId ||
        "-";


    const branchName =
        branch.branchName ||
        "Unnamed Branch";


    const city =
        branch.city ||
        "-";


    const address =
        branch.address ||
        "-";


    const latitude =
        formatCoordinate(
            branch.latitude
        );


    const longitude =
        formatCoordinate(
            branch.longitude
        );


    const currency =
        branch.currency ||
        "AED";


    const timezone =
        branch.timezone ||
        "-";


    const vat =
        branch.vat !== null &&
        branch.vat !== undefined
            ? `${branch.vat}%`
            : "-";


    card.innerHTML = `

        <div class="branch-header">

            <div class="branch-title">

                <div class="branch-icon">
                    🏢
                </div>

                <div>

                    <div class="branch-name">
                        ${escapeHtml(branchName)}
                    </div>

                    <div class="branch-id">
                        ${escapeHtml(branchId)}
                    </div>

                </div>

            </div>


            <div class="
                branch-status
                ${statusClass}
            ">

                ${escapeHtml(status)}

            </div>

        </div>


        <div class="branch-details">


            <div class="branch-detail">

                <span class="branch-detail-label">
                    City
                </span>

                <span class="branch-detail-value">
                    ${escapeHtml(city)}
                </span>

            </div>


            <div class="branch-detail">

                <span class="branch-detail-label">
                    Currency
                </span>

                <span class="branch-detail-value">
                    ${escapeHtml(currency)}
                </span>

            </div>


            <div class="branch-detail full">

                <span class="branch-detail-label">
                    Address
                </span>

                <span class="branch-detail-value">
                    ${escapeHtml(address)}
                </span>

            </div>


            <div class="branch-detail">

                <span class="branch-detail-label">
                    Latitude
                </span>

                <span class="branch-detail-value">
                    ${escapeHtml(latitude)}
                </span>

            </div>


            <div class="branch-detail">

                <span class="branch-detail-label">
                    Longitude
                </span>

                <span class="branch-detail-value">
                    ${escapeHtml(longitude)}
                </span>

            </div>


            <div class="branch-detail">

                <span class="branch-detail-label">
                    Timezone
                </span>

                <span class="branch-detail-value">
                    ${escapeHtml(timezone)}
                </span>

            </div>


            <div class="branch-detail">

                <span class="branch-detail-label">
                    VAT
                </span>

                <span class="branch-detail-value">
                    ${escapeHtml(vat)}
                </span>

            </div>

        </div>

    `;


    return card;

}


// ==========================================
// STATUS CLASS
// ==========================================

function normalizeStatusClass(
    status
) {

    return String(status)
        .toLowerCase()
        .replace(/\s+/g, "-");

}


// ==========================================
// FORMAT COORDINATE
// ==========================================

function formatCoordinate(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "-";

    }


    const number =
        Number(value);


    if (
        Number.isNaN(number)
    ) {

        return String(value);

    }


    return number.toFixed(6);

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHtml(
    value
) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ==========================================
// SHOW LOADING
// ==========================================

function showLoading() {

    hideAllStates();


    const loading =
        document.getElementById(
            "loadingState"
        );


    if (loading) {

        loading.classList.remove(
            "hidden"
        );

    }

}


// ==========================================
// SHOW EMPTY
// ==========================================

function showEmpty() {

    hideAllStates();


    const empty =
        document.getElementById(
            "emptyState"
        );


    if (empty) {

        empty.classList.remove(
            "hidden"
        );

    }

}


// ==========================================
// SHOW ERROR
// ==========================================

function showError(
    message
) {

    hideAllStates();


    const errorState =
        document.getElementById(
            "errorState"
        );


    const errorMessage =
        document.getElementById(
            "errorMessage"
        );


    if (errorMessage) {

        errorMessage.textContent =
            message;

    }


    if (errorState) {

        errorState.classList.remove(
            "hidden"
        );

    }

}


// ==========================================
// HIDE ALL STATES
// ==========================================

function hideAllStates() {

    const ids = [

        "loadingState",
        "errorState",
        "emptyState",
        "branchesContainer"

    ];


    ids.forEach(
        function (id) {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.classList.add(
                    "hidden"
                );

            }

        }
    );

}