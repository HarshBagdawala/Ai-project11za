import { NextResponse } from 'next/server'
import { analyzeProductImage } from '@/lib/groq'
import { downloadMediaAsBase64, sendTextMessage, sendUrlMessage } from '@/lib/elevenZa'
import { searchProductsWithGemini } from '@/lib/gemini'
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

    // Step 3: Web Search for URLs via Gemini
    console.log('🤖 Asking Gemini to search for exact products online...')
    const geminiUrls = await searchProductsWithGemini(tags)

    if (!geminiUrls || geminiUrls.length === 0) {
      await sendTextMessage(
        from,
        '😔 Sorry! Right now, no exact product (web URL) matching this photo could be found on the internet.\n\nTry another photo? 📸'
      ).catch(err => console.error('Failed to send no-match message:', err))

      return NextResponse.json({ ok: true, found: 0 })
    }

    // Step 4: Send Gemini Web URL matches using sendUrlMessage
    console.log(`📤 Sending ${geminiUrls.length} Gemini URL(s) back to customer...`)
    await sendTextMessage(from, '🌐 Web par humein ye exactly matching product links mile hain:')
    await delay(800)
    for (const url of geminiUrls) {
      await sendUrlMessage(from, url)
      await delay(600)
    }

    // Send closing footer
    await sendTextMessage(from, '✨ Koi aur product dhundna ho toh uski photo bhejiye!')

    console.log('✅ Search pipeline complete!')
    return NextResponse.json({ ok: true, found: geminiUrls.length })

  } catch (error) {
    console.error('Search pipeline error:', error)
    await sendTextMessage(
      from,
      '⚠️ Kuch technical issue aa gaya. Thodi der mein dobara try karein!'
    ).catch(() => { })
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
