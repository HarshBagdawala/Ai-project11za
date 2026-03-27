import { config } from 'dotenv';
config({ path: '.env.local' });
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function checkModel(modelName) {
  try {
    const response = await groq.chat.completions.create({
      model: modelName,
      max_tokens: 10,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=` } },
            { type: 'text', text: 'test' }
          ]
        }
      ]
    });
    console.log(`✅ ${modelName} relates to a valid vision model.`);
  } catch(e) {
    let msg = e.message;
    if (e.error && e.error.error && e.error.error.message) {
      msg = e.error.error.message;
    }
    console.error(`❌ ${modelName} failed: ${msg}`);
  }
}

async function run() {
  const models = [
    'llama-3.2-11b-vision-preview',
    'llama-3.2-90b-vision-preview',
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'llama-3.2-11b-vision-instruct',
    'llama-3.2-90b-vision-instruct',
    'llama-3.3-70b-versatile'
  ];
  for (const m of models) {
    await checkModel(m);
  }
}
run();
