---
layout: post
title: "Web安全技术(3)-浏览器的跨域访问"
date: 2015-04-22 00:03
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

由于同源策略的原因，浏览器对跨域访问做了很多限制，但有时我们的确需要做跨域访问，那要怎么办？主要有以下几种情况：

### 1. iframe的跨域访问 ###

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

2). 当主域名不同时，就非常麻烦了。大致的方法像下面描述的那样：

- a.com下有a.html；
- a.html创建iframe加载b.com下的b.html，可在加载b.html时通过?或#将参数传递到b.html中；
- b.html加载后，可以通过提取location.search或location.hash中的内容获取a.html传过来的参数；
- b.html创建一个iframe，加载a.com下的c.html，并且参数也通过?或#传给c.html；
- 因为c.html和a.html是相同域名，所以c.html可以使用parent.parent访问到a.html的对象，这样也就可以将b.html需要传递的参数传回到a.html中。

### 2. Ajax的跨域访问 ###

Ajax主要通过XMLHttpRequest对象实现，但是如果通过XMLHttpRequest访问不同域名下的数据，浏览器会出现类似下面的错误：

> XMLHttpRequest cannot load http://b.com/demo/iframe/ajax/b.html. No 'Access-Control-Allow-Origin' header is present on the requested resource. Origin 'http://a.com' is therefore not allowed access.

#### 这时可由以下两种方法解决： ####

1). 使用&lt;script>代替XMLHttpRequest，也就是JSONP的方法。利用&lt;script>标签的src下加载的js不受同源策略限制，并且加载后的js运行在当前页面的域下，所以可自由操作当前页面的内容。

下面的代码演示了在a.com下的a.html通过b.com下的b.js中的内容来更新自身的p标签。

__a.html__

    <html>
      <head>
        <script>
          function update_p (content) {
            document.getElementById("_p").innerHTML = content;
          }
          function getFromB() {
            var _script = document.createElement("script");
            _script.type = "text/javascript";
            _script.src = "http://b.com/demo/ajax/b.js";
            document.getElementsByTagName("head")[0].appendChild(_script);
          }
        </script>
      </head>
      <body>
        <p id="_p">a.html</p>
        <input type="button" value="Get from b.com" onclick="getFromB()"/>
      </body>
    </html>

__b.js__

    update_p("content from b.js");

在实际使用中，通常a.html会将update_p以callback参数名传递给b.com的服务器，服务器动态生成数据后，再用callback参数值包起来作为响应回传给a.html。

2). 在b.com的服务器返回信息中增加以下头信息：

- Access-Control-Allow-Origin: http://a.com
- Access-Control-Allow-Methods: GET

此时浏览器便允许a.com读取使用GET请求b.com的内容。

_对于flash来说，会要求在网站根目录下放一个名为crossdomain.xml的文件，以指明允许访问的域名来源。文件中的内容类似下面的样子：_

    <cross-domain-policy>
      <allow-access-from domain="*.a.com" />
    </cross-domain-policy>

### 3. 使用HTML5的postMessage方法实现跨域访问 ###

HTML5增加了跨文档消息传输，下面的例子实现了使用postMessage在不同域间传递消息：

__a.html__

    <html>
      <head>
        <script>
          function update_b () {
            var _iframe = document.getElementById("_iframe");
    	_iframe.contentWindow.postMessage("content from a.html", "http://b.com");
          }
        </script>
      <head>
      <body>
        <iframe id="_iframe" src="http://b.com/demo/html5/b.html"></iframe>
        <br>
        <input type="button" value="Update b.html" onclick="update_b()"></input>
      </body>
    </html>

__b.html__

    <html>
      <head>
        <script>
          window.addEventListener("message", function (event) {
            document.getElementById("_p").innerHTML = event.data;
          }, false);
        </script>
      </head>
      <body>
        <p id="_p">b.html</p>
      </body>
    </html>

在postMessage中要指定接收方的域名，如果发现目标页面的域名不正确，将抛出类似下面这样的错误：

> Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('http://c.com') does not match the recipient window's origin ('http://b.com').

_浏览器对跨域访问的限制是出于安全考虑的，所以在使用一些方法实现跨域访问时要特别小心。_