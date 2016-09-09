(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        //
        module.exports = factory();
    } else {
        root.rndphrase = factory();
    }
}(this, function () {
    var default_constraints = {
        'capital': 'ABCDEFGHIJKLMONPQRSTUVWXYZ',
        'minuscule': 'abcdefghijklmnopqrstuvwxyz',
        'numeric': '0123456789',
        'special': ' !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'
    };

    // The RndPhrase object being exported
    function RndPhrase(config) {
        var self = this;
        config = config || {};
        self.seed = config.seed || '';
        self.uri = config.uri || '';
        self.password = config.password || '';

        self.constraints = {};
        for (var type in default_constraints) {
            if(default_constraints.hasOwnProperty(type)) {
                var constraint = config[type];

                if(constraint !== false){
                    self.constraints[type] = initConstraint(
                        config[type],
                        default_constraints[type]);
                }
            }
        }

        self.version = parseInt(config.version);
        if(isNaN(self.version) || self.version < 0) {
            self.version = 0;
        }

        self.size = parseInt(config.size);
        if(isNaN(self.size)) {
            self.size = 42;
        }

        // Generate byte array with deterministic pseudo random numbers
        self.dprngFunction = config.dprngFunction || dprngFunction;

        // Validate a password against constraints
        self.validate = config.validate || validate;

        self.generatePassword = function(password, callback) {
            var pass;
            if(typeof password === 'function' && callback === undefined) {
                callback = password;
                pass = self.password;
            } else {
                pass = password || self.password;
            }
            self.password = pass;
            self.dprngFunction(
                self.password,
                self.seed + '$' + self.uri,
                self.version*100,
                self.size,
                function(key) {
                    doGeneratePassword(
                        self,
                        key,
                        self.constraints,
                        self.validate,
                        function(rndphrase) {
                            callback(rndphrase);
                        }
                    );
                }
            );
        };
    }

    // Private module methods
    function dprngFunction(password, salt, rounds, size, callback) {
        if (typeof exports === 'object') {
            var crypto = require('crypto');

            crypto.pbkdf2(password, salt, rounds, size,
                function(err, key) {
                    callback(new Uint8Array(key));
                });
        } else {
            // Adapted from https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
            // Be warned, this assumes utf-8 input
            var str2ab = function(str) {
                var buf = new ArrayBuffer(str.length);
                var bufView = new Uint8Array(buf);
                for (var i = 0; i < str.length; i += 1) {
                    bufView[i] = str.charCodeAt(i);
                }
                return buf;
            };

            window.crypto.subtle.importKey(
                'raw',
                str2ab(password),
                {'name': 'PBKDF2'},
                false,
                ['deriveBits']).then(function(key) {
                    window.crypto.subtle.deriveBits(
                    {
                        'name': 'PBKDF2',
                        'salt': str2ab(salt),
                        iterations: rounds,
                        'hash': {'name': 'SHA-1'}
                    },
                    key,
                    size*8
                ).then(function(bits) {
                    callback(new Uint8Array(bits));
                });
            });
        }
    }

    function validate(h, constraints) {
        var i, char_type;
        var count = {};

        for(i in constraints) {
            if(constraints.hasOwnProperty(i)) {
                count[i] = 0;
            }
        }

        for(i = 0; i < h.length; i += 1) {
            char_type = charType(h.charAt(i), constraints);
            count[char_type] += 1;
        }

        for(i in constraints) {
            if(count[i] < constraints[i].min) {
                return false;
            }
        }
        return true;
    }

    function charType(c, constraints) {
        var r;
        for(r in constraints){
            if(constraints.hasOwnProperty(r)) {
                if(constraints[r].alphabet.indexOf(c) !== -1) {
                    return r;
                }
            }
        }
    }

    function initConstraint(constraint, alphabet){
        var cfg = constraint || {};
        return {
            'min': cfg.min || 1,
            'max': cfg.max || 0,
            'alphabet': cfg.alphabet || alphabet
        };
    }

    // Create the actual password from a given hash
    function doGeneratePassword(instance, bytes, constraints, validate, callback) {
        function getNextChar(alphabet) {
            var dprn,
                divisor = alphabet.length,
                maxPrnVal = Math.pow(16);
            do {
                //This is ugly, but the alternative is worse.
                dprn = bytes[0];
                bytes = bytes.slice(1);
            } while(dprn >= maxPrnVal - (maxPrnVal % divisor));

            if(isNaN(dprn)) {
                return undefined;
            }

            return alphabet[dprn % divisor];
        }

        var password = '';
        var current_constraints = initCurrentConstraints(constraints);
        var alphabet = generateAlphabet(current_constraints);
        var next_char = getNextChar(alphabet);
        var char_type;

        while(next_char) {
            char_type = charType(next_char, current_constraints);
            password += next_char;
            current_constraints[char_type].count += 1;

            // Regenerate alphabet if necessary
            var constraint = current_constraints[char_type];
            if(constraint.max >= constraint.min &&
               constraint.count >= constraint.max) {
                delete current_constraints[char_type];
                alphabet = generateAlphabet(current_constraints);
            }
            next_char = getNextChar(alphabet);
        }

        if(validate(password, constraints)) {
            callback(password);
        } else {
            instance.version += 1;
            instance.generatePassword(function(pw) {
                callback(pw);
            });
        }
    }

    function initCurrentConstraints(constraints) {
        var current_constraints = {};
        for(var r in constraints){
            if(r && constraints.hasOwnProperty(r)) {
                current_constraints[r] = constraints[r];
                current_constraints[r].count = 0;
            }
        }
        return current_constraints;
    }

    // Create an alphabet string based on the current constraints
    function generateAlphabet(constraints) {
        var r,
            alphabet = '';
        for(r in constraints) {
            if(constraints.hasOwnProperty(r)) {
                alphabet += constraints[r].alphabet;
            }
        }
        return alphabet;
    }

    return RndPhrase;
}));
