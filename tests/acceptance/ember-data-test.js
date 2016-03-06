import Ember from 'ember';
import { test } from 'qunit';
import moduleForAcceptance from '../../tests/helpers/module-for-acceptance';

import Pretender from 'pretender';

moduleForAcceptance('Acceptance | ember-data integration');

test('perform and cancel-all', function(assert) {
  assert.expect(4);

  const pretender = new Pretender(function(){
    function usersHandler(/* request */){
      const users = JSON.stringify({
        data: [
          {
            type: "users",
            id: 1,
            attributes: { username: "machty" }
          }, {
            type: "users",
            id: 2,
            attributes: { username: "snoop" },
          },
        ]
      });

      return [200, { "Content-Type": "application/json" }, users];
    }

    // delay response for 100 ms so that we can actually see the changes made to the template.
    this.get('/users', usersHandler, 100);
  });

  visit('/data-test');

  let buttonSel = `[data-test-selector="load-data-button"]`;

  andThen(() => {
    assert.equal(find(buttonSel).text().trim(), 'No request pending');
    click(buttonSel);
    Ember.run.next(() => {
      // give ember a chance to render changes before asserting dom state
      assert.equal(find(buttonSel).text().trim(), 'Request is pending');
    });
  });

  andThen(() => {
    assert.equal(find(buttonSel).text().trim(), 'No request pending');
    assert.equal(Ember.$(`[data-test-selector="loaded-users"]`).text().trim().replace(/\s+/g, ' '), "machty snoop");

    pretender.shutdown();
  });
});
