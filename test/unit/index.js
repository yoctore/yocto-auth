var auth      = require('../../src/')();
var chai        = require('chai');
var assert      = chai.assert;

// UNIT test begin
describe('unit test yocto-auth: ', function () {

  /**
   * Try to init module
   */
  it('should not initialize module because data is undefined : ', function (done) {

    var result = auth.init();

    assert.equal(result, false);
    done();
  });
});
