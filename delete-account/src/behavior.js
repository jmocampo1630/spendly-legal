export const OAUTH_PARAMETER_NAMES = new Set([
  "code",
  "error",
  "error_code",
  "error_description",
]);

export function confirmationMatches(value) {
  return value === "DELETE";
}

export function hasOAuthParameters(url) {
  for (const name of OAUTH_PARAMETER_NAMES) {
    if (url.searchParams.has(name)) return true;
  }
  return false;
}

export function callbackError(url) {
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("error_code");
  if (!error && !code) return null;

  if (error === "access_denied") {
    return "Google sign-in was cancelled. Your account was not changed.";
  }

  return "Google sign-in could not be completed. Please try again.";
}

export function cleanPagePath(url) {
  return url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
}

export function classifyDeletionFailure(status, code) {
  if (status === 401 || code === "not_authenticated") {
    return {
      clearSession: true,
      retry: false,
      message: "Your sign-in is no longer valid. Sign in again to continue.",
    };
  }

  if (status === 429 || code === "rate_limited") {
    return {
      clearSession: true,
      retry: false,
      message: "Too many deletion attempts. Wait at least 10 minutes, then sign in again.",
    };
  }

  if (status >= 500 || status === 0) {
    return {
      clearSession: false,
      retry: true,
      message: "Spendly could not delete the account right now. No local device data was changed. Try again from this tab.",
    };
  }

  return {
    clearSession: false,
    retry: false,
    message: "Account deletion could not continue safely. Your account was not changed.",
  };
}

