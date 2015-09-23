
// tpl test
console.log(require('pages/index/tpl/index_tpl')({
    name: 'hello'
}));


require.async('modules/common/report.cookie', function(report) {
    report.config({
        opername: 'Edu',
        module: 'test',
        uin: require('cookie').uin()
    });

    report.tdw({
        action: 'expose'
    });
});