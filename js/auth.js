const USERS_KEY = "users";
const CURRENT_USER_KEY = "currentUser";

function loadUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function setCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

function showMessage(elementId, text, type = "error") {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.classList.remove("success");
  if (text) {
    el.textContent = text;
    if (type === "success") {
      el.classList.add("success");
    }
    el.classList.add("show");
  } else {
    el.textContent = "";
    el.classList.remove("show");
  }
}

function normalizeAuthMode(mode) {
  return mode === "register" ? "register" : "login";
}

function getInitialAuthMode() {
  const bodyDefault = document.body.dataset.authDefault;
  if (bodyDefault === "login" || bodyDefault === "register") {
    return bodyDefault;
  }

  const queryMode = new URLSearchParams(window.location.search).get("mode");
  return normalizeAuthMode(queryMode);
}

function setAuthMode(mode, options = {}) {
  const shell = document.getElementById("auth-shell");
  if (!shell) return;

  const nextMode = normalizeAuthMode(mode);
  const shouldFocus = Boolean(options.shouldFocus);

  shell.classList.toggle("is-register", nextMode === "register");

  if (nextMode === "register") {
    showMessage("login-alert", "");
  } else {
    showMessage("register-alert", "");
  }

  if (shouldFocus) {
    const firstFieldId = nextMode === "register" ? "reg-name" : "login-email";
    const firstField = document.getElementById(firstFieldId);
    if (firstField) {
      firstField.focus();
    }
  }
}

function handleRegister(event) {
  event.preventDefault();
  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  const confirm = document.getElementById("reg-confirm").value;

  if (!name || !email || !password || !confirm) {
    showMessage("register-alert", "All fields are required.");
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    showMessage("register-alert", "Please enter a valid email.");
    return;
  }

  if (password.length < 6) {
    showMessage("register-alert", "Password must be at least 6 characters.");
    return;
  }

  if (password !== confirm) {
    showMessage("register-alert", "Passwords do not match.");
    return;
  }

  const users = loadUsers();
  const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    showMessage("register-alert", "Email already registered. Try logging in.");
    return;
  }

  users.push({ name, email, password });
  saveUsers(users);
  setCurrentUser({ name, email });
  showMessage("register-alert", "Account created! Redirecting to home...", "success");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 800);
}

function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    showMessage("login-alert", "Email and password are required.");
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    showMessage("login-alert", "Please enter a valid email.");
    return;
  }

  const users = loadUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) {
    showMessage("login-alert", "Invalid credentials.");
    return;
  }

  setCurrentUser({ name: user.name, email: user.email });
  showMessage("login-alert", "Login successful. Redirecting...", "success");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 600);
}

document.addEventListener("DOMContentLoaded", function () {
  const registerForm = document.getElementById("register-form");
  const loginForm = document.getElementById("login-form");
  const modeSwitchButtons = document.querySelectorAll("[data-auth-target]");
  const forgotPasswordLink = document.querySelector(".auth-forgot");

  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  if (modeSwitchButtons.length) {
    modeSwitchButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const targetMode = button.dataset.authTarget;
        setAuthMode(targetMode, { shouldFocus: true });
      });
    });

    setAuthMode(getInitialAuthMode(), { shouldFocus: false });
  }

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", function (event) {
      event.preventDefault();
      showMessage("login-alert", "Password reset placeholder. Please contact support.", "success");
    });
  }
});
