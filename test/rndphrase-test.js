/*global describe, it*/

var assert = require('assert'),
    RndPhrase = require('../rndphrase');

function count(c, str) {
    var n = 0;
    for(var i = 0; i < str.length; i++) {
        if(str[i] == c) n++;
    }
    return n;
}


describe('RndPhrase', function () {
    it('Should be a function', function (done) {
        assert.equal(typeof RndPhrase, 'function');
        done();
    });

    it('Should have private state', function() {
        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            password: 'bar'
        });
        assert.equal(r.state, undefined);
    });

    it('Should hash correctly', function (done) {
        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            password: 'bar'
        });

        assert.equal(r.generate(), '_\'<zKic31pHAGs)h');
        assert.equal(r.generate(), 'bB8 LG04894O]iI>');
        done();
    });

    it('Should hash differently', function(done) {
        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net'
        });

        assert.notEqual(r.generate('baz'), '_\'<zKic31pHAGs)h');
        assert.notEqual(r.generate(), 'bB8 LG04894O]iI>');
        assert.equal(r.generate('bar'), '_\'<zKic31pHAGs)h');
        assert.equal(r.generate(), 'bB8 LG04894O]iI>');
        done();
    });

    it('Should be different versions', function(done) {
        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            password: 'bar',
            version: 1
        });
        var r2 = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            password: 'bar',
            version: 2
        });

        assert.notEqual(r.generate(), r2.generate());
        done();
    });

    it('Should contain 4 As', function(done) {
        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            password: 'bar',
            capital: {
                min: 4,
                max: 4,
                alphabet: 'A'
            }
        });

        assert.equal(4, count('A', r.generate()));
        done();
    });

    it('Should contain 4 as', function(done) {
        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            password: 'bar',
            minuscule: {
                min: 4,
                max: 4,
                alphabet: 'a'
            }
        });

        assert.equal(4, count('a', r.generate()));
        done();
    });

    it('Should contain 4 1s', function(done) {
        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            password: 'bar',
            numeric: {
                min: 4,
                max: 4,
                alphabet: '1'
            },
            capital: false
        });
        hash = r.generate();
        assert.equal(4, count('1', hash));
        done();
    });

    it('Should contain 4 -s', function(done) {
        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            password: 'bar',
            special: {
                min: 4,
                max: 4,
                alphabet: '-'
            },
            numeric: false,
            minuscule: false
        });
        hash = r.generate()
        assert.equal(4, count('-', hash));
        done();
    });

    it('Should be long', function(done) {
        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            password: 'bar',
            size: 42
        });
        assert.equal(42, r.generate().length);
        done();
    });
});
