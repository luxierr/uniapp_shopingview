<template>
	<view class="ucenter-container">
		<!-- 顶部背景 -->
		<view class="header-bg">
			<view class="header-content">
				<!-- 用户信息 -->
				<view class="user-card" @click="toUserInfo">
					<image class="user-avatar" :src="userAvatar" mode="aspectFill"></image>
					<view class="user-info">
						<text class="user-name">{{ userName }}</text>
						<text class="user-level">{{ userLevel }}</text>
					</view>
					<view class="user-arrow">
						<uni-icons type="right" size="16" color="#fff"></uni-icons>
					</view>
				</view>
				<!-- 资产卡片 -->
				<view class="asset-card">
					<view class="asset-item" @click="goWallet">
						<text class="asset-num">{{ balance }}</text>
						<text class="asset-label">余额</text>
					</view>
					<view class="asset-item" @click="goCoupon">
						<text class="asset-num">{{ couponCount }}</text>
						<text class="asset-label">优惠券</text>
					</view>
					<view class="asset-item" @click="goPoints">
						<text class="asset-num">{{ points }}</text>
						<text class="asset-label">积分</text>
					</view>
					<view class="asset-item" @click="goFav">
						<text class="asset-num">{{ favCount }}</text>
						<text class="asset-label">收藏</text>
					</view>
				</view>
			</view>
		</view>

		<scroll-view scroll-y class="ucenter-scroll">
			<!-- 订单入口 -->
			<view class="section-card">
				<view class="section-header" @click="goOrders">
					<text class="section-title">我的订单</text>
					<view class="section-more">
						<text>查看全部</text>
						<uni-icons type="right" size="12" color="#999"></uni-icons>
					</view>
				</view>
				<view class="order-grid">
					<view class="order-item" v-for="(item, index) in orderStatus" :key="index"
						@click="goOrders(item.status)">
						<view class="order-icon-wrap">
							<uni-icons :type="item.icon" size="28" color="#666"></uni-icons>
							<text v-if="item.badge > 0" class="order-badge">{{ item.badge }}</text>
						</view>
						<text class="order-label">{{ item.label }}</text>
					</view>
				</view>
			</view>

			<!-- 功能网格 -->
			<view class="section-card">
				<view class="func-grid">
					<view class="func-item" v-for="(item, index) in funcList" :key="index" @click="handleFunc(item)">
						<view class="func-icon" :style="{ background: item.bg }">
							<uni-icons :type="item.icon" size="24" color="#fff"></uni-icons>
						</view>
						<text class="func-label">{{ item.label }}</text>
					</view>
				</view>
			</view>

			<!-- 列表菜单 -->
			<view class="menu-list">
				<view class="menu-item" v-for="(item, index) in menuList" :key="index" @click="handleMenu(item)">
					<view class="menu-left">
						<uni-icons :type="item.icon" size="22" :color="item.color || '#666'"></uni-icons>
						<text class="menu-label">{{ item.label }}</text>
					</view>
					<view class="menu-right">
						<text v-if="item.extra" class="menu-extra">{{ item.extra }}</text>
						<uni-icons type="right" size="14" color="#ccc"></uni-icons>
					</view>
				</view>
			</view>

			<!-- 版本号 -->
			<view class="version-info">
				<text>版本 {{ version }}</text>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	import {
		store
	} from '@/uni_modules/uni-id-pages/common/store.js';

	export default {
		data() {
			return {
				balance: '0.00',
				couponCount: 0,
				points: 0,
				favCount: 0,
				orderStatus: [
					{ icon: 'wallet', label: '待付款', status: 'unpaid', badge: 0 },
					{ icon: 'paperplane', label: '待发货', status: 'pending', badge: 0 },
					{ icon: 'cart', label: '待收货', status: 'shipped', badge: 2 },
					{ icon: 'chatbubble', label: '待评价', status: 'unrated', badge: 0 },
					{ icon: 'headphones', label: '售后', status: 'refund', badge: 0 }
				],
				funcList: [
					{ icon: 'star', label: '我的收藏', bg: 'linear-gradient(135deg, #fa709a, #fee140)', action: 'goFav' },
					{ icon: 'location', label: '收货地址', bg: 'linear-gradient(135deg, #667eea, #764ba2)', action: 'goAddress' },
					{ icon: 'ticket', label: '优惠券', bg: 'linear-gradient(135deg, #f093fb, #f5576c)', action: 'goCoupon' },
					{ icon: 'headphones', label: '在线客服', bg: 'linear-gradient(135deg, #4facfe, #00f2fe)', action: 'goService' },
					{ icon: 'gift', label: '积分商城', bg: 'linear-gradient(135deg, #43e97b, #38f9d7)', action: 'goPointsShop' },
					{ icon: 'flag', label: '我的足迹', bg: 'linear-gradient(135deg, #fa709a, #fee140)', action: 'goHistory' },
					{ icon: 'personadd', label: '邀请好友', bg: 'linear-gradient(135deg, #667eea, #764ba2)', action: 'goInvite' },
					{ icon: 'help', label: '帮助中心', bg: 'linear-gradient(135deg, #4facfe, #00f2fe)', action: 'goHelp' }
				],
				menuList: [
					{ icon: 'settings', label: '设置', color: '#666', action: 'goSettings' },
					{ icon: 'info', label: '关于我们', color: '#666', action: 'goAbout' },
					{ icon: 'phone', label: '联系客服', color: '#666', action: 'callService' },
					{ icon: 'compose', label: '意见反馈', color: '#666', action: 'goFeedback' }
				],
				version: '1.0.0'
			};
		},
		computed: {
			userInfo() {
				return store.userInfo || {};
			},
			hasLogin() {
				return store.hasLogin;
			},
			userName() {
				if (this.hasLogin) {
					return this.userInfo.nickname || this.userInfo.username || this.userInfo.mobile || '用户';
				}
				return '点击登录';
			},
			userAvatar() {
				if (this.hasLogin && this.userInfo.avatar_file?.url) {
					return this.userInfo.avatar_file.url;
				}
				return '/static/logo.png';
			},
			userLevel() {
				return this.hasLogin ? 'VIP会员' : '登录享受更多服务';
			}
		},
		onShow() {
			this.fetchUserData();
		},
		methods: {
			// 获取用户数据
			async fetchUserData() {
				if (!this.hasLogin) return;
				try {
					// 余额
					const balanceRes = await uniCloud.callFunction({
						name: 'user-asset',
						data: { action: 'getBalance' }
					});
					if (balanceRes.result.code === 0) {
						this.balance = balanceRes.result.data.toFixed(2);
					}
					// 订单数量
					const orderRes = await uniCloud.callFunction({
						name: 'order-service',
						data: { action: 'getOrderCount' }
					});
					if (orderRes.result.code === 0) {
						const counts = orderRes.result.data;
						this.orderStatus[0].badge = counts.unpaid || 0;
						this.orderStatus[1].badge = counts.pending || 0;
						this.orderStatus[2].badge = counts.shipped || 0;
						this.orderStatus[3].badge = counts.unrated || 0;
					}
				} catch (e) {
					console.log('获取用户数据失败，使用默认值');
				}
			},
			// 去用户信息
			toUserInfo() {
				if (!this.hasLogin) {
					uni.navigateTo({
						url: '/uni_modules/uni-id-pages/pages/login/login-withoutpwd'
					});
				} else {
					uni.navigateTo({
						url: '/uni_modules/uni-id-pages/pages/userinfo/userinfo'
					});
				}
			},
			// 订单
			goOrders(status) {
				if (!this.checkLogin()) return;
				uni.navigateTo({
					url: '/pages/order/list?status=' + (status || '')
				});
			},
			// 钱包
			goWallet() {
				if (!this.checkLogin()) return;
				uni.showToast({ title: '钱包功能开发中', icon: 'none' });
			},
			// 优惠券
			goCoupon() {
				if (!this.checkLogin()) return;
				uni.showToast({ title: '优惠券功能开发中', icon: 'none' });
			},
			// 积分
			goPoints() {
				if (!this.checkLogin()) return;
				uni.showToast({ title: '积分功能开发中', icon: 'none' });
			},
			// 收藏
			goFav() {
				if (!this.checkLogin()) return;
				uni.showToast({ title: '收藏功能开发中', icon: 'none' });
			},
			// 功能点击
			handleFunc(item) {
				if (!this.checkLogin()) return;
				switch (item.action) {
					case 'goAddress':
						uni.navigateTo({ url: '/pages/ucenter/address/address' });
						break;
					case 'goService':
						uni.navigateTo({ url: '/pages/ucenter/service/service' });
						break;
					default:
						uni.showToast({ title: item.label + '开发中', icon: 'none' });
				}
			},
			// 菜单点击
			handleMenu(item) {
				switch (item.action) {
					case 'goSettings':
						uni.navigateTo({ url: '/pages/ucenter/settings/settings' });
						break;
					case 'goAbout':
						uni.navigateTo({ url: '/pages/ucenter/about/about' });
						break;
					case 'goFeedback':
						uni.navigateTo({ url: '/uni_modules/uni-feedback/pages/opendb-feedback/opendb-feedback' });
						break;
					case 'callService':
						uni.makePhoneCall({ phoneNumber: '400-888-8888' });
						break;
					default:
						uni.showToast({ title: item.label, icon: 'none' });
				}
			},
			// 登录检查
			checkLogin() {
				if (!this.hasLogin) {
					uni.navigateTo({
						url: '/uni_modules/uni-id-pages/pages/login/login-withoutpwd'
					});
					return false;
				}
				return true;
			}
		}
	};
</script>

<style scoped>
	.ucenter-container {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background-color: #f5f5f5;
	}

	/* 顶部背景 */
	.header-bg {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: calc(var(--status-bar-height) + 20rpx) 30rpx 60rpx;
		border-radius: 0 0 40rpx 40rpx;
	}

	.header-content {
		display: flex;
		flex-direction: column;
		gap: 30rpx;
	}

	/* 用户卡片 */
	.user-card {
		display: flex;
		align-items: center;
		gap: 24rpx;
	}

	.user-avatar {
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		border: 4rpx solid rgba(255, 255, 255, 0.3);
		background: #fff;
	}

	.user-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8rpx;
	}

	.user-name {
		font-size: 36rpx;
		color: #fff;
		font-weight: bold;
	}

	.user-level {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.8);
	}

	.user-arrow {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* 资产卡片 */
	.asset-card {
		display: flex;
		background: rgba(255, 255, 255, 0.15);
		border-radius: 20rpx;
		padding: 24rpx 0;
		backdrop-filter: blur(10rpx);
	}

	.asset-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8rpx;
		position: relative;
	}

	.asset-item:not(:last-child)::after {
		content: '';
		position: absolute;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		width: 1rpx;
		height: 60%;
		background: rgba(255, 255, 255, 0.2);
	}

	.asset-num {
		font-size: 32rpx;
		color: #fff;
		font-weight: bold;
	}

	.asset-label {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.8);
	}

	/* 滚动区域 */
	.ucenter-scroll {
		flex: 1;
		padding: 0 20rpx;
	}

	/* 卡片通用 */
	.section-card {
		background: #fff;
		border-radius: 20rpx;
		margin-top: 20rpx;
		padding: 24rpx;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.section-title {
		font-size: 30rpx;
		font-weight: bold;
		color: #333;
	}

	.section-more {
		display: flex;
		align-items: center;
		gap: 4rpx;
		font-size: 26rpx;
		color: #999;
	}

	/* 订单网格 */
	.order-grid {
		display: flex;
		justify-content: space-between;
	}

	.order-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12rpx;
		padding: 10rpx 0;
	}

	.order-icon-wrap {
		position: relative;
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.order-badge {
		position: absolute;
		top: -6rpx;
		right: -6rpx;
		min-width: 32rpx;
		height: 32rpx;
		line-height: 32rpx;
		background: #ff6b6b;
		color: #fff;
		font-size: 20rpx;
		border-radius: 16rpx;
		text-align: center;
		padding: 0 8rpx;
	}

	.order-label {
		font-size: 24rpx;
		color: #666;
	}

	/* 功能网格 */
	.func-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 24rpx;
	}

	.func-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12rpx;
	}

	.func-icon {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.func-label {
		font-size: 24rpx;
		color: #666;
	}

	/* 菜单列表 */
	.menu-list {
		background: #fff;
		border-radius: 20rpx;
		margin-top: 20rpx;
		padding: 0 24rpx;
		margin-bottom: 20rpx;
	}

	.menu-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 28rpx 0;
		border-bottom: 1rpx solid #f5f5f5;
	}

	.menu-item:last-child {
		border-bottom: none;
	}

	.menu-left {
		display: flex;
		align-items: center;
		gap: 16rpx;
	}

	.menu-label {
		font-size: 28rpx;
		color: #333;
	}

	.menu-right {
		display: flex;
		align-items: center;
		gap: 8rpx;
	}

	.menu-extra {
		font-size: 26rpx;
		color: #999;
	}

	/* 版本信息 */
	.version-info {
		text-align: center;
		padding: 30rpx 0 40rpx;
		color: #ccc;
		font-size: 24rpx;
	}
</style>
