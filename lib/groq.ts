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
    model: 'llama-3.2-11b-vision-preview',
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
): Promise<ImageTags | { chatReply: string } | null> {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 300,
    temperature: 0.1,
    messages: [
      {
        role: 'system',
        content: `You are a helpful and intelligent AI WhatsApp Assistant for an e-commerce store.
Analyze the user message and determine if they want to SEARCH/BUY a product, OR if they are just chatting/asking out-of-syllabus questions.

If they WANT TO SEARCH FOR A PRODUCT, extract the details and return ONLY a valid JSON object:
{
  "category": "clothing/footwear/electronics/accessories/home/beauty/other",
  "color": "primary color if mentioned",
  "type": "specific item name",
  "style": "casual/formal/ethnic/sporty/western/other",
  "keywords": ["keyword1", "keyword2"],
  "minPrice": 1000, 
  "maxPrice": 2000
}

If they ARE NOT asking for a product (e.g. asking general questions, saying hi, asking coding questions, general knowledge, etc), act as a conversational AI chatbot and return ONLY a valid JSON object with a single "chatReply" string in the language they used:
{
  "chatReply": "Your smart, friendly conversational response here."
}

DO NOT wrap JSON in Markdown blocks and do not return anything other than JSON.`
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
      return JSON.parse(jsonMatch[0])
    }
  } catch (e) {
    console.error('Failed to parse product intent:', e)
  }
  return null
}

export interface LocalizedMessages {
  intro: string;
  noMatch: string;
  closing: string;
  priceLabel: string;
  sourceLabel: string;
  notUnderstood: string;
}

const defaultMessages: LocalizedMessages = {
  intro: "🛍️ I understood your request! We found *{count}* similar products:",
  noMatch: "😔 Sorry! We could not find any matching product. Please try again with another query/photo 📸",
  closing: "✨ Want to find another product? Just send a photo, voice note, or tell me what you need!",
  priceLabel: "Price:",
  sourceLabel: "Source:",
  notUnderstood: "I could not hear that properly. Could you please try again?"
};

export async function getLocalizedMessages(query?: string | null): Promise<LocalizedMessages> {
  if (!query) return defaultMessages;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 300,
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: `You are a translator. Identify the language of the user's message. Translate the following interface text into that exact language (maintaining the same tone and emojis). 
Return ONLY a valid JSON object matching this structure:
{
  "intro": "🛍️ I understood your request! We found *{count}* similar products:",
  "noMatch": "😔 Sorry! We could not find any matching product. Please try again with another query/photo 📸",
  "closing": "✨ Want to find another product? Just send a photo, voice note, or tell me what you need!",
  "priceLabel": "Price:",
  "sourceLabel": "Source:",
  "notUnderstood": "I could not understand that properly. Could you please try again?"
}
Do NOT wrap the JSON in Markdown blocks. Leave {count} intact. Keep emojis.`
        },
        { role: 'user', content: `User message: "${query}"` }
      ]
    });
    const content = response.choices[0].message.content?.trim() || '';
    const jsonMatch = content.match(/\{.*\}/s);
    if (jsonMatch) return JSON.parse(jsonMatch[0]) as LocalizedMessages;
  } catch (error) {
    console.error('Translation failed, falling back to English', error);
  }
  return defaultMessages;
}

export async function getWelcomeMessage(query: string): Promise<string> {
  const defaultWelcome = '📸 Hi! Send me a photo of any product or just tell me what you are looking for (e.g. "red kurti") and I will find it for you!\n\n_I search Google Shopping for the best links!_ ✨';
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 150,
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: `Identify the language of the user message. Translate this welcome message into that language, keeping the same emojis and formatting: "${defaultWelcome}". Return ONLY the translated string.`
        },
        { role: 'user', content: `Message: "${query}"` }
      ]
    });
    return response.choices[0].message.content?.trim() || defaultWelcome;
  } catch {
    return defaultWelcome;
  }
}
