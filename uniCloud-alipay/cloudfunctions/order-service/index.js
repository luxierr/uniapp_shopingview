'use strict';

/**
 * 订单服务云函数
 * 
 * 功能：
 * 1. 物流查询 - 对接第三方物流API（快递100/阿里云等）
 * 2. 自动收货 - 定时任务扫描超时订单
 * 3. 订单状态流转 - 支付、发货、确认收货、取消
 * 
 * 使用说明：
 * - 物流查询需要在下方配置你的快递100授权信息（key和customer）
 * - 自动收货通过 uniCloud 定时触发器每天执行
 */

const uniID = require('uni-id-common')

// ==================== 物流查询配置 ====================
// 快递100实时查询API配置（请替换为你自己的授权信息）
// 申请地址：https://www.kuaidi100.com/openapi/
const KUAIDI100_CONFIG = {
  enabled: false, // 启用前改为 true
  key: 'your_kuaidi100_key_here',
  customer: 'your_kuaidi100_customer_here',
  queryUrl: 'https://poll.kuaidi100.com/poll/query.do',
  // 快递公司编码映射（快递100标准编码）
  companyMap: {
    '顺丰': 'shunfeng',
    '顺丰速运': 'shunfeng',
    '中通': 'zhongtong',
    '中通快递': 'zhongtong',
    '圆通': 'yuantong',
    '圆通速递': 'yuantong',
    '申通': 'shentong',
    '申通快递': 'shentong',
    '韵达': 'yunda',
    '韵达快递': 'yunda',
    'EMS': 'ems',
    '邮政': 'ems',
    '京东': 'jd',
    '京东物流': 'jd',
    '德邦': 'debangwuliu',
    '德邦快递': 'debangwuliu',
    '极兔': 'jtexpress',
    '极兔速递': 'jtexpress',
    '菜鸟': 'cainiao',
    '百世': 'huitongkuaidi',
    '百世快递': 'huitongkuaidi'
  }
}

// 自动收货配置
const AUTO_RECEIVE_CONFIG = {
  // 发货后多少天自动确认收货（单位：天）
  autoReceiveDays: 7,
  // 是否启用自动收货
  enabled: true
}

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
    // 查询物流轨迹
    case 'queryLogistics':
      res = await queryLogistics(params)
      break;
    // 自动收货（定时触发器调用）
    case 'autoReceive':
      res = await autoReceiveOrders(db)
      break;
    // 手动确认收货
    case 'confirmReceive':
      res = await confirmReceive(db, params)
      break;
    // 取消订单
    case 'cancelOrder':
      res = await cancelOrder(db, params)
      break;
    // 模拟支付（测试用）
    case 'mockPay':
      res = await mockPay(db, params)
      break;
    default:
      res = {
        code: 'INVALID_ACTION',
        message: '无效的操作类型'
      }
  }

  return res
}

// ==================== 物流查询 ====================
async function queryLogistics(params) {
  const { trackingCompany, trackingNo } = params

  if (!trackingNo) {
    return { code: 'PARAM_ERROR', message: '物流单号不能为空' }
  }

  // 如果未启用快递100，返回模拟数据（开发测试用）
  if (!KUAIDI100_CONFIG.enabled) {
    return {
      code: 'SUCCESS',
      message: '物流查询配置未启用，返回模拟数据。请配置 KUAIDI100_CONFIG 后使用真实接口。',
      data: {
        nu: trackingNo,
        com: trackingCompany || 'unknown',
        state: '3',
        status: '200',
        data: [
          { time: formatDate(Date.now()), context: '【模拟数据】快件已签收，感谢您使用' + (trackingCompany || '快递') + '，期待再次为您服务' },
          { time: formatDate(Date.now() - 86400000), context: '【模拟数据】快件到达派送网点' },
          { time: formatDate(Date.now() - 172800000), context: '【模拟数据】快件运输中' },
          { time: formatDate(Date.now() - 259200000), context: '【模拟数据】快件已揽收' }
        ]
      }
    }
  }

  // 获取快递公司编码
  let comCode = KUAIDI100_CONFIG.companyMap[trackingCompany] || ''

  // 构造快递100请求参数
  const param = {
    com: comCode,
    num: trackingNo,
    phone: '', // 收件人或寄件人手机号后四位（部分快递需要）
    resultv2: '1'
  }

  const sign = require('crypto').createHash('md5').update(JSON.stringify(param) + KUAIDI100_CONFIG.key + KUAIDI100_CONFIG.customer).digest('hex').toUpperCase()

  try {
    const response = await uniCloud.httpclient.request(KUAIDI100_CONFIG.queryUrl, {
      method: 'POST',
      data: {
        customer: KUAIDI100_CONFIG.customer,
        sign: sign,
        param: JSON.stringify(param)
      },
      dataType: 'json',
      timeout: 10000
    })

    const result = response.data

    if (result.status === '200' || result.message === 'ok') {
      return {
        code: 'SUCCESS',
        data: result
      }
    } else {
      return {
        code: 'QUERY_FAILED',
        message: result.message || '物流查询失败',
        data: result
      }
    }
  } catch (err) {
    return {
      code: 'REQUEST_ERROR',
      message: err.message || '请求物流接口失败'
    }
  }
}

// ==================== 自动收货 ====================
async function autoReceiveOrders(db) {
  if (!AUTO_RECEIVE_CONFIG.enabled) {
    return { code: 'DISABLED', message: '自动收货功能已禁用' }
  }

  const autoReceiveTime = Date.now() - (AUTO_RECEIVE_CONFIG.autoReceiveDays * 24 * 60 * 60 * 1000)

  try {
    // 查询已发货且超过自动确认时间的订单
    const pendingOrders = await db.collection('opendb-orders')
      .where({
        status: 2, // 已发货
        ship_time: db.command.lt(autoReceiveTime),
        complete_time: db.command.exists(false)
      })
      .field('_id,ship_time')
      .limit(100)
      .get()

    const orders = pendingOrders.data || []

    if (orders.length === 0) {
      return { code: 'SUCCESS', message: '没有需要自动收货的订单', updatedCount: 0 }
    }

    // 批量更新为已完成
    const ids = orders.map(item => item._id)
    const updateRes = await db.collection('opendb-orders')
      .where({
        _id: db.command.in(ids)
      })
      .update({
        status: 3,
        complete_time: Date.now(),
        update_date: Date.now()
      })

    return {
      code: 'SUCCESS',
      message: `成功自动确认收货 ${orders.length} 个订单`,
      updatedCount: orders.length,
      orderIds: ids
    }
  } catch (err) {
    return {
      code: 'ERROR',
      message: err.message || '自动收货执行失败'
    }
  }
}

// ==================== 手动确认收货 ====================
async function confirmReceive(db, params) {
  const { orderId, userId } = params

  try {
    const orderRes = await db.collection('opendb-orders').doc(orderId).field('user_id,status').get()
    const order = orderRes.data[0]

    if (!order) {
      return { code: 'NOT_FOUND', message: '订单不存在' }
    }

    if (order.user_id !== userId) {
      return { code: 'FORBIDDEN', message: '无权操作此订单' }
    }

    if (order.status !== 2) {
      return { code: 'INVALID_STATUS', message: '订单状态不是已发货，无法确认收货' }
    }

    await db.collection('opendb-orders').doc(orderId).update({
      status: 3,
      complete_time: Date.now(),
      update_date: Date.now()
    })

    return { code: 'SUCCESS', message: '确认收货成功' }
  } catch (err) {
    return { code: 'ERROR', message: err.message || '确认收货失败' }
  }
}

// ==================== 取消订单 ====================
async function cancelOrder(db, params) {
  const { orderId, userId } = params

  try {
    const orderRes = await db.collection('opendb-orders').doc(orderId).field('user_id,status').get()
    const order = orderRes.data[0]

    if (!order) {
      return { code: 'NOT_FOUND', message: '订单不存在' }
    }

    // 管理员或订单本人可以取消
    if (order.user_id !== userId) {
      // 这里可以添加管理员权限校验
    }

    if (order.status > 1) {
      return { code: 'INVALID_STATUS', message: '订单已发货，无法取消' }
    }

    await db.collection('opendb-orders').doc(orderId).update({
      status: 4,
      cancel_time: Date.now(),
      update_date: Date.now()
    })

    return { code: 'SUCCESS', message: '订单已取消' }
  } catch (err) {
    return { code: 'ERROR', message: err.message || '取消订单失败' }
  }
}

// ==================== 模拟支付（测试用） ====================
async function mockPay(db, params) {
  const { orderId } = params

  try {
    await db.collection('opendb-orders').doc(orderId).update({
      status: 1,
      pay_time: Date.now(),
      update_date: Date.now()
    })
    return { code: 'SUCCESS', message: '模拟支付成功' }
  } catch (err) {
    return { code: 'ERROR', message: err.message || '支付失败' }
  }
}

// ==================== 工具函数 ====================
function formatDate(timestamp) {
  const date = new Date(timestamp)
  const pad = n => n < 10 ? '0' + n : n
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
