const MANAGER_ACTIVATE_WEBHOOK = `${N8N_BASE_URL}/manager-activate`;
const token = String(new URLSearchParams(location.search).get("token") || "").trim();
const $ = id => document.getElementById(id);
const loading = $("loadingState"),
    formState = $("formState"),
    success = $("successState"),
    errorState = $("errorState");
const form = $("activationForm"),
    password = $("password"),
    confirmPassword = $("confirmPassword"),
    formError = $("formError"),
    button = $("activateButton");

document.addEventListener("DOMContentLoaded", init);

async function init() {
    if (!token) {
        return showError("This activation link is missing its security token.");
    }
    try {
        const r = await fetch(MANAGER_ACTIVATE_WEBHOOK, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "verify",
                token
            })
        });
        const d = await r.json();
        if (!r.ok || d.success !== true) throw new Error(d?.message || "This invitation is invalid or expired.");
        $("managerName").textContent = d.name || d.managerName || "Manager";
        $("managerEmail").textContent = d.email || "—";
        loading.hidden = true;
        formState.hidden = false;
    } catch (e) {
        console.error(e);
        showError(e.message);
    }
}

form?.addEventListener("submit", async e => {
    e.preventDefault();
    hideError();
    const p = String(password.value || ""),
        cp = String(confirmPassword.value || "");
    if (p.length < 8) return showFormError("Password must contain at least 8 characters.");
    if (p !== cp) return showFormError("Passwords do not match.");
    button.disabled = true;
    button.querySelector("span").textContent = "Activating...";
    try {
        const r = await fetch(MANAGER_ACTIVATE_WEBHOOK, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "activate",
                token,
                password: p
            })
        });
        const d = await r.json();
        if (!r.ok || d.success !== true) throw new Error(d?.message || "Unable to activate your account.");
        formState.hidden = true;
        success.hidden = false;
    } catch (e) {
        showFormError(e.message);
    } finally {
        button.disabled = false;
        button.querySelector("span").textContent = "Activate Account";
    }
});

document.querySelectorAll(".toggle-password").forEach(b => b.addEventListener("click", () => {
    const i = $(b.dataset.target),
        show = i.type === "password";
    i.type = show ? "text" : "password";
    b.textContent = show ? "HIDE" : "SHOW";
}));

function showError(msg) {
    loading.hidden = true;
    formState.hidden = true;
    success.hidden = true;
    errorState.hidden = false;
    $("errorStateMessage").textContent = msg || "This invitation is invalid, expired or has already been used.";
}

function showFormError(msg) {
    formError.textContent = msg;
    formError.hidden = false;
}

function hideError() {
    formError.textContent = "";
    formError.hidden = true;
}