import type { ReactNode } from 'react'
import type { ActionRequest } from '../../types/models'

type InvestmentActionButtonProps = {
  actionType: string
  description: string
  payload: Record<string, unknown>
  createActionRequest: (input: Omit<ActionRequest, 'id' | 'requestedAt' | 'requestedBy' | 'requiresApproval'>) => void
  disabled?: boolean
  label: string
  variant?: 'primary' | 'secondary'
  module?: 'finance' | 'ai'
}

export const InvestmentActionButton = ({
  actionType,
  description,
  payload,
  createActionRequest,
  disabled = false,
  label,
  variant = 'secondary',
  module = 'finance',
}: InvestmentActionButtonProps): ReactNode => (
  <button
    className={variant === 'primary' ? 'btn-primary' : 'btn-secondary'}
    type="button"
    disabled={disabled}
    onClick={() => createActionRequest({ module, actionType, description, payload })}
  >
    {label}
  </button>
)
