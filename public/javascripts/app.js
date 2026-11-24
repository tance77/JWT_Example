"use strict";

const tokenKey = "jwt-example-token";
const authForm = document.querySelector("#register-form, #login-form");
if (authForm) {
    authForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const errorMessage = document.querySelector("#form-error");
        const button = authForm.querySelector("button");
        errorMessage.hidden = true;
        const data = Object.fromEntries(new FormData(authForm));
        if (authForm.id === "register-form" && data.password !== data.confirmPassword) {
            errorMessage.textContent = "Passwords do not match.";
            errorMessage.hidden = false;
            return;
        }
        button.disabled = true;
        try {
            const response = await fetch(authForm.action, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error?.message || "Request failed.");
            // Transfer across this navigation, then remove it from storage on the dashboard.
            if (result.token) sessionStorage.setItem(tokenKey, result.token);
            window.location.assign(result.redirect);
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.hidden = false;
        } finally {
            button.disabled = false;
        }
    });
}

const tokenForm = document.querySelector("#token-form");
if (tokenForm) {
    const tokenField = document.querySelector("#token-field");
    tokenField.value = sessionStorage.getItem(tokenKey) || "";
    sessionStorage.removeItem(tokenKey);
    tokenForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const output = document.querySelector("#api-result");
        output.hidden = false;
        try {
            const response = await fetch("/api/test", {
                headers: { Authorization: "Bearer " + tokenField.value.trim() }
            });
            output.textContent = JSON.stringify(await response.json(), null, 2);
        } catch {
            output.textContent = "Unable to reach the API. Try again.";
        }
    });
}
