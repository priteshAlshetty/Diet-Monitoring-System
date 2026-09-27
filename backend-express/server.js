import app from './app.js';
import 'dotenv/config';
const PORT = process.env.PORT || 3300;
const IP = process.env.IP || 'localhost';

const server = app.listen(PORT, IP, () => {
    console.log(`Server is running on  ${IP}:${PORT}`);
    console.log(`api docs are running on ${IP}:${PORT}/api-docs`)
})
