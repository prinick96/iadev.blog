import type { SendNewPostsNewsletterInput } from '@/core/logic/newsletter/domain/Inputs'
import type { INewsletterCampaignGateway } from '@/core/logic/newsletter/infra/interfaces/INewsletterCampaignGateway'

class SendNewPostsNewsletter {
  constructor(private readonly gateway: INewsletterCampaignGateway) {}

  private prepareNewsletterPosts({ posts, new_slugs, site_url, get_post_path }: SendNewPostsNewsletterInput) {
    return posts
      .filter((source) => new_slugs.includes(source.id))
      .map((source) => ({
        title: source.data.title,
        description: source.data.description,
        url: new URL(get_post_path(source.id), site_url).href,
      }))
  }

  async execute(input: SendNewPostsNewsletterInput): Promise<void> {
    if (input.new_slugs.length === 0) {
      return
    }

    try {
      const posts = this.prepareNewsletterPosts(input)

      if (posts.length === 0) {
        return
      }

      const template = await this.gateway.getTemplate()
      const campaign_id = await this.gateway.createCampaign(posts, template)

      await this.gateway.sendCampaign(campaign_id)
      console.info('[newsletter] campaña de novedades programada:', campaign_id)
    } catch (error) {
      console.error('[newsletter] no se pudo crear o enviar la campaña de novedades.', error)
    }
  }
}

export default SendNewPostsNewsletter
