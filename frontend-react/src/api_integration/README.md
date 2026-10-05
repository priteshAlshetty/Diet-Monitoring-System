# api_integration

Every API call the UI makes lives here. Components only import from `../api_integration`.

| File | Function | Status | Endpoint |
|---|---|---|---|
| authApi.js | `login` | real | POST /api/auth/login |
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

`request` adds the bearer token, parses JSON, throws an error with `.status` on failure,
and logs the user out on a 401.
