export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function base64ToBuffer(base64: string): Buffer {
  return Buffer.from(base64, 'base64')
}

export function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64')
}

export function extractPhoneNumber(from: string): string {
  return from.replace(/\D/g, '')
}

export function formatPrice(price: number): string {
  return `₹${price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

export function generateProductCaption(
  emoji: string,
  name: string,
  price: number,
  color: string,
  paymentLink: string
): string {
  return [
    `${emoji} *${name}*`,
    `💰 Price: ${formatPrice(price)}`,
    `🎨 Color: ${color}`,
    '',
    '🛒 Abhi kharido:',
    paymentLink
  ].join('\n')
}

export function isValidImageMediaId(mediaId: string): boolean {
  return mediaId && mediaId.length > 10
}
