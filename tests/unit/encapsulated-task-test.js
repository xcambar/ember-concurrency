import Ember from 'ember';
import { task } from 'ember-concurrency';

module('Unit: EncapsulatedTask');

test("encapsulated tasks can be specified via a pojos with perform methods", function(assert) {
  assert.expect(2);

  let defer;
  let Obj = Ember.Object.extend({
    myTask: task({
      perform: function * (...args) {
        assert.deepEqual(args, [1,2,3]);
        defer = Ember.RSVP.defer();
        yield defer.promise;
        return 123;
      }
    }),
  });

  let obj;
  Ember.run(() => {
    obj = Obj.create();
    obj.get('myTask').perform(1,2,3).then(v => {
      assert.equal(v, 123);
    });
  });
  Ember.run(defer, 'resolve');
});

test("encapsulated tasks access their parents via .parent and roots via .root", function(assert) {
  assert.expect(6);

  let N = "(null)";
  let obj = N, one = N, two = N;
  let Obj = Ember.Object.extend({
    one: task({
      perform: function * () {
        one = this;
        assert.ok(this.root === obj);
        assert.ok(this.parent === obj);
        return this.get('two').perform();
      },

      two: task({
        perform: function * () {
          two = this;
          assert.ok(this.root === obj);
          assert.ok(this.parent === one);
          return this.get('three').perform();
        },

        three: task({
          perform: function * () {
            assert.ok(this.root === obj);
            assert.ok(this.parent === two);
          }
        }),
      }),
    }),
  });

  Ember.run(() => {
    obj = Obj.create().get('one').perform();
  });
});


