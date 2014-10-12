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

    it('Should hash deterministically', function (done) {
        var r1 = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            password: 'bar'
        });

        var r2 = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            password: 'bar'
        });

        assert.equal(r1.generate(), r2.generate());
        done();
    });

    it('Should be different', function(done) {
        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            password: 'bar'
        });

        assert.notEqual(r.generate(), r.generate());
        done();
    });

    it('Should hash differently', function(done) {
        var r1 = new RndPhrase({
            seed: 'foo',
            uri: 'example.net'
        });
        
        var r2 = new RndPhrase({
            seed: 'foo',
            uri: 'example.com'
        });
        
        assert.notEqual(r1.generate('baz'), r2.generate('baz'));
        assert.notEqual(r1.generate(), r2.generate());

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

    it('Should be 8 digits long', function(done) {
        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            password: 'bar',
            numeric: { max: 2 },
            capital: { max: 2 },
            minuscule: { max: 2 },
            special: { max: 2 },
            size: 10
        });
        assert.equal(8, r.generate().length);
        done();
    });

    it('Should be minimum 10 digits long', function(done) {
        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            password: 'bar',
            numeric: { max: 0 },
            capital: { max: 2 },
            minuscule: { max: 2 },
            special: { max: 2 },
            size: 10
        });
        
        assert(10 <= r.generate().length);


        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            password: 'bar',
            numeric: { max: 2 },
            capital: { max: 0 },
            minuscule: { max: 2 },
            special: { max: 2 },
            size: 10
        });
        assert(10 <= r.generate().length);


        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            password: 'bar',
            numeric: { max: 2 },
            capital: { max: 2 },
            minuscule: { max: 0 },
            special: { max: 2 },
            size: 10
        });
        assert(10 <= r.generate().length);


        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            password: 'bar',
            numeric: { max: 2 },
            capital: { max: 2 },
            minuscule: { max: 2 },
            special: { max: 0 },
            size: 10
        });
        assert(10 <= r.generate().length);

        done();
    });

    it('Should ignore max value', function(done) {
        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            password: 'bar',
            numeric: { min: 2, max: 1},
            capital: { max: 2 },
            minuscule: { max: 2 },
            special: { max: 2 },
            size: 16
        });
        
        assert.equal(16, r.generate().length);


        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            password: 'bar',
            numeric: { max: 2 },
            capital: { min: 2, max: 1 },
            minuscule: { max: 2 },
            special: { max: 2 },
            size: 16
        });
        assert(16, r.generate().length);


        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            password: 'bar',
            numeric: { max: 2 },
            capital: { max: 2 },
            minuscule: { min: 2, max: 1 },
            special: { max: 2 },
            size: 16
        });
        assert(16, r.generate().length);


        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            password: 'bar',
            numeric: { max: 2 },
            capital: { max: 2 },
            minuscule: { max: 2 },
            special: { min: 2, max: 1 },
            size: 16
        });
        assert.equal(16, r.generate().length);

        done();
    });
});
