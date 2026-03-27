import { analyzeProductImage } from './lib/groq'
import { config } from 'dotenv'
config({ path: '.env.local' })
import { readFileSync } from 'fs'
import { join } from 'path'

async function run() {
  try {
    // Generate a simple 1x1 black image in base64 just to test if the model exists and runs
    const base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
    const tags = await analyzeProductImage(base64)
    console.log('Result tags:', tags)
  } catch(e) {
    console.error('Groq vision failed:', e.message)
  }
}
run()
