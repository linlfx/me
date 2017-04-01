XML User Directory
==================================================

# User settings

```xml
<include>
  <!-- id：SIP用户名，可以纯数字，也可以字母数字混合 -->
  <!-- number-alias：【可选项】数字别名，当id是字母数字混合时，可以在这里定义一个简单的分机号。当其他人呼叫这个分机号时，可以找到这个用户ID（结合使用mod_xml_curl时有性能影响）。 -->
  <!-- cidr：【可选项】，只能从某个IP地址可以登录 -->
  <user id="demo@sip.com" number-alias="1000" cidr="12.34.56.78/32,20.0.0.0/8">
    <params>
      <!-- SIP密码 -->
      <param name="password" value="correcthorsebatterystaple"/>
      <!-- 语音信箱（voicemail）密码 -->
      <param name="vm-password" value="8761"/>
    </params>
    
    <!-- 公共变量，在主叫或被叫时，会绑定到Channel上成为Channel Variable -->
    <variables>
      <!-- 这个值用于拨号计划的验证和权限，同时也用于区分呼叫明细记录（CDR） -->
      <variable name="accountcode" value="1000"/>
      <!-- 魔法变量：指定环境（context），将覆盖在sip_profiles的internal和external中设置的context，那些地方设置为public。对应conf/dialplan下设置的context，通过public限制较多，而default可以拨打得更多 -->
      <variable name="user_context" value="default"/>
      <!-- 魔法变量：用于出站时呼叫者ID名称 -->
      <variable name="effective_caller_id_name" value="Extension 1000"/>
      <!-- 魔法变量：用于出站时呼叫者ID的名称或号码 -->
      <variable name="effective_caller_id_number" value="1000"/>
    </variables>
  </user>
</include>
```

# Groups

一个分组是多个用户的逻辑集合，group_call应用可以同时或顺序呼叫某个组的用户。分组方式是可选的，你可以直接将用户加到<domain>节点里。

```xml
<include>
  <!-- 在vars.xml中可以设置domain，否则系统自动获取IP -->
  <domain name="$${domain}">
    <!-- 该domain下的公共参数，可以被group或user下的参数覆盖 -->
    <params>
      <!-- 呼叫字符串，freeswitch根据username和domain找到呼叫字符串，并扩展成实际SIP地址 -->
      <param name="dial-string" value="{^^:sip_invite_domain=${dialed_domain}:presence_id=${dialed_user}@${dialed_domain}}${sofia_contact(*/${dialed_user}@${dialed_domain})},${verto_contact(${dialed_user}@${dialed_domain})}"/>
      <!-- 允许使用verto信令 -->
      <param name="jsonrpc-allowed-methods" value="verto"/>
      <!-- <param name="jsonrpc-allowed-event-channels" value="demo,conference,presence"/> -->
    </params>

    <!-- 公共变量，可以被group或user下的参数覆盖 -->
    <variables>
      <variable name="record_stereo" value="true"/>
      <variable name="default_gateway" value="$${default_provider}"/>
      <variable name="default_areacode" value="$${default_areacode}"/>
      <variable name="transfer_fallback_extension" value="operator"/>
    </variables>

    <groups>
      <!-- name随便取 -->
      <group name="default">
        <users>
          <!-- X-PRE-PROCESS是一个预处理指令，freeswitch在加载时对内容简单替换，不分析xml语法 -->
          <X-PRE-PROCESS cmd="include" data="default/*.xml"/>
        </users>
      </group>

      <group name="sales">
        <users>
          <!-- type="pointer"标识一个已经定义过的用户 -->
          <user id="1000" type="pointer"/>
        </users>
      </group>
    </groups>
  </domain>
</include>
```









