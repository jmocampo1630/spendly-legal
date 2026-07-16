import { createClient } from "@supabase/supabase-js";
import {
  callbackError,
  classifyDeletionFailure,
  cleanPagePath,
  confirmationMatches,
  hasOAuthParameters,
} from "./behavior.js";

const SUPABASE_URL = "https://zdwsdtgixkasvkwjecte.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_-s4Bt8LedPmkdlICA4N8Fw_UK1zkMxx";
const REDIRECT_URL = "https://jmocampo1630.github.io/spendly-legal/delete-account/";
const DELETE_ENDPOINT = `${SUPABASE_URL}/functions/v1/delete-account`;

let supabase = null;
let deletionInProgress = false;
let signInInProgress = false;

const elements = {
  loadingPanel: document.querySelector("#loading-panel"),
  loadingMessage: document.querySelector("#loading-message"),
  signedOutPanel: document.querySelector("#signed-out-panel"),
  signedOutMessage: document.querySelector("#signed-out-message"),
  signInButton: document.querySelector("#sign-in-button"),
  deleteForm: document.querySelector("#delete-form"),
  accountEmail: document.querySelector("#account-email"),
  changeAccountButton: document.querySelector("#change-account-button"),
  confirmationInput: document.querySelector("#confirmation-input"),
  deleteButton: document.querySelector("#delete-button"),
  resultPanel: document.querySelector("#result-panel"),
  resultHeading: document.querySelector("#result-heading"),
  resultMessage: document.querySelector("#result-message"),
  retryButton: document.querySelector("#retry-button"),
  returnButton: document.querySelector("#return-button"),
  statusMessage: document.querySelector("#status-message"),
};

if (isTopLevelWindow()) {
  document.documentElement.classList.remove("frame-guard-pending");
  initialize();
}

function isTopLevelWindow() {
  try {
    return window.self === window.top;
  } catch (_) {
    return false;
  }
}

async function initialize() {
  bindEvents();
  const currentUrl = new URL(window.location.href);
  const oauthError = callbackError(currentUrl);

  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        flowType: "pkce",
        storage: window.sessionStorage,
        persistSession: true,
        autoRefreshToken: false,
        detectSessionInUrl: true,
      },
    });
  } catch (_) {
    showSignedOut(
      "This browser is blocking session storage. Allow site storage in this tab and reload the page.",
      false,
    );
    return;
  }

  if (oauthError) {
    cleanOAuthUrl();
    await clearSession();
    showSignedOut(oauthError);
    return;
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    if (hasOAuthParameters(currentUrl)) cleanOAuthUrl();

    if (error) {
      await clearSession();
      showSignedOut("Google sign-in could not be verified. Please try again.");
      return;
    }

    if (!data.session) {
      showSignedOut();
      return;
    }

    await verifyAndShowUser();
  } catch (_) {
    if (hasOAuthParameters(currentUrl)) cleanOAuthUrl();
    showRetryableVerificationError();
  }
}

function bindEvents() {
  elements.signInButton.addEventListener("click", signInWithGoogle);
  elements.changeAccountButton.addEventListener("click", changeAccount);
  elements.confirmationInput.addEventListener("input", updateDeleteButton);
  elements.deleteForm.addEventListener("submit", submitDeletion);
  elements.retryButton.addEventListener("click", submitDeletion);
  elements.returnButton.addEventListener("click", () => showSignedOut());
}

async function verifyAndShowUser() {
  showLoading("Verifying your account…");

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user || !data.user.email) {
      const status = Number(error?.status || 0);
      if (status === 0 || status >= 500) {
        showRetryableVerificationError();
        return;
      }
      await clearSession();
      showSignedOut("Your sign-in is invalid or expired. Sign in again to continue.");
      return;
    }
    showAuthenticated(data.user.email);
  } catch (_) {
    showRetryableVerificationError();
  }
}

function showRetryableVerificationError() {
  showResult(
    "Could not verify sign-in",
    "Check your connection and try again from this tab. Your account was not changed.",
    { returnToSignIn: true },
  );
}

async function signInWithGoogle() {
  if (signInInProgress || !supabase) return;
  signInInProgress = true;
  elements.signInButton.disabled = true;
  setStatus("Opening Google sign-in…");

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: REDIRECT_URL,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) throw error;
  } catch (_) {
    signInInProgress = false;
    elements.signInButton.disabled = false;
    setStatus("Google sign-in could not start. Please try again.", true);
  }
}

async function changeAccount() {
  if (deletionInProgress) return;
  showLoading("Clearing this sign-in…");
  await clearSession();
  showSignedOut("The previous sign-in was cleared. Continue to choose another Google account.");
}

function updateDeleteButton() {
  elements.deleteButton.disabled =
    deletionInProgress || !confirmationMatches(elements.confirmationInput.value);
}

async function submitDeletion(event) {
  event?.preventDefault?.();
  if (deletionInProgress || !confirmationMatches(elements.confirmationInput.value)) {
    updateDeleteButton();
    return;
  }

  deletionInProgress = true;
  elements.confirmationInput.disabled = true;
  elements.changeAccountButton.disabled = true;
  elements.deleteButton.disabled = true;
  elements.deleteButton.textContent = "Deleting account…";
  elements.retryButton.disabled = true;
  setStatus("Permanently deleting cloud account data…");

  let response;
  let responseBody = null;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) {
      await handleDeletionFailure(401, "not_authenticated");
      return;
    }

    response = await fetch(DELETE_ENDPOINT, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      cache: "no-store",
      referrerPolicy: "no-referrer",
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
        apikey: SUPABASE_PUBLISHABLE_KEY,
        "x-spendly-account-deletion": "delete",
      },
    });

    try {
      responseBody = await response.json();
    } catch (_) {
      responseBody = null;
    }

    if (!response.ok || responseBody?.deleted !== true) {
      await handleDeletionFailure(response.status, responseBody?.code);
      return;
    }

    cleanOAuthUrl();
    await clearSession();
    elements.accountEmail.textContent = "";
    elements.confirmationInput.value = "";
    showResult(
      "Account deleted",
      "Your Spendly cloud account and account-linked cloud data were deleted. Remember to clear Spendly storage or uninstall the app on devices where local data should also be removed.",
    );
    document.title = "Spendly account deleted";
  } catch (_) {
    await handleDeletionFailure(0, "network_error");
  } finally {
    deletionInProgress = false;
  }
}

async function handleDeletionFailure(status, code) {
  const failure = classifyDeletionFailure(status, code);
  if (failure.clearSession) {
    await clearSession();
    elements.accountEmail.textContent = "";
    elements.confirmationInput.value = "";
  }

  resetDeletionControls();
  showResult("Account not deleted", failure.message, {
    retry: failure.retry,
    returnToSignIn: failure.clearSession,
  });
}

function resetDeletionControls() {
  elements.confirmationInput.disabled = false;
  elements.changeAccountButton.disabled = false;
  elements.deleteButton.textContent = "Permanently delete cloud account";
  elements.retryButton.disabled = false;
  deletionInProgress = false;
  updateDeleteButton();
}

async function clearSession() {
  try {
    await supabase?.auth.signOut({ scope: "local" });
  } catch (_) {
    // Local storage is cleared below even if the session is already invalid.
  }

  try {
    window.sessionStorage.clear();
  } catch (_) {
    // Storage may have been disabled after the page loaded.
  }
}

function cleanOAuthUrl() {
  const url = new URL(window.location.href);
  window.history.replaceState(null, "", cleanPagePath(url));
}

function showLoading(message) {
  hideAllPanels();
  elements.loadingMessage.textContent = message;
  elements.loadingPanel.hidden = false;
  setStatus("");
}

function showSignedOut(message, allowSignIn = true) {
  hideAllPanels();
  if (message) elements.signedOutMessage.textContent = message;
  elements.signInButton.hidden = !allowSignIn;
  elements.signInButton.disabled = false;
  elements.signedOutPanel.hidden = false;
  signInInProgress = false;
  setStatus("");
}

function showAuthenticated(email) {
  hideAllPanels();
  elements.accountEmail.textContent = email;
  elements.confirmationInput.value = "";
  elements.confirmationInput.disabled = false;
  elements.changeAccountButton.disabled = false;
  elements.deleteButton.textContent = "Permanently delete cloud account";
  elements.deleteForm.hidden = false;
  deletionInProgress = false;
  updateDeleteButton();
  setStatus("");
  elements.confirmationInput.focus();
}

function showResult(heading, message, options = {}) {
  hideAllPanels();
  elements.resultHeading.textContent = heading;
  elements.resultMessage.textContent = message;
  elements.retryButton.hidden = !options.retry;
  elements.returnButton.hidden = !options.returnToSignIn;
  elements.resultPanel.hidden = false;
  elements.resultPanel.focus();
  setStatus("");
}

function hideAllPanels() {
  elements.loadingPanel.hidden = true;
  elements.signedOutPanel.hidden = true;
  elements.deleteForm.hidden = true;
  elements.resultPanel.hidden = true;
}

function setStatus(message, isError = false) {
  elements.statusMessage.textContent = message;
  elements.statusMessage.classList.toggle("is-error", isError);
}

