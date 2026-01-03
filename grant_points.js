const db = require('./server/db');

async function grantPoints() {
    try {
        console.log('Granting 10,000 points to all users...');
        const result = await db.query('UPDATE users SET points = points + 10000');
        console.log(`Successfully granted points to ${result.rowCount} users.`);
    } catch (err) {
        console.error('Failed to grant points:', err.message);
    } finally {
        process.exit();
    }
}

grantPoints();
