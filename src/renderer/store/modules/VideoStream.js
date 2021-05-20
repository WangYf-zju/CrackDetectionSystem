const { net } = require('electron').remote

const state = {
  start: false,
  loading: false,
  serverConnected: false,
  selectedApp: null,
  selectedStream: null,
  videoStreamState: {}
}

const mutations = {
  setVideoStreamState (state, s) {
    state.videoStreamState = s
  }, setserverConnected(state, connected) {
    state.serverConnected = connected
  }, setSelected(state, s) {
    state.selectedApp = s['app']
    state.selectedStream = s['stream']
  }, setVideoStreamStartState(state, start) {
    state.start = start
  }, setVideoStreamLoading(state, loading) {
    state.loading = loading
  }
}

const actions = {
  updateVideoStreamState({ commit, state }) {
    var request = net.request('http://127.0.0.1:8000/api/streams')
    request.on('response', (response) => {
      response.on('data', (chunk) => {
        var s = JSON.parse(`${chunk}`)
        commit('setVideoStreamState', s)
        commit('setserverConnected', true)
        for (let app in state.videoStreamState) {
          for (let stream in state.videoStreamState[app]) {
            if (state.videoStreamState[app][stream]['publisher'] !== null) {
              if (state.selectedApp === null || state.selectedStream === null) {
                commit('setSelected', {app, stream})
              }
              return
            }
          }
        }
        commit('setSelected', {app: null, stream: null})
      })
    })
    request.on('error', (err) => {
      commit('setVideoStreamState', {})
      commit('setserverConnected', false)
      commit('setSelected', {app: null, stream: null})
    })
    request.end()
  }
}

const getters = {
  selectedStream: state => {
    if (state.serverConnected) {
      for (let app in state.videoStreamState) {
        if (app === state.selectedApp) {
          for (let stream in state.videoStreamState[app]) {
            if (stream === state.selectedStream) {
              var publisher = state.videoStreamState[app][stream]['publisher']
              if (publisher === null || publisher['video'] === null) return {
                width: '', height: '', codec: '', level: '', 
                  ip: '', size: '', app: '', stream: '', subscriber: ''
              }
              var video = publisher['video']
              var width = video['width']
              var height = video['height']
              var frameSize = width + '×' + height
              var codec = video['codec']
              var level = video['profile']+'@'+video['level']
              var ip = publisher['ip']
              var size = ''
              var bytes = Number(publisher['bytes'])
              if (bytes < 1000) size = bytes.toFixed(1) + ' B'
              else if (bytes < 1024000) size = (bytes/1024).toFixed(1) + ' Kb'
              else if (bytes < 1048576000) size = (bytes/1048576).toFixed(1) + ' Mb'
              else size = (bytes/1073741824).toFixed(1) + ' Gb'
              var subscriber = state.videoStreamState[app][stream]['subscribers'].length
              return {frameSize, codec, level, ip, size, app, stream, subscriber}
            }
          }
        }
      }
    }
    return {
      frameSize: '', codec: '', level: '', 
        ip: '', size: '', app: '', stream: '', subscriber: ''
    }
  }, streamTitle: state => {
    return [
      {title: '视频流', key: 'streamName'},
      {title: '发布者', key: 'ip'},
      {title: '操作', slot: 'operate', width: 100}
    ]
  }, streams: state => {
    if (state.serverConnected) {
      var streamArray = []
      for (let app in state.videoStreamState) {
        for (let stream in state.videoStreamState[app]) {
          if (state.videoStreamState[app][stream]['publisher'] === null) continue
          var streamName = '/' + app + '/' + stream
          var ip = state.videoStreamState[app][stream]['publisher']['ip']
          streamArray.push({app, stream, streamName, ip})
        }
      }
      return streamArray
    } else return []
  }, selectedStreamName: state => {
    return '/' + state.selectedApp + '/' + state.selectedStream
  }
}

export default {
  state, 
  mutations,
  actions,
  getters
}