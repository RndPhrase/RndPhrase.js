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
        }).generator('bar'), '3vyr0z87hs928a7l');
        done();
    });

    it('Should give correct version', function (done) {
        var r = new RndPhrase({
            seed: 'foo',
            domain: 'example.net',
            version: 3
        });
        var p = r.generator(r.generator(r.generator('bar')));

        assert.equal(r.generate('bar'), p);
        done();
    });
});
