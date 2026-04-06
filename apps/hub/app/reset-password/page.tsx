import { Suspense } from "react";
import { ResetPasswordPage } from "@/views/ResetPasswordPage";

function Fallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-slate-600">Cargando...</p>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Fallback />}>
      <ResetPasswordPage />
    </Suspense>
  );
}
