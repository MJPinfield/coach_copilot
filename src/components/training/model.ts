import type { Database } from '../../backend/database.types'

export type Row<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type SetLoad = Pick<Row<'logged_sets'>, 'load_kg' | 'load_convention' | 'load_reference'>
export type SetTarget = Pick<Row<'prescribed_sets'>, 'id' | 'position' | 'load_kg' | 'load_convention' | 'load_reference' | 'reps_min' | 'reps_max' | 'rir' | 'rest_seconds' | 'notes'>
export type SetActual = Pick<Row<'logged_sets'>, 'id' | 'position' | 'load_kg' | 'load_convention' | 'load_reference' | 'reps' | 'rir' | 'completed'>
// Nested shape emitted by migration 006's exercise_analysis_snapshot function.
export type ExerciseAnalysis = Row<'exercise_analysis_revisions'> & {
  family: Row<'exercise_families'> | null
  mappings: (Row<'exercise_muscle_mappings'> & {
    muscle_group: Row<'muscle_groups'> | null
    muscle: Row<'muscles'> | null
    groups: Row<'muscle_groups'>[]
  })[]
}
export type CatalogueExercise = Pick<Row<'exercises'>, 'id' | 'name' | 'equipment' | 'target'> & {
  instructions: Pick<Row<'exercise_instructions'>, 'locale' | 'text' | 'steps'>[]
  media: Pick<Row<'exercise_media'>, 'id' | 'kind' | 'asset_url' | 'attribution'>[]
  analysis: ExerciseAnalysis | null
}
export type ExerciseItem = Pick<Row<'exercise_prescriptions'>, 'id' | 'display_name' | 'exercise_id' | 'coach_notes' | 'position'> & {
  exercise: CatalogueExercise | null
  targets: SetTarget[]
  actuals: SetActual[]
  performed_name?: string
  original_analysis_snapshot: Row<'workout_exercises'>['actual_analysis_snapshot']
  applied_analysis_snapshot: Row<'proposed_exercises'>['analysis_snapshot']
  actual_analysis_snapshot: Row<'workout_exercises'>['actual_analysis_snapshot']
}
export type TrainingBlock = Pick<Row<'session_blocks'>, 'id' | 'position' | 'label' | 'rest_after_round_seconds'> & {
  kind: 'single' | 'superset'
  exercises: ExerciseItem[]
}
export type Session = Pick<Row<'sessions'>, 'id' | 'name' | 'notes'> & { blocks: TrainingBlock[] }
export type Programme = Pick<Row<'programmes'>, 'id' | 'name' | 'goal' | 'status'> & {
  clientName: string
  weeks: { id: string; name: string; sessions: Session[] }[]
}
export type TrainingMode = 'prescribe' | 'log' | 'review'
export type AnalysisContext = 'current' | 'original' | 'proposed' | 'applied' | 'actual'
export interface SourceReference { session_id: string; name: string; programmeName: string; programme_revision: number }
