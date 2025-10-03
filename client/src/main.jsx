import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import App from './App.jsx';
import './index.css';
import { store, persistor } from './redux/features/store.js';

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <StrictMode>
                    <App />
                </StrictMode>
            </PersistGate>
        </Provider>
    </BrowserRouter>
);
