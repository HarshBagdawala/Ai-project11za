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
      body: JSON.stringify({ q: query, gl: "in", num: 40 })
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

    // Filter results using budget constraints and valid links/images
    const filteredProducts = data.shopping.filter((item: any) => {
      if (!item.link || !item.link.startsWith('http')) return false
      if (!item.imageUrl || !item.imageUrl.startsWith('http') || item.imageUrl.toLowerCase().includes('.webp')) return false
      
      if (item.price && (tags.minPrice !== undefined || tags.maxPrice !== undefined)) {
        // Strip everything but numbers and decimal point
        const numPrice = parseFloat(item.price.replace(/[^\\d.]/g, ''))
        if (!isNaN(numPrice)) {
          if (tags.minPrice && numPrice < tags.minPrice) return false
          if (tags.maxPrice && numPrice > tags.maxPrice) return false
        }
      }
      return true
    })

    return filteredProducts
      .slice(0, 7)
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
