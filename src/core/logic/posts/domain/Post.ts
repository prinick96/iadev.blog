export type Post = {
  id: string
  title: string
  description: string
  category_ids: string[]
  published_at: Date
  // por si i make a mistake
  updated_at?: Date
}
