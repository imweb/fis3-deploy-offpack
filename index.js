/*
 * 需要分析依赖项
 * 将依赖的文件及目录打包
 * 为被引用的文件不打包
 * 借助于fis3-postoackager-post方式
 * 可以根据最后的入口文件，再去分析async依赖
 *
 * fis3-pockager-loader 没有把async的依赖项放到pkg中
 */

/**
 * fis.baidu.com
 */

var path = require('path'),
    _ = fis.util,
    fs = _.fs,
    archiver = require('archiver');


var rScript = /<script\s([\'\"a-z\/=]*\s)?src=[\'\"]([^\'\"]*)[\'\"]([^>]*)>/,
    rStyle = /<link\s([\'\"a-z\/=]*\s)*href=[\'\"]([^\'\"]*)[\'\"]([^>]*)>/;

// copy 文件到指定目录
function moveTo(dir, file) {
    dir = path.join(dir, path.dirname(file.subpath.replace(/^\//, ''))).replace(/\\/mg, '/');
    _.mkdir(dir);

    var content = file.getContent(),
        // with md5
        name = path.basename(file.getHashRelease());
    fs.writeFileSync(path.join(dir, name), content, 'utf-8');
}

// zop folder
function zip(zipPath) {
    var archive = archiver('zip');
    archive.pipe(fs.createWriteStream(zipPath));
    archive.bulk([{
        expand: true,
        cwd: path.dirname(zipPath),
        src: ['*.url.cn/**', '*.qq.com/**']
    }]);

    archive.on('error', function() {
        fis.log.error('生成zip错误，路径 --- ' + zipPath)
    });

    archive.finalize();
}

/*
 * @TODO: 按照文件本身的依赖打包，多余的文件不打包
 * 多余的文件打进了离线包
 */
module.exports = function(options, modified, total, next) {

    var projectPath = fis.project.getProjectPath(),
        to = _(path.join(projectPath, options.to)),
        ext,
        md5Len = fis.config.get('project.md5Length'),
        md5Reg = new RegExp('.[0-9a-z]{' + md5Len + '}$', 'mg'),
        zipPath = path.join(to, 'pack.zip');

    if(fs.existsSync(to)) {
        var exec = require('child_process').exec;
        exec('rmdir ' + to.replace(/\//mg, '\\') + ' /s /q ')
    }

    var content,
        needFileInfo,
        neededJs = [],
        allJs = [],
        allCss = [],
        neededCss = [],
        sourceMap = /require.resourceMap\(([^\)]*)\)/;
    modified.forEach(function(file) {
        ext = _.ext(file.toString());

        /*
         * 根目录下的html认为是业务页面
         * 分析其中依赖的资源，包括
         * asyncs：异步js依赖
         * links：同步js，css，图片等资源
         *
         * 这里暂时只处理了js
         * 依赖的图片还包括css中的图片，这里暂不处理图片
         */
        if (file.isHtmlLike && ext.dirname === projectPath) {
            // console.log(file.links);
            content = file.getContent();
            // console.log(content);
            // 借助于loader插件的resourceMap分析异步依赖
            var matches = content.match(sourceMap);
            if (matches) {
                // asyncs 异步JS依赖
                var asyncs = JSON.parse(matches[1]).res || {};
                for (var key in asyncs) {
                    needFileInfo = fis.file.wrap(asyncs[key].url.replace(options.httpPrefix.js, ''));
                    // delete md5
                    neededJs.push(needFileInfo.realpathNoExt.replace(md5Reg, '') + needFileInfo.ext);
                }
            }

            // 页面script标签引入的js文件
            var scriptMatches = content.match(rScript);
            if (scriptMatches) {
                // console.log(scriptMatches[2]);
                needFileInfo = fis.file.wrap(scriptMatches[2].replace(options.httpPrefix.js, ''));
                neededJs.push(needFileInfo.realpathNoExt.replace(md5Reg, '') + needFileInfo.ext);
            }


            /*
             * 分析同步css文件
             */

            var cssMatches = content.match(rStyle);
            if (cssMatches) {
                needFileInfo = fis.file.wrap(cssMatches[2].replace(options.httpPrefix.css, ''));
                neededCss.push(needFileInfo.realpathNoExt.replace(md5Reg, '') /*+ needFileInfo.ext*/);
            }

            moveTo(to + options.httpPrefix.html.replace(/^https?:\//, ''), file);

            // 分析 links相关资源，copy loader里面的源代码
        } else if (file.isJsLike) {
            // js 这里有没有被用到的部分，暂时缓存
            allJs.push(file);
        } else if (file.isCssLike) {
            // moveTo(to + options.httpPrefix.css.replace(/^https?:\//, ''), file);
            allCss.push(file);
        } else if (file.isImage()) {
            // 图片
            moveTo(to + options.httpPrefix.image.replace(/^https?:\//, ''), file);
        }
    });


    // 过滤js
    allJs.forEach(function(file) {
        if (~neededJs.indexOf(file.subpath)) {
            moveTo(to + options.httpPrefix.js.replace(/^https?:\//, ''), file);
        }
    });

    allCss.forEach(function(file) {
        if (~neededCss.indexOf(file.subpathNoExt)) {
            moveTo(to + options.httpPrefix.css.replace(/^https?:\//, ''), file);
        }
    });

    zip(zipPath);
    next();
};
