import CryptoJS from "crypto-js";
import { BrowserProvider, ethers } from "ethers";

async function deriveSecret(provider: BrowserProvider, addr: string): Promise<string> {
  const signer = await provider.getSigner();
  return await signer.signMessage(`MediChain-Key-Derivation-v2-${addr.toLowerCase()}`);
}

function deriveKey(sig: string, salt: string): string {
  return CryptoJS.PBKDF2(sig, salt, { keySize: 256 / 32, iterations: 10000 }).toString();
}

export async function encryptData(data: object, provider: BrowserProvider, addr: string, recordId: string) {
  const secret = await deriveSecret(provider, addr);
  const salt = CryptoJS.lib.WordArray.random(32).toString();
  const key = deriveKey(secret, `${salt}-${recordId}`);
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
  return { encrypted, salt };
}

export async function decryptData(enc: string, salt: string, provider: BrowserProvider, addr: string, recordId: string): Promise<object | null> {
  try {
    const secret = await deriveSecret(provider, addr);
    const key = deriveKey(secret, `${salt}-${recordId}`);
    const bytes = CryptoJS.AES.decrypt(enc, key);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch { return null; }
}

export function integrityHash(data: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(data));
}
