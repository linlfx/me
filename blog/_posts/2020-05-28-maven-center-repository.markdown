---
layout: post
title: "Java项目发布到Maven中央仓库"
date: 2020-05-28 11:05
categories: ["Java", "Maven"]
---

将Java项目通过Maven编译部署到中央仓库的过程比较繁琐，主要有以下几个步骤：

一、将代码推送到托管平台
---

首先在GitHub或Gitee等平台新建一个仓库，将代码提交上去。

二、注册Sonatype账户
---

打开网站[https://issues.sonatype.org/secure/Dashboard.jspa](https://issues.sonatype.org/secure/Dashboard.jspa)注册一个帐号。

三、登录Sonatype创建工单
---

直接在控制台点击【创建】可能无法创建OSSRH的项目，可以通过链接进行创建：[https://issues.sonatype.org/secure/CreateIssue.jspa?issuetype=21&pid=10134](https://issues.sonatype.org/secure/CreateIssue.jspa?issuetype=21&pid=10134)。
![]({{ "/images/maven-center-repository/01.png" | prepend: site.baseurl }})

创建完等待审核，审核时会让你确认域名。

四、确认域名
---

通过添加DNS解析的方式确认域名，添加一个TXT类型的解析，主机记录为Ticket，如：OSSRH-57220，记录值为Ticket的URL地址，如：https://issues.sonatype.org/browse/OSSRH-57220。
操作完在Sonatype界面上将Ticket重新开放，等一段时间会审核通过。

五、配置gpg
---

通过下面的命令生成密钥对，过程中需要输入一个密码，这个密码要记住。
```shell
gpg --gen-key
```

通过下面的命令查看密钥，并将公钥上传到远程服务器。
```shell
gpg --list-key
gpg --keyserver hkp://keyserver.ubuntu.com  --send-keys 2621DAA022A75DB830A0E6C331CFF09E41EE0FD2
```

六、配置Maven
---

在setting.xml文件的servers节点下增加一个server节点，配置之前注册的Sonatype的帐号和密码。
```xml
<servers>
   <server>
      <id>ossrh</id>
      <username>Sonatype账号</username>
      <password>Sonatype密码</password>
   </server>
</servers>
```

七、配置项目的pom.xml
---

需要配置Maven的文档插件、打包插件、gpg验证插件等，参考如下：

```xml
<project xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>

    <groupId>cn.zoecloud</groupId>
    <artifactId>cloud-core-java-sdk</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <name>Zoehoo Cloud Core SDK for Java</name>
    <url>https://github.com/my-dlq/swagger-kubernetes</url>
    <description>This is a java sdk to use zoehoo cloud api.</description>

    <licenses>
        <license>
            <name>The Apache Software License, Version 2.0</name>
            <url>http://www.apache.org/licenses/LICENSE-2.0.txt</url>
            <distribution>repo</distribution>
        </license>
    </licenses>

    <scm>
        <tag>master</tag>
        <url>git@gitee.com:zoehoo/zoehoo-cloud-java-sdk.git</url>
        <connection>scm:git:git@gitee.com:zoehoo/zoehoo-cloud-java-sdk.git</connection>
        <developerConnection>scm:git:git@gitee.com:zoehoo/zoehoo-cloud-java-sdk.git</developerConnection>
    </scm>

    <developers>
        <developer>
            <name>Leo</name>
            <email>zoehoo@aliyun.com</email>
            <organization>Zoehoo</organization>
        </developer>
    </developers>

    <properties>
        <java.version>1.8</java.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <dependency>
            <groupId>commons-logging</groupId>
            <artifactId>commons-logging</artifactId>
            <version>1.2</version>
        </dependency>

        <dependency>
            <groupId>org.apache.commons</groupId>
            <artifactId>commons-lang3</artifactId>
            <version>3.10</version>
        </dependency>

        <dependency>
            <groupId>org.apache.httpcomponents</groupId>
            <artifactId>httpclient</artifactId>
            <version>4.5.12</version>
        </dependency>

        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>fastjson</artifactId>
            <version>1.2.68</version>
        </dependency>

        <dependency>
            <groupId>org.junit.platform</groupId>
            <artifactId>junit-platform-launcher</artifactId>
            <version>1.6.2</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter-engine</artifactId>
            <version>5.6.2</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.junit.vintage</groupId>
            <artifactId>junit-vintage-engine</artifactId>
            <version>5.6.2</version>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <!-- doc plugin，Maven API文档生成插件 -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-javadoc-plugin</artifactId>
                <version>3.1.0</version>
                <executions>
                    <execution>
                        <id>attach-javadocs</id>
                        <goals>
                            <goal>jar</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>

            <!-- resources plugin，Maven 资源插件 -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-source-plugin</artifactId>
                <version>3.1.0</version>
                <executions>
                    <execution>
                        <id>attach-sources</id>
                        <goals>
                            <goal>jar-no-fork</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
            <!-- compiler plugin，Maven 编译插件 -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.3</version>
                <configuration>
                    <source>${java.version}</source>
                    <target>${java.version}</target>
                    <showWarnings>true</showWarnings>
                </configuration>
            </plugin>
            <!-- gpg plugin，用于签名认证 -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-gpg-plugin</artifactId>
                <version>1.6</version>
                <executions>
                    <execution>
                        <id>sign-artifacts</id>
                        <phase>verify</phase>
                        <goals>
                            <goal>sign</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
            <!--staging puglin，用于自动执行发布阶段(免手动)-->
            <plugin>
                <groupId>org.sonatype.plugins</groupId>
                <artifactId>nexus-staging-maven-plugin</artifactId>
                <version>1.6.7</version>
                <extensions>true</extensions>
                <configuration>
                    <serverId>ossrh</serverId>
                    <nexusUrl>https://oss.sonatype.org/</nexusUrl>
                    <autoReleaseAfterClose>true</autoReleaseAfterClose>
                </configuration>
            </plugin>
            <!-- release plugin，用于发布到release仓库部署插件 -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-release-plugin</artifactId>
                <version>2.4.2</version>
            </plugin>
        </plugins>
    </build>

    <distributionManagement>
        <snapshotRepository>
            <id>ossrh</id>
            <url>https://oss.sonatype.org/content/repositories/snapshots</url>
        </snapshotRepository>
        <repository>
            <id>ossrh</id>
            <url>https://oss.sonatype.org/service/local/staging/deploy/maven2/</url>
        </repository>
    </distributionManagement>
</project>
```

八、编译并发布到Maven中央仓库
---

在发布前，先使用Sonatype的帐号密码登录一次Nexus Repositories，地址：[https://oss.sonatype.org/](https://oss.sonatype.org/)。

使用下面的命令编译并发布：
```shell
mvn clean deploy
```

如果提示gpg报错，可能是因为无法弹出输入密码的窗口导致，执行下面的命令后再试一次。
```shell
export GPG_TTY=$(tty)
```

部署流程为 open -> close -> release ，然后会发布到Maven中央仓库。可以到[https://oss.sonatype.org/](https://oss.sonatype.org/)暂存库(Staging Repositories)查看处理过程，如果已经Release，则暂存库中可能找不到，直接通过项目信息搜索来查找。

项目发布成功后，到Sonatype将之前的Ticket关闭。

九、查看项目
---

进入[https://search.maven.org](https://search.maven.org)查看自己发布的项目，可能要过几个小时才更新上去。
