import axios, { type AxiosInstance, type CreateAxiosDefaults } from 'axios'

export function createHttpClient(options: CreateAxiosDefaults): AxiosInstance {
  return axios.create(options)
}
