import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { X } from 'lucide-react'

interface AuthDialogProps {
  mode: 'login' | 'register'
  redirect?: string
  title: string
  description: string
  children: ReactNode
}

const tabClassName =
  'inline-flex min-h-11 items-center px-4 text-xl ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

export function AuthDialog({ mode, redirect, title, description, children }: AuthDialogProps) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (!dialog.open) dialog.showModal()

    return () => {
      dialog.close()
    }
  }, [])

  function close() {
    void router.navigate({ to: '/', search: {} })
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      className={[
        'fixed inset-0 m-auto h-dvh max-h-none w-screen max-w-none overflow-y-auto',
        'bg-background text-foreground backdrop:bg-black/70',
        'lg:top-[clamp(1rem,15dvh,8.5rem)] lg:bottom-auto lg:mx-auto lg:mt-0 lg:mb-0',
        'lg:h-auto lg:max-h-[calc(100dvh-clamp(1rem,15dvh,8.5rem)-1rem)] lg:w-125',
        'lg:rounded-lg lg:border-b-8 lg:border-primary lg:bg-card',
        mode === 'register' ? 'lg:min-h-164' : 'lg:min-h-150',
      ].join(' ')}
    >
      <div className="relative flex min-h-full flex-col gap-10 px-7 pt-20 pb-6 lg:gap-6 lg:px-20 lg:pt-12 lg:pb-12">
        <button
          type="button"
          onClick={close}
          aria-label="Fechar"
          className="absolute top-4 right-4 hidden size-8 items-center justify-center text-primary focus-visible:outline-2 focus-visible:outline-primary lg:inline-flex"
        >
          <X aria-hidden="true" size={24} strokeWidth={1.5} />
        </button>

        <p aria-hidden="true" className="text-center text-2xl font-bold tracking-widest lg:hidden">
          KURIO
        </p>

        <h1 id={titleId} className="text-center text-lg font-bold lg:sr-only">
          {title}
        </h1>

        <nav aria-label="Entrar ou criar conta" className="hidden items-center justify-center lg:flex">
          <Link
            to="/login"
            search={{ redirect }}
            aria-current={mode === 'login' ? 'page' : undefined}
            className={`${tabClassName} ${mode === 'login' ? 'text-primary' : 'text-foreground'}`}
          >
            Entrar
          </Link>

          <span aria-hidden="true" className="h-6 w-px bg-primary" />

          <Link
            to="/register"
            search={{ redirect }}
            aria-current={mode === 'register' ? 'page' : undefined}
            className={`${tabClassName} ${mode === 'register' ? 'text-primary' : 'text-foreground'}`}
          >
            Criar conta
          </Link>
        </nav>

        <p className="hidden text-center text-sm lg:block">{description}</p>

        {children}
      </div>
    </dialog>
  )
}