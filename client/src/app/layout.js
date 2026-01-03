import './globals.css'

export const metadata = {
    title: 'AI 계약서 분석 & 결제',
    description: 'AI를 활용한 스마트 계약서 OCR 분석 및 통합 결제 서비스',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
    manifest: '/manifest.json',
    themeColor: '#0046ff',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'AI계약서',
    },
}

export default function RootLayout({ children }) {
    return (
        <html lang="ko">
            <body>{children}</body>
        </html>
    )
}
