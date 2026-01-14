/*初始化*/
$(function ($) {

    /*
    * 回复评论时自动滚动到指定位置
    * */
    if (location.search.indexOf('replytocom') != -1) {
        let top = ($('.comment-form').getTop() - 100);
        $('html').get(0).scrollTop = top;
    }


    /*
    * 回到顶部、阅读进度监控
    * */
    (function () {

        let main = $('html');
        let toTop = $('.toTop');
        let progress = $('#progress');

        /*
        * html的scrollTop在微信端无法正常获取值
        * */

        /*初始化加载后的首次进度*/
        progress.text((((window.scrollY + main.get(0).clientHeight) / main.get(0).scrollHeight) * 100).toFixed(0) + "%")

        /*
        * 返回顶部按钮被点击
        * */
        $('.toTop').click(function () {
            main.animate({scrollTop: 0}, 200, "linear", function () {
                window.scrollTo(0, 0);
            });
        });


        /*
        * 监控阅读进度
        * */
        $(window).on('scroll', function () {

            let that = main.get(0);


            /*
            * 判断是否需要显示
            * */
            if (window.scrollY > 0) {
                toTop.css('visibility', 'visible');//显示回到顶部
            } else {
                toTop.css('visibility', 'hidden');
            }

            /*
            * 同步阅读进度
            * */
            progress.text((((window.scrollY + that.clientHeight) / that.scrollHeight) * 100).toFixed(0) + "%")
        })


        /*
        * 阅读模式切换（白天、黑暗）
        * */
        $('.read-mode').click(function () {
            if ($(this).find('i').hasClass("icon-yueliang")) {
                toggleTheme(false); //切换白天模式
            } else {
                toggleTheme(true); //切换暗黑模式
            }
        });

    })();


    /*
    *
    * 灯箱
    * */
    (function () {

        /* 屏蔽其他页面加载 */
        if (typeof Viewer == "undefined") {
            return;
        }

        /* 获取页面上的所有图片，初始化灯箱 */
        document.querySelectorAll('.viewerLightBox').forEach((image) => {
            new Viewer(image, {
                navbar: false
            });
        })

    })();


    /*
    * 文章搜索
    * */
    (function () {
        /*
        * 点击搜索按钮弹出搜索框
        * */
        $('.icon-sousuo').on("click", function (event) {
            let that = $('#search');
            if (that.val() == "") {
                return
            } else {
                location.href = location.origin + "?s=" + that.val();
            }
        });


        /*
        * 回车时开始搜索
        * */
        $('#search').on("keypress", function (event) {
            let that = $(this);
            if (that.val() == "") {
                return
            } else {
                if (event.keyCode == "13") {
                    location.href = location.origin + "?s=" + that.val();
                }
            }
        });


    })();


    /*
    * 动态移动端菜单宽度
    * */
    (function () {

        let navWidth = '60%';


        /*
        * 展开导航
        * */
        function expandNav() {

            let right = $(".right");
            let daohang = $('.daohang');

            if (daohang.hasClass('icon-cha')) {
                right.css('left', '-' + navWidth)
                daohang.removeClass('icon-cha');
                daohang.addClass('icon-daohangmoren');
            } else {
                right.css('left', 0);
                daohang.addClass('icon-cha');
                daohang.removeClass('icon-daohangmoren');
            }

        }

        enquire.register("screen and (max-width: 1024px)", {
            match() {
                $(".daohang").on('click', expandNav);
            },
            /*屏幕大于1024时取消监听屏幕大小*/
            unmatch() {
                $(".daohang").off('click', expandNav);
            }
        });

    })();


    /*
    * 固定右边栏
    * */
    (function () {
        /*
         * 右边内容栏的sticky效果
         * */
        window.computed = () => {
        };//暴露到全局
        window.toFixed = () => {
        };//暴露到全局

        let isFixed = false;
        let html = $('html');
        let fixed = $('#fixed'); //右侧固定容器
        let right = $('#right'); //右边栏
        let main = $(".main-main"); //中间内容

        //获取底部DOM高度
        let footerHeight = $('.main-bottom').outerHeight();

        /*
        * 左侧固定
        * 判断是否有左边栏
        * */
        let space = $('#space');

        if (space.length > 0) {
            var navigator = $('#navigator'); //右侧边栏容器
            var topHeight = navigator.outerHeight(); //有侧边栏高度
            var topTop = $('#space').getTop();
            var topOffset = innerHeight - topHeight - topTop;
        }

        if (right.length != 0) {


            let muchBottom = 0;//右边栏底部距离

            let _static, _absolute; //存放中间内容和右边容器的高度

            /*
            * 右侧是不变的
            * */

            let react_fixed = fixed.get(0).getBoundingClientRect();
            let fixed_top = fixed.getTop(); //右边栏距离网页顶部的距离

            /*
            * 计算右边栏底部和屏幕底部重合时，网页的滚动大小
            * */
            _static = fixed_top + react_fixed.height - innerHeight;


            /*
            * 动态计算位置
            * */
            function computed() {

                if (space.length > 0) {
                    topTop = $('#space').getTop();
                    topHeight = navigator.outerHeight(); //有侧边栏高度
                    topOffset = innerHeight - topHeight - topTop;
                }

                let react_main = main.get(0).getBoundingClientRect();

                /*
                * 保持static，变成fixed的临界值
                * 因为底部出现时，看的是上方的滚动距离 -innerHeight 的位置滚出屏幕了，代表main的底部出现了
                * */
                _absolute = main.getTop() + react_main.height + rem - innerHeight;

                /*
                * 中间小于右边时取右边
                * */
                if (_absolute < _static) {
                    _absolute = _static;
                }

            }

            computed(); //初始计算
            window.computed = computed;//暴露到全局


            /*
            * 固定左侧偏移
            * */
            let isfixedLeft = false;

            /*
            * 左侧边栏位置检测
            * */
            function fixedLeft() {
                // 每次调用时都重新获取最新的位置和高度值，确保计算准确
                if (space.length > 0) {
                    topTop = $('#space').getTop();
                    topHeight = navigator.outerHeight();
                    topOffset = innerHeight - topHeight - topTop;
                }

                // 优先使用 window.scrollY，兼容某些浏览器 html.scrollTop 始终为 0 的情况
                let html_scrollTop = window.scrollY || html.scrollTop();


                if (html_scrollTop >= _absolute) {

                    isfixedLeft = true;
                    // 重新获取最新高度（可能因为图片加载而变化）
                    topHeight = navigator.outerHeight();
                    topTop = $('#space').getTop();
                    topOffset = innerHeight - topHeight - topTop;


                    /*左侧文章开始偏移*/
                    /*左侧top+高度+偏移量*/
                    /*
                    * @param topHeight 左侧边栏高度
                    * @param topTop, Top偏移值
                    * */


                    if ((topTop + topHeight + html_scrollTop) >= (_absolute + innerHeight)) {

                        /*
                        * 最小不会小于#space的Top
                        * */
                        let top = topTop + topOffset - (html_scrollTop - _absolute) - rem;

                        /*最小top*/
                        let min = space.getTop();

                        /*
                        * 如果需要的top小于最小top
                        * 文并且章导航大于文章列表高度
                        * 重置为60
                        * */
                        if (min > top && navigator.height() > main.height()) {
                            top = min;
                        }

                        /*
                        * 如果导航栏+文章目录+底部 小于屏幕高度
                        * */

                        let max = footerHeight + 60 + navigator.height() + (2 * rem);

                        if (max < innerHeight) {
                            top = min;
                        }

                        // 确保 top 值不会超出可视区域（防止侧栏移出屏幕）
                        // top 值应该在 min 和 (min + navigator.height()) 之间
                        if (top < min) {
                            top = min;
                        }
                        // 确保侧栏底部不会超出屏幕底部
                        let maxTop = innerHeight - navigator.outerHeight() - 20; // 留20px边距
                        if (top > maxTop && maxTop > min) {
                            top = maxTop;
                        }

                        navigator.css('top', top);
                    } else {
                        // 如果还没到需要偏移的位置，确保侧栏在初始位置
                        navigator.css('top', topTop);
                    }

                } else {

                    if (isfixedLeft) {
                        /*左侧文章开始复位*/
                        navigator.animate({
                            top: topTop
                        }, 'fast')

                        isfixedLeft = false;
                    }
                }
            }


            /*
            * 计算
            *
            * 已经滚动的距离+屏幕的高度>=main-main的top+height，代表要absolute固定到底部
            * 已经滚动的距离+屏幕的高度>= #fixed的top+height，代表要fixed
            *     如果块小于屏幕高度，应该直接top到顶部
            *     如果块大于屏幕高度，应该直接bottom到底部
            *
            * 已经滚动的距离+屏幕的高度 < #fixed的top+height，static
            *
            *
            * 如果块大于main-main,应该直接保持static
            *
            * rect 获取的top=dom绝对于容器的top-滚动的距离；
            *
            * 所以当前top+初始top=滚动距离
            * 初始top=滚动距离+当前top
            *
            * right不存在、isFixed防抖时，不需要触发
            *
            * 还应该减去屏幕高度，代表临界值在屏幕底部出现时的位置
            *
            * 进行高度比较时，应该+上屏幕高度
            *
            *
            *
            * 如果左边大于右边，右边没有占满屏幕？应该保持fixed
            * */


            /*
            * 滚动、屏幕大小变化时，动态更新右侧侧边栏的位置
            * */
            function toFixed() {
                // 每次滚动时都重新计算高度值，因为页面高度可能在滚动过程中发生变化（如图片加载）
                computed();

                /*
                * 如果有左侧边栏
                * */
                if (space.length > 0) {
                    fixedLeft();//左侧位置检测
                }

                /*
                * 如果没有右边栏
                * */
                if (right.length == 0 || isFixed) return;

                /*
                * 右侧大于左侧，保持static
                * */
                if (_static > _absolute) {
                    return;
                }

                isFixed = true;//标记正在滚动

                // 已经滚动的距离（优先使用 window.scrollY，兼容性更好）
                let html_scrollTop = window.scrollY || html.scrollTop();

                /*
                * 大于保持静态，小于保持绝对
                * */
                if (html_scrollTop >= _static && html_scrollTop <= _absolute) {

                    right.css('left', fixed.position().left + rem);

                    /*
                    * 如果块的高度小于屏幕高度
                    * 应该从top定位
                    * */

                    if ((_static + innerHeight) > innerHeight) {
                        right.css('top', '');
                        right.css('bottom', '0');
                    } else {
                        right.css('bottom', '');
                        right.css('top', fixed_top);
                    }

                    /*右侧固定定位*/
                    right.css('position', 'fixed');

                } else {

                    /*
                      * 底部固定
                      * */

                    if ((footerHeight + right.height() + 70) <= innerHeight) {

                        /*右侧固定定位*/
                        right.css('bottom', '');
                        right.css('top', fixed_top);
                        right.css('position', 'fixed');

                    } else if (html_scrollTop >= _absolute) {


                        /*
                        * 如果右边最长，就不需要触发绝对定位
                        * */
                        if (_absolute != _static) {
                            /*右侧绝对定位*/
                            right.css('position', 'absolute');
                            right.css('top', '');
                            right.css('bottom', muchBottom);
                        }


                    } else {
                        /*右侧静态定位*/
                        right.css('position', 'static');
                    }
                }

                isFixed = false;
            }


            window.toFixed = toFixed;//暴露到全局


            /*
            * 判断是否需要监听右侧侧边栏位置更新
            * */
            enquire.register("screen and (min-width:1024px)", {
                /*屏幕大于1024时监听屏幕大小，更新目录导航位置*/
                match() {
                    $(window).on('scroll', toFixed); //页面滚动时更新
                    $(window).on('resize', toFixed); //页面大小变化时更新
                },
                /*屏幕小于1024时取消监听屏幕大小*/
                unmatch() {
                    $(window).off('scroll', toFixed); //页面滚动时更新
                    $(window).off('resize', toFixed); //页面大小变化时更新
                },
                /*页面加载时判断是否需要监听更新位置*/
                setup() {
                    if (window.innerWidth > 1024) {
                        toFixed(); //页面初始化时更新一次
                    }
                }
            });

            /*
            * 图片加载完成后重新计算导航栏位置
            * 解决图片懒加载导致的高度计算不准确问题
            * */
            (function() {
                let imageLoadTimer = null; //防抖计时器
                let loadedImages = 0; //已加载图片计数
                let totalImages = 0; //总图片数

                // 重新计算导航栏位置的函数（带防抖）
                function recalculateOnImageLoad() {
                    if (imageLoadTimer) {
                        clearTimeout(imageLoadTimer);
                    }
                    imageLoadTimer = setTimeout(function() {
                        if (typeof computed === 'function') {
                            computed(); //重新计算高度
                        }
                        if (typeof toFixed === 'function') {
                            toFixed(); //重新计算位置
                        }
                    }, 100); //防抖延迟100ms
                }

                // 监听所有图片的加载事件
                function setupImageLoadListeners() {
                    const images = document.querySelectorAll('img');
                    totalImages = images.length;

                    if (totalImages === 0) {
                        // 如果没有图片，直接执行一次计算
                        recalculateOnImageLoad();
                        return;
                    }

                    images.forEach(function(img) {
                        // 如果图片已经加载完成
                        if (img.complete && img.naturalHeight !== 0) {
                            loadedImages++;
                            if (loadedImages === totalImages) {
                                recalculateOnImageLoad();
                            }
                        } else {
                            // 监听图片加载完成事件
                            img.addEventListener('load', function() {
                                loadedImages++;
                                if (loadedImages === totalImages) {
                                    recalculateOnImageLoad();
                                } else {
                                    // 每张图片加载完成都重新计算一次（防抖会合并多次调用）
                                    recalculateOnImageLoad();
                                }
                            }, { once: true });

                            // 监听图片加载错误事件（也要重新计算）
                            img.addEventListener('error', function() {
                                loadedImages++;
                                recalculateOnImageLoad();
                            }, { once: true });
                        }
                    });
                }

                // 页面加载完成后也重新计算一次
                if (document.readyState === 'complete') {
                    setupImageLoadListeners();
                } else {
                    window.addEventListener('load', function() {
                        setupImageLoadListeners();
                    });
                }

                // 监听动态添加的图片（使用 MutationObserver）
                if (typeof MutationObserver !== 'undefined') {
                    const observer = new MutationObserver(function(mutations) {
                        let hasNewImages = false;
                        mutations.forEach(function(mutation) {
                            mutation.addedNodes.forEach(function(node) {
                                if (node.nodeType === 1) { // Element node
                                    if (node.tagName === 'IMG') {
                                        hasNewImages = true;
                                        totalImages++;
                                        if (node.complete && node.naturalHeight !== 0) {
                                            loadedImages++;
                                            recalculateOnImageLoad();
                                        } else {
                                            node.addEventListener('load', function() {
                                                loadedImages++;
                                                recalculateOnImageLoad();
                                            }, { once: true });
                                            node.addEventListener('error', function() {
                                                loadedImages++;
                                                recalculateOnImageLoad();
                                            }, { once: true });
                                        }
                                    } else if (node.querySelectorAll) {
                                        const imgs = node.querySelectorAll('img');
                                        if (imgs.length > 0) {
                                            hasNewImages = true;
                                            totalImages += imgs.length;
                                            imgs.forEach(function(img) {
                                                if (img.complete && img.naturalHeight !== 0) {
                                                    loadedImages++;
                                                    recalculateOnImageLoad();
                                                } else {
                                                    img.addEventListener('load', function() {
                                                        loadedImages++;
                                                        recalculateOnImageLoad();
                                                    }, { once: true });
                                                    img.addEventListener('error', function() {
                                                        loadedImages++;
                                                        recalculateOnImageLoad();
                                                    }, { once: true });
                                                }
                                            });
                                        }
                                    }
                                }
                            });
                        });
                        if (hasNewImages) {
                            recalculateOnImageLoad();
                        }
                    });

                    // 开始观察DOM变化
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });
                }
            })();
        }

    })();


    /*
    * 移动端向下阅读时隐藏导航栏，上滑显示导航栏
    * mode boolean true 下滑显示 false 上移隐藏
    *
    * */
    (function () {
        let timer = null; //计时器
        let header = $('.main-header'); //导航栏对象

        let toggleHeader = function () {


            /*
            * 导航栏本身高度64
            * */
            if (window.scrollY < 64) {
                header.css('opacity', "1");
                clearTimeout(timer);
                timer = null;
                return;
            }


            /*
            * 防抖
            * */
            if (timer) {
                return;
            }

            let old_top = window.scrollY;//记录初值

            /*
            * 交流+延时判断
            * */
            timer = setTimeout(() => {

                let new_top = window.scrollY;//记录初值
                if (new_top < old_top) {
                    header.css('opacity', "1");
                } else {
                    header.css('opacity', "0");
                }
                clearTimeout(timer);
                timer = null;
            }, 200)
        }


        /*
        * 屏幕大小监听
        * */
        enquire.register("screen and (max-width: 480px)", {
            match() {
                $(window).on('scroll', toggleHeader)
            },
            /*屏幕大于1024时取消监听屏幕大小*/
            unmatch() {
                $(window).off('scroll', toggleHeader)
            }
        });

    })();



    /*
    * 主题色改变
    * */
    (function () {

        let html = $('html');
        /*改变主题色*/
        $('.theme-color div').click(function () {
            let theme = $(this).css('background-color');

            let size = html.css('font-size'); //字体大小

            html.attr("style", `font-size:${size};--theme-color:${theme}!important; `);
            localStorage.setItem('theme-color', $(this).attr('class'));

        })

    })();

});

