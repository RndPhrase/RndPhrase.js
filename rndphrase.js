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

    function RndPhrase(config) {
        var self = this,
            host,
            seed,
            doc;

        config = config || {};

        self.seed = hash(config.seed || '');

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

        self.capital = config.capital;
        if(self.capital !== false) {
            self.capital = setup_source(self.capital, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
        }

        self.minuscule = config.minuscule;
        if(self.minuscule !== false) {
            self.minuscule = setup_source(self.minuscule, 'abcdefghijklmnopqrstuvwxyz');
        }

        self.numeric = config.numeric;
        if(self.numeric !== false) {
            self.numeric = setup_source(self.numeric, '0123456789');
        }

        self.special = config.special;
        if(self.special !== false) {
            self.special = setup_source(self.special, " !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~");
        }

        self.pack = function(unpacked) {
            var sources = [];
            if(self.capital) sources.push(self.capital);
            if(self.minuscule) sources.push(self.minuscule);
            if(self.numeric) sources.push(self.numeric);
            if(self.special) sources.push(self.special);

            var min_size = 0;
            var divisor = 0;

            if(!sources.length) {
                throw new Error("RndPhrase: Could not generate valid hash.")
            }

            //if max for each source is zero, we remove it
            //also do some other initialization
            //this is so ugly.. :S
            for(var i = 0; i < sources.length; i++) {
                if(!sources[i].min && !sources[i].max){
                    sources.splice(i,1);
                } else {
                    if(sources[i].max >= sources[i].min) {
                        min_size += sources[i].max;
                    } else {
                        min_size += self.size;
                    }
                    sources[i].count = 0;
                    divisor += sources[i].alphabet.length;
                }
            }

            function getInt(size) {
                if(unpacked.length < size) {
                    //maybe we can also use the alphabets or something for adding more entropy
                    unpacked += hash(hash(hash(tmp) + unpacked) + size);
                }

                var n = parseInt(unpacked.substring(0,size), 16);
                unpacked = unpacked.substring(size);
                return n;
            }

            var tmp = '';

            //Figure out how big ints we need
            //we calculate it here for consistency
            var n = 0;
            while(Math.pow(16, n) < divisor) n++;
            m = Math.pow(16, n);

            while(!validate(tmp, sources, Math.min(min_size, self.size))) {
                try {
                    var c;

                    if(m % divisor) {
                        do {
                            c = getInt(n);
                        } while(c > ((m-2) - ((m-1) % divisor)))
                    } else {
                        c = getInt(n);
                    }
                    c = c % divisor; //cap to full alphabet length

                    var choice = 0;
                    while(c >= sources[choice].alphabet.length) {
                        c -= sources[choice].alphabet.length;
                        choice++;
                    }

                    var source = sources[choice];
                    tmp += source.alphabet.charAt(c);
                    sources[choice].count++;
                    if(source.max >= source.min && sources[choice].count >= source.max) {
                        divisor -= source.alphabet.length;
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
                passwd = self.pack(hash(hash(hash(hash(self.passwd + '$' + self.uri) + self.seed) + self.passwd) + self.version));
                return passwd;
            }
        };

        self.state = self.generator(self.passwd);

        self.generate = function(password) {
            if(password) self.state = self.generator(password)
            return self.state();
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
