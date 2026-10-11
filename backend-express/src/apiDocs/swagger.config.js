import swaggerJSDoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Diet monitoring App Backend API',
            version: '1.0.0',
            description: `
REST API documentation for the **Diet monitoring system** backend.

Provides endpoints for authentication, user management, and related EMS operations.

## Authentication

Authentication uses two **HttpOnly cookies**, set by the server. There is no token in the response body
and nothing to copy or paste.

| Cookie | Lifetime | Purpose |
|---|---|---|
| \`access_token\` | 15 minutes | Sent automatically with every API request |
| \`refresh_token\` | 7 days (fixed) | Sent only to \`POST /api/auth/refresh\` |

**How to try protected routes here:**

1. Call \`POST /api/auth/login\` (or \`/api/auth/signup\`) with **Try it out**. The browser stores both cookies.
2. Call any protected endpoint. The browser attaches \`access_token\` by itself.
3. After 15 minutes protected routes return \`401\` with \`errorCode: TOKEN_EXPIRED\`. Call \`POST /api/auth/refresh\` to get a new access cookie.
4. \`POST /api/auth/logout\` clears both cookies.

Notes:

- This page must be opened from the same origin as the API (for example \`http://localhost:3300/api-docs\`), otherwise the browser will not send the cookies.
- The **Authorize** button cannot set cookies, because browsers do not let pages set the \`Cookie\` header. Log in with the login endpoint instead.
- Error codes: \`TOKEN_MISSING\`, \`TOKEN_EXPIRED\`, \`TOKEN_INVALID\` (access cookie) and \`REFRESH_MISSING\`, \`REFRESH_EXPIRED\`, \`REFRESH_INVALID\` (refresh cookie, send the user to the login page).

\n  \n
## Contact :
alshettypritesh4@gmail.com

`
        },


        servers: [
            { url: 'http://localhost:3300', description: 'Local development server' },
            // { url: 'https://your-production-domain.com', description: 'Production server' },
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'access_token',
                    description: 'HttpOnly access cookie, set by POST /api/auth/login or /api/auth/signup.',
                },
            },
        },
        security: [
            { cookieAuth: [] }
        ],
    },
    apis: ['./src/apiDocs/*.docs.js'], //path for swagger comments files
};

export default swaggerJSDoc(options);