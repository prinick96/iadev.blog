import { github } from '@/core/api/http/github'
import { GITHUB_REPOSITORY } from '@/core/constants/github'
import GetCommits from '@/core/logic/commits/application/GetCommits'
import CommitsRepository from '@/core/logic/commits/infra/github/CommitsRepository'

const repository = new CommitsRepository(github, GITHUB_REPOSITORY)

export const getCommitsService = new GetCommits(repository)
