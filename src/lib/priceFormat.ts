/**
 * Price formatting แบบปิดตัวเลข (privacy-first)
 *
 * ข้อกำหนดธุรกิจ: ราคาที่แสดงบนหน้าเว็บต้องไม่โชว์ตัวเลขเต็มและไม่ใช้คำว่า "สอบถามราคา"
 * แต่ให้แสดงเป็นค่าประมาณ เช่น 2,200,000 → "2.2xx ล้านบาท", 850,000 → "8.5xx แสนบาท",
 * 15,000/เดือน → "1.5xx หมื่นบาท/เดือน" ทุกหน้าเหมือนกัน
 */
export const PRICE_ON_REQUEST = 'สอบถามราคา';

function isRentalListing(isRentalOrListingType?: boolean | string): boolean {
  return isRentalOrListingType === true ||
    (typeof isRentalOrListingType === 'string' && isRentalOrListingType.toLowerCase() === 'rent');
}

/** ตัดทศนิยมตำแหน่งเดียวแบบไม่ปัดขึ้น (1,999,999 → 1.9) */
function truncateOneDecimal(value: number): string {
  return (Math.floor(value * 10) / 10).toFixed(1);
}

interface MaskedMagnitude {
  value: string;
  unit: 'ล้าน' | 'แสน' | 'หมื่น' | 'พัน' | 'บาท';
}

/**
 * ปิดหลักท้ายของจำนวนเงินโดยคงหลักนำไว้
 * 2,200,000 → { value: "2.2xx", unit: "ล้าน" }
 * 1,999,999 → { value: "1.9xx", unit: "ล้าน" }
 * 12,500,000 → { value: "12.xxx", unit: "ล้าน" }
 * 850,000 → { value: "8.5xx", unit: "แสน" }
 * 15,000 → { value: "1.5xx", unit: "หมื่น" }
 * 9,500 → { value: "9.xxx", unit: "พัน" }
 */
function maskedMagnitude(amount: number): MaskedMagnitude {
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    if (millions >= 10) return { value: `${Math.floor(millions)}.xxx`, unit: 'ล้าน' };
    return { value: `${truncateOneDecimal(millions)}xx`, unit: 'ล้าน' };
  }
  if (amount >= 100_000) return { value: `${truncateOneDecimal(amount / 100_000)}xx`, unit: 'แสน' };
  if (amount >= 10_000) return { value: `${truncateOneDecimal(amount / 10_000)}xx`, unit: 'หมื่น' };
  if (amount >= 1_000) return { value: `${Math.floor(amount / 1_000)}.xxx`, unit: 'พัน' };
  if (amount >= 100) return { value: `${Math.floor(amount / 100)}xx`, unit: 'บาท' };
  return { value: 'xxx', unit: 'บาท' };
}

function toAmount(price: number | string | null | undefined): number | null {
  if (price == null || price === '') return null;
  const amount = Number(price);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

/** ราคาแบบเต็มพร้อมหน่วย เช่น "2.2xx ล้านบาท", "1.5xx หมื่นบาท/เดือน" */
export function formatMaskedPrice(
  price: number | string | null | undefined,
  isRentalOrListingType?: boolean | string
): string {
  const amount = toAmount(price);
  if (amount == null) return '-';
  const { value, unit } = maskedMagnitude(amount);
  const base = unit === 'บาท' ? `${value} บาท` : `${value} ${unit}บาท`;
  return isRentalListing(isRentalOrListingType) ? `${base}/เดือน` : base;
}

/** ราคาแบบสั้นสำหรับการ์ด/ป้าย เช่น "฿2.2xx ล้าน", "฿1.5xx หมื่น/เดือน" */
export function formatMaskedPriceShort(
  price: number | string | null | undefined,
  isRentalOrListingType?: boolean | string
): string {
  const amount = toAmount(price);
  if (amount == null) return '-';
  const { value, unit } = maskedMagnitude(amount);
  const base = unit === 'บาท' ? `฿${value}` : `฿${value} ${unit}`;
  return isRentalListing(isRentalOrListingType) ? `${base}/เดือน` : base;
}

/** คงค่าเดิมของ API เดิมไว้ แต่แสดงผลแบบปิดราคาเสมอ (ไม่สนใจ showPrice) */
export function formatPrice(
  price: number | string | null | undefined,
  isRentalOrListingType?: boolean | string,
  showPrice = true
): string {
  // คงพารามิเตอร์เดิมไว้ให้ผู้เรียกใช้รายเดิมไม่พัง แต่การแสดงผลปิดราคาเสมอแล้ว
  void showPrice;
  return formatMaskedPrice(price, isRentalOrListingType);
}

export function formatPriceShort(
  price: number | string | null | undefined,
  isRentalOrListingType?: boolean | string,
  showPrice = true
): string {
  void showPrice;
  return formatMaskedPriceShort(price, isRentalOrListingType);
}

function groupMaskedDigits(masked: string): string {
  let grouped = '';
  for (let end = masked.length; end > 0; end -= 3) {
    const start = Math.max(0, end - 3);
    const chunk = masked.slice(start, end);
    grouped = grouped ? `${chunk},${grouped}` : chunk;
  }
  return grouped;
}

/**
 * ปิดตัวเลขในตาราง/ค่างวด โดยคง 2 หลักแรก เช่น
 * 9,279 → "9,2xx", 1,595,386 → "1,5xx,xxx", 400,000 → "40x,xxx"
 */
export function maskDigits(value: number | string | null | undefined): string {
  if (value == null || value === '') return '-';
  const amount = Math.round(Number(value));
  if (!Number.isFinite(amount)) return '-';
  const digits = Math.abs(amount).toString();
  if (digits.length <= 2) return amount.toLocaleString('th-TH');
  const masked = digits.slice(0, 2) + 'x'.repeat(digits.length - 2);
  const sign = amount < 0 ? '-' : '';
  return `${sign}${groupMaskedDigits(masked)}`;
}
