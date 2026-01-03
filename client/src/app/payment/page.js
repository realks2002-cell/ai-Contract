"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PaymentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const contractId = searchParams.get('contractId');

    const [status, setStatus] = useState('ready'); // ready, processing, complete, failed
    const [amount, setAmount] = useState('Loading...');

    // In a real app, we would fetch contract details by ID here to show amount.
    // For MVP speed, we'll mock the amount or pass it differently, but fetching is better.
    // I will assume simple flow for now.

    const handlePayment = async () => {
        setStatus('processing');
        try {
            // 1. Request Payment (Get TID)
            const resReq = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/payments/request`, {
                contractId,
                amount: 1000000, // Mock Amount since we didn't fetch contract. ideally contract.amount
                method: 'card'
            });

            if (resReq.data.success) {
                // 2. Simulate User Interaction with PG (Time delay)
                setTimeout(async () => {
                    // 3. Complete Payment/Webhook
                    const resComp = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/payments/complete`, {
                        contractId,
                        pgTid: resReq.data.pgTid,
                        amount: resReq.data.amount,
                        status: 'success',
                        method: 'card'
                    });

                    if (resComp.data.success) {
                        setStatus('complete');
                    } else {
                        setStatus('failed');
                    }
                }, 2000);
            }
        } catch (err) {
            alert('Payment Error');
            setStatus('failed');
        }
    };

    return (
        <div className="container">
            <div className="card">
                <h2>Payment</h2>
                <p>Complete your contract registration.</p>

                <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', margin: '20px 0' }}>
                    <h3>Contract #{contractId}</h3>
                    <p>Total Amount: <strong>{amount !== 'Loading...' ? amount : '₩1,000,000'} (Mock)</strong></p>
                </div>

                {status === 'ready' && (
                    <button className="btn" onClick={handlePayment}>Pay Now (Mock PG)</button>
                )}

                {status === 'processing' && (
                    <div style={{ textAlign: 'center' }}>
                        <p>Contacting PG...</p>
                        <div className="spinner">💳</div>
                    </div>
                )}

                {status === 'complete' && (
                    <div style={{ textAlign: 'center', color: 'green' }}>
                        <h3>Payment Successful!</h3>
                        <p>Your contract has been registered.</p>
                        <button className="btn" style={{ marginTop: '20px' }} onClick={() => router.push('/upload')}>Back to Home</button>
                    </div>
                )}
            </div>
        </div>
    );
}
