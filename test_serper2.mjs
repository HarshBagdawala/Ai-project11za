import { config } from 'dotenv';
config({ path: '.env.local' });

async function searchGoogleProducts() {
  const apiKey = process.env.SERPER_API_KEY;
  const query = 'black casual t-shirt polo buy online India';
  
  const res = await fetch("https://google.serper.dev/shopping", {
    method: 'POST',
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ q: query, gl: "in", num: 40 })
  });
  
  const data = await res.json();
  const allProducts = data.shopping || [];
  console.log('Total products returned from Serper:', allProducts.length);
  
  const webpProducts = allProducts.filter(p => p.imageUrl && p.imageUrl.toLowerCase().includes('.webp'));
  console.log('Products that are .webp:', webpProducts.length);
  
  const filteredProducts = allProducts.filter((item) => {
    if (!item.link || !item.link.startsWith('http')) return false;
    if (!item.imageUrl || !item.imageUrl.startsWith('http') || item.imageUrl.toLowerCase().includes('.webp')) return false;
    return true;
  });
  console.log('Products left after filtering out .webp and invalid URLs:', filteredProducts.length);
}

searchGoogleProducts().catch(console.error);
