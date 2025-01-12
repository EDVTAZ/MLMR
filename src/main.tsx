import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';

import App from './app/app';

registerSW({ immediate: true });

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
