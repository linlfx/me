---
layout: post
title: "React简单TODO示例"
date: 2020-04-10 22:38
categories: ["Javascript", "React"]
---

一、环境信息
---

- NodeJS：v12.16.1
- Yarn：1.22.4
- create-react-app：3.4.1

二、创建项目
---

使用React官方脚手架创建项目：

```
create-react-app react-simple-todo
cd react-simple-todo
yarn start
```

浏览器出现以下画面，项目生成成功。

![]({{ "/images/react-simple-todo/001.png" | prepend: site.baseurl }})

三、Todo List

使用下面的命令添加路由依赖：

```
yarn add react-router-dom antd
```

src目录下增加todo文件夹，新在todo下新建文件List.jsx，内容如下：

```javascript
import React from 'react';
import { Table } from 'antd';

const columns = [{
  title: '标题',
  dataIndex: 'title',
}, {
  title: '状态',
  dataIndex: 'status',
}];

class List extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      list: [{
        id: 1,
        title: 'React简单示例演示任务',
        status: '进行中',
      }, {
        id: 2,
        title: '博客更新',
        status: '未开始',
      }]
    }
  }

  render() {
    return (
      <Table dataSource={this.state.list} columns={columns} rowKey="id" />
    );
  }
};

export default List;
```

调整index.js，增加路由，最终内容如下：

```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import './index.css';
import App from './App';
import Todo from './todo/List';

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Route path="/" component={App} exact />
      <Route path="/todo" component={Todo} />
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);
```

此时在浏览器中输入()[http://localhost:3000/todo]，可以访问todoList，但antd的没有样式，如下图：

![]({{ "/images/react-simple-todo/002.png" | prepend: site.baseurl }})

执行下面的命令，将配置暴露出来：

```
yarn run eject
```

安装插件：

```
yarn add babel-plugin-import --save-dev
```

在package.json的babel节点下增加plugins配置，使其像下面这样：

```
  "babel": {
    "presets": [
      "react-app"
    ],
    "plugins": [
      ["import", { "libraryName": "antd", "libraryDirectory": "es", "style": "css" }]
    ]
  }
```

服务停掉重启一次，然后界面刷新后antd样式可以正常，如下：

![]({{ "/images/react-simple-todo/003.png" | prepend: site.baseurl }})
