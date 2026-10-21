import { DataReader, DataWriter } from './Serialization'
import { DataPacketObj } from './types'

export class DataPacket {
  public name: string
  public entitlement: number
  public contentType: string
  public data: Uint8Array

  constructor(
    name: string,
    entitlement: number,
    contentType: string,
    data: Uint8Array
  ) {
    this.name = name
    this.entitlement = entitlement
    this.contentType = contentType
    this.data = data
  }

  serialize(writer: DataWriter): void {
    writer.writeString(this.name)
    writer.writeInt32(this.entitlement)
    writer.writeString(this.contentType)
    writer.writeBuffer(this.data)
  }

  static deserialize(reader: DataReader): DataPacket {
    const name = reader.readString()
    const entitlement = reader.readInt32()
    const contentType = reader.readString()
    const data = reader.readBuffer()
    return new DataPacket(name, entitlement, contentType, data)
  }

  toObj(): DataPacketObj {
    return {
      name: this.name,
      entitlement: this.entitlement,
      contentType: this.contentType,
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
