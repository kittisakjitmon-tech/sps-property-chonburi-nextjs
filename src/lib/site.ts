export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://spspropertysolution.com').replace(/\/+$/, '');
export const SITE_NAME = 'SPS Property Solution';
export const SITE_DESCRIPTION = 'ค้นหาบ้าน คอนโด และอสังหาริมทรัพย์ในอมตะซิตี้ ชลบุรี และภาคตะวันออก พร้อมบริการซื้อ ขาย เช่า ผ่อนตรง และปรึกษาสินเชื่อ';

export function absoluteUrl(path = '/'): string {
  return new URL(path, `${SITE_URL}/`).toString();
}
