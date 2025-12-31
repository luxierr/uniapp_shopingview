'use strict';
const Cart = require('../common/uni-stat/stat/mod/cart')

exports.main = async (event, context) => {
  const { action, params } = event
  const cart = new Cart()
  
  // 获取当前登录用户ID（根据项目实际登录机制调整）
  const uid = context.USER_ID || params.uid

  if (!uid) {
    return {
      code: 401,
      msg: '请先登录'
    }
  }

  params.uid = uid

  // 仅保留add（添加购物车）和getList（获取购物车）操作
  switch (action) {
    case 'add':
      return await cart.addItem(params)
    case 'getList':
      return await cart.getUserCart(uid)
    default:
      return {
        code: 400,
        msg: '未知操作，仅支持add/getList'
      }
  }
}