---
layout: post
title: "基于XMPP实现WebRTC通讯"
date: 2017-02-22 00:18
categories: ["WebRTC", "XMPP", "Openfire"]
---

基于上一篇安装的Openfire和XMPP的知识，实现一个简单的P2P视频通讯。

创建HTML和JS
------------------------------

ofwebrtc.html

```html
<html>
<head>
    <script src='//cdn.bootcss.com/jquery/1.9.1/jquery.min.js'></script>
    <script src='//cdn.bootcss.com/strophe.js/1.2.12/strophe.min.js'></script>
    <script src='ofwebrtc.js'></script>
</head>

<body>
    <p id="info"></p>
    <p>----------------------------------------------------------------</p>

    JID：<input type="text" id="input-jid" value="one@localhost">
    <br>
    密码：<input type="password" id="input-pwd" value="111111">
    <br>
    <button id="btn-login">登录</button><br>

    <br>
    目标JID：
    <input type="text" id="input-contacts" value="two@localhost">
    <button id="btn-call">Call</button>
    <p>----------------------------------------------------------------</p>

    Local: <br>
    <video id="localVideo" autoplay></video><br>
    Remote: <br>
    <video id="remoteVideo" autoplay></video>
</body>
</html>
```

ofwebrtc.js

```javascript
// XMPP帮助类
// boshService: XMPP服务器BOSH地址
function XMPPHelper(boshService) {
    var _this = this;

    // XMPP服务器BOSH地址
    _this.boshService = boshService;

    // XMPP连接
    _this.connection = null;

    // 当前状态是否连接
    _this.connected = false;

    // 当前登录的JID
    _this.jid = "";

    // 收到消息后的业务回调方法
    _this.messageCallback = null;
    _this.setMessageCallback = function (messageCallback) {
        _this.messageCallback = messageCallback;
    }

    // 接收到<message>
    var onMessage = function (msg) {
        console.log('--- msg ---', msg);

        // 解析出<message>的from、type属性，以及body子元素
        var from = msg.getAttribute('from');
        var type = msg.getAttribute('type');
        var elems = msg.getElementsByTagName('body');

        var json = JSON.parse(elems[0].innerHTML);
        json.fromjid = from;

        if (type === 'chat') {
            _this.messageCallback(json);
        }

        return true;
    }

    // 连接状态改变的事件
    var onConnect = function (status) {
        console.log('status: ' + status)
        if (status == Strophe.Status.CONNFAIL) {
            $('#info').html("连接失败！");
        } else if (status == Strophe.Status.AUTHFAIL) {
            $('#info').html("登录失败！");
        } else if (status == Strophe.Status.DISCONNECTED) {
            $('#info').html("连接断开！");
            _this.connected = false;
        } else if (status == Strophe.Status.CONNECTED) {
            $('#info').html("连接成功！");
            _this.connected = true;

            // 当接收到<message>节，调用onMessage回调函数
            _this.connection.addHandler(onMessage, null, 'message', null, null, null);

            // 首先要发送一个<presence>给服务器（initial presence）
            _this.connection.send($pres().tree());
        }
    };

    // 登录
    _this.login = function (jid, password) {
        _this.connection = new Strophe.Connection(_this.boshService);
        _this.connection.connect(jid, password, onConnect);
        _this.jid = jid;
    };

    _this.sendMessage = function (tojid, type, data) {
        if (_this.connected === false) {
            alert("请先登录！！！");
            return;
        }

        var msg = $msg({
            to: tojid,
            from: _this.jid,
            type: 'chat'
        }).c("body", null, JSON.stringify({
            type: type,
            data: data
        }));
        _this.connection.send(msg.tree());
    };
}

// WebRTC帮助类
// xmppHelper：XMPP帮助实例
// localVideo：本地视频显示的DOM
// remoteVideo：远端视频显示的DOM
function WebRTCHelper(xmppHelper, localVideo, remoteVideo) {
    var _this = this;

    // 对方用户
    _this.tojid = null;

    // 创建PeerConnection实例 (参数为null则没有iceserver，即使没有stunserver和turnserver，仍可在局域网下通讯)
    _this.pc = new webkitRTCPeerConnection(null);

    _this.hasBindLocalVideo = false;

    // 发送ICE候选到其他客户端
    _this.pc.onicecandidate = function(event){
        console.log('----------- tojid: ' + _this.tojid);
        if (event.candidate !== null && _this.tojid !== null) {
            console.log('----------- onicecandidate ------------');
            console.log('candidate', event.candidate);

            xmppHelper.sendMessage(_this.tojid, 'candidate', event.candidate);
        }
    };

    // 如果检测到媒体流连接到本地，将其绑定到一个video标签上输出
    _this.pc.onaddstream = function(event){
        remoteVideo.src = URL.createObjectURL(event.stream);
    };

    // 发送offer和answer的函数，发送本地session描述
    var sendOfferFn = function(desc){
        console.log('----------- sendOfferFn ------------');
        console.log('desc', desc);
        _this.pc.setLocalDescription(desc);
        
        xmppHelper.sendMessage(_this.tojid, 'offer', desc);
    };
    var sendAnswerFn = function(desc){
        console.log('----------- sendAnswerFn ------------');
        console.log('desc', desc);
        _this.pc.setLocalDescription(desc);

        xmppHelper.sendMessage(_this.tojid, 'answer', desc);
    };

    // 绑定本地视频流
    var bindLocalVideo = function (callback) {
        // 获取本地音频和视频流
        navigator.webkitGetUserMedia({
            "audio": true,
            "video": true
        }, function(stream){
            //绑定本地媒体流到video标签用于输出
            localVideo.src = URL.createObjectURL(stream);
            //向PeerConnection中加入需要发送的流
            _this.pc.addStream(stream);
            callback();
        }, function(error){
            //处理媒体流创建失败错误
            console.log('getUserMedia error: ' + error);
        });
    };

    // 开始视频通讯
    _this.start = function (tojid) {
        _this.tojid = tojid;

        if (_this.hasBindLocalVideo === false) {
            bindLocalVideo(function () {
                // 发送一个offer信令
                _this.pc.createOffer(sendOfferFn, function (error) {
                    console.log('Failure callback: ' + error);
                });
            });
            _this.hasBindLocalVideo = true;
        } else {
            // 发送一个offer信令
            _this.pc.createOffer(sendOfferFn, function (error) {
                console.log('Failure callback: ' + error);
            });
        }
    };

    // 收到对方信息后的处理
    _this.onMessage = function (json) {
        console.log('onMessage: ', json);

        if (_this.tojid === null) {
            _this.tojid = json.fromjid;
        }

        if (json.type === 'candidate') {
            _this.pc.addIceCandidate(new RTCIceCandidate(json.data));
        } else {
            _this.pc.setRemoteDescription(new RTCSessionDescription(json.data));
            if (json.type === 'offer') {
                if (_this.hasBindLocalVideo === false) {
                    bindLocalVideo(function () {
                        _this.pc.createAnswer(sendAnswerFn, function (error) {
                            console.log('Failure callback: ' + error);
                        });
                    });
                    _this.hasBindLocalVideo = true;
                } else {
                    _this.pc.createAnswer(sendAnswerFn, function (error) {
                        console.log('Failure callback: ' + error);
                    });
                }
            }
        }
    }
}

$(document).ready(function() {
    // 实例化XMPP和WebRTC帮助类
    var xmppHelper = new XMPPHelper('/http-bind/');
    var webRTCHelper = new WebRTCHelper(xmppHelper, document.getElementById('localVideo'), document.getElementById('remoteVideo'));

    // XMPP收到消息后转给WebRTC
    xmppHelper.setMessageCallback(webRTCHelper.onMessage);

    $('#btn-login').click(function() {
        console.log('jid: ' + $("#input-jid").val());
        console.log('pwd: ' + $("#input-pwd").val());
        xmppHelper.login($("#input-jid").val(), $("#input-pwd").val());
    });

    $('#btn-call').click(function() {
        if($("#input-contacts").val() == '') {
            alert("请输入目标用户！");
            return;
        }
        tojid = $("#input-contacts").val();

        webRTCHelper.start(tojid);
    });
});
```

测试
------------------------------

打开Chrome，访问ofwebrtc.html页面，如：http://172.16.218.131/ofwebrtc.html。

将JID修改为two@localhost，点击登录。

再打开一个Chrome访问ofwebrtc.html页面，点击登录，然后点击Call呼叫two@localhost。在下面的Local和Remote会出来两个画面。

![]({{ "/images/xmpp-webrtc/demo.png" | prepend: site.baseurl }})

