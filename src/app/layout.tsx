import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import { FirebaseProvider } from "@/lib/providers/FirebaseProvider";
import { CONTACT } from "@/constants/contact";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import "./globals.css";

const prompt = Prompt({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-prompt",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | บ้าน คอนโด อมตะซิตี้ ชลบุรี`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    title: `${SITE_NAME} | บ้าน คอนโด อมตะซิตี้ ชลบุรี`,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    locale: "th_TH",
    type: "website",
    images: [
      {
        url: '/logo.png',
        width: 1080,
        height: 658,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | บ้าน คอนโด อมตะซิตี้ ชลบุรี`,
    description: SITE_DESCRIPTION,
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
};

const businessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  '@id': `${SITE_URL}/#business`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl('/logo.png'),
  description: SITE_DESCRIPTION,
  email: CONTACT.email,
  areaServed: ['ชลบุรี', 'ฉะเชิงเทรา', 'ระยอง', 'ปทุมธานี', 'กรุงเทพมหานคร'],
  sameAs: [CONTACT.facebookUrl],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className={`${prompt.variable} font-sans min-h-full flex flex-col`}>
        <FirebaseProvider>
          <JsonLd data={businessJsonLd} />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </FirebaseProvider>
      </body>
    </html>
  );
}
