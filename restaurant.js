// ==========================================
// QR RESTAURANT SAAS
// OWNER — RESTAURANT PAGE
// ==========================================


// ==========================================
// n8n OWNER RESTAURANT WEBHOOK
// ==========================================

const N8N_RESTAURANT_WEBHOOK =
    "https://maatapita.app.n8n.cloud/webhook/owner-restaurants";


// ==========================================
// PAGE LOAD
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log("==================================");
        console.log("RESTAURANT PAGE: Page loaded");
        console.log("==================================");


        // ==================================
        // CHECK AUTHENTICATION
        // ==================================

        console.log(
            "RESTAURANT PAGE: Checking authentication..."
        );

        const session =
            await requireAuthentication();


        // ==================================
        // AUTHENTICATION FAILED
        // ==================================

        if (!session) {

            console.warn(
                "RESTAURANT PAGE: Authentication failed."
            );

            return;
        }


        // ==================================
        // AUTHENTICATION SUCCESSFUL
        // ==================================

        console.log(
            "RESTAURANT PAGE: Authentication successful."
        );

        console.log(
            "RESTAURANT AUTH SESSION:",
            session
        );


        // ==================================
        // LOAD RESTAURANT DATA
        // ==================================

        const restaurantData =
            await loadRestaurantData();


        // ==================================
        // API FAILED
        // ==================================

        if (!restaurantData) {

            console.error(
                "RESTAURANT PAGE: Unable to load restaurant data."
            );

            return;
        }


        console.log("==================================");
        console.log("RESTAURANT DATA RECEIVED:");
        console.log(restaurantData);
        console.log("==================================");


        // ==================================
        // GET DATA OBJECTS
        // ==================================

        const restaurant =
            restaurantData.restaurant || {};

        const client =
            restaurantData.client || {};

        const plan =
            restaurantData.plan || {};


        // ==================================
        // BASIC INFORMATION
        // ==================================

        const restaurantId =
            restaurantData.restaurantId ||
            restaurant.restaurantId ||
            restaurant.RestaurantId ||
            "-";


        const clientId =
            restaurantData.clientId ||
            client.clientId ||
            restaurant.clientId ||
            restaurant.ClientId ||
            "-";


        const restaurantName =
            restaurant.restaurantName ||
            restaurant.RestaurantName ||
            "-";


        const businessType =
            restaurant.businessType ||
            restaurant.BusinessType ||
            "-";


        const email =
            restaurant.email ||
            restaurant.Email ||
            client.email ||
            client.Email ||
            "-";


        const phone =
            restaurant.phone ||
            restaurant.Phone ||
            "-";


        const city =
            restaurant.city ||
            restaurant.City ||
            "-";


        const country =
            restaurant.country ||
            restaurant.Country ||
            "-";


        const currency =
            restaurant.currency ||
            restaurant.Currency ||
            "AED";


        const tax =
            restaurant.tax ??
            restaurant.Tax ??
            restaurant.vat ??
            restaurant.VAT ??
            "-";


        const totalBranches =
            restaurant.totalBranches ??
            restaurant.TotalBranches ??
            restaurantData.totalBranches ??
            0;


        const status =
            restaurant.status ||
            restaurant.Status ||
            "Active";


        // ==========================================
        // OWNER INFORMATION
        // ==========================================

        const ownerName =
            client.ownerName ||
            client.OwnerName ||
            restaurant.ownerName ||
            restaurant.OwnerName ||
            "Owner";


        const ownerEmail =
            client.email ||
            client.Email ||
            restaurant.ownerEmail ||
            restaurant.OwnerEmail ||
            email ||
            "-";


        const userId =
            restaurantData.userId ||
            client.userId ||
            client.UserId ||
            "-";


        const role =
            restaurantData.role ||
            client.role ||
            client.Role ||
            "Owner";


        // ==========================================
        // SUBSCRIPTION
        // ==========================================

        const planName =
            plan.planName ||
            plan.PlanName ||
            restaurant.planName ||
            restaurant.PlanName ||
            "-";


        const planPrice =
            plan.price ??
            plan.Price ??
            restaurant.planPrice ??
            restaurant.PlanPrice ??
            0;


        const maxOrders =
            plan.maxOrders ??
            plan.MaxOrders ??
            restaurant.maxOrders ??
            restaurant.MaxOrders ??
            "-";


        const maxBranches =
            plan.maxBranches ??
            plan.MaxBranches ??
            restaurant.maxBranches ??
            restaurant.MaxBranches ??
            "-";


        // ==========================================
        // UPDATE TOP USER NAME
        // ==========================================

        const userNameElement =
            document.getElementById("userName");


        if (userNameElement) {

            userNameElement.textContent =
                ownerName;
        }


        // ==========================================
        // UPDATE TOP USER ROLE
        // ==========================================

        const userRoleElement =
            document.getElementById("userRole");


        if (userRoleElement) {

            userRoleElement.textContent =
                role;
        }


        // ==========================================
        // UPDATE AVATAR
        // ==========================================

        const avatar =
            document.querySelector(".user-avatar");


        if (avatar) {

            avatar.textContent =
                ownerName
                    .charAt(0)
                    .toUpperCase();
        }


        // ==========================================
        // RESTAURANT ID
        // ==========================================

        setText(
            "restaurantId",
            restaurantId
        );


        // ==========================================
        // RESTAURANT NAME
        // ==========================================

        setText(
            "restaurantName",
            restaurantName
        );


        // ==========================================
        // CLIENT ID
        // ==========================================

        setText(
            "clientId",
            clientId
        );


        // ==========================================
        // BUSINESS TYPE
        // ==========================================

        setText(
            "businessType",
            businessType
        );


        // ==========================================
        // EMAIL
        // ==========================================

        setText(
            "restaurantEmail",
            email
        );


        // ==========================================
        // PHONE
        // ==========================================

        setText(
            "restaurantPhone",
            phone
        );


        // ==========================================
        // CITY
        // ==========================================

        setText(
            "city",
            city
        );


        // ==========================================
        // COUNTRY
        // ==========================================

        setText(
            "country",
            country
        );


        // ==========================================
        // CURRENCY
        // ==========================================

        setText(
            "currency",
            currency
        );


        // ==========================================
        // TAX / VAT
        // ==========================================

        setText(
            "tax",
            tax === "-" ? "-" : `${tax}%`
        );


        // ==========================================
        // TOTAL BRANCHES
        // ==========================================

        setText(
            "totalBranches",
            totalBranches
        );


        // ==========================================
        // STATUS
        // ==========================================

        setText(
            "status",
            status
        );


        // ==========================================
        // STATUS PILL
        // ==========================================

        setText(
            "restaurantStatus",
            status
        );


        // ==========================================
        // OWNER NAME
        // ==========================================

        setText(
            "ownerName",
            ownerName
        );


        // ==========================================
        // OWNER EMAIL
        // ==========================================

        setText(
            "ownerEmail",
            ownerEmail
        );


        // ==========================================
        // USER ID
        // ==========================================

        setText(
            "userId",
            userId
        );


        // ==========================================
        // ROLE
        // ==========================================

        setText(
            "role",
            role
        );


        // ==========================================
        // PLAN NAME
        // ==========================================

        setText(
            "planName",
            planName
        );


        // ==========================================
        // PLAN PRICE
        // ==========================================

        setText(
            "planPrice",
            `${currency} ${planPrice}`
        );


        // ==========================================
        // MAX ORDERS
        // ==========================================

        setText(
            "maxOrders",
            maxOrders
        );


        // ==========================================
        // MAX BRANCHES
        // ==========================================

        setText(
            "maxBranches",
            maxBranches
        );


        // ==========================================
        // LOGOUT
        // ==========================================

        const logoutButton =
            document.getElementById("logoutBtn");


        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                function () {

                    console.log(
                        "RESTAURANT PAGE: Logging out."
                    );


                    // Use existing authentication function
                    if (
                        typeof clearSession ===
                        "function"
                    ) {

                        clearSession();

                    } else {

                        // Fallback
                        localStorage.removeItem(
                            "sessionToken"
                        );
                    }


                    window.location.href =
                        "login.html";
                }
            );
        }


        // ==========================================
        // FINAL DEBUG
        // ==========================================

        console.log("==================================");
        console.log(
            "RESTAURANT PAGE: UI populated successfully."
        );
        console.log("==================================");

        console.log(
            "Restaurant ID:",
            restaurantId
        );

        console.log(
            "Restaurant Name:",
            restaurantName
        );

        console.log(
            "Owner:",
            ownerName
        );

        console.log(
            "Email:",
            ownerEmail
        );

        console.log(
            "Client ID:",
            clientId
        );

        console.log(
            "User ID:",
            userId
        );

        console.log(
            "Role:",
            role
        );

        console.log(
            "Status:",
            status
        );

        console.log(
            "Plan:",
            planName
        );

    }
);


// ==========================================
// LOAD RESTAURANT DATA
// ==========================================

async function loadRestaurantData() {

    try {

        console.log("==================================");
        console.log(
            "RESTAURANT PAGE: Calling n8n API..."
        );
        console.log("==================================");


        // ==================================
        // GET SESSION TOKEN
        // ==================================

        const sessionToken =
            getSessionToken();


        if (!sessionToken) {

            console.error(
                "RESTAURANT PAGE: No session token found."
            );

            return null;
        }


        console.log(
            "RESTAURANT PAGE: Session token found."
        );


        // ==================================
        // CALL n8n
        // ==================================

        const response =
            await fetch(
                N8N_RESTAURANT_WEBHOOK,
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


        // ==================================
        // HTTP STATUS
        // ==================================

        console.log(
            "RESTAURANT API HTTP STATUS:",
            response.status
        );


        // ==================================
        // READ RESPONSE
        // ==================================

        const rawResult =
            await response.json();


        console.log(
            "RESTAURANT API RAW RESPONSE:",
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
            "RESTAURANT API NORMALIZED RESPONSE:",
            result
        );


        // ==========================================
        // SUCCESS
        // ==========================================

        if (
            response.ok &&
            result &&
            result.success === true
        ) {

            console.log(
                "RESTAURANT PAGE: Data loaded successfully."
            );

            return result.data || {};
        }


        // ==========================================
        // SESSION INVALID / EXPIRED
        // ==========================================

        if (
            result &&
            result.success === false &&
            result.code === "RESTAURANT_SESSION_INVALID"
        ) {

            console.warn(
                "RESTAURANT PAGE: Restaurant session is invalid or expired."
            );


            // ==========================================
            // CLEAR EXISTING SESSION
            // ==========================================

            if (
                typeof clearSession ===
                "function"
            ) {

                clearSession();

            } else {

                localStorage.removeItem(
                    "sessionToken"
                );

            }


            // ==========================================
            // REDIRECT TO LOGIN
            // ==========================================

            window.location.href =
                "login.html";


            return null;
        }


        // ==========================================
        // OTHER API ERROR
        // ==========================================

        console.error(
            "RESTAURANT API ERROR:",
            result
        );


        return null;
    }


    catch (error) {

        console.error(
            "RESTAURANT API CONNECTION ERROR:",
            error
        );


        return null;
    }
}


// ==========================================
// HELPER — SET ELEMENT TEXT
// ==========================================

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.textContent =
            value ?? "-";
    }
}