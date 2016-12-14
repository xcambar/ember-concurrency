import { TaskProperty } from './-task-property';

function isDescriptor(item) {
  return item &&
    typeof item === 'object' &&
    'writable' in item &&
    'enumerable' in item &&
    'configurable' in item;
}

function handleDescriptor(target, property, desc, fn, params = []) {
  return {
    enumerable: desc.enumerable,
    configurable: desc.configurable,
    writable: desc.writable,
    initializer: function() {
      return fn(...params);
    }
  };
}

function macroAlias(fn) {
  return function(...params) {
    if (isDescriptor(params[params.length - 1])) {
      return handleDescriptor(...params, fn);
    } else {
      return function(target, property, desc) {
        return handleDescriptor(target, property, desc, fn, params);
      };
    }
  };
}

export const restartableTask = macroAlias((fn) => {
  return new TaskProperty(fn).restartable();
});

