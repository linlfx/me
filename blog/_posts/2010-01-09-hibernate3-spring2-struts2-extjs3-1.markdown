---
layout: post
title: "Hibernate3.3.2+Spring2.5.5+Struts2.1.6+Extjs3.0.0 Annotations方式快速开发框架(上)"
date: 2010-01-09 20:46
categories: "开发框架"
---

一、准备
--------------------------

1. Hibernate： hibernate-distribution-3.3.2.GA, hibernate-annotations-3.4.0.GA
2. Spring： spring-framework-2.5.5-with-dependencies.zip
3. Struts2: struts-2.1.6-all.zip
4. Extjs: ext-3.0.0.zip

另外，数据库使用Oracle XE，开发工具使用eclipse-jee-galileo-SR1-win32，Web容器使用apache-tomcat-6.0.14。

二、数据库建表
------------------------------

新建表空间DEMO，新建用户demo、密码demo。在该表空间中建表HSSEA_DEMO和OBJECT_ID，OBJECT_ID用于存储主键值。

    CREATE TABLE HSSEA_DEMO
    (
      ID           NUMBER(10)                       NOT NULL,
      CODE         NVARCHAR2(200)                   NOT NULL,
      DESCRIPTION  NVARCHAR2(200)
    );

    ALTER TABLE HSSEA_DEMO ADD (
      CONSTRAINT HSSEA_DEMO_PK
     PRIMARY KEY
     (ID));

    CREATE TABLE OBJECT_ID
    (
      NAME   VARCHAR2(255 BYTE)                     NOT NULL,
      VALUE  NUMBER(10)                             NOT NULL
    );

三、新建动态网站
-------------------------------

![]({{ "/images/ssh-extjs3/1.jpg" | prepend: site.baseurl }})

Project name : HSSEADemo。Target runtime单击New...，弹出框选择Apache Tomcat v6.0，Next，Tomcat installation directory选择安装tomcat的根目录，Finish。再一次Finish完成新建动态网站。
 
四、整合Hibernate、Spring
-----------------------------------------

复制以下jar包到项目WebContent\lib下

hibernate-distribution-3.3.2.GA\hibernate3.jar

hibernate-distribution-3.3.2.GA\lib\required目录下所有jar包

hibernate-distribution-3.3.2.GA\lib\optional\c3p0\c3p0-0.9.1.jar

hibernate-annotations-3.4.0.GA\hibernate-annotations.jar

hibernate-annotations-3.4.0.GA\lib目录下的hibernate-commons-annotations.jar、ejb3-persistence.jar

hibernate-annotations-3.4.0.GA\lib\test目录下log4j.jar、slf4j-log4j12.jar 

spring-framework-2.5.5\dist\spring.jar

spring-framework-2.5.5\lib\aspectj下所有包

其他还需引入包commons-logging-1.0.4.jar，ojdbc14.jar。

在项目Properties->Java Build Path->Libraries，Add JARs... 加入所有包。 

增加基础服务抽象类，用以完成基本的增删改查操作

    package com.xy.service;

    import java.io.Serializable;
    import java.lang.reflect.ParameterizedType;
    import java.util.List;
    import java.util.Set;

    import javax.annotation.Resource;

    import org.apache.log4j.Logger;
    import org.hibernate.SessionFactory;
    import org.hibernate.criterion.Criterion;
    import org.hibernate.criterion.DetachedCriteria;
    import org.hibernate.criterion.Order;
    import org.springframework.orm.hibernate3.support.HibernateDaoSupport;

    /**
     * 增删改查分页等基本功能抽象类，使用hibernate做dao层
     * @author xy
     * @date 2009-12-31
     * @param <T> entity类
     */
    public abstract class BaseServiceForHibernate<T> extends HibernateDaoSupport{
        static Logger logger = Logger.getLogger(BaseServiceForHibernate.class.getName());

        //为父类HibernateDaoSupport注入sessionFactory的值
        @Resource(name="sessionFactory")
        public void setSuperSessionFactory(SessionFactory sessionFactory){
            logger.debug("为父类HibernateDaoSupport注入sessionFactory的值["+sessionFactory+"]");
            super.setSessionFactory(sessionFactory);
        }

        private Class<T> entityClass;

        @SuppressWarnings("unchecked")
        public BaseServiceForHibernate(){
            entityClass =(Class<T>) ((ParameterizedType) getClass()
                    .getGenericSuperclass()).getActualTypeArguments()[0];
            logger.debug("得到entity对象类实例["+entityClass+"]");
        }
        
        /**
         * 根据对象是否存在ID新增或更新记录
         * @param entity对象
         */
        public void save(T o){
            logger.debug("保存数据，对象："+o);
            super.getHibernateTemplate().saveOrUpdate(o);
        }
        
        /**
         * 根据主键删除记录
         * @param 主键
         */
        public void delete(Serializable id){
            logger.debug("根据主键删除数据，主键："+id);
            super.getHibernateTemplate().delete(super.getHibernateTemplate().load(entityClass, id));
        }
        
        /**
         * 根据条件查询记录
         * @param 存储条件的容器
         * @return 数据列表
         */
        @SuppressWarnings("unchecked")
        public List<T> query(Set<Criterion> criterionSet){
            logger.debug("根据条件查询数据！条件数："+criterionSet.size());

            DetachedCriteria detachedCriteria = DetachedCriteria.forClass(entityClass);
            for(Criterion o : criterionSet){
                detachedCriteria.add(o);
            }
            return super.getHibernateTemplate().findByCriteria(detachedCriteria);
        }

        /**
         * 根据条件查询记录
         * @param 存储条件的容器
         * @param 存储排序的容器
         * @return 数据列表
         */
        @SuppressWarnings("unchecked")
        public List<T> query(Set<Criterion> criterionSet, Set<Order> orderSet){
            logger.debug("根据条件和排序查询数据！条件数："+criterionSet.size()+"，排序数："+orderSet.size());

            DetachedCriteria detachedCriteria = DetachedCriteria.forClass(entityClass);
            for(Criterion o : criterionSet){
                detachedCriteria.add(o);
            }
            for(Order o : orderSet){
                detachedCriteria.addOrder(o);
            }
            return super.getHibernateTemplate().findByCriteria(detachedCriteria);
        }

        /**
         * 根据条件分页查询记录
         * @param 存储条件的容器
         * @param 数据开始位置（第一条记录为0）
         * @param 最大数据数
         * @return 数据列表
         */
        @SuppressWarnings("unchecked")
        public List<T> query(Set<Criterion> criterionSet, int firstResult, int maxResults){
            logger.debug("根据条件分页查询数据！条件数："+criterionSet.size()+"，记录开始序号："+firstResult+"，最大记录数："+maxResults);

            DetachedCriteria detachedCriteria = DetachedCriteria.forClass(entityClass);
            for(Criterion o : criterionSet){
                detachedCriteria.add(o);
            }
            return super.getHibernateTemplate().findByCriteria(detachedCriteria, firstResult, maxResults);
        }

        /**
         * 根据条件分页查询记录
         * @param 存储条件的容器
         * @param 存储排序的容器
         * @param 数据开始位置（第一条记录为0）
         * @param 最大数据数
         * @return 数据列表
         */
        @SuppressWarnings("unchecked")
        public List<T> query(Set<Criterion> criterionSet, Set<Order> orderSet, int firstResult, int maxResults){
            logger.debug("根据条件和排序分页查询数据！条件数："+criterionSet.size()+"，排序数："+orderSet.size()+"，记录开始序号："+firstResult+"，最大记录数："+maxResults);

            DetachedCriteria detachedCriteria = DetachedCriteria.forClass(entityClass);
            for(Criterion o : criterionSet){
                detachedCriteria.add(o);
            }
            for(Order o : orderSet){
                detachedCriteria.addOrder(o);
            }
            return super.getHibernateTemplate().findByCriteria(detachedCriteria, firstResult, maxResults);
        }

        /**
         * 根据条件取得记录总数[性能严重问题，需改]
         * @param 存储条件的容器
         * @return 记录总数
         */
        public int totalSize(Set<Criterion> criterionSet){
            logger.debug("根据条件取记录总数！条件数："+criterionSet.size());

            List<T> list = query(criterionSet);
            return list!=null?list.size():0;
        }
        
        /**
         * 根据主键取得数据
         * @param 主键
         * @return entity对象
         */
        @SuppressWarnings("unchecked")
        public T get(Serializable id){
            logger.debug("根据主键删除数据，主键："+id);

            return (T)super.getHibernateTemplate().get(entityClass, id);
        }
    }

增加Demo实体类

    package com.xy.entity.demo;

    import javax.persistence.Column;
    import javax.persistence.Entity;
    import javax.persistence.GeneratedValue;
    import javax.persistence.GenerationType;
    import javax.persistence.Id;
    import javax.persistence.SequenceGenerator;
    import javax.persistence.Table;
    import javax.persistence.TableGenerator;

    @Entity
    @Table(name="HSSEA_DEMO")
    public class Demo {
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

增加DemoService类

    package com.xy.service.demo;

    import java.util.HashSet;
    import java.util.List;
    import java.util.Set;

    import org.hibernate.criterion.Criterion;
    import org.hibernate.criterion.Restrictions;
    import org.springframework.stereotype.Service;

    import com.xy.entity.demo.Demo;
    import com.xy.service.BaseServiceForHibernate;

    @Service("demoService")
    public class DemoService extends BaseServiceForHibernate<Demo> {
        /**
         * 根据code取对象
         * @param code
         * @return
         */
        public Demo get(String code){
            Set<Criterion> set = new HashSet<Criterion>();
            set.add(Restrictions.eq("code", code));
            List<Demo> list = super.query(set);
            if(list!=null&&list.size()>0){
                return list.get(0);
            }else{
                return null;
            }
        }
    }

DemoService中只需关注特殊业务，基本增删改查已由BaseServiceForHibernate完成。

在src下增加目录config，并增加四个如下配置文件：

jdbc.properties

    db.driverClass=oracle.jdbc.driver.OracleDriver
    db.jdbcUrl=jdbc:oracle:thin:@localhost:1521:XE
    db.user=demo
    db.password=demo

applicationContext-resources.xml

    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE beans PUBLIC "-//SPRING//DTD BEAN//EN"
            "http://www.springframework.org/dtd/spring-beans.dtd">

    <beans>
        <!-- properties files  -->
        <bean id="propertyConfig"
              class="org.springframework.beans.factory.config.PropertyPlaceholderConfigurer">
            <property name="locations">
                <list>
                    <value>classpath:config/jdbc.properties</value>
                </list>
            </property>
        </bean>

        <!-- JNDI DataSource for J2EE environments -->
        <bean id="dataSource" class="com.mchange.v2.c3p0.ComboPooledDataSource" destroy-method="close">
            <property name="driverClass">
                <value>${db.driverClass}</value>
            </property>
            <property name="jdbcUrl">
                <value>${db.jdbcUrl}</value>
            </property>
            <property name="user">
                <value>${db.user}</value>
            </property>
            <property name="password">
                <value>${db.password}</value>
            </property>
        </bean>

    </beans>

hibernate.cfg.xml

    <?xml version='1.0' encoding='utf-8'?>
    <!DOCTYPE hibernate-configuration PUBLIC
            "-//Hibernate/Hibernate Configuration DTD 3.0//EN"
            "http://hibernate.sourceforge.net/hibernate-configuration-3.0.dtd">

    <hibernate-configuration>

        <session-factory>

            <!-- 数据库言 -->
            <property name="dialect">org.hibernate.dialect.OracleDialect</property>
            
            <!-- 将Session扔到线程里去处理 -->
            <property name="current_session_context_class">thread</property>

            <!-- 在控制台打印SQL语句 -->
            <property name="show_sql">true</property>

            <!-- 自动把实体类与属性映射成数据库中的表与列 -->
            <property name="hbm2ddl.auto">update</property>
             
            <!-- 在Hibernate中注册实体类 -->
            <mapping class="com.xy.entity.demo.Demo"/>

        </session-factory>

    </hibernate-configuration>

applicationContext-common.xml

    <?xml version="1.0" encoding="UTF-8"?>
    <beans xmlns="http://www.springframework.org/schema/beans"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
        xmlns:context="http://www.springframework.org/schema/context"
        xmlns:aop="http://www.springframework.org/schema/aop"
        xmlns:tx="http://www.springframework.org/schema/tx"
        xsi:schemaLocation="
                http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans-2.5.xsd
                http://www.springframework.org/schema/aop http://www.springframework.org/schema/aop/spring-aop-2.5.xsd
                http://www.springframework.org/schema/tx http://www.springframework.org/schema/tx/spring-tx-2.5.xsd
                http://www.springframework.org/schema/context http://www.springframework.org/schema/context/spring-context-2.5.xsd">
                
        <!-- 配置SessionFactory,由Spring容器来管理 Hibernate -->
        <!-- Hibernate Annotation所用的映射方式是mapping class,所以用AnnotationSessionFactoryBean -->
        <bean id="sessionFactory"
            class="org.springframework.orm.hibernate3.annotation.AnnotationSessionFactoryBean">
            <property name="dataSource">
                <ref bean="dataSource"/>
            </property>
            <property name="configLocation">
                <value>classpath:config/hibernate.cfg.xml</value>
            </property>
        </bean>

        <!-- 配置事务管理器 -->
        <bean id="transactionManager"
            class="org.springframework.orm.hibernate3.HibernateTransactionManager">
            <property name="sessionFactory">
                <ref bean="sessionFactory" />
            </property>
        </bean>
        
        <!-- 配置事务的传播特性 -->
        <tx:advice id="txAdvice" transaction-manager="transactionManager">
            <tx:attributes>
                <tx:method name="save*" propagation="REQUIRED" />
                <tx:method name="update*" propagation="REQUIRED" />
                <tx:method name="delete*" propagation="REQUIRED" />
                <tx:method name="*" read-only="true" />
            </tx:attributes>
        </tx:advice>
        
        
        <!-- 那些类的哪些方法参与事务 -->
        <aop:config>
            <aop:pointcut id="allServiceMethod" expression="execution(* com.xy.service.*.*.*(..))" />
            <aop:advisor pointcut-ref="allServiceMethod" advice-ref="txAdvice" />
        </aop:config>
        
        <!-- 使Spring关注 Annotation -->
        <context:annotation-config/>
        
        <!-- 让Spring通过自动扫描来查询和管理 Bean -->
        <context:component-scan base-package="com.xy.service"/>
        
    </beans>

增加log4j配置，在src目录下增加commons-logging.properties和log4j.properties

commons-logging.properties

    ## set Log as Log4j
    org.apache.commons.logging.Log=org.apache.commons.logging.impl.Log4JLogger

log4j.properties

    # This is the configuring for logging displayed in the Application Server
    log4j.rootCategory=ERROR,stdout

    #stdout configure
    log4j.appender.stdout=org.apache.log4j.ConsoleAppender
    log4j.appender.stdout.layout=org.apache.log4j.PatternLayout
    log4j.appender.stdout.layout.ConversionPattern= %d %p [%c] - <%m>%n

    log4j.logger.com.xy.service.BaseServiceForHibernate=DEBUG

增加单元测试

项目Properties->Java Build Path->Libraries，Add Library...，选择JUnit,JUnit4,Finish。
增加单元测试类TestDemo

    package com.xy.test;

    import java.util.HashSet;
    import java.util.List;
    import java.util.Set;

    import org.hibernate.criterion.Criterion;
    import org.hibernate.criterion.Order;
    import org.hibernate.criterion.Restrictions;
    import org.junit.Before;
    import org.junit.Test;
    import org.springframework.context.ApplicationContext;
    import org.springframework.context.support.FileSystemXmlApplicationContext;

    import com.xy.entity.demo.Demo;
    import com.xy.service.demo.DemoService;

    public class TestDemo {
        private ApplicationContext context;
        private DemoService demoService;
        
        @Before
        public void setUp() throws Exception {
            String[] config={"classpath:config/applicationContext-*.xml"};
            context=new FileSystemXmlApplicationContext(config);
            demoService =(DemoService)context.getBean("demoService");
        }

        @Test
        public void testInsert(){
            for(int i=0;i<10;i++){
                Demo demo = new Demo();
                demo.setCode("code"+i);
                demo.setDescription("description"+i);
                demoService.save(demo);
            }
        }
        
        @Test
        public void testDelete(){
            Demo demo = demoService.get("code1");
            assert(demo!=null);
            demoService.delete(demo.getId());
            demo = demoService.get("code1");
            assert(demo==null);
        }
        
        @Test
        public void testUpdate(){
            Demo demo = demoService.get("code2");
            assert(demo!=null);
            demo.setDescription("description8");
            demoService.save(demo);
            demo = demoService.get("code2");
            assert(demo.getDescription().equals("update"));
        }

        @Test
        public void testQuery(){
            Set<Criterion> set = new HashSet<Criterion>();
            set.add(Restrictions.like("description", "%8"));
            
            List<Demo> list = demoService.query(set);
            assert(list!=null&&list.size()==2);
        }

        @Test
        public void testPageQuery(){
            Set<Criterion> criterionSet = new HashSet<Criterion>();
            Set<Order> orderSet = new HashSet<Order>();
            orderSet.add(Order.asc("description"));
            int count = demoService.totalSize(criterionSet);
            for(int i=0;i<count;i+=5){
                System.out.println("========第"+(i/5+1)+"页========");
                List<Demo> list = demoService.query(criterionSet, orderSet, i, 5);
                for(Demo o : list){
                    System.out.println(o.getId()+"|"+o.getCode()+"|"+o.getDescription());
                }
            }
        }
    }

TestDemo run as Junit Test!

如果一切顺利，单元测试通过，控制台输出类似以下信息：

    2010-01-09 00:23:43,311 DEBUG [com.xy.service.BaseServiceForHibernate] - <得到entity对象类实例[class com.xy.entity.demo.Demo]>
    2010-01-09 00:23:43,326 DEBUG [com.xy.service.BaseServiceForHibernate] - <为父类HibernateDaoSupport注入sessionFactory的值 [org.hibernate.impl.SessionFactoryImpl@75c78d]>
    2010-01-09 00:23:43,334 DEBUG [com.xy.service.BaseServiceForHibernate] - <保存数据，对象：com.xy.entity.demo.Demo@ee20fe>
    Hibernate: insert into HSSEA_DEMO (CODE, DESCRIPTION, id) values (?, ?, ?)
    2010-01-09 00:23:43,396 DEBUG [com.xy.service.BaseServiceForHibernate] - <保存数据，对象：com.xy.entity.demo.Demo@16752c9>
    Hibernate: insert into HSSEA_DEMO (CODE, DESCRIPTION, id) values (?, ?, ?)
    2010-01-09 00:23:43,401 DEBUG [com.xy.service.BaseServiceForHibernate] - <保存数据，对象：com.xy.entity.demo.Demo@b52a28>
    Hibernate: insert into HSSEA_DEMO (CODE, DESCRIPTION, id) values (?, ?, ?)
    2010-01-09 00:23:43,404 DEBUG [com.xy.service.BaseServiceForHibernate] - <保存数据，对象：com.xy.entity.demo.Demo@ad7d80>
    Hibernate: insert into HSSEA_DEMO (CODE, DESCRIPTION, id) values (?, ?, ?)
    2010-01-09 00:23:43,407 DEBUG [com.xy.service.BaseServiceForHibernate] - <保存数据，对象：com.xy.entity.demo.Demo@1082823>
    Hibernate: insert into HSSEA_DEMO (CODE, DESCRIPTION, id) values (?, ?, ?)
    2010-01-09 00:23:43,410 DEBUG [com.xy.service.BaseServiceForHibernate] - <保存数据，对象：com.xy.entity.demo.Demo@268cc6>
    Hibernate: insert into HSSEA_DEMO (CODE, DESCRIPTION, id) values (?, ?, ?)
    2010-01-09 00:23:43,413 DEBUG [com.xy.service.BaseServiceForHibernate] - <保存数据，对象：com.xy.entity.demo.Demo@1db0da1>
    Hibernate: insert into HSSEA_DEMO (CODE, DESCRIPTION, id) values (?, ?, ?)
    2010-01-09 00:23:43,417 DEBUG [com.xy.service.BaseServiceForHibernate] - <保存数据，对象：com.xy.entity.demo.Demo@15c2843>
    Hibernate: insert into HSSEA_DEMO (CODE, DESCRIPTION, id) values (?, ?, ?)
    2010-01-09 00:23:43,420 DEBUG [com.xy.service.BaseServiceForHibernate] - <保存数据，对象：com.xy.entity.demo.Demo@1c4795e>
    Hibernate: insert into HSSEA_DEMO (CODE, DESCRIPTION, id) values (?, ?, ?)
    2010-01-09 00:23:43,501 DEBUG [com.xy.service.BaseServiceForHibernate] - <保存数据，对象：com.xy.entity.demo.Demo@1b493c6>
    Hibernate: insert into HSSEA_DEMO (CODE, DESCRIPTION, id) values (?, ?, ?)
    2010-01-09 00:23:43,703 DEBUG [com.xy.service.BaseServiceForHibernate] - <得到entity对象类实例[class com.xy.entity.demo.Demo]>
    2010-01-09 00:23:43,704 DEBUG [com.xy.service.BaseServiceForHibernate] - <为父类HibernateDaoSupport注入sessionFactory的值 [org.hibernate.impl.SessionFactoryImpl@1bd9de3]>
    2010-01-09 00:23:43,710 DEBUG [com.xy.service.BaseServiceForHibernate] - <根据条件查询数据！条件数：1>
    Hibernate: select this_.id as id3_0_, this_.CODE as CODE3_0_, this_.DESCRIPTION as DESCRIPT3_3_0_ from HSSEA_DEMO this_ where this_.CODE=?
    2010-01-09 00:23:43,728 DEBUG [com.xy.service.BaseServiceForHibernate] - <根据主键删除数据，主键：2>
    Hibernate: select demo0_.id as id3_0_, demo0_.CODE as CODE3_0_, demo0_.DESCRIPTION as DESCRIPT3_3_0_ from HSSEA_DEMO demo0_ where demo0_.id=?
    Hibernate: delete from HSSEA_DEMO where id=?
    2010-01-09 00:23:43,737 DEBUG [com.xy.service.BaseServiceForHibernate] - <根据条件查询数据！条件数：1>
    Hibernate: select this_.id as id3_0_, this_.CODE as CODE3_0_, this_.DESCRIPTION as DESCRIPT3_3_0_ from HSSEA_DEMO this_ where this_.CODE=?
    2010-01-09 00:23:43,998 DEBUG [com.xy.service.BaseServiceForHibernate] - <得到entity对象类实例[class com.xy.entity.demo.Demo]>
    2010-01-09 00:23:43,999 DEBUG [com.xy.service.BaseServiceForHibernate] - <为父类HibernateDaoSupport注入sessionFactory的值 [org.hibernate.impl.SessionFactoryImpl@71949b]>
    2010-01-09 00:23:44,003 DEBUG [com.xy.service.BaseServiceForHibernate] - <根据条件查询数据！条件数：1>
    Hibernate: select this_.id as id6_0_, this_.CODE as CODE6_0_, this_.DESCRIPTION as DESCRIPT3_6_0_ from HSSEA_DEMO this_ where this_.CODE=?
    2010-01-09 00:23:44,006 DEBUG [com.xy.service.BaseServiceForHibernate] - <保存数据，对象：com.xy.entity.demo.Demo@1b071c0>
    Hibernate: update HSSEA_DEMO set CODE=?, DESCRIPTION=? where id=?
    2010-01-09 00:23:44,012 DEBUG [com.xy.service.BaseServiceForHibernate] - <根据条件查询数据！条件数：1>
    Hibernate: select this_.id as id6_0_, this_.CODE as CODE6_0_, this_.DESCRIPTION as DESCRIPT3_6_0_ from HSSEA_DEMO this_ where this_.CODE=?
    2010-01-09 00:23:44,265 DEBUG [com.xy.service.BaseServiceForHibernate] - <得到entity对象类实例[class com.xy.entity.demo.Demo]>
    2010-01-09 00:23:44,266 DEBUG [com.xy.service.BaseServiceForHibernate] - <为父类HibernateDaoSupport注入sessionFactory的值 [org.hibernate.impl.SessionFactoryImpl@5646a5]>
    2010-01-09 00:23:44,268 DEBUG [com.xy.service.BaseServiceForHibernate] - <根据条件查询数据！条件数：1>
    Hibernate: select this_.id as id9_0_, this_.CODE as CODE9_0_, this_.DESCRIPTION as DESCRIPT3_9_0_ from HSSEA_DEMO this_ where this_.DESCRIPTION like ?
    2010-01-09 00:23:44,576 DEBUG [com.xy.service.BaseServiceForHibernate] - <得到entity对象类实例[class com.xy.entity.demo.Demo]>
    2010-01-09 00:23:44,577 DEBUG [com.xy.service.BaseServiceForHibernate] - <为父类HibernateDaoSupport注入sessionFactory的值 [org.hibernate.impl.SessionFactoryImpl@f70ee1]>
    2010-01-09 00:23:44,579 DEBUG [com.xy.service.BaseServiceForHibernate] - <根据条件取记录总数！条件数：0>
    2010-01-09 00:23:44,579 DEBUG [com.xy.service.BaseServiceForHibernate] - <根据条件查询数据！条件数：0>
    Hibernate: select this_.id as id12_0_, this_.CODE as CODE12_0_, this_.DESCRIPTION as DESCRIPT3_12_0_ from HSSEA_DEMO this_
    ========第1页========
    2010-01-09 00:23:44,583 DEBUG [com.xy.service.BaseServiceForHibernate] - <根据条件和排序分页查询数据！条件数：0，排序数：1，记录开始序号：0，最大记录数：5>
    Hibernate: select * from ( select this_.id as id12_0_, this_.CODE as CODE12_0_, this_.DESCRIPTION as DESCRIPT3_12_0_ from HSSEA_DEMO this_ order by this_.DESCRIPTION asc ) where rownum <= ?
    1|code0|description0
    4|code3|description3
    5|code4|description4
    6|code5|description5
    7|code6|description6
    ========第2页========
    2010-01-09 00:23:44,587 DEBUG [com.xy.service.BaseServiceForHibernate] - <根据条件和排序分页查询数据！条件数：0，排序数：1，记录开始序号：5，最大记录数：5>
    Hibernate: select * from ( select row_.*, rownum rownum_ from ( select this_.id as id12_0_, this_.CODE as CODE12_0_, this_.DESCRIPTION as DESCRIPT3_12_0_ from HSSEA_DEMO this_ order by this_.DESCRIPTION asc ) row_ ) where rownum_ <= ? and rownum_ > ?
    8|code7|description7
    9|code8|description8
    3|code2|description8
    10|code9|description9

到此完成Hibernate+Spring的Annotations方式整合，项目结构如下：

![]({{ "/images/ssh-extjs3/2.jpg" | prepend: site.baseurl }})


[源码](https://github.com/gpleo/HSSEADemo.git "源码"){:target="_blank"}