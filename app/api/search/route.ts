import { NextResponse } from 'next/server'
import { analyzeProductImage, generateFriendlyMessage } from '@/lib/groq'
import { generateEmbedding, tagsToEmbeddingText } from '@/lib/mistral'
import { searchSimilarProducts, saveSearchLog } from '@/lib/supabase'
import { downloadMediaAsBase64, sendMatchedProducts, sendTextMessage } from '@/lib/elevenZa'
import { createPaymentLink } from '@/lib/razorpay'

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

    // Step 3: Generate Mistral embedding
    console.log('🧮 Generating embedding...')
    const embeddingText = tagsToEmbeddingText(tags)
    const embedding = await generateEmbedding(embeddingText)

    // Step 4: Vector search in Supabase
    console.log('🔎 Searching Supabase pgvector...')
    const products = await searchSimilarProducts(embedding, 3)

    // Generate smart Google search query as fallback/extra options
    const searchQuery = `${tags.color || ''} ${tags.style && tags.style !== 'other' ? tags.style : ''} ${tags.type || ''}`.replace(/\s+/g, ' ').trim()
    const googleSearchUrl = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(searchQuery || 'product')}`

    if (!products || products.length === 0) {
      await sendTextMessage(
        from,
        `😔 Sorry! Hamare store mein aapki photo se match karta product abhi available nahi hai.\n\nLekin Google par aap iske jaise similar products yahan dekh sakte hain:\n🛍️ ${googleSearchUrl}\n\nKoi aur photo try karein? 📸`
      ).catch(err => console.error('Failed to send no-match message:', err))
      
      return NextResponse.json({ ok: true, found: 0 })
    }

    // Step 5: Generate payment links & send DB matches
    console.log('💳 Generating payment links...')
    const paymentLinks = await Promise.all(products.map(createPaymentLink))
    const introMessage = await generateFriendlyMessage(tags, products.length)
      
    console.log('📤 Sending products to customer...')
    await sendMatchedProducts(from, products, introMessage, paymentLinks, googleSearchUrl)

    // Step 8: Log to Supabase
    await saveSearchLog({
      customer_phone: from,
      detected_tags: tags,
      matched_product_ids: products.map(p => p.id),
      response_sent: true
    })

    console.log('✅ Search pipeline complete!')
    return NextResponse.json({ ok: true, found: products.length })

  } catch (error) {
    console.error('Search pipeline error:', error)
    await sendTextMessage(
      from,
      '⚠️ Kuch technical issue aa gaya. Thodi der mein dobara try karein!'
    ).catch(() => {})
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
