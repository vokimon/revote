/**
 * @file tasks.js
 * @brief Fire-and-forget task runner that keeps blocking UI in sync with async work.
 *
 * Solves the synchronization between a blocking UI (a progress modal)
 * and an asynchronous task: the model starts the task and forgets about
 * it, while the UI subscribes to open the modal on entry and close it on
 * exit, without the model ever knowing about the UI.
 *
 * Both sides stay decoupled: the model only calls run(), the UI only
 * calls subscribe(), and neither imports the other. Tasks cannot be
 * awaited by design (fire and forget); failures are reported through
 * the messages module (@see messages.js) instead of being propagated.
 *
 * Sources just call run(). Presenters call subscribe() to track tasks.
 *
 * IMPORTANT: `subscribe()` returns a function to unsubscribe. Use it.
 */

'use strict';

import messages from './messages';

const _subscribers = new Set()
let _nextId = 0

/**
 * @brief Notify subscribers that a task has started.
 * @param id Unique identifier of the task.
 * @param message Human readable description of the task.
 */
function _notifyEntry(id, message) {
  _subscribers.forEach(subscription => subscription.entry?.(id, message))
}

/**
 * @brief Notify subscribers that a task has finished.
 *
 * Emitted after success or failure, so an exit is guaranteed for every
 * entry.
 *
 * @param id Unique identifier of the task, matching the one passed to entry().
 */
function _notifyExit(id) {
  _subscribers.forEach(subscription => subscription.exit?.(id))
}

/**
 * @brief Subscribe to task entry and exit events to drive a blocking UI.
 *
 * Lets a presenter open a progress modal on entry and close it on exit
 * without the model knowing about the UI. Either callback is optional;
 * omitted or null callbacks are skipped.
 *
 * @param entry Called on task start as entry(id, message).
 * @param exit Called on task finish as exit(id).
 * @return A function that unsubscribes the given callbacks.
 */
function subscribe(entry, exit) {
  const subscription = { entry, exit }
  _subscribers.add(subscription)
  return () => _subscribers.delete(subscription)
}

/**
 * @brief Start an async task, fire and forget, notifying any blocking UI.
 *
 * The task runs on the next microtask; this function does not return the
 * task promise. Errors are reported through messages.error() instead of
 * being propagated.
 *
 * @param message Human readable description shown to subscribers.
 * @param callback Async function with the task body.
 */
function run(message, callback) {
  const id = ++_nextId

  _notifyEntry(id, message)

  Promise.resolve()
    .then(callback)
    .catch(error => {
      messages.error(error?.message || String(error))
    })
    .finally(() => {
      _notifyExit(id)
    })
}

/**
 * @brief Task runner module.
 * @property run Fire-and-forget task launcher.
 * @property subscribe Entry/exit subscription, returns an unsubscribe function.
 */
export default { run, subscribe }
