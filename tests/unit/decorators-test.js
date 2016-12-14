import Ember from 'ember';
import { restartableTask } from 'ember-concurrency/decorators';
//import { task, timeout } from 'ember-concurrency';
//import { module, test } from 'qunit';

module('Unit: ES7 decorators');

test("restartableTask", function(assert) {
  assert.expect(3);

  let count = 0;
  let Obj = Ember.Object.extend({
    @restartableTask
    *myTask() {
      count++;
      return Ember.RSVP.defer().promise;
    }
  });

  Ember.run(() => {
    let o = Obj.create();
    o.get('myTask').perform();
    o.get('myTask').perform();
    assert.equal(o.get('myTask.concurrency'), 1);
    assert.equal(count, 2);
  });
});

