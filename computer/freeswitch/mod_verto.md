mod_verto
==================================================

# 关于

Verto(VER-to) RTC是一个FreeSWITCH端点，实现了基于WebSocket连接的JSON-RPC的子集，最初的目标是使浏览器和其他设备可以使用WebRTC。它允许浏览器或其他WebRTC设备使用Verto发起一个呼叫，然后FreeSWITCH可以再转接到PSTN设备，这些设备可能使用SIP、SS7或其他协议。

mod_verto是一个信令协议，它依赖mod_rtc来实现安全的媒体流服务。

# 功能

Verto有一个Javascript包，用于在浏览器与服务器通过JSON通讯，提供信令通道，用于会话管理、呼叫控制、文本消息、事件消息及其他用户数据交换。

# 应用

Verto实现许多功能，它的信令协议使web开发者从巨大的负担中解脱出来，一个简单的Javascript就可以使浏览器参与一个会议，可以准实时地显示会议参与者以及谁在讲话；主持人可以控制静音或踢出一个参与者。

# 配置

mod_verto实现为一个FreeSWITCH的接入点，使用JSON-RPC的子集，并基于websocket。

mod_verto是一个信令协议，它依赖mod_rtc用于媒体流服务。

mod_verto是在1.5版加入的，目前在Master分支，你可以查看社区页面来参与开发和测试这个灵活的协议。

# 证书

WebRTC和WSS的主要设计目标是在安全连线下进行，这并不是事后添加的。为了使用WebRTC的实现必须安装适当的证书。

# 会议

为了开启livearray功能，来准实时地获取会议状态的事件，在conf/autoload_configs/conference.conf.xml中增加下面的设置：

```xml
<param name="conference-flags" value="livearray-sync"/>
```

这将开启一种事件来报告，比如允许一个页面显示谁正在会议中讲话。

为了收到JSON格式的livearray，打开livearray-json-status：

```xml
<param name="conference-flags" value="livearray-sync|livearray-json-status"/>
```



























