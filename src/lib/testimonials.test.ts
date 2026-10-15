import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { getAllTestimonials, getTestimonialBySlug } from './testimonials'

const FIXTURES = path.join(process.cwd(), 'src/lib/__fixtures__/testimonials')

describe('testimonial linkedin field', () => {
  it('parses linkedin when the frontmatter carries it', async () => {
    const t = await getTestimonialBySlug('with-linkedin', 'fr', FIXTURES)
    expect(t?.metadata.linkedin).toBe('https://www.linkedin.com/in/someone/')
  })

  it('leaves linkedin undefined when the frontmatter omits it', async () => {
    // The dialog renders the icon behind a truthiness guard, so an author
    // with no profile URL must yield undefined rather than an empty string
    // or the literal "undefined" — either would render a dead link.
    const t = await getTestimonialBySlug('without-linkedin', 'fr', FIXTURES)
    expect(t?.metadata.linkedin).toBeUndefined()
  })

  it('preserves linkedin through the en fallback', async () => {
    // The lib falls back to English when the requested locale has no file.
    // This slug exists only in en/, so asking for fr exercises that path and
    // the profile URL must survive it.
    const t = await getTestimonialBySlug('en-only', 'fr', FIXTURES)
    expect(t?.metadata.linkedin).toBe('https://www.linkedin.com/in/en-only/')
  })
})

describe('published testimonials', () => {
  it('gives every author a well-formed linkedin profile URL', async () => {
    for (const locale of ['fr', 'en']) {
      const testimonials = await getAllTestimonials(locale)
      expect(testimonials.length).toBeGreaterThan(0)
      for (const t of testimonials) {
        expect(
          t.metadata.linkedin,
          `${locale}/${t.slug} has no linkedin`
        ).toMatch(/^https:\/\/www\.linkedin\.com\/in\/[^/]+\/$/)
      }
    }
  })

  it('agrees on each author between fr and en', async () => {
    // Author metadata is duplicated per locale, so the two copies can drift.
    const fr = await getAllTestimonials('fr')
    const en = await getAllTestimonials('en')
    expect(en.map((t) => t.slug).sort()).toEqual(fr.map((t) => t.slug).sort())
    for (const f of fr) {
      const e = en.find((t) => t.slug === f.slug)
      expect(e?.metadata.linkedin, `${f.slug} linkedin drifted`).toBe(f.metadata.linkedin)
      expect(e?.metadata.avatar, `${f.slug} avatar drifted`).toBe(f.metadata.avatar)
    }
  })

  it('points every avatar at a file that exists', async () => {
    const fs = await import('node:fs')
    for (const t of await getAllTestimonials('fr')) {
      const file = path.join(process.cwd(), 'public', t.metadata.avatar)
      expect(fs.existsSync(file), `${t.slug} avatar missing: ${t.metadata.avatar}`).toBe(true)
    }
  })
})
