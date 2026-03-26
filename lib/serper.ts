import type { ImageTags } from '@/types'

export interface GoogleProduct {
  title: string
  price: string
  imageUrl: string
  link: string
  source: string
}

export async function searchGoogleProducts(tags: ImageTags): Promise<GoogleProduct[]> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) {
    console.error('⚠️ Missing SERPER_API_KEY. Add it to .env.local to enable Google Search.')
    return []
  }

  // Build a rich search query using all available tags
  const keywordStr = tags.keywords && tags.keywords.length > 0 ? tags.keywords.slice(0, 3).join(' ') : ''
  const query = [
    tags.color || '',
    tags.style && tags.style !== 'other' ? tags.style : '',
    tags.type || '',
    keywordStr,
    'buy online India'
  ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()

  console.log('🔍 Serper search query:', query)

  try {
    const res = await fetch("https://google.serper.dev/shopping", {
      method: 'POST',
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ q: query, gl: "in", num: 10 })
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('❌ Serper API error:', res.status, errText)
      return []
    }

    const data = await res.json()
    if (!data.shopping || !Array.isArray(data.shopping)) {
      console.log('ℹ️ No shopping results from Google Serper.')
      return []
    }

    // Return top 3 results with valid links and public image URLs only
    return data.shopping
      .filter((item: any) => 
        item.link && 
        item.link.startsWith('http') && 
        item.imageUrl && 
        item.imageUrl.startsWith('http') &&
        !item.imageUrl.toLowerCase().includes('.webp')
      )
      .slice(0, 3)
      .map((item: any) => ({
        title: item.title || 'Product',
        price: item.price || '',
        imageUrl: item.imageUrl || '',
        link: item.link || '',
        source: item.source || 'Google Store'
      }))
  } catch (error) {
    console.error('❌ Error fetching from Serper:', error)
    return []
  }
}
