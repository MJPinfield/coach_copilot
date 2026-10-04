import { queryOptions } from '@tanstack/react-query'
import { createBackendClient } from '../../backend/client'
import type { Json } from '../../backend/database.types'
import type { Row, SetTarget } from '../../components/training/model'

let instance: ReturnType<typeof createBackendClient> | undefined
export const backend = () => instance ??= createBackendClient()
export const configured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)

export type WorkoutExercise = Row<'workout_exercises'> & { logged_sets: Row<'logged_sets'>[] }
export type Workout = Row<'workouts'> & {
  workout_blocks: (Row<'workout_blocks'> & { workout_exercises: WorkoutExercise[] })[]
  workout_feedback: Row<'workout_feedback'> | null
}
export type Draft = { workout: Workout; revision: string; dirty: boolean; complete: boolean; selected: string | null; round?: number; notes: string }
const key = (user: string, id: string) => `coach-workout:v1:${user}:${id}`
export function readDraft(user: string, id: string): Draft | null {
  const value = localStorage.getItem(key(user, id))
  return value ? JSON.parse(value) as Draft : null
}
export function writeDraft(draft: Draft) {
  localStorage.setItem(key(draft.workout.client_id, draft.workout.id), JSON.stringify(draft))
}
export function localWorkouts(user: string): Draft[] {
  return Object.keys(localStorage).filter(k => k.startsWith(`coach-workout:v1:${user}:`))
    .map(k => JSON.parse(localStorage.getItem(k)!) as Draft)
}

export const profileOptions = (user: string) => queryOptions({
  queryKey: ['profile', user],
  queryFn: async () => {
    const { data, error } = await backend().from('profiles').select('*').eq('id', user).single()
    if (error) throw error
    return data
  },
})
export const programmesOptions = (user: string) => queryOptions({
  queryKey: ['programmes', user],
  queryFn: async () => {
    const { data, error } = await backend().from('programmes').select('*, programme_weeks(*, sessions(*, session_blocks(*, exercise_prescriptions(*, prescribed_sets(*)))))').eq('status', 'published').order('created_at', { ascending: false })
    if (error) throw error
    return data
  },
})
export const historyOptions = (user: string) => queryOptions({
  queryKey: ['workouts', user],
  queryFn: async () => {
    const { data, error } = await backend().from('workouts').select('*').eq('client_id', user).order('started_at', { ascending: false }).limit(30)
    if (error) {
      const local = localWorkouts(user)
      if (!navigator.onLine && local.length) return local.map(d => d.workout)
      throw error
    }
    return data
  },
  networkMode: 'always',
})
export const workoutOptions = (user: string, id: string) => queryOptions({
  queryKey: ['workout', user, id],
  networkMode: 'always',
  staleTime: 0,
  queryFn: async (): Promise<Draft> => {
    const local = readDraft(user, id)
    if (local?.dirty || (!navigator.onLine && local)) return local
    const { data, error } = await backend().from('workouts').select('*, workout_blocks(*, workout_exercises(*, logged_sets(*))), workout_feedback(*)').eq('client_id', user).eq('id', id).single()
    if (error) {
      if (local && !navigator.onLine) return local
      throw error
    }
    return { workout: data, revision: crypto.randomUUID(), dirty: false, complete: false, selected: local?.selected ?? null, round: local?.round, notes: data.workout_feedback?.notes ?? '' }
  },
})
export async function saveDraft(draft: Draft) {
  const { data: { session } } = await backend().auth.getSession()
  if (session?.user.id !== draft.workout.client_id) throw new Error('Sign in to the same account to sync this workout.')
  const exercises = draft.workout.workout_blocks.flatMap(b => b.workout_exercises).map(e => ({
    id: e.id,
    sets: e.logged_sets.map(s => ({ position: s.position, reps: s.reps, load_kg: s.load_kg, load_convention: s.load_convention,
      load_reference: s.load_reference, rir: s.rir, completed: s.completed })),
  }))
  const { data, error } = await backend().rpc('save_workout', {
    workout_id: draft.workout.id, exercises, complete: draft.complete, feedback: { notes: draft.notes },
  })
  if (error) throw error
  if (!draft.complete && data.status !== 'in_progress') throw new Error('This workout was closed on another device. Your local entries have been retained.')
  return data
}
export function object(value: Json | undefined): { [key: string]: Json | undefined } {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}
export function workoutName(workout: Row<'workouts'>) {
  const sources = Array.isArray(workout.original_snapshot) ? workout.original_snapshot : []
  return sources.map(s => object(s).name).filter(n => typeof n === 'string').join(' + ') || 'Your workout'
}
export function targets(exercise: WorkoutExercise): SetTarget[] {
  const values = object(exercise.applied_snapshot).targets
  if (!Array.isArray(values)) return []
  return values.map(value => {
    const row = object(value)
    const number = (name: string) => typeof row[name] === 'number' ? row[name] as number : null
    const convention = row.load_convention
    const load_convention = convention === 'total_external' || convention === 'per_dumbbell' || convention === 'added_bodyweight' || convention === 'assistance' || convention === 'machine_display' || convention === 'bodyweight' ? convention : 'unknown'
    return { id: String(row.id ?? `${exercise.id}-${row.position}`), position: number('position') ?? 1, load_kg: number('load_kg'),
      reps_min: number('reps_min'), reps_max: number('reps_max'), rir: number('rir'), rest_seconds: number('rest_seconds'),
      notes: typeof row.notes === 'string' ? row.notes : '', load_convention,
      load_reference: typeof row.load_reference === 'string' ? row.load_reference : null }
  })
}
