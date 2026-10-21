const SIZEOF_BYTE: number = 1
const SIZEOF_DWORD: number = 4
const SIZEOF_QWORD: number = 8

enum DataType {
  BYTE,
  INT32,
  UINT32,
  INT64,
  UINT64,
  BUFFER
}

type DataValue = number | bigint | Uint8Array

type DataItem = {
  type: DataType
  value: DataValue
}

export class DataWriter {
  private contents: DataItem[] = []
  private size: number = 0
  private static textEncoder = new TextEncoder()

  private writeValue(value: DataValue, type: DataType, size: number) {
    this.contents.push({ type, value })
    this.size += size
  }

  writeByte(value: number): void {
    this.writeValue(value, DataType.BYTE, SIZEOF_BYTE)
  }

  writeBool(value: boolean): void {
    this.writeByte(value ? 1 : 0)
  }

  writeInt32(value: number): void {
    this.writeValue(value, DataType.INT32, SIZEOF_DWORD)
  }

  writeUInt32(value: number): void {
    this.writeValue(value, DataType.UINT32, SIZEOF_DWORD)
  }

  writeInt64(value: bigint): void {
    this.writeValue(value, DataType.INT64, SIZEOF_DWORD)
  }

  writeUInt64(value: bigint): void {
    this.writeValue(value, DataType.UINT64, SIZEOF_DWORD)
  }

  writeString(value: string): void {
    this.writeBuffer(DataWriter.textEncoder.encode(value))
  }

  writeBuffer(value: Uint8Array): void {
    this.writeValue(value, DataType.BUFFER, value.byteLength + SIZEOF_DWORD)
  }

  toBuffer(): ArrayBuffer {
    const buf = new Uint8Array(this.size)
    const view = new DataView(buf.buffer)
    let byteOffset = 0
    for (const { type, value } of this.contents) {
      if (type === DataType.BYTE) {
        view.setUint8(byteOffset, value as number)
        byteOffset += SIZEOF_BYTE
      } else if (type === DataType.INT32) {
        view.setInt32(byteOffset, value as number, false)
        byteOffset += SIZEOF_DWORD
      } else if (type === DataType.UINT32) {
        view.setUint32(byteOffset, value as number, false)
        byteOffset += SIZEOF_DWORD
      } else if (type === DataType.INT64) {
        view.setBigInt64(byteOffset, value as bigint, false)
        byteOffset += SIZEOF_QWORD
      } else if (type === DataType.UINT64) {
        view.setBigUint64(byteOffset, value as bigint, false)
        byteOffset += SIZEOF_QWORD
      } else if (type === DataType.BUFFER) {
        const byteArray = value as Uint8Array
        // length
        view.setUint32(byteOffset, byteArray.byteLength)
        byteOffset += SIZEOF_DWORD
        // buffer
        if (byteArray.byteLength > 0) {
          buf.set(byteArray, byteOffset)
          byteOffset += byteArray.byteLength
        }
      } else {
        throw new Error('Unhandled data type')
      }
    }

    return buf.buffer
  }
}

export class DataReader {
  private buf: Uint8Array
  private offset: number
  private view: DataView
  private static textDecoder = new TextDecoder()

  constructor(buf: Uint8Array) {
    this.buf = buf
    this.offset = 0
    this.view = new DataView(buf.buffer)
  }

  readByte(): number {
    return this.view.getUint8(this.offset++)
  }

  readBool(): boolean {
    return this.readByte() == 1
  }

  readInt32(): number {
    const value = this.view.getInt32(this.offset, false)
    this.offset += SIZEOF_DWORD
    return value
  }

  readUInt32(): number {
    const value = this.view.getUint32(this.offset, false)
    this.offset += SIZEOF_DWORD
    return value
  }

  readInt64(): bigint {
    const value = this.view.getBigInt64(this.offset, false)
    this.offset += SIZEOF_QWORD
    return value
  }

  readUInt64(): bigint {
    const value = this.view.getBigUint64(this.offset, false)
    this.offset += SIZEOF_QWORD
    return value
  }

  readBuffer(): Uint8Array {
    const length = this.readUInt32()
    const buf = this.buf.slice(this.offset, this.offset + length)
    this.offset += length
    return buf
  }

  readString(): string {
    const buf = this.readBuffer()
    return DataReader.textDecoder.decode(buf)
  }
}
