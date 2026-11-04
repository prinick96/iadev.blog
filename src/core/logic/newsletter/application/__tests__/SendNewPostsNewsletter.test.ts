import { afterEach, beforeEach, describe, expect, type Mock, mock, spyOn, test } from 'bun:test'
import type { SendNewPostsNewsletterInput } from '@/core/logic/newsletter/domain/Inputs'
import type { NewsletterPost } from '@/core/logic/newsletter/domain/NewsletterPost'
import type { NewsletterTemplate } from '@/core/logic/newsletter/domain/NewsletterTemplate'
import BrevoNewsletterCampaignGatewayMock from '@/core/logic/newsletter/infra/brevo/mocks/BrevoNewsletterCampaignGateway.mock'
import type { PostSource } from '@/core/logic/posts/domain/PostSource'
import SendNewPostsNewsletter from '../SendNewPostsNewsletter'

const posts: PostSource[] = [
  {
    id: 'ia-sin-humo',
    body: 'El cuerpo no se envía en el boletín.',
    data: {
      title: 'IA sin humo 🤖',
      description: 'Menos promesas, más código.',
      published_at: new Date('2026-10-01'),
      author: { id: 'default' },
    },
  },
  {
    id: 'otra-neurona',
    data: {
      title: 'Otra neurona',
      description: 'Ahora con ñ.',
      published_at: new Date('2026-10-02'),
      author: { id: 'default' },
    },
  },
]
const newsletter_posts: NewsletterPost[] = [
  { title: 'IA sin humo 🤖', description: 'Menos promesas, más código.', url: 'https://iadev.blog/posts/ia-sin-humo/' },
  { title: 'Otra neurona', description: 'Ahora con ñ.', url: 'https://iadev.blog/posts/otra-neurona/' },
]
const new_slugs = ['ia-sin-humo', 'otra-neurona']
const site_url = 'https://iadev.blog'
const get_post_path = (id: string) => `/posts/${id}/`
const input: SendNewPostsNewsletterInput = { posts, new_slugs, site_url, get_post_path }
const success_message = '[newsletter] campaña de novedades programada:'
const failure_message = '[newsletter] no se pudo crear o enviar la campaña de novedades.'

let info_spy: Mock<typeof console.info>
let error_spy: Mock<typeof console.error>

beforeEach(() => {
  info_spy = spyOn(console, 'info').mockImplementation(() => {})
  error_spy = spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  info_spy.mockRestore()
  error_spy.mockRestore()
})

describe('SendNewPostsNewsletter', () => {
  test.each([
    { name: 'empty new slugs', posts, new_slugs: [] },
    { name: 'empty posts', posts: [], new_slugs },
    { name: 'unmatched slugs', posts, new_slugs: ['missing-post'] },
  ])('skips $name without resolving links, gateway calls or logs', async ({ posts, new_slugs }) => {
    const gateway = new BrevoNewsletterCampaignGatewayMock()
    const resolve_path = mock(get_post_path)

    expect(
      await new SendNewPostsNewsletter(gateway).execute({ ...input, posts, new_slugs, get_post_path: resolve_path })
    ).toBeUndefined()

    expect(resolve_path).not.toHaveBeenCalled()
    expect(gateway.getTemplate).not.toHaveBeenCalled()
    expect(gateway.createCampaign).not.toHaveBeenCalled()
    expect(gateway.sendCampaign).not.toHaveBeenCalled()
    expect(info_spy).not.toHaveBeenCalled()
    expect(error_spy).not.toHaveBeenCalled()
  })

  test('filters known posts and prepares the newsletter in source order regardless of slug order', async () => {
    const gateway = new BrevoNewsletterCampaignGatewayMock()
    const known_post = { ...posts[0], id: 'known-post' }
    const resolve_path = mock(get_post_path)

    await new SendNewPostsNewsletter(gateway).execute({
      ...input,
      posts: [known_post, ...posts],
      new_slugs: ['otra-neurona', 'ia-sin-humo'],
      get_post_path: resolve_path,
    })

    expect(resolve_path.mock.calls).toEqual([['ia-sin-humo'], ['otra-neurona']])
    expect(gateway.createCampaign.mock.calls[0][0]).toEqual(newsletter_posts)
    expect(gateway.createCampaign).toHaveBeenCalledTimes(1)
    expect(gateway.sendCampaign).toHaveBeenCalledTimes(1)
  })

  test('builds absolute URLs from the injected path resolver including nested and encoded slugs', async () => {
    const gateway = new BrevoNewsletterCampaignGatewayMock()
    const source = { ...posts[0], id: 'serie/ia y café' }
    const resolve_path = mock<(id: string) => string>(() => '/articles/serie/ia%20y%20caf%C3%A9/')

    await new SendNewPostsNewsletter(gateway).execute({
      posts: [source],
      new_slugs: [source.id],
      site_url: 'https://newsletter.example.com/blog/',
      get_post_path: resolve_path,
    })

    expect(resolve_path.mock.calls).toEqual([['serie/ia y café']])
    expect(gateway.createCampaign.mock.calls[0][0]).toEqual([
      {
        title: source.data.title,
        description: source.data.description,
        url: 'https://newsletter.example.com/articles/serie/ia%20y%20caf%C3%A9/',
      },
    ])
  })

  test.each([
    { count: 1, posts: posts.slice(0, 1), expected: newsletter_posts.slice(0, 1) },
    { count: 2, posts, expected: newsletter_posts },
  ])('preserves template metadata for $count posts in one campaign', async ({ posts: selected_posts, expected }) => {
    const gateway = new BrevoNewsletterCampaignGatewayMock()
    gateway.createCampaign.mockResolvedValue(731)

    expect(await new SendNewPostsNewsletter(gateway).execute({ ...input, posts: selected_posts })).toBeUndefined()

    expect(gateway.getTemplate).toHaveBeenCalledTimes(1)
    expect(gateway.getTemplate).toHaveBeenCalledWith()
    const template = await gateway.getTemplate.mock.results[0].value
    expect(gateway.createCampaign).toHaveBeenCalledTimes(1)
    expect(gateway.createCampaign).toHaveBeenCalledWith(expected, {
      subject: 'Novedades de IADev',
      sender: { email: 'newsletter@example.com', name: 'IADev' },
    })
    expect(template).toBe(gateway.createCampaign.mock.calls[0][1])
    expect(gateway.sendCampaign).toHaveBeenCalledTimes(1)
    expect(gateway.sendCampaign).toHaveBeenCalledWith(731)
    expect(info_spy.mock.calls).toEqual([[success_message, 731]])
    expect(error_spy).not.toHaveBeenCalled()
  })

  test('preserves frozen posts, nested source data and new slugs without mutation', async () => {
    const gateway = new BrevoNewsletterCampaignGatewayMock()
    const frozen_posts = Object.freeze(
      posts.map((post) =>
        Object.freeze({
          ...post,
          data: Object.freeze({ ...post.data, author: Object.freeze({ ...post.data.author }) }),
        })
      )
    )
    const frozen_slugs = Object.freeze([...new_slugs])
    const snapshot = structuredClone(frozen_posts)

    const frozen_input = Object.freeze({ ...input, posts: frozen_posts, new_slugs: frozen_slugs })
    await new SendNewPostsNewsletter(gateway).execute(frozen_input)

    expect(gateway.createCampaign.mock.calls[0][0]).toEqual(newsletter_posts)
    expect(frozen_posts).toEqual(snapshot)
    expect(frozen_slugs).toEqual(new_slugs)
    expect(frozen_input).toEqual({ ...input, posts: snapshot })
    expect(gateway.sendCampaign).toHaveBeenCalledWith(42)
    expect(error_spy).not.toHaveBeenCalled()
  })

  test('awaits template retrieval, creation and sending in order before logging success or completing', async () => {
    const gateway = new BrevoNewsletterCampaignGatewayMock()
    const template = Object.freeze({
      subject: '  Novedades — ñ 🤖  ',
      sender: Object.freeze({ email: 'newsletter@example.com', id: '72', name: 'IADev' }),
    })
    const retrieval = Promise.withResolvers<NewsletterTemplate>()
    const creation = Promise.withResolvers<number>()
    const sending = Promise.withResolvers<void>()
    const create_started = Promise.withResolvers<void>()
    const send_started = Promise.withResolvers<void>()
    gateway.getTemplate.mockReturnValue(retrieval.promise)
    gateway.createCampaign.mockImplementation(async () => {
      create_started.resolve()
      return await creation.promise
    })
    gateway.sendCampaign.mockImplementation(async () => {
      send_started.resolve()
      await sending.promise
    })
    let completed = false
    const execution = (async () => {
      await new SendNewPostsNewsletter(gateway).execute(input)
      completed = true
    })()

    expect(gateway.getTemplate).toHaveBeenCalledTimes(1)
    expect(gateway.createCampaign).not.toHaveBeenCalled()
    expect(gateway.sendCampaign).not.toHaveBeenCalled()
    expect(info_spy).not.toHaveBeenCalled()
    expect(completed).toBe(false)

    retrieval.resolve(template)
    await create_started.promise

    expect(gateway.createCampaign).toHaveBeenCalledTimes(1)
    expect(gateway.createCampaign).toHaveBeenCalledWith(newsletter_posts, template)
    expect(gateway.createCampaign.mock.calls[0][1]).toBe(template)
    expect(gateway.sendCampaign).not.toHaveBeenCalled()
    expect(info_spy).not.toHaveBeenCalled()
    expect(completed).toBe(false)

    creation.resolve(731)
    await send_started.promise

    expect(gateway.sendCampaign).toHaveBeenCalledTimes(1)
    expect(gateway.sendCampaign).toHaveBeenCalledWith(731)
    expect(info_spy).not.toHaveBeenCalled()
    expect(completed).toBe(false)

    sending.resolve()
    await execution

    expect(completed).toBe(true)
    expect(info_spy.mock.calls).toEqual([[success_message, 731]])
    expect(error_spy).not.toHaveBeenCalled()
  })

  test.each(['get', 'create', 'send'])(
    'logs the original %s error without rejecting or retrying',
    async (operation) => {
      const gateway = new BrevoNewsletterCampaignGatewayMock()
      const failure = Object.assign(new Error('api-key=private-key; reader@example.com; raw provider payload'), {
        config: { headers: { 'api-key': 'private-key' } },
        response: { data: { email: 'reader@example.com' } },
      })
      if (operation === 'get') {
        gateway.getTemplate.mockRejectedValue(failure)
      } else if (operation === 'create') {
        gateway.createCampaign.mockRejectedValue(failure)
      } else {
        gateway.sendCampaign.mockRejectedValue(failure)
      }

      expect(await new SendNewPostsNewsletter(gateway).execute(input)).toBeUndefined()

      expect(gateway.getTemplate).toHaveBeenCalledTimes(1)
      expect(gateway.createCampaign).toHaveBeenCalledTimes(operation === 'get' ? 0 : 1)
      expect(gateway.sendCampaign).toHaveBeenCalledTimes(operation === 'send' ? 1 : 0)
      expect(error_spy.mock.calls).toEqual([[failure_message, failure]])
      expect(error_spy.mock.calls[0][1]).toBe(failure)
      expect(info_spy).not.toHaveBeenCalled()
    }
  )
})
