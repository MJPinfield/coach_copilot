export interface Programme {
  id: string
  title: string
  client: string
  focus: string
  coachNotes: string
  sessions: {
    id: string
    title: string
    exercises: { name: string; prescription: string }[]
  }[]
}

export type ProgrammeEdit = Pick<Programme, 'title' | 'coachNotes'>
