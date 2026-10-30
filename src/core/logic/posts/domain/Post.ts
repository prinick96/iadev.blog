export type Post = {
  id: string
  title: string
  description: string
  author_id: string
  category_ids: string[]
  reading_time_minutes: number
  token_count: number
  published_at: Date
  pinned: boolean
  // por si i make a mistake
  updated_at?: Date
}
