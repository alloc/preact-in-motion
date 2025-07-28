import { VNode } from 'preact'
import {
  Animation,
  applyLifecycleAnimation,
  applyUpdateAnimation,
} from './animation'
import { diffEventAnimation } from './eventAnimation'
import { getContextValue } from './internal/context'
import { hook, PrivateHook } from './internal/hook'
import { getElementForVNode } from './internal/vnode'
import { diffLeaveAnimation } from './leaveAnimation'
import { PresenceContext } from './presence'
import { splitAnimateProp } from './props'
import { AnimateProp } from './types'
import { vnodeToAnimateProp, vnodeToPresence } from './vnodeCaches'

declare module 'preact' {
  namespace JSX {
    interface HTMLAttributes<RefType extends EventTarget> {
      animate?: AnimateProp
    }
  }
}

const animations = new WeakMap<Element, Animation>()

hook(PrivateHook.Diff, (vnode: VNode) => {
  if (typeof vnode.type === 'string' && 'animate' in vnode.props) {
    const { animate, ...props } = vnode.props as any
    vnode.props = props

    vnodeToAnimateProp.set(vnode, animate)
  }
})

hook('diffed', (vnode: VNode) => {
  const dom = getElementForVNode(vnode)
  if (dom) {
    const props = vnodeToAnimateProp.get(vnode)
    if (!props) {
      return
    }

    let animation = animations.get(dom)
    if (!animation) {
      animations.set(
        dom,
        (animation = {
          key: undefined,
          props: null,
          leaveProp: null,
          leaveSubscription: null,
          initial: undefined,
          keyframes: undefined,
          options: undefined,
          controls: null,
          events: null,
        })
      )
    }

    const { lifecycle, ...update } = splitAnimateProp(props)

    if (lifecycle) {
      if (lifecycle.initial && !dom.isConnected) {
        Object.assign(dom.style, lifecycle.initial)
      }
      if (lifecycle.update) {
        applyUpdateAnimation(
          dom,
          animation,
          props,
          splitAnimateProp(lifecycle.update, true),
          lifecycle.initial
        )
      }
      if (lifecycle.enter && !dom.isConnected) {
        const presence =
          vnodeToPresence.get(vnode) || getContextValue(PresenceContext)

        let props = lifecycle.enter
        if (typeof props === 'function') {
          props = props(presence?.isInitial)
        }
        if (presence?.enterDelay && presence.leaveAnimations.size > 0) {
          props = { ...props, delay: presence.enterDelay }
        }

        applyLifecycleAnimation(dom, animation, props, lifecycle.initial)
      }
      diffLeaveAnimation(
        dom,
        vnode,
        animation,
        lifecycle.leave,
        lifecycle.initial
      )
      diffEventAnimation(
        dom,
        animation,
        lifecycle.whileHover,
        'pointerenter',
        'pointerleave'
      )
      diffEventAnimation(
        dom,
        animation,
        lifecycle.whileFocus,
        'focusin',
        'focusout'
      )
      diffEventAnimation(
        dom,
        animation,
        lifecycle.whilePress,
        'pointerdown',
        'pointerup'
      )
    }
    // If no lifecycle animations are passed, default to an "update" animation.
    else {
      applyUpdateAnimation(dom, animation, props, update)
    }
  }
})

hook('unmount', (vnode: VNode) => {
  const dom = getElementForVNode(vnode)
  if (dom) {
    const animation = animations.get(dom)
    animation?.leaveSubscription?.remove()
  }
})

export { animate } from 'motion/mini'

export { AnimatePresence } from './presence'

export type * from './types'
