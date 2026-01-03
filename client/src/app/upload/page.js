"use client";
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
    const router = useRouter();
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [ocrData, setOcrData] = useState(null); // { name, amount, date }
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [points, setPoints] = useState(0);

    // OCR Result State (Editable)
    const [formData, setFormData] = useState({ party_a: '', party_b: '', amount: '', date: '', summary: '' });

    const summaryRef = useRef(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/');
        } else {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchPoints(parsedUser.id);
        }
    }, []);

    const fetchPoints = async (userId) => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/points/${userId}`);
            if (res.data.success) {
                setPoints(res.data.points);
            }
        } catch (err) {
            console.error('Error fetching points:', err);
        }
    };

    // Auto-resize summary textarea
    useEffect(() => {
        if (summaryRef.current) {
            summaryRef.current.style.height = 'auto';
            summaryRef.current.style.height = summaryRef.current.scrollHeight + 'px';
        }
    }, [formData.summary]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            if (selectedFile.type === 'application/pdf') {
                setPreview('/pdf-icon.png'); // Placeholder or handle specifically
            } else {
                setPreview(URL.createObjectURL(selectedFile));
            }
            setOcrData(null); // Reset previous ocr
        }
    };

    const handleAnalyze = async () => {
        if (!file || !user) return;
        setLoading(true);

        const uploadData = new FormData();
        uploadData.append('contractImage', file);
        uploadData.append('userId', user.id);

        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/ocr/analyze`, uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                setOcrData(res.data);
                setFormData(res.data.data);
                fetchPoints(user.id); // Refresh points after deduction
            } else {
                alert('분석 실패: ' + res.data.message);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || '분석 중 오류가 발생했습니다.';
            alert(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num) => {
        if (!num) return '';
        const value = num.toString().replace(/[^0-9]/g, '');
        return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const handleAmountChange = (e) => {
        const rawValue = e.target.value.replace(/,/g, '');
        setFormData({ ...formData, amount: rawValue });
    };

    const handleConfirm = async () => {
        try {
            // Clean amount (remove commas) just in case, though state stores raw value
            const cleanAmount = formData.amount.toString().replace(/,/g, '');
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/ocr/confirm`, {
                userId: user.id,
                contractData: { ...formData, amount: cleanAmount },
                imageUrl: ocrData.imageUrl
            });

            if (res.data.success) {
                // Navigate to payment with contract ID
                router.push(`/payment?contractId=${res.data.contractId}`);
            }
        } catch (err) {
            alert('Error confirming contract');
        }
    };

    return (
        <div className="container" style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
            padding: '50px',
            marginTop: '40px',
            marginBottom: '40px',
            minHeight: '70vh',
            maxWidth: '800px'
        }}>
            {!ocrData && (
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#333', marginBottom: '10px' }}>계약서 등록</h2>
                    <p style={{ color: '#888', marginBottom: '40px' }}>계약서를 업로드하면 내용이 자동으로 입력됩니다.</p>

                    <div style={{ marginBottom: '40px', border: '2px dashed #eee', padding: '50px', textAlign: 'center', borderRadius: '12px', maxWidth: '100%', margin: '0 auto 40px auto', backgroundColor: '#fafafa' }}>
                        {preview ? (
                            preview === '/pdf-icon.png' ? (
                                <div style={{ padding: '40px', background: '#fff', borderRadius: '12px', border: '1px solid #eee' }}>
                                    <span style={{ fontSize: '56px' }}>📄</span>
                                    <p style={{ marginTop: '15px', fontWeight: '500', color: '#555' }}>{file?.name}</p>
                                </div>
                            ) : (
                                <img src={preview} alt="Contract" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            )
                        ) : (
                            <div style={{ color: '#aaa' }}>
                                <span style={{ fontSize: '48px', display: 'block', marginBottom: '10px' }}>📤</span>
                                <p>업로드할 파일을 선택하거나 드래그하세요</p>
                            </div>
                        )}
                        <input
                            type="file"
                            onChange={handleFileChange}
                            style={{ marginTop: '30px', fontSize: '14px' }}
                            accept="image/*,application/pdf"
                        />
                    </div>

                    <button className="btn" style={{ maxWidth: '300px', margin: '0 auto' }} onClick={handleAnalyze} disabled={loading || !file}>
                        {loading ? 'AI 분석 중...' : '계약서 분석하기'}
                    </button>

                    <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f5ff', borderRadius: '12px', display: 'inline-block', minWidth: '300px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ fontSize: '15px', fontWeight: '600', color: '#0046ff', margin: 0 }}>
                                내 보유 포인트: <span style={{ fontSize: '20px' }}>{points.toLocaleString()}</span> P
                            </p>
                            <span
                                onClick={() => user && fetchPoints(user.id)}
                                style={{ cursor: 'pointer', fontSize: '11px', color: '#888', textDecoration: 'underline' }}
                            >
                                새로고침
                            </span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px', marginBottom: 0 }}>
                            * 계약서 분석 1회 진행 시 100포인트가 차감됩니다.
                        </p>
                    </div>

                    {loading && (
                        <div style={{ textAlign: 'center', marginTop: '30px', color: '#0046ff', fontWeight: '600' }}>
                            <span className="spinner" style={{ marginRight: '10px' }}>🔄</span>
                            문서를 정교하게 분석하고 있습니다...
                        </div>
                    )}
                </div>
            )}

            {ocrData && (
                <div className="animate-fade-in">
                    <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#333', marginBottom: '30px', borderBottom: '2px solid #f0f0f0', paddingBottom: '20px' }}>계약서 분석 결과</h2>

                    {/* Raw Text - Collapsible */}
                    <details style={{ marginBottom: '35px', backgroundColor: '#fcfcfc', borderRadius: '12px', overflow: 'hidden', border: '1px solid #f0f0f0' }}>
                        <summary style={{ padding: '18px', cursor: 'pointer', fontSize: '14px', color: '#888', fontWeight: '500' }}>📄 OCR 원문 데이터 확인 (접기/펼치기)</summary>
                        <div style={{ padding: '20px', fontSize: '13px', lineHeight: '1.7', color: '#666', borderTop: '1px solid #f0f0f0', whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto' }}>
                            {ocrData.fullText}
                        </div>
                    </details>

                    <p style={{ marginBottom: '20px', color: '#666', fontSize: '15px' }}>
                        AI가 추출한 계약 정보입니다. 정확한지 확인해 주세요.
                    </p>

                    {/* Grid Layout for Fields - Document Style */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
                        <div className="input-group">
                            <label style={{ color: '#888', fontSize: '12px', marginBottom: '5px' }}>갑 (Party A)</label>
                            <input
                                value={formData.party_a}
                                onChange={(e) => setFormData({ ...formData, party_a: e.target.value })}
                                style={{
                                    fontWeight: '600',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderBottom: '1px solid #eee',
                                    borderRadius: '0',
                                    fontSize: '18px',
                                    padding: '5px 0',
                                    outline: 'none',
                                    color: '#333'
                                }}
                            />
                        </div>
                        <div className="input-group">
                            <label style={{ color: '#888', fontSize: '12px', marginBottom: '5px' }}>을 (Party B)</label>
                            <input
                                value={formData.party_b}
                                onChange={(e) => setFormData({ ...formData, party_b: e.target.value })}
                                style={{
                                    fontWeight: '600',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderBottom: '1px solid #eee',
                                    borderRadius: '0',
                                    fontSize: '18px',
                                    padding: '5px 0',
                                    outline: 'none',
                                    color: '#333'
                                }}
                            />
                        </div>
                        <div className="input-group">
                            <label style={{ color: '#888', fontSize: '12px', marginBottom: '5px' }}>계약 금액 (원)</label>
                            <input
                                type="text"
                                value={formatNumber(formData.amount)}
                                onChange={handleAmountChange}
                                style={{
                                    fontWeight: '600',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderBottom: '1px solid #eee',
                                    borderRadius: '0',
                                    fontSize: '18px',
                                    padding: '5px 0',
                                    outline: 'none',
                                    color: '#333'
                                }}
                            />
                        </div>
                        <div className="input-group">
                            <label style={{ color: '#888', fontSize: '12px', marginBottom: '5px' }}>계약 일자</label>
                            <input
                                type="text"
                                value={formData.date || ''}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                placeholder="YYYY-MM-DD"
                                style={{
                                    fontWeight: '600',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderBottom: '1px solid #eee',
                                    borderRadius: '0',
                                    fontSize: '18px',
                                    padding: '5px 0',
                                    outline: 'none',
                                    color: '#333'
                                }}
                            />
                        </div>
                    </div>

                    {/* Summary Section - Document Style */}
                    <div className="input-group" style={{ marginTop: '30px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                            <span style={{ fontSize: '24px', marginRight: '10px' }}>📝</span>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', margin: 0 }}>중요사항 요약 및 체크포인트</h3>
                        </div>
                        <textarea
                            ref={summaryRef}
                            style={{
                                width: '100%',
                                overflow: 'hidden', // Hide scrollbar
                                padding: '10px',
                                border: 'none',
                                fontSize: '16px',
                                lineHeight: '1.8',
                                backgroundColor: 'transparent',
                                resize: 'none',
                                outline: 'none',
                                color: '#333',
                                fontFamily: 'inherit'
                            }}
                            value={formData.summary}
                            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                            placeholder="AI가 요약한 내용이 여기에 표시됩니다."
                        />
                    </div>

                </div>
            )}
        </div>
    );
}
