export interface Product {
  id: string
  name: string
  category: string
  color: string
  style: string
  price: number
  image_url: string
  buy_url: string
  description: string
  embedding?: number[]
  is_active: boolean
  created_at: string
}

export interface ProductMatch {
  id: string
  name: string
  price: number
  image_url: string
  buy_url: string
  category: string
  color: string
  similarity: number
}

export interface ImageTags {
  category: string
  color: string
  type: string
  style: string
  keywords: string[]
  minPrice?: number
  maxPrice?: number
}

export interface WhatsAppMessage {
  id: string
  from: string
  type: 'text' | 'image' | 'document' | 'audio'
  timestamp: string
  image?: {
    id: string
    mime_type: string
    sha256: string
    caption?: string
  }
  text?: {
    body: string
  }
}

export interface SearchLog {
  customer_phone: string
  image_url?: string
  detected_tags?: ImageTags
  matched_product_ids?: string[]
  response_sent: boolean
}
