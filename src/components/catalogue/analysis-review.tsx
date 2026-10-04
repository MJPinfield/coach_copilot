import { Alert, Button, Group, Select, Stack, Text, Textarea } from '@mantine/core'
import { useForm } from '@mantine/form'
import type { Database } from '../../backend/database.types'
import type { ExerciseAnalysis, Row } from '../training/model'

type ReviewCommand = Database['public']['Functions']['revise_exercise_analysis']['Args']

// Mount only for an owning coach's custom exercise. The RPC remains authoritative
// for permissions; shared taxonomy is selected here, never edited in the browser.
export function AnalysisReviewForm({ exerciseId, initialValue, groups, muscles, families, onSubmit, pending = false, error }: {
  exerciseId: string; initialValue: ExerciseAnalysis | null
  groups: Row<'muscle_groups'>[]; muscles: Row<'muscles'>[]; families: Row<'exercise_families'>[]
  onSubmit: (command: ReviewCommand) => void; pending?: boolean; error?: string
}) {
  const form = useForm({ initialValues: {
    family: initialValue?.family_id ?? null as string | null,
    source: '',
    mappings: initialValue?.mappings.map(m => ({ target: m.muscle_id ? `muscle:${m.muscle_id}` : `group:${m.muscle_group_id}`, role: m.role })) ?? [],
  }, validate: {
    source: value => value.trim().length > 0 && value.trim().length <= 1000 ? null : 'Describe the review source (1–1000 characters)',
    mappings: {
      target: (value, values) => !value ? 'Choose a muscle or group' : values.mappings.filter(m => m.target === value).length > 1 ? 'Each target can appear only once' : null,
    },
  } })
  return <form onSubmit={form.onSubmit(values => onSubmit({
    exercise_id: exerciseId, provenance: 'coach_reviewed', family_id: values.family ?? undefined,
    source_reference: values.source.trim(), mappings: values.mappings.map(m => ({
      muscle_id: m.target.startsWith('muscle:') ? m.target.slice(7) : null,
      muscle_group_id: m.target.startsWith('group:') ? m.target.slice(6) : null,
      role: m.role,
    })),
  }))}>
    <Stack>
      <Text size="sm">Review your own custom exercise. Saving appends a revision and replaces the whole classification; prior workout snapshots remain unchanged.</Text>
      <Select label="Exercise family" clearable value={form.values.family} disabled={pending}
        data={families.map(f => ({ value: f.id, label: f.name }))} onChange={value => form.setFieldValue('family', value)} />
      {form.values.mappings.map((mapping, index) => <Group key={index} align="start" grow>
        <Select label={`Mapping ${index + 1} target`} searchable disabled={pending} allowDeselect={false}
          data={[{ group: 'Muscle groups', items: groups.map(g => ({ value: `group:${g.id}`, label: `${g.name} (group)` })) },
            { group: 'Specific muscles', items: muscles.map(m => ({ value: `muscle:${m.id}`, label: `${m.name} (muscle)` })) }]}
          {...form.getInputProps(`mappings.${index}.target`)} />
        <Select label={`Mapping ${index + 1} role`} allowDeselect={false} disabled={pending}
          data={['primary', 'secondary', 'stabiliser']} value={mapping.role}
          onChange={value => { if (value) form.setFieldValue(`mappings.${index}.role`, value) }} />
        <Button variant="default" disabled={pending} onClick={() => form.removeListItem('mappings', index)}>Remove mapping {index + 1}</Button>
      </Group>)}
      <Group><Button variant="default" disabled={pending} onClick={() => form.insertListItem('mappings', { target: '', role: 'primary' })}>Add muscle mapping</Button></Group>
      {form.values.mappings.length === 0 && <Text size="sm">This revision will have no muscle mappings. A blank family also clears family membership.</Text>}
      <Textarea label="Review source" maxLength={1000} disabled={pending} {...form.getInputProps('source')} />
      {error && <Alert color="red" title="Review could not save">{error} Your draft is retained.</Alert>}
      <Group><Button type="submit" color="blue.8" loading={pending}>Save classification revision</Button></Group>
    </Stack>
  </form>
}
