import '../app/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from '@/contexts/AuthContext';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Xseize | Build Enterprise Grade Custom AI Agents',
  description: 'Get started with building custom Conversational AI Agents powered by Wow\'s No/Low Code Builder',
  openGraph: {
    type: 'website',
    title: 'Build Enterprise Grade Custom AI Agents | Wow',
    description: 'Get started with building custom Conversational AI Agents powered by Wow\'s No/Low Code Builder',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Wow AI Agents',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Build Enterprise Grade Custom AI Agents | Wow',
    description: 'Get started with building custom Conversational AI Agents powered by Wow\'s No/Low Code Builder',
    images: ['/og.png'],
  },
  icons: {
    icon: '/iconimg.png',
    shortcut: '/iconimg.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Load Razorpay checkout script globally */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="beforeInteractive"
        />
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
          <AuthProvider>
            {children}
            
          </AuthProvider>
          </ThemeProvider>
      </body>
    </html>
  );
}