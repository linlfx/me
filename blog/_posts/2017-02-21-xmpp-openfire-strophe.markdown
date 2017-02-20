---
layout: post
title: "使用Openfire和Strophe构建基于XMPP的IM简单示例"
date: 2017-02-21 01:24
categories: ["IM", "XMPP", "Openfire"]
---

名词解释
------------------------------

XMPP：Extensible Messaging and Presence Protocol，前称Jabber，是一种以XML为基础的开放式实时通信协议。

Openfire：是开源的，基于XMPP，采用Java开发的即时通讯服务器。

Strophe：一个Javascript版的XMPP类库。

BOSH：Bidirectional-streams Over Synchronous HTTP，为双向同步数据提供一个模拟层，借助这个标准可以建立一个较长的HTTP连接，当有新数据时，马上返回数据并关闭，否则请求失效。无论哪种情况，都会重新建立一个请求。

安装Openfire
------------------------------

以下基于Centos6安装Openfire：

1. 下载openfire-4.1.2-1.x86_64.rpm

- http://www.igniterealtime.org/downloads/index.jsp

2. 安装

```shell
sudo rpm -ivh openfire-4.1.2-1.x86_64.rpm
```

Openfire会被安装在/opt/openfire。

3. 启动

```shell
sudo /etc/init.d/openfire start
```

4. Web界面配置

浏览器访问服务器9090端口，如：http://172.16.218.131:9090/

进入后，语言选『简体中文』，数据库选择『嵌入的数据库』，设置管理员密码，其他默认。最后进入管理界面（使用admin和刚才设置的密码登录）。

在『服务器』-『服务器设置』-『HTTP绑定』-『Script Syntax』中选择『启用』，保存设置。

安装Nginx
------------------------------

使用Nginx作为htto-bind代理，并提供Web服务。

1. 创建源配置文件

```shell
sudo vi /etc/yum.repos.d/nginx.repo

# 填入如下内容：
[nginx]
name=nginx repo
baseurl=http://nginx.org/packages/centos/$releasever/$basearch/
gpgcheck=0
enabled=1
```

2. 安装Nginx

```shell
sudo yum install nginx -y
```

3. 修改配置

```shell
sudo vi /etc/nginx/conf.d/default.conf

# 在server节点下增加下列内容：
location /http-bind {
    proxy_pass http://127.0.0.1:7070;
}
```

4. 启动Nginx

```shell
sudo nginx
```

创建HTML和JS
------------------------------

1. 进入Nginx页面根目录

```shell
cd /usr/share/nginx/html/
```

2. 创建HTML

```shell
sudo vi imdemo.html
```

# 内容如下：

```html
<!DOCTYPE html>
<html>
<head>
    <script src='//cdn.bootcss.com/jquery/1.9.1/jquery.min.js'></script>
    <script src='//cdn.bootcss.com/strophe.js/1.2.12/strophe.min.js'></script>
    <script src='imdemo.js'></script>
</head>
<body>
    JID：<input type="text" id="input-jid">
    <br>
    密码：<input type="password" id="input-pwd">
    <br>
    <button id="btn-login">登录</button>
    <div id="msg" style="height: 400px; width: 400px; overflow: scroll;"></div>
    联系人JID：
    <input type="text" id="input-contacts">
    <br>
    消息：
    <br>
    <textarea id="input-msg" cols="30" rows="4"></textarea>
    <br>
    <button id="btn-send">发送</button>
</body>
</html>
```

3. 创建JS

```shell
sudo vi imdemo.js
```

# 内容如下：

```javascript
// XMPP服务器BOSH地址
var BOSH_SERVICE = '/http-bind/';

// XMPP连接
var connection = null;

// 当前状态是否连接
var connected = false;

// 当前登录的JID
var jid = "";

// 连接状态改变的事件
function onConnect(status) {
    console.log('status: ' + status)
    if (status == Strophe.Status.CONNFAIL) {
        alert("连接失败！");
    } else if (status == Strophe.Status.AUTHFAIL) {
        alert("登录失败！");
    } else if (status == Strophe.Status.DISCONNECTED) {
        alert("连接断开！");
        connected = false;
    } else if (status == Strophe.Status.CONNECTED) {
        alert("连接成功，可以开始聊天了！");
        connected = true;

        // 当接收到<message>节，调用onMessage回调函数
        connection.addHandler(onMessage, null, 'message', null, null, null);

        // 首先要发送一个<presence>给服务器（initial presence）
        connection.send($pres().tree());
    }
}

// 接收到<message>
function onMessage(msg) {
    console.log('--- msg ---', msg);

    // 解析出<message>的from、type属性，以及body子元素
    var from = msg.getAttribute('from');
    var type = msg.getAttribute('type');
    var elems = msg.getElementsByTagName('body');

    if (type == "chat" && elems.length > 0) {
        var body = elems[0];
        $("#msg").append(from + ":<br>" + Strophe.getText(body) + "<br>")
    }
    return true;
}

$(document).ready(function() {

    // 通过BOSH连接XMPP服务器
    $('#btn-login').click(function() {
        if(!connected) {
            console.log('jid: ' + $("#input-jid").val());
            console.log('pwd: ' + $("#input-pwd").val());
            connection = new Strophe.Connection(BOSH_SERVICE);
            connection.connect($("#input-jid").val(), $("#input-pwd").val(), onConnect);
            jid = $("#input-jid").val();
        }
    });

    // 发送消息
    $("#btn-send").click(function() {
        if(connected) {
            if($("#input-contacts").val() == '') {
                alert("请输入联系人！");
                return;
            }

            // 创建一个<message>元素并发送
            var msg = $msg({
                to: $("#input-contacts").val(),
                from: jid, 
                type: 'chat'
            }).c("body", null, $("#input-msg").val());
            connection.send(msg.tree());

            $("#msg").append(jid + ":<br>" + $("#input-msg").val() + "<br>");
            $("#input-msg").val('');
        } else {
            alert("请先登录！");
        }
    });
});
```

Openfire添加用户
------------------------------

进入Openfire管理控制台，『用户/用户群』-『用户』-『新建用户』，创建两个用户，用户名为one和two，密码都为111111。

测试
------------------------------

打开浏览器，输入imdemo.html的地址，如：http://172.16.218.131/imdemo.html。

『JID』输入one@localhost，『密码』输入111111，登录。

再打开一个Tab，同样的网址，『JID』输入two@localhost，输入密码后登录。

在登录one的页面中，『联系人JID』输入two@localhost，并输入『消息』后发送。two的页面可立即看到消息。同样，在two的页面，『联系人JID』输入one@localhost，并输入『消息』后发送。one的页面可立即看到消息。

![]({{ "/images/xmpp-openfire-strophe/demo.png" | prepend: site.baseurl }})
