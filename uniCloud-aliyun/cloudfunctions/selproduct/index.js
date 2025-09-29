const db = uniCloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 从事件参数中获取key和category
    const { key, category } = event
    
    // 构建products表的查询条件
    let productWhere = {}
    
    // 如果key不为null，则添加name字段的模糊查询
    if (key !== null && key !== undefined && key !== '') {
      productWhere.name = db.RegExp({
        regexp: key,
        options: 'i', // 不区分大小写
      })
    }
    
    // 执行products表的查询
    const productsResult = await db.collection('products')
      .where(productWhere)
      .get()
      
    // 准备返回结果
    let result = {
      products: productsResult.data,
      product_category: []
    }
    
    // 如果category不为null，则查询product_category表
    if (category !== null && category !== undefined && category !== '') {
      const categoryResult = await db.collection('product_category')
        .where({
          category: category // 查询相同category的数据
        })
        .get()
        
      result.product_category = categoryResult.data
    }
    
    return {
      code: 0,
      message: '查询成功',
      data: result
    }
  } catch (err) {
    return {
      code: 1,
      message: '查询失败',
      error: err.message
    }
  }
}
