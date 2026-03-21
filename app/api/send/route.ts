import { NextRequest, NextResponse } from 'next/server'
import { sendTextMessage, sendProductImage } from '@/lib/elevenZa'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { to, type, content } = body

    if (type === 'text') {
      await sendTextMessage(to, content.body)
    } else if (type === 'image') {
      await sendProductImage(to, content.image_url, content.caption)
    } else {
      return NextResponse.json({ error: 'Unsupported message type' }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Send API error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
