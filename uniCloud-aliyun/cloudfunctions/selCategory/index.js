'use strict';

exports.main = async (event, context) => {
	//event为客户端上传的参数
	console.log('event : ', event)
	const {
		key
	} = event;

	try {
		const db = uniCloud.database();
		const collection = db.collection('category'); // 分类表名

		const _ = db.command;
		const regex = db.RegExp;

		// 初始化查询对象
		let query = collection;

		// 判断key是否存在，不为null时进行模糊查询
		if (key !== null && key !== undefined && key !== '') {
			// 对分类名称进行模糊匹配，不区分大小写
			query = query.where({
				categorize_name: regex({
					regexp: key,
					options: 'i' // i表示不区分大小写
				})
			});
		}

		// 可以添加排序（如按排序号升序）
		query = query.orderBy('num', 'asc');

		// 执行查询
		const res = await query.get();

		// 统计符合条件的总数
		const countRes = await query.count();

		return {
			success: true,
			data: res.data,
			total: countRes.total,
			message: key ? `包含"${key}"的分类查询成功` : '全部分类查询成功'
		};




	} catch (err) {
		console.error('查询失败：', error);
		return {
			success: false,
			message: '查询失败：' + error.message
		};
	}
};