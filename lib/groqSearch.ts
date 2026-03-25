// ⚠️ This file is no longer used.
// Product search is now handled by lib/serper.ts (Google Shopping via Serper API).
// Keeping this file to avoid breaking any old imports, but it returns empty.

import type { ImageTags } from '@/types'

export async function searchProductsWithGroq(_tags: ImageTags): Promise<string[]> {
  console.warn('⚠️ searchProductsWithGroq() is deprecated. Use searchGoogleProducts() from lib/serper.ts instead.')
  return []
}
