import type { JSX } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'

export function Layout(): JSX.Element {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  )
}
