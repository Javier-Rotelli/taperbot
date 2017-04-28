export default (config, emitter) => {
  emitter.on('received:message', (message) => {
    if(!message.text.includes('code: ')) {
      return
    }
    const code = message.text.match(/\`([^\`]*)\`/)[1]
    try {
      eval(code)
    } catch (ex) {
      emitter.emit('send:message', ex.message, message.channel)
    }

  })
}
