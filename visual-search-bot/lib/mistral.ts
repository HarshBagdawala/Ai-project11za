import MistralClient from '@mistralai/mistralai'
import type { ImageTags } from '@/types'

const mistral = new MistralClient(process.env.MISTRAL_API_KEY!)

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await mistral.embeddings({
    model: 'mistral-embed',
    input: [text]
  })
  return response.data[0].embedding
}

export function tagsToEmbeddingText(tags: ImageTags): string {
  return [
    tags.category,
    tags.color,
    tags.type,
    tags.style,
    ...tags.keywords
  ].join(' ')
}
