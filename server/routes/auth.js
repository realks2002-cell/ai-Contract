const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid'); // Mock CI generator

// MOCK PASS Certification Step
router.post('/pass-cert', (req, res) => {
    // Simulate PASS API call
    const mockCI = uuidv4();
    const mockDI = uuidv4();

    res.json({
        success: true,
        message: 'PASS Certification Successful (Mock)',
        data: {
            pass_ci: mockCI,
            pass_di: mockDI,
            name: '홍길동', // Mock Name
            phone: '010-1234-5678'
        }
    });
});

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Reuse 'email' column for username/ID
        const result = await db.query('SELECT * FROM users WHERE email = $1', [username]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            // In production, compare hashed password
            if (password === user.password_hash) {
                res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role, points: user.points || 0 } });
            } else {
                res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Register
router.post('/register', async (req, res) => {
    const { email, password, name, pass_ci, pass_di } = req.body;

    try {
        const result = await db.query(
            'INSERT INTO users (email, password_hash, name, pass_ci, pass_di) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [email, password, name, pass_ci, pass_di]
        );
        res.json({ success: true, userId: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get user points
router.get('/points/:id', async (req, res) => {
    try {
        const result = await db.query('SELECT points FROM users WHERE id = $1', [req.params.id]);
        if (result.rows.length > 0) {
            res.json({ success: true, points: result.rows[0].points || 0 });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
