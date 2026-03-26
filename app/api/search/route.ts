import { NextResponse } from 'next/server'
import { analyzeProductImage, extractProductFromText, transcribeAudioMessage, getLocalizedMessages } from '@/lib/groq'
import { downloadMediaAsBase64, downloadMediaAsBuffer, sendTextMessage, sendProductImage } from '@/lib/elevenZa'
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
        const msgs = await getLocalizedMessages(null)
        await sendTextMessage(from, msgs.notUnderstood)
        return NextResponse.json({ ok: true, found: 0 })
      }
    }

    if (actualQuery) {
      // Step: Extract tags from text query with history
      console.log('📝 Extracting tags from text query:', actualQuery)
      const history = await getChatHistory(from)
      const intent = await extractProductFromText(actualQuery, history)

      if (intent && 'chatReply' in intent) {
        console.log('🤖 Conversational AI Reply:', intent.chatReply)
        await sendTextMessage(from, intent.chatReply)
        // Chat History Saving
        await saveChatMessage(from, 'user', actualQuery)
        await saveChatMessage(from, 'assistant', intent.chatReply)
        return NextResponse.json({ ok: true, found: 0, chat: true })
      } else {
        tags = intent as ImageTags
      }
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
    
    // Step: Get User's Language
    const msgs = await getLocalizedMessages(actualQuery);

    // Step 3: Real Google Shopping Search via Serper
    console.log('🛍️ Searching Google Shopping for real product URLs...')
    const products = await searchGoogleProducts(tags)

    if (!products || products.length === 0) {
      await sendTextMessage(from, msgs.noMatch).catch(err => console.error('Failed to send no-match message:', err))
      return NextResponse.json({ ok: true, found: 0 })
    }

    // Step 5: Prepare display list
    const displayProducts = products.slice(0, 3)

    // Step 4: Send intro message
    const intro = msgs.intro.replace('{count}', String(displayProducts.length))
    await sendTextMessage(from, intro)
    await delay(800)

    // Step 5: Send each product as a beautiful Image Message with details
    for (let i = 0; i < displayProducts.length; i++) {
      const p = displayProducts[i]
      const rank = ['🥇', '🥈', '🥉'][i] || `✨`
      
      const caption = [
        `${rank} *${p.title}*`,
        `━━━━━━━━━━━━━━━━━━`,
        p.price ? `💰 *${msgs.priceLabel}* ${p.price}` : null,
        p.source ? `🏪 *${msgs.sourceLabel}* ${p.source}` : null,
        ``,
        `🛒 *Tap below to view product:*`,
        p.link
      ].filter(line => line !== null && line !== undefined).join('\n')

      if (p.imageUrl) {
        await sendProductImage(from, p.imageUrl, caption)
      } else {
        await sendTextMessage(from, caption)
      }
      await delay(600)
    }

    // Step 6: Closing message
    await sendTextMessage(from, msgs.closing)

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
