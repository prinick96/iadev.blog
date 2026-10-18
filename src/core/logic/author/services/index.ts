import GetAuthor from '@/core/logic/author/application/GetAuthor'
import AuthorRepository from '@/core/logic/author/infra/local/AuthorRepository'

const repository = new AuthorRepository()

export const getAuthorService = new GetAuthor(repository)
