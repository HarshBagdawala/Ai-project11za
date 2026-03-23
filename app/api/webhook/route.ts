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

    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const messages = value?.messages

    if (!messages || messages.length === 0) {
      console.log('ℹ️ No messages in payload')
      return NextResponse.json({ ok: true })
    }

    const message = messages[0]
    const from = message.from

    if (message.type === 'image') {
      const mediaId = message.image?.id

      if (!mediaId) return NextResponse.json({ ok: true })

      // Fire search pipeline (non-blocking)
      const appUrl = process.env.NEXT_PUBLIC_APP_URL
      if (!appUrl) {
        console.error('❌ NEXT_PUBLIC_APP_URL is not set!')
        return NextResponse.json({ ok: true })
      }

      console.log(`🚀 Triggering search pipeline: ${appUrl}/api/search`)
      fetch(`${appUrl}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId, from })
      }).catch(err => console.error('❌ Pipeline trigger failed:', err))

    } else if (message.type === 'text') {
      // Send instructions
      const { sendTextMessage } = await import('@/lib/elevenZa')
      await sendTextMessage(
        from,
        '📸 Namaste! Kisi bhi product ki *photo bhejiye* aur main aapko similar products dhundh dunga!\n\n_Bas photo send karo — baaki kaam mera!_ ✨'
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ ok: true }) // Always 200 to 11za
  }
}
