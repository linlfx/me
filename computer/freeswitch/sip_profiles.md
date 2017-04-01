SIP模块
==================================================

SIP功能由mod_sofia模块实现，它实现了注册服务器、重定向服务器、媒体服务器、呈现服务器、SBC（边界会话控制器，主要作用相当于防火墙，避免外界攻击）等各种功能，但没有SIP代理服务器的功能。

SIP Profile：相当于一个SIP UA，每个SIP Profile可以监听不同的IP和端口对。

Gateway：一个SIP Profile中可以有多个网关，主要配置远端SIP服务器，FreeSWITCH作为一个SIP客户端向远端服务器注册或相互通讯。

本地SIP用户：FreeSWITCH作为注册服务器时，其他SIP客户端向它注册后，就是一个本地SIP用户。

# internal.xml

```xml
<!-- 这个名字不需要和文件名一样，随便改什么都可以，但是其他地方会引用 -->
<profile name="internal">
  <!-- 别名可以与profile name一样被引用 -->
  <aliases>
    <!--
        <alias name="default"/>
    -->
  </aliases>
  <!-- 网关，外部注册信息 -->
  <gateways>
  </gateways>

  <!-- 可以是IP或域名，但是在hosts中的设置可能不好用 -->
  <domains>
    <!-- 
        当name等于all时，会检查用户目录（conf/directory）下定义的所有domain；如果name等于某个特定的域名，则只检查用户目录下定义的特定domain。
        当alias等于true时，会为所有domain取一个别名？？？？（什么意思？）
        当parse等于true时，会解析该Profile中所有的网关。
        alias和parse有排它性，在多个Profile的情况下，它们的值只能有一个为true。
     -->
    <!--<domain name="$${domain}" parse="true"/>-->
    <!--<domain name="all" alias="true" parse="true"/>-->
    <domain name="all" alias="true" parse="false"/>
  </domains>

  <settings>
    <!-- inject delay between dtmf digits on send to help some slow interpreters (also per channel with rtp_digit_delay var -->
    <!-- <param name="rtp-digit-delay" value="40"/>-->

    <!--
        当FreeSWITCH是没有媒体的，那么设置了这个参数后，当在话机按下Hold键时，FreeSWITCH将回到有媒体的状态。
    -->
    <!--<param name="media-option" value="resume-media-on-hold"/> -->

    <!--
        当FreeSWITCH是没有媒体的，设置了这个参数后，在执行协商转移之前，通过re-INVITE请求回媒体状态，转接结束后，再回到Bypass Media的状态。
    -->
    <!--<param name="media-option" value="bypass-media-after-att-xfer"/>-->

    <!-- Can be set to "_undef_" to remove the User-Agent header -->
    <!-- <param name="user-agent-string" value="FreeSWITCH Rocks!"/> -->

    <param name="debug" value="0"/>
    <!-- If you want FreeSWITCH to shutdown if this profile fails to load, uncomment the next line. -->
    <!-- <param name="shutdown-on-fail" value="true"/> -->
    <param name="sip-trace" value="no"/>
    <param name="sip-capture" value="no"/>

    <!-- Use presence_map.conf.xml to convert extension regex to presence protos for routing -->
    <!-- <param name="presence-proto-lookup" value="true"/> -->


    <!-- Don't be picky about negotiated DTMF just always offer 2833 and accept both 2833 and INFO -->
    <!--<param name="liberal-dtmf" value="true"/>-->


    <!--
        Sometimes, in extremely rare edge cases, the Sofia SIP stack may stop
        responding. These options allow you to enable and control a watchdog
        on the Sofia SIP stack so that if it stops responding for the
        specified number of milliseconds, it will cause FreeSWITCH to crash
        immediately. This is useful if you run in an HA environment and
        need to ensure automated recovery from such a condition. Note that if
        your server is idle a lot, the watchdog may fire due to not receiving
        any SIP messages. Thus, if you expect your system to be idle, you
        should leave the watchdog disabled. It can be toggled on and off
        through the FreeSWITCH CLI either on an individual profile basis or
        globally for all profiles. So, if you run in an HA environment with a
        master and slave, you should use the CLI to make sure the watchdog is
        only enabled on the master.
        If such crash occurs, FreeSWITCH will dump core if allowed. The
        stacktrace will include function watchdog_triggered_abort().
    -->
    <param name="watchdog-enabled" value="no"/>
    <param name="watchdog-step-timeout" value="30000"/>
    <param name="watchdog-event-timeout" value="30000"/>

    <param name="log-auth-failures" value="false"/>
    <param name="forward-unsolicited-mwi-notify" value="false"/>

    <!-- 设置来话将进入拨号计划哪个context进行路由，用户目录中设置的context会覆盖这里的设置 -->
    <param name="context" value="public"/>
    <param name="rfc2833-pt" value="101"/>
    <!-- 该Profile有电话呼入时，到哪个拨号计划进行路由 -->
    <param name="dialplan" value="XML"/>
    <param name="dtmf-duration" value="2000"/>
    <!-- 支持的来话媒体编码 -->
    <param name="inbound-codec-prefs" value="$${global_codec_prefs}"/>
    <!-- 支持的去话媒体编码 -->
    <param name="outbound-codec-prefs" value="$${global_codec_prefs}"/>
    <param name="rtp-timer-name" value="soft"/>
    <!-- RTP的IP地址，只能是IP -->
    <param name="rtp-ip" value="$${local_ip_v4}"/>
    <!-- SIP的IP地址，只能是IP -->
    <param name="sip-ip" value="$${local_ip_v4}"/>
    <!-- SIP端口号，这个全局变量默认是5060 -->
    <param name="sip-port" value="$${internal_sip_port}"/>
    <param name="hold-music" value="$${hold_music}"/>
    <param name="apply-nat-acl" value="nat.auto"/>


    <!-- (default true) set to false if you do not wish to have called party info in 1XX responses -->
    <!-- <param name="cid-in-1xx" value="false"/> -->

    <!-- extended info parsing -->
    <!-- <param name="extended-info-parsing" value="true"/> -->

    <!--<param name="aggressive-nat-detection" value="true"/>-->
    <!--
        There are known issues (asserts and segfaults) when 100rel is enabled.
        It is not recommended to enable 100rel at this time.
    -->
    <!--<param name="enable-100rel" value="true"/>-->

    <!-- uncomment if you don't wish to try a next SRV destination on 503 response -->
    <!-- RFC3263 Section 4.3 -->
    <!--<param name="disable-srv503" value="true"/>-->

    <!-- Enable Compact SIP headers. -->
    <!--<param name="enable-compact-headers" value="true"/>-->
    <!--
        enable/disable session timers
    -->
    <!--<param name="enable-timer" value="false"/>-->
    <!--<param name="minimum-session-expires" value="120"/>-->
    <param name="apply-inbound-acl" value="domains"/>
    <!--
        This defines your local network, by default we detect your local network
        and create this localnet.auto ACL for this.
    -->
    <param name="local-network-acl" value="localnet.auto"/>
    <!--<param name="apply-register-acl" value="domains"/>-->
    <!--<param name="dtmf-type" value="info"/>-->


    <!-- 'true' means every time 'first-only' means on the first register -->
    <!--<param name="send-message-query-on-register" value="true"/>-->

    <!-- 'true' means every time 'first-only' means on the first register -->
    <!--<param name="send-presence-on-register" value="first-only"/> -->


    <!-- Caller-ID type (choose one, can be overridden by inbound call type and/or sip_cid_type channel variable -->
    <!-- Remote-Party-ID header -->
    <!--<param name="caller-id-type" value="rpid"/>-->

    <!-- P-*-Identity family of headers -->
    <!--<param name="caller-id-type" value="pid"/>-->

    <!-- neither one -->
    <!--<param name="caller-id-type" value="none"/>-->



    <param name="record-path" value="$${recordings_dir}"/>
    <param name="record-template" value="${caller_id_number}.${target_domain}.${strftime(%Y-%m-%d-%H-%M-%S)}.wav"/>
    <!--enable to use presence -->
    <param name="manage-presence" value="true"/>
    <!-- send a presence probe on each register to query devices to send presence instead of sending presence with less info -->
    <!--<param name="presence-probe-on-register" value="true"/>-->
    <!--<param name="manage-shared-appearance" value="true"/>-->
    <!-- used to share presence info across sofia profiles -->
    <!-- Name of the db to use for this profile -->
    <!--<param name="dbname" value="share_presence"/>-->
    <param name="presence-hosts" value="$${domain},$${local_ip_v4}"/>
    <param name="presence-privacy" value="$${presence_privacy}"/>
    <!-- ************************************************* -->

    <!-- This setting is for AAL2 bitpacking on G726 -->
    <!-- <param name="bitpacking" value="aal2"/> -->
    <!--max number of open dialogs in proceeding -->
    <!--<param name="max-proceeding" value="1000"/>-->
    <!--session timers for all call to expire after the specified seconds -->
    <!--<param name="session-timeout" value="1800"/>-->
    <!-- Can be 'true' or 'contact' -->
    <!--<param name="multiple-registrations" value="contact"/>-->
    <!--set to 'greedy' if you want your codec list to take precedence -->
    <param name="inbound-codec-negotiation" value="generous"/>
    <!-- if you want to send any special bind params of your own -->
    <!--<param name="bind-params" value="transport=udp"/>-->
    <!--<param name="unregister-on-options-fail" value="true"/>-->
    <!-- Send an OPTIONS packet to all registered endpoints -->
    <!--<param name="all-reg-options-ping" value="true"/>-->
    <!-- Send an OPTIONS packet to NATed registered endpoints. Can be 'true' or 'udp-only'. -->
    <!--<param name="nat-options-ping" value="true"/>-->
    <!--<param name="sip-options-respond-503-on-busy" value="true"/>-->
    <!--<param name="sip-messages-respond-200-ok" value="true"/>-->
    <!--<param name="sip-subscribe-respond-200-ok" value="true"/>-->

    <!-- TLS: disabled by default, set to "true" to enable -->
    <param name="tls" value="$${internal_ssl_enable}"/>
    <!-- Set to true to not bind on the normal sip-port but only on the TLS port -->
    <param name="tls-only" value="false"/>
    <!-- additional bind parameters for TLS -->
    <param name="tls-bind-params" value="transport=tls"/>
    <!-- Port to listen on for TLS requests. (5061 will be used if unspecified) -->
    <param name="tls-sip-port" value="$${internal_tls_port}"/>
    <!-- Location of the agent.pem and cafile.pem ssl certificates (needed for TLS server) -->
    <!--<param name="tls-cert-dir" value=""/>-->
    <!-- Optionally set the passphrase password used by openSSL to encrypt/decrypt TLS private key files -->
    <param name="tls-passphrase" value=""/>
    <!-- Verify the date on TLS certificates -->
    <param name="tls-verify-date" value="true"/>
    <!-- TLS verify policy, when registering/inviting gateways with other servers (outbound) or handling inbound registration/invite requests how should we verify their certificate -->
    <!-- set to 'in' to only verify incoming connections, 'out' to only verify outgoing connections, 'all' to verify all connections, also 'subjects_in', 'subjects_out' and 'subjects_all' for subject validation. Multiple policies can be split with a '|' pipe -->
    <param name="tls-verify-policy" value="none"/>
    <!-- Certificate max verify depth to use for validating peer TLS certificates when the verify policy is not none -->
    <param name="tls-verify-depth" value="2"/>
    <!-- If the tls-verify-policy is set to subjects_all or subjects_in this sets which subjects are allowed, multiple subjects can be split with a '|' pipe -->
    <param name="tls-verify-in-subjects" value=""/>
    <!-- TLS version default: tlsv1,tlsv1.1,tlsv1.2 -->
    <param name="tls-version" value="$${sip_tls_version}"/>

    <!-- TLS ciphers default: ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH  -->
    <param name="tls-ciphers" value="$${sip_tls_ciphers}"/>

    <!-- turn on auto-flush during bridge (skip timer sleep when the socket already has data)
         (reduces delay on latent connections default true, must be disabled explicitly)-->
    <!--<param name="rtp-autoflush-during-bridge" value="false"/>-->

    <!--If you don't want to pass through timestamps from 1 RTP call to another (on a per call basis with rtp_rewrite_timestamps chanvar)-->
    <!--<param name="rtp-rewrite-timestamps" value="true"/>-->
    <!--<param name="pass-rfc2833" value="true"/>-->
    <!--If you have ODBC support and a working dsn you can use it instead of SQLite-->
    <!--<param name="odbc-dsn" value="dsn:user:pass"/>-->

    <!-- Or, if you have PGSQL support, you can use that -->
    <!--<param name="odbc-dsn" value="pgsql://hostaddr=127.0.0.1 dbname=freeswitch user=freeswitch password='' options='-c client_min_messages=NOTICE' application_name='freeswitch'" />-->

    <!-- 设置入局呼叫是否启用媒体绕过 -->
    <!--<param name="inbound-bypass-media" value="true"/>-->

    <!--Uncomment to set all inbound calls to proxy media mode-->
    <!--<param name="inbound-proxy-media" value="true"/>-->

    <!-- Let calls hit the dialplan before selecting codec for the a-leg -->
    <param name="inbound-late-negotiation" value="true"/>

    <!-- Allow ZRTP clients to negotiate end-to-end security associations (also enables late negotiation) -->
    <param name="inbound-zrtp-passthru" value="true"/>

    <!-- this lets anything register -->
    <!--  comment the next line and uncomment one or both of the other 2 lines for call authentication -->
    <!-- <param name="accept-blind-reg" value="true"/> -->

    <!-- accept any authentication without actually checking (not a good feature for most people) -->
    <!-- <param name="accept-blind-auth" value="true"/> -->

    <!-- suppress CNG on this profile or per call with the 'suppress_cng' variable -->
    <!-- <param name="suppress-cng" value="true"/> -->

    <!--TTL for nonce in sip auth-->
    <param name="nonce-ttl" value="60"/>
    <!--Uncomment if you want to force the outbound leg of a bridge to only offer the codec
        that the originator is using-->
    <!--<param name="disable-transcoding" value="true"/>-->
    <!-- Handle 302 Redirect in the dialplan -->
    <!--<param name="manual-redirect" value="true"/> -->
    <!-- Disable Transfer -->
    <!--<param name="disable-transfer" value="true"/> -->
    <!-- Disable Register -->
    <!--<param name="disable-register" value="true"/> -->
    <!-- Used for when phones respond to a challenged ACK with method INVITE in the hash -->
    <!--<param name="NDLB-broken-auth-hash" value="true"/>-->
    <!-- add a ;received="<ip>:<port>" to the contact when replying to register for nat handling -->
    <!--<param name="NDLB-received-in-nat-reg-contact" value="true"/>-->
    <!-- 是否对来电进行鉴权，即所有从该Profile进来的INVITE请求都需要经过Digest验证，默认需要 -->
    <param name="auth-calls" value="$${internal_auth_calls}"/>
    <!-- Force the user and auth-user to match. -->
    <param name="inbound-reg-force-matching-username" value="true"/>
    <!-- on authed calls, authenticate *all* the packets not just invite -->
    <param name="auth-all-packets" value="false"/>

    <!-- 
        NAT环境下的公网地址。
        可以使用以下其中一个值:
        ip address            - "12.34.56.78"
        a stun server lookup  - "stun:stun.server.com"
        a DNS name            - "host:host.server.com"
        auto                  - Use guessed ip.
        auto-nat              - Use ip learned from NAT-PMP or UPNP
    -->
    <param name="ext-rtp-ip" value="auto-nat"/>
    <param name="ext-sip-ip" value="auto-nat"/>

    <!-- rtp inactivity timeout -->
    <param name="rtp-timeout-sec" value="300"/>
    <param name="rtp-hold-timeout-sec" value="1800"/>
    <!-- VAD choose one (out is a good choice); -->
    <!-- <param name="vad" value="in"/> -->
    <!-- <param name="vad" value="out"/> -->
    <!-- <param name="vad" value="both"/> -->
    <!--<param name="alias" value="sip:10.0.1.251:5555"/>-->
    <!--
        These are enabled to make the default config work better out of the box.
        If you need more than ONE domain you'll need to not use these options.

    -->
    <!--all inbound reg will look in this domain for the users -->
    <param name="force-register-domain" value="$${domain}"/>
    <!--force the domain in subscriptions to this value -->
    <param name="force-subscription-domain" value="$${domain}"/>
    <!--all inbound reg will stored in the db using this domain -->
    <param name="force-register-db-domain" value="$${domain}"/>


    <!-- for sip over websocket support -->
    <param name="ws-binding"  value=":5066"/>

    <!-- for sip over secure websocket support -->
    <!-- You need wss.pem in $${certs_dir} for wss or one will be created for you -->
    <param name="wss-binding" value=":7443"/>

    <!--<param name="delete-subs-on-register" value="false"/>-->

    <!-- launch a new thread to process each new inbound register when using heavier backends -->
    <!-- <param name="inbound-reg-in-new-thread" value="true"/> -->

    <!-- enable rtcp on every channel also can be done per leg basis with rtcp_audio_interval_msec variable set to passthru to pass it across a call-->
    <!--<param name="rtcp-audio-interval-msec" value="5000"/>-->
    <!--<param name="rtcp-video-interval-msec" value="5000"/>-->

    <!--force suscription expires to a lower value than requested-->
    <!--<param name="force-subscription-expires" value="60"/>-->

    <!-- add a random deviation to the expires value of the 202 Accepted -->
    <!--<param name="sip-subscription-max-deviation" value="120"/>-->

    <!-- disable register and transfer which may be undesirable in a public switch -->
    <!--<param name="disable-transfer" value="true"/>-->
    <!--<param name="disable-register" value="true"/>-->

    <!--
        enable-3pcc can be set to either 'true' or 'proxy', true accepts the call
        right away, proxy waits until the call has been answered then sends accepts
    -->
    <!--<param name="enable-3pcc" value="true"/>-->

    <!-- use at your own risk or if you know what this does.-->
    <!--<param name="NDLB-force-rport" value="true"/>-->
    <!--
        Choose the realm challenge key. Default is auto_to if not set.

        auto_from  - uses the from field as the value for the sip realm.
        auto_to    - uses the to field as the value for the sip realm.
        <anyvalue> - you can input any value to use for the sip realm.

        If you want URL dialing to work you'll want to set this to auto_from.

        If you use any other value besides auto_to or auto_from you'll
        loose the ability to do multiple domains.

        Note: comment out to restore the behavior before 2008-09-29
    -->
    <param name="challenge-realm" value="auto_from"/>
    <!--<param name="disable-rtp-auto-adjust" value="true"/>-->
    <!-- on inbound calls make the uuid of the session equal to the sip call id of that call -->
    <!--<param name="inbound-use-callid-as-uuid" value="true"/>-->
    <!-- on outbound calls set the callid to match the uuid of the session -->
    <!--<param name="outbound-use-uuid-as-callid" value="true"/>-->
    <!-- set to false disable this feature -->
    <!--<param name="rtp-autofix-timing" value="false"/>-->

    <!-- set this param to false if your gateway for some reason hates X- headers that it is supposed to ignore-->
    <!--<param name="pass-callee-id" value="false"/>-->

    <!-- clear clears them all or supply the name to add or the name
         prefixed with ~ to remove valid values:

           clear
           CISCO_SKIP_MARK_BIT_2833
           SONUS_SEND_INVALID_TIMESTAMP_2833

    -->
    <!--<param name="auto-rtp-bugs" data="clear"/>-->

    <!-- the following can be used as workaround with bogus SRV/NAPTR records -->
    <!--<param name="disable-srv" value="false" />-->
    <!--<param name="disable-naptr" value="false" />-->

    <!-- The following can be used to fine-tune timers within sofia's transport layer
         Those settings are for advanced users and can safely be left as-is -->

    <!-- Initial retransmission interval (in milliseconds).
         Set the T1 retransmission interval used by the SIP transaction engine.
         The T1 is the initial duration used by request retransmission timers A and E (UDP) as well as response retransmission timer G.   -->
    <!-- <param name="timer-T1" value="500" /> -->

    <!--  Transaction timeout (defaults to T1 * 64).
         Set the T1x64 timeout value used by the SIP transaction engine.
         The T1x64 is duration used for timers B, F, H, and J (UDP) by the SIP transaction engine.
         The timeout value T1x64 can be adjusted separately from the initial retransmission interval T1. -->
    <!-- <param name="timer-T1X64" value="32000" /> -->


    <!-- Maximum retransmission interval (in milliseconds).
         Set the maximum retransmission interval used by the SIP transaction engine.
         The T2 is the maximum duration used for the timers E (UDP) and G by the SIP transaction engine.
         Note that the timer A is not capped by T2. Retransmission interval of INVITE requests grows exponentially
         until the timer B fires.  -->
    <!-- <param name="timer-T2" value="4000" /> -->

    <!--
        Transaction lifetime (in milliseconds).
        Set the lifetime for completed transactions used by the SIP transaction engine.
        A completed transaction is kept around for the duration of T4 in order to catch late responses.
        The T4 is the maximum duration for the messages to stay in the network and the duration of SIP timer K. -->
    <!-- <param name="timer-T4" value="4000" /> -->

    <!-- Turn on a jitterbuffer for every call -->
    <!-- <param name="auto-jitterbuffer-msec" value="60"/> -->


    <!-- By default mod_sofia will ignore the codecs in the sdp for hold/unhold operations
         Set this to true if you want to actually parse the sdp and re-negotiate the codec during hold/unhold.
         It's probably not what you want so stick with the default unless you really need to change this.
    -->
    <!--<param name="renegotiate-codec-on-hold" value="true"/>-->

    <!-- By default mod_sofia will send "100 Trying" in response to a SIP INVITE. Set this to false if
         you want to turn off this behavior and manually send the "100 Trying" via the acknowledge_call application.
    -->
    <!--<param name="auto-invite-100" value="false"/>-->
  </settings>
</profile>
```

# external.xml

```xml
<profile name="external">
  <!-- http://wiki.freeswitch.org/wiki/Sofia_Configuration_Files -->
  <!-- This profile is only for outbound registrations to providers -->
  <gateways>
    <X-PRE-PROCESS cmd="include" data="external/*.xml"/>
  </gateways>

  <aliases>
    <!--
        <alias name="outbound"/>
        <alias name="nat"/>
    -->
  </aliases>

  <domains>
    <domain name="all" alias="false" parse="true"/>
  </domains>

  <settings>
    <param name="debug" value="0"/>
    <!-- If you want FreeSWITCH to shutdown if this profile fails to load, uncomment the next line. -->
    <!-- <param name="shutdown-on-fail" value="true"/> -->
    <param name="sip-trace" value="no"/>
    <param name="sip-capture" value="no"/>
    <param name="rfc2833-pt" value="101"/>
    <!-- RFC 5626 : Send reg-id and sip.instance -->
    <!--<param name="enable-rfc-5626" value="true"/> -->
    <param name="sip-port" value="$${external_sip_port}"/>
    <param name="dialplan" value="XML"/>
    <param name="context" value="public"/>
    <param name="dtmf-duration" value="2000"/>
    <param name="inbound-codec-prefs" value="$${global_codec_prefs}"/>
    <param name="outbound-codec-prefs" value="$${outbound_codec_prefs}"/>
    <param name="hold-music" value="$${hold_music}"/>
    <param name="rtp-timer-name" value="soft"/>
    <!--<param name="enable-100rel" value="true"/>-->
    <!--<param name="disable-srv503" value="true"/>-->
    <!-- This could be set to "passive" -->
    <param name="local-network-acl" value="localnet.auto"/>
    <param name="manage-presence" value="false"/>

    <!-- used to share presence info across sofia profiles
         manage-presence needs to be set to passive on this profile
         if you want it to behave as if it were the internal profile
         for presence.
    -->
    <!-- Name of the db to use for this profile -->
    <!--<param name="dbname" value="share_presence"/>-->
    <!--<param name="presence-hosts" value="$${domain}"/>-->
    <!--<param name="force-register-domain" value="$${domain}"/>-->
    <!--all inbound reg will stored in the db using this domain -->
    <!--<param name="force-register-db-domain" value="$${domain}"/>-->
    <!-- ************************************************* -->

    <!--<param name="aggressive-nat-detection" value="true"/>-->
    <param name="inbound-codec-negotiation" value="generous"/>
    <param name="nonce-ttl" value="60"/>
    <param name="auth-calls" value="false"/>
    <param name="inbound-late-negotiation" value="true"/>
    <param name="inbound-zrtp-passthru" value="true"/> <!-- (also enables late negotiation) -->
    <!--
        DO NOT USE HOSTNAMES, ONLY IP ADDRESSES IN THESE SETTINGS!
    -->
    <param name="rtp-ip" value="$${local_ip_v4}"/>
    <param name="sip-ip" value="$${local_ip_v4}"/>
    <param name="ext-rtp-ip" value="auto-nat"/>
    <param name="ext-sip-ip" value="auto-nat"/>
    <param name="rtp-timeout-sec" value="300"/>
    <param name="rtp-hold-timeout-sec" value="1800"/>
    <!--<param name="enable-3pcc" value="true"/>-->

    <!-- TLS: disabled by default, set to "true" to enable -->
    <param name="tls" value="$${external_ssl_enable}"/>
    <!-- Set to true to not bind on the normal sip-port but only on the TLS port -->
    <param name="tls-only" value="false"/>
    <!-- additional bind parameters for TLS -->
    <param name="tls-bind-params" value="transport=tls"/>
    <!-- Port to listen on for TLS requests. (5081 will be used if unspecified) -->
    <param name="tls-sip-port" value="$${external_tls_port}"/>
    <!-- Location of the agent.pem and cafile.pem ssl certificates (needed for TLS server) -->
    <!--<param name="tls-cert-dir" value=""/>-->
    <!-- Optionally set the passphrase password used by openSSL to encrypt/decrypt TLS private key files -->
    <param name="tls-passphrase" value=""/>
    <!-- Verify the date on TLS certificates -->
    <param name="tls-verify-date" value="true"/>
    <!-- TLS verify policy, when registering/inviting gateways with other servers (outbound) or handling inbound registration/invite requests how should we verify their certificate -->
    <!-- set to 'in' to only verify incoming connections, 'out' to only verify outgoing connections, 'all' to verify all connections, also 'subjects_in', 'subjects_out' and 'subjects_all' for subject validation. Multiple policies can be split with a '|' pipe -->
    <param name="tls-verify-policy" value="none"/>
    <!-- Certificate max verify depth to use for validating peer TLS certificates when the verify policy is not none -->
    <param name="tls-verify-depth" value="2"/>
    <!-- If the tls-verify-policy is set to subjects_all or subjects_in this sets which subjects are allowed, multiple subjects can be split with a '|' pipe -->
    <param name="tls-verify-in-subjects" value=""/>
    <!-- TLS version ("sslv23" (default), "tlsv1"). NOTE: Phones may not work with TLSv1 -->
    <param name="tls-version" value="$${sip_tls_version}"/>
  </settings>
</profile>
```




