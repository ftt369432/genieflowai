/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_API_URL: string
  readonly VITE_APP_NAME: string
  // Add other env variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
