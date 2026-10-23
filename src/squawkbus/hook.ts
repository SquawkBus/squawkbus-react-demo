import { useEffect, useRef, useState, useCallback } from 'react'
import { DataPacket } from './dataPackets'
import {
  AuthenticationRequest,
  AuthenticationResponse,
  ForwardedMulticastData,
  ForwardedSubscriptionRequest,
  ForwardedUnicastData,
  Heartbeat,
  Message,
  MESSAGE_TYPE,
  MulticastData,
  NotificationRequest,
  SubscriptionRequest,
  UnicastData
} from './messages'
import type { DataMessageObj, HeartbeatObj, NotificationObj } from './types'

export type ConnectionState = (
  'PENDING' |
  'CONNECTING' |
  'OPEN' |
  'CLOSING' |
  'CLOSED'
)

export type AuthenticationState = (
  'PENDING' |
  'REQUEST' |
  'SUCCESS' |
  'FAILURE'
)

export type Options = {
  credentials?: [string, string]
  onMessage?: (message: Message) => void
}

export type Send = (
  clientId: string,
  topic: string,
  dataPackets: DataPacket[]
) => void
export type Publish = (topic: string, dataPackets: DataPacket[]) => void
export type Subscribe = (topic: string) => void
export type Unsubscribe = (topic: string) => void
export type Listen = (pattern: string) => void
export type Unlisten = (pattern: string) => void

export type WebHookOutputs = {
  clientId: string | null
  connectionState: ConnectionState
  authenticationState: AuthenticationState
  data: DataMessageObj | null
  notification: NotificationObj | null
  heartbeat: HeartbeatObj | null
  send: Send
  publish: Publish
  subscribe: Subscribe
  unsubscribe: Unsubscribe
  listen: Listen
  unlisten: Unlisten
}

function createAuthenticationToken(credentials?: [string, string]): Uint8Array {
  const textEncoder = new TextEncoder()
  const token = credentials ? btoa(credentials[0] + ':' + credentials[1]) : ''
  return textEncoder.encode(token)
}

export const useSquawkbus = (
  url: string,
  options?: Options
): WebHookOutputs => {
  const webSocketRef = useRef<WebSocket | null>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    'PENDING'
  )
  const [authenticationState, setAuthenticationState] =
    useState<AuthenticationState>('PENDING')
  const [clientId, setClientId] = useState<string | null>(null)
  const [data, setData] = useState<DataMessageObj | null>(null)
  const [notification, setNotification] = useState<NotificationObj | null>(
    null
  )
  const [heartbeat, setHeartbeat] = useState<HeartbeatObj | null>(null)

  const send = useCallback(
    (clientId: string, topic: string, dataPackets: DataPacket[]) => {
      const message = new UnicastData(clientId, topic, dataPackets)
      const buf = message.serialize()
      webSocketRef.current?.send(buf.buffer)
    },
    []
  )

  const publish = useCallback((topic: string, dataPackets: DataPacket[]) => {
    const message = new MulticastData(topic, dataPackets)
    webSocketRef.current?.send(message.serialize())
  }, [])

  const subscribe = useCallback((topic: string) => {
    const message = new SubscriptionRequest(topic, true)
    webSocketRef.current?.send(message.serialize())
  }, [])

  const unsubscribe = useCallback((topic: string) => {
    const message = new SubscriptionRequest(topic, false)
    webSocketRef.current?.send(message.serialize())
  }, [])

  const listen = useCallback((pattern: string) => {
    const message = new NotificationRequest(pattern, true)
    webSocketRef.current?.send(message.serialize())
  }, [])

  const unlisten = useCallback((pattern: string) => {
    const message = new NotificationRequest(pattern, false)
    webSocketRef.current?.send(message.serialize())
  }, [])

  const handleDispose = useCallback(() => {
    if (
      connectionState === 'CONNECTING' ||
      connectionState === 'OPEN'
    ) {
      webSocketRef.current?.close()
    }
  }, [webSocketRef, connectionState])

  const handleOpen = useCallback(
    (event: Event) => {
      console.log(`open: ${event.type}`)

      setConnectionState('OPEN')

      const authenticationRequest = new AuthenticationRequest(
        options?.credentials ? 'basic' : 'none',
        createAuthenticationToken(options?.credentials)
      )

      setAuthenticationState('REQUEST')
      webSocketRef.current?.send(authenticationRequest.serialize())
    },
    [webSocketRef, options]
  )

  const handleClose = useCallback((event: Event) => {
    console.log(`close: ${event.type}`)
    setConnectionState('CLOSED')
  }, [])

  // Error handler: error is a special type of close.
  const handleError = useCallback((event: Event) => {
    console.log(`close: ${event.type}`)
    setConnectionState('CLOSED')
  }, [])

  // Message handler.
  const handleMessage = useCallback((event: MessageEvent) => {
    console.log(`message: ${event.type}`)

    const message = Message.deserialize(new Uint8Array(event.data))

    switch (message.messageType) {
      case MESSAGE_TYPE.AuthenticationResponse:
        {
          const msg = message as AuthenticationResponse
          setClientId(msg.clientId)
          setAuthenticationState('SUCCESS')
        }
        break
      case MESSAGE_TYPE.ForwardedMulticastData:
        {
          const msg = message as ForwardedMulticastData
          setData({
            host: msg.host,
            user: msg.user,
            topic: msg.topic,
            dataPackets: msg.dataPackets.map(x => x.toObj())
          })
        }
        break
      case MESSAGE_TYPE.ForwardedUnicastData:
        {
          const msg = message as ForwardedUnicastData
          setData({
            host: msg.host,
            user: msg.user,
            topic: msg.topic,
            dataPackets: msg.dataPackets.map(x => x.toObj())
          })
        }
        break
      case MESSAGE_TYPE.ForwardedSubscriptionRequest:
        {
          const msg = message as ForwardedSubscriptionRequest
          setNotification({
            host: msg.host,
            user: msg.user,
            clientId: msg.clientId,
            topic: msg.topic,
            isAdd: msg.isAdd
          })
        }
        break
      case MESSAGE_TYPE.Heartbeat:
        {
          const msg = message as Heartbeat
          setHeartbeat({
            count: msg.count
          })
        }
        break
      default:
        console.log('invalid message')
        throw new Error('invalid message')
    }
  }, [])

  useEffect(() => {
    if (connectionState !== 'PENDING') {
      return
    }

    webSocketRef.current = new WebSocket(url)
    webSocketRef.current.binaryType = 'arraybuffer'
    webSocketRef.current.onopen = handleOpen
    webSocketRef.current.onclose = handleClose
    webSocketRef.current.onerror = handleError
    webSocketRef.current.onmessage = handleMessage
    setConnectionState('CONNECTING')

    return handleDispose
  }, [
    url,
    webSocketRef,
    connectionState,
    handleDispose,
    handleOpen,
    handleClose,
    handleError,
    handleMessage
  ])

  return {
    clientId,
    connectionState,
    authenticationState,
    data,
    notification,
    heartbeat,
    send,
    publish,
    subscribe,
    unsubscribe,
    listen,
    unlisten
  }
}
