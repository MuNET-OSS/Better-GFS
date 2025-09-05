/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_VIEWER_ONLY: boolean
  readonly VITE_HASH_HISTORY: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
