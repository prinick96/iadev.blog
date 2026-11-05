import { describe, expect, test } from 'bun:test'
import SubscribeToNewsletter from '@/core/logic/newsletter/application/SubscribeToNewsletter'
import type { SubscriptionResult } from '@/core/logic/newsletter/domain/SubscriptionResult'
import { SubscriptionStatus } from '@/core/logic/newsletter/domain/SubscriptionStatus'
import BrevoNewsletterSubscriptionGatewayMock from '@/core/logic/newsletter/infra/brevo/mocks/BrevoNewsletterSubscriptionGateway.mock'

const input = { email: 'Reader@example.com', email_address_check: '', captcha_token: 'verified-token' }

const results: SubscriptionResult[] = [
  { status: SubscriptionStatus.ConfirmationRequired },
  { status: SubscriptionStatus.InvalidEmail },
  { status: SubscriptionStatus.Error },
]

describe('SubscribeToNewsletter', () => {
  test('trims email without changing its case or mutating the input', async () => {
    const gateway = new BrevoNewsletterSubscriptionGatewayMock()
    const source = Object.freeze({ ...input, email: ' \tReader@Example.COM\n ' })
    const snapshot = { ...source }

    const result = await new SubscribeToNewsletter(gateway).execute(source)

    expect(result).toBe(SubscriptionStatus.ConfirmationRequired)
    expect(gateway.subscribe).toHaveBeenCalledTimes(1)
    expect(gateway.subscribe).toHaveBeenCalledWith({ ...input, email: 'Reader@Example.COM' })
    expect(source).toEqual(snapshot)
  })

  test.each(['', ' ', '\t\n'])('rejects blank email without calling the gateway: %j', async (email) => {
    const gateway = new BrevoNewsletterSubscriptionGatewayMock()

    const result = await new SubscribeToNewsletter(gateway).execute({ ...input, email })

    expect(result).toBe(SubscriptionStatus.InvalidEmail)
    expect(gateway.subscribe).not.toHaveBeenCalled()
  })

  test.each(['bot', ' ', '\n'])('rejects any nonempty honeypot without calling the gateway: %j', async (honeypot) => {
    const gateway = new BrevoNewsletterSubscriptionGatewayMock()

    const result = await new SubscribeToNewsletter(gateway).execute({ ...input, email_address_check: honeypot })

    expect(result).toBe(SubscriptionStatus.Error)
    expect(gateway.subscribe).not.toHaveBeenCalled()
  })

  test('returns a generic error for a filled honeypot even when the email is blank', async () => {
    const gateway = new BrevoNewsletterSubscriptionGatewayMock()

    const result = await new SubscribeToNewsletter(gateway).execute({ ...input, email: '', email_address_check: 'bot' })

    expect(result).toBe(SubscriptionStatus.Error)
    expect(gateway.subscribe).not.toHaveBeenCalled()
  })

  test.each(['', ' ', '\t\n'])(
    'rejects a blank captcha token without calling the gateway: %j',
    async (captcha_token) => {
      const gateway = new BrevoNewsletterSubscriptionGatewayMock()

      const result = await new SubscribeToNewsletter(gateway).execute({ ...input, captcha_token })

      expect(result).toBe(SubscriptionStatus.Error)
      expect(gateway.subscribe).not.toHaveBeenCalled()
    }
  )

  test.each(results)('returns the gateway status directly: %j', async (response) => {
    const gateway = new BrevoNewsletterSubscriptionGatewayMock()
    gateway.subscribe.mockResolvedValue(response)

    const result = await new SubscribeToNewsletter(gateway).execute(input)

    expect(result).toBe(response.status)
    expect(gateway.subscribe).toHaveBeenCalledTimes(1)
    expect(gateway.subscribe).toHaveBeenCalledWith(input)
  })

  test('leaves email syntax validation to the browser and provider', async () => {
    const gateway = new BrevoNewsletterSubscriptionGatewayMock()
    gateway.subscribe.mockResolvedValue({ status: SubscriptionStatus.InvalidEmail })

    const result = await new SubscribeToNewsletter(gateway).execute({ ...input, email: 'not-an-email' })

    expect(result).toBe(SubscriptionStatus.InvalidEmail)
    expect(gateway.subscribe).toHaveBeenCalledWith({ ...input, email: 'not-an-email' })
  })

  test('converts unexpected gateway rejections into a generic error', async () => {
    const gateway = new BrevoNewsletterSubscriptionGatewayMock()
    gateway.subscribe.mockRejectedValue(new Error('Unexpected failure'))

    expect(await new SubscribeToNewsletter(gateway).execute(input)).toBe(SubscriptionStatus.Error)
    expect(gateway.subscribe).toHaveBeenCalledTimes(1)
  })

  test('converts synchronous gateway failures into a generic error', async () => {
    const gateway = new BrevoNewsletterSubscriptionGatewayMock()
    gateway.subscribe.mockImplementation(() => {
      throw new Error('Unexpected failure')
    })

    expect(await new SubscribeToNewsletter(gateway).execute(input)).toBe(SubscriptionStatus.Error)
    expect(gateway.subscribe).toHaveBeenCalledTimes(1)
  })
})
