```javascript
// ==========================================
// QR RESTAURANT SAAS
// PREMIUM OWNER LOGIN
// ==========================================


// ==========================================
// n8n LOGIN WEBHOOK
// ==========================================

// TEST URL FOR NOW
const N8N_LOGIN_WEBHOOK =
    "https://maatapita.app.n8n.cloud/webhook-test/owner-login";

// After the n8n workflow is activated,
// change to:
//
// https://maatapita.app.n8n.cloud/webhook/owner-login


// ==========================================
// ELEMENTS
// ==========================================

const loginForm =
    document.getElementById("loginForm");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const rememberMe =
    document.getElementById("rememberMe");

const loginButton =
    document.getElementById("loginButton");

const togglePassword =
    document.getElementById("togglePassword");

const messageBox =
    document.getElementById("message");


// ==========================================
// SHOW / HIDE PASSWORD
// ==========================================

togglePassword.addEventListener(
    "click",
    function () {

        const isPassword =
            passwordInput.type === "password";


        passwordInput.type =
            isPassword
                ? "text"
                : "password";


        togglePassword.textContent =
            isPassword
                ? "Hide"
                : "Show";


        togglePassword.setAttribute(
            "aria-label",
            isPassword
                ? "Hide password"
                : "Show password"
        );

    }
);


// ==========================================
// MESSAGE HELPER
// ==========================================

function showMessage(
    type,
    message
) {

    messageBox.className =
        "message show";


    let className =
        "message-box";


    if (type === "error") {

        className +=
            " message-error";

    }

    else if (type === "success") {

        className +=
            " message-success";

    }

    else if (type === "warning") {

        className +=
            " message-warning";

    }


    messageBox.innerHTML = `

        <div class="${className}">

            ${message}

        </div>

    `;

}


// ==========================================
// CLEAR MESSAGE
// ==========================================

function clearMessage() {

    messageBox.className =
        "message";

    messageBox.innerHTML =
        "";

}


// ==========================================
// FORM SUBMIT
// ==========================================

loginForm.addEventListener(
    "submit",
    async function (event) {

        // Prevent browser from changing URL
        event.preventDefault();

        event.stopPropagation();


        clearMessage();


        // ==================================
        // GET VALUES
        // ==================================

        const email =
            emailInput.value
                .trim()
                .toLowerCase();


        const password =
            passwordInput.value;


        const remember =
            rememberMe.checked;


        // ==================================
        // FRONTEND VALIDATION
        // ==================================

        if (!email) {

            showMessage(
                "error",
                "Please enter your email address."
            );

            emailInput.focus();

            return;

        }


        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (!emailRegex.test(email)) {

            showMessage(
                "error",
                "Please enter a valid email address."
            );

            emailInput.focus();

            return;

        }


        if (!password) {

            showMessage(
                "error",
                "Please enter your password."
            );

            passwordInput.focus();

            return;

        }


        // ==================================
        // DISABLE BUTTON
        // ==================================

        loginButton.disabled =
            true;


        loginButton.innerHTML = `

            <span>
                ⏳
            </span>

            <span>
                Signing in...
            </span>

        `;


        try {

            console.log(
                "Login request:",
                {
                    email,
                    remember
                }
            );


            // ==================================
            // CALL n8n
            // ==================================

            const response =
                await fetch(
                    N8N_LOGIN_WEBHOOK,
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                email:
                                    email,

                                password:
                                    password

                            })

                    }
                );


            console.log(
                "Login HTTP status:",
                response.status
            );


            // ==================================
            // READ RESPONSE
            // ==================================

            const rawResult =
                await response.json();


            console.log(
                "Raw n8n response:",
                rawResult
            );


            // n8n can return an array
            // depending on Respond to Webhook
            const result =
                Array.isArray(rawResult)
                    ? rawResult[0]
                    : rawResult;


            console.log(
                "Normalized login response:",
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

                showMessage(
                    "success",
                    `
                    🎉 <strong>
                    Login successful!
                    </strong>

                    <br><br>

                    Welcome back.
                    Redirecting to your dashboard...
                    `
                );


                // ==================================
                // STORE SESSION
                // ==================================

                if (result.data) {

                    const sessionData = {

                        userId:
                            result.data.userId,

                        clientId:
                            result.data.clientId,

                        restaurantId:
                            result.data.restaurantId,

                        role:
                            result.data.role,

                        email:
                            result.data.email,

                        name:
                            result.data.name || "",

                        sessionToken:
                            result.data.sessionToken || "",

                        loggedInAt:
                            new Date().toISOString()

                    };


                    const storage =
                        remember
                            ? localStorage
                            : sessionStorage;


                    storage.setItem(
                        "qrRestaurantSession",
                        JSON.stringify(
                            sessionData
                        )
                    );

                }


                // ==================================
                // REDIRECT
                // ==================================

                setTimeout(
                    function () {

                        window.location.href =
                            "dashboard.html";

                    },
                    1200
                );


                return;

            }


            // ==================================
            // INVALID CREDENTIALS
            // ==================================

            if (
                result?.code ===
                "INVALID_CREDENTIALS"
            ) {

                showMessage(
                    "error",
                    `
                    ❌ <strong>
                    Invalid email or password.
                    </strong>

                    <br><br>

                    Please check your credentials
                    and try again.
                    `
                );

                return;

            }


            // ==================================
            // ACCOUNT NOT ACTIVE
            // ==================================

            if (
                result?.code ===
                "ACCOUNT_NOT_ACTIVE"
            ) {

                showMessage(
                    "warning",
                    `
                    ⚠️ <strong>
                    Account not activated.
                    </strong>

                    <br><br>

                    Please activate your account
                    using the activation email.
                    `
                );

                return;

            }


            // ==================================
            // EMAIL NOT VERIFIED
            // ==================================

            if (
                result?.code ===
                "EMAIL_NOT_VERIFIED"
            ) {

                showMessage(
                    "warning",
                    `
                    ⚠️ <strong>
                    Email verification required.
                    </strong>

                    <br><br>

                    Please check your email
                    and activate your account.
                    `
                );

                return;

            }


            // ==================================
            // ACCOUNT SUSPENDED
            // ==================================

            if (
                result?.code ===
                "ACCOUNT_SUSPENDED"
            ) {

                showMessage(
                    "error",
                    `
                    🚫 <strong>
                    Account unavailable.
                    </strong>

                    <br><br>

                    Please contact support
                    for assistance.
                    `
                );

                return;

            }


            // ==================================
            // GENERIC ERROR
            // ==================================

            showMessage(
                "error",
                `
                ❌ <strong>
                Login failed.
                </strong>

                <br><br>

                ${
                    result?.message ||
                    "Unable to sign in. Please try again."
                }
                `
            );

        }


        catch (error) {

            console.error(
                "Login error:",
                error
            );


            showMessage(
                "error",
                `
                ❌ <strong>
                Unable to connect.
                </strong>

                <br><br>

                Please check your internet connection
                and try again.
                `
            );

        }


        finally {

            loginButton.disabled =
                false;


            loginButton.innerHTML = `

                <span class="button-text">
                    Sign In
                </span>

                <span class="button-icon">
                    →
                </span>

            `;

        }

    }
);


// ==========================================
// ENTER KEY SUPPORT
// ==========================================

emailInput.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter"
        ) {

            passwordInput.focus();

        }

    }
);


// ==========================================
// LOAD REMEMBERED EMAIL
// ==========================================

try {

    const savedSession =
        localStorage.getItem(
            "qrRestaurantSession"
        );


    if (savedSession) {

        const session =
            JSON.parse(
                savedSession
            );


        if (session.email) {

            emailInput.value =
                session.email;

            rememberMe.checked =
                true;

        }

    }

}

catch (error) {

    console.warn(
        "Unable to load saved session:",
        error
    );

}
```
