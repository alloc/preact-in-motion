# preact-in-motion

[![NPM version](https://img.shields.io/npm/v/preact-in-motion.svg?style=flat&colorA=080f12&colorB=1fa669)](https://www.npmjs.com/package/preact-in-motion)
[![License](https://img.shields.io/github/license/alloc/preact-in-motion.svg?style=flat&colorA=080f12&colorB=1fa669)](https://github.com/alloc/preact-in-motion/blob/main/LICENSE)
[![Bundle size](https://deno.bundlejs.com/badge?q=preact-in-motion@latest)](https://bundlejs.com/?q=preact-in-motion)

This package uses the [Preact Options API](https://preactjs.com/guide/v10/options/) to introduce an `animate` prop to every native element (e.g. `<div>`, `<span>`, `<button>`, etc.). It uses the `motion/mini` package to animate the elements. To understand which features of Motion are supported, see [this comparison table](https://motion.dev/docs/feature-comparison#comparison-table).

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/alloc/preact-in-motion/tree/examples?file=src/pages/index.tsx)

## Installation

Choose your package manager, then install this package and the `motion` package.

Note: If you're using `preact@beta`, you must install `preact-in-motion@beta`.

- **PNPM**

  ```
  pnpm add preact-in-motion motion
  ```

- **Bun**

  ```
  bun add preact-in-motion motion
  ```

- **Yarn**

  ```
  yarn add preact-in-motion motion
  ```

- **NPM**
  ```
  npm install preact-in-motion motion
  ```

## Usage

Always import the package, so it can install itself into Preact at runtime.

```ts
import 'preact-in-motion'
```

Now you can define the `animate` prop on any **host element** (e.g. `<div>`, `<span>`, `<button>`, including SVG elements).

```tsx
// Animate the opacity when a boolean changes on rerender.
<div animate={{
  opacity: visible ? 1 : 0,
}}>
```

When the element's parent component is re-rendered, the keyframes will be diffed. If any keyframes are different, a new animation will be scheduled.

Animation options (e.g. `duration`, `ease`, etc) may be defined next to the keyframes. [See the Motion docs for details.](https://motion.dev/docs/animate#options)

```tsx
import { easeInOut } from 'motion'

<div animate={{
  opacity: visible ? 1 : 0,
  duration: 1,
  ease: easeInOut,
}}>
```

### Property-specific options

You may set a `transition` function to customize the animation options for each style property.

```tsx
<div animate={{
  opacity: visible ? 1 : 0,
  transform: `scale(${visible ? 1 : 0.5})`,
  transition: prop => ({
    duration: prop === 'opacity' ? 1 : 0.2,
  }),
}}>
```

Alternatively, the `transition` prop can be set to an object, with property-specific options.

```tsx
// Identical to the previous example.
<div animate={{
  opacity: visible ? 1 : 0,
  transform: `scale(${visible ? 1 : 0.5})`,
  transition: {
    duration: 0.2,
    opacity: { duration: 1 },
  },
}}>
```

### Lifecycle animations

The following event-driven animations are supported:

- `initial`
  Style values to be applied before mounting.
- `update`
  Animate when this element is re-rendered.
- `enter`
  Animate when this element is added to the DOM.
- `leave`
  Animate before this element is removed from the DOM. (must use `<AnimatePresence>`)
- `whileHover`
  Animate when this element is hovered on.
- `whileFocus`
  Animate when this element is focused.
- `whilePress`
  Animate when this element is pressed on.

```tsx
<div animate={{
  // Start out invisible.
  initial: {
    opacity: 0,
  },
  // Fade in when added to the DOM.
  enter: {
    opacity: 1,
  },
  // Scale up while hovered over.
  whileHover: {
    transform: 'scale(1.1)',
    duration: 0.2,
  },
}}>
```

### AnimatePresence

To animate an element before unmounting it, you must wrap the element or its parent component with an `<AnimatePresence>` element.

```tsx
<AnimatePresence>
  {visible && (
    <h1
      animate={{
        // Fade out before unmounting.
        leave: {
          opacity: 0,
        },
      }}>
      Fade Into Obscurity
    </h1>
  )}
</AnimatePresence>
```

If the children of `AnimatePresence` could possibly be reordered or toggled (i.e. `isHappy` in the example below), you must set a `key` prop on each element. Note that conditionally mounting a child with `{visible && (...)}` does _not_ require a `key` prop to be set (in this case, the child's index is used as the default key).

Additionally, you may use the `enterDelay` prop on `AnimatePresence` to force “enter animations” to wait. This delay is only applied when a “leave animation” is in progress, making it useful for smooth transitions between elements.

```tsx
<AnimatePresence enterDelay={0.3}>
  {isHappy ? (
    <span
      key="happy"
      animate={{
        initial: { transform: 'translateX(50px)', opacity: 0 },
        enter: { transform: 'translateX(0)', opacity: 1 },
        leave: { reverse: true },
      }}>
      😄 I'm happy!
    </span>
  ) : (
    <span
      key="sad"
      animate={{
        initial: { transform: 'translateX(-50px)', opacity: 0 },
        enter: { transform: 'translateX(0)', opacity: 1 },
        leave: { reverse: true },
      }}>
      😢 I'm sad...
    </span>
  )}
</AnimatePresence>
```

You may set `reverse: true` on the `leave` prop to copy keyframes from the `initial` prop.

### Easing

Easing functions are provided by the `motion` package.

- **Spring animations** ([docs](https://motion.dev/docs/spring))

  ```tsx
  import { spring } from 'motion'

  <div animate={{
    transform: 'scale(1.1)',
    type: spring,
    bounce: 1,
    duration: 3,
  }}>
  ```

- **Easing functions** ([docs](https://motion.dev/docs/easing-functions))

  The `ease` prop accepts a function, pre-defined string, or a cubic bezier array (e.g. `[0.25, 0.1, 0.25, 1]`).

  ```tsx
  import { easeInOut } from 'motion'

  <div animate={{
    transform: 'scale(1.1)',
    ease: easeInOut,
  }}>
  ```

  These easing functions can be imported from `motion`:
  - `cubicBezier`
  - `easeIn` / `easeOut` / `easeInOut`
  - `backIn` / `backOut` / `backInOut`
  - `circIn` / `circOut` / `circInOut`
  - `anticipate`
  - `steps`

## License

MIT
