---
layout: post
title: "windows下awstat分析apache日志"
date: 2010-11-11 23:36
categories: "流量分析"
---

一、准备
-------------------
1. 安装apache，http://httpd.apache.org/
2. 安装perl, http://www.perl.org/
3. 安装awstat, http://awstats.sourceforge.net/

awstat安装会自动进行一些配置，可能不需要下面的设置。

二、apache配置
-----------------------

在apache安装目录conf\httpd.conf中增加以下配置：

    Alias /awstatsclasses "C:/Program Files/AWStats/wwwroot/classes/"
    Alias /awstatscss "C:/Program Files/AWStats/wwwroot/wwwroot/css/"
    Alias /awstatsicons "C:/Program Files/AWStats/wwwroot/icon/"
    ScriptAlias /awstats/ "C:/Program Files/AWStats/wwwroot/cgi-bin/"

    <Directory "C:/Program Files/AWStats/wwwroot/cgi-bin/">
        AllowOverride None
        Options ExecCGI
        Order allow,deny
        Allow from all
    </Directory>

将common注释掉，放开combined的注释

    #CustomLog "logs/access.log" common
    CustomLog "logs/access.log" combined

三、awstat配置
----------------------

- 修改{awstats_home}/wwwroot/cgi-bin/下的awredir.pl、awstats.pl文件的第一行从#!/usr/bin/perl改成#!C:\strawberry\perl\bin\perl.exe。

- 修改{awstats_home}/wwwroot/cgi-bin/下的awstats.demo.conf

    LogFile="C:\Program Files\Apache Software Foundation\Apache2.2\logs\access.log"
    
    LogType=W
    
    LogFormat=1
    
    SiteDomain="demo"

四、更新报表
----------------------

命令行进行{awstats_home}\wwwroot\cgi-bin

    perl awstats.pl -config=demo –update

五、访问统计报表
-------------------------

http://localhost/awstats/awstats.pl?config=demo

注意：httpd.conf更改后要重启apache服务