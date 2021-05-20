import { ipcRenderer, shell } from 'electron'
const { net } = require('electron').remote

const state = {
  start: false,
  mediaServerState: {},
  loading: false
}

const mutations = {
  setMediaServerState (state, s) {
    state.mediaServerState = s
  }, setMediaServerStartState (state, start) {
    state.start = start
  }, setMediaServerLoading (state, loading) {
    state.loading = loading
  }, openBrowser(state, url) {
    shell.openExternal(url)
  }
}

const actions = {
  updateMediaServerState ({ commit }) {
    var request = net.request('http://127.0.0.1:8000/api/server')
    request.on('response', (response) => {
      response.on('data', (chunk) => {
        var s = JSON.parse(`${chunk}`)
        commit('setMediaServerState', s)
        commit('setMediaServerStartState', true)
        commit('setMediaServerLoading', false)
      })
    })
    request.on('error', (err) => {
      commit('setMediaServerStartState', false)
      commit('setMediaServerLoading', false)
    })
    request.end()
  }, startMediaServer ({ commit }) {
    ipcRenderer.send('MediaServer', 'start')
    commit('setMediaServerLoading', true)
  }, stopMediaServer ({ commit }) {
    ipcRenderer.send('MediaServer', 'stop')
    commit('setMediaServerLoading', true)
    ipcRenderer.once('MediaServer', (event, arg) => {
      if (arg === 'done') {
        commit('setMediaServerLoading', false)
        commit('setMediaServerStartState', false)
      }
    })
  }, restartMediaServer ({ commit }) {
    ipcRenderer.send('MediaServer', 'restart')
    commit('setMediaServerLoading', true)
  }
}

const getters = {
  mediaServerCPUPercent: state => {
    if (state.start) return state.mediaServerState['cpu']['load']
    else return 0
  }, mediaServerCPUModel: state => {
    if (state.start) return state.mediaServerState['cpu']['model']
    else return ''
  }, mediaServerMemoryPercent: state => {
    if (state.start) {
      var memT = state.mediaServerState['mem']['totle']
      var memU = memT - state.mediaServerState['mem']['free']
      return Number((100*memU/memT).toFixed(0))
    } else return 0
  }, mediaServerMemoryTotal: state => {
    if (state.start) return Number((state.mediaServerState['mem']['totle']/1073741824).toFixed(1))
    else return 0
  }, mediaServerMemoryUsage: state => {
    if (state.start) {
      var memT = state.mediaServerState['mem']['totle']
      var memU = memT - state.mediaServerState['mem']['free']
      return Number((memU/1073741824).toFixed(1))
    } else return 0
  }, mediaServerNetUsage: state => {
    if (state.start) {
      var netU = state.mediaServerState['net']['inbytes'] + state.mediaServerState['net']['outbytes']
      return Number((netU/1048576).toFixed(0))
    } else return 0
  }, mediaServerNetIn: state => {
    if (state.start) return Number((state.mediaServerState['net']['inbytes']/1048576).toFixed(0))
    else return 0
  }, mediaServerNetOut: state => {
    if (state.start) return Number((state.mediaServerState['net']['outbytes']/1048576).toFixed(0))
    else return 0
  }, mediaServerConnectedNumber: state => {
    if (state.start) return {rtmp: state.mediaServerState['clients']['rtmp'], 
      http: state.mediaServerState['clients']['http'], 
      ws: state.mediaServerState['clients']['ws']}
    else return {rtmp: 0, http: 0, ws: 0}
  }
}

export default {
  state,
  mutations,
  actions, 
  getters
}