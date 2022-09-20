import { create } from "apisauce";
import commandParser from "../commandParser";

/** @type { import("./plugin").TaperbotPlugin } */
export default ({ config, emitter, log }) => {
  const api = create({
    baseURL: "https://mercados.ambito.com",
    headers: { Accept: "application/json" },
  });
  emitter.on("received:message", (message) => {
    const command = commandParser(message.text);
    if (command === null || command.command !== "dolar") {
      return;
    }
    api
      .get("/dolar/informal/variacion")
      .then((res) => {
        const { compra, venta, fecha, variacion } = res.data;
        emitter.emit(
          "send:message",
          `💸 Compra: ${compra}, Venta: ${venta}, Variacion: ${variacion} ${
            variacion.startsWith("-") ? "↘️" : "↗️"
          } 🗓  ${fecha}`,
          message.channel
        );
      })
      .catch((err) => {
        throw err;
      });
  });
};
