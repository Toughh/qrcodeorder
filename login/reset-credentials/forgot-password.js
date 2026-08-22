// ==========================================
// QR RESTAURANT SAAS
// FORGOT PASSWORD
// ==========================================

document.addEventListener('DOMContentLoaded', () => {

    const form =
        document.getElementById('forgotPasswordForm');

    const emailInput =
        document.getElementById('email');

    const button =
        document.getElementById('forgotPasswordButton');

    const message =
        document.getElementById('message');


    // ==========================================
    // ELEMENT VALIDATION
    // ==========================================

    if (
        !form ||
        !emailInput ||
        !button ||
        !message
    ) {

        console.error(
            'Forgot Password: Required elements not found.'
        );

        return;
    }


    // ==========================================
    // n8n FORGOT PASSWORD WEBHOOK
    // ==========================================

    const FORGOT_PASSWORD_WEBHOOK =
        `${N8N_BASE_URL}/forgot-password`;


    console.log(
        'Forgot Password Webhook:',
        FORGOT_PASSWORD_WEBHOOK
    );


    // ==========================================
    // MESSAGE HELPER
    // ==========================================

    function showMessage(
        text,
        type = 'error'
    ) {

        message.textContent = text;

        message.className = 'message';


        if (type === 'success') {

            message.classList.add('success');

        } else {

            message.classList.add('error');

        }

    }


    // ==========================================
    // CLEAR MESSAGE
    // ==========================================

    function clearMessage() {

        message.textContent = '';

        message.className = 'message';

    }


    // ==========================================
    // BUTTON LOADING STATE
    // ==========================================

    function setLoading(
        isLoading
    ) {

        button.disabled = isLoading;


        if (isLoading) {

            button.innerHTML = `
                <span class="button-icon">⏳</span>
                <span class="button-text">
                    Sending...
                </span>
            `;

        } else {

            button.innerHTML = `
                <span class="button-icon">→</span>
                <span class="button-text">
                    Send Reset Link
                </span>
            `;

        }

    }


    // ==========================================
    // FORM SUBMIT
    // ==========================================

    form.addEventListener(
        'submit',
        async (event) => {

            event.preventDefault();


            clearMessage();


            // ======================================
            // READ EMAIL
            // ======================================

            const email =
                emailInput.value
                    .trim()
                    .toLowerCase();


            // ======================================
            // VALIDATE EMAIL
            // ======================================

            if (!email) {

                showMessage(
                    'Please enter your email address.'
                );

                emailInput.focus();

                return;
            }


            if (!emailInput.checkValidity()) {

                showMessage(
                    'Please enter a valid email address.'
                );

                emailInput.focus();

                return;
            }


            // ======================================
            // START LOADING
            // ======================================

            setLoading(true);


            try {

                console.log(
                    'Forgot Password: Sending request for:',
                    email
                );


                // ==================================
                // CALL n8n
                // ==================================

                const response =
                    await fetch(
                        FORGOT_PASSWORD_WEBHOOK,
                        {

                            method: 'POST',

                            headers: {

                                'Content-Type':
                                    'application/json'

                            },

                            body:
                                JSON.stringify({

                                    email:
                                        email

                                })

                        }
                    );


                console.log(
                    'Forgot Password HTTP Status:',
                    response.status
                );


                // ==================================
                // READ RESPONSE
                // ==================================

                const rawResponse =
                    await response.text();


                console.log(
                    'Forgot Password Raw Response:',
                    rawResponse
                );


                let result = null;


                try {

                    result =
                        JSON.parse(
                            rawResponse
                        );

                } catch (parseError) {

                    console.warn(
                        'Forgot Password: Response is not JSON.'
                    );

                }


                // ==================================
                // HTTP ERROR
                // ==================================

                if (!response.ok) {

                    throw new Error(
                        result?.message ||
                        `Request failed with HTTP ${response.status}.`
                    );

                }


                // ==================================
                // NORMALIZE n8n RESPONSE
                // ==================================

                if (Array.isArray(result)) {

                    result =
                        result[0];

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

                        'If an account exists with this email, a password reset link has been sent.',

                        'success'

                    );


                    // Clear entered email
                    form.reset();


                    console.log(
                        'Forgot Password: Request successful.'
                    );


                } else {

                    showMessage(

                        result?.message ||

                        'Unable to process your request. Please try again.'

                    );

                }

            } catch (error) {

                console.error(
                    'Forgot Password Error:',
                    error
                );


                // ==================================
                // NETWORK / FETCH ERROR
                // ==================================

                if (
                    error instanceof TypeError
                ) {

                    showMessage(
                        'Unable to connect to the password recovery service. Please try again.'
                    );

                } else {

                    showMessage(
                        error.message ||
                        'Unable to process your request. Please try again.'
                    );

                }

            } finally {

                setLoading(false);

            }

        }
    );

});