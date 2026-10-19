import { defineConfig } from 'vitest/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // Pinned to a non-UTC zone (UTC+14, the largest offset) so tests that
    // guard against local-time date bugs, such as the session id UTC
    // boundary test, still catch them on CI, which runs in UTC. Do not remove.
    env: { TZ: 'Pacific/Kiritimati' },
  },
  resolve: { alias: { '@': path.resolve(root, './src') } },
})
