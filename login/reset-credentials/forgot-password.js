// ==========================================
// QR RESTAURANT SAAS
// FORGOT PASSWORD
// ==========================================

document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('forgotPasswordForm');
    const emailInput = document.getElementById('email');
    const button = document.getElementById('forgotPasswordButton');
    const message = document.getElementById('message');

    if (!form || !emailInput || !button || !message) {
        console.error('Forgot Password: Required elements not found.');
        return;
    }


    // ==========================================
    // CONFIGURATION
    // ==========================================

    const FORGOT_PASSWORD_WEBHOOK =
        `${N8N_WEBHOOK_BASE_URL}/forgot-password`;


    // ==========================================
    // MESSAGE HELPER
    // ==========================================

    function showMessage(text, type = 'error') {

        message.textContent = text;

        message.className = 'message';

        if (type === 'success') {
            message.classList.add('success');
        } else {
            message.classList.add('error');
        }
    }


    // ==========================================
    // BUTTON STATE
    // ==========================================

    function setLoading(isLoading) {

        button.disabled = isLoading;

        if (isLoading) {

            button.innerHTML = `
                <span class="button-icon">⏳</span>
                <span class="button-text">Sending...</span>
            `;

        } else {

            button.innerHTML = `
                <span class="button-icon">→</span>
                <span class="button-text">Send Reset Link</span>
            `;
        }
    }


    // ==========================================
    // FORM SUBMIT
    // ==========================================

    form.addEventListener('submit', async (event) => {

        event.preventDefault();

        showMessage('');

        const email =
            emailInput.value.trim().toLowerCase();


        // ======================================
        // VALIDATION
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

            const response =
                await fetch(
                    FORGOT_PASSWORD_WEBHOOK,
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body: JSON.stringify({
                            email: email
                        })
                    }
                );


            // ==================================
            // READ RESPONSE
            // ==================================

            let result = null;

            try {
                result = await response.json();
            } catch (jsonError) {
                result = null;
            }


            // ==================================
            // HTTP ERROR
            // ==================================

            if (!response.ok) {

                throw new Error(
                    result?.message ||
                    'Unable to process your request.'
                );
            }


            // ==================================
            // SUCCESS
            // ==================================

            if (result?.success === true) {

                showMessage(
                    result.message ||
                    'If an account exists with this email, a password reset link has been sent.',
                    'success'
                );

                form.reset();

            } else {

                showMessage(
                    result?.message ||
                    'Unable to process your request.'
                );
            }

        } catch (error) {

            console.error(
                'Forgot Password Error:',
                error
            );

            showMessage(
                error.message ||
                'Unable to process your request. Please try again.'
            );

        } finally {

            setLoading(false);

        }

    });

});