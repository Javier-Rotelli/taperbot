import fs from 'fs'
import { isEmpty, modifyPath, path as rPath } from 'ramda'

let stores = {}

function setPath(newValue, path, value) {
  let func = typeof newValue === 'function' ? newValue : () => newValue
  if (isEmpty(path)) {
    return func(value)
  }
  return modifyPath(path, func, value)
}

function getPath(store, path) {
  const newStore = {
    get value() {
      return rPath(path, store.value)
    },
    get(newPath) {
      return getPath(newStore, newPath)
    },
    set(newValue, newPath = []) {
      store.set(newValue, [...path, ...newPath])
    },
    close() {}
  }
  return newStore
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
    const writeFile = (value) => {
      fs.writeFileSync(filename, JSON.stringify(value), "utf8")
      verbose && log("storage write")
    }
    const store = {
      value: value,
    }
    store.pendingSave = false
    const throttleWrite = () => {
      if (!store.pendingSave) {
        store.pendingSave = setTimeout(() => {
          store.pendingSave = false
          writeFile(store.value)
        }, writeDelay)
      }
    }
    store.get = (path) => getPath(store, path)
    store.set = (newValue, path = []) => {
      verbose && log("storage set value")
      store.value = setPath(newValue, path, store.value)
      throttleWrite()
    }
    store._flush = () => {
      if (store.pendingSave) {
        clearTimeout(store.pendingSave)
        writeFile(store.value)
        store.pendingSave = false
      }
    }
    store.close = () => {
      store._flush()
      delete stores[filename]
    }
    store.delete = () => {
      store.value = defaultValue
      if (store.pendingSave) {
        clearTimeout(store.pendingSave)
        store.pendingSave = false
      }
      fs.existsSync(filename) && fs.unlinkSync(filename)
    }
    stores[filename] = store
    verbose && log("storage created")
    return store
  },
  _getCurrentStores: () => stores,
})
