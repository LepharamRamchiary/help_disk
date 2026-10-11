import type {Metadata} from 'next';
import {Plus_Jakarta_Sans, JetBrains_Mono} from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'HelpDesk - Enterprise Customer Support SaaS',
  description:
    'Multi-tenant customer support, ticketing, SLA monitoring, and analytics platform built with an emerald-green design system.',
  openGraph: {
    title: 'HelpDesk - Enterprise Customer Support SaaS',
    description:
      'Multi-tenant customer support, ticketing, SLA monitoring, and analytics platform built with an emerald-green design system.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HelpDesk - Enterprise Customer Support SaaS',
    description:
      'Multi-tenant customer support, ticketing, SLA monitoring, and analytics platform built with an emerald-green design system.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="bg-[#F8FAFC] text-[#111827] antialiased selection:bg-[#ECFDF5] selection:text-[#047857]"
      >
        {children}
      </body>
    </html>
  );
}

