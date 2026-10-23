import { SIZEOF_DWORD, SIZEOF_QWORD } from "./constants"

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

  readSetInt32(): Set<number> {
    const value = new Set<number>()
    const length = this.readUInt32()
    for (let i = 0; i < length; ++i) {
      value.add(this.readInt32())
    }
    return value
  }

  readMapStringString(): Map<string, string> {
    const value = new Map<string, string>()
    const length = this.readUInt32()
    for (let i = 0; i < length; ++i) {
      const key = this.readString()
      const val = this.readString()
      value.set(key, val)
    }

    return value
  }
}
