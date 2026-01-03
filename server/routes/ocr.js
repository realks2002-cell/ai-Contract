const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const db = require('../db');

// Multer Setup for Local Uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Google Vision API Config
const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';
const API_KEY = process.env.GOOGLE_VISION_API_KEY;

// OpenAI Config
const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const pdfParse = require('pdf-parse');

router.post('/analyze', upload.single('contractImage'), async (req, res) => {
    const userId = req.body.userId; // Expect userId from frontend

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    try {
        // Check points
        const userResult = await db.query('SELECT points FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const currentPoints = userResult.rows[0].points || 0;
        if (currentPoints < 100) {
            return res.status(403).json({ success: false, message: '포인트가 부족합니다. 충전 후 이용해 주세요.' });
        }

        const filePath = req.file.path;
        const fileBuffer = fs.readFileSync(filePath);
        const imageContent = fileBuffer.toString('base64');
        const isPdf = req.file.mimetype === 'application/pdf';

        console.log(`Analyzing file: ${req.file.originalname} (${req.file.mimetype})`);

        try {
            let fullText = "";
            let parsedData = {}; // Fix for ReferenceError

            if (isPdf) {
                // 1. Try digital text extraction first
                console.log('Attempting digital text extraction...');
                let pdfData;
                try {
                    // Handle different export styles of pdf-parse
                    if (typeof pdfParse === 'function') {
                        pdfData = await pdfParse(fileBuffer);
                    } else if (pdfParse && typeof pdfParse.default === 'function') {
                        pdfData = await pdfParse.default(fileBuffer);
                    } else if (pdfParse && typeof pdfParse.PDFParse === 'function') {
                        pdfData = await pdfParse.PDFParse(fileBuffer);
                    } else {
                        throw new Error('pdf-parse is not a function or missing default/PDFParse export');
                    }
                } catch (pdfErr) {
                    console.warn('pdf-parse failed, falling back to max 5 pages:', pdfErr.message);
                    pdfData = { numpages: 5, text: "" }; // Fallback to 5 pages to ensure we try scanning at least the first chunk
                }

                const numPages = Math.min(pdfData.numpages || pdfData.numPages || pdfData.nPages || 1, 5);
                const digitalText = (pdfData.text || "").trim();

                console.log('--- PDF DEBUG INFO ---');
                console.log('PDF Data Keys:', Object.keys(pdfData));
                console.log('PDF numpagesRaw:', pdfData.numpages);
                console.log('Starting Chunked OCR with pages:', numPages);
                console.log('----------------------');
                console.log('PDF Data Object:', JSON.stringify({ numpages: pdfData.numpages, numPages: pdfData.numPages, nPages: pdfData.nPages, textLength: digitalText.length }));
                console.log(`PDF Metadata: Total Pages detected=${pdfData.numpages || pdfData.numPages || pdfData.nPages}, Limits to=${numPages}`);

                if (digitalText && digitalText.length > 200) {
                    console.log(`Using digital text extraction (${numPages} pages)`);
                    fullText = digitalText;
                } else {
                    console.log(`Scanned PDF detected or minimal text. Starting Chunked OCR (${numPages} pages)...`);
                    // 2. OCR in 5-page chunks (Vision API Limit)
                    const PDF_API_URL = 'https://vision.googleapis.com/v1/files:annotate';
                    const chunks = [];
                    for (let i = 1; i <= numPages; i += 5) {
                        const pageRange = Array.from({ length: Math.min(5, numPages - i + 1) }, (_, index) => i + index);
                        chunks.push(pageRange);
                    }

                    for (const chunk of chunks) {
                        console.log(`Processing PDF chunk: pages ${chunk[0]} - ${chunk[chunk.length - 1]}`);
                        const response = await axios.post(`${PDF_API_URL}?key=${API_KEY}`, {
                            requests: [
                                {
                                    inputConfig: {
                                        content: imageContent,
                                        mimeType: 'application/pdf'
                                    },
                                    features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
                                    pages: chunk
                                }
                            ]
                        });

                        const chunkResponses = response.data.responses[0].responses;
                        if (chunkResponses) {
                            for (const pageRes of chunkResponses) {
                                fullText += (pageRes.fullTextAnnotation?.text || "") + "\n\n";
                            }
                        }
                    }
                }
            } else {
                // Image OCR
                const response = await axios.post(`${VISION_API_URL}?key=${API_KEY}`, {
                    requests: [
                        {
                            image: { content: imageContent },
                            features: [{ type: 'TEXT_DETECTION' }]
                        }
                    ]
                });

                const detections = response.data.responses[0].textAnnotations;
                if (!detections || detections.length === 0) {
                    return res.json({ success: false, message: 'No text detected in image' });
                }
                fullText = detections[0].description;
            }

            if (!fullText) {
                return res.json({ success: false, message: 'Could not extract text from file' });
            }



            try {
                console.log('Sending text to GPT-4o-mini for summary...');
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: `You are a professional contract analyst. Extract the following details from the contract text provided by the user. 
                        Return JSON only with the following keys:
                        - party_a: The name of Party A (갑 or 채권자/임대인 등).
                        - party_b: The name of Party B (을 or 채무자/임차인 등).
                        - amount: The contract amount as a pure number (e.g., 286000000). Note: OCR may misread Korean numbers like '이억' as '이익'. If you see '금 이익 ... 원', interpret it as '이억' (200,000,000).
                        - date: The contract date in YYYY-MM-DD format. If the date is not found or only contains placeholders like '년 월 일', return null.
                        - summary: You are a contract summary specialist ("계약서 전문 요약가"). Please summarize the contract items and write down key checkpoints ("체크포인트"). Provide a detailed summary in Korean.`
                        },
                        {
                            role: "user",
                            content: `Extract details and summarize this contract text:\n\n${fullText}`
                        }
                    ],
                    response_format: { type: "json_object" }
                });

                const gptContent = completion.choices[0].message.content;
                parsedData = JSON.parse(gptContent);
                console.log('GPT Result:', parsedData);

            } catch (gptError) {
                console.error('GPT Error:', gptError);
                // Fallback to Regex if GPT fails
                const nameMatch = fullText.match(/계약자\s*[:]\s*([가-힣]+)/) || fullText.match(/성명\s*[:]\s*([가-힣]+)/);
                const amountMatch = fullText.match(/금액\s*[:]\s*([\d,]+)/) || fullText.match(/([0-9,]+)원/);
                const dateMatch = fullText.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/) || fullText.match(/(\d{4})-(\d{2})-(\d{2})/);

                parsedData = {
                    party_a: nameMatch ? nameMatch[1] : '',
                    party_b: '',
                    amount: amountMatch ? amountMatch[1].replace(/,/g, '') : '',
                    date: dateMatch ? (dateMatch[0].replace(/[년월일]/g, '-').replace(/\s/g, '')) : null,
                    summary: '자동 요약 실패 (GPT Error)'
                };
            }

            const imageUrl = `http://localhost:${process.env.PORT || 8000}/${filePath.replace(/\\/g, '/')}`;

            // Deduct points after successful analysis
            await db.query('UPDATE users SET points = points - 100 WHERE id = $1', [userId]);

            // AUTO-SAVE: Save result to DB immediately
            let finalDate = parsedData.date;
            if (!finalDate || finalDate === '연도-월-일' || finalDate === '') {
                finalDate = null;
            }

            const saveResult = await db.query(
                'INSERT INTO contracts (user_id, image_url, ocr_data, contract_name, contract_amount, contract_date, contract_summary) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
                [userId, imageUrl, parsedData, `${parsedData.party_a || '신규'} - ${parsedData.party_b || '계약'}`, parsedData.amount || 0, finalDate, parsedData.summary]
            );

            res.json({
                success: true,
                data: parsedData,
                fullText: fullText,
                imageUrl: imageUrl,
                contractId: saveResult.rows[0].id,
                tempFilePath: filePath // Logic to cleanup later
            });

        } catch (error) {
            console.error('OCR Error:', error.response ? error.response.data : error.message);
            res.status(500).json({ success: false, error: 'OCR processing failed' });
        }
    } catch (err) {
        console.error('Outer OCR Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Save Confirmed Contract
router.post('/confirm', async (req, res) => {
    const { userId, contractData, imageUrl } = req.body;

    try {
        // Handle potentially invalid/null date to avoid Postgres error
        let finalDate = contractData.date;
        if (!finalDate || finalDate === '연도-월-일' || finalDate === '') {
            finalDate = null;
        }

        const result = await db.query(
            'INSERT INTO contracts (user_id, image_url, ocr_data, contract_name, contract_amount, contract_date, contract_summary) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            [userId, imageUrl, contractData, `${contractData.party_a} - ${contractData.party_b} 계약`, contractData.amount || 0, finalDate, contractData.summary]
        );
        res.json({ success: true, contractId: result.rows[0].id });
    } catch (err) {
        console.error('DB Confirm Error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
