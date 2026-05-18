import { Barlow, Barlow_Condensed } from 'next/font/google'
import './globals.css'
import { Provider } from 'app/provider'
import { ClientLayout } from './layout-client'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Phủi Score | Nền tảng tỉ số bóng đá phủi hàng đầu Việt Nam',
  description: 'Cập nhật trực tiếp kết quả, bảng xếp hạng và tin tức các giải bóng đá phủi HPL, SPL và nhiều giải đấu phong trào khác.',
  icons: {
    icon: '/favicon.ico', // Đảm bảo bạn có file này trong thư mục public
  }
}

const barlow = Barlow({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-barlow',
})

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-barlow-condensed',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      className={`${barlow.variable} ${barlowCondensed.variable} ${barlow.className}`}
      style={{ backgroundColor: '#0a0f0d' }}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{ __html: `
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  surface: '#000000',
                  primary: '#00FF66',
                  'on-primary': '#000000',
                  'outline-variant': '#222222',
                  'on-surface-variant': '#A0A0A0',
                  'surface-container-lowest': '#050505',
                  'surface-container-low': '#0A0A0A',
                  'surface-container': '#111111',
                  'surface-container-high': '#1A1A1A',
                  'surface-container-highest': '#222222',
                  'on-surface': '#FFFFFF',
                  error: '#FF4444'
                },
                fontFamily: {
                  heading: ['Inter', 'sans-serif'],
                  body: ['Inter', 'sans-serif'],
                }
              }
            }
          }
        `}} />
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            font-family: 'Inter', sans-serif;
          }
          .stadium-bg {
            background-image: radial-gradient(circle at 50% 50%, rgba(0, 255, 102, 0.05) 0%, rgba(0, 0, 0, 1) 100%);
          }
          .glass-panel {
            background-color: rgba(10, 10, 10, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .glass-card {
            background-color: rgba(17, 17, 17, 0.9);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.08);
          }
          .sidebar-active {
            background: linear-gradient(90deg, rgba(0, 255, 102, 0.15) 0%, rgba(0, 0, 0, 0) 100%);
            border-left: 3px solid #00FF66;
          }
        `}} />
      </head>
      <body style={{
        backgroundColor: '#0a0f0d',
        margin: 0,
        minHeight: '100vh',
        fontFamily: 'var(--font-barlow), sans-serif',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      }}>
        <style dangerouslySetInnerHTML={{ __html: `
          h1, h2, h3, h4, h5, h6, .display {
            font-family: var(--font-barlow-condensed), sans-serif !important;
          }
          button, input, select, textarea {
            font-family: var(--font-barlow), sans-serif !important;
          }
        `}} />
        <Provider defaultTheme="dark">
          <ClientLayout>
            <meta name="referrer" content="no-referrer" />
        {children}
          </ClientLayout>
        </Provider>
      </body>
    </html>
  )
}
