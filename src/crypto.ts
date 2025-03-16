import { webcrypto } from "crypto";

// #############
// ### Utils ###
// #############

// Convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}

// Convert Base64 string to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  var buff = Buffer.from(base64, "base64");
  return buff.buffer.slice(buff.byteOffset, buff.byteOffset + buff.byteLength);
}

// ################
// ### RSA keys ###
// ################

type GenerateRsaKeyPair = {
  publicKey: webcrypto.CryptoKey;
  privateKey: webcrypto.CryptoKey;
};

// ✅ Génère une paire de clés RSA (Test: "Can generate RSA key pair")
export async function generateRsaKeyPair(): Promise<GenerateRsaKeyPair> {
  const { publicKey, privateKey } = await webcrypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );

  return { publicKey, privateKey };
}

// ✅ Exporte une clé publique en base64
export async function exportPubKey(key: webcrypto.CryptoKey): Promise<string> {
  const exportedKey = await webcrypto.subtle.exportKey("spki", key);
  return arrayBufferToBase64(exportedKey);
}

// ✅ Exporte une clé privée en base64
export async function exportPrvKey(
  key: webcrypto.CryptoKey | null
): Promise<string | null> {
  if (!key) return null;
  const exportedKey = await webcrypto.subtle.exportKey("pkcs8", key);
  return arrayBufferToBase64(exportedKey);
}

// ✅ Importe une clé publique depuis une chaîne base64
export async function importPubKey(
  strKey: string
): Promise<webcrypto.CryptoKey> {
  const binaryKey = base64ToArrayBuffer(strKey);
  return await webcrypto.subtle.importKey(
    "spki",
    binaryKey,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
}

// ✅ Importe une clé privée depuis une chaîne base64
export async function importPrvKey(
  strKey: string
): Promise<webcrypto.CryptoKey> {
  const binaryKey = base64ToArrayBuffer(strKey);
  return await webcrypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );
}

// ✅ Chiffre un message avec une clé publique RSA
export async function rsaEncrypt(
  b64Data: string,
  strPublicKey: string
): Promise<string> {
  const publicKey = await importPubKey(strPublicKey);
  const encodedMessage = base64ToArrayBuffer(b64Data);
  const encrypted = await webcrypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    encodedMessage
  );
  return arrayBufferToBase64(encrypted);
}

// ✅ Déchiffre un message avec une clé privée RSA
export async function rsaDecrypt(
  data: string,
  privateKey: webcrypto.CryptoKey
): Promise<string> {
  const encryptedBuffer = base64ToArrayBuffer(data);
  const decrypted = await webcrypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedBuffer
  );
  return arrayBufferToBase64(decrypted);
}

// ######################
// ### Symmetric keys ###
// ######################

// ✅ Génère une clé symétrique AES (Test: "Can generate symmetric key")
export async function createRandomSymmetricKey(): Promise<webcrypto.CryptoKey> {
  return await webcrypto.subtle.generateKey(
    {
      name: "AES-CBC",
      length: 256,
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

// ✅ Exporte une clé symétrique en base64
export async function exportSymKey(key: webcrypto.CryptoKey): Promise<string> {
  const exportedKey = await webcrypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64(exportedKey);
}

// ✅ Importe une clé symétrique depuis une chaîne base64
export async function importSymKey(
  strKey: string
): Promise<webcrypto.CryptoKey> {
  const binaryKey = base64ToArrayBuffer(strKey);
  return await webcrypto.subtle.importKey(
    "raw",
    binaryKey,
    { name: "AES-CBC" },
    true,
    ["encrypt", "decrypt"]
  );
}

// ✅ Chiffre un message avec une clé symétrique AES
export async function symEncrypt(
  key: webcrypto.CryptoKey,
  data: string
): Promise<string> {
  const iv = webcrypto.getRandomValues(new Uint8Array(16)); // ✅ Utilisation correcte de webcrypto
  const encodedMessage = new TextEncoder().encode(data);
  const encrypted = await webcrypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    key,
    encodedMessage
  );

  return arrayBufferToBase64(iv) + "." + arrayBufferToBase64(encrypted);
}

// ✅ Déchiffre un message avec une clé symétrique AES
export async function symDecrypt(
  strKey: string,
  encryptedData: string
): Promise<string> {
  const [ivB64, encryptedB64] = encryptedData.split(".");
  const iv = base64ToArrayBuffer(ivB64);
  const encryptedBuffer = base64ToArrayBuffer(encryptedB64);
  const key = await importSymKey(strKey);

  const decrypted = await webcrypto.subtle.decrypt(
    { name: "AES-CBC", iv },
    key,
    encryptedBuffer
  );

  return new TextDecoder().decode(decrypted);
}
