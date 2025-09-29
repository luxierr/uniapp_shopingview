'use strict';
 

exports.main = async (event, context) => {
  const { fileList } = event;
  
  try {
    // 调用uniCloud的删除文件API（阿里云已适配）
    const result = await uniCloud.deleteFile({
      fileList: fileList
    });
    
    console.log('文件删除成功:', result);
    return {
      code: 0,
      message: '删除成功',
      data: result.fileList
    };
  } catch (err) {
    console.error('文件删除失败:', err);
    return {
      code: -1,
      message: '删除失败: ' + err.message
    };
  }
};