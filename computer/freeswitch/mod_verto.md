mod_verto
==================================================

# 关于

Verto(VER-to) RTC是一个FreeSWITCH端点，实现了基于WebSocket连接的JSON-RPC的子集，最初的目标是使浏览器和其他设备可以使用WebRTC。它允许浏览器或其他WebRTC设备使用Verto发起一个呼叫，然后FreeSWITCH可以再转接到PSTN设备，这些设备可能使用SIP、SS7或其他协议。

mod_verto是一个信令协议，它依赖mod_rtc来实现安全的媒体流服务。

# 功能

Verto有一个Javascript包，用于在浏览器与服务器通过JSON通讯，提供信令通道，用于会话管理、呼叫控制、文本消息、事件消息及其他用户数据交换。

# 应用

Verto实现许多功能，它的信令协议使web开发者从巨大的负担中解脱出来，一个简单的Javascript就可以使浏览器参与一个会议，可以准实时地显示会议参与者以及谁在讲话；主持人可以控制静音或踢出一个参与者。

# verto.conf.xml

```xml
<configuration name="verto.conf" description="HTML5 Verto Endpoint">

  <settings>
    <param name="debug" value="0"/>
    <!-- seconds to wait before hanging up a disconnected channel -->
    <!-- <param name="detach-timeout-sec" value="120"/> -->
    <!-- enable broadcasting all FreeSWITCH events in Verto -->
    <!-- <param name="enable-fs-events" value="false"/> -->
    <!-- enable broadcasting FreeSWITCH presence events in Verto -->
    <!-- <param name="enable-presence" value="true"/> -->
  </settings>

  <profiles>
    <profile name="default-v4">
      <param name="bind-local" value="$${local_ip_v4}:8081"/>
      <param name="bind-local" value="$${local_ip_v4}:8082" secure="true"/>
      <param name="force-register-domain" value="$${domain}"/>
      <param name="secure-combined" value="$${certs_dir}/wss.pem"/>
      <param name="secure-chain" value="$${certs_dir}/wss.pem"/>
      <param name="userauth" value="true"/>
      <!-- setting this to true will allow anyone to register even with no account so use with care -->
      <param name="blind-reg" value="false"/>
      <param name="mcast-ip" value="224.1.1.1"/>
      <param name="mcast-port" value="1337"/>
      <param name="rtp-ip" value="$${local_ip_v4}"/>
      <!--  <param name="ext-rtp-ip" value=""/> -->
      <param name="ext-rtp-ip" value="180.173.155.172"/>
      <param name="local-network" value="localnet.auto"/>
      <param name="outbound-codec-string" value="opus,vp8"/>
      <param name="inbound-codec-string" value="opus,vp8"/>

      <param name="apply-candidate-acl" value="localnet.auto"/>
      <param name="apply-candidate-acl" value="wan_v4.auto"/>
      <param name="apply-candidate-acl" value="rfc1918.auto"/>
      <param name="apply-candidate-acl" value="any_v4.auto"/>
      <param name="timer-name" value="soft"/>

    </profile>

    <profile name="default-v6">
      <param name="bind-local" value="[$${local_ip_v6}]:8081"/>
      <param name="bind-local" value="[$${local_ip_v6}]:8082" secure="true"/>
      <param name="force-register-domain" value="$${domain}"/>
      <param name="secure-combined" value="$${certs_dir}/wss.pem"/>
      <param name="secure-chain" value="$${certs_dir}/wss.pem"/>
      <param name="userauth" value="true"/>
      <!-- setting this to true will allow anyone to register even with no account so use with care -->
      <param name="blind-reg" value="false"/>
      <param name="rtp-ip" value="$${local_ip_v6}"/>
      <!--  <param name="ext-rtp-ip" value=""/> -->
      <param name="outbound-codec-string" value="opus,vp8"/>
      <param name="inbound-codec-string" value="opus,vp8"/>

      <param name="apply-candidate-acl" value="wan_v6.auto"/>
      <param name="apply-candidate-acl" value="rfc1918.auto"/>
      <param name="apply-candidate-acl" value="any_v6.auto"/>
      <param name="apply-candidate-acl" value="wan_v4.auto"/>
      <param name="apply-candidate-acl" value="any_v4.auto"/>
      <param name="timer-name" value="soft"/>

    </profile>
  </profiles>
</configuration>

```
























