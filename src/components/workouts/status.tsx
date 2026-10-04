import { Alert, Badge, Button, Group, List, Loader, Stack, Text, Title } from '@mantine/core'
import type { Row, SourceReference } from '../training/model'

export type SyncState = 'unsaved' | 'device-saved' | 'pending' | 'syncing' | 'synced' | 'error'
const syncCopy: Record<SyncState, [string, string]> = {
  unsaved: ['Unsaved changes', 'These changes have not been saved on this device.'],
  'device-saved': ['Saved on this device', 'These changes are stored locally and are not yet shared with your coach.'],
  pending: ['Waiting to sync', 'Your device-saved changes will upload when a connection is available.'],
  syncing: ['Syncing workout', 'Uploading your recorded sets.'],
  synced: ['Workout synced', 'Your recorded workout is available to your coach.'],
  error: ['Sync failed', 'Your device-saved entries are retained. Retry when you have a connection.'],
}
export function SaveStatus({ state, onRetry }: { state: SyncState; onRetry?: () => void }) {
  const [title, body] = syncCopy[state]
  return <Alert title={title} color={state === 'error' ? 'red' : 'blue'} role={state === 'error' ? 'alert' : 'status'}>
    <Group>{state === 'syncing' && <Loader size="sm" />}<Text size="sm">{body}</Text></Group>
    {state === 'error' && onRetry && <Button mt="sm" variant="default" onClick={onRetry}>Retry sync</Button>}
  </Alert>
}

export function SourceReferences({ sources }: { sources: SourceReference[] }) {
  return <Stack gap="xs"><Text fw={600}>Source sessions</Text>{sources.length ? <List>{sources.map(source => <List.Item key={source.session_id}>
    {source.name} · {source.programmeName} · revision {source.programme_revision}
  </List.Item>)}</List> : <Text size="sm">No source sessions.</Text>}</Stack>
}

export function WorkoutSummary({ workout, sources, completedSets, totalSets, adaptationReason, onResume }: {
  workout: Pick<Row<'workouts'>, 'id' | 'status' | 'started_at'>; sources: SourceReference[]; completedSets: number; totalSets: number
  adaptationReason?: string | null; onResume?: () => void
}) {
  return <Stack gap="md">
    <Group justify="space-between"><Title order={3}>Training attempt</Title><Badge variant="default">{workout.status.replaceAll('_', ' ')}</Badge></Group>
    <Text>{new Date(workout.started_at).toLocaleDateString('en-GB', { dateStyle: 'medium', timeZone: 'UTC' })} · {completedSets} of {totalSets} sets marked complete</Text>
    <SourceReferences sources={sources} />
    {adaptationReason && <Text>Applied change: {adaptationReason}</Text>}
    {workout.status === 'in_progress' && onResume && <Group><Button color="blue.8" onClick={onResume}>Resume workout</Button></Group>}
    {workout.status === 'completed' && <Text size="sm">Recording finished. This does not imply every target was achieved.</Text>}
  </Stack>
}

export function ContentState({ state, title, message, onRetry }: {
  state: 'loading' | 'empty' | 'error'; title: string; message: string; onRetry?: () => void
}) {
  return <Stack role={state === 'error' ? 'alert' : 'status'} gap="sm">
    {state === 'loading' && <Loader size="sm" />}<Text fw={600}>{title}</Text><Text>{message}</Text>
    {state === 'error' && onRetry && <Group><Button variant="default" onClick={onRetry}>Try again</Button></Group>}
  </Stack>
}
