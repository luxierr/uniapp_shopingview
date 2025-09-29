'use strict';
exports.main = async (event, context) => {
  // 获取数据库引用
  const db = uniCloud.database();
  // 获取分类集合的引用（请确保集合名称与你的数据库一致）
  const categoryCollection = db.collection('category');
  
  try {
    // 从事件参数中获取表单数据
    const { _id, categorize_name, num } = event;
    
    // 验证必要参数
    if (!_id) {
      return {
        success: false,
        message: '缺少分类ID'
      };
    }
    
    if (!categorize_name || !num) {
      return {
        success: false,
        message: '分类名称和排序号不能为空'
      };
    }
    
    // 执行更新操作：根据ID找到对应数据并更新
    const updateResult = await categoryCollection.doc(_id).update({
      categorize_name,  // 更新分类名称
      num,              // 更新排序号
      update_time: Date.now()  // 可选：添加更新时间戳
    });
    
    // 检查更新是否成功（影响的记录数大于0）
    if (updateResult.updated === 1) {
      return {
        success: true,
        message: '分类更新成功'
      };
    } else {
      return {
        success: false,
        message: '未找到对应分类或数据未发生变化'
      };
    }
  } catch (error) {
    // 捕获并处理错误
    console.error('更新分类失败：', error);
    return {
      success: false,
      message: '更新失败：' + error.message
    };
  }
};
