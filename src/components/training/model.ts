import type { Database } from '../../backend/database.types'

export type Row<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type SetTarget = Pick<Row<'prescribed_sets'>, 'id' | 'position' | 'load_kg' | 'reps_min' | 'reps_max' | 'rir' | 'rest_seconds' | 'notes'>
export type SetActual = Pick<Row<'logged_sets'>, 'id' | 'position' | 'load_kg' | 'reps' | 'rir' | 'completed'>
export type CatalogueExercise = Pick<Row<'exercises'>, 'id' | 'name' | 'equipment' | 'target'> & {
  instructions: Pick<Row<'exercise_instructions'>, 'locale' | 'text' | 'steps'>[]
  media: Pick<Row<'exercise_media'>, 'id' | 'kind' | 'asset_url' | 'attribution'>[]
}
export type ExerciseItem = Pick<Row<'exercise_prescriptions'>, 'id' | 'display_name' | 'exercise_id' | 'coach_notes' | 'position'> & {
  exercise: CatalogueExercise | null
  targets: SetTarget[]
  actuals: SetActual[]
  performed_name?: string
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
export interface SourceReference { session_id: string; name: string; programmeName: string; programme_revision: number }
