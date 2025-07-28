import {
  AMBIGUOUS_LITERALS,
  COLOR_PROPS,
  DIGIT_REGEX,
  LIFECYCLE_PROPS,
  NON_ANIMATABLE_PROPS,
  SUPPORTED_OPTIONS,
} from './constants'
import {
  AnimateLifecycleProps,
  AnimateProp,
  AnimationOptions,
  AnimationRef,
  DOMKeyframesDefinition,
} from './types'

export type UpdateAnimationProps = {
  assigned?: Record<string, string>
  keyframes?: DOMKeyframesDefinition
  options?: AnimationOptions | Record<string, AnimationOptions>
  key?: string
  ref?: AnimationRef
}

export function splitAnimateProp(props: AnimateProp): UpdateAnimationProps & {
  lifecycle?: AnimateLifecycleProps
}

export function splitAnimateProp(
  props: AnimateProp,
  skipLifecycle: true
): UpdateAnimationProps

export function splitAnimateProp(props: any, skipLifecycle?: boolean) {
  let assigned: any
  let keyframes: any
  let options: any
  let optionsFn: ((prop: string) => any) | undefined
  let lifecycle: any
  let key: string | undefined
  let ref: any

  for (const name in props) {
    const value = props[name]
    if (value === undefined) {
      continue
    }
    if (name === 'ref') {
      ref = value
    } else if (name === 'transition') {
      if (typeof value === 'function') {
        optionsFn = value
      } else {
        optionsFn = prop => value[prop]

        for (const name in value) {
          if (name in SUPPORTED_OPTIONS) {
            options ??= {}
            options[name] = value[name]
          }
        }
      }
    } else if (name === 'key') {
      key = value
    } else if (name in SUPPORTED_OPTIONS) {
      options ??= {}
      options[name] = value
    } else if (name in LIFECYCLE_PROPS) {
      if (!skipLifecycle) {
        lifecycle ??= {}
        lifecycle[name] = value
      }
    } else if (
      name in NON_ANIMATABLE_PROPS ||
      (typeof value === 'string' &&
        !(name in COLOR_PROPS) &&
        !(value in AMBIGUOUS_LITERALS) &&
        !DIGIT_REGEX.test(value))
    ) {
      assigned ??= {}
      assigned[name] = value
    } else {
      keyframes ??= {}
      keyframes[name] = value
    }
  }

  if (optionsFn && keyframes) {
    const defaultOptions = { ...options }
    options = {}

    for (const prop in keyframes) {
      options[prop] = {
        ...defaultOptions,
        ...optionsFn(prop),
      }
    }
  }

  return {
    assigned,
    keyframes,
    options,
    lifecycle,
    key,
    ref,
  }
}
