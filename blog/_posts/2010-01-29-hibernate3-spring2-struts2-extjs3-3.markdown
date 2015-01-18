---
layout: post
title: "Hibernate3.3.2+Spring2.5.5+Struts2.1.6+Extjs3.0.0 Annotations方式快速开发框架(续)"
date: 2010-01-29 23:34
categories: "开发框架"
---

之前整合的框架中struts部分有问题，现将其升级到strtus2.1.8.1，可以解决两个问题：

1. 程序工作正常但后台报错，Unable to set parameter [location] in result of type [com.googlecode.jsonplugin.JSONResult]。
2. 无法提交double为0值的问题。

步骤如下：

1.    删除项目lib目录下freemarker-2.3.13.jar、jsonplugin-0.34.jar、ognl-2.6.11.jar、struts2-core-2.1.6.jar、xwork-2.1.2.jar。
2.    从struts2.1.8.1的lib目录下复制以下文件到项目lib目录，freemarker-2.3.15.jar、json-lib-2.1.jar、ognl-2.7.3.jar、struts2-core-2.1.8.1.jar、xwork-core-2.1.6.jar。
3.    将Struts2ExtjsBaseAction类中，引入类 com.googlecode.jsonplugin.JSONResult 替换成 org.apache.struts2.json.JSONResult。