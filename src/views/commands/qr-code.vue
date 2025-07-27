<!--二维码生成器-->
<template>
  <h2 class="m-y-20px">二维码生成器</h2>
  <el-form label-position="left" label-width="100px">
    <el-form-item label="文本内容：">
      <el-input type="textarea" v-model="text" 
                placeholder="请输入要生成二维码的文本内容"
                :autosize="{ minRows: 4, maxRows: 8 }"></el-input>
    </el-form-item>
    
    <el-form-item label="二维码设置：">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="尺寸：" label-width="50px">
            <el-select v-model="size" placeholder="选择尺寸" class="w-100px">
              <el-option label="128x128" :value="128"></el-option>
              <el-option label="256x256" :value="256"></el-option>
              <el-option label="512x512" :value="512"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="容错级别：" label-width="70px">
            <el-select v-model="errorCorrectionLevel" placeholder="选择容错级别" class="w-100px">
              <el-option label="低" value="L"></el-option>
              <el-option label="中" value="M"></el-option>
              <el-option label="高" value="H"></el-option>
              <el-option label="最高" value="Q"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="边距：" label-width="50px">
            <el-input-number v-model="margin" :min="0" :max="10" class="w-100px"></el-input-number>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form-item>
    
    <el-form-item label="二维码预览：">
      <div class="qr-preview-container">
        <div v-if="qrCodeDataUrl" class="qr-preview">
          <img :src="qrCodeDataUrl" :alt="text" class="qr-image" />
        </div>
        <div v-else class="qr-placeholder" style="width: 100%">
          <el-icon class="qr-placeholder-icon"><Picture /></el-icon>
        </div>
      </div>
    </el-form-item>
  </el-form>
  
  <div class="m-y-20px flex items-center justify-end">
    <el-button @click="clear">清 空</el-button>
    <el-button type="primary" @click="generateResult" :disabled="!text.trim()">生 成</el-button>
    <el-button @click="downloadQR" :disabled="!qrCodeDataUrl">下载二维码</el-button>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import QRCode from 'qrcode'

const text = ref('')
const qrCodeDataUrl = ref('')
const size = ref(256)
const errorCorrectionLevel = ref('M')
const margin = ref(4)

const generateResult = async () => {
  if (!text.value || text.value.trim() === '') {
    ElMessage.info('请输入要生成二维码的文本内容')
    return
  }
  
  try {
    const options: QRCode.QRCodeToDataURLOptions = {
      width: size.value,
      margin: margin.value,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: errorCorrectionLevel.value as QRCode.QRCodeErrorCorrectionLevel
    }
    
    const dataUrl = await QRCode.toDataURL(text.value, options)
    qrCodeDataUrl.value = dataUrl
    ElMessage.success('二维码生成成功')
  } catch (error) {
    console.error('生成二维码失败:', error)
    ElMessage.error('生成二维码失败，请检查输入内容')
  }
}

const downloadQR = () => {
  if (!qrCodeDataUrl.value) {
    ElMessage.info('请先生成二维码')
    return
  }
  
  try {
    const link = document.createElement('a')
    link.download = `qrcode-${Date.now()}.png`
    link.href = qrCodeDataUrl.value
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    ElMessage.success('二维码下载成功')
  } catch (error) {
    console.error('下载二维码失败:', error)
    ElMessage.error('下载二维码失败')
  }
}

const clear = () => {
  text.value = ''
  qrCodeDataUrl.value = ''
  ElMessage.info('已清空')
}

// 监听文本变化，自动生成二维码
watch(text, (newText) => {
  if (newText && newText.trim()) {
    // 防抖处理，避免频繁生成
    clearTimeout((window as any).qrTimer)
    ;(window as any).qrTimer = setTimeout(() => {
      generateResult()
    }, 500)
  } else {
    qrCodeDataUrl.value = ''
  }
})

// 监听设置变化，重新生成二维码
watch([size, errorCorrectionLevel, margin], () => {
  if (text.value && text.value.trim()) {
    generateResult()
  }
})
</script>

<style scoped>
.qr-preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  background-color: #fafafa;
}

.qr-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.qr-image {
  max-width: 100%;
  max-height: 280px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.qr-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #999;
}

.qr-placeholder-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #d9d9d9;
}

.qr-placeholder p {
  margin: 0;
  font-size: 14px;
}

.w-100px {
  width: 100px;
}
</style>
