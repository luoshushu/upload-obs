
const ObsClient = require('esdk-obs-nodejs');
const path = require('path')
const glob = require('glob')
const isWindow = /^win/.test(process.platform)
const newprocess = require('process');
// const formatDate = require('./utlis.js');

// process.cwd() 当前执行程序的路径（执行命令行时候的路径,不是代码路径 例如 在根目录下执行 node ./xxx/xxx/a.js 则 cwd 返回的是 根目录地址 ）
// __dirname: 代码存放的位置
// process.execPath: 当前执行的node路径（如：/bin/node）

// console.log(process.execPath)
// console.log(__dirname)
// console.log(process.cwd())

class uploadobs {

      constructor(option) {
            this.option = option
            const {
                  prefix = '',
                  accessKeyId,
                  secretAccessKey,
                  obsServer,
                  obsBucket,
                  autoDeleteFile = false, // 删除文件
                  distName = 'dist',
                  fileSuffix=[] //上传文件后缀
            } = this.option
            const object = this.option
            
            let suffix = ''
            if(fileSuffix && fileSuffix.length != 0 ){
                  suffix = `.?(${fileSuffix.join('|')})`  // .?(js|css|map|png|jpg|svg|woff|woff2|ttf|eot|html|gz)
            }

            this.pre = path.resolve(process.cwd(), `./${distName}/`) + (isWindow ? '\\' : '')
            this.allFiles = glob.sync(`${path.join(process.cwd(), `./${distName}/**/*${suffix}`)}`)
            this.pre = this.pre.replace(/\\/g, '/')
            for (const key in object) {
                  if (object.hasOwnProperty(key) && key != 'prefix' && key != 'autoDeleteFile') {
                        const element = object[key];
                        if (!element) return console.log(`${key}没有值哦`)
                  }
            }
            this.OBS = new ObsClient({
                  access_key_id: accessKeyId, // 必填
                  secret_access_key: secretAccessKey, // 必填
                  server: obsServer //服务器 https://developer.huaweicloud.com/endpoint
            })
            this.deleteObjects = (Objects) => this.OBS.deleteObjects({ Bucket: obsBucket, Objects })
            this.listObjects = this.OBS.listObjects({ Bucket: obsBucket, Prefix: prefix })
            this.putObject = (key, file) => this.OBS.putObject({ Bucket: obsBucket, Key: key, SourceFile: file })
            this.errorFiles = []
      }
      init() {
            this.getListObjects()
      }

      // 上传至obs
      async uploadFileOBS(files) {
            try {
                  console.time('上传耗时')
                  let errors = []
                  const all = await Promise.all(
                        files.map(async (file) => {
                              const key = this.getFileKey(this.pre, file)
                              const { CommonMsg, InterfaceResult } = await this.putObject(`${this.option.prefix}${key}`, file)
                              
                              if (CommonMsg.Status == 200) {
                                    console.log(`${key}  文件上传成功啦🎉`);
                                    return true
                              } else {
                                    errors.push(file)
                                    console.log(`${key}  文件上传失败啦💔`);
                                    return false
                              }
                        })
                  )
                  console.timeEnd('上传耗时')
                  const err = all.filter(e => !e)
                  console.dir(`本次统计：一共上传${all.length}个文件,失败${err.length}个，成功${all.length - err.length}个`);
                  this.errorFiles = [...errors]
                  this.beforeClose()

            } catch (error) {
                  this.errorFiles = []
                  this.close()
            }

      }


      /**
       * 获取桶中的数据 有数据就删除，没有就直接上传
       */
      async getListObjects() {
            const { CommonMsg, InterfaceResult } = await this.listObjects
            const { Status } = CommonMsg || {}
            const { Contents } = InterfaceResult || {}
            if (Status == 200 && Contents && Contents.length != 0) {
                  const objs = Contents.map(e => ({ Key: e.Key }))
                  this.option.autoDeleteFile && this.deleteObjs(objs)
                  !this.option.autoDeleteFile && this.uploadFileOBS(this.allFiles)
            } else {
                  if (Status == 200) {
                        this.uploadFileOBS(this.allFiles)
                  } else {
                        console.log(Status);
                        this.close()
                  }
            }
      }
      /**
       * 批量删除文件
       * @param {objs} 文件对象 [{key:xxx.html}]
       */
      async deleteObjs(objs) {
            const { CommonMsg, InterfaceResult } = await this.deleteObjects(objs)
            if (CommonMsg.Status == 200) {
                  console.log(`${this.option.prefix} 删除远程旧数据成功`);
                  this.uploadFileOBS(this.allFiles)
            }
      }

      // 获取文件路径
      getFileKey(pre, file) {
            if (file.indexOf(pre) > -1) {
                  const key = file.split(pre)[1]
                  return key.startsWith('/') ? key.substring(1) : key
            }
            return file
      }
      beforeClose() {
            if (this.errorFiles.length == 0) {
                  this.close()
            } else {
                  this.uploadFileOBS(this.errorFiles)
                  console.log('退出之前检查发现有上传失败的文件，重新再上传')
                  this.errorFiles = []
            }
      }
      // 退出关闭
      close() {
            newprocess.on('beforeExit', (code) => {
                  this.OBS.close();
                  console.log('=========obs退出=========')
            });
      }
}
module.exports = uploadobs