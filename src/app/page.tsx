import Link from "next/link";
import { cookies } from "next/headers";
import { AuthActions } from "@/components/AuthActions";

export default async function Home() {
  const cookieStore = await cookies();
  const hasToken = !!cookieStore.get("token")?.value;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold text-center mb-8">Multisystem Hub</h1>

        <p className="text-center text-gray-600 mb-6">
          Punto de entrada unificado. Aquí puedes registrar tu empresa y acceder a los módulos.
        </p>

        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          <AuthActions hasToken={hasToken} />
          {!hasToken && (
            <Link
              href="/register"
              className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700"
            >
              Registrar empresa
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">🏪 ShopFlow</h2>
            <p className="text-gray-600 mb-4">Sistema de punto de venta y gestión de inventario</p>
            <Link href="/shopflow" className="text-blue-600 hover:underline">Acceder →</Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">👥 Workify</h2>
            <p className="text-gray-600 mb-4">Sistema de gestión de empleados y horarios</p>
            <Link href="/workify" className="text-blue-600 hover:underline">Acceder →</Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">⚙️ Configuración</h2>
            <p className="text-gray-600 mb-4">Configuración del sistema multisystem</p>
            <span className="text-gray-400">Próximamente</span>
          </div>
        </div>
      </div>
    </main>
  );
}