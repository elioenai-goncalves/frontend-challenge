const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateLogin(values: { email: string; password: string }): Record<string, string> {
  const errors: Record<string, string> = {}
  const email = values.email.trim()

  if (!email) errors.email = 'Informe seu e-mail.'
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Informe um e-mail válido.'
  if (!values.password) errors.password = 'Informe sua senha.'

  return errors
}

export function validateRegister(values: {
  name: string
  email: string
  password: string
  confirmPassword: string
}): Record<string, string> {
  const errors: Record<string, string> = {}
  const email = values.email.trim()

  if (values.name.trim().length < 2) errors.name = 'Informe seu nome de usuário.'
  if (!email) errors.email = 'Informe seu e-mail.'
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Informe um e-mail válido.'
  if (values.password.length < 8) errors.password = 'A senha deve ter ao menos 8 caracteres.'
  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'As senhas não conferem.'
  }

  return errors
}