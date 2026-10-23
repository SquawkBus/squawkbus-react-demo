import { expect, test } from 'vitest'

import {
  AuthenticationRequest,
  AuthenticationResponse,
  ForwardedMulticastData,
  ForwardedSubscriptionRequest,
  ForwardedUnicastData,
  Heartbeat,
  MulticastData,
  NotificationRequest,
  SubscriptionRequest,
  UnicastData
} from './messages'
import { DataPacket } from './dataPackets'

test('AuthenticationRequest', () => {
  const original = new AuthenticationRequest(
    'LDAP',
    new Uint8Array([1, 2, 3, 4])
  )
  const roundtrip = AuthenticationRequest.deserialize(original.serialize())
  expect(roundtrip).toEqual(original)
})

test('AuthenticationResponse', () => {
  const original = new AuthenticationResponse('123456')
  const roundtrip = AuthenticationResponse.deserialize(original.serialize())
  expect(roundtrip).toEqual(original)
})

test('ForwardedMulticastData', () => {
  const original = new ForwardedMulticastData(
    'middle-earth.example.com',
    'frodo',
    'ork.*',
    [
      new DataPacket(
        new Set<number>([1, 2, 3]),
        new Map<string, string>([['content-type', 'application/json']]),
        new TextEncoder().encode('Fly you fools, fly!')
      )
    ]
  )
  const roundtrip = ForwardedMulticastData.deserialize(original.serialize())
  expect(roundtrip).toEqual(original)
})

test('ForwardedSubscriptionRequest', () => {
  const original = new ForwardedSubscriptionRequest(
    'middle-earth.example.com',
    'frodo',
    '1234',
    'ork.*',
    true
  )
  const roundtrip = ForwardedSubscriptionRequest.deserialize(
    original.serialize()
  )
  expect(roundtrip).toEqual(original)
})

test('ForwardedUnicastData', () => {
  const original = new ForwardedUnicastData(
    'middle-earth.example.com',
    'frodo',
    '1234',
    'ork.*',
    [
      new DataPacket(
        new Set<number>([1, 2, 3]),
        new Map<string, string>([['content-type', 'application/json']]),
        new TextEncoder().encode('Fly you fools, fly!')
      ),
      new DataPacket(
        new Set<number>([4, 5]),
        new Map<string, string>([['content-type', 'plain/text']]),
        new TextEncoder().encode('One ring to rule them all')
      )
    ]
  )
  const roundtrip = ForwardedUnicastData.deserialize(original.serialize())
  expect(roundtrip).toEqual(original)
})

test('Heartbeat', () => {
  const original = new Heartbeat(BigInt(42))
  const roundtrip = Heartbeat.deserialize(original.serialize())
  expect(roundtrip).toEqual(original)
})

test('MulticastData', () => {
  const original = new MulticastData('ork.*', [
    new DataPacket(
      new Set<number>([1, 2, 3]),
      new Map<string, string>([['content-type', 'application/json']]),
      new TextEncoder().encode('Fly you fools, fly!')
    ),
    new DataPacket(
      new Set<number>([4, 5]),
      new Map<string, string>([['content-type', 'plain/text']]),
      new TextEncoder().encode('One ring to rule them all')
    )
  ])
  const roundtrip = MulticastData.deserialize(original.serialize())
  expect(roundtrip).toEqual(original)
})

test('NotificationRequest', () => {
  const original = new NotificationRequest('ork.*', false)
  const roundtrip = NotificationRequest.deserialize(original.serialize())
  expect(roundtrip).toEqual(original)
})

test('SubscriptionRequest', () => {
  const original = new SubscriptionRequest('ork.*', true)
  const roundtrip = SubscriptionRequest.deserialize(original.serialize())
  expect(roundtrip).toEqual(original)
})

test('UnicastData', () => {
  const original = new UnicastData('1234', 'LSE.VOD', [
    new DataPacket(
      new Set<number>([1, 2, 3]),
      new Map<string, string>([['content-type', 'application/json']]),
      new TextEncoder().encode('Fly you fools, fly!')
    ),
    new DataPacket(
      new Set<number>([4, 5]),
      new Map<string, string>([['content-type', 'plain/text']]),
      new TextEncoder().encode('One ring to rule them all')
    )
  ])
  const roundtrip = UnicastData.deserialize(original.serialize())
  expect(roundtrip).toEqual(original)
})
