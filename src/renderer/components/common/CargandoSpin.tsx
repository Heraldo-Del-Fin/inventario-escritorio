import type { JSX } from 'react'
import { Spin } from 'antd'

export function CargandoSpin(): JSX.Element {
  return (
    <div className="flex justify-center py-16">
      <Spin size="large" />
    </div>
  )
}
