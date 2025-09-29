'use strict';
const uniID = require('uni-id')

exports.main = async (event, context) => {
  const { username, password, mobile, email } = event;
  
  // 准备注册参数
  const registerParams = {
    username,
    password,
    mobile,
    email,
    // 新增余额字段，默认为0
    balance: 0
  };
  
  // 调用uniID注册方法
  const res = await uniID.register(registerParams);
  
  return res;
};
