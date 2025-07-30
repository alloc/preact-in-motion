import { Context } from 'preact'
import { currentComponent } from './currentComponent'

export function getContextValue<T>(provider: Context<T>): T | undefined {
  if (currentComponent) {
    const key = (provider as any).__c
    // Check context of the current component.
    if (currentComponent.context[key]) {
      return currentComponent.context[key].props.value
    }
    // Check if the current component is the provider we're looking for.
    if (currentComponent.constructor === provider.Provider) {
      return currentComponent.props.value
    }
    // Return the default value
    return (provider as any).__
  }
}
