'use strict';

exports.main = async (event, context) => {
  const db = uniCloud.database();
  const collection = db.collection('products');
  const { id } = event;
  
  if (!id) {
    return {
      code: -1,
      message: '缺少产品ID'
    };
  }
  
  try {
    // 1. 先查询要删除的产品信息，获取图片列表
    const productRes = await collection.doc(id).get();
    if (productRes.data.length === 0) {
      return {
        code: -2,
        message: '未找到对应的产品'
      };
    }
    
    const product = productRes.data[0];
    const images = product.image || [];
    
    // 2. 批量删除云端图片
    if (images.length > 0) {
      // 提取所有图片的cloudPath
      const filePaths = images.map(img => img.cloudPath);
      
      // 调用云存储API删除文件
      const deleteFilesRes = await uniCloud.deleteFile({
        fileList: filePaths
      });
      
      // 检查是否有删除失败的文件
      if (deleteFilesRes.failList && deleteFilesRes.failList.length > 0) {
        console.warn('部分图片删除失败:', deleteFilesRes.failList);
      }
    }
    
    // 3. 删除数据库中的产品记录
    const deleteRes = await collection.doc(id).remove();
    
    return {
      code: 0,
      message: '产品及关联图片删除成功',
      data: {
        deleted: deleteRes.deleted,
        imageCount: images.length
      }
    };
  } catch (error) {
    console.error('删除产品失败:', error);
    return {
      code: -3,
      message: '删除失败',
      error: error.message
    };
  }
};
