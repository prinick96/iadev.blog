import type { SubscribeToNewsletterInput } from '@/core/logic/newsletter/domain/Inputs'
import type { SubscriptionResult } from '@/core/logic/newsletter/domain/SubscriptionResult'
import { SubscriptionStatus } from '@/core/logic/newsletter/domain/SubscriptionStatus'
import type { INewsletterSubscriptionGateway } from '@/core/logic/newsletter/infra/interfaces/INewsletterSubscriptionGateway'

class SubscribeToNewsletter {
  constructor(private readonly gateway: INewsletterSubscriptionGateway) {}

  async execute(input: SubscribeToNewsletterInput): Promise<SubscriptionResult> {
    if (input.email_address_check !== '') {
      return { status: SubscriptionStatus.Error }
    }

    const email = input.email.trim()

    if (email === '') {
      return { status: SubscriptionStatus.InvalidEmail }
    }

    try {
      return await this.gateway.subscribe({ ...input, email })
    } catch {
      return { status: SubscriptionStatus.Error }
    }
  }
}

export default SubscribeToNewsletter
