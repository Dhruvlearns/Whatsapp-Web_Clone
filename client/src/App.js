import React from 'react';
import { ChatProvider } from './context/ChatContext';
import ChatInterface from './components/ChatInterface';
import './styles/App.css';

function App() {
  return (
    <ChatProvider>
      <div className="App">
        <ChatInterface />
      </div>
    </ChatProvider>
  );
}

export default App;
