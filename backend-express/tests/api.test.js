import { test as nodeTest, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import app from '../app.js';
import {
    ACCESS_COOKIE,
    REFRESH_COOKIE,
    JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET
} from '../src/config/config.auth.js';

import { signAccess, signRefresh } from '../src/utils/tokens.js';

// --------------------------------------------------
// Individual test results and summary
// --------------------------------------------------
let reportedTestCount = 0;
let reportedPassedCount = 0;
let reportedFailedCount = 0;

function test(name, fn) {
    const testNumber = ++reportedTestCount;

    nodeTest(name, async (context) => {
        try {
            await fn(context);
            reportedPassedCount++;

            console.log(`Test ${testNumber} passed [${name}]`);
        } catch (error) {
            reportedFailedCount++;

            console.log(
                `Test ${testNumber} failed [${name}] ${error?.message ?? error}`
            );

            throw error;
        }
    });
}

after(() => {
    console.log('\n========== TEST SUMMARY ==========');
    console.log(`Total pass cases : ${reportedPassedCount}`);
    console.log(`Total fail cases : ${reportedFailedCount}`);
    console.log(`Total test cases : ${reportedTestCount}`);
    console.log('==================================');
});

// --------------------------------------------------
// IMPORTANT: Prevent Gemini API charges
// --------------------------------------------------
// ALL outbound fetch calls are blocked during testing.
// No real Gemini API request should be made by this suite.

let blockedFetchAttempts = 0;

globalThis.fetch = async (...args) => {
    blockedFetchAttempts++;

    throw new Error(
        `BLOCKED by test safety guard: outbound fetch is disabled (${String(args[0] ?? 'unknown URL')})`
    );
};

// --------------------------------------------------
// Test helpers
// --------------------------------------------------

const testUser = {
    id: 101,
    username: 'test-suite-user'
};

const accessToken = () => signAccess(testUser);

const accessCookie = (token = accessToken()) =>
    `${ACCESS_COOKIE}=${token}`;

const refreshCookie = (token) =>
    `${REFRESH_COOKIE}=${token}`;

const call = (method, path, { body, cookie } = {}) => {
    let req = request(app)[method](path);

    if (cookie) {
        req = req.set('Cookie', cookie);
    }

    if (body !== undefined) {
        req = req.send(body);
    }

    return req;
};

function addStatusTests(cases) {
    for (const item of cases) {
        test(item.name, async () => {
            const response = await call(
                item.method ?? 'get',
                item.path,
                {
                    body: item.body,
                    cookie: item.cookie
                }
            );

            assert.equal(
                response.status,
                item.status,
                `${item.name}: expected HTTP ${item.status}, got ${response.status}; body=${JSON.stringify(response.body)}`
            );

            if (item.check) {
                item.check(response);
            }
        });
    }
}

// ==================================================
// 1. Public routes and unknown URL handling
// ==================================================

test('GET /test returns the expected public text response', async () => {
    const response = await request(app).get('/test');

    assert.equal(response.status, 200);
    assert.equal(response.text, 'Hello, World!');
});

const unknownApiPaths = [
    { path: '/api/not-a-route', status: 404 },
    { path: '/api/invalid-route', status: 404 },
    { path: '/api/invalid/nested', status: 404 },
    { path: '/api/v1/does-not-exist', status: 404 },

    // Authentication middleware executes before route-not-found handling.
    { path: '/api/auth/not-a-route', status: 401 },
    { path: '/api/auth/signup/extra', status: 401 },
    { path: '/api/auth/login/extra', status: 401 },
    { path: '/api/auth/refresh/extra', status: 401 },
    { path: '/api/auth/logout/extra', status: 401 },
    { path: '/api/auth/users/extra', status: 401 },
    { path: '/api/auth/update-password/extra', status: 401 },
    { path: '/api/auth/delete-user', status: 401 },

    { path: '/api/dms/not-a-route', status: 401 },
    { path: '/api/dms/meal', status: 401 },
    { path: '/api/dms/ai', status: 401 },
    { path: '/api/dms/ai/unknown', status: 401 },
    { path: '/api/dms/insert-meal', status: 401 },
    { path: '/api/dms/unknown/child', status: 401 },

    { path: '/api/unknown/resource/1', status: 404 },
    { path: '/api/another/unknown/resource', status: 404 }
];

addStatusTests(
    unknownApiPaths.map(({ path, status }) => ({
        name: `Unknown API path ${path} returns ${status}`,
        method: 'get',
        path,
        status
    }))
);

// ==================================================
// 2. Protected routes reject missing access cookies
// ==================================================

const protectedPaths = [
    ['GET', '/protected', 'get'],
    ['GET', '/api/auth/users', 'get'],
    ['PUT', '/api/auth/update-password', 'put'],
    ['DELETE', '/api/auth/delete-user/someone-else', 'delete'],
    ['POST', '/api/dms/ai/meal-macros', 'post'],
    ['POST', '/api/dms/insertMeal', 'post'],
    ['GET', '/api/dms/anything', 'get'],
    ['POST', '/api/dms/insertMeal/child', 'post']
];

addStatusTests(
    protectedPaths.map(([label, path, method]) => ({
        name: `${label} ${path} rejects a missing access cookie`,
        method,
        path,
        status: 401
    }))
);

// ==================================================
// 3. Protected routes reject invalid access cookies
// ==================================================

const invalidAccessTokens = [
    'not-a-jwt',
    'abc.def',
    'invalid-token',
    'null',
    'undefined',
    'eyJhbGciOiJub25lIn0.eyJ0eXAiOiJhY2Nlc3MifQ.',
    'a.b.c',
    'totally-invalid-token-value'
];

addStatusTests(
    invalidAccessTokens.map((token, i) => ({
        name: `Protected route rejects malformed access token variant ${i + 1}`,
        method: 'get',
        path: '/protected',
        cookie: accessCookie(token),
        status: 401
    }))
);

const expiredAccessToken = jwt.sign(
    {
        id: testUser.id,
        username: testUser.username,
        typ: 'access'
    },
    JWT_ACCESS_SECRET,
    {
        algorithm: 'HS256',
        expiresIn: -10
    }
);

test('Protected route rejects an expired access token', async () => {
    const response = await request(app)
        .get('/protected')
        .set('Cookie', accessCookie(expiredAccessToken));

    assert.equal(response.status, 401);
});

const wrongSecretAccessToken = jwt.sign(
    {
        id: testUser.id,
        username: testUser.username,
        typ: 'access'
    },
    'wrong-secret-for-automated-tests-only',
    {
        algorithm: 'HS256',
        expiresIn: '5m'
    }
);

test('Protected route rejects a token signed with the wrong secret', async () => {
    const response = await request(app)
        .get('/protected')
        .set('Cookie', accessCookie(wrongSecretAccessToken));

    assert.equal(response.status, 401);
});

const refreshTokenUsedAsAccess = signRefresh(testUser);

test('Protected route rejects a refresh token presented as an access token', async () => {
    const response = await request(app)
        .get('/protected')
        .set('Cookie', accessCookie(refreshTokenUsedAsAccess));

    assert.equal(response.status, 401);
});

// ==================================================
// 4. Login validation
// ==================================================

const loginMissingBodies = [
    undefined,
    null,
    {},
    { username: 'alice' },
    { password: 'password123' },
    { username: '', password: 'password123' },
    { username: 'alice', password: '' },
    { username: null, password: 'password123' },
    { username: 'alice', password: null },
    { username: 0, password: 'password123' }
];

addStatusTests(
    loginMissingBodies.map((body, i) => ({
        name: `POST /api/auth/login rejects missing/falsy fields case ${i + 1}`,
        method: 'post',
        path: '/api/auth/login',
        body,
        status: 400
    }))
);

const loginWrongTypeBodies = [
    { username: {}, password: 'password123' },
    { username: [], password: 'password123' },
    { username: 123, password: 'password123' },
    { username: true, password: 'password123' },
    { username: 'alice', password: {} },
    { username: 'alice', password: [] },
    { username: 'alice', password: 123 },
    { username: 'alice', password: true }
];

addStatusTests(
    loginWrongTypeBodies.map((body, i) => ({
        name: `POST /api/auth/login rejects wrong-typed fields case ${i + 1}`,
        method: 'post',
        path: '/api/auth/login',
        body,
        status: 400
    }))
);

// ==================================================
// 5. Signup validation and access-code checks
// ==================================================

const signupMissingBodies = [
    undefined,
    null,
    {},
    { username: 'alice' },
    { password: 'password123' },
    { access_code: 'x' },
    {
        username: '',
        password: 'password123',
        access_code: 'x'
    },
    {
        username: 'alice',
        password: '',
        access_code: 'x'
    },
    {
        username: 'alice',
        password: 'password123',
        access_code: ''
    },
    {
        username: null,
        password: 'password123',
        access_code: 'x'
    }
];

addStatusTests(
    signupMissingBodies.map((body, i) => ({
        name: `POST /api/auth/signup rejects missing fields case ${i + 1}`,
        method: 'post',
        path: '/api/auth/signup',
        body,
        status: 400
    }))
);

const configuredAccessCode = process.env.ACCESS_CODE;

const badAccessCode =
    configuredAccessCode === '__invalid_test_access_code__'
        ? '__invalid_test_access_code__-different'
        : '__invalid_test_access_code__';

const badSignupBodies = [
    {
        username: 'test-no-db-1',
        password: 'password123',
        access_code: badAccessCode
    },
    {
        username: 'test-no-db-2',
        password: 'password123',
        access_code: `${badAccessCode}x`
    },
    {
        username: 'test-no-db-3',
        password: 'password123',
        access_code: 'definitely-wrong'
    },
    {
        username: 'test-no-db-4',
        password: 'password123',
        access_code: '000000000000'
    },
    {
        username: 'test-no-db-5',
        password: 'password123',
        access_code: 'invalid'
    }
].filter((body) => body.access_code !== configuredAccessCode);

addStatusTests(
    badSignupBodies.map((body, i) => ({
        name: `POST /api/auth/signup rejects an incorrect access code case ${i + 1}`,
        method: 'post',
        path: '/api/auth/signup',
        body,
        status: 403
    }))
);

// ==================================================
// 6. Password update validation
// ==================================================

const updateMissingBodies = [
    undefined,
    null,
    {},
    { oldPassword: 'oldpassword' },
    { newPassword: 'newpassword' },
    { oldPassword: '', newPassword: 'newpassword' },
    { oldPassword: 'oldpassword', newPassword: '' },
    { oldPassword: null, newPassword: 'newpassword' },
    { oldPassword: 'oldpassword', newPassword: null },
    { oldPassword: 0, newPassword: 'newpassword' }
];

addStatusTests(
    updateMissingBodies.map((body, i) => ({
        name: `PUT /api/auth/update-password rejects missing fields case ${i + 1}`,
        method: 'put',
        path: '/api/auth/update-password',
        cookie: accessCookie(),
        body,
        status: 400
    }))
);

const updateWrongTypeBodies = [
    { oldPassword: {}, newPassword: 'newpassword' },
    { oldPassword: [], newPassword: 'newpassword' },
    { oldPassword: 123, newPassword: 'newpassword' },
    { oldPassword: true, newPassword: 'newpassword' },
    { oldPassword: 'oldpassword', newPassword: {} },
    { oldPassword: 'oldpassword', newPassword: [] },
    { oldPassword: 'oldpassword', newPassword: 123 },
    { oldPassword: 'oldpassword', newPassword: true }
];

addStatusTests(
    updateWrongTypeBodies.map((body, i) => ({
        name: `PUT /api/auth/update-password rejects wrong-typed fields case ${i + 1}`,
        method: 'put',
        path: '/api/auth/update-password',
        cookie: accessCookie(),
        body,
        status: 400
    }))
);

// ==================================================
// 7. Account deletion ownership
// ==================================================

const otherUsernames = [
    'another-user',
    'admin',
    'root',
    'alice',
    'bob',
    'test-user',
    'test-suite-user-2',
    'someone.else',
    'USER',
    'test-suite-user%20suffix'
];

addStatusTests(
    otherUsernames.map((username, i) => ({
        name: `DELETE /api/auth/delete-user rejects non-owner case ${i + 1}`,
        method: 'delete',
        path: `/api/auth/delete-user/${encodeURIComponent(username)}`,
        cookie: accessCookie(),
        status: 403
    }))
);

// ==================================================
// 8. AI meal-macro validation
// ==================================================
// All cases should fail before Gemini is called.

const invalidMacroBodies = [
    undefined,
    null,
    {},
    { mealData: null },
    { mealData: '' },
    { mealData: {} },
    { mealData: 1 },
    { mealData: false },
    { mealData: [] },
    { mealData: 'rice' },
    { mealData: [null] },
    { mealData: [{}] },
    { mealData: [{ name: 'rice' }] },
    { mealData: [{ name: 'rice', quantity: 1 }] },
    { mealData: [{ quantity: 1, unit: 'cup' }] },
    { mealData: [{ name: 'rice', unit: 'cup' }] },
    { mealData: [{ name: '', quantity: 1, unit: 'cup' }] },
    { mealData: [{ name: 'rice', quantity: null, unit: 'cup' }] },
    { mealData: [{ name: 'rice', quantity: 1, unit: '' }] },
    { mealData: [{ name: 'rice', quantity: 1, unit: null }] }
];

addStatusTests(
    invalidMacroBodies.map((body, i) => ({
        name: `POST /api/dms/ai/meal-macros rejects invalid input case ${i + 1} without Gemini`,
        method: 'post',
        path: '/api/dms/ai/meal-macros',
        cookie: accessCookie(),
        body,
        status: 400
    }))
);

// ==================================================
// 9. Meal insertion validation
// ==================================================

const invalidInsertBodies = [
    undefined,
    null,
    {},
    { meal_type: 'Lunch' },
    { mealData: [], meal_type: 'Lunch' },
    { mealData: null, meal_type: 'Lunch' },
    { mealData: {}, meal_type: 'Lunch' },
    { mealData: 'rice', meal_type: 'Lunch' },
    { mealData: [null], meal_type: '' },
    { mealData: [{ name: 'rice' }], meal_type: '' },
    { mealData: [{ name: 'rice' }], meal_type: null },
    { mealData: [{ name: 'rice' }], meal_type: 1 },
    { mealData: [{ name: 'rice' }], meal_type: {} },
    { mealData: [{ name: 'rice' }], meal_type: [] },
    { mealData: [{ name: 'rice' }], meal_type: '   ' }
];

addStatusTests(
    invalidInsertBodies.map((body, i) => ({
        name: `POST /api/dms/insertMeal rejects invalid route input case ${i + 1} without Gemini`,
        method: 'post',
        path: '/api/dms/insertMeal',
        cookie: accessCookie(),
        body,
        status: 400
    }))
);

const invalidExtraFieldBodies = [
    { meal_type_other: 42 },
    { meal_type_other: {} },
    { meal_type_other: [] },
    { meal_type_other: 'x'.repeat(51) },
    { meal_type_other: 'y'.repeat(80) },
    { eaten_at: 'not-a-date' },
    { eaten_at: '2026-99-99T99:99:99Z' },
    { eaten_at: 'yesterday-ish' },
    { eaten_at: {} },
    { eaten_at: [] },
    { eaten_at: '2026-13-40' }
];

addStatusTests(
    invalidExtraFieldBodies.map((extra, i) => ({
        name: `POST /api/dms/insertMeal rejects invalid optional field case ${i + 1} before DB/Gemini`,
        method: 'post',
        path: '/api/dms/insertMeal',
        cookie: accessCookie(),
        body: {
            mealData: [
                {
                    name: 'rice',
                    quantity: 1,
                    unit: 'cup'
                }
            ],
            meal_type: 'Lunch',
            ...extra
        },
        status: 400
    }))
);

const invalidTokenIdentities = [
    { id: 0, username: 'test-suite-user' },
    { id: -1, username: 'test-suite-user' },
    { id: 'abc', username: 'test-suite-user' },
    { id: 2147483648, username: 'test-suite-user' },
    { id: 1.5, username: 'test-suite-user' },
    { id: null, username: 'test-suite-user' }
];

addStatusTests(
    invalidTokenIdentities.map((identity, i) => ({
        name: `POST /api/dms/insertMeal rejects invalid token user ID case ${i + 1} before DB/Gemini`,
        method: 'post',
        path: '/api/dms/insertMeal',
        cookie: accessCookie(signAccess(identity)),
        body: {
            mealData: [
                {
                    name: 'rice',
                    quantity: 1,
                    unit: 'cup'
                }
            ],
            meal_type: 'Lunch'
        },
        status: 400
    }))
);

// ==================================================
// 10. Refresh token validation
// ==================================================

test('POST /api/auth/refresh rejects a missing refresh cookie', async () => {
    const response = await request(app).post('/api/auth/refresh');

    assert.equal(response.status, 401);
});

const invalidRefreshTokens = [
    'not-a-jwt',
    'abc.def',
    'invalid-refresh',
    'null',
    'undefined',
    'a.b.c',
    'totally-invalid-refresh-value'
];

addStatusTests(
    invalidRefreshTokens.map((token, i) => ({
        name: `POST /api/auth/refresh rejects malformed refresh token case ${i + 1}`,
        method: 'post',
        path: '/api/auth/refresh',
        cookie: refreshCookie(token),
        status: 401
    }))
);

test('POST /api/auth/refresh rejects an access token used as refresh token', async () => {
    const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', refreshCookie(accessToken()));

    assert.equal(response.status, 401);
});

const expiredRefreshToken = jwt.sign(
    {
        id: testUser.id,
        username: testUser.username,
        typ: 'refresh'
    },
    JWT_REFRESH_SECRET,
    {
        algorithm: 'HS256',
        expiresIn: -10
    }
);

test('POST /api/auth/refresh rejects an expired refresh token', async () => {
    const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', refreshCookie(expiredRefreshToken));

    assert.equal(response.status, 401);
});

const wrongSecretRefreshToken = jwt.sign(
    {
        id: testUser.id,
        username: testUser.username,
        typ: 'refresh'
    },
    'wrong-refresh-secret-for-tests-only',
    {
        algorithm: 'HS256',
        expiresIn: '5m'
    }
);

test('POST /api/auth/refresh rejects a token signed with the wrong secret', async () => {
    const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', refreshCookie(wrongSecretRefreshToken));

    assert.equal(response.status, 401);
});

test('POST /api/auth/refresh accepts a valid refresh token and issues an access cookie', async () => {
    const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', refreshCookie(signRefresh(testUser)));

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);

    const setCookie = response.headers['set-cookie'] ?? [];

    assert.ok(
        setCookie.some((cookie) =>
            cookie.startsWith(`${ACCESS_COOKIE}=`)
        ),
        'Expected the response to set an access cookie'
    );
});

// ==================================================
// 11. Logout
// ==================================================

test('POST /api/auth/logout returns success and clears both auth cookies', async () => {
    const response = await request(app).post('/api/auth/logout');

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);

    const setCookie = response.headers['set-cookie'] ?? [];

    assert.ok(
        setCookie.some((cookie) =>
            cookie.startsWith(`${ACCESS_COOKIE}=`)
        )
    );

    assert.ok(
        setCookie.some((cookie) =>
            cookie.startsWith(`${REFRESH_COOKIE}=`)
        )
    );
});

// ==================================================
// 12. Final Gemini/outbound request safety check
// ==================================================

test('Safety check: automated tests made zero outbound fetch calls (including Gemini)', () => {
    assert.equal(
        blockedFetchAttempts,
        0,
        `Expected zero outbound fetch calls; blocked attempts: ${blockedFetchAttempts}`
    );
});