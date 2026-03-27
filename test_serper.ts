import { searchGoogleProducts } from './lib/serper'
import { config } from 'dotenv'
config({ path: '.env.local' })

async function run() {
  const result = await searchGoogleProducts({
    category: 'clothing',
    color: 'black',
    type: 't-shirt',
    style: 'casual',
    keywords: ['polo']
  })
  console.log('Result length:', result.length)
  if (result.length > 0) {
    console.log(result[0])
  } else {
    console.log('No products found.')
  }
}
run()
