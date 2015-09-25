/*
 * 生成离线包
 * TODO: 按需打包js文件
 * packager 插件将需要的js生成到pkg中，deploy只打包pkg中的js
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

// zip folder
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

// 删除目录
function rmdir(dir) {
    var files = [];
    if (fs.existsSync(dir)) {
        files = fs.readdirSync(dir);
        files.forEach(function(file) {
            var curPath = path.join(dir, file);
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                rmdir(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(dir);
    }
}


function filterImage(ids) {
    return filterFiles(ids, /\.(png|gif|jpg)$/);
}


function filterJs(ids) {
    return filterFiles(ids, /\.js$/);
}

function filterFiles(ids, reg) {
    if (!reg) return [];
    var ret = [];
    ids.forEach(function(id) {
        if (reg.test(id)) {
            ret.push(id);
        }
    });
    return ret;
}

function uniqList(arr) {
    var ret = [],
        tmpl = {},
        item;
    for (var k = 0, len = arr.length; k < len; k++) {
        item = arr[k];
        if (!tmpl[item]) {
            tmpl[item] = 1;
            ret.push(item);
        }
    }
    return ret;
}


/*
 * @TODO: 按照文件本身的依赖打包，多余的文件不打包
 * 多余的图片文件打进了离线包
 */
module.exports = function(options, modified, total, next) {

    var projectPath = fis.project.getProjectPath(),
        to = _(path.join(projectPath, options.to)),
        ext,
        md5Len = fis.config.get('project.md5Length'),
        md5Reg = new RegExp('.[0-9a-z]{' + md5Len + '}$', 'mg'),
        zipPath;

    options = _.extend({}, {
        // 默认打包image
        packImg: true, 
        file: 'pack.zip'
    }, options);

    zipPath = path.join(to, options.file)

    rmdir(to);

    var allImagesList = [],
        usedImageList = [];

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
            content = file.getContent();
            // 借助于loader插件的resourceMap分析异步依赖
            // var matches = content.match(sourceMap);
            // if (matches) {
            //     // asyncs 异步JS依赖
            //     var asyncs = JSON.parse(matches[1]).res || {};
            //     for (var key in asyncs) {
            //         needFileInfo = fis.file.wrap(asyncs[key].url.replace(options.httpPrefix.js, ''));
            //         // delete md5
            //         neededJs.push(needFileInfo.realpathNoExt.replace(md5Reg, '') + needFileInfo.ext);
            //     }
            //     // 页面script标签引入的js文件
            //     // 同步js
            // var scriptMatches = content.match(rScript);
            // if (scriptMatches) {
            //     needFileInfo = fis.file.wrap(scriptMatches[2].replace(options.httpPrefix.js, ''));
            //     neededJs.push(needFileInfo.realpathNoExt.replace(md5Reg, '') + needFileInfo.ext);
            // }
            // }
            // console.log(neededJs);

            /*
             * 分析同步css文件
             */
            var cssMatches = content.match(rStyle);
            if (cssMatches) {
                needFileInfo = fis.file.wrap(cssMatches[2].replace(options.httpPrefix.css, ''));
                neededCss.push(needFileInfo.realpathNoExt.replace(md5Reg, '') /*+ needFileInfo.ext*/ );
            }
            usedImageList = usedImageList.concat(filterImage(file.links));
            // console.log(file.links);
            moveTo(to + options.httpPrefix.html.replace(/^https?:\//, ''), file);

            // 分析 links相关资源，copy loader里面的源代码
        } else if (file.isJsLike) {
            // async css
            usedImageList = usedImageList.concat(filterImage(file.links));

            allJs.push(file);
        } else if (file.isCssLike) {

            usedImageList = usedImageList.concat(filterImage(file.links))
            allCss.push(file);
        } else if (file.isImage()) {
            // 图片按需打包，未被引用的image不打包
            allImagesList.push(file);
            // moveTo(to + options.httpPrefix.image.replace(/^https?:\//, ''), file);
        }
    });


    usedImageList = uniqList(usedImageList);
    // 过滤js
    allJs.forEach(function(file) {
        if (neededJs.length > 0) {
            if (~neededJs.indexOf(file.subpath)) {
                moveTo(to + options.httpPrefix.js.replace(/^https?:\//, ''), file);
            }
        } else {
            moveTo(to + options.httpPrefix.js.replace(/^https?:\//, ''), file);
        }

    });

    allCss.forEach(function(file) {
        if (~neededCss.indexOf(file.subpathNoExt)) {
            moveTo(to + options.httpPrefix.css.replace(/^https?:\//, ''), file);
        }
    });

    // 默认打包image
    if (options.packImg) {
        allImagesList.forEach(function(file) {
            if (~usedImageList.indexOf(file.subpath)) {
                moveTo(to + options.httpPrefix.image.replace(/^https?:\//, ''), file);
            }
        });
    }


    zip(zipPath);
    next();
};
