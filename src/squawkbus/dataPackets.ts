import { DataReader } from './DataReader'
import { DataWriter } from './DataWriter'
import { DataPacketObj } from './types'

export class DataPacket {
  public entitlements: Set<number>
  public headers: Map<string, string>
  public data: Uint8Array

  constructor(
    entitlements: Set<number>,
    headers: Map<string, string>,
    data: Uint8Array
  ) {
    this.entitlements = entitlements
    this.headers = headers
    this.data = data
  }

  serialize(writer: DataWriter): void {
    writer.writeSetInt32(this.entitlements)
    writer.writeMapStringString(this.headers)
    writer.writeBuffer(this.data)
  }

  static deserialize(reader: DataReader): DataPacket {
    const entitlements = reader.readSetInt32()
    const headers = reader.readMapStringString()
    const data = reader.readBuffer()
    return new DataPacket(entitlements, headers, data)
  }

  toObj(): DataPacketObj {
    return {
      entitlements: this.entitlements,
      headers: this.headers,
      data: this.data.buffer
    }
  }
}

export function serializeDataPackets(
  dataPackets: DataPacket[],
  writer: DataWriter
): void {
  writer.writeUInt32(dataPackets.length)
  for (const dataPacket of dataPackets) {
    dataPacket.serialize(writer)
  }
}

export function deserializeDataPackets(reader: DataReader): DataPacket[] {
  let length = reader.readUInt32()
  const dataPackets = []
  while (length > 0) {
    dataPackets.push(DataPacket.deserialize(reader))
    length -= 1
  }
  return dataPackets
}
