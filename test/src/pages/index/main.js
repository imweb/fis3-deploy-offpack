
// tpl test
console.log(require('pages/index/tpl/index_tpl')({
    name: 'hello'
}));

require('pages/index/main.async_scss');

$('#aaa').css({background: url('pages/index/img/p4.jpg')});

require.async('modules/common/report.cookie', function(report) {
    report.config({
        opername: 'Edu',
        module: 'test',
    });

    report.tdw({
        action: 'expose'
    });
});