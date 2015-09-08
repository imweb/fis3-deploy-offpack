### 项目生成离线包

将项目产出成离线包，http路径变成了本地的文件路径。
···
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
···