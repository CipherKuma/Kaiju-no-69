'use client'

import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { wagmiConfig } from './config'
import { ReactNode } from 'react'
import '@rainbow-me/rainbowkit/styles.css'

interface Web3ProviderProps {
  children: ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <RainbowKitProvider
        theme={darkTheme({
          accentColor: '#a78bfa',
          accentColorForeground: 'white',
          borderRadius: 'medium',
          overlayBlur: 'small',
        })}
        initialChain={360} // Set Shape as the initial chain
      >
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  )
}