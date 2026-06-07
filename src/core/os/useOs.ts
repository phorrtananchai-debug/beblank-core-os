import { useContext } from 'react'
import { OsContext } from './osContextObject'

export const useOs = () => {
  const context = useContext(OsContext)
  if (!context) {
    throw new Error('useOs must be used within OsProvider')
  }
  return context
}
