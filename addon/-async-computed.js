import Ember from 'ember';
import TaskInstance from './-task-instance';
import { TaskProperty } from './-task-property';
import { yieldableSymbol } from './utils';
import { all } from './-yieldables';
import WeakMap from 'ember-weakmap';

const { computed, get, set } = Ember;

const AsyncProperty = Ember.Object.extend({
  context: null,
  _last: null,
  value: null,
  asyncDeps: null,
  fn: null,
  _completionState: 0,

  runner: new TaskProperty(function * () {
    let resolvedArgs;
    try {
      resolvedArgs = yield all(this.asyncDeps.map(k => get(this.context, k)));
    } catch(e) {
      console.error("resolve error. TODO handle me.");
      console.error(e);
      return;
    }

    let ti = TaskInstance.create({
      fn: this.fn,
      context: this.context,
      args: resolvedArgs,
    })._start();
    let value = yield ti;
    set(this, 'value', value);
    // TODO: abstract this concept of "which value" to tasks in general...
    // i.e you could imagine a promise that resolved when a task FINALLY completes
    // and produces a value, rather than
    return value;
  }).restartable(),

  touch() {
    this.get('runner').perform();
    return this;
  },

  [yieldableSymbol](taskInstance, resumeIndex) {
    // this needs to stick around until a value is produced,
    // but not be tied to any particular task.
    return get(this, 'runner.last')[yieldableSymbol](taskInstance, resumeIndex);
  },
});

function processDeps(deps) {
  let syncDeps = [];
  let asyncDeps = [];
  for (let i = 0; i < deps.length; ++i) {
    let dep = deps[i];
    if (dep.charAt(0) === '*') {
      dep = dep.slice(1);
      asyncDeps.push(dep);
    }
    syncDeps.push(dep);
  }
  return [syncDeps, asyncDeps];
}

export const asyncComputed = (...deps) => {
  let fn = deps.pop();
  let [syncDeps, asyncDeps] = processDeps(deps);

  return computed(...syncDeps, function(key) {
    return findOrCreateAsyncProp(this, key, fn, asyncDeps).touch();
  });
};

let OBJECTS_TO_ASYNCS = new WeakMap();
function findOrCreateAsyncProp(obj, key, fn, asyncDeps) {
  let asyncProps = OBJECTS_TO_ASYNCS.get(obj);
  if (!asyncProps) {
    asyncProps = {};
    OBJECTS_TO_ASYNCS.set(obj, asyncProps);
  }

  let asyncProp = asyncProps[key];
  if (!asyncProp) {
    asyncProp = asyncProps[key] = AsyncProperty.create({
      context: obj,
      fn,
      asyncDeps,
    });
  }

  return asyncProp;
}

