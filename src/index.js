const WebSocket = require('ws');

const wss = new WebSocket.Server({
  port: 3000
});

wss.on('connection', (ws) => {
    console.log('New User Connected');
    ws.on('message', (data) => {
        console.log(data);
    });
});