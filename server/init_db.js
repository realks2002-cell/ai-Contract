require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDB() {
    try {
        // Create connection without database selected to create it if needed
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            multipleStatements: true
        });

        console.log('Connected to MySQL server.');

        // For dev: drop db if exists to reset schema (optional, but good for this fix)
        // Or just Drop tables
        await connection.query('CREATE DATABASE IF NOT EXISTS ocr_payment_db');
        await connection.query('USE ocr_payment_db');
        await connection.query('DROP TABLE IF EXISTS payments');
        await connection.query('DROP TABLE IF EXISTS contracts');
        await connection.query('DROP TABLE IF EXISTS users');

        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        await connection.query(schema);
        console.log('Database and tables created successfully.');

        await connection.end();
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initDB();
