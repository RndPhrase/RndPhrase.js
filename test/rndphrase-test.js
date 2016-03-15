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
        });

        var r2 = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
        });

        r1.generate('bar', function(p1) {
            r2.generate('bar', function(p2) {
                assert.equal(p1, p2);
                done();
            });
        });

    });

    it('Should be different versions', function(done) {
        var r1 = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            version: 1
        });

        var r2 = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            version: 2
        });


        r1.generate('bar', function(p1) {
            r2.generate('bar', function(p2) {
                assert.notEqual(p1, p2);
                done();
            });
        });
    });


    var types = {
        'capital': 'ABCDEFGHIJKLMONPQRSTUVWXYZ',
        'minuscule': 'abcdefghijklmnopqrstuvwxyz',
        'numeric': '1234567890',
        'special': ' !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'
    };

    function foo(element, index, n) {
        it('Should contain exactly ' + n + ' ' + index, function(done) {
            var config = {
                'seed': 'foo',
                'uri': 'example.net',
                'size': 40,
            }
            config[index] = {
                    min: 4,
                    max: 4,
            }
            var r = new RndPhrase(config);

            r.generate('bar', function(pass) {
                var letters = element;
                var count = 0;

                for (var i = 0; i < letters.length; i++) {
                    count += pass.split(letters[i]).length - 1;
                }

                assert.equal(4, count);
                done();
            });

        });
    }

    for(var index in types) {
        var n = 4;
        var element = types[index];
        foo(element, index, n);
    }


    it('Should be 8 digits long', function(done) {
        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            numeric: { max: 2 },
            capital: { max: 2 },
            minuscule: { max: 2 },
            special: { max: 2 },
            size: 10
        });
        r.generate('bar', function(pass) {
            assert.equal(8, pass.length);
            done();
        });
    });

    it('Should be minimum 10 digits long', function(done) {

        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            numeric: { max: 0 },
            capital: { max: 2 },
            minuscule: { max: 2 },
            special: { max: 2 },
            size: 10
        });

        r.generate('bar', function(pass) {
            assert(10 <= pass.length);
        });


        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            numeric: { max: 2 },
            capital: { max: 0 },
            minuscule: { max: 2 },
            special: { max: 2 },
            size: 10
        });
        r.generate('bar', function(pass) {
            assert(10 <= pass.length);
        });


        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            numeric: { max: 2 },
            capital: { max: 2 },
            minuscule: { max: 0 },
            special: { max: 2 },
            size: 10
        });
        r.generate('bar', function(pass) {
            assert(10 <= pass.length);
        });


        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            numeric: { max: 2 },
            capital: { max: 2 },
            minuscule: { max: 2 },
            special: { max: 0 },
            size: 10
        });
        r.generate('bar', function(pass) {
            assert(10 <= pass.length);
        });

        done();
    });

    it('Should ignore max value', function(done) {
        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            numeric: { min: 2, max: 1},
            capital: { max: 2 },
            minuscule: { max: 2 },
            special: { max: 2 },
            size: 16
        });

        r.generate('bar', function(pass){
            assert(16 <= pass.length);
        });


        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            numeric: { max: 2 },
            capital: { min: 2, max: 1 },
            minuscule: { max: 2 },
            special: { max: 2 },
            size: 16
        });

        r.generate('bar', function(pass){
            assert(16 <= pass.length);
        });

        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            numeric: { max: 2 },
            capital: { max: 2 },
            minuscule: { min: 2, max: 1 },
            special: { max: 2 },
            size: 16
        });

        r.generate('bar', function(pass){
            assert(16 <= pass.length);
        });

        var r = new RndPhrase({
            seed: 'foo',
            uri: 'example.net',
            numeric: { max: 2 },
            capital: { max: 2 },
            minuscule: { max: 2 },
            special: { min: 2, max: 1 },
            size: 16
        });

        r.generate('bar', function(pass){
            assert(16 <= pass.length);
        });
        done();
    });

    it('Should validate', function(done) {
        var r = new RndPhrase({
            'uri': 'example.net'
        });

        // Something containing a minuscule
        assert(r.validate('a', {
            minuscule: {min: 1, max: 2, count: 1, alphabet: 'a'}
        }));

        // Something containing a capital
        assert(r.validate('A', {
            capital: {min: 1, max: 2, count: 1, alphabet: 'A'}
        }));

        // Something containing an integer
        assert(r.validate('2', {
            numeric: {min: 1, max: 2, count: 1, alphabet: '2'}
        }));


        // Something containing a special character

        // Overwritten validate function
        var r2 = new RndPhrase({
            uri: 'example.net',
            validate: function(h, rules, size) {
                return true;
            }});
        assert(r2.validate('', {}));
        done();
    });

    it('Should not validate', function(done) {
        var r = new RndPhrase({
            'uri': 'example.net'
        });

        var r2 = new RndPhrase({
            uri: 'example.net',
            validate: function(h, rules) {
                return false;
            }});
        assert(! r2.validate('', {}));
        done();
    });
});
