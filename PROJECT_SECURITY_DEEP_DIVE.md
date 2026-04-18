# ZeroQ Security Deep Dive

## 1. Purpose of This Document

This document explains, in implementation-level detail:
- where quantum-safe cryptography is used in ZeroQ,
- how encryption and decryption work end to end,
- why this design is safer than typical file-sharing patterns,
- what loopholes and residual risks still exist,
- what the cryptography stack and trust model are, and how they are used.

The details below are based on the current code in this repository.

## 2. Cryptography Stack

### Primary cryptographic components
- ML-KEM-768 (post-quantum key encapsulation)
- ML-DSA-65 (post-quantum digital signatures)
- AES-256-GCM (symmetric authenticated encryption)
- PBKDF2-SHA256 (key derivation for encrypted key backup)
- Argon2 (password hashing for account login)
- JWT (session token for API authentication)

### Where each is used
- ML-KEM-768:
  - Sender encapsulates a fresh shared secret to the recipient using recipient ML-KEM public key.
  - Recipient decapsulates the shared secret using recipient ML-KEM private key.
- ML-DSA-65:
  - Sender signs encrypted payload bytes.
  - Recipient verifies signature before decryption.
- AES-256-GCM:
  - Encrypts file bytes in browser before upload.
  - Also protects key-backup payload with a derived key.
- PBKDF2-SHA256:
  - Derives backup-encryption key from user recovery secret using 250000 iterations and random salt.
- Argon2:
  - Hashes account password in backend database.

## 3. Trust Model

### Core trust statement
ZeroQ is a ciphertext-storage model: plaintext file content and operational private keys remain client-side (browser), while server stores encrypted payload plus metadata.

### Trust boundaries
- Trusted for plaintext confidentiality:
  - sender browser runtime,
  - recipient browser runtime,
  - user device integrity.
- Not trusted for plaintext confidentiality:
  - backend API server,
  - database storage,
  - network path.

### What server is trusted for
- authentication and authorization checks,
- durable storage and delivery of encrypted records,
- user public key distribution.

### What server is not trusted for
- decryption,
- access to private keys in plaintext,
- access to plaintext file data.

## 4. How Quantum Cryptography Is Used

## 4.1 At registration
1. Browser generates:
   - ML-KEM key pair,
   - ML-DSA key pair.
2. Public keys are sent to backend and stored under user account.
3. Private keys remain local in browser storage.
4. Private keys are also encrypted (AES-GCM key derived from recovery secret) and uploaded as encrypted backup.

## 4.2 During send/upload
1. Sender asks backend for recipient public keys.
2. Sender runs ML-KEM encapsulation with recipient ML-KEM public key.
3. Sender gets two outputs:
   - kem_ciphertext,
   - shared_secret (32-byte secret).
4. Sender encrypts file bytes with AES-GCM using shared_secret as key material.
5. Sender signs encrypted bytes with ML-DSA private key.
6. Sender uploads:
   - encrypted_file_blob,
   - kem_ciphertext,
   - aes_nonce,
   - digital_signature,
   - filename + sender/receiver metadata.

## 4.3 During receive/download
1. Recipient downloads encrypted blob and metadata.
2. Recipient verifies ML-DSA signature using sender ML-DSA public key.
3. If signature valid, recipient decapsulates shared secret using recipient ML-KEM private key and kem_ciphertext.
4. Recipient decrypts encrypted blob with AES-GCM using derived shared secret and nonce.
5. Plaintext is produced only in recipient browser.

## 5. Encryption and Decryption Workflow Details

### File encryption details
- Symmetric algorithm: AES-GCM with 12-byte random nonce.
- Key source: ML-KEM shared secret from encapsulation/decapsulation.
- Output uploaded: ciphertext bytes plus nonce plus KEM ciphertext plus signature.

### Integrity and authenticity details
- AES-GCM provides ciphertext integrity check at decryption stage.
- ML-DSA signature provides sender authenticity and tamper detection before decryption attempt.

### Key backup encryption details
- Key payload: JSON containing private keys.
- Recovery secret minimum check: length >= 10.
- KDF: PBKDF2-SHA256, 250000 iterations, random 16-byte salt.
- Cipher: AES-GCM with random 12-byte IV.
- Stored server-side: encrypted payload, salt, nonce (all Base64).

## 6. Why This Is Safer Than Typical Approaches

### Compared with many traditional file-sharing systems
- Plaintext is not intentionally uploaded to server.
- Decryption key derivation is per-transfer via ML-KEM encapsulation.
- Signature verification reduces risk of silent tampering.
- Quantum-safe key encapsulation and signatures improve future-readiness against large-scale quantum attacks on classical asymmetric cryptography.

### Practical confidentiality benefits
- Database leak mostly exposes ciphertext and metadata, not plaintext file content.
- Network interception cannot recover plaintext without recipient private key and successful decryption path.
- Backend operators do not require direct access to user private keys for normal file delivery.

## 7. Loopholes, Weaknesses, and Residual Risks

No real system is "unbreakable." This section is critical.

### 7.1 Endpoint compromise risk (major)
If attacker controls sender or recipient device/browser session, they can access plaintext, local keys, JWT token, or decrypted output. This is outside cryptographic algorithm strength.

### 7.2 localStorage exposure risk (major)
Current design uses browser localStorage for private keys and token. localStorage is vulnerable to exfiltration if XSS or malicious script execution occurs.

### 7.3 Metadata leakage (inherent)
Server still sees and stores:
- sender username,
- receiver username,
- filename,
- timestamps,
- file size patterns.
This can reveal communication patterns even when file content is encrypted.

### 7.4 Public-key substitution risk if backend is malicious/compromised
Recipients' public keys are fetched from backend. If backend serves wrong key material, sender can encrypt to attacker-controlled key.
Mitigation usually requires key transparency, pinned fingerprints, out-of-band verification, or signed key directories.

### 7.5 Recovery secret policy is basic
Minimum length check is currently low (>=10). Stronger policy, optional passphrase entropy checks, and recovery-attempt protections should be considered.

### 7.6 No hardware-backed key isolation
Private keys are software-managed in browser context, not hardware-backed by default.

### 7.7 Standard web-app attack surface still applies
- account takeover,
- credential stuffing,
- brute-force attempts,
- insecure dependencies,
- CSRF/XSS if introduced later.
PQC does not solve these.

## 8. Practical Security Recommendations

### High priority hardening
- Move private keys from localStorage to safer storage patterns where possible.
- Add strict CSP and XSS hardening.
- Add key fingerprint verification UI and key-change alerts.
- Add server-side rate limiting and abuse controls.
- Enforce stronger recovery-secret and password policies.
- Add security logging and anomaly detection.

### Medium priority
- Add optional per-file ephemeral signing context and signed metadata binding.
- Encrypt filename metadata client-side if product requirements allow.
- Add explicit token expiry UX and refresh handling.

## 9. Data Objects and Their Security Meaning

### Stored in users table
- ml_kem_pub_key: recipient encapsulation target.
- ml_dsa_pub_key: signature verification source.
- password_hash (Argon2): authentication verifier.

### Stored in file_records table
- encrypted_file_blob: ciphertext payload.
- kem_ciphertext: KEM output needed for recipient decapsulation.
- aes_nonce: AES-GCM nonce.
- digital_signature: sender signature over encrypted payload.
- original_filename: operational metadata (plaintext metadata).

### Stored in key_backups table
- encrypted_private_keys: encrypted private key bundle.
- key_salt and key_nonce: KDF/cipher parameters for recovery.

## 10. Summary

ZeroQ uses a modern hybrid model:
- post-quantum asymmetric primitives (ML-KEM + ML-DSA) for key exchange and authenticity,
- symmetric authenticated encryption (AES-256-GCM) for file confidentiality and integrity,
- encrypted key backup with PBKDF2-derived key for recoverability.

This is stronger than many common patterns for confidentiality of stored/transferred file content, but system safety still depends heavily on endpoint security, key-distribution trust, browser security hygiene, and metadata/privacy tradeoffs.
