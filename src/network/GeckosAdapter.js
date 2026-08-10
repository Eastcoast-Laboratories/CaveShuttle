import geckos from '@geckos.io/client'
import { EventEmitter } from './event-emitter.js'

export class GeckosAdapter extends EventEmitter {
  constructor() {
    super()
    this.channel = null
    this.role = null
    this.lobbyCode = null
  }

  connect({ url, port = 9208, path = '' }) {
    return new Promise((resolve, reject) => {
      const options = {
        url,
        port: port ?? null,
        label: 'cave-shuttle',
        iceServers: [
          { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
        ],
      }
      if (path) options.url = `${url}${path}`

      // Monkey-patch RTCPeerConnection to log ICE events before onConnect fires
      const OrigRTC = window.RTCPeerConnection || window.webkitRTCPeerConnection
      const PatchedRTC = function (...args) {
        let pc
        try {
          pc = new OrigRTC(...args)
        } catch (e) {
          console.error('[GECKOS-CLIENT] RTCPeerConnection creation failed:', e.message)
          window.RTCPeerConnection = OrigRTC
          reject(e)
          throw e
        }
        console.log('[GECKOS-CLIENT] RTCPeerConnection created with config:', JSON.stringify(args[0]))
        pc.addEventListener('iceconnectionstatechange', () => {
          console.log('[GECKOS-CLIENT] ICE state:', pc.iceConnectionState)
        })
        pc.addEventListener('icegatheringstatechange', () => {
          console.log('[GECKOS-CLIENT] ICE gathering state:', pc.iceGatheringState)
        })
        pc.addEventListener('connectionstatechange', () => {
          console.log('[GECKOS-CLIENT] PC connection state:', pc.connectionState)
        })
        pc.addEventListener('icecandidate', (e) => {
          if (e.candidate) {
            console.log('[GECKOS-CLIENT] Local ICE candidate:', e.candidate.candidate.substring(0, 80))
          } else {
            console.log('[GECKOS-CLIENT] ICE gathering complete')
          }
        })
        pc.addEventListener('datachannel', (e) => {
          console.log('[GECKOS-CLIENT] DataChannel event received, label:', e.channel.label, 'readyState:', e.channel.readyState)
          e.channel.addEventListener('open', () => console.log('[GECKOS-CLIENT] DataChannel opened'))
          e.channel.addEventListener('error', (err) => console.error('[GECKOS-CLIENT] DataChannel error:', err))
        })
        return pc
      }
      PatchedRTC.prototype = OrigRTC.prototype
      window.RTCPeerConnection = PatchedRTC

      this.channel = geckos(options)

      // Timeout: if onConnect doesn't fire within 20s, reject
      const timeoutId = setTimeout(() => {
        console.error('[GECKOS-CLIENT] connect() timed out after 20s — ICE likely failed')
        // Restore original RTCPeerConnection
        window.RTCPeerConnection = OrigRTC
        reject(new Error('Geckos connection timed out (ICE negotiation failed)'))
      }, 20000)

      this.channel.onConnect(err => {
        clearTimeout(timeoutId)
        // Restore original RTCPeerConnection
        window.RTCPeerConnection = OrigRTC
        if (err) {
          console.error('[GECKOS-CLIENT] onConnect error:', err)
          this.emit('error', { message: err.message || String(err) || 'Geckos connect failed' })
          reject(err)
          return
        }
        console.log('[GECKOS-CLIENT] onConnect success, dataChannel ready')
        this._bindChannel()
        this.emit('connected')
        resolve()
      })

      this.channel.onDisconnect(() => {
        clearTimeout(timeoutId)
        window.RTCPeerConnection = OrigRTC
        console.log('[GECKOS-CLIENT] disconnected')
        this.emit('disconnected')
      })
    })
  }

  _bindChannel() {
    const channel = this.channel
    // Lobby lifecycle events
    channel.on('lobby:created', data => {
      this.role = 'host'
      this.lobbyCode = data?.code
      this.emit('lobby:created', data)
    })
    channel.on('lobby:joined', data => {
      this.role = data?.role || 'client'
      this.lobbyCode = data?.code
      this.emit('lobby:joined', data)
    })
    channel.on('lobby:error', data => this.emit('error', data))
    channel.on('lobby:peer-joined', data => this.emit('lobby:peer-joined', data))
    channel.on('lobby:peer-left', data => this.emit('lobby:peer-left', data))
    channel.on('lobby:peer-ready', data => this.emit('lobby:peer-ready', data))
    channel.on('lobby:all-ready', data => this.emit('lobby:all-ready', data))
    channel.on('lobby:started', data => this.emit('lobby:started', data))

    // Game traffic is forwarded by the server and re-emitted as raw events.
    channel.on('game:input', data => this.emit('game:input', data))
    channel.on('game:state', data => this.emit('game:state', data))
    channel.on('game:event', data => this.emit('game:event', data))
    channel.on('game:pong', data => this.emit('game:pong', data))
  }

  sendLobby(action, data = {}) {
    if (!this.channel) return
    this.channel.emit(`lobby:${action}`, data)
  }

  sendGame(type, payload) {
    if (!this.channel) return
    this.channel.emit(`game:${type}`, payload)
  }

  ping(t) {
    if (!this.channel) return
    this.channel.emit('game:ping', { t })
  }

  close() {
    if (this.channel) {
      this.channel.close()
      this.channel = null
    }
  }
}
