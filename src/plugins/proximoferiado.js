const dayjs = require('dayjs');

const monthsLocale = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const weekDaysLocale = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

import commandParser from '../commandParser'

export default (config, emitter, log) => {
  emitter.on('received:message', (message) => {
    const command = commandParser(message.text)
    if (command === null || command.command !== 'proximoferiado') {
      return
    }

    // const theDate = ((_theDateAsString) ? dayjs(_theDateAsString).startOf('day') : dayjs().startOf('day'));
    const theDate = dayjs().startOf('day');

    const feriados2022 = [
      {
        date: '2022-01-01',
        name: 'Año nuevo',
        type: 'inamovible',
        weekday: 'sábado',
      },
      {
        date: '2022-02-28',
        name: 'Feriado de carnaval',
        type: 'inamovible',
        weekday: 'lunes',
        nextTo: '4 días no laborables, desde el sábado 26 de febrero hasta el martes 1 de marzo',
      },
      {
        date: '2022-03-01',
        name: 'Feriado de carnaval',
        type: 'inamovible',
        weekday: 'martes',
        nextTo: '4 días no laborables, desde el sábado 26 de febrero hasta el martes 1 de marzo',
      },
      {
        date: '2022-03-24',
        name: 'Día Nacional de la Memoria por la Verdad y la Justicia',
        type: 'inamovible',
        weekday: 'jueves',
      },
      {
        date: '2022-04-02',
        name: 'Día del Veterano y de los Caídos en la Guerra de Malvinas',
        type: 'inamovible',
        weekday: 'sábado',
      },
      {
        date: '2022-04-14',
        name: 'Jueves Santo',
        type: 'no laborable',
        weekday: 'jueves',
        nextTo: '4 días no laborables, desde el 14 hasta el 17 inclusive',
      },
      {
        date: '2022-04-15',
        name: 'Viernes Santo',
        type: 'inamovible',
        weekday: 'viernes',
        nextTo: '4 días no laborables, desde el 14 hasta el 17 inclusive',
      },
      {
        date: '2022-05-01',
        name: 'Día del trabajador',
        type: 'inamovible',
        weekday: 'domingo',
      },
      {
        date: '2022-05-25',
        name: 'Día de la Revolución de Mayo',
        type: 'inamovible',
        weekday: 'miércoles',
      },
      {
        date: '2022-06-17',
        name: 'Paso a la inmortalidad del Gral. Martín Miguel de Güemes',
        type: 'trasladable',
        weekday: 'viernes',
        nextTo: '4 días no laborables, desde el viernes 17 hasta el lunes 20 inclusive',
      },
      {
        date: '2022-06-20',
        name: 'Paso a la Inmortalidad del Gral. Manuel Belgrano',
        type: 'inamovible',
        weekday: 'lunes',
        nextTo: '4 días no laborables, desde el viernes 17 hasta el lunes 20 inclusive',
      },
      {
        date: '2022-07-09',
        name: 'Día de la Independencia',
        type: 'inamovible',
        weekday: 'sábado',
      },
      {
        date: '2022-08-15',
        name: 'Paso a la inmortalidad del Gral. José de San Martín',
        movedFrom: '17 de agosto',
        type: 'trasladable',
        weekday: 'lunes',
        nextTo: '3 días no laborables, desde el sábado 13, hasta el lunes 15 inclusive',
      },
      {
        date: '2022-10-07',
        name: 'Feriado con fines turísticos',
        weekday: 'viernes',
        nextTo: '4 días no laborables, desde el viernes 7 hasta el lunes 10 inclusive',
      },
      {
        date: '2022-10-10',
        name: 'Día del Respeto a la Diversidad Cultural',
        movedFrom: '12 de octubre',
        type: 'trasladable',
        weekday: 'lunes',
        nextTo: '4 días no laborables, desde el viernes 7 hasta el lunes 10 inclusive',
      },
      {
        date: '2022-11-20',
        name: 'Día de la Soberanía Nacional',
        type: 'trasladable',
        weekday: 'domingo',
        nextTo: '3 días no laborables, hasta el lunes 21 inclusive',
      },
      {
        date: '2022-11-21',
        name: 'Feriado con fines turísticos',
        weekday: 'lunes',
        nextTo: '3 días no laborables, hasta el lunes 21 inclusive',
      },
      {
        date: '2022-12-08',
        name: 'Inmaculada Concepción de María',
        type: 'inamovible',
        weekday: 'jueves',
      },
      {
        date: '2022-12-09',
        name: 'Feriado con fines turísticos',
        weekday: 'viernes',
        nextTo: '4 días no laborables, desde el jueves 8 hasta el domingo 11',
      },
      {
        date: '2022-12-25',
        name: 'Navidad',
        type: 'inamovible',
        weekday: 'domingo',
      },
    ];

    const nextFeriado = feriados2022.find((_) => _.date === theDate.format('YYYY-MM-DD') || dayjs(_.date).isAfter(theDate));
    let responseText = '';
    if (nextFeriado) {
      const theFeriadoDate = dayjs(nextFeriado.date);
      const txHowManyDaysTo = theFeriadoDate.diff(theDate, 'days');
      responseText += 'El *' +
        weekDaysLocale[theFeriadoDate.day()] + ' ' + theFeriadoDate.format('D') +
        ' de ' + monthsLocale[Number(theFeriadoDate.format('M'))] +'* "' + nextFeriado.name + '".';
      if (nextFeriado.type)
        responseText += ' Es de tipo ' + nextFeriado.type + '.';
      if (nextFeriado.movedFrom)
        responseText += ' Trasladado del día ' + nextFeriado.movedFrom + '.';
      if (nextFeriado.nextTo)
        responseText += ' Puede conformar un grupo de ' + nextFeriado.nextTo + '.';

      responseText += ' [Agregar a Google Calendar](https://www.google.com/calendar/render?action=TEMPLATE&text=' + nextFeriado.name.replace(/ /g, '%20') +
        '&dates=' + theFeriadoDate.format('YYYYMMDD') + '%2F' +
        theFeriadoDate.add(1, 'days').format('YYYYMMDD');

      responseText = responseText.replace('en *1 día*', '*mañana*');

      emitter.emit(
        'send:message',
        responseText,
        message.channel
      );
    }
  });
}
