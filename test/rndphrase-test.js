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

    it('Should have hash', function(done) {
        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            password: 'bar'
        });
        assert.equal(
            r.generate(),
            'xWDWe*CF^:A|BJ97'
        );
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
            uri: 'example.se',
            password: 'bar'
        });

        assert.notEqual(r.generate(), r.generate());
        done();
    });

    it('Should hash differently', function(done) {
        var r1 = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
        });

        var r2 = new RndPhrase({
            seed: 'foo',
            uri: 'example.se',
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

    it('Should contain exactly 4 capital letters', function(done) {
        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            password: 'bar',
            capital: {
                min: 4,
                max: 4
            }
        });

        var hash = r.generate();
        var letters = 'ABCDEFGHIJKLMONPQRSTUVWXYZ'
        var count = 0;

        for (var i = 0; i < letters.length; i++) {
            count += hash.split(letters[i]).length - 1;
        }

        assert.equal(4, count);
        done();
    });

    it('Should contain exactly 4 minuscule letters', function(done) {
        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            password: 'bar',
            minuscule: {
                min: 4,
                max: 4
            }
        });
        var hash = r.generate();
        var letters = 'abcdefghijklmnopqrstuvwxyz';
        var count = 0;

        for (var i = 0; i < letters.length; i++) {
            count += hash.split(letters[i]).length - 1;
        }

        assert.equal(4, count);
        done();
    });

    it('Should contain exactly 4 numbers', function(done) {
        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            password: 'bar',
            numeric: {
                min: 4,
                max: 4
            },
            capital: false
        });
        var hash = r.generate();
        var letters = '1234567890';
        var count = 0;

        for (var i = 0; i < letters.length; i++) {
            count += hash.split(letters[i]).length - 1;
        }

        assert.equal(4, count);
        done();
    });

    it('Should contain exactly 4 special characters', function(done) {
        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            password: 'bar',
            special: {
                min: 4,
                max: 4
            },
            numeric: false,
            minuscule: false
        });

        var hash = r.generate();
        var letters = ' !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
        var count = 0;

        for (var i = 0; i < letters.length; i++) {
            count += hash.split(letters[i]).length - 1;
        }

        assert.equal(4, count);
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

        assert(16 <= r.generate().length);


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
        assert(16 <= r.generate().length);


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
        assert(16 <= r.generate().length);


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
        assert(16 <= r.generate().length);

        done();
    });

    it('Should use specified alphabet', function(done) {
        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            password: 'bar',
            size: 8,
            alphabet: 'aA0-'
        });
        assert(r.generate().split('').every(function(v) {
            return v == 'a' || v == 'A' || v == '0' || v == '-';
        }));
        done();
    });

    it('Should override rule alphabets', function(done) {
        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            password: 'bar',
            size: 16,
            alphabet: 'aA0-',
            capital: {alphabet: 'ABCDEFGHIJKLMONPQRSTUVWXYZ'},
            minuscule: {alphabet: 'abcdefghijklmnopqrstuvwxyz'},
            numeric: {alphabet: '0123456789'},
            special: {alphabet: ' !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'}
        });

        hash = r.generate()
        assert(hash.split('').every(function(v) {
            return v == 'a'
                || v == 'A'
                || v == '0'
                || v == '-';
        }));

        done();
    });

    it('Should ignore the order', function(done) {
        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            password: 'bar',
            size: 8,
            alphabet: 'aA0-b',
            capital: {alphabet: 'ABCDEFGHIJKLMONPQRSTUVWXYZ'},
            minuscule: {alphabet: 'abcdefghijklmnopqrstuvwxyz'},
            numeric: {alphabet: '0123456789'},
            special: {alphabet: ' !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'}
        });
        done();
    });

    it('Should validate', function(done) {
        var r = new RndPhrase({
            'uri': 'example.net'
        });

        // Everything of minimum size
        assert(r.validate('aaaa', {}, 4));

        // Something containing a minuscule
        assert(r.validate('a', {
            minuscule: {min: 1, max: 2, count: 1}
        }, 1));
        // Something containing a capital
        assert(r.validate('A', {
            capital: {min: 1, max: 2, count: 1}
        }, 1));
        // Something containing an integer
        // Something containing a special character

        // Overwritten validate function
        var r2 = new RndPhrase({
            uri: 'example.net',
            validate: function(h, rules, size) {
                return true;
            }});
        assert(r2.validate('', {}, 42));
        done();
    });

    it('Should not validate', function(done) {
        var r = new RndPhrase({
            'uri': 'example.net'
        });

        // Something too small
        assert(! r.validate('aaaa', {}, 5));

        var r2 = new RndPhrase({
            uri: 'example.net',
            validate: function(h, rules, size) {
                return false;
            }});
        assert(! r2.validate('', {}, 42));
        done();
    });
});
