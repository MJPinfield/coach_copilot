import { Accordion, Badge, Group, Stack, Text, Textarea, Title } from '@mantine/core'
import { ExerciseGuidance } from '../catalogue/exercise-guidance'
import { LoggedSetEditor, LoggedSetSummary, PrescribedSetEditor } from './sets'
import type { AnalysisContext, ExerciseItem, TrainingMode } from './model'
import { ExerciseClassification } from '../catalogue/analysis'

export function WorkoutItem({ value, mode, onChange, superset = false, marker, analysisContext = mode === 'prescribe' ? 'current' : 'actual' }: {
  value: ExerciseItem; mode: TrainingMode; onChange?: (value: ExerciseItem) => void; superset?: boolean; marker?: string
  analysisContext?: AnalysisContext
}) {
  return <Stack gap="md" component="article" aria-label={`${marker ? `${marker} ` : ''}${value.display_name}`}>
    <Group justify="space-between" align="start">
      <div><Title order={4}>{marker && `${marker} · `}{value.display_name}</Title>
        {value.performed_name && value.performed_name !== value.display_name && <Text size="sm">Performed instead: {value.performed_name}</Text>}
      </div>
      {!value.exercise && <Badge variant="default">Unlinked exercise</Badge>}
    </Group>
    {mode === 'prescribe' ? <Textarea label="Coach’s cue" value={value.coach_notes} readOnly={!onChange} autosize minRows={2}
      onChange={event => onChange?.({ ...value, coach_notes: event.currentTarget.value })} />
      : value.coach_notes && <Text size="sm">Coach’s cue: {value.coach_notes}</Text>}
    <Accordion variant="default">
      <Accordion.Item value="guidance"><Accordion.Control>Exercise guidance</Accordion.Control><Accordion.Panel>
        <ExerciseGuidance exercise={value.exercise} coachNotes={value.coach_notes} showClassification={analysisContext === 'current'} />
      </Accordion.Panel></Accordion.Item>
      {analysisContext !== 'current' && <Accordion.Item value="classification"><Accordion.Control>Recorded exercise classification</Accordion.Control><Accordion.Panel>
        {mode === 'review' ? <Stack>
          <ExerciseClassification title="Original classification" value={value.original_analysis_snapshot} />
          <ExerciseClassification title="Applied classification" value={value.applied_analysis_snapshot} />
          <ExerciseClassification title="Actual classification" value={value.actual_analysis_snapshot} />
        </Stack> : <ExerciseClassification title={`${analysisContext[0].toUpperCase()}${analysisContext.slice(1)} classification`} value={value[`${analysisContext === 'proposed' ? 'applied' : analysisContext}_analysis_snapshot`]} />}
      </Accordion.Panel></Accordion.Item>}
    </Accordion>
    {mode === 'prescribe' ? value.targets.map(target => <PrescribedSetEditor key={target.id} value={target} showRest={!superset}
      onChange={onChange ? next => onChange({ ...value, targets: value.targets.map(item => item.id === next.id ? next : item) }) : undefined} />)
      : value.actuals.map(actual => mode === 'review'
        ? <LoggedSetSummary key={actual.id} value={actual} target={value.targets.find(t => t.position === actual.position)} />
        : <LoggedSetEditor key={actual.id} value={actual} target={value.targets.find(t => t.position === actual.position)}
          onChange={onChange ? next => onChange({ ...value, actuals: value.actuals.map(item => item.id === next.id ? next : item) }) : undefined} />)}
    {(mode === 'prescribe' ? value.targets.length === 0 : value.actuals.length === 0) && <Text>No {mode === 'prescribe' ? 'sets prescribed' : 'sets recorded'}.</Text>}
  </Stack>
}
