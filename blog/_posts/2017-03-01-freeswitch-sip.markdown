---
layout: post
title: "FreeSWITCH入门"
date: 2017-03-02 11:50
categories: ["FreeSWITCH", "SIP.JS"]
---

SIP服务器系统五花八门，但只有FreeSWITCH持续更新，社区也比较活跃。FreeSWITCH功能丰富，支持WebSocket，支持媒体透传、转码等，相对来说，也比较容易上手。

安装FreeSWITCH
------------------------------

安装时参考https://freeswitch.org/confluence/display/FREESWITCH/Debian+8+Jessie，由于官方强烈推荐使用Debian 8 Jessie系统，所以准备的服务器安装了debian-8.7.1-amd64。

切换到root下，使用源码安装master分支，参考官网安装说明的Compiling Latest Master (for testing)部分。

```shell
# 安装依赖
wget -O - https://files.freeswitch.org/repo/deb/debian/freeswitch_archive_g0.pub | apt-key add -
echo "deb http://files.freeswitch.org/repo/deb/freeswitch-1.6/ jessie main" > /etc/apt/sources.list.d/freeswitch.list
echo "deb http://files.freeswitch.org/repo/deb/debian-unstable/ jessie main" >> /etc/apt/sources.list.d/freeswitch.list
apt-get update
apt-get install -y --force-yes freeswitch-video-deps-most

# Git处理
git config --global pull.rebase true

# 取源码
cd /usr/src/
git clone https://freeswitch.org/stash/scm/fs/freeswitch.git freeswitch
cd freeswitch

# -j的参数用于加速
./bootstrap.sh -j

# 增加mod_av模块
perl -i -pe 's/#applications\/mod_av/applications\/mod_av/g' modules.conf

# 编译安装
./configure
make
make install
make cd-sounds-install cd-moh-install
```

修改FreeSWITCH配置

```shell
# 修改默认密码，不然呼叫时会有10秒等待
sed -i 's/default_password=1234/default_password=8888/g' /usr/local/freeswitch/conf/vars.xml

# 增加H264编码支持
sed -i 's/global_codec_prefs=OPUS,G722,PCMU,PCMA,VP8/global_codec_prefs=OPUS,G722,PCMU,PCMA,VP8,H264/g' /usr/local/freeswitch/conf/vars.xml
sed -i 's/outbound_codec_prefs=OPUS,G722,PCMU,PCMA,VP8/outbound_codec_prefs=OPUS,G722,PCMU,PCMA,VP8,H264/g' /usr/local/freeswitch/conf/vars.xml

# 增加candidate-acl
sed -i -e '/<settings>/a\<param name="apply-candidate-acl" value="rfc1918.auto"/>' /usr/local/freeswitch/conf/sip_profiles/internal.xml
sed -i -e '/<settings>/a\<param name="apply-candidate-acl" value="localnet.auto"/>' /usr/local/freeswitch/conf/sip_profiles/internal.xml

# 加载mod_av模块
sed -i 's/<!--<load module="mod_av"\/>-->/<load module="mod_av"\/>/g' /usr/local/freeswitch/conf/autoload_configs/modules.conf.xml
```

启动FreeSWITCH

```shell
/usr/local/freeswitch/bin/freeswitch -nc -nonat
# -nc 为后台启动
# -nonat 为非nat环境

# 启动后使用fs_cli命令可以连接到freeswitch服务
/usr/local/freeswitch/bin/fs_cli

# Ctrl + D 退出
```

运行一次/usr/local/freeswitch/bin/freeswitch -nc -nonat，FreeSWITCH会建立目录/usr/local/freeswitch/certs，将所需的ssl证书替换掉/usr/local/freeswitch/certs/wss.pem中的内容，重启FreeSWITCH。

SIP Demo
------------------------------

基于sipjs的浏览器端sip demo，sipjs官网：https://sipjs.com/，下载版本为0.7.7。

demo.html

```html
<html>
  <head>
    <title>SIP Demo</title>
  </head>
  <body>
    <video id="remoteVideo"></video>
    <video id="localVideo" muted="muted"></video>
    <p>--------------------------------------------------------------------------------------</p>
    <p>WebSocket服务地址：<input type="text" id="wsserver" value="wss://fswss.picowork.com:7443" style="width:300px;" /></p>
    <p>服务器地址：<input type="text" id="server" value="192.168.18.147" style="width:300px;" /></p>
    <p>号码：<input type="text" id="jid" value="1000" style="width:300px;" /></p>
    <p>密码：<input type="text" id="password" value="8888" style="width:300px;" /></p>
    <p><input type="button" id="login" value="登录" onclick="login();" /></p>
    <p>--------------------------------------------------------------------------------------</p>
    <p>呼叫号码：<input type="text" id="tojid" value="1001" style="width:300px;" /></p>
    <p><input type="button" id="call" value="呼叫" onclick="call();" /></p>

    <script src="sip-0.7.7.js"></script>
    <script src="demo.js"></script>
  </body>
</html>
```

demo.js

```javascript
var userAgent;

function login() {
    var wsserver = document.getElementById('wsserver').value;
    var server = document.getElementById('server').value;
    var jid = document.getElementById('jid').value;
    var password = document.getElementById('password').value;

    var uri = jid + '@' + server;

    userAgent = new SIP.UA({
        traceSip: true,
        uri: uri,
        wsServers: [wsserver],
        authorizationUser: jid,
        password: password
    });

    userAgent.on('invite', function (session) {
        session.accept(options);
    });
};

var options = {
        media: {
            constraints: {
                audio: true,
                video: true
            },
            render: {
                remote: document.getElementById('remoteVideo'),
                local: document.getElementById('localVideo')
            }
        }
    };
function call() {
    var server = document.getElementById('server').value;
    var tojid = document.getElementById('tojid').value;

    var to = tojid + '@' + server;
    console.log('TO: ' + to);

    userAgent.invite(to, options);
}
```

测试
------------------------------

配置好ssl，或者在localhost下访问页面，如：http://localhost/demo.html。

Chrome浏览器打开两个Tab，分别登录到不同的帐号下，就可以互相呼叫。呼叫3500即可以进入FreeSWITCH视频会议。

<i>PS: Cisco SX20注册上来，可进入会议室与Chrome互通，Chrome可呼叫Cisco并接通，但Cisco呼叫Chrome无法接通，媒体协商失败！！！调整inbound-zrtp-passthru设置也没有效果。</i>

