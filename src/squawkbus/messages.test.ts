import { expect, test } from 'vitest'

import { AuthenticationRequest, AuthenticationResponse, ForwardedMulticastData } from "./messages"
import { DataReader } from './DataReader'
import { DataPacket } from './dataPackets'
import { DataWriter } from './DataWriter'

test('AuthenticationRequest', () => {
    const original = new AuthenticationRequest("LDAP", new Uint8Array([1, 2, 3, 4]))
    const buf = original.serialize()
    const reader =new DataReader(buf)
    const roundtrip = AuthenticationRequest.deserialize(reader)
    expect(roundtrip).toEqual(original)
})

test('AuthenticationResponse', () => {
    const original = new AuthenticationResponse("123456")
    const buf = original.serialize()
    const reader =new DataReader(buf)
    const roundtrip = AuthenticationResponse.deserialize(reader)
    expect(roundtrip).toEqual(original)
})

test('ForwardedMulticastData', () => {
    const original = new ForwardedMulticastData(
        "middle-earth.example.com",
        "frodo",
        "ork.*",
        [
            new DataPacket(
                new Set<number>([1, 2, 3]),
                new Map<string, string>([['content-type', 'application/json']]),
                DataWriter.textEncoder.encode("Fly you fools, fly!")
            )
        ]
    )
    const buf = original.serialize()
    const reader =new DataReader(buf)
    const roundtrip = ForwardedMulticastData.deserialize(reader)
    expect(roundtrip).toEqual(original)
})