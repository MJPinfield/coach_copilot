import { Accordion, Badge, Button, Group, Stack, Text, Title } from '@mantine/core'
import { SessionContent } from '../training/blocks'
import type { Programme, TrainingMode } from '../training/model'

export function ProgrammeTree({ value, mode, onChange, onPublish, pending = false }: {
  value: Programme; mode: TrainingMode; onChange?: (value: Programme) => void; onPublish?: () => void; pending?: boolean
}) {
  return <Stack gap="md">
    <Group justify="space-between" align="start"><div><Title order={3}>{value.name}</Title><Text>For {value.clientName}</Text></div><Badge variant="default">{value.status}</Badge></Group>
    {value.goal && <Text>{value.goal}</Text>}
    {mode === 'prescribe' && value.status === 'draft' && <Group><Text size="sm">Only you can see this draft.</Text>{onPublish && <Button color="blue.8" loading={pending} onClick={onPublish}>Publish programme</Button>}</Group>}
    {value.weeks.length ? <Accordion multiple>
      {value.weeks.map(week => <Accordion.Item key={week.id} value={week.id}>
        <Accordion.Control>{week.name} · {week.sessions.length} {week.sessions.length === 1 ? 'session' : 'sessions'}</Accordion.Control>
        <Accordion.Panel><Stack gap="xl">
          {week.sessions.length ? week.sessions.map(session => <SessionContent key={session.id} value={session} mode={mode}
            onChange={onChange ? next => onChange({ ...value, weeks: value.weeks.map(w => w.id === week.id ? { ...w, sessions: w.sessions.map(s => s.id === next.id ? next : s) } : w) }) : undefined} />)
            : <Text>No sessions in this week yet.</Text>}
        </Stack></Accordion.Panel>
      </Accordion.Item>)}
    </Accordion> : <Text>No weeks in this programme yet.</Text>}
  </Stack>
}
