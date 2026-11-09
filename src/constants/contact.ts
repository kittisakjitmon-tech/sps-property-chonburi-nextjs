export const CONTACT = {
  email: 'propertysommai@gmail.com',
  facebookUrl: 'https://www.facebook.com/houseamata',
  messengerUrl: 'https://m.me/houseamata',
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() || '',
  lineUrl: process.env.NEXT_PUBLIC_LINE_URL?.trim() || '',
} as const;

// Registered company details, as printed on the DBD company certificate.
export const COMPANY = {
  legalName: 'บริษัท เอสพีเอส พร็อพเพอร์ตี้ โซลูชั่น จำกัด',
  registrationNumber: '0205567053116',
  addressLines: [
    '103/162 หมู่ที่ 5',
    'ตำบลหนองหงษ์ อำเภอพานทอง',
    'จังหวัดชลบุรี',
  ],
} as const;

export const COMPANY_ADDRESS = COMPANY.addressLines.join(' ');

export const PRIMARY_CHAT_URL = CONTACT.lineUrl || CONTACT.messengerUrl;
export const PRIMARY_CHAT_LABEL = CONTACT.lineUrl ? 'LINE' : 'Messenger';
