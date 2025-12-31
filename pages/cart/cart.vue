<template>
  <view class="cart-container">
    <!-- 空购物车提示 -->
    <view v-if="cartList.length === 0" class="empty-cart">
      <image src="/static/empty-cart.png" class="empty-img"></image>
      <text class="empty-text">购物车空空如也~</text>
      <button class="go-shop-btn" @click="goToShop">去逛逛</button>
    </view>

    <!-- 购物车列表 -->
    <scroll-view v-else class="cart-list" scroll-y>
      <view 
        class="cart-item" 
        v-for="(item, index) in cartList" 
        :key="item._id"
      >
        <!-- 商品有效性提示 -->
        <view v-if="!item.is_valid" class="invalid-tip">
          {{ item.invalid_reason }}
          <button class="del-btn" @click="handleDelete(item._id)">删除</button>
        </view>

        <!-- 正常商品项 -->
        <view v-else class="item-content">
          <!-- 选择框 -->
          <checkbox 
            class="checkbox" 
            :checked="item.is_selected" 
            @change="handleCheck(index)"
          ></checkbox>

          <!-- 商品图片 -->
          <image 
            class="goods-img" 
            :src="item.image[0] || '/static/default-goods.png'"
            mode="aspectFill"
          ></image>

          <!-- 商品信息 -->
          <view class="goods-info">
            <text class="goods-name">{{ item.product_name }}</text>
            <text class="goods-price">¥{{ item.price }}</text>
            <!-- 库存不足提示 -->
            <text v-if="item.stock_insufficient" class="stock-tip">库存不足</text>
          </view>

          <!-- 数量操作 -->
          <view class="count-op">
            <button 
              class="count-btn minus" 
              @click="handleChangeCount(index, 'minus')"
              :disabled="item.quantity <= 1"
            >-</button>
            <input 
              class="count-input" 
              type="number" 
              v-model="item.quantity"
              @blur="handleCountBlur(index)"
              min="1"
            >
            <button 
              class="count-btn plus" 
              @click="handleChangeCount(index, 'plus')"
              :disabled="item.quantity >= item.inventory"
            >+</button>
          </view>

          <!-- 删除按钮 -->
          <button class="del-btn" @click="handleDelete(item._id)">删除</button>
        </view>
      </view>
    </scroll-view>

    <!-- 底部结算栏 -->
    <view v-if="cartList.length > 0" class="bottom-bar">
      <!-- 全选 -->
      <checkbox 
        class="all-checkbox" 
        :checked="allChecked" 
        @change="handleAllCheck"
      ></checkbox>
      <text class="all-text">全选</text>

      <!-- 总价 -->
      <view class="total-price">
        <text class="total-label">合计：</text>
        <text class="price-num">¥{{ totalPrice.toFixed(2) }}</text>
      </view>

      <!-- 结算按钮 -->
      <button 
        class="pay-btn" 
        @click="handlePay"
        :disabled="selectedCount === 0"
      >
        结算 ({{ selectedCount }})
      </button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      cartList: [], // 购物车列表
      allChecked: false, // 是否全选
      totalPrice: 0, // 选中商品总价
      selectedCount: 0 // 选中商品数量
    };
  },
  onLoad() {
    // 页面加载时获取购物车数据
    this.getCartList();
  },
  onShow() {
    // 页面显示时重新获取（比如从商品页返回后更新）
    this.getCartList();
  },
  methods: {
    /**
     * 获取购物车列表
     */
    async getCartList() {
      try {
        const res = await uniCloud.callFunction({
          name: 'cart-operation',
          data: {
            action: 'getList'
          }
        });

        if (res.result.code === 0) {
          this.cartList = res.result.data;
          // 初始化选中状态和计算总价
          this.checkAllStatus();
          this.calcTotalPrice();
        } else {
          uni.showToast({
            title: res.result.msg,
            icon: 'none'
          });
        }
      } catch (err) {
        uni.showToast({
          title: '获取购物车失败',
          icon: 'none'
        });
        console.error('获取购物车失败：', err);
      }
    },

    /**
     * 单个商品选中/取消选中
     * @param {Number} index 商品索引
     */
    handleCheck(index) {
      this.cartList[index].is_selected = !this.cartList[index].is_selected;
      // 更新全选状态和总价
      this.checkAllStatus();
      this.calcTotalPrice();
      // 同步选中状态到云端（可选，根据需求添加）
      this.updateCartItemStatus(this.cartList[index]._id, this.cartList[index].is_selected);
    },

    /**
     * 全选/取消全选
     */
    handleAllCheck() {
      this.allChecked = !this.allChecked;
      // 批量修改选中状态
      this.cartList.forEach(item => {
        if (item.is_valid) { // 仅有效商品参与全选
          item.is_selected = this.allChecked;
          // 同步到云端（可选）
          this.updateCartItemStatus(item._id, this.allChecked);
        }
      });
      // 重新计算总价
      this.calcTotalPrice();
    },

    /**
     * 检查全选状态
     */
    checkAllStatus() {
      // 过滤有效商品
      const validItems = this.cartList.filter(item => item.is_valid);
      if (validItems.length === 0) {
        this.allChecked = false;
        return;
      }
      // 判断是否所有有效商品都被选中
      this.allChecked = validItems.every(item => item.is_selected);
    },

    /**
     * 计算选中商品总价和数量
     */
    calcTotalPrice() {
      let total = 0;
      let count = 0;
      this.cartList.forEach(item => {
        if (item.is_selected && item.is_valid) {
          total += item.price * item.quantity;
          count += item.quantity;
        }
      });
      this.totalPrice = total;
      this.selectedCount = count;
    },

    /**
     * 修改商品数量
     * @param {Number} index 商品索引
     * @param {String} type 操作类型：minus/plus
     */
    async handleChangeCount(index, type) {
      const item = this.cartList[index];
      let newCount = item.quantity;

      // 计算新数量
      if (type === 'minus') {
        newCount = Math.max(1, newCount - 1);
      } else if (type === 'plus') {
        // 校验库存
        if (newCount >= item.inventory) {
          uni.showToast({
            title: '库存不足',
            icon: 'none'
          });
          return;
        }
        newCount = Math.min(item.inventory, newCount + 1);
      }

      // 同步到云端
      try {
        const res = await uniCloud.callFunction({
          name: 'cart-operation',
          data: {
            action: 'updateCount', // 需在云函数中添加updateCount方法
            params: {
              cartItemId: item._id,
              quantity: newCount
            }
          }
        });

        if (res.result.code === 0) {
          item.quantity = newCount;
          this.calcTotalPrice(); // 重新计算总价
        } else {
          uni.showToast({
            title: res.result.msg,
            icon: 'none'
          });
        }
      } catch (err) {
        uni.showToast({
          title: '修改数量失败',
          icon: 'none'
        });
        console.error('修改数量失败：', err);
      }
    },

    /**
     * 数量输入框失去焦点时校验
     * @param {Number} index 商品索引
     */
    handleCountBlur(index) {
      const item = this.cartList[index];
      // 校验数量为正整数，且不超过库存
      let newCount = parseInt(item.quantity) || 1;
      newCount = Math.max(1, Math.min(item.inventory, newCount));
      // 如果数量有变化，同步到云端
      if (newCount !== item.quantity) {
        this.handleChangeCount(index, 'manual'); // 手动修改
      }
    },

    /**
     * 删除购物车商品
     * @param {String} cartItemId 购物车项ID
     */
    async handleDelete(cartItemId) {
      uni.showModal({
        title: '提示',
        content: '确定要删除该商品吗？',
        async success(res) {
          if (res.confirm) {
            try {
              const res = await uniCloud.callFunction({
                name: 'cart-operation',
                data: {
                  action: 'delete', // 需在云函数中添加delete方法
                  params: {
                    cartItemId: cartItemId
                  }
                }
              });

              if (res.result.code === 0) {
                // 重新获取购物车列表
                this.getCartList();
                uni.showToast({
                  title: '删除成功'
                });
              } else {
                uni.showToast({
                  title: res.result.msg,
                  icon: 'none'
                });
              }
            } catch (err) {
              uni.showToast({
                title: '删除失败',
                icon: 'none'
              });
              console.error('删除失败：', err);
            }
          }
        }
      });
    },

    /**
     * 同步选中状态到云端（可选）
     * @param {String} cartItemId 购物车项ID
     * @param {Boolean} isSelected 是否选中
     */
    async updateCartItemStatus(cartItemId, isSelected) {
      try {
        await uniCloud.callFunction({
          name: 'cart-operation',
          data: {
            action: 'updateStatus', // 需在云函数中添加updateStatus方法
            params: {
              cartItemId: cartItemId,
              is_selected: isSelected
            }
          }
        });
      } catch (err) {
        console.error('更新选中状态失败：', err);
      }
    },

    /**
     * 结算（跳转到订单确认页）
     */
    handlePay() {
      if (this.selectedCount === 0) {
        uni.showToast({
          title: '请选择要结算的商品',
          icon: 'none'
        });
        return;
      }
      // 获取选中的商品列表
      const selectedItems = this.cartList.filter(item => item.is_selected && item.is_valid);
      // 跳转到订单确认页（传递选中商品数据）
      uni.navigateTo({
        url: `/pages/order/confirm?items=${JSON.stringify(selectedItems)}`
      });
    },

    /**
     * 去逛逛（空购物车时）
     */
    goToShop() {
      uni.switchTab({
        url: '/pages/index/index' // 跳转到商品列表页，根据你的路由调整
      });
    }
  }
};
</script>

<style scoped>
/* 整体容器 */
.cart-container {
  padding-bottom: 100rpx;
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 空购物车 */
.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 200rpx;
}
.empty-img {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 30rpx;
}
.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 50rpx;
}
.go-shop-btn {
  background-color: #007aff;
  color: #fff;
  border-radius: 50rpx;
  padding: 20rpx 60rpx;
  font-size: 28rpx;
}

/* 购物车列表 */
.cart-list {
  height: calc(100vh - 100rpx);
}
.cart-item {
  background-color: #fff;
  margin-bottom: 10rpx;
}
/* 无效商品提示 */
.invalid-tip {
  padding: 20rpx;
  font-size: 26rpx;
  color: #ff3b30;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
/* 正常商品项 */
.item-content {
  display: flex;
  align-items: center;
  padding: 20rpx;
}
.checkbox {
  width: 40rpx;
  height: 40rpx;
  margin-right: 20rpx;
}
.goods-img {
  width: 120rpx;
  height: 120rpx;
  border-radius: 10rpx;
  margin-right: 20rpx;
}
.goods-info {
  flex: 1;
}
.goods-name {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 10rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.goods-price {
  font-size: 28rpx;
  color: #ff3b30;
  font-weight: bold;
}
.stock-tip {
  display: block;
  font-size: 24rpx;
  color: #ff3b30;
  margin-top: 10rpx;
}
/* 数量操作 */
.count-op {
  display: flex;
  align-items: center;
  margin-right: 20rpx;
}
.count-btn {
  width: 60rpx;
  height: 60rpx;
  line-height: 60rpx;
  text-align: center;
  border: 1px solid #eee;
  background-color: #f5f5f5;
  font-size: 32rpx;
}
.count-btn:disabled {
  color: #999;
  background-color: #eee;
}
.count-input {
  width: 80rpx;
  height: 60rpx;
  line-height: 60rpx;
  text-align: center;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  font-size: 28rpx;
}
/* 删除按钮 */
.del-btn {
  font-size: 24rpx;
  color: #999;
  background: transparent;
  border: none;
}

/* 底部结算栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background-color: #fff;
  display: flex;
  align-items: center;
  padding: 0 20rpx;
  box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.1);
}
.all-checkbox {
  width: 40rpx;
  height: 40rpx;
  margin-right: 10rpx;
}
.all-text {
  font-size: 28rpx;
  color: #333;
  margin-right: 20rpx;
}
.total-price {
  flex: 1;
  text-align: right;
  margin-right: 20rpx;
}
.total-label {
  font-size: 28rpx;
  color: #333;
}
.price-num {
  font-size: 32rpx;
  color: #ff3b30;
  font-weight: bold;
}
.pay-btn {
  width: 200rpx;
  height: 80rpx;
  line-height: 80rpx;
  background-color: #ff3b30;
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
}
.pay-btn:disabled {
  background-color: #ccc;
}
</style>