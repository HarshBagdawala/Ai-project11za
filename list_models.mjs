import { config } from 'dotenv';
config({ path: '.env.local' });
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function run() {
  const models = await groq.models.list();
  console.log(models.data.map(m => m.id).join(', '));
}
run();
