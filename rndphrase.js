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
        root.returnExports = factory(root.cubehash);
    }
}(this, function (hash) {

    function is_alpha(c) {
        var cc = c.charCodeAt(0);
        return ((cc > 64 && 91 > cc) || (cc > 96 && 123 > cc));
    }

    function is_num(c) {
        return (47 < c.charCodeAt(0) < 58);
    }

    function setup_source(source, alphabet) {
        s = source || {};
        if(!s.min) s.min = 1;
        if(!s.max) s.max = -1;
        if(!s.alphabet) s.alphabet = alphabet;
        return s;
    }

    var state;

    function RndPhrase(config) {
        var self = this,
            host,
            seed,
            doc;

        config = config || {};

        if (config.seed) {
            seed = hash(config.seed);
        } else {
            throw new Error('RndPhrase: Missing seed in configuration');
        }

        if (!config.uri) {
            throw new Error('RndPhrase: Missing hostname in configuration');
        }

        uri = config.uri;

        if (!uri) {
            throw new Error('RndPhase: ' + config.uri + ' is not a valid hostname');
        }

        passwd = config.password;

        version = config.version

        if(!version || version < 0) {
            version = 1;
        }

        size = config.size;
        if(size == undefined) {
            size = 16;
        }

        capital = config.capital;
        if(capital !== false) {
            capital = setup_source(capital, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
        }

        minuscule = config.minuscule;
        if(minuscule !== false) {
            minuscule = setup_source(minuscule, 'abcdefghijklmnopqrstuvwxyz');
        }

        numeric = config.numeric;
        if(numeric !== false) {
            numeric = setup_source(numeric, '0123456789');
        }

        special = config.special;
        if(special !== false) {
            special = setup_source(special, " !\"#$%&'()*+,-./:;<=>?@[\]^_`{|}~");
        }

        self._validate = function(hash, sources) {
            for(var s in sources) {
                if(sources[s].min > 0) {
                    if(sources[s].count < sources[s].min) {
                        return false;
                    }
                }
            }
            return hash.length >= size;
        }

        self.pack = function(unpacked) {
            var sources = [];
            if(capital) sources.push(capital);
            if(minuscule) sources.push(minuscule);
            if(numeric) sources.push(numeric);
            if(special) sources.push(special);

            if(!sources.length) {
                throw new Error("RndPhrase: Could not generate valid hash.")
            }

            //if max for each source is zero, we remove it
            for(var i = 0; i < sources.length; i++) {
                if(sources[i].max == 0) {
                    sources.splice(i,1);
                } else {
                    sources[i].count = 0;
                }
            }

            function getInt(size) {
                if(unpacked.length < size) {
                    unpacked += hash(tmp)
                }

                n = parseInt(unpacked.substring(0,size), 16);
                unpacked = unpacked.substring(size);
                return n;
            }

            var tmp = '';

            while(!self._validate(tmp, sources)) {
                try {
                    var integer;
                    if(16 % sources.length) {
                        do {
                            integer = getInt(1);
                        } while(integer > (15 - (14 % sources.length)))
                    } else {
                        integer = getInt(1);
                    }
                    
                    choice = integer % sources.length;
                    source = sources[choice];

                    var c;

                    if(256 % source.alphabet.length) {
                        do {
                            c = getInt(2);
                        } while(c > (255 - (254 % source.alphabet.length)))
                    } else {
                        c = getInt(2);
                    }

                    tmp += source.alphabet.charAt(c % source.alphabet.length);
                    sources[choice].count++;
                    if((sources[choice].max > 0) && !(sources[choice].count < sources[choice].max)) {
                        sources.splice(choice, 1);
                    }
                } catch(e) {
                    //This is most likely due to our bag of ints running short of numbers.
                    throw new Error("RndPhrase: Could not generate valid hash.");
                }
            }
            return tmp;
        }

        self.generator = function (passwd) {
            // produce secure hash from seed, password and host
            return function() {
                passwd = self.pack(hash(hash(hash(hash(passwd + '$' + uri) + seed) + passwd) + version));
                return passwd;
            }
        };

        state = self.generator(passwd);

        self.generate = function(password) {
            if(password) state = self.generator(password)
            return state();
        }

    }

    RndPhrase.prototype = {
        // This will be overwritten by constructor
        generator: function () {
            throw new Error('RndPhrase: No generator installed');
        }
    };

    return RndPhrase;
}));
