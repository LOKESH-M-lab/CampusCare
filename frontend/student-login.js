/**
 * CampusCare – Student Login & Registration Controller
 * Handles student authentication, real-time Gmail username validation,
 * account creation, and session storage.
 */

// Determine API Base URL
const API_BASE_URL = window.location.origin.includes(':5000')
  ? '/api'
  : 'http://localhost:5000/api';

// DOM Elements - Tabs & View Toggling
const tabBtnLogin = document.getElementById('tab-btn-login');
const tabBtnRegister = document.getElementById('tab-btn-register');
const formLogin = document.getElementById('student-login-form');
const formRegister = document.getElementById('student-register-form');
const authMainTitle = document.getElementById('auth-main-title');
const authMainSubtitle = document.getElementById('auth-main-subtitle');
const linkToRegister = document.getElementById('link-to-register');
const linkToLogin = document.getElementById('link-to-login');
const authAlert = document.getElementById('auth-alert');

// DOM Elements - Login Form
const loginNameInput = document.getElementById('login-name');
const loginUsernameInput = document.getElementById('login-username');
const loginPasswordInput = document.getElementById('login-password');
const loginGmailPreview = document.getElementById('login-gmail-preview');
const loginGmailError = document.getElementById('login-gmail-error');
const btnLoginSubmit = document.getElementById('btn-login-submit');

// DOM Elements - Registration Form
const regNameInput = document.getElementById('reg-name');
const regRegNoInput = document.getElementById('reg-regno');
const regUsernameInput = document.getElementById('reg-username');
const regPasswordInput = document.getElementById('reg-password');
const regConfirmPasswordInput = document.getElementById('reg-confirm-password');
const regGmailPreview = document.getElementById('reg-gmail-preview');
const regGmailError = document.getElementById('reg-gmail-error');
const btnRegisterSubmit = document.getElementById('btn-register-submit');

// Alert Helper
function showAlert(message, type = 'error') {
  if (!authAlert) return;
  authAlert.textContent = message;
  authAlert.className = `alert-box ${type}`;
  authAlert.style.display = 'block';
}

function clearAlert() {
  if (!authAlert) return;
  authAlert.textContent = '';
  authAlert.className = 'alert-box';
  authAlert.style.display = 'none';
}

// View Toggling: Switch between Login and Registration
function showLoginView() {
  clearAlert();
  tabBtnLogin.classList.add('active');
  tabBtnLogin.setAttribute('aria-selected', 'true');
  tabBtnRegister.classList.remove('active');
  tabBtnRegister.setAttribute('aria-selected', 'false');

  formLogin.style.display = 'block';
  formRegister.style.display = 'none';

  authMainTitle.textContent = 'Student Login';
  authMainSubtitle.textContent = 'Sign in to access your student portal and track grievances';
}

function showRegisterView() {
  clearAlert();
  tabBtnRegister.classList.add('active');
  tabBtnRegister.setAttribute('aria-selected', 'true');
  tabBtnLogin.classList.remove('active');
  tabBtnLogin.setAttribute('aria-selected', 'false');

  formLogin.style.display = 'none';
  formRegister.style.display = 'block';

  authMainTitle.textContent = 'Create Student Account';
  authMainSubtitle.textContent = 'Register with your college details and Gmail username';
}

if (tabBtnLogin) tabBtnLogin.addEventListener('click', showLoginView);
if (tabBtnRegister) tabBtnRegister.addEventListener('click', showRegisterView);
if (linkToRegister) {
  linkToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    showRegisterView();
  });
}
if (linkToLogin) {
  linkToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    showLoginView();
  });
}

// =========================================================================
// REAL-TIME GMAIL USERNAME VALIDATION & LIVE PREVIEW
// =========================================================================

function setupGmailValidation(inputElem, previewElem, errorElem) {
  if (!inputElem) return;

  function validateInput() {
    const rawVal = inputElem.value;

    // Check if input contains '@'
    if (rawVal.includes('@')) {
      errorElem.textContent = 'Please enter only your Gmail username, for example: lokesh123';
      errorElem.style.display = 'block';
      previewElem.style.display = 'none';
      return false;
    }

    const clean = rawVal.trim();
    if (!clean) {
      errorElem.style.display = 'none';
      previewElem.style.display = 'none';
      return false;
    }

    // Valid username entered: show Email preview
    errorElem.style.display = 'none';
    previewElem.textContent = `Email: ${clean.toLowerCase()}@gmail.com`;
    previewElem.style.display = 'block';
    return true;
  }

  // Intercept typing of '@'
  inputElem.addEventListener('keydown', (e) => {
    if (e.key === '@') {
      e.preventDefault();
      errorElem.textContent = 'Please enter only your Gmail username, for example: lokesh123';
      errorElem.style.display = 'block';
    }
  });

  inputElem.addEventListener('input', validateInput);
  inputElem.addEventListener('paste', () => {
    setTimeout(validateInput, 50);
  });
}

setupGmailValidation(loginUsernameInput, loginGmailPreview, loginGmailError);
setupGmailValidation(regUsernameInput, regGmailPreview, regGmailError);

// =========================================================================
// LOGIN FORM SUBMISSION
// =========================================================================

if (formLogin) {
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const name = loginNameInput.value.trim();
    const rawUsername = loginUsernameInput.value.trim();
    const password = loginPasswordInput.value;

    // Validation
    if (!name || !rawUsername || !password) {
      showAlert('Please enter Student Name, Gmail Username, and Password.');
      return;
    }

    // Gmail username check
    if (rawUsername.includes('@')) {
      showAlert('Please enter only your Gmail username, for example: lokesh123');
      loginGmailError.textContent = 'Please enter only your Gmail username, for example: lokesh123';
      loginGmailError.style.display = 'block';
      return;
    }

    btnLoginSubmit.disabled = true;
    btnLoginSubmit.textContent = 'Verifying credentials...';

    try {
      const response = await fetch(`${API_BASE_URL}/auth/student/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          username: rawUsername,
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      // Store student session securely in localStorage and sessionStorage
      localStorage.setItem('campuscare_student_token', data.token);
      sessionStorage.setItem('campuscare_student_token', data.token);

      const studentData = {
        id: data.student.id,
        name: data.student.name,
        registerNumber: data.student.registerNumber,
        email: data.student.email,
        role: 'student'
      };

      localStorage.setItem('campuscare_student_user', JSON.stringify(studentData));
      sessionStorage.setItem('campuscare_student_user', JSON.stringify(studentData));

      // Also set legacy campuscare_student object format for compatibility with any dashboard tabs
      localStorage.setItem('campuscare_student', JSON.stringify({
        name: data.student.name,
        regNo: data.student.registerNumber,
        dept: 'Computer Science and Engineering',
        email: data.student.email
      }));

      showAlert('Login successful! Redirecting to CampusCare Home...', 'success');

      // REQUIRED: Redirect to CampusCare Home/Landing Page (NOT directly to dashboard)
      setTimeout(() => {
        window.location.href = 'home.html';
      }, 700);

    } catch (err) {
      showAlert(err.message || 'Unable to connect to server. Please try again.');
    } finally {
      btnLoginSubmit.disabled = false;
      btnLoginSubmit.textContent = 'Login';
    }
  });
}

// =========================================================================
// REGISTRATION FORM SUBMISSION
// =========================================================================

if (formRegister) {
  formRegister.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const name = regNameInput.value.trim();
    const registerNumber = regRegNoInput.value.trim().toUpperCase();
    const rawUsername = regUsernameInput.value.trim();
    const password = regPasswordInput.value;
    const confirmPassword = regConfirmPasswordInput.value;

    if (!name || !registerNumber || !rawUsername || !password || !confirmPassword) {
      showAlert('Please fill in all registration fields.');
      return;
    }

    if (rawUsername.includes('@')) {
      showAlert('Please enter only your Gmail username, for example: lokesh123');
      regGmailError.textContent = 'Please enter only your Gmail username, for example: lokesh123';
      regGmailError.style.display = 'block';
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Passwords do not match. Please re-enter.');
      return;
    }

    if (password.length < 4) {
      showAlert('Password must be at least 4 characters long.');
      return;
    }

    btnRegisterSubmit.disabled = true;
    btnRegisterSubmit.textContent = 'Creating account...';

    try {
      const response = await fetch(`${API_BASE_URL}/auth/student/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          registerNumber,
          username: rawUsername,
          password,
          confirmPassword
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Registration failed.');
      }

      showAlert('Account created successfully! You can now login.', 'success');

      // Pre-fill login inputs with the newly registered credentials
      loginNameInput.value = name;
      loginUsernameInput.value = rawUsername;
      loginGmailPreview.textContent = `Email: ${rawUsername.toLowerCase()}@gmail.com`;
      loginGmailPreview.style.display = 'block';

      // Switch to login view after short delay
      setTimeout(() => {
        showLoginView();
        showAlert('Account created! Please enter your password to login.', 'success');
        loginPasswordInput.focus();
      }, 1000);

    } catch (err) {
      showAlert(err.message || 'Registration failed. Please try again.');
    } finally {
      btnRegisterSubmit.disabled = false;
      btnRegisterSubmit.textContent = 'Create Account';
    }
  });
}
