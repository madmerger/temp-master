import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the dashboard heading', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Temp Master Dashboard' })).toBeInTheDocument()
  })

  it('does not render Snake branding', () => {
    render(<App />)

    expect(screen.queryByText(/snake/i)).not.toBeInTheDocument()
  })
})
