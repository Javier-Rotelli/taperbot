import GoogleSpreadsheet from 'google-spreadsheet'
import promisify from 'es6-promisify'
import table from 'text-table'

import commandParser from './../commandParser'

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
      response = await getTable(sheet, command.text, log)
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

export const getTable = async (sheet, ligaBuscada, log) => {
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
      log('start:', start, 'end:', end)
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

  const tabla = await getCells(categoria.tabla).then((cells) => {
    const rows = range(Math.ceil(cells.length / 6)).map((x, i) => cells.slice(i * 6, i * 6 + 6))
    log(table(rows.map(row => row.map(cell => cell.value))))
    return '```' + table(rows.map(row => row.map(cell => cell.value))) + '```'
  })

  return tabla
}
