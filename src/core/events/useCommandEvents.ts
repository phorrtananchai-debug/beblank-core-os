import { useMemo } from 'react'
import { useOs } from '../os/useOs'
import type { CommandEvent, CommandEventInput } from './commandCenterEvents'

export const useCommandEvents = () => {
  const { commandEvents, publishCommandEvent, clearCommandEvents, subscribeToCommandEvents } = useOs()

  const helpers = useMemo(() => ({
    byCategory: (category: CommandEvent['category']) => commandEvents.filter((event) => event.category === category),
    byType: (type: CommandEvent['type']) => commandEvents.filter((event) => event.type === type),
    publish: (input: CommandEventInput) => publishCommandEvent(input),
  }), [commandEvents, publishCommandEvent])

  return {
    commandEvents,
    clearCommandEvents,
    subscribeToCommandEvents,
    ...helpers,
  }
}
