import { useEffect, useId, useRef, useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { LogOut, User as UserIcon, Wallet } from 'lucide-react'

import type { User } from '@/contracts/api'
import { logout } from '@/lib/session'

const itemClassName =
  'flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-left text-sm ' +
  'hover:bg-background focus-visible:outline-2 focus-visible:outline-primary'

export function UserMenu({ user }: { user: User }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  async function handleLogout() {
    setOpen(false)
    await logout()
    await router.invalidate()
    await router.navigate({ to: '/', search: {} })
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className={[
          'inline-flex min-h-9 items-center gap-2 rounded-button bg-card px-3 text-sm font-bold',
          'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary',
        ].join(' ')}
      >
        <span
          aria-hidden="true"
          className="inline-flex size-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground"
        >
          {user.name.trim().charAt(0).toUpperCase()}
        </span>
        <span className="max-w-32 truncate">{user.name}</span>
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute right-0 z-20 mt-2 w-56 rounded-md border border-border bg-card p-2"
        >
          <Link to="/profile" onClick={() => setOpen(false)} className={itemClassName}>
            <UserIcon aria-hidden="true" size={18} strokeWidth={1.5} />
            Perfil
          </Link>

          <Link to="/wallets" onClick={() => setOpen(false)} className={itemClassName}>
            <Wallet aria-hidden="true" size={18} strokeWidth={1.5} />
            Carteiras
          </Link>

          <button type="button" onClick={handleLogout} className={itemClassName}>
            <LogOut aria-hidden="true" size={18} strokeWidth={1.5} />
            Sair
          </button>
        </div>
      )}
    </div>
  )
}