---
layout: post
title: "Struts2.1.8+JasperReport3.7.1结合iReport3.7.1报表开发"
date: 2010-03-12 23:54
categories: "报表开发"
---

一、准备
--------------------------

下载iReport3.7.1、JasperReport3.7.1、Struts2.1.8及其他需要的包，需导入包如下图：

![]({{ "/images/struts2-ireport3/1.png" | prepend: site.baseurl }})

如需生成Excel的话，还需导入poi-3.5.jar包。

二、整合Struts2+JasperReport3
---------------------------------------------

####1. 新建以下三个pojo类：

Address

    package com.xy.report.pojo;

    public class Address {
        private String city;
        private String zipcode;
        public String getCity() {
            return city;
        }
        public void setCity(String city) {
            this.city = city;
        }
        public String getZipcode() {
            return zipcode;
        }
        public void setZipcode(String zipcode) {
            this.zipcode = zipcode;
        }
    }

Company

    package com.xy.report.pojo;

    import java.util.HashSet;
    import java.util.Set;

    public class Company implements Comparable<Company>{
        private String name;
        private Address address;
        private Set<Staff> staffs = new HashSet<Staff>();
        
        @Override
        public int compareTo(Company o) {
            return o.getName().compareTo(this.getName());
        }

        public String getName() {
            return name;
        }
        public void setName(String name) {
            this.name = name;
        }
        public Address getAddress() {
            return address;
        }
        public void setAddress(Address address) {
            this.address = address;
        }
        public Set<Staff> getStaffs() {
            return staffs;
        }
        public void setStaffs(Set<Staff> staffs) {
            this.staffs = staffs;
        }

    }

Company中compareTo方法用于在报表中排序。

Staff

    package com.xy.report.pojo;

    public class Staff {
        private String name;
        private Company company;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public Company getCompany() {
            return company;
        }

        public void setCompany(Company company) {
            this.company = company;
        }
    }

以上Address是Company的组件，Company与Staff是一对多关系。

####2. 新建Action

    package com.xy.report.action;

    import java.util.ArrayList;
    import java.util.HashMap;
    import java.util.List;
    import java.util.Map;

    import com.opensymphony.xwork2.ActionSupport;
    import com.xy.report.pojo.Address;
    import com.xy.report.pojo.Company;
    import com.xy.report.pojo.Staff;

    public class DemoAction extends ActionSupport{

        private static final long serialVersionUID = -5460323122712890562L;
        
        private List<Staff> list;
        private Map<String,Object> map;
        
        @Override
        public String execute(){
            list = getData();
            map = getParameter();
            
            return SUCCESS;
        }
        
        private List<Staff> getData(){
            Address address = new Address();
            address.setCity("上海");
            address.setZipcode("201400");

            Company company1 = new Company();
            company1.setName("飞利浦");
            company1.setAddress(address);
            Company company2 = new Company();
            company2.setName("谷歌");
            company2.setAddress(address);

            Staff staff1 = new Staff();
            staff1.setName("张三");
            staff1.setCompany(company1);
            Staff staff2 = new Staff();
            staff2.setName("李四");
            staff2.setCompany(company2);
            Staff staff3 = new Staff();
            staff3.setName("王五");
            staff3.setCompany(company1);
            
            List<Staff> list = new ArrayList<Staff>();
            list.add(staff1);
            list.add(staff2);
            list.add(staff3);
            
            return list;
        }
        
        private Map<String,Object> getParameter(){
            Map<String,Object> map = new HashMap<String,Object>();
            map.put("date", "2010-03-12");
            return map;
        }
        
        // getter, setter
        public List<Staff> getList() {
            return list;
        }
        public void setList(List<Staff> list) {
            this.list = list;
        }
        public Map<String, Object> getMap() {
            return map;
        }
        public void setMap(Map<String, Object> map) {
            this.map = map;
        }
    }

以上list为提供给报表的数据源，map为提供给报表的参数，如日期范围等。struts.xml配置如下：

    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE struts PUBLIC "-//Apache Software Foundation//DTD Struts Configuration 2.0//EN" "http://struts.apache.org/dtds/struts-2.0.dtd" >
    <struts>
        <include file="struts-default.xml"></include>
        
        <!-- 报表演示 -->
        <package name="default" namespace="/reports" extends="struts-default,jasperreports-default">
            <action name="demoReport" class="com.xy.report.action.DemoAction">
                <result name="success" type="jasper">
                    <param name="location">/reports/demoReport.jasper</param>
                    <param name="dataSource">list</param>
                    <param name="format">PDF</param>
                    <param name="reportParameters">map</param>
                </result>
            </action>
        </package>
    </struts>

- location - 提供利用iReport制作编译好的报表文件。
- dataSource - 数据源
- format - 报表输出格式
- reportParameters - 报表参数

三、利用iReport开发报表
--------------------------------

####1. 新建数据源

打开iReport，点击下图像插头一样的Report Datasources，弹出对象框中New,选择"JavaBeans set datasource"后Next,输入Name为"demo"后Save，如下两图：

![]({{ "/images/struts2-ireport3/2.png" | prepend: site.baseurl }})

![]({{ "/images/struts2-ireport3/3.png" | prepend: site.baseurl }})

####2. 增加类路径

点击“工具”“选项”，选择classpath标签页，点击Add Folder，将项目类路径加入，如下图路径为：C:\Users\linli\Documents\workspace\JSReportDemo\build\classes

![]({{ "/images/struts2-ireport3/4.png" | prepend: site.baseurl }})

####3. 新建报表

点击 create a new report

![]({{ "/images/struts2-ireport3/5.png" | prepend: site.baseurl }})

"Open this Template"后，输入报表名这里是demoReport后下一步，继续完成。

####4. 读取bean属性

点击Preview字样右边的按钮设置数据源，在弹出框中选择"JavaBean Datasource"标签页，在Class name中输入类名，点击"Read attributes"会列出类中所有属性。选中所需的属性，这里是company和name，点击对话框中间的"Add selected field(s)"增加到报表字段中。

报表将会按公司分组，所以需先按公司排序，当然这一步也可对struts2提供的数据源list进行处理，这里使用了报表的Sort功能，所以Company类必须实现Comparable接口。点击"Sort options..."，增加排序字段。

![]({{ "/images/struts2-ireport3/6.png" | prepend: site.baseurl }})

####5. 增加分组

加击左侧Report Inspector中的demoReport，选择"Add Report Group"，在弹出框中输入分组名，选择分组字段，如下图。下一步至完成。

![]({{ "/images/struts2-ireport3/7.png" | prepend: site.baseurl }})

####6. 设计报表

将左侧Report Inspector中Fields下刚加入的字段托到报表设计器中，取公司名写成$F{company}.getName()，公司地址为$F{company}.getAddress().getCity()，员工姓名为$F{name}。公司名和公司地址放在Group Header里，员工姓名放在Detail 1里。

增加一个Parameters下的REPORT_PARAMETERS_MAP，他相当于一个map，取从struts2中设置的date值的方法为$P{REPORT_PARAMETERS_MAP}.get("date")。

组件面板中托"Page X of Y"显示页码。

这里有一些Title、Summary之类的，可能不需要，直接托到高度为0了想要就托不出来了。这时在左侧Report Inspector中选中想要的项目，在右侧"属性"中输入Bank height的值就行了。

设计完的报表如下图：

![]({{ "/images/struts2-ireport3/8.png" | prepend: site.baseurl }})

####7. 编译报表

点击工具栏上Preview右边榔头一样的东西，将报表编译成.jasper文件。

####8. 运行报表

将编译好的demoReport.jasper文件复制到项目WebContent\reports目录下，启动容器，浏览器下查看报表如下：

![]({{ "/images/struts2-ireport3/9.png" | prepend: site.baseurl }})

项目结构如下：

![]({{ "/images/struts2-ireport3/10.png" | prepend: site.baseurl }})