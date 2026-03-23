import type { ProductMatch } from '@/types'
import { delay } from './utils'

const getBaseUrl = () => {
  const phoneId = process.env.ELEVEN_ZA_PHONE_NUMBER_ID
  if (!phoneId) {
    console.error('❌ ELEVEN_ZA_PHONE_NUMBER_ID is missing!')
  }
  return `https://graph.facebook.com/v19.0/${phoneId}/messages`
}

const headers = () => {
  const apiKey = process.env.ELEVEN_ZA_API_KEY
  if (!apiKey) {
    console.error('❌ ELEVEN_ZA_API_KEY is missing!')
  } else {
    console.log(`ℹ️ ELEVEN_ZA_API_KEY length: ${apiKey.length}`)
  }
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
}

// Download media from 11za
export async function downloadMediaAsBase64(mediaId: string): Promise<string> {
  try {
    // Step 1: Get media URL
    const apiKey = process.env.ELEVEN_ZA_API_KEY
    if (!apiKey) console.error('❌ ELEVEN_ZA_API_KEY is missing!')
    
    const urlRes = await fetch(
      `https://graph.facebook.com/v19.0/${mediaId}`,
      { 
        headers: { 
          'Authorization': `Bearer ${apiKey}` 
        } 
      }
    )
    if (!urlRes.ok) throw new Error('Failed to get media URL from 11za')
    const { url } = await urlRes.json()

    // Step 2: Download image bytes
    const imgRes = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${apiKey}` 
      }
    })
    if (!imgRes.ok) throw new Error('Failed to download media from 11za')

    const buffer = await imgRes.arrayBuffer()
    return Buffer.from(buffer).toString('base64')
  } catch (error) {
    console.error('Error downloading media:', error)
    throw error
  }
}

// Send a text message
export async function sendTextMessage(to: string, text: string): Promise<void> {
  try {
    const response = await fetch(getBaseUrl(), {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { preview_url: false, body: text }
      })
    })

    if (!response.ok) {
      throw new Error(`11za API error: ${response.statusText}`)
    }
  } catch (error) {
    console.error(`Failed to send message to ${to}:`, error)
    throw error
  }
}

// Send a product image with caption
export async function sendProductImage(
  to: string,
  imageUrl: string,
  caption: string
): Promise<void> {
  try {
    const response = await fetch(getBaseUrl(), {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'image',
        image: { link: imageUrl, caption }
      })
    })

    if (!response.ok) {
      throw new Error(`11za API error: ${response.statusText}`)
    }
  } catch (error) {
    console.error(`Failed to send image to ${to}:`, error)
    throw error
  }
}

// Send all 3 matched products
export async function sendMatchedProducts(
  to: string,
  products: ProductMatch[],
  introMessage: string,
  paymentLinks: string[]
): Promise<void> {
  try {
    // 1. Intro text
    await sendTextMessage(to, introMessage)
    await delay(800)

    // 2. Each product card
    for (let i = 0; i < products.length; i++) {
      const p = products[i]
      const emoji = ['1️⃣', '2️⃣', '3️⃣'][i]
      const caption = [
        `${emoji} *${p.name}*`,
        `💰 Price: ₹${p.price}`,
        `🎨 Color: ${p.color}`,
        '',
        '🛒 Abhi kharido:',
        paymentLinks[i]
      ].join('\n')

      await sendProductImage(to, p.image_url, caption)
      await delay(600)
    }

    // 3. Footer
    await sendTextMessage(to, '✨ Koi aur product dhundna ho toh photo bhejiye!')
  } catch (error) {
    console.error('Error sending matched products:', error)
    throw error
  }
}
