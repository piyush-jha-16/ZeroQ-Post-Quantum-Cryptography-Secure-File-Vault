import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../api'
import * as crypto from '../crypto'
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  KeyIcon,
  ShieldLockIcon,
  SpinnerIcon,
} from '../icons'

export default function RecoverKeys() {
  const navigate = useNavigate()
  const [recoverySecret, setRecoverySecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const rawPrivateKeys = localStorage.getItem('privateKeys')
    if (!rawPrivateKeys) {
      setChecking(false)
      return
    }

    try {
      const parsed = JSON.parse(rawPrivateKeys)
      if (parsed?.mlKemPrivKey && parsed?.mlDsaPrivKey) {
        navigate('/dashboard')
        return
      }
    } catch {
      // Continue to recovery flow if local cache is malformed.
    }

    setChecking(false)
  }, [navigate])

  async function handleRecover(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const backup = await api.getKeyBackup()
      const restored = await crypto.decryptPrivateKeysFromBackup(
        backup.encrypted_private_keys,
        backup.key_salt,
        backup.key_nonce,
        recoverySecret
      )

      localStorage.setItem('privateKeys', JSON.stringify(restored))
      setSuccess('Private keys restored successfully. Redirecting to dashboard...')
      setTimeout(() => navigate('/dashboard'), 700)
    } catch (err) {
      const detail = err.response?.data?.detail
      if (detail) {
        setError(detail)
      } else if (err.name === 'OperationError') {
        setError('Recovery secret is invalid. Please try again.')
      } else {
        setError(err.message || 'Failed to recover private keys.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="app-shell flex items-center justify-center p-4">
        <div className="card-panel w-full max-w-md p-8 text-center">
          <SpinnerIcon className="mx-auto h-6 w-6 animate-spin text-[#84c8ab]" />
          <p className="mt-3 text-sm text-muted">Checking local key state...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="shell-container flex items-center gap-3 py-4">
          <button onClick={() => navigate('/login')} className="btn-neutral px-3 py-2">
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Recover Private Keys</h1>
        </div>
      </div>

      <div className="shell-container py-8">
        <div className="mx-auto w-full max-w-md card-panel p-8">
          <div className="mb-5 flex items-start gap-3">
            <div className="rounded-xl border border-[#33433e] bg-[#1f2926] p-2 text-[#89cfb0]">
              <ShieldLockIcon className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted">
              This browser does not have your private keys yet. Use your recovery secret to decrypt
              your encrypted key backup.
            </p>
          </div>

          {error && (
            <div className="status-box status-error">
              <AlertTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="status-box status-success">
              <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{success}</p>
            </div>
          )}

          <form onSubmit={handleRecover} className="space-y-4">
            <div>
              <label className="label-text">Recovery Secret</label>
              <input
                type="password"
                value={recoverySecret}
                onChange={(e) => setRecoverySecret(e.target.value)}
                disabled={loading}
                className="input-field"
                placeholder="Enter recovery secret"
                required
              />
            </div>

            <div className="rounded-xl border border-[#2f3a37] bg-[#1b2321] px-4 py-3 text-xs text-muted">
              <div className="flex items-start gap-2">
                <KeyIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#7fcaab]" />
                <p>
                  The server stores only encrypted key ciphertext. Decryption happens only in your
                  browser.
                </p>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <>
                  <SpinnerIcon />
                  Recovering keys
                </>
              ) : (
                'Recover Keys'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
