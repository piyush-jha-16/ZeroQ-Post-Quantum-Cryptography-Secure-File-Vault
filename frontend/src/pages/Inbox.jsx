import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../api'
import * as crypto from '../crypto'
import VaultLayout from '../components/VaultLayout'
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentLockIcon,
  InboxIcon,
  SpinnerIcon,
  UserIcon,
} from '../icons'

export default function Inbox() {
  const navigate = useNavigate()
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [decrypting, setDecrypting] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)

  const decryptSteps = [
    'Downloading encrypted payload...',
    'Verifying sender signature (ML-DSA-65)...',
    'Decapsulating shared secret (ML-KEM-768)...',
    'Decrypting file (AES-256-GCM)...',
    'Preparing download...',
  ]

  useEffect(() => {
    fetchInbox()
  }, [])

  async function fetchInbox() {
    try {
      const inboxFiles = await api.getInbox()
      setFiles(inboxFiles)
      setError('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch inbox')
    } finally {
      setLoading(false)
    }
  }

  function getPrivateKeysOrThrow() {
    const raw = localStorage.getItem('privateKeys')
    if (!raw) {
      navigate('/recover-keys')
      throw new Error(
        'Private keys are missing on this browser. Redirecting to Key Recovery.'
      )
    }

    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      navigate('/recover-keys')
      throw new Error('Stored private keys are invalid. Redirecting to Key Recovery.')
    }

    if (!parsed?.mlKemPrivKey || !parsed?.mlDsaPrivKey) {
      navigate('/recover-keys')
      throw new Error('Stored private keys are incomplete. Redirecting to Key Recovery.')
    }

    return parsed
  }

  async function handleDownload(fileId) {
    setDecrypting(fileId)
    setCurrentStep(0)
    setError('')

    try {
      // Step 1: Download encrypted payload
      const downloadData = await api.downloadFile(fileId)
      setCurrentStep(1)

      // Step 2: Verify signature
      const encryptedBlobB64 = downloadData.encrypted_file_blob
      const encryptedBlob = base64ToUint8Array(encryptedBlobB64)

      const isValid = await crypto.verifySignature(
        encryptedBlob,
        downloadData.digital_signature,
        downloadData.sender_ml_dsa_pub_key
      )

      if (!isValid) {
        throw new Error('Signature verification failed. File may be tampered with.')
      }
      setCurrentStep(2)

      // Step 3: Decapsulate shared secret
      const privateKeys = getPrivateKeysOrThrow()
      const sharedSecret = await crypto.decapsulateSecret(
        downloadData.kem_ciphertext,
        privateKeys.mlKemPrivKey
      )
      setCurrentStep(3)

      // Step 4: Decrypt file
      const decrypted = await crypto.decryptFile(
        encryptedBlobB64,
        downloadData.aes_nonce,
        sharedSecret
      )
      setCurrentStep(4)

      // Find original filename
      const fileRecord = files.find(f => f.id === fileId)
      const filename = fileRecord?.original_filename || 'download'

      // Step 5: Trigger browser download
      const blob = new Blob([decrypted])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setDecrypting(null)
    } catch (err) {
      setError(err.message || 'Download/decryption failed')
      setDecrypting(null)
      setCurrentStep(0)
    }
  }

  function base64ToUint8Array(b64) {
    const binary = atob(b64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }

  return (
    <VaultLayout
      activeNav="inbox"
      title="Inbox"
      subtitle="Review incoming encrypted files and decrypt locally in your browser."
    >
      <div className="w-full">
        {error && (
          <div className="status-box status-error">
            <AlertTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="card-panel py-14 text-center">
            <SpinnerIcon className="mx-auto h-7 w-7 animate-spin text-muted" />
            <p className="mt-3 text-sm text-muted">Loading inbox...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="card-panel py-14 text-center">
            <div className="icon-chip mx-auto mb-5 p-4">
              <InboxIcon className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-main">No files in your inbox yet</h3>
            <p className="mt-2 text-sm text-muted">Incoming encrypted files will appear here once someone sends you a file.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {files.map((file) => (
              <div key={file.id} className="card-panel p-6 md:p-7">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1 mb-4 md:mb-0">
                    <div className="mb-1 flex items-center gap-2">
                      <DocumentLockIcon className="h-4 w-4 text-muted" />
                      <h3 className="text-base font-semibold text-main">{file.original_filename}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                      <span className="inline-flex items-center gap-1">
                        <UserIcon className="h-4 w-4" />
                        {file.sender_username}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        {new Date(file.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownload(file.id)}
                    disabled={decrypting !== null}
                    className="btn-primary whitespace-nowrap md:min-w-[190px]"
                  >
                    {decrypting === file.id ? (
                      <>
                        <SpinnerIcon />
                        Processing
                      </>
                    ) : (
                      'Decrypt & Download'
                    )}
                  </button>
                </div>

                {decrypting === file.id && (
                  <div className="surface-soft mt-4 space-y-2 p-4">
                    {decryptSteps.map((step, index) => (
                      <div
                        key={index}
                        className={`step-row ${
                          index === currentStep ? 'step-active' : index < currentStep ? 'step-done' : 'step-idle'
                        }`}
                      >
                        <div>
                          {index < currentStep ? (
                            <CheckCircleIcon className="h-4 w-4" />
                          ) : index === currentStep ? (
                            <SpinnerIcon className="h-4 w-4 animate-spin" />
                          ) : (
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--text-2)' }} />
                          )}
                        </div>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </VaultLayout>
  )
}
