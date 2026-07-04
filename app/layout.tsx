import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans_Thai, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CommandPalette from "@/components/CommandPalette";
import MotionProvider from "@/components/MotionProvider";
import { Toaster } from 'sonner';
import { generateWebSiteSchema, generateWebApplicationSchema, generateOrganizationSchema } from "@/lib/structured-data";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";

const SITE_URL = 'https://functions.codes';
const SITE_NAME = 'functions.codes';

// Self-hosted at build time — no runtime requests to Google
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
});
const plexThai = IBM_Plex_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['200', '300', '400', '500', '600', '700'],
  variable: '--font-plex-thai',
  display: 'swap',
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#14213d' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "functions.codes — เครื่องมือออนไลน์ฟรี ใช้ในเบราว์เซอร์",
    template: "%s | functions.codes"
  },
  description: "รวมเครื่องมือออนไลน์ฟรี ใช้งานในเบราว์เซอร์ ไม่มีโฆษณา ไม่ต้องสมัครสมาชิก สำหรับนักเรียน นักศึกษา ครู และคนทำงานทุกสาย",
  keywords: [
    'เครื่องมือออนไลน์ฟรี',
    'แปลงไฟล์',
    'ลบพื้นหลังรูป',
    'บีบอัดรูป',
    'สร้าง QR Code',
    'JSON formatter',
    'free online tools',
    'ad-free tools',
    'file converter',
    'background remover',
    'image compressor',
    'QR code generator',
    'password generator',
    'color palette',
    'lorem ipsum',
    'diff viewer',
    'unit converter',
    'PDF tools',
    'audio editor',
    'markdown editor',
    'client-side tools',
    'privacy-focused tools',
  ],
  authors: [{ name: 'Natthanarong Tiangjit' }],
  creator: 'functions.codes',
  publisher: 'functions.codes',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    alternateLocale: ['en_US'],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'functions.codes — เครื่องมือออนไลน์ฟรี',
    description: 'รวมเครื่องมือออนไลน์ฟรี ใช้ในเบราว์เซอร์ ไม่มีโฆษณา เป็นส่วนตัว',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'functions.codes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'functions.codes — เครื่องมือออนไลน์ฟรี',
    description: 'รวมเครื่องมือออนไลน์ฟรี ใช้ในเบราว์เซอร์ ไม่มีโฆษณา เป็นส่วนตัว',
    images: ['/og-image.png'],
    creator: '@functionscodes',
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const webSiteSchema = generateWebSiteSchema();
  const webAppSchema = generateWebApplicationSchema();
  const orgSchema = generateOrganizationSchema();

  return (
    <html lang="th" suppressHydrationWarning className={`${inter.variable} ${plexThai.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="antialiased min-h-screen flex flex-col bg-[var(--color-base)] text-[var(--color-ink)] thai-tight"
      >
        <LanguageProvider>
          <MotionProvider>
          <Navbar />
          <CommandPalette />
          <main className="flex-grow pt-16">
            {children}
          </main>
          <Footer />
          <Toaster
            richColors
            position="top-center"
            toastOptions={{
              style: {
                fontFamily: 'var(--font-sans)',
                background: '#14213d',
                color: '#ffffff',
                border: '1px solid #000000',
                borderRadius: '14px',
              },
            }}
          />
          </MotionProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
