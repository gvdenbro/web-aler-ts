import fs from 'fs';

export function appendPrice(filePath: string, identifier: string, price: number): void {

  fs.appendFileSync(filePath, `${identifier},${price},${Date.now()}\n`);
}

export function appendPriceAsString(filePath: string, identifier: string, priceAsString: string | null): void {
  if (priceAsString) {
    const match = priceAsString.match(/\d+/g);
    if (match) {
      const price:number = parseInt(match.join(''));
      appendPrice(filePath, identifier, price);
    }
  }
}