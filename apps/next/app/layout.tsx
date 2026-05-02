import { Barlow, Barlow_Condensed } from 'next/font/google'
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
