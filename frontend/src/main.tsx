import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { PlatformApp } from './PlatformApp';
import './styles.css';

// BluePOS reference structure: /platform/* and business root are separate
// application trees; never show a mixed shell or route to a Platform panel
// from business navigation. Separate local hostname is also supported.
const host = window.location.hostname.toLowerCase();
const isPlatform = host === 'platform.localhost'
  || host.startsWith('platform.')
  || window.location.pathname === '/platform'
  || window.location.pathname.startsWith('/platform/');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{isPlatform ? <PlatformApp/> : <App/>}</React.StrictMode>
);
