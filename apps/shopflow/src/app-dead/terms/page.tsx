import Link from 'next/link'
import { Button } from '@multisystem/ui'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),_transparent_45%)] bg-slate-50 px-6 py-12">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-white/60 bg-white/85 p-8 shadow-xl backdrop-blur">
        <h1 className="text-3xl font-bold text-slate-900">Términos y condiciones</h1>
        <p className="mt-4 text-sm text-slate-600">
          Última actualización: Febrero 12, 2026
        </p>

        <div className="mt-8 space-y-6 text-sm text-slate-600">
          <section>
            <h2 className="text-lg font-semibold text-slate-900">1. Uso del servicio</h2>
            <p className="mt-2">
              ShopFlow es una plataforma de gestión comercial diseñada para apoyar la operación de negocios. Al crear una
              cuenta, aceptas utilizar el servicio de manera responsable y conforme a la normativa aplicable en tu país.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">2. Cuenta y seguridad</h2>
            <p className="mt-2">
              Eres responsable de mantener la confidencialidad de tus credenciales y de toda actividad que ocurra en tu
              cuenta. Notifica cualquier uso no autorizado tan pronto como lo detectes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">3. Datos y contenidos</h2>
            <p className="mt-2">
              Conservas la propiedad de tus datos. ShopFlow procesa la información necesaria para operar la plataforma y
              mejorar la experiencia. Nos comprometemos a tratar los datos con medidas de seguridad razonables.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">4. Disponibilidad</h2>
            <p className="mt-2">
              Trabajamos para mantener el servicio disponible, pero pueden ocurrir interrupciones por mantenimiento o causas
              fuera de nuestro control. Te mantendremos informado cuando sea posible.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">5. Cambios en los términos</h2>
            <p className="mt-2">
              Podremos actualizar estos términos para reflejar mejoras del servicio o cambios legales. Si realizamos cambios
              relevantes, los comunicaremos oportunamente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">6. Contacto</h2>
            <p className="mt-2">
              Si tienes preguntas sobre estos términos, puedes escribirnos desde el panel de ayuda una vez iniciada la sesión.
            </p>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/register">
            <Button>Volver al registro</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Ir al inicio</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
