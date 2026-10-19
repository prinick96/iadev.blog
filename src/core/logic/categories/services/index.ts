import GetCategories from '@/core/logic/categories/application/GetCategories'
import AstroCategoriesRepository from '@/core/logic/categories/infra/astro/CategoriesRepository.astro'

const repository = new AstroCategoriesRepository()

export const getCategoriesService = new GetCategories(repository)
