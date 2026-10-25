import { useState, type ComponentProps } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { TextField } from '@/components/ui/text-field'

type PasswordFieldProps = Omit<ComponentProps<typeof TextField>, 'type' | 'trailing'>

export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const Icon = visible ? EyeOff : Eye

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
          className="inline-flex size-8 items-center justify-center text-text-secondary focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Icon aria-hidden="true" size={18} strokeWidth={1.5} />
        </button>
      }
    />
  )
}