import type {
  AnimationPlaybackControlsWithThen,
  TransformProperties,
  ValueAnimationWithDynamicDelay,
} from 'motion'
import { Ref } from 'preact'
import { CSSProperties } from 'preact/compat'
import { SUPPORTED_OPTIONS } from './constants'
import { falsy } from './internal/types'

export type DOMKeyframesDefinition = Omit<
  import('motion').DOMKeyframesDefinition,
  keyof TransformProperties | `transition${string}`
>

export type AnimationRef = Ref<AnimationPlaybackControlsWithThen>

type UncheckedPick<T, K> = { [P in keyof T as Extract<P, K>]: T[P] }

type MotionMiniOptions = UncheckedPick<
  ValueAnimationWithDynamicDelay,
  keyof typeof SUPPORTED_OPTIONS
>

/** @deprecated Use `TransitionFn` instead. */
export type AnimationOptionsFn = TransitionFn

export type TransitionFn = (prop: string) => MotionMiniOptions

export type TransitionOptions = MotionMiniOptions & {
  [K in keyof DOMKeyframesDefinition]?: MotionMiniOptions
}

export interface AnimationOptions extends MotionMiniOptions {
  /**
   * Receive the animation controls.
   */
  ref?: AnimationRef
  /**
   * Customize the animation options for each style property.
   */
  transition?: TransitionFn | TransitionOptions
}

export type AnimationProps = DOMKeyframesDefinition & AnimationOptions

// This animation updates on render.
export type AnimateRenderProps = AnimationProps & {
  /**
   * If defined, the animation will only be updated when this key changes.
   */
  key?: string
}

export type EventAnimationProps = AnimationProps & {
  /**
   * Define the animation that occurs when the event is no longer active. By
   * default, the initial keyframes from the *event animation* are used, along
   * with its animation options. If this option is defined, nothing from the
   * event animation is used.
   */
  reverse?: AnimationProps
}

export type LeaveAnimationProps = AnimationProps & {
  reverse?: true
}

export type EnterAnimationCallback = (
  isInitial: boolean | undefined
) => AnimationProps

// These animations update on lifecycle events.
export type AnimateLifecycleProps = {
  /**
   * The initial style values to be applied before mounting.
   */
  initial?: CSSProperties | falsy
  /**
   * Animate when this element is re-rendered.
   */
  update?: AnimateRenderProps | falsy
  /**
   * Animate when this element is added to the DOM.
   *
   * If you pass a callback, it will receive `true` to indicate this element is
   * mounting at the same time as its `AnimatePresence` parent. This allows you
   * to define a different animation for the first mount.
   */
  enter?: AnimationProps | EnterAnimationCallback | falsy
  /**
   * Animate before this element is removed from the DOM.
   */
  leave?:
    | LeaveAnimationProps
    | ((element: HTMLElement) => LeaveAnimationProps | falsy)
    | falsy
  /**
   * Animate when this element is hovered on.
   */
  whileHover?: EventAnimationProps | falsy
  /**
   * Animate when this element is focused.
   */
  whileFocus?: EventAnimationProps | falsy
  /**
   * Animate when this element is pressed on.
   */
  whilePress?: EventAnimationProps | falsy
}

export type AnimateProp = AnimateRenderProps | AnimateLifecycleProps
