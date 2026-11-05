import type { AxiosInstance } from 'axios'
import type { BrevoNewsletterCampaignConfig } from '@/core/logic/newsletter/domain/BrevoNewsletterCampaignConfig'
import type { NewsletterPost } from '@/core/logic/newsletter/domain/NewsletterPost'
import type { NewsletterTemplate } from '@/core/logic/newsletter/domain/NewsletterTemplate'
import type { INewsletterCampaignGateway } from '@/core/logic/newsletter/infra/interfaces/INewsletterCampaignGateway'

class BrevoNewsletterCampaignGateway implements INewsletterCampaignGateway {
  constructor(
    private readonly client: AxiosInstance,
    private readonly config: BrevoNewsletterCampaignConfig
  ) {}

  async getTemplate(): Promise<NewsletterTemplate> {
    const { data } = await this.client.get<NewsletterTemplate>(
      `https://api.brevo.com/v3/smtp/templates/${this.config.template_id}`,
      { headers: { 'api-key': this.config.api_key } }
    )

    return data
  }

  async createCampaign(posts: readonly NewsletterPost[], template: NewsletterTemplate): Promise<number> {
    const { email, name, id } = template.sender
    const { subject } = template
    const sender = email ? { email, name } : { id: Number(id), name }

    const { data } = await this.client.post<{ id: number }>(
      'https://api.brevo.com/v3/emailCampaigns',
      {
        name: subject,
        subject,
        sender,
        recipients: { listIds: [this.config.list_id] },
        templateId: this.config.template_id,
        params: { posts, post_count: posts.length },
      },
      { headers: { 'api-key': this.config.api_key } }
    )

    return data.id
  }

  async sendCampaign(campaign_id: number): Promise<void> {
    await this.client.post(`https://api.brevo.com/v3/emailCampaigns/${campaign_id}/sendNow`, undefined, {
      headers: { 'api-key': this.config.api_key },
    })
  }
}

export default BrevoNewsletterCampaignGateway
