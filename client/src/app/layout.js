import './globals.css'

export const metadata = {
    title: 'OCR Contract & Payment',
    description: 'Integrated Contract Registration and Payment Service',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }) {
    return (
        <html lang="ko">
            <body>{children}</body>
        </html>
    )
}
