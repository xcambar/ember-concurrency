import Ember from 'ember';
import { task, timeout } from 'ember-concurrency';

export default Ember.Controller.extend({
  myTask: task(function * () {
    while(true) {
      yield timeout(10000);
    }
  }).on('init'),
});

