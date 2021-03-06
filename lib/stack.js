'use strict'

const fs = require('fs')
const join = require('path').join
const childProcess = require('child_process')
const async = require('async')
const home = require('home-dir')
const defined = require('defined')
const xtend = require('xtend')

const packagerConfig = {
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

const noop = () => {}

module.exports = rc => {
  const obj = {}
  rc = rc || {}
  rc.stacks = rc.stacks || {}

  obj.create = (id, cb) => {
    if (typeof id !== 'string') throw new Error('missing id')
    cb = cb || noop
    fs.stat(packageJsonFile(), (err, stat) => {
      if (err) return cb(new Error('missing package.json'))
      const pkg = requirePkgJson()
      const config = { stacks: rc.stacks }
      const stack = rc.stacks[id] = rc.stacks[id] || {}
      stack.dependencies = defined(pkg.dependencies, {})
      stack.devDependencies = defined(pkg.devDependencies, {})
      if (hasKeys(stack.dependencies) || hasKeys(stack.devDependencies)) {
        return saveRcFile(config, cb)
      }
      cb(new Error('missing dependencies and devDependencies'))
    })
  }

  obj.apply = (ids, packager, cb) => {
    if (!Array.isArray(ids)) throw new Error('ids must be an array')
    if (!ids.length) throw new Error('no stack(s) provided')

    const spawn = childProcess.spawn
    let dependencies = {}
    let devDependencies = {}
    const commandConf = packagerConfig[packager]

    for (let i = 0; i < ids.length; ++i) {
      const id = ids[i]
      const stack = rc.stacks[id]
      if (!stack) {
        return process.nextTick(cb, new Error('No such stack ' + id))
      }
      dependencies = xtend(dependencies, stack.dependencies)
      devDependencies = xtend(devDependencies, stack.devDependencies)
    }

    const installthis = [
      {
        deps: dependencies,
        flags: commandConf['flags']['prod']
      },
      {
        deps: devDependencies,
        flags: commandConf['flags']['dev']
      }
    ]

    async.eachSeries(installthis, (item, next) => {
      const deps = item.deps
      if (!hasKeys(deps)) return next()
      const modules = Object.keys(deps).map(key => {
        return key + '@' + deps[key]
      })
      const args = commandConf['command'].concat(modules).concat(item.flags)
      const child = spawn(packager, args, { stdio: 'inherit' })
      child.on('close', next)
    }, cb)
  }

  obj.remove = (id, cb) => {
    const config = { stacks: rc.stacks }
    if (!rc.stacks[id]) {
      return process.nextTick(cb, new Error('No stack named ' + id))
    }
    delete rc.stacks[id]
    saveRcFile(config, cb)
  }

  function requirePkgJson () {
    try {
      return require(packageJsonFile())
    } catch (e) {
      return {}
    }
  }

  function saveRcFile (config, cb) {
    fs.writeFile(rcFile(), JSON.stringify(config, null, 2), cb)
  }

  function rcFile () {
    return rc.config ? rc.config : join(home(), '.mkstackrc')
  }

  return obj
}

function packageJsonFile () {
  return join(process.cwd(), 'package.json')
}

function hasKeys (deps) {
  return deps && Object.keys(deps).length > 0
}
