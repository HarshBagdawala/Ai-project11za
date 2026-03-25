import { NextResponse } from 'next/server'
import { analyzeProductImage } from '@/lib/groq'
import { downloadMediaAsBase64, sendTextMessage, sendUrlMessage } from '@/lib/elevenZa'
import { searchGoogleProducts } from '@/lib/serper'
import { delay } from '@/lib/utils'

export const maxDuration = 30
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { mediaId, from } = await req.json()

  try {
    // Step 1: Download image from 11za
    console.log('📥 Downloading image...')
    const imageBase64 = await downloadMediaAsBase64(mediaId)

    // Step 2: Analyze with Groq Vision
    console.log('🔍 Analyzing with Groq Vision...')
    const tags = await analyzeProductImage(imageBase64)
    console.log('Tags:', tags)

    // Step 3: Real Google Shopping Search via Serper
    console.log('🛍️ Searching Google Shopping for real product URLs...')
    const products = await searchGoogleProducts(tags)

    if (!products || products.length === 0) {
      await sendTextMessage(
        from,
        '😔 Sorry! Is photo ke jaisa koi product abhi Google Shopping pe nahi mila.\n\nKoi aur photo try karein? 📸'
      ).catch(err => console.error('Failed to send no-match message:', err))

      return NextResponse.json({ ok: true, found: 0 })
    }

    // Step 4: Send intro message
    const intro = `🛍️ Aapki photo dekh li! Humne *${products.length}* similar products dhundhe hain Google Shopping pe:\n\n(Neeche diye links pe click karke directly product dekh sakte hain 👇)`
    await sendTextMessage(from, intro)
    await delay(800)

    // Step 5: Send each product as a separate URL message with details
    for (let i = 0; i < products.length; i++) {
      const p = products[i]
      const emoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'][i] || `${i + 1}.`
      const msg = [
        `${emoji} *${p.title}*`,
        p.price ? `💰 Price: ${p.price}` : '',
        p.source ? `🏪 Source: ${p.source}` : '',
        `🔗 ${p.link}`
      ].filter(Boolean).join('\n')

      await sendUrlMessage(from, msg)
      await delay(600)
    }

    // Step 6: Closing message
    await sendTextMessage(from, '✨ Koi aur product dhundna ho toh photo bhejein!')

    console.log('✅ Search pipeline complete!')
    return NextResponse.json({ ok: true, found: products.length })

  } catch (error) {
    console.error('Search pipeline error:', error)
    await sendTextMessage(
      from,
      '⚠️ Kuch technical issue aa gayi. Thodi der baad dobara try karein!'
    ).catch(() => { })
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
