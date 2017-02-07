import * as fs from 'fs';
import * as yaml from 'js-yaml';

const configFile = 'env.cfg';

/**
 *
 * @returns {*}
 */
export const getConfig = () => {
// Get document, or throw exception on error
  try {
    return yaml.safeLoad(fs.readFileSync('config.yml', 'utf8'));
  } catch (e) {
    console.log(e);
  }
}