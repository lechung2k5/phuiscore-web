import { Barlow, Barlow_Condensed } from 'next/font/google'
import { Provider } from 'app/provider'
import { ClientLayout } from './layout-client'

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
            {children}
          </ClientLayout>
        </Provider>
      </body>
    </html>
  )
}
