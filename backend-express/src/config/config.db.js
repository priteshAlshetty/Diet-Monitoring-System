import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

//posgress
const pg_pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
    timezone: 'Asia/Kolkata'
});




export default pg_pool;

