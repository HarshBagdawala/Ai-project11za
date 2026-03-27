import { config } from 'dotenv';
config({ path: '.env.local' });

// Simple fetch test to Google Serper
async function searchGoogleProducts(tags) {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    console.error('Missing SERPER_API_KEY');
    return [];
  }

  const query = 'black casual t-shirt polo buy online India';
  console.log('Searching:', query);

  const res = await fetch("https://google.serper.dev/shopping", {
    method: 'POST',
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ q: query, gl: "in", num: 40 })
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('API error:', res.status, errText);
    return [];
  }

  const data = await res.json();
  if (!data.shopping) {
    console.log('No shopping results');
    return [];
  }

  const filteredProducts = data.shopping.filter((item) => {
    if (!item.link || !item.link.startsWith('http')) return false;
    if (!item.imageUrl || !item.imageUrl.startsWith('http') || item.imageUrl.toLowerCase().includes('.webp')) return false;
    return true;
  });

  return filteredProducts;
}

searchGoogleProducts().then(res => {
  console.log('Found', res.length, 'products');
  if (res.length > 0) console.log(res[0]);
}).catch(console.error);
