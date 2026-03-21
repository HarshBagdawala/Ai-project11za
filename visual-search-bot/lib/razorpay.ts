import type { ProductMatch } from '@/types'

export async function createPaymentLink(product: ProductMatch): Promise<string> {
  // For testing/development: use product buy URL directly
  // In production, uncomment and use Razorpay:
  // 
  // import Razorpay from 'razorpay'
  // const razorpay = new Razorpay({
  //   key_id: process.env.RAZORPAY_KEY_ID!,
  //   key_secret: process.env.RAZORPAY_KEY_SECRET!
  // })
  // try {
  //   const link = await razorpay.paymentLink.create({...})
  //   return link.short_url
  // } catch { return product.buy_url }
  
  console.log(`💳 Test Mode: Payment link would be generated for ${product.name}`)
  return product.buy_url
}
