### 项目生成离线包

将项目产出成离线包，http路径变成了本地的文件路径。

打包使用的http路劲是 fis-conf.js 中配置的domain。
```

fis.match('**.js', {
    domain: 'http:://9.url.cn/edu'
}).match('**.css', {
    domain: 'http:://8.url.cn/edu'
}).match('::image', {
    domain: 'http:://7.url.cn/edu'
}).match('**.html', {
    domain: 'http:://ke.qq.com/mobilev2'
});

fis.plugin('offpack', {
    // 产出目录
    to: '../pack',
    zipTo: '../offline', // zip文件单独copy到这里
    // glob表达式，自定义需要打包的文件，如果不填，默认打包全部文件
    packSrc: [
        '/*.html',
        '**.{css,scss}',
        '**.{png,gif,jpg}',
        'pkg/**.js'
    ]
})
```

最终html最产出到ke.qq.com/mobilev2下对于的目录，整个产出会打成pack.zip压缩包。

