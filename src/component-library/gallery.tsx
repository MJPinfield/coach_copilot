import { Anchor, Container, Divider, Group, Stack, Text, Title } from '@mantine/core'
import type { ReactNode } from 'react'
import { AccountExamples, BlockExample, CatalogueExamples, ConversationExample, ItemExample, ProgrammeExample, ProposalExample, SessionExample, SetExamples, StateExamples, WorkoutExamples } from './examples'

const sections: { id: string; title: string; content: ReactNode }[] = [
  { id: 'accounts', title: 'Accounts and coaching', content: <AccountExamples /> },
  { id: 'catalogue', title: 'Exercise catalogue and guidance', content: <CatalogueExamples /> },
  { id: 'sets', title: 'Sets: prescription and performance', content: <SetExamples /> },
  { id: 'exercise', title: 'Exercise item', content: <ItemExample /> },
  { id: 'superset', title: 'Superset: coach, client and review', content: <BlockExample /> },
  { id: 'session', title: 'Session: supersets and standalone work', content: <SessionExample /> },
  { id: 'programme', title: 'Programme: weeks and sessions', content: <ProgrammeExample /> },
  { id: 'workouts', title: 'Workout history and feedback', content: <WorkoutExamples /> },
  { id: 'conversation', title: 'Private training conversation', content: <ConversationExample /> },
  { id: 'adaptation', title: 'Adaptation: original and proposed', content: <ProposalExample /> },
  { id: 'states', title: 'Loading, recovery and sync states', content: <StateExamples /> },
]

export function ComponentGallery() {
  return <Container size="xl" py="xl" component="main">
    <Stack gap="xl">
      <header><Title order={1}>Coach Copilot component library</Title><Text mt="sm">Default Mantine · reusable domain components · fictional training data</Text>
        <Text size="sm" mt="xs">Interactive examples run in memory. No account, workout or chat changes are saved. Refresh resets the examples.</Text>
      </header>
      <Group component="nav" aria-label="Component sections" gap="md">{sections.map(section => <Anchor c="blue.8" key={section.id} href={`#${section.id}`}>{section.title.split(':')[0]}</Anchor>)}</Group>
      {sections.map(section => <Stack component="section" aria-labelledby={`${section.id}-title`} id={section.id} key={section.id} gap="lg">
        <Divider /><Title order={2} id={`${section.id}-title`}>{section.title}</Title>{section.content}
        <Anchor c="blue.8" href="#top" size="sm">Back to top</Anchor>
      </Stack>)}
    </Stack>
  </Container>
}
