import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { GuestRoute } from '../src/components/GuestRoute'
import { ProtectedRoute } from '../src/components/ProtectedRoute'
import { ROUTES } from '../src/config/routes'
import { authService } from '../src/services/auth.service'

const routes = [
  {
    element: <GuestRoute />,
    children: [{ path: ROUTES.login, element: <h1>Login</h1> }],
  },
  {
    element: <ProtectedRoute />,
    children: [{ path: ROUTES.dashboard, element: <h1>Dashboard</h1> }],
  },
]

let container: HTMLDivElement
let root: Root

// Avisa a React que corre en pruebas para que act() espere los renders.
beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
})

beforeEach(() => {
  localStorage.clear()
  container = document.createElement('div')
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
})

function visit(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  act(() => root.render(<RouterProvider router={router} />))
  return router
}

describe('rutas - sin sesión', () => {
  it('redirige del dashboard al login', () => {
    const router = visit(ROUTES.dashboard)

    expect(router.state.location.pathname).toBe(ROUTES.login)
    expect(container.textContent).toBe('Login')
  })

  it('muestra el login', () => {
    visit(ROUTES.login)

    expect(container.textContent).toBe('Login')
  })
})

describe('rutas - con sesión', () => {
  beforeEach(async () => {
    await authService.register({
      fullName: 'Ana López',
      email: 'ana@correo.com',
      password: 'Caracol123',
      confirmPassword: 'Caracol123',
    })
  })

  it('muestra el dashboard', () => {
    visit(ROUTES.dashboard)

    expect(container.textContent).toBe('Dashboard')
  })

  it('redirige del login al dashboard', () => {
    const router = visit(ROUTES.login)

    expect(router.state.location.pathname).toBe(ROUTES.dashboard)
  })

  it('vuelve a pedir login después de cerrar sesión', () => {
    authService.logout()

    const router = visit(ROUTES.dashboard)

    expect(router.state.location.pathname).toBe(ROUTES.login)
  })
})
