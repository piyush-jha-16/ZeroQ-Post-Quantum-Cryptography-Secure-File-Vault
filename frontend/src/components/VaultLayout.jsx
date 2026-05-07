import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../api'
import { ArrowLeftIcon, DocumentationIcon, DocumentLockIcon, InboxIcon, KeyIcon, MoonIcon, ShieldLockIcon, SignOutIcon, SunIcon, UploadIcon } from '../icons'

const SIDEBAR_STATE_KEY = 'zeroq_sidebar_collapsed'
const THEME_STATE_KEY = 'zeroq_theme'

export default function VaultLayout({ activeNav, title, subtitle, children }) {
  const navigate = useNavigate()
  const username = localStorage.getItem('username')
  const userInitial = username ? username.charAt(0).toUpperCase() : 'U'
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_STATE_KEY) === '1')
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_STATE_KEY) || 'dark')
  const [isThemeAnimating, setIsThemeAnimating] = useState(false)
  const [turnDirection, setTurnDirection] = useState('to-light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_STATE_KEY, theme)
  }, [theme])

  function handleLogout() {
    api.logout()
    navigate('/login')
  }

  function toggleSidebar() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(SIDEBAR_STATE_KEY, next ? '1' : '0')
  }

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTurnDirection(nextTheme === 'light' ? 'to-light' : 'to-dark')
    setIsThemeAnimating(true)
    setTheme(nextTheme)
    window.setTimeout(() => setIsThemeAnimating(false), 720)
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: ShieldLockIcon, onClick: () => navigate('/dashboard') },
    { id: 'inbox', label: 'Inbox', icon: InboxIcon, onClick: () => navigate('/inbox') },
    { id: 'send-file', label: 'Send File', icon: UploadIcon, onClick: () => navigate('/upload') },
    { id: 'history', label: 'History', icon: DocumentLockIcon, onClick: () => navigate('/dashboard?tab=history') },
  ]

  const bottomNavItems = [
    { id: 'settings', label: 'Settings', icon: KeyIcon, onClick: () => navigate('/dashboard?tab=settings') },
  ]

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--bg-0)', color: 'var(--text-0)' }}>
      <aside
        className={`relative border-r flex flex-col transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
        style={{ backgroundColor: 'var(--bg-1)', borderColor: 'var(--line)' }}
      >
        <div className="p-5 border-b" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-start justify-between gap-2">
            <div className={collapsed ? 'hidden' : 'block'}>
              <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-0)' }}>ZeroQ</h1>
              <p className="text-xs text-muted">Quantum Secure Vault</p>
            </div>
            <button
              onClick={toggleSidebar}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border transition"
              style={{ borderColor: 'var(--line)', backgroundColor: 'var(--bg-2)', color: 'var(--text-1)' }}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ArrowLeftIcon className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-2">
          {navItems.map((item) => {
            const IconComponent = item.icon
            const isActive = activeNav === item.id
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                title={item.label}
                className={`w-full flex items-center rounded-lg transition-all duration-200 hover:bg-opacity-60 ${
                  collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3 text-sm'
                }`}
                style={isActive
                  ? {
                      backgroundColor: 'var(--nav-active-bg)',
                      color: 'var(--text-0)',
                      fontWeight: 600,
                      border: '1px solid var(--line)',
                    }
                  : {
                      color: 'var(--text-1)',
                      border: '1px solid transparent',
                      backgroundColor: 'transparent',
                    }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(21, 21, 21, 0.5)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <IconComponent className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        <div className="px-3 py-4 space-y-2 border-t" style={{ borderColor: 'var(--line)' }}>
          {bottomNavItems.map((item) => {
            const IconComponent = item.icon
            const isActive = activeNav === item.id
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                title={item.label}
                className={`w-full flex items-center rounded-lg transition-all duration-200 hover:bg-opacity-60 ${
                  collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3 text-sm'
                }`}
                style={isActive
                  ? {
                      backgroundColor: 'var(--nav-active-bg)',
                      color: 'var(--text-0)',
                      fontWeight: 600,
                      border: '1px solid var(--line)',
                    }
                  : {
                      color: 'var(--text-1)',
                      border: '1px solid transparent',
                      backgroundColor: 'transparent',
                    }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(21, 21, 21, 0.5)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <IconComponent className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            )
          })}
          <button
            onClick={handleLogout}
            title="Logout"
            className={`w-full flex items-center rounded-lg text-[#ef5350] hover:bg-red-500 hover:bg-opacity-10 transition-all duration-200 ${
              collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3 text-sm'
            }`}
          >
            <SignOutIcon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <div className="border-b px-6 py-5 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-1)', borderColor: 'var(--line)' }}>
          <div className="flex-1">
            <h2 className="text-2xl font-bold tracking-tight leading-tight" style={{ color: 'var(--text-0)' }}>{title}</h2>
            {subtitle ? <p className="text-sm text-muted mt-2">{subtitle}</p> : null}
          </div>
          <div className="flex items-center gap-4 ml-6">
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border transition hover:bg-opacity-80 duration-200"
              style={{ borderColor: 'var(--line)', backgroundColor: 'var(--bg-2)', color: 'var(--text-1)' }}
            >
              {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
            <div
              aria-hidden="true"
              className="h-8 w-px"
              style={{ backgroundColor: 'var(--line)' }}
            />
            <div
              title={username || 'User'}
              className="flex items-center justify-center h-10 w-10 rounded-full border text-sm font-semibold transition hover:bg-opacity-80 duration-200"
              style={{ borderColor: 'var(--line)', backgroundColor: 'var(--bg-2)', color: 'var(--text-0)' }}
            >
              {userInitial}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>

      <div
        aria-hidden="true"
        className={`theme-turn-overlay ${turnDirection} ${isThemeAnimating ? 'is-active' : ''}`}
      />
    </div>
  )
}