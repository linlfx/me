---
layout: post
title: "React+Redux的TODO示例"
date: 2020-05-04 16:28
categories: ["Javascript", "React", "Redux"]
---

一、Redux简介

推荐的开发模式是一个app只使用一个store，项目结构通常做如下划分：

- actions

> 具有type属性的对象，用于触发状态变更的动作，改变状态的唯一方法。

- components

> 只负责视觉呈现的展示组件，也可以分为components和pages两个目录，pages对应路由页面。

- containers

> 负责管理数据和业务逻辑的容器组件。

- reducers

> 响应状态变更动作的状态处理函数，根据action对象的type来更新状态。

- store

> state状态管理器，接收action以调用reducer。

- api

> 用于封装对后端数据的请求。

二、环境信息
---

- NodeJS：v12.16.1
- Yarn：1.22.4
- create-react-app：3.4.1

三、项目
---

基于[React简单TODO示例](/2020/04/10/react-simple-todo/index.html)进行调整。

本示例同时演示异步数据请求，需依赖redux-promise-middleware中间件：

```
yarn add redux react-redux redux-promise-middleware
```

### API

实现api/todo.js用于模拟异步请求，增删改查的方法都通过setTimeout模拟请求延时：

```js
let list = [{
  id: 1,
  title: 'React简单示例演示任务',
  status: 'completed',
}, {
  id: 2,
  title: '博客更新',
  status: 'pending',
}, {
  id: 3,
  title: 'React Redux示例演示任务',
  status: 'processing',
}];
let maxId = 3;

export const fetch = () => {
  return new Promise(resolve => {
    setTimeout(() => resolve(list), 2000);
  });
};

export const create = entity => {
  return new Promise(resolve => {
    setTimeout(() => {
      list = [ ...list, { ...entity, id: ++maxId }];
      resolve();
    }, 2000);
  });
};

export const update = (id, entity) => {
  return new Promise(resolve => {
    setTimeout(() => {
      list = list.map(v  => v.id === id ? { ...entity, id } : v);
      resolve();
    }, 2000);
  });
};

export const del = id => {
  return new Promise(resolve => {
    setTimeout(() => {
      list = list.filter(v => v.id !== id);
      resolve();
    }, 2000);
  });
};
```

### Action

实现actions/todo.js用于处理状态变更，这里通过redux-promise-middleware中间件来定义payload为Promise的action，用于处理异步请求：

```js
import { fetch, create, update, del } from '../api/todo';

export const ActionTypes = {
  FETCH: 'FETCH_TODO',
  CREATE: 'CREATE_TODO',
  UPDATE: 'UPDATE_TODO',
  DELETE: 'DELETE_TODO',
};

export const fetchTodo = () => ({
  type: ActionTypes.FETCH,
  payload: fetch(),
});

export const createTodo = entity => ({
  type: ActionTypes.CREATE,
  payload: create(entity),
});

export const updateTodo = (id, entity) => ({
  type: ActionTypes.UPDATE,
  payload: update(id, entity),
});

export const deleteTodo = id => ({
  type: ActionTypes.DELETE,
  payload: del(id),
});
```

### Reducer

使用redux-promise-middleware中间件处理Promise的action时，当对应action发出，中间件会立即触发一个{ACTION_TYPE}\_PENDING的action，当Promise的状态改变（resolved或rejected）时再触发另一个action（{ACTION_TYPE}\_FULFILLED或{ACTION_TYPE}\_REJECTED）：

```js
import { ActionTypes } from '../actions/todo';

const todo = (state = {
  loading: false,
  saving: false,
}, action) => {
  switch (action.type) {
    case `${ActionTypes.FETCH}_PENDING`:
      return {
        ...state,
        loading: true,
      };
    case `${ActionTypes.FETCH}_FULFILLED`:
      return {
        ...state,
        loading: false,
        list: action.payload,
      };
    default:
      return state;
  }
};

export default todo;
```

### Container

对component尽量使用函数式组件，业务和数据尽量在container中处理：

```js
import { connect } from 'react-redux';
import { fetchTodo, createTodo, updateTodo, deleteTodo } from '../actions/todo';
import Todo from '../components/todo';

const mapStateToProps = state => {
  return state.todo;
};

const mapDispatchToProps = (dispatch) => {
  const fetch = () => dispatch(fetchTodo());
  const create = entity => {
    const create = dispatch(createTodo(entity));
    create.then(fetch);
    return create;
  };
  const update = (id, entity) => {
    const update = dispatch(updateTodo(id, entity));
    update.then(fetch);
    return update;
  };
  const del = id => {
    const del = dispatch(deleteTodo(id));
    del.then(fetch);
    return del;
  };

  return {
    fetch,
    create,
    update,
    del,
  }
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Todo);
```

在创建、更新、删除数据成功后，重新刷新数据列表。

### Store

在程序入口创建store，并通过Provider组件进行传递：

```js
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux'
import { createStore, applyMiddleware } from 'redux';
import promise from 'redux-promise-middleware';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import './index.css';
import App from './App';
import Todo from './containers/Todo';
import reducers from './reducers';

const composeStoreWithMiddleware = applyMiddleware(promise)(createStore);
const store = composeStoreWithMiddleware(reducers);

ReactDOM.render(
  <Provider store={store}>
    <Router>
      <Route path="/" component={App} exact />
      <Route path="/todo" component={Todo} />
    </Router>
  </Provider>,
  document.getElementById('root')
);
```

最终效果：

![]({{ "/images/react-redux-todo/01.gif" | prepend: site.baseurl }})

示例代码下载地址：[https://github.com/gpleo/react-redux-todo](https://github.com/gpleo/react-redux-todo)
