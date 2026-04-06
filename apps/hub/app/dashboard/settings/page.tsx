import { Suspense } from "react";
import { SettingsPage } from "@/views/SettingsPage";

function Fallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-slate-600">Cargando...</p>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Fallback />}>
      <SettingsPage />
    </Suspense>
  );
}
