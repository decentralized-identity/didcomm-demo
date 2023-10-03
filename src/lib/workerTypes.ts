export type WorkerCommandType =
  | "init"
  | "establishMediation"
  | "connect"
  | "disconnect"
  | "sendMessage"
  | "pickupStatus"

export interface WorkerCommand<T> {
  type: WorkerCommandType
  payload: T
}

export type WorkerMessageType =
  | "init"
  | "log"
  | "didGenerated"
  | "messageReceived"
  | "connected"
  | "disconnected"
  | "error"

export interface WorkerMessage<T> {
  type: WorkerMessageType
  payload: T
}
