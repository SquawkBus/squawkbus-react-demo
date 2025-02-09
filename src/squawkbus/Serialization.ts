const SIZEOF_BYTE: number = 1
const SIZEOF_DWORD: number = 4

enum DataType {
  BYTE,
  INT,
  UINT,
  BUFFER
}

type DataValue = number | Uint8Array

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

  writeInt(value: number): void {
    this.writeValue(value, DataType.INT, SIZEOF_DWORD)
  }

  writeUInt(value: number): void {
    this.writeValue(value, DataType.UINT, SIZEOF_DWORD)
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
      } else if (type === DataType.INT) {
        view.setInt32(byteOffset, value as number, false)
        byteOffset += SIZEOF_DWORD
      } else if (type === DataType.UINT) {
        view.setUint32(byteOffset, value as number, false)
        byteOffset += SIZEOF_DWORD
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

  readBuffer(): Uint8Array {
    const length = this.readUInt32()
    const buf = new Uint8Array(this.buf, this.offset, length)
    this.offset += length
    return buf
  }

  readString(): string {
    const buf = this.readBuffer()
    return DataReader.textDecoder.decode(buf.buffer)
  }
}
