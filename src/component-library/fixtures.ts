import type { CatalogueExercise, ExerciseItem, Programme, Session, SetTarget, SourceReference, TrainingBlock } from '../components/training/model'
import type { Feedback } from '../components/workouts/feedback'

// Fictional training records. Movement metadata/instructions/media references are
// from the pinned MIT exercises-dataset; Gym Visual licence confirmed by Max.
// https://github.com/hasaneyldrm/exercises-dataset/tree/7455efae41b330c265e7cd4b78dfa848e7ce5ebd
const mediaBase = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/7455efae41b330c265e7cd4b78dfa848e7ce5ebd/'
export const bench: CatalogueExercise = {
  id: 'catalogue-0025', name: 'Barbell bench press', equipment: 'barbell', target: 'pectorals',
  instructions: [{ locale: 'en', text: '', steps: [
    'Lie flat on a bench with your feet flat on the ground and your back pressed against the bench.',
    'Grasp the barbell with an overhand grip slightly wider than shoulder-width apart.',
    'Lift the barbell off the rack and hold it directly above your chest with your arms fully extended.',
    'Lower the barbell slowly towards your chest, keeping your elbows tucked in.',
    'Pause for a moment when the barbell touches your chest.',
    'Push the barbell back up to the starting position by extending your arms.',
    'Repeat for the desired number of repetitions.',
  ] }],
  media: [{ id: 'media-0025', kind: 'animation', asset_url: `${mediaBase}videos/0025-EIeI8Vf.gif`, attribution: '© Gym visual — https://gymvisual.com/' }],
}
export const row: CatalogueExercise = {
  id: 'catalogue-0027', name: 'Barbell bent over row', equipment: 'barbell', target: 'upper back',
  instructions: [{ locale: 'en', text: '', steps: [
    'Stand with your feet shoulder-width apart and knees slightly bent.',
    'Bend forward at the hips while keeping your back straight and chest up.',
    'Grasp the barbell with an overhand grip, hands slightly wider than shoulder-width apart.',
    'Pull the barbell towards your lower chest by retracting your shoulder blades and squeezing your back muscles.',
    'Pause for a moment at the top, then slowly lower the barbell back to the starting position.',
    'Repeat for the desired number of repetitions.',
  ] }],
  media: [{ id: 'media-0027', kind: 'animation', asset_url: `${mediaBase}videos/0027-eZyBC3j.gif`, attribution: '© Gym visual — https://gymvisual.com/' }],
}
export const target: SetTarget = { id: 'target-1', position: 1, load_kg: 60, reps_min: 6, reps_max: 8, rir: 2, rest_seconds: 90, notes: '' }
export function exerciseItem(exercise: CatalogueExercise, position: number): ExerciseItem {
  return { id: `prescription-${exercise.id}`, position, exercise_id: exercise.id, display_name: exercise.name, exercise,
    coach_notes: position === 1 ? 'Pause briefly at the bottom.' : 'Keep your torso still.',
    targets: [1, 2].map(round => ({ ...target, id: `${exercise.id}-target-${round}`, position: round, load_kg: position === 1 ? 60 : 40 })),
    actuals: [1, 2].map(round => ({ id: `${exercise.id}-actual-${round}`, position: round, load_kg: null, reps: null, rir: null, completed: false })),
  }
}
export const pair: TrainingBlock = { id: 'block-a', position: 1, kind: 'superset', label: 'A', rest_after_round_seconds: 90,
  exercises: [exerciseItem(bench, 1), exerciseItem(row, 2)] }
export const single: TrainingBlock = { id: 'block-b', position: 2, kind: 'single', label: 'B', rest_after_round_seconds: null,
  exercises: [{ ...exerciseItem(bench, 3), id: 'single-press', coach_notes: 'A standalone exercise example.' }] }
export const session: Session = { id: 'session-upper', name: 'Upper body', notes: 'Complete both exercises in each superset round before resting.', blocks: [pair, single] }
export const programme: Programme = { id: 'programme-1', name: 'Strength foundations', clientName: 'Alex Morgan', goal: 'Build a consistent training routine.', status: 'draft',
  weeks: [{ id: 'week-1', name: 'Week 1', sessions: [session] }, { id: 'week-2', name: 'Week 2', sessions: [] }] }
export const sources: SourceReference[] = [{ session_id: session.id, name: session.name, programmeName: programme.name, programme_revision: 4 }]
export const feedback: Feedback = { energy: null, sleep_hours: null, pain_reported: null, pain_location: null, pain_severity: null, notes: '' }
export const original: Session = { ...session, blocks: [pair] }
export const proposed: Session = { ...session, blocks: [{ ...pair, rest_after_round_seconds: 120,
  exercises: pair.exercises.map(e => ({ ...e, targets: e.targets.map(t => ({ ...t, load_kg: t.load_kg === null ? null : t.load_kg - 10 })) })) }] }
