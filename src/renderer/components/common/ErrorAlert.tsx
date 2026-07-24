import type { JSX } from 'react'
import { Alert } from 'antd'

interface ErrorAlertProps {
  mensaje: string | null | undefined
}

export function ErrorAlert({ mensaje }: ErrorAlertProps): JSX.Element | null {
  if (!mensaje) return null
  return <Alert type="error" message={mensaje} showIcon className="mb-4" />
}
