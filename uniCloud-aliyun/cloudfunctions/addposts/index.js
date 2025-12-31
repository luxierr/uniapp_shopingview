'use strict';
const db = uniCloud.database();
const collection = db.collection('posts');
exports.main = async (event, context) => {
	//event为客户端上传的参数
	console.log('event : ', event)

	const {
		content,
		isimage,
		url
	} = event.postdata;

	if (isimage && (!url || url.length === 0)) {
		return {
			code: -1,
			msg: '图片上传失败，url为空'
		};
	}

	try {
		// 插入数据库
		const res = await collection.add({
			content,
			isimage,
			url,
			createTime: Date.now() // 添加时间戳
		});

		return {
			code: 0,
			msg: '发布成功',
			data: res.id // 返回新增记录的 id
		};
	} catch (e) {
		return {
			code: -2,
			msg: '数据库错误',
			error: e.message
		};
	}
};