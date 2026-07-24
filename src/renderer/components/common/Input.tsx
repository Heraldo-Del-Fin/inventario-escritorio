import type { InputHTMLAttributes, JSX } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, id, ...rest }: InputProps): JSX.Element {
  return (
    <label className="input-field" htmlFor={id}>
      {label && <span>{label}</span>}
      <input id={id} {...rest} />
    </label>
  )
}
