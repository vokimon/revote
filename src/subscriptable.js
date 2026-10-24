
/**
 * Makes an object or function subscriptable by adding methods and members
 * to handle subscriptions.
 *
 * - subscribe(callback) will subscribe the callback to the target
 * - notify(..args)  will call all subscriber callbacks with the given args
 */
function subscriptable(target) {
  target._subscribers = new Set()
  target.subscribe = (subscriber) => {
    target._subscribers.add(subscriber)
    return () => target._subscribers.delete(subscriber)
  }
  target.notify = (...args) => {
    target._subscribers.forEach((subscriber) => subscriber(...args))
  }
  return target
}

function callOrSelf(target, ...args) {
  if (typeof target === 'function') return target(...args)
  return target
}

module.exports = subscriptable

