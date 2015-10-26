/*
 * 0.4.0
 * 1. 不用配置httpPrefix，根据file的domain属性来处理
 */
'use strict';
var path = require('path'),
    _ = fis.util,
    fs = _.fs,
    archiver = require('archiver');

var DEF_CONF = {
    // 默认生成的压缩包路径
    to: '../pack',

    // 生成的压缩包文件名
    file: 'pack.zip',

    // 后定义的正则优先级更高
    packSrc: []
};

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
        fis.log.error('生成zip错误，路径 --- ' + zipPath);
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


function formatDate(pattern, date) {
    var formatNumber;
    if (typeof date === 'number') {
        date = new Date(date);
    }
    formatNumber = function(data, format) {
        format = format.length;
        data = data || 0;
        if (format === 1) {
            return data;
        } else {
            return String(Math.pow(10, format) + data).slice(-format);
        }
    };
    return pattern.replace(/([YMDhsm])\1*/g, function(format) {
        switch (format.charAt()) {
            case 'Y':
                return formatNumber(date.getFullYear(), format);
            case 'M':
                return formatNumber(date.getMonth() + 1, format);
            case 'D':
                return formatNumber(date.getDate(), format);
            case 'w':
                return date.getDay() + 1;
            case 'h':
                return formatNumber(date.getHours(), format);
            case 'm':
                return formatNumber(date.getMinutes(), format);
            case 's':
                return formatNumber(date.getSeconds(), format);
            default:
                return '';
        }
    });
}


/*
 * 根据配置的glob表达式，返回include和exclude数组
 */
function getInAndExclude(conf) {
    var ret = {
        include: [],
        exclude: []
    };

    conf.forEach(function(glob) {
        if (/^!/.test(glob)) {
            ret.exclude.push(glob.replace(/^!/, ''));
        } else {
            ret.include.push(glob);
        }
    });
    return ret;
}


module.exports = function(options, modified, total, next) {

    options = _.extend({}, DEF_CONF, options);

    var projectPath = fis.project.getProjectPath(),
        to = _(path.join(projectPath, options.to)),
        zipPath;


    var inAndEx = getInAndExclude(options.packSrc);

    zipPath = path.join(to, options.file);

    rmdir(to);


    var packFileList = [];

    // 正则匹配获取需要的打包的文件
    modified.forEach(function(file) {
        if (options.packSrc.length) {
            if (_.filter(file.subpath, inAndEx.include, inAndEx.exclude)) {
                packFileList.push(file);
            }
        } else {
            packFileList.push(file);
        }
    });

    packFileList.forEach(function(file) {
        if (file.isHtmlLike) {
            var content = file.getContent();
            content = content.replace(/<\/head>/, '<script>window.isPack=true;window.packVersion="' + formatDate('YYYYMMDDhhssmm', new Date()) + '";</script>$&');
            file.setContent(content);
        }
        moveTo(to + file.domain.replace(/^https?:\//, ''), file);
        
    });

    zip(zipPath);

    next();
};
