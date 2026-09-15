import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { getAllProjects, getProjectBySlug } from './projects'

const FIXTURE = path.join(process.cwd(), 'src/lib/__fixtures__/profile.json')
const MISSING_MARKDOWN_FIXTURE = path.join(process.cwd(), 'src/lib/__fixtures__/profile-missing-markdown.json')

describe('getAllProjects', () => {
  it('returns projects with the unchanged Project shape', async () => {
    const projects = await getAllProjects('fr', FIXTURE)
    expect(projects.length).toBeGreaterThan(0)
    const p = projects[0]
    expect(Object.keys(p).sort()).toEqual(['content', 'metadata', 'slug'])
    expect(p.metadata).toHaveProperty('title')
    expect(p.metadata).toHaveProperty('technologies')
    expect(p.metadata).toHaveProperty('challenge')
  })

  it('sorts by publishedAt descending', async () => {
    const dates = (await getAllProjects('fr', FIXTURE)).map((p) => p.metadata.publishedAt)
    expect([...dates].sort().reverse()).toEqual(dates)
  })

  it('loads the markdown body from content/projects', async () => {
    const projects = await getAllProjects('fr', FIXTURE)
    expect(projects[0].content.length).toBeGreaterThan(100)
    expect(projects[0].content).not.toContain('---\ntitle:')
  })

  it('publishes only whitelisted mission fields, never unknown ones', async () => {
    // The fixture deliberately carries an `internalRate` field that the real
    // artifact does not. toProject() names its output fields explicitly rather
    // than spreading the mission, so new artifact fields cannot reach a public
    // page by default. This test fails if that ever changes.
    const json = JSON.stringify(await getAllProjects('fr', FIXTURE))
    expect(json).not.toContain('internalRate')
    expect(json).not.toContain('999')
  })

  it('throws when a mission has no markdown body in any locale', async () => {
    // Metadata (profile-hub) and markdown bodies (this repo) are decoupled,
    // so a mission can exist in the artifact with no corresponding .md file.
    // That must fail the build loudly rather than publish a blank page.
    // The fixture's mission has caseStudy: true, so it still reaches
    // toProject() and exercises the throw — the guard must not be weakened
    // by the caseStudy filter.
    await expect(getAllProjects('fr', MISSING_MARKDOWN_FIXTURE)).rejects.toThrow(
      /no markdown body/,
    )
  })

  it('excludes platform-only missions (caseStudy: false)', async () => {
    // The fixture carries a 20th mission "platform-only-mission" with
    // caseStudy: false and no markdown file. If the filter did not exist
    // (or ran too late), this mission would either appear in the output or
    // throw the missing-markdown error. Neither should happen: it must be
    // silently absent.
    const projects = await getAllProjects('fr', FIXTURE)
    expect(projects.find((p) => p.slug === 'platform-only-mission')).toBeUndefined()
  })

  it('never leaks caseStudy onto the public ProjectMetadata shape', async () => {
    // toProject() builds ProjectMetadata by naming fields explicitly. This
    // test fails if caseStudy is ever spread through instead.
    const json = JSON.stringify(await getAllProjects('fr', FIXTURE))
    expect(json).not.toContain('caseStudy')
  })
})

describe('getProjectBySlug', () => {
  it('returns a single project', async () => {
    const all = await getAllProjects('fr', FIXTURE)
    const one = await getProjectBySlug(all[0].slug, 'fr', FIXTURE)
    expect(one!.metadata.title).toBe(all[0].metadata.title)
  })

  it('returns null for an unknown slug', async () => {
    expect(await getProjectBySlug('nope', 'fr', FIXTURE)).toBeNull()
  })

  it('returns null for a platform-only slug (caseStudy: false) rather than throwing', async () => {
    // "platform-only-mission" has no markdown body. If getProjectBySlug did
    // not filter on caseStudy, this would throw the missing-markdown error
    // instead of behaving like an unknown slug.
    expect(await getProjectBySlug('platform-only-mission', 'fr', FIXTURE)).toBeNull()
  })
})
