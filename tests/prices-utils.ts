import fs from 'fs';

export function appendPrice(filePath: string, identifier: string, price: number, extra?:any[]): void {

  const extraFields:string = extra && extra.length > 0 ? `,${extra.join(',')}` : "";
  fs.appendFileSync(filePath, `${identifier},${price},${Date.now()}${extraFields}\n`);
}

export function appendPriceAsString(filePath: string, identifier: string, priceAsString: string | null, extra?:any[]): void {
  if (priceAsString) {
    appendPrice(filePath, identifier, parseLocalizedNumber(priceAsString), extra);
  }
}

function parseLocalizedNumber(input: string): number {
  // Remove currency symbols and spaces
  const cleaned = input.replace(/[^0-9.,]/g, '');

  // Try to identify the decimal separator (comma or period followed by 1-3 digits at the end)
  const decimalMatch = cleaned.match(/([.,])(\d{1,3})$/);

  let integerPart;
  if (decimalMatch) {
    const separator = decimalMatch[1];
    const decimalDigits = decimalMatch[2];
    const separatorCount = (cleaned.match(new RegExp(`\\${separator}`, 'g')) || []).length;
    const oppositeSeparator = separator === ',' ? '.' : ',';
    const hasOppositeSeparator = cleaned.includes(oppositeSeparator);

    // If there's only one separator, it's followed by exactly 3 digits, and no opposite separators exist,
    // it's likely a thousands separator (e.g., "1.199" meaning 1199)
    if (separatorCount === 1 && decimalDigits.length === 3 && !hasOppositeSeparator) {
      integerPart = cleaned;
    } else {
      // Otherwise, it's a decimal separator - take everything before it
      integerPart = cleaned.substring(0, decimalMatch.index);
    }
  } else {
    // No decimal part found, use the whole string
    integerPart = cleaned;
  }

  // Remove thousands separators (commas and periods)
  const cleanedInteger = integerPart.replace(/[.,]/g, '');

  // Parse to number
  return parseInt(cleanedInteger, 10);
}
