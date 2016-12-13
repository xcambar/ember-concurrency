import { test } from 'qunit';
import moduleForAcceptance from '../../tests/helpers/module-for-acceptance';

moduleForAcceptance('Acceptance | testing ergonomics');

test('infinite loops', function(assert) {
  visit('/timer-cancel-test');
  andThen(() => {
    console.log("no");
  });
});

