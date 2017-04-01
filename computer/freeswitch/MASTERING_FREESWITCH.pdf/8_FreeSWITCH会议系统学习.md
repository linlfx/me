8 FreeSWITCH会议系统学习
=============================================================================

FreeSWITCH一直是最好的会议平台，许多年前就可支持可扩展的语音会议，从1.6开始，可支持PSTN、SIP、WebRTC用户用户用于多媒体（视频）会议。

会议技术是关于从不同来源获取数据，加工这些数据并将结果分发到不同目的地的技术，处理过程必须允许所有因素的实时变化 。哪个来源发送了数据，数据是什么类型，对数据能做什么，结果分发到哪里，等等。

同时，它需要简单的方法让参与者可以交互（如：输入一个PIN、音量增大减小、自己静音或取消静音，等等），也可以让主持人管理会议（如：让某人成为发言人，将麦克风切换到某人，对所有人或某个人静音或取消静音，广播一段音乐或消息，录制会议，发出一个呼叫使另一个用户加入会议，等等）

会议技术用于转换、混合、控制语音流，这些操作以将语音转换为一连串不相关的字节而告终，高清音频会增加CPU的转码负担，但内部工作方式是一样的。

视频处理是一个全新的世界，视频流不是一系列不相关的值，它们以帧来组织（如：屏幕上显示什么），你不能加入两个视频流来得到两个画面的叠加，你也不能降低它们的电子信号。

视频处理非常复杂，需要很大的处理量。可以这样想像：它需要让CPU通过一个画面产生另一个画面，多个参与者的实时画面，每一个都有标签，背景是发言人的脸和他共享的屏幕。

会议技术是你提供给用户的本质上最复杂的服务，FreeSWITCH默认配置下就有以上全部服务。

——————————————————————————————————————————
会议基础
——————————————————————————————————————————
一个dialplan片段：
  <extension name="cdquality_conferences">
      <condition field="destination_number" expression="^(35\d{2})$">
        <action application="answer"/>
        <action application="conference" data="$1-${domain_name}@video-mcu-stereo"/>
      </condition>
    </extension>
    <extension name="cdquality_conferences_moderator">
      <condition field="destination_number" expression="^(35\d{2})1$">
        <action application="answer"/>
        <action application="set" data="conference_member_flags=moderator"/>
        <action application="conference" data="$1-${domain_name}@video-mcu-stereo"/>
      </condition>
    </extension>

expression="^(35\d{2})$"
- 3500 - 3599的会议室

data="$1-${domain_name}@video-mcu-stereo"
- $1 是会议室号码
- ${domain_name} 是域名或IP
- @video-mcu-stereo是使用autoload_configs/conference.conf.xml中video-mcu-stereo这个profile的定义

如拨打3500时，freeswitch的IP是192.168.18.71，那么会议室名是3500-192.168.18.71，因为expression的括号中只有(35\d(2))，所以$1是3500，如果expression是^(35\d{2})1$，那么拨号是35001，但是$1还是3500，同一个会议室，但是拥有主持人角色。

针对普通参与者，可以控制自己是否静音、收听音量等。
针对主持人，没有特别的配置，只是获得一个标志，与普通参与者没什么不同。你实际上拥有更多权限（如踢人、静音，结束会议等），但不能使用，在『管理』时再讨论。

一个会议可以配置播放音乐给所有呼叫进来的参与者，直到主持人进来。一个会议也可以配置不同的DTMF命令给主持人。

——————————————————————————————————————————
conference.conf.xml
——————————————————————————————————————————

conference.conf.xml中不能定义个别会议室，用于定义命名组的设置。当拨号时，你呼叫一个会议室，根据dialplan中的设置，确定应用哪个命名组的设置。

<profiles>节点包含所有profile，在dialplan配置中，我们使用@profilename来指定会议的profile配置，如果没有设置@profilename，则默认使用名为default的profile。。

在profile中，可以指定各种参数，如果没有指定，FreeSWITCH自动使用推荐值。

<caller-controls>用于配置DTMF的控制信息。可以在每一个profile中指定caller controls，如果没指定，默认使用default，也可以指定none，则没有DTMF控制。

<moderator-controls>用于配置主持人的DTMF控制信息，如果没有，主持人与普通参与者拥有一样的DTMF控制 。

——————————————————————————————————————————
Profile
——————————————————————————————————————————

<profile>节点下可以设置非常多参数。

flags的参数可以被呼叫字符串和频道变量覆盖。其他参数通常设置一次，会议开始后适用于整个会议和所有参与者。

# Conference-flags
针对单个会议的会议修饰符列表，以"|"为分界符。你可以让成员听音乐，走到主持人加入（wait-mod），会议发出实时的JSON来描述发生了什么（比如有人加入，IM系统（livearray-json-status））。你可以有交互式图像接口显示谁正在讲话，或者选择不使用一个能量阀值来决定音频流必须被加入，来代替直接混合所有输入流（audio-always）。

# Member-flags
针对参与者修饰符列表，以"|"为分界符。可以定义呼叫者参与会议时，是以静音模式（mute）；如果要说话，他们需要自己取消静音，或由主持人取消静音。另一个有用的标志是mute-detect，如果讲话者目前静音，会有一个消息发给他，这样他就知道自己现在处于静音模式。

# Caller-controls
配置DTMF的控制信息，用于所有参与者。

# Moderator-controls
配置DTMF的控制信息，用于主持人。

# Sounds
有许多参数处理事件发生时的声音反馈，或者执行一个命令后的反馈（如：音量减1，你是会议中的唯一用户等），你可以定义没有声音反馈，定义一些，或定义全部。如果声音参数没有定义，不会播放什么，不会发生什么，原本的动作继续下去。你可以用相对或绝对路径定义声音文件，相对路径会在第一个呼叫时以频道变量sound_prefix为前缀，也可以在profile中设定sound-prefix来覆盖。

# Others
auto-record: 自动录音。
channels：声音通道，1 - 单声道，2 - 立体声
energy-level：定义音频流的临界值，用于并入音频内被发送，用于避免噪音，所以讲话要大声点。
pin和moderator_pin：如果指定，将被请求参与者和主持人是否被允许进入？？？（什么意思？）
ivr-dtmf-timeout：两个DTMF命令的间隔时间，用于实现1和11做为2个命令。

——————————————————————————————————————————
会议调用、拨号计划、频道变量
——————————————————————————————————————————
会议是一个mod_dptools提供的拨号应用，如下：
<action application="conference" data="[bridge:]confname[@profile][+[pin][+flags{mute|deaf|…}]][:dialstring]">
中括号中是可选项，但顺序不能改变。

所以，如果需要一个没有bridge，没有pin，默认profile，需要mute标记，配置如下（注意"++"）：
<action application="conference" data="confname++flags{mute}">

在一个会议中，桥接另一个用户时，如下配置：
<action application="conference" data="bridge:confname++flags{mute}:user/1000@${domain_name}">

——————————————————————————————————————————
主持和管理会议 - API
——————————————————————————————————————————
一个会议由它自己的主持人管理，对于FreeSWITCH服务管理员，通过moderator_controls和API呼叫来管理。

API比主持人拥有更多权限，任何事都可以通过API来处理。

有许多方法可以调用API，如fs_cli，Event Socket（ESL），HTTP，moderator_controls。你可以自己建立一个会议管理系统，通过数字键盘就可以完整控制会议，只是不太好用。

会议API的能用格式：conference confname command [arg1 arg2 … argN]

如下在fs_cli中的示例：

conference 3500-191.168.18.71 mute 23
OK mute 23

从Linux命令行发出相同命令：
fs_cli -x "conference 3500-191.168.18.71 mute 23"
OK mute 23

# 有用的会议API命令：
tmute：固定mute/unmute
play：播放一个音频文件
record：录制会议到一个音频文件或流
energy：被混合的阀值
floor：固定主席台状态
hup and kick：将用户踢出一个会议室
hup：踢人但不播放踢人音乐
list：列出所有参与者
volume_in和volume_out：调整音量

在fs_cli中执行conference help来查看所有命令和参数说明。

——————————————————————————————————————————
视频会议
——————————————————————————————————————————

FreeSWITCH在2015年有所突破，宣布支持视频的转码、混频、操作和MCU功能。

# 视频会议功能：
多种视频编码的支持和转码；
多种视频布局；
屏幕分离；
画中画；
屏幕共享；
视频叠加（字幕、LOGO等）；
视频混频；
视频效果和实时控制。

——————————————————————————————————————————
视频会议配置
——————————————————————————————————————————

视频会议只是在普通会议基础上做更多事。

定义和执行的方式与语音会议完全一样，实际上一个语音会议就是一个成员不发送视频流的视频会议。而且，如果成员有视频能力，而呼叫到语音会议，将会被转为视频会议。

所以，你需要充分了解之前关于语音会议配置的部分，因为这里只有增加的和视频相关的配置。

最大的不同是三种不同的视频会议（video-mod参数，通过conference-flags定义或在配置文件profile中定义）：passthrough、transcode、mux。

passthrough（default）：直接执行视频跟随音频的方式：输入的视频流将根据谁在讲话而自动被FreeSWITCH切换，然后被原样传给其他能接收的参与者（不会转码也不做任何操作）。

transcode：与passthrough类似，只是会转码，可以允许客户端使用不同的编码。

mux：允许FreeSWITCH做各种视频处理、转码、特效。你的客户端可以使用不同的编码器，可以有画中画，可以在画面中同时出现多个参与者在不同位置，可以有LOGO叠加在画面上等等。

——————————————————————————————————————————
MUX profile设置
——————————————————————————————————————————

几乎所有视频相关的profile设置都用于mux的视频模式下（其他模式只是转发或转码），最重要的设置项如下：
video-canvas-size：定义用于显示经过处理后（如：缩放、混频等）的视频的画布像素，如：1920*1080。
video-fps：定义每秒多少帧画面，如：15。
video-codec-bandwidth：定义最终视频流的最大带宽，将在内部修改编码器参数来匹配，可以使用单位kb, mb, KB, MB或auto。
video-layout-name：定义给画布使用的布局名称或布局分组的名称，布局定义请参考conference_layouts.conf.xml。只要设定了这个值，会议室将被自动设置为mux模式。

——————————————————————————————————————————
视频会议布局
——————————————————————————————————————————

当会议被定义为mux模式，它能聚集、混频、转换、注入、叠加和应用到输入流，用于提升参与者的体验和主办者品牌的所有有用的视频特效。

视频布局定义如何组合以输出视频流：画布被分为一个或多个区域，每一个区域将使用其中一个视频输入流，并不是所有视频输入流需要被显示（你可以只显示主持人和5个参与者，或所有参与者且不要主持人，或两个动画片和一个音乐）。

视频布局能够根据条件分配视频主席（如：显示哪个输入流），布局可定义哪个视频流被显示在视频主席位。

布局是抽象的，根据画布尺寸按比例调整，可以适应4:3和16:9。

布局有一个常见的尺寸：360*360，所有坐标参照这个尺寸。

布局区域使用<image>在xml中定义，可以有多个属性，重要的几项有：
x和y：区域起点，区域左上角的位置。
scale：画布假设等于360，区域相对于画面的大小。
hscale：水平scale。
zoom：适应区域的高宽比。
floor：如果设置为true，这个区域将动态显示视频floor的画面（如：将切换为谁是视频焦点）。
reservation-id：一个标签名用于指定谁将显示在这个区域，这个标签名将分配给会议参与者，根据API命令vid-res-id 。
