<template>
  <div>
    <video ref="video" :height="height" :width="width"
      style="border: 1px solid black"></video><br/>
    <canvas ref="resCanvas" :height="height" :width="width"
      style="position: fixed; left: 0; top: 0"></canvas>
    <canvas ref="memCanvas" :height="224" :width="224"
      style="display: none"></canvas>
  </div>
</template>

<script>
import flv from "flv.js"
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex'

  export default {
    name: "VideoFlv",
    computed: {
      ...mapState({
        selectedApp: state => state.VideoStream.selectedApp,
        selectedStream: state => state.VideoStream.selectedStream,
        imageAnalysisServerConnected: state => state.ImageAnalysis.imageAnalysisServerConnected,
        imageAnalysisResult: state => state.ImageAnalysis.imageAnalysisResult,
        imageAnalysisStart: state => state.ImageAnalysis.start
      }),
      ...mapGetters(['selectedStreamName'])
    }, data() {
      return {
        player: null,
        playing: true,
        height: 0,
        width: 0,
        canvas: null,
        context: null,
        resCanvas: null,
        resContext: null,
        resImageData: null,
        timer: null,
        imageAnalysising: false,
        colorList: [],
        pixelMap: []
      }
    }, watch: {
      imageAnalysisResult: function(val, oldVal) {
        this.drawResult()
      }
    }, mounted() {
      // 根据窗口大小调整播放器大小
      this.changeVidoeSize()
      window.onresize = () => {
        this.changeVidoeSize()
      }
      // 监听播放日志
      flv.LoggingControl.addLogListener((type, str) => {
        if (type == "error") {
          this.$Message.error('连接失败')
          this.setVideoStreamStartState(false)
          this.setVideoStreamLoading(false)
        }
      })
      this.initColorList()
      this.initPixelMap()
      this.canvas = this.$refs['memCanvas']
      this.resCanvas = this.$refs['resCanvas']
      this.resContext = this.resCanvas.getContext('2d')
      this.resImageData = this.resContext.createImageData(this.width, this.height)
    }, methods: {
      ...mapMutations(['setVideoStreamStartState', 'setVideoStreamLoading',
        'setImageAnalysisServerStartState']),
      ...mapActions(['upload']),
      changeVidoeSize () {
        var maxh = window.innerHeight
        this.height = Math.floor(maxh)
        this.width = Math.floor(maxh / 16.0 * 9.0)
        if (this.resContext)
          setTimeout(() => {
            this.initPixelMap()
            this.resImageData = this.resContext.createImageData(this.width, this.height)
          }, 10)
        this.$emit("sizeChange", maxh / 16.0 * 9.0)
      }, play () {
        // 是否成功播放
        var flag = false
        // 结束现有播放
        if (this.player != null) {
          this.player.unload()
          this.player.detachMediaElement()
          this.player.destroy()
          this.player = null
        }
        // 判断是否有可播放资源
        if (!this.selectedApp || !this.selectedStream) {
          this.$Message.warning('当前没有可播放的资源')
          flag = false
        }
        else if (flv.isSupported()) {
          this.player = flv.createPlayer({
            type: 'flv', url: 'http://127.0.0.1:8000' + this.selectedStreamName + '.flv'
          })
          this.player.attachMediaElement(this.$refs["video"])
          this.player.load()
          this.player.play()
          flag = true
        }
        // 成功播放
        if (flag) {
          // 将视频同步绘制到画布并上传画布图像到服务器
          this.context = this.canvas.getContext('2d')
          this.timer = setInterval(() => {
            if (this.imageAnalysisStart && !this.imageAnalysising) {
              this.context.drawImage(this.$refs['video'], 0, 0, 
                this.canvas.width, this.canvas.height)
              this.uploadImage();
              this.imageAnalysising = true
            }
          }, 100)
          setTimeout(() => {
            this.setVideoStreamStartState(true)
            this.setVideoStreamLoading(false)
          }, 1000)
        // 播放失败
        } else {
          setTimeout(() => {
            this.setVideoStreamStartState(false)
            this.setVideoStreamLoading(false)
          }, 1000)
        }
      }, stop () {
        // 关闭分析
        this.setImageAnalysisServerStartState(false)
        // 结束视频同步绘制
        if (this.timer !== null) {
          clearInterval(this.timer)
          this.timer = null          
        }
        this.context = null
        if (this.player != null) {
          this.player.unload()
          this.player.detachMediaElement()
          this.player.destroy()
          this.player = null
        }
        this.setVideoStreamStartState(false)
        this.setVideoStreamLoading(false)
      }, initColorList () {
        for (var i = 0; i < 1000; i++) {
          var r = Math.floor(((i * 9301 + 49297) % 233280) / 233280.0 * 255)
          var g = Math.floor(((r * 9301 + 49297) % 233280) / 233280.0 * 255)
          var b = Math.floor(((g * 9301 + 49297) % 233280) / 233280.0 * 255)
          this.colorList.push({r,g,b})
        }
      }, initPixelMap () {
        this.pixelMap = []
        for (var i = 0; i < this.height; i++) {
          var row = []
          var y = Math.round(i * 223.0 / this.height)
          for (var j = 0; j < this.width; j++) {
            var x = Math.round(j * 223.0 / this.width)
            row.push({x,y})
          }
          this.pixelMap.push(row)
        }
      }, uploadImage () {
        var imageUrl = this.canvas.toDataURL('image/jpeg')
        var base64Str = imageUrl.substring(imageUrl.indexOf('base64,')+7)
        var byteStr = atob(base64Str)
        var n = byteStr.length
        var u8arr = new Uint8Array(n)
        while (n--) {
            u8arr[n] = byteStr.charCodeAt(n)
        }
        this.upload(u8arr)
      }, drawResult () {
        this.imageAnalysising = false
        var width = this.width
        var height = this.height
        if (this.imageAnalysisResult) {
          var index = 0
          if (this.imageAnalysisServerConnected && this.imageAnalysisResult[0] instanceof Array) {
            for (var i = 0; i < height; i++) {
              for (var j = 0; j < width; j++) {
                var x = this.pixelMap[i][j]['x']
                var y = this.pixelMap[i][j]['y']
                var type = Number(this.imageAnalysisResult[y][x][0])
                var r = this.colorList[type]['r']
                var g = this.colorList[type]['g']
                var b = this.colorList[type]['b']
                var a = type ? 200: 50
                this.resImageData.data[index] = r
                this.resImageData.data[index+1] = g
                this.resImageData.data[index+2] = b
                this.resImageData.data[index+3] = a
                index += 4
              }
            }
            this.resContext.putImageData(this.resImageData, 0, 0)
          }
        }
      }
    }
  }
</script>

<style scoped>

</style>