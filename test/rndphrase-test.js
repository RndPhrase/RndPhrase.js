/*global describe, it*/

var assert = require('assert'),
    RndPhrase = require('../rndphrase');

describe('RndPhrase', function () {
    var types = {
        'capital': 'ABCDEFGHIJKLMONPQRSTUVWXYZ',
        'minuscule': 'abcdefghijklmnopqrstuvwxyz',
        'numeric': '0123456789',
        'special': ' !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'
    };

    function charTypeCount(typeAlphabet, haystack) {
        var c;
        var count = 0;
        for (var i = 0; i < typeAlphabet.length; i += 1){
            c = typeAlphabet[i];
            count += haystack.split(c).length -1;
        }
        return count;
    }

    describe('Behaviour:', function() {
        it('Should hash deterministically', function (done) {
            var r1 = new RndPhrase();

            var r2 = new RndPhrase();

            r1.generatePassword('bar', function(p1) {
                r2.generatePassword('bar', function(p2) {
                    assert.equal(p1, p2);
                    done();
                });
            });
        });

        it('Should be different versions', function(done) {
            var r1 = new RndPhrase({
                version: 1
            });

            var r2 = new RndPhrase({
                version: 2
            });

            r1.generatePassword('bar', function(p1) {
                r2.generatePassword('bar', function(p2) {
                    assert.notEqual(p1, p2);
                    done();
                });
            });
        });
        it('Should hash with whole uri value', function(done) {
            var r1 = new RndPhrase({
                'uri': 'example.net'
            });
            var r2 = new RndPhrase({
                'uri': 'example.net/path'
            });

            r1.generatePassword('bar', function(p1) {
                r2.generatePassword('bar', function(p2) {
                    assert.notEqual(p1, p2);
                    done();
                });
            });
        });
    });

    describe('Configuration:', function() {
        var change_tests = [];
        var deactivate_tests = [];
        var constraint_defaults = {};

        for (var type in types) {
            if(types.hasOwnProperty(type)) {
                var key_update_values = {
                    'alphabet': type,
                    'max': 1,
                    'min': 4
                };

                var r = new RndPhrase();
                constraint_defaults[type] = r.constraints[type];

                for(var key in key_update_values) {
                    if(key_update_values.hasOwnProperty(key)) {
                        var r1 = new RndPhrase();
                        var expect = r1.constraints[type];
                        expect[key] = key_update_values[key];
                        var change_test = {
                            'type': type,
                            'key': key,
                            'value': key_update_values[key],
                            'expect': expect
                        };
                        change_tests.push(change_test);
                    }
                }

                deactivate_tests.push({
                    'type': type,
                    'alphabet': types[type]
                });

            }
        }

        describe('Defaults:', function(){
            var defaults_tests = [
                {'variable': 'seed', 'expect': ''},
                {'variable': 'uri', 'expect': ''},
                {'variable': 'password', 'expect': ''},
                {'variable': 'size', 'expect': 42},
                {'variable': 'version', 'expect': 1},

            ];
            var r = new RndPhrase();

            defaults_tests.forEach(function(test) {
                it('Default for variable: ' + test.variable, function() {
                    var actual = r[test.variable];
                    assert.equal(actual, test.expect);
                });
            });

            it('Default for variable: constraints', function() {
                var actual_constraints = r.constraints;
                Object.keys(types).forEach(function(type) {
                    Object.keys(r.constraints[type]).forEach(function(key) {
                        assert.equal(
                            actual_constraints[type][key],
                            constraint_defaults[type][key]);
                    });
                });
            });

            var functions = ['dprngFunction', 'validate', 'generatePassword'];
            functions.forEach(function(func) {
                assert.ok(r.hasOwnProperty(func));
                assert.equal(typeof r[func], 'function');
            });
        });

        it('validate() should be overwritable from config', function(done) {
            var i = 1;
            var r1 = new RndPhrase({
                'validate': function() {
                    // Return true when password is 10th iteration
                    if(i < 10) {
                        i += 1;
                        return false;
                    }
                    return true;
                }
            });
            r1.generatePassword('bar', function() {
                assert.equal(r1.version, 10);
                done();
            });
        });

        it(
            'dprngFunction() should be overwritable from config',
            function(done) {
                function dprngFunction(password, salt, rounds, size,
                        callback) {
                    callback([0,1,2,3]);
                }
                var config = {'dprngFunction': dprngFunction};
                var expect_password = '';
                for(var type in types) {
                    if(types.hasOwnProperty(type)) {
                        var c = types[type][0];
                        config[type] = {
                            'min': 1,
                            'max': 0,
                            'alphabet': c
                        };
                        expect_password += c;
                    }
                }
                var r1 = new RndPhrase(config);

                r1.generatePassword('bar', function(p1) {
                    assert.equal(p1, expect_password);
                    done();
                });
            }
        );

        change_tests.forEach(function(test) {
            it(
                'Key: ' + test.key +
                ' should be overwritable for type: ' + test.type,
                function(done) {
                    var config = {};
                    config[test.type] = {};
                    config[test.type][test.key] = test.value;

                    var r1 = new RndPhrase(config);

                    var actual = r1.constraints[test.type];
                    var expect = test.expect;

                    assert.equal(
                        Object.keys(actual).length,
                        Object.keys(expect).length);

                    for (var key in expect) {
                        if(expect.hasOwnProperty(key)) {
                            assert.equal(actual[key], expect[key]);
                        }
                    }
                    done();
                }
            );
        });

        deactivate_tests.forEach(function(test) {
            it(
                'Should let type:' + test.type + ' be deactivated',
                function(done) {
                    var config = {};
                    config[test.type] = false;

                    var r1 = new RndPhrase(config);
                    r1.generatePassword('bar', function(p1) {
                        var actual_count = charTypeCount(test.alphabet, p1);
                        assert.equal(
                            actual_count,
                            0,
                            'Count: ' + actual_count +
                            ' of type: ' + test.type);
                        done();
                    });
                }
            );
        });
    });

    describe('Constraints:', function() {
        Object.keys(types).forEach(function(type) {
            var type_elements = types[type];

            it(
                'Type: ' + type + ' should adhere to minimum constraints',
                function(done) {
                    var r1 = new RndPhrase();
                    r1.generatePassword('bar', function(p1) {
                        var actual_count = charTypeCount(type_elements, p1);
                        var expect_minimum = actual_count + 1;
                        var config = {};
                        config[type] = {
                                'min': expect_minimum,
                        };
                        var r2 = new RndPhrase(config);

                        r2.generatePassword('bar', function(p2) {
                            var actual_count = charTypeCount(
                                type_elements,
                                p2);
                            assert.ok(
                                actual_count >= expect_minimum,
                                'Minimum count: ' + actual_count +
                                ' less than: ' + expect_minimum +
                                ' for: ' + p2);
                            done();
                        });
                    }
                );
            });

            it(
                'Type: ' + type + ' should adhere to maximum constraints',
                function(done) {
                    var r1_config = {};
                    r1_config[type] = {
                        'min': 2
                    };
                    var r1 = new RndPhrase(r1_config);

                    r1.generatePassword('bar', function(p1){
                        var actual_count = charTypeCount(type_elements, p1);
                        var expect_maximum = actual_count - 1;
                        var config = {};
                        config[type] = {
                            'max': expect_maximum
                        };

                        var r2 = new RndPhrase(config);
                        r2.generatePassword('bar', function(p2) {
                            var actual_count = charTypeCount(
                                type_elements,
                                p2);
                            assert.ok(
                                actual_count <= expect_maximum,
                                'Maximum count: ' + actual_count +
                                ' larger than: ' + expect_maximum +
                                ' for: ' + p2);
                            done();
                        });
                    });
                }
            );
        });
    });
});
