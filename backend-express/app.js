import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
//api docs
import swaggerSpec from './src/apiDocs/swagger.config.js';
import swaggerUi from 'swagger-ui-express';
//middlewares
import verifyToken from './src/middleware/middleware.auth.js'
import requestLogger from './src/middleware/requestLogger.js';
//routes
import authRoutes from './src/routes/auth.routes.js';
import loginRoutes from './src/routes/login.routes.js';
import dmsRoutes from './src/routes/dms.routes.js';


const app = express();

app.use(requestLogger);
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

//api docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', loginRoutes);
app.use('/api/dms', dmsRoutes);
app.use(verifyToken);
app.get('/protected', (req, res) => {

    console.log('inside protected')
    res.send("OK");
})
app.use('/api/auth', authRoutes);

export default app;