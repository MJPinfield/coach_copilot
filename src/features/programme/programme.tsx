import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { programmeQuery, saveProgramme } from './api'
import type { Programme } from './model'

export function ProgrammePage({ mode }: { mode: 'coach' | 'client' }) {
  const query = useQuery(programmeQuery)
  if (query.isPending) return <section className="state" role="status"><span className="eyebrow">Getting things ready</span><h1>Loading programme…</h1></section>
  if (query.isError) return <section className="state"><h1>We couldn’t load your programme</h1><p role="alert">{query.error.message}</p><button onClick={() => void query.refetch()} disabled={query.isFetching}>{query.isFetching ? 'Retrying…' : 'Try again'}</button></section>
  if (!query.data) return <section className="state"><span className="eyebrow">A fresh start</span><h1>No programme yet</h1><p>{mode === 'coach' ? 'Your client’s training plan will live here.' : 'Your coach hasn’t shared a programme yet.'}</p><p>Choose “Populated” in Design scenario to explore a sample plan.</p></section>
  const programme = query.data
  return <>
    <section className="page-heading">
      <div><p className="eyebrow">{mode === 'coach' ? 'Your coaching workspace' : 'Your training space'}</p><h1>{mode === 'coach' ? 'A clear plan. A stronger client.' : 'One session at a time.'}</h1><p>{mode === 'coach' ? 'Shape the plan, share the intention, and keep moving forward.' : 'Your programme, with your coach’s guidance right alongside it.'}</p></div>
      <div className="client-badge"><span className="avatar" aria-hidden="true">AM</span><div><small>{mode === 'coach' ? 'Planning for' : 'Training as'}</small><strong>{programme.client}</strong></div></div>
    </section>
    <div className="workspace-grid">
      <section className="plan-card">
        <div className="plan-intro"><span className="eyebrow">The programme · Sample week</span><h2>{programme.title}</h2><p>{programme.focus}</p><span className="pill">{programme.sessions.length} sessions · Strength</span></div>
        <div className="session-list">{programme.sessions.map((session, index) => <article className="session" key={session.id}>
          <div className="session-heading"><span className="session-number">0{index + 1}</span><div><span className="eyebrow">Session {index + 1}</span><h3>{session.title}</h3></div></div>
          <ul>{session.exercises.map((exercise) => <li key={exercise.name}><strong>{exercise.name}</strong><span>{exercise.prescription}</span></li>)}</ul>
        </article>)}</div>
      </section>
      <aside>{mode === 'coach' ? <ProgrammeEditor key={programme.id} programme={programme} /> : <section className="notes-card"><span className="eyebrow">In your corner</span><h2>A note from your coach</h2><p className="coach-notes">{programme.coachNotes || 'No coaching notes yet.'}</p></section>}
        <section className="workspace-note"><span className="eyebrow">A work in progress</span><p>This is a space to explore the coaching experience. Training logs and account access come after we agree the next product slice.</p></section>
      </aside>
    </div>
  </>
}

function ProgrammeEditor({ programme }: { programme: Programme }) {
  const [title, setTitle] = useState(programme.title)
  const [coachNotes, setCoachNotes] = useState(programme.coachNotes)
  const queryClient = useQueryClient()
  const save = useMutation({
    mutationFn: saveProgramme,
    onSuccess: (updated) => {
      queryClient.setQueryData(programmeQuery.queryKey, updated)
      setTitle(updated.title)
      setCoachNotes(updated.coachNotes)
    },
  })
  const dirty = title !== programme.title || coachNotes !== programme.coachNotes
  return <section className="notes-card"><span className="eyebrow">Make it personal</span><h2>Coach’s desk</h2><p>A little context makes a better session.</p>
    <form onSubmit={(event) => { event.preventDefault(); save.mutate({ title, coachNotes }) }}>
      <label htmlFor="title">Programme name</label>
      <input id="title" value={title} required maxLength={100} disabled={save.isPending} onChange={(event) => { setTitle(event.target.value); save.reset() }} />
      <label htmlFor="notes">Coaching notes</label>
      <textarea id="notes" value={coachNotes} rows={5} maxLength={2000} disabled={save.isPending} onChange={(event) => { setCoachNotes(event.target.value); save.reset() }} />
      <p className="field-hint">Visible in the client view after saving.</p>
      {save.isError && <p role="alert">{save.error.message} Your edits are still here.</p>}
      <button type="submit" disabled={save.isPending || !title.trim() || !dirty}>{save.isPending ? 'Saving…' : 'Save programme'}</button>
      <p className="save-status" role="status">{save.isSuccess && !dirty ? 'Programme saved.' : dirty ? 'Unsaved changes' : 'You’re up to date.'}</p>
    </form>
  </section>
}
