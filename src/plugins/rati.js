export default (config, emitter) => {
  emitter.on('reaction:added', (payload) => {
    if (payload.item.type === 'message' &&
      payload.item.channel === config.channel &&
      payload.item_user === config.cook) {
      const time = new Date(payload.item.event_ts).getHours()
      if (time >= 10 && time < 14) {
        const text = `<@${payload.item.user}> \r\n https://media.giphy.com/media/26uf3DbP1a8nwAw6c/giphy.gif`
        emitter.emit('send:message', text, payload.item.channel)
      }
    }
  })
}
