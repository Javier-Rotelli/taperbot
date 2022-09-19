interface Store<T> {
  value: T
  set: (newValue: T) => void
  close: () => void
}
interface Storage {
  createStore: <T>(storeName: string, defaultValue: T) => Store<T>
}
interface Options {
  writeDelay?: number
}
export default function (owner: string, options: Options = {}): Storage
