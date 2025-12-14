import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from 'sonner';
import { generateWebSiteSchema, generateWebApplicationSchema, generateOrganizationSchema } from "@/lib/structured-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

const SITE_URL = 'https://functions.codes';
const SITE_NAME = 'functions.codes';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "functions.codes - Ad-Free Tools for Humans",
    template: "%s | functions.codes"
  },
  description: "Free online tools without 47 popup ads. Built by a broke developer who got tired of sketchy tool sites. 100% client-side, zero tracking, maximum vibes.",
  keywords: [
    'free online tools',
    'ad-free tools',
    'file converter',
    'background remover',
    'image compressor',
    'QR code generator',
    'JSON formatter',
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
    'no tracking',
    'developer tools',
    'web tools'
  ],
  authors: [{ name: 'functions.codes' }],
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
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'functions.codes - Ad-Free Tools for Humans',
    description: 'Free online tools without ads. File converter, background remover, image compressor, and more. 100% client-side, zero tracking.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'functions.codes - Ad-Free Tools for Humans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'functions.codes - Ad-Free Tools for Humans',
    description: 'Free online tools without ads. File converter, background remover, image compressor, and more. 100% client-side, zero tracking.',
    images: ['/og-image.png'],
    creator: '@functionscodes',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.ico',
  },
  manifest: '/manifest.json',
  verification: {
    // Add your verification codes here when you set up Google Search Console, Bing Webmaster Tools, etc.
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Structured Data */}
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
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Navbar />
        <main className="flex-grow pt-16">
          {children}
        </main>
        <Footer />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
