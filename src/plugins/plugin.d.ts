import { Storage } from "../modules/storage"

// These are any until they can be typed
interface PluginOptions {
  config: any
  emitter: any
  log: any
  storage: Storage
}

interface TaperbotPlugin {
  (options: PluginOptions): void
}
