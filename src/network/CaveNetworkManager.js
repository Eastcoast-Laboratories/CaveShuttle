import { EventEmitter } from './event-emitter.js'
import { GeckosAdapter } from './GeckosAdapter.js'
import { WebRTCAdapter } from './WebRTCAdapter.js'
import { networkStatusTranslations as tr } from '../i18n/networkStatus.js'
import { Capacitor } from '@capacitor/core'

// On Capacitor native (mobile app), the WebView is served from https://localhost
// but there is no Geckos server running there. Use the production server URL instead.
// window.Capacitor exists even in web browsers (via @capacitor/core), so we must
// use isNativePlatform() to distinguish native apps from web.
const isCapacitorNative = typeof window !== 'undefined'
  && typeof Capacitor !== 'undefined'
  && Capacitor.isNativePlatform?.()

const PRODUCTION_SERVER_URL = 'https://caveshuttle.z11.de'

const DEFAULT_SERVER_URL = typeof window !== 'undefined'
  ? (isCapacitorNative
    ? PRODUCTION_SERVER_URL
    : `${window.location.protocol}//${window.location.hostname}`)
  : 'http://localhost'

// In production, Geckos is proxied through nginx on the same origin (no port needed).
// In development, the Geckos server runs on port 9208.
// On Capacitor, the production server is used (no port needed).
const DEFAULT_SERVER_PORT = typeof window !== 'undefined' && window.location.hostname === 'localhost' && !isCapacitorNative
  ? 9208
  : null

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

// High-level manager that unites the online (Geckos) and local (WebRTC P2P)
// adapters. It owns the lobby/waiting-room lifecycle and exposes a simple
// event-driven API for the React UI and the GameCanvas.
export class CaveNetworkManager extends EventEmitter {
  constructor() {
    super()
    this.adapter = null
    this.mode = null
    this.role = null
    this.state = 'idle'
    this.lobbyCode = null
    this.isPublic = false
    this.localOffer = null
    this.localAnswer = null
    this.players = []
    this.playerName = ''
    this.statusMessages = []
    this.latency = 0
    this.connected = false
    this.error = null
    this._pingInterval = null
    this._lastPingSent = 0
    this.language = 'en'
  }

  setLanguage(lang) {
    this.language = lang || 'en'
  }

  t(key, vars = {}) {
    const dict = tr[this.language] || tr.en
    let text = dict[key] || tr.en[key] || key
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, v)
    }
    return text
  }

  _setState(patch) {
    Object.assign(this, patch)
    this.emit('change', this.getState())
  }

  getState() {
    return {
      mode: this.mode,
      role: this.role,
      state: this.state,
      lobbyCode: this.lobbyCode,
      isPublic: this.isPublic,
      localOffer: this.localOffer,
      localAnswer: this.localAnswer,
      players: this.players,
      playerName: this.playerName,
      statusMessages: this.statusMessages,
      latency: this.latency,
      connected: this.connected,
      error: this.error,
    }
  }

  addStatus(text, type = 'info') {
    const message = { id: `${Date.now()}-${Math.random()}`, text, type, ts: Date.now() }
    this.statusMessages = [...this.statusMessages.slice(-49), message]
    this.emit('change', this.getState())
  }

  reset() {
    if (this.adapter) {
      this.adapter.close()
      this.adapter = null
    }
    clearInterval(this._pingInterval)
    this._setState({
      mode: null,
      role: null,
      state: 'idle',
      lobbyCode: null,
      isPublic: false,
      localOffer: null,
      localAnswer: null,
      players: [],
      playerName: '',
      statusMessages: [],
      latency: 0,
      connected: false,
      error: null,
    })
  }

  backToLobby() {
    clearInterval(this._pingInterval)
    this._pingInterval = null
    this.players = this.players.map(p => ({ ...p, ready: false }))
    this._setState({
      state: 'lobby',
      players: [...this.players],
      latency: 0,
    })
    if (this.adapter && this.mode === 'online') {
      this.adapter.sendLobby('ready', { ready: false })
    }
    this.addStatus(this.t('backToLobby'))
  }

  _startAdapterListeners(adapter) {
    adapter.on('connected', () => {
      this.connected = true
      this._startPing()
      this.emit('change', this.getState())
    })

    adapter.on('disconnected', () => {
      this.connected = false
      clearInterval(this._pingInterval)
      this._setState({ state: 'disconnected' })
      this.addStatus(this.t('disconnected'), 'error')
    })

    adapter.on('error', (data) => {
      this.error = data?.message || this.t('unknownError')
      this._setState({ error: this.error })
      this.addStatus(this.error, 'error')
    })

    // Lobby lifecycle (Geckos server-driven)
    adapter.on('lobby:created', (data) => {
      this.role = 'host'
      this.lobbyCode = data?.code
      this.isPublic = !!data?.isPublic
      this.players = [{ role: 'host', ready: false, name: this.playerName }]
      this._setState({ state: 'lobby', players: this.players, isPublic: this.isPublic })
      this.addStatus(this.t('lobbyCreated', { code: this.lobbyCode }))
    })

    adapter.on('lobby:joined', (data) => {
      this.role = data?.role || 'client'
      this.lobbyCode = data?.code
      const players = this.role === 'host'
        ? [{ role: 'host', ready: false, name: this.playerName }]
        : [{ role: 'host', ready: false, name: data?.hostName }, { role: 'client', ready: false, name: this.playerName }]
      this._setState({ state: 'lobby', players })
      this.addStatus(this.t('lobbyJoined', { code: this.lobbyCode }))
    })

    adapter.on('lobby:peer-joined', (data) => {
      this._setState({
        players: [
          { role: 'host', ready: this.players[0]?.ready || false, name: this.players[0]?.name || this.playerName },
          { role: 'client', ready: this.players[1]?.ready || false, name: data?.name || 'Player 2' },
        ],
      })
      this.addStatus(this.t('peerJoined'))
    })

    adapter.on('lobby:peer-left', () => {
      this._setState({ players: this.players.filter(p => p.role === this.role), state: 'disconnected' })
      this.addStatus(this.t('peerLeft'), 'error')
    })

    adapter.on('lobby:peer-ready', (data) => {
      const role = data?.role
      const ready = !!data?.ready
      this.players = this.players.map(p => (p.role === role ? { ...p, ready } : p))
      this._setState({ players: [...this.players] })
      const num = role === 'host' ? 1 : 2
      this.addStatus(ready ? this.t('peerReady', { num }) : this.t('peerNotReady', { num }))
    })

    adapter.on('lobby:all-ready', () => {
      this._setState({ state: 'ready' })
      this.addStatus(this.t('allReady'))
    })

    adapter.on('lobby:started', () => {
      this._setState({ state: 'playing' })
      this.addStatus(this.t('gameStarting'))
      this.emit('game:start')
    })

    // Game traffic is passed through to GameCanvas.
    ;['game:input', 'game:state', 'game:event'].forEach(event => {
      adapter.on(event, data => {
        if (event === 'game:event') {
          console.log('[HS_SYNC] Adapter received game:event, type:', data?.type, 're-emitting');
        }
        this.emit(event, data)
      })
    })

    adapter.on('game:pong', (data) => {
      const now = performance.now()
      const sent = data?.t || this._lastPingSent
      const rtt = now - sent
      if (rtt > 0) {
        this.latency = clamp(Math.round(rtt / 2), 0, 9999)
        this.emit('change', this.getState())
      }
    })
  }

  // Local P2P -----------------------------------------------------------------

  async createLocalLobby() {
    this.reset()
    this.mode = 'local'
    this.role = 'host'
    const adapter = new WebRTCAdapter()
    this.adapter = adapter
    this._startAdapterListeners(adapter)

    adapter.on('data-channel-open', () => {
      this.connected = true
      this._setState({
        state: 'lobby',
        players: [
          { role: 'host', ready: false },
          { role: 'client', ready: false },
        ],
      })
      this.addStatus(this.t('directConnected'))
      this._startPing()
    })

    const offer = await adapter.createHostOffer()
    this.localOffer = offer
    this._setState({ localOffer: offer })
    this.addStatus(this.t('localLobbyCreated'))
    return offer
  }

  async joinLocalLobby(offerSdp) {
    this.reset()
    this.mode = 'local'
    this.role = 'client'
    const adapter = new WebRTCAdapter()
    this.adapter = adapter
    this._startAdapterListeners(adapter)

    adapter.on('data-channel-open', () => {
      this.connected = true
      this._setState({
        state: 'lobby',
        players: [
          { role: 'host', ready: false },
          { role: 'client', ready: false },
        ],
      })
      this.addStatus(this.t('connectedToHost'))
      this._startPing()
    })

    const answer = await adapter.connectToHost(offerSdp)
    this.localAnswer = answer
    this._setState({ localAnswer: answer })
    return answer
  }

  async provideLocalAnswer(answerSdp) {
    if (!this.adapter || this.mode !== 'local' || this.role !== 'host') {
      throw new Error('No local host lobby active')
    }
    await this.adapter.acceptClientAnswer(answerSdp)
  }

  // Online Geckos -------------------------------------------------------------

  async createOnlineLobby(serverUrl = DEFAULT_SERVER_URL, port = DEFAULT_SERVER_PORT, isPublic = false, playerName = '') {
    this.reset()
    this.mode = 'online'
    this.playerName = playerName
    const adapter = new GeckosAdapter()
    this.adapter = adapter
    this._startAdapterListeners(adapter)
    await adapter.connect({ url: serverUrl, port })
    adapter.sendLobby('create', { isPublic, playerName })
  }

  async joinOnlineLobby(serverUrl = DEFAULT_SERVER_URL, port = DEFAULT_SERVER_PORT, code, playerName = '') {
    this.reset()
    this.mode = 'online'
    this.playerName = playerName
    const adapter = new GeckosAdapter()
    this.adapter = adapter
    this._startAdapterListeners(adapter)
    await adapter.connect({ url: serverUrl, port })
    adapter.sendLobby('join', { code: code?.toUpperCase?.(), playerName })
  }

  async joinRandomOnlineLobby(serverUrl = DEFAULT_SERVER_URL, port = DEFAULT_SERVER_PORT, playerName = '') {
    this.reset()
    this.mode = 'online'
    this.playerName = playerName
    const adapter = new GeckosAdapter()
    this.adapter = adapter
    this._startAdapterListeners(adapter)
    await adapter.connect({ url: serverUrl, port })
    adapter.sendLobby('random', { playerName })
  }

  // Lobby actions -------------------------------------------------------------

  setReady(ready) {
    if (!this.adapter) return
    this.players = this.players.map(p => (p.role === this.role ? { ...p, ready } : p))
    this._setState({ players: [...this.players] })
    if (this.mode === 'online') {
      this.adapter.sendLobby('ready', { ready })
    } else if (this.mode === 'local') {
      this.adapter.send('lobby:peer-ready', { role: this.role, ready })
      const allReady = this.players.length === 2 && this.players.every(p => p.ready)
      if (allReady) {
        this._setState({ state: 'ready' })
        this.addStatus(this.t('allReady'))
      }
    }
  }

  startGame() {
    if (this.role !== 'host') return
    if (this.mode === 'online') {
      this.adapter.sendLobby('start')
    } else if (this.mode === 'local') {
      this.adapter.send('lobby:started', {})
    }
    this._setState({ state: 'playing' })
    this.addStatus(this.t('gameStarting'))
    this.emit('game:start')
  }

  // Game traffic ---------------------------------------------------------------

  sendInput(input) {
    this.sendGame('input', input)
  }

  sendState(state) {
    this.sendGame('state', state)
  }

  sendEvent(event) {
    this.sendGame('event', event)
  }

  sendHighscoreSync(data) {
    console.log('[HS_SYNC] sendHighscoreSync called, mode:', this.mode, 'has adapter:', !!this.adapter)
    this.sendGame('event', { type: 'hs-sync', data })
  }

  sendHighscoreRecord(record) {
    console.log('[HS_SYNC] sendHighscoreRecord called, mode:', this.mode, 'has adapter:', !!this.adapter, 'record type:', record?.type)
    this.sendGame('event', { type: 'hs-sync-record', data: record })
  }

  sendGame(type, payload) {
    if (!this.adapter) {
      console.log('[HS_SYNC] sendGame: no adapter, type:', type, 'payload type:', payload?.type)
      return
    }
    console.log('[HS_SYNC] sendGame: type:', type, 'payload type:', payload?.type, 'mode:', this.mode)
    if (this.mode === 'online') {
      this.adapter.sendGame(type, payload)
    } else if (this.mode === 'local') {
      this.adapter.send(`game:${type}`, payload)
    }
  }

  // Latency -------------------------------------------------------------------

  _startPing() {
    clearInterval(this._pingInterval)
    this._pingInterval = setInterval(() => {
      this._lastPingSent = performance.now()
      if (this.mode === 'online') {
        this.adapter?.ping(this._lastPingSent)
      } else if (this.mode === 'local') {
        this.adapter?.send('game:ping', { t: this._lastPingSent })
      }
    }, 2000)
  }
}

