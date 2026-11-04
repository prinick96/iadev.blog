import { brevo } from '@/core/api/http/brevo'
import { BREVO_API_KEY, BREVO_NEWSLETTER_LIST_ID, BREVO_NEWSLETTER_TEMPLATE_ID } from '@/core/constants/brevo'
import SendNewPostsNewsletter from '@/core/logic/newsletter/application/SendNewPostsNewsletter'
import SubscribeToNewsletter from '@/core/logic/newsletter/application/SubscribeToNewsletter'

import BrevoNewsletterCampaignGateway from '@/core/logic/newsletter/infra/brevo/BrevoNewsletterCampaignGateway'
import BrevoNewsletterSubscriptionGateway from '@/core/logic/newsletter/infra/brevo/BrevoNewsletterSubscriptionGateway'

const gateway = new BrevoNewsletterSubscriptionGateway(brevo)
const campaignGateway = new BrevoNewsletterCampaignGateway(brevo, {
  api_key: BREVO_API_KEY,
  list_id: BREVO_NEWSLETTER_LIST_ID,
  template_id: BREVO_NEWSLETTER_TEMPLATE_ID,
})

export const subscribeToNewsletterService = new SubscribeToNewsletter(gateway)
export const sendNewPostsNewsletterService = new SendNewPostsNewsletter(campaignGateway)
