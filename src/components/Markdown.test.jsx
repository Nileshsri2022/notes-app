import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Markdown from './Markdown.jsx'

describe('Markdown', () => {
  it('renders an h1 for # lines', () => {
    render(<Markdown text="# Title" />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Title')
  })

  it('renders list items for - lines', () => {
    render(<Markdown text={'- one\n- two'} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('renders bold text', () => {
    const { container } = render(<Markdown text="hello **world**" />)
    expect(container.querySelector('strong')).toHaveTextContent('world')
  })

  it('returns null when text is falsy', () => {
    const { container } = render(<Markdown text={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('strips <script> tags (XSS)', () => {
    const { container } = render(
      <Markdown text={'hello\n<script>alert(1)</script>'} />
    )
    expect(container.querySelector('script')).toBeNull()
    expect(container.textContent).toContain('hello')
  })

  it('strips event-handler attributes like onerror (XSS)', () => {
    const { container } = render(
      <Markdown text={'<img src="x" onerror="alert(1)">'} />
    )
    const img = container.querySelector('img')
    // img may be allowed (no src policy), but the onerror handler must be gone
    if (img) expect(img.getAttribute('onerror')).toBeNull()
  })
})
