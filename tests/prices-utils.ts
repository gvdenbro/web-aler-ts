import fs from 'fs';

export function appendPrice(filePath: string, identifier: string, price: number, extra?:any[]): void {

  const extraFields:string = extra && extra.length > 0 ? `,${extra.join(',')}` : "";
  fs.appendFileSync(filePath, `${identifier},${price},${Date.now()}${extraFields}\n`);
}

export function appendPriceAsString(filePath: string, identifier: string, priceAsString: string | null, extra?:any[]): void {
  if (priceAsString) {
    const match = priceAsString.match(/\d+/g);
    if (match) {
      const price:number = parseInt(match.join(''));
      appendPrice(filePath, identifier, price, extra);
    }
  }
}
