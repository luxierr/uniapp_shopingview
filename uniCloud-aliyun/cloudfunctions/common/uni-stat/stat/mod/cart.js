/**
 * @class Cart 购物车模型
 * 适配现有商品结构：无变体、字段为product_name/inventory等
 */
const BaseMod = require('./base')
const { DateTime } = require('../lib')

module.exports = class Cart extends BaseMod {
  constructor() {
    super()
    this.tableName = 'cart-items' // 购物车数据表名
    this.goodsTable = 'goods' // 商品表名（请确认实际表名是否一致）
  }

  /**
   * 添加商品到购物车
   * @param {Object} params 商品参数
   * @param {String} params.uid 用户ID
   * @param {String} params.goodsId 商品ID
   * @param {Number} params.quantity 商品数量（正整数）
   */
  async addItem(params) {
    // 1. 基础参数验证
    if (!params.uid || !params.goodsId || !params.quantity) {
      return {
        code: 400,
        msg: '缺少必要参数（uid、goodsId、quantity）'
      }
    }
    // 验证数量为正整数
    if (!Number.isInteger(params.quantity) || params.quantity < 1) {
      return {
        code: 400,
        msg: '商品数量必须为正整数'
      }
    }

    // 2. 验证商品是否存在且可购买
    const goodsRes = await this.getCollection(this.goodsTable)
      .doc(params.goodsId)
      .field({ _id: 1, islist: 1, inventory: 1 }) // 仅查询必要字段
      .get()
    
    if (!goodsRes.data || goodsRes.data.length === 0) {
      return {
        code: 404,
        msg: '商品不存在'
      }
    }
    const goods = goodsRes.data[0]
    // 验证商品是否上架
    if (goods.islist !== true) {
      return {
        code: 403,
        msg: '该商品已下架，无法加入购物车'
      }
    }
    // 验证库存是否充足
    if (goods.inventory < params.quantity) {
      return {
        code: 403,
        msg: `库存不足，当前仅剩余${goods.inventory}件`
      }
    }

    // 3. 检查该商品是否已在用户购物车中
    const existItem = await this.getCollection(this.tableName).where({
      uid: params.uid,
      goodsId: params.goodsId
    }).limit(1).get()

    const dateTime = new DateTime()
    let res

    if (existItem.data && existItem.data.length > 0) {
      // 已存在：更新数量（累加）
      const itemId = existItem.data[0]._id
      const newQuantity = existItem.data[0].quantity + params.quantity
      
      // 再次验证累加后的数量是否超过库存
      if (newQuantity > goods.inventory) {
        return {
          code: 403,
          msg: `库存不足，当前仅剩余${goods.inventory}件，购物车已有${existItem.data[0].quantity}件`
        }
      }

      res = await this.getCollection(this.tableName).doc(itemId).update({
        quantity: newQuantity,
        update_time: dateTime.getTime()
      })
    } else {
      // 不存在：新增购物车记录
      const cartItem = {
        uid: params.uid,
        goodsId: params.goodsId,
        quantity: params.quantity,
        is_selected: true, // 默认选中
        create_time: dateTime.getTime(),
        update_time: dateTime.getTime()
      }
      res = await this.insert(this.tableName, cartItem)
    }

    // 4. 返回结果
    if (res && (res.updated || res.inserted)) {
      return {
        code: 0,
        msg: '添加购物车成功',
        data: {
          goodsId: params.goodsId,
          quantity: existItem.data ? existItem.data[0].quantity + params.quantity : params.quantity
        }
      }
    } else {
      return {
        code: 500,
        msg: '添加购物车失败',
        data: res
      }
    }
  }

  /**
   * 获取用户购物车列表（关联商品表获取最新商品信息）
   * @param {String} uid 用户ID
   */
  async getUserCart(uid) {
    if (!uid) {
      return {
        code: 400,
        msg: '用户ID不能为空'
      }
    }

    // 聚合查询：关联商品表，获取最新的商品信息
    const res = await this.getCollection(this.tableName).aggregate()
      .match({ uid }) // 筛选当前用户的购物车
      .lookup({
        from: this.goodsTable,
        localField: 'goodsId',
        foreignField: '_id',
        as: 'goodsInfo'
      })
      .unwind({
        path: '$goodsInfo',
        preserveNullAndEmptyArrays: true // 保留商品不存在的记录
      })
      .project({
        // 购物车基础字段
        _id: 1,
        uid: 1,
        goodsId: 1,
        quantity: 1,
        is_selected: 1,
        create_time: 1,
        update_time: 1,
        // 商品关联字段（适配现有商品结构）
        product_name: '$goodsInfo.product_name', // 商品名称
        price: '$goodsInfo.price', // 商品价格
        inventory: '$goodsInfo.inventory', // 商品库存
        image: '$goodsInfo.image', // 商品图片
        islist: '$goodsInfo.islist', // 是否上架
        describe: '$goodsInfo.describe', // 商品描述
        product_category: '$goodsInfo.product_category' // 商品分类
      })
      .end()

    // 处理商品无效/下架的情况
    const cartList = res.data.map(item => {
      // 标记无效商品
      if (!item.goodsInfo) {
        item.is_valid = false
        item.invalid_reason = '商品已删除'
      } else if (item.islist !== true) {
        item.is_valid = false
        item.invalid_reason = '商品已下架'
      } else {
        item.is_valid = true
        // 标记库存不足
        item.stock_insufficient = item.quantity > item.inventory
      }
      // 移除临时字段
      delete item.goodsInfo
      return item
    })

    return {
      code: 0,
      msg: '获取购物车成功',
      data: cartList
    }
  }
}