import type { NewsletterPost } from '@/core/logic/newsletter/domain/NewsletterPost'
import type { NewsletterTemplate } from '@/core/logic/newsletter/domain/NewsletterTemplate'

export interface INewsletterCampaignGateway {
  getTemplate(): Promise<NewsletterTemplate>
  createCampaign(posts: readonly NewsletterPost[], template: NewsletterTemplate): Promise<number>
  sendCampaign(campaign_id: number): Promise<void>
}
