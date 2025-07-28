import { AnimationPlaybackControlsWithThen } from 'motion'
import { ComponentChildren, createContext, Key, VNode } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { castArray } from 'radashi'
import { getElementForVNode } from './internal/vnode'
import { vnodeToPresence } from './vnodeCaches'

export interface PresenceSubscription {
  callback: PresenceCallback
  remove: () => void
}

export type PresenceCallback = (
  leavingElement: Element
) => AnimationPlaybackControlsWithThen | null | void

export type PresenceContext = {
  isInitial: boolean
  enterDelay: number | undefined
  keys: Key[]
  nodes: VNode[]
  leaveAnimations: Map<string, AnimationPlaybackControlsWithThen>
  subscriptions: Set<PresenceSubscription>
  subscribe: (callback: PresenceCallback) => PresenceSubscription
}

export const PresenceContext = createContext<PresenceContext>(null!)

export function AnimatePresence(props: {
  /**
   * Delay `enter` animations if `leave` animations are in progress.
   */
  enterDelay?: number
  children: ComponentChildren
}) {
  const [context] = useState((): PresenceContext => {
    return {
      isInitial: true,
      enterDelay: undefined,
      keys: [],
      nodes: [],
      leaveAnimations: new Map(),
      subscriptions: new Set(),
      subscribe(callback) {
        const subscription = {
          callback,
          remove: () => {
            this.subscriptions.delete(subscription)
          },
        }
        this.subscriptions.add(subscription)
        return subscription
      },
    }
  })

  context.enterDelay = props.enterDelay

  useEffect(() => {
    context.isInitial = false
  }, [])

  const prevNodes = context.nodes
  const prevKeys = context.keys

  const nextNodes: VNode[] = (context.nodes = [])
  const nextKeys: Key[] = (context.keys = [])

  const children = castArray(props.children)
  children.forEach((child, index) => {
    if (isVNode(child)) {
      // If a key is not defined, assume the order never changes.
      nextKeys.push(child.key ?? '__' + index)
      nextNodes.push(child)

      if (typeof child.type === 'string' && 'animate' in child.props) {
        vnodeToPresence.set(child, context)
      }
    }
  })

  const forceUpdate = useForceUpdate()
  const leavingNodes = prevNodes.filter((prevNode, index) => {
    const prevKey = prevKeys[index]
    if (nextKeys.includes(prevKey)) {
      return false
    }

    let animation: AnimationPlaybackControlsWithThen | null | void =
      context.leaveAnimations.get(prevKey)

    if (!animation) {
      const prevElement = getElementForVNode(prevNode)
      if (!prevElement?.isConnected) {
        return false
      }
      for (const subscription of context.subscriptions.values()) {
        animation = subscription.callback(prevElement)
        if (animation) {
          context.leaveAnimations.set(prevKey, animation)
          animation.then(() => {
            context.leaveAnimations.delete(prevKey)
            subscription.remove()
            forceUpdate()
          })
        }
      }
    }

    if (animation) {
      // Preserve this node in the DOM.
      nextKeys.push(prevKey)
      nextNodes.push(prevNode)
      return true
    }
  })

  return (
    <PresenceContext value={context}>
      {[...leavingNodes, ...children]}
    </PresenceContext>
  )
}

function useForceUpdate() {
  const [, setState] = useState(0)
  return () => setState(state => state + 1)
}

function isVNode(value: any): value is VNode {
  return (
    value !== null &&
    typeof value === 'object' &&
    'type' in value &&
    'props' in value
  )
}
