export type DataPacketObj = {
  name: string
  entitlement: number
  contentType: string
  data: ArrayBufferLike
}

export type DataMessageObj = {
  host: string
  user: string
  topic: string
  dataPackets: DataPacketObj[]
}

export type NotificationObj = {
  host: string
  user: string
  clientId: string
  topic: string
  isAdd: boolean
}

export type HeartbeatObj = {
  count: bigint
}
