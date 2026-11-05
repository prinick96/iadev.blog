import type { SubscribeToNewsletterInput } from '@/core/logic/newsletter/domain/Inputs'

import { SubscriptionStatus } from '@/core/logic/newsletter/domain/SubscriptionStatus'
import type { INewsletterSubscriptionGateway } from '@/core/logic/newsletter/infra/interfaces/INewsletterSubscriptionGateway'

class SubscribeToNewsletter {
  constructor(private readonly gateway: INewsletterSubscriptionGateway) {}

  async execute(input: SubscribeToNewsletterInput): Promise<SubscriptionStatus> {
    if (input.email_address_check !== '' || input.captcha_token.trim() === '') {
      return SubscriptionStatus.Error
    }

    const email = input.email.trim()

    if (email === '') {
      return SubscriptionStatus.InvalidEmail
    }

    try {
      const { status } = await this.gateway.subscribe({ ...input, email })

      return status
    } catch {
      return SubscriptionStatus.Error
    }
  }
}

export default SubscribeToNewsletter
