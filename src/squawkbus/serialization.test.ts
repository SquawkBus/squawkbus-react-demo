import { expect, test } from 'vitest'

import { DataReader } from './DataReader'
import { DataWriter } from './DataWriter'

test('Handles string', () => {
    const writer = new DataWriter()
    const expected = "Hello, World!\n"
    writer.writeString(expected)
    const reader = new DataReader(writer.toBuffer())
    const actual = reader.readString()
    expect(actual).toBe(expected)
})

test('Handles Set<number>', () => {
    const writer = new DataWriter()
    const expected = new Set<number>([12, -2, 6, 198])
    writer.writeSetInt32(expected)
    const reader = new DataReader(writer.toBuffer())
    const actual = reader.readSetInt32()
    expect(actual).toEqual(expected)
})

test('Handles Map<string, string>', () => {
    const writer = new DataWriter()
    const expected = new Map<string, string>([['foo', 'FOO'], ['bar', 'BAR']])
    writer.writeMapStringString(expected)
    const reader = new DataReader(writer.toBuffer())
    const actual = reader.readMapStringString()
    expect(actual).toEqual(expected)
})
