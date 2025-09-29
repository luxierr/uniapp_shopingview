'use strict';
exports.main = async (event, context) => {
  // 获取数据库引用
  const db = uniCloud.database();
  const categoryCollection = db.collection('category');
  
  try {
    const { _id } = event;
    
    // 验证ID是否存在
    if (!_id) {
      return {
        success: false,
        message: '缺少分类ID'
      };
    }
    
    // 先查询数据是否存在
    const queryResult = await categoryCollection.doc(_id).get();
    if (queryResult.data.length === 0) {
      return {
        success: false,
        message: '该分类不存在或已被删除'
      };
    }
    
    // 执行删除操作
    const deleteResult = await categoryCollection.doc(_id).remove();
    
    // 检查删除结果
    if (deleteResult.deleted === 1) {
      return {
        success: true,
        message: '分类删除成功'
      };
    } else {
      return {
        success: false,
        message: '删除失败，请重试'
      };
    }
  } catch (error) {
    console.error('删除分类出错:', error);
    return {
      success: false,
      message: '删除失败：' + error.message
    };
  }
};