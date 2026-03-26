import Groq from 'groq-sdk'
import type { ImageTags } from '@/types'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function transcribeAudioMessage(audioBuffer: Buffer): Promise<string> {
  // Use global File constructor available in Node 20+
  const audioFile = new File([new Uint8Array(audioBuffer)], 'audio.ogg', { type: 'audio/ogg' })
  const transcription = await groq.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-large-v3-turbo',
    response_format: 'text'
  })
  return transcription as unknown as string
}

export async function analyzeProductImage(imageBase64: string): Promise<ImageTags> {
  const response = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    max_tokens: 400,
    temperature: 0.1,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`
            }
          },
          {
            type: 'text',
            text: `You are a product analysis AI for an Indian e-commerce store.
Analyze this product image and extract details.
Return ONLY a valid JSON object with no markdown, no explanation, nothing else.

Required format:
{
  "category": "clothing/footwear/electronics/accessories/home/beauty/other",
  "color": "primary color of the product",
  "type": "specific item name (e.g. kurti, sneakers, watch)",
  "style": "casual/formal/ethnic/sporty/western",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`
          }
        ]
      }
    ]
  })

  const text = response.choices[0].message.content || '{}'
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean) as ImageTags
}

export async function generateFriendlyMessage(
  tags: ImageTags,
  productCount: number
): Promise<string> {
  const response = await groq.chat.completions.create({
    model: 'mixtral-8x7b-32768',
    max_tokens: 150,
    temperature: 0.7,
    messages: [
      {
        role: 'system',
        content: 'You are a friendly e-commerce WhatsApp assistant. Write short, warm messages in English only. Be enthusiastic but concise. Max 2 sentences.'
      },
      {
        role: 'user',
        content: `The customer sent a photo of a ${tags.color} ${tags.type} (category: ${tags.category}).
We found ${productCount} similar products.
Write a warm message saying we received the photo and the products are listed below.
Only the message text, no quotes.`
      }
    ]
  })

  return response.choices[0].message.content?.trim() ||
    `🎉 We received your photo! Here are ${productCount} similar products we found for you:`
}

export async function extractProductFromText(
  text: string,
  history: {role: string, content: string}[] = []
): Promise<ImageTags | null> {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 300,
    temperature: 0.1,
    messages: [
      {
        role: 'system',
        content: `You are an expert e-commerce product classifier. 
Analyze the user message and determine if they are asking to see or buy a product.
If they ARE asking for a product, return ONLY a valid JSON object.
If they ARE NOT asking for a product (just saying hi, etc.), return null.

Required JSON format:
{
  "category": "clothing/footwear/electronics/accessories/home/beauty/other",
  "color": "primary color if mentioned",
  "type": "specific item name",
  "style": "casual/formal/ethnic/sporty/western/other",
  "keywords": ["keyword1", "keyword2"]
}`
      },
      ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      {
        role: 'user',
        content: `User message: "${text}"`
      }
    ]
  })

  const content = response.choices[0].message.content?.trim() || ''
  if (content.toLowerCase() === 'null') return null

  try {
    const jsonMatch = content.match(/\{.*\}/s)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ImageTags
    }
  } catch (e) {
    console.error('Failed to parse product intent:', e)
  }
  return null
}
