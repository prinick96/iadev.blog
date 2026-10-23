import GetPage from '@/core/logic/pages/application/GetPage'
import AstroPagesRepository from '@/core/logic/pages/infra/astro/PagesRepository.astro'

const repository = new AstroPagesRepository()

export const getPageService = new GetPage(repository)
