<template>
	<view class="bodybox">
		<view class="topbox">
			<!-- 顶部区域可添加搜索栏、轮播图等 -->
			<view class="search-bar">
				<view class="search-input">
					<text class="icon-search">🔍</text>
					<text>搜索商品...</text>
				</view>
			</view>
		</view>
		<view class="databox">
			<!-- 左侧分类栏 -->
			<view class="leftbox">
				<scroll-view scroll-y class="category-scroll">
					<view v-for="(item, index) in categorylist" :key="item._id" class="category-item"
						:class="{ 'active': currentCategory === index }" @click="switchCategory(index, item._id)">
						<text>{{ item.categorize_name }}</text>
					</view>
				</scroll-view>
			</view>

			<!-- 右侧商品列表 -->
			<view class="rightbox">
				<scroll-view scroll-y class="goods-scroll">
					<!-- 商品列表标题 -->
					<view class="goods-header">
						<text class="header-title">{{ currentCategoryName }}</text>
					</view>

					<!-- 商品网格 -->
					<view class="goods-grid" v-if="goodsList.length > 0">
						<view class="goods-item" v-for="goods in goodsList" :key="goods._id || goods.product_name">
							<image
								:src="goods.image && goods.image.length > 0 ? goods.image[0].url : '/static/images/default-goods.png'"
								class="goods-img" mode="aspectFill"></image>
							<view class="goods-info">
								<text class="goods-name">{{ goods.product_name }}</text>
								<text class="goods-desc">{{ goods.describe }}</text>
								<text class="goods-price">¥{{ Number(goods.price).toFixed(2) }}</text>
								<text class="goods-stock">库存: {{ goods.inventory }}件</text>
								<button class="add-cart" @click="check_good(goods)">查看详情</button>
							</view>
						</view>
					</view>

					<!-- 空状态 -->
					<view class="empty-state" v-else>
						<text>暂无该分类商品</text>
					</view>
				</scroll-view>
			</view>
		</view>

		<!-- 商品详情底部弹窗 -->
		<view class="detail-mask" v-if="showDetail" @click="closeDetail"></view>
		<view class="detail-popup" v-if="showDetail">
			<view class="detail-header">
				<text>商品详情</text>
				<text class="close-btn" @click="closeDetail">×</text>
			</view>
			<scroll-view class="detail-content" scroll-y>
				<image :src="displayImage" class="detail-img" mode="widthFix"></image>
				<view class="detail-info">
					<text class="detail-name">{{ currentGoods.product_name }}</text>
					<text class="detail-price">¥{{ displayPrice }}</text>
					<text class="detail-desc">描述：{{ currentGoods.describe || '暂无描述' }}</text>
					<text class="detail-stock">库存：{{ displayStock }}件</text>

					<!-- 新增数量选择区域 -->
					<view class="quantity-control">
						<text class="quantity-label">购买数量：</text>
						<view class="quantity-box">
							<button class="quantity-btn minus" @click="decreaseQuantity">-</button>
							<input type="number" v-model="selectedQuantity" class="quantity-input"
								@input="handleQuantityChange" min="1">
							<button class="quantity-btn plus" @click="increaseQuantity">+</button>
						</view>
					</view>

					<!-- 变体信息 -->
					<view class="variants-title" v-if="currentGoods.variants && currentGoods.variants.length">
						可选规格:
					</view>
					<view class="variants-list" v-if="currentGoods.variants && currentGoods.variants.length">
						<view class="variant-item" v-for="(v, i) in currentGoods.variants" :key="i"
							:class="{selected: selectedVariantIndex===i}" @click="selectVariant(i)">
							<view class="variant-name">{{v.name}}</view>
							<view class="variant-info">
								<text>价格: ¥{{ Number(v.price).toFixed(2) }}</text>
								<text>库存: {{v.stock}}件</text>
							</view>
						</view>
					</view>
				</view>
			</scroll-view>
			<view class="detail-footer">
				<button class="add-cart-btn" @click="addToCartFromDetail">加入购物车</button>
				<button class="buy-btn" @click="buyNow">立即购买</button>
			</view>
		</view>



	</view>
</template>

<script>
	export default {
		data() {
			return {
				categorylist: [],
				goodsList: [],
				currentCategory: 0, // 当前选中的分类索引
				currentCategoryId: '', // 当前选中的分类ID
				showDetail: false, // 控制弹窗显示
				currentGoods: null, // 当前选中的商品
				selectedVariantIndex: -1, // 选中的变体索引
				selectedVariant: null, // 选中的变体对象
				selectedQuantity: 1, // 选中数量（预留）
				selectedQuantity: 1, // 选中数量
			};
		},
		onLoad() {
			this.selshopcategory();
		},
		computed: {
			// 获取当前分类名称
			currentCategoryName() {
				if (this.categorylist.length > 0) {
					return this.categorylist[this.currentCategory].categorize_name || '全部商品';
				}
				return '商品分类';
			},

			// 显示价格：优先变体价格，否则商品价格
			displayPrice() {
				if (this.selectedVariant && this.selectedVariant.price != null) return Number(this.selectedVariant.price)
					.toFixed(2);
				if (this.currentGoods && this.currentGoods.price != null) return Number(this.currentGoods.price).toFixed(
					2);
				return '0.00';
			},

			// 显示库存：优先变体库存，否则商品库存
			displayStock() {
				if (this.selectedVariant && this.selectedVariant.stock != null) return this.selectedVariant.stock;
				if (this.currentGoods && this.currentGoods.inventory != null) return this.currentGoods.inventory;
				return 0;
			},

			// 显示图片：优先变体图片，否则商品主图
			displayImage() {
				if (this.selectedVariant && this.selectedVariant.image && this.selectedVariant.image.length) return this
					.selectedVariant.image[0].url;
				if (this.currentGoods && this.currentGoods.image && this.currentGoods.image.length) return this
					.currentGoods.image[0].url;
				return '/static/images/default-goods.png';
			}
		},
		methods: {
			// 查询分类列表
			selshopcategory() {
				uniCloud.callFunction({
					name: 'selCategory',
					success: (res) => {
						console.log('分类数据:', res);
						if (res.result.data && res.result.data.length > 0) {
							this.categorylist = res.result.data;
							// 默认加载第一个分类的商品
							this.currentCategoryId = res.result.data[0].id;
							this.getGoodsByCategory(this.currentCategoryId);
						}
					},
					fail: (err) => {
						console.error('获取分类失败:', err);
					}
				});
			},

			// 切换分类
			switchCategory(index, categoryId) {
				this.currentCategory = index;
				this.currentCategoryId = categoryId;
				this.getGoodsByCategory(categoryId);
			},

			// 根据分类获取商品
			getGoodsByCategory(categoryId) {
				// 显示加载中
				uni.showLoading({
					title: '加载中...'
				});
				uniCloud.callFunction({
					name: 'selproduct', // 假设你的云函数名称
					data: {
						categoryId: categoryId
					},
					success: (res) => {
						console.log('商品数据:', res);
						// 从返回结果中正确提取products数组
						this.goodsList = res.result.data?.products || [];
					},
					fail: (err) => {
						console.error('获取商品失败:', err);
						uni.showToast({
							title: '加载失败',
							icon: 'none'
						});
					},
					complete: () => {
						uni.hideLoading();
					}
				});
			},

			// 查看详情
			check_good(goods) {
				this.getGoodsDetail(goods._id);
				this.showDetail = true;
			},
			// 关闭弹窗
			closeDetail() {
				this.showDetail = false;
				this.currentGoods = null;
				this.selectedVariantIndex = -1;
				this.selectedVariant = null;
			},

			// 获取商品详情（如需从云端获取完整信息）
			getGoodsDetail(goodsId) {
				uni.showLoading({
					title: '加载详情...'
				});
				uniCloud.callFunction({
					name: 'selproductDetail',
					data: {
						goodsId
					},
					success: (res) => {
						if (res.result.code === 0) {
							this.currentGoods = res.result.data;
							// 初始化变体选择
							if (this.currentGoods && Array.isArray(this.currentGoods.variants) && this
								.currentGoods.variants.length > 0) {
								this.selectedVariantIndex = 0;
								this.selectedVariant = this.currentGoods.variants[0];
							} else {
								this.selectedVariantIndex = -1;
								this.selectedVariant = null;
							}
						} else {
							uni.showToast({
								title: '获取详情失败',
								icon: 'none'
							});
						}
					},
					fail: (err) => {
						console.error('获取详情失败:', err);
						uni.showToast({
							title: '获取详情失败',
							icon: 'none'
						});
					},
					complete: () => {
						uni.hideLoading();
					}
				});
			},

			// 选择变体
			selectVariant(index) {
				if (!this.currentGoods || !this.currentGoods.variants) return;
				this.selectedVariantIndex = index;
				this.selectedVariant = this.currentGoods.variants[index] || null;
			},

			// 减少数量
			decreaseQuantity() {
				if (this.selectedQuantity > 1) {
					this.selectedQuantity--;
				}
			},

			// 增加数量
			increaseQuantity() {
				if (this.selectedQuantity < this.displayStock) {
					this.selectedQuantity++;
				} else {
					uni.showToast({
						title: '已达最大库存',
						icon: 'none'
					});
				}
			},

			// 处理手动输入数量
			handleQuantityChange(e) {
				let value = parseInt(e.detail.value) || 1;
				// 限制最小值为1
				if (value < 1) {
					value = 1;
				}
				// 限制最大值为库存
				if (value > this.displayStock) {
					value = this.displayStock;
					uni.showToast({
						title: '超过最大库存',
						icon: 'none'
					});
				}
				this.selectedQuantity = value;
			},

			// 选择变体时重置数量为1
			selectVariant(index) {
				if (!this.currentGoods || !this.currentGoods.variants) return;
				this.selectedVariantIndex = index;
				this.selectedVariant = this.currentGoods.variants[index] || null;
				// 切换变体时重置数量
				this.selectedQuantity = 1;
			},

			// 加入购物车方法更新
			addToCartFromDetail() {
				if (!this.currentGoods) return uni.showToast({
					title: '请选择商品',
					icon: 'none'
				});
				const sku = this.selectedVariant || {
					price: this.currentGoods.price,
					stock: this.currentGoods.inventory
				};
				if (sku.stock <= 0) return uni.showToast({
					title: '库存不足',
					icon: 'none'
				});

				// 添加商品到购物车
				uniCloud.callFunction({
				  name: 'cart-operation',
				  data: {
				    action: 'add',
				    params: {
				      goodsId: '你的商品ID', // 如：1754118933236654
				      quantity: 2 // 购买数量
				    }
				  }
				}).then(res => {
				  if (res.result.code === 0) {
				    uni.showToast({ title: '添加购物车成功' })
				  } else {
				    uni.showToast({ title: res.result.msg, icon: 'none' })
				  }
				}).catch(err => {
				  uni.showToast({ title: '网络异常', icon: 'none' })
				})
				this.showDetail = false;
			},

			// 立即购买方法更新
			buyNow() {
				if (!this.currentGoods) return uni.showToast({
					title: '请选择商品',
					icon: 'none'
				});
				const sku = this.selectedVariant || {
					price: this.currentGoods.price,
					stock: this.currentGoods.inventory
				};
				if (sku.stock <= 0) return uni.showToast({
					title: '库存不足',
					icon: 'none'
				});

				// 传递数量信息到结算页
				uni.navigateTo({
					url: `/pages/order/confirm?goodsId=${this.currentGoods._id}&quantity=${this.selectedQuantity}&variantIndex=${this.selectedVariantIndex}`
				});
				this.showDetail = false;
			},
		}
	};
</script>

<style scoped>
	.bodybox {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background-color: #f5f5f5;
	}

	/* 顶部区域样式 */
	.topbox {
		width: 100%;
		height: 20vh;
		min-height: 120rpx;
		background-color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20rpx;
		box-sizing: border-box;
	}

	.search-bar {
		width: 100%;
		padding: 0 20rpx;
	}

	.search-input {
		width: 100%;
		height: 70rpx;
		background-color: #f1f1f1;
		border-radius: 35rpx;
		display: flex;
		align-items: center;
		padding: 0 20rpx;
		font-size: 28rpx;
		color: #999;
	}

	.icon-search {
		margin-right: 10rpx;
	}

	/* 主内容区样式 */
	.databox {
		width: 100%;
		height: 80vh;
		display: flex;
		flex-direction: row;
		overflow: hidden;
	}

	/* 左侧分类样式 */
	.leftbox {
		width: 250rpx;
		height: 100%;
		background-color: #fafafa;
		border-right: 1px solid #eee;
	}

	.category-scroll {
		width: 100%;
		height: 100%;
	}

	.category-item {
		height: 100rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 30rpx;
		color: #333;
		padding: 0 20rpx;
		box-sizing: border-box;
		border-left: 4rpx solid transparent;
		background-color: #fafafa;
	}

	.category-item.active {
		background-color: #fff;
		color: #ff4d4f;
		border-left-color: #ff4d4f;
		font-weight: bold;
	}

	/* 右侧商品列表样式 */
	.rightbox {
		flex: 1;
		height: 100%;
		overflow: hidden;
		background-color: #fff;
	}

	.goods-scroll {
		width: 100%;
		height: 100%;
		padding: 20rpx;
		box-sizing: border-box;
	}

	.goods-header {
		padding: 15rpx 0;
		margin-bottom: 10rpx;
	}

	.header-title {
		font-size: 34rpx;
		font-weight: bold;
		color: #333;
		padding-left: 10rpx;
		border-left: 4rpx solid #ff4d4f;
	}

	/* 商品网格布局 */
	.goods-grid {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 20rpx;
	}

	.goods-item {
		width: calc(50% - 10rpx);
		background-color: #fff;
		border-radius: 10rpx;
		overflow: hidden;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
	}

	.goods-img {
		width: 100%;
		height: 240rpx;
		background-color: #f5f5f5;
	}

	.goods-info {
		padding: 15rpx;
	}

	.goods-name {
		font-size: 28rpx;
		color: #333;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		line-height: 1.4;
		margin-bottom: 10rpx;
	}

	.goods-price {
		font-size: 30rpx;
		color: #ff4d4f;
		font-weight: bold;
		display: block;
		margin-bottom: 15rpx;
	}

	.add-cart {
		width: 100%;
		height: 60rpx;
		line-height: 60rpx;
		background-color: #ff4d4f;
		color: #fff;
		font-size: 26rpx;
		border-radius: 30rpx;
		padding: 0;
	}

	/* 空状态样式 */
	.empty-state {
		width: 100%;
		height: 300rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #999;
		font-size: 30rpx;
	}

	/* 解决button默认样式问题 */
	button::after {
		border: none;
	}

	/* 原有样式保持不变，新增以下样式 */
	.goods-desc {
		font-size: 24rpx;
		color: #666;
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
		margin-bottom: 8rpx;
	}

	.goods-stock {
		font-size: 22rpx;
		color: #999;
		margin-bottom: 15rpx;
		display: block;
	}

	/* 新增弹窗样式 */
	.detail-mask {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 998;
	}

	.detail-popup {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #fff;
		border-radius: 30rpx 30rpx 0 0;
		z-index: 999;
		height: 80vh;
	}

	.detail-header {
		height: 80rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		border-bottom: 1px solid #eee;
	}

	.detail-header text {
		font-size: 34rpx;
		font-weight: bold;
	}

	.close-btn {
		position: absolute;
		right: 30rpx;
		font-size: 40rpx;
		color: #666;
	}

	.detail-content {
		height: calc(80vh - 180rpx);
		padding: 30rpx;
		box-sizing: border-box;
	}

	.detail-img {
		width: 100%;
		border-radius: 10rpx;
		margin-bottom: 20rpx;
	}

	.detail-info {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.detail-name {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.detail-price {
		font-size: 34rpx;
		color: #ff4d4f;
		font-weight: bold;
	}

	.detail-desc,
	.detail-stock,
	.detail-category {
		font-size: 28rpx;
		color: #666;
		line-height: 1.6;
	}

	.detail-footer {
		height: 100rpx;
		display: flex;
		align-items: center;
		justify-content: space-around;
		border-top: 1px solid #eee;
		padding: 0 20rpx;
		box-sizing: border-box;
	}

	.add-cart-btn,
	.buy-btn {
		width: 45%;
		height: 70rpx;
		line-height: 70rpx;
		border-radius: 35rpx;
		font-size: 28rpx;
	}

	.add-cart-btn {
		background-color: #fff;
		color: #ff4d4f;
		border: 1px solid #ff4d4f;
	}

	.buy-btn {
		background-color: #ff4d4f;
		color: #fff;
	}

	.variants-title {
		font-size: 30rpx;
		font-weight: bold;
		margin-bottom: 15rpx;
	}

	.variants-list {
		margin-bottom: 20rpx;
	}

	.variant-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 15rpx 0;
		border-bottom: 1px solid #eee;
	}

	.variant-name {
		font-size: 28rpx;
	}

	.variant-info {
		font-size: 26rpx;
		color: #666;
	}

	.variant-info text {
		margin-left: 20rpx;
	}

	/* 变体选择选中态 */
	.variant-item.selected {
		background-color: #fff;
		border: 1rpx solid #ff4d4f;
		color: #ff4d4f;
		font-weight: bold;
	}
	/* 数量选择样式 */
		.quantity-control {
			display: flex;
			align-items: center;
			margin: 20rpx 0;
			padding: 15rpx 0;
			border-top: 1px solid #eee;
			border-bottom: 1px solid #eee;
		}
		
		.quantity-label {
			font-size: 28rpx;
			color: #333;
			margin-right: 20rpx;
		}
		
		.quantity-box {
			display: flex;
			align-items: center;
			flex: 1;
		}
		
		.quantity-btn {
			width: 60rpx;
			height: 60rpx;
			line-height: 60rpx;
			padding: 0;
			margin: 0;
			font-size: 36rpx;
			background-color: #f5f5f5;
			color: #333;
			border-radius: 8rpx;
		}
		
		.quantity-btn.minus {
			border-top-right-radius: 0;
			border-bottom-right-radius: 0;
		}
		
		.quantity-btn.plus {
			border-top-left-radius: 0;
			border-bottom-left-radius: 0;
		}
		
		.quantity-input {
			width: 100rpx;
			height: 60rpx;
			line-height: 60rpx;
			text-align: center;
			font-size: 28rpx;
			border-top: 1px solid #f5f5f5;
			border-bottom: 1px solid #f5f5f5;
		}
</style>