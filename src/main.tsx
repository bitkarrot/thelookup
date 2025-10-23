import { createRoot } from 'react-dom/client';

// Import polyfills first
import './lib/polyfills.ts';

import App from './App.tsx';
import './index.css';

// Client-side redirect from nostrnips.com and nostrproto.com to nostrhub.io
if (window.location.hostname === 'nostrnips.com' || window.location.hostname === 'nostrproto.com') {
  const newUrl = window.location.href.replace(window.location.hostname, 'nostrhub.io');
  window.location.replace(newUrl);
}

createRoot(document.getElementById("root")!).render(<App />);
