---
layout: post
title: "基于React的前端开发框架选择"
date: 2021-02-25 11:22
categories: ["React"]
---

前端技术发展迅速、百花齐放，每种技术都很好用，但技术栈又都非常庞大复杂。

下图是整理的基于React目前比较推荐的开发框架及部分相关技术：
![]({{ "/images/frontend-framework/framework.jpg" | prepend: site.baseurl }})

从上图可以看到，浅绿色是比较基础的一些库，这些技术应该都要做些了解，但如果不想学也没事，上层框架都做了封装和最佳实践，照着做就行了。

左边淡蓝色是阿里支付宝前端团队开源的项目，UmiJS用于开发Web应用，已经做了大量封装，开箱即用，基本上看一遍UmiJS官网的文档就可以开始做项目了。UmiJS+antd(mobile)是开发PC和手机端Web应用的首选。

右边淡棕色是京东凹凸实验室开源的项目，用于在移动端实现多端统一开发，可以生成H5、微信小程序、React Native（目前Taro3暂时不支持RN）等。
