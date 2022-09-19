import { Debugger } from "debug"

interface Store<T> {
  value: T
  get: <U>(path: [string | number]) => Store<U>
  set: (newValue: T | ((T) => T)) => void
  close: () => void
}
interface Storage {
  createStore: <T>(storeName: string, defaultValue: T) => Store<T>
}
interface Options {
  log: Debugger
  verbose?: boolean
  writeDelay?: number
}
export default function (owner: string, options: Options = {}): Storage
