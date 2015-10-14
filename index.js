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

var DEF_CONF = {
    // 默认生成的压缩包路径
    to: '../pack',

    // 是否打包图片
    packImg: true,

    // 生成的压缩包文件名
    file: 'pack.zip',

    // 各种文件的域名和cdn前缀，打包后，生成到响应的目录
    // index.html会生成到 ke.qq.com/mobilev2/index.html
    httpPrefix: {
        html: 'http://ke.qq.com/mobilev2',
        js: 'http://7.url.cn/mobilev2',
        css: 'http://8.url.cn/mobilev2',
        image: 'http://9.url.cn/mobilev2'
    },

    // 配置页面的目录，相对于src，只有页面的html才打入离线包，
    // 如果不这样处理，很多inline到页面的html也打入离线包了
    // 默认src目录下的html认为是业务页面，其他子目录下的html不处理
    pageDir: './',

    // 是否打包所有的html，对上面的pageDir hack一下，兼容业务有多个pageDir
    packAllHtml: false,

    //不打包文件
    ignore: []
};

// copy 文件到指定目录
function moveTo(dir, file, ignoreList) {
    if(ignoreList && ignoreList.length) {
        var isIgnore = isFileIgnore(ignoreList, file);
        if (isIgnore) return;
    }

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


function isFileIgnore(ignoreList, file) {
    var isIgnore = false,
        testRet,
        ignore;
    for (var i = 0; i < ignoreList.length; i++) {
        ignore = ignoreList[i];
        testRet = _.glob(ignore, file.subpath);
        if (testRet) {
            isIgnore = testRet;
            break;
        }
    }
    return isIgnore;
}

module.exports = function(options, modified, total, next) {

    options = _.extend({}, DEF_CONF, options);

    var projectPath = fis.project.getProjectPath(),
        to = _(path.join(projectPath, options.to)),
        md5Len = fis.config.get('project.md5Length'),
        md5Reg = new RegExp('.[0-9a-z]{' + md5Len + '}$', 'mg'),
        zipPath;


    zipPath = path.join(to, options.file)

    rmdir(to);

    var allImagesList = [],
        usedImageList = [];

    var content,
        needFileInfo,
        allJs = [],
        allCss = [],
        neededCss = [],
        requirePkgFiles = [],
        pageDir = path.join(projectPath, options.pageDir)
        .replace(/\\/g, '\/')
        .replace(/\/$/, '');
    modified.forEach(function(file) {
        var isIgnore = isFileIgnore(options.ignore, file);
        if (isIgnore) return;

        // 这里n多inline到页面的html也打包了，实际不需要的
        if (file.isHtmlLike && (options.packAllHtml || file.dirname === pageDir)) {
            content = file.getContent();
            // html如果被忽略，引用的css和img都会被忽略
            // 页面引用的css
            var cssMatches = content.match(rStyle);
            if (cssMatches) {
                needFileInfo = fis.file.wrap(cssMatches[2].replace(options.httpPrefix.css, ''));
                neededCss.push(needFileInfo.realpathNoExt.replace(md5Reg, '') /*+ needFileInfo.ext*/ );
            }
            usedImageList = usedImageList.concat(filterImage(file.links));
            moveTo(to + options.httpPrefix.html.replace(/^https?:\//, ''), file, options.ignore);
        } else if (file.isJsLike) {
            usedImageList = usedImageList.concat(filterImage(file.links));

            allJs.push(file);

            // 根据require打包插件，打包pkg文件夹即可
            // pkg files
            if (/^pkg\//.test(file.id)) {
                requirePkgFiles.push(file);
            }
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

    if (requirePkgFiles.length) {
        requirePkgFiles.forEach(function(file) {
            moveTo(to + options.httpPrefix.js.replace(/^https?:\//, ''), file, options.ignore);
        });
    } else {
        // 如果pkg不存在，认为没有require打包，js全量copy
        allJs.forEach(function(file) {
            moveTo(to + options.httpPrefix.js.replace(/^https?:\//, ''), file, options.ignore);

        });

    }

    allCss.forEach(function(file) {
        if (~neededCss.indexOf(file.subpathNoExt)) {
            moveTo(to + options.httpPrefix.css.replace(/^https?:\//, ''), file, options.ignore);
        }
    });

    // 默认打包image
    if (options.packImg) {
        allImagesList.forEach(function(file) {
            if (~usedImageList.indexOf(file.subpath)) {
                moveTo(to + options.httpPrefix.image.replace(/^https?:\//, ''), file, options.ignore);
            }
        });
    }


    zip(zipPath);
    next();
};
