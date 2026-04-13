import { base64, utf8 } from '@scure/base'
import nacl from 'tweetnacl'
import { getBrowserProvider, hashRecordPayload } from './medichainContract'

type UploadResult = {
 cid: string
 encryptedHash: string
}

type IpfsEnvelopeV1 = {
 version: 'medichain-v1'
 algorithm: 'aes-256-gcm'
 iv: string
 ciphertext: string
 createdAt: string
 patientAddress: string
 encryptedBy: string
}

type IpfsEnvelopeV2 = {
 version: 'medichain-v2'
 algorithm: 'aes-256-gcm'
 keyWrapping: 'x25519-xsalsa20-poly1305'
 iv: string
 ciphertext: string
 createdAt: string
 patientAddress: string
 encryptedBy: string
 wrappedDataKeys: Record<string, string>
}

type IpfsEnvelope = IpfsEnvelopeV1 | IpfsEnvelopeV2

type DecryptResult = {
 payload: unknown
 envelope: IpfsEnvelope
 serializedEnvelope: string
 computedHash: string
}

function bytesToBase64(bytes: Uint8Array): string {
 let binary = ''
 for (let i = 0; i < bytes.length; i += 1) {
  binary += String.fromCharCode(bytes[i])
 }
 return btoa(binary)
}

function bufferToBase64(buffer: ArrayBuffer): string {
 return bytesToBase64(new Uint8Array(buffer))
}

function base64ToBytes(base64: string): Uint8Array {
 const binary = atob(base64)
 const buffer = new ArrayBuffer(binary.length)
 const bytes = new Uint8Array(buffer)
 for (let i = 0; i < binary.length; i += 1) {
  bytes[i] = binary.charCodeAt(i)
 }
 return bytes
}

async function deriveEncryptionKey(patientAddress: string, usage: KeyUsage[]): Promise<CryptoKey> {
 if (!window.crypto?.subtle) {
  throw new Error('Secure crypto APIs are unavailable in this browser.')
 }

 const provider = await getBrowserProvider()
 const signer = await provider.getSigner()
 const signature = await signer.signMessage(`MediChain encryption key v1:${patientAddress}`)
 const keyMaterial = new TextEncoder().encode(signature)
 const keyDigest = await window.crypto.subtle.digest('SHA-256', keyMaterial)

 return window.crypto.subtle.importKey(
  'raw',
  keyDigest,
  { name: 'AES-GCM', length: 256 },
  false,
  usage
 )
}

async function getConnectedAddress(): Promise<string> {
 const provider = await getBrowserProvider()
 const signer = await provider.getSigner()
 return signer.getAddress()
}

async function generateDataKey(): Promise<{ raw: Uint8Array; key: CryptoKey }> {
 if (!window.crypto?.subtle) {
  throw new Error('Secure crypto APIs are unavailable in this browser.')
 }

 const raw = window.crypto.getRandomValues(new Uint8Array(32))
 const key = await window.crypto.subtle.importKey(
  'raw',
  raw,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
 )

 return { raw, key }
}

async function getWalletEncryptionPublicKey(address: string): Promise<string> {
 const provider = await getBrowserProvider()
 const publicKey = (await provider.send('eth_getEncryptionPublicKey', [address])) as string

 if (!publicKey || typeof publicKey !== 'string') {
  throw new Error(`Could not get encryption public key for ${address}.`)
 }

 return publicKey
}

function normalizeAddress(address: string): string {
 return address.trim().toLowerCase()
}

async function wrapDataKeyForWallets(dataKey: Uint8Array, recipients: string[]): Promise<Record<string, string>> {
 const wrappedDataKeys: Record<string, string> = {}
 const encodedKey = bytesToBase64(dataKey)

 for (const recipient of recipients) {
  const recipientAddress = normalizeAddress(recipient)
  const publicKey = await getWalletEncryptionPublicKey(recipientAddress)
  const ephemeralKeyPair = nacl.box.keyPair()
  const recipientPublicKey = base64.decode(publicKey)
  const nonce = nacl.randomBytes(nacl.box.nonceLength)
  const message = utf8.decode(encodedKey)
  const ciphertext = nacl.box(
   message,
   nonce,
   recipientPublicKey,
   ephemeralKeyPair.secretKey
  )

  const encryptedData = {
   version: 'x25519-xsalsa20-poly1305',
   nonce: base64.encode(nonce),
   ephemPublicKey: base64.encode(ephemeralKeyPair.publicKey),
   ciphertext: base64.encode(ciphertext),
  }

  wrappedDataKeys[recipientAddress] = JSON.stringify(encryptedData)
 }

 return wrappedDataKeys
}

async function encryptPayload(payload: string, patientAddress: string, authorizedWallets: string[]): Promise<{ envelope: IpfsEnvelopeV2; serialized: string }> {
 if (!window.crypto?.subtle) {
  throw new Error('Secure crypto APIs are unavailable in this browser.')
 }

 const encryptedBy = await getConnectedAddress()
 const recipients = Array.from(
  new Set(
   [patientAddress, encryptedBy, ...authorizedWallets]
    .filter((value) => value.trim().length > 0)
    .map(normalizeAddress)
  )
 )

 if (!recipients.length) {
  throw new Error('No recipient wallets were provided for key wrapping.')
 }

 const { raw: rawDataKey, key } = await generateDataKey()

 const iv = window.crypto.getRandomValues(new Uint8Array(12))
 const plaintext = new TextEncoder().encode(payload)
 const encryptedBuffer = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
 const wrappedDataKeys = await wrapDataKeyForWallets(rawDataKey, recipients)

 const envelope: IpfsEnvelopeV2 = {
  version: 'medichain-v2',
  algorithm: 'aes-256-gcm',
  keyWrapping: 'x25519-xsalsa20-poly1305',
  iv: bytesToBase64(iv),
  ciphertext: bufferToBase64(encryptedBuffer),
  createdAt: new Date().toISOString(),
  patientAddress,
  encryptedBy,
  wrappedDataKeys,
 }

 const serialized = JSON.stringify(envelope)
 return { envelope, serialized }
}

function parseCidFromResponse(data: unknown): string | null {
 if (!data || typeof data !== 'object') {
  return null
 }

 const candidate = data as Record<string, unknown>
 const cid = candidate.cid ?? candidate.IpfsHash ?? candidate.ipfsHash ?? candidate.hash
 return typeof cid === 'string' && cid.length > 0 ? cid : null
}

async function uploadViaCustomApi(serialized: string): Promise<string> {
 const uploadUrl = import.meta.env.VITE_IPFS_UPLOAD_URL
 const apiKey = import.meta.env.VITE_IPFS_API_KEY

 if (!uploadUrl) {
  throw new Error('Custom IPFS upload URL is not configured.')
 }

 const headers: Record<string, string> = { 'Content-Type': 'application/json' }
 if (apiKey) {
  headers.Authorization = `Bearer ${apiKey}`
 }

 const response = await fetch(uploadUrl, {
  method: 'POST',
  headers,
  body: JSON.stringify({
   fileName: `medichain-record-${Date.now()}.json`,
   content: JSON.parse(serialized),
  }),
 })

 if (!response.ok) {
  throw new Error(`IPFS API upload failed (${response.status}).`)
 }

 const data = (await response.json()) as unknown
 const cid = parseCidFromResponse(data)
 if (!cid) {
  throw new Error('IPFS API did not return a CID.')
 }

 return cid
}

async function uploadViaPinata(serialized: string): Promise<string> {
 const pinataJwt = import.meta.env.VITE_PINATA_JWT
 if (!pinataJwt) {
  throw new Error('Pinata JWT is not configured.')
 }

 const form = new FormData()
 form.append(
  'file',
  new Blob([serialized], { type: 'application/json' }),
  `medichain-record-${Date.now()}.json`
 )

 const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
  method: 'POST',
  headers: {
   Authorization: `Bearer ${pinataJwt}`,
  },
  body: form,
 })

 if (!response.ok) {
  throw new Error(`Pinata upload failed (${response.status}).`)
 }

 const data = (await response.json()) as unknown
 const cid = parseCidFromResponse(data)
 if (!cid) {
  throw new Error('Pinata did not return a CID.')
 }

 return cid
}

export function hasIpfsUploadConfig(): boolean {
 return Boolean(import.meta.env.VITE_IPFS_UPLOAD_URL || import.meta.env.VITE_PINATA_JWT)
}

function gatewayUrlForCid(cid: string): string {
 const base = (import.meta.env.VITE_IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs').replace(/\/$/, '')
 return `${base}/${cid}`
}

function isEnvelope(value: unknown): value is IpfsEnvelope {
 if (!value || typeof value !== 'object') {
  return false
 }

 const candidate = value as Record<string, unknown>
 const hasCoreFields =
  candidate.algorithm === 'aes-256-gcm' &&
  typeof candidate.iv === 'string' &&
  typeof candidate.ciphertext === 'string' &&
  typeof candidate.createdAt === 'string' &&
  typeof candidate.patientAddress === 'string' &&
  typeof candidate.encryptedBy === 'string'

 if (candidate.version === 'medichain-v1') {
  return hasCoreFields
 }

 if (candidate.version === 'medichain-v2') {
  return (
   hasCoreFields &&
   candidate.keyWrapping === 'x25519-xsalsa20-poly1305' &&
   typeof candidate.wrappedDataKeys === 'object' &&
   candidate.wrappedDataKeys !== null
  )
 }

 return false
}

export async function fetchEncryptedEnvelope(cid: string): Promise<IpfsEnvelope> {
 const response = await fetch(gatewayUrlForCid(cid), { method: 'GET' })
 if (!response.ok) {
  throw new Error(`Failed to fetch IPFS content (${response.status}).`)
 }

 const data = (await response.json()) as unknown
 if (!isEnvelope(data)) {
  throw new Error('IPFS content is not a valid MediChain encrypted envelope.')
 }

 return data
}

export async function decryptRecordFromCid(cid: string): Promise<DecryptResult> {
 const envelope = await fetchEncryptedEnvelope(cid)

 let key: CryptoKey
 if (envelope.version === 'medichain-v2') {
  const connectedAddress = normalizeAddress(await getConnectedAddress())
  const wrappedKey = envelope.wrappedDataKeys[connectedAddress]

  if (!wrappedKey) {
   throw new Error('No wrapped key found for this wallet in the record envelope.')
  }

  const provider = await getBrowserProvider()
  let decryptedKeyB64: string
  try {
   decryptedKeyB64 = (await provider.send('eth_decrypt', [wrappedKey, connectedAddress])) as string
  } catch {
   throw new Error('Wallet failed to unwrap data key. Ensure this wallet is authorized.')
  }

  const rawDataKey = base64ToBytes(decryptedKeyB64)
  const keyMaterial = new Uint8Array(
   rawDataKey.buffer.slice(rawDataKey.byteOffset, rawDataKey.byteOffset + rawDataKey.byteLength)
  )
  key = await window.crypto.subtle.importKey(
   'raw',
   keyMaterial as unknown as BufferSource,
   { name: 'AES-GCM', length: 256 },
   false,
   ['decrypt']
  )
 } else {
  key = await deriveEncryptionKey(envelope.patientAddress, ['decrypt'])
 }

 const ivBytes = base64ToBytes(envelope.iv)
 const cipherBytes = base64ToBytes(envelope.ciphertext)
 const iv = new Uint8Array(
  ivBytes.buffer.slice(ivBytes.byteOffset, ivBytes.byteOffset + ivBytes.byteLength)
 )
 const ciphertext = new Uint8Array(
  cipherBytes.buffer.slice(
   cipherBytes.byteOffset,
   cipherBytes.byteOffset + cipherBytes.byteLength
  )
 )

 let plaintextBuffer: ArrayBuffer
 try {
  plaintextBuffer = await window.crypto.subtle.decrypt(
   { name: 'AES-GCM', iv: iv as unknown as BufferSource },
   key,
   ciphertext as unknown as BufferSource
  )
 } catch {
  throw new Error('Decryption failed for this wallet. Connect the wallet authorized for this encrypted payload.')
 }

 const decoded = new TextDecoder().decode(plaintextBuffer)
 const payload = JSON.parse(decoded) as unknown
 const serializedEnvelope = JSON.stringify(envelope)

 return {
  payload,
  envelope,
  serializedEnvelope,
  computedHash: hashRecordPayload(serializedEnvelope),
 }
}

export async function uploadEncryptedRecord(
 payload: string,
 patientAddress: string,
 authorizedWallets: string[] = []
): Promise<UploadResult> {
 const { serialized } = await encryptPayload(payload, patientAddress, authorizedWallets)

 let cid: string
 if (import.meta.env.VITE_IPFS_UPLOAD_URL) {
  cid = await uploadViaCustomApi(serialized)
 } else if (import.meta.env.VITE_PINATA_JWT) {
  cid = await uploadViaPinata(serialized)
 } else {
  throw new Error('IPFS upload is not configured. Set VITE_IPFS_UPLOAD_URL or VITE_PINATA_JWT.')
 }

 return {
  cid,
  encryptedHash: hashRecordPayload(serialized),
 }
}
