import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { FormError } from '../components/FormError'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { ROUTES } from '../config/routes'
import { authService } from '../services/auth.service'

export function LoginForm() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    const result = await authService.login({ email, password })
    setSubmitting(false)

    if (!result.ok) return setError(result.error)
    navigate(ROUTES.dashboard, { replace: true })
  }

  // noValidate: los mensajes vienen del servicio, en español y iguales en todos los navegadores.
  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <FormError message={error} />
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Entrando…' : 'Iniciar sesión'}
      </Button>
    </form>
  )
}
