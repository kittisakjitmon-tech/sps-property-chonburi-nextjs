export const PRICE_ON_REQUEST = 'สอบถามราคา';

function isRentalListing(isRentalOrListingType?: boolean | string): boolean {
  return isRentalOrListingType === true ||
    (typeof isRentalOrListingType === 'string' && isRentalOrListingType.toLowerCase() === 'rent');
}

/** แสดงราคาเต็มเมื่อเจ้าของประกาศอนุญาต และไม่เปิดเผยราคาที่ถูกปิดไว้ */
export function formatPrice(
  price: number | string | null | undefined,
  isRentalOrListingType?: boolean | string,
  showPrice = true
): string {
  if (!showPrice) return PRICE_ON_REQUEST;
  if (price == null || price === '') return '-';
  const num = Number(price);
  if (!Number.isFinite(num)) return '-';

  const formatted = num.toLocaleString('th-TH', { maximumFractionDigits: 2 });
  return isRentalListing(isRentalOrListingType) ? `${formatted} บาท/เดือน` : `${formatted} บาท`;
}

export function formatPriceShort(
  price: number | string | null | undefined,
  isRentalOrListingType?: boolean | string,
  showPrice = true
): string {
  if (!showPrice) return PRICE_ON_REQUEST;
  if (price == null || price === '') return '-';
  const num = Number(price);
  if (!Number.isFinite(num)) return '-';

  if (isRentalListing(isRentalOrListingType)) {
    return `฿${num.toLocaleString('th-TH')}/เดือน`;
  }

  if (num >= 1000000) {
    const millions = (num / 1000000).toLocaleString('th-TH', { maximumFractionDigits: 2 });
    return `฿${millions} ล้าน`;
  }

  return `฿${num.toLocaleString('th-TH')}`;
}
