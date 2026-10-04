import { Badge, Button, Group, Stack, Text, Textarea, Title } from '@mantine/core'
import type { Row } from '../training/model'

export function TrainingConversation({ title, messages, draft, onDraftChange, onSend, pending = false, error }: {
  title: string; messages: Pick<Row<'messages'>, 'id' | 'role' | 'content'>[]; onSend: (message: string) => void
  draft: string; onDraftChange: (value: string) => void
  pending?: boolean; error?: string
}) {
  return <Stack gap="md">
    <Group justify="space-between"><Title order={3}>{title}</Title><Badge variant="default">Private conversation</Badge></Group>
    <Text size="sm">Your coach sees applied workout changes, not this transcript.</Text>
    <Stack component="section" aria-label="Conversation messages">
      {messages.length ? messages.map(message => <div key={message.id}><Text fw={600}>{message.role === 'user' ? 'You' : 'Assistant'}</Text><Text style={{ whiteSpace: 'pre-wrap' }}>{message.content}</Text></div>)
        : <Text>No messages yet. Ask about your programme or recorded training.</Text>}
    </Stack>
    <form onSubmit={event => { event.preventDefault(); if (draft.trim() && !pending) onSend(draft.trim()) }}>
      <Stack gap="sm"><Textarea label="Message" autosize minRows={3} maxLength={20000} disabled={pending} value={draft} onChange={event => onDraftChange(event.currentTarget.value)} />
        {error && <Text role="alert">{error} Your message is still here.</Text>}
        <Group><Button color="blue.8" type="submit" loading={pending} disabled={!draft.trim()}>Send message</Button></Group>
      </Stack>
    </form>
  </Stack>
}
