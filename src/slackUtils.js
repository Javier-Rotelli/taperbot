import eventTypes from './eventTypes'

export const getUsers = async (emitter) => {
  return new Promise((resolve, reject) => {
    emitter.emit(eventTypes.OUT.webGet, 'users.list', {}, (err, response) => {
      if (err) {
        reject(err)
      }
      resolve(response.members)
    })
  })
}

export const getChannels = async (emitter) => {
  return new Promise((resolve, reject) => {
    emitter.emit(eventTypes.OUT.webGet, 'channels.list',
      {
        exclude_archived: true,
        exclude_members: true
      },
      (err, response) => {
        if (err) {
          reject(err)
        }
        resolve(response.channels)
      })
  })
}

export const getGroups = async (emitter) => {
  return new Promise((resolve, reject) => {
    emitter.emit(eventTypes.OUT.webGet, 'groups.list',
      {
        exclude_archived: true
      },
      (err, response) => {
        if (err) {
          reject(err)
        }
        resolve(response.groups)
      })
  })
}
