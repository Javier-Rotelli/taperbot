import { Debugger } from "debug"

interface Store<T> {
  value: T
  set: (newValue: T) => void
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
