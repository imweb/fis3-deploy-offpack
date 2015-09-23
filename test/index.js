/*
 * author: helondeng
 */
var fs = require('fs'),
    path = require('path'),
    fis = require('fis3'),
    _ = fis.util,
    expect = require('chai').expect,
    _release = fis.require('command-release/lib/release.js'),
    _deploy = fis.require('command-release/lib/deploy.js'),
    packer = require('../');


function release(opts, cb) {
    opts = opts || {};

    _release(opts, function(error, info) {
        _deploy(info, cb);
    });
}

function wrapper(_options) {
    return function(options, modified, total, next) {
        _.assign(options, _options);
        return packer.call(this, options, modified, total, next);
    }
}

describe('fis-postpackager-iconfont', function() {
    var root = path.join(__dirname, 'src');

    fis.project.setProjectRoot(root);

    beforeEach(function() {
        fis.match('**.{css,scss}', {
                domain: 'http://8.url.cn/edu/activity'
            })
            .match('::image', {
                domain: 'http://9.url.cn/edu/activity'
            })
            .match('**.js', {
                domain: 'http://7.url.cn/edu/activity'
            })
            .match(/\/(.+)\.tpl$/, {
                isMod: true,
                rExt: 'js',
                id: '$1_tpl',
                release: '$0.tpl',
                parser: fis.plugin('imweb-tpl')
            })
            .match('**.{scss,sass}', {
                parser: fis.plugin('sass', {
                    include_paths: ['modules/common/sass']
                }),
                rExt: '.css'
            })
            .match('partials/**.js', {
                isMod: false
            })
            .match(/(mod|badjs|bj-report)\.js$/, {
                isMod: false
            })
            .match('::package', {
                prepackager: fis.plugin('csswrapper'),
                postpackager: fis.plugin('loader', {
                    resourceType: 'mod',
                    // obtainScript: false,
                    useInlineMap: true // 资源映射表内嵌
                })
            })
            .match('*', {
                deploy: wrapper({
                    to: '../pack',
                    httpPrefix: {
                        html: 'http://ke.qq.com/activity/',
                        js: 'http://7.url.cn/edu/activity',
                        css: 'http://8.url.cn/edu/activity',
                        image: 'http://9.url.cn/edu/activity'
                    }
                })
            });
    });

    it('fis3-deploy-offpack', function() {

        var pack = path.join(root, '../pack');
        
        release({
            unique: true
        }, function() {
            // 文件是否生成
            expect(fs.existsSync(path.join(pack, 'pack.zip'))).to.be.true;
            expect(fs.existsSync(path.join(pack, 'ke.qq.com/activity', 'index.html'))).to.be.true;
            expect(fs.existsSync(path.join(pack, '8.url.cn/edu/activity', 'pages/index/main.css'))).to.be.true;
            expect(fs.existsSync(path.join(pack, '7.url.cn/edu/activity', 'pages/index/main.js'))).to.be.true;

            console.log('release end');
        });
    });
});
