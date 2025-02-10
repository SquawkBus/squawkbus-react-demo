import { DataReader, DataWriter } from './Serialization'
import { DataPacketObj } from './types'

export enum MessageType {
  AuthenticationRequest = 1,
  AuthenticationResponse = 2,
  MulticastData = 3,
  UnicastData = 4,
  ForwardedSubscriptionRequest = 5,
  NotificationRequest = 6,
  SubscriptionRequest = 7,
  ForwardedMulticastData = 8,
  ForwardedUnicastData = 9
}

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
    writer.writeInt(this.entitlement)
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

function serializeDataPackets(
  dataPackets: DataPacket[],
  writer: DataWriter
): void {
  writer.writeUInt(dataPackets.length)
  for (const dataPacket of dataPackets) {
    dataPacket.serialize(writer)
  }
}

function deserializeDataPackets(reader: DataReader): DataPacket[] {
  let length = reader.readUInt32()
  const dataPackets = []
  while (length > 0) {
    dataPackets.push(DataPacket.deserialize(reader))
    length -= 1
  }
  return dataPackets
}

export abstract class Message {
  public messageType: MessageType

  protected constructor(messageType: MessageType) {
    this.messageType = messageType
  }

  serialize(): ArrayBuffer {
    const writer = new DataWriter()
    writer.writeByte(this.messageType)
    this.serializeBody(writer)
    return writer.toBuffer()
  }

  protected abstract serializeBody(writer: DataWriter): void

  static deserialize(reader: DataReader): Message {
    const messageType = reader.readByte() as MessageType
    switch (messageType) {
      case MessageType.AuthenticationRequest:
        return AuthenticationRequest.deserialize(reader)
      case MessageType.AuthenticationResponse:
        return AuthenticationResponse.deserialize(reader)
      case MessageType.ForwardedMulticastData:
        return ForwardedMulticastData.deserialize(reader)
      case MessageType.ForwardedSubscriptionRequest:
        return ForwardedSubscriptionRequest.deserialize(reader)
      case MessageType.ForwardedUnicastData:
        return ForwardedUnicastData.deserialize(reader)
      case MessageType.MulticastData:
        return MulticastData.deserialize(reader)
      case MessageType.NotificationRequest:
        return NotificationRequest.deserialize(reader)
      case MessageType.SubscriptionRequest:
        return SubscriptionRequest.deserialize(reader)
      default:
        throw new Error('unhandled message type')
    }
  }
}

export class AuthenticationRequest extends Message {
  method: string
  credentials: Uint8Array

  constructor(method: string, credentials: Uint8Array) {
    super(MessageType.AuthenticationRequest)
    this.method = method
    this.credentials = credentials
  }

  serializeBody(writer: DataWriter): void {
    writer.writeString(this.method)
    writer.writeBuffer(this.credentials)
  }
}

export class AuthenticationResponse extends Message {
  public clientId: string

  constructor(clientId: string) {
    super(MessageType.AuthenticationResponse)
    this.clientId = clientId
  }

  serializeBody(writer: DataWriter): void {
    writer.writeString(this.clientId)
  }

  static deserialize(reader: DataReader): AuthenticationResponse {
    const clientId = reader.readString()
    return new AuthenticationResponse(clientId)
  }
}

export class ForwardedMulticastData extends Message {
  public host: string
  public user: string
  public topic: string
  public dataPackets: DataPacket[]

  constructor(
    host: string,
    user: string,
    topic: string,
    dataPackets: DataPacket[]
  ) {
    super(MessageType.ForwardedMulticastData)
    this.host = host
    this.user = user
    this.topic = topic
    this.dataPackets = dataPackets
  }

  protected serializeBody(writer: DataWriter): void {
    writer.writeString(this.host)
    writer.writeString(this.user)
    writer.writeString(this.topic)
    serializeDataPackets(this.dataPackets, writer)
  }

  static deserialize(reader: DataReader): ForwardedMulticastData {
    const host = reader.readString()
    const user = reader.readString()
    const topic = reader.readString()
    const dataPackets = deserializeDataPackets(reader)
    return new ForwardedMulticastData(host, user, topic, dataPackets)
  }
}

export class ForwardedSubscriptionRequest extends Message {
  public host: string
  public user: string
  public clientId: string
  public topic: string
  public isAdd: boolean

  constructor(
    host: string,
    user: string,
    clientId: string,
    topic: string,
    isAdd: boolean
  ) {
    super(MessageType.ForwardedSubscriptionRequest)
    this.host = host
    this.user = user
    this.clientId = clientId
    this.topic = topic
    this.isAdd = isAdd
  }

  protected serializeBody(writer: DataWriter): void {
    writer.writeString(this.host)
    writer.writeString(this.user)
    writer.writeString(this.clientId)
    writer.writeString(this.topic)
    writer.writeBool(this.isAdd)
  }

  static deserialize(reader: DataReader): ForwardedSubscriptionRequest {
    const host = reader.readString()
    const user = reader.readString()
    const clientId = reader.readString()
    const topic = reader.readString()
    const isAdd = reader.readBool()
    return new ForwardedSubscriptionRequest(host, user, clientId, topic, isAdd)
  }
}

export class ForwardedUnicastData extends Message {
  public host: string
  public user: string
  public clientId: string
  public topic: string
  public dataPackets: DataPacket[]

  constructor(
    host: string,
    user: string,
    clientId: string,
    topic: string,
    dataPackets: DataPacket[]
  ) {
    super(MessageType.ForwardedUnicastData)
    this.host = host
    this.user = user
    this.clientId = clientId
    this.topic = topic
    this.dataPackets = dataPackets
  }

  protected serializeBody(writer: DataWriter): void {
    writer.writeString(this.host)
    writer.writeString(this.user)
    writer.writeString(this.clientId)
    writer.writeString(this.topic)
    serializeDataPackets(this.dataPackets, writer)
  }

  static deserialize(reader: DataReader): ForwardedUnicastData {
    const host = reader.readString()
    const user = reader.readString()
    const clientId = reader.readString()
    const topic = reader.readString()
    const dataPackets = deserializeDataPackets(reader)
    return new ForwardedUnicastData(host, user, clientId, topic, dataPackets)
  }
}

export class MulticastData extends Message {
  public topic: string
  public dataPackets: DataPacket[]

  constructor(topic: string, dataPackets: DataPacket[]) {
    super(MessageType.MulticastData)
    this.topic = topic
    this.dataPackets = dataPackets
  }

  protected serializeBody(writer: DataWriter): void {
    writer.writeString(this.topic)
    serializeDataPackets(this.dataPackets, writer)
  }

  static deserialize(reader: DataReader): MulticastData {
    const topic = reader.readString()
    const dataPackets = deserializeDataPackets(reader)
    return new MulticastData(topic, dataPackets)
  }
}

export class NotificationRequest extends Message {
  public pattern: string
  public isAdd: boolean

  constructor(pattern: string, isAdd: boolean) {
    super(MessageType.NotificationRequest)
    this.pattern = pattern
    this.isAdd = isAdd
  }

  protected serializeBody(writer: DataWriter): void {
    writer.writeString(this.pattern)
    writer.writeBool(this.isAdd)
  }

  static deserialize(reader: DataReader): NotificationRequest {
    const pattern = reader.readString()
    const isAdd = reader.readBool()
    return new NotificationRequest(pattern, isAdd)
  }
}

export class SubscriptionRequest extends Message {
  public topic: string
  public isAdd: boolean

  constructor(topic: string, isAdd: boolean) {
    super(MessageType.SubscriptionRequest)
    this.topic = topic
    this.isAdd = isAdd
  }

  protected serializeBody(writer: DataWriter): void {
    writer.writeString(this.topic)
    writer.writeBool(this.isAdd)
  }

  static deserialize(reader: DataReader): SubscriptionRequest {
    const topic = reader.readString()
    const isAdd = reader.readBool()
    return new SubscriptionRequest(topic, isAdd)
  }
}

export class UnicastData extends Message {
  public clientId: string
  public topic: string
  public dataPackets: DataPacket[]

  constructor(clientId: string, topic: string, dataPackets: DataPacket[]) {
    super(MessageType.UnicastData)
    this.clientId = clientId
    this.topic = topic
    this.dataPackets = dataPackets
  }

  protected serializeBody(writer: DataWriter): void {
    writer.writeString(this.clientId)
    writer.writeString(this.topic)
    serializeDataPackets(this.dataPackets, writer)
  }

  static deserialize(reader: DataReader): UnicastData {
    const clientId = reader.readString()
    const topic = reader.readString()
    const dataPackets = deserializeDataPackets(reader)
    return new UnicastData(clientId, topic, dataPackets)
  }
}
