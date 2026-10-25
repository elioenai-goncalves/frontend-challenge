import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> {
  label: string
  error?: string
  hideLabel?: boolean
  trailing?: ReactNode
}

export function TextField({ label, error, hideLabel = false, trailing, ...props }: TextFieldProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'text-sm font-bold'}>
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={[
            'h-10 w-full rounded-md border bg-background/40 px-3 text-sm text-foreground',
            'placeholder:text-text-secondary',
            'focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2',
            'focus-visible:outline-primary',
            trailing ? 'pr-11' : '',
            error ? 'border-destructive' : 'border-border',
          ].join(' ')}
          {...props}
        />

        {trailing && (
          <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>
        )}
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}