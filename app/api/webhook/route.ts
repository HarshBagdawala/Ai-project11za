import { NextRequest, NextResponse } from 'next/server'

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
      } else {
        mediaId = body.content.mediaId || body.content.image?.id
      }
      
      text = body.content.text
    }

    if (!from || !type) {
      console.log('ℹ️ No valid message found in payload')
      return NextResponse.json({ ok: true })
    }

    if (type === 'image') {
      if (!mediaId) {
        console.error('❌ Image message received but no mediaId found')
        return NextResponse.json({ ok: true })
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL
      if (!appUrl) {
        console.error('❌ NEXT_PUBLIC_APP_URL is not set!')
        return NextResponse.json({ ok: true })
      }

      console.log(`🚀 Triggering search pipeline for ${from}: ${appUrl}/api/search`)
      fetch(`${appUrl}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId, from })
      }).catch(err => console.error('❌ Pipeline trigger failed:', err))

    } else if (type === 'text') {
      console.log(`💬 Text message from ${from}: ${text}`)
      const { sendTextMessage } = await import('@/lib/elevenZa')
      await sendTextMessage(
        from,
        '📸 Namaste! Kisi bhi product ki *photo bhejiye* aur main aapko similar products dhundh dunga!\n\n_Bas photo send karo — baaki kaam mera!_ ✨'
      ).catch(err => console.error('❌ Failed to send welcome message:', err))
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ ok: true })
  }
}
