if (!/Android|iPhone|iPod|BlackBerry|IEMobile/i.test(navigator.userAgent)) {
    window.location.href = 'http://ke.qq.com/activity/list/index.html';
}

/*var isMobile = /Android|iPhone|iPod|BlackBerry|IEMobile/i.test(navigator.userAgent);
var T = +new Date();
if (!isMobile) {
    //TODO 替换活动名称，开发时pc和h5链接需规范
    window.location.href = 'http://ke.qq.com' + location.pathname.replace(/\/huodong_h5\//, '/huodong/') +
            (window.location.search==''?'?_wv=4097':(window.location.search+'&_wv=4097')) + window.location.hash;
}*/
