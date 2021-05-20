<template>
  <div>
    <Card style="margin: 10px; background-color: #fff">
      <div slot="title">
        <Row>
          <i-col span="16"><Icon type="ios-film" /> 视频流预览</i-col>
          <i-col span="8" align="right" :style="{color: videoStreamStateColor}">
            {{ videoStreamState }}
          </i-col>
        </Row>
      </div>
      <Row style="margin-bottom: 10px">
        <i-col span="16">启动/停止预览</i-col>
        <i-col span="8" align="right">
          <i-switch @on-change="VideoStream" :value="videoStreamStart"
            :loading="videoStreamLoading"></i-switch>
        </i-col>
      </Row>
      <Divider/>
      <Row style="margin-bottom: 10px">视频信息</Row>
      <Row>
        <i-col span="12">帧大小</i-col>
        <i-col span="12" align="right">
          {{ selectedStream['frameSize'] }}
        </i-col>
      </Row>
      <Row>
        <i-col span="12">编码格式</i-col>
        <i-col span="12" align="right">
          {{ selectedStream['codec'] }}
        </i-col>
      </Row>
      <Row>
        <i-col span="12">级别</i-col>
        <i-col span="12" align="right">
          {{ selectedStream['level'] }}
        </i-col>
      </Row>
      <Divider/>
      <Row style="margin-bottom: 10px">发布者信息</Row>
      <Row>
        <i-col span="16">应用名称</i-col>
        <i-col span="8" align="right">
          {{ selectedStream['app'] }}
        </i-col>
      </Row>
      <Row>
        <i-col span="16">视频流</i-col>
        <i-col span="8" align="right">
          {{ selectedStream['stream'] }}
        </i-col>
      </Row>
      <Row>
        <i-col span="12">发布地址</i-col>
        <i-col span="12" align="right">
          {{ selectedStream['ip'] }}
        </i-col>
      </Row>
      <Row>
        <i-col span="12">总流量</i-col>
        <i-col span="12" align="right">
          {{ selectedStream['size'] }}
        </i-col>
      </Row>
      <Row>
        <i-col span="16">订阅数量</i-col>
        <i-col span="8" align="right">
          {{ selectedStream['subscriber'] }}
        </i-col>
      </Row>
      <Divider/>
      <Row>
        <Button @click="showModal = true">切换视频</Button>
      </Row>
    </Card>
    <Modal v-model="showModal" title="选择播放视频流" draggable footer-hide>
      <Table :columns="streamTitle" :data="streams">
        <template slot-scope="{ row }" slot="operate">
          <Button v-if="row['streamName'] !== selectedStreamName"
            @click="changeStream(row)">选择</Button>
          <div v-else>当前选择</div>
        </template>
      </Table>
    </Modal>
  </div>
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex'

  export default {
    name: '',
    computed: {
      ...mapState({
        selectedApp: state => state.VideoStream.selectedApp,
        selectedStream: state => state.VideoStream.selectedStream,
        videoStreamStart: state => state.VideoStream.start,
        videoStreamLoading: state => state.VideoStream.loading
      }),
      ...mapGetters(['streamTitle', 'streams', 'selectedStreamName', 'selectedStream']),
      videoStreamState: function () {
        if (this.videoStreamLoading) return '启动中'
        else if (this.videoStreamStart) return '正在运行'
        else return '未启动'
      },
      videoStreamStateColor: function () {
        if (this.videoStreamLoading) return 'orange'
        else if (this.videoStreamStart) return 'green'
        else return 'red'
      }
    }, data() {
      return {
        showModal: false,
        timer: null
      }
    }, methods: {
      ...mapActions(['updateVideoStreamState']),
      ...mapMutations(['setSelected', 'setVideoStreamLoading', 'setVideoStreamStartState']),
      changeStream (row) {
        this.setSelected({app: row['app'], stream: row['stream']})
        if (this.videoStreamStart) this.$emit('videoStream', 'stop')
      }, VideoStream(status) {
        this.setVideoStreamLoading(true)
        if (this.videoStreamStart && !status) this.$emit('videoStream', 'stop')
        else if (!this.videoStreamStart && status) {
          this.$emit('videoStream', 'start')
          this.setVideoStreamStartState(true)
        }
        else this.setVideoStreamLoading(false)
      }
    }, mounted () {
      this.timer = setInterval(this.updateVideoStreamState, 1000)
    }
  }
</script>

<style lang="" scoped>
.ivu-divider-horizontal {
  margin: 10px 0;
}
.ivu-row {
  padding: 5px 0;
  text-overflow: ellipsis;
}
</style>