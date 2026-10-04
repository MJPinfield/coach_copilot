import { Anchor, AppShell, Button, Container, Group, Menu, Stack, Text, Title } from '@mantine/core'
import { createRootRoute, createRoute, createRouter, Link, Outlet, redirect, useRouter, useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { backend, configured, workoutOptions } from '../features/client/api'
import { HomePage, LoginPage, SelectorPage } from '../features/client/pages'
import { WorkoutPage } from '../features/client/workout'
import { ContentState } from '../components/workouts/status'
import { queryClient } from './query'

function Shell() {
  const clientRoute = useRouterState({ select: state => state.matches.some(match => match.routeId === '/_client') })
  return <AppShell header={{ height: 64 }} padding="md">
    <AppShell.Header><Container size="sm" h="100%"><Group h="100%" justify="space-between"><Anchor component={Link} to="/" fw={700} c="dark">Coach Copilot</Anchor>{clientRoute && <AccountMenu />}</Group></Container></AppShell.Header>
    <AppShell.Main id="main"><Container size="sm" px={0} py="sm"><Outlet /></Container></AppShell.Main>
  </AppShell>
}
function AccountMenu() {
  const router = useRouter()
  const logout = useMutation({
    mutationFn: async () => { const { error } = await backend().auth.signOut(); if (error) throw error },
    onSuccess: async () => { queryClient.clear(); await router.invalidate(); await router.navigate({ to: '/login' }) },
  })
  return <Menu position="bottom-end" width={240} closeOnItemClick={false}>
    <Menu.Target><Button variant="subtle" color="dark" loading={logout.isPending}>Account</Button></Menu.Target>
    <Menu.Dropdown><Menu.Item onClick={() => logout.mutate()}>Sign out</Menu.Item>
      {logout.isError && <Text size="sm" p="sm" role="alert">Could not sign out. Check your connection and try again.</Text>}
    </Menu.Dropdown>
  </Menu>
}
function ClientLayout() {
  const router = useRouter()
  useEffect(() => {
    const { data: { subscription } } = backend().auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') window.setTimeout(() => { queryClient.clear(); void router.invalidate() }, 0)
    })
    return () => subscription.unsubscribe()
  }, [router])
  return <Outlet />
}
const root = createRootRoute({
  component: Shell,
  notFoundComponent: () => <Stack><Title order={1}>Page not found</Title><Anchor c="blue.8" component={Link} to="/">Return to your training</Anchor></Stack>,
  errorComponent: ({ reset }) => <ContentState state="error" title="Could not open this page" message="Check your connection and access, then try again. Your device-saved workouts are retained." onRetry={reset} />,
  pendingComponent: () => <ContentState state="loading" title="Opening your training" message="Loading your saved workout." />,
})
const login = createRoute({ getParentRoute: () => root, path: '/login', component: LoginPage })
const client = createRoute({
  getParentRoute: () => root, id: '_client', component: ClientLayout,
  beforeLoad: async () => {
    if (!configured) throw redirect({ to: '/login' })
    const { data: { session } } = await backend().auth.getSession()
    if (!session) throw redirect({ to: '/login' })
    return { userId: session.user.id }
  },
})
const home = createRoute({ getParentRoute: () => client, path: '/', component: HomePage })
const selector = createRoute({ getParentRoute: () => client, path: '/workouts', component: SelectorPage })
const workout = createRoute({
  getParentRoute: () => client, path: '/workouts/$workoutId', component: WorkoutPage,
  validateSearch: (search: Record<string, unknown>): { block?: string; round?: number } => ({
    block: typeof search.block === 'string' ? search.block : undefined,
    round: Number.isInteger(Number(search.round)) && Number(search.round) > 0 ? Number(search.round) : undefined,
  }),
  loader: {
    handler: ({ context, params }) => queryClient.fetchQuery(workoutOptions(context.userId, params.workoutId)),
    // A resumed editor must start from current device/server data, never a stale route snapshot.
    staleReloadMode: 'blocking',
  },
})
export const router = createRouter({ routeTree: root.addChildren([login, client.addChildren([home, selector, workout])]), defaultPendingMs: 200 })

declare module '@tanstack/react-router' { interface Register { router: typeof router } }
