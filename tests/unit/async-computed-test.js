import Ember from 'ember';
//import TaskInstance from 'ember-concurrency/-task-instance';
import { asyncComputed, timeout } from 'ember-concurrency';
import { module, test } from 'qunit';

const defer = Ember.RSVP.defer;

module('Unit: async computed');

test(".value synchronously produces a value if possible", function(assert) {
  assert.expect(2);

  let klass = Ember.Object.extend({
    a: asyncComputed(function * () {
      return 123;
    }),
    b: asyncComputed(function * () {
      return 456;
    }),
  });

  Ember.run(() => {
    assert.equal(klass.create().get('a.value'), 123);
    assert.equal(klass.create().get('b.value'), 456);
  });
});

test("async properties get passed synchronously resolved values of their async prop deps", function(assert) {
  assert.expect(2);

  let klass = Ember.Object.extend({
    a: asyncComputed(function * () {
      return 999;
    }),
    b: asyncComputed('*a', function * (a) {
      assert.equal(a, 999);
      return a;
    }),
  });

  Ember.run(() => {
    assert.equal(klass.create().get('b.value'), 999);
  });
});

test("async properties get passed sync resolved yieldables", function(assert) {
  assert.expect(2);

  let klass = Ember.Object.extend({
    a: null,
    b: asyncComputed('*a', function * (a) {
      assert.equal(a, 999);
      return a;
    }),
  });

  Ember.run(() => {
    assert.equal(klass.create({
      a: Ember.RSVP.resolve(999)
    }).get('b.value'), 999);
  });
});

test("async properties get passed async resolved yieldables", function(assert) {
  assert.expect(2);
  let done = assert.async();

  let klass = Ember.Object.extend({
    a: null,
    b: asyncComputed('*a', function * () {
      return 123;
    }),
  });

  let obj;
  Ember.run(() => {
    obj = klass.create({ a: timeout(1) });
    assert.equal(obj.get('b.value'), null);
  });

  Ember.run.later(() => {
    assert.equal(obj.get('b.value'), 123);
    done();
  }, 20);
});

test("async properties depending on async properties", function(assert) {
  assert.expect(2);

  let aDefer, bDefer;
  let klass = Ember.Object.extend({
    a: asyncComputed(function * () {
      aDefer = defer();
      return aDefer.promise;
    }),
    b: asyncComputed(function * () {
      bDefer = defer();
      return bDefer.promise;
    }),
    c: asyncComputed('*a', '*b', function * (a, b) {
      return [a, b];
    }),
  });

  let obj;
  Ember.run(() => {
    obj = klass.create();
    assert.equal(obj.get('c.value'), null);
    aDefer.resolve('A');
    bDefer.resolve('B');
  });
  assert.deepEqual(obj.get('c.value'), ['A', 'B']);
});

test("safe zalgo: synchronously-peekable async chains can be synchronously .get()ed", function(assert) {
  assert.expect(1);

  let klass = Ember.Object.extend({
    a: asyncComputed(function * () {
      return Ember.RSVP.resolve('A');
    }),
    b: asyncComputed(function * () {
      return Ember.RSVP.resolve('B');
    }),
    c: asyncComputed('*a', '*b', function * (a, b) {
      return [a, b];
    }),
  });

  Ember.run(() => {
    assert.deepEqual(klass.create().get('c.value'), ['A', 'B']);
  });
});

test("dependency invalidation", function(assert) {
  assert.expect(9);

  let invalidations = [];

  let klass = Ember.Object.extend({
    syncValue: "abc",
    a: asyncComputed('syncValue', function * () {
      assert.equal(arguments.length, 0);
      let v = this.get('syncValue');
      invalidations.push(v);
      return v;
    }),
  });

  let obj;
  Ember.run(() => {
    obj = klass.create();
    assert.equal(obj.get('a.value'), 'abc');
    obj.set('syncValue', 'wat');
    assert.equal(obj.get('a.value'), 'wat');
    obj.set('syncValue', 'lol');
    assert.deepEqual(invalidations, ['abc', 'wat']);
  });
  assert.deepEqual(invalidations, ['abc', 'wat']);
  Ember.run(() => {
    assert.equal(obj.get('a.value'), 'lol');
    assert.deepEqual(invalidations, ['abc', 'wat', 'lol']);
  });
});





