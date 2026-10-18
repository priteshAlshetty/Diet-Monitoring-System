# api_integration

Every API call the UI makes lives here. Components only import from `../api_integration`.

Auth uses HttpOnly cookies set by the backend (`access_token` 15 min, `refresh_token` 7 days).
The frontend is served by the Express app, so requests are same-origin and the browser sends
the cookies by itself. `request()` in `api/client.js` refreshes the access cookie once on a
401 and retries; if the refresh fails the user is logged out.

| File | Function | Status | Endpoint |
|---|---|---|---|
| authApi.js | `login` | real | POST /api/auth/login |
| authApi.js | `register` | real | POST /api/auth/signup |
| authApi.js | `logout` | real | POST /api/auth/logout |
| authApi.js | `changePassword` | real | PUT /api/auth/update-password |
| client.js | `refreshSession` | real | POST /api/auth/refresh |
| mealApi.js | `insertMeal` | real | POST /api/dms/insertMeal |
| dashboardApi.js | `getDashboardData` | dummy | GET /api/dms/dashboard?user_id=&date= |
| dashboardApi.js | `deleteMeal` | dummy | DELETE /api/dms/meals/:id |
| proteinApi.js | `getProteinMonth` | dummy | GET /api/dms/proteinMonth?user_id=&month=YYYY-MM |
| profileApi.js | `getProfile` | dummy | GET /api/dms/profile?user_id= |
| profileApi.js | `saveProfile` | dummy | POST /api/dms/saveProfile |

## Switching a dummy function to the real API
1. Add `import { request } from "../api/client";` at the top of the file.
2. Replace the function body with the `// REAL:` line above it.
3. Make sure the response has the same JSON shape the dummy returned. Nothing else changes.

`request` sends the cookies, parses JSON, throws an error with `.status` and `.code`
(the backend `errorCode`), and handles refresh and logout on a 401.
