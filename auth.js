// ==========================================
// QR ORDER SAAS
// FRONTEND AUTHENTICATION GUARD
// ==========================================

const N8N_VALIDATE_SESSION_WEBHOOK =
    "https://maatapita.app.n8n.cloud/webhook/validate-session";


// ==========================================
// GET SESSION TOKEN
// ==========================================

function getSessionToken() {

    return localStorage.getItem("qro_session_token");

}


// ==========================================
// GET CURRENT SESSION
// ==========================================

function getCurrentSession() {

    const sessionData =
        localStorage.getItem("qro_session_data");

    if (!sessionData) {
        return null;
    }

    try {

        return JSON.parse(sessionData);

    } catch (error) {

        console.error(
            "Unable to parse session data:",
            error
        );

        return null;

    }

}


// ==========================================
// SAVE SESSION
// ==========================================

function saveSession(data) {

    if (!data || !data.sessionToken) {

        throw new Error(
            "Invalid session response."
        );

    }


    localStorage.setItem(
        "qro_session_token",
        data.sessionToken
    );


    localStorage.setItem(
        "qro_session_data",
        JSON.stringify({

            userId:
                data.userId,

            clientId:
                data.clientId,

            restaurantId:
                data.restaurantId,

            name:
                data.name,

            email:
                data.email,

            role:
                data.role,

            sessionExpiresAt:
                data.sessionExpiresAt

        })
    );

}


// ==========================================
// CLEAR SESSION
// ==========================================

function clearSession() {

    localStorage.removeItem(
        "qro_session_token"
    );

    localStorage.removeItem(
        "qro_session_data"
    );

}


// ==========================================
// VALIDATE SESSION
// ==========================================

async function validateSession() {

    const sessionToken =
        getSessionToken();


    if (!sessionToken) {

        return {

            valid: false,

            code: "NO_SESSION"

        };

    }


    try {

        const response =
            await fetch(
                N8N_VALIDATE_SESSION_WEBHOOK,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        sessionToken:
                            sessionToken

                    })

                }
            );


        if (!response.ok) {

            console.error(
                "Session validation HTTP error:",
                response.status
            );

            return {

                valid: false,

                code: "VALIDATION_ERROR"

            };

        }


        const result =
            await response.json();


        console.log(
            "Session validation response:",
            result
        );


        if (
            result.success === true &&
            result.code === "SESSION_VALID"
        ) {

            return {

                valid: true,

                data:
                    result.data

            };

        }


        return {

            valid: false,

            code:
                result.code ||
                "INVALID_SESSION"

        };


    } catch (error) {

        console.error(
            "Session validation failed:",
            error
        );


        return {

            valid: false,

            code: "NETWORK_ERROR"

        };

    }

}


// ==========================================
// REQUIRE AUTHENTICATION
// ==========================================

async function requireAuthentication() {

    const result =
        await validateSession();


    if (!result.valid) {

        clearSession();


        window.location.href =
            "login.html";

        return null;

    }


    return result.data;

}