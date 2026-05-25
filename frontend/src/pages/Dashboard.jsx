import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as api from '../api'
import { InboxIcon, UploadIcon } from '../icons'
import VaultLayout from '../components/VaultLayout'

export default function Dashboard() {
  const navigate = useNavigate()
  const [now, setNow] = useState(() => new Date())
  const username = localStorage.getItem('username')
  const [searchParams] = useSearchParams()
  const tab = searchParams.get('tab')
  const activeNav = tab === 'history' || tab === 'settings' ? tab : 'dashboard'
  const [stats, setStats] = useState({ total_files_shared: 0, files_received: 0 })
  const [loadingStats, setLoadingStats] = useState(true)
  const [statsError, setStatsError] = useState('')
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])
  useEffect(() => {
    let isMounted = true
    async function loadStats() {
      try {const vaultStats = await api.getVaultStats()
        if (isMounted) {
          setStats(vaultStats)
          setStatsError('')
        }
      } catch (err) {
        if (err?.response?.status === 401) {
          api.logout()
          navigate('/login', { replace: true })
          return
        }

        if (isMounted) {
          setStats({ total_files_shared: 0, files_received: 0 })
          setStatsError('Unable to load live stats right now.')
        }
      } finally {
        if (isMounted) {
          setLoadingStats(false)
        }
      }
    }

    loadStats()

    return () => {
      isMounted = false
    }
  }, [])

  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const timeLabel = now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })

  const timeZoneLabel =
    new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' })
      .formatToParts(now)
      .find((part) => part.type === 'timeZoneName')?.value || ''

  return (
    <VaultLayout
      activeNav={activeNav}
      title={`Welcome back, ${username}.`}
      subtitle="Here's what's happening with your vault today."
    >
      {activeNav === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="card-panel p-6">
              <p className="text-sm text-muted mb-2">Total Files Shared</p>
              <p className="text-3xl font-bold text-main">
                {loadingStats ? '-' : stats.total_files_shared}
              </p>
            </div>
            <div className="card-panel p-6">
              <p className="text-sm text-muted mb-2">Files Received</p>
              <p className="text-3xl font-bold text-main">
                {loadingStats ? '-' : stats.files_received}
              </p>
            </div>
            <div className="card-panel p-6">
              <p className="text-sm text-muted mb-2">Date & Time</p>
              <p className="mt-4 text-sm font-medium uppercase tracking-wide text-main">{dateLabel}</p>
              <div className="mt-1 flex items-end gap-2">
                <p className="text-[2rem] leading-none font-semibold tracking-tight text-main [font-variant-numeric:tabular-nums]">
                  {timeLabel}
                </p>
                <p className="pb-1 text-xs text-muted">{timeZoneLabel}</p>
              </div>
            </div>
          </div>

          {statsError ? (
            <p className="text-sm text-muted">{statsError}</p>
          ) : null}

          <div className="card-panel p-6">
            <h3 className="text-lg font-semibold mb-4">Zero-Knowledge Protection Model</h3>
            <p className="text-sm text-muted">
              Files are encrypted in your browser before upload. The server never sees your file content or encryption keys. Your private keys exist only locally.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="card-panel p-8 transition-all hover:-translate-y-0.5">
              <div className="icon-chip mb-4">
                <UploadIcon className="h-6 w-6" />
              </div>
              <h4 className="mb-2 text-lg font-bold">Send File</h4>
              <p className="mb-6 text-sm text-muted">
                Encrypt and send a file securely to another user using post-quantum cryptography.
              </p>
              <button onClick={() => navigate('/upload')} className="btn-primary w-full">
                Send File
              </button>
            </div>

            <div className="card-panel p-8 transition-all hover:-translate-y-0.5">
              <div className="icon-chip mb-4">
                <InboxIcon className="h-6 w-6" />
              </div>
              <h4 className="mb-2 text-lg font-bold">Inbox</h4>
              <p className="mb-6 text-sm text-muted">
                View and decrypt files that have been shared with you. Signatures are verified automatically.
              </p>
              <button onClick={() => navigate('/inbox')} className="btn-neutral w-full">
                View Inbox
              </button>
            </div>
          </div>
        </div>
      )}

      {activeNav === 'history' && (
        <div className="card-panel p-6">
          <h3 className="text-lg font-semibold mb-4">Transfer History</h3>
          <p className="text-sm text-muted">No transfer history yet.</p>
        </div>
      )}

      {activeNav === 'settings' && (
        <div className="card-panel p-6">
          <h3 className="text-lg font-semibold mb-4">Settings</h3>
          <div className="space-y-4">
            <div className="pb-4 border-b" style={{ borderColor: 'var(--line)' }}>
              <p className="font-semibold text-main">Username</p>
              <p className="text-sm text-muted mt-1">{username}</p>
            </div>
            <button onClick={() => navigate('/recover-keys')} className="btn-primary">
              Recover Private Keys
            </button>
          </div>
        </div>
      )}
    </VaultLayout>
  )
}
