/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SHOPFLOW_URL?: string;
  readonly VITE_WORKIFY_URL?: string;
  readonly VITE_TECHSERVICES_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
