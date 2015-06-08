---
layout: post
title: "Web缓存技术-一致性哈希"
date: 2015-06-06 23:56
categories: ["hashing"]
---

上次讲到Memcached通常需要客户端实现一致性哈希来解决定位目标Server的问题，那一致性哈希到底是如何实现的，这里通过一个Java的实现来理解。

一致性哈希应满足的条件
-------------------------

__1. 单调性__

单调性应该是一致性哈希首先满足的条件，它是指当有新的缓存加入系统时，哈希结果要保证原来已分配的内容要么被映射到新缓存，要么依然映射到原缓存，而不会被映射到旧的缓存集合的其他缓存中。

哈希取模的算法不能满足单调性的要求。

__2. 平衡性__

平衡性是指内容要尽可能平均地分布到所有缓存中，如果缓存服务器设定了不同的权重，内容要尽可能接近权重的比率来分布到所有缓存中。

__3. 分散性__

分散性是指相同的内容被分散在不同的缓存中。在分布式环境中，客户端可能看到不同的缓存，这时客户端计算的哈希结果要避免不一致，以尽量降低分散性。

__4. 负载__

不同的客户端将不同的内容映射到了同一个的缓存，应尽量降低负载。这似乎和平衡性讲的是同一个问题，内容要尽可能平均分布到不同的缓存，而不能集中到同一个缓存，以使那个缓存的负载过高。

Memcached-Java-Client
-------------------------

Memcached-Java-Client是使用Java语言实现的访问Memcached的工具包，使用它可以更方便与服务器通信。

Memcached-Java-Client包括了对一致性哈希的实现，下面对其源码中的哈希值计算和Server定位的部分做一个分析。

哈希值算法
-------------------------












Memcached是一个开源、高性能、分布式的内存缓存系统，用于加速动态网站的访问，减轻数据库负载。

Memcached使用了Slab Allocator的机制分配、管理内存，解决了内存碎片的问题。

Memcached虽然可以在多线程模式下运行，但线程数通常只需设定为与CPU数量相同，这一点与Nginx的设定类似。

Memcached使用
-------------------------

__安装:__

在CentOS下使用下面的命令安装：

    sudo yum install memcached

__启动：__

    memcached -m 100 -p 11211 -d -t 2 -c 1024 -P /tmp/memcached.pid

> -m 指定使用的内存容量，单位MB，默认64MB。
>
> -p 指定监听的TCP端口，默认11211。
>
> -d 以守护进程模式启动。
>
> -t 指定线程数，默认为4。
>
> -c 最大客户端连接数，默认为1024。
>
> -P 保存PID文件。

__关闭：__

    kill `cat /tmp/memcached.pid`

__测试：__

使用telnet连接memcached服务。

    telnet localhost 11211

存储命令格式：

    set foo 0 0 4
    abcd
    STORED
    
    <command name> <key> <flags> <exptime> <bytes>
    <data block>
    
    <command name> set, add, replace等
    <key> 关键字
    <flags> 整形参数，存储客户端对键值的额外信息，如值是压缩的，是字符串，或JSON等
    <exptime> 数据的存活时间，单位为秒，0表示永远
    <bytes> 存储值的字节数
    <data block> 存储的数据内容

读取命令格式：
    
    get foo
    VALUE foo 0 4
    abcd
    END

    <command name> <key>
    
    <command name> get, gets。gets比get多返回一个数字，这个数字检查数据有没有发生变化，当key对应的数据改变时，gets多返回的数字也会改变。
    <key> 关键字
    
    返回的数据格式：

    VALUE <key> <flags> <bytes>

CAS(checked and set)：

    cas foo 0 0 4 1
    cdef
    STORED

    cas <key> <flags> <exptime> <bytes> <version>
    
    除最后的<version>外，其他参数与set, add等命令相同，<version>的值需要与gets获取的值相同，否则无法更新。
    incr, decr可对数字型数据进行原子增减操作。

全局统计信息

    stats
    STAT pid 10218
    STAT time 1432611519
    STAT curr_connections 6
    STAT total_connections 9
    STAT connection_structures 7
    STAT reserved_fds 10
    STAT cmd_get 5
    STAT cmd_set 1
    STAT cmd_flush 0
    STAT cmd_touch 0
    STAT get_hits 3
    STAT get_misses 2
    STAT delete_misses 0
    STAT delete_hits 0
    ...
    END

Memcached集群
------------------------

Memcached本身不做任何容错处理，对故障节点的处理方式完全取决于客户端。对Memcached的客户端来说，不能使用普通的哈希算法（哈希取模）来寻找目标Server，因为这样在有缓存节点失效时，会导致大面积缓存数据不可用。如下图：

![]({{ "/images/memcached/1.png" | prepend: site.baseurl }})

![]({{ "/images/memcached/2.png" | prepend: site.baseurl }})

当Server3失效后，客户端需要根据可用Server数量重新计算缓存的目标Server，这时，Key的哈希值为10的数据被指定为由Server1维护，这时原本Server2上可用的缓存也无效了。

#### 一致性哈希算法 ####

一致性哈希算法解决了在动态变化的缓存环境中，定位目标Server的问题，通常的实现可将它想像成一个闭合的环形。如下图：

![]({{ "/images/memcached/3.png" | prepend: site.baseurl }})

当有节点失效时，不会影响到正常工作的缓存服务器，只有原本分配到失效节点的缓存会被重新分配到下一个节点。如下图：

![]({{ "/images/memcached/4.png" | prepend: site.baseurl }})

