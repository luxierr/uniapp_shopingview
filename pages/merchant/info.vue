<template>
	<view class="feed-container">
		<!-- 顶部导航 -->
		<view class="feed-header">
			<text class="feed-title">商家动态</text>
		</view>

		<scroll-view scroll-y class="feed-scroll" refresher-enabled :refresher-triggered="refreshing"
			@refresherrefresh="onRefresh" @scrolltolower="loadMore">
			<!-- 发布框（仅管理员可见，这里预留） -->
			<view class="publish-box" v-if="isAdmin" @click="goPublish">
				<image class="pub-avatar" :src="userAvatar" mode="aspectFill"></image>
				<view class="pub-input">
					<text>分享新鲜事...</text>
				</view>
			</view>

			<!-- 动态列表 -->
			<view class="feed-list">
				<view class="feed-item" v-for="(item, index) in feedList" :key="index">
					<!-- 发布者信息 -->
					<view class="feed-author">
						<image class="author-avatar" :src="item.authorAvatar" mode="aspectFill"></image>
						<view class="author-info">
							<text class="author-name">{{ item.authorName }}</text>
							<text class="feed-time">{{ formatTime(item.publishTime) }}</text>
						</view>
						<view class="feed-tag" v-if="item.isTop">置顶</view>
					</view>

					<!-- 文字内容 -->
					<view class="feed-text" @click="goDetail(item)">
						<text class="feed-title-text" v-if="item.title">{{ item.title }}</text>
						<text class="feed-content">{{ item.content }}</text>
					</view>

					<!-- 媒体内容 -->
					<view class="feed-media" v-if="item.images && item.images.length">
						<view class="media-grid" :class="'grid-' + getGridClass(item.images.length)">
							<image v-for="(img, imgIndex) in item.images.slice(0, 9)" :key="imgIndex" :src="img"
								mode="aspectFill" @click="previewImage(img, item.images)"></image>
						</view>
					</view>

					<view class="feed-video" v-if="item.video">
						<video :src="item.video" controls :poster="item.videoPoster"
							style="width: 100%; height: 400rpx; border-radius: 12rpx;"></video>
					</view>

					<!-- 互动栏 -->
					<view class="feed-actions">
						<view class="action-item" @click="toggleLike(index)">
							<uni-icons :type="item.isLiked ? 'heart-filled' : 'heart'" size="18"
								:color="item.isLiked ? '#ff6b6b' : '#999'"></uni-icons>
							<text :class="{ liked: item.isLiked }">{{ item.likeCount || '点赞' }}</text>
						</view>
						<view class="action-item" @click="goDetail(item)">
							<uni-icons type="chatbubble" size="18" color="#999"></uni-icons>
							<text>{{ item.commentCount || '评论' }}</text>
						</view>
						<view class="action-item">
							<uni-icons type="eye" size="18" color="#999"></uni-icons>
							<text>{{ item.viewCount || 0 }}</text>
						</view>
						<view class="action-item share" @click="shareFeed(item)">
							<uni-icons type="redo" size="18" color="#999"></uni-icons>
							<text>分享</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 空状态 -->
			<view class="empty-state" v-if="feedList.length === 0 && !loading">
				<uni-icons type="paperplane" size="60" color="#ddd"></uni-icons>
				<text class="empty-text">暂无动态</text>
				<text class="empty-sub">商家暂未发布任何内容</text>
			</view>

			<!-- 加载更多 -->
			<view class="load-more" v-if="feedList.length > 0">
				<text v-if="loading">加载中...</text>
				<text v-else-if="noMore">没有更多了</text>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				isAdmin: false,
				userAvatar: '/static/logo.png',
				feedList: [],
				refreshing: false,
				loading: false,
				noMore: false,
				page: 1,
				pageSize: 10
			};
		},
		onLoad() {
			this.loadFeedList();
		},
		methods: {
			// 加载动态列表
			async loadFeedList() {
				if (this.loading || this.noMore) return;
				this.loading = true;
				try {
					const res = await uniCloud.callFunction({
						name: 'article',
						data: {
							action: 'getList',
							params: {
								page: this.page,
								pageSize: this.pageSize,
								status: 1
							}
						}
					});
					if (res.result.code === 0 && res.result.data.length) {
						const list = res.result.data.map(item => ({
							_id: item._id,
							title: item.title,
							content: item.content || item.excerpt,
							images: item.images || (item.avatar ? [item.avatar] : []),
							video: item.video,
							videoPoster: item.videoPoster,
							authorName: item.author?.nickname || '官方账号',
							authorAvatar: item.author?.avatar || '/static/logo.png',
							publishTime: item.publish_date || item.create_date,
							likeCount: item.like_count || 0,
							commentCount: item.comment_count || 0,
							viewCount: item.view_count || 0,
							isTop: item.is_sticky,
							isLiked: false
						}));
						this.feedList = this.page === 1 ? list : [...this.feedList, ...list];
						this.noMore = list.length < this.pageSize;
					} else {
						if (this.page === 1) this.feedList = this.getMockFeed();
						this.noMore = true;
					}
				} catch (e) {
					if (this.page === 1) this.feedList = this.getMockFeed();
					this.noMore = true;
				}
				this.loading = false;
			},
			getMockFeed() {
				return [
					{
						_id: '1',
						title: '新品上市公告',
						content: '春季新款已经全面上架，限时8折优惠，欢迎大家前来选购！本季主打清新简约风格，面料舒适透气，适合日常通勤和休闲穿搭。',
						images: [
							'https://picsum.photos/400/400?random=31',
							'https://picsum.photos/400/400?random=32',
							'https://picsum.photos/400/400?random=33'
						],
						authorName: '官方账号',
						authorAvatar: '/static/logo.png',
						publishTime: Date.now() - 3600000,
						likeCount: 128,
						commentCount: 23,
						viewCount: 1024,
						isTop: true,
						isLiked: false
					},
					{
						_id: '2',
						title: '',
						content: '感谢各位顾客一直以来的支持，我们将在本周六举办会员专场活动，会员专享额外9.5折优惠，更有精美礼品赠送！',
						images: [
							'https://picsum.photos/400/400?random=34',
							'https://picsum.photos/400/400?random=35'
						],
						authorName: '客服小王',
						authorAvatar: '/static/logo.png',
						publishTime: Date.now() - 86400000,
						likeCount: 86,
						commentCount: 15,
						viewCount: 567,
						isTop: false,
						isLiked: false
					},
					{
						_id: '3',
						title: '店铺环境升级',
						content: '为了给顾客提供更好的购物体验，我们对店铺进行了全面升级改造，新增了休息区和儿童游乐区，欢迎带家人一起来！',
						images: [
							'https://picsum.photos/400/400?random=36',
							'https://picsum.photos/400/400?random=37',
							'https://picsum.photos/400/400?random=38',
							'https://picsum.photos/400/400?random=39'
						],
						authorName: '官方账号',
						authorAvatar: '/static/logo.png',
						publishTime: Date.now() - 172800000,
						likeCount: 256,
						commentCount: 45,
						viewCount: 2341,
						isTop: false,
						isLiked: false
					},
					{
						_id: '4',
						title: '',
						content: '温馨提示：春节期间配送时间可能延长，请各位顾客提前下单，感谢您的理解与配合。',
						images: [],
						authorName: '官方账号',
						authorAvatar: '/static/logo.png',
						publishTime: Date.now() - 259200000,
						likeCount: 45,
						commentCount: 8,
						viewCount: 321,
						isTop: false,
						isLiked: false
					}
				];
			},
			// 刷新
			onRefresh() {
				this.refreshing = true;
				this.page = 1;
				this.noMore = false;
				this.loadFeedList().then(() => {
					this.refreshing = false;
				});
			},
			// 加载更多
			loadMore() {
				if (!this.noMore && !this.loading) {
					this.page++;
					this.loadFeedList();
				}
			},
			// 格式化时间
			formatTime(timestamp) {
				if (!timestamp) return '';
				const now = Date.now();
				const diff = now - timestamp;
				if (diff < 60000) return '刚刚';
				if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
				if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
				if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
				const date = new Date(timestamp);
				return `${date.getMonth() + 1}月${date.getDate()}日`;
			},
			// 获取网格类名
			getGridClass(count) {
				if (count === 1) return 'one';
				if (count === 2 || count === 4) return 'two';
				return 'three';
			},
			// 预览图片
			previewImage(current, urls) {
				uni.previewImage({ current, urls });
			},
			// 点赞
			toggleLike(index) {
				const item = this.feedList[index];
				item.isLiked = !item.isLiked;
				item.likeCount += item.isLiked ? 1 : -1;
			},
			// 去详情
			goDetail(item) {
				uni.navigateTo({
					url: `/pages/list/detail?id=${item._id}&title=${encodeURIComponent(item.title || '')}`
				});
			},
			// 分享
			shareFeed(item) {
				uni.showShareMenu({
					withShareTicket: true,
					menus: ['shareAppMessage', 'shareTimeline']
				});
			},
			// 去发布（管理员）
			goPublish() {
				uni.navigateTo({ url: '/pages/merchant/publish' });
			}
		}
	};
</script>

<style scoped>
	.feed-container {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background-color: #f5f5f5;
	}

	/* 顶部导航 */
	.feed-header {
		height: 88rpx;
		background: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.feed-title {
		font-size: 34rpx;
		font-weight: bold;
		color: #333;
	}

	/* 滚动区域 */
	.feed-scroll {
		flex: 1;
	}

	/* 发布框 */
	.publish-box {
		display: flex;
		align-items: center;
		gap: 20rpx;
		padding: 24rpx 30rpx;
		background: #fff;
		margin-bottom: 16rpx;
	}

	.pub-avatar {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		background: #f5f5f5;
	}

	.pub-input {
		flex: 1;
		height: 72rpx;
		background: #f5f5f5;
		border-radius: 36rpx;
		padding: 0 30rpx;
		display: flex;
		align-items: center;
	}

	.pub-input text {
		color: #999;
		font-size: 28rpx;
	}

	/* 动态列表 */
	.feed-list {
		padding-bottom: 20rpx;
	}

	.feed-item {
		background: #fff;
		margin-bottom: 16rpx;
		padding: 30rpx;
	}

	/* 发布者信息 */
	.feed-author {
		display: flex;
		align-items: center;
		gap: 20rpx;
		margin-bottom: 20rpx;
	}

	.author-avatar {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		background: #f5f5f5;
	}

	.author-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}

	.author-name {
		font-size: 30rpx;
		color: #576b95;
		font-weight: 500;
	}

	.feed-time {
		font-size: 24rpx;
		color: #999;
	}

	.feed-tag {
		padding: 4rpx 16rpx;
		background: #ff6b6b;
		color: #fff;
		font-size: 22rpx;
		border-radius: 8rpx;
	}

	/* 文字内容 */
	.feed-text {
		display: flex;
		flex-direction: column;
		gap: 12rpx;
		margin-bottom: 20rpx;
	}

	.feed-title-text {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	.feed-content {
		font-size: 30rpx;
		color: #333;
		line-height: 1.6;
	}

	/* 媒体内容 */
	.feed-media {
		margin-bottom: 20rpx;
	}

	.media-grid {
		display: grid;
		gap: 8rpx;
	}

	.media-grid.one {
		grid-template-columns: 1fr;
	}

	.media-grid.one image {
		width: 100%;
		height: 400rpx;
		border-radius: 12rpx;
	}

	.media-grid.two {
		grid-template-columns: repeat(2, 1fr);
	}

	.media-grid.two image {
		width: 100%;
		height: 300rpx;
		border-radius: 12rpx;
	}

	.media-grid.three {
		grid-template-columns: repeat(3, 1fr);
	}

	.media-grid.three image {
		width: 100%;
		height: 220rpx;
		border-radius: 8rpx;
	}

	/* 互动栏 */
	.feed-actions {
		display: flex;
		align-items: center;
		padding-top: 20rpx;
		border-top: 1rpx solid #f5f5f5;
	}

	.action-item {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		font-size: 26rpx;
		color: #999;
	}

	.action-item text.liked {
		color: #ff6b6b;
	}

	.action-item.share {
		flex: 0.6;
	}

	/* 空状态 */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-top: 200rpx;
	}

	.empty-text {
		font-size: 30rpx;
		color: #999;
		margin-top: 20rpx;
	}

	.empty-sub {
		font-size: 26rpx;
		color: #ccc;
		margin-top: 10rpx;
	}

	/* 加载更多 */
	.load-more {
		text-align: center;
		padding: 30rpx 0;
		color: #999;
		font-size: 24rpx;
	}
</style>
