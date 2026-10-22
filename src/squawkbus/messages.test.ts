import { expect, test } from 'vitest'

import { AuthenticationRequest, AuthenticationResponse, ForwardedMulticastData } from "./messages"
import { DataPacket } from './dataPackets'
import { DataWriter } from './DataWriter'

test('AuthenticationRequest', () => {
    const original = new AuthenticationRequest("LDAP", new Uint8Array([1, 2, 3, 4]))
    const buf = original.serialize()
    const roundtrip = AuthenticationRequest.deserialize(buf)
    expect(roundtrip).toEqual(original)
})

test('AuthenticationResponse', () => {
    const original = new AuthenticationResponse("123456")
    const buf = original.serialize()
    const roundtrip = AuthenticationResponse.deserialize(buf)
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
    const roundtrip = ForwardedMulticastData.deserialize(buf)
    expect(roundtrip).toEqual(original)
})