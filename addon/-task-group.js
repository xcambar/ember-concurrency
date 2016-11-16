import Ember from 'ember';
import { objectAssign } from './utils';
import TaskStateMixin from './-task-state-mixin';
import { taskModifiers } from './-task-modifiers-mixin';

export const TaskGroup = Ember.Object.extend(TaskStateMixin, {
  toString() {
    return `<TaskGroup:${this._propertyName}>`;
  },

  // FIXME: this is hacky and perhaps wrong
  isRunning: Ember.computed.or('numRunning', 'numQueued'),
  isQueued:  false,

  _isTaskGroup: true,
});

export function TaskGroupProperty(taskFn) {
  this._sharedConstructor(taskFn);
}

TaskGroupProperty.prototype = Object.create(Ember.ComputedProperty.prototype);
objectAssign(TaskGroupProperty.prototype, taskModifiers, {
  constructor: TaskGroupProperty,
  _TaskConstructor: TaskGroup,
});

