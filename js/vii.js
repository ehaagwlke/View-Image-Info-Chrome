/*
	@vii.js

    @date: 2016-10-15
    @version:0.0.0.3

    @date: 2016-10-05
    @version:0.0.0.2
*/

//when the esc key released, close the info window
//there are two ways to close this window, one is
//traditional window.close(), the other is used below
//Using keydown event makes people feel the interface
//responsing faster, keyup does the opposite.
document.body.addEventListener(
    'keydown',
    function(e){
        if(e.keyCode && e.keyCode == 27){
            closeCurrentWin();
        }
    },
    false
);


//functions for getting i18n messages and elements
function g(s){
    return chrome.i18n.getMessage(s);
}

function gtn(t){
    return document.getElementsByTagName(t);
}

function gid(id){
    return document.getElementById(id);
}


function closeCurrentWin(){
    chrome.windows.getCurrent(function(w){
        chrome.windows.remove(w.id);
    });
}

// all my thanks to http://stackoverflow.com/a/39906526
// @param: x bytes number
// @return: {nice: formatted bytes result, orig: localeString formatted x}
function niceBytes(x){
    var units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        n = o = parseInt(x, 10) || 0,
        l = 0,
        result = {};

    while(n > 1024){
        n = n/1024;
        l++;
    }

    result.nice = l > 0 ? n.toFixed(2) + ' ' + units[l] : '';
    result.orig = o.toLocaleString() + ' ' + units[0];

    return result;
}

//display initial contents of the window
var bg=chrome.extension.getBackgroundPage(),
    info=bg.imgInfoObj;

gid('loc').innerHTML = g('loc');
gid('loc').nextSibling.nextSibling.innerHTML = "<a id=\"locLink\" target=\"_blank\" href=\""
                                               + info['imgSrc'] + "\">"
                                               + info['imgSrc'] + "</a>";

gid("locLink").addEventListener('click',closeCurrentWin,false);

gid('dims').innerHTML = g('dims');
gid('ftype').innerHTML = g('ftype');
gid('fsize').innerHTML = g('fsize');
gid('altTitleStr').innerHTML = g('altTitleStr');
gid('prev').innerHTML = g('prev');

//calculating the size of the window
//using XMLHttpRequest object to get the file size and file type
//of the image file
var tds = gtn('td'),
    xhr = new XMLHttpRequest(),
    imgType,
    imgFileSize,
    oImgFileSize;

var altTitleStr = info['altTitleStr'];

tds[9].innerHTML = altTitleStr;

var nImg = new Image();
    nImg.src=info['imgSrc'];

    nImg.onload=function(){
        var nImgWidth  = nImg.width,
            nImgHeight = nImg.height,
            nImgDims,
            newImgWidth,
            newImgHeight;

        var dispWidth  = info['dispWidth'],
            dispHeight = info['dispHeight'],
            sw,
            sh,
            sstr='';

        sw = dispWidth  != nImgWidth  ? dispWidth  : 0;
        sh = dispHeight != nImgHeight ? dispHeight : 0;

        if(sw&&sh){
            sstr = '<span class="gray">('
                   + g('smsg') + ' ' + sw
                   + ' x '
                   + sh + ' px)</span>';
        };

        //generating the image dimensions string
        nImgDims = nImgWidth && nImgHeight ?
                   (nImgWidth + ' x ' + nImgHeight + ' px  ' + sstr) :
                   g('eid');

        tds[3].innerHTML = nImgDims;

        //resize the image if height or width or both
        //are larger than 600, and updating the size
        //of the info window according to these two
        //numbers, and show the scroll bar if needed
        newImgWidth = nImgWidth >= 600 ? 600 : nImgWidth;
        newImgHeight = nImgWidth >= 600 ?
                        Math.ceil(600*nImgHeight/nImgWidth) :
                        nImgHeight;

        var imgURLWidth=info['imgSrc'].length*8;
            imgURLWidth = imgURLWidth > 680 ? 680 : imgURLWidth;

        var popWinNewHeight=info['popWinHeight']+newImgHeight-16;
            popWinNewHeight = popWinNewHeight > 600 ? 600 : popWinNewHeight;

        if(popWinNewHeight==600){
            document.body.style.overFlowY = "scroll";
        }

        if(newImgWidth>imgURLWidth&&newImgWidth>popWinNewHeight-120){
            document.body.style.overFlowX="scroll";

            chrome.windows.getCurrent(function(w){
                chrome.windows.update(w.id,{width:newImgWidth+125});
            });
        }

        chrome.windows.getCurrent(function(w){
            chrome.windows.update(w.id,{height:popWinNewHeight});
        });
    }

    //if the image can not be loaded
    //error message should be in different color
    nImg.onerror=function(){
        document.title="View Image Info [error occurred]";
        tds[3].innerHTML=g('eid');
        tds[5].innerHTML=g('eift');
        tds[7].innerHTML=g('eifz');
        tds[11].innerHTML=g('ilem');
        tds[3].style.color = tds[5].style.color
                           = tds[7].style.color
                           = tds[9].style.color
                           = tds[11].style.color
                           = '#999999';
    }

    //show the image before the xmlhttprequest request will be sent
    tds[11].firstChild.src=nImg.src;

    //'cause image could be embedded in a web page
    //using base64 data, so we handle it seperately
    //what about svg?
    if(info['linkType']!='base64'){
        xhr.open("GET",nImg.src,true);

        xhr.onreadystatechange=function(){
            if(xhr.status==200&&xhr.readyState==4){
                imgType=xhr.getResponseHeader("Content-Type").split("/")[1],
                oImgFileSize = parseInt(xhr.getResponseHeader("Content-Length"), 10);

                imgFileSize = niceBytes(oImgFileSize);
                if(imgFileSize.nice.length > 0){
                    imgFileSize = imgFileSize.nice
                                + ' <span class="gray">('
                                + imgFileSize.orig
                                + ')</span>';
                }else{
                    imgFileSize = imgFileSize.orig;
                }

                if(oImgFileSize > 0){
                    tds[7].innerHTML = imgFileSize;
                }else{
                    tds[7].innerHTML=g('eifz');
                    tds[7].style.color="#999999";
                }

                imgType = (imgType&&imgType.toLowerCase()!="html") ?
                        '<em>'+imgType.toUpperCase()+'</em> image' : g('eift');

                tds[5].innerHTML=imgType;

                if(imgType==g('eift')){
                    tds[5].style.color="#999999";
                }

                document.title="View Image Info";

            //will this conditional test cause any problem?
            }else if(xhr.status>=300){
                document.title="View Image Info [error occurred]";
                tds[5].innerHTML=g('eift');
                tds[7].innerHTML=g('eifz');
                tds[5].style.color=tds[7].style.color="#999999";
            }
        }
        xhr.send(null);

    //if the image source is base64 data
    //file size will be unavailable
    }else{
        document.title="View Image Info [Base64 data]";
        imgType = '<em>'
                  + info['imgSrc'].substring(11,info['imgSrc'].indexOf(';')).toUpperCase()
                  + '</em> image <span class="gray">(base64 data)</span>';

        imgFileSize = info['imgSrc'].length;
        imgFileSize = niceBytes(imgFileSize);

        if(imgFileSize.nice.length > 0){
            imgFileSize = imgFileSize.nice
                        + ' <span class="gray">('
                        + imgFileSize.orig
                        + ')</span>';
        }else{
            imgFileSize = imgFileSize.orig;
        }

        tds[5].innerHTML   = imgType;
        tds[7].innerHTML   = imgFileSize;
    }
