/*
	@clk.js

    @date: 2016-10-05
    @version:0.0.0.4

	@author: Dingbao.ai[aka. ehaagwlke]
	@date: 2011-01-02
	@version:0.0.0.3
*/

document.body.onmousedown = function(e){
	var et         = e.target,
        alt        = null,
        title      = null,
        dispWidth  = 0,
        dispHeight = 0;

    if(et && et.nodeName.toLowerCase() == 'img'){
        alt   = et.alt   ? et.alt   : alt;
        title = et.title ? et.title : title;

        dispWidth  = et.width;
        dispHeight = et.height;
    }

    chrome.extension.sendRequest({
        "alt"        : alt,
        "title"      : title,
        "dispWidth"  : dispWidth,
        "dispHeight" : dispHeight
    });
}
