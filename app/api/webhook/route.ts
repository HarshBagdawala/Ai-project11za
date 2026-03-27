import { NextRequest, NextResponse } from 'next/server'
import { saveUserIfNotExists } from '@/lib/supabase'

export const maxDuration = 10
export const dynamic = 'force-dynamic'

// GET — Webhook verification (11za/Meta)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ Webhook verified')
    return new Response(challenge, { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

// POST — Incoming WhatsApp messages
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('📨 Incoming Webhook Payload:', JSON.stringify(body, null, 2))

    let from: string | undefined
    let type: string | undefined
    let mediaId: string | undefined
    let text: string | undefined

    // 1. Try Standard Meta Cloud API Format (Prioritize this to fix sender number routing)
    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const message = value?.messages?.[0]

    if (message) {
      from = message.from
      type = message.type
      text = message.text?.body
      mediaId = message.image?.id
    }
    // 2. Fallback to 11za Direct Format
    else if (body.from && body.content) {
      from = body.from
      type = body.content.contentType

      // Handle the new 11za "media" -> "url" payload format
      if (type === 'media' && body.content.media?.type === 'image') {
        type = 'image' // map to internal "image" type
        mediaId = body.content.media.url // pass the direct URL instead of graph API ID
      } else if (type === 'media' && (body.content.media?.type === 'audio' || body.content.media?.type === 'voice')) {
        type = 'audio'
        mediaId = body.content.media.url
      } else {
        mediaId = body.content.mediaId || body.content.image?.id || body.content.audio?.id || body.content.voice?.id
      }

      text = body.content.text
    }

    if (!from || !type) {
      console.log('ℹ️ No valid message found in payload')
      return NextResponse.json({ ok: true })
    }

    // Save user to Database if they are new (or update their last active time)
    saveUserIfNotExists(from).catch(err => console.error('User save error:', err))

    if (type === 'audio' || type === 'voice') {
      if (!mediaId) {
        console.error('❌ Audio message received but no mediaId found')
        return NextResponse.json({ ok: true })
      }

      const baseUrl = req.nextUrl.origin

      console.log(`🎙️ Triggering voice search pipeline for ${from}: ${baseUrl}/api/search`)
      fetch(`${baseUrl}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioId: mediaId, from })
      }).catch(err => console.error('❌ Pipeline trigger failed:', err))

      await new Promise(resolve => setTimeout(resolve, 1000))

    } else if (type === 'image') {
      if (!mediaId) {
        console.error('❌ Image message received but no mediaId found')
        return NextResponse.json({ ok: true })
      }

      const baseUrl = req.nextUrl.origin

      console.log(`🚀 Triggering search pipeline for ${from}: ${baseUrl}/api/search`)
      fetch(`${baseUrl}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId, from })
      }).catch(err => console.error('❌ Pipeline trigger failed:', err))

      // Important: Vercel serverless freezes execution the moment Next.js returns the HTTP response.
      // We must give the Node.js event pool ~1 second to negotiate TLS and flush the fetch() network request
      // to the background `/api/search` worker before returning!
      await new Promise(resolve => setTimeout(resolve, 1000))

    } else if (type === 'text' && text) {
      console.log(`💬 Text message from ${from}: ${text}`)
      
      const baseUrl = req.nextUrl.origin

      // Trigger search pipeline for text (it will auto-detect product intent)
      console.log(`🚀 Triggering text-search pipeline for ${from}: ${baseUrl}/api/search`)
      fetch(`${baseUrl}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, from })
      })
      .then(async (res) => {
        const data = await res.json();
        // If it wasn't a product search or a chat (found: 0 and !chat), send the help message
        if (data.found === 0 && !data.chat) {
          const { sendTextMessage } = await import('@/lib/elevenZa')
          const { getWelcomeMessage } = await import('@/lib/groq')
          const welcomeMsg = await getWelcomeMessage(text)
          await sendTextMessage(from, welcomeMsg)
            .catch(err => console.error('❌ Failed to send welcome message:', err))
        }
      })
      .catch(err => console.error('❌ Pipeline trigger failed:', err))

      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ ok: true })
  }
}
