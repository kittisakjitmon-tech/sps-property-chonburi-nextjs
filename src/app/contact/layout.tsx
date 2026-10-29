import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ติดต่อนัดชมบ้านและปรึกษาอสังหาริมทรัพย์ ชลบุรี',
  description: 'ติดต่อ SPS Property Solution เพื่อนัดชมบ้าน คอนโด ฝากขาย เช่า หรือปรึกษาสินเชื่อในอมตะซิตี้ ชลบุรี และภาคตะวันออก',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'ติดต่อนัดชมบ้านและปรึกษาอสังหาริมทรัพย์ ชลบุรี',
    description: 'ติดต่อ SPS Property Solution เพื่อนัดชมบ้าน คอนโด ฝากขาย เช่า หรือปรึกษาสินเชื่อในอมตะซิตี้ ชลบุรี และภาคตะวันออก',
    url: '/contact',
    type: 'website',
  },
};

export default function ContactLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
