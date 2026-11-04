import { brevo } from '@/core/api/http/brevo'
import SubscribeToNewsletter from '@/core/logic/newsletter/application/SubscribeToNewsletter'
import BrevoNewsletterSubscriptionGateway from '@/core/logic/newsletter/infra/brevo/BrevoNewsletterSubscriptionGateway'

const gateway = new BrevoNewsletterSubscriptionGateway(brevo)

export const subscribeToNewsletterService = new SubscribeToNewsletter(gateway)
