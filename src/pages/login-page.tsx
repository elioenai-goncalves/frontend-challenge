import { useRef, useState, type FormEvent } from 'react'
import { Link, useRouter, useSearch } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'

import { AuthDialog } from '@/components/auth/auth-dialog'
import { SocialBlock } from '@/components/auth/social-block'
import { Button } from '@/components/ui/button'
import { PasswordField } from '@/components/ui/password-field'
import { TextField } from '@/components/ui/text-field'
import { getApiErrorMessage } from '@/lib/api-client'
import { getFieldErrors } from '@/lib/api-errors'
import { loginRequest } from '@/lib/auth-api'
import { startSession } from '@/lib/session'
import { validateLogin } from '@/lib/validation'

export function LoginPage() {
  const router = useRouter()
  const search = useSearch({ from: '/login' })
  const formRef = useRef<HTMLFormElement>(null)

  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  function focusFirstInvalid() {
    requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    })
  }

  const mutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      startSession(data)
      router.history.push(search.redirect ?? '/')
    },
    onError: (error) => {
      const fieldErrors = getFieldErrors(error)
      setErrors(fieldErrors)
      setFormError(Object.keys(fieldErrors).length > 0 ? null : getApiErrorMessage(error))
      focusFirstInvalid()
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validateLogin(values)
    setErrors(nextErrors)
    setFormError(null)

    if (Object.keys(nextErrors).length > 0) {
      focusFirstInvalid()
      return
    }

    mutation.mutate({ email: values.email.trim(), password: values.password })
  }

  return (
    <AuthDialog
      mode="login"
      redirect={search.redirect}
      title="Entrar"
      description="Entre para gerenciar sua carteira, coleção e perfil de criador."
    >
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <TextField
          label="E-mail"
          hideLabel
          name="email"
          type="email"
          autoComplete="email"
          placeholder="contato@email.com"
          value={values.email}
          onChange={(event) => setValues({ ...values, email: event.target.value })}
          error={errors.email}
        />

        <PasswordField
          label="Senha"
          hideLabel
          name="password"
          autoComplete="current-password"
          placeholder="Senha"
          value={values.password}
          onChange={(event) => setValues({ ...values, password: event.target.value })}
          error={errors.password}
        />

        <span
          aria-disabled="true"
          title="Recuperação de senha indisponível nesta demonstração"
          className="cursor-not-allowed self-end text-sm text-primary/60"
        >
          Esqueceu a senha?
        </span>

        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}

        <Button
          type="submit"
          disabled={mutation.isPending}
          aria-busy={mutation.isPending}
          className="mt-3 h-11 w-full"
        >
          {mutation.isPending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <SocialBlock />

      <p className="text-center text-sm lg:hidden">
        Novo na Kurio?{' '}
        <Link
          to="/register"
          search={{ redirect: search.redirect }}
          className="text-primary underline underline-offset-4"
        >
          Crie uma conta
        </Link>
      </p>
    </AuthDialog>
  )
}