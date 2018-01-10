var fs = require('fs')
var join = require('path').join
var spawn = require('child_process').spawn
var async = require('async')
var home = require('home-dir')
var bail = require('bail-out')
var defined = require('defined')
var xtend = require('xtend')

var packagerConfig = {
  npm: {
    flags: {
      prod: [ '--save' ],
      dev: ['--save-dev']
    },
    command: ['install']
  },
  yarn: {
    flags: {
      prod: [],
      dev: ['--dev']
    },
    command: ['add']
  }
}
module.exports = function (rc) {
  var obj = {}

  obj.create = function (id, cb) {
    fs.stat(packageJsonFile(), function (err, stat) {
      if (err) return cb(new Error('missing package.json'))
      var pkg = requirePkgJson()
      var config = { stacks: rc.stacks }
      var stack = rc.stacks[id] = rc.stacks[id] || {}
      stack.dependencies = defined(pkg.dependencies, {})
      stack.devDependencies = defined(pkg.devDependencies, {})
      if (hasKeys(stack.dependencies) || hasKeys(stack.devDependencies)) {
        return saveRcFile(config, cb)
      }
      cb(new Error('both dependencies and devDependencies are empty'))
    })
  }

  obj.apply = function (ids, packager, cb) {
    fs.stat(packageJsonFile(), function (err, stat) {
      if (err) return cb(new Error('missing package.json'))

      var dependencies = {}
      var devDependencies = {}
      var commandConf = packagerConfig[packager]
      ids.split(',').forEach(function (id) {
        var stack = rc.stacks[id]
        if (!stack) return bail(new Error('no such stack ' + id), cb)
        dependencies = xtend(dependencies, stack.dependencies)
        devDependencies = xtend(devDependencies, stack.devDependencies)
      })
      var installthis = [
        { deps: dependencies, flags: commandConf['flags']['prod'], type: 'prod' },
        { deps: devDependencies, flags: commandConf['flags']['dev'], type: 'dev' }
      ]

      async.eachSeries(installthis, function (item, next) {
        var deps = item.deps
        if (!hasKeys(deps)) return next()
        var modules = Object.keys(deps).map(function (key) {
          return key + '@' + deps[key]
        })
        var args = commandConf['command'].concat(modules).concat(item.flags)
        var child = spawn(packager, args, { stdio: 'inherit' })
        child.on('close', next)
      }, cb)
    })
  }

  obj.remove = function (id, cb) {
    var config = { stacks: rc.stacks }
    if (!rc.stacks[id]) return bail(new Error('no stack named ' + id), cb)
    delete rc.stacks[id]
    saveRcFile(config, cb)
  }

  obj.list = function (cb) {
    var keys = Object.keys(rc.stacks)
    if (!keys.length) return bail(null, 'no stacks found', cb)
    if (Object.keys(rc.stacks).length > 0) {
      console.log(JSON.stringify(rc.stacks, null, 2))
      bail(cb)
    }
  }

  function requirePkgJson () {
    try {
      return require(packageJsonFile())
    } catch (e) {
      return {}
    }
  }

  return obj

  function saveRcFile (config, cb) {
    fs.writeFile(rcFile(), JSON.stringify(config, null, 2), cb)
  }

  function rcFile () {
    return rc.config ? rc.config : join(home(), '.mkstackrc')
  }
}

function packageJsonFile () {
  return join(process.cwd(), 'package.json')
}

function hasKeys (deps) {
  return deps && Object.keys(deps).length > 0
}
