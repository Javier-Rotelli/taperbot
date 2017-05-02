export const getUsers = async (emitter) => {
  return new Promise((resolve, reject) => {
    emitter.emit('web', 'users.list', {}, (err, response) => {
      if (err) {
        reject(err)
      }
      resolve(response.members)
    })
  })
}

export const getChannels = async (emitter) => {
  return new Promise((resolve, reject) => {
    emitter.emit('web', 'channels.list',
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
    emitter.emit('web', 'groups.list',
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
