-- OCR Contract & Payment System Schema

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    pass_ci VARCHAR(255), -- PASS Certification ID
    pass_di VARCHAR(255), -- PASS Duplication Info
    account_number VARCHAR(100), -- Encrypted or masked in practice
    role VARCHAR(20) DEFAULT 'user', -- 'user' or 'admin'
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contracts Table
CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    image_url TEXT,
    ocr_data JSONB, -- Stores full OCR result
    contract_name VARCHAR(255), -- Extracted or Edited Title
    contract_amount DECIMAL(15, 2), -- Confirmed Amount
    contract_date DATE, -- Confirmed Date
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER REFERENCES contracts(id),
    pg_tid VARCHAR(255), -- PG Transaction ID
    amount DECIMAL(15, 2) NOT NULL,
    method VARCHAR(50), -- card, vbank, etc.
    status VARCHAR(20) DEFAULT 'pending', -- pending, success, failed, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inquiries Table
CREATE TABLE inquiries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    answer TEXT,
    status VARCHAR(20) DEFAULT 'open', -- open, answered
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
