import { SubscriptionStatus } from '@/core/logic/newsletter/domain/SubscriptionStatus'
import { subscribeToNewsletterService } from '@/core/logic/newsletter/services/index'
import { initializeNewsletterCaptcha } from '@/ui/layouts/BaseLayout/components/Topbar/components/NewsletterDialog/components/NewsletterCaptcha/utils/initializeNewsletterCaptcha'

export function initializeNewsletterForm(): void {
  const form = document.querySelector<HTMLFormElement>('#newsletter-form')
  const dialog = document.querySelector<HTMLDialogElement>('#newsletter-dialog')

  if (!form || !dialog || form.dataset.newsletterReady === 'true') {
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
  const captcha = initializeNewsletterCaptcha(form, dialog)

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

    const captchaToken = captcha.getToken()

    if (captchaToken.trim() === '') {
      form.querySelector<HTMLElement>('[data-newsletter-captcha-feedback]')!.focus()
      return
    }

    setSubmitting(true)

    const status = await subscribeToNewsletterService.execute({
      email: email.value,
      email_address_check: honeypot.value,
      captcha_token: captchaToken,
    })

    setSubmitting(false)
    showResult(status)
    captcha.reset()
    focusResult(status)
  })
  form.dataset.newsletterReady = 'true'
  fields.disabled = false
}
