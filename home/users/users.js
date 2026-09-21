/* =========================================================
   QR RESTAURANT SAAS
   USERS / ROLE MANAGEMENT
   ========================================================= */


/* =========================================================
   CONFIGURATION
   ========================================================= */

const USERS_LIST_WEBHOOK =
    `${N8N_BASE_URL}/owner-users`;

const USERS_INVITE_WEBHOOK =
    `${N8N_BASE_URL}/owner-manager-invite`;

const SESSION_TOKEN_KEY =
    "qro_session_token";

const SESSION_DATA_KEY =
    "qro_session_data";


/* =========================================================
   STATE
   ========================================================= */

let users = [];



/* =========================================================
   ELEMENTS
   ========================================================= */

const $ = id =>
    document.getElementById(id);


const usersLoading =
    $("usersLoading");

const usersError =
    $("usersError");

const usersEmpty =
    $("usersEmpty");

const usersTableWrapper =
    $("usersTableWrapper");

const usersTableBody =
    $("usersTableBody");


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeUsersPage
);


async function initializeUsersPage() {

    try {

        if (typeof requireAuthentication === "function") {

            const authenticated =
                requireAuthentication();

            if (authenticated === false) {
                return;
            }

        }

        setupTopbar();

        setupEvents();

        await loadUsers();

    } catch (error) {

        console.error(
            "Users initialization error:",
            error
        );

        showError(
            "Unable to load the Users page."
        );

    }

}



/* =========================================================
   TOPBAR
   ========================================================= */

function setupTopbar() {

    const sessionData =
        getSessionData();

    const name =
        sessionData?.ownerName ||
        sessionData?.OwnerName ||
        sessionData?.name ||
        sessionData?.Name ||
        "Owner";

    const role =
        sessionData?.role ||
        sessionData?.Role ||
        "Owner";

    setText(
        "userName",
        name
    );

    setText(
        "userRole",
        formatRole(role)
    );

    setText(
        "userAvatar",
        getInitials(name)
    );

}



/* =========================================================
   EVENTS
   ========================================================= */

function setupEvents() {

    $("addManagerButton")
        ?.addEventListener(
            "click",
            openManagerModal
        );


    $("cancelManagerButton")
        ?.addEventListener(
            "click",
            closeManagerModal
        );


    $("createManagerButton")
        ?.addEventListener(
            "click",
            createManagerInvitation
        );


    $("copyInvitationButton")
        ?.addEventListener(
            "click",
            copyInvitationLink
        );


    $("managerModal")
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target?.id ===
                    "managerModal"
                ) {
                    closeManagerModal();
                }

            }
        );


    $("mobileMenuButton")
        ?.addEventListener(
            "click",
            () => {

                document
                    .querySelector(".sidebar")
                    ?.classList.toggle("open");

            }
        );


    $("logoutBtn")
        ?.addEventListener(
            "click",
            handleLogout
        );

}



/* =========================================================
   LOAD USERS
   ========================================================= */

async function loadUsers() {

    showLoading();

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {

        redirectToLogin();

        return;
    }


    try {

        const response =
            await fetch(
                USERS_LIST_WEBHOOK,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            sessionToken
                        })
                }
            );


        const data =
            await response.json();


        if (
            response.status === 401 ||
            data?.code === "INVALID_SESSION"
        ) {

            redirectToLogin();

            return;
        }


        if (
            !response.ok ||
            !data?.success
        ) {

            throw new Error(
                data?.message ||
                "Unable to load users."
            );

        }


        users =
            Array.isArray(data.users)
                ? data.users
                : [];


        renderSummary();

        renderUsers();

    } catch (error) {

        console.error(
            "Load users error:",
            error
        );

        showError(
            error.message ||
            "Unable to load users."
        );

    }

}



/* =========================================================
   SUMMARY
   ========================================================= */

function renderSummary() {

    const total =
        users.length;

    const owners =
        users.filter(
            user =>
                normalizeRole(user.role) ===
                "owner"
        ).length;


    const managers =
        users.filter(
            user =>
                normalizeRole(user.role) ===
                "restaurant manager"
        ).length;


    const pending =
        users.filter(
            user =>
                String(
                    user.status || ""
                )
                    .trim()
                    .toLowerCase() ===
                "pending activation"
        ).length;


    setText(
        "totalUsers",
        total
    );

    setText(
        "ownerCount",
        owners
    );

    setText(
        "managerCount",
        managers
    );

    setText(
        "pendingCount",
        pending
    );

}



/* =========================================================
   RENDER USERS
   ========================================================= */

function renderUsers() {

    if (!users.length) {

        usersTableWrapper
            ?.classList.add("hidden");

        usersEmpty
            ?.classList.remove("hidden");

        usersLoading
            ?.classList.add("hidden");

        return;
    }


    usersLoading
        ?.classList.add("hidden");

    usersEmpty
        ?.classList.add("hidden");

    usersTableWrapper
        ?.classList.remove("hidden");


    usersTableBody.innerHTML =
        users
            .map(
                user =>
                    renderUserRow(user)
            )
            .join("");

}



/* =========================================================
   USER ROW
   ========================================================= */

function renderUserRow(user) {

    const name =
        String(
            user.name ||
            user.Name ||
            "Unnamed User"
        ).trim();


    const email =
        String(
            user.email ||
            user.Email ||
            ""
        ).trim();


    const role =
        normalizeRole(
            user.role ||
            user.Role ||
            ""
        );


    const status =
        String(
            user.status ||
            user.Status ||
            "Unknown"
        )
            .trim()
            .toLowerCase();


    const createdAt =
        user.createdAt ||
        user.CreatedAt ||
        "";


    const isOwner =
        role === "owner";


    const roleClass =
        isOwner
            ? "role-owner"
            : "role-manager";


    const accessClass =
        isOwner
            ? "access-full"
            : "access-operations";


    const accessText =
        isOwner
            ? "Full Access"
            : "Operations";


    const statusClass =
        status === "active"
            ? "status-active"
            : "status-pending";


    return `

        <tr>

            <td>

                <div class="user-cell">

                    <div class="user-table-avatar">

                        ${escapeHtml(
                            getInitials(name)
                        )}

                    </div>

                    <div>

                        <div class="table-user-name">

                            ${escapeHtml(name)}

                        </div>

                        <div class="table-user-email">

                            ${escapeHtml(email)}

                        </div>

                    </div>

                </div>

            </td>


            <td>

                <span
                    class="role-badge ${roleClass}"
                >
                    ${escapeHtml(
                        formatRole(
                            role
                        )
                    )}
                </span>

            </td>


            <td>

                <span
                    class="status-badge ${statusClass}"
                >
                    ${escapeHtml(
                        formatStatus(
                            status
                        )
                    )}
                </span>

            </td>


            <td>

                <span
                    class="access-badge ${accessClass}"
                >
                    ${accessText}
                </span>

            </td>


            <td>

                ${escapeHtml(
                    formatDate(
                        createdAt
                    )
                )}

            </td>


            <td>

                ${
                    isOwner
                        ? `<span class="table-action">
                               Primary
                           </span>`
                        : `<button
                               type="button"
                               class="table-action"
                               onclick="showManagerInfo('${escapeHtml(name)}')"
                           >
                               View
                           </button>`
                }

            </td>

        </tr>

    `;

}



/* =========================================================
   MANAGER MODAL
   ========================================================= */

function openManagerModal() {

    const modal =
        $("managerModal");

    if (!modal) return;


    $("managerName").value = "";

    $("managerEmail").value = "";

    $("managerMobile").value = "";

    $("managerFormError").textContent = "";

    $("invitationResult")
        ?.classList.add("hidden");

    $("invitationLink").value = "";


    const button =
        $("createManagerButton");

    if (button) {

        button.disabled = false;

        button.textContent =
            "Create Invitation";
    }


    modal.classList.add("active");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    setTimeout(
        () =>
            $("managerName")?.focus(),
        100
    );

}



function closeManagerModal() {

    const modal =
        $("managerModal");

    if (!modal) return;


    modal.classList.remove("active");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

}



/* =========================================================
   CREATE INVITATION
   ========================================================= */

async function createManagerInvitation() {

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {

        redirectToLogin();

        return;
    }


    const name =
        String(
            $("managerName")?.value ||
            ""
        ).trim();


    const email =
        String(
            $("managerEmail")?.value ||
            ""
        ).trim()
        .toLowerCase();


    const mobile =
        String(
            $("managerMobile")?.value ||
            ""
        ).trim();


    const errorElement =
        $("managerFormError");


    if (!name) {

        errorElement.textContent =
            "Please enter the manager's full name.";

        $("managerName")?.focus();

        return;
    }


    if (
        !email ||
        !isValidEmail(email)
    ) {

        errorElement.textContent =
            "Please enter a valid email address.";

        $("managerEmail")?.focus();

        return;
    }


    const button =
        $("createManagerButton");


    button.disabled = true;

    button.textContent =
        "Creating Invitation...";

    errorElement.textContent = "";


    try {

        const response =
            await fetch(
                USERS_INVITE_WEBHOOK,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            sessionToken,

                            name,

                            email,

                            mobile,

                            role:
                                "Restaurant Manager"

                        })
                }
            );


        const data =
            await response.json();


        if (
            response.status === 401 ||
            data?.code === "INVALID_SESSION"
        ) {

            redirectToLogin();

            return;
        }


        if (
            !response.ok ||
            !data?.success
        ) {

            throw new Error(
                data?.message ||
                "Unable to create manager invitation."
            );

        }


        const invitationLink =
            data.invitationLink ||
            data.activationLink ||
            "";


        $("invitationLink").value =
            invitationLink;


        $("invitationResult")
            ?.classList.remove("hidden");


        button.textContent =
            "Invitation Created";


        await loadUsers();


    } catch (error) {

        console.error(
            "Manager invitation error:",
            error
        );

        errorElement.textContent =
            error.message ||
            "Unable to create invitation.";


        button.disabled = false;

        button.textContent =
            "Create Invitation";
    }

}



/* =========================================================
   COPY INVITATION
   ========================================================= */

async function copyInvitationLink() {

    const input =
        $("invitationLink");

    const button =
        $("copyInvitationButton");


    const value =
        String(
            input?.value ||
            ""
        ).trim();


    if (!value) return;


    try {

        await navigator.clipboard.writeText(
            value
        );

        button.textContent =
            "Copied";

        setTimeout(
            () => {

                button.textContent =
                    "Copy";

            },
            1600
        );

    } catch (error) {

        input.select();

        document.execCommand(
            "copy"
        );

        button.textContent =
            "Copied";

    }

}



/* =========================================================
   MANAGER INFO
   ========================================================= */

function showManagerInfo(name) {

    alert(
        `${name} is a Restaurant Manager.`
    );

}



/* =========================================================
   HELPERS
   ========================================================= */

function getSessionToken() {

    return String(
        localStorage.getItem(
            SESSION_TOKEN_KEY
        ) ||
        ""
    ).trim();

}


function getSessionData() {

    try {

        return JSON.parse(
            localStorage.getItem(
                SESSION_DATA_KEY
            ) ||
            "{}"
        );

    } catch {

        return {};

    }

}


function redirectToLogin() {

    window.location.href =
        "../login/login.html";

}


function handleLogout() {

    localStorage.removeItem(
        SESSION_TOKEN_KEY
    );

    localStorage.removeItem(
        SESSION_DATA_KEY
    );

    localStorage.removeItem(
        "qro_validated_session"
    );

    redirectToLogin();

}


function normalizeRole(role) {

    return String(
        role || ""
    )
        .trim()
        .toLowerCase();

}


function formatRole(role) {

    const normalized =
        normalizeRole(role);


    if (
        normalized ===
        "restaurant manager"
    ) {

        return "Restaurant Manager";

    }


    if (
        normalized === "manager"
    ) {

        return "Restaurant Manager";

    }


    if (
        normalized === "owner"
    ) {

        return "Owner";

    }


    return role || "User";

}


function formatStatus(status) {

    const value =
        String(status || "")
            .trim()
            .toLowerCase();


    if (
        value ===
        "pending activation"
    ) {

        return "Pending Activation";

    }


    if (
        value === "active"
    ) {

        return "Active";

    }


    return status || "Unknown";

}


function formatDate(value) {

    if (!value) return "—";


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    return new Intl.DateTimeFormat(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    ).format(date);

}


function getInitials(name) {

    const parts =
        String(name || "User")
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (!parts.length) return "U";


    return parts
        .slice(0, 2)
        .map(
            part =>
                part.charAt(0)
        )
        .join("")
        .toUpperCase();

}


function setText(id, value) {

    const element =
        $(id);

    if (element) {

        element.textContent =
            value;

    }

}


function escapeHtml(value) {

    return String(value ?? "")
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


function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}


function showLoading() {

    usersLoading
        ?.classList.remove("hidden");

    usersError
        ?.classList.add("hidden");

    usersEmpty
        ?.classList.add("hidden");

    usersTableWrapper
        ?.classList.add("hidden");

}


function showError(message) {

    usersLoading
        ?.classList.add("hidden");

    usersEmpty
        ?.classList.add("hidden");

    usersTableWrapper
        ?.classList.add("hidden");

    usersError
        ?.classList.remove("hidden");

    usersError.textContent =
        message;

}