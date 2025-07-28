import { AnimationPlaybackControlsWithThen } from 'motion'
import { animate } from 'motion/mini'
import { EventAnimation } from './eventAnimation'
import { PresenceSubscription } from './presence'
import { splitAnimateProp, UpdateAnimationProps } from './props'
import {
  AnimateLifecycleProps,
  AnimationOptions,
  AnimationProps,
  AnimationRef,
  DOMKeyframesDefinition,
} from './types'

// Internal animation state.
export interface Animation {
  /** The current animation key. */
  key: string | undefined
  /** The last animation props seen by this node. */
  props: AnimationProps | null
  /** Stable reference to the current "leave" prop. */
  leaveProp: AnimateLifecycleProps['leave']
  /** The callback used to subscribe to the presence context. */
  leaveSubscription: PresenceSubscription | null
  /**
   * The initial values of the node. This property only exists to improve the
   * functionality of the `leave.reverse` option.
   */
  initial: Record<string, any> | undefined
  /**
   * The last keyframes this node was animated with. This property is not used
   * for lifecycle animations (except `update`).
   */
  keyframes: DOMKeyframesDefinition | undefined
  /**
   * The last animation options this node was animated with.
   */
  options: AnimationOptions | undefined
  /** The controls of the last animation. */
  controls: AnimationPlaybackControlsWithThen | null
  /** Event-driven animation state. */
  events: {
    [startEvent: string]: EventAnimation
  } | null
}

function assignImmediateValues(
  dom: HTMLElement,
  assigned: Record<string, any>
) {
  if (dom.isConnected) {
    requestAnimationFrame(() => Object.assign(dom.style, assigned))
  } else {
    Object.assign(dom.style, assigned)
  }
}

function applyAnimation(
  dom: HTMLElement,
  animation: Animation,
  keyframes: DOMKeyframesDefinition,
  options: AnimationOptions | Record<string, AnimationOptions> | undefined,
  initial: AnimateLifecycleProps['initial'],
  ref: AnimationRef | undefined
) {
  if (!dom.isConnected) {
    animation.initial = initial = { ...initial }
    for (const key in keyframes) {
      if (initial[key] !== undefined) {
        continue
      }

      const prop = key as never
      const keyframe = keyframes[prop]

      let value: any
      if (Array.isArray(keyframe)) {
        const duration =
          options &&
          (prop in options
            ? (options as Record<string, AnimationOptions>)[prop]
            : (options as AnimationOptions)
          ).duration

        value = keyframe[duration != null && duration <= 0 ? 1 : 0]
      } else {
        value = keyframe
      }

      // If the value is null, it means the keyframe will be inferred from the
      // computed style, so we don't know its value here.
      if (value !== null) {
        dom.style[prop] = initial[prop] = value
      }
    }
  }
  setAnimationControls(animation, animate(dom, keyframes, options), ref)
}

export function applyUpdateAnimation(
  dom: HTMLElement,
  animation: Animation,
  props: AnimationProps,
  { assigned, keyframes, options, key, ref }: UpdateAnimationProps,
  initial?: AnimateLifecycleProps['initial']
) {
  const needsUpdate =
    key === undefined
      ? !shallowPropertiesEqual(keyframes, animation.keyframes)
      : key !== animation.key

  if (!needsUpdate) {
    return
  }

  animation.key = key
  animation.props = props
  animation.keyframes = keyframes
  animation.options = options

  if (assigned) {
    assignImmediateValues(dom, assigned)
  }
  if (keyframes) {
    applyAnimation(dom, animation, keyframes, options, initial, ref)
  } else {
    stopAnimation(animation, ref)
  }
}

export function applyLifecycleAnimation(
  dom: HTMLElement,
  animation: Animation,
  props: AnimationProps,
  initial?: AnimateLifecycleProps['initial']
) {
  const { assigned, keyframes, options, ref } = splitAnimateProp(props, true)

  animation.props = props
  animation.options = options

  if (assigned) {
    assignImmediateValues(dom, assigned)
  }
  if (keyframes) {
    applyAnimation(dom, animation, keyframes, options, initial, ref)
    return animation.controls
  }
  return null
}

export function stopAnimation(
  animation: Animation,
  ref: AnimationRef | undefined
) {
  if (animation.controls) {
    animation.controls.stop()
    setAnimationControls(animation, null, ref)
  }
}

export function setAnimationControls(
  animation: Animation,
  controls: AnimationPlaybackControlsWithThen | null,
  ref?: AnimationRef | undefined
) {
  animation.controls = controls
  if (ref) {
    setAnimationRef(ref, controls)
    controls?.then(() => {
      if (controls === animation.controls) {
        setAnimationRef(ref, null)
      }
    })
  }
}

function setAnimationRef(
  ref: Exclude<AnimationRef, null>,
  controls: AnimationPlaybackControlsWithThen | null
) {
  if (typeof ref === 'function') {
    ref(controls)
  } else {
    ref.current = controls
  }
}

function shallowPropertiesEqual(left: any, right: any) {
  if (!left && !right) {
    return true
  }
  if (!left || !right) {
    return false
  }
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)
  if (leftKeys.length !== rightKeys.length) {
    return false
  }
  return leftKeys.every(key => Object.is(left[key], right[key]))
}
