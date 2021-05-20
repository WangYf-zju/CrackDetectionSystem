<template>
  <Card style="margin: 10px; background-color: #fff">
    <div slot="title">
      <Row>
        <i-col span="16"><Icon type="ios-laptop" /> 流媒体服务器</i-col>
        <i-col span="8" align="right" :style="{color: mediaServerStateColor}">
          {{ mediaServerState }}
        </i-col>
      </Row>
    </div>
    <Row>
      <i-col span="16">启动/停止服务</i-col>
      <i-col span="8" align="right">
        <i-switch :loading="mediaServerLoading" @on-change="MediaServer"
          :value="mediaServerStart"></i-switch>
      </i-col>
    </Row>
    <Divider/>
    <Row style="margin-bottom: 10px">服务端口</Row>
    <Row>
      <i-col span="18">RTMP服务 ({{ mediaServerConnectedNumber['rtmp'] }}个连接)</i-col>
      <i-col span="6" align="right">1935</i-col>
    </Row>
    <Row>
      <i-col span="18">HTTP服务 ({{ mediaServerConnectedNumber['http'] }}个连接)</i-col>
      <i-col span="6" align="right">8000</i-col>
    </Row>
    <Row>
      <i-col span="18">WebSocket ({{ mediaServerConnectedNumber['ws'] }}个连接)</i-col>
      <i-col span="6" align="right">8000</i-col>
    </Row>
    <Divider/>
    <Tabs size="small" align="center" style="height: 195px">
      <TabPane label="CPU">
        <i-circle :percent="mediaServerCPUPercent" dashboard>
          <span class="demo-circle-inner" style="font-size:24px">
            {{ mediaServerCPUPercent + '%' }}
          </span>
        </i-circle>
        <p :title="mediaServerCPUModel">{{ mediaServerCPUModel }}</p>
      </TabPane>
      <TabPane label="内存">
        <i-circle :percent="mediaServerMemoryPercent" dashboard>
          <span class="demo-circle-inner" style="font-size:24px">
            {{ mediaServerMemoryPercent + '%' }}
          </span>
        </i-circle>
        <p>{{ mediaServerMemoryUsage + ' / ' + mediaServerMemoryTotal + ' GB' }}</p>
      </TabPane>
      <TabPane label="网络">
        <i-circle :percent="mediaServerNetUsage > 100? 100: mediaServerNetUsage" dashboard>
          <span class="demo-circle-inner" style="font-size:24px">
            {{ mediaServerNetUsage + 'Mbps' }}
          </span>
        </i-circle>
        <p>接收 {{ mediaServerNetIn }} Mbps&nbsp;&nbsp;&nbsp;&nbsp;
          发送 {{ mediaServerNetOut }} Mbps</p>
      </TabPane>
    </Tabs>
    <Divider/>
    <Row>
      <Button @click="openMediaServerControlPanel">管理面板</Button>
    </Row>
  </Card>
</template>

<script>
import { mapState, mapMutations, mapActions, mapGetters } from 'vuex'

  export default {
    name: 'MediaServerPanel',
    computed: {
      ...mapState({
        mediaServerStart: state => state.MediaServer.start,
        mediaServerLoading: state => state.MediaServer.loading
      }),
      ...mapGetters(['mediaServerCPUPercent', 'mediaServerCPUModel', 
        'mediaServerMemoryPercent', 'mediaServerMemoryTotal', 'mediaServerMemoryUsage', 
        'mediaServerNetUsage', 'mediaServerNetIn', 'mediaServerNetOut', 
        'mediaServerConnectedNumber']),
      mediaServerState: function () {
        if (this.mediaServerLoading) return '启动中'
        else if (this.mediaServerStart) return '正在运行'
        else return '未启动'
      },
      mediaServerStateColor: function () {
        if (this.mediaServerLoading) return 'orange'
        else if (this.mediaServerStart) return 'green'
        else return 'red'
      }
    }, data() {
      return {
        timer: null
      }
    }, mounted() {
      this.updateMediaServerState()
      this.timer = setInterval(this.updateMediaServerState, 2000)
    }, methods: {
      ...mapActions(['updateMediaServerState', 'startMediaServer', 'stopMediaServer']),
      ...mapMutations(['openBrowser']),
      MediaServer(status) {
        if (!this.mediaServerStart && status) this.startMediaServer()
        else if (this.mediaServerStart && !status) this.stopMediaServer()
      }, openMediaServerControlPanel() {
        if (this.mediaServerStart) this.openBrowser('http://127.0.0.1:8000/admin')
        else this.$Message.warning('流媒体服务器未启动')
      }
    }
  }
</script>

<style lang="" scoped>
.ivu-divider-horizontal {
  margin: 10px 0;
}
.ivu-row {
  padding: 5px 0;
}
</style>