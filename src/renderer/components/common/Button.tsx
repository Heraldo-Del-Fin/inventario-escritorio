import type { ButtonHTMLAttributes, JSX } from 'react'

type Variant = 'primary' | 'secondary' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({ variant = 'primary', className, ...rest }: ButtonProps): JSX.Element {
  return (
    <button className={['btn', `btn-${variant}`, className].filter(Boolean).join(' ')} {...rest} />
  )
}
