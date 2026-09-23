const MANAGER_ACTIVATE_WEBHOOK =
`${N8N_BASE_URL}/manager-activate`;

const token =
String(
new URLSearchParams(location.search).get("token") || ""
).trim();

const $ =
id => document.getElementById(id);

// ==========================================
// ELEMENTS
// ==========================================

const loading =
$("loadingState");

const formState =
$("formState");

const success =
$("successState");

const errorState =
$("errorState");

const form =
$("activationForm");

const passwordInput =
$("password");

const confirmPasswordInput =
$("confirmPassword");

const formError =
$("formError");

const button =
$("activateButton");

// ==========================================
// INITIALIZE
// ==========================================

document.addEventListener(
"DOMContentLoaded",
init
);

// ==========================================
// VERIFY INVITATION
// ==========================================

async function init() {


if (!token) {

    return showError(
        "This activation link is missing its security token."
    );

}

try {

    const response =
        await fetch(
            MANAGER_ACTIVATE_WEBHOOK,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    action: "verify",
                    token: token
                })
            }
        );


    const rawResult =
        await response.json();


    console.log(
        "Manager activation verify response:",
        rawResult
    );


    // ==================================
    // NORMALIZE n8n RESPONSE
    // ==================================

    const result =
        Array.isArray(rawResult)
            ? rawResult[0]
            : rawResult;


    if (
        !response.ok ||
        !result ||
        result.success !== true
    ) {

        throw new Error(
            result?.message ||
            "This invitation is invalid or expired."
        );

    }


    // ==================================
    // DISPLAY MANAGER DETAILS
    // ==================================

    $("managerName").textContent =
        result.name ||
        result.managerName ||
        "Manager";

    $("managerEmail").textContent =
        result.email ||
        "—";


    // ==================================
    // SHOW ACTIVATION FORM
    // ==================================

    loading.hidden = true;
    formState.hidden = false;


} catch (error) {

    console.error(
        "Manager activation verification error:",
        error
    );

    showError(
        error.message
    );

}


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


// ==================================
// UPDATE LIVE CHECKS
// ==================================

const lengthCheck =
    $("lengthCheck");

const uppercaseCheck =
    $("uppercaseCheck");

const numberCheck =
    $("numberCheck");


if (lengthCheck) {

    lengthCheck.classList.toggle(
        "valid",
        lengthValid
    );

}


if (uppercaseCheck) {

    uppercaseCheck.classList.toggle(
        "valid",
        uppercaseValid
    );

}


if (numberCheck) {

    numberCheck.classList.toggle(
        "valid",
        numberValid
    );

}


return (
    lengthValid &&
    uppercaseValid &&
    numberValid
);


}

// ==========================================
// PASSWORD LIVE CHECK
// ==========================================

passwordInput?.addEventListener(
"input",
function () {


    validatePassword(
        passwordInput.value
    );

    hideError();

}


);

// ==========================================
// CONFIRM PASSWORD LIVE CHECK
// ==========================================

confirmPasswordInput?.addEventListener(
"input",
function () {


    hideError();

}


);

// ==========================================
// FORM SUBMIT
// ==========================================

form?.addEventListener(
"submit",
async function (event) {


    // VERY IMPORTANT
    event.preventDefault();
    event.stopPropagation();


    console.log(
        "Manager activation form submitted"
    );


    hideError();


    // ==================================
    // TOKEN
    // ==================================

    if (!token) {

        return showFormError(
            "Invalid activation link."
        );

    }


    // ==================================
    // PASSWORD
    // ==================================

    const password =
        String(
            passwordInput?.value || ""
        );

    const confirmPassword =
        String(
            confirmPasswordInput?.value || ""
        );


    // ==================================
    // PASSWORD VALIDATION
    // ==================================

    if (
        !validatePassword(password)
    ) {

        return showFormError(
            "Password must be at least 8 characters and contain at least one uppercase letter and one number."
        );

    }


    // ==================================
    // CONFIRM PASSWORD
    // ==================================

    if (
        password !==
        confirmPassword
    ) {

        return showFormError(
            "Passwords do not match."
        );

    }


    // ==================================
    // DISABLE BUTTON
    // ==================================

    button.disabled = true;


    const buttonText =
        button.querySelector("span");


    if (buttonText) {

        buttonText.textContent =
            "Activating...";

    } else {

        button.textContent =
            "Activating...";

    }


    try {

        console.log(
            "Sending manager activation request..."
        );


        // ==================================
        // CALL n8n
        // ==================================

        const response =
            await fetch(
                MANAGER_ACTIVATE_WEBHOOK,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        action:
                            "activate",

                        token:
                            token,

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
        // READ n8n RESPONSE
        // ==================================

        const rawResult =
            await response.json();


        console.log(
            "Raw manager activation response:",
            rawResult
        );


        // ==================================
        // NORMALIZE RESPONSE
        // ==================================

        const result =
            Array.isArray(rawResult)
                ? rawResult[0]
                : rawResult;


        console.log(
            "Normalized manager activation response:",
            result
        );


        // ==================================
        // CHECK SUCCESS
        // ==================================

        if (
            !response.ok ||
            !result ||
            result.success !== true
        ) {

            throw new Error(
                result?.message ||
                "Unable to activate your account."
            );

        }


        // ==================================
        // ACTIVATION SUCCESS
        // ==================================

        formState.hidden = true;

        success.hidden = false;


        // Optional success message
        const successMessage =
            $("successMessage");

        if (successMessage) {

            successMessage.textContent =
                result.message ||
                "Your account has been activated successfully.";

        }


    } catch (error) {

        console.error(
            "Manager activation error:",
            error
        );

        showFormError(
            error.message
        );


    } finally {

        button.disabled = false;


        if (buttonText) {

            buttonText.textContent =
                "Activate Account";

        } else {

            button.textContent =
                "Activate Account";

        }

    }

}


);

// ==========================================
// PASSWORD SHOW / HIDE
// ==========================================

document
.querySelectorAll(".toggle-password")
.forEach(
button => {


        button.addEventListener(
            "click",
            function () {

                const input =
                    $(button.dataset.target);

                if (!input) {
                    return;
                }


                const show =
                    input.type === "password";


                input.type =
                    show
                        ? "text"
                        : "password";


                button.textContent =
                    show
                        ? "HIDE"
                        : "SHOW";

            }
        );

    }
);


// ==========================================
// SHOW GENERAL ERROR
// ==========================================

function showError(message) {


loading.hidden = true;

formState.hidden = true;

success.hidden = true;

errorState.hidden = false;


const errorMessage =
    $("errorStateMessage");


if (errorMessage) {

    errorMessage.textContent =
        message ||
        "This invitation is invalid, expired or has already been used.";

}


}

// ==========================================
// SHOW FORM ERROR
// ==========================================

function showFormError(message) {


if (!formError) {
    return;
}


formError.textContent =
    message;


formError.hidden =
    false;


}

// ==========================================
// HIDE FORM ERROR
// ==========================================

function hideError() {


if (!formError) {
    return;
}


formError.textContent =
    "";

formError.hidden =
    true;
}
