// ==========================================
// QR RESTAURANT SAAS
// OWNER ACCOUNT ACTIVATION
// ==========================================

const ACTIVATION_WEBHOOK =
    "https://maatapita.app.n8n.cloud/webhook-test/owner-activate";


// ==========================================
// ELEMENTS
// ==========================================

const activationForm =
    document.getElementById("activationForm");

const passwordInput =
    document.getElementById("password");

const confirmPasswordInput =
    document.getElementById("confirmPassword");

const activateButton =
    document.getElementById("activateButton");

const messageBox =
    document.getElementById("message");


// ==========================================
// GET TOKEN
// ==========================================

const urlParams =
    new URLSearchParams(
        window.location.search
    );

const activationToken =
    urlParams.get("token");


console.log(
    "Activation token:",
    activationToken
);


// ==========================================
// CHECK TOKEN
// ==========================================

if (!activationToken) {

    messageBox.innerHTML = `

        <div class="error-message">

            ❌ <strong>Invalid activation link.</strong>

            <br><br>

            Activation token is missing.

        </div>

    `;

    activateButton.disabled = true;

}


// ==========================================
// PASSWORD VALIDATION
// ==========================================

function validatePassword(password) {

    const lengthValid =
        password.length >= 8;

    const uppercaseValid =
        /[A-Z]/.test(password);

    const numberValid =
        /[0-9]/.test(password);


    document
        .getElementById("lengthCheck")
        .classList
        .toggle(
            "valid",
            lengthValid
        );


    document
        .getElementById("uppercaseCheck")
        .classList
        .toggle(
            "valid",
            uppercaseValid
        );


    document
        .getElementById("numberCheck")
        .classList
        .toggle(
            "valid",
            numberValid
        );


    return (
        lengthValid &&
        uppercaseValid &&
        numberValid
    );
}


// ==========================================
// PASSWORD LIVE CHECK
// ==========================================

passwordInput.addEventListener(
    "input",
    function () {

        validatePassword(
            passwordInput.value
        );

    }
);


// ==========================================
// FORM SUBMIT
// ==========================================

activationForm.addEventListener(
    "submit",
    async function (event) {

        // VERY IMPORTANT
        event.preventDefault();
        event.stopPropagation();


        console.log(
            "Activation form submitted"
        );


        // ==================================
        // TOKEN
        // ==================================

        if (!activationToken) {

            messageBox.innerHTML = `

                <div class="error-message">

                    ❌ Invalid activation link.

                </div>

            `;

            return;

        }


        // ==================================
        // PASSWORD
        // ==================================

        const password =
            passwordInput.value;

        const confirmPassword =
            confirmPasswordInput.value;


        // ==================================
        // PASSWORD VALIDATION
        // ==================================

        if (!validatePassword(password)) {

            messageBox.innerHTML = `

                <div class="error-message">

                    ❌ Password does not meet
                    the required criteria.

                </div>

            `;

            return;

        }


        // ==================================
        // CONFIRM PASSWORD
        // ==================================

        if (
            password !==
            confirmPassword
        ) {

            messageBox.innerHTML = `

                <div class="error-message">

                    ❌ Passwords do not match.

                </div>

            `;

            return;

        }


        // ==================================
        // TERMS
        // ==================================

        const terms =
            document.getElementById("terms");

        if (!terms.checked) {

            messageBox.innerHTML = `

                <div class="error-message">

                    ❌ Please accept the
                    Terms & Conditions.

                </div>

            `;

            return;

        }


        // ==================================
        // DISABLE BUTTON
        // ==================================

        activateButton.disabled = true;

        activateButton.innerHTML =
            "⏳ Activating Account...";


        try {

            console.log(
                "Sending activation request..."
            );


            console.log(
                "Token being sent:",
                activationToken
            );


            // ==================================
            // CALL n8n
            // ==================================

            const response =
                await fetch(
                    ACTIVATION_WEBHOOK,
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body: JSON.stringify({

                            token:
                                activationToken,

                            password:
                                password

                        })

                    }
                );


            console.log(
                "HTTP Status:",
                response.status
            );


            // ==================================
            // READ RESPONSE
            // ==================================

            const result =
                await response.json();


            console.log(
                "n8n Response:",
                result
            );


            // ==================================
            // SUCCESS
            // ==================================

            if (
                result.success === true
            ) {

                messageBox.innerHTML = `

                    <div class="success-message">

                        🎉 <strong>
                        Account activated successfully!
                        </strong>

                        <br><br>

                        ${
                            result.message ||
                            "Your account is now active."
                        }

                        <br><br>

                        You can now login.

                        <br><br>

                        <a href="login.html">

                            🔐 Go to Login

                        </a>

                    </div>

                `;


                activationForm.style.display =
                    "none";

                return;

            }


            // ==================================
            // TOKEN EXPIRED
            // ==================================

            if (
                result.code ===
                "ACTIVATION_TOKEN_EXPIRED"
            ) {

                messageBox.innerHTML = `

                    <div class="warning-message">

                        ⚠️ <strong>
                        Activation link expired.
                        </strong>

                        <br><br>

                        ${
                            result.message ||
                            "Please request a new activation email."
                        }

                    </div>

                `;

                return;

            }


            // ==================================
            // INVALID TOKEN
            // ==================================

            if (
                result.code ===
                "INVALID_ACTIVATION_TOKEN"
            ) {

                messageBox.innerHTML = `

                    <div class="error-message">

                        ❌ <strong>
                        Invalid activation link.
                        </strong>

                        <br><br>

                        ${
                            result.message ||
                            "This activation link is no longer valid."
                        }

                    </div>

                `;

                return;

            }


            // ==================================
            // GENERIC ERROR
            // ==================================

            messageBox.innerHTML = `

                <div class="error-message">

                    ❌ <strong>
                    Activation failed.
                    </strong>

                    <br><br>

                    ${
                        result.message ||
                        "Unable to activate your account."
                    }

                </div>

            `;

        }

        catch (error) {

            console.error(
                "Activation Error:",
                error
            );


            messageBox.innerHTML = `

                <div class="error-message">

                    ❌ ${error.message}

                </div>

            `;

        }

        finally {

            if (
                activationForm.style.display
                !== "none"
            ) {

                activateButton.disabled =
                    false;

                activateButton.innerHTML =
                    "🔐 Activate My Account";

            }

        }

    }
);