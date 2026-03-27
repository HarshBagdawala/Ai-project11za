import { config } from 'dotenv';
config({ path: '.env.local' });
import Groq from 'groq-sdk';
import fs from 'fs';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function run() {
  const models = await groq.models.list();
  const ids = models.data.map(m => m.id);
  fs.writeFileSync('models.json', JSON.stringify(ids, null, 2));
}
run();
