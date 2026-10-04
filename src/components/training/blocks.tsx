import { Alert, Divider, Fieldset, NumberInput, Stack, Text, Title } from '@mantine/core'
import { WorkoutItem } from './workout-item'
import type { ExerciseItem, Session, TrainingBlock, TrainingMode } from './model'

export function WorkoutBlock({ value, mode, onChange }: {
  value: TrainingBlock; mode: TrainingMode; onChange?: (value: TrainingBlock) => void
}) {
  const update = (item: ExerciseItem) => onChange?.({ ...value, exercises: value.exercises.map(e => e.id === item.id ? item : e) })
  const exercises = [...value.exercises].sort((a, b) => a.position - b.position)
  if ((value.kind === 'single' && exercises.length !== 1) || (value.kind === 'superset' && exercises.length !== 2)) {
    return <Alert title="Incomplete training block" color="red">{value.kind === 'single' ? 'A single block needs one exercise.' : 'A superset needs two exercises.'} Complete the prescription before starting.</Alert>
  }
  if (value.kind === 'single') return <WorkoutItem value={exercises[0]} mode={mode} onChange={onChange ? update : undefined} />
  const roundPositions = [...new Set(exercises.flatMap(e => e.actuals.map(s => s.position)))].sort((a, b) => a - b)
  const rest = value.rest_after_round_seconds === null ? 'Rest after the pair: not prescribed.' : `Rest ${value.rest_after_round_seconds} s after the pair.`
  return <Stack gap="lg" component="section" aria-label={`Superset ${value.label}`}>
    <div><Title order={3}>Superset {value.label}</Title><Text size="sm">{exercises.map((e, index) => `${value.label}${index + 1} ${e.display_name}`).join(' → ')} → rest → repeat</Text></div>
    {mode === 'prescribe' ? <>
      <NumberInput label="Rest after complete round (s)" description={<Text span size="sm" c="dark.6">Perform both exercises before resting.</Text>} min={0} allowNegative={false} allowDecimal={false} clampBehavior="strict"
        value={value.rest_after_round_seconds ?? ''} readOnly={!onChange} maw={360}
        onChange={next => { if (typeof next === 'number' || next === '') onChange?.({ ...value, rest_after_round_seconds: next === '' ? null : next }) }} />
      {exercises.map((item, index) => <WorkoutItem key={item.id} value={item} mode={mode} superset marker={`${value.label}${index + 1}`} onChange={onChange ? update : undefined} />)}
    </> : roundPositions.length ? roundPositions.map(round => <Fieldset key={round} legend={`Round ${round}`}>
      <Stack gap="lg">
        {exercises.map((item, index) => <WorkoutItem key={item.id} value={{ ...item, actuals: item.actuals.filter(set => set.position === round) }} mode={mode} superset marker={`${value.label}${index + 1}`}
          onChange={onChange ? next => update({ ...item, actuals: item.actuals.map(set => next.actuals.find(updated => updated.id === set.id) ?? set) }) : undefined} />)}
        <Text fw={600}>{rest}</Text>
      </Stack>
    </Fieldset>) : <Text>No sets recorded for this superset.</Text>}
  </Stack>
}

export function SessionContent({ value, mode, onChange }: { value: Session; mode: TrainingMode; onChange?: (value: Session) => void }) {
  return <Stack gap="xl" component="section" aria-label={value.name}>
    <div><Title order={3}>{value.name}</Title>{value.notes && <Text>{value.notes}</Text>}</div>
    {value.blocks.length ? [...value.blocks].sort((a, b) => a.position - b.position).map((block, index) => <Stack key={block.id} gap="xl">
      {index > 0 && <Divider />}
      <WorkoutBlock value={block} mode={mode} onChange={onChange ? next => onChange({ ...value, blocks: value.blocks.map(item => item.id === next.id ? next : item) }) : undefined} />
    </Stack>) : <Text>No exercises prescribed yet.</Text>}
  </Stack>
}
