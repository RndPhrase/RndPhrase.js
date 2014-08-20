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

        assert.equal(r.generate(), 'PbzJ63,,AH4hfXS%');
        assert.equal(r.generate(), '8X.1hM%+e92&7Kej');
        done();
    });

    it('Should be different versions', function(done) {
        var r = new RndPhrase({
            seed: 'foo',
            domain: 'example.net',
            password: 'bar',
            version: 1
        });
        var r2 = new RndPhrase({
            seed: 'foo',
            domain: 'example.net',
            password: 'bar',
            version: 2
        });

        assert.notEqual(r.generate(), r2.generate());
        done();
    });
});
