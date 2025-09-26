// api.js
export async function loginUser(email, password) {
    try {
        const res = await fetch("http://localhost:8000/user/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
        throw new Error("Login failed");
        }

        const data = await res.json();

        // ✅ Save token in localStorage
        if (data.token) {
            localStorage.setItem("userToken", data.token);
        }

        return data;
    } catch (err) {
        console.error("Login error:", err);
        throw err;
    }
}

// Utility to get token later
export function getToken() {
    return localStorage.getItem("userToken");
}

// Logout utility
export function logoutUser() {
    localStorage.removeItem("userToken");
}
