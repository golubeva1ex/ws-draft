import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ChatClient } from './chat-client';

const URL = 'wss://localhost:3001';
async function postData(url = "",data = {}) {
  const response = await fetch(url, {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "SameSite": ''
    },
    redirect: "follow",
    referrerPolicy: "no-referrer",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    console.error(response)
    return;
  }
  return response.json();
}

async function getData(url = "") {
  const response = await fetch(url, {
    method: "GET",
    mode: "cors",
    cache: "no-cache",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    redirect: "follow",
    referrerPolicy: "no-referrer",
  });
  if (!response.ok) {
    console.error(response)
    return;
  }
  return response.json();
}

const App = () => {

  const socket = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [members, setMembers] = useState([]);
  const [chatRows, setChatRows] = useState<React.ReactNode[]>([]);

  const onSocketOpen = useCallback(() => {
    setIsConnected(true);
    const name = prompt('Enter your name');
    socket.current?.send(JSON.stringify({ action: 'auth', name }));
  }, []);

  const onSocketClose = useCallback(() => {
    setMembers([]);
    setIsConnected(false);
    setChatRows([]);
    }, []);

  const onSocketMessage = useCallback((dataStr) => {
    const data = JSON.parse(dataStr);
    if (data.members) {
      setMembers(data.members);
    } else if (data.publicMessage) {
      setChatRows(oldArray => [...oldArray, <span><b>{data.publicMessage}</b></span>]);
    } else if (data.privateMessage) {
      alert(data.privateMessage);
    } else if (data.systemMessage) {
      setChatRows(oldArray => [...oldArray, <span><i>{data.systemMessage}</i></span>]);
    }
  }, []);

  const onConnect = useCallback(async () => {
    if (socket.current?.readyState !== WebSocket.OPEN) {
      const name = prompt('Enter your user 1 or 2');
      await postData("https://localhost:3000/dev/api/login",{
        "email": parseInt(name || "",10) === 1 ? "f31ea@a.com" : "aa@a.com",
        "password": "#Dddddddd1",
        "remember": true
      });
      const {token = ""} = await getData("https://localhost:3000/dev/api/requestWebsocketToken");
      socket.current = new WebSocket(URL, token);
      socket.current.addEventListener('open', onSocketOpen);
      socket.current.addEventListener('close', onSocketClose);
      socket.current.addEventListener('message', (event) => {
        onSocketMessage(event.data);
      });
      console.log(socket.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      socket.current?.send(JSON.stringify({ action: '$disconnect' }));
      socket.current?.close();
    };
  }, []);

  const onSendPrivateMessage = useCallback((to: string) => {
    const message = prompt('Enter private message for ' + to);
    socket.current?.send(JSON.stringify({
      action: 'sendPrivate',
      message,
      to,
    }));
  }, []);

  const onSendPublicMessage = useCallback(() => {
    const message = prompt('Enter public message');
    socket.current?.send(JSON.stringify({
      action: 'sendPublic',
      message,
    }));
  }, []);

  const onDisconnect = useCallback(() => {
    if (isConnected) {
      socket.current?.send(JSON.stringify({ action: '$disconnect' }));
      socket.current?.close();
    }
  }, [isConnected]);

  return <ChatClient
    isConnected={isConnected}
    members={members}
    chatRows={chatRows}
    onPublicMessage={onSendPublicMessage}
    onPrivateMessage={onSendPrivateMessage}
    onConnect={onConnect}
    onDisconnect={onDisconnect}
  />;

}

export default App
