// ==========================================
// QR RESTAURANT SAAS
// RESET PASSWORD
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // ELEMENTS
    // ==========================================

    const form =
        document.getElementById("resetPasswordForm");

    const newPasswordInput =
        document.getElementById("newPassword");

    const confirmPasswordInput =
        document.getElementById("confirmPassword");

    const button =
        document.getElementById("resetPasswordButton");

    const message =
        document.getElementById("message");

    const toggleNewPassword =
        document.getElementById("toggleNewPassword");

    const toggleConfirmPassword =
        document.getElementById("toggleConfirmPassword");


    // ==========================================
    // VALIDATE REQUIRED ELEMENTS
    // ==========================================

    if (
        !form ||
        !newPasswordInput ||
        !confirmPasswordInput ||
        !button ||
        !message
    ) {

        console.error(
            "Reset Password: Required elements not found."
        );

        return;
    }


    // ==========================================
    // CONFIGURATION
    // ==========================================

    const RESET_PASSWORD_WEBHOOK =
        `${N8N_BASE_URL}/reset-password`;


    // ==========================================
    // GET RESET TOKEN FROM URL
    // ==========================================

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    const resetToken =
        urlParams.get("token");


    // ==========================================
    // TOKEN CHECK
    // ==========================================

    if (!resetToken) {

        showMessage(
            "This password reset link is invalid or incomplete.",
            "error"
        );

        button.disabled = true;

        return;
    }


    console.log(
        "Reset Password: Reset token detected."
    );


    // ==========================================
    // MESSAGE HELPER
    // ==========================================

    function showMessage(
        text,
        type = "error"
    ) {

        message.textContent = text;

        message.className = "message";

        message.classList.add(
            "show"
        );


        if (type === "success") {

            message.classList.add(
                "message-success"
            );

        } else if (type === "warning") {

            message.classList.add(
                "message-warning"
            );

        } else {

            message.classList.add(
                "message-error"
            );

        }

    }


    // ==========================================
    // CLEAR MESSAGE
    // ==========================================

    function clearMessage() {

        message.textContent = "";

        message.className = "message";

    }


    // ==========================================
    // PASSWORD TOGGLE
    // ==========================================

    function setupPasswordToggle(
        toggleButton,
        input
    ) {

        if (!toggleButton) {
            return;
        }


        toggleButton.addEventListener(
            "click",
            () => {

                const isPassword =
                    input.type === "password";


                input.type =
                    isPassword
                        ? "text"
                        : "password";


                toggleButton.textContent =
                    isPassword
                        ? "Hide"
                        : "Show";


                toggleButton.setAttribute(
                    "aria-label",
                    isPassword
                        ? "Hide password"
                        : "Show password"
                );

            }
        );

    }


    setupPasswordToggle(
        toggleNewPassword,
        newPasswordInput
    );


    setupPasswordToggle(
        toggleConfirmPassword,
        confirmPasswordInput
    );


    // ==========================================
    // PASSWORD REQUIREMENTS
    // ==========================================

    function updatePasswordRequirements(
        password
    ) {

        const lengthRequirement =
            document.getElementById(
                "requirementLength"
            );

        const uppercaseRequirement =
            document.getElementById(
                "requirementUppercase"
            );

        const lowercaseRequirement =
            document.getElementById(
                "requirementLowercase"
            );

        const numberRequirement =
            document.getElementById(
                "requirementNumber"
            );


        const hasLength =
            password.length >= 8;


        const hasUppercase =
            /[A-Z]/.test(password);


        const hasLowercase =
            /[a-z]/.test(password);


        const hasNumber =
            /[0-9]/.test(password);


        if (lengthRequirement) {

            lengthRequirement.classList.toggle(
                "valid",
                hasLength
            );

        }


        if (uppercaseRequirement) {

            uppercaseRequirement.classList.toggle(
                "valid",
                hasUppercase
            );

        }


        if (lowercaseRequirement) {

            lowercaseRequirement.classList.toggle(
                "valid",
                hasLowercase
            );

        }


        if (numberRequirement) {

            numberRequirement.classList.toggle(
                "valid",
                hasNumber
            );

        }


        return (
            hasLength &&
            hasUppercase &&
            hasLowercase &&
            hasNumber
        );

    }


    // ==========================================
    // PASSWORD INPUT EVENTS
    // ==========================================

    newPasswordInput.addEventListener(
        "input",
        () => {

            updatePasswordRequirements(
                newPasswordInput.value
            );

            clearMessage();

        }
    );


    confirmPasswordInput.addEventListener(
        "input",
        () => {

            clearMessage();

        }
    );


    // ==========================================
    // BUTTON STATE
    // ==========================================

    function setLoading(
        isLoading
    ) {

        button.disabled =
            isLoading;


        if (isLoading) {

            button.innerHTML = `
                <span class="button-icon">⏳</span>
                <span class="button-text">Updating Password...</span>
            `;

        } else {

            button.innerHTML = `
                <span class="button-icon">→</span>
                <span class="button-text">Reset Password</span>
            `;

        }

    }


    // ==========================================
    // FORM SUBMIT
    // ==========================================

    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            clearMessage();


            const newPassword =
                newPasswordInput.value;


            const confirmPassword =
                confirmPasswordInput.value;


            // ==================================
            // PASSWORD REQUIREMENTS
            // ==================================

            const passwordValid =
                updatePasswordRequirements(
                    newPassword
                );


            if (!passwordValid) {

                showMessage(
                    "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number.",
                    "error"
                );

                newPasswordInput.focus();

                return;
            }


            // ==================================
            // CONFIRM PASSWORD
            // ==================================

            if (
                newPassword !==
                confirmPassword
            ) {

                showMessage(
                    "Passwords do not match.",
                    "error"
                );

                confirmPasswordInput.focus();

                return;
            }


            // ==================================
            // START LOADING
            // ==================================

            setLoading(true);


            try {

                console.log(
                    "Reset Password: Sending reset request..."
                );


                // ==================================
                // CALL n8n
                // ==================================

                const response =
                    await fetch(
                        RESET_PASSWORD_WEBHOOK,
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    resetToken:
                                        resetToken,

                                    newPassword:
                                        newPassword

                                })

                        }
                    );


                console.log(
                    "Reset Password HTTP status:",
                    response.status
                );


                // ==================================
                // READ RESPONSE
                // ==================================

                let rawResult = null;


                try {

                    rawResult =
                        await response.json();

                } catch (jsonError) {

                    console.warn(
                        "Reset Password: Response was not valid JSON.",
                        jsonError
                    );

                }


                // ==================================
                // NORMALIZE RESPONSE
                // ==================================

                const result =
                    Array.isArray(rawResult)
                        ? rawResult[0]
                        : rawResult;


                console.log(
                    "Reset Password response:",
                    result
                );


                // ==================================
                // HTTP ERROR
                // ==================================

                if (!response.ok) {

                    throw new Error(
                        result?.message ||
                        "Unable to reset your password."
                    );

                }


                // ==================================
                // SUCCESS
                // ==================================

                if (
                    result &&
                    result.success === true
                ) {

                    showMessage(
                        result.message ||
                        "Your password has been reset successfully.",
                        "success"
                    );


                    // ==================================
                    // DISABLE FORM
                    // ==================================

                    newPasswordInput.disabled =
                        true;

                    confirmPasswordInput.disabled =
                        true;

                    button.disabled =
                        true;


                    // ==================================
                    // REDIRECT TO LOGIN
                    // ==================================

                    setTimeout(
                        () => {

                            window.location.href =
                                "../login/login.html";

                        },
                        2500
                    );


                } else {

                    showMessage(
                        result?.message ||
                        "Unable to reset your password."
                    );

                }

            } catch (error) {

                console.error(
                    "Reset Password Error:",
                    error
                );


                showMessage(
                    error.message ||
                    "Unable to reset your password. Please try again."
                );

            } finally {

                if (
                    !button.disabled ||
                    !newPasswordInput.disabled
                ) {

                    setLoading(false);

                }

            }

        }
    );

});