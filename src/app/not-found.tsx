import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] bg-slate-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-lg text-center">
        <p className="text-sm font-semibold text-blue-700 mb-2">404</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">ไม่พบหน้าที่คุณต้องการ</h1>
        <p className="text-slate-600 mb-6">รายการอาจถูกปิดหรือลิงก์เปลี่ยนไปแล้ว คุณสามารถค้นหาทรัพย์ที่พร้อมขายหรือให้เช่าได้จากหน้ารายการ</p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link href="/properties" className="min-h-[44px] inline-flex items-center justify-center rounded-xl bg-blue-900 px-5 py-3 text-white font-semibold hover:bg-blue-800">ค้นหาอสังหาริมทรัพย์</Link>
          <Link href="/" className="min-h-[44px] inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-700 font-semibold hover:bg-slate-100">กลับหน้าแรก</Link>
        </div>
      </div>
    </div>
  );
}
