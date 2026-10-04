import { Alert, Badge, Button, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { SessionContent } from '../training/blocks'
import { SourceReferences } from '../workouts/status'
import type { Session, SourceReference } from '../training/model'

export function AdaptationProposal({ reason, original, proposed, sources, status, pending = false, onApply, onReject }: {
  reason: string; original: Session; proposed: Session; sources: SourceReference[]
  status: 'proposed' | 'applied' | 'rejected' | 'stale'; pending?: boolean; onApply?: () => void; onReject?: () => void
}) {
  return <Stack gap="lg">
    <Group justify="space-between"><Title order={3}>Workout adaptation</Title><Badge variant="default">{status}</Badge></Group>
    <Text>{reason}</Text><SourceReferences sources={sources} />
    <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
      <Stack><Text fw={700}>Original prescription</Text><SessionContent value={original} mode="prescribe" analysisContext="original" /></Stack>
      <Stack><Text fw={700}>Proposed instructions</Text><SessionContent value={proposed} mode="prescribe" analysisContext={status === 'applied' ? 'applied' : 'proposed'} /></Stack>
    </SimpleGrid>
    {status === 'stale' ? <Alert title="Programme changed">Request a new proposal before applying changes.</Alert> : <Text size="sm">Applies to this workout only. Your coach’s programme is not rewritten.</Text>}
    {status === 'proposed' && <Group>
      {onApply && <Button color="blue.8" loading={pending} onClick={onApply}>Apply to this workout</Button>}
      {onReject && <Button variant="default" disabled={pending} onClick={onReject}>Reject proposal</Button>}
    </Group>}
  </Stack>
}
