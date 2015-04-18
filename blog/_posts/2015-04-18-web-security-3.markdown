---
layout: post
title: "Web安全技术(3)-浏览器"
date: 2015-04-18 23:49
categories: ["Web", "安全"]
---

一、浏览器介绍
-----------------------

对于Web应用来说，浏览器是最重要的客户端。

目前浏览器五花八门多得不得了，除了Chrome、IE、Firefox、Safari、Opera这些国外的浏览器外，百度、腾讯、360、淘宝、搜狗、傲游之类的，反正能做的都做了。

浏览器虽然这么多，但浏览器内核主要就以下4种：

1. Trident：IE使用的内核。
2. Gecko：Firefox使用的内核。
3. WebKit：Safair和Chrome使用的内核。WebKit由苹果发明，Chrome也用了，但是Google又开发了V8引擎替换掉了WebKit中的Javascript引擎。
4. Presto：Opera使用的内核。

国内的浏览器基本都是双核浏览器，使用基于WebKit的内核高速浏览常用网站，使用Trident内核兼容网银等网站。

二、同源策略
-----------------------

同源策略是浏览器最基本的安全策略，它认为任何站点的内容都是不安全的，所以当脚本运行时，只被允许访问来自同一站点的资源。

同源是指域名、协议、端口都相同。

如果没有同源策略，就会发生下面这样的问题：

> 恶意网站用一个iframe把真实的银行登录页放到他的页面上，当用户使用用户名密码登录时，父页面的javascript就可以读取到银行登录页表单中的内容。
> 
> 甚至浏览器的1个Tab页打开了恶意网站，另一个Tab页打开了银行网站，恶意网站中的javascript可以读取到银行网站的内容。这样银行卡和密码就能被轻易拿走。

三、跨域访问
-----------------------

由于同源策略的原因，浏览器会禁止跨域访问，但有时我们的确需要做跨域访问，那要怎么办？主要有以下几种情况：

### iframe的跨域访问 ###

同域名下，父页面可以通过document.getElementById('_iframe').contentWindow.document访问子页面的内容，但不同域名下会出现类似下面的错误：

> Uncaught SecurityError: Blocked a frame with origin "http://a.com" from accessing a frame with origin "http://b.com". Protocols, domains, and ports must match.

#### 有两种解决方法： ####

1). 当主域名相同，子域名不同时，比较容易解决，只需设置相同的document.domain即可。

如http://a.a.com/a.html使用iframe载入http://b.a.com/b.html，且在a.html中有Javascript要修改b.html中元素的内容时，可以像下面的代码那样操作。

__a.html__

    <html>
      <head>
        <script>
          document.domain = 'a.com';
          function changeIframeContent() {
            var _iframe = document.getElementById('_iframe');
            var _p = _iframe.contentWindow.document.getElementById('_p');
            _p.innerHTML = 'Content from a.html';
          }
        </script>
      </head>
      <body>
        <iframe id="_iframe" src="http://b.a.com/demo/iframe/subdomain/b.html"></iframe>
        <br>
        <input type="button" value="Change iframe content" onclick="changeIframeContent();"/>
      </body>
    </html>

__b.html__

    <html>
      <head>
        <script>
          document.domain = 'a.com';
        </script>
      </head>
      <body>
        <p id="_p">b.html</p>
      </body>
    </html>

2). 当主域名不同时，就非常麻烦了。在父页面中访问子页面的内容是不可行的，但子页面的数据还是有可能传到父页面，大致的方法像下面描述的那样：

- a.com下有a.html；
- a.html的iframe加载b.com下的b.html；
- b.html的iframe加载a.com下的c.html；
- 因为a.html和c.html是相同域名，所以c.html可以使用parent.parent访问到a.html的对象。

### Ajax的跨域访问 ###



