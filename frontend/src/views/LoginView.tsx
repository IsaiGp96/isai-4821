import { Link } from 'react-router'
import { AuthLayout } from '../components/AuthLayout'
import { ROUTES } from '../config/routes'
import { LoginForm } from '../forms/LoginForm'

export function LoginView() {
  return (
    <AuthLayout
      title="Iniciar sesión"
      description="Entra con tu correo y contraseña."
      footer={
        <p>
          ¿No tienes cuenta?{' '}
          <Link to={ROUTES.register} className="font-medium text-foreground underline-offset-4 hover:underline">
            Crear cuenta
          </Link>
        </p>
      }
    >
      <LoginForm />
    </AuthLayout>
  )
}
