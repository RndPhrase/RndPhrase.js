(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['improved'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory(require('improved.js'));
    } else {
        // Browser globals (root is window)
        root.RndPhrase = factory(root.RndPhrasePRF);
    }
}(this, function (PseudoRandom) {

    var state;
    var prf;
    function RndPhrase(config) {
        var self = this,
            host,
            seed,
            doc;

        config = config || {};

        prf = new PseudoRandom(config);

        seed = prf.hash(config.seed || '');

        if (!config.uri) {
            throw new Error('RndPhrase: Missing hostname in configuration');
        }

        uri = config.uri;

        if (!uri) {
            throw new Error('RndPhase: ' + config.uri + ' is not a valid hostname');
        }

        passwd = config.password || '';

        version = parseInt(config.version);

        if(isNaN(version) || version < 0) {
            version = 1;
        }

        size = parseInt(config.size);
        if(isNaN(size)) {
            size = 16;
        }

        self.generator = function (passwd) {
            // produce secure hash from seed, password and host
            return function() {
                passwd = prf.pack(prf.hash(prf.hash(prf.hash(prf.hash(passwd + '$' + uri) + seed) + passwd) + version), config);
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
