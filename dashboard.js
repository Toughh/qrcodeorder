// ==========================================
// QR RESTAURANT SAAS
// DASHBOARD - DIAGNOSTIC VERSION
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log("==================================");
        console.log("DASHBOARD LOADED");
        console.log("==================================");


        // ==================================
        // CHECK LOCAL STORAGE
        // ==================================

        const token =
            localStorage.getItem(
                "qro_session_token"
            );

        const sessionData =
            localStorage.getItem(
                "qro_session_data"
            );


        console.log(
            "DASHBOARD: qro_session_token =",
            token
        );


        console.log(
            "DASHBOARD: qro_session_data =",
            sessionData
        );


        // ==================================
        // STOP IF TOKEN DOES NOT EXIST
        // ==================================

        if (!token) {

            console.error(
                "DASHBOARD ERROR: No session token found."
            );

            document.body.innerHTML = `
                <div style="
                    font-family: Arial;
                    padding: 40px;
                    text-align: center;
                ">

                    <h1>Session Not Found</h1>

                    <p>
                        No login session was found
                        in this browser.
                    </p>

                    <button
                        onclick="location.href='login.html'"
                    >
                        Back to Login
                    </button>

                </div>
            `;

            return;

        }


        // ==================================
        // SESSION EXISTS
        // ==================================

        console.log(
            "DASHBOARD: Session token exists."
        );


        console.log(
            "DASHBOARD: Calling validateSession()..."
        );


        // ==================================
        // VALIDATE SESSION
        // ==================================

        let result;


        try {

            result =
                await validateSession();

        }

        catch (error) {

            console.error(
                "DASHBOARD: validateSession() THREW ERROR:",
                error
            );

            document.body.innerHTML = `
                <div style="
                    font-family: Arial;
                    padding: 40px;
                    text-align: center;
                ">

                    <h1>Session Validation Error</h1>

                    <p>
                        Check the browser console.
                    </p>

                    <pre style="
                        text-align:left;
                        background:#f3f4f6;
                        padding:20px;
                        border-radius:10px;
                        overflow:auto;
                    ">${error.message}</pre>

                </div>
            `;

            return;

        }


        // ==================================
        // SHOW VALIDATION RESULT
        // ==================================

        console.log(
            "=================================="
        );

        console.log(
            "VALIDATE SESSION RESULT:"
        );

        console.log(
            result
        );

        console.log(
            "=================================="
        );


        // ==================================
        // INVALID SESSION
        // ==================================

        if (
            !result ||
            result.valid !== true
        ) {

            console.error(
                "DASHBOARD: SESSION INVALID",
                result
            );


            document.body.innerHTML = `
                <div style="
                    font-family: Arial;
                    padding: 40px;
                    text-align: center;
                ">

                    <h1>Session Validation Failed</h1>

                    <p>
                        The login session exists,
                        but validation failed.
                    </p>

                    <p>
                        Error Code:
                        <strong>
                            ${result?.code || "UNKNOWN"}
                        </strong>
                    </p>

                    <button
                        onclick="location.href='login.html'"
                    >
                        Back to Login
                    </button>

                </div>
            `;

            return;

        }


        // ==================================
        // VALID SESSION
        // ==================================

        console.log(
            "DASHBOARD: SESSION VALID!"
        );


        const session =
            result.data;


        console.log(
            "DASHBOARD SESSION:",
            session
        );


        // ==================================
        // USER NAME
        // ==================================

        const userName =
            document.getElementById(
                "userName"
            );


        if (userName) {

            userName.textContent =
                session?.name ||
                "Owner";

        }


        // ==================================
        // USER EMAIL
        // ==================================

        const userEmail =
            document.getElementById(
                "userEmail"
            );


        if (userEmail) {

            userEmail.textContent =
                session?.email ||
                "";

        }


        // ==================================
        // RESTAURANT ID
        // ==================================

        const restaurantId =
            document.getElementById(
                "restaurantId"
            );


        if (restaurantId) {

            restaurantId.textContent =
                session?.restaurantId ||
                "-";

        }


        // ==================================
        // CLIENT ID
        // ==================================

        const clientId =
            document.getElementById(
                "clientId"
            );


        if (clientId) {

            clientId.textContent =
                session?.clientId ||
                "-";

        }


        // ==================================
        // ROLE
        // ==================================

        const userRole =
            document.getElementById(
                "userRole"
            );


        if (userRole) {

            userRole.textContent =
                session?.role ||
                "Owner";

        }


        // ==================================
        // LOGOUT
        // ==================================

        const logoutButton =
            document.getElementById(
                "logoutButton"
            );


        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                function () {

                    clearSession();

                    window.location.href =
                        "login.html";

                }
            );

        }


        console.log(
            "DASHBOARD: Finished loading."
        );

    }
);
