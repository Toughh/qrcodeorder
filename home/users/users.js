// =========================================================
// QR ORDER SAAS
// PREMIUM OWNER USERS
// =========================================================


// =========================================================
// CONFIGURATION
// =========================================================

const N8N_USERS_WEBHOOK =
    `${N8N_BASE_URL}/owner-users`;

const SESSION_TOKEN_KEY =
    "qro_session_token";

const SESSION_DATA_KEY =
    "qro_session_data";

const USERS_PER_PAGE =
    10;


// =========================================================
// STATE
// =========================================================

let allUsers = [];

let filteredUsers = [];

let currentPage = 1;


// =========================================================
// ELEMENTS
// =========================================================

const userSearch =
    document.getElementById(
        "userSearch"
    );

const roleFilter =
    document.getElementById(
        "roleFilter"
    );

const statusFilter =
    document.getElementById(
        "statusFilter"
    );

const verificationFilter =
    document.getElementById(
        "verificationFilter"
    );

const resetFilters =
    document.getElementById(
        "resetFilters"
    );

const usersTableBody =
    document.getElementById(
        "usersTableBody"
    );

const usersEmpty =
    document.getElementById(
        "usersEmpty"
    );

const usersFrom =
    document.getElementById(
        "usersFrom"
    );

const usersTo =
    document.getElementById(
        "usersTo"
    );

const usersTotal =
    document.getElementById(
        "usersTotal"
    );

const previousPage =
    document.getElementById(
        "previousPage"
    );

const paginationPages =
    document.getElementById(
        "paginationPages"
    );

const nextPage =
    document.getElementById(
        "nextPage"
    );


// KPI

const totalUsersEl =
    document.getElementById(
        "totalUsers"
    );

const activeUsersEl =
    document.getElementById(
        "activeUsers"
    );

const pendingUsersEl =
    document.getElementById(
        "pendingUsers"
    );

const verifiedUsersEl =
    document.getElementById(
        "verifiedUsers"
    );

const privilegedUsersEl =
    document.getElementById(
        "privilegedUsers"
    );


// Intelligence

const roleDistributionEl =
    document.getElementById(
        "roleDistribution"
    );

const verificationRateEl =
    document.getElementById(
        "verificationRate"
    );

const activationRateEl =
    document.getElementById(
        "activationRate"
    );

const verificationBar =
    document.getElementById(
        "verificationBar"
    );

const activationBar =
    document.getElementById(
        "activationBar"
    );


// Modal

const userModal =
    document.getElementById(
        "userModal"
    );

const modalUserName =
    document.getElementById(
        "modalUserName"
    );

const modalUserId =
    document.getElementById(
        "modalUserId"
    );

const modalAvatar =
    document.getElementById(
        "modalAvatar"
    );

const modalEmail =
    document.getElementById(
        "modalEmail"
    );

const modalRole =
    document.getElementById(
        "modalRole"
    );

const modalStatus =
    document.getElementById(
        "modalStatus"
    );

const modalVerification =
    document.getElementById(
        "modalVerification"
    );

const modalMobile =
    document.getElementById(
        "modalMobile"
    );

const modalRoleDetail =
    document.getElementById(
        "modalRoleDetail"
    );

const modalCreated =
    document.getElementById(
        "modalCreated"
    );

const modalUpdated =
    document.getElementById(
        "modalUpdated"
    );

const closeUserModal =
    document.getElementById(
        "closeUserModal"
    );

const modalCloseButton =
    document.getElementById(
        "modalCloseButton"
    );


// =========================================================
// INITIALIZE
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeUsersPage
);


async function initializeUsersPage() {

    try {

        if (
            typeof requireAuthentication ===
            "function"
        ) {

            const authenticated =
                await requireAuthentication();

            if (
                authenticated === false
            ) {

                return;

            }

        }


        updateUsersTopbarOwner();

        await loadUsers();

    } catch (error) {

        console.error(
            "Users initialization failed:",
            error
        );

        showUsersError();

    }

}


// =========================================================
// TOPBAR OWNER
// =========================================================

function updateUsersTopbarOwner(
    ownerNameFromResponse = null
) {

    let sessionData =
        null;


    try {

        const storedSession =
            localStorage.getItem(
                SESSION_DATA_KEY
            );

        if (storedSession) {

            sessionData =
                JSON.parse(
                    storedSession
                );

        }

    } catch (error) {

        console.warn(
            "Unable to read session data:",
            error
        );

    }


    const ownerName =
        ownerNameFromResponse ||
        sessionData?.ownerName ||
        sessionData?.OwnerName ||
        sessionData?.name ||
        sessionData?.Name ||
        "Owner";


    const ownerRole =
        sessionData?.role ||
        sessionData?.Role ||
        "Owner";


    const nameElement =
        document.getElementById(
            "topbarUserName"
        );

    if (nameElement) {

        nameElement.textContent =
            ownerName;

    }


    const roleElement =
        document.getElementById(
            "topbarUserRole"
        );

    if (roleElement) {

        roleElement.textContent =
            ownerRole;

    }


    const avatarElement =
        document.getElementById(
            "topbarUserAvatar"
        );

    if (avatarElement) {

        avatarElement.textContent =
            ownerName
                .charAt(0)
                .toUpperCase();

    }

}


// =========================================================
// LOAD USERS
// =========================================================

async function loadUsers() {

    showUsersLoading();


    const sessionToken =
        localStorage.getItem(
            SESSION_TOKEN_KEY
        );


    if (!sessionToken) {

        redirectToLogin();

        return;

    }


    try {

        const response =
            await fetch(
                N8N_USERS_WEBHOOK,
                {
                    method:
                        "POST",

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
            data.code ===
            "INVALID_SESSION"
        ) {

            redirectToLogin();

            return;

        }


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to load users."
            );

        }


        updateUsersTopbarOwner(
            data.ownerName ||
            data.client?.ownerName ||
            data.client?.OwnerName ||
            null
        );


        allUsers =
            Array.isArray(
                data.users
            )
                ? data.users.map(
                    normalizeUser
                )
                : [];


        populateRoleFilter();

        populateStatusFilter();


        updateUserSummary(
            data.summary
        );


        renderRoleDistribution(
            data.roleDistribution ||
            []
        );


        renderHealthMetrics(
            data.summary
        );


        currentPage = 1;

        applyFilters();


    } catch (error) {

        console.error(
            "Failed to load users:",
            error
        );

        showUsersError();

    }

}


// =========================================================
// NORMALIZE USER
// =========================================================

function normalizeUser(
    user
) {

    return {

        userId:
            String(
                user?.userId ||
                ""
            ).trim(),

        name:
            String(
                user?.name ||
                ""
            ).trim(),

        email:
            String(
                user?.email ||
                ""
            ).trim(),

        mobile:
            String(
                user?.mobile ||
                ""
            ).trim(),

        role:
            String(
                user?.role ||
                ""
            ).trim(),

        status:
            String(
                user?.status ||
                ""
            ).trim(),

        emailVerified:
            user?.emailVerified === true,

        createdAt:
            user?.createdAt ||
            "",

        updatedAt:
            user?.updatedAt ||
            ""

    };

}


// =========================================================
// SUMMARY
// =========================================================

function updateUserSummary(
    summary = {}
) {

    if (totalUsersEl) {

        totalUsersEl.textContent =
            Number(
                summary.totalUsers
            ) || 0;

    }


    if (activeUsersEl) {

        activeUsersEl.textContent =
            Number(
                summary.activeUsers
            ) || 0;

    }


    if (pendingUsersEl) {

        pendingUsersEl.textContent =
            Number(
                summary.pendingUsers
            ) || 0;

    }


    if (verifiedUsersEl) {

        verifiedUsersEl.textContent =
            Number(
                summary.verifiedUsers
            ) || 0;

    }


    if (privilegedUsersEl) {

        privilegedUsersEl.textContent =
            Number(
                summary.privilegedUsers
            ) || 0;

    }

}


// =========================================================
// ROLE DISTRIBUTION
// =========================================================

function renderRoleDistribution(
    roles
) {

    if (!roleDistributionEl) {

        return;

    }


    roleDistributionEl.innerHTML =
        "";


    if (
        !Array.isArray(roles) ||
        !roles.length
    ) {

        roleDistributionEl.innerHTML = `
            <div class="distribution-empty">
                No role information available.
            </div>
        `;

        return;

    }


    const maxCount =
        Math.max(
            ...roles.map(
                role =>
                    Number(
                        role.count
                    ) || 0
            ),
            1
        );


    roles.forEach(
        role => {

            const count =
                Number(
                    role.count
                ) || 0;


            const percentage =
                (
                    count /
                    maxCount
                ) * 100;


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "distribution-row";


            row.innerHTML = `

                <span
                    class="distribution-role"
                    title="${escapeHtml(
                        role.role
                    )}"
                >
                    ${escapeHtml(
                        role.role
                    )}
                </span>

                <div class="distribution-track">

                    <div
                        class="distribution-fill"
                        style="width:${percentage}%"
                    ></div>

                </div>

                <span class="distribution-count">
                    ${count}
                </span>

            `;


            roleDistributionEl.appendChild(
                row
            );

        }
    );

}


// =========================================================
// HEALTH METRICS
// =========================================================

function renderHealthMetrics(
    summary = {}
) {

    const verificationRate =
        clampPercentage(
            summary.verificationRate
        );


    const activationRate =
        clampPercentage(
            summary.activationRate
        );


    if (verificationRateEl) {

        verificationRateEl.textContent =
            `${verificationRate.toFixed(1)}%`;

    }


    if (activationRateEl) {

        activationRateEl.textContent =
            `${activationRate.toFixed(1)}%`;

    }


    if (verificationBar) {

        verificationBar.style.width =
            `${verificationRate}%`;

    }


    if (activationBar) {

        activationBar.style.width =
            `${activationRate}%`;

    }

}


// =========================================================
// FILTER OPTIONS
// =========================================================

function populateRoleFilter() {

    if (!roleFilter) {

        return;

    }


    const current =
        roleFilter.value;


    const roles =
        [
            ...new Set(
                allUsers
                    .map(
                        user =>
                            user.role
                    )
                    .filter(Boolean)
            )
        ]
            .sort(
                (a, b) =>
                    a.localeCompare(b)
            );


    roleFilter.innerHTML = `
        <option value="all">
            All Roles
        </option>
    `;


    roles.forEach(
        role => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                role;

            option.textContent =
                role;

            roleFilter.appendChild(
                option
            );

        }
    );


    if (
        roles.includes(
            current
        )
    ) {

        roleFilter.value =
            current;

    }

}


function populateStatusFilter() {

    if (!statusFilter) {

        return;

    }


    const current =
        statusFilter.value;


    const statuses =
        [
            ...new Set(
                allUsers
                    .map(
                        user =>
                            user.status
                    )
                    .filter(Boolean)
            )
        ]
            .sort(
                (a, b) =>
                    a.localeCompare(b)
            );


    statusFilter.innerHTML = `
        <option value="all">
            All Statuses
        </option>
    `;


    statuses.forEach(
        status => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                status;

            option.textContent =
                status;

            statusFilter.appendChild(
                option
            );

        }
    );


    if (
        statuses.includes(
            current
        )
    ) {

        statusFilter.value =
            current;

    }

}


// =========================================================
// FILTER EVENTS
// =========================================================

userSearch?.addEventListener(
    "input",
    handleFilterChange
);

roleFilter?.addEventListener(
    "change",
    handleFilterChange
);

statusFilter?.addEventListener(
    "change",
    handleFilterChange
);

verificationFilter?.addEventListener(
    "change",
    handleFilterChange
);

resetFilters?.addEventListener(
    "click",
    resetAllFilters
);


function handleFilterChange() {

    currentPage =
        1;

    applyFilters();

}


// =========================================================
// APPLY FILTERS
// =========================================================

function applyFilters() {

    const search =
        String(
            userSearch?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const role =
        String(
            roleFilter?.value ||
            "all"
        ).trim();


    const status =
        String(
            statusFilter?.value ||
            "all"
        ).trim()
            .toLowerCase();


    const verification =
        String(
            verificationFilter?.value ||
            "all"
        ).trim()
            .toLowerCase();


    filteredUsers =
        allUsers.filter(
            user => {


                if (search) {

                    const searchable =
                        [

                            user.userId,

                            user.name,

                            user.email,

                            user.mobile,

                            user.role,

                            user.status

                        ]
                            .join(" ")
                            .toLowerCase();


                    if (
                        !searchable.includes(
                            search
                        )
                    ) {

                        return false;

                    }

                }


                if (
                    role !== "all" &&
                    user.role !== role
                ) {

                    return false;

                }


                if (
                    status !== "all" &&
                    user.status
                        .toLowerCase() !==
                    status
                ) {

                    return false;

                }


                if (
                    verification ===
                    "verified" &&
                    !user.emailVerified
                ) {

                    return false;

                }


                if (
                    verification ===
                    "unverified" &&
                    user.emailVerified
                ) {

                    return false;

                }


                return true;

            }
        );


    renderUsers();

}


// =========================================================
// RESET
// =========================================================

function resetAllFilters() {

    if (userSearch) {

        userSearch.value =
            "";

    }


    if (roleFilter) {

        roleFilter.value =
            "all";

    }


    if (statusFilter) {

        statusFilter.value =
            "all";

    }


    if (verificationFilter) {

        verificationFilter.value =
            "all";

    }


    currentPage =
        1;

    applyFilters();

}


// =========================================================
// RENDER USERS
// =========================================================

function renderUsers() {

    if (!usersTableBody) {

        return;

    }


    usersTableBody.innerHTML =
        "";


    if (
        !filteredUsers.length
    ) {

        usersEmpty.style.display =
            "block";

        updateUsersFooter(
            0,
            0,
            0
        );

        updatePagination(
            1
        );

        return;

    }


    if (usersEmpty) {

        usersEmpty.style.display =
            "none";

    }


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filteredUsers.length /
                USERS_PER_PAGE
            )
        );


    if (
        currentPage >
        totalPages
    ) {

        currentPage =
            totalPages;

    }


    const startIndex =
        (
            currentPage -
            1
        ) *
        USERS_PER_PAGE;


    const endIndex =
        Math.min(
            startIndex +
            USERS_PER_PAGE,
            filteredUsers.length
        );


    const pageUsers =
        filteredUsers.slice(
            startIndex,
            endIndex
        );


    pageUsers.forEach(
        user => {

            const row =
                document.createElement(
                    "tr"
                );


            const initials =
                getInitials(
                    user.name ||
                    user.email ||
                    "User"
                );


            const statusClass =
                normalizeStatusClass(
                    user.status
                );


            const verificationClass =
                user.emailVerified
                    ? "verified"
                    : "unverified";


            row.innerHTML = `

                <td>

                    <div class="user-primary">

                        <div class="user-avatar">
                            ${escapeHtml(
                                initials
                            )}
                        </div>

                        <div>

                            <div class="user-name">
                                ${escapeHtml(
                                    user.name ||
                                    "Unnamed User"
                                )}
                            </div>

                            <div class="user-id">
                                ${escapeHtml(
                                    user.userId ||
                                    "—"
                                )}
                            </div>

                        </div>

                    </div>

                </td>


                <td>

                    <div class="contact-main">
                        ${escapeHtml(
                            user.email ||
                            "—"
                        )}
                    </div>

                    <div class="contact-secondary">
                        ${escapeHtml(
                            user.mobile ||
                            "No mobile"
                        )}
                    </div>

                </td>


                <td>

                    <span class="role-pill">
                        ${escapeHtml(
                            user.role ||
                            "Unassigned"
                        )}
                    </span>

                </td>


                <td>

                    <span
                        class="status-pill status-${statusClass}"
                    >
                        ${escapeHtml(
                            user.status ||
                            "Unknown"
                        )}
                    </span>

                </td>


                <td>

                    <span
                        class="verification ${verificationClass}"
                    >

                        <span class="verification-dot"></span>

                        ${
                            user.emailVerified
                                ? "Verified"
                                : "Unverified"
                        }

                    </span>

                </td>


                <td>

                    <span class="created-date">
                        ${formatDate(
                            user.createdAt
                        )}
                    </span>

                </td>


                <td>

                    <button
                        type="button"
                        class="view-user-btn"
                        data-user-id="${escapeHtml(
                            user.userId
                        )}"
                    >
                        View
                    </button>

                </td>

            `;


            usersTableBody.appendChild(
                row
            );

        }
    );


    usersTableBody
        .querySelectorAll(
            ".view-user-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openUserModal(
                            button.dataset.userId
                        );

                    }
                );

            }
        );


    updateUsersFooter(
        startIndex,
        endIndex,
        filteredUsers.length
    );


    updatePagination(
        totalPages
    );

}


// =========================================================
// STATUS CLASS
// =========================================================

function normalizeStatusClass(
    status
) {

    const value =
        String(
            status ||
            ""
        )
            .trim()
            .toLowerCase()
            .replace(
                /\s+/g,
                "-"
            );


    const allowed = [

        "active",

        "pending",

        "pending-activation",

        "inactive",

        "disabled"

    ];


    if (
        allowed.includes(
            value
        )
    ) {

        return value;

    }


    return "unknown";

}


// =========================================================
// FOOTER
// =========================================================

function updateUsersFooter(
    startIndex,
    endIndex,
    total
) {

    if (usersFrom) {

        usersFrom.textContent =
            total > 0
                ? startIndex + 1
                : 0;

    }


    if (usersTo) {

        usersTo.textContent =
            endIndex;

    }


    if (usersTotal) {

        usersTotal.textContent =
            total;

    }

}


// =========================================================
// PAGINATION
// =========================================================

function updatePagination(
    totalPages
) {

    if (!paginationPages) {

        return;

    }


    paginationPages.innerHTML =
        "";


    const pages =
        buildPaginationPages(
            currentPage,
            Math.max(
                1,
                totalPages
            )
        );


    if (previousPage) {

        previousPage.disabled =
            currentPage <= 1;

    }


    if (nextPage) {

        nextPage.disabled =
            currentPage >=
            totalPages;

    }


    pages.forEach(
        page => {

            if (
                page === "..."
            ) {

                const span =
                    document.createElement(
                        "span"
                    );

                span.className =
                    "pagination-ellipsis";

                span.textContent =
                    "…";

                paginationPages.appendChild(
                    span
                );

                return;

            }


            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.className =
                "pagination-page";


            if (
                page === currentPage
            ) {

                button.classList.add(
                    "active"
                );

            }


            button.textContent =
                page;


            button.addEventListener(
                "click",
                () => {

                    currentPage =
                        page;

                    renderUsers();

                }
            );


            paginationPages.appendChild(
                button
            );

        }
    );

}


function buildPaginationPages(
    current,
    total
) {

    if (
        total <= 7
    ) {

        return Array.from(
            {
                length: total
            },
            (_, index) =>
                index + 1
        );

    }


    const pages = [
        1
    ];


    if (
        current > 4
    ) {

        pages.push("...");

    }


    const start =
        Math.max(
            2,
            current - 1
        );


    const end =
        Math.min(
            total - 1,
            current + 1
        );


    for (
        let page = start;
        page <= end;
        page++
    ) {

        pages.push(
            page
        );

    }


    if (
        current <
        total - 3
    ) {

        pages.push("...");

    }


    pages.push(
        total
    );


    return pages;

}


previousPage?.addEventListener(
    "click",
    () => {

        if (
            currentPage <= 1
        ) {

            return;

        }

        currentPage--;

        renderUsers();

    }
);


nextPage?.addEventListener(
    "click",
    () => {

        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    filteredUsers.length /
                    USERS_PER_PAGE
                )
            );


        if (
            currentPage >=
            totalPages
        ) {

            return;

        }

        currentPage++;

        renderUsers();

    }
);


// =========================================================
// USER MODAL
// =========================================================

function openUserModal(
    userId
) {

    const user =
        allUsers.find(
            item =>
                item.userId ===
                userId
        );


    if (!user || !userModal) {

        return;

    }


    modalUserName.textContent =
        user.name ||
        "Unnamed User";


    modalUserId.textContent =
        user.userId ||
        "—";


    modalAvatar.textContent =
        getInitials(
            user.name ||
            user.email ||
            "User"
        );


    modalEmail.textContent =
        user.email ||
        "—";


    modalRole.textContent =
        user.role ||
        "Unassigned";


    modalStatus.textContent =
        user.status ||
        "Unknown";


    modalVerification.textContent =
        user.emailVerified
            ? "Verified"
            : "Unverified";


    modalMobile.textContent =
        user.mobile ||
        "Not provided";


    modalRoleDetail.textContent =
        user.role ||
        "Unassigned";


    modalCreated.textContent =
        formatDateTime(
            user.createdAt
        );


    modalUpdated.textContent =
        formatDateTime(
            user.updatedAt
        );


    userModal.classList.add(
        "active"
    );


    userModal.setAttribute(
        "aria-hidden",
        "false"
    );

}


function closeUserDetailsModal() {

    if (!userModal) {

        return;

    }


    userModal.classList.remove(
        "active"
    );


    userModal.setAttribute(
        "aria-hidden",
        "true"
    );

}


closeUserModal?.addEventListener(
    "click",
    closeUserDetailsModal
);


modalCloseButton?.addEventListener(
    "click",
    closeUserDetailsModal
);


userModal?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            userModal
        ) {

            closeUserDetailsModal();

        }

    }
);


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            closeUserDetailsModal();

        }

    }
);


// =========================================================
// MOBILE SIDEBAR
// =========================================================

const mobileMenuButton =
    document.getElementById(
        "mobileMenuButton"
    );

const sidebar =
    document.querySelector(
        ".sidebar"
    );


mobileMenuButton?.addEventListener(
    "click",
    () => {

        sidebar?.classList.toggle(
            "open"
        );

    }
);


// =========================================================
// LOADING / ERROR
// =========================================================

function showUsersLoading() {

    if (usersEmpty) {

        usersEmpty.style.display =
            "none";

    }


    if (usersTableBody) {

        usersTableBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="users-loading"
                >

                    <div class="loading-mark">
                        ◌
                    </div>

                    Loading users...

                </td>

            </tr>

        `;

    }

}


function showUsersError() {

    if (usersTableBody) {

        usersTableBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="users-loading"
                >

                    <div class="loading-mark">
                        !
                    </div>

                    Unable to load users.

                </td>

            </tr>

        `;

    }

}


// =========================================================
// HELPERS
// =========================================================

function formatDate(
    value
) {

    if (!value) {

        return "—";

    }


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
            timeZone:
                "Asia/Dubai",

            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric"
        }
    ).format(
        date
    );

}


function formatDateTime(
    value
) {

    if (!value) {

        return "—";

    }


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
            timeZone:
                "Asia/Dubai",

            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"
        }
    ).format(
        date
    );

}


function getInitials(
    value
) {

    const text =
        String(
            value ||
            "User"
        ).trim();


    const parts =
        text
            .split(/\s+/)
            .filter(Boolean);


    if (
        parts.length >= 2
    ) {

        return (
            parts[0].charAt(0) +
            parts[1].charAt(0)
        ).toUpperCase();

    }


    return text
        .substring(
            0,
            2
        )
        .toUpperCase();

}


function clampPercentage(
    value
) {

    const number =
        Number(value) || 0;

    return Math.max(
        0,
        Math.min(
            100,
            number
        )
    );

}


function escapeHtml(
    value
) {

    return String(
        value ??
        ""
    )
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