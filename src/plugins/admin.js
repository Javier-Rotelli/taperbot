import commandParser from '../commandParser'

export default (config, emitter, log) => {
  const processMessage = async (message) => {
    const command = commandParser(message.text)
    if (command === null) {
      return
    }
    let response = null
    switch (command.command) {
      case 'info':
        response = `Mi dueño es <@${config.owner}>`
        break
      case 'shutdown':
        log('apagando')
        emitter.emit('send:message', 'adios', message.channel)
        process.exit()
        break
    }

    if (response !== null) {
      emitter.emit('send:message', response, message.channel)
    }
  }

  emitter.on('received:message', processMessage)
}
