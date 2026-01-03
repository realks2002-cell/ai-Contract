const mysql = require('mysql2/promise');

async function checkRemoteDB() {
    try {
        const connection = await mysql.createConnection({
            host: 'bizstart.shop',
            user: 'realks33',
            password: 'Ks200200'
        });

        console.log('Connected to Remote DB!');
        const [rows] = await connection.query('SHOW DATABASES');
        console.log('Databases:', rows);

        await connection.end();
    } catch (error) {
        console.error('Remote DB Connection Failed:', error.message);
    }
}

checkRemoteDB();
