import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../api'
import * as crypto from '../crypto'
import VaultLayout from '../components/VaultLayout'
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  DocumentLockIcon,
  SpinnerIcon,
  UploadIcon,
} from '../icons'

export default function Upload() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [recipientUsername, setRecipientUsername] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState('')
  const [fileId, setFileId] = useState('')

  const steps = [
    "Fetching recipient's public key...",
    'Encapsulating shared secret (ML-KEM-768)...',
    'Encrypting file (AES-256-GCM)...',
    'Signing encrypted payload (ML-DSA-65)...',
    'Uploading to vault...',
  ]

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  function formatFileSize(bytes) {
    if (!bytes) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB']
    let value = bytes
    let unitIndex = 0

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024
      unitIndex += 1
    }

    return `${value.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`
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

    if (!parsed?.mlDsaPrivKey || !parsed?.mlKemPrivKey) {
      navigate('/recover-keys')
      throw new Error('Stored private keys are incomplete. Redirecting to Key Recovery.')
    }

    return parsed
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!selectedFile || !recipientUsername) return

    setError('')
    setCurrentStep(0)
    setUploading(true)

    try {
      // Step 1: Fetch recipient's public key
      const recipient = await api.getUserKeys(recipientUsername)
      setCurrentStep(1)

      // Step 2: Encapsulate shared secret
      const { sharedSecret, kemCiphertext } = await crypto.encapsulateSecret(
        recipient.ml_kem_pub_key
      )
      setCurrentStep(2)

      // Step 3: Encrypt file
      const fileBuffer = await selectedFile.arrayBuffer()
      const { encryptedBlob, nonce } = await crypto.encryptFile(fileBuffer, sharedSecret)
      setCurrentStep(3)

      // Step 4: Sign encrypted payload
      const privateKeys = getPrivateKeysOrThrow()
      const signature = await crypto.signData(encryptedBlob, privateKeys.mlDsaPrivKey)
      setCurrentStep(4)

      // Step 5: Upload
      const response = await api.uploadFile(
        recipientUsername,
        encryptedBlob,
        kemCiphertext,
        nonce,
        signature,
        selectedFile.name
      )

      setFileId(response.file_id)
      setUploading(false)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Upload failed')
      setUploading(false)
      setCurrentStep(0)
    }
  }

  if (fileId) {
    return (
      <VaultLayout activeNav="send-file" title="Send Secure File" subtitle="Encryption completed and file stored safely in the vault.">
        <div className="w-full max-w-md mx-auto">
          <div className="card-panel p-8 text-center">
            <div className="icon-chip mx-auto mb-4">
              <CheckCircleIcon className="h-8 w-8" />
            </div>
            <h2 className="title-section mb-4">File Uploaded Successfully</h2>
            <p className="mb-2 text-sm text-muted">File ID</p>
            <p className="surface-soft mb-6 break-all p-3 font-mono text-xs">
              {fileId}
            </p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary w-full">
              Back to Dashboard
            </button>
          </div>
        </div>
      </VaultLayout>
    )
  }

  return (
    <VaultLayout
      activeNav="send-file"
      title="Send Secure File"
      subtitle="Encrypt with ML-KEM + AES-GCM and sign with ML-DSA before upload."
    >
      <div className="w-full">
        <div className="card-panel p-8 md:p-10">
          <div className="mb-6 flex items-center gap-3">
            <div className="icon-chip p-2">
              <UploadIcon className="h-5 w-5" />
            </div>
            <h2 className="title-section">Encryption & Upload</h2>
          </div>

          {error && (
            <div className="status-box status-error">
              <AlertTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-6">
            <div>
              <label className="label-text">Recipient Username</label>
              <input
                type="text"
                value={recipientUsername}
                onChange={(e) => setRecipientUsername(e.target.value)}
                disabled={uploading}
                className="input-field"
                placeholder="Enter recipient's username"
                required
              />
            </div>

            <div>
              <label className="label-text">Select File</label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />

              <div className="surface-soft p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-main">
                      {selectedFile ? selectedFile.name : 'No file selected'}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {selectedFile ? `${formatFileSize(selectedFile.size)} • Ready for encryption` : 'Choose any file to encrypt and send securely'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="btn-neutral w-full md:w-auto"
                  >
                    {selectedFile ? 'Replace File' : 'Choose File'}
                  </button>
                </div>
              </div>

            </div>

            <button
              type="submit"
              disabled={uploading || !selectedFile || !recipientUsername}
              className="btn-primary w-full"
            >
              {uploading ? (
                <>
                  <SpinnerIcon />
                  Processing
                </>
              ) : (
                'Encrypt & Upload'
              )}
            </button>
          </form>

          {uploading && (
            <div className="surface-soft mt-8 space-y-2 p-4">
              <div className="mb-3 flex items-center gap-2">
                <DocumentLockIcon className="h-4 w-4 text-muted" />
                <h3 className="text-sm font-semibold">Encryption Process</h3>
              </div>
              {steps.map((step, index) => (
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
      </div>
    </VaultLayout>
  )
}
