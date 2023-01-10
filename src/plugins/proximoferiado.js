const dayjs = require("dayjs");

const monthsLocale = [
  "",
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];
const weekDaysLocale = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

const ENUM_TYPES = {
  INAMOVIBLE: 'inamovible',
  NO_LABORABLE: 'no laborable',
  TRASLADABLE: 'trasladable',
};

import commandParser from "../commandParser";

/** @type { import("./plugin").TaperbotPlugin } */
export default ({ config, emitter, log }) => {
  emitter.on("received:message", (message) => {
    const command = commandParser(message.text);
    if (command === null || command.command !== "proximoferiado") {
      return;
    }

    // const theDate = ((_theDateAsString) ? dayjs(_theDateAsString).startOf('day') : dayjs().startOf('day'));
    const theDate = dayjs().startOf("day");

    const holidaysThisYear = [
      {
        date: '2023-01-01',
        name: 'Año Nuevo',
        type: ENUM_TYPES.INAMOVIBLE,
      },
      {
        date: '2023-02-20',
        name: 'Carnaval',
        type: ENUM_TYPES.INAMOVIBLE,
        nextTo: '4 días no laborables, desde el sábado 18 de febrero hasta el martes 21 de febrero',
      },
      {
        date: '2023-02-21',
        name: 'Carnaval',
        type: ENUM_TYPES.INAMOVIBLE,
        nextTo: '4 días no laborables, desde el sábado 18 de febrero hasta el martes 21 de febrero',
      },
      {
        date: '2023-03-24',
        name: 'Día Nacional de la Memoria por la Verdad y la Justicia',
        type: ENUM_TYPES.INAMOVIBLE,
        nextTo: '3 días no laborables, desde el viernes 24 de marzo hasta el domingo 26 de marzo',
      },
      {
        date: '2023-04-02',
        name: 'Día del Veterano y de los Caídos en la Guerra de Malvinas',
        type: ENUM_TYPES.INAMOVIBLE,
      },
      {
        date: '2023-04-06',
        name: 'Jueves Santo Festividad Cristiana',
        type: ENUM_TYPES.NO_LABORABLE,
        nextTo: '4 días no laborables, desde el jueves 6 de abril hasta el domingo 9 de abril',
      },
      {
        date: '2023-04-07',
        name: 'Viernes Santo Festividad Cristiana',
        type: ENUM_TYPES.INAMOVIBLE,
        nextTo: '4 días no laborables, desde el jueves 6 de abril hasta el domingo 9 de abril',
      },
      {
        date: '2023-05-01',
        name: 'Día del Trabajador',
        type: ENUM_TYPES.INAMOVIBLE,
        nextTo: '3 días no laborables, desde el viernes 29 de abril hasta el lunes 1 de mayo',
      },
      {
        date: '2023-05-25',
        name: 'Día de la Revolución de Mayo',
        type: ENUM_TYPES.INAMOVIBLE,
        nextTo: '4 días no laborables, desde el jueves 25 de mayo hasta el domingo 28 de mayo',
      },
      {
        date: '2023-05-26',
        name: 'Feriado con fines turísticos',
        nextTo: '4 días no laborables, desde el jueves 25 de mayo hasta el domingo 28 de mayo',
      },
      {
        date: '2023-06-17',
        name: 'Paso a la Inmortalidad del Gral. Don Martín Miguel de Güemes',
        type: ENUM_TYPES.TRASLADABLE,
        nextTo: '4 días no laborables, desde el sábado 17 de junio hasta el martes 20 de junio',
      },
      {
        date: '2023-06-19',
        name: 'Feriado con fines turísticos',
        nextTo: '4 días no laborables, desde el sábado 17 de junio hasta el martes 20 de junio',
      },
      {
        date: '2023-06-20',
        name: 'Paso a la Inmortalidad del Gral. Manuel Belgrano',
        type: ENUM_TYPES.INAMOVIBLE,
        nextTo: '4 días no laborables, desde el sábado 17 de junio hasta el martes 20 de junio',
      },
      {
        date: '2023-07-09',
        name: 'Día de la Independencia ',
        type: ENUM_TYPES.INAMOVIBLE,
      },
      {
        date: '2023-08-21',
        name: 'Paso a la Inmortalidad del Gral. José de San Martín (17/8)',
        type: ENUM_TYPES.TRASLADABLE,
        nextTo: '3 días no laborables, desde el sábado 19 de agosto hasta el lunes 21 de agosto',
      },
      {
        date: '2023-10-13',
        name: 'Feriado con fines turísticos',
        nextTo: '4 días no laborables, desde el viernes 13 de octubre hasta el lunes 16 de octubre',
      },
      {
        date: '2023-10-16',
        name: 'Día del Respeto a la Diversidad Cultural (12/10)',
        type: ENUM_TYPES.TRASLADABLE,
        nextTo: '4 días no laborables, desde el viernes 13 de octubre hasta el lunes 16 de octubre',
      },
      {
        date: '2023-11-20',
        name: 'Día de la Soberanía Nacional',
        type: ENUM_TYPES.TRASLADABLE,
        nextTo: '3 días no laborables, desde el sábado 18 de noviembre hasta el lunes 20 de noviembre',
      },
      {
        date: '2023-12-08',
        name: 'Inmaculada Concepción de María',
        type: ENUM_TYPES.INAMOVIBLE,
        nextTo: '3 días no laborables, desde el viernes 8 de diciembre hasta el domingo 10 de diciembre',
      },
      {
        date: '2023-12-25',
        name: 'Navidad',
        type: ENUM_TYPES.INAMOVIBLE,
        nextTo: '3 días no laborables, desde el sabado 23 de diciembre hasta el lunes 25 de diciembre',
      },
      {
        date: '2024-01-01',
        name: 'Año nuevo',
        type: ENUM_TYPES.INAMOVIBLE,
      },
    ];

    const nextFeriado = holidaysThisYear.find(
      (_) =>
        _.date === theDate.format("YYYY-MM-DD") ||
        dayjs(_.date).isAfter(theDate)
    );
    let responseText = "";
    if (nextFeriado) {
      const theFeriadoDate = dayjs(nextFeriado.date);
      const txHowManyDaysTo = theFeriadoDate.diff(theDate, "days");
      responseText +=
        "El *" +
        weekDaysLocale[theFeriadoDate.day()] +
        " " +
        theFeriadoDate.format("D") +
        " de " +
        monthsLocale[Number(theFeriadoDate.format("M"))] +
        '* "' +
        nextFeriado.name +
        '".';
      if (nextFeriado.type)
        responseText += " Es de tipo " + nextFeriado.type + ".";
      if (nextFeriado.movedFrom)
        responseText += " Trasladado del día " + nextFeriado.movedFrom + ".";
      if (nextFeriado.nextTo)
        responseText +=
          " Puede conformar un grupo de " + nextFeriado.nextTo + ".";

      responseText = responseText.replace("en *1 día*", "*mañana*");

      emitter.emit("send:message", responseText, message.channel);
    }
  });
};
