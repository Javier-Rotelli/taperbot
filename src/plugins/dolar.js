import {create} from 'apisauce'
import commandParser from '../commandParser'

export default (config, emitter, log) => {
  const api = create({
    baseURL: 'http://ws.geeklab.com.ar/dolar/get-dolar-json.php',
    headers: {'Accept': 'application/json'}
  })
  emitter.on('received:message', (message) => {
    const command = commandParser(message.text)
    if (command === null || command.command !== 'dolar') {
      return
    }

    api.get('').then(res => {
      emitter.emit('send:message', `Oficial: ${res.data.libre}, Blue: ${res.data.blue}`, message.channel)
    }).catch(err => { throw err })
  })
}
