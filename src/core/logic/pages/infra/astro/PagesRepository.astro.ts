import { type CollectionEntry, getEntry } from 'astro:content'
import type { IPagesRepository } from '@/core/logic/pages/infra/interfaces/IPagesRepository'

class AstroPagesRepository implements IPagesRepository<CollectionEntry<'pages'>> {
  async getById(id: string): Promise<CollectionEntry<'pages'> | undefined> {
    return getEntry('pages', id)
  }
}

export default AstroPagesRepository
