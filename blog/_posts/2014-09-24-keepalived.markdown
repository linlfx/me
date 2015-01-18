---
layout: post
title: "Linux Keepalived 实现双机热备"
date: 2014-09-24 11:34
categories: "Linux"
---

试用Keepalived来做双机热备，服务器信息如下：

服务器1：Centos / 192.168.18.20 [IP] / 192.168.18.22 [虚拟IP]

服务器2：Centos / 192.168.18.21 [IP] / 192.168.18.22 [虚拟IP]

#### 1. 安装Keepalived

2台Server都使用下面的命令安装Keepalived：

    yum install keepalived -y

#### 2. Server1 Keepalived 配置

    $ vi /etc/keepalived/keepalived.conf

    vrrp_instance VI_1 {
        state MASTER
        interface eth0
        virtual_router_id 51
        priority 100                   # 优先级
        advert_int 1                 # 心跳间隔(秒)
        authentication {
            auth_type PASS
            auth_pass 1111
        }
        virtual_ipaddress {
            192.168.18.22         # 虚拟IP
        }
    }

#### 3. Server2 Keepalived 配置

    $ vi /etc/keepalived/keepalived.conf

    vrrp_instance VI_1 {
        state BACKUP              # 备份机
        interface eth0
        virtual_router_id 51
        priority 99                   # 优先级，比主服务器底
        advert_int 1                 # 心跳间隔(秒)
        authentication {
            auth_type PASS
            auth_pass 1111
        }
        virtual_ipaddress {
            192.168.18.22         # 虚拟IP
        }
    }

#### 4. 启动Keepalived

    $ service keepalived start

启动keepalived后，可看到2台Server都绑定了虚拟IP：

    $ ip a

    # Server 1:
    2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP qlen 1000
        link/ether 00:24:8c:8c:67:43 brd ff:ff:ff:ff:ff:ff
        inet 192.168.18.20/24 brd 192.168.18.255 scope global eth0
        inet 192.168.18.22/32 scope global eth0
        inet6 fe80::224:8cff:fe8c:6743/64 scope link 
           valid_lft forever preferred_lft forever

    # Server 2:
    2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP qlen 1000
        link/ether 00:23:54:bf:ab:17 brd ff:ff:ff:ff:ff:ff
        inet 192.168.18.21/24 brd 192.168.18.255 scope global eth0
        inet 192.168.18.22/32 scope global eth0
        inet6 fe80::223:54ff:febf:ab17/64 scope link 
           valid_lft forever preferred_lft forever

#### 5. 测试

浏览器访问http://192.168.18.22，出现 This is Server 1.

将192.168.18.20关闭，再访问http://192.168.18.22，出现This is Server 2.