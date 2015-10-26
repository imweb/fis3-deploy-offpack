### 项目生成离线包

将项目产出成离线包，http路径变成了本地的文件路径。

打包使用的http路劲是 fis-conf.js 中配置的domain。

##### js 打包
1. 将require打包生成pkg目录打入离线包，否则，所有文件全部打入离线包。

##### css 打包

1. 正则匹配页面同步依赖的css文件。
```
fis.plugin('offpack', {
    // 产出目录
    to: '../pack',
    // glob表达式，自定义需要打包的文件，如果不填，默认打包全部文件
    packSrc: [
        '/*.html',
        '**.{css,scss}',
        '**.{png,gif,jpg}',
        'pkg/**.js'
    ]
})
```

