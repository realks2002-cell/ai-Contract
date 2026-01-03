const db = require('./server/db');

async function checkLatestContract() {
    try {
        const result = await db.query('SELECT * FROM contracts ORDER BY created_at DESC LIMIT 1');
        if (result.rows.length > 0) {
            console.log('Latest Contract:', result.rows[0]);
        } else {
            console.log('No contracts found.');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkLatestContract();
