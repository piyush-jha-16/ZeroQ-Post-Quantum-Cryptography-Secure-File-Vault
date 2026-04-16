// Module-level OQS instance cache
let oqsInstance = null

/**
 * Load OQS instance from CDN
 */
export async function loadOQS() {
  if (oqsInstance) {
    return oqsInstance
  }
  try {
    const module = await import('@oqs/liboqs-js')
    if (!module?.createMLKEM768 || !module?.createMLDSA65) {
      throw new Error('Required OQS exports are missing')
    }
    oqsInstance = module
    return oqsInstance
  } catch (error) {
    throw new Error(`Failed to load OQS module: ${error?.message || 'unknown error'}`)
  }
}

/**
 * Helper: Convert Uint8Array to Base64
 */
function uint8ArrayToBase64(arr) {
  // Avoid call stack overflow for large arrays by chunking.
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < arr.length; i += chunkSize) {
    binary += String.fromCharCode(...arr.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

/**
 * Helper: Convert Base64 to Uint8Array
 */
function base64ToUint8Array(b64) {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function deriveAesKeyFromRecoverySecret(recoverySecret, salt) {
  const encoder = new TextEncoder()
  const secretKeyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(recoverySecret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 250000,
      hash: 'SHA-256',
    },
    secretKeyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptPrivateKeysForBackup(privateKeys, recoverySecret) {
  if (!recoverySecret || recoverySecret.length < 10) {
    throw new Error('Recovery secret must be at least 10 characters long.')
  }

  const encoder = new TextEncoder()
  const payload = encoder.encode(JSON.stringify(privateKeys))
  const salt = window.crypto.getRandomValues(new Uint8Array(16))
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveAesKeyFromRecoverySecret(recoverySecret, salt)

  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    payload
  )

  return {
    encryptedPrivateKeys: uint8ArrayToBase64(new Uint8Array(encrypted)),
    keySalt: uint8ArrayToBase64(salt),
    keyNonce: uint8ArrayToBase64(iv),
  }
}

export async function decryptPrivateKeysFromBackup(
  encryptedPrivateKeysB64,
  keySaltB64,
  keyNonceB64,
  recoverySecret
) {
  const encryptedPayload = base64ToUint8Array(encryptedPrivateKeysB64)
  const salt = base64ToUint8Array(keySaltB64)
  const iv = base64ToUint8Array(keyNonceB64)
  const key = await deriveAesKeyFromRecoverySecret(recoverySecret, salt)

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedPayload
  )

  const decoder = new TextDecoder()
  let parsed
  try {
    parsed = JSON.parse(decoder.decode(decryptedBuffer))
  } catch {
    throw new Error('Recovered key payload is invalid.')
  }

  if (!parsed?.mlKemPrivKey || !parsed?.mlDsaPrivKey) {
    throw new Error('Recovered key payload is incomplete.')
  }

  return parsed
}

/**
 * Generate ML-KEM-768 and ML-DSA-65 keypairs
 */
export async function generateKeyPairs() {
  const OQS = await loadOQS()
  const kem = await OQS.createMLKEM768()
  const sig = await OQS.createMLDSA65()

  const { publicKey: kemPublicKey, secretKey: kemPrivateKey } = kem.generateKeyPair()
  const { publicKey: sigPublicKey, secretKey: sigPrivateKey } = sig.generateKeyPair()

  kem.destroy()
  sig.destroy()
  
  return {
    mlKem: {
      publicKey: uint8ArrayToBase64(kemPublicKey),
      privateKey: uint8ArrayToBase64(kemPrivateKey),
    },
    mlDsa: {
      publicKey: uint8ArrayToBase64(sigPublicKey),
      privateKey: uint8ArrayToBase64(sigPrivateKey),
    },
  }
}

/**
 * Encapsulate a shared secret using recipient's ML-KEM public key
 */
export async function encapsulateSecret(recipientMLKemPublicKeyB64) {
  const OQS = await loadOQS()
  const kem = await OQS.createMLKEM768()
  const recipientPublicKey = base64ToUint8Array(recipientMLKemPublicKeyB64)

  const { ciphertext, sharedSecret } = kem.encapsulate(recipientPublicKey)

  kem.destroy()
  
  return {
    sharedSecret: sharedSecret, // 32-byte Uint8Array
    kemCiphertext: uint8ArrayToBase64(ciphertext),
  }
}

/**
 * Decapsulate a shared secret using own ML-KEM private key
 */
export async function decapsulateSecret(kemCiphertextB64, myPrivateKeyB64) {
  const OQS = await loadOQS()
  const kem = await OQS.createMLKEM768()
  const ciphertext = base64ToUint8Array(kemCiphertextB64)
  const privateKey = base64ToUint8Array(myPrivateKeyB64)

  const sharedSecret = kem.decapsulate(ciphertext, privateKey)

  kem.destroy()
  
  return sharedSecret // 32-byte Uint8Array
}

/**
 * Encrypt a file with AES-256-GCM
 */
export async function encryptFile(fileArrayBuffer, sharedSecretUint8Array) {
  // Import shared secret as AES-GCM key
  const key = await window.crypto.subtle.importKey(
    'raw',
    sharedSecretUint8Array,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  )
  
  // Generate 12-byte IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  
  // Encrypt
  const encryptedBlob = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    fileArrayBuffer
  )
  
  return {
    encryptedBlob: new Uint8Array(encryptedBlob),
    nonce: uint8ArrayToBase64(iv),
  }
}

/**
 * Decrypt a file with AES-256-GCM
 */
export async function decryptFile(encryptedBlobB64, nonceB64, sharedSecretUint8Array) {
  // Import shared secret as AES-GCM key
  const key = await window.crypto.subtle.importKey(
    'raw',
    sharedSecretUint8Array,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  )
  
  // Decode inputs
  const encryptedBlob = base64ToUint8Array(encryptedBlobB64)
  const iv = base64ToUint8Array(nonceB64)
  
  // Decrypt
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedBlob
  )
  
  return decrypted
}

/**
 * Sign data with ML-DSA-65
 */
export async function signData(dataUint8Array, mlDsaPrivateKeyB64) {
  const OQS = await loadOQS()

  const sig = await OQS.createMLDSA65()
  const privateKey = base64ToUint8Array(mlDsaPrivateKeyB64)

  const signature = sig.sign(dataUint8Array, privateKey)

  sig.destroy()
  
  return uint8ArrayToBase64(signature)
}

/**
 * Verify signature with ML-DSA-65
 */
export async function verifySignature(dataUint8Array, signatureB64, mlDsaPublicKeyB64) {
  const OQS = await loadOQS()

  const sig = await OQS.createMLDSA65()
  const signature = base64ToUint8Array(signatureB64)
  const publicKey = base64ToUint8Array(mlDsaPublicKeyB64)

  try {
    const isValid = sig.verify(dataUint8Array, signature, publicKey)
    sig.destroy()
    return isValid
  } catch (error) {
    sig.destroy()
    return false
  }
}
