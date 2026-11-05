import { initializeSaasIsDead } from '@/ui/layouts/BaseLayout/components/SaasIsDead/utils/initializeSaasIsDead'

export async function loadSaasIsDead(signal: AbortSignal, isAllowed: () => boolean): Promise<void> {
  const template = document.querySelector<HTMLTemplateElement>('[data-saas-is-dead-template]')
  const mount = document.querySelector<HTMLElement>('[data-saas-is-dead-mount]')
  const stylesheetUrl = mount?.dataset.stylesheetUrl

  if (signal.aborted || !isAllowed() || !template || !mount || !stylesheetUrl || mount.childElementCount > 0) {
    return
  }

  const script = document.createElement('script')
  script.src = 'https://saasisdead.si/reaper/v1.js'
  script.crossOrigin = 'anonymous'
  script.async = true

  try {
    await new Promise<void>((resolve, reject) => {
      const cleanup = (): void => {
        window.clearTimeout(timeout)
        script.removeEventListener('load', loaded)
        script.removeEventListener('error', failed)
        signal.removeEventListener('abort', aborted)
      }
      const loaded = (): void => {
        cleanup()
        resolve()
      }
      const failed = (): void => {
        cleanup()
        reject(new Error('The optional widget could not be loaded'))
      }
      const aborted = (): void => {
        cleanup()
        reject(new Error('The optional widget was cancelled'))
      }
      const timeout = window.setTimeout(failed, 15_000)

      script.addEventListener('load', loaded, { once: true })
      script.addEventListener('error', failed, { once: true })
      signal.addEventListener('abort', aborted, { once: true })
      document.head.append(script)
    })

    if (signal.aborted || !isAllowed()) {
      return
    }
    if (!customElements.get('saas-is-dead')) {
      throw new Error('The optional widget did not register its custom element')
    }

    mount.append(template.content.cloneNode(true))
    await initializeSaasIsDead(stylesheetUrl)
  } finally {
    script.remove()
  }
}
