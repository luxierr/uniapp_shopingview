'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
	const { goodsId } = event;
	
	if (!goodsId) {
		return {
			code: 1,
			msg: '缺少商品ID',
			data: null
		};
	}
	
	try {
		// 查询商品详情（假设商品表名为products）
		const res = await db.collection('products').doc(goodsId).get();
		
		if (res.data && res.data.length > 0) {
			return {
				code: 0,
				msg: 'success',
				data: res.data[0]
			};
		} else {
			return {
				code: 2,
				msg: '商品不存在',
				data: null
			};
		}
	} catch (err) {
		console.error('查询商品详情失败:', err);
		return {
			code: 500,
			msg: '服务器错误',
			data: null
		};
	}
};