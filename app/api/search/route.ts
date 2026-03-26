import { NextResponse } from 'next/server'
import { analyzeProductImage, extractProductFromText, transcribeAudioMessage } from '@/lib/groq'
import { downloadMediaAsBase64, downloadMediaAsBuffer, sendTextMessage, sendUrlMessage } from '@/lib/elevenZa'
import { getChatHistory, saveChatMessage } from '@/lib/supabase'
import { searchGoogleProducts } from '@/lib/serper'
import { delay } from '@/lib/utils'
import type { ImageTags } from '@/types'

export const maxDuration = 30
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { mediaId, audioId, query, from } = await req.json()

  try {
    let tags: ImageTags | null = null
    let actualQuery = query

    if (audioId) {
      console.log('🎙️ Downloading audio message...')
      const audioBuffer = await downloadMediaAsBuffer(audioId)
      console.log('🔉 Transcribing with Groq Whisper...')
      actualQuery = await transcribeAudioMessage(audioBuffer)
      console.log(`📝 Transcribed text: "${actualQuery}"`)
      
      if (!actualQuery || actualQuery.trim() === '') {
        await sendTextMessage(from, 'I could not hear that properly. Could you please try again?')
        return NextResponse.json({ ok: true, found: 0 })
      }
    }

    if (actualQuery) {
      // Step: Extract tags from text query with history
      console.log('📝 Extracting tags from text query:', actualQuery)
      const history = await getChatHistory(from)
      tags = await extractProductFromText(actualQuery, history)
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
    const intro = `🛍️ Got your photo! We found *${displayProducts.length}* similar products on Google Shopping:`
    await sendTextMessage(from, intro)
    await delay(800)

    // Step 5: Send each product as a separate URL message with details
    for (let i = 0; i < displayProducts.length; i++) {
      const p = displayProducts[i]
      const emoji = ['1️⃣', '2️⃣', '3️⃣'][i] || `${i + 1}.`
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
    await sendTextMessage(from, '✨ Want to find another product? Just send a photo, voice note, or tell me what you need!')

    // Chat History Saving
    if (actualQuery) {
      const replySummary = `I found ${displayProducts.length} products. E.g., ${displayProducts.map(p => p.title).join(' | ')}`
      await saveChatMessage(from, 'user', actualQuery)
      await saveChatMessage(from, 'assistant', replySummary)
    }

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
