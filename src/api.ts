import { queryOptions } from '@tanstack/react-query'
import type { Programme, ProgrammeEdit } from './model'

export const scenario = new URLSearchParams(location.search).get('scenario') ?? 'ready'
const workspaceKey = 'coach-copilot-demo-workspace'
const workspace = localStorage.getItem(workspaceKey) ?? crypto.randomUUID()
localStorage.setItem(workspaceKey, workspace)

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Demo-Workspace': workspace,
      'X-Demo-Scenario': scenario,
    },
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message ?? 'Something went wrong. Please retry.')
  }
  return response.json()
}

export const programmeQuery = queryOptions({
  queryKey: ['programme'],
  // Keep the small fixture read alive across StrictMode's development remount,
  // so an aborted request cannot consume the server's fail-once scenario.
  queryFn: () => request<Programme | null>('programme'),
})

export function saveProgramme(edit: ProgrammeEdit) {
  return request<Programme>('programme', { method: 'PUT', body: JSON.stringify(edit) })
}

export function resetDemo() {
  return request('reset', { method: 'POST' })
}
