import { useState } from 'react'
import { Alert, Button, Code, Group, SegmentedControl, Select, SimpleGrid, Stack, Switch, Text, Title } from '@mantine/core'
import { AccountForm, ProfileSummary, RelationshipSummary } from '../components/coaching/accounts'
import { ExerciseGuidance, ExercisePicker } from '../components/catalogue/exercise-guidance'
import { PrescribedSetEditor, LoggedSetEditor, LoggedSetSummary } from '../components/training/sets'
import { WorkoutItem } from '../components/training/workout-item'
import { WorkoutBlock, SessionContent } from '../components/training/blocks'
import { ProgrammeTree } from '../components/programmes/programme-tree'
import { FeedbackForm } from '../components/workouts/feedback'
import { ContentState, SaveStatus, WorkoutSummary, type SyncState } from '../components/workouts/status'
import { TrainingConversation } from '../components/conversations/conversation'
import { AdaptationProposal } from '../components/adaptations/proposal'
import { ExerciseClassification } from '../components/catalogue/analysis'
import { AnalysisReviewForm } from '../components/catalogue/analysis-review'
import type { Row, TrainingMode } from '../components/training/model'
import * as fixtures from './fixtures'

export function AccountExamples() {
  const [mode, setMode] = useState<'sign-in' | 'invite' | 'recover'>('invite')
  const [fail, setFail] = useState(false)
  const [result, setResult] = useState('')
  const [status, setStatus] = useState<'invited' | 'active' | 'inactive'>('invited')
  return <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
    <Stack><Title order={3}>Account access</Title><SegmentedControl aria-label="Account form example" value={mode} onChange={value => { setMode(value as typeof mode); setResult('') }} data={[
      { value: 'invite', label: 'Invite' }, { value: 'sign-in', label: 'Sign in' }, { value: 'recover', label: 'Recovery' },
    ]} /><Switch label="Simulate request failure" checked={fail} onChange={e => setFail(e.currentTarget.checked)} />
      <AccountForm key={mode} mode={mode} onSubmit={() => setResult(fail ? 'error' : 'Request accepted in this demo.')} error={result === 'error' ? 'Example server error.' : undefined} />
      <Text role="status">{result !== 'error' && result}</Text>
    </Stack>
    <Stack gap="lg"><Title order={3}>Profiles and relationships</Title><ProfileSummary profile={{ display_name: 'Mark Reid', role: 'coach' }} />
      <RelationshipSummary name="Alex Morgan" status={status} role="coach" onResend={() => setResult('Demo resend requested.')} onDeactivate={() => setStatus('inactive')} />
      <RelationshipSummary name="Mark Reid" status={status} role="client" onAccept={() => setStatus('active')} />
      <Group><Button variant="default" onClick={() => setStatus('invited')}>Reset relationship</Button></Group>
    </Stack>
  </SimpleGrid>
}

export function CatalogueExamples() {
  const [id, setId] = useState<string | null>(fixtures.bench.id)
  const [unavailable, setUnavailable] = useState(false)
  const exercise = [fixtures.bench, fixtures.row].find(e => e.id === id) ?? null
  return <Stack><ExercisePicker exercises={[fixtures.bench, fixtures.row]} value={id} onChange={setId} />
    <Switch label="Demonstration unavailable example" checked={unavailable} onChange={e => setUnavailable(e.currentTarget.checked)} />
    <ExerciseGuidance key={`${id}-${unavailable}`} exercise={exercise && unavailable ? { ...exercise, media: [] } : exercise} coachNotes="Your coach’s cue stays separate from catalogue guidance." />
  </Stack>
}

export function AnalysisExamples() {
  const [result, setResult] = useState('')
  const [fail, setFail] = useState(false)
  const [error, setError] = useState<string>()
  return <Stack gap="lg">
    <Text>Fictional classifications demonstrate evidence levels and immutable history; no review is written to the catalogue.</Text>
    <SimpleGrid cols={{ base: 1, md: 2 }}>
      <ExerciseClassification title="Imported classification example" value={fixtures.importedAnalysis} />
      <ExerciseClassification title="Reviewed classification example" value={fixtures.reviewedAnalysis} />
      <ExerciseClassification title="Unclassified historical example" value={null} />
      <ExerciseClassification title="Explicitly cleared classification" value={{ ...fixtures.reviewedAnalysis, family_id: null, family: null, mappings: [] }} />
    </SimpleGrid>
    <Title order={3}>Review a custom exercise</Title>
    <Switch label="Simulate classification save failure" checked={fail} onChange={e => setFail(e.currentTarget.checked)} />
    <AnalysisReviewForm exerciseId="demo-owned-custom-exercise" initialValue={null} groups={[fixtures.chest]} muscles={[fixtures.pectoralis]} families={[fixtures.benchFamily]}
      error={error} onSubmit={command => {
        if (fail) setError('Example server error.')
        else { setError(undefined); setResult(JSON.stringify(command, null, 2)) }
      }} />
    {result && <><Text role="status">Revision command captured in this demo.</Text><Code block>{result}</Code></>}
  </Stack>
}

export function ClassificationHistoryExample() {
  return <WorkoutItem value={fixtures.pair.exercises[0]} mode="review" />
}

export function SetExamples() {
  const [target, setTarget] = useState(fixtures.target)
  const [actual, setActual] = useState(fixtures.pair.exercises[0].actuals[0])
  return <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
    <Stack component="section" aria-label="Coach set"><Title order={3}>Prescribed set</Title><PrescribedSetEditor value={target} onChange={setTarget} /></Stack>
    <Stack component="section" aria-label="Client set"><Title order={3}>Logged set</Title><LoggedSetEditor value={actual} target={target} onChange={setActual} /><LoggedSetSummary value={actual} target={target} /></Stack>
  </SimpleGrid>
}

export function ItemExample({ unlinked = false }: { unlinked?: boolean }) {
  const [value, setValue] = useState(() => ({ ...structuredClone(fixtures.single.exercises[0]), ...(unlinked ? { exercise: null, exercise_id: null } : {}) }))
  return <WorkoutItem value={value} onChange={setValue} mode="log" />
}

export function BlockExample({ initialMode = 'log', kind = 'superset' }: { initialMode?: TrainingMode; kind?: 'single' | 'superset' }) {
  const [value, setValue] = useState(() => structuredClone(kind === 'superset' ? fixtures.pair : fixtures.single))
  const [mode, setMode] = useState<TrainingMode>(initialMode)
  return <Stack gap="lg"><Group justify="space-between">
    <SegmentedControl aria-label="Training component mode" value={mode} onChange={v => setMode(v as TrainingMode)} data={[
      { value: 'prescribe', label: 'Coach' }, { value: 'log', label: 'Client' }, { value: 'review', label: 'Review' },
    ]} /><Button variant="default" onClick={() => setValue(structuredClone(kind === 'superset' ? fixtures.pair : fixtures.single))}>Reset block</Button>
  </Group><WorkoutBlock value={value} mode={mode} onChange={mode === 'review' ? undefined : setValue} /></Stack>
}

export function SessionExample() {
  const [value, setValue] = useState(() => structuredClone(fixtures.session))
  return <SessionContent value={value} mode="log" onChange={setValue} />
}

export function ProgrammeExample() {
  const [value, setValue] = useState(() => structuredClone(fixtures.programme))
  return <ProgrammeTree value={value} mode="prescribe" onChange={setValue} onPublish={() => setValue({ ...value, status: 'published' })} />
}

export function WorkoutExamples() {
  const [selected, setSelected] = useState(false)
  const [status, setStatus] = useState('in_progress')
  const [result, setResult] = useState('')
  return <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
    <Stack><Select label="Workout state example" value={status} onChange={v => setStatus(v ?? 'in_progress')} data={['in_progress', 'completed', 'abandoned']} />
      <WorkoutSummary workout={{ id: 'workout-demo', status, started_at: '2026-10-04T09:00:00Z' }} sources={fixtures.sources} completedSets={3} totalSets={4}
        adaptationReason="Reduced load for this attempt." onResume={() => setSelected(true)} />
      {selected && <Text role="status">Draft selected for this demo.</Text>}
    </Stack>
    <Stack><Title order={3}>Workout feedback</Title><FeedbackForm initialValue={fixtures.feedback} onSubmit={value => setResult(JSON.stringify(value, null, 2))} />
      {result && <><Text role="status">Feedback captured in this demo.</Text><Code block>{result}</Code></>}
    </Stack>
  </SimpleGrid>
}

export function ConversationExample() {
  const [messages, setMessages] = useState<Pick<Row<'messages'>, 'id' | 'role' | 'content'>[]>([
    { id: 'message-1', role: 'user', content: 'I have less time today. Can we keep the press and row as a superset?' },
    { id: 'message-2', role: 'assistant', content: 'The example proposal keeps the pair and reduces the load. Review the changes before applying them.' },
  ])
  const [draft, setDraft] = useState('')
  const [fail, setFail] = useState(false)
  const [error, setError] = useState<string>()
  return <Stack><Switch label="Simulate message failure" checked={fail} onChange={e => setFail(e.currentTarget.checked)} />
    <TrainingConversation title="Adapting today’s session" messages={messages} draft={draft} onDraftChange={setDraft} error={error}
      onSend={message => { if (fail) setError('Example send failure.'); else { setMessages([...messages, { id: crypto.randomUUID(), role: 'user', content: message }]); setDraft(''); setError(undefined) } }} />
    <Text size="sm">Example transcript. No AI provider is connected.</Text>
  </Stack>
}

export function ProposalExample({ initialStatus = 'proposed' }: { initialStatus?: 'proposed' | 'applied' | 'rejected' | 'stale' }) {
  const [status, setStatus] = useState(initialStatus)
  return <Stack><AdaptationProposal reason="Reduce the load and take 120 seconds after each complete pair." original={fixtures.original} proposed={fixtures.proposed}
    sources={fixtures.sources} status={status} onApply={() => setStatus('applied')} onReject={() => setStatus('rejected')} />
    <Group><Button variant="default" onClick={() => setStatus('proposed')}>Reset proposal</Button><Button variant="default" onClick={() => setStatus('stale')}>Simulate programme change</Button></Group>
  </Stack>
}

export function StateExamples() {
  const [state, setState] = useState<SyncState>('error')
  const [retried, setRetried] = useState(false)
  return <Stack gap="lg"><Alert title="State demonstrations only">This catalogue does not store or sync data. Containers will supply these states from the persistence layer.</Alert>
    <Select label="Save and sync state example" value={state} onChange={v => setState(v as SyncState)} data={['unsaved', 'device-saved', 'pending', 'syncing', 'synced', 'error']} />
    <SaveStatus state={state} onRetry={() => setState('synced')} />
    <ContentState state="loading" title="Loading programme" message="Fetching the published prescription." />
    <ContentState state="empty" title="No programme yet" message="Your coach has not published a programme." />
    {retried ? <Text role="status">Demo retry succeeded.</Text> : <ContentState state="error" title="Programme unavailable" message="Your entries have not been changed." onRetry={() => setRetried(true)} />}
  </Stack>
}
