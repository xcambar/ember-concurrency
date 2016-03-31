import Ember from 'ember';

export function isGeneratorIterator(iter) {
  return (iter &&
          typeof iter.next      === 'function' &&
          typeof iter['return'] === 'function' &&
          typeof iter['throw']  === 'function');
}

export function Arguments(args, defer) {
  this.args = args;
  this.defer = defer;
}

Arguments.prototype.resolve = function(value) {
  if (this.defer) {
    this.defer.resolve(value);
  }
};

export function createObservable(fn) {
  return {
    subscribe(onNext, onError, onCompleted) {
      let isDisposed = false;
      let isComplete = false;
      let publish = (v) => {
        if (isDisposed || isComplete) { return; }
        joinAndSchedule(null, onNext, v);
      };
      publish.error = (e) => {
        if (isDisposed || isComplete) { return; }
        joinAndSchedule(() => {
          if (onError) { onError(e); }
          if (onCompleted) { onCompleted(); }
        });
      };
      publish.complete = () => {
        if (isDisposed || isComplete) { return; }
        isComplete = true;
        joinAndSchedule(() => {
          if (onCompleted) { onCompleted(); }
        });
      };

      // TODO: publish.complete?

      let maybeDisposer = fn(publish);
      let disposer = typeof maybeDisposer === 'function' ? maybeDisposer : Ember.K;

      return {
        dispose() {
          if (isDisposed) { return; }
          isDisposed = true;
          disposer();
        },
      };
    },
  };
}

function joinAndSchedule(...args) {
  Ember.run.join(() => {
    Ember.run.schedule('actions', ...args);
  });
}

export function _cleanupOnDestroy(root, object, cleanupMethodName) {
  // TODO: find a non-mutate-y, hacky way of doing this.
  if (!root.willDestroy.__ember_processes_destroyers__) {
    let oldWillDestroy = root.willDestroy;
    let disposers = [];

    root.willDestroy = function() {
      for (let i = 0, l = disposers.length; i < l; i ++) {
        disposers[i]();
      }
      oldWillDestroy.apply(root, arguments);
    };
    root.willDestroy.__ember_processes_destroyers__ = disposers;
  }

  root.willDestroy.__ember_processes_destroyers__.push(() => {
    object[cleanupMethodName]();
  });
}

// TODO: Symbol polyfill?
export const yieldableSymbol = "__ec_yieldable__";

export const _ComputedProperty = Ember.__loader.require("ember-metal/computed").ComputedProperty;

