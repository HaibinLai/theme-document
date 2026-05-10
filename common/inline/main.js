/*
* 切换主题皮肤
* */
function toggleTheme(flag = true, persist = true) {
    if (flag) {
        $('html')
            .addClass('dark')
            .removeClass('personal');
        if (persist) localStorage.setItem('night', '1');
        $(function () {
            $('.read-mode i')
                .removeClass("icon-baitian-qing")
                .addClass("icon-yueliang");
        });
    } else {
        $('html')
            .removeClass('dark')
            .addClass('personal');
        if (persist) localStorage.setItem('night', '0');
        $(function () {
            $('.read-mode i')
                .removeClass("icon-yueliang")
                .addClass("icon-baitian-qing");
        });
    }
}


/*
* 动态rem
* */
let l = () => {
    let r = document.documentElement, o = r.offsetWidth / 100;
    o < 17 && (o = 17), r.style.fontSize = o + "px", window.rem = o
};
window.onresize = l;
l();

/*同步主题*/
let theme = localStorage.getItem('theme-color');
if (!!theme) {
    $('html').addClass(theme)
}
/*同步阅读模式 */
let night = localStorage.getItem('night');
let prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

if (night === '1' || (night === null && prefersDark)) {
    if (!$('html').hasClass('dark')) {
        toggleTheme(true, false);
    } else {
        $(function () {
            $('.read-mode i')
                .removeClass("icon-baitian-qing")
                .addClass("icon-yueliang");
        });
    }
}

/* 监听系统暗色偏好变化 */
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        var n = localStorage.getItem('night');
        if (n === null) {
            toggleTheme(e.matches, false);
        }
    });
}

/*
* 获取元素在网页的实际top
* */
$.fn.getTop = function () {
    let position = this.position();
    /*
    * 为0代表有很多offsetTop要计算
    * */
    if (position.top !== 0) {
        return position.top;
    } else {
        let html = $('html').get(0);
        return this.get(0).getBoundingClientRect().top + html.scrollTop;
    }
}


/*jq内存清理函数*/
$.fn.removeWithLeakage = function () {
    this.each(function (i, e) {
        $("*", e).add([e]).each(function () {
            $.event.remove(this);
            $.removeData(this);
        });
        if (e.parentNode)
            e.parentNode.removeChild(e);
    });
};
