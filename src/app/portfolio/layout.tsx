import type { Metadata } from 'next';

const title = 'ผลงานซื้อขายและโอนอสังหาริมทรัพย์ ชลบุรี';
const description = 'ชมผลงานการซื้อขายและโอนบ้าน คอนโด ที่ดิน ในอมตะซิตี้ ชลบุรี และพื้นที่ใกล้เคียงจาก SPS Property Solution';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/portfolio' },
  openGraph: { title, description, url: '/portfolio', type: 'website' },
  twitter: { title, description },
};

export default function PortfolioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
