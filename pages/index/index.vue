<template>
	<view class="home-container">
		<!-- 自定义导航栏 -->
		<view class="custom-nav">
			<view class="nav-content">
				<view class="location" @click="chooseLocation">
					<uni-icons type="location" size="18" color="#fff"></uni-icons>
					<text class="location-text">{{ location || '请选择位置' }}</text>
					<uni-icons type="down" size="12" color="#fff"></uni-icons>
				</view>
				<view class="search-box" @click="goSearch">
					<uni-icons type="search" size="16" color="#999"></uni-icons>
					<text class="search-placeholder">搜索商品</text>
				</view>
				<view class="scan-btn" @click="scanCode">
					<uni-icons type="scan" size="22" color="#fff"></uni-icons>
				</view>
			</view>
		</view>

		<scroll-view scroll-y class="home-scroll" @scrolltolower="loadMoreGoods" refresher-enabled
			:refresher-triggered="refreshing" @refresherrefresh="onRefresh">
			<!-- 轮播图 -->
			<view class="banner-section">
				<swiper class="banner-swiper" :indicator-dots="true" :autoplay="true" :interval="3000"
					:duration="500" circular indicator-color="rgba(255,255,255,0.4)" indicator-active-color="#fff">
					<swiper-item v-for="(item, index) in bannerList" :key="index" @click="bannerClick(item)">
						<image class="banner-img" :src="item.image" mode="aspectFill"></image>
					</swiper-item>
				</swiper>
			</view>

			<!-- 分类导航 -->
			<view class="category-section">
				<view class="category-grid">
					<view class="category-item" v-for="(item, index) in categoryList" :key="index"
						@click="goCategory(item)">
						<image class="category-icon" :src="item.icon" mode="aspectFill"></image>
						<text class="category-name">{{ item.name }}</text>
					</view>
				</view>
			</view>

			<!-- 活动专区 -->
			<view class="activity-section">
				<view class="activity-card bg-gradient-1" @click="goActivity('seckill')">
					<view class="activity-info">
						<text class="activity-title">限时秒杀</text>
						<text class="activity-desc">全场低至9.9</text>
					</view>
					<image class="activity-img" src="/static/logo.png" mode="aspectFit"></image>
				</view>
				<view class="activity-card bg-gradient-2" @click="goActivity('new')">
					<view class="activity-info">
						<text class="activity-title">新品上市</text>
						<text class="activity-desc">抢先体验</text>
					</view>
					<image class="activity-img" src="/static/logo.png" mode="aspectFit"></image>
				</view>
			</view>

			<!-- 推荐商品 -->
			<view class="goods-section">
				<view class="section-header">
					<view class="header-left">
						<view class="header-line"></view>
						<text class="header-title">热门推荐</text>
					</view>
					<view class="header-more" @click="goMoreGoods">
						<text>更多</text>
						<uni-icons type="right" size="12" color="#999"></uni-icons>
					</view>
				</view>
				<view class="goods-waterfall">
					<view class="goods-item" v-for="(item, index) in goodsList" :key="index"
						@click="showGoodsDetail(item)">
						<image class="goods-img" :src="item.image" mode="aspectFill"></image>
						<view class="goods-info">
							<text class="goods-name">{{ item.name }}</text>
							<text class="goods-desc">{{ item.description }}</text>
							<view class="goods-bottom">
								<view class="price-box">
									<text class="price-symbol">¥</text>
									<text class="price-num">{{ item.price }}</text>
									<text class="price-original" v-if="item.original_price">¥{{ item.original_price }}</text>
								</view>
								<view class="add-cart-btn" @click.stop="quickAddCart(item)">
									<uni-icons type="plus-filled" size="20" color="#ff6b6b"></uni-icons>
								</view>
							</view>
						</view>
					</view>
				</view>
				<!-- 加载更多 -->
				<view class="load-more">
					<text v-if="loading">加载中...</text>
					<text v-else-if="noMore">没有更多了</text>
					<text v-else>上拉加载更多</text>
				</view>
			</view>
		</scroll-view>

		<!-- 商品详情弹窗 -->
		<uni-popup ref="detailPopup" type="bottom" :safe-area="true">
			<view class="detail-popup" v-if="currentGoods">
				<view class="popup-header">
					<view class="popup-bar"></view>
					<text class="popup-title">商品详情</text>
				</view>
				<scroll-view scroll-y class="popup-body">
					<image class="detail-banner" :src="currentGoods.image" mode="aspectFill"></image>
					<view class="detail-content">
						<text class="detail-name">{{ currentGoods.name }}</text>
						<text class="detail-desc">{{ currentGoods.description }}</text>
						<view class="detail-price-row">
							<text class="detail-price">¥{{ currentGoods.price }}</text>
							<text class="detail-stock">库存 {{ currentGoods.stock }} 件</text>
						</view>
						<!-- 规格选择 -->
						<view class="spec-section" v-if="currentGoods.specs && currentGoods.specs.length">
							<text class="spec-title">选择规格</text>
							<view class="spec-list">
								<view class="spec-item" v-for="(spec, i) in currentGoods.specs" :key="i"
									:class="{ active: selectedSpecIndex === i }" @click="selectSpec(i)">
									{{ spec.name }}
								</view>
							</view>
						</view>
						<!-- 数量 -->
						<view class="quantity-section">
							<text class="quantity-title">购买数量</text>
							<view class="quantity-control">
								<button class="qty-btn" @click="changeQty(-1)">-</button>
								<text class="qty-num">{{ quantity }}</text>
								<button class="qty-btn" @click="changeQty(1)">+</button>
							</view>
						</view>
					</view>
				</scroll-view>
				<view class="popup-footer">
					<view class="popup-btn cart-btn" @click="addToCart">加入购物车</view>
					<view class="popup-btn buy-btn" @click="buyNow">立即购买</view>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				location: '',
				bannerList: [],
				categoryList: [],
				goodsList: [],
				currentGoods: null,
				selectedSpecIndex: 0,
				quantity: 1,
				refreshing: false,
				loading: false,
				noMore: false,
				page: 1,
				pageSize: 10
			};
		},
		onLoad() {
			this.loadBanner();
			this.loadCategory();
			this.loadGoods();
		},
		methods: {
			// 加载轮播图
			async loadBanner() {
				try {
					const res = await uniCloud.callFunction({
						name: 'banner',
						data: { action: 'getList' }
					});
					if (res.result.code === 0 && res.result.data.length) {
						this.bannerList = res.result.data.map(item => ({
							image: item.bannerfile?.url || item.image,
							openUrl: item.open_url,
							title: item.title
						}));
					} else {
						this.bannerList = this.getMockBanner();
					}
				} catch (e) {
					this.bannerList = this.getMockBanner();
				}
			},
			getMockBanner() {
				return [
					{ image: 'https://picsum.photos/750/300?random=1', openUrl: '', title: '活动1' },
					{ image: 'https://picsum.photos/750/300?random=2', openUrl: '', title: '活动2' },
					{ image: 'https://picsum.photos/750/300?random=3', openUrl: '', title: '活动3' }
				];
			},
			// 加载分类
			async loadCategory() {
				try {
					const res = await uniCloud.callFunction({
						name: 'category',
						data: { action: 'getList' }
					});
					if (res.result.code === 0 && res.result.data.length) {
						this.categoryList = res.result.data;
					} else {
						this.categoryList = this.getMockCategory();
					}
				} catch (e) {
					this.categoryList = this.getMockCategory();
				}
			},
			getMockCategory() {
				return [
					{ name: '数码', icon: 'https://picsum.photos/100/100?random=10' },
					{ name: '服饰', icon: 'https://picsum.photos/100/100?random=11' },
					{ name: '食品', icon: 'https://picsum.photos/100/100?random=12' },
					{ name: '家居', icon: 'https://picsum.photos/100/100?random=13' },
					{ name: '美妆', icon: 'https://picsum.photos/100/100?random=14' },
					{ name: '运动', icon: 'https://picsum.photos/100/100?random=15' },
					{ name: '图书', icon: 'https://picsum.photos/100/100?random=16' },
					{ name: '母婴', icon: 'https://picsum.photos/100/100?random=17' }
				];
			},
			// 加载商品
			async loadGoods() {
				if (this.loading || this.noMore) return;
				this.loading = true;
				try {
					const res = await uniCloud.callFunction({
						name: 'goods',
						data: {
							action: 'getList',
							params: { page: this.page, pageSize: this.pageSize }
						}
					});
					if (res.result.code === 0 && res.result.data.length) {
						const list = res.result.data.map(item => ({
							_id: item._id,
							name: item.name,
							price: item.price,
							original_price: item.original_price,
							description: item.description,
							image: item.images?.[0]?.url || 'https://picsum.photos/300/300',
							stock: item.stock,
							specs: item.specs || []
						}));
						this.goodsList = this.page === 1 ? list : [...this.goodsList, ...list];
						this.noMore = list.length < this.pageSize;
					} else {
						if (this.page === 1) this.goodsList = this.getMockGoods();
						this.noMore = true;
					}
				} catch (e) {
					if (this.page === 1) this.goodsList = this.getMockGoods();
					this.noMore = true;
				}
				this.loading = false;
			},
			getMockGoods() {
				return Array.from({ length: 10 }, (_, i) => ({
					_id: 'goods_' + i,
					name: '热门商品 ' + (i + 1),
					price: (Math.random() * 200 + 10).toFixed(2),
					original_price: (Math.random() * 300 + 50).toFixed(2),
					description: '商品描述示例文字，品质保证',
					image: `https://picsum.photos/300/300?random=${20 + i}`,
					stock: Math.floor(Math.random() * 100) + 10,
					specs: i % 2 === 0 ? [{ name: '标准版' }, { name: '豪华版' }] : []
				}));
			},
			// 刷新
			onRefresh() {
				this.refreshing = true;
				this.page = 1;
				this.noMore = false;
				Promise.all([this.loadBanner(), this.loadCategory(), this.loadGoods()]).then(() => {
					this.refreshing = false;
				});
			},
			// 加载更多
			loadMoreGoods() {
				if (!this.noMore && !this.loading) {
					this.page++;
					this.loadGoods();
				}
			},
			// 选择位置
			chooseLocation() {
				uni.chooseLocation({
					success: (res) => {
						this.location = res.name;
					}
				});
			},
			// 搜索
			goSearch() {
				uni.navigateTo({ url: '/pages/list/search/search' });
			},
			// 扫码
			scanCode() {
				uni.scanCode({
					success: (res) => {
						uni.showToast({ title: res.result, icon: 'none' });
					}
				});
			},
			// banner点击
			bannerClick(item) {
				if (item.openUrl) {
					uni.navigateTo({ url: item.openUrl });
				}
			},
			// 分类点击
			goCategory(item) {
				uni.switchTab({ url: '/pages/list/list?category=' + item._id || item.name });
			},
			// 活动点击
			goActivity(type) {
				uni.showToast({ title: '活动功能开发中', icon: 'none' });
			},
			// 更多商品
			goMoreGoods() {
				uni.switchTab({ url: '/pages/list/list' });
			},
			// 显示商品详情
			showGoodsDetail(item) {
				this.currentGoods = item;
				this.selectedSpecIndex = 0;
				this.quantity = 1;
				this.$refs.detailPopup.open();
			},
			// 选择规格
			selectSpec(index) {
				this.selectedSpecIndex = index;
			},
			// 改变数量
			changeQty(delta) {
				const newQty = this.quantity + delta;
				if (newQty >= 1 && newQty <= (this.currentGoods?.stock || 99)) {
					this.quantity = newQty;
				}
			},
			// 快速加入购物车
			quickAddCart(item) {
				uni.showToast({ title: '已加入购物车', icon: 'success' });
			},
			// 加入购物车
			addToCart() {
				uni.showToast({ title: '已加入购物车', icon: 'success' });
				this.$refs.detailPopup.close();
			},
			// 立即购买
			buyNow() {
				const params = encodeURIComponent(JSON.stringify({
					goodsId: this.currentGoods._id,
					quantity: this.quantity,
					spec: this.currentGoods.specs?.[this.selectedSpecIndex]?.name || ''
				}));
				uni.navigateTo({ url: '/pages/order/confirm?data=' + params });
				this.$refs.detailPopup.close();
			}
		}
	};
</script>

<style scoped>
	.home-container {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background-color: #f8f9fa;
	}

	/* 自定义导航 */
	.custom-nav {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 20rpx 30rpx 30rpx;
		padding-top: calc(var(--status-bar-height) + 20rpx);
	}

	.nav-content {
		display: flex;
		align-items: center;
		gap: 20rpx;
	}

	.location {
		display: flex;
		align-items: center;
		gap: 6rpx;
		color: #fff;
		font-size: 26rpx;
		max-width: 180rpx;
	}

	.location-text {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.search-box {
		flex: 1;
		height: 64rpx;
		background: #fff;
		border-radius: 32rpx;
		display: flex;
		align-items: center;
		padding: 0 24rpx;
		gap: 10rpx;
	}

	.search-placeholder {
		color: #999;
		font-size: 26rpx;
	}

	.scan-btn {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* 滚动区域 */
	.home-scroll {
		flex: 1;
	}

	/* 轮播图 */
	.banner-section {
		padding: 20rpx;
	}

	.banner-swiper {
		height: 300rpx;
		border-radius: 20rpx;
		overflow: hidden;
	}

	.banner-img {
		width: 100%;
		height: 100%;
	}

	/* 分类 */
	.category-section {
		background: #fff;
		margin: 0 20rpx 20rpx;
		border-radius: 20rpx;
		padding: 30rpx 20rpx;
	}

	.category-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 20rpx;
	}

	.category-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10rpx;
	}

	.category-icon {
		width: 90rpx;
		height: 90rpx;
		border-radius: 50%;
		background: #f5f5f5;
	}

	.category-name {
		font-size: 24rpx;
		color: #333;
	}

	/* 活动专区 */
	.activity-section {
		display: flex;
		gap: 20rpx;
		padding: 0 20rpx;
		margin-bottom: 20rpx;
	}

	.activity-card {
		flex: 1;
		height: 180rpx;
		border-radius: 20rpx;
		padding: 24rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.bg-gradient-1 {
		background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
	}

	.bg-gradient-2 {
		background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
	}

	.activity-info {
		display: flex;
		flex-direction: column;
		gap: 8rpx;
	}

	.activity-title {
		color: #fff;
		font-size: 32rpx;
		font-weight: bold;
		text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
	}

	.activity-desc {
		color: rgba(255, 255, 255, 0.9);
		font-size: 24rpx;
	}

	.activity-img {
		width: 100rpx;
		height: 100rpx;
		opacity: 0.8;
	}

	/* 商品区域 */
	.goods-section {
		background: #fff;
		margin: 0 20rpx 20rpx;
		border-radius: 20rpx;
		padding: 30rpx 20rpx;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 12rpx;
	}

	.header-line {
		width: 6rpx;
		height: 32rpx;
		background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
		border-radius: 3rpx;
	}

	.header-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.header-more {
		display: flex;
		align-items: center;
		color: #999;
		font-size: 26rpx;
	}

	/* 商品瀑布流 */
	.goods-waterfall {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 20rpx;
	}

	.goods-item {
		background: #fff;
		border-radius: 16rpx;
		overflow: hidden;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
	}

	.goods-img {
		width: 100%;
		height: 320rpx;
		background: #f5f5f5;
	}

	.goods-info {
		padding: 16rpx;
	}

	.goods-name {
		font-size: 28rpx;
		color: #333;
		font-weight: 500;
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.goods-desc {
		font-size: 22rpx;
		color: #999;
		margin-top: 6rpx;
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.goods-bottom {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 12rpx;
	}

	.price-box {
		display: flex;
		align-items: baseline;
		gap: 8rpx;
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

	.price-original {
		font-size: 22rpx;
		color: #ccc;
		text-decoration: line-through;
	}

	.add-cart-btn {
		width: 48rpx;
		height: 48rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* 加载更多 */
	.load-more {
		text-align: center;
		padding: 30rpx 0;
		color: #999;
		font-size: 24rpx;
	}

	/* 详情弹窗 */
	.detail-popup {
		background: #fff;
		border-radius: 30rpx 30rpx 0 0;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
	}

	.popup-header {
		padding: 20rpx;
		text-align: center;
		position: relative;
	}

	.popup-bar {
		width: 60rpx;
		height: 6rpx;
		background: #ddd;
		border-radius: 3rpx;
		margin: 0 auto 16rpx;
	}

	.popup-title {
		font-size: 30rpx;
		font-weight: bold;
		color: #333;
	}

	.popup-body {
		flex: 1;
		overflow-y: auto;
	}

	.detail-banner {
		width: 100%;
		height: 400rpx;
	}

	.detail-content {
		padding: 30rpx;
	}

	.detail-name {
		font-size: 34rpx;
		font-weight: bold;
		color: #333;
	}

	.detail-desc {
		font-size: 26rpx;
		color: #666;
		margin-top: 12rpx;
		line-height: 1.6;
	}

	.detail-price-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 20rpx;
		padding-bottom: 20rpx;
		border-bottom: 1rpx solid #f5f5f5;
	}

	.detail-price {
		font-size: 40rpx;
		color: #ff6b6b;
		font-weight: bold;
	}

	.detail-stock {
		font-size: 24rpx;
		color: #999;
	}

	.spec-section,
	.quantity-section {
		margin-top: 24rpx;
	}

	.spec-title,
	.quantity-title {
		font-size: 28rpx;
		color: #333;
		font-weight: 500;
	}

	.spec-list {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
		margin-top: 16rpx;
	}

	.spec-item {
		padding: 12rpx 30rpx;
		background: #f5f5f5;
		border-radius: 30rpx;
		font-size: 26rpx;
		color: #666;
		border: 2rpx solid transparent;
	}

	.spec-item.active {
		background: #fff0f0;
		color: #ff6b6b;
		border-color: #ff6b6b;
	}

	.quantity-control {
		display: flex;
		align-items: center;
		gap: 20rpx;
		margin-top: 16rpx;
	}

	.qty-btn {
		width: 56rpx;
		height: 56rpx;
		line-height: 52rpx;
		text-align: center;
		background: #f5f5f5;
		border-radius: 50%;
		font-size: 32rpx;
		color: #333;
		padding: 0;
		margin: 0;
	}

	.qty-btn::after {
		border: none;
	}

	.qty-num {
		font-size: 30rpx;
		color: #333;
		min-width: 60rpx;
		text-align: center;
	}

	.popup-footer {
		display: flex;
		gap: 20rpx;
		padding: 20rpx 30rpx;
		padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
		border-top: 1rpx solid #f5f5f5;
	}

	.popup-btn {
		flex: 1;
		height: 80rpx;
		line-height: 80rpx;
		text-align: center;
		border-radius: 40rpx;
		font-size: 28rpx;
		font-weight: 500;
	}

	.cart-btn {
		background: #fff0f0;
		color: #ff6b6b;
		border: 2rpx solid #ff6b6b;
	}

	.buy-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
	}
</style>
