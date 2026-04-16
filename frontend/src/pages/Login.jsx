import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as api from '../api'
import { AlertTriangleIcon, ShieldLockIcon, SpinnerIcon, UserIcon } from '../icons'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.login(username, password)

      const rawPrivateKeys = localStorage.getItem('privateKeys')
      let hasLocalKeys = false
      if (rawPrivateKeys) {
        try {
          const parsed = JSON.parse(rawPrivateKeys)
          hasLocalKeys = Boolean(parsed?.mlKemPrivKey && parsed?.mlDsaPrivKey)
        } catch {
          hasLocalKeys = false
        }
      }

      if (!hasLocalKeys) {
        navigate('/recover-keys')
        return
      }

      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
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
              <UserIcon className="h-5 w-5" />
            </div>
            <h2 className="title-section">Sign In</h2>
          </div>

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
                placeholder="Your username"
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
                placeholder="Your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-2 w-full"
            >
              {loading ? (
                <>
                  <SpinnerIcon />
                  Signing in
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="link-accent">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
