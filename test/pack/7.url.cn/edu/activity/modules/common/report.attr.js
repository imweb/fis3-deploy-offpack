/**
 * @author herbertliu
 * @date 2014-04-12 version 0.1
 * @description TDW数据上报，用来设置通过设置属性来进行上报，依赖report,jquery >= 1.7
 * @example report.getReportAttr([id,][isCloseReport,][clear,]data) //获取上报的属性字符串
 *          params id {Boolean} 可选，如果不传id，可以通过返回值拿到id; 可以是选择器，用来表示当前字符串所对应的字符串cache id,唯一标识，用来多次改变某个属性的时候，保持其他属性不变
 *          params isCloseReport {Boolean} 可选，是否上报，上报开关，默认打开
 *          params clear {Boolean} 可选，是否清除历史属性，默认不清除
 *          params data {Object} 可选，上报的数据字段值，参见DC上报所需的字段，例如：{'uin':'','ts':'','opername':'','module':'','action':'','obj1':'','obj2':'','obj3':'','action':'','ver1':'','ver2':'','ver3':'','ver4':''}，这里ts表示时间戳，不传使用服务器时间戳，objs表示用户ip，也不需要传
 *
 * @example report.setReportAttr(id, [isCloseReport,][clear,]data) //设置上报属性字符串，参数含义同@see getReportAttr
 * @example <div report-tdw="uin=624005743&ts=ts&opername=opername" report-close="0">我要上报</div> report-tdw:需要上报的tdw属性值字符串，report-close:标识是否需要上报
 */
 // define(['report', 'jquery'], function(report, $) {
	var report = require('./report');
	var $ = require('zepto');

	var _MATCH_SERIALIZES = /[^\|]+/ig, //以竖线隔开的一组上报值
		_MATCH_SERIALIZE = /(^|&)?([^&=]*)=([^&]*)(&|$)/ig, //每一条上报支持
		_MATCH_KEY_VALUE = /(?:^|&)([^&=]*)=([^&]*)(?:&|$)/i; //获取属性以及属性值

	
	function parseReportAttr(str){
		//解析节点数据
		if (!str) {
			return;
		}
		
		var DATA_OBJ,
			_mathes = str.match(_MATCH_SERIALIZES);

		if (_mathes) {
			DATA_OBJ = [];
			for (var m=0,lens = _mathes.length; m < lens ; m++) {
				var _match = _mathes[m].match(_MATCH_SERIALIZE);
				if (!_match) {
					continue;
				}

				var _DATA_OBJ = {};
				for (var i =0,len = _match.length; i < len; i++) {
					if (_match[i]) {
						var _key_match = _match[i].match(_MATCH_KEY_VALUE);
						if (_key_match[1]) {
							//key and value
							_DATA_OBJ[_key_match[1]] = _key_match[2] || '';
						}
					}
				}
				DATA_OBJ.push(_DATA_OBJ);
			}	
		}
		return DATA_OBJ;
	}

	/*function decodeReportAttr(DATA_OBJ){
		if(!DATA_OBJ) return;
		var DATA_OBJ_STRS = [];
		for(var j =0,ls = DATA_OBJ.length; j < ls ;j++){
			var DATA_OBJ_STR = [];
			for(var i in DATA_OBJ){
				if(!DATA_OBJ[i] && DATA_OBJ[i] !== 0) continue;
				DATA_OBJ_STR.push(i + '=' + DATA_OBJ[i]);
			}
			DATA_OBJ_STRS.push(DATA_OBJ_STR.join('&'));
		}
		
		return DATA_OBJ_STRS.join('|');
	}*/

	function isASelf(elem) {
		return elem.tagName.toLowerCase() === 'a' && elem.href.indexOf('http://') === 0 && elem.target !== '_blank';
	}

	
	$(document).on('click', '[report-tdw]', function(e) {
		var param,
			$this = $(this),
			tdw = $this.attr('report-tdw');
			

		if (tdw) {
			param = $this.data('report-param') || parseReportAttr(tdw);

			if (isASelf(this)) {
				e.preventDefault();
			}

			$this.data('report-param', param); //保存数据
			report.tdw(param);
			if (isASelf(this)) {
				setTimeout(function() {		// 延迟跳转
					location.href = $this[0].href;	
				}, 400);
			}
		}
	});
	


	/**
	 * 设置上报属性
	 * @params id {Boolean} 可选，如果不传id，可以通过返回值拿到id; 可以是选择器，用来表示当前字符串所对应的字符串cache id,唯一标识，用来多次改变某个属性的时候，保持其他属性不变
 	 * @params isCloseReport {Boolean} 可选，是否上报，上报开关，默认打开
	 * @params clear {Boolean} 可选，是否清除历史属性，默认不清除
	 * @params data {Object}可选，上报的数据字段值，参见DC上报所需的字段，例如：{'uin':'','ts':'','opername':'','module':'','action':'','obj1':'','obj2':'','obj3':'','action':'','ver1':'','ver2':'','ver3':'','ver4':''}，这里ts表示时间戳，不传使用服务器时间戳，objs表示用户ip，也不需要传
	 */
	/*function setReportAttr(id, isCloseReport, clear, data){
		switch(arguments.length){
			case 0:
				throw 'Need target id and data';
				return this;
			case 1:
				isCloseReport = false;
				clear = false;
				data = {};
				break;
			case 2:
				data = isCloseReport || {};
				isCloseReport = false;
				clear = false;
				break;
			case 3:
				data = clear || {};
				clear = false;
				break;
		}
		var $id = $(id);
		$id.attr('report-close',+(!!isCloseReport));

		if($id){
			//默认保留属性
			if(!clear){
				var _DATA_OBJ = [];

				if(!(_DATA_OBJ = $id.data('_DATA_OBJ'))){
					_DATA_OBJ = parseReportAttr($id.attr('report-tdw')) || [];
				}
				for(var i in data){
					var OBJ;
					for(var j = 0 , ls = _DATA_OBJ.length; j < ls ; j++){
						OBJ = _DATA_OBJ[j] || (_DATA_OBJ[j] = {});
						OBJ[i] = data[i];
					}				
				}
				data = _DATA_OBJ;
			}

			var _DATA_OBJ_STR = decodeReportAttr(data);
			if(!_DATA_OBJ_STR) return this;
			$id.attr('report-tdw',_DATA_OBJ_STR);//赋值
			$id.data('_DATA_OBJ',data);

		}
		return this;
	}
	report.setReportAttr = setReportAttr;

	//TODO 预留接口
	function getReportAttr(id, isCloseReport, clear ,data){
		switch(arguments.length){
			case 0:
				throw 'Need target id';
				return this;
			case 1:
				break;
			case 2:
			case 3:
				this.setReportAttr.apply(this,arguments);
				break;
		}

		var $id = $(id);

		var _DATA_OBJ = {};

		if(!(_DATA_OBJ = $id.data('_DATA_OBJ'))){
			_DATA_OBJ = parseReportAttr($id.attr('report-tdw')) || {};
		}

		return _DATA_OBJ;
	}

	report.getReportAttr = getReportAttr;*/

	return report;
// });