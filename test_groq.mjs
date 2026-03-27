import { config } from 'dotenv';
config({ path: '.env.local' });
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function analyzeProductImage(imageBase64) {
  const response = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    max_tokens: 400,
    temperature: 0.1,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`
            }
          },
          {
            type: 'text',
            text: `Analyze this product image.`
          }
        ]
      }
    ]
  });
  return response.choices[0].message.content;
}

async function run() {
  try {
    const base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    console.log('Calling Groq Vision API...');
    const result = await analyzeProductImage(base64);
    console.log('Result:', result);
  } catch(e) {
    console.error('Groq Vision error:', e.message);
  }
}
run();
