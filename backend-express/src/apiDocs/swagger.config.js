
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

All protected routes require a valid JWT passed via the request header:

\`\`\`
Authorization: Bearer <token>
\`\`\`

Use the **Authorize** button above to set your token once, and it'll be applied automatically to all protected requests below.
           
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
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            { bearerAuth: [] }
        ],
    },
    apis: ['./src/apiDocs/*.docs.js'], //path for swagger comments files
};

export default swaggerJSDoc(options);