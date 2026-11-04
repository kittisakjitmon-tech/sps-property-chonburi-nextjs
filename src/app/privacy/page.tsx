import type { Metadata } from 'next';
import LegalPage, { LegalSection } from '@/components/LegalPage';
import { CONTACT } from '@/constants/contact';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'นโยบายความเป็นส่วนตัว',
  description: `นโยบายความเป็นส่วนตัวของ ${SITE_NAME} อธิบายข้อมูลที่เราเก็บ วัตถุประสงค์ และสิทธิของคุณ รวมถึงข้อมูลจากการสนทนาผ่าน Facebook Messenger`,
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="นโยบายความเป็นส่วนตัว" updatedAt="4 พฤศจิกายน 2569">
      <p>
        {SITE_NAME} (&ldquo;เรา&rdquo;) ให้ความสำคัญกับข้อมูลส่วนบุคคลของคุณ
        นโยบายนี้อธิบายว่าเราเก็บข้อมูลอะไร นำไปใช้อย่างไร และคุณมีสิทธิอะไรบ้าง
        ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
      </p>

      <LegalSection heading="1. ข้อมูลที่เราเก็บ">
        <p className="font-semibold text-gray-900">จากการใช้งานเว็บไซต์และแบบฟอร์มติดต่อ</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>ชื่อ-นามสกุล เบอร์โทรศัพท์ และข้อความที่คุณกรอกเมื่อสอบถามหรือนัดชมทรัพย์</li>
          <li>รายการทรัพย์ที่คุณบันทึกไว้เป็นรายการโปรด</li>
        </ul>
        <p className="font-semibold text-gray-900">จากการสนทนาผ่าน Facebook Messenger</p>
        <p>
          เมื่อคุณส่งข้อความถึงเพจ Facebook ของเรา เราได้รับข้อมูลผ่านแพลตฟอร์ม Messenger ของ Meta ดังนี้
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>รหัสผู้ใช้เฉพาะเพจ (Page-Scoped ID) ซึ่ง Meta กำหนดให้</li>
          <li>ชื่อและรูปโปรไฟล์สาธารณะของคุณบน Facebook (ตามที่ Meta อนุญาตให้เข้าถึง)</li>
          <li>เนื้อหาข้อความ รูปภาพ และไฟล์แนบที่คุณส่งมา รวมถึงวันเวลาของการสนทนา</li>
        </ul>
        <p>
          เราไม่ได้รับและไม่เก็บรหัสผ่าน Facebook ของคุณ
          และไม่ได้รับเบอร์โทรศัพท์ อีเมล หรือข้อมูลส่วนตัวอื่นจาก Facebook
          เว้นแต่คุณพิมพ์แจ้งเราเองในการสนทนา
        </p>
      </LegalSection>

      <LegalSection heading="2. วัตถุประสงค์ในการใช้ข้อมูล">
        <ul className="list-disc pl-6 space-y-1">
          <li>ตอบคำถามและให้คำปรึกษาเรื่องซื้อ ขาย เช่า และสินเชื่ออสังหาริมทรัพย์</li>
          <li>นัดหมายชมทรัพย์และติดต่อกลับตามที่คุณขอ</li>
          <li>จัดการประวัติการสนทนาเพื่อให้ทีมงานให้บริการต่อเนื่องและไม่ต้องถามซ้ำ</li>
          <li>ปรับปรุงคุณภาพบริการและป้องกันการใช้งานในทางที่ผิด</li>
        </ul>
        <p>เราไม่ขายข้อมูลของคุณให้บุคคลภายนอก และไม่ใช้ข้อมูลจาก Messenger เพื่อวัตถุประสงค์อื่นนอกเหนือจากที่ระบุไว้</p>
      </LegalSection>

      <LegalSection heading="3. การเปิดเผยข้อมูล">
        <p>เราเปิดเผยข้อมูลเฉพาะในกรณีต่อไปนี้</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            ผู้ให้บริการที่ช่วยเราดำเนินงาน เช่น Meta Platforms (ผู้ให้บริการ Facebook Messenger)
            และ Google Firebase (ผู้ให้บริการจัดเก็บข้อมูลและโครงสร้างพื้นฐานของระบบ)
          </li>
          <li>ทีมงานของ {SITE_NAME} ที่มีหน้าที่ตอบข้อความและดูแลลูกค้า</li>
          <li>หน่วยงานรัฐเมื่อกฎหมายกำหนด</li>
        </ul>
      </LegalSection>

      <LegalSection heading="4. ระยะเวลาเก็บรักษา">
        <p>
          เราเก็บข้อมูลเท่าที่จำเป็นต่อการให้บริการและตามที่กฎหมายกำหนด
          และจะลบหรือทำให้ไม่สามารถระบุตัวตนได้เมื่อหมดความจำเป็น
          หรือเมื่อคุณขอให้ลบข้อมูล
        </p>
      </LegalSection>

      <LegalSection heading="5. การรักษาความปลอดภัย">
        <p>
          เราจำกัดสิทธิ์การเข้าถึงข้อมูลเฉพาะผู้ดูแลระบบที่ได้รับอนุญาต
          ใช้การเชื่อมต่อแบบเข้ารหัส (HTTPS) และเก็บรหัสลับของระบบแยกจากโค้ดโปรแกรม
        </p>
      </LegalSection>

      <LegalSection heading="6. สิทธิของคุณ">
        <p>คุณมีสิทธิตามกฎหมาย ได้แก่</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>ขอเข้าถึงและขอรับสำเนาข้อมูลของคุณ</li>
          <li>ขอแก้ไขข้อมูลให้ถูกต้อง</li>
          <li>ขอลบหรือทำลายข้อมูล</li>
          <li>ขอระงับหรือคัดค้านการใช้ข้อมูล</li>
          <li>ถอนความยินยอมได้ทุกเมื่อ โดยไม่กระทบการใช้ข้อมูลก่อนหน้านั้น</li>
        </ul>
        <p>
          วิธีขอลบข้อมูลดูได้ที่หน้า{' '}
          <a href="/data-deletion" className="text-blue-700 underline">
            การขอลบข้อมูล
          </a>
        </p>
      </LegalSection>

      <LegalSection heading="7. การเปลี่ยนแปลงนโยบาย">
        <p>
          เราอาจปรับปรุงนโยบายนี้เป็นครั้งคราว
          โดยจะแสดงวันที่อัปเดตล่าสุดไว้ที่ส่วนบนของหน้านี้
        </p>
      </LegalSection>

      <LegalSection heading="8. ติดต่อเรา">
        <p>
          หากมีคำถามเกี่ยวกับนโยบายนี้หรือต้องการใช้สิทธิของคุณ ติดต่อได้ที่
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            อีเมล:{' '}
            <a href={`mailto:${CONTACT.email}`} className="text-blue-700 underline">
              {CONTACT.email}
            </a>
          </li>
          <li>
            Messenger:{' '}
            <a href={CONTACT.messengerUrl} className="text-blue-700 underline" rel="noopener noreferrer">
              {CONTACT.messengerUrl}
            </a>
          </li>
          <li>
            ที่อยู่: 99/199 หมู่บ้านกิตติพรพอร์ต ซอยอมตะพัฒน์ 15 ตำบลอมตะ อำเภอเมืองชลบุรี จังหวัดชลบุรี 20000
          </li>
        </ul>
      </LegalSection>
    </LegalPage>
  );
}
