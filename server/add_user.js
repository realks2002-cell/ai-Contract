require('dotenv').config();
const { Pool } = require('pg');

async function addUser() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    const email = 'realks22@naver.com';
    const password = 'Ks2002!!';
    const name = 'Real KS';

    try {
        console.log(`Adding user ${email} to Supabase...`);

        // Check if user exists
        const checkRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (checkRes.rows.length > 0) {
            console.log('User already exists. Updating password...');
            await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [password, email]);
            console.log('User updated successfully.');
        } else {
            await pool.query(
                'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4)',
                [email, password, name, 'admin']
            );
            console.log('User added successfully.');
        }

        await pool.end();
    } catch (err) {
        console.error('Failed to add user:', err.message);
        process.exit(1);
    }
}

addUser();
