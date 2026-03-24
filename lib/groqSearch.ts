import Groq from 'groq-sdk'
import type { ImageTags } from '@/types'

export async function searchProductsWithGroq(tags: ImageTags): Promise<string[]> {
  const apiKey = process.env.GROQ_PRODUCT_SEARCH_API_KEY
  if (!apiKey) {
    console.warn('⚠️ Missing GROQ_PRODUCT_SEARCH_API_KEY in .env.local')
    return []
  }

  const groq = new Groq({ apiKey })

  const prompt = `Find online shopping links to buy an item with these details: 
Color: ${tags.color || 'any'}
Style: ${tags.style && tags.style !== 'other' ? tags.style : ''} 
Type: ${tags.type || 'product'} 

Return ONLY a valid JSON array containing the top 1 or 2 direct e-commerce shopping URLs for similar products. Your response must be an array of strings in JSON format. Do not use markdown, no explanations. 
Example: ["https://example-store.com/product/1", "https://example-store.com/product/2"]`

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    })

    const text = response.choices[0].message.content || '[]'
    
    // Extract JSON array robustly
    const jsonMatch = text.match(/\[.*\]/s)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    
    console.warn('⚠️ Groq returned invalid URLs or empty array.')
    return []
    
  } catch (error) {
    console.error('Groq Search error:', error)
    return []
  }
}
