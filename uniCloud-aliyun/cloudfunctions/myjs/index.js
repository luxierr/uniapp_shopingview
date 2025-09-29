'use strict';
const db = uniCloud.database();
const dbCmd = db.command;

exports.main = async (event, context) => {
  try {
    const userCollection = db.collection('uni-id-users');
    
    // 步骤1：清除错误的balance对象（筛选包含operator属性的错误数据）
    await userCollection
      .where({
        // 错误的balance是包含operator的对象，以此为筛选条件
        'balance.operator': dbCmd.exists(true)
      })
      .update({
        balance: 0
      });
    
    // 步骤2：为完全没有balance字段的文档添加字段，值为0
    const res = await userCollection
      .where({
        balance: dbCmd.exists(false)
      })
      .update({
        balance: 0
      });
    
    return {
      code: 0,
      msg: 'balance字段已修正为0',
      data: {
        fixedCount: res.modifiedCount // 本次新增的文档数量
      }
    };
  } catch (e) {
    return {
      code: 1,
      msg: '修正字段失败',
      error: e.message
    };
  }
};
