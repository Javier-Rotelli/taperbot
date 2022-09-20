import fs from 'fs'
import { isEmpty, assocPath, path as rPath } from 'ramda'

let stores = {}

function setPath(newValue, path, value) {
  newValue = typeof newValue === 'function' ? newValue(rPath(path, value)) : newValue
  if (isEmpty(path)) {
    return newValue
  }
  return assocPath(path, newValue, value)
}

function getPath(store, path) {
  return {
    get value() {
      return rPath(path, store.value)
    },
    get(newPath) {
      return getPath(this, newPath)
    },
    set(newValue, newPath = []) {
      store.set(newValue, [...path, ...newPath])
    },
    close() {}
  }
}

function writeFile(filename, value, log) {
  fs.writeFileSync(filename, JSON.stringify(value), "utf8")
  log && log("storage write")
}
function throttleWrite(store, filename, writeDelay, log) {
  if (!store.pendingSave) {
    store.pendingSave = setTimeout(() => {
      store.pendingSave = false
      writeFile(filename, store.value, log)
    }, writeDelay)
  }
}

export default (pluginName, { verbose = false, log, writeDelay = 10000 } = {}) => ({
  createStore: (root, defaultValue) => {
    const suffix = root ? `-${root}` : ''
    const filename = `data/${pluginName}${suffix}.json`
    if (stores[filename]) {
      return stores[filename]
    }
    const value = (fs.existsSync(filename)) ?
      JSON.parse(fs.readFileSync(filename, "utf8")) : defaultValue
    const store = {
      value: value,
      pendingSave: false,
      get: function (path) { return getPath(this, path) },
      set: function (newValue, path = []) {
        verbose && log("storage set value")
        this.value = setPath(newValue, path, this.value)
        throttleWrite(this, filename, writeDelay, verbose && log)
      },
      _flush: function () {
        if (this.pendingSave) {
          clearTimeout(this.pendingSave)
          writeFile(this.value)
          this.pendingSave = false
        }
      },
      close: function () {
        this._flush()
        delete stores[filename]
      },
      delete: function () {
        this.value = defaultValue
        if (this.pendingSave) {
          clearTimeout(this.pendingSave)
          this.pendingSave = false
        }
        fs.existsSync(filename) && fs.unlinkSync(filename)
      }
    }
    stores[filename] = store
    verbose && log("storage created")
    return store
  },
  _getCurrentStores: () => stores,
})
