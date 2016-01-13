---
layout: post
title: "JVM调优-推荐启动参数"
date: 2016-01-14 00:56
categories: ["Java", "JVM"]
---

对JVM的设定将会很大程序上影响程序的运行，在不理想的情况下，即使服务器资源还比较充足，也容易出现运行缓慢或OutOfMemory的状况。

对JVM的调优首先要了解JVM的执行状况，Java提供了一些工具帮助我们了解JVM的情况。其中jmap可以看到启动程序的参数设定后的总体状况。


使用jmap -heap <pid>可以总体上了解目前JVM的设定和内存使用情况。如：

    $ jmap -heap 9112

    Attaching to process ID 15241, please wait...
    Debugger attached successfully.
    Server compiler detected.
    JVM version is 24.51-b03
    
    using parallel threads in the new generation.
    using thread-local object allocation.
    Concurrent Mark-Sweep GC
    
    Heap Configuration:
       MinHeapFreeRatio = 40
       MaxHeapFreeRatio = 70
       MaxHeapSize      = 2147483648 (2048.0MB)
       NewSize          = 629145600 (600.0MB)
       MaxNewSize       = 629145600 (600.0MB)
       OldSize          = 5439488 (5.1875MB)
       NewRatio         = 2
       SurvivorRatio    = 8
       PermSize         = 268435456 (256.0MB)
       MaxPermSize      = 268435456 (256.0MB)
       G1HeapRegionSize = 0 (0.0MB)
    
    Heap Usage:
    New Generation (Eden + 1 Survivor Space):
       capacity = 566231040 (540.0MB)
       used     = 471122920 (449.2978286743164MB)
       free     = 95108120 (90.7021713256836MB)
       83.20330160635488% used
    Eden Space:
       capacity = 503316480 (480.0MB)
       used     = 430612936 (410.6644973754883MB)
       free     = 72703544 (69.33550262451172MB)
       85.55510361989339% used
    From Space:
       capacity = 62914560 (60.0MB)
       used     = 40509984 (38.633331298828125MB)
       free     = 22404576 (21.366668701171875MB)
       64.38888549804688% used
    To Space:
       capacity = 62914560 (60.0MB)
       used     = 0 (0.0MB)
       free     = 62914560 (60.0MB)
       0.0% used
    concurrent mark-sweep generation:
       capacity = 1518338048 (1448.0MB)
       used     = 196682160 (187.5707244873047MB)
       free     = 1321655888 (1260.4292755126953MB)
       12.953779315421594% used
    Perm Generation:
       capacity = 268435456 (256.0MB)
       used     = 56435360 (53.820953369140625MB)
       free     = 212000096 (202.17904663085938MB)
       21.023809909820557% used

以上JVM信息，是使用下面的参数启动的，下面的参数，也是比较推荐的JVM启动参数。

推荐启动参数
-------------------

    -server
    -Xms2048m
    -Xmx2048m
    -Xmn600m	// 堆内存的1/3到1/5
    -XX:PermSize=256m
    -XX:MaxPermSize=256m
    -XX:+UseParNewGC	// 设置年轻代为并行收集
    -XX:+UseConcMarkSweepGC	// 使用CMS内存收集
    -XX:+CMSParallelRemarkEnabled	// 降低标记停顿
    -XX:CMSInitiatingOccupancyFraction=75	// 使用75％后开始CMS收集
    -XX:+PrintGCDetails	// 记录gc日志，对性能影响不大
    -XX:+PrintGCDateStamps
    -Xloggc:/root/logs/gc.log
    -XX:+HeapDumpOnOutOfMemoryError		// 发生OutOfMemory时，输出内存状况
    -XX:HeapDumpPath=/root/logs/memory.dump

这里配置了堆内存(-Xms，-Xmx，年轻代+老年代)和持久代(-XX:PermSize，-XX:MaxPermSize)的大小，将初始值和最大值设置一样，是为了免除内存的震荡。堆内存和新生代内存(-Xmn)根据服务器的物理内存来调整。

遇到OutOfMemory的错误，通常可简单增加相应内存大小解决。

# 通过增加堆内存可缓解：#

    java.lang.OutOfMemoryError: Java heap space

# 通过增加持久代内存可缓解：#

    java.lang.OutOfMemoryError: PermGen space


当然不是绝对的，如果程序中对资源的引用一直没有释放，持续增加新对象，再多堆内存也会用完。而像Spring中使用类字节码产生的动态代理，在堆内存不足以缓存的情况下，会不断产生新的字节码，撑爆持久代。

当发生OutOfMemory时，可能过/root/logs/memory.dump查看当时的内存状况，也可以观察/root/logs/gc.log中的信息。

其他的优化根据实际情况，简单规则是：

1. 响应时间优先

使用G1垃圾回收器，但相对于CMS，吞吐量会有比较明显下降。

2. 吞吐量优先

年轻代尽可能大，老年代小一点。垃圾回收尽量在年轻代，老年代尽量存放长期存活的对象。


