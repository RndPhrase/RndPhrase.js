# RndPhrase.js
[![Build Status](https://travis-ci.org/RndPhrase/RndPhrase.js.svg?branch=master)](https://travis-ci.org/RndPhrase/RndPhrase.js)

RndPhrase.js is a library to generate passwords deterministically
based on domain context.

Passwords are generated deterministically by computing a hash
on a set of credentials (seed, password, domain), using this hash
as a pseudo random number generator in order to pick out characters
from a predefined alphabet of characters of which the final password
(or RndPhrase) is computed.


## Usage
Import RndPhrase.js as a module in your source.

    var RndPhrase = require('rndphrase.js');

Instantiate the object with the minimum configuration requirements

    var r = new RndPhrase();

Invoke the generatePassword method

    r.generatePassword(function(password) {
        console.log(password);
    });
    // &i#`hVeOIG<$_d0)nZ(FMh*v{LMTv)nL#`9X utL 0


## Configuration Options
Configuration items are passed as a plain javascript object. Available configuration options:

### Parameters
#### seed
The seed used. Expected to be a string, but can be everything that
can be hashed by the hashing algorithm. Should be entered manually
once and saved by the plugin using the library. Remember not to
save in plaintext. ;)

#### uri
A string specifying the location, should be generated automatically
by the plugin using the library.

#### password
The password entered by the user. Should be entered manually, do
not save this anywhere.

#### size
Specify how many bits the pseudo random number generator will
output to generate a password. The final password is usually
almost as large.

Defaults to 42.

#### version
Generates a new password with the same credentials.

Defaults to 1.

#### Constraints
A constraint is a javascript object with dict with this structure:

    {
       'min': non-negative-int,
       'max': non-negative-int,
       'alphabet': string
    }

When `max < min`, `max` is ignored. When `max` is `0` it is disabled.

There are four default constraints (or *character types*): `capital`,
`minuscule`, `numeric`, and `special`. Each of which can be deactivated
by setting the constraint to `false`. E.g.
`var r = new RndPhrase({'capital': false });`

The default constraints will be loaded into a `constraints` variable
upon initialisation. Active constraints (keys that are not `false`)
in this variable will be used on every call to `generatePassword()`.

##### Add Manually Defined Character Types
It is possible to add new character types, this is done by configuring
`constraints` directly when instantiating the RndPhrase object.

When `constraints` is used as a configuration parameter one must
declare all constraints manually. The default constraints object
looks like this:

    {
        capital: {
            min: 1,
            max: 0,
            alphabet: 'ABCDEFGHIJKLMONPQRSTUVWXYZ'
        },
        minuscule: {
            min: 1,
            max: 0,
            alphabet: 'abcdefghijklmnopqrstuvwxyz'
        },
        numeric: {
            min: 1,
            max: 0,
            alphabet: '1234567890'
        },
        special: {
            min: 1,
            max: 0,
            alphabet: ' !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'
        }
    }


### Methods
#### dprngFunction
Overwrite this function to supply another hashing algorithm than
the default (PBKDF2). `dprngFunction` takes five arguments `password`,
`salt`, `rounds`, `size`, `callback`.

##### password
The raw password.

##### salt
The salt is a concatenation of the master seed, the uri and a
pepper (to ensure minmal entropy).

##### rounds
How many iterations of the hash to perform. Number is multiplied
with 100 and
added with 50.000.

##### size
The size of the array of numbers to call `callback` with

##### callback
This is an anonymous function which takes a single argument (a
byte array) and invokes the internal password generation function.

#### validate
Overwrite the normal password validation function which checks
whether constraints are upheld. It takes two arguments `h`, `constraints`

##### h
The password candidate.

##### constraints
An object containing the defined constraints.


## Support
Any questions? Please ask them in #rndphrase on irc.freenode.net.


## License
MIT
