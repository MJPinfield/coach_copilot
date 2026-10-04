import { createRootRoute, createRoute, createRouter, Link, Outlet } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { resetDemo, scenario } from '../features/programme/api'
import { ProgrammePage } from '../features/programme/programme'

function Shell() {
  const reset = useMutation({
    mutationFn: resetDemo,
    onSuccess: () => location.reload(),
  })
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header">
      <Link className="brand" to="/" search={{ scenario }}>coach<span>copilot</span><span className="brand-dot">•</span></Link>
      <nav aria-label="Main navigation">
        <Link to="/" search={{ scenario }} activeOptions={{ exact: true }}>Coach workspace</Link>
        <Link to="/client" search={{ scenario }}>Client view</Link>
      </nav>
    </header>
    <div className="demo-bar">
      <span><strong>Design workspace</strong> · Fictional data</span>
      <div className="demo-controls">
        <label htmlFor="scenario">Design scenario</label>
        <select id="scenario" value={scenario} onChange={(event) => {
          const url = new URL(location.href)
          url.searchParams.set('scenario', event.target.value)
          location.assign(url)
        }}>
          <option value="ready">Populated</option>
          <option value="empty">Empty</option>
          <option value="slow">Slow connection</option>
          <option value="read-error">Read error, then retry</option>
          <option value="save-error">Save error, then retry</option>
        </select>
        <button className="text-button" disabled={reset.isPending} onClick={() => reset.mutate()}>Reset demo</button>
      </div>
      {reset.isError && <p role="alert">Reset failed. Please try again.</p>}
    </div>
    <main id="main" tabIndex={-1}><Outlet /></main>
    <footer>Coach Copilot <span>Built around the coaching conversation.</span></footer>
  </>
}

const root = createRootRoute({
  component: Shell,
  validateSearch: (search: Record<string, unknown>) => ({ scenario: typeof search.scenario === 'string' ? search.scenario : 'ready' }),
  notFoundComponent: () => <section className="state"><h1>Page not found</h1><Link to="/" search={{ scenario }}>Return to the workspace</Link></section>,
})
const coach = createRoute({ getParentRoute: () => root, path: '/', component: () => <ProgrammePage mode="coach" /> })
const client = createRoute({ getParentRoute: () => root, path: '/client', component: () => <ProgrammePage mode="client" /> })
export const router = createRouter({ routeTree: root.addChildren([coach, client]) })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
