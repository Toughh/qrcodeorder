/* =========================================================
   QR RESTAURANT SAAS
   SIMPLE ROLE GUARD
   ========================================================= */

(function () {

    const SESSION_DATA_KEY =
        "qro_session_data";


    const ROLE_OWNER =
        "owner";


    const ROLE_MANAGER =
        "restaurant manager";


    const sessionData =
        readSessionData();


    const role =
        normalizeRole(
            sessionData?.role ||
            sessionData?.Role ||
            ""
        );


    const currentPage =
        getCurrentPage();


    const accessMap = {

        dashboard:
            [
                ROLE_OWNER,
                ROLE_MANAGER
            ],

        restaurant:
            [
                ROLE_OWNER
            ],

        branches:
            [
                ROLE_OWNER
            ],

        menu:
            [
                ROLE_OWNER,
                ROLE_MANAGER
            ],

        users:
            [
                ROLE_OWNER
            ],

        orders:
            [
                ROLE_OWNER,
                ROLE_MANAGER
            ],

        reports:
            [
                ROLE_OWNER,
                ROLE_MANAGER
            ],

        settings:
            [
                ROLE_OWNER
            ]

    };


    const allowedRoles =
        accessMap[currentPage];


    if (
        allowedRoles &&
        !allowedRoles.includes(role)
    ) {

        window.location.href =
            "../dashboard/dashboard.html";

        return;

    }


    applyNavigationVisibility(
        role
    );


    function readSessionData() {

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


    function normalizeRole(value) {

        return String(
            value || ""
        )
            .trim()
            .toLowerCase();

    }


    function getCurrentPage() {

        const path =
            window.location.pathname
                .toLowerCase();


        if (
            path.includes("/dashboard/")
        ) return "dashboard";


        if (
            path.includes("/restaurant/")
        ) return "restaurant";


        if (
            path.includes("/branches/")
        ) return "branches";


        if (
            path.includes("/menu/")
        ) return "menu";


        if (
            path.includes("/users/")
        ) return "users";


        if (
            path.includes("/orders/")
        ) return "orders";


        if (
            path.includes("/reports/")
        ) return "reports";


        if (
            path.includes("/settings/")
        ) return "settings";


        return "";

    }


    function applyNavigationVisibility(
        currentRole
    ) {

        if (
            currentRole !==
            ROLE_MANAGER
        ) {

            return;

        }


        const restrictedPaths = [

            "/restaurant/",

            "/branches/",

            "/users/",

            "/settings/"

        ];


        document
            .querySelectorAll(
                ".nav-item"
            )
            .forEach(
                link => {

                    const href =
                        String(
                            link.getAttribute(
                                "href"
                            ) ||
                            ""
                        ).toLowerCase();


                    const restricted =
                        restrictedPaths.some(
                            path =>
                                href.includes(
                                    path
                                )
                        );


                    if (restricted) {

                        link.style.display =
                            "none";

                    }

                }
            );


        document
            .querySelectorAll(
                ".topbar-eyebrow"
            )
            .forEach(
                element => {

                    if (
                        element.textContent
                            .includes(
                                "OWNER PORTAL"
                            )
                    ) {

                        element.textContent =
                            "MANAGER PORTAL";

                    }

                }
            );

    }

})();