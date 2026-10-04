import { Accordion, Alert, Anchor, Badge, Button, Divider, Group, Modal, NumberInput, Progress, Select, SimpleGrid, Stack, Text, Textarea, TextInput, Title } from '@mantine/core'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useLoaderData, useNavigate, useSearch } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { TargetSummary } from '../../components/training/sets'
import { loadLabels } from '../../components/training/load'
import type { Row, SetLoad } from '../../components/training/model'
import { queryClient } from '../../app/query'
import { backend, object, saveDraft, targets, workoutName, writeDraft, type Draft, type WorkoutExercise } from './api'

function Guidance({ exercise }: { exercise: WorkoutExercise }) {
  const guidance = useQuery({
    queryKey: ['exercise-guidance', exercise.exercise_id],
    enabled: Boolean(exercise.exercise_id),
    queryFn: async () => {
      const { data, error } = await backend().from('exercise_instructions').select('text, steps').eq('exercise_id', exercise.exercise_id!).eq('locale', 'en').maybeSingle()
      if (error) throw error
      return data
    },
  })
  const notes = object(exercise.applied_snapshot).notes ?? object(exercise.applied_snapshot).coach_notes
  return <Stack gap="sm">
    {typeof notes === 'string' && notes && <Text>{notes}</Text>}
    {guidance.data ? <Text>{guidance.data.text}</Text> : <Text size="sm">{guidance.isFetching ? 'Loading exercise guidance…' : 'Exercise guidance is unavailable. Ask your coach if you are unsure of the movement.'}</Text>}
  </Stack>
}

function SetEntry({ value, exercise, locked, onChange }: {
  value: Row<'logged_sets'>; exercise: WorkoutExercise; locked: boolean; onChange: (value: Row<'logged_sets'>) => void
}) {
  const target = targets(exercise).find(s => s.position === value.position)
  const convention = value.load_convention
  const updateLoad = (load: number | null) => onChange({ ...value, load_kg: load })
  const number = (next: string | number, action: (value: number | null) => void) => {
    if (typeof next === 'number' || next === '') action(next === '' ? null : next)
  }
  return <Stack gap="sm" component="section" aria-label={`${exercise.performed_name} set ${value.position}`}>
    <Group justify="space-between"><Text fw={600}>Set {value.position}</Text>{value.completed && <Badge variant="default">Recorded</Badge>}</Group>
    <TargetSummary target={target} />
    <SimpleGrid cols={3} spacing="sm">
      <NumberInput label={convention === 'bodyweight' ? 'External kg' : 'Load (kg)'} size="md" value={value.load_kg ?? ''} min={0} allowNegative={false} decimalScale={2} clampBehavior="strict" readOnly={locked || convention === 'bodyweight'} onChange={next => number(next, updateLoad)} />
      <NumberInput label="Reps" size="md" value={value.reps ?? ''} min={0} allowNegative={false} allowDecimal={false} clampBehavior="strict" readOnly={locked} onChange={next => number(next, reps => onChange({ ...value, reps }))} />
      <NumberInput label="RIR" size="md" value={value.rir ?? ''} min={0} max={10} allowNegative={false} decimalScale={1} clampBehavior="strict" readOnly={locked} onChange={next => number(next, rir => onChange({ ...value, rir }))} />
    </SimpleGrid>
    <Text size="sm">{loadLabels[convention]} · RIR means repetitions left in reserve.</Text>
    <Accordion variant="default">
      <Accordion.Item value="load"><Accordion.Control>Load details</Accordion.Control><Accordion.Panel>
        <Stack gap="sm"><Select label="Load convention" data={Object.entries(loadLabels).map(([value, label]) => ({ value, label }))} value={convention} allowDeselect={false} readOnly={locked}
          onChange={next => { if (next) onChange({ ...value, load_convention: next as SetLoad['load_convention'], load_kg: next === 'bodyweight' ? null : value.load_kg, load_reference: next === 'machine_display' ? value.load_reference : null }) }} />
          {convention === 'machine_display' && <TextInput label="Machine reference (optional)" maxLength={200} value={value.load_reference ?? ''} readOnly={locked} onChange={e => onChange({ ...value, load_convention: convention, load_reference: e.currentTarget.value || null })} />}
          <Text size="sm">Record what you actually performed. Blank fields stay unknown; they are not counted as zero.</Text>
        </Stack>
      </Accordion.Panel></Accordion.Item>
    </Accordion>
    {!locked && <Button color="blue.8" size="md" variant={value.completed ? 'default' : 'filled'} onClick={() => onChange({ ...value, completed: !value.completed })}>{value.completed ? 'Undo set completion' : `Record set ${value.position}`}</Button>}
  </Stack>
}

export function WorkoutPage() {
  const initial = useLoaderData({ from: '/_client/workouts/$workoutId' })
  return <WorkoutEditor key={initial.workout.id} initial={initial} />
}

function WorkoutEditor({ initial }: { initial: Draft }) {
  const [draft, setDraft] = useState(initial)
  const current = useRef(draft)
  current.current = draft
  const [online, setOnline] = useState(navigator.onLine)
  const [storageError, setStorageError] = useState(false)
  const [confirmFinish, setConfirmFinish] = useState(false)
  const navigate = useNavigate()
  const search = useSearch({ from: '/_client/workouts/$workoutId' })
  const workout = draft.workout
  const blocks = [...workout.workout_blocks].sort((a, b) => a.position - b.position)
  const selected = blocks.find(b => b.id === search.block) ?? blocks.find(b => b.id === draft.selected) ?? blocks[0]
  const sets = blocks.flatMap(b => b.workout_exercises.flatMap(e => e.logged_sets))
  const completed = sets.filter(s => s.completed).length
  const locked = workout.status !== 'in_progress' || draft.complete
  const persist = (next: Draft) => {
    current.current = next
    setDraft(next)
    try { writeDraft(next); setStorageError(false) } catch { setStorageError(true) }
  }
  const save = useMutation({
    mutationFn: saveDraft,
    scope: { id: `save-${workout.id}` },
    networkMode: 'always',
    onSuccess: (result, submitted) => {
      if (current.current.revision === submitted.revision) {
        const next = { ...current.current, workout: { ...current.current.workout, status: result.status, completed_at: result.completed_at }, dirty: false, complete: false }
        persist(next)
        queryClient.setQueryData(['workout', workout.client_id, workout.id], next)
      }
      void queryClient.invalidateQueries({ queryKey: ['workouts', workout.client_id] })
    },
  })
  useEffect(() => {
    try { writeDraft(current.current) } catch { setStorageError(true) }
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) }
  }, [])
  useEffect(() => {
    if (!draft.dirty || !online) return
    const timer = window.setTimeout(() => save.mutate(current.current), 650)
    return () => window.clearTimeout(timer)
    // Only a new local revision or reconnection schedules a save. Failed requests wait for explicit retry.
  }, [draft.revision, online])
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (storageError && current.current.dirty) event.preventDefault() }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [storageError])
  const changeSet = (exerciseId: string, next: Row<'logged_sets'>) => {
    persist({ ...draft, revision: crypto.randomUUID(), dirty: true, workout: { ...workout,
      workout_blocks: workout.workout_blocks.map(b => ({ ...b, workout_exercises: b.workout_exercises.map(e => e.id === exerciseId ? { ...e, logged_sets: e.logged_sets.map(s => s.id === next.id ? next : s) } : e) })),
    } })
  }
  const rounds = selected ? [...new Set(selected.workout_exercises.flatMap(e => e.logged_sets.map(s => s.position)))].sort((a, b) => a - b) : []
  const activeRound = rounds.includes(search.round ?? draft.round ?? 1) ? search.round ?? draft.round ?? 1 : rounds[0]
  const chooseRound = (round: number) => {
    persist({ ...draft, round })
    void navigate({ to: '/workouts/$workoutId', params: { workoutId: workout.id }, search: { block: selected.id, round }, replace: true })
  }
  return <Stack gap="xl">
    <div><Anchor c="blue.8" component={Link} to="/">Back to your training</Anchor><Title order={1} mt="md">{workoutName(workout)}</Title>
      <Text mt="xs">{locked ? workout.status === 'completed' ? 'Workout finished. Your recorded results are below.' : 'Finishing your workout…' : 'Train in the order that works today. Switch exercises whenever you need.'}</Text>
    </div>
    <div role="status" aria-live="polite">
      <Group justify="space-between"><Text fw={600}>{completed} of {sets.length} sets recorded</Text><Badge variant="default">
        {storageError ? 'Device save unavailable' : save.isPending ? 'Saving…' : draft.dirty ? online ? 'Saved on this device' : 'Offline · saved on device' : 'Saved to your account'}
      </Badge></Group><Progress mt="sm" value={sets.length ? completed / sets.length * 100 : 0} aria-label="Recorded sets" />
    </div>
    {storageError && <Alert color="red" title="Could not save on this device">Keep this page open until your entries save to your account. Device storage may be full or disabled.</Alert>}
    {save.isError && <Alert color="red" title="Your latest changes have not synced">{storageError ? 'Your entries are still on this page.' : 'Your entries are saved on this device.'} Check your connection and sign-in, then retry.<Button mt="sm" display="block" variant="default" onClick={() => save.mutate(current.current)}>Retry save</Button></Alert>}
    {!online && <Text size="sm">You can keep logging this downloaded workout. Changes sync when this page reconnects. Start new workouts while online.</Text>}
    {blocks.length > 0 ? <>
      <Select size="md" label="Exercise or superset" description={<Text span size="sm" c="dark.6">Equipment busy? Choose another, then return here.</Text>} value={selected.id} allowDeselect={false}
        data={blocks.map(b => ({ value: b.id, label: `${b.kind === 'superset' ? 'Superset: ' : ''}${[...b.workout_exercises].sort((a, c) => a.position - c.position).map(e => e.performed_name).join(' + ')} (${b.workout_exercises.flatMap(e => e.logged_sets).filter(s => s.completed).length}/${b.workout_exercises.flatMap(e => e.logged_sets).length})` }))}
        onChange={id => { if (id) { persist({ ...draft, selected: id, round: 1 }); void navigate({ to: '/workouts/$workoutId', params: { workoutId: workout.id }, search: { block: id, round: 1 }, replace: true }) } }} />
      <section aria-label="Current training block">
        <Stack gap="xl">
          <div><Title order={2}>{selected.kind === 'superset' ? `Superset ${selected.label}` : selected.workout_exercises[0]?.performed_name}</Title>
            {selected.kind === 'superset' && <Text mt="xs">{[...selected.workout_exercises].sort((a, b) => a.position - b.position).map((e, i) => `${selected.label}${i + 1} ${e.performed_name}`).join(' → ')} → rest → repeat</Text>}
          </div>
          {rounds.length > 0 && <Select label={selected.kind === 'superset' ? 'Round' : 'Set'} size="md" value={String(activeRound)} allowDeselect={false}
            data={rounds.map(round => {
              const entries = selected.workout_exercises.flatMap(e => e.logged_sets.filter(s => s.position === round))
              return { value: String(round), label: `${selected.kind === 'superset' ? 'Round' : 'Set'} ${round} · ${entries.filter(s => s.completed).length}/${entries.length} recorded` }
            })} onChange={value => { if (value) chooseRound(Number(value)) }} />}
          {rounds.filter(round => round === activeRound).map(round => <Stack key={round} gap="lg" component="section" aria-label={`Round ${round}`}>
            {[...selected.workout_exercises].sort((a, b) => a.position - b.position).map((e, index) => {
              const set = e.logged_sets.find(s => s.position === round)
              return set ? <Stack key={e.id} gap="sm">
                {selected.kind === 'superset' && <Text fw={600}>{selected.label}{index + 1} · {e.performed_name}</Text>}
                <SetEntry value={set} exercise={e} locked={locked} onChange={next => changeSet(e.id, next)} />
                {selected.kind === 'single' && targets(e).find(s => s.position === round)?.rest_seconds != null && <Text size="sm">Rest {targets(e).find(s => s.position === round)!.rest_seconds} seconds after this set.</Text>}
              </Stack> : null
            })}
            {selected.kind === 'superset' && <Text fw={600}>{selected.rest_after_round_seconds === null ? 'Rest after the complete round.' : `Rest ${selected.rest_after_round_seconds} seconds after the complete round.`}</Text>}
            <Divider />
          </Stack>)}
          {activeRound < rounds.at(-1)! && <Button variant="default" size="md" onClick={() => chooseRound(rounds[rounds.indexOf(activeRound) + 1])}>Next {selected.kind === 'superset' ? 'round' : 'set'}</Button>}
          {!rounds.length && <Text>No sets prescribed for this exercise.</Text>}
          <Accordion>{selected.workout_exercises.map(e => <Accordion.Item key={e.id} value={e.id}><Accordion.Control>How to: {e.performed_name}</Accordion.Control><Accordion.Panel><Guidance exercise={e} /></Accordion.Panel></Accordion.Item>)}</Accordion>
        </Stack>
      </section>
    </> : <Text>This workout contains no exercises.</Text>}
    <Textarea label="Notes for your coach (optional)" description={<Text span size="sm" c="dark.6">How did it go? Include anything your coach should know.</Text>} minRows={3} value={draft.notes} readOnly={locked} onChange={e => persist({ ...draft, notes: e.currentTarget.value, dirty: true, revision: crypto.randomUUID() })} />
    {!locked && <Button size="md" variant="default" onClick={() => setConfirmFinish(true)}>Finish workout</Button>}
    {draft.complete && <Text>Finish is saved on this device and will be confirmed when synced.</Text>}
    <Modal opened={confirmFinish} onClose={() => setConfirmFinish(false)} title="Finish this workout?" centered>
      <Stack><Text>{completed} of {sets.length} sets are marked complete. Unchecked sets stay incomplete. After finishing, this workout cannot be edited.</Text>
        <Group justify="flex-end"><Button variant="default" onClick={() => setConfirmFinish(false)}>Keep training</Button><Button color="blue.8" onClick={() => { persist({ ...draft, complete: true, dirty: true, revision: crypto.randomUUID() }); setConfirmFinish(false) }}>Finish and save</Button></Group>
      </Stack>
    </Modal>
  </Stack>
}
