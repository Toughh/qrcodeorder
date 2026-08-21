// ==========================================
// QR ORDER SAAS REGISTRATION
// Frontend Registration Handler
// ==========================================


// ==========================================
// n8n REGISTRATION WEBHOOK
// ==========================================

const N8N_REGISTRATION_WEBHOOK =
"https://merakya.app.n8n.cloud/webhook/restaurant-registration";


// ==========================================
// FORM SUBMIT EVENT
// ==========================================

document
.getElementById("registrationForm")
.addEventListener("submit", async function(event) {

    event.preventDefault();

    const button = document.querySelector(".register-btn");
    const messageBox = document.getElementById("message");

    // Clear previous message
    messageBox.innerHTML = "";

    // Disable button
    button.disabled = true;
    button.innerHTML = "⏳ Creating Account...";


    try {

        // ===============================
        // COLLECT FORM DATA
        // ===============================

        const formData = {

            restaurantName:
            document.getElementById("restaurantName").value.trim(),

            ownerName:
            document.getElementById("ownerName").value.trim(),

            email:
            document.getElementById("email").value.trim(),

            mobile:
            document.getElementById("mobile").value.trim(),

            country:
            document.getElementById("country").value,

            city:
            document.getElementById("city").value.trim(),

            businessType:
            document.getElementById("businessType").value,

            branches:
            Number(
                document.getElementById("branches").value
            ),

            plan:
            document.getElementById("plan").value,

            website:
            document.getElementById("website").value.trim(),

            notes:
            document.getElementById("notes").value.trim(),

            createdAt:
            new Date().toISOString()
        };


        // ===============================
        // FRONTEND VALIDATION
        // ===============================

        if (!formData.restaurantName) {

            throw new Error(
                "Restaurant name is required"
            );

        }


        if (!formData.ownerName) {

            throw new Error(
                "Owner name is required"
            );

        }


        if (!formData.email) {

            throw new Error(
                "Email is required"
            );

        }


        const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (!emailRegex.test(formData.email)) {

            throw new Error(
                "Please enter a valid email"
            );

        }


        if (!formData.mobile) {

            throw new Error(
                "Mobile number is required"
            );

        }


        if (!formData.country) {

            throw new Error(
                "Please select country"
            );

        }


        if (!document.getElementById("terms").checked) {

            throw new Error(
                "Please accept Terms & Conditions"
            );

        }


        console.log(
            "Registration Data:",
            formData
        );


        // ===============================
        // SEND TO n8n
        // ===============================

        const response = await fetch(
            N8N_REGISTRATION_WEBHOOK,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(formData)
            }
        );


        // ===============================
        // HTTP ERROR
        // ===============================

        if (!response.ok) {

            throw new Error(
                "Server error. Please try again."
            );

        }


        // ===============================
        // READ n8n RESPONSE
        // ===============================

        const result =
        await response.json();


        console.log(
            "n8n Response:",
            result
        );


        // ===============================
        // BUSINESS SUCCESS
        // ===============================

        if (result.success === true) {

            messageBox.innerHTML = `

                <div style="
                background:#dcfce7;
                color:#166534;
                padding:15px;
                border-radius:12px;
                margin-top:20px;
                ">

                    🎉 <strong>Registration successful!</strong>

                    <br><br>

                    ${result.message ||
                    "Your restaurant has been successfully registered."}

                    <br><br>

                    ${
                        result.data?.email
                        ? `📧 Registration details have been sent to <strong>${result.data.email}</strong>.`
                        : ""
                    }

                </div>

            `;


            // Reset form only after SUCCESS
            document
            .getElementById("registrationForm")
            .reset();

        }


        // ===============================
        // EXISTING CLIENT
        // ===============================

        else if (
            result.code === "CLIENT_ALREADY_EXISTS"
        ) {

            messageBox.innerHTML = `

                <div style="
                background:#fef3c7;
                color:#92400e;
                padding:15px;
                border-radius:12px;
                margin-top:20px;
                ">

                    ⚠️ <strong>Account already exists</strong>

                    <br><br>

                    An account with this email already exists.

                    <br><br>

                    Please use a different email or contact support
                    if you believe this is an error.

                </div>

            `;

            // IMPORTANT:
            // Do NOT reset the form here.
            // The user may want to correct the email.

        }


        // ===============================
        // OTHER BUSINESS ERROR
        // ===============================

        else {

            messageBox.innerHTML = `

                <div style="
                background:#fee2e2;
                color:#991b1b;
                padding:15px;
                border-radius:12px;
                margin-top:20px;
                ">

                    ❌ <strong>Registration could not be completed.</strong>

                    <br><br>

                    ${
                        result.message ||
                        "Please check your information and try again."
                    }

                </div>

            `;

        }

    }


    catch(error) {

        console.error(
            "Registration Error:",
            error
        );


        messageBox.innerHTML = `

            <div style="
            background:#fee2e2;
            color:#991b1b;
            padding:15px;
            border-radius:12px;
            margin-top:20px;
            ">

                ❌ ${error.message}

            </div>

        `;

    }


    finally {

        button.disabled = false;

        button.innerHTML =
        "🚀 Register Restaurant";

    }

});
