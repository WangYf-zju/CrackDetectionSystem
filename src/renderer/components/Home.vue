<template>
  <div>
    <div :style="{position: 'fixed', left: 0, top: 0, bottom: 0, width: videoWidth,
      'background-color': '#ccc', 'z-index': 500}">
      <video-flv ref="video" @sizeChange="setVideoWidth"></video-flv>
    </div>
    <div :style="{'margin-left': videoWidth}">
      <Layout style="background-color: white">
        <Header :style="{position: 'fixed', left: videoWidth, top: 0, color: '#666',
          hegith: '6vh', right: 0, 'background-color': '#fff', 'z-index': 1000,
          '-webkit-app-region': 'drag'}">
          <Row>
            <i-col span="12"><h2>裂纹检测系统</h2></i-col>
            <i-col span="12" align="right">
              <div class="icon-head">
                <Button icon="md-remove" type="text" @click="minimizeWindow"
                  id="btn-min" style="min-width: 40px"></Button>
              </div>
              <div class="icon-head">
                <Button icon="md-square-outline" type="text" @click="maximizeWindow"
                  id="btn-max" style="min-width: 40px"></Button>                
              </div>
              <div class="icon-close">
                <Button icon="md-close" type="text" @click="closeWindow" id="btn-close"
                  style="min-width: 40px"></Button>                
              </div>              
            </i-col>
          </Row>
        </Header>
        <Content :style="{background: '#fee', 'margin-top': '8vh', padding: '20px',
          height: '92vh', 'overflow-y': 'auto'}">
          <Row style="min-width: 800px">
            <i-col span="8">
              <media-server-panel></media-server-panel>
            </i-col>
            <i-col span="8">
              <video-stream-panel @videoStream="videoStream"></video-stream-panel>
            </i-col>
            <i-col span="8">
              <image-analysis-panel></image-analysis-panel>
            </i-col>
          </Row>          
        </Content>
      </Layout>
    </div>
  </div>
</template>

<script>
import VideoFlv from './VideoFlv.vue'
import MediaServerPanel from './MediaServerPanel.vue'
import VideoStreamPanel from './VideoStreamPanel.vue'
import { ipcRenderer } from 'electron'
import ImageAnalysisPanel from './ImageAnalysisPanel.vue'

  export default {
    name: 'Home',
    components: {
      VideoFlv, 
      MediaServerPanel,
      VideoStreamPanel,
      ImageAnalysisPanel
    }, data() {
      return {
        player: null,
        playing: false,
        videoWidth: 0
      }
    }, methods: {
      setVideoWidth (width) {
        this.videoWidth = width + "px"
      }, videoStream (mode) {
        if (mode === 'start') this.$refs['video'].play()
        else if (mode === 'stop') this.$refs['video'].stop()
      }, minimizeWindow () {
        document.getElementById('btn-min').blur()
        ipcRenderer.send('min')
      }, maximizeWindow () {
        document.getElementById('btn-max').blur()
        ipcRenderer.send('max')
      }, closeWindow () {
        document.getElementById('btn-close').blur()
        ipcRenderer.send('close')
      }
    }, mounted () {
      document.getElementById('btn-min').blur()
      document.getElementById('btn-max').blur()
      document.getElementById('btn-close').blur()
    }

  }
</script>

<style scoped>
.icon-close {
  display: inline-block;
  -webkit-app-region: no-drag;
}
.icon-close :hover {
  background: #dc143c;
  color: #ffffff;
}
.icon-head {
  display: inline-block;
  -webkit-app-region: no-drag;
}
.icon-head :hover {
  background: #d3d3d3;
  color: #515a6e;
}
.ivu-layout-header {
  padding: 0px 20px 0px 50px;
}
</style>