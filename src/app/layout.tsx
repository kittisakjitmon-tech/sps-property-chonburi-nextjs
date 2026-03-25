import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import { FirebaseProvider } from "@/lib/providers/FirebaseProvider";
import "./globals.css";

const prompt = Prompt({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-prompt",
});

export const metadata: Metadata = {
  title: "SPS Property Solution",
  description: "บริการรับฝาก ซื้อ-ขาย-เช่า-จำนอง-ขายฝาก อสังหาริมทรัพย์ในชลบุรี ฉะเชิงเทรา ระยอง",
  keywords: ["บ้าน", "คอนโด", "อมตะซิตี้", "ชลบุรี", "ซื้อบ้าน", "ขายบ้าน", "เช่าบ้าน"],
  openGraph: {
    title: "SPS Property Solution",
    description: "บริการรับฝาก ซื้อ-ขาย-เช่า-จำนอง-ขายฝาก อสังหาริมทรัพย์ในชลบุรี ฉะเชิงเทรา ระยอง",
    locale: "th_TH",
    type: "website",
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
          {children}
        </FirebaseProvider>
      </body>
    </html>
  );
}
