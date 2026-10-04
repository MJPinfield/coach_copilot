import { Alert, Anchor, Badge, Button, Container, Divider, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useRouteContext } from '@tanstack/react-router'
import { AccountForm } from '../../components/coaching/accounts'
import { ContentState } from '../../components/workouts/status'
import { backend, configured, historyOptions, profileOptions, programmesOptions, workoutName } from './api'
import { queryClient } from '../../app/query'

export function useClientId() { return useRouteContext({ from: '/_client' }).userId }
export function LoginPage() {
  const navigate = useNavigate()
  const login = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { error } = await backend().auth.signInWithPassword({ email, password })
      if (error) throw error
    },
    onSuccess: () => navigate({ to: '/' }),
  })
  return <Container size={420} py={{ base: 'xl', sm: 80 }}>
    <Stack gap="xl">
      <div><Title order={1}>Welcome back</Title><Text mt="sm">Sign in to see your programme and pick up your training.</Text></div>
      <Paper withBorder radius="md" p="lg">
        {configured ? <AccountForm mode="sign-in" pending={login.isPending} error={login.isError ? 'Could not sign in. Check your email and password, then try again. If you are offline, reconnect first.' : undefined} onSubmit={values => login.mutate(values)} />
          : <Alert color="blue" title="Connect your training account">The Supabase connection is not configured. Follow the local setup in the project README to enable sign-in.</Alert>}
      </Paper>
      <Text size="sm">New here? Open the invitation from your coach to set up your account. For password help, contact your coach.</Text>
    </Stack>
  </Container>
}

export function HomePage() {
  const user = useClientId()
  const profile = useQuery(profileOptions(user))
  const history = useQuery(historyOptions(user))
  const inProgress = history.data?.filter(w => w.status === 'in_progress') ?? []
  const finished = history.data?.filter(w => w.status !== 'in_progress') ?? []
  return <Stack gap="xl">
    <div><Title order={1}>Your training</Title><Text mt="sm">{profile.data?.display_name ? `Welcome back, ${profile.data.display_name}.` : 'Welcome back.'} Ready when you are.</Text></div>
    {profile.data?.role === 'coach' && <Alert title="Client training view">This is the client workout journey. Sign in with a client account to access their published sessions.</Alert>}
    {history.isPending && <ContentState state="loading" title="Loading your workouts" message="Finding where you left off." />}
    {history.isError && <ContentState state="error" title="Could not load workouts" message="Check your connection, then try again." onRetry={() => { void history.refetch() }} />}
    {inProgress.length > 0 && <section><Title order={2} size="h3" mb="md">Pick up where you left off</Title><Stack>{inProgress.map(workout => <Paper withBorder p="lg" key={workout.id}>
      <Stack gap="sm"><Group justify="space-between"><Text fw={600}>{workoutName(workout)}</Text><Badge variant="default">In progress</Badge></Group>
        <Text size="sm">Started {new Date(workout.started_at).toLocaleDateString('en-GB', { dateStyle: 'medium' })}</Text>
        <Button color="blue.8" renderRoot={props => <Link {...props} to="/workouts/$workoutId" params={{ workoutId: workout.id }} />} size="md">Resume workout</Button>
      </Stack>
    </Paper>)}</Stack></section>}
    <section><Title order={2} size="h3">Start a workout</Title><Text mt="xs" mb="md">Choose a session from your coach’s published programme.</Text>
      <Button color="blue.8" component={Link} to="/workouts" variant={inProgress.length ? 'default' : 'filled'} size="md">Choose a workout</Button></section>
    <Divider />
    <section><Title order={2} size="h3" mb="md">Recent workouts</Title>
      {!finished.length && <Text>No finished workouts yet. Your recorded sessions will appear here.</Text>}
      <Stack>{finished.map(w => <Group key={w.id} justify="space-between" align="start">
        <div><Anchor c="blue.8" renderRoot={props => <Link {...props} to="/workouts/$workoutId" params={{ workoutId: w.id }} />} fw={600}>{workoutName(w)}</Anchor><Text size="sm">{new Date(w.started_at).toLocaleDateString('en-GB', { dateStyle: 'medium' })}</Text></div>
        <Badge variant="default">{w.status === 'completed' ? 'Finished' : 'Abandoned'}</Badge>
      </Group>)}</Stack>
    </section>
  </Stack>
}

export function SelectorPage() {
  const user = useClientId()
  const programmes = useQuery(programmesOptions(user))
  const navigate = useNavigate()
  const start = useMutation({
    mutationFn: async ({ sessionId, workoutId }: { sessionId: string; workoutId: string }) => {
      const { error } = await backend().rpc('start_workout', { workout_id: workoutId, session_ids: [sessionId] })
      if (error) throw error
      return workoutId
    },
    onSuccess: async workoutId => {
      await queryClient.invalidateQueries({ queryKey: ['workouts', user] })
      await navigate({ to: '/workouts/$workoutId', params: { workoutId } })
    },
  })
  return <Stack gap="xl">
    <div><Anchor c="blue.8" component={Link} to="/">Back to your training</Anchor><Title order={1} mt="md">Choose your workout</Title><Text mt="sm">Pick the session that works for you today. You can move between exercises as equipment becomes free.</Text></div>
    {programmes.isPending && <ContentState state="loading" title="Loading your programme" message="Finding sessions shared by your coach." />}
    {programmes.isError && <ContentState state="error" title="Could not load your programme" message="Reconnect and try again. You can still resume a downloaded workout from your home page." onRetry={() => { void programmes.refetch() }} />}
    {programmes.data?.length === 0 && <ContentState state="empty" title="No programme shared yet" message="Your coach’s published sessions will appear here when they are ready." />}
    {start.isError && <Alert color="red" title="Workout could not start">Check your connection and retry. Retrying opens the same attempt.<Button display="block" mt="sm" variant="default" onClick={() => start.variables && start.mutate(start.variables)}>Retry start</Button></Alert>}
    {programmes.data?.map(programme => <section key={programme.id}>
      <Title order={2}>{programme.name}</Title>{programme.goal && <Text mt="xs">{programme.goal}</Text>}
      <Stack mt="lg" gap="xl">{[...programme.programme_weeks].sort((a, b) => a.position - b.position).map(week => <section key={week.id}>
        <Title order={3} size="h4" mb="sm">{week.name || `Week ${week.position}`}</Title>
        <Stack>{[...week.sessions].sort((a, b) => a.position - b.position).map(session => <Paper key={session.id} withBorder p="lg">
          <Stack gap="sm"><Title order={4}>{session.name}</Title>
            {session.notes && <Text size="sm">{session.notes}</Text>}
            <Text size="sm">{session.session_blocks.flatMap(b => b.exercise_prescriptions).length} exercises · {session.session_blocks.flatMap(b => b.exercise_prescriptions.flatMap(e => e.prescribed_sets)).length} sets</Text>
            <Text size="sm">{[...session.session_blocks].sort((a, b) => a.position - b.position).map(b => [...b.exercise_prescriptions].sort((a, b) => a.position - b.position).map(e => e.display_name).join(' + ')).join(' · ')}</Text>
            <Button color="blue.8" size="md" loading={start.isPending && start.variables?.sessionId === session.id} disabled={start.isPending || (start.isError && start.variables?.sessionId !== session.id)} onClick={() => start.mutate({ sessionId: session.id, workoutId: start.isError && start.variables?.sessionId === session.id ? start.variables.workoutId : crypto.randomUUID() })}>Start {session.name}</Button>
          </Stack>
        </Paper>)}</Stack>
        {!week.sessions.length && <Text>No sessions in this week yet.</Text>}
      </section>)}</Stack>
    </section>)}
  </Stack>
}
