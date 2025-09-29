// 云函数入口文件
const db = uniCloud.database()
const dbCmd = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 获取前端传递的商品数据
    const { productdata } = event
    
    // 验证必要字段
    if (!productdata || !productdata.product_name) {
      return {
        code: 400,
        success: false,
        message: '商品名称不能为空'
      }
    }
    
    // 处理变体数据：过滤掉所有字段都为空的变体
    const filteredVariants = (productdata.variants || []).filter(variant => {
      // 检查变体对象是否所有字段都为空
      const isEmpty = Object.keys(variant).every(key => {
        const value = variant[key]
        return value === '' || value === null || value === undefined
      })
      return !isEmpty
    })
    
    // 获取当前时间（适配阿里云环境）
    const currentTime = new Date()
    const timeStr = currentTime.toISOString() // 转换为ISO标准时间字符串
    
    // 转换价格和库存为数字类型
    const processedData = {
      ...productdata,
      // 转换主价格为数字
      price: productdata.price ? Number(productdata.price) : 0,
      // 转换总库存为数字
      inventory: productdata.inventory ? Number(productdata.inventory) : 0,
      // 使用过滤后的变体
      variants: filteredVariants.map(variant => ({
        ...variant,
        // 转换变体价格为数字
        price: variant.price ? Number(variant.price) : 0,
        // 转换变体库存为数字
        stock: variant.stock ? Number(variant.stock) : 0
      })),
      // 修改时间字段处理方式，适配阿里云
      createTime: timeStr,
      updateTime: timeStr,
      // 也可以使用时间戳
      // createTime: currentTime.getTime(),
      // updateTime: currentTime.getTime()
    }
    
    // 插入数据到数据库
    const result = await db.collection('products').add(processedData)
    
    return {
      code: 200,
      success: true,
      message: '商品数据保存成功',
      data: {
        id: result.id
      }
    }
  } catch (err) {
    console.error('保存商品数据失败：', err)
    return {
      code: 500,
      success: false,
      message: '保存商品数据失败',
      error: err.message
    }
  }
}
    