'use strict';
exports.main = async (event, context) => {
	const db = uniCloud.database();
	const collection = db.collection('posts');

	// 每页条数
	const pageSize = event.pageSize || 10;

	// 当前页码（默认第一页）
	const pageNum = event.pageNum || 1;

	// 计算跳过的条数
	const skip = (pageNum - 1) * pageSize;

	// 按 createTime 倒序查询
	const q = collection.orderBy('createTime', 'desc');

	// 先查询总数（可选，用于前端判断总页数）
	const countRes = await collection.count();
	const total = countRes.total;

	// 分页查询
	const res = await q.skip(skip).limit(pageSize).get();

	return {
		code: 0,
		msg: '查询成功',
		data: res.data,
		pagination: {
			pageNum,
			pageSize,
			total,
			totalPages: Math.ceil(total / pageSize)
		}
	};
};