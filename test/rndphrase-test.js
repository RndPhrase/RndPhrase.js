/*global describe, it*/

var assert = require('assert'),
    RndPhrase = require('../rndphrase');

describe('RndPhrase', function () {
    it('Should be a function', function (done) {
        assert.equal(typeof RndPhrase, 'function');
        done();
    });

    it('Should hash correctly', function (done) {
        var r = new RndPhrase({
            seed: 'foo',
            domain: 'example.net',
            password: 'bar'
        });

        assert.equal(r.generate(), '3vyr0z87hs928a7l');
        assert.equal(r.generate(), 'b1gbnl87ik9pxor6');
        done();
    });

    it('Should give correct version', function (done) {
        var r = new RndPhrase({
            seed: 'foo',
            domain: 'example.net',
            password: 'bar',
            version: 3
        });
        var g = r.generator('bar'); g(); g();

        assert.equal(r.generate('bar'), g());
        done();
    });
});
