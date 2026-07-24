import type { JSX, PropsWithChildren } from 'react'

interface ModalProps {
  open: boolean
  title?: string
  onClose: () => void
}

export function Modal({
  open,
  title,
  onClose,
  children
}: PropsWithChildren<ModalProps>): JSX.Element | null {
  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <header>
          {title && <h2>{title}</h2>}
          <button type="button" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
