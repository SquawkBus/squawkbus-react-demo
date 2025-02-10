import { useEffect, useState } from 'react'

import { useSquawkbus, AuthenticationState, ConnectionState } from './squawkbus'

export default function App() {
  const {
    clientId,
    connectionState,
    authenticationState,
    data,
    notification,
    subscribe
  } = useSquawkbus('ws://localhost:8559')
  const [subscriptions, setSubscriptions] = useState<string[]>([])

  useEffect(() => {
    console.log(
      clientId,
      connectionState,
      authenticationState,
      data,
      notification
    )
  }, [clientId, connectionState, authenticationState, data, notification])

  useEffect(() => {
    if (
      !(
        connectionState === ConnectionState.OPEN &&
        authenticationState == AuthenticationState.SUCCESS
      )
    ) {
      return
    }

    if (!subscriptions.includes('foo')) {
      console.log('Subscribing to foo')
      setSubscriptions(subscriptions => [...subscriptions, 'foo'])
      subscribe('foo')
    }
  }, [authenticationState, connectionState, subscribe, subscriptions])

  return (
    <>
      <p>Example</p>
      <div>
        <span>Connection State</span>
        {connectionState}
      </div>
      <div>
        <span>Authentication State</span>
        {authenticationState}
      </div>
      <div>
        <span>Client Id</span>
        {clientId}
      </div>
    </>
  )
}
