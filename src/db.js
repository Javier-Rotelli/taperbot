import level from 'level'

import createDebug from 'debug'

const log = createDebug('taperbot:core:db')

export const getDbInstance = dbPath => pluginName => () => {
  log(`starting DB for ${pluginName}`)
  return new Promise((resolve, reject) => {
    level(`${dbPath}${pluginName}.db`, {}, function (err, db) {
      if (err) {
        log('Error opening DB')
        log(err)
        reject(err)
      }
      resolve(db)
    })
  })
}

