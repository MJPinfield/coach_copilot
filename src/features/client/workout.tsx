import { Accordion, ActionIcon, Alert, Anchor, Badge, Box, Button, Divider, Group, Modal, NumberInput, Paper, Popover, Progress, Select, Stack, Text, Textarea, TextInput, Title } from '@mantine/core'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useLoaderData } from '@tanstack/react-router'
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
  return <Stack gap={6} p="xs" bg={value.completed ? 'green.0' : 'gray.0'} component="section" aria-label={`${exercise.performed_name} set ${value.position}`}>
    <Group justify="space-between" gap="xs">
      <Text size="sm" fw={600} c="dark.7">Set {value.position}{value.completed ? ' · Recorded' : ''}</Text>
      <Popover width={280} position="bottom-end" withArrow trapFocus>
        <Popover.Target><Button variant="subtle" c="blue.8" size="compact-sm">Set details</Button></Popover.Target>
        <Popover.Dropdown><Stack gap="sm">
          <TargetSummary target={target} />
          <Select label="Load convention" data={Object.entries(loadLabels).map(([value, label]) => ({ value, label }))} value={convention} allowDeselect={false} readOnly={locked} comboboxProps={{ withinPortal: false }}
          onChange={next => { if (next) onChange({ ...value, load_convention: next as SetLoad['load_convention'], load_kg: next === 'bodyweight' ? null : value.load_kg, load_reference: next === 'machine_display' ? value.load_reference : null }) }} />
          {convention === 'machine_display' && <TextInput label="Machine reference (optional)" maxLength={200} value={value.load_reference ?? ''} readOnly={locked} onChange={e => onChange({ ...value, load_reference: e.currentTarget.value || null })} />}
          <Text size="sm">RIR means repetitions left in reserve. Blank fields stay unknown, not zero.</Text>
        </Stack></Popover.Dropdown>
      </Popover>
    </Group>
    <Group gap="xs" wrap="nowrap" align="end">
      <NumberInput flex={1} miw={0} label={convention === 'bodyweight' ? 'External kg' : 'Load (kg)'} hideControls size="md" value={value.load_kg ?? ''} min={0} allowNegative={false} decimalScale={2} clampBehavior="strict" readOnly={locked || convention === 'bodyweight'} onChange={next => number(next, updateLoad)} />
      <NumberInput flex={1} miw={0} label="Reps" hideControls size="md" value={value.reps ?? ''} min={0} allowNegative={false} allowDecimal={false} clampBehavior="strict" readOnly={locked} onChange={next => number(next, reps => onChange({ ...value, reps }))} />
      <NumberInput flex={1} miw={0} label="RIR" hideControls size="md" value={value.rir ?? ''} min={0} max={10} allowNegative={false} decimalScale={1} clampBehavior="strict" readOnly={locked} onChange={next => number(next, rir => onChange({ ...value, rir }))} />
      <ActionIcon size={44} color="green.8" variant={value.completed ? 'filled' : 'default'} disabled={locked} aria-label={value.completed ? 'Undo set completion' : `Record set ${value.position}`} aria-pressed={value.completed} onClick={() => onChange({ ...value, completed: !value.completed })}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
      </ActionIcon>
    </Group>
    <Text size="sm">PT: {target?.reps_min ?? target?.reps_max ?? '—'}{target?.reps_min != null && target.reps_max != null && target.reps_max !== target.reps_min ? `–${target.reps_max}` : ''} reps{target?.rir != null ? ` · ${target.rir} RIR` : ''}{target?.load_kg != null ? ` · ${target.load_kg} kg (${loadLabels[target.load_convention]})` : ''}</Text>
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
  const workout = draft.workout
  const blocks = [...workout.workout_blocks].sort((a, b) => a.position - b.position)
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
    // save_workout replaces set rows, so journal edits by stable exercise/position.
    persist({ ...draft, editedSets: [...new Set([...(draft.editedSets ?? []), `${exerciseId}:${next.position}`])], revision: crypto.randomUUID(), dirty: true, workout: { ...workout,
      workout_blocks: workout.workout_blocks.map(b => ({ ...b, workout_exercises: b.workout_exercises.map(e => e.id === exerciseId ? { ...e, logged_sets: e.logged_sets.map(s => s.id === next.id ? next : s) } : e) })),
    } })
  }
  return <Stack gap="xl">
    <div><Anchor c="blue.8" component={Link} to="/">Back to your training</Anchor>
      <Group justify="space-between" mt="sm"><Title order={1} size="h2">{workoutName(workout)}</Title>{!locked && <Button color="blue.8" onClick={() => setConfirmFinish(true)}>Finish workout</Button>}</Group>
      <Text mt="xs" size="sm">{locked ? workout.status === 'completed' ? 'Workout finished. Your recorded results are below.' : 'Finishing your workout…' : 'Your PT’s sets, ready to log. Adjust reps if needed, then tick each set. For rep ranges, start at the lower target.'}</Text>
    </div>
    <div role="status" aria-live="polite">
      <Group justify="space-between"><Text fw={600}>{completed} of {sets.length} sets recorded</Text><Badge variant="default">
        {storageError ? 'Device save unavailable' : save.isPending ? 'Saving…' : draft.dirty ? online ? 'Saved on this device' : 'Offline · saved on device' : 'Saved to your account'}
      </Badge></Group><Progress color="green.8" mt="sm" value={sets.length ? completed / sets.length * 100 : 0} aria-label="Recorded sets" />
    </div>
    {storageError && <Alert color="red" title="Could not save on this device">Keep this page open until your entries save to your account. Device storage may be full or disabled.</Alert>}
    {save.isError && <Alert color="red" title="Your latest changes have not synced">{storageError ? 'Your entries are still on this page.' : 'Your entries are saved on this device.'} Check your connection and sign-in, then retry.<Button mt="sm" display="block" variant="default" onClick={() => save.mutate(current.current)}>Retry save</Button></Alert>}
    {!online && <Text size="sm">You can keep logging this downloaded workout. Changes sync when this page reconnects. Start new workouts while online.</Text>}
    {blocks.length > 0 ? <>
      <Group gap="xs" component="nav" aria-label="Jump to exercise">{blocks.map(block => <Button component="a" key={block.id} href={`#block-${block.id}`} variant="light" color={block.kind === 'superset' ? 'violet' : 'blue'} c={block.kind === 'superset' ? 'violet.9' : 'blue.9'} size="xs">{block.kind === 'superset' ? `Superset ${block.label}` : block.workout_exercises[0]?.performed_name}</Button>)}</Group>
      {blocks.map(block => {
        const exercises = [...block.workout_exercises].sort((a, b) => a.position - b.position)
        const rounds = [...new Set(exercises.flatMap(e => e.logged_sets.map(s => s.position)))].sort((a, b) => a - b)
        const colour = block.kind === 'superset' ? 'violet' : 'blue'
        const blockSets = exercises.flatMap(e => e.logged_sets)
        return <Paper withBorder radius="md" key={block.id} component="section" id={`block-${block.id}`} style={{ scrollMarginTop: 80, overflow: 'hidden' }} aria-label={block.kind === 'superset' ? `Superset ${block.label}` : exercises[0]?.performed_name}>
          <Box p="md" bg={`${colour}.0`}>
            <Group justify="space-between" gap="xs" mb="xs">
              <Badge color={`${colour}.8`} radius="sm">{block.kind === 'superset' ? 'Superset · paired exercises' : 'Single exercise'}</Badge>
              <Text size="sm" c={`${colour}.9`}>{blockSets.filter(s => s.completed).length}/{blockSets.length} recorded</Text>
            </Group>
            <Title order={2} size="h3" c={`${colour}.9`}>{block.kind === 'superset' ? `Superset ${block.label}` : exercises[0]?.performed_name}</Title>
            {block.kind === 'superset' && <Text size="sm" c="violet.9" mt={4}>{exercises.map((e, i) => `${block.label}${i + 1} ${e.performed_name}`).join(' → ')} → rest → repeat</Text>}
          </Box>
          <Stack p={{ base: 'xs', sm: 'md' }} gap="lg">
          {rounds.map(round => <Stack key={round} gap="sm" component="section" aria-label={`${block.label} round ${round}`}>
            {block.kind === 'superset' && <Divider label={`Round ${round}`} labelPosition="left" color="violet.2" styles={{ label: { color: 'var(--mantine-color-violet-9)', fontWeight: 600 } }} />}
            {exercises.map((exercise, index) => {
              const set = exercise.logged_sets.find(s => s.position === round)
              if (!set) return null
              const target = targets(exercise).find(t => t.position === round)
              const untouched = !locked && !set.completed && !draft.editedSets?.includes(`${exercise.id}:${set.position}`) && set.reps === null && set.load_kg === null && set.rir === null && set.load_convention === 'unknown' && set.load_reference === null
              const value = untouched ? { ...set, reps: target?.reps_min ?? target?.reps_max ?? null } : set
              return <Stack key={exercise.id} gap={4}>
                {block.kind === 'superset' && <Group gap="xs" px="xs" wrap="nowrap"><Badge color="violet.8" radius="sm" miw={36}>{block.label}{index + 1}</Badge><Text fw={600}>{exercise.performed_name}</Text></Group>}
                <SetEntry value={value} exercise={exercise} locked={locked} onChange={next => changeSet(exercise.id, next)} />
                {block.kind === 'single' && target?.rest_seconds != null && <Text size="sm">Rest {target.rest_seconds}s after this set.</Text>}
              </Stack>
            })}
            {block.kind === 'superset' ? <Text size="sm" fw={600} c="violet.9" bg="violet.0" p="xs">{block.rest_after_round_seconds === null ? 'Rest after the complete round.' : `Rest ${block.rest_after_round_seconds} seconds after the complete round.`}</Text> : <Divider />}
          </Stack>)}
          {!rounds.length && <Text>No sets prescribed for this exercise.</Text>}
          <Accordion>{exercises.map(e => <Accordion.Item key={e.id} value={e.id}><Accordion.Control>How to: {e.performed_name}</Accordion.Control><Accordion.Panel><Guidance exercise={e} /></Accordion.Panel></Accordion.Item>)}</Accordion>
          </Stack>
        </Paper>
      })}
    </> : <Text>This workout contains no exercises.</Text>}
    <Textarea label="Notes for your coach (optional)" description={<Text span size="sm" c="dark.6">How did it go? Include anything your coach should know.</Text>} minRows={3} value={draft.notes} readOnly={locked} onChange={e => persist({ ...draft, notes: e.currentTarget.value, dirty: true, revision: crypto.randomUUID() })} />
    {!locked && <Button size="md" color="blue.8" aria-label="Finish workout at bottom" onClick={() => setConfirmFinish(true)}>Finish workout</Button>}
    {draft.complete && <Text>Finish is saved on this device and will be confirmed when synced.</Text>}
    <Modal opened={confirmFinish} onClose={() => setConfirmFinish(false)} title="Finish this workout?" centered>
      <Stack><Text>{completed} of {sets.length} sets are marked complete. Unchecked sets stay incomplete. After finishing, this workout cannot be edited.</Text>
        <Group justify="flex-end"><Button variant="default" onClick={() => setConfirmFinish(false)}>Keep training</Button><Button color="blue.8" onClick={() => { persist({ ...draft, complete: true, dirty: true, revision: crypto.randomUUID() }); setConfirmFinish(false) }}>Finish and save</Button></Group>
      </Stack>
    </Modal>
  </Stack>
}
