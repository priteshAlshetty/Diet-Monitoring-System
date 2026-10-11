/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user management (HttpOnly cookie sessions)
 */

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user (also logs them in)
 *     description: Creates the user and sets the `access_token` and `refresh_token` cookies. Requires the beta access code.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password, access_code]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *               access_code:
 *                 type: string
 *           example:
 *             username: admin
 *             password: admin-123
 *             access_code: your-access-code
 *     responses:
 *       201:
 *         description: Signup successful. Auth cookies are set.
 *         headers:
 *           Set-Cookie:
 *             description: "access_token (15 min, path /) and refresh_token (7 days, path /api/auth/refresh), both HttpOnly"
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Signup successful
 *               user:
 *                 id: 1
 *                 username: admin
 *       400:
 *         description: Validation error
 *       403:
 *         description: Invalid access code
 *       409:
 *         description: Username already exists
 *       429:
 *         description: Too many signup attempts
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in a user
 *     description: Sets the `access_token` and `refresh_token` cookies. No token is returned in the body.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful. Auth cookies are set.
 *         headers:
 *           Set-Cookie:
 *             description: "access_token (15 min, path /) and refresh_token (7 days, path /api/auth/refresh), both HttpOnly"
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Login successful
 *               user:
 *                 id: 1
 *                 username: admin
 *       400:
 *         description: Missing username or password
 *       401:
 *         description: Invalid credentials (errorCode INVALID_CREDENTIALS)
 *       429:
 *         description: Too many login attempts
 */

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Get a new access cookie
 *     description: |
 *       Reads the `refresh_token` cookie (sent automatically by the browser) and sets a new `access_token` cookie.
 *       The refresh token is not re-issued, so the session ends 7 days after login.
 *       On any 401 both cookies are cleared and the client should send the user to the login page.
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: New access cookie set
 *         headers:
 *           Set-Cookie:
 *             description: "access_token (15 min, path /)"
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Token refreshed
 *       401:
 *         description: Refresh cookie missing, expired or invalid (errorCode REFRESH_MISSING, REFRESH_EXPIRED or REFRESH_INVALID)
 *       429:
 *         description: Too many refresh attempts
 */

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log out (clear auth cookies)
 *     description: Clears both cookies in this browser. Tokens are stateless, so this cannot revoke a token that was copied elsewhere.
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: Logged out
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Logged out
 */

/**
 * @swagger
 * /api/auth/update-password:
 *   put:
 *     summary: Change the logged-in user's password
 *     description: The user is taken from the access cookie, not from the body. On success the auth cookies are cleared and the user must log in again.
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password updated. Cookies are cleared.
 *       400:
 *         description: Missing fields or new password too short
 *       401:
 *         description: Not logged in or access token expired (errorCode TOKEN_MISSING, TOKEN_EXPIRED or TOKEN_INVALID)
 *       403:
 *         description: Current password is incorrect (errorCode INVALID_CURRENT_PASSWORD)
 */

/**
 * @swagger
 * /api/auth/delete-user/{username}:
 *   delete:
 *     summary: Delete your own account
 *     description: Only the logged-in user's own username is allowed. On success the auth cookies are cleared.
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully. Cookies are cleared.
 *       401:
 *         description: Not logged in or access token expired
 *       403:
 *         description: Trying to delete another user's account
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     summary: Get all users
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of users (id, username, created_at)
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               users:
 *                 - user_id: 1
 *                   username: admin
 *                   created_at: "2026-10-11 11:20:04"
 *       401:
 *         description: Not logged in or access token expired
 */