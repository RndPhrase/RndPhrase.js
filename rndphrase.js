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
    var alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789',
        domains = {
            get_host: function (str) { return str; }
        };

    function addEvent(e, el, fn) {
        if (el.addEventListener) {
            // W3C DOM
            el.addEventListener(e, fn, false);
        } else if (el.attachEvent) {
            // IE DOM
            el.attachEvent('on' + e, fn);
        } else { // No much to do
            el['on' + e] = fn;
        }
    }

    function clearInput(input) {
        input.style.backgroundColor = '';
        input._rndphrase = '';
    }

    function updateInput(self, input) {
        if (input._rndphrase === 'active' && input.value) {
            input.value = self.generator(input.value);
            clearInput(input);
        }
    }

    // keypress :: State -> DOMEvent -> ()
    function keypress(self) {
        return function (e) {
            var input = e && e.target || window.event.srcElement;

            if (input.type === undefined) {
                return;
            }

            if (input.type.toLowerCase() === 'password' && input.value === '' && String.fromCharCode(e.which) === '@') {
                // don't add the @ to the value
                e.stopPropagation();
                e.preventDefault();

                // new rndphrase password field
                input._rndphrase = 'active';
                input.style.backgroundColor = '#CCCCFF';

                addEvent('blur', input, function () {
                    updateInput(self, input);
                });
            }
        };
    }

    // keydown :: State -> DOMEvent -> ()
    function keydown(self) {
        return function (e) {
            var input = e && e.target || window.event.srcElement;

            if (input && input._rndphrase === 'active') {
                switch (e.which) {
                case  9: // Tab
                case 13: // Enter
                    updateInput(self, input);
                    break;
                case  8: // Backspace
                case 27: // Escape
                case 46: // Delete
                    clearInput(input);
                    break;
                default:
                }
            }
        };
    }

    function is_alpha(c) {
        var cc = c.charCodeAt(0);
        return ((cc > 64 && 91 > cc) || (cc > 96 && 123 > cc));
    }

    function is_num(c) {
        return (47 < c.charCodeAt(0) < 58);
    }

    function str2ints(str) {
        var ints = [];
        for (i = 0; i < str.length; i += 2) {
            ints.push(parseInt(str.substring(i, i + 2), 16));
        }
        return ints;
    }

    function setup_source(source, alphabet) {
        s = source || {};
        if(!s.min) s.min = 0;
        if(!s.max) s.max = -1;
        if(!s.alphabet) s.alphabet = alphabet;
        return s;
    }

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

        if (!config.domain && typeof location !== 'undefined') {
            // Running in browser. Auto detect hostname
            config.domain = location.hostname;
        }

        if (!config.domain) {
            throw new Error('RndPhrase: Missing hostname in configuration');
        }

        host = domains.get_host(config.domain);

        if (!host) {
            throw new Error('RndPhase: ' + config.domain + ' is not a valid hostname');
        }

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
            special = setup_source(special, '!@#$%^&*[{()}]_+-= ,.?');
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
            //unpacked should be of the size
            //sources*2*size
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

            var ints = str2ints(unpacked);
            var hash = '';

            while(!self._validate(hash, sources)) {
                try {
                    var integer = ints.shift();
                    choice = integer % sources.length;
                    source = sources[choice];
                    hash += source.alphabet.charAt(ints.shift() % source.alphabet.length);
                    sources[choice].count++;
                    if((sources[choice].max > 0) && !(sources[choice].count < sources[choice].max)) {
                        sources.splice(choice, 1);
                    }
                } catch(e) {
                    //This is most likely due to our bag of ints running short of numbers.
                    throw new Error("RndPhrase: Could not generate valid hash.");
                }
            }
            return hash;
        }

        self.generator = function (passwd) {
            // produce secure hash from seed, password and host
            return function() {
                passwd = self.pack(hash(hash(hash(hash(passwd + '$' + host) + seed) + passwd) + version));
                return passwd;
            }
        };

        passwd = config.password;

        if(!passwd) {
            throw new Error('RndPhrase: Missing password in configuration');
        }

        _g = self.generator(passwd);

        self.generate = function() {
            return _g();
        }

        doc = config.document || typeof document === 'object' && document;

        if (doc) {
            addEvent('keypress', doc, keypress(self), true);
            addEvent('keydown', doc, keydown(self), true);
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
