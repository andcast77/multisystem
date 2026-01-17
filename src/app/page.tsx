import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold text-center mb-8">Multisystem Hub</h1>

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