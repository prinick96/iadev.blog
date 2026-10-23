import { describe, expect, mock, test } from 'bun:test'
import { compileFunction } from 'node:vm'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const workflow: unknown = Bun.YAML.parse(
  await Bun.file(new URL('../collaborator-invitations.yml', import.meta.url)).text()
)
if (!isRecord(workflow) || !isRecord(workflow.jobs) || !isRecord(workflow.jobs.invite)) {
  throw new Error('The workflow must define the invitation job')
}
const invitationJob = workflow.jobs.invite
const steps: unknown = invitationJob.steps
if (!Array.isArray(steps)) {
  throw new Error('The invitation job must define steps')
}
const scriptSteps = steps.flatMap((step: unknown) => {
  if (!isRecord(step) || !isRecord(step.with) || typeof step.with.script !== 'string') {
    return []
  }
  return [{ condition: step.if, script: step.with.script }]
})
const invitationStep = scriptSteps.find((step) => step.condition === undefined)
const failureStep = scriptSteps.find((step) => step.condition === 'failure()')
if (!invitationStep || !failureStep) {
  throw new Error('The workflow must define invitation and failure notification scripts')
}
// Match github-script v9's injected bindings; execute only the trusted workflow script, never issue text.
const bindings = ['github', 'context', 'core', 'getOctokit', 'process']
const invite = compileFunction(`return (async () => {\n${invitationStep.script}\n})()`, bindings)
const notifyFailure = compileFunction(`return (async () => {\n${failureStep.script}\n})()`, bindings)

const author = { id: 42, login: 'external-author', type: 'User' }
const requestBody = 'I would like to contribute a post.'
const repository = { owner: 'example', repo: 'blog' }
const privateError = 'PRIVATE_API_PAYLOAD_DO_NOT_PUBLISH'

type Issue = {
  number: number
  title: string
  body: string | null
  state: string
  user: typeof author
  labels: { name: string }[]
  pull_request?: { url: string }
}
type CollaboratorParams = typeof repository & { username: string; permission?: string }
type InvitationParams = typeof repository & { invitation_id: number; permissions?: string }
type IssueParams = typeof repository & { issue_number: number; body?: string; state?: string; state_reason?: string }
type Invitation = {
  id: number
  invitee: { id: number } | null
  permissions: string
  created_at: string
  expired: boolean
}
type AccessResponse = { data: { permission: string; role_name: string } }
type InvitationResponse = { status: number; data?: Invitation }

function createInvitation(overrides: Partial<Invitation> = {}): Invitation {
  return {
    id: 99,
    invitee: { id: author.id },
    permissions: 'write',
    created_at: new Date().toISOString(),
    expired: false,
    ...overrides,
  }
}

function createHarness(overrides: Partial<Issue> = {}) {
  const issue: Issue = {
    number: 7,
    title: '[Colaboración] Solicitar acceso de escritura',
    body: requestBody,
    state: 'open',
    user: { ...author },
    labels: [{ name: 'request access' }],
    ...overrides,
  }
  const context = {
    repo: repository,
    payload: {
      issue: { number: issue.number, user: { ...author } },
      sender: { login: 'someone-reopening-the-issue' },
    },
    serverUrl: 'https://github.com',
    runId: 123,
  }
  const get = mock(async (_params: IssueParams) => ({ data: issue }))
  const createComment = mock(async (_params: IssueParams) => ({}))
  const update = mock(async (_params: IssueParams) => ({}))
  const getCollaboratorPermissionLevel = mock(
    async (_params: CollaboratorParams): Promise<AccessResponse> => ({
      data: { permission: 'none', role_name: 'none' },
    })
  )
  const listInvitations = mock(async (_params: typeof repository): Promise<{ data: Invitation[] }> => ({ data: [] }))
  const paginate = mock(async (_method: unknown, _params: typeof repository): Promise<Invitation[]> => [])
  const updateInvitation = mock(async (_params: InvitationParams) => ({ data: createInvitation() }))
  const deleteInvitation = mock(async (_params: InvitationParams) => ({}))
  const addCollaborator = mock(
    async (_params: CollaboratorParams): Promise<InvitationResponse> => ({ status: 201, data: createInvitation() })
  )
  const app = {
    rest: {
      repos: { getCollaboratorPermissionLevel, listInvitations, updateInvitation, deleteInvitation, addCollaborator },
    },
    paginate,
  }
  const github = { rest: { issues: { get, createComment, update } } }
  const getOctokit = mock((_token: string, _options?: unknown) => app)
  const core = { notice: mock((_message: string) => {}), setFailed: mock((_message: string) => {}) }
  const environment = { env: { COLLABORATOR_APP_TOKEN: 'test-app-token-not-a-real-credential' } }
  const args = [github, context, core, getOctokit, environment]
  return {
    issue,
    context,
    get,
    createComment,
    update,
    getCollaboratorPermissionLevel,
    paginate,
    updateInvitation,
    deleteInvitation,
    addCollaborator,
    getOctokit,
    core,
    run: async () => invite(...args),
    notify: async () => notifyFailure(...args),
  }
}

describe('collaborator invitation workflow inline script', () => {
  test('routes access requests by label and applies the label through the issue form', async () => {
    const template: unknown = Bun.YAML.parse(
      await Bun.file(new URL('../../ISSUE_TEMPLATE/collaborator-access.yml', import.meta.url)).text()
    )

    expect(template).toMatchObject({ labels: ['request access'] })
    expect(workflow.on).toEqual({ issues: { types: ['opened', 'reopened', 'labeled'] } })
    expect(invitationJob.if).toContain("contains(github.event.issue.labels.*.name, 'request access')")
    expect(invitationJob.if).not.toContain('github.event.issue.title')
    expect(invitationJob.if).not.toContain('github.event.issue.body')
  })

  test.each([
    ['missing or removed request label', { labels: [] }],
    ['unrelated label', { labels: [{ name: 'bug' }] }],
    ['similar but different label', { labels: [{ name: 'request access please' }] }],

    ['closed issue', { state: 'closed' }],
    ['pull request', { pull_request: { url: 'https://api.github.com/repos/example/blog/pulls/7' } }],
    ['bot account type', { user: { ...author, type: 'Bot' } }],
    ['bot login', { user: { ...author, login: 'robot[bot]' } }],
    ['changed author id', { user: { ...author, id: 999 } }],
    ['changed author login', { user: { ...author, login: 'different-author' } }],
  ] satisfies [string, Partial<Issue>][])('does not grant access for %s', async (_name, issue) => {
    const harness = createHarness(issue)

    await harness.run()

    expect(harness.getOctokit).not.toHaveBeenCalled()
    expect(harness.addCollaborator).not.toHaveBeenCalled()
    expect(harness.updateInvitation).not.toHaveBeenCalled()
    expect(harness.deleteInvitation).not.toHaveBeenCalled()
    expect(harness.createComment).not.toHaveBeenCalled()
    expect(harness.update).not.toHaveBeenCalled()
  })

  test.each([
    ['custom title and body', { title: 'I would like to publish a post', body: 'Please invite my account.' }],
    ['missing body', { body: null }],
    ['empty body', { body: '' }],
    ['edited template text', { body: '- [X] Solicito acceso de escritura para mi cuenta' }],
    ['unchecked checkbox', { body: '- [ ] Request write access' }],
  ] satisfies [string, Partial<Issue>][])('accepts a labeled issue with %s', async (_name, issue) => {
    const harness = createHarness(issue)

    await harness.run()

    expect(harness.addCollaborator).toHaveBeenCalledWith({ ...repository, username: author.login, permission: 'push' })
    expect(harness.update).toHaveBeenCalledWith(expect.objectContaining({ issue_number: 7, state: 'closed' }))
    expect(harness.core.setFailed).not.toHaveBeenCalled()
  })

  test.each([
    ['write', 'write'],
    ['admin', 'admin'],
    ['write', 'maintain'],
  ])('preserves existing %s access with role %s without downgrading', async (permission, role) => {
    const harness = createHarness()
    harness.getCollaboratorPermissionLevel.mockResolvedValue({ data: { permission, role_name: role } })

    await harness.run()

    expect(harness.addCollaborator).not.toHaveBeenCalled()
    expect(harness.paginate).not.toHaveBeenCalled()
    expect(harness.updateInvitation).not.toHaveBeenCalled()
    expect(harness.deleteInvitation).not.toHaveBeenCalled()
    expect(harness.createComment).toHaveBeenCalledTimes(1)
    expect(harness.update).toHaveBeenCalledWith(expect.objectContaining({ issue_number: 7, state: 'closed' }))
    expect(harness.core.setFailed).not.toHaveBeenCalled()
  })

  test('invites only the issue author, never the sender or usernames from issue text', async () => {
    const harness = createHarness({ body: `${requestBody}\n\nusername: someone-else\n@another-user\n` })

    await harness.run()

    expect(harness.getCollaboratorPermissionLevel).toHaveBeenCalledWith({ ...repository, username: author.login })
    expect(harness.addCollaborator).toHaveBeenCalledTimes(1)
    expect(harness.addCollaborator).toHaveBeenCalledWith({ ...repository, username: author.login, permission: 'push' })
    expect(harness.createComment).toHaveBeenCalledWith(
      expect.objectContaining({ issue_number: 7, body: expect.stringContaining('/example/blog/invitations') })
    )
    expect(harness.createComment.mock.calls[0]?.[0].body).toContain('Acepta la invitación de GitHub')
    expect(harness.update).toHaveBeenCalledWith(expect.objectContaining({ state: 'closed' }))
    expect(harness.core.setFailed).not.toHaveBeenCalled()
  })

  test('upgrades an existing read-only collaborator', async () => {
    const harness = createHarness()
    harness.getCollaboratorPermissionLevel.mockResolvedValue({ data: { permission: 'read', role_name: 'triage' } })

    await harness.run()

    expect(harness.addCollaborator).toHaveBeenCalledWith(expect.objectContaining({ permission: 'push' }))
    expect(harness.update).toHaveBeenCalledWith(expect.objectContaining({ state: 'closed' }))
  })

  test.each(['write', 'maintain', 'admin'])(
    'reuses a pending %s invitation without downgrading or resending',
    async (role) => {
      const harness = createHarness()
      harness.paginate.mockResolvedValue([createInvitation({ permissions: role })])

      await harness.run()

      expect(harness.addCollaborator).not.toHaveBeenCalled()
      expect(harness.updateInvitation).not.toHaveBeenCalled()
      expect(harness.deleteInvitation).not.toHaveBeenCalled()
      expect(harness.createComment.mock.calls[0]?.[0].body).toContain('Acepta la invitación de GitHub')
      expect(harness.update).toHaveBeenCalledWith(expect.objectContaining({ state: 'closed' }))
    }
  )

  test.each(['read', 'triage'])('upgrades a pending %s invitation to write', async (role) => {
    const harness = createHarness()
    harness.paginate.mockResolvedValue([createInvitation({ permissions: role })])

    await harness.run()

    expect(harness.updateInvitation).toHaveBeenCalledWith({ ...repository, invitation_id: 99, permissions: 'write' })
    expect(harness.addCollaborator).not.toHaveBeenCalled()
    expect(harness.deleteInvitation).not.toHaveBeenCalled()
    expect(harness.update).toHaveBeenCalledWith(expect.objectContaining({ state: 'closed' }))
  })

  test.each([
    ['expired flag', { expired: true }],
    ['expired creation date', { created_at: '2000-01-01T00:00:00Z' }],
  ])('replaces an invitation with %s', async (_name, overrides) => {
    const harness = createHarness()
    harness.paginate.mockResolvedValue([createInvitation(overrides)])

    await harness.run()

    expect(harness.deleteInvitation).toHaveBeenCalledWith({ ...repository, invitation_id: 99 })
    expect(harness.addCollaborator).toHaveBeenCalledWith({ ...repository, username: author.login, permission: 'push' })
    expect(harness.update).toHaveBeenCalledWith(expect.objectContaining({ state: 'closed' }))
  })

  test('ignores invitations for other accounts or email-only invitees', async () => {
    const harness = createHarness()
    harness.paginate.mockResolvedValue([
      createInvitation({ invitee: { id: 999 }, permissions: 'read', expired: true }),
      createInvitation({ id: 100, invitee: null }),
    ])

    await harness.run()

    expect(harness.updateInvitation).not.toHaveBeenCalled()
    expect(harness.deleteInvitation).not.toHaveBeenCalled()
    expect(harness.addCollaborator).toHaveBeenCalledWith(expect.objectContaining({ username: author.login }))
  })

  test('treats only a 404 permission lookup as missing access', async () => {
    const harness = createHarness()
    harness.getCollaboratorPermissionLevel.mockRejectedValue(Object.assign(new Error(privateError), { status: 404 }))

    await harness.run()

    expect(harness.addCollaborator).toHaveBeenCalledTimes(1)
    expect(harness.update).toHaveBeenCalledWith(expect.objectContaining({ state: 'closed' }))
    expect(harness.core.setFailed).not.toHaveBeenCalled()
  })

  test.each([401, 403, 429, 500])('does not turn a %s lookup failure into an invitation', async (status) => {
    const harness = createHarness()
    harness.getCollaboratorPermissionLevel.mockRejectedValue(Object.assign(new Error(privateError), { status }))

    await harness.run()

    expect(harness.addCollaborator).not.toHaveBeenCalled()
    expect(harness.paginate).not.toHaveBeenCalled()
    expect(harness.update).not.toHaveBeenCalled()
    expect(harness.core.setFailed).toHaveBeenCalled()
    expect(JSON.stringify(harness.core.setFailed.mock.calls)).not.toContain(privateError)
  })

  test('leaves the issue open if GitHub rejects the invitation and publishes a sanitized failure notice', async () => {
    const harness = createHarness()
    harness.addCollaborator.mockRejectedValue(new Error(privateError))

    await harness.run()
    await harness.notify()

    expect(harness.update).not.toHaveBeenCalled()
    expect(harness.core.setFailed).toHaveBeenCalled()
    expect(harness.createComment).toHaveBeenCalledWith(
      expect.objectContaining({ issue_number: 7, body: expect.stringContaining('revisa tus notificaciones de GitHub') })
    )
    expect(JSON.stringify(harness.core.setFailed.mock.calls)).not.toContain(privateError)
    expect(JSON.stringify(harness.createComment.mock.calls)).not.toContain(privateError)
  })

  test('does not close the issue if the success comment fails after inviting', async () => {
    const harness = createHarness()
    harness.createComment.mockRejectedValue(new Error(privateError))

    await harness.run()

    expect(harness.addCollaborator).toHaveBeenCalledTimes(1)
    expect(harness.update).not.toHaveBeenCalled()
    expect(harness.core.setFailed).toHaveBeenCalled()
    expect(JSON.stringify(harness.core.setFailed.mock.calls)).not.toContain(privateError)
  })

  test('does not close the issue if a pending invitation upgrade fails', async () => {
    const harness = createHarness()
    harness.paginate.mockResolvedValue([createInvitation({ permissions: 'read' })])
    harness.updateInvitation.mockRejectedValue(new Error(privateError))

    await harness.run()

    expect(harness.update).not.toHaveBeenCalled()
    expect(harness.addCollaborator).not.toHaveBeenCalled()
    expect(harness.core.setFailed).toHaveBeenCalled()
  })

  test.each([
    ['different invitee', { invitee: { id: 999 } }],
    ['read-only invitation', { permissions: 'read' }],
    ['expired invitation', { expired: true }],
  ])('does not close for an invalid success response: %s', async (_name, overrides) => {
    const harness = createHarness()
    harness.addCollaborator.mockResolvedValue({ status: 201, data: createInvitation(overrides) })

    await harness.run()

    expect(harness.update).not.toHaveBeenCalled()
    expect(harness.core.setFailed).toHaveBeenCalled()
  })

  test('confirms write access before closing after a no-content invitation response', async () => {
    const harness = createHarness()
    harness.addCollaborator.mockResolvedValue({ status: 204 })
    harness.getCollaboratorPermissionLevel
      .mockResolvedValueOnce({ data: { permission: 'none', role_name: 'none' } })
      .mockResolvedValueOnce({ data: { permission: 'write', role_name: 'write' } })

    await harness.run()

    expect(harness.update).toHaveBeenCalledWith(expect.objectContaining({ state: 'closed' }))
    expect(harness.core.setFailed).not.toHaveBeenCalled()
  })

  test('leaves the issue open when a no-content response does not confirm write access', async () => {
    const harness = createHarness()
    harness.addCollaborator.mockResolvedValue({ status: 204 })

    await harness.run()

    expect(harness.update).not.toHaveBeenCalled()
    expect(harness.core.setFailed).toHaveBeenCalled()
  })
})
