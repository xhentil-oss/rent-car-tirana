import React from 'react';
import ReactDOM from 'react-dom/client';
import { AnimaProvider } from '@animaapp/playground-react-sdk';
import App from './App';
import './index.css';
import './i18n/index';

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <AnimaProvider>
      <App />
    </AnimaProvider>
  </React.StrictMode>
);
