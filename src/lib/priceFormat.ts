/**
 * Format price for display
 */
export function formatPrice(
  price: number | string | null | undefined,
  isRentalOrListingType?: boolean | string,
  showPrice: boolean = true
): string {
  if (price == null || price === '') return '-';
  const num = Number(price);
  if (!Number.isFinite(num)) return '-';
  const formatted = num.toLocaleString('th-TH');
  
  const isRental = isRentalOrListingType === true || 
                   isRentalOrListingType === 'rent' ||
                   (typeof isRentalOrListingType === 'string' && isRentalOrListingType.toLowerCase() === 'rent');
  
  return isRental ? `${formatted} บาท/เดือน` : `${formatted} บาท`;
}

/**
 * Format price short format (e.g. ฿2.5 ล้าน)
 */
export function formatPriceShort(
  price: number | string | null | undefined,
  isRentalOrListingType?: boolean | string,
  showPrice: boolean = true
): string {
  if (price == null || price === '') return '-';
  const num = Number(price);
  if (!Number.isFinite(num)) return '-';

  const isRental = isRentalOrListingType === true || 
                   isRentalOrListingType === 'rent' ||
                   (typeof isRentalOrListingType === 'string' && isRentalOrListingType.toLowerCase() === 'rent');

  if (showPrice === false) {
    const firstDigit = String(Math.floor(num)).charAt(0);
    if (!isRental && num >= 1000000) {
      return `฿${firstDigit}.xx ล้าน`;
    }
    if (isRental) {
      return `฿${firstDigit},xxx/ด.`;
    }
    return `฿${firstDigit}xx,xxx`;
  }

  if (isRental) {
    return `฿${num.toLocaleString('th-TH')}/ด.`;
  }

  if (num >= 1000000) {
    const millions = num / 1000000;
    const formatted = parseFloat(millions.toFixed(2)).toString();
    return `฿${formatted} ล้าน`;
  }

  return `฿${num.toLocaleString('th-TH')}`;
}
