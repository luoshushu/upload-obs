# 文档



### 安装
```
yarn add upload-obs
```

### 使用

upload.js
```
const uploadObs =  require('upload-obs')
const xxx = new uploadObs({
  prefix: '', //非必填 
  accessKeyId: '',//必填
  secretAccessKey: '', //必填
  obsServer: '',//必填 服务器 https://developer.huaweicloud.com/endpoint
  obsBucket: '', //必填
  autoDeleteFile:true,//非必填，删除桶数据
  distName:'dist',//非必填 上传的文件夹名称  默认build之后的文件dist.
})
xxx.init()
```
- distName说明: distName为dist，会把dist文件夹下所有文件都上传
- prefix说明：桶里面有多个文件夹，如果想上传到指定的文件夹下可以使用，如：`deepexi-dm/dm-console/test/`  桶里面deepexi-dm文件夹下的dm-console文件夹下的test文件夹
- 执行流程： 列举出数据 => 是否需要删除 => 上传本地文件 => 退出obs


```
//执行即可
node ./upload.js
```