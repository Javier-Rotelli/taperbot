import GoogleSpreadsheet from 'google-spreadsheet'
import promisify from 'es6-promisify'
import table from 'text-table'

import commandParser from './../commandParser'
import { getUsers } from '../slackUtils'

export default (config, emitter, log) => {
  const doc = new GoogleSpreadsheet('1fW46QXKO4XDd-L8hoYFR30AzzVVDe4mL1xhZthbDgtI')

  promisify(doc.getInfo, doc)().then((info) => {
    log(`Loaded doc: ${info.title}`)
    const sheet = info.worksheets[0]

    emitter.on('received:message', processMessage(emitter, sheet, log))
  })
}

const processMessage = (emitter, sheet, log) => async (message) => {
  const command = commandParser(message.text)
  if (command === null) {
    return
  }
  let response = null

  switch (command.command) {
    case 'tabla':
      const text = command.text || ''
      const params = text.trim().split(' ')
      response = await getTable(sheet, params, log)
      break
    case 'manijeala':
      const users = await getUsersDict(emitter)
      response = await quienMeFalta(sheet, users[message.user], log)
      break
  }

  if (response !== null) {
    emitter.emit('send:message', response, message.channel)
  }
}

const ligas = {
  'ELITE': {},
  'LOC': {},
  'SOTOLIGA': {},
  'PARALIGA': {}
}

export const getTable = async (sheet, params, log) => {
  const ligaBuscada = params[0] || ''
  const doMention = !!params[1]

  const liga = ligaBuscada.trim().toUpperCase()
  const categoria = ligas[liga]

  if (categoria === undefined) {
    return 'No se de que me estas hablando'
  }
  const getCells = promisify(sheet.getCells, sheet)

  // necesito ubicar la tabla en la hoja
  if (categoria.tabla === undefined) {
    categoria.tabla = await getCells({
      'min-row': 1,
      'max-row': 50,
      'min-col': 1,
      'max-col': 1,
      'return-empty': true
    }).then((cells) => {
      const start = cells.find((cell) => cell.value === liga).row
      const end = cells.slice(start).find((cell) => cell.value === '').row

      return {
        'min-row': start + 2,
        'max-row': end,
        'min-col': 9,
        'max-col': 14,
        'return-empty': true
      }
    })
  }
  const range = (n) => Array.apply(null, new Array(n)).map((x, i) => i)

  const cellValue = cell => {
    if (doMention) {
      return cell.value
    }
    return cell.value.substr(1)
  }

  const tabla = await getCells(categoria.tabla).then((cells) => {
    const rows = range(Math.ceil(cells.length / 6)).map((x, i) => cells.slice(i * 6, i * 6 + 6))
    log(table(rows.map(row => row.map(cellValue))))
    return '```' + table(rows.map(row => row.map(cell => cell.value))) + '```'
  })

  return tabla
}

let usuarios
const getUsersDict = async (emitter) => {
  if (usuarios === undefined) {
    const users = await getUsers(emitter)
    usuarios = users.reduce((dict, curr) => {
      dict[curr.id] = curr.name
      return dict
    }, {})
  }
  return usuarios
}

const quienMeFalta = async (sheet, user, log) => {
  const getCells = promisify(sheet.getCells, sheet)
  return await getCells({
    'min-row': 1,
    'max-row': 50,
    'min-col': 1,
    'max-col': 3,
    'return-empty': true
  }).then((cells) => {
    const playerIndex = cells.findIndex((cell) => cell.value.trim() === `@${user}` && cell.col === 1)
    if (playerIndex === -1) {
      return 'y vos quien sos?'
    }
    log(cells[playerIndex + 2].value)
    return cells[playerIndex + 2].value + ' Vengan a jugar amigos de la federal'// .split(",").reduce((str, curr) => str + curr.trim(), "")
  })
}
