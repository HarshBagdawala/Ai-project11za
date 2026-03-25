import { createClient } from '@supabase/supabase-js'
import type { ProductMatch, SearchLog } from '@/types'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function searchSimilarProducts(
  embedding: number[],
  matchCount = 3
): Promise<ProductMatch[]> {
  const { data, error } = await supabase.rpc('match_products', {
    query_embedding: embedding,
    match_count: matchCount,
    similarity_threshold: 0.4
  })

  if (error) throw new Error(`Supabase search error: ${error.message}`)
  return data || []
}

export async function saveSearchLog(log: SearchLog): Promise<void> {
  const { error } = await supabase.from('search_logs').insert(log)
  if (error) console.error('Failed to save search log:', error)
}

export async function getAllProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  
  if (error) console.error('Failed to fetch products:', error)
  return data || []
}

export async function getSearchLogs(limit = 50) {
  const { data, error } = await supabase
    .from('search_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) console.error('Failed to fetch logs:', error)
  return data || []
}

export async function saveChatMessage(phone: string, role: 'user' | 'assistant', content: string): Promise<void> {
  const { error } = await supabase.from('chats').insert({ customer_phone: phone, role, content })
  if (error) console.error('Failed to save chat message:', error)
}

export async function getChatHistory(phone: string, limit = 10) {
  const { data, error } = await supabase
    .from('chats')
    .select('role, content')
    .eq('customer_phone', phone)
    .order('created_at', { ascending: true })
    .limit(limit)
  
  if (error) {
    console.error('Failed to fetch chat history:', error)
    return []
  }
  return data || []
}
