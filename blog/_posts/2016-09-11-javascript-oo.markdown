---
layout: post
title: "JavaScript面向对象"
date: 2016-09-11 18:34
categories: ["JavaScript", "面向对象"]
---

数据库需要双活，所以将两台服务器安装MySQL后，做主主复制同步，再配合Keepalived即可实现双活。

基于原型(prototype)创建类
------------------------------

ES6之前JavaScript没有类的概念，是基于原型(prototype)创建类，或者说是类型对象。

```javascript
function Book(id, bookname, price) {
  this.id = id;
  this.bookname = bookname;
  this.price = price;
}
```

以上代码即创建了Book类，使用下面的方式实例化，创建一个book对象。

```javascript
var book = new Book(1, 'javascript', 50);
```

这个Book类只包含属性，还没有方法。因为通过new实例化对象时，都会对类型对象中this指向的属性或方法复制到新的对象中，但方法通常不需要复制一份，通过prototype解决。

```javascript
Book.prototype.display = function () {
  return {id: this.id, bookname: this.bookname, price: this.price};
};
```

上面创建的book对象如下图：

![]({{ "/images/javascript-oo/1_book.png" | prepend: site.baseurl }})

通过new实例化对象时，从Book中将id, bookname, price复制了一份到book，并将Book的prototype指向赋值给book对象的__proto__。

类属性作用域
-------------------------------

类属性(包括方法)的作用域包括私有属性、公有属性和静态属性。

```javascript
function Book(id, bookname, price) {
  // 公有属性
  this.id = id;
  this.bookname = bookname;
  this.price = price;

  // 私有属性
  var status;
  // 公有方法(status只能通过这两个方法访问)
  this.setStatus = function (_status) {
    status = _status;
  };
  this.getStatus = function () {
    return status;
  };
}

// 公有方法
Book.prototype.display = function () {
  return {id: this.id, bookname: this.bookname, price: this.price, status: this.getStatus()};
};

// 静态属性(对象不能访问)
Book.isChinese = true;

var book = new Book(1, 'javascript', 50);
book.setStatus('有货');

console.log('id: ' + book.id);
console.log('book info: ', book.display());
console.log('chinese book: ', Book.isChinese);
```

闭包
-------------------------------

在一个函数(A)内部创建的另外一个函数(B)就是一个闭包，函数(B)有权访问函数(A)作用域中的变量，对作用域的访问权限类似于代码块。

```javascript
function a() {
  var xa = 'function a';
  return function b() {
    var xb = 'function b';
    return function c() {
      console.log(xa);
      console.log(xb);
    }
  }
}

var b = a();
var c = b();
c();
```

如上代码，函数c可以访问函数b和函数a中的私有变量。

通过闭包创建类，可以增加一些额外功能。

```javascript
var Book = (function() {
  var totalBook = 5;  // 最多5本书
  function _book(id, bookname, price) {
    if (totalBook === 0) {
      throw new Error('failed');
    }

    totalBook--;

    this.id = id;
    this.bookname = bookname;
    this.price = price;
  }
  _book.prototype = {
    display: function () {
      return {id: this.id, bookname: this.bookname, price: this.price};
    }
  };
  return _book;
})();

var book1 = new Book(1, 'book1', 10);
console.log(book1.display());	// { id: 1, bookname: 'book1', price: 10 }
var book2 = new Book(2, 'book2', 10);
console.log(book2.display());	// { id: 2, bookname: 'book2', price: 10 }
var book3 = new Book(3, 'book3', 10);
console.log(book3.display());	// { id: 3, bookname: 'book3', price: 10 }
var book4 = new Book(4, 'book4', 10);
console.log(book4.display());	// { id: 4, bookname: 'book4', price: 10 }
var book5 = new Book(5, 'book5', 10);
console.log(book5.display());	// { id: 5, bookname: 'book5', price: 10 }

var book6 = new Book(6, 'book6', 10);	// throw new Error('failed');
```

继承
-------------------------------

类的继承需要同时继承父类的原型及复制父类this上的属性。

```javascript
// 父类
function SuperClass(name) {
  this.name = name;
  this.colors = ['red', 'blue'];
}
SuperClass.prototype.getName = function() {
  return this.name;
};

// 子类
function SubClass(name, time) {
  // 构造函数式继承, 使用子类作用域调用父类构造函数,使父类属性都设置到子类的this上
  // 如果没有这一步，多个子类对象可能直接使用同一个父类实例化后的值
  SuperClass.call(this, name);
  
  // 子类特有属性
  this.time = time;
}

// 继承父类原型
SubClass.prototype = new SuperClass();

// 子类特有方法
SubClass.prototype.getTime = function() {
  return this.time;
};

// 测试
var instance1 = new SubClass('instance1', 2011);
var instance2 = new SubClass('instance2', 2012);

instance1.colors.push('green');

console.log(instance1.colors);  // [ 'red', 'blue', 'green' ]
console.log(instance2.colors);  // [ 'red', 'blue' ]

console.log(instance2.getName()); // instance2
console.log(instance2.getTime()); // 2012
```

上面的代码中，继承父类时使用了SubClass.prototype = new SuperClass();，当父类this属性较多时，会有很多不必要的复制，所以这边做一个改进，使用过渡函数的方式来继承父类的原型。完整代码如下：

```javascript
// 继承原型
function inheritPrototype(subClass, superClass) {
  function F() {} // 过渡函数
  F.prototype = superClass.prototype;  // 仅提取父类原型属性
  var p = new F();
  p.constructor = subClass; // 使用子类构造器
  subClass.prototype = p;   // 子类继承父类原型, 却没有父类实体化后的多余数据
}

// 父类
function SuperClass(name) {
  this.name = name;
  this.colors = ['red', 'blue'];
}
SuperClass.prototype.getName = function() {
  return this.name;
};

// 子类
function SubClass(name, time) {
  // 构造函数式继承, 使用子类作用域调用父类构造函数,使父类属性都设置到子类的this上
  // 如果没有这一步，多个子类对象可能直接使用同一个父类实例化后的值
  SuperClass.call(this, name);
  
  // 子类特有属性
  this.time = time;
}

// 继承父类原型
inheritPrototype(SubClass, SuperClass);

// 子类特有方法
SubClass.prototype.getTime = function() {
  return this.time;
};

// 测试
var instance1 = new SubClass('instance1', 2011);
var instance2 = new SubClass('instance2', 2012);

instance1.colors.push('green');

console.log(instance1.colors);  // [ 'red', 'blue', 'green' ]
console.log(instance2.colors);  // [ 'red', 'blue' ]

console.log(instance2.getName()); // instance2
console.log(instance2.getTime()); // 2012
```

