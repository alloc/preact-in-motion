import { VNode } from 'preact'
import { getComponentForVNode } from './vnode'

export let currentComponent: any = null

let componentStack: any[] = []

export function storeCurrentComponent(vnode: VNode) {
  componentStack.push(currentComponent)
  currentComponent = getComponentForVNode(vnode)
}

export function popCurrentComponent(vnode: VNode) {
  if (currentComponent && currentComponent === getComponentForVNode(vnode)) {
    currentComponent = componentStack.pop()
  }
}
