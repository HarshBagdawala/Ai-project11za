import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ImageTags } from '@/types'

export async function searchProductsWithGemini(tags: ImageTags): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.warn('⚠️ Missing GEMINI_API_KEY in .env.local')
    return []
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      tools: [{
        // @ts-ignore
        googleSearch: {}
      }]
    })

    const prompt = `Search the internet to find online shopping links to buy an item with these details: 
Color: ${tags.color || 'any'}
Style: ${tags.style && tags.style !== 'other' ? tags.style : ''} 
Type: ${tags.type || 'product'} 

Return ONLY a valid JSON array containing the top 1 or 2 direct e-commerce shopping URLs for similar products. Your response must be an array of strings in JSON format. Do not use markdown, no explanations. 
Example: ["https://example-store.com/product/1", "https://example-store.com/product/2"]`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    
    // Extract JSON array robustly
    const jsonMatch = text.match(/\[.*\]/s)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (Array.isArray(parsed)) return parsed;
    }
    
    return []
  } catch (error) {
    console.error('Gemini Search error:', error)
    return []
  }
}
