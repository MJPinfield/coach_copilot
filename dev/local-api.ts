import type { Connect, Plugin } from 'vite'
import type { Programme } from '../src/model.ts'

const seed: Programme = {
  id: 'strength-foundations',
  title: 'Strength foundations',
  client: 'Alex Morgan',
  focus: 'Build confidence. Move well. Get stronger.',
  coachNotes: 'Leave two reps in reserve. Take your time between sets.',
  sessions: [
    { id: 'upper', title: 'Upper body', exercises: [
      { name: 'Bench press', prescription: '3 × 8 · 40 kg' },
      { name: 'Seated row', prescription: '3 × 10 · 30 kg' },
      { name: 'Dumbbell shoulder press', prescription: '2 × 10 · 10 kg' },
    ] },
    { id: 'lower', title: 'Lower body', exercises: [
      { name: 'Goblet squat', prescription: '3 × 8 · 16 kg' },
      { name: 'Romanian deadlift', prescription: '3 × 10 · 40 kg' },
      { name: 'Calf raise', prescription: '2 × 12 · Bodyweight' },
    ] },
  ],
}

// Synthetic, process-local workspaces. Never used as a production backend.
export function localApi(): Plugin {
  const workspaces = new Map<string, { programme: Programme; failures: Set<string> }>()
  const middleware: Connect.NextHandleFunction = async (req, res, next) => {
    if (!req.url?.startsWith('/api/')) return next()
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    const send = (status: number, body: unknown) => {
      res.statusCode = status
      res.end(JSON.stringify(body))
    }
    const workspaceId = req.headers['x-demo-workspace']
    if (typeof workspaceId !== 'string' || !workspaceId) {
      return send(400, { message: 'A demo workspace is required.' })
    }
    if (!workspaces.has(workspaceId)) {
      workspaces.set(workspaceId, { programme: structuredClone(seed), failures: new Set() })
    }
    const workspace = workspaces.get(workspaceId)!
    if (req.url === '/api/reset' && req.method === 'POST') {
      workspaces.delete(workspaceId)
      return send(200, { reset: true })
    }
    if (req.url !== '/api/programme') return send(404, { message: 'Unknown demo endpoint.' })

    const scenario = req.headers['x-demo-scenario']
    if (scenario === 'slow') await new Promise((resolve) => setTimeout(resolve, 1800))
    const shouldFail = (scenario === 'read-error' && req.method === 'GET') ||
      (scenario === 'save-error' && req.method === 'PUT')
    if (shouldFail && !workspace.failures.has(String(scenario))) {
      workspace.failures.add(String(scenario))
      return send(503, { message: 'The demo service is temporarily unavailable. Please retry.' })
    }
    if (req.method === 'GET') {
      return send(200, scenario === 'empty' ? null : workspace.programme)
    }
    if (req.method === 'PUT') {
      try {
        let body = ''
        for await (const chunk of req) {
          body += chunk
          if (body.length > 16_384) return send(413, { message: 'Programme edit is too large.' })
        }
        const input = JSON.parse(body)
        if (!input || typeof input.title !== 'string' || !input.title.trim() ||
            input.title.length > 100 || typeof input.coachNotes !== 'string' ||
            input.coachNotes.length > 2000) {
          return send(400, { message: 'Enter a title (up to 100 characters) and notes (up to 2000 characters).' })
        }
        workspace.programme = { ...workspace.programme, title: input.title.trim(), coachNotes: input.coachNotes.trim() }
        return send(200, workspace.programme)
      } catch {
        return send(400, { message: 'The programme edit could not be read.' })
      }
    }
    send(405, { message: 'Method not supported.' })
  }
  return {
    name: 'coach-copilot-local-api',
    configureServer: (server) => { server.middlewares.use(middleware) },
    configurePreviewServer: (server) => { server.middlewares.use(middleware) },
  }
}
