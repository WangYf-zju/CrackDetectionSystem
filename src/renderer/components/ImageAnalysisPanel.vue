<template>
  <div>
    <Card style="margin: 10px; background-color: #fff">
      <div slot="title">
        <Row>
            <i-col span="16"><Icon type="ios-analytics" /> 裂纹检测</i-col>
            <i-col span="8" align="right" :style="{color: imageAnalysisStart? 'green': 'red'}">
              {{imageAnalysisStart? '正在运行': '未启动'}}
            </i-col>
          </Row>
      </div>
      <Row style="margin-bottom: 10px">
        <i-col span="16">连接/断开连接</i-col>
        <i-col span="8" align="right">
          <i-switch @on-change="ImageAnalysis" v-model="imageAnalysisStart"></i-switch>
        </i-col>
      </Row>
      <Divider/>
      <Row style="margin-bottom: 10px">服务器信息</Row>
      <Row>
        <i-col span="8">地址</i-col>
        <i-col span="16" align="right">
          {{ imageAnalysisServerAddress }}
        </i-col>
      </Row>
      <Row>
        <i-col span="16">模型预测端口</i-col>
        <i-col span="8" align="right">
          {{ imageAnalysisServerConnected? '8080': '' }}
        </i-col>
      </Row>
      <Row>
        <i-col span="16">服务管理端口</i-col>
        <i-col span="8" align="right">
          {{ imageAnalysisServerConnected? '8081': '' }}
        </i-col>
      </Row>
      <Divider/>
      <div style="height: 195px">
        <Row style="margin-bottom: 10px">服务器资源</Row>
        <Row>
          <i-col span="8">GPU</i-col>
          <i-col span="16">
            <Progress :percent='imageAnalysisServerUsage.gpuPercent'/>
          </i-col>
        </Row>
        <Row>
          <i-col span="8">内存</i-col>
          <i-col span="16">
            <Progress :percent='imageAnalysisServerUsage.memPercent'/>
          </i-col>
        </Row>
      </div>
      <!-- <Tabs size="small" align="center" style="height: 195px">
        <TabPane label="GPU">
          <i-circle :percent="80" dashboard>
            <span class="demo-circle-inner" style="font-size:24px">80%</span>
          </i-circle>
        </TabPane>
        <TabPane label="内存">
          <i-circle :percent="80" dashboard>
            <span class="demo-circle-inner" style="font-size:24px">80%</span>
          </i-circle>
        </TabPane>
      </Tabs> -->
      <Divider/>
      <Row>
        <Button @click="showModal=true">服务设置</Button>
      </Row>
    </Card>
    <Modal v-model="showModal" title="图像服务器设置" draggable footer-hide>
      <Row>
        <i-col span="6">服务器地址</i-col>
        <i-col span="18">
          <Input @on-blur="updateImageAnalysisServer" v-model="address">
            <div slot="prepend">http://</div>
            <div slot="append">
              <Icon v-if="imageAnalysisServerConnecting" type="ios-loading" 
                size=18 class="demo-spin-icon-load"></Icon>
              <Icon v-else size=18 :color="imageAnalysisServerConnected? 'green': 'red'"
                :type="imageAnalysisServerConnected? 'ios-checkmark': 'ios-close'"></Icon>
            </div>
          </Input>
        </i-col>
      </Row>
      <!-- <Row>
        <i-col span="6">模型预测端口</i-col>
        <i-col span="5"><Input type="number"></Input></i-col>
        <i-col span="6" offset="2">服务管理端口</i-col>
        <i-col span="5"><Input type="number"></Input></i-col>
      </Row> -->
      <Row>
        <i-col span="6">图像预测模型</i-col>
        <i-col span="18">
          <Select @on-change="selectModel">
            <Option v-for="item in modelList" :key="item['modelName']"
              :value="item['modelName']">{{ item['modelName'] }}</Option>
          </Select>
        </i-col>
      </Row>
    </Modal>
  </div>
</template>

<script>
import { mapState, mapActions, mapMutations, mapGetters } from 'vuex'

  export default {
    name: 'ImageAnalysis',
    computed: {
      ...mapState({
        modelList: state => state.ImageAnalysis.modelList,
        start: state => state.ImageAnalysis.start,
        imageAnalysisServerConnected: state => state.ImageAnalysis.imageAnalysisServerConnected,
        imageAnalysisServerConnecting: state => state.ImageAnalysis.imageAnalysisServerConnecting,
        videoStreamStart: state => state.VideoStream.start,
      }), ...mapGetters(['imageAnalysisServerUsage', 'imageAnalysisServerAddress'])
    }, data() {
      return {
        showModal: false,
        address: '',
        imageAnalysisStart: false,
        timer: null
      }
    }, watch: {
      start: function(val, oldVal) {
        if (val == false) {
          clearInterval(this.timer)
          this.timer = null
        }
      }
    }, methods: {
      ...mapActions(['updateModelList', 'updateImageAnalysisState']),
      ...mapMutations(['setImageAnalysisServerAddress',
        'setImageAnalysisModelName', 'setImageAnalysisServerStartState']),
      updateImageAnalysisServer () {
        this.setImageAnalysisServerAddress(this.address)
        this.updateModelList()
      }, selectModel (value) {
        if (value) {
          this.setImageAnalysisModelName(value)
          if (this.timer == null) {
            this.timer = setInterval(() => {
              this.updateImageAnalysisState()
            }, 1000) 
          }
        }
      }, ImageAnalysis (status) {
        if (status) {
          if (this.imageAnalysisServerConnected && this.videoStreamStart) {
            this.setImageAnalysisServerStartState(true)
            if (this.timer == null) {
              this.timer = setInterval(() => {
                this.updateImageAnalysisState()
              }, 1000) 
            }
          } else if (!this.imageAnalysisServerConnected) {
            this.$Message.warning('服务器未连接')
            setTimeout(() => {
              this.imageAnalysisStart = false
            }, 50)
          } else {
            this.$Message.warning('没有视频预览')
            setTimeout(() => {
              this.imageAnalysisStart = false
            }, 50)
          }
        } else {
          this.setImageAnalysisServerStartState(false)
        }
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
.demo-spin-icon-load{
  animation: ani-demo-spin 1s linear infinite;
}
</style>