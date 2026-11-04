import type { AxiosInstance } from 'axios'
import type { BrevoSubscriptionResponse } from '@/core/logic/newsletter/domain/BrevoSubscriptionResponse'
import type { SubscribeToNewsletterInput } from '@/core/logic/newsletter/domain/Inputs'
import type { SubscriptionResult } from '@/core/logic/newsletter/domain/SubscriptionResult'
import { SubscriptionStatus } from '@/core/logic/newsletter/domain/SubscriptionStatus'
import type { INewsletterSubscriptionGateway } from '@/core/logic/newsletter/infra/interfaces/INewsletterSubscriptionGateway'

export const BREVO_NEWSLETTER_FORM_URL = String(import.meta.env.PUBLIC_BREVO_NEWSLETTER_FORM_URL ?? '')

class BrevoNewsletterSubscriptionGateway implements INewsletterSubscriptionGateway {
  constructor(private readonly client: AxiosInstance) {}

  async subscribe(input: SubscribeToNewsletterInput): Promise<SubscriptionResult> {
    const body = new FormData()
    body.set('EMAIL', input.email)
    body.set('locale', 'es')
    body.set('email_address_check', input.email_address_check)

    const { data: result } = await this.client.post<BrevoSubscriptionResponse>(
      BREVO_NEWSLETTER_FORM_URL + '?isAjax=1',
      body
    )

    if (result.success === true) {
      return { status: SubscriptionStatus.ConfirmationRequired }
    }

    if (result.errors?.EMAIL) {
      return { status: SubscriptionStatus.InvalidEmail }
    }

    return { status: SubscriptionStatus.Error }
  }
}

export default BrevoNewsletterSubscriptionGateway
