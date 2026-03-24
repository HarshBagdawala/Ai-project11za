import { NextResponse } from 'next/server'
import { analyzeProductImage, generateFriendlyMessage } from '@/lib/groq'
import { generateEmbedding, tagsToEmbeddingText } from '@/lib/mistral'
import { searchSimilarProducts, saveSearchLog } from '@/lib/supabase'
import { downloadMediaAsBase64, sendMatchedProducts, sendTextMessage, sendUrlMessage } from '@/lib/elevenZa'
import { searchProductsWithGemini } from '@/lib/gemini'
import { createPaymentLink } from '@/lib/razorpay'
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

    // Step 3: Generate Mistral embedding
    console.log('🧮 Generating embedding...')
    const embeddingText = tagsToEmbeddingText(tags)
    const embedding = await generateEmbedding(embeddingText)

    // Step 4: Vector search in Supabase
    console.log('🔎 Searching Supabase pgvector...')
    const products = await searchSimilarProducts(embedding, 3)

    // Step 5: Gemini API Web Search for URLs
    console.log('🤖 Asking Gemini to search for products online...')
    const geminiUrls = await searchProductsWithGemini(tags)

    if ((!products || products.length === 0) && (!geminiUrls || geminiUrls.length === 0)) {
      await sendTextMessage(
        from,
        '😔 Sorry! Hamare store aur web par is waqt is photo se match karta kuch nahi mila.\n\nKoi aur photo try karein? 📸'
      ).catch(err => console.error('Failed to send no-match message:', err))
      
      return NextResponse.json({ ok: true, found: 0 })
    }

    // Step 6: Generate payment links & send DB matches
    if (products && products.length > 0) {
      console.log('💳 Generating payment links...')
      const paymentLinks = await Promise.all(products.map(createPaymentLink))
      const introMessage = await generateFriendlyMessage(tags, products.length)
        
      console.log('📤 Sending Supabase products to customer...')
      await sendMatchedProducts(from, products, introMessage, paymentLinks)
    }

    // Step 7: Send Gemini Web URL matches using new sendUrlMessage
    if (geminiUrls && geminiUrls.length > 0) {
      console.log(`📤 Sending ${geminiUrls.length} Gemini URL(s)...`)
      await sendTextMessage(from, '🌐 Web par humein ye best product search links mile hain:')
      await delay(800)
      for (const url of geminiUrls) {
        await sendUrlMessage(from, url)
        await delay(600)
      }
    }

    // Send closing footer
    await sendTextMessage(from, '✨ Koi aur product dhundna ho toh uski photo bhejiye!')

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
