const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');

// Request Payment - Crypto Update
router.post('/request', async (req, res) => {
    const { contractId, amount, method } = req.body;

    // Simulate PG Token generation / Pre-validation
    // Check if contract exists and amount matches
    try {
        const result = await db.query('SELECT * FROM contracts WHERE id = $1', [contractId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Contract not found' });
        }

        // Return a mock PG Transaction ID
        const pgTid = 'PG_' + crypto.randomUUID();

        res.json({
            success: true,
            pgTid: pgTid,
            amount: amount,
            merchantUid: `mid_${contractId}_${Date.now()}`
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Complete Payment (Mock Webhook/Callback from PG)
router.post('/complete', async (req, res) => {
    const { contractId, pgTid, amount, status, method } = req.body;

    try {
        const result = await db.query(
            'INSERT INTO payments (contract_id, pg_tid, amount, method, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [contractId, pgTid, amount, method, status]
        );

        // Update Contract Status and User Points
        if (status === 'success') {
            await db.query('UPDATE contracts SET status = $1 WHERE id = $2', ['approved', contractId]);

            // Get user_id from contract
            const contractRes = await db.query('SELECT user_id FROM contracts WHERE id = $1', [contractId]);
            if (contractRes.rows.length > 0) {
                const userId = contractRes.rows[0].user_id;
                const pointsToEarn = Math.floor((amount / 10) * 100);
                await db.query('UPDATE users SET points = points + $1 WHERE id = $2', [pointsToEarn, userId]);
            }
        }

        res.json({ success: true, paymentId: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
