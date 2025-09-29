'use strict';
const db = uniCloud.database();
const collection = db.collection('category'); // 分类表名

exports.main = async (event, context) => {
  const { categorize_name, num = 0 } = event;
  
  // 验证参数
  if (!categorize_name) {
    return {
      code: 400,
      message: '分类名称不能为空',
      success: false
    };
  }
  
  try {
    // 检查分类名称是否已存在
    const checkResult = await collection.where({
      categorize_name: categorize_name
    }).get();
    
    if (checkResult.data && checkResult.data.length > 0) {
      return {
        code: 400,
        message: '该分类名称已存在',
        success: false
      };
    }
    
    // 生成唯一ID，可以使用数据库自增ID或UUID
    // 这里使用时间戳+随机数简单生成
    const id = Date.now().toString() + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    // 添加数据
    const result = await collection.add({
      id: id,
      categorize_name: categorize_name,
      num: num,
      create_time: new Date().getTime() // 时间戳格式
    });
    
    return {
      code: 200,
      message: '分类添加成功',
      success: true,
      data: {
        id: id,
        ...event,
        create_time: new Date().getTime()
      }
    };
  } catch (error) {
    console.error('添加分类失败:', error);
    return {
      code: 500,
      message: '添加分类失败',
      success: false,
      error: error.message
    };
  }
};
