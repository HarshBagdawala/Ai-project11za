import "dotenv/config";

async function testSerperLens() {
  const url = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop"; // Nike red shoes
  
  try {
    const res = await fetch("https://google.serper.dev/lens", {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url
      })
    });
    
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Result:", JSON.stringify(data).substring(0, 500));
  } catch (err) {
    console.error(err);
  }
}

testSerperLens();
