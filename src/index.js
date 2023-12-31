import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { useState, useRef } from 'react';

export function useStateWithRef(initialState) {
    const [stateHandler, stateSetter] = useState(initialState);
    const stateRef = useRef(initialState);
    const state = {
        get: () => stateRef.current,
        set: (newValue) => { stateRef.current = newValue; stateSetter(newValue); }
    }
    return [stateHandler, state];
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <App />
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
