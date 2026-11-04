import { type Mock, mock } from 'bun:test'

import type { INewsletterCampaignGateway } from '@/core/logic/newsletter/infra/interfaces/INewsletterCampaignGateway'

class BrevoNewsletterCampaignGatewayMock implements INewsletterCampaignGateway {
  readonly getTemplate: Mock<INewsletterCampaignGateway['getTemplate']> = mock(async () => ({
    subject: 'Novedades de IADev',
    sender: { email: 'newsletter@example.com', name: 'IADev' },
  }))

  readonly createCampaign: Mock<INewsletterCampaignGateway['createCampaign']> = mock(async () => 42)

  readonly sendCampaign: Mock<INewsletterCampaignGateway['sendCampaign']> = mock(async () => {})
}

export default BrevoNewsletterCampaignGatewayMock
