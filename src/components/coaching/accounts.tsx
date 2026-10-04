import { Alert, Avatar, Badge, Button, Group, PasswordInput, Stack, Text, TextInput } from '@mantine/core'
import { hasLength, isEmail, useForm } from '@mantine/form'
import type { Row } from '../training/model'

export function ProfileSummary({ profile }: { profile: Pick<Row<'profiles'>, 'display_name' | 'role'> }) {
  return <Group wrap="nowrap"><Avatar name={profile.display_name} color="initials" /><div><Text fw={600}>{profile.display_name || 'Unnamed profile'}</Text><Text size="sm">{profile.role === 'coach' ? 'Coach' : 'Client'}</Text></div></Group>
}

export function RelationshipSummary({ name, status, role, pending = false, onAccept, onResend, onDeactivate }: {
  name: string; status: 'invited' | 'active' | 'inactive'; role: 'coach' | 'client'; pending?: boolean
  onAccept?: () => void; onResend?: () => void; onDeactivate?: () => void
}) {
  return <Stack gap="sm">
    <Group justify="space-between"><ProfileSummary profile={{ display_name: name, role: role === 'coach' ? 'client' : 'coach' }} /><Badge variant="default">{status}</Badge></Group>
    <Text size="sm">{status === 'invited' ? 'Account setup and invitation acceptance are separate steps.' : status === 'active' ? 'Published programmes are available to this client.' : 'Coaching ended. The client retains their own workout history.'}</Text>
    <Group>
      {role === 'client' && status === 'invited' && onAccept && <Button color="blue.8" loading={pending} onClick={onAccept}>Accept invitation</Button>}
      {role === 'coach' && status === 'invited' && onResend && <Button loading={pending} variant="default" onClick={onResend}>Resend invitation</Button>}
      {role === 'coach' && status !== 'inactive' && onDeactivate && <Button disabled={pending} variant="default" onClick={onDeactivate}>End coaching</Button>}
    </Group>
  </Stack>
}

export function AccountForm({ mode, onSubmit, pending = false, error }: {
  mode: 'sign-in' | 'invite' | 'recover'; onSubmit: (values: { name: string; email: string; password: string }) => void
  pending?: boolean; error?: string
}) {
  const form = useForm({
    initialValues: { name: '', email: '', password: '' },
    validate: { email: isEmail('Enter a valid email address'),
      name: value => mode === 'invite' ? hasLength({ min: 1, max: 200 }, 'Enter a name (up to 200 characters)')(value.trim()) : null,
      password: value => mode === 'sign-in' && !value ? 'Enter your password' : null },
  })
  const label = mode === 'invite' ? 'Invite client' : mode === 'recover' ? 'Send recovery link' : 'Sign in'
  return <form onSubmit={form.onSubmit(values => onSubmit({ ...values, name: values.name.trim(), email: values.email.trim() }))}>
    <Stack>
      {mode === 'invite' && <TextInput label="Client name" autoComplete="name" required disabled={pending} {...form.getInputProps('name')} />}
      <TextInput label="Email" type="email" autoComplete="email" required disabled={pending} {...form.getInputProps('email')} />
      {mode === 'sign-in' && <PasswordInput label="Password" autoComplete="current-password" required disabled={pending} {...form.getInputProps('password')} />}
      {error && <Alert color="red" title="Request could not complete">{error} Your entries are still here.</Alert>}
      <Group><Button color="blue.8" type="submit" loading={pending}>{label}</Button></Group>
    </Stack>
  </form>
}
