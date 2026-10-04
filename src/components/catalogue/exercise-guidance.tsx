import { useState } from 'react'
import { Alert, Button, Group, Image, List, Select, Stack, Text, Title } from '@mantine/core'
import type { CatalogueExercise } from '../training/model'

function Demonstration({ url, name, attribution }: { url: string; name: string; attribution: string }) {
  const [state, setState] = useState<'still' | 'playing' | 'failed'>('still')
  return <Stack gap="xs">
    {state === 'failed' ? <Alert title="Demonstration unavailable">You can still read the instructions and record your sets.</Alert>
      : state === 'playing' ? <Image src={url} alt={`${name} exercise demonstration`} w={180} h={180} fit="contain" onError={() => setState('failed')} />
        : <Text size="sm">Play the demonstration when you need it.</Text>}
    <Group><Button variant="default" onClick={() => setState(state === 'playing' ? 'still' : 'playing')}>
      {state === 'playing' ? 'Stop demonstration' : state === 'failed' ? 'Retry demonstration' : 'Play demonstration'}
    </Button></Group>
    <Text size="sm">{attribution}</Text>
  </Stack>
}

export function ExerciseGuidance({ exercise, coachNotes = '' }: { exercise: CatalogueExercise | null; coachNotes?: string }) {
  const [locale, setLocale] = useState('en')
  if (!exercise) return <Alert title="Exercise not linked">This movement has not been matched to the catalogue. Follow your coach’s instructions; no demonstration is assumed.</Alert>
  const instruction = exercise.instructions.find(item => item.locale === locale)
  const media = exercise.media.find(item => item.kind === 'animation' && item.asset_url)
  return <Stack gap="md">
    <div><Title order={4}>{exercise.name}</Title><Text size="sm">{exercise.equipment ?? 'Equipment unspecified'} · {exercise.target ?? 'Target unspecified'}</Text></div>
    {exercise.instructions.length > 1 && <Select label="Instruction language" data={exercise.instructions.map(item => item.locale)} value={locale} onChange={next => setLocale(next ?? 'en')} />}
    {media?.asset_url ? <Demonstration key={media.asset_url} url={media.asset_url} name={exercise.name} attribution={media.attribution} /> : <Text size="sm">No demonstration available for this exercise.</Text>}
    {instruction ? instruction.steps.length ? <List type="ordered" spacing="xs">{instruction.steps.map((step, index) => <List.Item key={index}>{step}</List.Item>)}</List> : <Text>{instruction.text}</Text>
      : <Text>No instructions available in {locale}.</Text>}
    {coachNotes && <div><Text fw={600}>Coach’s cue</Text><Text>{coachNotes}</Text></div>}
  </Stack>
}

export function ExercisePicker({ exercises, value, onChange, loading = false, error, onRetry }: {
  exercises: CatalogueExercise[]; value: string | null; onChange: (value: string | null) => void
  loading?: boolean; error?: string; onRetry?: () => void
}) {
  return <Stack gap="sm">
    <Select label="Library exercise" searchable clearable value={value} onChange={onChange} disabled={loading}
      description={<Text span size="sm" c="dark.6">Select the exact movement and equipment variant.</Text>}
      placeholder={loading ? 'Loading catalogue…' : 'Search exercises'} nothingFoundMessage="No matching exercises"
      data={exercises.map(e => ({ value: e.id, label: `${e.name} (${e.equipment ?? 'unspecified equipment'})` }))} />
    {error && <Alert title="Catalogue could not load" color="red"><Text>{error}</Text>{onRetry && <Button mt="sm" variant="default" onClick={onRetry}>Retry catalogue</Button>}</Alert>}
  </Stack>
}
