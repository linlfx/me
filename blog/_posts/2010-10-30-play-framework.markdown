---
layout: post
title: "Play Framework 开发入门"
date: 2010-10-30 13:18
categories: "开发框架"
---

一、准备
-------------------

官方网站：www.playframework.org

下载最新的play-1.1RC3.zip

将下载的包解压，解压后的路径最好不要包括空格、中文之类的，好像会有问题。我这里解压到D:\play-1.1RC3，将该路径加入到path路径下。

二、新建项目
-----------------------

打开msdos窗口，进入eclipse的workspace目录，如d:\workspace。再输入play new playdemo，新建一个名为playdemo的play应用。后面提示的application name输入同样的playdemo，如果输入的不相同，在eclipse可能会有错。

![]({{ "/images/play-framework/1.jpg" | prepend: site.baseurl }})

输入play eclipsify playdemo，添加eclipse所需文件。

![]({{ "/images/play-framework/2.jpg" | prepend: site.baseurl }})

打开eclipse，导入项目。

三、安装play插件
-------------------------------

将D:\play-1.1RC3\support\eclipse目录下的文件复制到eclipse相应目录下，重启eclipse，看到多了Play!菜单。

四、项目结构介绍
--------------------------

app 存放源码，分为3个目录

- controllers 存放控制器源码

- models      存放模型源码

- views       视图源码

conf    配置文件

- application.conf    系统配置信息，数据库配置等。

- messages        国际化

- routes          路由信息，简化、隐藏路径等功能，后面详说。

lib jar包

public  图片、js、css

五、Hello World
---------------------------

到application.conf中将db=mem的注释放开，使用hsql的内存数据库。

在models中增加类 Baby，继承自Model，继承不是必需的，但是Model中做了很多事，建议继承。

    @Entity(name = "play_baby")    // 数据库中建立表名play_baby
    public class Baby extends Model{
        @Required
        @Column(length=16)
        @MaxSize(16)
        public String name;
        
        public Baby(String name){
            this.name = name;
        }
        
        public String say(){
            return "Hello world! I'm "+name;
        }
    }

新建一个controllers，Babies

    public class Babies extends Controller{
        public static void born() {
            Baby baby = new Baby("刘德华");
            baby.save();
            render(baby);
        }
    }

views中增加视图文件，视图与Controller的关系是，包、类都是文件夹，方法为视图文件名，如，我们这里在views目录下新建与Babies同名目录，并在该目录下建立born.html视图文件，内容如下：

    #{extends 'main.html' /}
    #{set title:'Hello world!' /}

    ${baby.say()}

运行服务，选中项目，选菜单“run”->“run”，启动后，浏览器输入http://localhost:9000/babies/born，看到结果。