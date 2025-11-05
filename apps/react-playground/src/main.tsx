import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@uipath/apollo-react/core/theme.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
