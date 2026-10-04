import { MantineProvider, Container } from '@mantine/core'
import type { Preview } from '@storybook/react-vite'
import '@mantine/core/styles.css'

const preview: Preview = {
  decorators: [Story => <MantineProvider><Container size="xl" py="md"><Story /></Container></MantineProvider>],
  parameters: { layout: 'fullscreen', a11y: { test: 'error' } },
}
export default preview
