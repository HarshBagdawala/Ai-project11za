import Groq from 'groq-sdk'
import type { ImageTags } from '@/types'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

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
        content: 'You are a friendly Indian e-commerce WhatsApp assistant. Write short, warm messages in Hinglish (mix of Hindi and English). Be enthusiastic but concise. Max 2 sentences.'
      },
      {
        role: 'user',
        content: `Customer ne ${tags.color} ${tags.type} ki photo bheji hai (category: ${tags.category}).
Humne ${productCount} similar products dhundhe hain.
Ek warm welcome message likho jo bataye ki photo mil gayi aur products neeche hain.
Only the message text, no quotes.`
      }
    ]
  })

  return response.choices[0].message.content?.trim() ||
    `🎉 Aapki photo mil gayi! Humne ${productCount} similar products dhundhe hain aapke liye:`
}
