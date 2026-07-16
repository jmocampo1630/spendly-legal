import test from "node:test";
import assert from "node:assert/strict";

import {
  callbackError,
  classifyDeletionFailure,
  cleanPagePath,
  confirmationMatches,
  hasOAuthParameters,
} from "../delete-account/src/behavior.js";

test("confirmation requires the exact uppercase word DELETE", () => {
  assert.equal(confirmationMatches("DELETE"), true);
  assert.equal(confirmationMatches("delete"), false);
  assert.equal(confirmationMatches(" DELETE"), false);
  assert.equal(confirmationMatches("DELETE "), false);
  assert.equal(confirmationMatches(""), false);
});

test("OAuth callback parameters are detected and the canonical path is clean", () => {
  const callback = new URL("https://jmocampo1630.github.io/spendly-legal/delete-account/?code=secret#fragment");
  assert.equal(hasOAuthParameters(callback), true);
  assert.equal(cleanPagePath(callback), "/spendly-legal/delete-account/");
});

test("cancelled Google login has a safe message", () => {
  const callback = new URL("https://example.test/delete-account/?error=access_denied&error_description=sensitive");
  assert.equal(
    callbackError(callback),
    "Google sign-in was cancelled. Your account was not changed.",
  );
  assert.doesNotMatch(callbackError(callback), /sensitive/);
});

test("invalid and rate-limited responses clear the session", () => {
  assert.deepEqual(classifyDeletionFailure(401, "not_authenticated"), {
    clearSession: true,
    retry: false,
    message: "Your sign-in is no longer valid. Sign in again to continue.",
  });
  assert.equal(classifyDeletionFailure(429, "rate_limited").clearSession, true);
  assert.equal(classifyDeletionFailure(429, "rate_limited").retry, false);
});

test("network and server failures stay retryable in the current tab", () => {
  for (const status of [0, 500, 502, 503]) {
    const failure = classifyDeletionFailure(status, "deletion_failed");
    assert.equal(failure.clearSession, false);
    assert.equal(failure.retry, true);
  }
});

test("unexpected client failures are not blindly retried", () => {
  const failure = classifyDeletionFailure(403, "origin_not_allowed");
  assert.equal(failure.clearSession, false);
  assert.equal(failure.retry, false);
});

