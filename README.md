# Spendly legal site

This repository contains Spendly's public privacy policy and standalone web
account-deletion page.

## Account-deletion page

The GitHub Pages route is:

`https://jmocampo1630.github.io/spendly-legal/delete-account/`

The browser bundle is generated locally and committed. It does not load runtime
JavaScript or CSS from a CDN.

```sh
npm ci
npm test
npm run build
npm run verify:publication
```

`@supabase/supabase-js` and `esbuild` are exact-version dependencies in
`package.json`, with the complete dependency tree locked by `package-lock.json`.
The build intentionally produces `delete-account/app.js` without a source map.

## Publication prerequisite

Do not publish the deletion page until the owner supplies an exact, monitored,
public support email address. Add the same `mailto:` contact to
`delete-account/index.html` and `privacy.md`. `npm run verify:publication` fails
until both files contain that fallback.

## Deployment order

1. Apply Spendly migration `202607160002_account_deletion_rate_limit.sql`.
2. Set `SPENDLY_LEGAL_ORIGIN=https://jmocampo1630.github.io` and redeploy the
   `delete-account` Edge Function.
3. Add the exact trailing-slash deletion URL above to the Supabase Auth redirect
   allowlist. Leave Google OAuth configured with the existing Supabase callback.
4. Run the local build, automated tests, and publication check, then publish with
   GitHub Pages.
5. Verify the public route, OAuth callback cleanup, CSP behavior, mobile and
   keyboard use, cancellation, invalid sessions, backend failures, rate limiting,
   and repeated clicks.
6. Delete a disposable account end to end and save only sanitized evidence in the
   Spendly release-evidence template before adding the canonical URL to Play
   Console.

The deployment, Supabase dashboard, disposable-account deletion, and Play Console
steps are external operations and are not performed by the static-site build.
