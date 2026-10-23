type DataPage = {
  title: string
  description: string
}

export type PageSource = {
  id: string
  body?: string
  data: DataPage
}
