import { SIZEOF_BYTE, SIZEOF_DWORD, SIZEOF_QWORD } from "./constants"

type DataType = (
  'u8' |
  'i32' |
  'u32' |
  'i64' |
  'u64' |
  '[u8]' |
  'set<number>' |
  'map<string,string>'
)

type DataValue = number | bigint | Uint8Array | Set<number> | Array<[Uint8Array, Uint8Array]>

type DataItem = {
  type: DataType
  value: DataValue
}

export class DataWriter {
  private contents: DataItem[] = []
  private size: number = 0
  static textEncoder = new TextEncoder()

  private writeValue(value: DataValue, type: DataType, size: number) {
    this.contents.push({ type, value })
    this.size += size
  }

  writeByte(value: number): void {
    this.writeValue(value, 'u8', SIZEOF_BYTE)
  }

  writeBool(value: boolean): void {
    this.writeByte(value ? 1 : 0)
  }

  writeInt32(value: number): void {
    this.writeValue(value, 'i32', SIZEOF_DWORD)
  }

  writeUInt32(value: number): void {
    this.writeValue(value, 'u32', SIZEOF_DWORD)
  }

  writeInt64(value: bigint): void {
    this.writeValue(value, 'i64', SIZEOF_DWORD)
  }

  writeUInt64(value: bigint): void {
    this.writeValue(value, 'u64', SIZEOF_DWORD)
  }

  writeString(value: string): void {
    this.writeBuffer(DataWriter.textEncoder.encode(value))
  }

  writeSetInt32(value: Set<number>): void {
    const size = SIZEOF_DWORD + value.size * SIZEOF_DWORD
    this.writeValue(value, 'set<number>', size)
  }

  writeMapStringString(value: Map<string, string>): void {
    const map: Array<[Uint8Array, Uint8Array]> = Array.from(value).map(([key, value]) => [DataWriter.textEncoder.encode(key), DataWriter.textEncoder.encode(value)])
    const size = map.reduce((size, [KeyboardEvent, value]) => size + SIZEOF_DWORD + KeyboardEvent.byteLength+ SIZEOF_DWORD + value.byteLength, SIZEOF_DWORD)
    this.writeValue(map, 'map<string,string>', size)
  }

  writeBuffer(value: Uint8Array): void {
    this.writeValue(value, '[u8]', value.byteLength + SIZEOF_DWORD)
  }

  toBuffer(): Uint8Array<ArrayBuffer> {
    const buf = new Uint8Array(this.size)
    const view = new DataView(buf.buffer)
    let byteOffset = 0
    for (const { type, value } of this.contents) {
      if (type === 'u8') {
        view.setUint8(byteOffset, value as number)
        byteOffset += SIZEOF_BYTE
      } else if (type === 'i32') {
        view.setInt32(byteOffset, value as number, false)
        byteOffset += SIZEOF_DWORD
      } else if (type === 'u32') {
        view.setUint32(byteOffset, value as number, false)
        byteOffset += SIZEOF_DWORD
      } else if (type === 'i64') {
        view.setBigInt64(byteOffset, value as bigint, false)
        byteOffset += SIZEOF_QWORD
      } else if (type === 'u64') {
        view.setBigUint64(byteOffset, value as bigint, false)
        byteOffset += SIZEOF_QWORD
      } else if (type === '[u8]') {
        const byteArray = value as Uint8Array
        // length
        view.setUint32(byteOffset, byteArray.byteLength)
        byteOffset += SIZEOF_DWORD
        // buffer
        if (byteArray.byteLength > 0) {
          buf.set(byteArray, byteOffset)
          byteOffset += byteArray.byteLength
        }
      } else if (type == 'set<number>') {
        const set = value as Set<number>
        // length
        view.setUint32(byteOffset, set.size)
        byteOffset += SIZEOF_DWORD
        // values
        for (const element of set) {
          view.setInt32(byteOffset, element)
          byteOffset += SIZEOF_DWORD
        }
      } else if (type == 'map<string,string>') {
        const map = value as Array<[Uint8Array, Uint8Array]>
        // length
        view.setUint32(byteOffset, map.length)
        byteOffset += SIZEOF_DWORD
        // values
        for (const [key, val] of map) {
          // key.length
          view.setUint32(byteOffset, key.byteLength)
          byteOffset += SIZEOF_DWORD
          // key.buffer
          buf.set(key, byteOffset)
          byteOffset += key.byteLength

          // val.length
          view.setUint32(byteOffset, val.byteLength)
          byteOffset += SIZEOF_DWORD
          // val.buffer
          buf.set(val, byteOffset)
          byteOffset += val.byteLength
        }
      } else {
        throw new Error('Unhandled data type')
      }
    }

    return buf
  }
}
