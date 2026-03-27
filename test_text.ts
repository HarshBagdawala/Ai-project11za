import { extractProductFromText } from './lib/groq';
import { config } from 'dotenv';
config({ path: '.env.local' });

async function run() {
  const texts = [
    "I want a black casual polo t-shirt",
    "muje ek badhiya sa smartwatch chahiye",
    "red kurti dekhao",
    "kya hal hai?"
  ];
  for (const t of texts) {
    console.log('\n--- Text:', t);
    const intent = await extractProductFromText(t);
    console.log('Intent:', intent);
  }
}
run();
