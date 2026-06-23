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
})
