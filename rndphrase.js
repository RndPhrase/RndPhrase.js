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

   function setup_source(source, alphabet) {
        s = source || {};
        var min = parseInt(s.min);
        if(isNaN(min)) s.min = 1;
        var max = parseInt(s.max);
        if(isNaN(s.max)) s.max = 0;
        if(!s.alphabet) s.alphabet = alphabet;
        return s;
    }

    function validate(hash, sources, size) {
            for(var s in sources) {
                if(sources[s].min > 0) {
                    if(sources[s].count < sources[s].min) {
                        return false;
                    }
                }
            }
            return hash.length >= size;
    }

    var state;

    function RndPhrase(config) {
        var self = this,
            host,
            seed,
            doc;

        config = config || {};

        seed = hash(config.seed || '');

        if (!config.uri) {
            throw new Error('RndPhrase: Missing hostname in configuration');
        }

        uri = config.uri;

        passwd = config.password || '';

        version = parseInt(config.version);

        if(isNaN(version) || version < 0) {
            version = 1;
        }

        size = parseInt(config.size);
        if(isNaN(size)) {
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
            special = setup_source(special, " !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~");
        }

        self.pack = function(unpacked) {
            var sources = [];
            if(capital) sources.push(capital);
            if(minuscule) sources.push(minuscule);
            if(numeric) sources.push(numeric);
            if(special) sources.push(special);

            var min_size = 0;
            
            if(!sources.length) {
                throw new Error("RndPhrase: Could not generate valid hash.")
            }

            //if max for each source is zero, we remove it
            for(var i = 0; i < sources.length; i++) {
                if(!sources[i].min && !sources[i].max){
                    sources.splice(i,1);
                } else {
                    if(sources[i].max >= sources[i].min) {
                        min_size += sources[i].max;
                    } else {
                        min_size += size;
                    }
                    sources[i].count = 0;
                }
            }

            function getInt(size) {
                if(unpacked.length < size) {
                    //maybe we can also use the alphabets or something for adding more entropy
                    unpacked += hash(hash(hash(tmp) + unpacked) + size);
                }

                n = parseInt(unpacked.substring(0,size), 16);
                unpacked = unpacked.substring(size);
                return n;
            }

            var tmp = '';

            while(!validate(tmp, sources, Math.min(min_size, size))) {
                try {
                    var integer;
                    if(16 % sources.length) {
                        do {
                            integer = getInt(1);
                        } while(integer > (14 - (15 % sources.length)))
                    } else {
                        integer = getInt(1);
                    }
                    
                    choice = integer % sources.length;
                    source = sources[choice];

                    var c;

                    if(256 % source.alphabet.length) {
                        do {
                            c = getInt(2);
                        } while(c > (254 - (255 % source.alphabet.length)))
                    } else {
                        c = getInt(2);
                    }

                    tmp += source.alphabet.charAt(c % source.alphabet.length);
                    sources[choice].count++;
                    if(source.max >= source.min && sources[choice].count >= source.max) {
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
