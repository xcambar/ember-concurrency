import Ember from 'ember';
import { asyncComputed } from 'ember-concurrency';
import { module, test } from 'qunit';

module('Unit: asyncComputed');

test("basic", function(assert) {
  assert.expect(6);

  let allArgs = [];
  let Obj = Ember.Object.extend({
    a: 1,
    b: 2,
    c: 3,

    foo: asyncComputed('a', 'b', 'c', function * (...args) {
      allArgs.push(args);
      return 123;
    }),
  });

  let obj;
  Ember.run(() => {
    obj = Obj.create();
  });

  assert.equal(allArgs.length, 0);

  Ember.run(() => {
    assert.ok(!obj.get('foo.value'));
  });

  assert.equal(obj.get('foo.value'), 123);
  assert.deepEqual(allArgs, [[1,2,3,'foo']]);

  Ember.run(() => {
    obj.set('a', 5);
    obj.set('b', 6);
  });

  assert.deepEqual(allArgs, [[1,2,3,'foo']]);

  Ember.run(() => {
    obj.get('foo');
  });

  assert.deepEqual(allArgs, [[1,2,3,'foo'], [5,6,3,'foo']]);
});

