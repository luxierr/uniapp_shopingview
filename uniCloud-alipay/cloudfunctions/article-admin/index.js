'use strict';

/**
 * 推文管理云函数
 * 
 * 当前为预留结构，后续接入云端服务后可扩展以下功能：
 * - 推文发布/下架
 * - 浏览量统计
 * - 富文本内容处理
 * - 图片上传至云存储
 * - 数据权限校验
 * - 小程序端推文列表查询（带缓存）
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
    // 示例：发布推文
    case 'publishArticle':
      // res = await publishArticle(db, params)
      break;
    // 示例：小程序端获取已发布推文列表
    case 'getPublishedList':
      // res = await getPublishedList(db, params)
      break;
    // 示例：增加浏览量
    case 'incrementViewCount':
      // res = await incrementViewCount(db, params)
      break;
    default:
      res = {
        code: 'INVALID_ACTION',
        message: '无效的操作类型'
      }
  }

  return res
}

// 预留：发布推文（可添加审核逻辑）
async function publishArticle(db, params) {
  const { id } = params
  return await db.collection('opendb-articles')
    .doc(id)
    .update({
      status: 1,
      publish_date: Date.now(),
      update_date: Date.now()
    })
}

// 预留：小程序端获取已发布推文列表
async function getPublishedList(db, params) {
  const { page = 1, pageSize = 10 } = params
  return await db.collection('opendb-articles')
    .where({
      status: 1
    })
    .field('title,summary,cover,author,publish_date,sort,view_count')
    .orderBy('sort', 'desc')
    .orderBy('publish_date', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()
}

// 预留：增加浏览量
async function incrementViewCount(db, params) {
  const { id } = params
  return await db.collection('opendb-articles')
    .doc(id)
    .update({
      view_count: db.command.inc(1)
    })
}
