import 'dotenv/config';
import pg from 'pg';
import logger from '../utils/logger.js';
const { Pool } = pg;

//postgres
const pg_pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 5432,
    application_name: 'dms-backend',

    // ---- Pool limits & timeouts ----
    max: Number(process.env.DB_POOL_MAX) || 10,
    idleTimeoutMillis: 30_000,
    // Without this, pool.connect() waits FOREVER when every connection is busy,
    // which hangs the HTTP request. With it, the call fails and the request gets a 503.
    connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS) || 5_000,
    // Server-side limit: Postgres cancels any single statement running longer than this.
    statement_timeout: Number(process.env.DB_STATEMENT_TIMEOUT_MS) || 15_000,
    // Client-side backstop (must be larger than statement_timeout).
    query_timeout: Number(process.env.DB_QUERY_TIMEOUT_MS) || 20_000,
    keepAlive: true,

    // `timezone` is not a pg option, so the old `timezone: 'Asia/Kolkata'` was silently ignored.
    // This sets the real session timezone (it affects to_char() output on timestamptz columns).
    options: `-c timezone=${process.env.DB_TIMEZONE || 'Asia/Kolkata'}`,
});

// An IDLE client in the pool can error at any time (DB restart, network drop, admin kill).
// pg emits that on the pool, and with NO listener Node treats it as an uncaught
// exception and kills the whole server. The pool removes the dead client by itself,
// so logging is all that is needed here.
pg_pool.on('error', (error) => {
    logger.error('unexpected error on idle database client', {
        errorMessage: error.message,
        errorCode: error.code
    });
});

export default pg_pool;
