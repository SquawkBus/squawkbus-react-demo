import { expect, test } from 'vitest'

import { AuthenticationRequest, AuthenticationResponse, ForwardedMulticastData } from "./messages"
import { DataPacket } from './dataPackets'

test('AuthenticationRequest', () => {
    const original = new AuthenticationRequest("LDAP", new Uint8Array([1, 2, 3, 4]))
    const roundtrip = AuthenticationRequest.deserialize(original.serialize())
    expect(roundtrip).toEqual(original)
})

test('AuthenticationResponse', () => {
    const original = new AuthenticationResponse("123456")
    const roundtrip = AuthenticationResponse.deserialize(original.serialize())
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
                new TextEncoder().encode("Fly you fools, fly!")
            )
        ]
    )
    const roundtrip = ForwardedMulticastData.deserialize(original.serialize())
    expect(roundtrip).toEqual(original)
})