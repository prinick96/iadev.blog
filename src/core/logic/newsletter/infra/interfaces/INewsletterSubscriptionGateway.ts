import type { SubscribeToNewsletterInput } from '@/core/logic/newsletter/domain/Inputs'
import type { SubscriptionResult } from '@/core/logic/newsletter/domain/SubscriptionResult'

export interface INewsletterSubscriptionGateway {
  subscribe(input: SubscribeToNewsletterInput): Promise<SubscriptionResult>
}
