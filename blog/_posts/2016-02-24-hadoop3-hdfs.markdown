---
layout: post
title: "Hadoop(3)-HDFS"
date: 2016-02-24 17:20
categories: ["大数据", "Hadoop", "HDFS"]
---

这里使用两台EC2服务器，每台EC2额外挂载一块30G的EBS来部署HDFS，HDFS将有一个namenode，两个datanode，副本数量为2。一台服务器作为master和slave1，另一台作为slave2，EBS作为datanode存储数据的位置。

Hadoop使用2.7.2，解压到/home/ec2-user/download/hadoop-2.7.2，并创建一个软连接到/home/ec2-user/hadoop。

配置Master和Slave1
--------------------------

1.设定IP解析
========================

为了方便以后调整服务器IP，或将节点分配到其他服务器，这里添加主机和IP对应：

    sudo vi /etc/hosts
    
    10.0.3.51   hadoop.master
    10.0.3.51   hadoop.slave1
    10.0.3.170  hadoop.slave2

2.设置无密码登录
========================

按[入门示例](http://blog.gopersist.com/2016/01/29/hadoop/)中的方法设置无密码登录。

3.挂载EBS
========================

使用以下命令挂载EBS到/mnt/ebs，作为datanode存储数据的硬盘。

    sudo mkfs.ext4 /dev/xvdb
    sudo mkdir /mnt/ebs
    sudo mount /dev/xvdb /mnt/ebs/
    sudo chown ec2-user:ec2-user /mnt/ebs/
    sudo sh -c 'echo "/dev/xvdb   /mnt/ebs   ext4   defaults,nofail 0  2" >> /etc/fstab'


4.修改配置文件
=========================

进入hadoop目录，在etc/hadoop/core-site.xml文件中添加以下内容：

    <configuration>
        <property>
            <name>hadoop.tmp.dir</name>
            <value>/home/ec2-user/tmp</value>
        </property>
        <property>
            <name>fs.default.name</name>
            <value>hdfs://hadoop.master:9000</value>
        </property>
    </configuration>

在etc/hadoop/hdfs-site.xml文件中添加以下内容：

    <configuration>
        <property>
            <name>dfs.replication</name>
            <value>2</value>
        <property>
        <property>
            <name>dfs.datanode.data.dir</name>
            <value>/mnt/ebs</value>
        </property>
    </configuration>

在etc/hadoop/masters中添加以下内容：

    hadoop.master

在etc/hadoop/slaves中添加以下内容：

    hadoop.slave1
    hadoop.slave2

配置Slave2
---------------------

1.设定IP解析
======================

同上

2.设置无密码登录
======================

将Master中.ssh/id_dsa.pub中的内容添加到Slave2的.ssh/authorized_keys中。

3.挂载EBS
======================

同上

4.修改配置文件
======================

将Master的配置文件全部复制到Slave2，替换掉Slave2中Hadoop的配置文件。

在Master的Hadoop目录下执行以下命令：

    tar -zcvf etc.tar.gz etc/
    scp etc.tar.gz hadoop.slave2:

回到Slave2，将etc.tar.gz移动到Hadoop目录，并解压缩：

    tar -zxvf etc.tar.gz

启动HDFS
----------------------

在Master服务器的Hadoop目录下，执行以下命令启动HDFS集群：

    sbin/start-dfs.sh

通过http://52.193.246.202:50070/dfshealth.html#tab-overview可看到Live Nodes有2个。

