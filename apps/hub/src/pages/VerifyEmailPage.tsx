import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authApi } from '@/lib/api-client'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@multisystem/ui'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export function VerifyEmailPage() {
    const [resending, setResending] = useState(false)
    const [resentMsg, setResentMsg] = useState('')
    const [resentError, setResentError] = useState('')
    const [resentEmail, setResentEmail] = useState('')

    async function handleResend() {
      setResending(true)
      setResentMsg('')
      setResentError('')
      try {
        let email = resentEmail
        if (!email) {
          email = window.prompt('Ingresa tu email para reenviar el link de verificación:') || ''
          setResentEmail(email)
        }
        if (!email) {
          setResentError('Email requerido para reenviar')
          setResending(false)
          return
        }
        const res = await authApi.resendVerification(email)
        if (res.success) {
          setResentMsg(res.message || 'Email de verificación reenviado')
        } else {
          setResentError(res.error || 'No se pudo reenviar el email')
        }
      } catch (err: any) {
        setResentError(err?.message || 'Error al reenviar email')
      }
      setResending(false)
    }
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Token de verificación no proporcionado')
      return
    }

    let isMounted = true

    async function verifyEmail() {
      try {
        const res = await authApi.verifyEmail(token!)
        if (!isMounted) return

        if (res.success) {
          setStatus('success')
          setMessage(res.message || 'Email verificado exitosamente')

          // Guardar token en cookie si existe
          if (res.token) {
            // Import dinámico para evitar SSR issues
            const { setTokenCookie } = await import('@/lib/auth')
            setTokenCookie(res.token)
          }

          // Redirigir al dashboard después de 2 segundos
          setTimeout(() => {
            if (isMounted) {
              navigate('/dashboard', { replace: true })
            }
          }, 2000)
        } else {
          setStatus('error')
          setMessage(res.error || 'Error al verificar email')
        }
      } catch (error: any) {
        if (!isMounted) return
        setStatus('error')
        setMessage(error?.response?.data?.error || 'Error al verificar email')
      }
    }

    verifyEmail()

    return () => {
      isMounted = false
    }
  }, [token, navigate])

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-white/60 bg-white/90 shadow-2xl backdrop-blur">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              {status === 'loading' && (
                <Loader2 className="h-16 w-16 text-sky-500 animate-spin" />
              )}
              {status === 'success' && (
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              )}
              {status === 'error' && (
                <XCircle className="h-16 w-16 text-red-500" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {status === 'loading' && 'Verificando email...'}
              {status === 'success' && '¡Email verificado!'}
              {status === 'error' && 'Error de verificación'}
            </CardTitle>
            <CardDescription>
              {status === 'loading' && 'Por favor espera mientras verificamos tu email'}
              {status === 'success' && 'Tu cuenta ha sido activada exitosamente'}
              {status === 'error' && 'No pudimos verificar tu email'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`p-4 rounded-lg ${
              status === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : status === 'error'
                ? 'bg-red-50 border border-red-200'
                : 'bg-slate-50 border border-slate-200'
            }`}>
              <p className={`text-sm text-center ${
                status === 'success' 
                  ? 'text-green-700' 
                  : status === 'error'
                  ? 'text-red-700'
                  : 'text-slate-700'
              }`}>
                {message}
              </p>
            </div>

            {status === 'success' && (
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-4">
                  Serás redirigido al login en 3 segundos...
                </p>
                <Button
                  onClick={() => navigate('/login', { replace: true })}
                  className="w-full"
                >
                  Ir al Login
                </Button>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full"
                  variant="outline"
                >
                  Ir al Login
                </Button>
                <Link to="/register" className="block">
                  <Button variant="ghost" className="w-full">
                    ¿Necesitas una cuenta? Regístrate
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
