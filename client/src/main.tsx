import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiConfig, createClient } from 'wagmi';
import { configureChains } from '@wagmi/core';
import { MantineProvider } from '@mantine/core';
import { alchemyProvider } from '@wagmi/core/providers/alchemy';
import { polygonMumbai } from '@wagmi/core/chains';
import { InjectedConnector } from '@wagmi/core/connectors/injected';
import { publicProvider } from '@wagmi/core/providers/public';
import { App } from './App';

const { chains, provider } = configureChains(
  [polygonMumbai],
  [
    alchemyProvider({ apiKey: import.meta.env.VITE_ALCHEMY_API_KEY }),
    publicProvider(),
  ]
);

const client = createClient({
  autoConnect: true,
  connectors: [new InjectedConnector({ chains })],
  provider,
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <WagmiConfig client={client}>
        <App />
      </WagmiConfig>
    </MantineProvider>
  </React.StrictMode>
);
