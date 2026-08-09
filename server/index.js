import geckos from '@geckos.io/server'
import { customAlphabet } from 'nanoid'
import http from 'http'
import https from 'https'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const generateCode = customAlphabet(ROOM_CODE_ALPHABET, 5)

// WebRTC UDP port range. These ports have to be DNAT'd 1:1 from the Xen host
// to the VM where caveshuttle runs, and the NAT preserves the source port, so STUN discovers
// a directly reachable srflx candidate. No TURN server is required.
const WEBRTC_PORT_MIN = Number(process.env.WEBRTC_PORT_MIN || 60700)
const WEBRTC_PORT_MAX = Number(process.env.WEBRTC_PORT_MAX || 60830)

// Log uncaught errors to help diagnose 500 responses
process.on('uncaughtException', (err) => {
  console.error('[GECKOS-SERVER] uncaughtException:', err)
})
process.on('unhandledRejection', (err) => {
  console.error('[GECKOS-SERVER] unhandledRejection:', err)
})

const io = geckos({
  cors: { origin: '*', allowAuthorization: false },
  label: 'cave-shuttle',
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
  portRange: { min: WEBRTC_PORT_MIN, max: WEBRTC_PORT_MAX },
})

const lobbies = new Map()

function log(...args) {
  console.log('[GECKOS-SERVER]', ...args)
}

function makeLobby(code, hostChannel, isPublic) {
  const lobby = {
    code,
    isPublic,
    host: hostChannel,
    client: null,
    hostReady: false,
    clientReady: false,
    started: false,
  }
  hostChannel.userData = { lobbyCode: code, role: 'host' }
  hostChannel.join(code)
  lobbies.set(code, lobby)
  return lobby
}

function removeLobby(lobby) {
  if (lobby.host) {
    lobby.host.leave()
    lobby.host.userData = null
  }
  if (lobby.client) {
    lobby.client.leave()
    lobby.client.userData = null
  }
  lobbies.delete(lobby.code)
}

function findPublicLobby() {
  for (const lobby of lobbies.values()) {
    if (lobby.isPublic && !lobby.client && !lobby.started) {
      return lobby
    }
  }
  return null
}

function notifyOther(lobby, sender, event, data) {
  const other = sender === lobby.host ? lobby.client : lobby.host
  if (other) {
    other.emit(event, data)
  }
}

io.onConnection((channel) => {
  log('connection', channel.id)

  channel.on('lobby:create', (data) => {
    log('lobby:create received', data)
    const isPublic = !!data?.isPublic
    const playerName = data?.playerName || ''
    const code = generateCode()
    const lobby = makeLobby(code, channel, isPublic)
    channel.userData.playerName = playerName
    log('created lobby', code, isPublic ? 'public' : 'private')
    channel.emit('lobby:created', { code, isPublic })
  })

  channel.on('lobby:join', (data) => {
    const code = String(data?.code || '').toUpperCase()
    const lobby = lobbies.get(code)
    if (!lobby) {
      channel.emit('lobby:error', { message: 'Lobby not found' })
      return
    }
    if (lobby.client) {
      channel.emit('lobby:error', { message: 'Lobby is full' })
      return
    }
    const playerName = data?.playerName || ''
    lobby.client = channel
    channel.userData = { lobbyCode: code, role: 'client', playerName }
    channel.join(code)
    log('client joined lobby', code)
    channel.emit('lobby:joined', { code, role: 'client', hostName: lobby.host?.userData?.playerName || '' })
    lobby.host.emit('lobby:peer-joined', { id: channel.id, name: playerName })
  })

  channel.on('lobby:random', (data) => {
    const playerName = data?.playerName || ''
    const lobby = findPublicLobby()
    if (!lobby) {
      const code = generateCode()
      const newLobby = makeLobby(code, channel, true)
      channel.userData.playerName = playerName
      channel.emit('lobby:created', { code, isPublic: true, waiting: true })
      log('random match: created public lobby', code)
      return
    }
    lobby.client = channel
    channel.userData = { lobbyCode: lobby.code, role: 'client', playerName }
    channel.join(lobby.code)
    log('random match: client joined', lobby.code)
    channel.emit('lobby:joined', { code: lobby.code, role: 'client', hostName: lobby.host?.userData?.playerName || '' })
    lobby.host.emit('lobby:peer-joined', { id: channel.id, name: playerName })
  })

  channel.on('lobby:ready', (data) => {
    const code = channel.userData?.lobbyCode
    const role = channel.userData?.role
    const lobby = lobbies.get(code)
    if (!lobby) return
    const ready = !!data?.ready
    if (role === 'host') lobby.hostReady = ready
    if (role === 'client') lobby.clientReady = ready
    log('ready state', code, role, ready)
    notifyOther(lobby, channel, 'lobby:peer-ready', { role, ready })
    if (lobby.hostReady && lobby.clientReady) {
      lobby.host.emit('lobby:all-ready', { code })
      if (lobby.client) lobby.client.emit('lobby:all-ready', { code })
    }
  })

  channel.on('lobby:start', () => {
    const code = channel.userData?.lobbyCode
    const lobby = lobbies.get(code)
    if (!lobby || channel !== lobby.host) return
    lobby.started = true
    log('lobby started', code)
    channel.room.emit('lobby:started', { code })
  })

  channel.on('game:ping', (data) => {
    channel.emit('game:pong', { t: data?.t, server: Date.now() })
  })

  // Relay all game:* traffic to the other peer (host <-> client).
  channel.on('game:input', (data) => {
    const code = channel.userData?.lobbyCode
    const lobby = lobbies.get(code)
    if (!lobby) return
    notifyOther(lobby, channel, 'game:input', data)
  })

  channel.on('game:state', (data) => {
    const code = channel.userData?.lobbyCode
    const lobby = lobbies.get(code)
    if (!lobby) return
    notifyOther(lobby, channel, 'game:state', data)
  })

  channel.on('game:event', (data) => {
    const code = channel.userData?.lobbyCode
    const lobby = lobbies.get(code)
    if (!lobby) return
    notifyOther(lobby, channel, 'game:event', data)
  })

  channel.onDisconnect(() => {
    const code = channel.userData?.lobbyCode
    if (!code) return
    const lobby = lobbies.get(code)
    if (!lobby) return
    log('disconnect in lobby', code, channel.userData?.role)
    const other = channel === lobby.host ? lobby.client : lobby.host
    if (other) {
      other.emit('lobby:peer-left', { role: channel.userData?.role })
      other.leave()
    }
    removeLobby(lobby)
  })
})

const PORT = process.env.PORT || 9208

const __dirname = dirname(fileURLToPath(import.meta.url))
const certDir = join(__dirname, '..', '.dev-certs')
const certFile = join(certDir, 'localhost.pem')
const keyFile = join(certDir, 'localhost-key.pem')
const useHttps = existsSync(certFile) && existsSync(keyFile)

const requestHandler = (req, res) => {
  if (req.method === 'GET' && (req.url === '/health' || req.url === '/')) {
    res.writeHead(200, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' })
    res.end('ok')
  }
  if (req.method === 'GET' && req.url === '/public-lobby') {
    const available = !!findPublicLobby()
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
    res.end(JSON.stringify({ available }))
  }
  // Log Geckos requests for debugging
  if (req.url && req.url.includes('.wrtc')) {
    log(`[HTTP] ${req.method} ${req.url}`)
  }
  // Any other request is left for the Geckos request handler to process.
}

let httpServer
if (useHttps) {
  const httpsOptions = {
    cert: readFileSync(certFile),
    key: readFileSync(keyFile),
  }
  httpServer = https.createServer(httpsOptions, requestHandler)
  log('using HTTPS with mkcert certificates')
} else {
  httpServer = http.createServer(requestHandler)
  log('using plain HTTP (no .dev-certs found)')
}

io.addServer(httpServer)
httpServer.listen(PORT, '0.0.0.0')
log('listening on port', PORT, useHttps ? '(HTTPS)' : '(HTTP)')
