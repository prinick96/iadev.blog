import GetAuthors from '@/core/logic/authors/application/GetAuthors'
import AstroAuthorsRepository from '@/core/logic/authors/infra/astro/AuthorsRepository.astro'

const repository = new AstroAuthorsRepository()

export const getAuthorsService = new GetAuthors(repository)
