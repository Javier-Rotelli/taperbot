import commandParser from '../commandParser'
import createDebug from 'debug'
const log = createDebug('taperbot:utils')

export default (config, emitter) => {
  const processMessage = async (message) => {
    const command = commandParser(message.text)
    if (command === null) {
      return
    }
    let response = null
    switch (command.command) {
      case 'users':
        log('listando usuarios')
        response = await getUsers(emitter)
        break
      case 'channels':
        log('listando channels')
        response = await getChannels(emitter)
    }

    if (response !== null) {
      emitter.emit('send:message', response, message.channel)
    }
  }

  emitter.on('received:message', processMessage)
}

const getUsers = async (emitter) => {
  return new Promise((resolve, reject) => {
    emitter.emit('web', 'users.list', {}, (err, response) => {
      if (err) {
        reject(err)
      }
      resolve(response.members
        .map((member) => `id: ${member.id}, name: ${member.name}`)
        .join('\n'))
    })
  })
}

const getChannels = async (emitter) => {
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
        resolve(response.channels
        .map((member) => `id: ${member.id}, name: ${member.name}`)
        .join('\n'))
      })
  })
}
