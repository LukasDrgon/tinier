/* global global */

// public API

import tinier from './tinier'
const arrayOf = tinier.arrayOf
const objectOf = tinier.objectOf
const createComponent = tinier.createComponent
const run = tinier.run
const bind = tinier.bind
const createElement = tinier.createElement
const render = tinier.render

// private API

import {
  ARRAY_OF, OBJECT_OF, COMPONENT, ARRAY, OBJECT, NODE, NULL, TOP, CREATE,
  UPDATE, DESTROY, noop, tail, head, fromPairs, get, isUndefined, isObject,
  isArray, isFunction, mapValues, reduceValues, zipArrays, zipObjects,
  filterValues, any, tagType, checkType, match, hasChildren, makeBindingKey,
  processBindings, updateEl, addressWith, addressEqual, checkState,
  diffWithModelMin, makeTree, makeSignal, makeOneSignalAPI, makeChildSignalsAPI,
  reduceChildren, mergeSignals, makeStateCallers, ELEMENT, BINDING, BINDINGS,
  addressToObj, createDOMElement, getStyles, updateDOMElement,
} from './tinier'

// testing functions

import { describe, it, afterEach } from 'mocha'
import { assert } from 'chai'
import now from 'performance-now'

// DOM setup

import jsdom from 'jsdom'
const document = jsdom.jsdom()
const window = document.defaultView
const el = document.body
global.Element = window.Element
global.Text = window.Text
global.document = document

function mouseClick (el) {
  el.dispatchEvent(new window.MouseEvent('click',
                                         { view: window,
                                           bubbles: true,
                                           cancelable: true }))
}

// constants

const EL1 = 'EL1'
const EL2 = 'EL2'
const TAG = 'TAG'
const _state    = { [TOP]: null }
const _bindings = { [TOP]: null }
const _signals  = { [TOP]: null }
const defStateCallers = makeStateCallers(_state, _bindings, _signals)
const DefComponent = createComponent()
const NestedComponent = createComponent({
  model: {
    hello: arrayOf(createComponent({
      model: {
        friend: createComponent(),
        ghost: 'GHOST',
      }
    }))
  },
})

// tests

describe('tail', () => {
  it('gets first element and rest', () => {
    const [ rest, last ] = tail([ 2, 3, 4 ])
    assert.deepEqual(rest, [ 2, 3 ])
    assert.strictEqual(last, 4)
  })
})

describe('head', () => {
  it('gets first element and rest', () => {
    const [ first, rest ] = head([ 2, 3, 4 ])
    assert.strictEqual(first, 2)
    assert.deepEqual(rest, [ 3, 4 ])
  })
})

describe('fromPairs', () => {
  it('creates an object', () => {
    const res = fromPairs([ [ 'k', 0 ], [ 'j', 1 ] ])
    assert.deepEqual(res, { k: 0, j: 1 })
  })
})

describe('get', () => {
  it('gets a value from an object with a default return value null', () => {
    const object = { a: 10 }
    assert.strictEqual(get(object, 'a'), 10)
    assert.isNull(get(object, 'b'))
  })

  it('gets array indices', () => {
    assert.strictEqual(get([ 0, 1 ], 1, null), 1)
    assert.isNull(get([ 0, 1 ], 2, null))
  })

  it('default for null, undefined, true, false', () => {
    assert.isNull(get(null, 'b'))
    assert.isNull(get(undefined, 'b'))
    assert.isNull(get(true, 'b'))
    assert.isNull(get(false, 'b'))
  })

  it('gives null for strings', () => {
    assert.isNull(get('abc', 2, null))
  })
})

describe('isUndefined', () => {
  it('true for undefined', () => {
    assert.isTrue(isUndefined(undefined))
  })
})

describe('isObject', () => {
  it('is true for object literals', () => {
    assert.isTrue(isObject({ a: 10 }))
  })

  it('is true for array literals', () => {
    assert.isTrue(isObject([ 10 ]))
  })

  it('is false for functions, strings, numbers', () => {
    assert.isFalse(isObject(() => [ 10 ]))
    assert.isFalse(isObject(10))
    assert.isFalse(isObject('10'))
  })
})

describe('isArray', () => {
  it('true for array', () => {
    assert.isTrue(isArray([]))
  })
})

describe('isFunction', () => {
  it('is true for functions', () => {
    assert.isTrue(isFunction(() => {}))
  })

  it('is false for object literals', () => {
    assert.isFalse(isFunction({}))
  })
})

describe('mapValues', () => {
  it('iterates over keys for objects', () => {
    const obj = { a: 1, b: 2 }
    const res = mapValues(obj, (x, k) => k + String(x + 1))
    assert.deepEqual({ a: 'a2', b: 'b3' }, res)
  })
})

describe('reduceValues', () => {
  it('iterates over keys for objects', () => {
    const obj = { a: 1, b: 2 }
    const res = reduceValues(obj, (accum, x, k) => accum + x, 0)
    assert.deepEqual(res, 3)
  })
})

describe('zipArrays', () => {
  it('zips and fills null', () => {
    const arrays = [ [ 1, 2 ], [ 3 ], null ]
    const expect = [ [ 1, 3, null ], [ 2, null, null ] ]
    assert.deepEqual(zipArrays(arrays), expect)
  })
})

describe('zipObjects', () => {
  it('zips objects and fills null', () => {
    const objects = [ { a: 1, b: 2 }, { a: 3, c: 4 }, null ]
    const expect = { a: [ 1, 3, null ], b: [ 2, null, null ], c: [ null, 4, null ] }
    assert.deepEqual(zipObjects(objects), expect)
  })
})

describe('filterValues', () => {
  it('filters an object', () => {
    const obj = { a: 1, b: 2 }
    const res = filterValues(obj, a => a === 1)
    assert.deepEqual(res, { a: 1 })
  })
})

describe('any', () => {
  it('looks for true', () => {
    const ar = [ false, true, false ]
    assert.isTrue(any(ar))
  })

  it('only accepts boolean', () => {
    assert.throws(() => {
      any([ false, false, 1 ])
    })
  })

  it('looks for true; lazy', () => {
    assert.isTrue(any([ false, true, 1 ]))
  })
})

describe('tagType', () => {
  it('returns a new object with the type', () => {
    assert.deepEqual(tagType('TAG', { a: 10 }), { a: 10, type: 'TAG' })
  })

  it('checks for invalid tag', () => {
    assert.throws(() => {
      tagType({ a: 10 }, { b: 20 })
    }, 'First argument must be a string')
  })

  it('checks for object', () => {
    assert.throws(() => {
      tagType('TAG', 'TAG')
    }, 'Second argument must be an object')
  })
})

describe('checkType', () => {
  it('checks for a type tag', () => {
    assert.isTrue(checkType('TAG', { a: 10, type: 'TAG' }))
  })

  it('checks for invalid tag', () => {
    assert.throws(() => {
      checkType({ a: 10 }, { b: 20 })
    }, 'First argument must be a string')
  })

  it('checks for second argument', () => {
    assert.throws(() => {
      checkType('TAG')
    }, 'Bad second argument')
  })
})

describe('match', () => {
  it('tests for tags', () => {
    const result = match(tagType(OBJECT_OF, { a: 10 }), {
      [OBJECT_OF]: (node) => node.a,
    })
    assert.strictEqual(result, 10)
  })

  it('uses NULL for null', () => {
    // LEFTOFF
    const result = match(null, {
      [OBJECT_OF]: (node) => node.a,
      [NULL]: () => null,
    })
    assert.isNull(result)
  })

  it('uses custom default for null', () => {
    const result = match(null, {
      [OBJECT_OF]: (node) => node.a,
    }, () => 10)
    assert.strictEqual(result, 10)
  })

  it('takes extra args', () => {
    const m = {
      [NULL]: (_, { data }) => data
    }
    const result = match(null, m, null, { data: 10 })
    assert.strictEqual(result, 10)
  })

  it('default with extra args', () => {
    const m = {}
    assert.throws(() => {
      match(null, m, null, { data: 10 })
    }, /Unrecognized type in pattern matching/)
  })
})

// describe('interfaces', () => {
//   it('create and check', () => {
//     const Interface = createInterface({
//       state: {
//         a: interfaceTypes.string.default('d1').nullable,
//         b: interfaceTypes.number.default(3),
//         c: interfaceTypes.boolean,
//         d: { e: interfaceTypes.any },
//         f: [ interfaceTypes.null ],
//       },
//       signals: {},
//       reducerNames: [],
//     })
//     const test1 = {
//       a: null,
//       b: 4,
//       c: true,
//       d: { e: 'aa' },
//       f: [ null ],
//     }
//     assert.isTrue(checkInterfaceType(Interface.state, test1))
//   })

//   it('defaults must match type', () => {
//     assert.throws(() => {
//       interfaceTypes.string.default(1)
//     })
//   })
// })

// describe('checkInterfaceType', () => {
//   it('compares strings', () => {
//     assert.isTrue(checkInterfaceType(interfaceTypes.string, 'a'))
//     assert.isFalse(checkInterfaceType(interfaceTypes.string, 0))
//     assert.isFalse(checkInterfaceType(interfaceTypes.string, {}))
//   })

//   it('looks for no argument', () => {
//     assert.isTrue(checkInterfaceType(interfaceTypes.noArgument, (arg => arg)()))
//     assert.isFalse(checkInterfaceType(interfaceTypes.noArgument,
//                                       (arg => arg)(1)))
//   })

//   it('compares nested types -- object', () => {
//     const type = { a: interfaceTypes.string, b: interfaceTypes.number }
//     assert.isTrue(checkInterfaceType(type, { a: '1', b: 1 }))
//     assert.isFalse(checkInterfaceType(type, { b: '1', a: 1 }))
//   })

//   it('compares nested types -- array', () => {
//     const type = [ interfaceTypes.string, { a: interfaceTypes.number } ]
//     assert.isTrue(checkInterfaceType(type, [ '1', { a: 1 } ]))
//     assert.isFalse(checkInterfaceType(type, [ '1', { a: 1 }, 2 ]))
//   })

//   it('accepts any', () => {
//     assert.isTrue(checkInterfaceType(interfaceTypes.any, 0))
//     assert.isTrue(checkInterfaceType(interfaceTypes.any, {}))
//     assert.isTrue(checkInterfaceType(interfaceTypes.any, checkInterfaceType))
//   })
// })

describe('addressWith', () => {
  it('adds a key', () => {
    assert.deepEqual(addressWith([ 'a', 1 ], 'b'), [ 'a', 1, 'b' ])
  })

  it('returns original if key is null', () => {
    assert.deepEqual(addressWith([ 'a', 1 ], null), [ 'a', 1 ])
  })
})

describe('addressEqual', () => {
  it('compares', () => {
    assert.isTrue(addressEqual([ 1, 2 ], [ 1, 2 ]))
    assert.isFalse(addressEqual([ 1, 2 ], [ 1, 3 ]))
  })
})

describe('makeTree', () => {
  it('get traverses arrays and objects', () => {
    const tree = makeTree({ a: [ 0, { b: 10 } ] }, false)
    assert.strictEqual(tree.get([ 'a', 1, 'b' ]), 10)
  })

  it('set sets an object; mutable', () => {
    const tree = makeTree([ 0, { b: 10 } ], true)
    const oldTree = tree.get([])
    const address = [ 1, 'b' ]
    tree.set(address, 20)
    assert.strictEqual(tree.get(address), 20)
    assert.strictEqual(oldTree, tree.get([]))
  })

  it('set sets an object; mutable top level', () => {
    const tree = makeTree([ 0, { b: 10 } ], true)
    tree.set([], 20)
    assert.strictEqual(tree.get([]), 20)
  })

  it('set sets an object; immutable', () => {
    const tree = makeTree([ 0, { b: 10 } ], false)
    const oldTree = tree.get([])
    const address = [ 1, 'b' ]
    tree.set(address, 20)
    assert.strictEqual(tree.get(address), 20)
    assert.notStrictEqual(oldTree, tree.get([]))
  })

  it('set sets an object; immutable in array', () => {
    const tree = makeTree([ 0, { b: 10 } ], false)
    const oldTree = tree.get([])
    tree.set([ 1 ], 20)
    const newTree = tree.get([])
    assert.deepEqual(newTree, [ 0, 20 ])
    assert.notStrictEqual(oldTree, newTree)
  })

  it('sets signals', () => {
    // model: { child1: arrayOf(Child1({ model: { a: [ 0, Child2 ] } })) }
    const signals = makeTree({
      child1: tagType(
        NODE,
        {
          data: { signals: [] },
          children: [ { a: [
            0,
          ] } ],
        }
      ),
    }, true)
    const address = [ 'child1', 0, 'a', 1 ]
    const newSignals = tagType(NODE, { data: { signals: [ TAG ] }, children: [] })
    signals.set(address, newSignals)
    assert.strictEqual(signals.get(address), newSignals)
  })

  it('sets signals at children', () => {
    // model: { child1: Child1({ model: { child2: DefComponent } }) }
    const signals = makeTree({
      child1: tagType(
        NODE,
        {
          data: { signals: [] },
          children: {
            child2: tagType(NODE, { data: { signals: [] }, children: null }),
          },
        }),
    }, true)
    const address = [ 'child1', 'child2' ]
    const newSignals = tagType(NODE, { data: { signals: [ TAG ] }, children: [] })
    signals.set(address, newSignals)
    assert.deepEqual(signals.get(address), newSignals)
  })

  it('traverses arrays, objects, and children', () => {
    // model: { child1: arrayOf(Child1({ model: { a: [ 0, Child2 ] } })) }
    const signals = makeTree({
      child1: tagType(
        NODE,
        {
          data: {
            signals: [],
            bindings: [
              {
                a: [ null, TAG ],
              },
            ],
          },
          children: [
            {
              a: [
                0,
                tagType(
                  NODE,
                  {
                    data: {
                      signals: [TAG],
                      bindings: [],
                    },
                    children: []
                  }
                ),
              ],
            },
          ],
        }
      ),
    }, true)
    const address = [ 'child1', 0, 'a', 1 ]
    assert.strictEqual(signals.get(address).data.signals[0], TAG)
  })
})

describe('checkState', () => {
  it('does nothing for a valid state object', () => {
    const Parent = createComponent({
      model: { child: DefComponent },
    })
    const model = { a: arrayOf(Parent) }
    const state = { a: [ { child: { x: 10 } } ] }
    checkState(model, state)
  })

  it('checks for invalid state shape -- object', () => {
    const Parent = createComponent({
      model: { child: DefComponent },
    })
    const model = { a: arrayOf(Parent) }
    const state = { a: [ { child: [ 10 ] } ] }
    assert.throws(() => {
      checkState(model, state)
    }, /Shape of the new state does not match the model/)
  })

  it('checks for invalid state shape -- array', () => {
    const model = [ DefComponent ]
    const state = { b: [ { x: 10 } ] }
    assert.throws(() => {
      checkState(model, state)
    }, /Shape of the new state does not match the model/)
  })

  it('checks for invalid state shape -- objectOf', () => {
    const model = { a: objectOf(DefComponent) }
    const state = { a: [ { x: 10 } ] }
    assert.throws(() => {
      checkState(model, state)
    }, /Shape of the new state does not match the model/)
  })

  it('checks for invalid state shape -- arrayOf', () => {
    const model = { a: arrayOf(DefComponent) }
    const state = { a: { b: { x: 10 } } }
    assert.throws(() => {
      checkState(model, state)
    }, /Shape of the new state does not match the model/)
  })

  it('allows null -- component', () => {
    const model = { a: DefComponent }
    const state = { a: null }
    checkState(model, state)
  })

  it('allows null -- objectOf', () => {
    const model = { a: objectOf(DefComponent) }
    const state1 = { a: null }
    checkState(model, state1)
    const state2 = { a: { b: null, c: { x: 10 } } }
    checkState(model, state2)
  })

  it('allows null -- arrayOf', () => {
    const model = { a: arrayOf(DefComponent) }
    const state1 = { a: null }
    checkState(model, state1)
    const state2 = { a: [ null, { x: 10 } ] }
    checkState(model, state2)
  })
})

describe('diffWithModelMin', () => {
  it('diffs state by looking at model -- array', () => {
    const component = createComponent({ model: { a: arrayOf(DefComponent) } })
    const lastState = { a: [ { x: 10 }, { x: 10 } ] }
    const state = { a: [ lastState.a[0], { x: 10 }, { x: 12 } ] }
    const { minSignals, minUpdate } = diffWithModelMin(component, state,
                                                       lastState, [], [])
    const expect = tagType(NODE, {
      data: UPDATE,
      children: { a: [
        tagType(NODE, { data: null,   children: {} }),
        tagType(NODE, { data: UPDATE, children: {} }),
        tagType(NODE, { data: CREATE, children: {} }),
      ] }
    })
    assert.deepEqual(minSignals.diff, expect)
    assert.deepEqual(minUpdate.diff, expect)
    assert.deepEqual(minSignals.address, [])
    assert.deepEqual(minUpdate.address, [])
    assert.strictEqual(minSignals.modelNode, component)
    assert.strictEqual(minUpdate.modelNode, component)
  })

  it('diffs state by looking at model -- object nested', () => {
    const Child = createComponent({ model: { a: objectOf(DefComponent) } })
    const model = { e: Child }
    const oldState = { e: { a: { b: { x: 9 },  c: { x: 10 } } } }
    const newState = { e: { a: { c: { x: 11 }, d: { x: 12 } } } }
    const { minSignals, minUpdate } = diffWithModelMin(model, newState,
                                                       oldState, [], [])
    const expect = { e: tagType(NODE, {
      data: UPDATE,
      children: { a: {
        b: tagType(NODE, { data: DESTROY, children: {} }),
        c: tagType(NODE, { data: UPDATE, children: {} }),
        d: tagType(NODE, { data: CREATE, children: {} }),
      } },
    }) }
    assert.deepEqual(minSignals.diff, expect)
    assert.deepEqual(minUpdate.diff, expect)
    assert.deepEqual(minSignals.address, [])
    assert.deepEqual(minUpdate.address, [])
    assert.strictEqual(minSignals.modelNode, model)
    assert.strictEqual(minUpdate.modelNode, model)
  })

  it('null means do not draw', () => {
    const model = { a: [ DefComponent, DefComponent ], b: [ DefComponent ] }
    const oldState = { a: [ { x: 10 }, { x: 12 } ], b: null }
    const newState = { a: [ { x: 11 }, null ], b: null }
    const { minSignals, minUpdate } = diffWithModelMin(model, newState,
                                                       oldState, [], [])
    const expect = {
      a: [
        tagType(NODE,  {data: UPDATE, children: {} }),
        tagType(NODE, { data: DESTROY, children: {} }),
      ],
      b: [
        tagType(NODE, { data: null, children: {} }),
      ]
    }
    assert.deepEqual(minSignals.diff, expect)
    assert.deepEqual(minUpdate.diff, expect)
  })

  it('absent means do not draw', () => {
    const model = { a: { b: DefComponent } }
    const oldState = { a: { b: 10 } }
    const newState = { a: { } }
    const { minSignals, minUpdate } = diffWithModelMin(model, newState,
                                                       oldState, [], [])
    const expect = { a: {
      b: tagType(NODE, { data: DESTROY, children: {} }),
    } }
    assert.deepEqual(minSignals.diff, expect)
    assert.deepEqual(minUpdate.diff, expect)
  })

  it('accepts null for old state', () => {
    const model = { a: arrayOf(DefComponent) }
    const oldState = null
    const newState = { a: [ { x: 11 }, {} ] }
    const { minSignals, minUpdate } = diffWithModelMin(model, newState,
                                                       oldState, [], [])
    const expect = { a: [
      tagType(NODE, { data: CREATE, children: {} }),
      tagType(NODE, { data: CREATE, children: {} }),
    ] }
    assert.deepEqual(minSignals.diff, expect)
    assert.deepEqual(minUpdate.diff, expect)
  })

  it('accepts null for old state 2', () => {
    const component = createComponent({
      model: { child: DefComponent }
    })
    const oldState = null
    const newState = { child: { val: 1 } }
    const { minSignals, minUpdate } = diffWithModelMin(component, newState,
                                                       oldState, [], [])
    const expect = tagType(NODE, {
      data: CREATE,
      children: {
        child: tagType(NODE, { data: CREATE, children: {} }),
      },
    })
    assert.deepEqual(minSignals.diff, expect)
    assert.deepEqual(minUpdate.diff, expect)
  })
})

// -------------------------------------------------------------------
// Update components
// -------------------------------------------------------------------

describe('hasChildren', () => {
  it('checks for children', () => {
    assert.isFalse(hasChildren({}))
    assert.isTrue(hasChildren({ x: DefComponent }))
    assert.isTrue(hasChildren({ x: arrayOf(DefComponent) }))
  })
})

describe('makeBindingKey', () => {
  it('stringifies numbers', () => {
    assert.strictEqual(makeBindingKey(1.2), '1.2')
  })

  it('returns strings', () => {
    assert.strictEqual(makeBindingKey('a'), 'a')
  })

  it('stringifies arrays with escaped commas', () => {
    assert.strictEqual(makeBindingKey([ 'a,', 'b\\', 'c' ]), 'a\\,,b\\\\,c')
  })
})

describe('processBindings', () => {
  it('converts bindings to hash', () => {
    // not every component needs a binding
    const model = { a: DefComponent, b: DefComponent }
    const state = { a: { x: 10 }, b: { x: 20 } }
    const bindings = {
      type: BINDINGS,
      data: [
        [ 'a', EL1 ],
        [ [ 'a', 'b', 3 ], EL2 ],
      ],
    }
    const renderResult = processBindings(bindings, model, state)
    assert.deepEqual(renderResult, { a: EL1, 'a,b,3': EL2 })
  })

  // TODO move these checks downstream to consuming the bindings

  // it('errors if bindings shape does not match', () => {
  //   assert.throws(() => {
  //     const model = { a: arrayOf(DefComponent) }
  //     const state = { a: [ { x: 10 } ] }
  //     const bindings = { type: BINDINGS, data: [ [ 'a', EL1 ] ] }
  //     processBindings(bindings, model, state)
  //   }, /Bindings do not match the model/)
  // })

  // it('errors if bindings shape does not match -- arrayOf', () => {
  //   assert.throws(() => {
  //     const model = { a: arrayOf(DefComponent) }
  //     const state = { a: [ { x: 10 } ] }
  //     const bindings = { type: BINDINGS, data: [ [ 'a', EL1 ] ] }
  //     processBindings(bindings, model, state)
  //   }, /Bindings do not match the model/)
  // })

  // it('errors if bindings shape does not match -- extra array elements', () => {
  //   assert.throws(() => {
  //     const model = { a: arrayOf(DefComponent) }
  //     const state = { a: [ { x: 10 } ] }
  //     const bindings = {
  //       type: BINDINGS,
  //       data: [ [ [ 'a', 0 ], EL1 ], [ [ 'a', 1 ], EL2 ] ],
  //     }
  //     processBindings(bindings, model, state)
  //   }, /Bindings do not match the model/)
  // })

  // it('errors if bindings shape does not match -- extra attributes', () => {
  //   assert.throws(() => {
  //     const model = { a: objectOf(DefComponent) }
  //     const state = { a: { b: { x: 10 } } }
  //     const bindings = {
  //       type: BINDINGS,
  //       data: [ [ [ 'a', 'b' ], EL1 ], [ [ 'a', 'c' ], EL2 ] ],
  //     }
  //     processBindings(bindings, model, state)
  //   }, /Bindings do not match the model/)
  // })
})

describe('updateEl', () => {
  it('returns null if DESTROY', () => {
    const diffVal = DESTROY
    const { renderResult } = updateEl([], DefComponent, {}, diffVal, EL1,
                                      EL1, defStateCallers, {})
    assert.isNull(renderResult)
  })

  it('returns binding', () => {
    const component = createComponent({
      model: ({ c: DefComponent }),
      render: ({ el }) => ({ type: BINDINGS, data: [ [ 'c', el ] ] }),
    })
    const state = { c: {} }
    const diffVal = UPDATE
    const { renderResult } = updateEl([], component, state, diffVal, EL1, EL1,
                                      defStateCallers, {})
    assert.deepEqual(renderResult, { c: EL1 })
  })

  it('accepts null for tinierState', () => {
    const component = createComponent({
      model: ({ c: DefComponent }),
      render: ({ el }) => ({ type: BINDINGS, data: [ [ 'c', el ] ] }),
    })
    const state = { c: {} }
    const diffVal = CREATE
    const { renderResult } = updateEl([], component, state, diffVal, EL1, EL1,
                                      defStateCallers, {})
    assert.deepEqual(renderResult, { c: EL1 })
  })

  it('updates with new el', () => {
    const component = createComponent({
      render: ({ el }) => ({ type: BINDINGS, data: [ [ 'a', el ] ] }),
    })
    const state = { c: {} }
    const diffVal = UPDATE
    const { renderResult, lastRenderedEl } = updateEl([], component, state,
                                                      diffVal, EL1, EL2,
                                                      defStateCallers, {})
    assert.deepEqual(renderResult, { a: EL2 })
    assert.strictEqual(lastRenderedEl, EL2)
  })

  it('old el can be null', () => {
    const component = createComponent({
      render: ({ el }) => ({ type: BINDINGS, data: [ [ 'a', el ] ] }),
    })
    const state = { c: {} }
    const diffVal = UPDATE
    const { renderResult, lastRenderedEl } = updateEl([], component, state,
                                                      diffVal, null, EL1,
                                                      defStateCallers, {})
    assert.deepEqual(renderResult, { a: EL1 })
    assert.strictEqual(lastRenderedEl, EL1)
  })

  it('does not call shouldUpdate', () => {
    const component = createComponent({
      render: ({ el }) => 'BAD',
      shouldUpdate: () => { throw new Error('NOPE') },
    })
    const state = { c: {} }
    const diffVal = null
    const { renderResult } = updateEl([], component, state, diffVal, EL1, EL1,
                                      defStateCallers, {})
    assert.isNull(renderResult)
  })
})

describe('makeSignal', () => {
  it('calls multiple listeners', () => {
    let called = 0
    const signal = makeSignal()
    signal.on(x => called += x, [ 'a' ])
    signal.on(x => called += x * 2, [ 'b' ])
    signal.call(2)
    assert.strictEqual(called, 6)
  })
})

describe('makeOneSignalAPI', () => {
  it('stores on functions', () => {
    const sig = makeOneSignalAPI(false)
    let count = 0
    sig.on(({ x }) => { count = x })
    sig._onFns[0]()({ x: 10 })
    assert.strictEqual(count, 10)
  })

  it('stores onEach functions for collections', () => {
    const sig = makeOneSignalAPI(true)
    let count = 0
    // key
    sig.onEach(({ x, k, i }) => {
      assert.isUndefined(i)
      count = k + x
    })
    sig._onFns[0]('key')({ x: 10 })
    assert.strictEqual(count, 'key10')
    // index
    sig.onEach(({ x, k, i }) => {
      assert.isUndefined(k)
      count = i + x
    })
    sig._onFns[1](3)({ x: 10 })
    assert.strictEqual(count, 13)
  })

  it('accepts a new call function', () => {
    const sig = makeOneSignalAPI(false)
    let count = 0
    sig._callFns = [ { fn: ({ x, y }) => count = x + y } ]
    sig.call({ x: 20, y: 30 })
    assert.deepEqual(count, 50)
  })

  it('only accepts a single object argument for on/onEach', () => {
    assert.throws(() => {
      const sig = makeOneSignalAPI(false)
      sig.on(({ x }) => x)
      sig._onFns[0]()(1, 2)
    }, 'On function only accepts a single object as argument.')
  })

  it('only accepts a single object argument for call', () => {
    assert.throws(() => {
      const sig = makeOneSignalAPI(false)
      sig.call(1, 2)
    }, 'Call only accepts a single object as argument.')
  })
})

describe('makeChildSignalsAPI', () => {
  it('keeps model shape', () => {
    const HasSignal = createComponent({
      signalNames: [ 'ribose' ],
    })
    const Parent = createComponent({
      model: {
        deoxy: arrayOf(HasSignal)
      }
    })
    const childSignals = makeChildSignalsAPI(Parent.model)
    let watch = ''
    childSignals.deoxy.ribose.onEach(({ s, i }) => { watch = s + i })
    childSignals.deoxy.ribose._onFns[0](2)({ s: 'S' })
    assert.strictEqual(watch, 'S2')
    // TODO allow return values? e.g. for Promises
  })
})

describe('reduceChildren', () => {
  it('works over nested NODE', () => {
    const obj = {
      child1: tagType(
        NODE,
        {
          data: 3,
          children: [
            {
              a: [
                0,
                tagType(
                  NODE,
                  {
                    data: 2 ,
                    children: []
                  }
                ),
              ],
            },
          ],
        }
      ),
    }
    const fn = (accum, data, address) => accum + data + address[0]
    const res = reduceChildren(obj, fn, 0)
    assert.deepEqual(res, '3child1')
  })
})

describe('mergeSignals', () => {
  it('creates a new signals object', () => {
    // listener
    let valChild1 = ''
    let valChild2 = 0
    let valParent = 0

    // components
    const Child = createComponent({
      displayName: 'Child',

      signalNames: [ 'setParent', 'setChild1', 'setChild2' ],

      signalSetup: ({ signals, methods }) => {
        signals.setChild1.on(methods.setChild1)
        signals.setChild2.on(methods.setChild2)
      },

      methods: {
        setChild1: ({ v }) => { valChild1 += v },
        setChild2: ({ v }) => { valChild2 = v },
      },
    })

    const Parent = createComponent({
      displayName: 'Parent',

      model: { child: arrayOf(Child) },

      signalNames: [ 'setChild1', 'passThrough' ],

      signalSetup: ({ signals, childSignals, methods }) => {
        signals.setChild1.on(childSignals.child.setChild1.call)
        childSignals.child.setParent.onEach(({ v, i }) => {
          methods.setParent({ v: v + i })
        })
        childSignals.child.setParent.onEach(signals.passThrough.call)
      },

      methods: {
        setParent: ({ v }) => { valParent = v }
      },
    })

    // CREATE
    const stateTree    = makeTree({ child: [ {}, {} ] }, false)
    const bindingTree = makeTree(null, true)
    const signalTree  = makeTree(null, true)
    const stateCallers = makeStateCallers(Parent, stateTree, bindingTree,
                                          signalTree)
    const dOut1 = diffWithModelMin(Parent, stateTree.get([]), null, [], [])

    // data
    const signals1 = mergeSignals(Parent, [], dOut1.minSignals.diff,
                                  signalTree.get([]), stateCallers)

    // callSelf
    signals1.children.child[1].data.signals.setChild2.call({ v: 2 })
    assert.strictEqual(valChild2, 2)

    // callChild
    signals1.data.signals.setChild1.call({ v: 'a' })
    assert.strictEqual(valChild1, 'aa')

    // callParent
    signals1.children.child[1].data.signals.setParent.call({ v: 50 })
    assert.strictEqual(valParent, 51)

    // UPDATE
    const localState2 = { child: [ ...stateTree.get([ 'child' ]), {} ] }
    const dOut2 = diffWithModelMin(Parent, localState2, stateTree.get([]),
                                        [], [])
    const signals2 = mergeSignals(Parent, [], dOut2.minSignals.diff, signals1,
                                  stateCallers)

    // child -> parent
    signals2.children.child[2].data.signals.setParent.call({ v: 50 })
    assert.strictEqual(valParent, 52)
    // parent -> child
    valChild1 = ''
    signals2.data.signals.setChild1.call({ v: 'a' })
    assert.strictEqual(valChild1, 'aaa')
    // check callFns
    assert.strictEqual(signals2.data.childSignalsAPI
                       .child.setParent._callFns.length, 3)

    // then DESTROY
    const localState3 = { child: [ stateTree.get([ 'child', 1 ]) ] }
    const dOut3 = diffWithModelMin(Parent, localState3, localState2, [],
                                        [])
    const signals3 = mergeSignals(Parent, [], dOut3.minSignals.diff, signals2,
                                  stateCallers)
    valChild1 = ''
    signals3.data.signals.setChild1.call({ v: 'a' })
    assert.strictEqual(valChild1, 'a')
    // check callFns
    assert.strictEqual(signals3.data.childSignalsAPI
                       .child.setParent._callFns.length, 1)
    assert.strictEqual(signals3.children.child.length, 1)
  })

  it('works with null state', () => {
    const Component = createComponent({ model: { child: DefComponent } })
    const stateTree = makeTree({ child: null }, false)
    const bindingTree = makeTree(null, true)
    const signalTree = makeTree(null, true)
    const stateCallers = makeStateCallers(Component, stateTree, bindingTree,
                                          signalTree)
    const dOut = diffWithModelMin(Component, stateTree.get([]), null, [], [])
    const signals = mergeSignals(Component, [], dOut.minSignals.diff,
                                 signalTree.get([]), stateCallers)
    assert.isNull(signals.children.child.data)
    assert.deepEqual(signals.children.child.children, {})
  })
})

describe('createComponent/run', () => {
  it('errors if the model is a single component', () => {
    assert.throws(() => {
      createComponent({ model: DefComponent })
    }, /cannot be another Component/)
  })

  it('allows null for state; does not render', () => {
    const Component = createComponent({
      init: () => null,
      reducers: { a: () => null },
      render: () => { throw new Error('Should not update') },
    })
    const { reducers } = run(Component, EL1)
    reducers.a()
  })

  it('has setStateNoRender method', () => {
    let ready = false
    const Component = createComponent({
      render: () => {
        if (ready) {
          throw new Error('Should not render')
        }
      }
    })
    const { setState, setStateNoRender, getState } = run(Component, EL1)
    ready = true
    const newState = { a: 'new state' }
    setStateNoRender(newState)
    assert.deepEqual(getState(), newState)
    assert.throws(() => {
      setState({ b: 'another new state' })
    })
  })

  it('init accepts 1 or 0 arguments', () => {
    const Component = createComponent({
      init: ({ a = 1 }) => ({ a }),
    })
    assert.deepEqual(Component.init({ a: 2 }), { a: 2 })
    assert.deepEqual(Component.init(), { a: 1 })
    assert.throws(() => Component.init('a'))
    assert.throws(() => Component.init({ a: 2 }, 'b'))
  }),

  it('reducers accept 1 or 0 arguments', () => {
    const C1 = createComponent({
      reducers: {
        a: () => { return {} }
      },
      methods: {
        ok: ({ reducers }) => {
          reducers.a()
          reducers.a({})
        },
        bad1: ({ reducers }) => {
          reducers.a({}, 2)
        },
        bad2: ({ reducers }) => {
          reducers.a('not an object')
        },
      },
    })
    C1.reducers.a({ state: {} })
    assert.throws(() => C1.reducers.a())
    assert.throws(() => C1.reducers.a({}))
    assert.throws(() => C1.reducers.a({ state: {} }, 2))
    assert.throws(() => C1.reducers.a('not an object'))
    // with the run API
    const { methods, reducers } = run(C1, EL1)
    reducers.a()
    reducers.a({})
    assert.throws(() => reducers.a({}, 2))
    assert.throws(() => reducers.a('not an object'))
    methods.ok()
    methods.ok({})
    assert.throws(() => methods.bad1())
    assert.throws(() => methods.bad2({}))
  })

  it('respects binding object for create and render', () => {
    const Child = createComponent({
      displayName: 'Child',
      signalNames: [ 'add' ],
      signalSetup: ({ signals, reducers }) => signals.add.on(reducers.add),
      reducers: {
        init: () => ({ val: 1 }),
        add: ({ state, v }) => {
          return { ...state, val: v }
        },
      },

      render: ({ state, methods, el }) => {
        assert.strictEqual(el, EL2)
      },

      willMount: ({ el }) => {
        assert.strictEqual(el, EL2)
      },

      didMount: ({ el }) => {
        assert.strictEqual(el, EL2)
      },

      shouldUpdate: () => {
        return true
      },

      willUpdate: ({ el }) => {
        assert.strictEqual(el, EL2)
      },

      didUpdate: ({ el }) => {
        assert.strictEqual(el, EL2)
      },

      willUnmount: ({ el }) => {
        assert.strictEqual(el, EL2)
      },
    })

    const Parent = createComponent({
      displayName: 'Parent',
      model: { child: Child },
      signalNames: [ 'add' ],
      signalSetup: ({ signals, childSignals }) => {
        signals.add.on(childSignals.child.add.call)
      },
      methods: { add: ({ signals, v }) => signals.add.call({ v }) },
      init: () => ({ child: Child.init() }),
      render: () => ({ type: BINDINGS, data: [ [ 'child', EL2 ] ] }),
    })

    const { getState, setState, signals } = run(Parent, EL1)
    signals.add.call({ v: 2 })
    assert.strictEqual(getState().child.val, 2)
    const curState = getState()
    setState({ ...curState, child: { ...curState.child, val: 3 } })
    assert.strictEqual(getState().child.val, 3)
  })

  it('async post-render functions; run verbose; return reducers', () => {
    const Child = createComponent({
      displayName: 'Child',
      init: () => ({ val: 1 }),
    })

    const Parent = createComponent({
      displayName: 'Parent',
      model: { child: arrayOf(Child) },
      init: () => ({ child: [ Child.init() ] }),
      signalNames: [ 'increment' ],
      signalSetup: ({ signals, reducers }) => {
        signals.increment.on(reducers.increment)
      },
      reducers: {
        increment: ({ state }) => ({
          ...state,
          child: [ ...state.child, Child.init() ],
        }),
      },
      render: ({ state }) => {
        return {
          type: BINDINGS,
          data: state.child.map((_, i) => [ [ 'child', i ], EL1 ]),
        }
      },
    })

    const { signals } = run(Parent, EL1, { verbose: true })
    // When the didUpdate and willUnmount functions are called synchronously,
    // the bindings get out of balance, so this should test for that.
    signals.increment.call({})
  })

  it('calls tinier.render automagically', () => {
    const Component = createComponent({
      displayName: 'Component',
      render: () => <div id="new"></div>,
    })
    run(Component, el)
    const newEl = el.firstChild
    assert.strictEqual(newEl.id, 'new')
    assert.strictEqual(newEl.textContent, '')
  })

  it('handles re-rendering on an element with children', () => {
    // Catches a bug where the old bindings of child array were not being stored
    // correctly
    const Child = createComponent({
      displayName: 'Child',
      render: ({ state }) => <div>{ state.i }</div>,
    })
    const Component = createComponent({
      displayName: 'Component',
      model: { children: arrayOf(Child) },
      init: () => ({ children: [ { i: 0 }, { i: 1 } ] }),
      reducers: { test: ({ n, state }) => ({ ...state, n }) },
      render: ({ state }) => {
        const children = state.children.map((_, i) => {
          return <div>{ bind([ 'children', i ]) }</div>
        })
        return <div>{ children }</div>
      },
      // Make runAndProcessRender return null by returning false from
      // shouldUpdate
      shouldUpdate: ({ state }) => state.n !== 2,
    })
    // Run
    const { reducers } = run(Component, el)
    // Render with shouldUpdate = false
    reducers.test({ n: 2 })
  })
})

// -------------------------------------------------------------------
// DOM
// -------------------------------------------------------------------

describe('createElement', () => {
  it('returns an object', () => {
    assert.deepEqual(
      createElement('div'),
      { tagName: 'div', attributes: {}, children: [], type: ELEMENT }
    )
  })

  it('takes children as an array', () => {
    assert.deepEqual(
      createElement('div', null, 'a', 'b'),
      { tagName: 'div', attributes: {}, children: [ 'a', 'b' ], type: ELEMENT }
    )
  })
})

describe('bind', () => {
  it('accepts an address', () => {
    assert.deepEqual(bind([ 'a', 'b' ]),
                     { type: BINDING, data: [ 'a', 'b' ] })
  })

  it('accepts a single loc', () => {
    assert.deepEqual(bind('a'),
                     { type: BINDING, data: 'a' })
  })
})

describe('createDOMElement', () => {
  it('choose correct namespace -- html', () => {
    const tEl = createElement('html', {
      href: 'http://a.com',
      'xlink:href': 'http://b.com',
      'xmlns:xlink': 'http://c.com'
    })
    const el = createDOMElement(tEl, document.body)
    // Check element namespace
    assert.strictEqual(el.namespaceURI, 'http://www.w3.org/1999/xhtml')
    // Check attribute namespaces
    assert.strictEqual(el.getAttribute('href'), 'http://a.com')
    assert.strictEqual(el.getAttribute('xlink:href'), 'http://b.com')
    assert.strictEqual(el.getAttribute('xmlns:xlink'), 'http://c.com')
  })

  it('choose correct namespace -- svg', () => {
    assert.strictEqual(createDOMElement(createElement('svg'), document.body).namespaceURI,
                       'http://www.w3.org/2000/svg')
  })

  it('choose correct namespace -- inherit', () => {
    const svg = createDOMElement(createElement('svg'), document.body)
    assert.strictEqual(createDOMElement(createElement('g'), document.body).namespaceURI,
                       'http://www.w3.org/1999/xhtml')
    assert.strictEqual(createDOMElement(createElement('g'), svg).namespaceURI,
                       'http://www.w3.org/2000/svg')
  })

  it('choose correct namespace -- explicit', () => {
    assert.strictEqual(createDOMElement(createElement('svg:g'), document.body).namespaceURI,
                       'http://www.w3.org/2000/svg')
    // keep xmlns prefix
    assert.strictEqual(createDOMElement(createElement('xmlns:g'), document.body).namespaceURI,
                       'http://www.w3.org/2000/xmlns/')
  })
})

describe('getStyles', () => {
  it('finds style names', () => {
    assert.deepEqual(getStyles('border-color: green; top: 25px;'),
                     ['border-color', 'top'])
  })
})

describe('updateDOMElement', () => {
  it('removes old styles and attributes', () => {
    // Create an element
    const style = { 'border-radius': '10px', 'border-color': 'red' }
    const fn = () => 'abc'
    render(el, <input disabled onClick={ fn } style={ style } id="a"></input>)
    const newEl = el.firstChild
    // Update the element
    const newStyle = { 'border-color': 'green' }
    updateDOMElement(newEl, <input style={ newStyle }></input>)
    assert.strictEqual(newEl.style.borderRadius, '')
    assert.strictEqual(newEl.style.borderColor, 'green')
    assert.strictEqual(newEl.getAttribute('onClick'), null)
    assert.strictEqual(newEl.id, '')
    assert.strictEqual(newEl.getAttribute('disabled'), null)
  })

  it('converts accepts class', () => {
    render(el, <input></input>)
    const newEl = el.firstChild
    updateDOMElement(newEl, <input class="empty"></input>)
    assert.strictEqual(newEl.getAttribute('class'), 'empty')
  })

  it('handles special form attributes -- checked', () => {
    render(el, <input type='checkbox'></input>)
    const newEl = el.firstChild
    assert.isFalse(newEl.hasAttribute('checked'))
    updateDOMElement(newEl, <input checked={ true }></input>)
    assert.isTrue(newEl.checked)
    updateDOMElement(newEl, <input checked={ false }></input>)
    assert.isFalse(newEl.checked)
  })

  it('removes on* functions', () => {
    let called = 0
    const inc = () => called++
    render(el, <input></input>)
    const newEl = el.firstChild
    updateDOMElement(newEl, <input onClick={ inc }></input>)
    updateDOMElement(newEl, <input></input>)
    mouseClick(newEl)
    assert.strictEqual(called, 0)
  })

  it('does not set on* functions multiple times', () => {
    let called = 0
    const inc1 = () => called++
    const inc2 = () => called++
    render(el, <input></input>)
    const newEl = el.firstChild
    updateDOMElement(newEl, <input onClick={ inc1 }></input>)
    updateDOMElement(newEl, <input onClick={ inc2 }></input>)
    mouseClick(newEl)
    assert.strictEqual(called, 1)
  })

  it('takes then attribute', (done) => {
    let called = null
    render(el, <input></input>)
    const newEl = el.firstChild
    updateDOMElement(newEl, <input then={ arg => {
      assert.strictEqual(arg, newEl)
      done()
    } }></input>)
  })

  it('choose correct namespace -- svg attribute & xlink', () => {
    render(el, <svg></svg>)
    const newEl = el.firstChild
    // JSX does not support xlink:href
    updateDOMElement(newEl, createElement('image', {
      height: '100',
      'xlink:href': 'http://example.svg'
    }))
    assert.strictEqual(newEl.attributes.height.namespaceURI, null)
    assert.strictEqual(newEl.attributes['xlink:href'].namespaceURI,
                       'http://www.w3.org/1999/xlink')
  })
})

describe('render', () => {
  afterEach(() => {
    // clear DOM
    while (el.firstChild) {
      el.removeChild(el.firstChild)
    }
  })

  it('renders empty element', () => {
    render(el, <div id="new"></div>)
    const newEl = el.firstChild
    assert.strictEqual(newEl.id, 'new')
    assert.strictEqual(newEl.textContent, '')
  })

  it('renders text, and casts other objects to String', () => {
    render(el, <div>hey!, <span>hello</span> world</div>, ':-)')
    // run again to make sure text nodes are updated
    render(el, <div>hiya!, <span>hello</span>{ 2 }</div>)
    const nodes = el.firstChild.childNodes
    assert.strictEqual(nodes[0].textContent, 'hiya!, ')
    assert.strictEqual(nodes[1].textContent, 'hello')
    assert.strictEqual(nodes[2].textContent, '2')
    assert.strictEqual(el.childNodes.length, 1)
  })

  it('does not render null', () => {
    render(el, <div>hey!, <span>hello</span> world</div>, ':-)')
    // run again to make sure text nodes are updated
    render(el, <div>hiya!, { null }<span>{ null }</span>{ 2 }</div>)
    const nodes = el.firstChild.childNodes
    assert.strictEqual(nodes[0].textContent, 'hiya!, ')
    assert.strictEqual(nodes[1].textContent, '')
    assert.strictEqual(nodes[2].textContent, '2')
  })

  it('renders multiple divs', () => {
    const el1 = document.createElement('div')
    el.appendChild(el1)
    const el2 = document.createElement('div')
    el.appendChild(el2)
    render(el1, <div>hello</div>, <div><span>world</span><span>!</span></div>)
    render(el2, <div>hello2</div>, <div><span>world2</span><span>!2</span></div>)
    assert.strictEqual(el1.firstChild.textContent, 'hello')
    assert.strictEqual(el1.lastChild.firstChild.textContent, 'world')
    assert.strictEqual(el1.lastChild.lastChild.textContent, '!')
    assert.strictEqual(el2.firstChild.textContent, 'hello2')
    assert.strictEqual(el2.lastChild.firstChild.textContent, 'world2')
    assert.strictEqual(el2.lastChild.lastChild.textContent, '!2')
  })

  it('renders nested elements with attributes', () => {
    render(el, <div><a href="goo.gl">goog</a></div>)
    const newEl = el.firstChild.firstChild
    assert.strictEqual(newEl.getAttribute('href'), 'goo.gl')
    assert.strictEqual(newEl.textContent, 'goog')
  })

  it('rearrange by ID', () => {
    render(el, <div>
           <div id="n1"></div>
           <div id="n2"></div>
           <div id="n3"></div>
           <div id="n4"></div>
           </div>)
    const children = Array.from(el.firstChild.children)
    render(el, <div>
           <div id="n4"></div>
           <div id="n1"></div>
           <div></div>
           <div id="n2"></div>
           <div id="n3"></div>
           </div>)
    children.map((c, i) => {
      assert.strictEqual(c, document.getElementById('n' + String(i + 1)))
    })
    assert.strictEqual(el.firstChild.firstChild.id, 'n4')
  })

  it('accepts camel-case or css-style CSS keys', () => {
    render(el, <div style={{ 'border-color': 'red' }}></div>)
    assert.strictEqual(el.firstChild.style.borderColor, 'red')
    render(el, <div style={{ borderRadius: '2px' }}></div>)

    assert.strictEqual(el.firstChild.style.borderRadius, '2px')
  })

  it('accepts style string', () => {
    render(el, <div style="border-color: red;"></div>)
    assert.strictEqual(el.firstChild.style.borderColor, 'red')
  })

  it('returns a bindings object -- top', () => {
    const bindings = render(el, bind([ 'a', 'b' ]))
    const expect = {
      type: BINDINGS,
      data: [ [ [ 'a', 'b' ], el ] ],
    }
    assert.deepEqual(bindings, expect)
  })

  it('returns a bindings object -- no array, string', () => {
    const bindings = render(el, bind('at'))
    const expect = {
      type: BINDINGS,
      data: [ [ 'at', el ] ],
    }
    assert.deepEqual(bindings, expect)
  })

  it('returns a bindings object -- no array, integer', () => {
    const bindings = render(el, bind(1))
    const expect = {
      type: BINDINGS,
      data: [ [ 1, el ] ],
    }
    assert.deepEqual(bindings, expect)
  })

  it('returns a bindings object -- multiple', () => {
    const bindings = render(
      el,
      <div>
        <a href="goo.gl">{ bind([ 'a', 'b' ]) }</a>
        <a href="goo.gl">{ bind([ 'a', 'c' ]) }</a>
      </div>
    )
    const expect = {
      type: BINDINGS,
      data: [
        [ [ 'a', 'b' ], el.firstChild.children[0] ],
        [ [ 'a', 'c' ], el.firstChild.children[1] ],
      ]
    }
    assert.deepEqual(bindings, expect)
  })

  it('returns a bindings object -- sibling with auto div', () => {
    const bindings = render(
      el,
      <div>
        <div></div>
        { bind([ 'a', 'b' ]) }
      </div>
    )
    const expect = {
      type: BINDINGS,
      data: [
        [ [ 'a', 'b' ], el.firstChild.children[1] ],
      ]
    }
    assert.deepEqual(bindings, expect)
    assert.strictEqual(el.firstChild.children[1].tagName.toLowerCase(), 'div')
  })

  it('returns a bindings object -- sibling with auto g', () => {
    const bindings = render(
      el,
      <svg>
        <g></g>
        { bind([ 'a', 'b' ]) }
      </svg>
    )
    const expect = {
      type: BINDINGS,
      data: [
        [ [ 'a', 'b' ], el.firstChild.children[1] ],
      ]
    }
    assert.deepEqual(bindings, expect)
    assert.strictEqual(el.firstChild.children[1].tagName.toLowerCase(), 'g')
  })

  it('accepts lists of nodes', () => {
    const nodes = [ 'a', 'b', 'c' ].map((x, i) => {
      return <div id={ x }>{ bind([ i ]) }</div>
    })
    const bindings = render(el, <div>{ nodes } Tashi</div>)
    assert.strictEqual(el.firstChild.childNodes.length, 4)
    assert.strictEqual(el.firstChild.childNodes[0].id, 'a')
    assert.strictEqual(el.firstChild.childNodes[3].textContent, ' Tashi')
    assert.strictEqual(bindings.data.length, 3)
    assert.strictEqual(bindings.data[0][1], el.firstChild.firstChild)
  })

  it('adds listeners', (done) => {
    render(el, <div onClick={ () => done() }></div>)
    mouseClick(el.firstChild)
  })

  it('error for invalid listeners', () => {
    assert.throws(() => {
      const methods = {}
      render(el, <div onClick={ methods.bad }></div>)
    })
  })

  it('removes listeners', () => {
    let clicked = false
    render(el, <div onClick={ () => clicked = true }></div>)
    render(el, <div></div>)
    mouseClick(el)
    assert.isFalse(clicked)
  })
})
