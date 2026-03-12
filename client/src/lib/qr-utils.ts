import qrcode from "qrcode-generator";

export function generateQRDataURL(text: string, cellSize: number = 4): string {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  return qr.createDataURL(cellSize, 0);
}
