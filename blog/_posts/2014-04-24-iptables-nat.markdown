---
layout: post
title: "Linux负载均衡(1)-IPTABLES NAT"
date: 2014-04-24 17:15
categories: "Linux"
---

为了搞清楚IPTABLES NAT的过程，做了这个实验。使用了1台双网卡服务器和1台单网卡服务器，2个网段。服务器信息如下：

![]({{ "/images/iptables-nat/1.png" | prepend: site.baseurl }})

IP配置信息如下：

实际服务器：Centos / 192.168.2.73 [eth0]

调度服务器：Centos / 192.168.18.58 [eth0]  + 192.168.2.90 [eth1]

一、为了看到调度服务器上的数据转发过程，首先在调度服务器上分出内核的debug日志：
-----------------------

在/etc/rsyslog.conf最后增加：kern.debug /var/log/iptables.log

重启日志服务：/etc/init.d/rsyslog restart

二、启动调度服务器的iptables并清空规则
------------------------

    service iptables start
    iptables -F

三、增加调度服务器的iptables特定日志输出
-------------------------

假设要将对调度服务器8888端口的访问转发给实际服务器的9999端口处理，在iptables中增加与这2个端口相关的日志输出：

    iptables -t mangle -A PREROUTING -p tcp --dport 8888 -j LOG --log-level debug --log-prefix "<<<<< PER IN:"
    iptables -t mangle -A PREROUTING -p tcp --sport 9999 -j LOG --log-level debug --log-prefix "<<<<< PER IN:"
    iptables -t mangle -A POSTROUTING -p tcp --sport 8888 -j LOG --log-level debug --log-prefix ">>>>> POST OUT:"
    iptables -t mangle -A POSTROUTING -p tcp --dport 9999 -j LOG --log-level debug --log-prefix ">>>>> POST OUT:"
    iptables -t mangle -A POSTROUTING -p tcp --sport 9999 -j LOG --log-level debug --log-prefix ">>>>> POST OUT:"

这时，通过浏览器访问http://192.168.18.58:8888可以看到iptables.log中打印出下面的日志：

    Apr 24 16:24:35 route-server1 kernel: <<<<< PER IN:IN=eth0 OUT= MAC=00:1f:c6:cb:eb:e0:00:1f:33:de:29:ad:08:00 SRC=192.168.18.25 DST=192.168.18.58 LEN=60 TOS=0x00 PREC=0x00 TTL=63 ID=28721 DF PROTO=TCP SPT=50270 DPT=8888 WINDOW=14600 RES=0x00 SYN URGP=0
    Apr 24 16:24:35 route-server1 kernel: <<<<< POST OUT:IN= OUT=eth0 SRC=192.168.18.58 DST=192.168.18.25 LEN=40 TOS=0x00 PREC=0x00 TTL=64 ID=0 DF PROTO=TCP SPT=8888 DPT=50270 WINDOW=0 RES=0x00 ACK RST URGP=0

虽然这个端口上即没有应用，也没有将请求转发出去，但日志打印出了内核获取到的对这个端口的请求。

四、配置iptables将对8888的请求转发到192.168.2.73:9999
-------------------------

    iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 8888 -j DNAT --to-destination 192.168.2.73:9999

访问http://192.168.18.58:8888，日志中打印如下信息：

    Apr 24 16:39:21 route-server1 kernel: <<<<< PER IN:IN=eth0 OUT= MAC=00:1f:c6:cb:eb:e0:00:1f:33:de:29:ad:08:00 SRC=192.168.18.25 DST=192.168.18.58 LEN=60 TOS=0x00 PREC=0x00 TTL=63 ID=56888 DF PROTO=TCP SPT=50274 DPT=8888 WINDOW=14600 RES=0x00 SYN URGP=0

日志中只打印了从eth0收到的对8888端口的请求，这是因为当数据要被转发到192.168.2.73:9999时，默认情况下被禁止了。

五、打开数据包转发功能
-----------------------

    echo 1 > /proc/sys/net/ipv4/ip_forward

访问http://192.168.18.58:8888，日志中打印如下信息：

    Apr 24 16:39:21 route-server1 kernel: <<<<< PER IN:IN=eth0 OUT= MAC=00:1f:c6:cb:eb:e0:00:1f:33:de:29:ad:08:00 SRC=192.168.18.25 DST=192.168.18.58 LEN=60 TOS=0x00 PREC=0x00 TTL=63 ID=56888 DF PROTO=TCP SPT=50274 DPT=8888 WINDOW=14600 RES=0x00 SYN URGP=0
    Apr 24 16:39:21 route-server1 kernel: <<<<< POST OUT:IN= OUT=eth1 SRC=192.168.18.25 DST=192.168.2.73 LEN=60 TOS=0x00 PREC=0x00 TTL=62 ID=56888 DF PROTO=TCP SPT=50274 DPT=9999 WINDOW=14600 RES=0x00 SYN URGP=0

第一条日志显示从eth0收到了对8888端口的请求，第二条日志显示iptables已经更改了数据包的目的地为192.168.2.73:9999，并通过eth1发出去。

但这时请求虽然已经被转发到实际处理的服务器，但调度服务器收不到响应，浏览器仍在不停重试，日志也在不断打印。这是因为实际服务器收到的数据包的来源IP是另一个网段的，实际服务器回复时，发现不是本网段的就把数据包发给网关，网关设置的是192.168.2.1，这时数据就丢了。

六、将实际服务器的默认网关设置为192.168.2.90
------------------------

在实际服务器上执行以下命令：

    route del default
    route add default gw 192.168.2.90

再次访问http://192.168.18.58:8888，日志打印如下信息：

    Apr 24 16:47:27 route-server1 kernel: <<<<< PER IN:IN=eth0 OUT= MAC=00:1f:c6:cb:eb:e0:00:1f:33:de:29:ad:08:00 SRC=192.168.18.25 DST=192.168.18.58 LEN=60 TOS=0x00 PREC=0x00 TTL=63 ID=37000 DF PROTO=TCP SPT=50279 DPT=8888 WINDOW=14600 RES=0x00 SYN URGP=0
    Apr 24 16:47:27 route-server1 kernel: <<<<< POST OUT:IN= OUT=eth1 SRC=192.168.18.25 DST=192.168.2.73 LEN=60 TOS=0x00 PREC=0x00 TTL=62 ID=37000 DF PROTO=TCP SPT=50279 DPT=9999 WINDOW=14600 RES=0x00 SYN URGP=0
    Apr 24 16:47:27 route-server1 kernel: <<<<< PER IN:IN=eth1 OUT= MAC=00:22:b0:de:f7:49:00:24:8c:b4:a1:8c:08:00 SRC=192.168.2.73 DST=192.168.18.25 LEN=40 TOS=0x00 PREC=0x00 TTL=64 ID=0 DF PROTO=TCP SPT=9999 DPT=50279 WINDOW=0 RES=0x00 ACK RST URGP=0
    Apr 24 16:47:27 route-server1 kernel: <<<<< POST OUT:IN= OUT=eth0 SRC=192.168.2.73 DST=192.168.18.25 LEN=40 TOS=0x00 PREC=0x00 TTL=63 ID=0 DF PROTO=TCP SPT=9999 DPT=50279 WINDOW=0 RES=0x00 ACK RST URGP=0

上面第一条第二条日志和之前一样，iptables将目地址更改后，通过eth1网卡发送出去。第三条日志通过eth1网卡接收到了实际服务器发送过来的数据，并在第四条日志中通过eth0发回请求方。