---
layout: post
title: "在Web上以超文本API进行数据交互"
date: 2015-01-21 00:05
categories: "Web开发"
---

什么是超文本？
-------------------

简单来说，超文本就是文本内容中带链接。最初是只读链接，就像看新闻网站时，点击一条新闻链接看具体内容。后来发展为读写链接，就像看完新闻写个评论。

什么是API？
-------------------

API即应用程序编程接口，是提供给应用程序和开发人员调用的编程接口，通过API可以将不同的系统串连起来。

Web上设计超文本API
-------------------

什么是Web API？大概是WebService的简化，去掉了对服务的定义和描述。

下面看一下对Web API响应数据的不同设计。

假如现在需要实现用户的增删改查功能，客户端不限，服务端可以使用以下几种方式响应客户端对用户列表的请求。

第一种：

    1,tom,admin,active
    2,mike,user,pending

这种方式返回数据量小，效率高。但是客户端必须自己实现解析程序，并且严格按照服务端的数据格式进行解析，服务端稍有变动，客户端就可能不能工作了。

第二种：

    {
      users: [{
        id: 1,
        name: 'tom',
        role: 'admin',
        status: 'active'
      }, {
        id: 2,
        name: 'mike',
        role: 'user',
        status: 'pending'
      }
    }

这种方式使用JSON数据返回，数据量比第一种要多了，但是JSON解析的工具很多，客户端不需要自己实现解析程序。到了这里，响应中已经包含了关于数据的元数据，即id、name、role等，可用于描述实际数据1、tom、admin等。但客户端获取到这些数据后，如果想要进一步动作，需要依赖客户端预定义的编码。比如，列表中只列出了主要信息，客户端想要获取某个用户的详细信息时，需要知道如何拼接出新的URL来做进一步请求。

第三种：

    {
      users: [{
        name: 'tom',
        role: 'admin',
        status: 'active',
        uri: 'http://domain/users/1'
      }, {
        name: 'mike',
        role: 'user',
        status: 'pending',
        uri: 'http://domain/users/2'
      }
    }

这里在第二种响应设计的基础上，增加了uri属性，用于标识出客户端获取明细信息的URI地址。这里有了链接，说起来便是超文本API了。

通过这个uri，客户端还可以依靠不同的HTTP Method(get、put、delete)来操作用户信息。

按照这样的思路做特定领域风格或一般领域风格的设计，客户端和服务端遵守一些基本的约定，如MIME类型、HTTP Method等，服务端和客户端的实现还是比较省力的。

但可能上面的设计还不够通用，这时第四种设计就出来了。

第四种：

    {
      collection: [{
        links: [{
          rel: 'detail',
          href: 'http://domain/users/1',
          method: 'get'
        }],
        items: [
          {name: 'name', value: 'tom', prompt: 'Name'},
          {name: 'role', value: 'admin', prompt: 'Role'},
          {name: 'status', value: 'active', prompt: 'Status'}
        ]
      }, {
        links: [{
          rel: 'detail',
          href: 'http://domain/users/2',
          method: 'get'
        }],
        items: [
          {name: 'name', value: 'mike', prompt: 'Name'},
          {name: 'role', value: 'user', prompt: 'Role'},
          {name: 'status', value: 'pending', prompt: 'Status'}
        ]
      }]
    }

这时已经领域无关了，如果客户端实现得比较好，那无论是用户信息管理，还是博客信息管理，都可以通过一个客户端来操作。

那么如果一个客户端可以操作服务端响应的任何数据，并且领域无关，不是用浏览器就好？于是就直接用HTML来设计API了。

第五种：

    <div id="users">
      <ul class="all">
        <li>
          <span class="name">tom</span>
          <span class="role">admin</span>
          <span class="status">active</span>
          <a rel="detail" href="http://domain/users/1">detail</a>
        </li>
        <li>
          <span class="name">mike</span>
          <span class="role">user</span>
          <span class="status">pending</span>
          <a rel="detail" href="http://domain/users/2">detail</a>
        </li>
      </ul>

      <form method="post" action="http://domain/users" class="user-add">
        <input type="text" name="name" value="" required="true"/>
        <input type="text" name="role" value="" required="true"/>
        <input type="password" name="password" value="" required="true"/>
        <input type="submit" value="Create"/>
      </form>
    </div>

使用HTML来设计API最大的好处就是可以直接用浏览器来完成测试，并且可以基本完成应用的处理流程，配以简单的CSS，在浏览器上可以像看网页一样轻松浏览所有API。客户端仍可以通过AJAX或其他客户端程序，编程操作这些API，改善用户体验，优化操作流程。

但目前无论是开放平台还是企业内部使用的API，还没有看到这样的设计。

_____________________________________________
<i>读《使用HTML5和Node构建超媒体API》</i>