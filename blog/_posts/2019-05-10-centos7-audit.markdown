---
layout: post
title: "CentOS7日志审计"
date: 2019-05-10 11:35
categories: ["Linux", "CentOS7", "Audit"]
---

一、用户空间审计系统简介
---

Linux 内核有用日志记录事件的能力，包括记录系统调用和文件访问。管理员可以检查这些日志，确定是否存在安全漏洞（如多次失败的登录尝试，或者用户对系统文件不成功的访问）。

Linux 用户空间审计系统由 auditd、audispd、auditctl、autrace、ausearch 和 aureport 等应用程序组成。下面依次说明：

- auditctl：即时控制审计守护进程的行为的工具，如添加规则等。
- auditd：audit 守护进程负责把内核产生的信息写入到硬盘上，这些信息由应用程序和系统活动触发产生。用户空间审计系统通过 auditd 后台进程接收内核审计系统传送来的审计信息，将信息写入到 /var/log/audit/audit.log。
- aureport：查看和生成审计报告的工具。
- ausearch：查找审计事件的工具
- auditspd：转发事件通知给其他应用程序，而不是写入到审计日志文件中。
- autrace：一个用于跟踪进程的命令。

#### audit和syslog日志系统的关系

audit 主要用来记录安全信息，用于对系统安全事件的追溯，而 syslog 用来记录系统信息，如硬件警报和软件日志等。syslog 属于应用层，没办法记录太多信息，audit 用来记录内核信息，包括文件的读写，权限的改变等。

二、auditd配置文件
---

`vi /etc/audit/auditd.conf`

```shell
# 是否记录本地事件，如果设为no，只记录来自网络的事件
local_events = yes
write_logs = yes
# 日志文件
log_file = /var/log/audit/audit.log
log_group = root
log_format = RAW
# 日志文件刷新方式，可选的选项有：
# NONE：不做特别处理
# INCREMENTAL：用freq选项的值确定多长时间发生一次向磁盘的刷新
# DATA：审计数据和日志文件是同步的
# SYNC：写日志文件时，数据和元数据是同步的
flush = INCREMENTAL_ASYNC
freq = 50
# 日志文件最大8MB
max_log_file = 8
# 日志文件数量
num_logs = 5
# 进程优先级（-4），ps axl | grep auditd 可查
priority_boost = 4
disp_qos = lossy
dispatcher = /sbin/audispd
name_format = NONE
##name = mydomain
# 当log文件达到max_log_file设定大小后的动作。可选的动作有：
# IGNORE：忽略max_log_file设置的限制，继续写log文件
# SYSLOG：向syslog中写入一条warning
# SUSPEND：auditd不再写log文件，但是auditd继续运行
# ROTATE：分多个log文件，一个log文件达到上限后在创建一个新的不同名字的log文件
max_log_file_action = ROTATE
# log_file文件所在的分区空闲空间少于这个设定的值时，触发相应的动作，单位是MB
space_left = 75
# space_left设定被触发时的动作。可选动作有：
# IGNORE, SYSLOG, SUSPEND：与前面max_log_file_action相似
# SINGLE：audit进程会将系统模式变为单用户模式
# HALT：audit进程将会触发系统关机
space_left_action = SYSLOG
verify_email = yes
action_mail_acct = root
admin_space_left = 50
admin_space_left_action = SUSPEND
# 磁盘满后触发的动作
disk_full_action = SUSPEND
# 磁盘错误触发的动作
disk_error_action = SUSPEND
use_libwrap = yes
##tcp_listen_port = 60
tcp_listen_queue = 5
tcp_max_per_addr = 1
##tcp_client_ports = 1024-65535
tcp_client_max_idle = 0
enable_krb5 = no
krb5_principal = auditd
##krb5_key_file = /etc/audit/audit.key
distribute_network = no
```

三、配置审计规则
---

auditctl命令可以控制审计系统的基本功能、设定规则等，但为了定义重启后一直有效的审计规则，需要把规则定义到`/etc/audit/rules.d/`目录下，重启auditd时，`/etc/audit/rules.d/`目录下所有文件的规则会合并到`/etc/audit/audit.rules`。

#### 预配置规则文件

在`/usr/share/doc/audit-{version}/rules/`目录下，audit根据不同的标准提供了一组预配置规则文件：

- nispom.rules — 审计规则配置符合《国家行业安全程序操作运行指南》的第八章中详细说明的要求。
- pci-dss-v31.rules - 审计规则配置满足第三方支付行业所设定的要求。
- stig.rules — 审计规则配置满足由STIG（安全技术实施指南）所设定的要求。

如配置为nispom规则：

```
cp /usr/share/doc/audit-2.8.4/rules/10-base-config.rules /usr/share/doc/audit-2.8.4/rules/30-nispom.rules /usr/share/doc/audit-2.8.4/rules/99-finalize.rules /etc/audit/rules.d/
```

重启auditd：`service auditd restart`

四、审计日志内容
---

```
type=SYSCALL msg=audit(1557427974.683:2260): arch=c000003e syscall=257 success=yes exit=3 a0=ffffffffffffff9c a1=e61320 a2=90800 a3=0 items=1 ppid=31275 pid=4114 auid=1000 uid=0 gid=0 euid=0 suid=0 fsuid=0 egid=0 sgid=0 fsgid=0 tty=pts1 ses=113 comm="bash" exe="/usr/bin/bash" key="audit-logs"
type=CWD msg=audit(1557427974.683:2260): cwd="/etc/audit"
type=PATH msg=audit(1557427974.683:2260): item=0 name="/var/log/audit/" inode=101477489 dev=fc:00 mode=040700 ouid=0 ogid=0 rdev=00:00 nametype=NORMAL cap_fp=0000000000000000 cap_fi=0000000000000000 cap_fe=0 cap_fver=0
type=PROCTITLE msg=audit(1557427974.683:2260): proctitle="bash"
```

#### 事件分析：

- type=SYSCALL

记录类型，可以到RedHat网站查询所有类型和说明：https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/6/html/security_guide/sec-audit_record_types

- msg=audit(1557427974.683:2260)

括号中为时间缀和特殊ID，如果多种记录生成为相同审核事件的一部分，那么它们可以共享相同的时间戳和ID。

- 后面为Kernel或用户空间提供的不同事件（name=value组）。

五、使用ausearch搜索审计日志
---

如：搜索登录失败的日志信息：

```
ausearch --message USER_LOGIN --success no --interpret
```

搜索内容如下：

```
----
type=USER_LOGIN msg=audit(2019年05月09日 09:58:07.647:537) : pid=6772 uid=root auid=unset ses=unset msg='op=login acct=root exe=/usr/sbin/sshd hostname=? addr=192.168.9.165 terminal=ssh res=failed'
----
type=USER_LOGIN msg=audit(2019年05月10日 03:06:53.549:2317) : pid=5003 uid=root auid=unset ses=unset msg='op=login acct=root exe=/usr/sbin/sshd hostname=? addr=192.168.9.166 terminal=ssh res=failed'
```

五、使用aureport查看审计报告
---

可以直接使用`aureport`命令生成概要报告，内容如下：

```
Summary Report
======================
Range of time in logs: 1970年01月01日 08:00:00.000 - 2019年05月10日 03:11:46.045
Selected time for report: 1970年01月01日 08:00:00 - 2019年05月10日 03:11:46.045
Number of changes in configuration: 79
Number of changes to accounts, groups, or roles: 0
Number of logins: 2
Number of failed logins: 3
Number of authentications: 7
Number of failed authentications: 16
Number of users: 3
Number of terminals: 8
Number of host names: 4
Number of executables: 14
Number of commands: 10
Number of files: 13
Number of AVC's: 0
Number of MAC events: 0
Number of failed syscalls: 812
Number of anomaly events: 0
Number of responses to anomaly events: 0
Number of crypto events: 55
Number of integrity events: 0
Number of virt events: 0
Number of keys: 9
Number of process IDs: 950
Number of events: 1935
```

可以通过传入参数生成不同类型的报告。
