拨号计划
==================================================

拨号计划的主要功能是对电话进行路由，决定和影响通话的流程。

default.xml：通常是注册用户使用的拨号计划。

public.xml：通常是外部用户使用的拨号计划。

# 通道变量

每一个Session控制一个Channel，每一个Channel就是通话中的一条腿（Call Leg），每一次呼叫都由一条或多条腿组成。通道变量就是用于标识通道的状态、性能等。

所有通道变量都可以在拨号计划中访问，使用${var}的形式（全局变量使用$${var}）。

通道变量的info输出和引用的名称可能是不一样的，比如：输出时名称为Caller-Destination-Number，但引用时使用distination_number；输出时名称为variable_domain_name，引用时使用domain_name。

# 测试条件

```xml
<condition field="destination_number" expression="^(3500)$">
</condition>
```

测试条件不能嵌套，实现逻辑与的写法如下：

```xml
<condition field="network_addr" expression="^192\.168\.18\.116$"/>
<condition field="destination_number" expression="^(3500)$">
</condition>
```

多个condition时，每个condition都可以处理一些action，判断从上到下，直到遇到第一个判断为假的情况。break参数对多个条件的控制有影响，其值的介绍如下：

- on-false：在第一次匹配失败时停止（但继续处理其他的extension），这是默认配置，相当于A and B。
- on-true：在第一次匹配成功时停止（但会先完成对应的action，然后继续处理其他的extension），不成功则继续，相当于(not A) and B。
- always：不管是否匹配，都停止。
- never：不管是否匹配，都继续。

使用break参数可以写出if - then - else这样的例子。

continue：默认为false，当找到满足条件的extension时，就进入执行阶段，不再往下查找其他extension。当设为true时，会继续往下查找extension，找出所有满足条件的extension，然后执行这些extension对应的action。

inline：当action的inline为true时，这个action不需要等到执行阶段，而是在路由阶段就会直接执行。这个参数尽量不要用，属于走了特殊流程。

# Channel状态机

NEW -> INIT -> ROUTING -> EXECUTE -> HANGUP -> REPORTING -> DESTROY

ROUTING：查找解析Dialplan的阶段，只有ROUTING完毕，才进入EXECUTE阶段，ROUTING阶段找出的action都会等到EXECUTE阶段才执行。
EXECUTE：找到合适的入口后，执行一系列动作。这里可能发生转移，可能会转移到同一个context的其他extension，也可能是另一个context的extension，然后重新路由。
HANGUP：无论哪一方挂机，都会进入HANGUP阶段。
REPORTING：一般用于进行统计、计费等。
DESTROY：销毁Channel，释放资源。

# set和export的区别

set：将变量设置到当前Channel上，比如：a-leg上。
export：除了set的功能外，还可以将变量设置到其他相关Channel上，比如：b-leg。如果还没有互相通话，当前只有一条腿，那么set和export的作用其实是一样的。另外，export会额外设置export_vars。

```xml
<action application="export" data="dialed_extension=$1"/>

<!-- 相当于下面两行 -->

<action application="set" data="dialed_extension=$1"/>
<action application="set" data="export_vars=dialed_extension"/>
```

# 默认示例 —— Local_Extension

```xml
    <extension name="Local_Extension">
      <condition field="destination_number" expression="^(10[01][0-9])$">
        <!-- 相当于下面两行
        <action application="set" data="dialed_extension=$1"/>
        <action application="set" data="export_vars=dialed_extension"/>
        -->
        <action application="export" data="dialed_extension=$1"/>

        <!-- 在b-leg上绑定DTMF -->
        <action application="bind_meta_app" data="1 b s execute_extension::dx XML features"/>
        <action application="bind_meta_app" data="2 b s record_session::$${recordings_dir}/${caller_id_number}.${strftime(%Y-%m-%d-%H-%M-%S)}.wav"/>
        <action application="bind_meta_app" data="3 b s execute_extension::cf XML features"/>
        <action application="bind_meta_app" data="4 b s execute_extension::att_xfer XML features"/>

        <!-- 设置回音铃 -->
        <action application="set" data="ringback=${us-ring}"/>
        <!-- 发生呼叫转移时的回音铃 -->
        <action application="set" data="transfer_ringback=$${hold_music}"/>

        <!-- =============== 以下变量将影响呼叫流程 =============== -->
        <!-- 呼叫超时时间 -->
        <action application="set" data="call_timeout=30"/>
        <!-- 这里设置为true，指当bridge正常完成后，就挂机。 -->
        <action application="set" data="hangup_after_bridge=true"/>
        <!-- 当bridge没能成功接通时，默认会挂机。但这里设置为true时，将继续后面的action，这里请看<action application="answer"/>及往后的action。注释的部分是说，可以控制只针对某几个原因继续 -->
        <!--<action application="set" data="continue_on_fail=NORMAL_TEMPORARY_FAILURE,USER_BUSY,NO_ANSWER,TIMEOUT,NO_ROUTE_DESTINATION"/> -->
        <action application="set" data="continue_on_fail=true"/>
        <!-- 往内存哈希表插入数据，与set存的位置不同，但都是以备后用 -->
        <action application="hash" data="insert/${domain_name}-call_return/${dialed_extension}/${caller_id_number}"/>
        <action application="hash" data="insert/${domain_name}-last_dial_ext/${dialed_extension}/${uuid}"/>
        <action application="set" data="called_party_callgroup=${user_data(${dialed_extension}@${domain_name} var callgroup)}"/>
        <action application="hash" data="insert/${domain_name}-last_dial_ext/${called_party_callgroup}/${uuid}"/>
        <action application="hash" data="insert/${domain_name}-last_dial_ext/global/${uuid}"/>
        <!-- 下一行注释了，nolocal时，这个变量只设置到b-leg上 -->
        <!--<action application="export" data="nolocal:rtp_secure_media=${user_data(${dialed_extension}@${domain_name} var rtp_secure_media)}"/>-->
        <action application="hash" data="insert/${domain_name}-last_dial/${called_party_callgroup}/${uuid}"/>

        <!-- 
        上面的设置都没有也不要紧，只是少了一些功能（如：同组代答、监听等）。
        这里的bridge会将两个leg桥接起来。FreeSWITCH会做为SIP UAC向另一个SIP UA发出INVITE请求，并建立一个Channel，也就是b-leg。
        参数是一个呼叫字符串，这里的呼叫字符串解析出来可能是：user/1001@192.168.18.71。
        呼叫字符串的内容也可能是这样：{sip_invite_domain=$${domain}}user/${dialed_extension}@${domain_name}，解析出来可能是：{sip_invite_domain=192.168.18.71}user/1001@192.168.18.71。{}中的内容是设置通道变量，相当于：<action application="export" value="nolocal:sip_invite_domain=192.168.18.71"/>
         -->
        <action application="bridge" data="user/${dialed_extension}@${domain_name}"/>
        <!-- bridge如果没有成功时，根据continue_on_fail=true的设置，继续转入语音信箱 -->
        <action application="answer"/>
        <action application="sleep" data="1000"/>
        <action application="bridge" data="loopback/app=voicemail:default ${domain_name} ${dialed_extension}"/>
      </condition>
    </extension>
```



