---
layout: post
title: "Hibernate3.3.2+Spring2.5.5+Struts2.1.6+Extjs3.0.0 Annotations方式快速开发框架(下)"
date: 2010-01-10 12:41
categories: "开发框架"
---

五、整合Struts2、Extjs
------------------------------------

将struts-2.1.6\lib目录下的struts2-codebehind-plugin-2.1.6.jar、struts2-core-2.1.6.jar、struts2-spring-plugin-2.1.6.jar、xwork-2.1.2.jar、ognl-2.6.11.jar、freemarker-2.3.13.jar、commons-fileupload-1.2.1.jar、commons-io-1.3.2.jar复制到项目WebContent\lib下。

另外还需jsonplugin-0.34.jar包，使struts2 action返回json类型。

新建一个entity接口，action层需使用该接口调用实体主键。

    package com.xy.entity;

    public interface BaseEntity {
        public long getId();
    }

修改Demo实体，使其实现BaseEntity接口

    package com.xy.entity.demo;

    import javax.persistence.Column;
    import javax.persistence.Entity;
    import javax.persistence.GeneratedValue;
    import javax.persistence.GenerationType;
    import javax.persistence.Id;
    import javax.persistence.SequenceGenerator;
    import javax.persistence.Table;
    import javax.persistence.TableGenerator;

    import com.xy.entity.BaseEntity;

    @Entity
    @Table(name="HSSEA_DEMO")
    public class Demo implements BaseEntity {
        @Id
        @GeneratedValue(strategy=GenerationType.TABLE, generator="hssea_demo")
        @TableGenerator(name = "hssea_demo",
                        table="OBJECT_ID",
                        pkColumnName="NAME",
                        valueColumnName="VALUE",
                        pkColumnValue="HSSEA_DEMO_PK",
                        initialValue=1,
                        allocationSize=1
        )
        @SequenceGenerator(name="hssea_demo_seq", sequenceName="seq_hssea_demo", allocationSize=1)
        private long id;
        @Column(name="CODE")
        private String code;
        @Column(name="DESCRIPTION")
        private String description;
        public long getId() {
            return id;
        }
        public void setId(long id) {
            this.id = id;
        }
        public String getCode() {
            return code;
        }
        public void setCode(String code) {
            this.code = code;
        }
        public String getDescription() {
            return description;
        }
        public void setDescription(String description) {
            this.description = description;
        }
    }

增加struts2与extjs交互抽象类，完成分页、排序、增删改查。

    package com.xy.action;

    import java.util.HashSet;
    import java.util.List;
    import java.util.Set;

    import org.apache.log4j.Logger;
    import org.apache.struts2.config.ParentPackage;
    import org.apache.struts2.config.Result;
    import org.apache.struts2.config.Results;
    import org.hibernate.criterion.Criterion;
    import org.hibernate.criterion.Order;
    import org.springframework.context.annotation.Scope;
    import org.springframework.stereotype.Controller;

    import com.googlecode.jsonplugin.JSONResult;
    import com.opensymphony.xwork2.ActionSupport;
    import com.xy.service.BaseServiceForHibernate;
    import com.xy.entity.BaseEntity;

    /**
     * struts2与extjs交互抽象类
     * 完成基本增删改查分页等功能，子类继承时只需设置entity中属性的set。
     * @author xy
     * @date 2009-12-31
     * @param <T extends BaseEntity, X extends BaseHibernateDao<T>> entity和service
     */
    @Controller
    @Scope("prototype")
    @ParentPackage(value="json-default")
    @Results({
        @Result(name="success", value="", type=JSONResult.class, params={"ignoreHierarchy", "false"})
    })
    public abstract class Struts2ExtjsBaseAction<T extends BaseEntity, X extends BaseServiceForHibernate<T>> extends ActionSupport{
        static Logger logger = Logger.getLogger(Struts2ExtjsBaseAction.class.getName());
        
        private static final long serialVersionUID = 2863769505963567954L;
        
        // Extjs 使用，成功与否，返回信息
        protected boolean success = false;
        protected String message;
        // Extjs 使用，分页、排序信息
        protected int start;
        protected int limit;
        protected String sort;
        protected String dir;
        
        // Service类
        protected X service;
        
        // 返回的数据列表和记录总数
        protected List<T> list;
        protected int total;
        
        // entity对象，用于提交保存，更新前取个别数据
        protected T entity;
        
        // 记录选中记录的id
        protected String ids;

        /**
         * 取列表
         */
        public String list() {
            logger.debug("取数据列表！start:"+this.start+"，limit:"+this.limit+",sort:"+this.sort+"，dir:"+this.dir);
            
            Set<Criterion> criterionSet = new HashSet<Criterion>();
            Set<Order> orderSet = new HashSet<Order>();
            if(this.dir.equals("ASC")){
                orderSet.add(Order.asc(this.sort));
            }else{
                orderSet.add(Order.desc(this.sort));
            }
            list = service.query(criterionSet, orderSet, this.start, this.limit);
            total = service.totalSize(criterionSet);
            success = true;
            return SUCCESS;
        }
        /**
         * 根据ID取数据
         */
        public String get() {
            logger.debug("根据id取数据明细！id:"+entity.getId());
            
               entity = service.get(entity.getId());
               success = true;
            return SUCCESS;
        }
        /**
         * 保存
         */
        public String save() {
            logger.debug("保存数据！entity:"+entity);

            service.save(entity);
            success = true;
            return SUCCESS;
        }
        /**
         * 删除
         */
        public String delete() {
            logger.debug("根据ids删除数据！ids:"+ids);
            
            for(String s : ids.split(",")){
                service.delete(Long.parseLong(s));
            }
            success = true;
            return SUCCESS;
        }

        // 对象T内部信息的读取均在子类中进行
        
        // getter,setter方法
        // struts2需get方法将数据转换成json
        public List<T> getList() {
            return list;
        }
        public int getTotal() {
            return total;
        }
        public boolean isSuccess() {
            return success;
        }
        public String getMessage() {
            return message;
        }

        // 读取extjs传来的分页和排序信息    
        public void setStart(int start) {
            this.start = start;
        }
        public void setLimit(int limit) {
            this.limit = limit;
        }
        public void setSort(String sort) {
            this.sort = sort;
        }
        public void setDir(String dir) {
            this.dir = dir;
        }
        // 读取extjs传来的选中记录id
        public void setIds(String ids) {
            this.ids = ids;
        }
        
        public T getEntity() {
            return entity;
        }
    }

新增DemoAction类

    package com.xy.action.demo;

    import javax.annotation.Resource;

    import org.apache.struts2.config.Namespace;

    import com.xy.action.Struts2ExtjsBaseAction;
    import com.xy.entity.demo.Demo;
    import com.xy.service.demo.DemoService;

    @Namespace(value="/demo")
    public class DemoAction extends Struts2ExtjsBaseAction<Demo, DemoService>{

        private static final long serialVersionUID = 7796054923782630546L;

        // 注入service
        @Resource(name="demoService")
        public void setDemoService(DemoService demoService){
            super.service = demoService;
        }
        
        public DemoAction(){
            super.entity = new Demo();
        }
        
        // entity对象中的set方法
        public void setId(long id) {
            entity.setId(id);
        }
        public void setCode(String code) {
            entity.setCode(code);
        }
        public void setDescription(String description) {
            entity.setDescription(description);
        }
    }

在WebContent下新增extjs和demo目录，将ext-3.0.0目录下的ext-all.js和resources整个目录、ext-3.0.0\adapter\ext目录下ext-base.js复制到新建的extjs目录下。

在demo目录下新建list.jsp

    <%@ page language="java" pageEncoding="UTF-8"%>
    <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
    <html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>HSSEADemo</title>
        <link rel="stylesheet" type="text/css" href="../extjs/resources/css/ext-all.css" />
        <script type="text/javascript" src="../extjs/ext-base.js"></script>
        <script type="text/javascript" src="../extjs/ext-all.js"></script>
        <script type="text/javascript" src="list.js"></script>
    </head>
    <body bottommargin="0" leftmargin="0" rightmargin="0" topmargin="0" marginheight="0" marginwidth="0">
        <div id="listWin"></div>
        <div id="addDicWin"></div>
    </body>
    </html>

在demo目录下新建list.js

    Ext.onReady(function() {
                // 加载快速菜单
                Ext.QuickTips.init();
                var actionUrl = "demo";

                // 加载分页数据
                var store = new Ext.data.Store({
                            proxy : new Ext.data.HttpProxy({
                                        url : actionUrl+'!list'
                                    }),
                            reader : new Ext.data.JsonReader({
                                        root : 'list',
                                        totalProperty : 'total',
                                        id : 'id',
                                        fields : ['id','code', 'description']
                                    }),
                            remoteSort : true
                        });
                // 设置默认的排序字段和升降序
                store.setDefaultSort('code', 'asc');
        
                // 设置复选框
                var sm = new Ext.grid.CheckboxSelectionModel();
                // 设置列
                var cm = new Ext.grid.ColumnModel([new Ext.grid.RowNumberer(),sm, 
                        {header : "编码", width: 120,dataIndex : 'code',sortable : true}, 
                        {header : "名称", width: 280,dataIndex : 'description',sortable : true}
                ]);
                // 默认排序设置为可排序
                cm.defaultSortable = true;
                // 创建GridPanel
                grid = new Ext.grid.GridPanel({
                            el : 'listWin',
                            width : 900,
                            height : 650,
                            title : '演示',
                            store : store,
                            cm : cm,
                            sm : sm,
                            animCollapse : false,
                            trackMouseOver : false,
                            loadMask : {
                                msg : '载入中,请稍候'
                            },
                            // 上方工具条
                            tbar : [{
                                        id : 'addDicButton',
                                        text : '增加',
                                        tooltip : '添加一条记录'
                                    }, '-', {
                                        id : 'updateDicButton',
                                        text : '修改',
                                        tooltip : '修改所选择的一条记录'
                                    }, '-', {
                                        id : 'deleteDicButton',
                                        text : '删除',
                                        tooltip : '删除所选择的记录'
                                    }],
                            bbar : new Ext.PagingToolbar({
                                        pageSize : 20,
                                        store : store,
                                        displayInfo : true,
                                        displayMsg : '显示 {0} - {1} 共 {2} 条',
                                        emptyMsg : "没有数据显示！",
                                        beforePageText : "页码 ",
                                        afterPageText : "共 {0} 页",
                                        firstText : "首页",
                                        lastText : "末页",
                                        nextText : "下一页",
                                        prevText : "上一页",
                                        refreshText : "刷新"
                                    })
                        });
                // 加载grid
                grid.render();
                // 设置分页数据
                store.load({
                    params : {
                            start : 0,
                            limit : 20
                        }
                });
                
                // 添加
                var addDicWin;
                var addButton = Ext.get('addDicButton');
                addButton.on('click', addButtonClick);
                function addButtonClick() {
                    if (!addDicWin) {
                        addDicWin = new Ext.Window({
                                    el : 'addDicWin',
                                    title : '演示',
                                    layout : 'fit',
                                    width : 450,
                                    height : 180,
                                    closeAction : 'hide',
                                    plain : true,
                                    modal : true,
                                    items : addForm
                                });
                    }
                    addForm.getForm().reset();
                    addDicWin.show(this);
                }

                // 添加form
                var addForm = new Ext.FormPanel({
                            frame : true,
                            labelAlign : 'right',
                            waitMsgTarget : true,
                            autoScroll : true,
                            buttonAlign : 'center',
                            method : 'POST',
                            url : actionUrl + '!save',
                            items :[{    
                                        xtype: 'textfield',
                                        fieldLabel: '编码',
                                        name: 'code',
                                        allowBlank : false,
                                        style : 'ime-mode:disabled',
                                        maxLength : 20,
                                        width : 50
                                    },{    
                                        xtype: 'textfield',
                                        fieldLabel: '描述',
                                        name: 'description',
                                        allowBlank : true,
                                        maxLength : 100,
                                        width : 250
                                    },{    
                                        xtype : 'hidden',
                                        name : 'id'
                                    }]
                });
                // 验证数据并提交
                addForm.addButton('提交', function() {
                        if(addForm.form.isValid()){
                            addForm.getForm().submit({
                                        waitMsg : '保存数据',
                                        success : function() {
                                            store.reload();
                                            Ext.MessageBox.alert('提示', '提交成功！');
                                            addDicWin.hide();
                                        },
                                        failure : function() {
                                            Ext.MessageBox.alert('提示', '提交失败！');
                                            addDicWin.hide();
                                        }
                                    });
                        }
                });

                addForm.addButton('关闭', function() {
                        addDicWin.hide();
                });

                // 删除
                var deleteButton = Ext.get('deleteDicButton');
                deleteButton.on('click', function() {
                            if (grid.getSelectionModel().getSelections().length > 0)
                                Ext.MessageBox.confirm('消息', '确认要删除所选记录?', doDelProc);
                            else
                                Ext.MessageBox.alert('警告', '最少需要选择一条记录!');
                });

                function doDelProc(btn) {
                    if (btn == 'yes') {
                        if (grid.getSelectionModel().hasSelection()) {
                            var ids = '';
                            var records = grid.getSelectionModel().getSelections();
                            for (var i = 0; i < records.length; i++) {
                                if (i == 0) {
                                    ids = records[0].data["id"];
                                } else {
                                    ids += ',' + records[i].data["id"];
                                }
                            }
            
                            Ext.Ajax.request({
                                        method : 'POST',
                                        url : actionUrl + '!delete',
                                        params: {ids: ids}, 
                                        success : function() {
                                            Ext.MessageBox.alert('提示', '数据删除成功！');
                                            store.reload();
                                        },
                                        failure : function() {
                                            Ext.MessageBox.alert('提示', '数据删除失败！');
                                            store.reload();
                                        }
                                    });
                        }
                    }
                };

                // 修改
                var updateButton = Ext.get('updateDicButton');
                updateButton.on('click', function() {
                    var records = grid.getSelectionModel().getSelections();
                    if (records.length > 1) {
                        Ext.MessageBox.alert('提示', '一次不能修改多条记录!');
                        return;
                    } else if (records.length == 0) {
                        Ext.MessageBox.alert('提示', '选择需要修改的一条记录!');
                        return;
                    } else {
                        Ext.Ajax.request({
                            method : 'POST',
                            url : actionUrl + '!get',
                            params: {id: records[0].id},
                            success : function(response, options) {
                                var obj = Ext.decode(response.responseText);
                                if(Ext.isIE){
                                    document.getElementById("addDicButton").click();
                                }else{
                                    addButtonClick();
                                }
                                addForm.getForm().setValues(obj.entity);
                            },
                            failure : function() {
                                Ext.MessageBox.alert('提示 ', '提取数据失败！');
                            }
                        });
                    }
                });
    });

修改web.xml文件

    <?xml version="1.0" encoding="UTF-8"?>
    <web-app xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://java.sun.com/xml/ns/javaee" xmlns:web="http://java.sun.com/xml/ns/javaee/web-app_2_5.xsd" xsi:schemaLocation="http://java.sun.com/xml/ns/javaee http://java.sun.com/xml/ns/javaee/web-app_2_5.xsd" id="WebApp_ID" version="2.5">
      <display-name>HSSEADemo</display-name>

      <!-- 修改Spring配置文件的路径 -->
      <context-param>
        <param-name>contextConfigLocation</param-name>
        <param-value>classpath*:config/applicationContext-*.xml</param-value>
      </context-param>
        
      <!-- 配置Spring -->
      <listener>
        <listener-class>org.springframework.web.context.ContextLoaderListener</listener-class>
      </listener>

      <!-- 配置Struts 2.0 -->
      <filter>
        <filter-name>struts2</filter-name>
        <filter-class>org.apache.struts2.dispatcher.FilterDispatcher</filter-class>
        <init-param>
          <param-name>actionPackages</param-name>
          <param-value>com.xy.action</param-value>
        </init-param>
      </filter>
      <filter-mapping>
        <filter-name>struts2</filter-name>
        <url-pattern>/*</url-pattern>
      </filter-mapping>

      <welcome-file-list>
        <welcome-file>index.html</welcome-file>
      </welcome-file-list>
    </web-app>

到此完成所有演示代码，右击项目，Run As -> Run on Server，用之前设置的tomcat启动，服务启动后，浏览器http://localhost:8080/HSSEADemo/demo/list.jsp，进行增删改查操作。

![]({{ "/images/ssh-extjs3/3.jpg" | prepend: site.baseurl }})

最终项目结构如下：

![]({{ "/images/ssh-extjs3/4.jpg" | prepend: site.baseurl }})


[源码](https://github.com/gpleo/HSSEADemo.git "源码"){:target="_blank"}