define('pages/index/main.async_scss', function(require, exports, module){function importStyle(css, id) {
    var ele = document.createElement('style');
    ele.id = id;
    document.getElementsByTagName('head')[0].appendChild(ele);
    if (ele.styleSheet) {
        ele.styleSheet.cssText = css;
    } else {
        ele.appendChild(document.createTextNode(css));
    }
}; importStyle(".test {\r\n  background: url(http://9.url.cn/edu/activity/pages/index/img/p10.jpg) no-repeat; }\r\n", "pages/index/main.async_scss"); }); require("pages/index/main.async_scss")