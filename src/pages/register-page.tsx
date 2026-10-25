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
import { registerRequest } from '@/lib/auth-api'
import { startSession } from '@/lib/session'
import { validateRegister } from '@/lib/validation'

export function RegisterPage() {
  const router = useRouter()
  const search = useSearch({ from: '/register' })
  const formRef = useRef<HTMLFormElement>(null)

  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  function focusFirstInvalid() {
    requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    })
  }

  const mutation = useMutation({
    mutationFn: registerRequest,
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

    const nextErrors = validateRegister(values)
    setErrors(nextErrors)
    setFormError(null)

    if (Object.keys(nextErrors).length > 0) {
      focusFirstInvalid()
      return
    }

    mutation.mutate({
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
    })
  }

  return (
    <AuthDialog
      mode="register"
      redirect={search.redirect}
      title="Criar perfil de colecionador"
      description="Crie seu perfil de colecionador e conecte uma carteira quando quiser."
    >
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <TextField
          label="Nome de usuário"
          hideLabel
          name="name"
          autoComplete="username"
          placeholder="Nome de usuário"
          value={values.name}
          onChange={(event) => setValues({ ...values, name: event.target.value })}
          error={errors.name}
        />

        <TextField
          label="E-mail"
          hideLabel
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Digite seu e-mail"
          value={values.email}
          onChange={(event) => setValues({ ...values, email: event.target.value })}
          error={errors.email}
        />

        <PasswordField
          label="Senha"
          hideLabel
          name="password"
          autoComplete="new-password"
          placeholder="Senha"
          value={values.password}
          onChange={(event) => setValues({ ...values, password: event.target.value })}
          error={errors.password}
        />

        <PasswordField
          label="Confirmar senha"
          hideLabel
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Confirmar senha"
          value={values.confirmPassword}
          onChange={(event) => setValues({ ...values, confirmPassword: event.target.value })}
          error={errors.confirmPassword}
        />

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
          {mutation.isPending ? (
            'Criando…'
          ) : (
            <>
              <span className="lg:hidden">Criar perfil</span>
              <span className="hidden lg:inline">Criar conta</span>
            </>
          )}
        </Button>
      </form>

      <SocialBlock />

      <p className="text-center text-sm lg:hidden">
        Já tem uma conta?{' '}
        <Link
          to="/login"
          search={{ redirect: search.redirect }}
          className="text-primary underline underline-offset-4"
        >
          Entre
        </Link>
      </p>
    </AuthDialog>
  )
}