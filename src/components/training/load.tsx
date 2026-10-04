import { NumberInput, Select, SimpleGrid, Stack, Text, TextInput } from '@mantine/core'
import type { SetLoad } from './model'

export const loadLabels: Record<SetLoad['load_convention'], string> = {
  unknown: 'Unknown convention', total_external: 'Total external load', per_dumbbell: 'Per dumbbell',
  added_bodyweight: 'Added to bodyweight', assistance: 'Assistance', machine_display: 'Machine display', bodyweight: 'Bodyweight',
}
const descriptions: Record<SetLoad['load_convention'], string> = {
  unknown: 'Interpretation is unknown; this load is not safely comparable.',
  total_external: 'Total external kilograms, including the bar where applicable.',
  per_dumbbell: 'Kilograms for each dumbbell. Do not double automatically.',
  added_bodyweight: 'External kilograms added; body mass is not included.',
  assistance: 'Kilograms of assistance. More assistance is not a strength improvement.',
  machine_display: 'Machine-indicated kilograms, not stack levels or equivalent resistance.',
  bodyweight: 'No external load. Selecting bodyweight clears a nonzero external load.',
}

export function describeLoad(value: SetLoad, missing = 'Load not recorded') {
  const amount = value.load_kg === null ? missing : `${value.load_kg} kg`
  if (value.load_convention === 'bodyweight') return `Bodyweight · ${value.load_kg === 0 ? '0 kg external' : 'No external load recorded'}`
  const reference = value.load_convention === 'machine_display' ? ` · Machine: ${value.load_reference ?? 'unknown context'}` : ''
  return `${amount} (${loadLabels[value.load_convention].toLowerCase()})${reference}`
}

export function LoadEditor({ value, onChange, actual = false }: { value: SetLoad; onChange?: (value: SetLoad) => void; actual?: boolean }) {
  return <Stack gap="xs">
    <SimpleGrid cols={{ base: 1, sm: 2 }}>
      <Select label={actual ? 'Actual load convention' : 'Target load convention'} value={value.load_convention}
        data={Object.entries(loadLabels).map(([value, label]) => ({ value, label }))} allowDeselect={false} readOnly={!onChange}
        onChange={next => {
          const convention = Object.keys(loadLabels).find(key => key === next) as SetLoad['load_convention'] | undefined
          if (convention) onChange?.({ ...value, load_convention: convention,
            load_reference: convention === 'machine_display' ? value.load_reference : null,
            load_kg: convention === 'bodyweight' && value.load_kg !== 0 ? null : value.load_kg })
        }} />
      <NumberInput label={actual ? 'Actual load (kg)' : 'Load (kg)'} value={value.load_kg ?? ''}
        readOnly={!onChange || value.load_convention === 'bodyweight'} min={0} allowNegative={false} decimalScale={2} clampBehavior="strict"
        onChange={next => { if (typeof next === 'number' || next === '') onChange?.({ ...value, load_kg: next === '' ? null : next }) }} />
    </SimpleGrid>
    <Text size="sm">{descriptions[value.load_convention]}</Text>
    {value.load_convention === 'machine_display' && <TextInput label={actual ? 'Actual machine reference' : 'Target machine reference'}
      description={<Text span size="sm" c="dark.6">Optional stable machine/configuration ID. Leave blank when unknown.</Text>}
      maxLength={200} value={value.load_reference ?? ''} readOnly={!onChange}
      onChange={event => onChange?.({ ...value, load_reference: event.currentTarget.value.trim() || null })} />}
  </Stack>
}
