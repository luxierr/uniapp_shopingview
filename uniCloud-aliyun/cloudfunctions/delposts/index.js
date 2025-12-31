'use strict';
exports.main = async (event, context) => {
	const db = uniCloud.database();
	  const collection = db.collection('posts');
	  const _id = event._id;
	
	  if (!_id) {
	    return { code: -1, msg: '_id 不能为空' };
	  }
	
	  try {
	    // 1. 查询这条帖子的数据
	    const doc = await collection.doc(_id).get();
	    if (!doc.data || doc.data.length === 0) {
	      return { code: -2, msg: '帖子不存在' };
	    }
	
	    const postData = doc.data[0];
	
	    // 2. 如果有 url，删除云存储文件
	    if (postData.url && Array.isArray(postData.url) && postData.url.length > 0) {
	      await uniCloud.deleteFile({
	        fileList: postData.url
	      });
	    }
	
	    // 3. 删除数据库记录
	    await collection.doc(_id).remove();
	
	    return { code: 0, msg: '删除成功' };
	  } catch (e) {
	    console.error('删除失败', e);
	    return { code: -3, msg: '删除失败', error: e.message };
	  }
};
