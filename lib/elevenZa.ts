import type { ProductMatch } from '@/types'
import { delay } from './utils'

const BASE_URL = 'https://api.11za.in/apis/sendMessage/sendMessages'

const getAuthToken = () => {
  const apiKey = process.env.ELEVEN_ZA_API_KEY
  if (!apiKey) console.error('❌ ELEVEN_ZA_API_KEY is missing!')
  return apiKey || ''
}

// Download media from 11za or Meta
export async function downloadMediaAsBase64(mediaIdOrUrl: string): Promise<string> {
  try {
    const apiKey = getAuthToken()
    let downloadUrl = mediaIdOrUrl

    // If it's a Meta Media ID (doesn't start with http) fetch the true URL first
    if (!mediaIdOrUrl.startsWith('http')) {
      const urlRes = await fetch(`https://graph.facebook.com/v19.0/${mediaIdOrUrl}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      })
      if (!urlRes.ok) throw new Error(`Meta API error: ${urlRes.statusText}`)
      const json = await urlRes.json()
      downloadUrl = json.url
    }

    // Set authorization header if it's downloading deeply from Meta Cloud APIs
    const headers: any = {}
    if (downloadUrl.includes('facebook.com') || downloadUrl.includes('whatsapp.net')) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const imgRes = await fetch(downloadUrl, { headers })
    if (!imgRes.ok) throw new Error(`Failed to download media: ${imgRes.statusText}`)

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

// Send a URL message (as plain text since 11za doesn't support contentType: 'url')
export async function sendUrlMessage(to: string, url: string): Promise<void> {
  try {
    const payload = {
      sendto: to,
      authToken: getAuthToken(),
      originWebsite: 'https://11za.com/',
      contentType: 'text',
      text: url
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
      console.log(`✅ URL sent to ${to}:`, result)
    } catch {
      console.log(`✅ URL sent to ${to} (could not parse response)`)
    }
  } catch (error) {
    console.error(`Failed to send URL to ${to}:`, error)
    throw error
  }
}

// Send a URL button message (with custom text like "Click here")
export async function sendUrlButton(to: string, url: string, label: string = '🛍️ Click here to view'): Promise<void> {
  try {
    const payload = {
      sendto: to,
      authToken: getAuthToken(),
      originWebsite: 'https://11za.com/',
      contentType: 'url',
      url: url,
      text: label
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
      console.log(`✅ URL Button sent to ${to}:`, result)
    } catch {
      console.log(`✅ URL Button sent to ${to} (could not parse response)`)
    }
  } catch (error) {
    console.error(`Failed to send URL button to ${to}:`, error)
    throw error
  }
}

// Send a product result using a 11za Template
export async function sendProductTemplate(
  to: string,
  product: { title: string, price: string, imageUrl: string, link: string },
  customerName: string = 'Customer'
): Promise<void> {
  try {
    const templateName = 'harsh_test'

    const payload = {
      authToken: getAuthToken(),
      name: customerName,
      sendto: to,
      originWebsite: 'https://11za.com/',
      templateName: templateName,
      language: 'en',
      buttonValue: product.link,
      myfile: product.imageUrl,
      data: [
        product.title,
        product.price || 'Price on request'
      ]
    }

    const response = await fetch('https://api.11za.in/apis/sendMessage/sendTemplateMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`11za Template API error: ${response.status} ${errorData}`)
    }

    const result = await response.json()
    console.log(`✅ Template sent to ${to}:`, result)
  } catch (error) {
    console.error(`Failed to send template to ${to}:`, error)
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
      contentType: 'media',
      media: {
        type: 'image',
        url: imageUrl
      },
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
      console.log(`✅ Image sent as media to ${to}:`, result)
    } catch {
      console.log(`✅ Image sent as media to ${to} (could not parse response)`)
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

  } catch (error) {
    console.error('Error sending matched products:', error)
    throw error
  }
}
