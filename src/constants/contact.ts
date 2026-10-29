export const CONTACT = {
  email: 'propertysommai@gmail.com',
  facebookUrl: 'https://www.facebook.com/houseamata',
  messengerUrl: 'https://m.me/houseamata',
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() || '',
  lineUrl: process.env.NEXT_PUBLIC_LINE_URL?.trim() || '',
} as const;

export const PRIMARY_CHAT_URL = CONTACT.lineUrl || CONTACT.messengerUrl;
export const PRIMARY_CHAT_LABEL = CONTACT.lineUrl ? 'LINE' : 'Messenger';
