### 项目生成离线包

将项目产出成离线包，http路径变成了本地的文件路径。

按需打包需要的js和css。

##### js 打包
1. 暂时全部打包，后面会根据packager插件，做到按需打包

##### css 打包

1. 正则匹配页面同步依赖的css文件。
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
    },
    packImg: false // 是否将image图片打入离线包，默认是true
})
```


##### image打包
获取html、scss、async.scss中link到的image，产出到最终目录，只有被引用的图片才会被打到离线包中。