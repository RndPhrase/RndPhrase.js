(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['cubehash'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory(require('cubehash.js'));
    } else {
        // Browser globals (root is window)
        root.rndphrase = factory(root.cubehash);
    }
}(this, function (hmac) {


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

   function setup_source(source, alphabet) {
        s = source || {};
        var min = parseInt(s.min);
        if(isNaN(min)) s.min = 1;
        var max = parseInt(s.max);
        if(isNaN(s.max)) s.max = 0;
        // if(!s.alphabet) s.alphabet = alphabet;
        return s;
    }


    function RndPhrase(config) {
        var self = this,
            host,
            seed,
            doc;

        config = config || {};


        self.hash = function(seed, data) {
            return hmac(seed + data)
        }


        self.seed = self.hash('', config.seed || '');

        if (!config.uri) {
            throw new Error('RndPhrase: Missing hostname in configuration');
        }

        self.uri = config.uri;

        self.passwd = config.password || '';

        self.version = parseInt(config.version);

        if(isNaN(self.version) || self.version < 0) {
            self.version = 1;
        }

        self.size = parseInt(config.size);
        if(isNaN(self.size)) {
            self.size = 16;
        }

        self.rules = {};

        self.capital = config.capital;
        if(config.capital !== false) {
            var alpha = '';
            var cfg = config.capital || {};

            for(var cc = 65; cc < 91; cc++) {
                alpha += String.fromCharCode(cc);
            }

            self.rules.capital = {
                'min': cfg.min || 1,
                'max': cfg.max || 0,
                'alphabet': cfg.alphabet || alpha
            };
        }

        self.minuscule = config.minuscule;
        if(self.minuscule !== false) {
            var alpha = '';
            var cfg = config.minuscule || {};
            for(var cc = 97; cc < 123; cc++) {
                alpha += String.fromCharCode(cc);
            }

            self.rules.minuscule = {
                'min': cfg.min || 1,
                'max': cfg.max || 0,
                'alphabet': cfg.alphabet || alpha
            };
        }

        self.numeric = config.numeric;
        if(self.numeric !== false) {
            var alpha = '';
            var cfg = config.numeric || {};
            for(var cc = 48; cc < 58; cc++) {
                alpha += String.fromCharCode(cc);
            }
            self.rules.numeric = {
                'min': cfg.min || 1,
                'max': cfg.max || 0,
                'alphabet': cfg.alphabet || alpha
            };
        }

        self.special = config.special;
        if(self.special !== false) {
            var cc = 32;
            var alpha = '';
            var cfg = config.special || {};
            while(cc < 127) {
                if(cc < 48 || (cc > 57 && cc < 65) ||
                   (cc > 90 && cc < 97) || cc > 122) {
                    alpha += String.fromCharCode(cc);
                }
                cc++;
            }
            self.rules.special = {
                'min': cfg.min || 1,
                'max': cfg.max || 0,
                'alphabet': cfg.alphabet || alpha
            };
        }

        self.validate = config.validate || function validate(h, rules, size) {
            for(var r in rules) {
                var rule = rules[r];
                if(rule.count < rule.min) return false;
            }

            return h.length >= size;
        };

        self.alphabet = config.alphabet;

        self.generate_alphabet = function(rules) {
            var alpha = ''
            if(self.alphabet) {
                alpha = self.alphabet;
            } else {
                for(var r in rules) {
                    alpha += rules[r].alphabet
                }
            }

            //this requires Javascript 1.6
            return alpha.split('').filter(function(v, i, s) {
                is_char = is_capital(v) || is_minuscule(v) || is_numeric(v) || is_special(v);
                return s.indexOf(v) === i && is_char;
            }).sort();
        }


        self.pack = function(unpacked) {
            function getInt(size) {
                if(unpacked.length < size) {
                    //maybe we can also use the alphabets or something for adding more entropy
                    unpacked += self.hash(
                                    self.hash(
                                        self.hash('', tmp),
                                        unpacked),
                                    size
                                );
                }
                var n = parseInt(unpacked.substring(0,size), 16);
                unpacked = unpacked.substring(size);
                return n;
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
                    throw new Error("Illegal character: " + c);
                }
            }

            var tmp = '';
            var metadata = self.rules;
            var min_size = 0;
            var alpha = '';
            for(var k in metadata) {
                var md = metadata[k];
                metadata[k].count = 0;
                if(md.max < md.min) {
                    min_size += self.size;
                } else {
                    min_size += md.max;
                }
            }
            var alphabet = self.generate_alphabet(metadata);
            var divisor = alphabet.length;

            //How large should the ints be?
            //Put here so we always pick the same size consistently
            var n = 0;
            while(Math.pow(16, n) < divisor) n++;
            var m = Math.pow(16, n);

            while(!self.validate(tmp, metadata, Math.min(min_size, self.size))) {
                try {
                    var idx;
                    var c;
                    var r;

                    do {
                        idx = getInt(n);
                    } while(idx >= m - (m % divisor));

                    c = alphabet[idx % divisor];
                    r = charIs(c);

                    if(metadata[r].max >= metadata[r].min && metadata[r].count >= metadata[r].max) {
                        delete metadata[r];
                        alphabet = self.generate_alphabet(metadata);
                        divisor = alphabet.length;
                        continue;
                    }
                    tmp += c;
                    metadata[r].count++;
                } catch(e) {
                    console.log(e);
                    throw new Error("RndPhrase: Could not generate valid hash.");
                }
            }
            return tmp;
        };

        self.generator = function (passwd) {
            // produce secure hash from seed, password and host
            return function() {
                self.passwd = self.pack(
                    self.hash(
                        self.hash(
                            self.hash(
                                self.hash(self.passwd, '$' + self.uri),
                                self.seed),
                            self.passwd),
                        self.version)
                    );
                return self.passwd;
            };
        };

        self.state = self.generator(self.passwd);

        self.generate = function(password) {
            if(password) self.state = self.generator(password);
            return self.state();
        };
    }

    RndPhrase.prototype = {
        // This will be overwritten by constructor
        generator: function () {
            throw new Error('RndPhrase: No generator installed');
        }
    };

    return RndPhrase;
}));
