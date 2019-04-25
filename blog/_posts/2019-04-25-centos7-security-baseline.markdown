---
layout: post
title: "CentOS7安全基线最佳实践"
date: 2019-04-24 21:23
categories: ["Linux", "CentOS7"]
---

一、身份鉴别
---

<b>密码复杂度检查</b>
===

检查密码长度和密码是否使用多种字符类型。

##### <b>加固：</b>

编辑`/etc/security/pwquality.conf`，把minlen（密码最小长度）设置为9-32位，把minclass（至少包含小写字母、大写字母、数字、特殊字符等4类字符中等3类或4类）设置为3或4。如： minlen=10 minclass=3。

___

<b>设置密码失效时间</b>
===

设置密码失效时间，强制定期修改密码，减少密码被泄漏和猜测风险，使用非密码登陆方式(如密钥对)请忽略此项。

##### <b>加固：</b>

在`/etc/login.defs`中将 PASS_MAX_DAYS 参数设置为 60-180之间，如 PASS_MAX_DAYS 90。

需同时执行命令设置root密码失效时间：
```
chage --maxdays 90 root
```

___

<b>检查密码重用是否受限制</b>
===

强制用户不重用最近使用的密码，降低密码猜测攻击风险。

##### <b>加固：</b>

在`/etc/pam.d/password-auth`和`/etc/pam.d/system-auth`中password sufficient pam_unix.so 这行的末尾配置remember参数为5-24之间，原来的内容不用更改。如下面只在末尾加了remember=5，即可限制不能重用最近5个密码。
```
password sufficient pam_unix.so sha512 try_first_pass remember=5
```

___

<b>确保密码到期警告天数为7或更多</b>
===

##### <b>加固：</b>

在`/etc/login.defs`中将 PASS_WARN_AGE 参数设置为7-14之间，建议为7：
```
PASS_WARN_AGE 7
```
同时执行命令使root用户设置生效： 
```
chage --warndays 7 root
```

___

<b>设置密码修改最小间隔时间</b>
===

设置密码修改最小间隔时间，限制密码更改过于频繁。

##### <b>加固：</b>

在`/etc/login.defs`中将 PASS_MIN_DAYS 参数设置为7-14之间,建议为7：
```
PASS_MIN_DAYS 7
```
需同时执行命令为root用户设置：
```
chage --mindays 7 root
```

___

<b>确保root是唯一的UID为0的帐户</b>
===

##### <b>加固：</b>

除root以外其他UID为0的用户都应该删除，或者为其分配新的UID。查看命令：
```
cat /etc/passwd | awk -F: '($3 == 0) { print $1 }'|grep -v '^root$'
```

___

二、入侵防范
---

<b>开启地址空间布局随机化</b>
===

它将进程的内存空间地址随机化来增大入侵者预测目的地址难度，从而降低进程被成功入侵的风险。

##### <b>加固：</b>

执行命令：
```
sysctl -w kernel.randomize_va_space=2
```

___

三、文件权限
---

<b>设置用户权限配置文件的权限</b>
===

##### <b>加固：</b>

执行以下5条命令：
```
 chown root:root /etc/passwd /etc/shadow /etc/group /etc/gshadow
 chmod 0644 /etc/group 
 chmod 0644 /etc/passwd 
 chmod 0400 /etc/shadow 
 chmod 0400 /etc/gshadow
```

___

<b>访问控制配置文件的权限设置</b>
===

##### <b>加固：</b>

运行以下4条命令：
```
chown root:root /etc/hosts.allow
chown root:root /etc/hosts.deny
chmod 644 /etc/hosts.deny
chmod 644 /etc/hosts.allow
```

___

四、服务配置
---

<b>确保SSH LogLevel设置为INFO</b>
===

确保SSH LogLevel设置为INFO,记录登录和注销活动。

##### <b>加固：</b>

编辑 /etc/ssh/sshd_config 文件以按如下方式设置参数(取消注释): LogLevel INFO

___

<b>设置SSH空闲超时退出时间</b>
===

设置SSH空闲超时退出时间,可降低未授权用户访问其他用户ssh会话的风险。

##### <b>加固：</b>

编辑`/etc/ssh/sshd_config`，将ClientAliveInterval 设置为300到900，即5-15分钟，将ClientAliveCountMax设置为0-3。 
```
ClientAliveInterval 600 ClientAliveCountMax 2
```

___

<b>SSHD强制使用V2安全协议</b>
===

##### <b>加固：</b>

编辑`/etc/ssh/sshd_config`文件以按如下方式设置参数： Protocol 2

___

<b>确保SSH MaxAuthTries设置为3到6之间</b>
===

设置较低的Max AuthTrimes参数将降低SSH服务器被暴力攻击成功的风险。

##### <b>加固：</b>

在`/etc/ssh/sshd_config`中取消MaxAuthTries注释符号#，设置最大密码尝试失败次数3-6，建议为4：MaxAuthTries 4

___

<b>禁止SSH空密码用户登录</b>
===

##### <b>加固：</b>

编辑文件`/etc/ssh/sshd_config`，将PermitEmptyPasswords配置为no:
 ```
 PermitEmptyPasswords no
 ```

___

五、安全审计
---

<b>确保rsyslog服务已启用</b>
===

确保rsyslog服务已启用，记录日志用于审计。

##### <b>加固：</b>

运行以下命令启用rsyslog服务：
 ```
 systemctl enable rsyslog
 systemctl start rsyslog
 ```

___

