module.exports和exports的区别？
---------------
初始时：var exports = module.exports = {};

require返回的是module.exports。

如果module.exports的指向(赋值)改变了，exports就失效了。

如果exports的指向改变了，exports也失效了。

如果要导出的模块是特定类型，就用Module.exports，如果是标准的对象，可用exports。


