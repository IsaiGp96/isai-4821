import { Link } from 'react-router'
import { AuthLayout } from '../components/AuthLayout'
import { ROUTES } from '../config/routes'
import { RegisterForm } from '../forms/RegisterForm'

export function RegisterView() {
  return (
    <AuthLayout
      title="Crear cuenta"
      description="Regístrate para recargar saldo y seguir las carreras."
      footer={
        <p>
          ¿Ya tienes cuenta?{' '}
          <Link to={ROUTES.login} className="font-medium text-foreground underline-offset-4 hover:underline">
            Iniciar sesión
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthLayout>
  )
}
