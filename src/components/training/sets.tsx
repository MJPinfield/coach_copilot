import { Checkbox, Fieldset, NumberInput, SimpleGrid, Stack, Text } from '@mantine/core'
import type { SetActual, SetTarget } from './model'
import { describeLoad, LoadEditor } from './load'

// Mantine owns input editing/clamping. The domain uses null for unknown, not zero.
function nullable(value: string | number, change: (value: number | null) => void) {
  if (typeof value === 'number') change(value)
  else if (value === '') change(null)
}

export function TargetSummary({ target }: { target?: SetTarget }) {
  if (!target) return <Text size="sm">No prescribed target for this set.</Text>
  const reps = target.reps_min === null ? 'Reps unspecified' : target.reps_max !== null && target.reps_max !== target.reps_min
    ? `${target.reps_min}–${target.reps_max} reps` : `${target.reps_min} reps`
  return <Text size="sm">Target: {reps} · {describeLoad(target, 'Load unspecified')} · {target.rir === null ? 'RIR unspecified' : `${target.rir} RIR`}</Text>
}

export function PrescribedSetEditor({ value, onChange, showRest = true }: {
  value: SetTarget; onChange?: (value: SetTarget) => void; showRest?: boolean
}) {
  const field = (key: 'reps_min' | 'reps_max' | 'rir' | 'rest_seconds', label: string, min: number, max?: number, integer = false) => (
    <NumberInput label={label} value={value[key] ?? ''} readOnly={!onChange} min={min} max={max}
      allowNegative={false} allowDecimal={!integer} decimalScale={integer ? 0 : 2} clampBehavior="strict"
      onChange={next => nullable(next, number => onChange?.({ ...value, [key]: number }))}
      error={key === 'reps_max' && value.reps_max !== null && (value.reps_min === null || value.reps_max < value.reps_min) ? 'Maximum must be at least minimum reps' : undefined} />
  )
  return <Fieldset legend={`Set ${value.position}`}>
    <Stack gap="sm">
      <LoadEditor value={value} onChange={onChange ? load => onChange({ ...value, ...load }) : undefined} />
      <SimpleGrid cols={{ base: 2, sm: showRest ? 4 : 3 }}>
        {field('reps_min', 'Minimum reps', 1, undefined, true)}
        {field('reps_max', 'Maximum reps', 1, undefined, true)}
        {field('rir', 'RIR', 0, 10)}
        {showRest && field('rest_seconds', 'Rest after set (s)', 0, undefined, true)}
      </SimpleGrid>
      {value.notes && <Text mt="sm" size="sm">{value.notes}</Text>}
    </Stack>
  </Fieldset>
}

export function LoggedSetEditor({ value, target, onChange }: {
  value: SetActual; target?: SetTarget; onChange?: (value: SetActual) => void
}) {
  return <Fieldset legend={`Set ${value.position}`}>
    <Stack gap="sm">
      <TargetSummary target={target} />
      <LoadEditor actual value={value} onChange={onChange ? load => onChange({ ...value, ...load }) : undefined} />
      <SimpleGrid cols={2}>
        <NumberInput label="Actual reps" value={value.reps ?? ''} readOnly={!onChange} min={0}
          allowNegative={false} allowDecimal={false} clampBehavior="strict" onChange={next => nullable(next, reps => onChange?.({ ...value, reps }))} />
        <NumberInput label="Actual RIR" description={<Text span size="sm" c="dark.6">Repetitions in reserve</Text>} value={value.rir ?? ''} readOnly={!onChange} min={0} max={10}
          allowNegative={false} decimalScale={1} clampBehavior="strict" onChange={next => nullable(next, rir => onChange?.({ ...value, rir }))} />
      </SimpleGrid>
      <Checkbox label="Set completed" size="md" checked={value.completed} disabled={!onChange} py="xs"
        onChange={event => onChange?.({ ...value, completed: event.currentTarget.checked })} />
    </Stack>
  </Fieldset>
}

export function LoggedSetSummary({ value, target }: { value: SetActual; target?: SetTarget }) {
  return <Stack gap={4}>
    <Text fw={600}>Set {value.position} · {value.completed ? 'Completed' : 'Not marked complete'}</Text>
    <TargetSummary target={target} />
    <Text size="sm">Actual: {describeLoad(value)} · {value.reps === null ? 'Reps not recorded' : `${value.reps} reps`} · {value.rir === null ? 'RIR not recorded' : `${value.rir} RIR`}</Text>
  </Stack>
}
