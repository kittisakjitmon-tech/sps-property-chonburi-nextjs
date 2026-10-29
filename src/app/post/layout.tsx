import type { Metadata } from 'next';

const title = 'ฝากขาย ให้เช่าบ้านและคอนโด ชลบุรี';
const description = 'ลงประกาศฝากขายหรือให้เช่าบ้าน คอนโด ที่ดิน ในอมตะซิตี้ ชลบุรี และภาคตะวันออกกับ SPS Property Solution';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/post' },
  openGraph: { title, description, url: '/post', type: 'website' },
  twitter: { title, description },
};

export default function PostLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
