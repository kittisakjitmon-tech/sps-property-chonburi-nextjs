import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import { FirebaseProvider } from "@/lib/providers/FirebaseProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const prompt = Prompt({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-prompt",
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sps-property-nextjs.vercel.app";

export const metadata: Metadata = {
  title: "SPS Property Solution",
  description: "บริการรับฝาก ซื้อ-ขาย-เช่า-จำนอง-ขายฝาก อสังหาริมทรัพย์ในชลบุรี ฉะเชิงเทรา ระยอง",
  keywords: ["บ้าน", "คอนโด", "อมตะซิตี้", "ชลบุรี", "ซื้อบ้าน", "ขายบ้าน", "เช่าบ้าน"],
  openGraph: {
    title: "SPS Property Solution",
    description: "บริการรับฝาก ซื้อ-ขาย-เช่า-จำนอง-ขายฝาก อสังหาริมทรัพย์ในชลบุรี ฉะเชิงเทรา ระยอง",
    locale: "th_TH",
    type: "website",
    images: [
      {
        url: `${BASE_URL}/logo.png`,
        width: 1200,
        height: 630,
        alt: "SPS Property Solution",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SPS Property Solution",
    description: "บริการรับฝาก ซื้อ-ขาย-เช่า-จำนอง-ขายฝาก อสังหาริมทรัพย์ในชลบุรี ฉะเชิงเทรา ระยอง",
    images: [`${BASE_URL}/logo.png`],
  },
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
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </FirebaseProvider>
      </body>
    </html>
  );
}
