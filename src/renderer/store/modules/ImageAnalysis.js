const { net } = require('electron').remote

const state = {
  start: false,
  loading: false,
  imageAnalysisServerAddress: null,
  modelName: null,
  modelList: [],
  imageAnalysisServerState: [],
  imageAnalysisServerConnected: false,
  imageAnalysisServerConnecting: false,
  imageAnalysisResult: null
}

const mutations = {
  setImageAnalysisServerStartState (state, start) {
    state.start = start
  }, setImageAnalysisLoading (state, loading) {
    state.loading = loading
  }, setImageAnalysisServerState (state, s) {
    state.imageAnalysisServerState = s
  }, setModelList (state, l) {
    state.modelList = l
  }, setImageAnalysisServerAddress (state, address) {
    state.imageAnalysisServerAddress = address
  }, setImageAnalysisServerConnected (state, connected) {
    state.imageAnalysisServerConnected = connected
    state.imageAnalysisServerConnecting = false
  }, setImageAnalysisServerConnecting (state, connecting) {
    state.imageAnalysisServerConnecting = connecting
  }, setImageAnalysisModelName (state, name) {
    state.modelName = name
  }, setImageAnalysisResult (state, result) {
    state.imageAnalysisResult = result
  }
}

const actions = {
  updateImageAnalysisState ({ commit, state }) {
    if (state.imageAnalysisServerAddress && state.modelName) {
      var url = 'http://' + state.imageAnalysisServerAddress + 
        ':8081/models/' + state.modelName
      var request = net.request(url)
      request.on('response', (response) => {
        response.on('data', (chunk) => {
          var s = JSON.parse(`${chunk}`)
          commit('setImageAnalysisServerState', s)
        })
      })
      request.on('error', (err) => {
        commit('setImageAnalysisServerState', {})
      })
      request.end()
    } else {
      commit('setImageAnalysisServerState', {})
    }
  }, updateModelList ({ commit, state }) {
    if (state.imageAnalysisServerAddress) {
      commit('setImageAnalysisServerConnecting', true)
      var url = "http://" +state.imageAnalysisServerAddress + ':8081/models/'
      var request = net.request(url)
      request.on('response', (response) => {
        response.on('data', (chunk) => {
          var s = JSON.parse(`${chunk}`)
          commit('setModelList', s['models'])
          commit('setImageAnalysisServerConnected', true)
        })      
      })
      request.on('error', (err) => {
        commit('setModelList', [])
        commit('setImageAnalysisServerConnected', false)
      })
      request.end()
    } else {
      commit('setModelList', [])
      commit('setImageAnalysisServerConnected', false)
    }
  }, upload ({ commit, state }, data) {
    if (state.imageAnalysisServerConnected) {
      if (state.imageAnalysisServerAddress && state.modelName) {
        var options = {
          method: 'POST',
          protocol: 'http:',
          hostname: state.imageAnalysisServerAddress,
          port: 8080,
          path: '/predictions/' + state.modelName
        }
        var request = net.request(options)
        var res = ""
        request.on('response', (response) => {
          // 结果数据是分批返回的
          response.on('data', (chunk) => {
            res += `${chunk}`
          })
          response.on('end', () => {
            res = JSON.parse(res)
            commit('setImageAnalysisResult', res)
          })
        })
        request.on('error', (err) => {
          
        })
        request.write(data)
        request.end()
      }
    }
  }
}

const getters = {
  imageAnalysisServerUsage: state => {
    if (state.imageAnalysisServerState &&
      state.imageAnalysisServerState[0] && state.imageAnalysisServerState[0].workers &&
      state.imageAnalysisServerState[0].workers.length > 0) {
        var gpuUsage = state.imageAnalysisServerState[0].workers[0]['gpuUsage']
        var s = gpuUsage.split('[%]::')
        if (s[1] && s[2]) {
          var gpuPercent = Number(s[1].split('%')[0])
          var memPercent = Number(s[2].split('%')[0])
          return {gpuPercent, memPercent}          
        }
    }
    return {gpuPercent: 0, memPercent: 0}
  }, imageAnalysisServerAddress: state => {
    if (state.imageAnalysisServerConnected) {
      return state.imageAnalysisServerAddress
    } else return ''
  }
}

export default {
  state,
  mutations,
  actions,
  getters
}