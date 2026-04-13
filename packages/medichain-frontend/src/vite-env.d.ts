/// <reference types="vite/client" />

interface ImportMetaEnv {
 readonly VITE_MEDICHAIN_CONTRACT_ADDRESS: string
 readonly VITE_IPFS_UPLOAD_URL?: string
 readonly VITE_IPFS_API_KEY?: string
 readonly VITE_PINATA_JWT?: string
 readonly VITE_IPFS_GATEWAY_URL?: string
}

interface ImportMeta {
 readonly env: ImportMetaEnv
}
