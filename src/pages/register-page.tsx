import { useRef, useState, type FormEvent } from 'react'
import { Link, useRouter, useSearch } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
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

  const [values, setValues] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

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
      requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      })
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validateRegister(values)
    setErrors(nextErrors)
    setFormError(null)

    if (Object.keys(nextErrors).length > 0) {
      requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      })
      return
    }

    mutation.mutate({
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
    })
  }

  return (
    <section className="mx-auto w-full max-w-md rounded-lg border border-border bg-card p-6">
      <h1 className="text-2xl font-bold">Criar conta</h1>

      <p className="mt-2 text-sm text-text-secondary">
        Cadastre-se para começar a colecionar.
      </p>

      <form ref={formRef} onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
        <TextField
          label="Nome"
          name="name"
          autoComplete="name"
          value={values.name}
          onChange={(event) => setValues({ ...values, name: event.target.value })}
          error={errors.name}
        />

        <TextField
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(event) => setValues({ ...values, email: event.target.value })}
          error={errors.email}
        />

        <TextField
          label="Senha"
          name="password"
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={(event) => setValues({ ...values, password: event.target.value })}
          error={errors.password}
        />

        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}

        <Button type="submit" disabled={mutation.isPending} aria-busy={mutation.isPending}>
          {mutation.isPending ? 'Criando conta…' : 'Criar conta'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-text-secondary">
        Já tem conta?{' '}
        <Link
          to="/login"
          search={{ redirect: search.redirect }}
          className="text-primary underline underline-offset-4"
        >
          Entrar
        </Link>
      </p>
    </section>
  )
}