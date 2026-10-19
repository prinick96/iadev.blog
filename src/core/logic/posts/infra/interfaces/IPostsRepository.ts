import type { PostSource } from '@/core/logic/posts/domain/PostSource'

// Bueno por si mañana me animo a pedirle a Claude que me haga un backend
// y hacemos inversión de dependencias, pero tú que vas a saber
export interface IPostsRepository<TSource extends PostSource = PostSource> {
  list(): Promise<TSource[]>
}
