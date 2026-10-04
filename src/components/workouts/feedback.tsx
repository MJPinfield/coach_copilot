import { Button, Group, NumberInput, Radio, Select, Stack, Textarea } from '@mantine/core'
import { useForm } from '@mantine/form'
import type { Row } from '../training/model'

export type Feedback = Omit<Row<'workout_feedback'>, 'workout_id'>
export function FeedbackForm({ initialValue, onSubmit, pending = false }: { initialValue: Feedback; onSubmit: (value: Feedback) => void; pending?: boolean }) {
  const form = useForm({ initialValues: {
    ...initialValue, sleep_hours: initialValue.sleep_hours ?? '' as string | number,
    pain_severity: initialValue.pain_severity ?? '' as string | number,
    pain: initialValue.pain_reported === null ? 'unknown' : initialValue.pain_reported ? 'yes' : 'no',
  }, validate: {
    sleep_hours: v => v === '' || (Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= 24) ? null : 'Use 0–24 hours',
    pain_severity: (v, values) => values.pain !== 'yes' || v === '' || (Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 10) ? null : 'Use a whole number from 0–10',
  } })
  return <form onSubmit={form.onSubmit(values => onSubmit({
    energy: values.energy, sleep_hours: values.sleep_hours === '' ? null : Number(values.sleep_hours),
    pain_reported: values.pain === 'unknown' ? null : values.pain === 'yes',
    pain_location: values.pain === 'yes' ? values.pain_location : null,
    pain_severity: values.pain === 'yes' && values.pain_severity !== '' ? Number(values.pain_severity) : null, notes: values.notes,
  }))}>
    <Stack>
      <Select label="Energy" clearable placeholder="Not reported" data={['low', 'normal', 'high']} disabled={pending} {...form.getInputProps('energy')} />
      <NumberInput label="Sleep (hours)" min={0} max={24} decimalScale={1} allowNegative={false} disabled={pending} {...form.getInputProps('sleep_hours')} />
      <Radio.Group label="Any pain during the workout?" {...form.getInputProps('pain')}><Group mt="xs">
        <Radio value="unknown" label="Not reported" disabled={pending} /><Radio value="no" label="No" disabled={pending} /><Radio value="yes" label="Yes" disabled={pending} />
      </Group></Radio.Group>
      {form.values.pain === 'yes' && <>
        <Textarea label="Pain location" value={form.values.pain_location ?? ''} onChange={e => form.setFieldValue('pain_location', e.currentTarget.value)} disabled={pending} />
        <NumberInput label="Pain severity (0–10)" min={0} max={10} allowDecimal={false} allowNegative={false} disabled={pending} {...form.getInputProps('pain_severity')} />
      </>}
      <Textarea label="Workout notes" autosize minRows={3} disabled={pending} {...form.getInputProps('notes')} />
      <Group><Button color="blue.8" type="submit" loading={pending}>Save feedback</Button></Group>
    </Stack>
  </form>
}
