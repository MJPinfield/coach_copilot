import { Alert, Badge, Group, List, Stack, Text, Title } from '@mantine/core'
import type { Json } from '../../backend/database.types'
import type { ExerciseAnalysis } from '../training/model'

const record = (value: Json | undefined): value is { [key: string]: Json | undefined } => !!value && typeof value === 'object' && !Array.isArray(value)
const taxonomy = (value: Json | undefined) => record(value) && ['id', 'slug', 'name'].every(key => typeof value[key] === 'string')

// JSONB snapshots are deliberately not resolved through today's catalogue. Validate
// the persisted migration-006 shape at this JSON boundary before rendering it.
function isAnalysis(value: Json): value is ExerciseAnalysis {
  if (!record(value) || !['id', 'exercise_id', 'source_reference', 'created_at'].every(key => typeof value[key] === 'string')
    || typeof value.revision !== 'number' || !Number.isInteger(value.revision) || value.revision < 1
    || !['imported', 'coach_reviewed'].includes(String(value.provenance))
    || !(value.reviewed_by === null || typeof value.reviewed_by === 'string')
    || !(value.family_id === null || typeof value.family_id === 'string')
    || !(value.family === null || taxonomy(value.family)) || !Array.isArray(value.mappings)) return false
  return value.mappings.every(m => record(m)
    && typeof m.id === 'string' && typeof m.revision_id === 'string'
    && ['primary', 'secondary', 'stabiliser'].includes(String(m.role))
    && ((typeof m.muscle_group_id === 'string' && m.muscle_id === null && taxonomy(m.muscle_group) && m.muscle === null)
      || (typeof m.muscle_id === 'string' && m.muscle_group_id === null && taxonomy(m.muscle) && m.muscle_group === null))
    && Array.isArray(m.groups) && m.groups.every(taxonomy))
}

export function ExerciseClassification({ value, title = 'Current catalogue classification' }: { value: Json; title?: string }) {
  return <Stack gap="sm" component="section" aria-label={title}>
    <Title order={5}>{title}</Title>
    {value === null ? <Text size="sm">Unclassified. Missing evidence does not mean no muscle involvement.</Text>
      : !isAnalysis(value) ? <Alert title="Classification unavailable">This snapshot cannot be read. It has not been replaced with current catalogue data.</Alert>
        : <>
          <Group><Badge variant="default">{value.provenance === 'imported' ? 'Imported · not coach-reviewed' : 'Coach-reviewed'}</Badge><Text size="sm">Revision {value.revision}</Text></Group>
          <Text size="sm">Source: {value.source_reference}</Text>
          <Text size="sm">Family: {value.family?.name ?? 'Unassigned'}. Family membership does not imply interchangeable exercises or shared strength records.</Text>
          {value.mappings.length ? <List spacing="xs">{value.mappings.map(mapping => <List.Item key={mapping.id}>
            {mapping.role} · {mapping.muscle_group ? `${mapping.muscle_group.name} (group-level evidence)` : `${mapping.muscle?.name} (specific muscle)`}
            {mapping.muscle && mapping.groups.length > 0 && <Text size="sm">Recorded group memberships: {mapping.groups.map(group => group.name).join(', ')}</Text>}
          </List.Item>)}</List> : <Text size="sm">No muscle mappings recorded in this revision.</Text>}
          <Text size="sm">Mappings may be partial. Group evidence does not establish involvement of each member muscle.</Text>
        </>}
  </Stack>
}
