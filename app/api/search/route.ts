import { NextResponse } from 'next/server'
import { analyzeProductImage } from '@/lib/groq'
import { downloadMediaAsBase64, sendTextMessage, sendUrlMessage } from '@/lib/elevenZa'
import { searchProductsWithGroq } from '@/lib/groqSearch'
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

    // Step 3: Web Search for URLs via Groq
    console.log('🤖 Asking Groq to search for exact products online...')
    const searchUrls = await searchProductsWithGroq(tags)

    if (!searchUrls || searchUrls.length === 0) {
      await sendTextMessage(
        from,
        '😔 Sorry! Right now, no exact product (web URL) matching this photo could be found on the internet.\n\nTry another photo? 📸'
      ).catch(err => console.error('Failed to send no-match message:', err))

      return NextResponse.json({ ok: true, found: 0 })
    }

    // Step 4: Send Web URL matches using sendUrlMessage
    console.log(`📤 Sending ${searchUrls.length} URL(s) back to customer...`)
    await sendTextMessage(from, '🌐 We have found these exactly matching product links on the web:')
    await delay(800)
    for (const url of searchUrls) {
      await sendUrlMessage(from, url)
      await delay(600)
    }

    // Send closing footer
    await sendTextMessage(from, '✨ Send a photo if you want to find another product!')

    console.log('✅ Search pipeline complete!')
    return NextResponse.json({ ok: true, found: searchUrls.length })

  } catch (error) {
    console.error('Search pipeline error:', error)
    await sendTextMessage(
      from,
      '⚠️ Some technical issue occurred. Please try again in a little while!'
    ).catch(() => { })
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
