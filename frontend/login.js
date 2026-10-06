// CAMPUSCARE ADMIN LOGIN CONTROLLER
// ==========================================

// Determine API URL:
// Works both when served directly from Node.js (port 5000) or Live Server (port 5500)
const API_BASE_URL = window.location.origin.includes(':5000')
    ? '/api'
    : 'http://localhost:5000/api';

// Cache DOM elements
const loginForm = document.getElementById("login-form");
const loginButton = document.getElementById("login-button");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const messageBox = document.getElementById("message");

// Helper: Show feedback message
function showFeedback(text, type = "error") {
    if (!messageBox) return;
    messageBox.textContent = text;
    messageBox.className = type;
    messageBox.style.display = "block";
}

// Helper: Clear feedback message
function clearFeedback() {
    if (!messageBox) return;
    messageBox.textContent = "";
    messageBox.className = "";
    messageBox.style.display = "none";
}

// Prevent double submissions
let isSubmitting = false;

// ==========================================
// LOGIN FORM SUBMISSION
// ==========================================

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        // Prevent default browser form submission / reload
        event.preventDefault();

        if (isSubmitting) return;

        // Get and sanitize entered credentials
        const username = usernameInput ? usernameInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";

        // Client-side validation
        if (!username || !password) {
            showFeedback("Please enter both username and password.", "error");
            if (!username && usernameInput) usernameInput.focus();
            else if (!password && passwordInput) passwordInput.focus();
            return;
        }

        clearFeedback();

        // Lock button during submission
        isSubmitting = true;
        loginButton.disabled = true;
        const originalButtonText = loginButton.textContent;
        loginButton.textContent = "Verifying...";

        try {
            // Send login request to backend
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            let result;
            try {
                result = await response.json();
            } catch (parseErr) {
                result = {};
            }

            // Handle non-successful response
            if (!response.ok || !result.success) {
                if (response.status === 401) {
                    throw new Error(result.message || "Invalid username or password.");
                } else if (response.status === 500) {
                    throw new Error(result.message || "Server authentication configuration error.");
                } else {
                    throw new Error(result.message || "Login failed. Please check your credentials.");
                }
            }

            // Ensure token was returned
            if (!result.token) {
                throw new Error("Authentication failed: No session token received.");
            }

            // Save JWT in sessionStorage
            sessionStorage.setItem("campuscare_admin_token", result.token);

            // Display success notification
            showFeedback("Login successful! Redirecting to Admin Dashboard...", "success");

            // Redirect to Admin Dashboard
            setTimeout(function () {
                window.location.href = "/admin";
            }, 600);

        } catch (error) {
            let errorText = error.message;

            // Differentiate network/server connection failures
            if (error.name === "TypeError" && (error.message.includes("fetch") || error.message.includes("Failed"))) {
                errorText = "Unable to connect to the server. Please verify the backend is running.";
            }

            showFeedback(errorText, "error");
        } finally {
            // Restore button state
            isSubmitting = false;
            loginButton.disabled = false;
            loginButton.textContent = originalButtonText;
        }
    });
}
