import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
//api docs
import swaggerSpec from './src/apiDocs/swagger.config.js';
import swaggerUi from 'swagger-ui-express';
//middlewares
import verifyToken from './src/middleware/middleware.auth.js'
import requestLogger from './src/middleware/requestLogger.js';
import { notFoundHandler, errorHandler } from './src/middleware/errorHandler.js';
//routes
import authRoutes from './src/routes/auth.routes.js';
import loginRoutes from './src/routes/login.routes.js';
import dmsRoutes from './src/routes/dms.routes.js';
//serve frontend
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIST = path.join(__dirname, '../frontend-react/dist'); // adjust to your folder layout


const app = express();

app.use(requestLogger);
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// ---------- Public routes ----------
app.get('/test', (req, res) => {
    res.send('Hello, World!');
});

//api docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
//------system routes----------
app.use('/api/auth', loginRoutes);
app.use('/api/auth', authRoutes);
//   
app.use('/api/dms', verifyToken, dmsRoutes);

// ---------- Protected routes ----------
// verifyToken is applied per route/router (not globally), so it only guards
// what is listed here and unknown URLs still reach notFoundHandler as 404.
app.get('/protected', verifyToken, (req, res) => {
    res.send('OK');
});
//----------- Serve frontend ----------
// Static files + SPA fallback: after the API routes, BEFORE notFoundHandler
app.use(express.static(FRONTEND_DIST));
//-------handle unknown URLs--------------
app.get('/{*splat}', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();   // unknown API URLs still get a JSON 404
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
});
// ---------- Error handling (must be last, in this order) ----------
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
