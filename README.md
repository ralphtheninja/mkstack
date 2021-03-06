# mkstack

> Create and apply your favorite npm stacks.

[![npm](https://img.shields.io/npm/v/mkstack.svg)](https://www.npmjs.com/package/mkstack)
![Node version](https://img.shields.io/node/v/mkstack.svg)
[![Build Status](https://travis-ci.org/ralphtheninja/mkstack.svg?branch=master)](https://travis-ci.org/ralphtheninja/mkstack)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```
$ npm install mkstack -g
```

## Usage

#### Create a stack

`$ mkstack -c|--create :id`

Lets setup a web stack. We need `browserify` and some other stuff.

```
$ mkdir ~/new-web-project && cd ~/new-web-project && npm init --yes
$ npm i browserify --save
$ npm i shoe --save --save-exact
$ npm i send --save --save-exact
$ npm i node-sass --save
$ npm i tape --save-dev
$ npm i nodemon --save-dev --save-exact
```

Save it.

```
$ mkstack -c web
Created web
```

#### Apply stack(s)

`$ mkstack -a|--apply :ids [-y|--yarn]`

Time for a new web project. Create a new folder and apply the previously saved stack. This will do:

* `npm i :project --save` for all `dependencies`
* `npm i :project --save-dev` for all `devDependencies`.

*Use -y or --yarn if you want to use yarn instead of npm*

```
$ mkdir ~/next-project && cd ~/next-project && npm init --yes
$ mkstack -a web
Applying web
..
```

If you create your stack abstractions well you can combine them. Perhaps you want a `test` stack that contains your favorite test modules, e.g. `tape`, `chai`, `phantomjs` etc.

Note that the order of the stacks are important since npm will save `package.json` each time and update in the order the stacks are applied.

```
$ mkstack -a web
$ mkstack -a sockets
$ mkstack -a tcp-server
$ mkstack -a irc2
$ mkstack -a console
```

Or use a comma separated list. This is more optimal since the dependency configuration will be merged before doing `npm install` to avoid installing modules multiple times to save time.

```
$ mkstack -a web,sockets,tcp-server,irc2,console
Applying web,sockets,tcp-server,irc2,console
..
```

#### List stacks

`$ mkstack -l|--list`

List your saved stacks with the `-l` flag. Note that `mkstack` does not have any opinions on version numbers. It just saves them as you specified them the first time.

```
$ mkstack -l
{
  "web": {
    "dependencies": {
      "browserify": "^8.1.1",
      "node-sass": "^2.0.0-beta",
      "send": "0.11.1",
      "shoe": "0.0.15"
    },
    "devDependencies": {
      "nodemon": "1.3.2",
      "tape": "^3.4.0"
    }
  }
}
```

#### Remove stack

`$ mkstack --rm :id`

```
$ mkstack --rm web
Removed web
$ mkstack -l
No stacks found
```

## Config

`mkstack` uses [`rc`](https://github.com/dominictarr/rc). Default path for current config file is `~/.mkstackrc` but that can be changed by using the `--config` flag:

```
$ mkstack -c websockets --config ~/path/to/my/stacks
```

## License

[GPL-3.0](LICENSE) © 2018-present Lars-Magnus Skog.
