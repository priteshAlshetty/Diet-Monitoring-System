import 'dotenv/config';
import app from './app.js';
import pool from './src/config/config.db.js';
import logger from './src/utils/logger.js';

const PORT = process.env.PORT || 3300;
const IP = process.env.IP || 'localhost';
const SHUTDOWN_TIMEOUT_MS = Number(process.env.SHUTDOWN_TIMEOUT_MS) || 10_000;

let server;
let shuttingDown = false;

const describe = (error) => ({
    errorName: error?.name,
    errorMessage: error?.message ?? String(error),
    errorCode: error?.code,
    stack: error?.stack
});

/**
 * Exit only after winston has written its buffered logs,
 * otherwise the last (most important) log lines can be lost.
 */
function exitAfterFlush(code) {
    process.exitCode = code;
    logger.on('finish', () => process.exit(code));
    logger.end();
    setTimeout(() => process.exit(code), 2000).unref(); // fallback if 'finish' never fires
}

/**
 * Graceful shutdown: stop accepting requests, let in-flight ones finish,
 * close the DB pool, then exit. Force-exits if that takes too long.
 */
async function shutdown(reason, exitCode = 0) {
    if (shuttingDown) {
        return;
    }
    shuttingDown = true;
    logger.info('shutting down', { reason, exitCode });

    // Safety net: a hung request must not keep the process alive forever.
    setTimeout(() => {
        logger.error('graceful shutdown timed out, forcing exit');
        exitAfterFlush(1);
    }, SHUTDOWN_TIMEOUT_MS).unref();

    if (server?.listening) {
        try {
            await new Promise((resolve, reject) => {
                server.close((error) => (error ? reject(error) : resolve()));
                server.closeIdleConnections?.(); // drop idle keep-alive sockets so close() can finish
            });
        } catch (error) {
            logger.error('error while closing http server', describe(error));
        }
    }

    try {
        await pool.end();
    } catch (error) {
        logger.error('error while closing database pool', describe(error));
    }

    exitAfterFlush(exitCode);
}

// ---- Process-level safety nets (registered first so startup is covered too) ----

// A promise rejected with nobody handling it (e.g. in background code, not in a route:
// Express 5 already forwards route rejections to errorHandler).
process.on('unhandledRejection', (reason) => {
    logger.error('unhandledRejection', describe(reason));
    shutdown('unhandledRejection', 1);
});

// A thrown error nobody caught. The process state is unknown after this, so the
// standard practice is: log it, exit, and let the process manager (pm2 / systemd /
// docker restart policy) start a fresh instance.
process.on('uncaughtException', (error) => {
    logger.error('uncaughtException', describe(error));
    shutdown('uncaughtException', 1);
});

// Ctrl+C and normal stop signals (note: Windows only delivers SIGINT).
process.on('SIGINT', () => shutdown('SIGINT', 0));
process.on('SIGTERM', () => shutdown('SIGTERM', 0));

async function start() {
    // Fail fast with a clear message if the database is unreachable,
    // instead of starting a server where every request returns 503.
    try {
        await pool.query('SELECT 1');
        logger.info('database connection verified');
    } catch (error) {
        logger.error('cannot connect to database at startup', describe(error));
        return shutdown('startup failure', 1);
    }

    // Express 5 also passes startup errors (EADDRINUSE, EACCES, ...) to this callback.
    server = app.listen(PORT, IP, (error) => {
        if (error) {
            logger.error(
                error.code === 'EADDRINUSE'
                    ? `port ${PORT} is already in use`
                    : 'failed to start http server',
                describe(error)
            );
            return shutdown('startup failure', 1);
        }

        logger.info(`server is running on 127.0.0.1:${PORT}`);
        logger.info(`api docs are running on 127.0.0.1:${PORT}/api-docs`);
    });
}

start();
