# Tinier

Tinier is a library for building tiny reactive components in
JavaScript. Designed with D3.js in mind.

# Development status

Tinier is Alpha software. It runs, but expect bugs and some changes to the API.

# Documentation

## Usage

Tinier is available as a UMD module on unpkg:

- http://unpkg.com/tinier/lib/tinier.js
- http://unpkg.com/tinier/lib/tinier.min.js

And it is on NPM:

https://www.npmjs.com/package/tinier

## Components

Tinier components are created with the `createComponent` function.

```javascript
MyComponent = createComponent({
  displayName: 'MyComponent',
})
```

The `run` function binds a Tinier component to the DOM and renders it.

```javascript
var el = document.getElementById('my-container')
run(MyComponent, el)
```

## Lifecycle

Components render when one of the following conditions is met:

1. A new instance of a component is created.
2. The binding (`el`) for a component is different than the last time it
   rendered.
3. The `shouldUpdate` function returns `true`.

To decide whether a component renders when (1) and (2) are false, you can pass a
function to the `shouldUpdate` option of `createComponent`. The default
`shouldUpdate` function follows.  It updates when the state changed based on an
assumption of immutable state object (see the section on Reducers).

```javascript
function shouldUpdate ({ state, lastState }) {
  return state !== lastState
}
```

A stricter approach utilizes the Boolean argument `componentTriggeredUpdate`.
When `componentTriggeredUpdate` is `true`, that means the update was caused by a
reducer of the given component. The following stricter `shouldUpdate` function
calls for an update only if the given component was specifically responsible for
the update. If a child or parent changes state, this `shouldUpdate` function
returns `false`.

```javascript
function shouldUpdate ({ state, lastState, componentTriggeredUpdate }) {
  return componentTriggeredUpdate && state !== lastState
}
```

You can also use `shouldUpdate` to change the rendering behavior with mutable
state objects. For instance, you might check for changes in the values of
essential state attributes.

```javascript
const important_attributes = [ 'value', 'index' ]

function shouldUpdate ({ state, lastState }) {
  return important_attributes.reduce((accum, k) => {
    return accum || state[k] !== lastState[k]
  }, false)
}
```

## Arguments vs. Properties

Tinier generally follows the approach
[taken by React](https://facebook.github.io/react/docs/dom-elements.html) for
dealing with attributes and properties. All properties of a tag in JSX (or
tinier.createElement) are set as attributes with the exception of the following
that have special behavior.

### Boolean attributes

Tinier will convert boolean values to the correct string values required by
attributes. For example, the checked attribute can be set with:

```
<input checked=true />
```

### Autofocus

Instead of autofocus, make a callback with `didMount`:

```javascript
didMount: ({ el }) => {
  el.getElementsByClassName('new-todo')[0].focus()
},
```

Or use the special `then` attribute like this if you want it to run every time
the component renders:

```javascript
<input then={ el => el.focus() } />
```

- [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes)

## API

### tinier.createComponent({ ...args })

Arguments as `args` object:

- *displayName*: `String`, default '' - A display name for the component mainly
  used for debugging.
- *model*:
- *init*: (Object) => Object, Default
- *signalNames*: `[String]`, default `[]` - A list of signal names as strings.
- *interface*: `tinier.Interface | null`, default `null` - A Tinier Interface.
