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

    // pack :: String[64] -> String[16]
    function pack(msg) {
        // Note: modulus introduces a bias
        // use 2 bytes to pick the letter to relax this
        var s = '',
            i;
        for (i = 0; i < msg.length; i += 4) {
            s += alphabet.charAt(parseInt(msg.substring(i, i + 4), 16) % alphabet.length);
        }
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
            throw new Error('RnPhrase: Missing seed in configuration');
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

        self.generator = function (passwd) {
            // produce secure hash from seed, password and host
            return pack(hash(hash(hash(passwd + '$' + host) + seed) + passwd));
        };

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
        },

        generate: function (passwd) {
            return this.generator(passwd);
        }
    };

    return RndPhrase;
}));
