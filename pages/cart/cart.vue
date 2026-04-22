<template>
	<view class="cart-container">
		<!-- 顶部标题栏 -->
		<view class="cart-header">
			<text class="header-title">购物车</text>
			<text class="header-action" v-if="cartList.length > 0" @click="toggleEdit">{{ isEdit ? '完成' : '管理' }}</text>
		</view>

		<!-- 空状态 -->
		<view class="empty-cart" v-if="cartList.length === 0">
			<image class="empty-img" src="/static/logo.png" mode="aspectFit"></image>
			<text class="empty-title">购物车空空如也</text>
			<text class="empty-desc">快去挑选心仪的商品吧</text>
			<view class="empty-btn" @click="goShopping">去逛逛</view>
		</view>

		<!-- 商品列表 -->
		<scroll-view v-else scroll-y class="cart-scroll">
			<view class="cart-list">
				<view class="cart-item" v-for="(item, index) in cartList" :key="item._id">
					<!-- 选择框 -->
					<view class="item-check" @click="toggleCheck(index)">
						<view class="check-circle" :class="{ checked: item.checked }">
							<uni-icons v-if="item.checked" type="checkmarkempty" size="14" color="#fff"></uni-icons>
						</view>
					</view>
					<!-- 商品图 -->
					<image class="item-img" :src="item.image" mode="aspectFill" @click="goDetail(item)"></image>
					<!-- 商品信息 -->
					<view class="item-info">
						<text class="item-name" @click="goDetail(item)">{{ item.name }}</text>
						<text class="item-spec" v-if="item.spec">规格：{{ item.spec }}</text>
						<view class="item-bottom">
							<view class="item-price">
								<text class="price-symbol">¥</text>
								<text class="price-num">{{ item.price }}</text>
							</view>
							<view class="quantity-box" v-if="!isEdit">
								<view class="qty-btn" @click="changeQty(index, -1)">-</view>
								<text class="qty-num">{{ item.quantity }}</text>
								<view class="qty-btn" @click="changeQty(index, 1)">+</view>
							</view>
						</view>
					</view>
					<!-- 编辑时显示删除 -->
					<view class="item-delete" v-if="isEdit" @click="deleteItem(index)">
						<uni-icons type="trash" size="20" color="#ff6b6b"></uni-icons>
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- 底部结算栏 -->
		<view class="cart-footer" v-if="cartList.length > 0">
			<view class="footer-left">
				<view class="all-check" @click="toggleAllCheck">
					<view class="check-circle" :class="{ checked: allChecked }">
						<uni-icons v-if="allChecked" type="checkmarkempty" size="14" color="#fff"></uni-icons>
					</view>
					<text class="check-label">全选</text>
				</view>
				<view class="total-box" v-if="!isEdit">
					<text class="total-label">合计：</text>
					<text class="total-symbol">¥</text>
					<text class="total-num">{{ totalPrice }}</text>
				</view>
			</view>
			<view class="footer-right">
				<view class="submit-btn delete-btn" v-if="isEdit" @click="deleteSelected">删除</view>
				<view class="submit-btn" v-else @click="goCheckout">结算({{ selectedCount }})</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				isEdit: false,
				cartList: [],
				loading: false
			};
		},
		onShow() {
			this.loadCart();
		},
		computed: {
			allChecked() {
				return this.cartList.length > 0 && this.cartList.every(item => item.checked);
			},
			selectedCount() {
				return this.cartList.filter(item => item.checked).reduce((sum, item) => sum + item.quantity, 0);
			},
			totalPrice() {
				return this.cartList
					.filter(item => item.checked)
					.reduce((sum, item) => sum + item.price * item.quantity, 0)
					.toFixed(2);
			}
		},
		methods: {
			// 加载购物车
			async loadCart() {
				this.loading = true;
				try {
					const res = await uniCloud.callFunction({
						name: 'cart',
						data: { action: 'getList' }
					});
					if (res.result.code === 0 && res.result.data.length) {
						this.cartList = res.result.data.map(item => ({
							...item,
							checked: item.checked !== false
						}));
					} else {
						this.cartList = this.getMockCart();
					}
				} catch (e) {
					this.cartList = this.getMockCart();
				}
				this.loading = false;
			},
			getMockCart() {
				return [
					{
						_id: 'c1',
						name: '春季新款休闲运动鞋',
						price: 299.00,
						image: 'https://picsum.photos/200/200?random=50',
						spec: '黑色 42码',
						quantity: 1,
						checked: true
					},
					{
						_id: 'c2',
						name: '纯棉简约T恤',
						price: 89.00,
						image: 'https://picsum.photos/200/200?random=51',
						spec: '白色 L',
						quantity: 2,
						checked: true
					},
					{
						_id: 'c3',
						name: '便携式蓝牙音箱',
						price: 159.00,
						image: 'https://picsum.photos/200/200?random=52',
						spec: '标准版',
						quantity: 1,
						checked: false
					}
				];
			},
			// 切换编辑模式
			toggleEdit() {
				this.isEdit = !this.isEdit;
			},
			// 选择商品
			toggleCheck(index) {
				this.cartList[index].checked = !this.cartList[index].checked;
			},
			// 全选
			toggleAllCheck() {
				const newVal = !this.allChecked;
				this.cartList.forEach(item => item.checked = newVal);
			},
			// 改变数量
			async changeQty(index, delta) {
				const item = this.cartList[index];
				const newQty = item.quantity + delta;
				if (newQty < 1) return;
				try {
					const res = await uniCloud.callFunction({
						name: 'cart',
						data: {
							action: 'updateQty',
							params: { id: item._id, quantity: newQty }
						}
					});
					if (res.result.code === 0) {
						item.quantity = newQty;
					}
				} catch (e) {
					item.quantity = newQty;
				}
			},
			// 删除单个
			deleteItem(index) {
				uni.showModal({
					title: '提示',
					content: '确定删除该商品？',
					success: (res) => {
						if (res.confirm) {
							this.cartList.splice(index, 1);
						}
					}
				});
			},
			// 删除选中
			deleteSelected() {
				const selected = this.cartList.filter(item => item.checked);
				if (selected.length === 0) {
					uni.showToast({ title: '请选择要删除的商品', icon: 'none' });
					return;
				}
				uni.showModal({
					title: '提示',
					content: `确定删除选中的 ${selected.length} 件商品？`,
					success: (res) => {
						if (res.confirm) {
							this.cartList = this.cartList.filter(item => !item.checked);
							this.isEdit = false;
						}
					}
				});
			},
			// 去商品详情
			goDetail(item) {
				uni.navigateTo({ url: `/pages/list/detail?id=${item.goodsId || item._id}` });
			},
			// 去结算
			goCheckout() {
				const selected = this.cartList.filter(item => item.checked);
				if (selected.length === 0) {
					uni.showToast({ title: '请选择商品', icon: 'none' });
					return;
				}
				const data = encodeURIComponent(JSON.stringify(selected));
				uni.navigateTo({ url: '/pages/order/confirm?cart=' + data });
			},
			// 去购物
			goShopping() {
				uni.switchTab({ url: '/pages/index/index' });
			}
		}
	};
</script>

<style scoped>
	.cart-container {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background-color: #f5f5f5;
	}

	/* 顶部栏 */
	.cart-header {
		height: 88rpx;
		background: #fff;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.header-title {
		font-size: 34rpx;
		font-weight: bold;
		color: #333;
	}

	.header-action {
		font-size: 28rpx;
		color: #666;
	}

	/* 空状态 */
	.empty-cart {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding-bottom: 200rpx;
	}

	.empty-img {
		width: 200rpx;
		height: 200rpx;
		opacity: 0.3;
	}

	.empty-title {
		font-size: 32rpx;
		color: #999;
		margin-top: 30rpx;
	}

	.empty-desc {
		font-size: 26rpx;
		color: #ccc;
		margin-top: 12rpx;
	}

	.empty-btn {
		margin-top: 40rpx;
		padding: 16rpx 60rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
		font-size: 28rpx;
		border-radius: 40rpx;
	}

	/* 滚动区域 */
	.cart-scroll {
		flex: 1;
	}

	/* 商品列表 */
	.cart-list {
		padding: 20rpx;
	}

	.cart-item {
		display: flex;
		align-items: center;
		background: #fff;
		border-radius: 16rpx;
		padding: 20rpx;
		margin-bottom: 16rpx;
	}

	.item-check {
		padding: 10rpx;
	}

	.check-circle {
		width: 40rpx;
		height: 40rpx;
		border-radius: 50%;
		border: 2rpx solid #ccc;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.check-circle.checked {
		background: #667eea;
		border-color: #667eea;
	}

	.item-img {
		width: 160rpx;
		height: 160rpx;
		border-radius: 12rpx;
		background: #f5f5f5;
		margin: 0 16rpx;
	}

	.item-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		height: 160rpx;
	}

	.item-name {
		font-size: 28rpx;
		color: #333;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		line-height: 1.4;
	}

	.item-spec {
		font-size: 22rpx;
		color: #999;
		margin-top: 4rpx;
	}

	.item-bottom {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: auto;
	}

	.item-price {
		display: flex;
		align-items: baseline;
	}

	.price-symbol {
		font-size: 22rpx;
		color: #ff6b6b;
	}

	.price-num {
		font-size: 32rpx;
		color: #ff6b6b;
		font-weight: bold;
	}

	.quantity-box {
		display: flex;
		align-items: center;
		border: 1rpx solid #eee;
		border-radius: 8rpx;
		overflow: hidden;
	}

	.qty-btn {
		width: 52rpx;
		height: 44rpx;
		line-height: 44rpx;
		text-align: center;
		background: #f8f8f8;
		font-size: 28rpx;
		color: #666;
	}

	.qty-num {
		width: 64rpx;
		height: 44rpx;
		line-height: 44rpx;
		text-align: center;
		font-size: 26rpx;
		color: #333;
	}

	.item-delete {
		padding: 20rpx;
	}

	/* 底部栏 */
	.cart-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 30rpx;
		padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
		background: #fff;
		border-top: 1rpx solid #f0f0f0;
	}

	.footer-left {
		display: flex;
		align-items: center;
		gap: 20rpx;
	}

	.all-check {
		display: flex;
		align-items: center;
		gap: 12rpx;
	}

	.check-label {
		font-size: 26rpx;
		color: #666;
	}

	.total-box {
		display: flex;
		align-items: baseline;
	}

	.total-label {
		font-size: 26rpx;
		color: #333;
	}

	.total-symbol {
		font-size: 24rpx;
		color: #ff6b6b;
	}

	.total-num {
		font-size: 36rpx;
		color: #ff6b6b;
		font-weight: bold;
	}

	.submit-btn {
		padding: 16rpx 50rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
		font-size: 28rpx;
		border-radius: 40rpx;
		font-weight: 500;
	}

	.delete-btn {
		background: #ff6b6b;
	}
</style>
