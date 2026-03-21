# 🤖 WhatsApp Visual Search Bot

A production-ready Next.js 14 chatbot that analyzes product photos sent on WhatsApp and finds similar items using AI.

## 🚀 Features

- **📸 Visual Product Search**: Customers send a photo on WhatsApp
- **🤖 AI Image Analysis**: Groq Vision extracts product tags (color, type, style)
- **🧮 Vector Search**: Mistral embeddings + Supabase pgVector finds top 3 matches
- **💳 Payment Integration**: Razorpay payment links auto-generated
- **🌐 Multi-language**: Natural Hinglish responses
- **⚡ Serverless**: Deployed on Vercel, prod-ready

## 📋 Tech Stack

| Component | Technology |
|-----------|-----------|
| **Framework** | Next.js 14 (TypeScript, App Router) |
| **WhatsApp API** | 11za (Meta-based WABA) |
| **Vision AI** | Groq — `meta-llama/llama-4-scout-17b-16e-instruct` |
| **LLM** | Groq — `mixtral-8x7b-32768` |
| **Embeddings** | Mistral — `mistral-embed` (1024 dims) |
| **Vector DB** | Supabase (PostgreSQL + pgVector) |
| **Payments** | Razorpay |
| **Hosting** | Vercel |

## 📁 Project Structure

```
visual-search-bot/
├── app/
│   ├── api/
│   │   ├── webhook/route.ts    # WhatsApp message receiver
│   │   ├── search/route.ts     # AI search pipeline
│   │   └── send/route.ts       # Manual message sender
│   ├── dashboard/page.tsx      # Admin dashboard
│   ├── layout.tsx
│   ├── page.tsx                # Status page
│   └── globals.css
├── lib/
│   ├── groq.ts                 # Vision + text LLM
│   ├── mistral.ts              # Embeddings
│   ├── supabase.ts             # Database client
│   ├── elevenZa.ts             # WhatsApp API calls
│   ├── razorpay.ts             # Payment links
│   └── utils.ts                # Helpers
├── types/index.ts              # TypeScript interfaces
├── supabase/migrations/
│   └── 001_setup.sql           # DB schema + RPC
├── scripts/
│   └── ingestCatalog.ts        # Batch upload products
├── .env.local.example
├── vercel.json
└── package.json
```

## ⚙️ Setup Instructions

### 1. Clone & Install

```bash
git clone <repo>
cd visual-search-bot
npm install
```

### 2. Setup Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with:
- **11za**: Get from https://11za.in
- **Groq**: Get from https://console.groq.com
- **Mistral**: Get from https://console.mistral.ai
- **Supabase**: Create project at https://supabase.com
- **Razorpay**: Get from https://razorpay.com

### 3. Create Supabase Database

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

### 4. Ingest Sample Products

```bash
npm run ingest
```

### 5. Run Locally

```bash
npm run dev
# Open http://localhost:3000
```

### 6. Deploy to Vercel

```bash
npx vercel --prod
```

After deployment, add all environment variables on Vercel dashboard.

### 7. Register WhatsApp Webhook

Go to https://developers.facebook.com/docs/whatsapp/cloud-api and register webhook:

```
URL: https://your-vercel-url.vercel.app/api/webhook
Verify Token: (value from WEBHOOK_VERIFY_TOKEN)
Subscribe to: messages, message_status
```

## 📡 How It Works

### Incoming Message Flow

1. Customer sends product 📸 on WhatsApp
2. 11za API sends webhook to `/api/webhook`
3. Webhook extracts media ID and triggers `/api/search` (async)

### Search Pipeline (30s max)

1. **Download**: Fetch image from 11za using media ID
2. **Vision**: Groq analyzes image → extracts {category, color, type, style, keywords}
3. **Embed**: Mistral converts tags to 1024-dim vector
4. **Search**: Supabase pgVector RPC finds top 3 products (cosine similarity > 0.4)
5. **Payment**: Razorpay generates payment links for each product
6. **Reply**: Send 3 product cards with links back to customer
7. **Log**: Save search metadata to `search_logs` table

### Example Response

```
1️⃣ Blue Cotton Kurti
💰 Price: ₹899
🎨 Color: blue

🛒 Abhi kharido:
https://rzp.io/i/abc123
```

## 🧪 Testing

### Local Webhook Test

```bash
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "919999999999",
            "type": "image",
            "image": {"id": "MEDIA_ID_HERE"}
          }]
        }
      }]
    }]
  }'
```

### Verify Webhook (11za)

```bash
curl "http://localhost:3000/api/webhook?hub.mode=subscribe&hub.verify_token=TEST_TOKEN&hub.challenge=CHALLENGE_VALUE"
# Should return: CHALLENGE_VALUE
```

## 📊 Admin Dashboard

Visit `/dashboard` to see:
- **Products**: Catalog with images, prices, embeddings
- **Logs**: Search history with matched products

## 🔑 Key Configuration

### Vercel Function Timeout

`vercel.json` enforces 30s timeout on search route:
```json
{
  "functions": {
    "app/api/search/route.ts": { "maxDuration": 30 }
  }
}
```

### Supabase pgVector Search

The RPC function `match_products()` uses cosine distance:
```sql
1 - (embedding <=> query_embedding) > 0.4
```

Returns top 3 products by similarity.

### Rate Limiting

Messages sent with 600-800ms delays to avoid WhatsApp spam detection:
```typescript
await delay(600)
await sendProductImage(to, url, caption)
```

## ⚠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| Webhook not receiving messages | Check WEBHOOK_VERIFY_TOKEN matches 11za settings |
| Search takes >30s | Reduce products count or optimize embeddings |
| Razorpay links failing | Check RAZORPAY_KEY_ID/SECRET are valid |
| High embedding latency | Mistral API has rate limits; add queue |

## 🚀 Production Checklist

- [ ] All environment variables set on Vercel
- [ ] Supabase migration applied (`npx supabase db push`)
- [ ] Products ingested (`npm run ingest`)
- [ ] Webhook registered with 11za
- [ ] maxDuration set in vercel.json
- [ ] Error logging configured (Sentry/LogRocket recommended)
- [ ] Rate limiting added to API routes
- [ ] SSL certificate valid on custom domain

## 📚 API Routes

### `POST /api/webhook`

**Receive WhatsApp messages**

Request:
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "919999999999",
          "type": "image|text",
          "image": { "id": "MEDIA_ID" }
        }]
      }
    }]
  }]
}
```

Response: Always `{ "ok": true }` (HTTP 200)

### `POST /api/search`

**Trigger visual search pipeline**

Request:
```json
{
  "mediaId": "WHATSAPP_MEDIA_ID",
  "from": "919999999999"
}
```

Response:
```json
{
  "ok": true,
  "found": 3
}
```

### `POST /api/send`

**Send message manually**

Request:
```json
{
  "to": "919999999999",
  "type": "text",
  "content": { "body": "Hi there!" }
}
```

## 📞 Support

For issues with:
- **11za API**: https://docs.11za.in
- **Groq**: https://console.groq.com/docs
- **Supabase**: https://supabase.com/docs
- **Razorpay**: https://razorpay.com/docs

---

**Made with ❤️ for Indian e-commerce** 🇮🇳
