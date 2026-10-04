import type { Meta, StoryObj } from '@storybook/react-vite'
import { ComponentGallery } from './gallery'
import { AccountExamples, AnalysisExamples, BlockExample, CatalogueExamples, ClassificationHistoryExample, ConversationExample, ItemExample, ProgrammeExample, ProposalExample, SessionExample, SetExamples, StateExamples, WorkoutExamples } from './examples'

const meta = { title: 'Domain/Compositions', parameters: { layout: 'fullscreen' } } satisfies Meta
export default meta
type Story = StoryObj<typeof meta>
export const AllComponents: Story = { render: () => <ComponentGallery /> }
export const Accounts: Story = { render: () => <AccountExamples /> }
export const Catalogue: Story = { render: () => <CatalogueExamples /> }
export const AnatomyFamiliesAndReview: Story = { render: () => <AnalysisExamples /> }
export const ClassificationHistory: Story = { render: () => <ClassificationHistoryExample /> }
export const PrescribedAndLoggedSets: Story = { render: () => <SetExamples /> }
export const Exercise: Story = { render: () => <ItemExample /> }
export const UnlinkedExercise: Story = { render: () => <ItemExample unlinked /> }
export const SupersetClient: Story = { render: () => <BlockExample /> }
export const SupersetCoach: Story = { render: () => <BlockExample initialMode="prescribe" /> }
export const SupersetReview: Story = { render: () => <BlockExample initialMode="review" /> }
export const StandaloneExercise: Story = { render: () => <BlockExample kind="single" /> }
export const MixedSession: Story = { render: () => <SessionExample /> }
export const ProgrammeWeeksAndSessions: Story = { render: () => <ProgrammeExample /> }
export const WorkoutAndFeedback: Story = { render: () => <WorkoutExamples /> }
export const PrivateConversation: Story = { render: () => <ConversationExample /> }
export const ProposedAdaptation: Story = { render: () => <ProposalExample /> }
export const AppliedAdaptation: Story = { render: () => <ProposalExample initialStatus="applied" /> }
export const StaleAdaptation: Story = { render: () => <ProposalExample initialStatus="stale" /> }
export const RecoveryAndOfflineStates: Story = { render: () => <StateExamples /> }
