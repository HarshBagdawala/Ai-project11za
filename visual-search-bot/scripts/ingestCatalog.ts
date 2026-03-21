import MistralClient from '@mistralai/mistralai'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const mistral = new MistralClient(process.env.MISTRAL_API_KEY!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// SAMPLE PRODUCTS — Replace with your actual catalog
const sampleProducts = [
  {
    name: 'Blue Cotton Kurti',
    category: 'clothing',
    color: 'blue',
    style: 'ethnic',
    price: 899,
    image_url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500',
    buy_url: 'https://yourstore.com/products/blue-kurti',
    description: 'blue cotton ethnic kurti casual traditional women Indian fashion'
  },
  {
    name: 'Floral Printed Dress',
    category: 'clothing',
    color: 'multicolor',
    style: 'western',
    price: 1249,
    image_url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500',
    buy_url: 'https://yourstore.com/products/floral-dress',
    description: 'floral print western dress casual colorful summer women fashion'
  },
  {
    name: 'White Linen Shirt',
    category: 'clothing',
    color: 'white',
    style: 'casual',
    price: 649,
    image_url: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=500',
    buy_url: 'https://yourstore.com/products/linen-shirt',
    description: 'white linen casual shirt men summer lightweight fabric'
  },
  {
    name: 'Black Denim Jeans',
    category: 'clothing',
    color: 'black',
    style: 'casual',
    price: 1299,
    image_url: 'https://images.unsplash.com/photo-1542272604-787c62d465d1?w=500',
    buy_url: 'https://yourstore.com/products/black-jeans',
    description: 'black denim jeans casual comfortable fit men women classic style'
  },
  {
    name: 'Red Saree with Gold Border',
    category: 'clothing',
    color: 'red',
    style: 'ethnic',
    price: 2499,
    image_url: 'https://images.unsplash.com/photo-1505252585461-04db1267ae5b?w=500',
    buy_url: 'https://yourstore.com/products/red-saree',
    description: 'red silk saree traditional indian ethnic wear wedding festival'
  },
  {
    name: 'Sports Sneakers White',
    category: 'footwear',
    color: 'white',
    style: 'sporty',
    price: 2999,
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
    buy_url: 'https://yourstore.com/products/white-sneakers',
    description: 'white sports sneakers athletic trainers comfortable running shoes'
  },
  {
    name: 'Brown Leather Shoes',
    category: 'footwear',
    color: 'brown',
    style: 'formal',
    price: 3999,
    image_url: 'https://images.unsplash.com/photo-1507694712202-91bbbf6e0ea2?w=500',
    buy_url: 'https://yourstore.com/products/brown-leather',
    description: 'brown leather formal shoes men office business professional'
  },
  {
    name: 'Gold Pendant Necklace',
    category: 'accessories',
    color: 'gold',
    style: 'casual',
    price: 1599,
    image_url: 'https://images.unsplash.com/photo-1555563141-6aee26bb1e8d?w=500',
    buy_url: 'https://yourstore.com/products/gold-necklace',
    description: 'gold pendant necklace jewelry women fashion accessory'
  },
  {
    name: 'Silver Bracelet Set',
    category: 'accessories',
    color: 'silver',
    style: 'ethnic',
    price: 899,
    image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500',
    buy_url: 'https://yourstore.com/products/silver-bracelet',
    description: 'silver bracelet set ethnic traditional women jewelry'
  },
  {
    name: 'Black Sunglasses',
    category: 'accessories',
    color: 'black',
    style: 'casual',
    price: 1799,
    image_url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500',
    buy_url: 'https://yourstore.com/products/black-sunglasses',
    description: 'black sunglasses UV protection stylish summer fashion'
  }
]

async function ingestProduct(product: typeof sampleProducts[0]) {
  const embText = `${product.category} ${product.color} ${product.style} ${product.description}`

  console.log(`📝 Generating embedding for: ${product.name}`)
  const embRes = await mistral.embeddings({
    model: 'mistral-embed',
    input: [embText]
  })

  const embedding = embRes.data[0].embedding

  const { error } = await supabase.from('products').insert({
    ...product,
    embedding
  })

  if (error) throw error
  console.log(`✅ Ingested: ${product.name}`)
}

async function main() {
  console.log('🚀 Starting catalog ingestion...')
  console.log(`📦 Processing ${sampleProducts.length} products\n`)

  for (const product of sampleProducts) {
    await ingestProduct(product)
    await new Promise(r => setTimeout(r, 300)) // rate limit
  }

  console.log(`\n🎉 Done! ${sampleProducts.length} products ingested to Supabase.`)
  console.log('✨ Your visual search catalog is ready!')
}

main().catch(err => {
  console.error('❌ Ingestion failed:', err)
  process.exit(1)
})
