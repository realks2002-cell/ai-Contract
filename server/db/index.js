const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Set Timezone to Asia/Seoul for every new connection
pool.on('connect', (client) => {
    client.query("SET TIME ZONE 'Asia/Seoul'");
});

module.exports = {
    query: async (text, params) => {
        try {
            const result = await pool.query(text, params);
            return result;
        } catch (err) {
            console.error('Database Query Error:', err);
            throw err;
        }
    },
    pool
};
