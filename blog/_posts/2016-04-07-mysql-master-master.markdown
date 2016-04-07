---
layout: post
title: "MySQL双主同步"
date: 2016-04-07 18:34
categories: ["数据库", "MySQL"]
---

数据库需要双活，所以将两台服务器安装MySQL后，做主主复制同步，再配合Keepalived即可实现双活。

服务器信息
------------------------------

服务器1 IP：10.0.0.95

服务器2 IP：10.0.0.96

MySQL：5.5

修改配置文件(/etc/my.cnf)
------------------------------

在[mysqld]节点增加以下内容

    # 开始配置主主
    server-id=1
    
    # 二进制日志，mysql-bin.000001 ...
    log-bin=mysql-bin

    # 记录二进制日志的数据库
    binlog-do-db=test
    
    # 同步的数据库
    replicate-do-db=test
    
    # 从服务器更新也写入二进制日志，作为从服务器，又作为主服务器时需要
    log-slave-updates
    
    # 每次事务提交后都写入二进制日志，默认0由系统或缓存决定何时写入文件
    sync_binlog=1

服务器1和服务器2都在配置文件添加以上内容，只是server-id的值在服务器1中设为1，在服务器2中设为2。

配置设定好以后，启动MySQL服务。

执行MySQL命令
--------------------------------

以root分别登录服务器1和服务器2。

创建同步用户
================================

### 服务器1

    mysql> grant replication slave,file on *.* to 'replication'@'10.0.0.96' identified by '123456';
    mysql> flush privileges;

### 服务器2

    mysql> grant replication slave,file on *.* to 'replication'@'10.0.0.95' identified by '123456';
    mysql> flush privileges;

启动从服务
=================================

    -- 全局只读，所有库所有表都只读。【两个服务器都执行这个命令】
    mysql> flush tables with read lock;
    
    -- 显示主服务状态。【两个服务器都执行这个命令】
    mysql> show master status\G
    
    *************************** 1. row ***************************
    File: mysql-bin.000004
    Position: 344
    Binlog_Do_DB: test
    Binlog_Ignore_DB: 
    1 row in set (0.00 sec)
    
    -- 两台服务器获得bin log的信息后，就可以放开只读锁定。【两个服务器都执行这个命令】
    mysql> unlock tables;
    
    -- 从服务器设置主服务器信息。【服务器1设定的master_host, master_log_file, master_log_pos是服务器2的信息，服务器2设定的是服务器1的信息】
    mysql> stop slave;
    mysql> change master to master_host='10.0.0.95',master_user='replication',master_password='123456',master_log_file='mysql-bin.000004', master_log_pos=344;
    mysql> start slave;
    
    -- 查看服务器状态，检查Slave_IO_Running和Slave_SQL_Running是否都为Yes。
    mysql> show slave status\G;

完成设置，可以测试两边是否可以同步。注意主键不要重复，可以使用类似UUID的方式生成主键。

