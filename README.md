### 项目生成离线包

将项目产出成离线包，http路径变成了本地的文件路径。

<<<<<<< HEAD
按需打包需要的js和css。

##### js 打包
1. html页面本身script src引用的同步依赖
2. fis3-postpackager-loader 分析的async异步依赖（这里暂时依赖loader分析的结果）

##### css 打包
1. 正则匹配页面同步依赖的css文件。

=======
>>>>>>> 31268c067673d07e25c3930a7ef36c82189ebc54
```
fis.plugin('offpack', {
    // 产出目录
    to: '../pack',
    httpPrefix: {
        // CDN路径，最后的文件会产出到  pack/7.url.cn/edu/activity/文件相对路径
        html: 'http://ke.qq.com/activity/',
        js: 'http://7.url.cn/edu/activity/',
        css: 'http://8.url.cn/edu/activity/',
        image: 'http://9.url.cn/edu/activity/'
    }
})
```
