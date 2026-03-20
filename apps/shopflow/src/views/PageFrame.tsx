export function PageFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      </header>
      {children}
    </main>
  );
}
