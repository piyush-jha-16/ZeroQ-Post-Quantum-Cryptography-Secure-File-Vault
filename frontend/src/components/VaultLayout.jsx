import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../api'
import { ArrowLeftIcon, DocumentLockIcon, InboxIcon, KeyIcon, ShieldLockIcon, SignOutIcon, UploadIcon } from '../icons'

const SIDEBAR_STATE_KEY = 'zeroq_sidebar_collapsed'

export default function VaultLayout({ activeNav, title, subtitle, children }) {
  const navigate = useNavigate()
  const username = localStorage.getItem('username')
  const userInitial = username ? username.charAt(0).toUpperCase() : 'U'
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_STATE_KEY) === '1')

  function handleLogout() {
    api.logout()
    navigate('/login')
  }

  function toggleSidebar() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(SIDEBAR_STATE_KEY, next ? '1' : '0')
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
    <div className="flex h-screen bg-black">
      <aside
        className={`relative bg-[#050505] border-r border-[#1c1c1c] flex flex-col transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="p-5 border-b border-[#1c1c1c]">
          <div className="flex items-start justify-between gap-2">
            <div className={collapsed ? 'hidden' : 'block'}>
              <h1 className="text-xl font-extrabold text-white tracking-tight">ZeroQ</h1>
              <p className="text-xs text-muted">Quantum Secure Vault</p>
            </div>
            <button
              onClick={toggleSidebar}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#111111] text-[#cfcfcf] transition hover:bg-[#1a1a1a]"
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
                className={`w-full flex items-center rounded-lg transition-all ${
                  collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3 text-sm'
                } ${
                  isActive
                    ? 'bg-[#151515] text-white font-semibold border border-[#2a2a2a]'
                    : 'text-muted hover:bg-[#101010] hover:text-[#e6e6e6]'
                }`}
              >
                <IconComponent className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        <div className="px-3 py-4 space-y-2 border-t border-[#1c1c1c]">
          {bottomNavItems.map((item) => {
            const IconComponent = item.icon
            const isActive = activeNav === item.id
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                title={item.label}
                className={`w-full flex items-center rounded-lg transition-all ${
                  collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3 text-sm'
                } ${
                  isActive
                    ? 'bg-[#151515] text-white font-semibold border border-[#2a2a2a]'
                    : 'text-muted hover:bg-[#101010] hover:text-[#e6e6e6]'
                }`}
              >
                <IconComponent className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            )
          })}
          <button
            onClick={handleLogout}
            title="Logout"
            className={`w-full flex items-center rounded-lg text-[#ef5350] hover:bg-[#101010] transition-all ${
              collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3 text-sm'
            }`}
          >
            <SignOutIcon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <div className="bg-[#050505] border-b border-[#1c1c1c] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-[1.55rem] font-semibold tracking-tight text-white">{title}</h2>
            {subtitle ? <p className="text-xs text-muted mt-1.5">{subtitle}</p> : null}
          </div>
          <div
            title={username || 'User'}
            className="flex items-center justify-center h-10 w-10 rounded-full border border-[#2a2a2a] bg-[#111111] text-[#e5e5e5] text-sm font-semibold"
          >
            {userInitial}
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </div>
  )
}