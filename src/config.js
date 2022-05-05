import * as fs from "fs";
import * as yaml from "js-yaml";

/**
 *
 * @returns {*}
 */
export const getConfig = () => {
  // Get document, or throw exception on error
  try {
    return yaml.load(fs.readFileSync("config.yml", "utf8"));
  } catch (e) {
    console.log(e);
  }
};
