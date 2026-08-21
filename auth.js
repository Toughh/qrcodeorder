// ==========================================
// QR ORDER SAAS
// FRONTEND AUTHENTICATION
// ==========================================

// ==========================================
// n8n VALIDATE SESSION WEBHOOK
// ==========================================

const N8N_VALIDATE_SESSION_WEBHOOK =
    "https://merakya.app.n8n.cloud/webhook/validate-session";


// ==========================================
// GET SESSION TOKEN
// ==========================================

function getSessionToken() {

    return localStorage.getItem(
        "qro_session_token"
    );

}


// ==========================================
// GET CURRENT STORED SESSION
// ==========================================

function getCurrentSession() {

    const sessionData =
        localStorage.getItem(
            "qro_session_data"
        );

    if (!sessionData) {

        return null;

    }

    try {

        return JSON.parse(
            sessionData
        );

    } catch (error) {

        console.error(
            "Unable to parse stored session:",
            error
        );

        return null;

    }

}


// ==========================================
// SAVE LOGIN SESSION
// ==========================================

function saveSession(data) {

    if (
        !data ||
        !data.sessionToken
    ) {

        throw new Error(
            "Invalid session response."
        );

    }


    // ==================================
    // SESSION TOKEN
    // ==================================

    localStorage.setItem(
        "qro_session_token",
        data.sessionToken
    );


    // ==================================
    // BASIC SESSION DATA
    // ==================================

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
// SAVE VALIDATED SESSION
// ==========================================

function saveValidatedSession(data) {

    if (!data) {

        return;

    }


    // Keep the session token separately.
    // We DO NOT overwrite it with anything
    // from SESSION_VALID.

    const existingToken =
        getSessionToken();


    // ==================================
    // STORE COMPLETE SAFE SESSION DATA
    // ==================================

    localStorage.setItem(
        "qro_validated_session",
        JSON.stringify(data)
    );


    // ==================================
    // UPDATE BASIC SESSION DATA
    // ==================================

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

            mobile:
                data.mobile,

            role:
                data.role,

            status:
                data.status,

            emailVerified:
                data.emailVerified,

            sessionId:
                data.sessionId,

            sessionExpiresAt:
                data.sessionExpiresAt,

            restaurant:
                data.restaurant,

            plan:
                data.plan

        })
    );


    console.log(
        "Validated session saved:",
        data
    );

}


// ==========================================
// GET VALIDATED SESSION
// ==========================================

function getValidatedSession() {

    const data =
        localStorage.getItem(
            "qro_validated_session"
        );

    if (!data) {

        return null;

    }

    try {

        return JSON.parse(
            data
        );

    } catch (error) {

        console.error(
            "Unable to parse validated session:",
            error
        );

        return null;

    }

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

    localStorage.removeItem(
        "qro_validated_session"
    );

}


// ==========================================
// VALIDATE SESSION
// ==========================================

async function validateSession() {

    console.log(
        "AUTH: Starting session validation..."
    );


    const sessionToken =
        getSessionToken();


    // ==================================
    // NO TOKEN
    // ==================================

    if (!sessionToken) {

        console.warn(
            "AUTH: No session token found."
        );

        return {

            valid: false,

            code:
                "NO_SESSION"

        };

    }


    try {

        // ==================================
        // CALL n8n
        // ==================================

        const response =
            await fetch(
                N8N_VALIDATE_SESSION_WEBHOOK,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            sessionToken:
                                sessionToken

                        })

                }
            );


        console.log(
            "AUTH: Validation HTTP status:",
            response.status
        );


        // ==================================
        // HTTP ERROR
        // ==================================

        if (!response.ok) {

            console.error(
                "AUTH: Session validation HTTP error:",
                response.status
            );

            return {

                valid: false,

                code:
                    "VALIDATION_ERROR"

            };

        }


        // ==================================
        // READ RESPONSE
        // ==================================

        const rawResult =
            await response.json();


        console.log(
            "AUTH: Raw validation response:",
            rawResult
        );


        // ==================================
        // NORMALIZE n8n RESPONSE
        // ==================================

        const result =
            Array.isArray(rawResult)
                ? rawResult[0]
                : rawResult;


        console.log(
            "AUTH: Normalized validation response:",
            result
        );


        // ==================================
        // SESSION VALID
        // ==================================

        if (
            result &&
            result.success === true &&
            result.code === "SESSION_VALID" &&
            result.data
        ) {

            // ==================================
            // SAVE COMPLETE VALIDATED SESSION
            // ==================================

            saveValidatedSession(
                result.data
            );


            console.log(
                "AUTH: Session is valid."
            );


            return {

                valid: true,

                code:
                    "SESSION_VALID",

                data:
                    result.data

            };

        }


        // ==================================
        // SESSION INVALID
        // ==================================

        console.warn(
            "AUTH: Session is invalid.",
            result
        );


        return {

            valid: false,

            code:
                result?.code ||
                "INVALID_SESSION",

            message:
                result?.message ||
                "Session is invalid."

        };


    } catch (error) {

        console.error(
            "AUTH: Session validation failed:",
            error
        );


        return {

            valid: false,

            code:
                "NETWORK_ERROR",

            message:
                "Unable to validate login session."

        };

    }

}


// ==========================================
// REQUIRE AUTHENTICATION
// ==========================================

async function requireAuthentication() {

    console.log(
        "AUTH: requireAuthentication()"
    );


    const result =
        await validateSession();


    // ==================================
    // INVALID
    // ==================================

    if (!result.valid) {

        console.warn(
            "AUTH: Authentication failed:",
            result.code
        );


        clearSession();


        window.location.href =
            "login.html";


        return null;

    }


    // ==================================
    // VALID
    // ==================================

    console.log(
        "AUTH: Authentication successful."
    );


    return result.data;

}