"use client";
import { useState, useEffect } from 'react';

export default function AdminPage() {
    const [stats, setStats] = useState({ members: 120, totalAmount: '150,000,000' });
    const [contracts, setContracts] = useState([
        { id: 1, name: '홍길동', amount: '1,000,000', status: 'Approved', date: '2025-01-02' },
        { id: 2, name: '이순신', amount: '5,500,000', status: 'Pending', date: '2025-01-03' },
    ]);

    return (
        <div className="container" style={{ MaxWidth: '800px' }}>
            <div className="card">
                <h2>Admin Dashboard</h2>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                    <div style={{ flex: 1, padding: '20px', background: '#f0f4ff', borderRadius: '8px' }}>
                        <h4>Total Members</h4>
                        <h2>{stats.members}</h2>
                    </div>
                    <div style={{ flex: 1, padding: '20px', background: '#fff0f0', borderRadius: '8px' }}>
                        <h4>Total Amount</h4>
                        <h2>₩{stats.totalAmount}</h2>
                    </div>
                </div>

                <h3>Recent Contracts</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                            <th style={{ padding: '10px' }}>ID</th>
                            <th style={{ padding: '10px' }}>Name</th>
                            <th style={{ padding: '10px' }}>Amount</th>
                            <th style={{ padding: '10px' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contracts.map(c => (
                            <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '10px' }}>{c.id}</td>
                                <td style={{ padding: '10px' }}>{c.name}</td>
                                <td style={{ padding: '10px' }}>₩{c.amount}</td>
                                <td style={{ padding: '10px' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        background: c.status === 'Approved' ? '#e6fffa' : '#fff5f5',
                                        color: c.status === 'Approved' ? '#00ebc7' : '#ff0000'
                                    }}>
                                        {c.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
