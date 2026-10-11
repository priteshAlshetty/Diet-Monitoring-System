# DMS Express API automated tests

## Cost safety: Gemini is blocked

This suite intentionally blocks `globalThis.fetch` before requests are tested. Therefore, no real Gemini request can be made by these tests. Gemini route tests cover only malformed/invalid inputs expected to be rejected before any network call. The final safety test asserts that zero fetch calls were attempted.

Do not remove the fetch guard unless you deliberately want to add a separately controlled mocked/integration test.

## Files

Copy `tests/api.test.js` into your backend project's `tests/api.test.js`.

The test file assumes this project layout:

```text
backend-express/
  app.js
  src/
    config/config.auth.js
    utils/tokens.js
  tests/
    api.test.js
```

## Install

From the backend project directory:

```bash
npm install --save-dev supertest
```

Your app already uses ES modules. Ensure `package.json` has `"type": "module"` if that is required by your existing setup.

Add this script to the existing `scripts` section of `package.json`:

```json
"test": "node --test tests/*.test.js"
```

Then run:

```bash
npm test
```

## What is covered

- Public `/test` route
- Unknown API routes
- Missing, malformed, expired, wrong-secret, and wrong-type access tokens
- Login input validation
- Signup required fields and invalid access-code gate
- Password-update validation
- Account-deletion ownership checks
- AI meal-macro request validation only
- Meal-insert route validation and controller validation that runs before DB/Gemini
- Invalid refresh tokens and successful refresh-cookie issuance
- Logout cookie clearing
- A final assertion that no outbound `fetch` calls were attempted

## Important limitations

This suite deliberately avoids successful database-backed login/signup/user-list/account-deletion/password-change/meal-insertion cases because those need a controlled test database and could modify data. It does not call Gemini.

Some route/controller tests assume the app's current contracts shown in the supplied source files. Run the suite against your actual backend. If a test fails, inspect whether the expectation or the app's current behavior is correct before changing either.

The tests import `../app.js` and `../src/...` paths, so adjust imports only if your folder layout differs.
