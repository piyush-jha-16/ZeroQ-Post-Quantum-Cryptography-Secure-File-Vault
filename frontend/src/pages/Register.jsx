import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as api from '../api'
import * as crypto from '../crypto'
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  KeyIcon,
  ShieldLockIcon,
  SpinnerIcon,
  UserPlusIcon,
} from '../icons'

export default function Register() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [recoverySecret, setRecoverySecret] = useState('')
  const [confirmRecoverySecret, setConfirmRecoverySecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState('input') // 'input' | 'generating' | 'securing' | 'registering'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (recoverySecret.length < 10) {
      setError('Recovery secret must be at least 10 characters long.')
      return
    }

    if (recoverySecret !== confirmRecoverySecret) {
      setError('Recovery secret confirmation does not match.')
      return
    }

    setLoading(true)
    setStep('generating')

    try {
      // Step 1: Generate keypairs
      const keyPairs = await crypto.generateKeyPairs()

      // Step 2: Store private keys in localStorage with warning
      localStorage.setItem(
        'privateKeys',
        JSON.stringify({
          mlKemPrivKey: keyPairs.mlKem.privateKey,
          mlDsaPrivKey: keyPairs.mlDsa.privateKey,
        })
      )

      setStep('securing')

      // Step 3: Encrypt private keys for secure backup (ciphertext only)
      const encryptedBackup = await crypto.encryptPrivateKeysForBackup(
        {
          mlKemPrivKey: keyPairs.mlKem.privateKey,
          mlDsaPrivKey: keyPairs.mlDsa.privateKey,
        },
        recoverySecret
      )

      setStep('registering')

      // Step 4: Register with public keys + encrypted key backup
      await api.register(
        username,
        password,
        keyPairs.mlKem.publicKey,
        keyPairs.mlDsa.publicKey,
        encryptedBackup.encryptedPrivateKeys,
        encryptedBackup.keySalt,
        encryptedBackup.keyNonce
      )

      // Redirect to login
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Registration failed')
      setStep('input')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2f3c38] bg-[#1b2421] text-[#86d1b1]">
            <ShieldLockIcon className="h-7 w-7" />
          </div>
          <h1 className="title-main">ZeroQ</h1>
          <p className="text-xs text-muted">Quantum Secure Vault</p>
        </div>

        <div className="card-panel p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg border border-[#33433e] bg-[#1f2926] p-2 text-[#89cfb0]">
              <UserPlusIcon className="h-5 w-5" />
            </div>
            <h2 className="title-section">Create Account</h2>
          </div>

          {step !== 'input' && (
            <div className="status-box status-warning">
              <AlertTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
              <p>
                Your private keys are stored locally. Clearing browser data will make stored files
                unrecoverable.
              </p>
            </div>
          )}

          {step === 'generating' && (
            <div className="status-box status-info">
              <SpinnerIcon className="mt-0.5 h-5 w-5 shrink-0 animate-spin" />
              <p>Generating post-quantum keypairs...</p>
            </div>
          )}

          {step === 'securing' && (
            <div className="status-box status-info">
              <SpinnerIcon className="mt-0.5 h-5 w-5 shrink-0 animate-spin" />
              <p>Encrypting private key backup...</p>
            </div>
          )}

          {step === 'registering' && (
            <div className="status-box status-success">
              <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
              <p>Creating account...</p>
            </div>
          )}

          {error && (
            <div className="status-box status-error">
              <AlertTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-text">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="input-field"
                placeholder="Choose a username"
                required
              />
            </div>

            <div>
              <label className="label-text">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="input-field"
                placeholder="Strong password"
                required
              />
            </div>

            <div>
              <label className="label-text">Recovery Secret</label>
              <input
                type="password"
                value={recoverySecret}
                onChange={(e) => setRecoverySecret(e.target.value)}
                disabled={loading}
                className="input-field"
                placeholder="Used to recover keys on new browsers"
                required
              />
            </div>

            <div>
              <label className="label-text">Confirm Recovery Secret</label>
              <input
                type="password"
                value={confirmRecoverySecret}
                onChange={(e) => setConfirmRecoverySecret(e.target.value)}
                disabled={loading}
                className="input-field"
                placeholder="Retype recovery secret"
                required
              />
            </div>

            <div className="rounded-xl border border-[#2f3a37] bg-[#1b2321] px-4 py-3 text-xs text-muted">
              <div className="flex items-start gap-2">
                <KeyIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#7fcaab]" />
                <p>
                  Public keys are sent to the server. Private keys are also stored as encrypted
                  backup ciphertext, recoverable only with your recovery secret.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-2 w-full hover:opacity-90 active:scale-95 transition-all duration-150"
            >
              {loading ? (
                <>
                  <SpinnerIcon />
                  Processing
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="link-accent">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
