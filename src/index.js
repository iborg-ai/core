const WebSocket = require('ws');
const url = require('url');
const fs = require('fs');
const https = require('https');

const options = {
  key: fs.readFileSync('/etc/ssl/key.pem'),
  cert: fs.readFileSync('/etc/ssl/cert.pem')
};
const server = https.createServer(options);
const wss = new WebSocket.Server({ server });
server.listen(9443);

const clients = [];
const webClients = [];
const DATA = {};

wss.on('connection', (ws, req) => {
  const { query: { token, type } } = url.parse(req.url, true);
  if(token && type && type === 'web'){
    ws.id = token;
    webClients.push(ws);
    console.log('New Web Client Connected', 'Clients: ' + clients.length, 'Web Clients: ' + webClients.length);
  }

  if(token && type && type === 'bridge') {
    ws.id = token;
    clients.push(ws);
    console.log('New User Connected:' + token, 'Clients: ' + clients.length, 'Web Clients: ' + webClients.length);
  }

  ws.on('message', (data) => {
    data = JSON.parse(data);
    DATA[ws.id] = data;
    const eegs = Object.values(DATA).map(e => e.rawEeg);
    const average = {
      rawEeg: eegs.reduce((r, a) => {
        a.forEach((b, i) => {
          r[i] = (r[i] || 0) + b;
        });
        return r;
      }, []).map(e => e / clients.length),
      timestamp: new Date().getTime()
    }
    webClients.forEach((ws) => {
      ws.send(JSON.stringify(average));
    });
  });
  ws.on('close', () => {
    if(clients.findIndex(w => w.id === ws.id) > -1) {
      clients.splice(clients.findIndex(w => w.id === ws.id), 1);
    }
    if(webClients.findIndex(w => w.id === ws.id) > -1) {
      webClients.splice(webClients.findIndex(w => w.id === ws.id), 1);
    }
    try {
      delete DATA[ws.id];
      console.log('User Disconnected:' + ws.id, 'Clients: ' + clients.length, 'Web Clients: ' + webClients.length);
    } catch (error) {

    }
  });
});