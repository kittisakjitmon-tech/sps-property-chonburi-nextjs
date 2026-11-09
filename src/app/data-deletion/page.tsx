import type { Metadata } from 'next';
import LegalPage, { LegalSection } from '@/components/LegalPage';
import { CONTACT } from '@/constants/contact';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'การขอลบข้อมูลส่วนบุคคล',
  description: `ขั้นตอนขอลบข้อมูลของคุณออกจากระบบของ ${SITE_NAME} รวมถึงข้อมูลจากการสนทนาผ่าน Facebook Messenger`,
  alternates: { canonical: '/data-deletion' },
};

export default function DataDeletionPage() {
  return (
    <LegalPage title="การขอลบข้อมูลส่วนบุคคล" updatedAt="4 พฤศจิกายน 2569">
      <p>
        คุณสามารถขอให้ {SITE_NAME} ลบข้อมูลของคุณได้ตลอดเวลา
        รวมถึงข้อมูลที่เราได้รับจากการสนทนากับเพจ Facebook ของเราผ่าน Messenger
      </p>

      <LegalSection heading="ข้อมูลที่เราจะลบ">
        <ul className="list-disc pl-6 space-y-1">
          <li>ประวัติข้อความและไฟล์แนบจากการสนทนาผ่าน Messenger</li>
          <li>ชื่อ รูปโปรไฟล์ และรหัสผู้ใช้เฉพาะเพจ (Page-Scoped ID) ที่เราบันทึกไว้</li>
          <li>ข้อมูลติดต่อที่คุณเคยแจ้งไว้ เช่น ชื่อ เบอร์โทรศัพท์ จากแบบฟอร์มหรือการสนทนา</li>
        </ul>
      </LegalSection>

      <LegalSection heading="วิธีขอลบข้อมูล (เลือกทางใดทางหนึ่ง)">
        <div className="rounded-lg border border-gray-200 p-4 space-y-2">
          <p className="font-semibold text-gray-900">ทางที่ 1: ส่งอีเมล</p>
          <p>
            ส่งอีเมลถึง{' '}
            <a
              href={`mailto:${CONTACT.email}?subject=${encodeURIComponent('ขอลบข้อมูลส่วนบุคคล')}`}
              className="text-blue-700 underline"
            >
              {CONTACT.email}
            </a>{' '}
            หัวข้อ &ldquo;ขอลบข้อมูลส่วนบุคคล&rdquo; โดยระบุชื่อที่แสดงบน Facebook ของคุณ
            และเบอร์โทรศัพท์ (ถ้าเคยแจ้งไว้) เพื่อให้เราค้นหาข้อมูลของคุณได้ถูกต้อง
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4 space-y-2">
          <p className="font-semibold text-gray-900">ทางที่ 2: ส่งข้อความทาง Messenger</p>
          <p>
            ส่งข้อความ &ldquo;ขอลบข้อมูล&rdquo; มาที่เพจของเราผ่าน{' '}
            <a href={CONTACT.messengerUrl} className="text-blue-700 underline" rel="noopener noreferrer">
              {CONTACT.messengerUrl}
            </a>{' '}
            ทีมงานจะยืนยันตัวตนจากบัญชีที่ส่งข้อความ
          </p>
        </div>
      </LegalSection>

      <LegalSection heading="ขั้นตอนหลังได้รับคำขอ">
        <ol className="list-decimal pl-6 space-y-1">
          <li>เราตอบรับคำขอและอาจขอข้อมูลเพิ่มเพื่อยืนยันว่าคุณเป็นเจ้าของข้อมูล</li>
          <li>เราลบข้อมูลภายใน 30 วันนับจากวันที่ยืนยันตัวตนเรียบร้อย</li>
          <li>เราแจ้งผลให้คุณทราบทางช่องทางที่คุณใช้ติดต่อ</li>
        </ol>
        <p>
          ข้อมูลบางส่วนอาจต้องเก็บไว้ต่อหากกฎหมายกำหนดให้เก็บ
          ซึ่งเราจะแจ้งให้คุณทราบพร้อมเหตุผล
        </p>
      </LegalSection>

      <LegalSection heading="ลบข้อมูลที่อยู่กับ Meta">
        <p>
          ข้อความที่อยู่ใน Messenger ของคุณเองถูกจัดเก็บโดย Meta
          การลบข้อมูลของเรา<strong>ไม่ได้ลบ</strong>ประวัติแชทในบัญชี Facebook ของคุณ
          หากต้องการลบ ให้ลบการสนทนาใน Messenger เอง
          หรือจัดการข้อมูลผ่านการตั้งค่าบัญชี Facebook ของคุณ
        </p>
      </LegalSection>

      <p>
        ดูรายละเอียดการเก็บและใช้ข้อมูลเพิ่มเติมที่{' '}
        <a href="/privacy" className="text-blue-700 underline">
          นโยบายความเป็นส่วนตัว
        </a>
      </p>
    </LegalPage>
  );
}
