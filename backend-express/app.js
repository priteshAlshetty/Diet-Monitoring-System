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


const app = express();

app.use(requestLogger);
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// ---------- Public routes ----------
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

//api docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', loginRoutes);
// TODO(security): this router is still public. To protect it, change to:
//   app.use('/api/dms', verifyToken, dmsRoutes);
app.use('/api/dms', dmsRoutes);

// ---------- Protected routes ----------
// verifyToken is applied per route/router (not globally), so it only guards
// what is listed here and unknown URLs still reach notFoundHandler as 404.
app.get('/protected', verifyToken, (req, res) => {
    res.send('OK');
});
app.use('/api/auth', verifyToken, authRoutes);

// ---------- Error handling (must be last, in this order) ----------
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
