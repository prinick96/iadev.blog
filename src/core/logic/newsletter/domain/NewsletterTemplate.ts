type Sender = {
  email?: string
  id?: string
  name?: string
}

export type NewsletterTemplate = {
  subject: string
  sender: Sender
}
