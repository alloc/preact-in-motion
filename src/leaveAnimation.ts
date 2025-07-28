import { VNode } from 'preact'
import { Animation, applyLifecycleAnimation } from './animation'
import { getContextValue } from './internal/context'
import { PresenceContext } from './presence'
import { AnimateLifecycleProps, AnimationProps } from './types'
import { vnodeToPresence } from './vnodeCaches'

export function diffLeaveAnimation(
  dom: HTMLElement,
  vnode: VNode,
  animation: Animation,
  leave: AnimateLifecycleProps['leave'],
  initial: AnimateLifecycleProps['initial']
) {
  if (leave) {
    const presence =
      vnodeToPresence.get(vnode) || getContextValue(PresenceContext)
    if (!presence) {
      console.warn('Cannot use animate.leave without AnimatePresence', dom)
      return
    }

    animation.leaveProp = leave
    animation.leaveSubscription ||= presence.subscribe(leavingElement => {
      if (leavingElement.contains(dom)) {
        let leave = animation.leaveProp
        if (typeof leave === 'function') {
          leave = leave()
        }
        if (!leave) {
          return
        }
        if (leave.reverse) {
          const { reverse, ...leaveWithoutReverse } = leave
          leave = Object.assign(
            leaveWithoutReverse,
            animation.initial || initial
          ) as AnimationProps
        }
        return applyLifecycleAnimation(dom, animation, leave)
      }
    })
  } else if (animation.leaveSubscription) {
    animation.leaveSubscription.remove()
    animation.leaveSubscription = null
    animation.leaveProp = null
  }
}
