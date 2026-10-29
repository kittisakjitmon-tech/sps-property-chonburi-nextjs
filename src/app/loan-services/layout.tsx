import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'คำนวณสินเชื่อบ้านและปรึกษารวมหนี้ ชลบุรี',
  description: 'คำนวณค่างวดบ้านเบื้องต้น และรับคำปรึกษาสินเชื่อบ้าน รวมหนี้ หรือ refinance จาก SPS Property Solution ชลบุรี',
  alternates: { canonical: '/loan-services' },
  openGraph: {
    title: 'คำนวณสินเชื่อบ้านและปรึกษารวมหนี้ ชลบุรี',
    description: 'คำนวณค่างวดบ้านเบื้องต้น และรับคำปรึกษาสินเชื่อบ้าน รวมหนี้ หรือ refinance จาก SPS Property Solution ชลบุรี',
    url: '/loan-services',
    type: 'website',
  },
};

export default function LoanServicesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
