import commandParser from '../commandParser'
// import { getUsers } from '../messageUtil'

export default (config, emitter, log) => {
  emitter.on('received:message', (message) => {
    const command = commandParser(message.text)
    if (command === null || command.command !== 'nuevoChannel') {
      return
    }
    const [channelName, birthdayer, ...people] = command.text.split('\n').map(s => s.trim())

    log(command.text)
    return

    emitter.emit('web', 'conversations.create', {
      name: channelName,
      is_private: true
    }, (err, response) => {
      log(response)
      if (err || response.ok === false) {
        emitter.emit('send:message', 'algo se rompio, no voy a gastarme en ver que', message.channel)
      }
      emitter.emit('web', 'conversations.invite', {
        channel: response.channel.id,
        users: people.filter(name => name === birthdayer).join(',')
      }, () => {})
    })
  })
}
