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

  const query = `${tags.color || ''} ${tags.style && tags.style !== 'other' ? tags.style : ''} ${tags.type || ''}`.replace(/\s+/g, ' ').trim()

  try {
    const res = await fetch("https://google.serper.dev/shopping", {
      method: 'POST',
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ q: query, gl: "in" })
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

    // Limit to top 2 results
    return data.shopping.slice(0, 2).map((item: any) => ({
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
