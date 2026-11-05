import { type Mock, mock } from 'bun:test'

import { SubscriptionStatus } from '@/core/logic/newsletter/domain/SubscriptionStatus'
import type { INewsletterSubscriptionGateway } from '@/core/logic/newsletter/infra/interfaces/INewsletterSubscriptionGateway'

class BrevoNewsletterSubscriptionGatewayMock implements INewsletterSubscriptionGateway {
  readonly subscribe: Mock<INewsletterSubscriptionGateway['subscribe']> = mock(async () => ({
    status: SubscriptionStatus.ConfirmationRequired,
  }))
}

export default BrevoNewsletterSubscriptionGatewayMock
