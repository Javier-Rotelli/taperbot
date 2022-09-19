import fs from 'fs'

let stores = {}

export default (pluginName, { writeDelay = 1000 } = {}) => ({
  createStore: (root, defaultValue) => {
    const suffix = root ? `-${root}` : ''
    const filename = `data/${pluginName}${suffix}.json`
    if (stores[filename]) {
      return stores[filename]
    }
    const value = (fs.existsSync(filename)) ?
      JSON.parse(fs.readFileSync(filename, "utf8")) : defaultValue
    const writeFile = (value) => fs.writeFileSync(filename, JSON.stringify(value), "utf8")
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
    store.set = (newValue) => {
      store.value = newValue
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
    return store
  },
  _getCurrentStores: () => stores,
})
