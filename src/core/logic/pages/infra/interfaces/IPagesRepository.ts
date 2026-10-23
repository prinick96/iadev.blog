import type { PageSource } from '@/core/logic/pages/domain/PageSource'

export interface IPagesRepository<TSource extends PageSource = PageSource> {
  getById(id: string): Promise<TSource | undefined>
}
