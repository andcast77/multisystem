import { Suspense } from "react";
import { RegisterVerifyPage } from "@/views/RegisterVerifyPage";

export default function RegisterVerifyRoutePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white/80">
          Cargando…
        </div>
      }
    >
      <RegisterVerifyPage />
    </Suspense>
  );
}
