<template> 
	<view class="bodybox">
		<view class="topbox">
			
		</view>
		<view class="databox">
			<view class="leftbox">
				<view v-for="item in categorylist" :key="index">
					<view>{{item.categorize_name}}</view>
				</view>
			</view>
			<view class="rightbox">
				
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				categorylist:[],
				
			}
		},
		onLoad() {
			this.selshopcategory();
		},
		methods: {
			//查询分类列表
			selshopcategory(){
				uniCloud.callFunction({
					name:'selCategory',
					success: (res) => {
						console.log(res)
						this.categorylist=res.result.data
						// console.log(this.categorylist)
					},
					fail: (err) => {
						console.log(err)
					}
				})
			}
		}
	}
	
</script>

<style>
	.bodybox{
		height: 100vh;
		border: 1px solid red;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.topbox{
		width: 100%;
		height: 20vh;
		border: 1px solid blue;
	}
	.databox{
		width: 100%;
		height: 80vh;
		display: flex;
		flex-direction: row;
		border: 1px solid red;
	}
	.leftbox{
		width: 30%;
	}
	.rightbox{
		width: 70%;
		border: 1px solid #ccc;
	}
</style>