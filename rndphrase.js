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
    // Private module methods

    // Adapted from https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
    // Be warned, this assumes utf-8 input
    function str2ab(str) {
        var buf = new ArrayBuffer(str.length);
        var bufView = new Uint8Array(buf);
        for (var i=0; i < str.length; i += 1) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    }

    function charIs(c) {
        if(is_capital(c)) {
            return 'capital';
        } else if(is_minuscule(c)) {
            return 'minuscule';
        } else if(is_numeric(c)) {
            return 'numeric';
        } else if(is_special(c)) {
            return 'special';
        } else {
            //non-ascii char
            throw new Error('Illegal character: ' + c);
        }
    }

    function is_capital(c) {
        var cc = c.charCodeAt(0);
        return cc > 64 && 91 > cc;
    }

    function is_minuscule(c) {
        var cc = c.charCodeAt(0);
        return cc > 96 && 123 > cc;
    }

    function is_numeric(c) {
        var cc = c.charCodeAt(0);
        return 47 < cc && cc < 58;
    }

    function is_special(c) {
        var cc = c.charCodeAt(0);
        return ((31 < cc && cc < 48) ||
                (cc > 57 && cc < 65) ||
                (cc > 90 && cc < 97) ||
                (cc > 122 && cc < 127));
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

    function dprng_func(password, salt, rounds, size, callback) {
        if (typeof exports === 'object') {
            var crypto = require('crypto');

            crypto.pbkdf2(password, salt, rounds, size, function(err, key) {
                callback(new Uint8Array(key));
            });
        } else {
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

    // Create an alphabet string based on the current rules
    function generate_alphabet(rules) {
        var r,
            alpha = '';
        for(r in rules) {
            if(rules.hasOwnProperty(r)) {
                alpha += rules[r].alphabet;
            }
        }

        //this requires Javascript 1.6
        return alpha.split('').filter(function(v, i, s) {
            var is_char = (is_capital(v) ||
                       is_minuscule(v) ||
                       is_numeric(v) ||
                       is_special(v));
            return s.indexOf(v) === i && is_char;
        }).sort();
    }

    // Create the actual password from a given hash
    function generate_password(bytes, rules, validate, callback) {
        function getNextChar(alphabet) {
            var dprn,
                divisor = alphabet.length,
                maxPrnVal = Math.pow(16);
            do {
                dprn = bytes[0];
                bytes = bytes.slice(1);
            } while(dprn >= maxPrnVal - (maxPrnVal % divisor));

            if (isNaN(dprn)) {
                return undefined;
            }

            return alphabet[dprn % divisor];
        }

        var password = '';
        var metadata = rules;
        var min_size = 0;

        // Do some preprocessing in order to generate alphabet properly
        for(var k in metadata) {
            if(metadata.hasOwnProperty(k)) {
                var md = metadata[k];
                metadata[k].count = 0;
                if(md.max < md.min) {
                    min_size += bytes.length;
                } else {
                    min_size += md.max;
                }
            }
        }
        var alphabet = generate_alphabet(metadata);
        var divisor = alphabet.length;

        var nextChar = getNextChar(alphabet);
        var charType;
        while(nextChar) {
            charType = charIs(nextChar);
            password += nextChar;
            metadata[charType].count += 1;

            // Regenerate alphabet if necessary
            var typeMetadata = metadata[charType];
            if(typeMetadata.max >= typeMetadata.min &&
               typeMetadata.count >= typeMetadata.max) {
                delete metadata[charType];
                alphabet = generate_alphabet(metadata);
                divisor = alphabet.length;
            }
            nextChar = getNextChar(alphabet);
        }

        if(validate(password, rules)) {
            callback(password);
        } else {
            // This should only happen for very small values of `size`.
            throw new Error('Unable to generate valid password.');
        }
    }

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
        self.dprng_func = config.dprng_func || dprng_func;

        // Validate a password against rules
        self.validate = config.validate || function(h, rules) {
            var i, charType;
            var count = {};

            for(i in rules) {
                if(rules.hasOwnProperty(i)) {
                    count[i] = 0;
                }
            }

            for(i = 0; i < h.length; i += 1) {
                charType = charIs(h.charAt(i));
                count[charType] += 1;
            }

            for(i in rules) {
                if(count[i] < rules[i].min) {
                    return false;
                }
            }
            return true;
        };

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

            self.dprng_func(
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

    return RndPhrase;
}));
