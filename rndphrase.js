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
    // The RndPhrase object being exported
    function RndPhrase(config) {
        var self = this;

        config = config || {};
        self.seed = config.seed || '';
        self.uri = config.uri;
        self.password = config.password || '';

        self.capital = config.capital;
        self.minuscule = config.minuscule;
        self.numeric = config.numeric;
        self.special = config.special;

        self.version = parseInt(config.version);
        if(isNaN(self.version) || self.version < 0) {
            self.version = 1;
        }

        self.size = parseInt(config.size);
        if(isNaN(self.size)) {
            self.size = 32;
        }

        // Generate byte array with deterministic pseudo random numbers
        self.dprng_function = config.dprng_function || dprng_function;

        // Validate a password against rules
        self.validate = config.validate || validate;

        self.generate = function(password, callback) {
            var rules = {
                'capital': setup_rule(
                    self.capital,
                    'ABCDEFGHIJKLMONPQRSTUVWXYZ'),
                'minuscule': setup_rule(
                    self.minuscule,
                    'abcdefghijklmnopqrstuvwxyz'),
                'numeric': setup_rule(
                    self.numeric,
                    '0123456789'),
                'special': setup_rule(
                    self.special,
                    ' !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~')
            };

            self.dprng_function(
                (password || self.password),
                self.seed + '$' + self.uri,
                self.version,
                self.size,
                function(key) {
                    generate_password(
                        key,
                        rules,
                        self.validate,
                        function(rndphrase) {
                            callback(rndphrase);
                        });
                }
            );
        };
    }

    // Private module methods
    function dprng_function(password, salt, rounds, size, callback) {
        if (typeof exports === 'object') {
            var crypto = require('crypto');

            crypto.pbkdf2(password, salt, rounds, size,
                function(err, key) {
                    callback(new Uint8Array(key));
                }
            );
        } else {
            // Adapted from https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
            // Be warned, this assumes utf-8 input
            function str2ab(str) {
                var buf = new ArrayBuffer(str.length);
                var bufView = new Uint8Array(buf);
                for (var i = 0; i < str.length; i += 1) {
                    bufView[i] = str.charCodeAt(i);
                }
                return buf;
            }

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

    function validate(h, rules) {
        var i, char_type;
        var count = {};

        for(i in rules) {
            if(rules.hasOwnProperty(i)) {
                count[i] = 0;
            }
        }

        for(i = 0; i < h.length; i += 1) {
            char_type = charType(h.charAt(i), rules);
            count[char_type] += 1;
        }
        for(i in rules) {
            if(count[i] < rules[i].min) {
                return false;
            }
        }
        return true;
    };

    function charType(c, rules) {
        var r;
        for(r in rules){
            if(rules.hasOwnProperty(r)) {
                if(rules[r].alphabet.indexOf(c) !== -1) {
                    return r;
                }
            }
        }
    }

    function setup_rule(rule, alphabet){
        if (rule !== false){
            var cfg = rule || {};
            return {
                'min': cfg.min || 1,
                'max': cfg.max || 0,
                'alphabet': cfg.alphabet || alphabet
            };
        }
    }

    // Create the actual password from a given hash
    function generate_password(bytes, rules, validate, callback) {
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
        var current_constraints = init_current_constraints(rules);
        var alphabet = generate_alphabet(current_constraints);
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
                alphabet = generate_alphabet(current_constraints);
            }
            next_char = getNextChar(alphabet);
        }

        if(validate(password, rules)) {
            callback(password);
        } else {
            // This should only happen for very small values of `size`.
            throw new Error('Unable to generate valid password.');
        }
    }

    function init_current_constraints(rules) {
        var current_constraints = {};
        for(var r in rules){
            if(rules.hasOwnProperty(r)) {
                current_constraints[r] = rules[r];
                current_constraints[r].count = 0;
            }
        }

        return current_constraints;
    }
    // Create an alphabet string based on the current rules
    function generate_alphabet(rules) {
        var r,
            alphabet = '';
        for(r in rules) {
            if(rules.hasOwnProperty(r)) {
                alphabet += rules[r].alphabet;
            }
        }
        return alphabet;
    }

    return RndPhrase;
}));
