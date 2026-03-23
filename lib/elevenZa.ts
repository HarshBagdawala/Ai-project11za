import type { ProductMatch } from '@/types'
import { delay } from './utils'

const BASE_URL = 'https://api.11za.in/apis/sendMessage/sendMessages'

const getAuthToken = () => {
  const apiKey = process.env.ELEVEN_ZA_API_KEY
  if (!apiKey) console.error('❌ ELEVEN_ZA_API_KEY is missing!')
  return apiKey || ''
}

// Download media from 11za
export async function downloadMediaAsBase64(mediaId: string): Promise<string> {
  try {
    const apiKey = getAuthToken()
    const urlRes = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    })
    if (!urlRes.ok) throw new Error(`Meta API error: ${urlRes.statusText}`)
    const { url } = await urlRes.json()

    const imgRes = await fetch(url, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    })
    if (!imgRes.ok) throw new Error(`Failed to download media from Meta: ${imgRes.statusText}`)

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
    const payload = {
      sendto: to,
      authToken: getAuthToken(),
      originWebsite: 'https://11za.com/',
      contentType: 'text',
      text: text
    }

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`11za API error: ${response.status} ${errorData}`)
    }
    try {
      const result = await response.json()
      console.log(`✅ Message sent to ${to}:`, result)
    } catch {
      console.log(`✅ Message sent to ${to} (could not parse response)`)
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
    const payload = {
      sendto: to,
      authToken: getAuthToken(),
      originWebsite: 'https://11za.com/',
      contentType: 'image',
      mediaUrl: imageUrl,
      text: caption
    }

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`11za API error: ${response.status} ${errorData}`)
    }
    try {
      const result = await response.json()
      console.log(`✅ Image sent to ${to}:`, result)
    } catch {
      console.log(`✅ Image sent to ${to} (could not parse response)`)
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
  paymentLinks: string[],
  googleSearchUrl?: string
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
    let footerText = '✨ Koi aur product dhundna ho toh photo bhejiye!'
    if (googleSearchUrl) {
      footerText = `🌐 Google par aur bhi similar products dekhne ke liye yahan click karein:\n🛍️ ${googleSearchUrl}\n\n${footerText}`
    }
    
    await sendTextMessage(to, footerText)
  } catch (error) {
    console.error('Error sending matched products:', error)
    throw error
  }
}
