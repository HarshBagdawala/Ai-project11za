import { NextRequest, NextResponse } from 'next/server'
import { analyzeProductImage, extractProductFromText } from '@/lib/groq'
import { downloadMediaAsBase64, sendTextMessage, sendProductImage, sendUrlButton } from '@/lib/elevenZa'
import { searchGoogleProducts } from '@/lib/serper'
import { delay } from '@/lib/utils'
import type { ImageTags } from '@/types'

export const maxDuration = 30
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { mediaId, query, from } = await req.json()

  try {
    let tags: ImageTags | null = null

    if (query) {
      // Step: Extract tags from text query
      console.log('📝 Extracting tags from text query:', query)
      tags = await extractProductFromText(query)
    } else if (mediaId) {
      // Step: Download and analyze image
      console.log('📥 Downloading image...')
      const imageBase64 = await downloadMediaAsBase64(mediaId)
      console.log('🔍 Analyzing with Groq Vision...')
      tags = await analyzeProductImage(imageBase64)
    }

    if (!tags) {
      console.log('ℹ️ No tags extracted, skipping search.')
      return NextResponse.json({ ok: true, found: 0 })
    }

    console.log('Tags:', tags)

    // Step 3: Real Google Shopping Search via Serper
    console.log('🛍️ Searching Google Shopping for real product URLs...')
    const products = await searchGoogleProducts(tags)

    if (!products || products.length === 0) {
      await sendTextMessage(
        from,
        '😔 Sorry! We could not find any matching product on Google Shopping for this photo.\n\nPlease try with another photo? 📸'
      ).catch(err => console.error('Failed to send no-match message:', err))

      return NextResponse.json({ ok: true, found: 0 })
    }

    // Step 5: Prepare display list
    const displayProducts = products.slice(0, 3)

    // Step 4: Send intro message
    const intro = `🛍️ Got your photo! We found *${displayProducts.length}* similar products on Google Shopping:\n\n(Click the links below to view each product directly 👇)`
    await sendTextMessage(from, intro)
    await delay(800)

    // Step 5: Send each product as a separate card with image and "Click here" link
    for (let i = 0; i < displayProducts.length; i++) {
      const p = displayProducts[i]
      const emoji = ['1️⃣', '2️⃣', '3️⃣'][i] || `${i + 1}.`
      
      // Caption with Emoji, Title and Price
      const caption = [
        `${emoji} *${p.title}*`,
        p.price ? `💰 Price: ${p.price}` : '',
        p.source ? `🏪 Source: ${p.source}` : ''
      ].filter(Boolean).join('\n')

      // Use sendProductImage to send the image first
      if (p.imageUrl) {
        await sendProductImage(from, p.imageUrl, caption)
      } else {
        await sendTextMessage(from, caption)
      }
      
      await delay(400)

      // Use sendUrlButton for the clickable "Click here" link
      await sendUrlButton(from, p.link, '🛒 Click here to view product')
      await delay(600)
    }

    // Step 6: Closing message
    await sendTextMessage(from, '✨ Want to find another product? Just send a photo!')

    console.log('✅ Search pipeline complete!')
    return NextResponse.json({ ok: true, found: products.length })

  } catch (error) {
    console.error('Search pipeline error:', error)
    await sendTextMessage(
      from,
      '⚠️ A technical error occurred. Please try again in a little while!'
    ).catch(() => { })
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
