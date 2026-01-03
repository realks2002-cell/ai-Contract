"use client";
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function Home() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Connecting to Backend API
            const res = await axios.post('http://localhost:8000/api/auth/login', {
                username, // Send username instead of email
                password
            });

            if (res.data.success) {
                localStorage.setItem('user', JSON.stringify(res.data.user));
                router.push('/upload');
            }
        } catch (err) {
            alert('로그인 실패: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center' }}>
            <div className="card" style={{ textAlign: 'center' }}>
                <h1 style={{ marginBottom: '20px', color: '#0046ff' }}>FinSign</h1>
                <p style={{ marginBottom: '30px', color: '#666' }}>안전한 전자계약 & 결제 시스템</p>

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="아이디"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <input
                            type="password"
                            placeholder="비밀번호"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn" disabled={loading}>
                        {loading ? '로그인 중...' : '안전하게 로그인'}
                    </button>
                </form>

                <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                    <p style={{ fontSize: '14px', marginBottom: '10px' }}>계정이 없으신가요?</p>
                    <button className="btn" style={{ backgroundColor: '#aaa' }} onClick={() => alert("PASS 본인인증 기능은 회원가입 절차에 추가될 예정입니다.")}>
                        PASS 본인인증으로 시작하기
                    </button>
                </div>
            </div>
        </div>
    );
}
