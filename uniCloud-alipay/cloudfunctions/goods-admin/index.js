'use strict';

/**
 * 商品管理云函数
 * 
 * 当前为预留结构，后续接入云端服务后可扩展以下功能：
 * - 商品批量上下架
 * - 库存校验与扣减
 * - 商品搜索（全文检索）
 * - 图片上传至云存储
 * - 数据权限校验
 */

const uniID = require('uni-id-common')

exports.main = async (event, context) => {
  const db = uniCloud.database()
  const uniIDIns = uniID.createInstance({ context: context })
  
  // 兼容 HTTP 请求
  if (event.headers) {
    if (event.httpMethod.toLocaleLowerCase() === 'get') {
      event = event.queryStringParameters;
    } else {
      event = JSON.parse(event.body);
    }
  }

  let params = event.data || event.params;
  let res = {}

  switch (event.action) {
    // 示例：批量更新商品状态
    case 'batchUpdateStatus':
      // res = await batchUpdateStatus(db, params)
      break;
    // 示例：批量更新商品库存
    case 'batchUpdateStock':
      // res = await batchUpdateStock(db, params)
      break;
    default:
      res = {
        code: 'INVALID_ACTION',
        message: '无效的操作类型'
      }
  }

  return res
}

// 预留：批量更新商品状态
async function batchUpdateStatus(db, params) {
  const { ids, status } = params
  return await db.collection('opendb-goods')
    .where({
      _id: db.command.in(ids)
    })
    .update({
      status,
      update_date: Date.now()
    })
}

// 预留：批量更新商品库存
async function batchUpdateStock(db, params) {
  const { items } = params
  const transaction = await db.startTransaction()
  try {
    for (let item of items) {
      await transaction.collection('opendb-goods')
        .doc(item.id)
        .update({
          stock: db.command.inc(item.num)
        })
    }
    await transaction.commit()
    return { success: true }
  } catch (err) {
    await transaction.rollback()
    return { success: false, err }
  }
}
