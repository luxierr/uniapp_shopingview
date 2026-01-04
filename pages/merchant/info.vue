<template>
  <view class="moments-container">
    <!-- 顶部导航 -->
    <view class="navbar">
      <text class="nav-title">店家动态</text>
    </view>

    <!-- 动态列表（直接显示，无需加载状态） -->
    <view class="moments-list">
      <!-- 第一条动态（带文字+多图） -->
      <view class="moment-item">
        <!-- 店家信息 -->
        <view class="moment-header">
          <image 
            class="avatar" 
            src="/static/avatar.png" 
            mode="widthFix"
          ></image>
          <view class="merchant-info">
            <text class="merchant-name">街角咖啡店</text>
            <text class="publish-time">{{ formatTime(1735689600000) }}</text>
          </view>
        </view>

        <!-- 文字内容 -->
        <view class="moment-content">
          <text>今日新品上市：季节限定樱花拿铁，欢迎到店品尝～</text>
        </view>

        <!-- 多图展示 -->
        <view class="media-container">
          <view 
            class="image-grid" 
            :style="{ gridTemplateColumns: `repeat(${getGridColumns(3)}, 1fr)` }"
          >
            <image 
              class="moment-image"
              src="https://img0.baidu.com/it/u=1234567890,1234567890&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500"
              mode="aspectFill"
              @click="previewImage('https://img0.baidu.com/it/u=1234567890,1234567890&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500', imageList)"
            ></image>
            <image 
              class="moment-image"
              src="https://img1.baidu.com/it/u=0987654321,0987654321&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500"
              mode="aspectFill"
              @click="previewImage('https://img1.baidu.com/it/u=0987654321,0987654321&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500', imageList)"
            ></image>
            <image 
              class="moment-image"
              src="https://img2.baidu.com/it/u=1122334455,1122334455&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500"
              mode="aspectFill"
              @click="previewImage('https://img2.baidu.com/it/u=1122334455,1122334455&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500', imageList)"
            ></image>
          </view>
        </view>
      </view>

      <!-- 第二条动态（带文字+视频） -->
      <view class="moment-item">
        <!-- 店家信息 -->
        <view class="moment-header">
          <image 
            class="avatar" 
            src="/static/avatar.png" 
            mode="widthFix"
          ></image>
          <view class="merchant-info">
            <text class="merchant-name">街角咖啡店</text>
            <text class="publish-time">{{ formatTime(1735516800000) }}</text>
          </view>
        </view>

        <!-- 文字内容 -->
        <view class="moment-content">
          <text>店内环境展示，舒适的休憩空间，快来打卡吧～</text>
        </view>

        <!-- 视频展示 -->
        <view class="media-container">
          <view>
            <video 
              class="moment-video"
              src="https://vd3.bdstatic.com/mda-ni63n8cv1f8m1f59/sc/mda-ni63n8cv1f8m1f59.mp4?v_from_s=hkapp-haokan-tucheng&auth_key=1735700000-0-0-8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d&bcevod_channel=searchbox_feed&pd=1&cr=2&cd=0&pt=3&logid=1234567890&vid=1234567890&klogid=1234567890"
              controls
              poster="https://img-cdn-qiniu.dcloud.net.cn/uniapp/images/uni@2x.png"
              :loop="false"
              :autoplay="false"
            ></video>
          </view>
        </view>
      </view>

      <!-- 第三条动态（仅文字） -->
      <view class="moment-item">
        <!-- 店家信息 -->
        <view class="moment-header">
          <image 
            class="avatar" 
            src="/static/avatar.png" 
            mode="widthFix"
          ></image>
          <view class="merchant-info">
            <text class="merchant-name">街角咖啡店</text>
            <text class="publish-time">{{ formatTime(1735430400000) }}</text>
          </view>
        </view>

        <!-- 仅文字内容 -->
        <view class="moment-content">
          <text>温馨提示：本周六店休一天，感谢各位顾客的理解与支持～</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      // 静态图片列表（用于预览）
      imageList: [
        "https://img0.baidu.com/it/u=1234567890,1234567890&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500",
        "https://img1.baidu.com/it/u=0987654321,0987654321&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500",
        "https://img2.baidu.com/it/u=1122334455,1122334455&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500"
      ]
    }
  },
  onLoad() {
    // 无需加载数据，直接显示静态样式
  },
  methods: {
    // 格式化时间（仿朋友圈风格）
    formatTime(timestamp) {
      const now = Date.now()
      const diff = (now - timestamp) / 1000
      if (diff < 60) return '刚刚'
      if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
      if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
      if (diff < 604800) return `${Math.floor(diff / 86400)}天前`
      
      const date = new Date(timestamp)
      return `${date.getMonth() + 1}月${date.getDate()}日`
    },

    // 根据图片数量计算网格列数
    getGridColumns(count) {
      if (count === 1) return 1
      if (count === 2 || count === 4) return 2
      return 3
    },

    // 预览图片
    previewImage(current, urls) {
      uni.previewImage({
        current,
        urls: urls.filter(url => url)
      })
    }
  }
}
</script>

<style scoped>
.moments-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.navbar {
  height: 44px;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #eee;
}

.nav-title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.moments-list {
  padding-bottom: 20rpx;
}

.moment-item {
  background-color: #fff;
  margin-bottom: 10rpx;
  padding: 20rpx 15rpx;
}

.moment-header {
  display: flex;
  align-items: center;
  margin-bottom: 15rpx;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 15rpx;
  /* 备用默认头像（如果/static/avatar.png不存在） */
  background-color: #eee;
}

.merchant-info {
  flex: 1;
}

.merchant-name {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.publish-time {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-top: 5rpx;
}

.moment-content {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  margin-bottom: 20rpx;
  padding: 0 5rpx;
}

.media-container {
  margin-bottom: 10rpx;
}

.image-grid {
  display: grid;
  gap: 8rpx;
}

.moment-image {
  width: 100%;
  background-color: #f1f1f1;
  border-radius: 4rpx;
}

/* 图片尺寸适配 */
.image-grid {
  & > image {
    height: 220rpx;
  }
  &[style*="repeat(1, 1fr)"] > image {
    height: 400rpx;
  }
}

.moment-video {
  width: 100%;
  height: 400rpx;
  background-color: #000;
  border-radius: 8rpx;
}

/* 移除分页加载相关样式（因为不需要分页） */
.loading-more {
  display: none;
}
</style>