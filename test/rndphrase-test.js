/*global describe, it*/

var assert = require('assert'),
    RndPhrase = require('../rndphrase');

describe('RndPhrase', function () {
    it('Should be a function', function (done) {
        assert.equal(typeof RndPhrase, 'function');
        done();
    });

    it('Should hash correctly', function (done) {
        assert.equal(new RndPhrase({
            seed: 'foo',
            domain: 'example.net'
        }).generator('bar'), 'e9hn8rxt33h8pwon');
        done();
    });
});
