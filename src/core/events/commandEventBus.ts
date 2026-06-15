import type { CommandEvent, CommandEventListener } from './commandCenterEvents'

export type CommandEventBus = {
  emit: (event: CommandEvent) => void
  subscribe: (listener: CommandEventListener) => () => void
}

export const createCommandEventBus = (): CommandEventBus => {
  const listeners = new Set<CommandEventListener>()

  return {
    emit: (event) => {
      listeners.forEach((listener) => listener(event))
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
