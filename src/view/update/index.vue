<template>
  <div class="update">
    <div id="checking" ref="checking" style="display: block">
      <p class="info">{{msg}}</p>
    </div>
    <div ref="downloadProgress" class="progress" v-if="downloadPercent>0">
      <label>正在下载，请耐心等待...</label>
      <el-progress :stroke-width="18" :percentage="downloadPercent"></el-progress>
    </div>
    <div id="checkUpload" ref="checkUpload" style="display: none">
      <p class="info">{{uploadMsg}}</p>
      <div v-if="versionShow" class="version">
        <p v-if="version">{{version}} 版本说明</p>
        <p v-if="releaseLog" v-html="releaseLog"></p>
      </div>
      <div class="button">
        <el-button type="primary" plain @click="upload">立即升级</el-button>
        <el-button type="info" plain @click="close">暂不升级</el-button>
      </div>
    </div>
    <div id="least" ref="least" style="display: none">
      <p class="info">当前已是最新版本</p>
      <div class="button">
        <el-button type="info" @click="close">我知道了</el-button>
      </div>
    </div>
  </div>
</template>

 <script>
import { defineComponent } from "@vue/runtime-core";
import axios from "axios";
const { ipcRenderer } = global.require("electron");

const Update = defineComponent({
  data() {
    return {
      msg: "正在检测版本，请稍后...",
      uploadMsg:"检测到新版本可用，是否立即升级？",
      releaseLog:"",
      version:"",
      downloadPercent: 0,
      versionShow:false
    };
  },
  mounted() {
    ipcRenderer.on("message", (event, { message, data }) => {
      if (message === "update-available") {
        this.$refs.checking.style.display = "none";
        this.$refs.checkUpload.style.display = "block";
        axios.get('http://127.0.0.1:8777/releaseLog').then(resp => {
          this.releaseLog = resp.data.desc
          this.version = resp.data.version
          this.versionShow = true
        })
      } else if (message === "update-not-available") {
        this.$refs.checking.style.display = "none";
        this.$refs.least.style.display = "block";
      } else if (message === "downloadProgress"){
<<<<<<< HEAD
        const progress = data.percent.toFixed(2) || 0;
        if (progress > this.downloadPercent){
          this.downloadPercent = progress
        }
=======
        this.downloadPercent = data.percent.toFixed(2) || 0;
>>>>>>> 85b4e57 (自动更新)
        this.$refs.checking.style.display = "none";
        this.$refs.checkUpload.style.display = "none";
      } else {
        this.msg = data;
      }
    });
  },
  methods: {
    upload() {
      ipcRenderer.send("updateNow");
    },
    close() {
<<<<<<< HEAD
      window.close()
=======
      ipcRenderer.send("close");
>>>>>>> 85b4e57 (自动更新)
    },
  },
  watch: {
    downloadPercent(nv,ov){
<<<<<<< HEAD
      if (nv == 100.00){
=======
      if (nv == 100){
>>>>>>> 85b4e57 (自动更新)
        this.uploadMsg = "新版程序已下载完毕，是否立即升级？"
        this.$refs.checking.style.display = "none";
        this.$refs.checkUpload.style.display = "block";
        this.versionShow = false
      }
    }
  }
});
export default Update;
</script>

<style rel="stylesheet/scss" lang="css" scoped>
@import "./main.css";
</style>