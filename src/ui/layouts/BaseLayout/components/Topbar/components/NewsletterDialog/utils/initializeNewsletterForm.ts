import type { SubscriptionResult } from '@/core/logic/newsletter/domain/SubscriptionResult'
import { SubscriptionStatus } from '@/core/logic/newsletter/domain/SubscriptionStatus'
import { subscribeToNewsletterService } from '@/core/logic/newsletter/services/index'

export function initializeNewsletterForm(): void {
  const form = document.querySelector<HTMLFormElement>('#newsletter-form')

  if (!form || form.dataset.newsletterReady === 'true') {
    return
  }

  const email = form.querySelector<HTMLInputElement>('#newsletter-email')!
  const honeypot = form.querySelector<HTMLInputElement>('input[name="email_address_check"]')!
  const fields = form.querySelector<HTMLFieldSetElement>('fieldset[data-newsletter-fields]')!
  const submitLabel = form.querySelector<HTMLElement>('[data-newsletter-submit-label]')!
  const submitting = form.querySelector<HTMLElement>('[data-newsletter-submitting]')!
  const feedback = form.querySelector<HTMLElement>('[data-newsletter-feedback]')!
  const invalidEmail = form.querySelector<HTMLElement>('[data-newsletter-invalid]')!
  const error = form.querySelector<HTMLElement>('[data-newsletter-error]')!
  const success = form.querySelector<HTMLElement>('[data-newsletter-success]')!

  const clearFeedback = (): void => {
    email.removeAttribute('aria-invalid')
    invalidEmail.hidden = true
    error.hidden = true
  }

  const setSubmitting = (isSubmitting: boolean): void => {
    fields.disabled = isSubmitting
    form.setAttribute('aria-busy', String(isSubmitting))
    submitLabel.hidden = isSubmitting
    submitting.hidden = !isSubmitting
  }

  const showResult = (status: SubscriptionStatus): void => {
    switch (status) {
      case SubscriptionStatus.ConfirmationRequired:
        form.reset()
        fields.hidden = true
        success.hidden = false
        break
      case SubscriptionStatus.InvalidEmail:
        invalidEmail.hidden = false
        email.setAttribute('aria-invalid', 'true')
        break
      case SubscriptionStatus.Error:
        error.hidden = false
        break
    }
  }

  const focusResult = (status: SubscriptionStatus): void => {
    if (status === SubscriptionStatus.InvalidEmail) {
      email.focus()
    } else {
      feedback.focus()
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault()

    if (fields.disabled || fields.hidden) {
      return
    }

    clearFeedback()

    if (!form.reportValidity()) {
      return
    }

    const input = { email: email.value, email_address_check: honeypot.value }
    let result: SubscriptionResult
    setSubmitting(true)

    try {
      result = await subscribeToNewsletterService.execute(input)
      showResult(result.status)
    } finally {
      setSubmitting(false)
    }

    focusResult(result.status)
  })
  form.dataset.newsletterReady = 'true'
  fields.disabled = false
}
