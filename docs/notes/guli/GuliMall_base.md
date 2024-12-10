---
title: 谷粒商城
createTime: 2024/12/09 22:35:41
permalink: /article/vwzv42bb/
---
# 谷粒商城
> 参考: [Java项目《谷粒商城》Java架构师 | 微服务 | 大型电商项目](https://www.bilibili.com/video/BV1np4y1C7Yf)
> [从前慢-谷粒商城篇章1](https://blog.csdn.net/unique_perfect/article/details/111392634)
> [从前慢-谷粒商城篇章2](https://blog.csdn.net/unique_perfect/article/details/113824202)
> [从前慢-谷粒商城篇章3](https://blog.csdn.net/unique_perfect/article/details/114035775)
> [从前慢-谷粒商城篇章3(备用)](https://cache.one/read/3811081)
> [guli-mall](https://www.yuque.com/zhangshuaiyin/guli-mall)

## 项目简介
*  电商模式
  市面上有5种常见的电商模式 B2B、B2C、C2B、C2C、O2O
  - B2B 模式
    B2B(Business to Business)，是指商家和商家建立的商业关系，如阿里巴巴
  - B2C 模式
    B2C(Business to Consumer) 就是我们经常看到的供应商直接把商品卖给用户，即“商对客”模式，也就是我们呢说的商业零售，直接面向消费销售产品和服务，如苏宁易购，京东，天猫，小米商城
  - C2B 模式
    C2B (Customer to Business),即消费者对企业，先有消费者需求产生而后有企业生产，即先有消费者提出需求，后又生产企业按需求组织生产
  - C2C 模式
    C2C (Customer to Consumer) 客户之间把自己的东西放到网上去卖 。如淘宝、咸鱼
  - O2O 模式
    O2O 即 Online To Offline，也即将线下商务的机会与互联网结合在一起，让互联网成为线上交易前台，线上快速支付，线上优质服务，如：饿了么，美团，淘票票，京东到家

### 项目架构                             
*  架构图
	![架构图/GuliaMall/谷粒商城-微服务架构图.jpg)
* 微服务划分图
	![/GuliaMall/谷粒商城-微服务划分图.jpg)

### 谷粒商城
谷粒商城是一个B2C模式的电商平台，销售自营商品给客户

* **项目架构图**
  ![项目微服务架构图/GuliaMall/谷粒商城-微服务架构图.jpg)

  前后分离开发，分为内网部署和外网部署，外网是面向公众访问的。访问前端项目，可以有手机APP，电脑网页；内网部署的是后端集群，前端在页面上操作发送请求到后端，在这途中会经过Nginx集群，Nginx把请求转交给API网关(springcloud gateway)（网关可以根据当前请求动态地路由到指定的服务，看当前请求是想调用商品服务还是购物车服务还是检索服务），从路由过来如果请求很多，可以负载均衡地调用商品服务器中一台（商品服务复制了多份），当商品服务器出现问题也可以在网关层面对服务进行熔断或降级（使用阿里的sentinel组件），网关还有其他的功能如认证授权、限流（只放行部分到服务器）等。

  到达服务器后进行处理（springboot为微服务），服务与服务可能会相互调用（使用feign组件），有些请求可能经过登录才能进行（基于OAuth2.0的认证中心。安全和权限使用springSecurity控制）

  服务可能保存了一些数据或者需要使用缓存，我们使用redis集群（分片+哨兵集群）。持久化使用mysql，读写分离和分库分表。

  服务和服务之间会使用消息队列（RabbitMQ），来完成异步解耦，分布式事务的一致性。有些服务可能需要全文检索，检索商品信息，使用ElaticSearch。

  服务可能需要存取数据，使用阿里云的对象存储服务OSS。

  项目上线后为了快速定位问题，使用ELK对日志进行处理，使用LogStash收集业务里的各种日志，把日志存储到ES中，用Kibana可视化页面从ES中检索出相关信息，帮助我们快速定位问题所在。

  在分布式系统中，由于我们每个服务都可能部署在很多台机器，服务和服务可能相互调用，就得知道彼此都在哪里，所以需要将所有服务都注册到注册中心。服务从注册中心发现其他服务所在位置（使用阿里Nacos作为注册中心）。

  每个服务的配置众多，为了实现改一处配置相同配置就同步更改，就需要配置中心，也使用阿里的Nacos，服务从配置中心中动态取配置。

  服务追踪，追踪服务调用链哪里出现问题，使用springcloud提供的Sleuth、Zipkin、Metrics，把每个服务的信息交给开源的Prometheus进行聚合分析，再由Grafana进行可视化展示，提供Prometheus提供的AlterManager实时得到服务的警告信息，以短信/邮件的方式告知服务开发人员。

  还提供了持续集成和持续部署。项目发布起来后，因为微服务众多，每一个都打包部署到服务器太麻烦，有了持续集成后开发人员可以将修改后的代码提交到github，运维人员可以通过自动化工具Jenkins Pipeline将github中获取的代码打包成docker镜像，最终是由k8s集成docker服务，将服务以docker容器的方式运行。

* **微服务划分图**
  ![微服务划分图/GuliaMall/谷粒商城-微服务划分图.jpg)

  反映了需要创建的微服务以及相关技术。

  前后分离开发。前端项目分为admin-vue（工作人员使用的后台管理系统）、shop-vue（面向公众访问的web网站）、app（公众）、小程序（公众）

  商品服务：商品的增删改查、商品的上下架、商品详情
  支付服务
  优惠服务
  用户服务：用户的个人中心、收货地址
  仓储服务：商品的库存
  秒杀服务
  订单服务：订单增删改查
  检索服务：商品的检索ES
  中央认证服务：登录、注册、单点登录、社交登录
  购物车服务
  后台管理系统：添加优惠信息等

* 项目技术&特色
  - 前后分离开发，并开发基于vue的后台管理系统
  - SpringCloud全新的解决方案
  - 应用监控、限流、网关、熔断降级等分布式方案，全方位涉及
  - 透彻讲解分布式事务，分布式锁等分布式系统的难点
  - 压力测试与性能优化
  - 各种集群技术的区别以及使用
  - CI/CD 使用

* 项目前置要求
  - 熟悉SpringBoot以及常见整合方案
  - 了解SpringCloud
  - 熟悉 git  maven
  - 熟悉 linux redis docker 基本操作
  - 了解 html，css，js，vue
  - 熟练使用idea开发项目

# 谷粒商城-基础篇
围绕电商后台管理系统. 使用前后端分离, 前端使用Vue.

## 分布式基础概念
### 微服务
微服务架构风格，就像是把一个单独的应用程序开发成一套小服务，每个小服务运行在自己的进程中，并使用轻量级机制通信，通常是 HTTP API 这些服务围绕业务能力来构建，	并通过完全自动化部署机制来独立部署，这些服务使用不同的编程语言书写，以及不同数据存储技术，并保持最低限度的集中式管理
**简而言之，拒绝大型单体应用，基于业务边界进行服务微化拆分，每个服务独立部署运行。**

### 集群&分布式&节点
集群是个物理状态，分布式是个工作方式  
只要是一堆机器，也可以叫做集群，他们是不是一起协作干活，这谁也不知道。

《分布式系统原理与范型》定义：
* 分布式系统是若干独立计算机的集合，这些计算机对于用户来说像单个系统
* 分布式系统 (distributed system) 是建立网络之上的软件系统

分布式是指根据不同的业务分布在不同的地方，集群指的是将几台服务器集中在一起，实现同一业务  
例如：**京东是一个分布式系统，众多业务运行在不同的机器上**，所有业务构成一个大型的分布式**业务集群**，每一个小的业务，比如用户系统，访问压力大的时候一台服务器是不够的，我们就应该将用户系统部署到多个服务器，也就是每一个业务系统也可以做集群化

**分布式中的每一个节点，都可以做集群，而集群并不一定就是分布式的**  
*节点：集群中的一个服务器*

### 远程调用
在分布式系统中，各个服务可能处于不同主机，但是服务之间不可避免的需要互相调用，我们称之为远程调用

SpringCloud中使用HTTP+JSON的方式来完成远程调用
![/GuliaMall/1657552169506.jpg)

### 负载均衡
![/GuliaMall/20201218205600292.png)
分布式系统中，A 服务需要调用B服务，B服务在多台机器中都存在， A调用任意一个服务器均可完成功能
为了使每一个服务器都不要太或者太闲，我们可以负载均衡调用每一个服务器，提升网站的健壮性

**常见的负载均衡算法：**
* **轮询**：为第一个请求选择健康池中的每一个后端服务器，然后按顺序往后依次选择，直到最后一个，然后循环
* **最小连接**：优先选择链接数最少，也就是压力最小的后端服务器，在会话较长的情况下可以考虑采取这种方式

### 服务注册/发现&注册中心
A服务调用B服务，A服务不知道B服务当前在哪几台服务器上有，哪些正常的，哪些服务已经下线，解决这个问题可以引入注册中心
![/GuliaMall/20201218205736266.png)
如果某些服务下线，我们其他人可以实时的感知到其他服务的状态，从而避免调用不可用的服务

### 配置中心
![/GuliaMall/20201218205841204.png)
每一个服务最终都有大量配置，并且每个服务都可能部署在多个服务器上，我们经常需要变更配置，我们可以让每个服务在配置中心获取自己的配置。

**配置中心用来集中管理微服务的配置信息**

### 服务熔断&服务降级
在微服务架构中，微服务之间通过网络来进行通信，存在相互依赖，当其中一个服务不可用时，有可能会造成雪崩效应，要防止这种情况，必须要有容错机制来保护服务
![/GuliaMall/20201218211017200.png)

情景(rpc)：
订单服务 --> 商品服务 --> 库存服务
库存服务出现故障导致响应慢，导致商品服务需要等待，可能等到10s后库存服务才能响应。库存服务的不可用导致商品服务阻塞，商品服务等的期间，订单服务也处于阻塞。一个服务不可用导致整个服务链都阻塞。如果是高并发，第一个请求调用后阻塞10s得不到结果，第二个请求直接阻塞10s。更多的请求进来导致请求积压，全部阻塞，最终服务器的资源耗尽。导致雪崩

1. 服务熔断
	设置服务的超时，当被调用的服务经常失败到达某个阈值，我们可以开启断路保护机制，后来的请求不再去调用这个服务，本地直接返回默认的数据
2. 服务降级
	在运维期间，当系统处于高峰期，系统资源紧张，我们可以让非核心业务降级运行，降级：某些服务不处理，或者简单处理【抛异常，返回NULL，调用 Mock数据，调用 FallBack 处理逻辑】

### API 网关
在微服务架构中，API Gateway 作为整体架构的重要组件，它*抽象服务中需要的公共功能*，同时它提供了客户端**负载均衡，服务自动熔断，灰度发布，统一认证，限流监控，日志统计**等丰富功能，帮助我们解决很多API管理的难题
![/GuliaMall/20201218211725909.png)

### 微服务架构图
![项目微服务架构图/GuliaMall/谷粒商城-微服务架构图.jpg)

## 环境搭建
### 安装虚拟机(CentOS) #linux #vagran
Oracle VM VirtualBox下载地址: https://download.virtualbox.org/virtualbox/6.1.34/VirtualBox-6.1.34a-150636-Win.exe
> 安装完成后可以在'全局设定'->'常规'里修改虚拟机的安装位置

Vagrant下载地址: https://releases.hashicorp.com/vagrant/2.2.19/vagrant_2.2.19_x86_64.msi
> 如果vagrant下载速度很慢, 可以将地址复制到迅雷中, 使用迅雷下载  
安装完后再`cmd`命令窗口内运行`vagrant`查看安装结果

* 初始化并启动虚拟机
  ``` shell
  # 初始化虚拟机, 运行后可以在对应目录下看到`Vagrantfile`文件
  vagrant init centos/7 # 初始化虚拟机, 会自动下载镜像, 若下载慢可以更换镜像源

  # 启动虚拟机
  vagrant up

  # 进入虚拟机
  vagrant ssh
  ```
  > VirtualBox可能与其他软件冲突, 安装时注意避免;
  > 
  > vagrant可能会遇到磁盘爆满的情况, 根目录下用`du -sh *`分析后会发现`/vagrant`占用超级大. 原因是vagrant同步了`c/user/用户名`下的文件,解决: 
  > 1. 创建`VagrantSyncFolder`文件夹; 
  > 2. 在`Vagrantfile`加上`config.vm.synced_folder "./VagrantSyncFolder", "/vagrant"`(指定映射文件夹); 
  > 3. 加载配置并重启`vagrant reload`

* 网络设置
  如果使用端口转发的方式, 每安装一个软件就需要设置一次, 比较麻烦. 所以使用设置网络的方式, 可以设置一次, 后续不用再设置了

  默认虚拟机的ip地址是不固定的,开发不方便
  修改`Vagrantfile`文件, 在`Vagrantfile`文件中添加如下内容
  ``` shell
  config.vm.network "private_network", ip: "192.168.56.10"
  ```
  设置完后在cmd执行`vagrant reload`重启并重新加载即可
  
  检查网络配置
  ``` shell
  # 进入虚拟机
  vagrant ssh
  
  # 查看ip地址
  ip addr
  ```
  也可以宿主机与虚拟机互ping


### 安装docker(CentOS) #docker
Docker, 虚拟化容器技术。Docker基于镜像，可以秒级启动各种容器。每一种容器都是一个完整的运环境，容器之间互相隔离。
![/GuliaMall/1657605006009.jpg)
docker官方文档: https://docs.docker.com/get-started/overview/

``` shell
# 1.卸载系统之前的docker(没有可以省略)
sudo yum remove docker \
  docker-client \
  docker-client-latest \
  docker-common \
  docker-latest \
  docker-latest-logrotate \
  docker-logrotate \
  docker-engine

# 2.安装依赖并
sudo yum install -y yum-utils \
  device-mapper-persistent-data \
  lvm2

# 3. 设置存储库(阿里云)
sudo yum-config-manager \
  --add-repo \
  http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo

# 4.安装DOCKER引擎
sudo yum install docker-ce docker-ce-cli containerd.io

# 4.启动Docker.
sudo systemctl start docker
# 4.1 设置开机自启
sudo systemctl enable docker

# 5.配置镜像加速
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://chqac97z.mirror.aliyuncs.com"]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker

# 检查docker状态
systemctl status docker
```

### 安装mysql(docker) #mysql
1. 安装mysql
    ``` shell
    # 1.拉取mysql镜像
    sudo docker pull mysql:5.7
    # 1.1.检查镜像
    sudo docker images

    # 2.启动mysql容器
    # --name指定容器名字 -p指定端口映射[容器端口:宿主机端口] -v目录挂载[宿主机路径:容器内路径] -e设置mysql启动参数 -d后台运行 镜像名
    sudo docker run --name mysql\
      -p 3306:3306\
      -v /mydata/mysql/log:/var/log/mysql\
      -v /mydata/mysql/data:/var/lib/mysql\
      -v /mydata/mysql/conf:/etc/mysql\
      -e MYSQL_ROOT_PASSWORD=root\
      -d mysql:5.7
    # 2.1.查看容器
    sudo docker ps

    # 0.切换为root，这样就不用每次都sudo来赐予了. 因为时使用vagrant创建的, 默认密码为`vagrant`
    su root

    # 3.进入mysql容器
    docker exec -it 容器名称|容器id bin/bash

    # 9.推出mysql容器
    exit
    ```
    ![/GuliaMall/1657690334567.jpg)

2. 配置mysql 
    进入配置文件(参考docker映射的目录)
    ``` sh 
    vi /mydata/mysql/conf/my.cnf
	```
    插入以下内容
    ``` shell
    [client]
    default-character-set=utf8
    [mysql]
    default-character-set=utf8
    [mysqld]
    init_connect='SET collation_connection = utf8_unicode_ci'
    init_connect='SET NAMES utf8'
    character-set-server=utf8
    collation-server=utf8_unicode_ci
    skip-character-set-client-handshake
    skip-name-resolve
    ```

3. 重启容器使配置生效
    ``` shell
    docker restart mysql
    ```

### 安装redis(docker) #redis
[Redis中文文档](http://www.redis.cn/)
1. 拉取redis镜像到本地
  ``` shell
  docker pull redis
  ```

2. 修改需要自定义的配置(docker-redis默认没有配置文件，自己在宿主机建立后挂载映射)
  ``` shell
  # 创建并编辑一下文件
  mkdir -p /mydata/redis/conf
  touch /mydata/redis/conf/redis.conf
  ```

3. 启动redis服务运行容器
  ``` shell
  docker run --name redis -p 6379:6379\
    -v /usr/local/redis/data:/data\
    -v /usr/local/redis/redis.conf:/usr/local/etc/redis/redis.conf\
    -d redis:6.0.10  redis-server /usr/local/etc/redis/redis.conf 
  ```

  查看容器
  ``` shell
  docker ps
  ```

  进入容器内的redis, 并测试
  ``` shell
  # 进入redis
  docker exec -it redis redis-cli
  
  # 存
  set a b

  # 取
  get a

  # 退出
  exit
  ```

4. 配置redis
  ``` shell
  # 开启远程权限
  echo "bind 0.0.0.0"  >> /mydata/redis/conf/redis.conf
  
  # 开启aof持久化
  echo "appendonly yes"  >> /mydata/redis/conf/redis.conf

  # 重启redis容器, 重启完后redis数据便可以持久化了
  docker restart redis
  ```

### 安装开发工具及插件(可选-方便开发)
#### Maven #maven
这里在平时开发的时候应该已经配置过了,具体步骤就略过了
``` xml
# 在maven配置文件配置配置阿里云镜像
<mirrors>
	<mirror>
		<id>nexus-aliyun</id>
		<mirrorOf>central</mirrorOf>
		<name>Nexus aliyun</name>
		<url>http://maven.aliyun.com/nexus/content/groups/public</url>
	</mirror>
</mirrors>

# 配置 jdk 1.8 编译项目
<profiles>
	<profile>
		<id>jdk-1.8</id>
		<activation>
			<activeByDefault>true</activeByDefault>
			<jdk>1.8</jdk>
		</activation>
		<properties>
			<maven.compiler.source>1.8</maven.compiler.source>
			<maven.compiler.target>1.8</maven.compiler.target>
			<maven.compiler.compilerVersion>1.8</maven.compiler.compilerVersion>
		</properties>
	</profile>
</profiles>
```

#### IDEA设置及插件
后端使用 IDEA 开发
* 设置Manven构建工具
  在 `File -> Settings -> Build,Execution`,Deployment -> Build Tools -> Maven` 中
  将 User settings file 配置为指定的安装路径

* 插件
  - Lombok
  - MyBatisX

#### VS Code及插件
前端使用 VS Code 开发
* 插件
  - Auto Close Tag
  - Auto Rename Tag
  - Chinese
  - ESlint
  - HTML CSS Support
  - HTML Snippets
  - JavaScript (ES6) code snippets
  - Live Server
  - open in brower
  - Vetur

### 安装git #git
安装完git后, 打开git bash
* 配置账户
  ``` shell
  # 配置用户名
  git config --global user.name "username"  //(用户名)

  # 配置邮箱
  git config --global user.email "xxxx@qq.com" // 注册账号时使用的邮箱
  ```
* 配置ssh免密登录
  ``` shell
  # 生成ssh密钥
  ssh-keygen -t rsa -C "xxx@qq.com"

  # 三次回车后生成了密钥，也可以查看密钥
  cat ~/.ssh/id_rsa.pub
  ```
  浏览器登录码云后，个人头像上点设置、然后点ssh公钥、设置标题后，然后赋值刚才打印的密钥
* 测试
  ``` shell
  ssh -T git@gitee.com

    # 测试成功
    Hi unique_perfect! You've successfully a
    ```

### 创建仓库
``` shell
在码云新建仓库，仓库名gulimall，选择语言java，在.gitignore选中maven，
许可证选Apache-2.0，开发模型选生产/开发模型，开发时在dev分支，
发布时在master分支，创建如图所示
```

### 项目结构创建
> 这里我创建工程和依赖管理的方式和视频有出入，请酌情参考!!!
> 在码云创建项目和拉取这里就省略了

* 创建模块
	创建以下根模块(gulimall)下创建一下微服务
	商品服务: product
	存储服务: ware
	订单服务: order
	优惠券服务: coupon
	用户服务: member
    
	每个服务都有一下共同点:
	1. 每个模块都导入基础依赖`web`和`openFeign`
	2. 每个服务包名都统一一下, 以`com.atguigu.gulimall.xxx(product/order/ware/coupon/member)`
	3. 模块名均应符合`gulimall-xxx`格式

	目录结构
	![/GuliaMall/1657725334297.jpg)
	多模块开发
	多模块开发中，使用父模块对子模块的管理非常方便。
	1. 父模块pom中的`<properties>`属性会被子模块继承
	2. 父模块pom中，在 `<dependencyManagement>` 中可以进行子模块依赖的版本管理，子模块继承父模块之后，提供作用：锁定版本 + 子模块不用再写 version。
	3. 此外，父模块中可以添加依赖作为全局依赖，子模块自动继承。`<dependencyManagement>`外的`<dependencies>`中定义全局依赖。

* 修改父模块pom
	创建父模块：在gulimall中创建并修改pom.xml(以后还会继续添加), 并引入公共依赖
	> 注意版本关系, 可参考官网
> 	Spring Cloud Alibaba: https://github.com/alibaba/spring-cloud-alibaba/wiki/版本说明

``` xml
	<?xml version="1.0" encoding="UTF-8"?>
	<project xmlns="http://maven.apache.org/POM/4.0.0"
	         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
	    <modelVersion>4.0.0</modelVersion>
	
	    <groupId>cn.cheakin</groupId>
	    <artifactId>gulimall</artifactId>
	    <packaging>pom</packaging>
	    <version>0.0.1-SNAPSHOT</version>
	    <name>gulimall</name>
	    <description>聚合服务</description>
	
	    <modules>
	        <module>gulimall-coupon</module>
	        <module>gulimall-member</module>
	        <module>gulimall-order</module>
	        <module>gulimall-product</module>
	        <module>gulimall-ware</module>
	    </modules>
	
	    <!--  这里的属性会被子模块继承  -->
	    <properties>
	        <java.version>1.8</java.version>
	        <spring.boot.version>2.6.3</spring.boot.version>
	        <spring-cloud.version>2021.0.1</spring-cloud.version>
	    </properties>
	    <dependencyManagement>
	        <dependencies>
	            <dependency>
	                <groupId>org.springframework.boot</groupId>
	                <artifactId>spring-boot-dependencies</artifactId>
	                <version>${spring.boot.version}</version>
	                <type>pom</type>
	                <scope>import</scope>
	            </dependency>
	            <dependency>
	                <groupId>org.springframework.cloud</groupId>
	                <artifactId>spring-cloud-dependencies</artifactId>
	                <version>${spring-cloud.version}</version>
	                <type>pom</type>
	                <scope>import</scope>
	            </dependency>
	        </dependencies>
	    </dependencyManagement>
	
	    <!--  这里的依赖会被子模块继承  -->
	    <dependencies>
	        <dependency>
	            <groupId>org.springframework.boot</groupId>
	            <artifactId>spring-boot-starter-web</artifactId>
	        </dependency>
	        <dependency>
	            <groupId>org.springframework.cloud</groupId>
	            <artifactId>spring-cloud-starter-openfeign</artifactId>
	        </dependency>
	
	        <dependency>
	            <groupId>org.springframework.boot</groupId>
	            <artifactId>spring-boot-starter-test</artifactId>
	            <scope>test</scope>
	        </dependency>
	    </dependencies>
	</project>
```

* 子模块pom示例
	``` xml
	<?xml version="1.0" encoding="UTF-8"?>
	<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
	    <modelVersion>4.0.0</modelVersion>
	    <parent>
	        <groupId>com.zsy</groupId>
	        <artifactId>guli-mall</artifactId>
	        <version>0.0.1-SNAPSHOT</version>
	    </parent>
	    <groupId>com.zsy</groupId>
	    <artifactId>mall-product</artifactId>
	    <version>0.0.1-SNAPSHOT</version>
	    <name>mall-product</name>
	    <description>商品服务</description>
	
	    <build>
	        <plugins>
	            <plugin>
	                <groupId>org.springframework.boot</groupId>
	                <artifactId>spring-boot-maven-plugin</artifactId>
	            </plugin>
	        </plugins>
	    </build>
	
	</project>
```

* 修改gitignore
	修改总项目的.gitignore，把小项目里的垃圾文件在提交的时候忽略掉
	``` shell
	HELP.md
	target/
	!.mvn/wrapper/maven-wrapper.jar
	!**/src/main/**/target/
	!**/src/test/**/target/
	
	### STS ###
	.apt_generated
	.classpath
	.factorypath
	.project
	.settings
	.springBeans
	.sts4-cache
	
	### IntelliJ IDEA ###
	.idea
	*.iws
	*.iml
	*.ipr
	
	### NetBeans ###
	/nbproject/private/
	/nbbuild/
	/dist/
	/nbdist/
	/.nb-gradle/
	build/
	!**/src/main/**/build/
	!**/src/test/**/build/
	
	### VS Code ###
	.vscode/
	
	### other ###
	**/mvnw
	**/mvnw.cmd
	**/.mvn
	**/target
	```
	
	删除各模块下的`mvnw`, `mvnw.cmd`, `.mvn`, 这几个文件是声明maven版本的, 我们已经在设置中指定和修改过镜像源了, 不在需要这几个文件了; `HELP.md`也可以删除, 要的话留根目录下的就可以了

### 创建数据库
创建数据库之前需要启动docker服务
``` shell
sudo docker ps
sudo docker ps -a
# 这两个命令的差别就是后者会显示  【已创建但没有启动的容器】

# 我们接下来设置我们要用的容器每次都是自动启动
sudo docker update redis --restart=always
sudo docker update mysql --restart=always
# 如果不配置上面的内容的话，我们也可以选择手动启动
sudo docker start mysql
sudo docker start redis
# 如果要进入已启动的容器
sudo docker exec -it mysql /bin/bash
```

> 所有的数据库数据再复杂也不建立外键，因为在电商系统里，数据量大，做外键关联很耗性能。

**创建数据库**
数据库工具中开始操作,
建立数据库,字符集选utf8mb4，他能兼容utf8且能解决一些乱码的问题。
分别建立了下面数据库:
- gulimall_oms
	![[gulimall-oms.sql]]
- gulimall_pms
	![[gulimall-pms.sql]]
- gulimall_sms
	![[gulimall_sms.sql]]
- gulimall_ums
	![[gulimall_ums.sql]]
- gulimall_wms
	![[gulimall_wms.sql]]

## 快速开发
通过人人开源生成代码

在码云上搜索人人开源，我们使用renren-fast，renren-fast-vue项目。
``` shell
git clone https://gitee.com/renrenio/renren-fast.git

git clone https://gitee.com/renrenio/renren-fast-vue.git
```
下载到了桌面，我们把renren-fast移动到我们的项目(gulimall)文件夹（删掉.git文件），
而renren-fast-vue是用VSCode打开的（后面再弄）

### renren-fast
在idea(root)项目里的pom.xml添加一个
``` xml
<modules>
    <module>gulimall-coupon</module>
    <module>gulimall-member</module>
    <module>gulimall-order</module>
    <module>gulimall-product</module>
    <module>gulimall-ware</module>

    <module>renren-fast</module>
</modules>
```
数据库工具中创建`gulimall_admin`数据库, 
在`renren-fast/db/mysql.sql`目录下执行sql, 创建系统基础数据表
![[gulimall_admin]]

`renren-fast`项目中的`application.yml`默认使用`dev`配置文件，
修改`application-dev.yml`中数据库连接配置: 
``` properties
url: jdbc:mysql://192.168.56.10:3306/gulimall_admin?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai
username: root
password: root
```

然后执行java下的RenrenApplication, *此时`renren-fast`的`pom.xml`可能会爆红,可以先不用管,仍然能启动起来*
浏览器输入http://localhost:8080/renren-fast/ 得到{“msg”:“invalid token”,“code”:401}就代表无误

### renren-fast-vue
用VSCode打开renren-fast-vue

* 安装node：
  官网: https://nodejs.org/en/, NPM是随同NodeJS一起安装的包管理工具.
  下载后缀为`LTS`(稳定版)的, 然后直接安装...
  安装完后可以在cmd命令窗口使用`node -v`验证
  
  接下来配置npm使用淘宝镜像, cmd在控制台运行
  ``` shell
  npm config set registry http://registry.npm.taobao.org/
  ```

  > 注意：版本为v10.16.3，python版本为3（因为不同版本等下下面遇到的问题可能不一样）
  
* 启动项目
  然后在VScode的终端
  手下先下载和安装项目所需的依赖, 进入项目中输入 
  ``` shell
  npm install
  ```
  安装的依赖都会存到node_modules里
  
  启动项目
  ``` shell
  npm run dev
  ```

  浏览器输入启动后的地址, 如: `http://localhost:8001`, (后端需要启动)
  就可以看到内容了，登录账号admin 密码admin

### 逆向工程搭建
git clone https://gitee.com/renrenio/renren-generator.git
下载到桌面后，同样把里面的.git文件删除，然后移动到我们IDEA项目目录中，

* 生成代码
	同样配置好pom.xml(root)
  ``` xml
  <modules>
      <module>gulimall-coupon</module>
      <module>gulimall-member</module>
      <module>gulimall-order</module>
      <module>gulimall-product</module>
      <module>gulimall-ware</module>
      <module>renren-fast</module>
      <module>renren-generator</module>
  </modules>
  ```

	修改`renren-generator`的`application.yml`
  ``` yml
  url: jdbc:mysql://192.168.1.103:3306/要生成的对应的数据库?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=Asia/Shanghai
  username: root
  password: root
```
  修改`renren-generator`的`generator.properties`
  ``` properties
  mainPath=cn.cheakin # 主目录
  package=cn.cheakin.gulimall # 包名
  moduleName=对应的模块名   # 模块名
  author=botboy  # 作者
  email=cheakin@foxmail.com  # email
  tablePrefix=对应数据库的表前缀   # 我们的对应数据库中的表的都用相同前缀，如果写了表前缀，每一张表对于的javaBean就不会添加前缀了
```
	修改`renren-generator`中`resource/templates/Controller.java.vm`(这是生成Controller的模板). 
	将`@RequiresPermissions("xxx")`以java注释的方式注释掉, 并将`import org.apache.shiro.authz.annotation.RequiresPermissions;`包引入删除掉

	运行`RenrenApplication`。如果启动不成功，修改`application.yml`中的`port`为`其他端口`。访问`http://localhost:80`
  1. 然后选择对应模块,选择全部(注意分页)，点击生成代码。下载压缩包
  2. 解压压缩包，把`main`放到`对应模块(guilmall-product, gulimall-order...)`的同级目录下; `main/resources/view/`文件夹用不到,可以删除
 
	依次创建以下代码
	* coupon(sms)(7000端口)
	* member(ums)(8000端口)
	* order(oms)(9000端口)
	* product(pms)(100000端口)
	* ware(wms)(11000端口)

	创建公共模块`gulimall-common`
	创建后会发现有很多报红, 是因为缺少对应的包, 在`renren-fast`中都包含了这些缺失的包.

	现在我们将这个公共的整合到一个公共模块`gulimall-common`中
  1. 新建`gulimall-common`模块
  2. 将每个guli-*模块的`pom.xml`中引入`gulimall-common`
  3. 查看报红的地方, 依次将代码从`renren-fast`中移动到`gulimall-common`中, 其中`pom.xml`也需要同样拷贝过来
    `gulimall-common`模块的`pom.xml`, *xxs攻击后面处理*
    ![/GuliaMall/1657871814306.jpg)
    ``` xml
    <?xml version="1.0" encoding="UTF-8"?>
      <project xmlns="http://maven.apache.org/POM/4.0.0"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
          <modelVersion>4.0.0</modelVersion>
          <parent>
              <artifactId>gulimall</artifactId>
              <groupId>cn.cheakin</groupId>
              <version>0.0.1-SNAPSHOT</version>
          </parent>
          <groupId>cn.cheakin</groupId>
          <artifactId>gulimall-common</artifactId>
          <version>0.0.1-SNAPSHOT</version>
          <description>公共模块</description>
          <build>
              <plugins>
                  <plugin>
                      <groupId>org.apache.maven.plugins</groupId>
                      <artifactId>maven-compiler-plugin</artifactId>
                      <configuration>
                          <source>8</source>
                          <target>8</target>
                      </configuration>
                  </plugin>
              </plugins>
          </build>

          <dependencies>
              <!--mybatis-plus-->
              <dependency>
                  <groupId>com.baomidou</groupId>
                  <artifactId>mybatis-plus-boot-starter</artifactId>
                  <version>3.3.1 </version>
              </dependency>

              <!--lombok-->
              <dependency>
                  <groupId>org.projectlombok</groupId>
                  <artifactId>lombok</artifactId>
                  <version>1.18.22</version>
              </dependency>

              <!--renrenfast其他依赖-->
              <dependency>
                  <groupId>org.apache.httpcomponents</groupId>
                  <artifactId>httpcore</artifactId>
                  <version>4.4.15</version>
              </dependency>
              <dependency>
                  <groupId>commons-lang</groupId>
                  <artifactId>commons-lang</artifactId>
                  <version>2.6</version>
              </dependency>
          </dependencies>

      </project>
    ```
  4. 配置(整合)`mybatis-plus`
    1. 配置数据源:
         1. 导入`mybatis-plus-spring-boot-starter`依赖
           ``` xml
           <!--mybatis-plus-->
           <dependency>
               <groupId>com.baomidou</groupId>
               <artifactId>mybatis-plus-boot-starter</artifactId>
               <version>3.3.1 </version>
           </dependency>
           ```
         2. 导入MySQL数据库的驱动, 官方提示: 5.1或8.0(推荐)的依赖是兼容5.7的
           ```xml
           <!--mysql驱动-->
           <dependency>
               <groupId>mysql</groupId>
               <artifactId>mysql-connector-java</artifactId>
               <version>8.0.27</version>
           </dependency>
           ```
         3. 配置数据源
           为每个模块都配置对应的数据源, 如`gulimall-product`的`application.yml`:
           ``` yml
           spring:
             datasource: 
               username: root
               password: root
               url: jdbc:mysql://192.168.56.10:3306/gulimall_pms
               driver-class-name: com.mysql.cj.jdbc.Driver # 8.o用com.mysql.cj.jdbc.Driver， 8.0一下可以用 com.mysql.jdbc.Driver
           ```
    2. 配置MyBatis-Plus
      1. 使用`@MapperScan`
        在启动类上添加`@MapperScan`注解. **注意：不要重复注入，可能会出现bean重复**
      2. 指定MyBtis-Plus的映射文件位置
        同样在每个模块配置的配置文件`application.yml`中添加
        ``` yml 
        mybatis-plus:
          # 指定mapper文件位置
          mapper-locations: classpath*:/mapper/**/*.xml # classpath指当前项目的classpath, classpath*则不指定当前项目
          # 指定主键自增
          global-config:
            db-config:
              id-type: auto
        ```
    3. application.yml
      applicatin.yml的完整配置
      ``` YML
      spring:
        datasource:
          username: root
          password: root
          url: jdbc:mysql://192.168.56.10:3306/gulimall_pms
          driverClassName: com.mysql.cj.jdbc.Driver
      mybatis-plus:
        # 指定mapper文件位置
        mapper-locations: classpath*:/mapper/**/*.xml # classpath指当前项目的classpath, classpath*则不指定当前项目
        # 指定主键自增
        global-config:
          db-config:
            id-type: auto
      server:
        port: 10000
      ```
      注意区别不通模块的数据库和端口
  5. 测试
    在`gulimall-product`模块的单元测试中测试
    ``` java
    @SpringBootTest
    class GulimallProductApplicationTests {

        @Autowired
        BrandService brandService;

        @Test
        void add() {
            BrandEntity brandEntity = new BrandEntity();
            brandEntity.setName("华为");

            brandService.save(brandEntity);
            System.out.println("保存完成");
        }

        @Test
        void update() {
            BrandEntity brandEntity = new BrandEntity();

            brandEntity.setBrandId(1L);
            brandEntity.setDescript("华为手机");

            brandService.updateById(brandEntity);
        }

        @Test
        void quey() {
            List<BrandEntity> list = brandService.list(new QueryWrapper<BrandEntity>().eq("brand_id", 1L));
            list.forEach(item -> {
                System.out.println("item = " + item);
            });
        }

    }
    ```


## 分布式组件
![/GuliaMall/1657939731397.jpg)

### 简介
Spring Cloud Alibaba 致力于提供微服务开发的一站式解决方案。此项目包含开发分布式应用微服务的必需组件，方便开发者通过 Spring Cloud 编程模型轻松使用这些组件来开发分布
式应用服务。
依托 Spring Cloud Alibaba，您只需要添加一些注解和少量配置，就可以将 Spring Cloud应用接入阿里微服务解决方案，通过阿里中间件来迅速搭建分布式应用系统。
官方仓库: https://github.com/alibaba/spring-cloud-alibaba
Spring Cloud Alibaba 版本说明:https://github.com/alibaba/spring-cloud-alibaba/wiki/版本说明

SpringCloud的几大痛点:
* SpringCloud部分组件停止维护和更新，给开发带来不便；
* SpringCloud部分环境搭建复杂，没有完善的可视化界面，我们需要大量的二次开发和定制
* SpringCloud配置复杂，难以上手，部分配置差别难以区分和合理应用

SpringCloud Alibaba 的优势：
阿里使用过的组件经历了考验，性能强悍，设计合理，现在开源出来大家用成套的产品搭配完善的可视化界面给开发运维带来极大的便利. 搭建简单，学习曲线低。

结合 SpringCloud Alibaba 我们最终的技术搭配方案。
**SpringCloud Alibaba - Nacos：注册中心（服务发现/注册）**
**SpringCloud Allbaba - Nacos " 配置中心（动态配直管理）**
**SpringCloud - Ribbon：负载均衡**
**SpringCloud - Feign：声明式HTTP客户请（调用远程服务）**
**Springdloud Allbaba - Sentinel：服务容错（限流、降级、熔断）**
**SpringCloud - Gateway : API 网关（webflux 编程模式)**
**SpringCloud - Sleuth：调用链监控**
**SpringCloud Alibaba - Seata . 原 Fescar，即分布式事务解决方案**

* 引入依赖
	在`gulimall-common`中的`pom.xml`中添加(参考:[Spring Cloud Alibaba](https://github.com/alibaba/spring-cloud-alibaba/blob/2021.x/README-zh.md))
``` xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-alibaba-dependencies</artifactId>
            <version>2021.0.1.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

### Nacos(注册中心)
官方文档: https://nacos.io/zh-cn/docs/what-is-nacos.html
Spring Cloud Ablibab - Nacos Discovery (注册中心): https://github.com/alibaba/spring-cloud-alibaba/blob/2.2.x/spring-cloud-alibaba-examples/nacos-example/nacos-discovery-example/readme-zh.md

1. 下载并启动
  下载地址： https://github.com/alibaba/nacos/releases
  下载对应的版本即可，默认端口是`8848`, 启动后访问`http://127.0.0.1:8848/nacos`, 默认账号密码都是`nacos`
  > 注意: 目前我们是非集群模式, windows下启动需要将`/bin/startup.sh`启动脚本中的`set MODE="cluster"`修改为`set MODE="standalone"`; linux下参照文档使用`sh startup.sh -m standalone`启动即可
2. 引入依赖
  在`gulimall-common`中的`pom.xml`中添加
  ``` xml
  <dependency>
      <groupId>com.alibaba.cloud</groupId>
      <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
      <exclusions>
          <exclusion>
              <groupId>org.springframework.cloud</groupId>
              <artifactId>spring-cloud-netflix-ribbon</artifactId>
          </exclusion>
      </exclusions>
  </dependency>
  ```
3. 配置注册地址
  在需要的模块(即除gulimall-common外)的`application.yml`中增加
  ``` yml
  spring:  
    cloud:
      nacos:
        discovery:
          server-addr: 127.0.0.1:8848
    application:
      name: gulimall-coupon # 必须指定服务名称, 否则无法注册成功
  ```
4. 使用`@EnableDiscoveryClient`注解开启服务注册与发现功能
   启动服务后在注册中心就可以看到服务了
   ![/GuliaMall/1657974842626.jpg)
5. 依上, 为其他服务配置注册中心

若远程服务掉线, 那么nacos也会对应更新状态
![/GuliaMall/1657993655727.jpg)


### Feign远程调用
#### 简介
Feign是一个声明式的HTTP客户端.它的目的就是让远程调用更加简单。Feign 提供了 HTTP请求的横板，**通过编写简单的接口和插入注解**，就可以定义好HTTP请求的参数、格式、地址等信息。
Feign 整合了**Ribbon（负载均衡）**和**Hystrix(服务熔断)**，可以让我们不再需要显式地使用这两个组件。
SpringCloudFeign 在 NetflixFelgn的基础上扩展了 对SpringMVC注解的支持，在其实现下，我们只需创建一个接口并用注解的方式来配置它，即可完成对服务提供方的接口绑定。简化了SpringCloudRibbon自行封装服务调用客户端的开发量。

#### 使用
* 引入依赖
  创建项目时引入过的就可以忽略了
  ``` xml
  <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-openfeign</artifactId>
  </dependency>
  ```
* 开启Feign功能(如前端通过**接口调用gulimall-member**, **gulimall-member远程调用**远程的**gulimall-coupon的接口和服务**)
  首先gulimall-coupon需要有相应的接口和服务, 如在`gulimall-coupon`的`CouponController`新建接口和服务(为方便,这里简单写一个controller层的方法)
  ``` java
  @RequestMapping("/member/list")
  public R membercouponList(){
      CouponEntity entity = new CouponEntity();
      entity.setCouponName("满100-10");
      return R.ok().put("coupons", Arrays.asList(entity));
  }
  ```
  1. 引入open-feign
    启动类使用`@EnableDiscoveryClient`注解(**gulimall-member的启动类**)
  2. 编写接口, 告诉SpringCloud这个接口这个接口需要远程服务(**gulimall-member中**)
    - 声明远程服务调用哪一个方法
      方便管理, 把统一服务的远程调用写到同一个类中
      ``` java
      @FeignClient("gulimall-coupon")
      public interface CouponFeignService {

          @RequestMapping("/coupon/coupon/member/list") // 需要完整的路径
          public R membercouponList();

      }
      ```
    - 声明接口(**gulimall-member中发起远程调用的接口**)
      如在`gulimall-member`的`MemberController`中增加用户调用接口
      ``` java
      @RequestMapping("/coupons")
      public R test(){
          MemberEntity memberEntity = new MemberEntity();
          memberEntity.setNickname("张三");

          R membercoupons = couponFeignService.membercouponList();

          return R.ok().put("member", memberEntity)
                  .put("coupons", membercoupons.get("coupons"));
      }
      ```
  3. 开启远程调用功能
    使用`@EnableFeignClients`注解(**在gulimall-member的启动类上加`@EnableFeignClients(basePackages = "cn.cheakin.gulimall.member.feign")`注解**)
  4. 排错
    OpenFeign报错
    ``` java
    No Feign Client for loadBalancing defined. Didyou forget to include spring-cloud-starter-loadbalance
    ```
    Spring Cloud版本 2020.0.3, Spring Boot版本 2.4.6
    原因是因为SpringCloud Feign在Hoxton.M2 RELEASED版本之后抛弃了Ribbon，使用了spring-cloud-loadbalancer，所以我们这里还需要引入spring-cloud-loadbalancer的依赖，否则就会报错
    ``` xml
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-loadbalancer</artifactId>
    </dependency>
    ```
    同时nacos也要排除掉ribbo
    ``` xml
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
        <exclusions>
            <exclusion>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-netflix-ribbon</artifactId>
            </exclusion>
        </exclusions>
    </dependency>
    ```
    > 参考: https://blog.csdn.net/weixin_44524763/article/details/121730595
  5. 测试
    访问`http://localhost:8000/member/member/coupons`, 返回
    ``` json
    {"msg":"success","code":0,"coupons":[{"id":null,"couponType":null,"couponImg":null,"couponName":"满100-10","num":null,"amount":null,"perLimit":null,"minPoint":null,"startTime":null,"endTime":null,"useType":null,"note":null,"publishCount":null,"useCount":null,"receiveCount":null,"enableStartTime":null,"enableEndTime":null,"code":null,"memberLevel":null,"publish":null}],"member":{"id":null,"levelId":null,"username":null,"password":null,"nickname":"张三","mobile":null,"email":null,"header":null,"gender":null,"birth":null,"city":null,"job":null,"sign":null,"sourceType":null,"integration":null,"growth":null,"status":null,"createTime":null}}
    ```

### 配置中心
官方文档: https://nacos.io/zh-cn/docs/what-is-nacos.html
Spring Cloud Ablibab - Nacos Discovery (注册中心): https://github.com/alibaba/spring-cloud-alibaba/blob/2.2.x/spring-cloud-alibaba-examples/nacos-example/nacos-config-example/readme-zh.md

1. 下载并启动
    略
2. 引入依赖
    在`gulimall-common`中的`pom.xml`中添加
    ``` xml
    <!--Nacos注册中心-->
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
    </dependency>
    <!--新版spring-cloud弃用bootstrap.properties导致的传统配置方式不生效-->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-bootstrap</artifactId>
    </dependency>
    ```
3. 配置配置中心地址(如`gulimall-coupon`模块)
    在应用的 `/src/main/resources/bootstrap.properties`(bootstrap.properties的启动优先级是大于aplication.yml的) 配置文件中配置 Nacos Config 元数据
    ``` YML
    spring.application.name=gulimall-coupon # 一般用服务名
    spring.cloud.nacos.config.server-addr=127.0.0.1:8848
    ```
4. 编写配置(如`gulimall-coupon`模块)
    在`gulimall-coupon`新建`/src/main/resources/application.properties`, 充当默认配置
    ``` yml
    coupon.user.name=zhangsan
    coupon.user.age=18
    ```

    **在配置中心配置**
    ![/GuliaMall/1658061630460.jpg)
    ![/GuliaMall/1658061780954.jpg)
    Data ID 默认为 应用名.properties, 如gulimall-coupon.properties
5. 测试(如`gulimall-coupon`模块)
    编写测试接口, 在`CouponController`类中, **类上加`@RefreshScope`注解表示启用启动刷新**
    ``` java
    @Value("${coupon.user.name}")
    private String name;
    @Value("${coupon.user.age}")
    private Integer age;

    /**
     * 测试配置中心
     */
    @RequestMapping("/test")
    public R test() {
        return R.ok().put("name", name).put("age", age);
    }
    ```
    访问`http://localhost:7000/coupon/coupon/test`, 返回结果:
    ``` json
    {"msg":"success","code":0,"name":"zhangsan","age":18}
    ```

    **若修改配置**
    ![/GuliaMall/1658063170131.jpg)
    访问`http://localhost:7000/coupon/coupon/test`, 返回结果:
    ``` json
    {"msg":"success","code":0,"name":"zhangsan","age":22}
    ```

    > 如果配置中心和当前应用都配置了相同的项, 会优先使用配置中心的

### 配置中心进阶
1. 命名空间
    用于进行租户粒度的配置隔离。不同的命名空间下，可以存在相同的 `Group` 或 `Data ID` 的配置。`Namespace` 的常用场景之一是不同环境的配置的区分隔离，例如开发测试环境和生产环境的资源（如配置、服务）隔离等。
    默认：public（保留空间）：默认新增的所有配百都在pubLic空间。Nacos2.1是可以自定义id的
    - 方式一
      如开发（dev)、测试(test)、生产(prod)，切换不同的命名空间, 可以利用命名空间做环境隔离
      只需要在`bootstrap.properties`中配置
      ``` yml
      spring.cloud.nacos.config.namespace=e62d9969-bade-4ab7-a028-e6201d362a23  # 命名空间id
      ```
      ![/GuliaMall/1658064849230.jpg)
    - 方式二
      每一个微服务之间项目隔离配置, 每个微服务都创建自己的命名空间, 只加载自己命名空间下的所有配置
      原理都是一样的, 只是分类的方式不同而已

2. 配置集
  所有配置的集合

3. 配置集ID
  即Data ID, 类似文件名

4. 配置分组
  默认所有的配置集都属于: DEFAULT_GROUP
  可以用与区分环境配置

`gulimall`中我们将采用: 每个微服务船舰自己命名空间, 使用配置分组区分环境(dev/test/prod)
![/GuliaMall/1658067186247.jpg)

**加载多配置集**
我们将`application.yml`中不同类型的配置独立开来
* 数据源相关配置`datasource.yml`
  ![/GuliaMall/1658067448324.jpg)
  ``` yml
  spring:
    datasource:
      username: root
      password: root
      url: jdbc:mysql://192.168.56.10:3306/gulimall_sms
      driverClassName: com.mysql.cj.jdbc.Driver
  ```
* MyBatis相关配置`mybatis.yml`
  ![/GuliaMall/1658067562785.jpg)
  ``` yml
  mybatis-plus:
  # 指定mapper文件位置
  mapper-locations: classpath*:/mapper/**/*.xml # classpath指当前项目的classpath, classpath*则不指定当前项目
  # 指定主键自增
  global-config:
    db-config:
      id-type: auto
  ```
* 其他相关配置`other.yml`
  ![/GuliaMall/1658067755354.jpg)
  ``` yml
  spring:
    cloud:
      nacos:
        discovery:
          server-addr: 127.0.0.1:8848
    application:
      name: gulimall-coupon

  server:
    port: 7000
  ```
在`bootstrap.properties`中新增配置
``` yml
spring.cloud.nacos.config.extension-configs[0].data-id=datasource.yml
spring.cloud.nacos.config.extension-configs[0].group=dev
spring.cloud.nacos.config.extension-configs[0].refresh=true

spring.cloud.nacos.config.extension-configs[1].data-id=mybatis.yml
spring.cloud.nacos.config.extension-configs[1].group=dev
spring.cloud.nacos.config.extension-configs[1].refresh=true

spring.cloud.nacos.config.extension-configs[2].data-id=other.yml
spring.cloud.nacos.config.extension-configs[2].group=dev
spring.cloud.nacos.config.extension-configs[2].refresh=true
```
能正常启动并能正常访问`http://localhost:7000/coupon/coupon/test`即可
- 微服务任何配置信息, 任何配置文件都可以放在配置中心中
- 只需要在`bootstrap.properties`说明加载配置重谢的哪些配置文件即可
- @Value, @ConfigrationPoroperties同样可以使用(原来怎么用现在还是怎么用)
  


### 网关
![/GuliaMall/1658136252118.jpg)
#### 简介
网关作为流量的入口，常用功能包括路由转发、权限校验、限流控制等。而springcloud gateway作为SpringCloud官方推出的第二代网关框架，取代了Zuul网关。  
网关提供API全托管服务。丰富的API管理功能，辅助企业管理大规模的 APl，以降低管理成本和安全风险，包括协议适配、协议转发、安全策略、防刷、流量、监控日志等功能。
Spring Cloud Gateway 旨在提供一种简单而有效的方式来对 API进行路由，并为他们提供切面，例如：安全性，监控/指标 和弹性等。  

官方文档：https://docs.spring.io/spring-cloud-gateway/docs/current/reference/html/

特点：
* Predicate(断言)
	参考的是Java8的jva.util.functin.Predicate, 开发人员可以匹配HTTP请求中的所有内容(例如请求头或请求参数)，如果请求与断言相匹配则进行路由
* Route(路由)
  路由是构建网关的基本模块，它由ID，目标URI， 一系列的断言和过滤器组成，如果断言为true则匹配该路由
* Filter(过滤)
	指的是Spring框架中Gatewayfilter的实例，使用过滤器，可以在请求被路由前或者之后对请求进行修改。

工作流程
![/GuliaMall/1658163534280.jpg)
客户端向Spring Cloud Gateway发出请求。然后在Gateway Handler Mapping中找到与请求相匹配的路由，将其发送到GatewayWeb Handler.  
Handler再通过指定的过滤器链来将请求发送到我们实际的服务执行业务逻辑，然后返回。  
过滤器之间用虚线分开是因为过滤器可能会在发送代理请求之前( "pre" )或之后( "post" )执行业务逻辑。  
Filter在"pre" 类型的过滤器可以做参数校验、权限校验、流量监控、日志输出、协议转换等，在"post" 类型的过滤器中可以做响应内容、响应头的修改，日志的输出，流量监控等有着非常重要的作用。

##### 创建服务
* 创建模块`gulimall-gateway`, 同时引入`gulimall-gateway依赖`
  ``` xml
  <?xml version="1.0" encoding="UTF-8"?>
  <project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
      <artifactId>gulimall</artifactId>
      <groupId>cn.cheakin</groupId>
      <version>0.0.1-SNAPSHOT</version>
    </parent>
    <groupId>cn.cheakin</groupId>
    <artifactId>gulimall-gateway</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>gulimall-gateway</name>
    <description>gulimall-gateway</description>

    <dependencies>
      <dependency>
        <groupId>cn.cheakin</groupId>
        <artifactId>gulimall-common</artifactId>
        <version>0.0.1-SNAPSHOT</version>
      </dependency>

      <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-gateway</artifactId>
      </dependency>
    </dependencies>

    <build>
      <plugins>
        <plugin>
          <groupId>org.springframework.boot</groupId>
          <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>
      </plugins>
    </build>

  </project>
  ```
* 开启服务注册发现
  1. 在启动类上使用`@EnableDiscoveryClient`注解
  2. 在`application.properties`中配置注册中心的地址
      ``` yml
      spring.cloud.nacos.server-addr=127.0.0.1:8848
      spring.application.name=gulimall-gateway
      spring.main.web-application-type=reactive # 解决srpingboot-web冲突

      server.port=88
      ```
  3. 在`nacos`中新建命名空间和配置
      命名空间
      ![/GuliaMall/1658199239155.jpg)

      配置
      ![/GuliaMall/1658199536362.jpg)
      ``` yml
      spring:
        application:
          name: gulimall-gateway
      ```
  4. 在`bootstrap.properties`中配置配置中心的地址和命名空间
      ``` yml
      spring.application.name=gulimall-gateway
      spring.cloud.nacos.server-addr=127.0.0.1:8848
      spring.cloud.nacos.config.namespace=gulimall-gateway
      ```
  5. `gulimall-gateway`还用不到数据库相关配置, 所以我们先排除数据库相关配置, 否侧无法启动
      - 在启动类上使用`@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})`注解
      - 在`application.properties`中加注解
          ```yml
          spring.main.web-application-type=reactive
          ```

* 使用
	1. 创建`application.yml`, 并配置如下路由规则
	    ``` yml
	    spring:
	      cloud:
	        gateway:
	          routes:
	            - id: baidu_route
	              uri: https://www.baidu.com  # Query指请求参数
	              predicates:
	                - Query=url, baidu
	            - id: qq_route
	              uri: https://www.qq.com
	              predicates:
	                - Query=url, qq
	    ```
	2. 浏览器访问`loacalhost:88/hello?url=qq`, 若能跳转至qq的页面表示成功
	    访问 loacalhost:88/hello?url=qq 即 访问 www.qq.com/hello

## 前端
前后端类比
![/GuliaMall/20210211175651243.png)
### ES6
**ECMAScript 6.0**（以下简称 ES6，ECMAScript 是一种由 Ecma 国际(前身为欧洲计算机制造商 协会,英文名称是 European Computer Manufacturers Association)通过 ECMA-262标准化的脚本 程序设计语言）**是 JavaScript 语言的下一代标准**，已经在 2015 年 6 月正式发布了，并且 从 ECMAScript 6 开始，开始采用年号来做版本。即 ECMAScript 2015，就是 ECMAScript6。 它的目标，是使得 JavaScript 语言可以用来编写复杂的大型应用程序，成为企业级开发语言。 **每年一个新版本**。

ECMAScript 是浏览器脚本语言的规范，而各种我们熟知的 js 语言，如 JavaScript 则是 规范的具体实现。

#### let&&const
var在{}之外也起作用; 
let在{}之外不起作用; 
var多次声明同一变量不会报错，let多次声明会报错，只能声明一次; 
var 会变量提升（打印和定义可以顺序反）,let 不存在变量提升（顺序不能反）; 
const声明之后不允许改变.
``` html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
    
    <script>

      // var 声明的变量往往会越域
      // let 声明的变量有严格局部作用域
      {
        var a = 1;
        let b = 2;
      }
      console.log(a);  // 1
      console.log(b);  // ReferenceError: b is not defined

      // var 可以声明多次
      l/* et 只能声明一次
      var m = 1
      var m = 2
      let n = 3
      let n = 4
      console.log(m)  // 2
      console.log(n)  // Identifier 'n' has already been declared

      var 会变量提升
      let 不存在变量提升
      console.log(x);  // undefined
      var x = 10;
      console.log(y);   //ReferenceError: y is not defined
      let y = 20; */

      // const
      // 1. const声明之后不允许改变
      // 2. 一但声明必须初始化，否则会报错
      const a = 1;
      a = 3; //Uncaught TypeError: Assignment to constant variable.
    
    </script>

</body>
</html>
```

#### 解构表达式
支持let arr = [1,2,3]; let [a,b,c] = arr;这种语法
支持对象解析：const { name: abc, age, language } = person; 冒号代表改名
字符串函数
支持一个字符串为多行
占位符功能 ${}
``` html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>

    <script>
        //数组解构
        // let arr = [1,2,3];
        // // let a = arr[0];
        // // let b = arr[1];
        // // let c = arr[2];

        //数组解构
        // let [a,b,c] = arr;
        // console.log(a,b,c)

        const person = {
            name: "jack",
            age: 21,
            language: ['java', 'js', 'css']
        }
        //         const name = person.name;
        //         const age = person.age;
        //         const language = person.language;

        //对象解构
        const { name: abc, age, language } = person;
        console.log(abc, age, language)

        // 字符串扩展
        let str = "hello.vue";
        console.log(str.startsWith("hello"));//true
        console.log(str.endsWith(".vue"));//true
        console.log(str.includes("e"));//true
        console.log(str.includes("hello"));//true

        //字符串模板
        let ss = `<div>
                    <span>hello world<span>
                </div>`;
        console.log(ss);

        // 字符串插入变量和表达式。变量名写在 ${} 中，${} 中可以放入 JavaScript 表达式。

        function fun() {
            return "这是一个函数"
        }

        let info = `我是${abc}，今年${age + 10}了, 我想说： ${fun()}`;
        console.log(info);

    </script>
</body>
</html>
```

#### 函数优化
原来想要函数默认值得这么写b = b || 1; 现在可以直接写了function add2(a, b = 1) {
函数不定参数function fun(...values) {
支持箭头函数（lambda表达式），还支持使用{}结构传入对象的成员
``` html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>

    <script>
        //在ES6以前，我们无法给一个函数参数设置默认值，只能采用变通写法：
        function add(a, b) {
            // 判断b是否为空，为空就给默认值1
            b = b || 1;
            return a + b;
        }
        // 传一个参数
        console.log(add(10));


        //现在可以这么写：直接给参数写上默认值，没传就会自动使用默认值
        function add2(a, b = 1) {
            return a + b;
        }
        console.log(add2(20));  //21


        //不定参数
        function fun(...values) {
            console.log(values.length)
        }
        fun(1, 2)      //2
        fun(1, 2, 3, 4)  //4

        //箭头函数
        //以前声明一个方法  b 
        // var print = function (obj) {
        //     console.log(obj);
        // }
        var print = obj => console.log(obj);
        print("hello");

        var sum = function (a, b) {
            c = a + b;
            return a + c;
        }

        var sum2 = (a, b) => a + b;
        console.log(sum2(11, 12));

        var sum3 = (a, b) => {
            c = a + b;
            return a + c;
        }
        console.log(sum3(10, 20))


        const person = {
            name: "jack",
            age: 21,
            language: ['java', 'js', 'css']
        }

        function hello(person) {
            console.log("hello," + person.name)
        }

        //箭头函数+解构
        var hello2 = ({name}) => console.log("hello," +name);
        hello2(person);

    </script>
</body>
</html>
```

#### 对象优化
``` html
可以获取map的键值对等Object.keys(),values,entries
Object.assgn(target,source1,source2) 合并
const person2 = { age, name } //声明对象简写
…代表取出该对象所有属性拷贝到当前对象。let someone = { …p1 }
```

``` html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
    <script>
        const person = {
            name: "jack",
            age: 21,
            language: ['java', 'js', 'css']
        }

        console.log(Object.keys(person));//["name", "age", "language"]
        console.log(Object.values(person));//["jack", 21, Array(3)]
        console.log(Object.entries(person));//[Array(2), Array(2), Array(2)]

        const target = { a: 1 };
        const source1 = { b: 2 };
        const source2 = { c: 3 };

        //{a:1,b:2,c:3}
        Object.assign(target, source1, source2);

        console.log(target);//{a:1,b:2,c:3}

        // 声明对象简写
        const age = 23
        const name = "张三"
        const person1 = { age: age, name: name }

        const person2 = { age, name }//声明对象简写(属性名和值相同)
        console.log(person2);

        // 对象的函数属性简写
        let person3 = {
            name: "jack",
            // 以前：
            eat: function (food) {
                console.log(this.name + "在吃" + food);
            },
            //箭头函数this不能使用，要用 对象.属性
            eat2: food => console.log(person3.name + "在吃" + food),
            eat3(food) {
                console.log(this.name + "在吃" + food);
            }
        }

        person3.eat("香蕉");
        person3.eat2("苹果")
        person3.eat3("橘子");

        // 对象拓展运算符

        //  拷贝对象（深拷贝）
        let p1 = { name: "Amy", age: 15 }
        let someone = { ...p1 }
        console.log(someone)  //{name: "Amy", age: 15}

        //  合并对象
        let age1 = { age: 15 }
        let name1 = { name: "Amy" }
        let p2 = {name:"zhangsan"}
        p2 = { ...age1, ...name1 } 
        console.log(p2)//{age: 15, name: "Amy"}
    </script>
</body>

</html>
```

#### map和reduce
``` html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
    
    <script>
        //数组中新增了map和reduce方法。
        //map()：接收一个函数，将原数组中的所有元素用这个函数处理后放入新数组返回。
         let arr = ['1', '20', '-5', '3'];
         
        //  arr = arr.map((item)=>{
        //     return item*2
        //  });
         arr = arr.map(item=> item*2);

         console.log(arr);
        //reduce() 为数组中的每一个元素依次执行回调函数，不包括数组中被删除或从未被赋值的元素，
        //[2, 40, -10, 6]


        //arr.reduce(callback,[initialValue])
        /**
         * 1、previousValue （上一次调用回调返回的值，或者是提供的初始值（initialValue））
         * 2、currentValue （数组中当前被处理的元素）
         * 3、index （当前元素在数组中的索引）
         * 4、array （调用 reduce 的数组）
         */
        let result = arr.reduce((a,b)=>{
            console.log("上一次处理后："+a);
            console.log("当前正在处理："+b);
            return a + b;
        });
        console.log(result) // 38

        let result2 = arr.reduce((a,b)=>{
            console.log("上一次处理后："+a);
            console.log("当前正在处理："+b);
            return a + b;
        },100);
        console.log(result2) // 138

    </script>
</body>
</html>
```

#### promise
以前嵌套ajax的时候很繁琐。

解决方案：
把Ajax封装到Promise中，赋值给let p
在Ajax中成功使用resolve(data)，交给then处理，
失败使用reject(err)，交给catch处理p.then().catch()

模拟用户数据
``` json
corse_score_10.json 得分
{
    "id": 100,
    "score": 90
}

user.json 用户
{
    "id": 1,
    "name": "zhangsan",
    "password": "123456"
}


user_corse_1.json 课程
{
    "id": 10,
    "name": "chinese"
}
```
使用
``` html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
    <script src="https://cdn.bootcss.com/jquery/3.4.1/jquery.min.js"></script>
</head>
<body>
    <script>
        //1、查出当前用户信息
        //2、按照当前用户的id查出他的课程
        //3、按照当前课程id查出分数

        // 1.以前直接用ajax
        /* $.ajax({
            url: "mock/user.json",
            success(data) {
                console.log("查询用户：", data);
                $.ajax({
                    url: `mock/user_corse_${data.id}.json`,
                    success(data) {
                        console.log("查询到课程：", data);
                        $.ajax({
                            url: `mock/corse_score_${data.id}.json`,
                            success(data) {
                                console.log("查询到分数：", data);
                            },
                            error(error) {
                                console.log("出现异常了：" + error);
                            }
                        });
                    },
                    error(error) {
                        console.log("出现异常了：" + error);
                    }
                });
            },
            error(error) {
                console.log("出现异常了：" + error);
            }
        }); */


        // 2.Promise可以封装异步操作
        /* let p = new Promise((resolve, reject) => { //传入成功解析，失败拒绝
            //异步操作
            $.ajax({
                url: "mock/user.json",
                success: function (data) {
                    console.log("查询用户成功:", data)
                    resolve(data);
                },
                error: function (err) {
                    reject(err);
                }
            });
        });
        p.then((obj) => { //成功以后做什么
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: `mock/user_corse_${obj.id}.json`,
                    success: function (data) {
                        console.log("查询用户课程成功:", data)
                        resolve(data);
                    },
                    error: function (err) {
                        reject(err)
                    }
                });
            })
        }).then((data) => { //成功以后干什么
            console.log("上一步的结果", data)
            $.ajax({
                url: `mock/corse_score_${data.id}.json`,
                success: function (data) {
                    console.log("查询课程得分成功:", data)
                },
                error: function (err) {
                }
            });
        }) */

        // 3.将请求封装为请求
        function get(url, data) { //自己定义一个方法整合一下
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: url,
                    data: data,
                    success: function (data) {
                        resolve(data);
                    },
                    error: function (err) {
                        reject(err)
                    }
                })
            });
        }

        get("mock/user.json")
            .then((data) => {
                console.log("用户查询成功~~~:", data)
                return get(`mock/user_corse_${data.id}.json`);
            })
            .then((data) => {
                console.log("课程查询成功~~~:", data)
                return get(`mock/corse_score_${data.id}.json`);
            })
            .then((data)=>{
                console.log("课程成绩查询成功~~~:", data)
            })
            .catch((err)=>{ //失败的话catch
                console.log("出现异常",err)
            });

    </script>
</body>

</html>
```

#### 模块化
模块化就是把代码进行拆分，方便重复利用。类似于java中的导包，
而JS换了个概念，是导模块。

模块功能主要有两个命令构成 export 和import
* export用于规定模块的对外接口
* import用于导入其他模块提供的功能


user.js
``` js
var name = "jack"
var age = 21
function add(a,b){
    return a + b;
}

// 导出变量,函数......
export {name,age,add}
```

hello.js
``` js
/* export const util = {
    sum(a, b) {
        return a + b;
    }
}
export {util} */
//`export`不仅可以导出对象，一切JS变量都可以导出。比如：基本类型变量、函数、数组、对象。

export default {
    sum(a, b) {
        return a + b;
    }
}
// export default 只能有一个
```

main.js
``` js
// 导入
// import util form "./hello.js"
import abc from "./hello.js"
import {name,add} from "./user.js"

abc.sum(1,2);
console.log(name);
add(1,3);
```


### Vue
* MVVM思想
	M：model 包括数据和一些基本操作
	V：view 视图，页面渲染结果
	VM：View-model，模型与视图间的双向操作（无需开发人员干涉）
	视图和数据通过VM绑定起来，model里有变化会自动地通过Directives填写到视view中，
	视图表单中添加了内容也会自动地通过DOM Listeners保存到模型中。

VUE2 官网: https://cn.vuejs.org/v2/guide/

安装vue, 在项目目录下运行, 闲杂默认是安装VUE3, 所以需要指定版本号
``` shell
npm install vue@2.6.10
```

在VSCode中安装vue 2 snippets语法提示插件，在谷歌浏览器中安装vue.js devtools

#### 基础案例
##### 案例
``` html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>

<body>

    <div id="app">
        <input type="text" v-model="num">
        v-model实现双向绑定
        <button v-on:click="num++">点赞</button>
        v-on:click绑定事件，实现自增
        <button v-on:click="cancel">取消</button>
        回到自定义的方法
        
        <h1> {{name}} ,非常帅，有{{num}}个人为他点赞{{hello()}}</h1>
    </div>

    <!-- 导入依赖 -->
    <script src="./node_modules/vue/dist/vue.js"></script>

    <script>
        //1、vue声明式渲染
        let vm = new Vue({ //生成vue对象
            el: "#app",//绑定元素 div id="app"
            data: {  //封装数据
                name: "张三",  // 也可以使用{} //表单中可以取出
                num: 1
            },
            methods:{  //封装方法
                cancel(){
                    this.num -- ;
                },
                hello(){
                    return "1"
                }
            }
        });
        //还可以在html控制台, 如vm.name等

        //2、双向绑定,模型变化，视图变化。反之亦然。
        //3、事件处理

        //v-xx：指令

        //1、创建vue实例，关联页面的模板，将自己的数据（data）渲染到关联的模板，响应式的
        //2、指令来简化对dom的一些操作。v-model, v-on, v-click......
        //3、声明方法来做更复杂的操作。methods里面可以封装方法。

    </script>
</body>

</html>
```

##### v-text、v-html.html
``` html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
   
    <div id="app">
        {{msg}}  {{1+1}}  {{hello()}}<br/>
        用v-html取内容
        <span v-html="msg"></span>
        
        <br/>
        原样显示
        <span v-text="msg"></span>

        
    </div>
   
    <script src="../node_modules/vue/dist/vue.js"></script>

    <script>
        new Vue({
            el:"#app",
            data:{
                msg:"<h1>Hello</h1>",
                link:"http://www.baidu.com"
            },
            methods:{
                hello(){
                    return "World"
                }
            }
        })
    </script>
    
</body>
</html>
```

##### 插值表达式
花括号：只能写在标签体内，不能用在标签内。用v-bind解决
{{}}必须有返回值

##### 单向绑定v-bind
``` html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>

    <!-- 给html标签的属性绑定 -->
    <div id="app"> 

        <a v-bind:href="link">gogogo</a>

        <!-- class,style  {class名：加上？}-->
        <span v-bind:class="{active:isActive,'text-danger':hasError}"
          :style="{color: color1,fontSize: size}">你好</span>
        <!-- v-bind:xxx 可以缩写为 :xxx -->


    </div>

    <script src="../node_modules/vue/dist/vue.js"></script>

    <script>
        let vm = new Vue({
            el:"#app",
            data:{
                link: "http://www.baidu.com",
                isActive:true,
                hasError:true,
                color1:'red',
                size:'36px'
            }
        })
    </script>

</body>
</html>
```

##### 双向绑定v-model
``` html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>

    <!-- 表单项，自定义组件 -->
    <div id="app">

        精通的语言：
            <input type="checkbox" v-model="language" value="Java"> java<br/>
            <input type="checkbox" v-model="language" value="PHP"> PHP<br/>
            <input type="checkbox" v-model="language" value="Python"> Python<br/>
        选中了 {{language.join(",")}}
    </div>
    
    <script src="../node_modules/vue/dist/vue.js"></script>

    <script>
        let vm = new Vue({
            el:"#app",
            data:{
                language: []
            }
        })
    </script>

</body>
</html>
```

##### v-on
``` html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>

<body>
    <div id="app">
                
        <!--事件中直接写js片段-->
        <button v-on:click="num++">点赞</button>
        <!--事件指定一个回调函数，必须是Vue实例中定义的函数-->
        <button @click="cancel">取消</button>
        <!--  -->
        <h1>有{{num}}个赞</h1>


        <!-- 事件修饰符 -->
        <div style="border: 1px solid red;padding: 20px;" v-on:click.once="hello">
            大div
            <div style="border: 1px solid blue;padding: 20px;" @click.stop="hello">
                小div <br />
                <a href="http://www.baidu.com" @click.prevent.stop="hello">去百度</a>
            </div>
        </div>



        <!-- 按键修饰符： -->
        <input type="text" v-model="num" v-on:keyup.up="num+=2" @keyup.down="num-=2" @click.ctrl="num=10"><br />

        提示：

    </div>
    <script src="../node_modules/vue/dist/vue.js"></script>

    <script>
        new Vue({
            el:"#app",
            data:{
                num: 1
            },
            methods:{
                cancel(){
                    this.num--;
                },
                hello(){
                    alert("点击了")
                }
            }
        })
    </script>
</body>

</html>
```

##### v-for
``` html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>

<body>

    <div id="app">
        <ul>
            <li v-for="(user,index) in users" :key="user.name" v-if="user.gender == '女'">
                <!-- 1、显示user信息：v-for="item in items" -->
               当前索引：{{index}} ==> {{user.name}}  ==>   {{user.gender}} ==>{{user.age}} <br>
                <!-- 2、获取数组下标：v-for="(item,index) in items" -->
                <!-- 3、遍历对象：
                        v-for="value in object"
                        v-for="(value,key) in object"
                        v-for="(value,key,index) in object" 
                -->
                对象信息：
                <span v-for="(v,k,i) in user">{{k}}=={{v}}=={{i}}；</span>
                <!-- 4、遍历的时候都加上:key来区分不同数据，提高vue渲染效率 -->
            </li>

            
        </ul>

        <ul>
            <li v-for="(num,index) in nums" :key="index"></li>
        </ul>
    </div>
    <script src="../node_modules/vue/dist/vue.js"></script>
    <script>         
        let app = new Vue({
            el: "#app",
            data: {
                users: [{ name: '柳岩', gender: '女', age: 21 },
                { name: '张三', gender: '男', age: 18 },
                { name: '范冰冰', gender: '女', age: 24 },
                { name: '刘亦菲', gender: '女', age: 18 },
                { name: '古力娜扎', gender: '女', age: 25 }],
                nums: [1,2,3,4,4]
            },
        })
    </script>
</body>

</html>
```

##### v-if和v-show
``` html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>

<body>
    <!-- 
        v-if，顾名思义，条件判断。当得到结果为true时，所在的元素才会被渲染。
        v-show，当得到结果为true时，所在的元素才会被显示。 
    -->
    <div id="app">
        <button v-on:click="show = !show">点我呀</button>
        <!-- 1、使用v-if显示 -->
        <h1 v-if="show">if=看到我....</h1>
        <!-- 2、使用v-show显示 -->
        <h1 v-show="show">show=看到我</h1>
    </div>

    <script src="../node_modules/vue/dist/vue.js"></script>
        
    <script>
        let app = new Vue({
            el: "#app",
            data: {
                show: true
            }
        })
    </script>

</body>

</html>
```

##### v-else和v-else-if
``` html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>

<body>
    <div id="app">
        <button v-on:click="random=Math.random()">点我呀</button>
        <span>{{random}}</span>

        <h1 v-if="random>=0.75">
            看到我啦？！ &gt;= 0.75
        </h1>

        <h1 v-else-if="random>=0.5">
            看到我啦？！ &gt;= 0.5
        </h1>

        <h1 v-else-if="random>=0.2">
            看到我啦？！ &gt;= 0.2
        </h1>

        <h1 v-else>
            看到我啦？！ &lt; 0.2
        </h1>

    </div>


    <script src="../node_modules/vue/dist/vue.js"></script>
        
    <script>         
        let app = new Vue({
            el: "#app",
            data: { random: 1 }
        })     
    </script>
</body>

</html>
```

#### 计算属性和侦听器
``` html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>

<body>
    <div id="app">
        <!-- 某些结果是基于之前数据实时计算出来的，我们可以利用计算属性。来完成 -->
        <ul>
            <li>西游记； 价格：{{xyjPrice}}，数量：<input type="number" v-model="xyjNum"> </li>
            <li>水浒传； 价格：{{shzPrice}}，数量：<input type="number" v-model="shzNum"> </li> 
            <li>总价：{{totalPrice}}</li>
            {{msg}}
        </ul>
    </div>
    <script src="../node_modules/vue/dist/vue.js"></script>

    <script>
        //watch可以让我们监控一个值的变化。从而做出相应的反应。
        new Vue({
            el: "#app",
            data: {
                xyjPrice: 99.98,
                shzPrice: 98.00,
                xyjNum: 1,
                shzNum: 1,
                msg: ""
            },
            computed: {
                totalPrice(){
                  // 先忽略精度问题
                    return this.xyjPrice*this.xyjNum + this.shzPrice*this.shzNum
                }
            },
            watch: {
                xyjNum(newVal,oldVal){
                    if(newVal>=3){
                        this.msg = "库存超出限制";
                        this.xyjNum = 3
                    }else{
                        this.msg = "";
                    }
                }
            },
        })
    </script>

</body>

</html>
```

#### 过滤器
``` html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>

<body>
    <!-- 过滤器常用来处理文本格式化的操作。过滤器可以用在两个地方：双花括号插值和 v-bind 表达式 -->
    <div id="app">
        <ul>
            <li v-for="user in userList">
                {{user.id}} ==> {{user.name}} ==> {{user.gender == 1?"男":"女"}} ==>
                {{user.gender | genderFilter}} ==> {{user.gender | gFilter}}
            </li>
        </ul>
    </div>
    <script src="../node_modules/vue/dist/vue.js"></script>

    <script>
        // 注册全局过滤器, 这里注意顺序，Vue.filter 一定定义在创建实例前，否则不生效
        Vue.filter("gFilter", function (val) {
            if (val == 1) {
                return "男~~~";
            } else {
                return "女~~~";
            }
        })

        let vm = new Vue({
            el: "#app",
            data: {
                userList: [
                    { id: 1, name: 'jacky', gender: 1 },
                    { id: 2, name: 'peter', gender: 0 }
                ]
            },
            filters: {
                // filters 定义局部过滤器，只可以在当前vue实例中使用
                genderFilter(val) {
                    if (val == 1) {
                        return "男";
                    } else {
                        return "女";
                    }
                }
            }
        })
    </script>
</body>

</html>
```

#### 组件化
在大型应用开发的时候，页面可以划分成很多部分。往往不同的页面，也会有相
同的部分。
例如可能会有相同的头部导航。
但是如果每个页面都自开发，这无疑增加了我们开发的成本。所以我们会把页面
的不同分拆分成立的组件，然后在不同页面就可以共享这些组件，避免重复开发。
在vue里，所有的vue实例都是组件

``` html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>

<body>

    <div id="app">
        <button v-on:click="count++">我被点击了 {{count}} 次</button>

        <counter></counter>
        <counter></counter>
        <counter></counter>
        <counter></counter>
        <counter></counter>

        <button-counter></button-counter>
    </div>
    <script src="../node_modules/vue/dist/vue.js"></script>


    <script>
        //1、全局声明注册一个组件, 使用时不需要声明
        Vue.component("counter", {
            template: `<button v-on:click="count++">我被点击了 {{count}} 次</button>`,
            data() {  // 组件的data应该是一个方法, 这样调用时返回的都是一个新对象
                return {
                    count: 1
                }
            }
        });

        //2、局部声明一个组件, 使用时需要声明
        const buttonCounter = {
            template: `<button v-on:click="count++">我被点击了 {{count}} 次~~~</button>`,
            data() {
                return {
                    count: 1
                }
            }
        };

        new Vue({
            el: "#app",
            data: {
                count: 1
            },
            components: {
                'button-counter': buttonCounter
            }
        })
    </script>
</body>

</html>
```
* 组件其实也是一个vue实例，因此它在定义时也会接收：data、methods、生命周期函等
* 不同的是组件不会与页面的元素绑定，否则就无法复用了，因此没有el属性。
* 但是组件渲染需要html模板，所以增加了template属性，值就是HTML模板
* 全局组件定义完毕，任何vue实例都可以直接在HTML中通过组件名称来使用组了
* data必须是一个函数，不再是一个对象。

#### 生命周期钩子函数
官方文档: https://cn.vuejs.org/v2/guide/instance.html#实例生命周期钩子
![/GuliaMall/lifecycle.png)
``` html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>

<body>
    <div id="app">
        <span id="num">{{num}}</span>
        <button @click="num++">赞！</button>
        <h2>{{name}}，有{{num}}个人点赞</h2>
    </div>

    <script src="../node_modules/vue/dist/vue.js"></script>
    
    <script>
        let app = new Vue({
            el: "#app",
            data: {
                name: "张三",
                num: 100
            },
            methods: {
                show() {
                    return this.name;
                },
                add() {
                    this.num++;
                }
            },
            beforeCreate() {
                console.log("=========beforeCreate=============");
                console.log("数据模型未加载：" + this.name, this.num);
                console.log("方法未加载：" + this.show());
                console.log("html模板未加载：" + document.getElementById("num"));
            },
            created: function () {
                console.log("=========created=============");
                console.log("数据模型已加载：" + this.name, this.num);
                console.log("方法已加载：" + this.show());
                console.log("html模板已加载：" + document.getElementById("num"));
                console.log("html模板未渲染：" + document.getElementById("num").innerText);
            },
            beforeMount() {
                console.log("=========beforeMount=============");
                console.log("html模板未渲染：" + document.getElementById("num").innerText);
            },
            mounted() {
                console.log("=========mounted=============");
                console.log("html模板已渲染：" + document.getElementById("num").innerText);
            },
            beforeUpdate() {
                console.log("=========beforeUpdate=============");
                console.log("数据模型已更新：" + this.num);
                console.log("html模板未更新：" + document.getElementById("num").innerText);
            },
            updated() {
                console.log("=========updated=============");
                console.log("数据模型已更新：" + this.num);
                console.log("html模板已更新：" + document.getElementById("num").innerText);
            }
        });
    </script>
</body>

</html>  
```


#### 使用Vue脚手架进行开发
1. 全局安装webpack: `npm install webpack -g`
2. 全局安装vue脚手架: `npm install -g @vue/cli-init`
3. 初始化vue项目
    `vue init webpack appname:vue`脚手架使用webpack模板初始化一个appname项目
    - `build`: 打包后生成文件
    - `config`: 项目的配置文件
    - `node_modules`: 项目编译产生的文件
    - `src`: 代码编写目录
    - `.babelrc`: 语法转译相关配置
    - `index.html`: 项目首页入口
    - `package.json`: npm依赖包的信息
    - `package-lock.json`: npm依赖包的详细信息
4. 启动vue项目
    项目的`package.json`中有`scripts`,代表我们能运行的命令
    `npm run dev`: 启动项目
    `npm run build`:将项目打包

#### 使用element-ui
推荐使用 npm 的方式安装，它能更好地和 webpack 打包工具配合使用。
`npm i element-ui -S`

在 `main.js` 中写入以下内容：
``` js
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';

Vue.use(ElementUI);
```


## 商品服务-API
### 三级分类
* SQL脚本
![[gulimall_pms.sql]]

#### 查出所有分类以及子分类
> Long类型的比较不要直接使用==，要用到 LongValue（）来比较

在`gulimall-product`的`CategoryController`添加如下方法
``` java
public class CategoryController {
    @Autowired
    private CategoryService categoryService;

    /**
     * 查出所有分类以及子分类，以树形结构组装起来
     */
    @RequestMapping("/list/tree")
   // @RequiresPermissions("product:category:list")
    public R list(@RequestParam Map<String, Object> params){
       List<CategoryEntity> entities = categoryService.listWithTree();

        return R.ok().put("data", entities);
    }
}
```

在`gulimall-product`的`CategoryService`添加如下方法
``` java
List<CategoryEntity> listWithTree();
```

在`gulimall-product`的`CategoryEntity`追加
``` java
@TableField(exist = false)
private List<CategoryEntity> children;
```

在`gulimall-product`的`CategoryServiceImpl`添加如下方法
``` java
@Override
public List<CategoryEntity> listWithTree() {
    // 1 查出所有分类
    List<CategoryEntity> entities = baseMapper.selectList(null);
    // 2 组装成父子的树形结构
    List<CategoryEntity> level1Menus = entities.stream().filter(categoryEntity ->
        categoryEntity.getParentCid().longValue() == 0
    ).map((menu)->{
        menu.setChildren(getChildrens(menu,entities));
        return menu;
    }).sorted((menu1,menu2)->{
        return (menu1.getSort() == null?0:menu1.getSort()) - (menu2.getSort() == null?0:menu2.getSort());
    }).collect(Collectors.toList());
    return level1Menus;
}

// 递归查找所有菜单的子菜单
private List<CategoryEntity> getChildrens(CategoryEntity root, List<CategoryEntity> all) {
    List<CategoryEntity> children = all.stream().filter(categoryEntity -> {
        return categoryEntity.getParentCid().longValue() == root.getCatId().longValue();  // 注意此处应该用longValue()来比较，否则会出先bug，因为parentCid和catId是long类型 
    }).map(categoryEntity -> {
        // 1 找到子菜单
        categoryEntity.setChildren(getChildrens(categoryEntity, all));
        return categoryEntity;
    }).sorted((menu1, menu2) -> {
        // 2 菜单的排序
        return (menu1.getSort() == null?0:menu1.getSort()) - (menu2.getSort() == null?0:menu2.getSort());
    }).collect(Collectors.toList());
    return children;
}
```

测试: 启动并访问`localhost:10000/product/cacategory/list/tree`

#### 配置网关路由与路径重写
打开`renren-fast-vue`项目
``` shell
npm install
npm run dev
```
> 如遇到`node-sass`报错, 注意node,node-sass, sass-loader的版本, 
> node使用12.x, node-sass使用4.14.1, sass-loader使用7.3.1
> 另外, idea会在.gitignore中忽略buid目录, 需要放开

* 新增`商品系统`目录
  点击系统管理->菜单管理->新增
  ![/GuliaMall/1658455344491.jpg)
  可以在`gulimall-admin`数据库中的`sysmenu`表中查看新增的记录
  - 新增`分类维护`菜单
    点击系统管理->菜单管理->新增
    ![/GuliaMall/1658455704277.jpg)

在左侧点击【分类维护】，希望在此展示3级分类
注意地址栏http://localhost:8001/#/product-category 可以注意到product-category我们的/被替换为了-
比如sys-role具体的视图在renren-fast-vue/views/modules/sys/role.vue

所以要自定义我们的product/category视图的话，就是创建`mudules/product/category.vue`
``` html
<template>
    <el-tree :data="menus" :props="defaultProps" @node-click="handleNodeClick"></el-tree>
</template>

<script>
export default {
    name: 'category',
    components: {},
    directives: {},
     data() {
      return {
        menus: [],
        defaultProps: {
          children: 'children',
          label: 'label'
        }
      };
    },
    mounted() {
        
    },
    methods: {
        handleNodeClick(data) {
        console.log(data);
      },
      getMenus(){
        this.$http({
          url: this.$http.adornUrl('/product/category/list/tree'),
          method: 'get'
        }).then(data=>{
            console.log(data)
        })
      }
    },
    created(){
        this.getMenus();
    }
};
</script>

<style scoped>

</style>
```
会发现仍然获取不到数据, 查看接口, 发现访问的是8080端口, 而不是10000端口
解决这个问题, 我们的方法是: 搭建个网关，让网关路由到10000

在`static/config/index.js`里, 修改为
``` js
window.SITE_CONFIG['baseUrl'] = 'http://localhost:88/api';
```
接着让重新登录http://localhost:8001/#/login，验证码是请求88的，所以不显示。而验证码是来源于fast后台的
现在的验证码请求路径为: `http://localhost:88/api/captcha.jpg?uuid=69c79f02-d15b-478a-8465-a07fd09001e6`
原始的验证码请求路径: `http://localhost:8001/renren-fast/captcha.jpg?uuid=69c79f02-d15b-478a-8465-a07fd09001e6`
那么, `renren-fast`也需要将服务**注册到注册中心**, 并且将请求88网关转发到fast的8080端口

* `renren-fast`也需要将服务注册到注册中心
  让`renren-fast`的`pom.xml`里引入`gulimall-common`依赖, 在
  ``` xml
  <dependency>
      <!-- 里面有注册中心 -->
      <groupId>com.yxj.gulimall</groupId>
      <artifactId>gulimall-common</artifactId>
      <version>0.0.1-SNAPSHOT</version>
  </dependency> 
  ```
  在`renren-fast`的`application.yml`中添加:
  ``` yml
  spring:
    application:
      name: renren-fast
    cloud:
      nacos:
        discovery:
          server-addr: localhost:8848 # nacos
  ```
  然后在`renren-fast`启动类上加上注解`@EnableDiscoveryClient`，重启
  > 如果报错gson依赖，就导入google的gson依赖

  然后在nacos的服务列表里看到了renren-fast

* 配置网关
  在`gateway`的`application.yml`中按格式加入
  ``` yml
  spring:
  cloud:
    gateway:
      routes:
        - id: admin_route
          uri: lb://renren-fast # 路由给renren-fast，lb代表负载均衡
          predicates: # 什么情况下路由给它
            - Path=/api/** # 默认前端项目都带上api前缀，
          filters:
            - RewritePath=/api/(?<segment>.*),/renren-fast/$\{segment} # 路由给renren-fast，并且把前缀替换为空
  ```
  将`renren-fast-vue`的`springcloud\renren-fast-vue\static\config\index.js`请求地址修改以下
  ``` js
  window.SITE_CONFIG['baseUrl'] = 'http://localhost:88/api';
  ```
登录, **验证码正常, 登录还是报错**: 从8001访问88，引发CORS跨域请求，浏览器会拒绝跨域请求

#### 网关统一配置跨域
跨域：指的是浏览器不能执行其他网站的脚本。它是由浏览器的同源策略造成的，是**浏览器对js施加的安全限制**。（ajax可以）
同源策略：是指协议，域名，端囗都要相同，其中有一个不同都会产生跨域；
![/GuliaMall/20210217100904479.png)

跨域流程: 这个跨域请求的实现是通过预检请求实现的，先发送一个OPSTIONS探路，收到响应允许跨域后再发送真实请求
![/GuliaMall/1658460292192.jpg)

跨域的解决方案：
方法1：设置nginx包含admin和gateway
方法2：让服务器告诉预检请求能跨域
![/GuliaMall/1658460481451.jpg)
我们的解决方法：
在`gulimall-gateway`的`application.yml`中添加
``` yml
spring: 
  application:
    name: renren-fast
  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1:8848
```
在`gulimall-gateway`中定义`GulimallCorsConfiguration`类，该类用来做过滤，允许所有的请求跨域。
``` java
@Configuration // gateway
public class GulimallCorsConfiguration {

    @Bean // 添加过滤器
    public CorsWebFilter corsWebFilter(){
        // 基于url跨域，选择reactive包下的
        UrlBasedCorsConfigurationSource source=new UrlBasedCorsConfigurationSource();
        // 跨域配置信息
        CorsConfiguration corsConfiguration = new CorsConfiguration();
        // 允许跨域的头
        corsConfiguration.addAllowedHeader("*");
        // 允许跨域的请求方式
        corsConfiguration.addAllowedMethod("*");
        // 允许跨域的请求来源
        //corsConfiguration.addAllowedOrigin("*");
        corsConfiguration.addAllowedOriginPattern("*"); // 如果配置中多次解决了跨域, 可以使用这个统一处理; 否则多次解决跨域会报错(需要注释掉renren-fast中跨域的处理)
        // 是否允许携带cookie跨域
        corsConfiguration.setAllowCredentials(true);
        
      // 任意url都要进行跨域配置
        source.registerCorsConfiguration("/**",corsConfiguration);
        return new CorsWebFilter(source);
    }
}
```
重启后, 再次登录, 现在就能够正常登录了

#### 树形展示三级分类数据
在显示商品系统/分类信息的时候，出现了404异常，请求的`http://localhost:88/api/product/category/list/tree`不存在
这是因为网关上所做的路径映射不正确，映射后的路径为~http://localhost:8001/renren-fast/product/category/list/tree~
但是只有通过`http://localhost:10000/product/category/list/tree`路径才能够正常访问，所以会报404异常。

所以需要在`gulimall-gateway`的`application.yml`中添加路由规则
``` yaml
- id: product_route
  uri: lb://gulimall-product
  predicates:
    - Path=/api/product/**
  filters:
    - RewritePath=/api/(?<segment>.*),/$\{segment}
```
`gulimall-product`注册到注册中心. 在nacos中创建命名空间
![/GuliaMall/1658545998862.jpg)
`guliamll-product`中新建`bootstrap.properties`
``` properties
spring.cloud.nacos.config.server-addr=127.0.0.1:8848
spring.cloud.nacos.config.namespace=e6cd36a8-81a2-4df2-bfbc-f0524fa17664
```
`gulimall-product`的`application.ym`中添加配置中心地址
```yml
spring:
  datasource:
    username: root
    password: root
    url: jdbc:mysql://192.168.56.10:3306/gulimall_pms
    driverClassName: com.mysql.cj.jdbc.Driver

  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1:8848
  application:
    name: gulimall-product

mybatis-plus:
  # 指定mapper文件位置
  mapper-locations: classpath*:/mapper/**/*.xml # classpath指当前项目的classpath, classpath*则不指定当前项目
  # 指定主键自增
  global-config:
    db-config:
      id-type: auto

server:
  port: 10000
```
并在`gulimall-product`的启动类上使用`@EnableDiscoveryClient`注解

此时访问 `localhost:88/api/product/category/list/tree` 报 `invalid token`(非法令牌)，后台管理系统中没有登录，所以没有带令牌
原因：`gulimall-gateway`先匹配的先路由，fast是泛匹配, 与product有路由重叠，且fast匹配在前, 所以要求登录
那么就需要修改路由规则的顺序:
``` yml
spring:
  cloud:
    gateway:
      routes:
        - id: baidu_route
          uri: https://www.baidu.com
          predicates:
            - Query=url, baidu  # Query指请求参数

        - id: qq_route
          uri: https://www.qq.com
          predicates:
            - Query=url, qq

        - id: product_rout
          uri: lb://gulimall-product
          predicates:
            - Path=/api/product/**
          filters:
            - RewritePath=/api/(?<segment>.*),/$\{segment}

        - id: admin_route
          uri: lb://renren-fast # 路由给renren-fast，lb代表负载均衡
          predicates: # 什么情况下路由给它
            - Path=/api/** # 默认前端项目都带上api前缀，
          filters:
            - RewritePath=/api/(?<segment>.*),/renren-fast/$\{segment}  # 路由给renren-fast，并且把前缀替换为空, 请求到真实路径
```
此时访问`http://localhost:88/api/product/category/list/tree`就能正常访问了, 前端的`分类维护`控制台中也能正常打印了

接着继续写**前端**
结构请求的返回体
``` js
getMenus() {
  this.$http({ // http://localhost:10000/renren-fast/product/category/list/tree
    url: this.$http.adornUrl("/product/category/list/tree"),
    method: "get"
  })
    .then(({ data }) => { // success
      this.menus = data.data; // 数组内容，把数据给menus，就是给了vue实例，最后绑定到视图上
    }) //fail
    .catch(() => {});
}
```
而在data中
``` js
defaultProps: {
  children: "children",
  label: "name"
}
```


#### 删除数据
`scoped slot`（插槽）：在el-tree标签里把内容写到span标签栏里即可
修改`category.vue`的代码
``` html
<template>
  <el-tree :data="menus" :props="defaultProps" :expand-on-click-node="false" show-checkbox node-key="catId">
    <span class="custom-tree-node" slot-scope="{ node, data }">
      <span>{{ node.label }}</span>
      <span>
        <el-button
          v-if="node.level <= 2"
          type="text"
          size="mini"
          @click="() => append(data)"
        >
          Append
        </el-button>
        <el-button
          v-if="node.childNodes.length==0"
          type="text"
          size="mini"
          @click="() => remove(node, data)"
        >
          Delete
        </el-button>
      </span>
    </span>
  </el-tree>
</template>

<script>
export default {
  name: "category",
  components: {},
  directives: {},
  data() {
    return {
      menus: [],
      defaultProps: {
        children: "children",
        label: "name",
      },
    };
  },
  mounted() {},
  methods: {
    append(data) {},
    remove(node, data) {},
    getMenus() {
      this.$http({
        url: this.$http.adornUrl("/product/category/list/tree"),
        method: "get",
      }).then(({ data }) => {
        console.log("成功获取到菜单数据...", data.data);
        this.menus = data.data;
      });
    },
  },
  created() {
    this.getMenus();
  },
};
</script>

<style scoped>
</style>
```

测试删除数据, 为了比对效果, 可以在删除之前查询数据库的`pms_category`表：
``` json
POST http://localhost:88/api/product/category/delete
[1432]
// 返回结果
{
    "msg": "success",
    "code": 0
}
```
此时看数据库已经没有1432这条数据了 

但是我们删除前通常需要修改检查当前菜单是否被引用,
``` java
//修改`CategoryController`类，修改为如下代码
@RequestMapping("/delete")
  public R delete(@RequestBody Long[] catIds){
    //删除之前需要判断待删除的菜单那是否被别的地方所引用。
//		categoryService.removeByIds(Arrays.asList(catIds));
    categoryService.removeMenuByIds(Arrays.asList(catIds));

    return R.ok();
}


@Override
public void removeMenuByIds(List<Long> asList) {
    //TODO 1 检查当前的菜单是否被别的地方所引用
    baseMapper.deleteBatchIds(asList);
}
product.service.impl.CategoryServiceImpl
```

**逻辑删除**
然而多数时候，我们并不希望删除数据，而是标记它被删除了，这就是逻辑删除；
逻辑删除是mybatis-plus 的内容，会在项目中配置一些内容，告诉此项目执行delete语句时并不删除，只是标志位
可以设置show_status为0，标记它已经被删除。
mybatis-plus的逻辑删除：https://baomidou.com/pages/6b03c5/
``` yml
mybatis-plus:
  # 指定mapper文件位置
  mapper-locations: classpath*:/mapper/**/*.xml # classpath指当前项目的classpath, classpath*则不指定当前项目
  # 指定主键自增
  global-config:
    db-config:
      id-type: auto
      logic-delete-value: 1
      logic-not-delete-value: 0
```
修改`CategoryEntity`实体类，对应字段添加上`@TableLogic`，表明使用逻辑删除;

另外在`application.yml`”`文件中，设置日志级别，打印出SQL语句：
``` YML
logging:
  level:
    cn.cheakin.gulimall: debug
```
测试一下是否能够满足需要
``` json
POST http://localhost:88/api/product/category/delete
[1431]
// 返回结果
{
    "msg": "success",
    "code": 0
}
// 控制台打印
==>  Preparing: UPDATE pms_category SET show_status=0 WHERE cat_id IN ( ? ) AND show_status=1 
==> Parameters: 1000(Long)
<==    Updates: 1
```

**前端删除方法**
在`util/httpRequest.js`中，封装了一些拦截器
* http.adornParams是封装get请求的数据
* http.adornData封装post请求的数据
> ajax的get请求会被缓存，就不会请求服务器了. 所以我们在url后面拼接个时间戳，让他每次都请求服务器的请求都不同, 获取到的就是新数据了

``` html
<template>
  <div>
    <el-tree
      :data="menus"
      :props="defaultProps"
      :expand-on-click-node="false"
      show-checkbox
      node-key="catId"
      :default-expanded-keys="expandedKey"
    >
      <span class="custom-tree-node" slot-scope="{ node, data }">
        <span>{{ node.label }}</span>
        <span>
          <el-button
            v-if="node.level <= 2"
            type="text"
            size="mini"
            @click="() => append(data)"
          >
            Append
          </el-button>
          <el-button
            v-if="node.childNodes.length == 0"
            type="text"
            size="mini"
            @click="() => remove(node, data)"
          >
            Delete
          </el-button>
        </span>
      </span>
    </el-tree>
    <el-dialog title="提示" :visible.sync="dialogVisible" width="30%">
      <el-form :model="category">
        <el-form-item label="分类名称">
          <el-input v-model="category.name" autocomplete="off"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="addCategory">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: "category",
  components: {},
  directives: {},
  data() {
    return {
      dialogVisible: false,
      menus: [],
      expandedKey: [],
      category: { name: "", parentCid: 0, catLevel: 0, showStatus: 1, sort: 0 },
      defaultProps: {
        children: "children",
        label: "name",
      },
    };
  },
  mounted() {},
  methods: {
    append(data) {
      console.log("append----", data);
      this.category.parentCid = data.catId;
      this.category.catLevel = data.catLevel * 1 + 1;
      this.dialogVisible = true;
    },
    // 添加三级分类
    addCategory() {
      console.log("提交的三级分类数据", this.category);
      this.$http({
        url: this.$http.adornUrl("/product/category/save"),
        method: "post",
        data: this.$http.adornData(this.category, false),
      })
        .then(({ data }) => {
          this.$message({
            type: "success",
            message: "菜单保存成功!",
          });
          this.dialogVisible = false;
          // 刷新出新的菜单
          this.getMenus();
          this.expandedKey = [this.category.parentCid];
        })
        .catch(() => {});
    },
    remove(node, data) {
      console.log("remove---", node);
      console.log("data---", data);
      var ids = [data.catId];

      this.$confirm(`是否删除【${data.name}】当前菜单?`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.$http({
            url: this.$http.adornUrl("/product/category/delete"),
            method: "post",
            data: this.$http.adornData(ids, false),
          })
            .then(({ data }) => {
              this.$message({
                type: "success",
                message: "菜单删除成功!",
              });
              // 刷新出新的菜单
              this.getMenus();
              // 设置需要默认展开的节点
              this.expandedKey = [node.parent.data.catId];
            })
            .catch(() => {});
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "已取消删除",
          });
        });
    },
    getMenus() {
      this.$http({
        url: this.$http.adornUrl("/product/category/list/tree"),
        method: "get",
      }).then(({ data }) => {
        console.log("成功获取到菜单数据...", data.data);
        this.menus = data.data;
      });
    },
  },
  created() {
    this.getMenus();
  },
};
</script>

<style scoped>
</style>
```

#### 新增数据
使用到了ElementUI的对话框功能
``` html
<template>
  <div>
    <el-tree
      :data="menus"
      :props="defaultProps"
      :expand-on-click-node="false"
      show-checkbox
      node-key="catId"
      :default-expanded-keys="expandedKey"
    >
      <span class="custom-tree-node" slot-scope="{ node, data }">
        <span>{{ node.label }}</span>
        <span>
          <el-button
            v-if="node.level <= 2"
            type="text"
            size="mini"
            @click="() => append(data)"
          >
            Append
          </el-button>
          <el-button
            v-if="node.childNodes.length == 0"
            type="text"
            size="mini"
            @click="() => remove(node, data)"
          >
            Delete
          </el-button>
        </span>
      </span>
    </el-tree>
    <el-dialog title="提示" :visible.sync="dialogVisible" width="30%">
      <el-form :model="category">
        <el-form-item label="分类名称">
          <el-input v-model="category.name" autocomplete="off"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="addCategory">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: "category",
  components: {},
  directives: {},
  data() {
    return {
      dialogVisible: false,
      menus: [],
      expandedKey: [],
      category: { name: "", parentCid: 0, catLevel: 0, showStatus: 1, sort: 0 },
      defaultProps: {
        children: "children",
        label: "name",
      },
    };
  },
  mounted() {},
  methods: {
    append(data) {
      console.log("append----", data);
      this.category.parentCid = data.catId;
      this.category.catLevel = data.catLevel * 1 + 1;
      this.dialogVisible = true;
    },
    // 添加三级分类
    addCategory() {
      console.log("提交的三级分类数据", this.category);
      this.$http({
        url: this.$http.adornUrl("/product/category/save"),
        method: "post",
        data: this.$http.adornData(this.category, false),
      })
        .then(({ data }) => {
          this.$message({
            type: "success",
            message: "菜单保存成功!",
          });
          this.dialogVisible = false;
          // 刷新出新的菜单
          this.getMenus();
          this.expandedKey = [this.category.parentCid];
        })
        .catch(() => {});
    },
    remove(node, data) {
      console.log("remove---", node);
      console.log("data---", data);
      var ids = [data.catId];

      this.$confirm(`是否删除【${data.name}】当前菜单?`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.$http({
            url: this.$http.adornUrl("/product/category/delete"),
            method: "post",
            data: this.$http.adornData(ids, false),
          })
            .then(({ data }) => {
              this.$message({
                type: "success",
                message: "菜单删除成功!",
              });
              // 刷新出新的菜单
              this.getMenus();
              this.expandedKey = [node.parent.data.catId];
            })
            .catch(() => {});
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "已取消删除",
          });
        });
    },
    getMenus() {
      this.$http({
        url: this.$http.adornUrl("/product/category/list/tree"),
        method: "get",
      }).then(({ data }) => {
        console.log("成功获取到菜单数据...", data.data);
        this.menus = data.data;
      });
    },
  },
  created() {
    this.getMenus();
  },
};
</script>

<style scoped>
</style>
```

#### 修改分类
`CategoryController`类修改
``` java
/**
  * 信息
  */
@RequestMapping("/info/{catId}")
// @RequiresPermissions("product:category:info")
public R info(@PathVariable("catId") Long catId){
  CategoryEntity category = categoryService.getById(catId);

  return R.ok().put("data", category);
}
```
`category.vue`页面
``` html
<template>
  <div>
    <el-tree
      :data="menus"
      :props="defaultProps"
      :expand-on-click-node="false"
      show-checkbox
      node-key="catId"
      :default-expanded-keys="expandedKey"
    >
      <span class="custom-tree-node" slot-scope="{ node, data }">
        <span>{{ node.label }}</span>
        <span>
          <el-button
            v-if="node.level <= 2"
            type="text"
            size="mini"
            @click="() => append(data)"
          >
            Append
          </el-button>
          <el-button type="text" size="mini" @click="() => edit(data)">
            Edit
          </el-button>
          <el-button
            v-if="node.childNodes.length == 0"
            type="text"
            size="mini"
            @click="() => remove(node, data)"
          >
            Delete
          </el-button>
        </span>
      </span>
    </el-tree>
    <el-dialog
      :title="title"
      :visible.sync="dialogVisible"
      width="30%"
      :close-on-click-modal="false"
    >
      <el-form :model="category">
        <el-form-item label="分类名称">
          <el-input v-model="category.name" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="category.icon" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="计量单位">
          <el-input
            v-model="category.productUnit"
            autocomplete="off"
          ></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitData">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: "category",
  components: {},
  directives: {},
  data() {
    return {
      title: "",
      dialogType: "", //edit,add
      dialogVisible: false,
      menus: [],
      expandedKey: [],
      category: {
        name: "",
        parentCid: 0,
        catLevel: 0,
        showStatus: 1,
        sort: 0,
        icon: "",
        productUnit: "",
        catId: null,
      },
      defaultProps: {
        children: "children",
        label: "name",
      },
    };
  },
  mounted() {},
  methods: {
    append(data) {
      console.log("append----", data);
      this.dialogType = "add";
      this.title = "添加分类";
      this.category.parentCid = data.catId;
      this.category.catLevel = data.catLevel * 1 + 1;
      this.category.catId = null;
      this.category.name = null;
      this.category.icon = "";
      this.category.productUnit = "";
      this.category.sort = 0;
      this.category.showStatus = 1;
      this.dialogVisible = true;
    },
    // 添加三级分类
    addCategory() {
      console.log("提交的三级分类数据", this.category);
      this.$http({
        url: this.$http.adornUrl("/product/category/save"),
        method: "post",
        data: this.$http.adornData(this.category, false),
      })
        .then(({ data }) => {
          this.$message({
            type: "success",
            message: "菜单保存成功!",
          });
          this.dialogVisible = false;
          // 刷新出新的菜单
          this.getMenus();
          this.expandedKey = [this.category.parentCid];
        })
        .catch(() => {});
    },
    // 修改三级分类数据
    editCategory() {
      // 需要修改什么就解构什么
      var { catId, name, icon, productUnit } = this.category;
      this.$http({
        url: this.$http.adornUrl("/product/category/update"),
        method: "post",
        data: this.$http.adornData({ catId, name, icon, productUnit }, false),
      })
        .then(({ data }) => {
          this.$message({
            type: "success",
            message: "菜单修改成功!",
          });
          // 关闭对话框
          this.dialogVisible = false;
          // 刷新出新的菜单
          this.getMenus();
          // 设置需要默认展开的菜单
          this.expandedKey = [this.category.parentCid];
        })
        .catch(() => {});
    },
    edit(data) {
      console.log("要修改的数据", data);
      this.dialogType = "edit";
      this.title = "修改分类";
      // 发送请求获取节点最新的数据
      this.$http({
        url: this.$http.adornUrl(`/product/category/info/${data.catId}`),
        method: "get",
      }).then(({ data }) => {
        // 请求成功
        console.log("要回显得数据", data);
        this.category.name = data.data.name;
        this.category.catId = data.data.catId;
        this.category.icon = data.data.icon;
        this.category.productUnit = data.data.productUnit;
        this.category.parentCid = data.data.parentCid;
        this.dialogVisible = true;
      });
    },
    submitData() {
      if (this.dialogType == "add") {
        this.addCategory();
      }
      if (this.dialogType == "edit") {
        this.editCategory();
      }
    },
    remove(node, data) {
      console.log("remove---", node);
      console.log("data---", data);
      var ids = [data.catId];

      this.$confirm(`是否删除【${data.name}】当前菜单?`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.$http({
            url: this.$http.adornUrl("/product/category/delete"),
            method: "post",
            data: this.$http.adornData(ids, false),
          })
            .then(({ data }) => {
              this.$message({
                type: "success",
                message: "菜单删除成功!",
              });
              // 刷新出新的菜单
              this.getMenus();
              this.expandedKey = [node.parent.data.catId];
            })
            .catch(() => {});
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "已取消删除",
          });
        });
    },
    getMenus() {
      this.$http({
        url: this.$http.adornUrl("/product/category/list/tree"),
        method: "get",
      }).then(({ data }) => {
        console.log("成功获取到菜单数据...", data.data);
        this.menus = data.data;
      });
    },
  },
  created() {
    this.getMenus();
  },
};
</script>

<style scoped>
</style>
```

#### 拖拽效果
为了防止误操作，我们通过edit把拖拽功能开启后才能进行操作。所以添加`switch`标签，操作是否可以拖拽。

但是现在存在的一个问题是每次拖拽的时候，都会发送请求，更新数据库这样频繁的与数据库交互
现在想要实现一个拖拽过程中不更新数据库，拖拽完成后，统一提交拖拽后的数据。
`<el-button v-if="draggable" @click="batchSave">批量保存</el-button>`
`category.vue`页面
``` html
<template>
  <div>
    <el-switch
      v-model="draggable"
      active-text="开启拖拽"
      inactive-text="关闭拖拽"
    >
    </el-switch>
    <el-button @click="batchSave" v-if="draggable">批量保存</el-button>
    <el-tree
      @node-drop="handleDrop"
      :data="menus"
      :props="defaultProps"
      :expand-on-click-node="false"
      show-checkbox
      node-key="catId"
      :default-expanded-keys="expandedKey"
      :draggable="draggable"
      :allow-drop="allowDrop"
    >
      <span class="custom-tree-node" slot-scope="{ node, data }">
        <span>{{ node.label }}</span>
        <span>
          <el-button
            v-if="node.level <= 2"
            type="text"
            size="mini"
            @click="() => append(data)"
          >
            Append
          </el-button>
          <el-button type="text" size="mini" @click="() => edit(data)">
            Edit
          </el-button>
          <el-button
            v-if="node.childNodes.length == 0"
            type="text"
            size="mini"
            @click="() => remove(node, data)"
          >
            Delete
          </el-button>
        </span>
      </span>
    </el-tree>
    <el-dialog
      :title="title"
      :visible.sync="dialogVisible"
      width="30%"
      :close-on-click-modal="false"
    >
      <el-form :model="category">
        <el-form-item label="分类名称">
          <el-input v-model="category.name" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="category.icon" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="计量单位">
          <el-input
            v-model="category.productUnit"
            autocomplete="off"
          ></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitData">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: "category",
  components: {},
  directives: {},
  data() {
    return {
      pCid: [],
      draggable: false,
      updateNodes: [],
      maxLevel: 0,
      title: "",
      dialogType: "", //edit,add
      dialogVisible: false,
      menus: [],
      expandedKey: [],
      category: {
        name: "",
        parentCid: 0,
        catLevel: 0,
        showStatus: 1,
        sort: 0,
        icon: "",
        productUnit: "",
        catId: null,
      },
      defaultProps: {
        children: "children",
        label: "name",
      },
    };
  },
  mounted() {},
  methods: {
    batchSave() {
      this.$http({
        url: this.$http.adornUrl("/product/category/update/sort"),
        method: "post",
        data: this.$http.adornData(this.updateNodes, false),
      })
        .then(({ data }) => {
          this.$message({
            type: "success",
            message: "菜单顺序修改成功!",
          });
          // 刷新出新的菜单
          this.getMenus();
          // 设置需要默认展开的菜单
          this.expandedKey = this.pCid;
          this.updateNodes = [];
          this.maxLevel = 0;
          // this.pCid = 0;
        })
        .catch(() => {});
    },
    handleDrop(draggingNode, dropNode, dropType, ev) {
      console.log("handleDrop: ", draggingNode, dropNode, dropType);

      //1 当前节点最新的父节点
      let pCid = 0;
      let siblings = null;
      if (dropType == "before" || dropType == "after") {
        pCid =
          dropNode.parent.data.catId == undefined
            ? 0
            : dropNode.parent.data.catId;
        siblings = dropNode.parent.childNodes;
      } else {
        pCid = dropNode.data.catId;
        siblings = dropNode.childNodes;
      }
      this.pCid.push(pCid);
      //2 当前拖拽节点的最新顺序
      for (let i = 0; i < siblings.length; i++) {
        if (siblings[i].data.catId == draggingNode.data.catId) {
          // 如果遍历的是当前正在拖拽的节点
          let catLevel = draggingNode.level;
          if (siblings[i].level != draggingNode.level) {
            // 当前节点的层级发生变化
            catLevel = siblings[i].level;
            // 修改他子节点的层级
            this.updateChildNodeLevlel(siblings[i]);
          }
          this.updateNodes.push({
            catId: siblings[i].data.catId,
            sort: i,
            parentCid: pCid,
            catLevel: catLevel,
          });
        } else {
          this.updateNodes.push({ catId: siblings[i].data.catId, sort: i });
        }
      }
      //3 当前拖拽节点的最新层级
      console.log("updateNodes", this.updateNodes);
    },
    updateChildNodeLevlel(node) {
      if (node.childNodes.length > 0) {
        for (let i = 0; i < node.childNodes.length; i++) {
          var cNode = node.childNodes[i].data;
          this.updateNodes.push({
            catId: cNode.catId,
            catLevel: node.childNodes[i].level,
          });
          this.updateChildNodeLevlel(node.childNodes[i]);
        }
      }
    },
    allowDrop(draggingNode, dropNode, type) {
      //1 被拖动的当前节点以及所在的父节点总层数不能大于3

      //1 被拖动的当前节点总层数
      console.log("allowDrop:", draggingNode, dropNode, type);

      var level = this.countNodeLevel(draggingNode);

      // 当前正在拖动的节点+父节点所在的深度不大于3即可
      let deep = Math.abs(this.maxLevel - draggingNode.level) + 1;
      console.log("深度:", deep);

      // this.maxLevel
      if (type == "innner") {
        // console.log(
        //   `this.maxLevel: ${this.maxLevel}; draggingNode.data.catLevel:${draggingNode.data.catLevel};dropNode.level: ${dropNode.level}`
        // );
        return deep + dropNode.level <= 3;
      } else {
        return deep + dropNode.parent.level <= 3;
      }
    },
    countNodeLevel(node) {
      // 找到所有子节点，求出最大深度
      if (node.childNodes != null && node.childNodes.length > 0) {
        for (let i = 0; i < node.childNodes.length; i++) {
          if (node.childNodes[i].level > this.maxLevel) {
            this.maxLevel = node.childNodes[i].level;
          }
          this.countNodeLevel(node.childNodes);
        }
      }
    },
    append(data) {
      console.log("append----", data);
      this.dialogType = "add";
      this.title = "添加分类";
      this.category.parentCid = data.catId;
      this.category.catLevel = data.catLevel * 1 + 1;
      this.category.catId = null;
      this.category.name = null;
      this.category.icon = "";
      this.category.productUnit = "";
      this.category.sort = 0;
      this.category.showStatus = 1;
      this.dialogVisible = true;
    },
    // 添加三级分类
    addCategory() {
      console.log("提交的三级分类数据", this.category);
      this.$http({
        url: this.$http.adornUrl("/product/category/save"),
        method: "post",
        data: this.$http.adornData(this.category, false),
      })
        .then(({ data }) => {
          this.$message({
            type: "success",
            message: "菜单保存成功!",
          });
          this.dialogVisible = false;
          // 刷新出新的菜单
          this.getMenus();
          this.expandedKey = [this.category.parentCid];
        })
        .catch(() => {});
    },
    // 修改三级分类数据
    editCategory() {
      // 需要修改什么就解构什么
      var { catId, name, icon, productUnit } = this.category;
      this.$http({
        url: this.$http.adornUrl("/product/category/update"),
        method: "post",
        data: this.$http.adornData({ catId, name, icon, productUnit }, false),
      })
        .then(({ data }) => {
          this.$message({
            type: "success",
            message: "菜单修改成功!",
          });
          // 关闭对话框
          this.dialogVisible = false;
          // 刷新出新的菜单
          this.getMenus();
          // 设置需要默认展开的菜单
          this.expandedKey = [this.category.parentCid];
        })
        .catch(() => {});
    },
    edit(data) {
      console.log("要修改的数据", data);
      this.dialogType = "edit";
      this.title = "修改分类";
      // 发送请求获取节点最新的数据
      this.$http({
        url: this.$http.adornUrl(`/product/category/info/${data.catId}`),
        method: "get",
      }).then(({ data }) => {
        // 请求成功
        console.log("要回显得数据", data);
        this.category.name = data.data.name;
        this.category.catId = data.data.catId;
        this.category.icon = data.data.icon;
        this.category.productUnit = data.data.productUnit;
        this.category.parentCid = data.data.parentCid;
        this.dialogVisible = true;
      });
    },
    submitData() {
      if (this.dialogType == "add") {
        this.addCategory();
      }
      if (this.dialogType == "edit") {
        this.editCategory();
      }
    },
    remove(node, data) {
      console.log("remove---", node);
      console.log("data---", data);
      var ids = [data.catId];

      this.$confirm(`是否删除【${data.name}】当前菜单?`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.$http({
            url: this.$http.adornUrl("/product/category/delete"),
            method: "post",
            data: this.$http.adornData(ids, false),
          })
            .then(({ data }) => {
              this.$message({
                type: "success",
                message: "菜单删除成功!",
              });
              // 刷新出新的菜单
              this.getMenus();
              this.expandedKey = [node.parent.data.catId];
            })
            .catch(() => {});
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "已取消删除",
          });
        });
    },
    getMenus() {
      this.$http({
        url: this.$http.adornUrl("/product/category/list/tree"),
        method: "get",
      }).then(({ data }) => {
        console.log("成功获取到菜单数据...", data.data);
        this.menus = data.data;
      });
    },
  },
  created() {
    this.getMenus();
  },
};
</script>

<style scoped>
</style>
```
`CategoryController`类增加
``` java
/**
 * 修改分类
 */
@RequestMapping("/update/sort")
// @RequiresPermissions("product:category:update")
public R update(@RequestBody CategoryEntity[] category){
  categoryService.updateBatchById(Arrays.asList(category));
  return R.ok();
}
```

#### 批量删除
`category.vue`页面
``` html
<template>
  <div>
    <el-switch
      v-model="draggable"
      active-text="开启拖拽"
      inactive-text="关闭拖拽"
    >
    </el-switch>
    <el-button @click="batchSave" v-if="draggable">批量保存</el-button>
    <el-button type="danger" @click="batchDelete">批量删除</el-button>
    <el-tree
      @node-drop="handleDrop"
      :data="menus"
      :props="defaultProps"
      :expand-on-click-node="false"
      show-checkbox
      node-key="catId"
      :default-expanded-keys="expandedKey"
      :draggable="draggable"
      :allow-drop="allowDrop"
      ref="menuTree"
    >
      <span class="custom-tree-node" slot-scope="{ node, data }">
        <span>{{ node.label }}</span>
        <span>
          <el-button
            v-if="node.level <= 2"
            type="text"
            size="mini"
            @click="() => append(data)"
          >
            Append
          </el-button>
          <el-button type="text" size="mini" @click="() => edit(data)">
            Edit
          </el-button>
          <el-button
            v-if="node.childNodes.length == 0"
            type="text"
            size="mini"
            @click="() => remove(node, data)"
          >
            Delete
          </el-button>
        </span>
      </span>
    </el-tree>
    <el-dialog
      :title="title"
      :visible.sync="dialogVisible"
      width="30%"
      :close-on-click-modal="false"
    >
      <el-form :model="category">
        <el-form-item label="分类名称">
          <el-input v-model="category.name" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="category.icon" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="计量单位">
          <el-input
            v-model="category.productUnit"
            autocomplete="off"
          ></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitData">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: "category",
  components: {},
  directives: {},
  data() {
    return {
      pCid: [],
      draggable: false,
      updateNodes: [],
      maxLevel: 0,
      title: "",
      dialogType: "", //edit,add
      dialogVisible: false,
      menus: [],
      expandedKey: [],
      category: {
        name: "",
        parentCid: 0,
        catLevel: 0,
        showStatus: 1,
        sort: 0,
        icon: "",
        productUnit: "",
        catId: null,
      },
      defaultProps: {
        children: "children",
        label: "name",
      },
    };
  },
  mounted() {},
  methods: {
    // 批量删除
    batchDelete() {
      let catIds = [];
      let checkedNodes = this.$refs.menuTree.getCheckedNodes();
      console.log("被选中的元素", checkedNodes);
      for (let i = 0; i < checkedNodes.length; i++) {
        catIds.push(checkedNodes[i].catId);
      }

      this.$confirm(`是否批量删除【${catIds}】菜单?`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.$http({
            url: this.$http.adornUrl("/product/category/delete"),
            method: "post",
            data: this.$http.adornData(catIds, false),
          })
            .then(({ data }) => {
              this.$message({
                type: "success",
                message: "菜单批量删除成功!",
              });
              // 刷新出新的菜单
              this.getMenus();
            })
            .catch(() => {});
        })
        .catch(() => {});
    },
    // 批量修改
    batchSave() {
      this.$http({
        url: this.$http.adornUrl("/product/category/update/sort"),
        method: "post",
        data: this.$http.adornData(this.updateNodes, false),
      })
        .then(({ data }) => {
          this.$message({
            type: "success",
            message: "菜单顺序修改成功!",
          });
          // 刷新出新的菜单
          this.getMenus();
          // 设置需要默认展开的菜单
          this.expandedKey = this.pCid;
          this.updateNodes = [];
          this.maxLevel = 0;
          // this.pCid = 0;
        })
        .catch(() => {});
    },
    handleDrop(draggingNode, dropNode, dropType, ev) {
      console.log("handleDrop: ", draggingNode, dropNode, dropType);

      //1 当前节点最新的父节点
      let pCid = 0;
      let siblings = null;
      if (dropType == "before" || dropType == "after") {
        pCid =
          dropNode.parent.data.catId == undefined
            ? 0
            : dropNode.parent.data.catId;
        siblings = dropNode.parent.childNodes;
      } else {
        pCid = dropNode.data.catId;
        siblings = dropNode.childNodes;
      }
      this.pCid.push(pCid);
      //2 当前拖拽节点的最新顺序
      for (let i = 0; i < siblings.length; i++) {
        if (siblings[i].data.catId == draggingNode.data.catId) {
          // 如果遍历的是当前正在拖拽的节点
          let catLevel = draggingNode.level;
          if (siblings[i].level != draggingNode.level) {
            // 当前节点的层级发生变化
            catLevel = siblings[i].level;
            // 修改他子节点的层级
            this.updateChildNodeLevlel(siblings[i]);
          }
          this.updateNodes.push({
            catId: siblings[i].data.catId,
            sort: i,
            parentCid: pCid,
            catLevel: catLevel,
          });
        } else {
          this.updateNodes.push({ catId: siblings[i].data.catId, sort: i });
        }
      }
      //3 当前拖拽节点的最新层级
      console.log("updateNodes", this.updateNodes);
    },
    updateChildNodeLevlel(node) {
      if (node.childNodes.length > 0) {
        for (let i = 0; i < node.childNodes.length; i++) {
          var cNode = node.childNodes[i].data;
          this.updateNodes.push({
            catId: cNode.catId,
            catLevel: node.childNodes[i].level,
          });
          this.updateChildNodeLevlel(node.childNodes[i]);
        }
      }
    },
    allowDrop(draggingNode, dropNode, type) {
      //1 被拖动的当前节点以及所在的父节点总层数不能大于3

      //1 被拖动的当前节点总层数
      console.log("allowDrop:", draggingNode, dropNode, type);

      var level = this.countNodeLevel(draggingNode);

      // 当前正在拖动的节点+父节点所在的深度不大于3即可
      let deep = Math.abs(this.maxLevel - draggingNode.level) + 1;
      console.log("深度:", deep);

      // this.maxLevel
      if (type == "innner") {
        // console.log(
        //   `this.maxLevel: ${this.maxLevel}; draggingNode.data.catLevel:${draggingNode.data.catLevel};dropNode.level: ${dropNode.level}`
        // );
        return deep + dropNode.level <= 3;
      } else {
        return deep + dropNode.parent.level <= 3;
      }
    },
    countNodeLevel(node) {
      // 找到所有子节点，求出最大深度
      if (node.childNodes != null && node.childNodes.length > 0) {
        for (let i = 0; i < node.childNodes.length; i++) {
          if (node.childNodes[i].level > this.maxLevel) {
            this.maxLevel = node.childNodes[i].level;
          }
          this.countNodeLevel(node.childNodes);
        }
      }
    },
    append(data) {
      console.log("append----", data);
      this.dialogType = "add";
      this.title = "添加分类";
      this.category.parentCid = data.catId;
      this.category.catLevel = data.catLevel * 1 + 1;
      this.category.catId = null;
      this.category.name = null;
      this.category.icon = "";
      this.category.productUnit = "";
      this.category.sort = 0;
      this.category.showStatus = 1;
      this.dialogVisible = true;
    },
    // 添加三级分类
    addCategory() {
      console.log("提交的三级分类数据", this.category);
      this.$http({
        url: this.$http.adornUrl("/product/category/save"),
        method: "post",
        data: this.$http.adornData(this.category, false),
      })
        .then(({ data }) => {
          this.$message({
            type: "success",
            message: "菜单保存成功!",
          });
          this.dialogVisible = false;
          // 刷新出新的菜单
          this.getMenus();
          this.expandedKey = [this.category.parentCid];
        })
        .catch(() => {});
    },
    // 修改三级分类数据
    editCategory() {
      var { catId, name, icon, productUnit } = this.category;
      this.$http({
        url: this.$http.adornUrl("/product/category/update"),
        method: "post",
        data: this.$http.adornData({ catId, name, icon, productUnit }, false),
      })
        .then(({ data }) => {
          this.$message({
            type: "success",
            message: "菜单修改成功!",
          });
          // 关闭对话框
          this.dialogVisible = false;
          // 刷新出新的菜单
          this.getMenus();
          // 设置需要默认展开的菜单
          this.expandedKey = [this.category.parentCid];
        })
        .catch(() => {});
    },
    edit(data) {
      console.log("要修改的数据", data);
      this.dialogType = "edit";
      this.title = "修改分类";
      // 发送请求获取节点最新的数据
      this.$http({
        url: this.$http.adornUrl(`/product/category/info/${data.catId}`),
        method: "get",
      }).then(({ data }) => {
        // 请求成功
        console.log("要回显得数据", data);
        this.category.name = data.data.name;
        this.category.catId = data.data.catId;
        this.category.icon = data.data.icon;
        this.category.productUnit = data.data.productUnit;
        this.category.parentCid = data.data.parentCid;
        this.dialogVisible = true;
      });
    },
    submitData() {
      if (this.dialogType == "add") {
        this.addCategory();
      }
      if (this.dialogType == "edit") {
        this.editCategory();
      }
    },
    remove(node, data) {
      console.log("remove---", node);
      console.log("data---", data);
      var ids = [data.catId];

      this.$confirm(`是否删除【${data.name}】当前菜单?`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.$http({
            url: this.$http.adornUrl("/product/category/delete"),
            method: "post",
            data: this.$http.adornData(ids, false),
          })
            .then(({ data }) => {
              this.$message({
                type: "success",
                message: "菜单删除成功!",
              });
              // 刷新出新的菜单
              this.getMenus();
              this.expandedKey = [node.parent.data.catId];
            })
            .catch(() => {});
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "已取消删除",
          });
        });
    },
    getMenus() {
      this.$http({
        url: this.$http.adornUrl("/product/category/list/tree"),
        method: "get",
      }).then(({ data }) => {
        console.log("成功获取到菜单数据...", data.data);
        this.menus = data.data;
      });
    },
  },
  created() {
    this.getMenus();
  },
};
</script>

<style scoped>
</style>
```
`CategoryController`类修改
``` java
@RequestMapping("/delete")
// @RequiresPermissions("product:category:delete")
public R delete(@RequestBody Long[] catIds){
  categoryService.removeMenuByIds(Arrays.asList(catIds));
  return R.ok();
}
```

### 品牌管理
#### 使用逆向工程的前后端代码
![/GuliaMall/1658627183766.jpg)

将逆向工程product得到的resources\src\views\modules\product文件拷贝到renren-fast-vue/src/views/modules/product目录下，也就是下面的两个文件
- `brand.vue` ： 显示的表单
- `brand-add-or-update.vue`：添加和更改功能
![/GuliaMall/1658627610954.jpg)

![/GuliaMall/1658627866574.jpg)
但是显示的页面没有新增和删除功能，这是因为权限控制的原因，
它是在`renren-fast-vue\src\utils\index.js`中定义，暂时将它设置为返回值为true，即可显示添加和删除功能。
``` js
/**
 * 是否有权限
 * @param {*} key
 */
export function isAuth (key) {
  // return JSON.parse(sessionStorage.getItem('permissions') || '[]').indexOf(key) !== -1 || false
  return true
}
```
再次刷新页面能够看到，按钮已经出现了：
![/GuliaMall/1658628024009.jpg)
进行添加 测试成功， 进行修改 也会自动回显

#### 效果优化与快速显示开关
`build/webpack.base.conf.js` 中注释掉`createLintingRule()`函数体，不进行lint语法检查
``` js
const createLintingRule = () => ({
  /* test: /\.(js|vue)$/,
  loader: 'eslint-loader',
  enforce: 'pre',
  include: [resolve('src'), resolve('test')],
  options: {
    formatter: require('eslint-friendly-formatter'),
    emitWarning: !config.dev.showEslintErrorsInOverlay
  } */
})
```

使用ElementUI的开关状态,修改`brand.vue`页面
``` html
<template>
  <div class="mod-config">
    <el-form
      :inline="true"
      :model="dataForm"
      @keyup.enter.native="getDataList()"
    >
      <el-form-item>
        <el-input
          v-model="dataForm.key"
          placeholder="参数名"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item>
        <el-button @click="getDataList()">查询</el-button>
        <el-button
          v-if="isAuth('product:brand:save')"
          type="primary"
          @click="addOrUpdateHandle()"
          >新增</el-button
        >
        <el-button
          v-if="isAuth('product:brand:delete')"
          type="danger"
          @click="deleteHandle()"
          :disabled="dataListSelections.length <= 0"
          >批量删除</el-button
        >
      </el-form-item>
    </el-form>
    <el-table
      :data="dataList"
      border
      v-loading="dataListLoading"
      @selection-change="selectionChangeHandle"
      style="width: 100%"
    >
      <el-table-column
        type="selection"
        header-align="center"
        align="center"
        width="50"
      >
      </el-table-column>
      <el-table-column
        prop="brandId"
        header-align="center"
        align="center"
        label="品牌id"
      >
      </el-table-column>
      <el-table-column
        prop="name"
        header-align="center"
        align="center"
        label="品牌名"
      >
      </el-table-column>
      <el-table-column
        prop="logo"
        header-align="center"
        align="center"
        label="品牌logo地址"
      >
      </el-table-column>
      <el-table-column
        prop="descript"
        header-align="center"
        align="center"
        label="介绍"
      >
      </el-table-column>
      <el-table-column
        prop="showStatus"
        header-align="center"
        align="center"
        label="显示状态"
      >
        <template slot-scope="scope">
          <el-switch
            v-model="scope.row.showStatus"
            active-color="#13ce66"
            inactive-color="#ff4949"
            :active-value="1"
            :inactive-value="0"
            @change="updateBrandStatus(scope.row)"
          >
          </el-switch>
        </template>
      </el-table-column>
      <el-table-column
        prop="firstLetter"
        header-align="center"
        align="center"
        label="检索首字母"
      >
      </el-table-column>
      <el-table-column
        prop="sort"
        header-align="center"
        align="center"
        label="排序"
      >
      </el-table-column>
      <el-table-column
        fixed="right"
        header-align="center"
        align="center"
        width="150"
        label="操作"
      >
        <template slot-scope="scope">
          <el-button
            type="text"
            size="small"
            @click="addOrUpdateHandle(scope.row.brandId)"
            >修改</el-button
          >
          <el-button
            type="text"
            size="small"
            @click="deleteHandle(scope.row.brandId)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      @size-change="sizeChangeHandle"
      @current-change="currentChangeHandle"
      :current-page="pageIndex"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pageSize"
      :total="totalPage"
      layout="total, sizes, prev, pager, next, jumper"
    >
    </el-pagination>
    <!-- 弹窗, 新增 / 修改 -->
    <add-or-update
      v-if="addOrUpdateVisible"
      ref="addOrUpdate"
      @refreshDataList="getDataList"
    ></add-or-update>
  </div>
</template>

<script>
import AddOrUpdate from "./brand-add-or-update";
export default {
  data() {
    return {
      dataForm: {
        key: "",
      },
      dataList: [],
      pageIndex: 1,
      pageSize: 10,
      totalPage: 0,
      dataListLoading: false,
      dataListSelections: [],
      addOrUpdateVisible: false,
    };
  },
  components: {
    AddOrUpdate,
  },
  activated() {
    this.getDataList();
  },
  methods: {
    updateBrandStatus(data){
      console.log("最新信息",data);
      let {brandId,showStatus} = data;
       this.$http({
        url: this.$http.adornUrl("/product/brand/update"),
        method: "post",
        data: this.$http.adornData({brandId,showStatus:showStatus},false)
      }).then(({ data }) => {
       this.$message({
         type:"success",
         message:"状态更新成功"
       })
      });
    },
    // 获取数据列表
    getDataList() {
      this.dataListLoading = true;
      this.$http({
        url: this.$http.adornUrl("/product/brand/list"),
        method: "get",
        params: this.$http.adornParams({
          page: this.pageIndex,
          limit: this.pageSize,
          key: this.dataForm.key,
        }),
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.dataList = data.page.list;
          this.totalPage = data.page.totalCount;
        } else {
          this.dataList = [];
          this.totalPage = 0;
        }
        this.dataListLoading = false;
      });
    },
    // 每页数
    sizeChangeHandle(val) {
      this.pageSize = val;
      this.pageIndex = 1;
      this.getDataList();
    },
    // 当前页
    currentChangeHandle(val) {
      this.pageIndex = val;
      this.getDataList();
    },
    // 多选
    selectionChangeHandle(val) {
      this.dataListSelections = val;
    },
    // 新增 / 修改
    addOrUpdateHandle(id) {
      this.addOrUpdateVisible = true;
      this.$nextTick(() => {
        this.$refs.addOrUpdate.init(id);
      });
    },
    // 删除
    deleteHandle(id) {
      var ids = id
        ? [id]
        : this.dataListSelections.map((item) => {
            return item.brandId;
          });
      this.$confirm(
        `确定对[id=${ids.join(",")}]进行[${id ? "删除" : "批量删除"}]操作?`,
        "提示",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }
      ).then(() => {
        this.$http({
          url: this.$http.adornUrl("/product/brand/delete"),
          method: "post",
          data: this.$http.adornData(ids, false),
        }).then(({ data }) => {
          if (data && data.code === 0) {
            this.$message({
              message: "操作成功",
              type: "success",
              duration: 1500,
              onClose: () => {
                this.getDataList();
              },
            });
          } else {
            this.$message.error(data.msg);
          }
        });
      });
    },
  },
};
</script>
```
修改`brand-add-or-update.vue`页面
``` html
<template>
  <el-dialog
    :title="!dataForm.id ? '新增' : '修改'"
    :close-on-click-modal="false"
    :visible.sync="visible"
  >
    <el-form
      :model="dataForm"
      :rules="dataRule"
      ref="dataForm"
      @keyup.enter.native="dataFormSubmit()"
      label-width="140px"
    >
      <el-form-item label="品牌名" prop="name">
        <el-input v-model="dataForm.name" placeholder="品牌名"></el-input>
      </el-form-item>
      <el-form-item label="品牌logo地址" prop="logo">
        <el-input v-model="dataForm.logo" placeholder="品牌logo地址"></el-input>
      </el-form-item>
      <el-form-item label="介绍" prop="descript">
        <el-input v-model="dataForm.descript" placeholder="介绍"></el-input>
      </el-form-item>
      <el-form-item label="显示状态" prop="showStatus">
        <el-switch
          v-model="dataForm.showStatus"
          active-color="#13ce66"
          inactive-color="#ff4949"
        >
        </el-switch>
      </el-form-item>
      <el-form-item label="检索首字母" prop="firstLetter">
        <el-input
          v-model="dataForm.firstLetter"
          placeholder="检索首字母"
        ></el-input>
      </el-form-item>
      <el-form-item label="排序" prop="sort">
        <el-input v-model="dataForm.sort" placeholder="排序"></el-input>
      </el-form-item>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="dataFormSubmit()">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  data() {
    return {
      visible: false,
      dataForm: {
        brandId: 0,
        name: "",
        logo: "",
        descript: "",
        showStatus: "",
        firstLetter: "",
        sort: "",
      },
      dataRule: {
        name: [{ required: true, message: "品牌名不能为空", trigger: "blur" }],
        logo: [
          { required: true, message: "品牌logo地址不能为空", trigger: "blur" },
        ],
        descript: [
          { required: true, message: "介绍不能为空", trigger: "blur" },
        ],
        showStatus: [
          {
            required: true,
            message: "显示状态[0-不显示；1-显示]不能为空",
            trigger: "blur",
          },
        ],
        firstLetter: [
          { required: true, message: "检索首字母不能为空", trigger: "blur" },
        ],
        sort: [{ required: true, message: "排序不能为空", trigger: "blur" }],
      },
    };
  },
  methods: {
    init(id) {
      this.dataForm.brandId = id || 0;
      this.visible = true;
      this.$nextTick(() => {
        this.$refs["dataForm"].resetFields();
        if (this.dataForm.brandId) {
          this.$http({
            url: this.$http.adornUrl(
              `/product/brand/info/${this.dataForm.brandId}`
            ),
            method: "get",
            params: this.$http.adornParams(),
          }).then(({ data }) => {
            if (data && data.code === 0) {
              this.dataForm.name = data.brand.name;
              this.dataForm.logo = data.brand.logo;
              this.dataForm.descript = data.brand.descript;
              this.dataForm.showStatus = data.brand.showStatus;
              this.dataForm.firstLetter = data.brand.firstLetter;
              this.dataForm.sort = data.brand.sort;
            }
          });
        }
      });
    },
    // 表单提交
    dataFormSubmit() {
      this.$refs["dataForm"].validate((valid) => {
        if (valid) {
          this.$http({
            url: this.$http.adornUrl(
              `/product/brand/${!this.dataForm.brandId ? "save" : "update"}`
            ),
            method: "post",
            data: this.$http.adornData({
              brandId: this.dataForm.brandId || undefined,
              name: this.dataForm.name,
              logo: this.dataForm.logo,
              descript: this.dataForm.descript,
              showStatus: this.dataForm.showStatus,
              firstLetter: this.dataForm.firstLetter,
              sort: this.dataForm.sort,
            }),
          }).then(({ data }) => {
            if (data && data.code === 0) {
              this.$message({
                message: "操作成功",
                type: "success",
                duration: 1500,
                onClose: () => {
                  this.visible = false;
                  this.$emit("refreshDataList");
                },
              });
            } else {
              this.$message.error(data.msg);
            }
          });
        }
      });
    },
  },
};
</script>
```

#### 添加上传
![/GuliaMall/1658629845599.jpg)
这里我们选择将图片放置到阿里云上，使用对象存储。官方文档: https://help.aliyun.com/document_detail/31827.html
阿里云上使使用对象存储方式：
![/GuliaMall/1658629191833.jpg)
创建Bucket（作为项目）
![/GuliaMall/1658629448316.jpg)

实际上我们可以在程序中设置自动上传图片到阿里云对象存储。

上传的账号信息存储在应用服务器
上传先找应用服务器要一个policy上传策略，生成防伪签名
使用代码上传, 查看阿里云关于文件上传的帮助： https://help.aliyun.com/document_detail/32009.html?spm=a2c4g.11186623.6.768.549d59aaWuZMGJ

##### 普通方式
1. 添加依赖包
    在Maven项目中加入依赖项（推荐方式）
    在 Maven 工程中使用 OSS Java SDK，只需在 pom.xml 中加入相应依赖即可(`gulimall-product`): 
    ``` xml
    <dependency>
      <groupId>com.aliyun.oss</groupId>
      <artifactId>aliyun-sdk-oss</artifactId>
      <version>3.15.0</version>
    </dependency>
    ```
2. 上传文件流
    以下代码用于上传文件流(敏感信息已失效)：
    ``` java
    @Test
    public void testUpload() throws FileNotFoundException {
        // Endpoint以杭州为例，其它Region请按实际情况填写。
        String endpoint = "oss-cn-shanghai.aliyuncs.com";
        // 云账号AccessKey有所有API访问权限，建议遵循阿里云安全最佳实践，创建并使用RAM子账号进行API访问或日常运维，请登录 https://ram.console.aliyun.com 创建。
        String accessKeyId = "LTAI4G4W1RA4JXz2QhoDwHhi";
        String accessKeySecret = "R99lmDOJumF2x43ZBKT259Qpe70Oxw";

        // 创建OSSClient实例。
        OSS ossClient = new OSSClientBuilder().build(endpoint, accessKeyId, accessKeySecret);

        // 上传文件流。
        InputStream inputStream = new FileInputStream("C:\\Users\\Administrator\\Pictures\\timg.jpg");
        ossClient.putObject("gulimall-images", "time.jpg", inputStream);

        // 关闭OSSClient。
        ossClient.shutdown();
        System.out.println("上传成功.");
    }
    ```
    > 上面代码的信息可以通过如下查找：
    > endpoint的取值：点击概览就可以看到你的endpoint信息，endpoint在
    > 这里就是上海等地区，如 oss-cn-qingdao.aliyuncs.com
    > bucket域名：就是签名加上bucket，如gulimall-fermhan.oss-cn-qingdao.aliyuncs.com
    > accessKeyId和accessKeySecret需要创建一个RAM账号, 创建用户完毕后，会得到一个`AccessKey ID`和`AccessKeySecret`, 另外还需要添加OSS访问控制权限

##### SpringCloud Alibaba - OSS 配置方式
  更为简单的使用方式，是使用SpringCloud Alibaba, 官方文档: https://github.com/alibaba/aliyun-spring-boot/tree/master/aliyun-spring-boot-samples/aliyun-oss-spring-boot-sample
  1. `gulimall-common`中导入maven依赖, 方便其他微服务使用
      ``` xml
      <!--阿里云 OSS-->
      <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-starter-alicloud-oss</artifactId>
        <version>2.2.0.RELEASE</version>    <!--报红的话就加上版本号-->
      </dependency>
      ```
  2. 在`gulimall-product`中配置, 这里为了避免敏感信息, 我将这个配置写到`application-oss.yml`中(并将applicaion-oss.yml从版本控制中排除)
      `application-oss.yml`配置oss信息
      ``` yml
      spring:
        cloud:
          alicloud:
            access-key: xxx
            secret-key: yyy
            oss:
              endpoint: zzz
      ```
      在`application.yml`中将`application-oss.yml`添加进来:
      ``` YML
      spring:
        profiles:
          active: oss
      ```
  3. 测试
      ``` java
      @Test
        void testUpload() {
            String filePath= "D:\图片\girl.jpg";
            try {

                // 上传文件。
                ossClient.putObject("gulimall-cheakin", "girl.jpg", new File(filePath));

                System.out.println("上传成功.");
            } catch (OSSException oe) {
                System.out.println("Caught an OSSException, which means your request made it to OSS, "
                        + "but was rejected with an error response for some reason.");
                System.out.println("Error Message:" + oe.getErrorMessage());
                System.out.println("Error Code:" + oe.getErrorCode());
                System.out.println("Request ID:" + oe.getRequestId());
                System.out.println("Host ID:" + oe.getHostId());
            } catch (ClientException ce) {
                System.out.println("Caught an ClientException, which means the client encountered "
                        + "a serious internal problem while trying to communicate with OSS, "
                        + "such as not being able to access the network.");
                System.out.println("Error Message:" + ce.getMessage());
            } finally {
                if (ossClient != null) {
                    ossClient.shutdown();
                }
            }
        } 
        ```

##### 签名方式
首先, 先将对象存储迁移到一个新的微服务项目中
1. 创建`gulimall-third-party`项目
2. 仍然依赖`gulimall-common`项目, 并将`guilmall-common`中的oss依赖移过来, 且排除mybatis(注意:和视频中有所区别)
    ``` xml
    <?xml version="1.0" encoding="UTF-8"?>
    <project xmlns="http://maven.apache.org/POM/4.0.0"
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
        <modelVersion>4.0.0</modelVersion>
        <parent>
            <artifactId>gulimall</artifactId>
            <groupId>cn.cheakin</groupId>
            <version>0.0.1-SNAPSHOT</version>
        </parent>
        <groupId>cn.cheakin</groupId>
        <artifactId>gulimall-third-party</artifactId>
        <version>0.0.1-SNAPSHOT</version>
        <name>gulimall-third-party</name>
        <description>gulimall-third-party</description>

        <dependencies>
            <dependency>
                <groupId>cn.cheakin</groupId>
                <artifactId>gulimall-common</artifactId>
                <version>0.0.1-SNAPSHOT</version>
                <exclusions>
                  <exclusion>
                      <groupId>com.baomidou</groupId>
                      <artifactId>mybatis-plus-boot-starter</artifactId>
                  </exclusion>
                  <exclusion>
                      <groupId>mysql</groupId>
                      <artifactId>mysql-connector-java</artifactId>
                  </exclusion>
                </exclusions>
            </dependency>

            <!--阿里云 OSS-->
            <dependency>
                <groupId>com.alibaba.cloud</groupId>
                <artifactId>spring-cloud-starter-alicloud-oss</artifactId>
                <version>2.2.0.RELEASE</version>    <!--报红的话就加上版本号-->
            </dependency>
        </dependencies>

    </project>
    ```
3. 注册到注册中心
   - 先创建命名空间
    ![/GuliaMall/1658672914357.jpg)
   - 创建oss配置(**注意选择命名空间**)
    ![/GuliaMall/1658673360767.jpg)
   - 创建`bootstrap.properties`配置注册中心信息
    ``` yml
    spring.cloud.nacos.config.server-addr=127.0.0.1:8848
    spring.cloud.nacos.config.namespace=gulimall-third-party

    spring.cloud.nacos.config.extension-configs[0].data-id=oss.yml
    spring.cloud.nacos.config.extension-configs[0].group=DEFAULT_GROUP
    spring.cloud.nacos.config.extension-configs[0].refresh=true
    ```
   - 在启动类上使用`@EnableDiscoveryClient`注解
4. 配置项目的其他信息
   创建`application.yml`
   ``` yml
   spring:
    cloud:
      nacos:
        discovery:
          server-addr: 127.0.0.1:8848

    application:
      name: gulimall-third-party

   server:
     port: 30000
   ```
5. 测试
   启动, 测试,查看注册中心是否有`gulimall-third-party`服务
   在`GulimallTirdPartyTests`中编写单元测试
   ``` java
    @Autowired
    OSSClient ossClient;

    @Test
    void testUpload() {
        String filePath= "D:\\图片\\girl.jpg";

        ossClient.putObject("gulimall-cheakin", "girl2.jpg", new File(filePath));

        ossClient.shutdown();

        System.out.println("上传完成...");
    }
    ```
![/GuliaMall/1658630144791.jpg)
![/GuliaMall/p139016.png)
官方文档: https://help.aliyun.com/document_detail/31926.html
参考文档:https://help.aliyun.com/document_detail/91868.htm?spm=a2c4g.11186623.0.0.16073967V6axHk#concept-ahk-rfz-2fb, 我们创建相应的获取policy的接口:
``` java
@RestController
public class OssController {

    @Autowired
    OSS client;
    @Value("${spring.cloud.alicloud.oss.endpoint}")
    String endpoint ;

    @Value("${spring.cloud.alicloud.oss.bucket}")
    String bucket ;

    @Value("${spring.cloud.alicloud.access-key}")
    String accessId ;
    @Value("${spring.cloud.alicloud.secret-key}")
    String accessKey ;

    @RequestMapping("oss/policy")
    public R policy() {
        // 填写Host地址，格式为https://bucketname.endpoint。
        String host = "https://" + bucket + "." + endpoint;

        // 设置上传到OSS文件的前缀，可置空此项。置空后，文件将上传至Bucket的根目录下。
        String format = new SimpleDateFormat("yyyy-MM-dd").format(new Date());
        String dir = format; // 用户上传文件时指定的前缀。

//        OSSClient client = new OSSClient(endpoint, accessId, accessKey);
        Map<String, String> respMap = null;
        try {
            long expireTime = 30;
            long expireEndTime = System.currentTimeMillis() + expireTime * 1000;
            Date expiration = new Date(expireEndTime);
            PolicyConditions policyConds = new PolicyConditions();
            policyConds.addConditionItem(PolicyConditions.COND_CONTENT_LENGTH_RANGE, 0, 1048576000);
            policyConds.addConditionItem(MatchMode.StartWith, PolicyConditions.COND_KEY, dir);

            String postPolicy = client.generatePostPolicy(expiration, policyConds);
            byte[] binaryData = postPolicy.getBytes("utf-8");
            String encodedPolicy = BinaryUtil.toBase64String(binaryData);
            String postSignature = client.calculatePostSignature(postPolicy);

            respMap = new LinkedHashMap<String, String>();
            respMap.put("accessid", accessId);
            respMap.put("policy", encodedPolicy);
            respMap.put("signature", postSignature);
            respMap.put("dir", dir);
            respMap.put("host", host);
            respMap.put("expire", String.valueOf(expireEndTime / 1000));
            // respMap.put("expire", formatISO8601Date(expiration));

        } catch (Exception e) {
            // Assert.fail(e.getMessage());
            System.out.println(e.getMessage());
        }
        return R.ok().put("data", respMap);
    }
}
```
测试: 访问`http://localhost:30000/oss/policy`, 能正常返回json则表示成功

将`gulimall-third-party`的路由加入到gateway中, 在`gulimall-gateway`的`application.yml`中添加(注意顺序, 要再泛匹配前):
``` yml
- id: third_party_route
  uri: lb://gulimall-third-party
  predicates:
    - Path=/api/thirdparty/**
  filters:
    - RewritePath=/api/thirdparty/(?<segment>.*),/$\{segment}
```
测试: 访问`http://localhost:88/api/thirdparty/oss/policy`, 能正常返回json则表示成功

**前后端联调测试**
* upload组件
  `src/components/upload/multiUpload.vue`文件, 注意替换文件上传的Bucket地址
  ``` html
  <template>
    <div>
      <el-upload
        action="http://gulimall.oss-cn-shanghai.aliyuncs.com"
        :data="dataObj"
        list-type="picture-card"
        :file-list="fileList"
        :before-upload="beforeUpload"
        :on-remove="handleRemove"
        :on-success="handleUploadSuccess"
        :on-preview="handlePreview"
        :limit="maxCount"
        :on-exceed="handleExceed"
      >
        <i class="el-icon-plus"></i>
      </el-upload>
      <el-dialog :visible.sync="dialogVisible">
        <img width="100%" :src="dialogImageUrl" alt />
      </el-dialog>
    </div>
  </template>
  <script>
  import { policy } from "./policy";
  import { getUUID } from '@/utils'
  export default {
    name: "multiUpload",
    props: {
      //图片属性数组
      value: Array,
      //最大上传图片数量
      maxCount: {
        type: Number,
        default: 30
      }
    },
    data() {
      return {
        dataObj: {
          policy: "",
          signature: "",
          key: "",
          ossaccessKeyId: "",
          dir: "",
          host: "",
          uuid: ""
        },
        dialogVisible: false,
        dialogImageUrl: null
      };
    },
    computed: {
      fileList() {
        let fileList = [];
        for (let i = 0; i < this.value.length; i++) {
          fileList.push({ url: this.value[i] });
        }

        return fileList;
      }
    },
    mounted() {},
    methods: {
      emitInput(fileList) {
        let value = [];
        for (let i = 0; i < fileList.length; i++) {
          value.push(fileList[i].url);
        }
        this.$emit("input", value);
      },
      handleRemove(file, fileList) {
        this.emitInput(fileList);
      },
      handlePreview(file) {
        this.dialogVisible = true;
        this.dialogImageUrl = file.url;
      },
      beforeUpload(file) {
        let _self = this;
        return new Promise((resolve, reject) => {
          policy()
            .then(response => {
              console.log("这是什么${filename}");
              _self.dataObj.policy = response.data.policy;
              _self.dataObj.signature = response.data.signature;
              _self.dataObj.ossaccessKeyId = response.data.accessid;
              _self.dataObj.key = response.data.dir +getUUID()+"_${filename}";
              _self.dataObj.dir = response.data.dir;
              _self.dataObj.host = response.data.host;
              resolve(true);
            })
            .catch(err => {
              console.log("出错了...",err)
              reject(false);
            });
        });
      },
      handleUploadSuccess(res, file) {
        this.fileList.push({
          name: file.name,
          // url: this.dataObj.host + "/" + this.dataObj.dir + "/" + file.name； 替换${filename}为真正的文件名
          url: this.dataObj.host + "/" + this.dataObj.key.replace("${filename}",file.name)
        });
        this.emitInput(this.fileList);
      },
      handleExceed(files, fileList) {
        this.$message({
          message: "最多只能上传" + this.maxCount + "张图片",
          type: "warning",
          duration: 1000
        });
      }
    }
  };
  </script>
  <style>
  </style>
  ```
  `src/components/upload/policy.js`文件, 注意替换获取policy的接口地址
  ``` html
  import http from '@/utils/httpRequest.js'
  export function policy() {
    return  new Promise((resolve,reject)=>{
          http({
              url: http.adornUrl("/thirdparty/oss/policy"),
              method: "get",
              params: http.adornParams({})
          }).then(({ data }) => {
              resolve(data);
          })
      });
  }
  ```
  `src/components/upload/singleUpload.vue`文件, 注意替换文件上传的Bucket地址
  ``` html
  <template> 
    <div>
      <el-upload
        action="http://gulimall.oss-cn-shanghai.aliyuncs.com"
        :data="dataObj"
        list-type="picture"
        :multiple="false" :show-file-list="showFileList"
        :file-list="fileList"
        :before-upload="beforeUpload"
        :on-remove="handleRemove"
        :on-success="handleUploadSuccess"
        :on-preview="handlePreview">
        <el-button size="small" type="primary">点击上传</el-button>
        <div slot="tip" class="el-upload__tip">只能上传jpg/png文件，且不超过10MB</div>
      </el-upload>
      <el-dialog :visible.sync="dialogVisible">
        <img width="100%" :src="fileList[0].url" alt="">
      </el-dialog>
    </div>
  </template>
  <script>
    import {policy} from './policy'
    import { getUUID } from '@/utils'

    export default {
      name: 'singleUpload',
      props: {
        value: String
      },
      computed: {
        imageUrl() {
          return this.value;
        },
        imageName() {
          if (this.value != null && this.value !== '') {
            return this.value.substr(this.value.lastIndexOf("/") + 1);
          } else {
            return null;
          }
        },
        fileList() {
          return [{
            name: this.imageName,
            url: this.imageUrl
          }]
        },
        showFileList: {
          get: function () {
            return this.value !== null && this.value !== ''&& this.value!==undefined;
          },
          set: function (newValue) {
          }
        }
      },
      data() {
        return {
          dataObj: {
            policy: '',
            signature: '',
            key: '',
            ossaccessKeyId: '',
            dir: '',
            host: '',
            // callback:'',
          },
          dialogVisible: false
        };
      },
      methods: {
        emitInput(val) {
          this.$emit('input', val)
        },
        handleRemove(file, fileList) {
          this.emitInput('');
        },
        handlePreview(file) {
          this.dialogVisible = true;
        },
        beforeUpload(file) {
          let _self = this;
          return new Promise((resolve, reject) => {
            policy().then(response => {
              _self.dataObj.policy = response.data.policy;
              _self.dataObj.signature = response.data.signature;
              _self.dataObj.ossaccessKeyId = response.data.accessid;
              _self.dataObj.key = response.data.dir + '/'+getUUID()+'_${filename}';
              _self.dataObj.dir = response.data.dir;
              _self.dataObj.host = response.data.host;
              resolve(true)
            }).catch(err => {
              reject(false)
            })
          })
        },
        handleUploadSuccess(res, file) {
          console.log("上传成功...")
          this.showFileList = true;
          this.fileList.pop();
          this.fileList.push({name: file.name, url: this.dataObj.host + '/' + this.dataObj.key.replace("${filename}",file.name) });
          this.emitInput(this.fileList[0].url);
        }
      }
    }
  </script>
  <style>

  </style>
  ```

`brand-add-or-update.vue`中
修改el-form-item label="品牌logo地址"内容。
要使用文件上传组件，先导入`import SingleUpload from "@/components/upload/singleUpload";`
填入`<single-upload v-model="dataForm.logo"></single-upload>`
写明要使用的组件`components: { SingleUpload },`

点击一下文件上传，发现发送了两个请求
`localhost:88/api/thirdparty/oss/policy?t=1613300654238`
文件上传前调用的方法： `:before-upload="beforeUpload"`
发现该方法返回了一个new Promise，调用了`policy()`，该方法是`policy.js`中的
`import { policy } from "./policy";`

java里面改接口返回值为`R`。`return R.ok().put("data”,respMap);`

阿里云开启跨域
开始执行上传，但是在上传过程中，出现了跨域请求问题：
`Access to XMLHttpRequest at 'http://gulimall-f.oss-cn-qingdao.aliyuncs.com/' from origin 'http://localhost:8001' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.`
这又是一个跨域的问题，解决方法就是在阿里云上开启跨域访问：
![/GuliaMall/1658750987743.jpg)

此时在测试, 就能够上传成功了

#### 表单校验&自定义校验器
添加状态开关`<el-switch></el-switch>`以及`表单校验`到`brand-add-or-update.vue`中,修改`brand-add-or-update.vue`如下： 
``` html
<template>
  <el-dialog
    :title="!dataForm.id ? '新增' : '修改'"
    :close-on-click-modal="false"
    :visible.sync="visible"
  >
    <el-form
      :model="dataForm"
      :rules="dataRule"
      ref="dataForm"
      @keyup.enter.native="dataFormSubmit()"
      label-width="140px"
    >
      <el-form-item label="品牌名" prop="name">
        <el-input v-model="dataForm.name" placeholder="品牌名"></el-input>
      </el-form-item>
      <el-form-item label="品牌logo地址" prop="logo">
        <SingleUpload v-model="dataForm.logo"></SingleUpload>
      </el-form-item>
      <el-form-item label="介绍" prop="descript">
        <el-input v-model="dataForm.descript" placeholder="介绍"></el-input>
      </el-form-item>
      <el-form-item label="显示状态" prop="showStatus">
        <el-switch
          v-model="dataForm.showStatus"
          active-color="#13ce66"
          inactive-color="#ff4949"
          :active-value="1"
          :inactive-value="0"
        >
        </el-switch>
      </el-form-item>
      <el-form-item label="检索首字母" prop="firstLetter">
        <el-input
          v-model="dataForm.firstLetter"
          placeholder="检索首字母"
        ></el-input>
      </el-form-item>
      <el-form-item label="排序" prop="sort">
        <el-input v-model="dataForm.sort" placeholder="排序"></el-input>
      </el-form-item>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="dataFormSubmit()">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
import SingleUpload from "@/components/upload/singleUpload";
export default {
  data() {
    return {
      visible: false,
      dataForm: {
        brandId: 0,
        name: "",
        logo: "",
        descript: "",
        showStatus: 1,
        firstLetter: "",
        sort: 0,
      },
      dataRule: {
        name: [{ required: true, message: "品牌名不能为空", trigger: "blur" }],
        logo: [
          { required: true, message: "品牌logo地址不能为空", trigger: "blur" },
        ],
        descript: [
          { required: true, message: "介绍不能为空", trigger: "blur" },
        ],
        showStatus: [
          {
            required: true,
            message: "显示状态[0-不显示；1-显示]不能为空",
            trigger: "blur",
          },
        ],
        firstLetter: [
          {
            validator: (rule, value, callback) => {
              if (value == "") {
                callback(new Error("首字母必须填写"));
              } else if (!/^[a-zA-Z]$/.test(value)) {
                callback(new Error("首字母必须a-z或者A-Z之间"));
              } else {
                callback();
              }
            },
            trigger: "blur",
          },
        ],
        sort: [{validator: (rule, value, callback) => {
          if (value == "") {
                callback(new Error("排序字段必须填写"));
              } else if (!Number.isInteger(parseInt(value)) || parseInt(value) < 0){
                callback(new Error("排序字段必须是一个整数"));
              } else {
                callback();
              }
        }, trigger: "blur" }],
      },
    };
  },
  methods: {
    init(id) {
      this.dataForm.brandId = id || 0;
      this.visible = true;
      this.$nextTick(() => {
        this.$refs["dataForm"].resetFields();
        if (this.dataForm.brandId) {
          this.$http({
            url: this.$http.adornUrl(
              `/product/brand/info/${this.dataForm.brandId}`
            ),
            method: "get",
            params: this.$http.adornParams(),
          }).then(({ data }) => {
            if (data && data.code === 0) {
              this.dataForm.name = data.brand.name;
              this.dataForm.logo = data.brand.logo;
              this.dataForm.descript = data.brand.descript;
              this.dataForm.showStatus = data.brand.showStatus;
              this.dataForm.firstLetter = data.brand.firstLetter;
              this.dataForm.sort = data.brand.sort;
            }
          });
        }
      });
    },
    // 表单提交
    dataFormSubmit() {
      this.$refs["dataForm"].validate((valid) => {
        if (valid) {
          this.$http({
            url: this.$http.adornUrl(
              `/product/brand/${!this.dataForm.brandId ? "save" : "update"}`
            ),
            method: "post",
            data: this.$http.adornData({
              brandId: this.dataForm.brandId || undefined,
              name: this.dataForm.name,
              logo: this.dataForm.logo,
              descript: this.dataForm.descript,
              showStatus: this.dataForm.showStatus,
              firstLetter: this.dataForm.firstLetter,
              sort: this.dataForm.sort,
            }),
          }).then(({ data }) => {
            if (data && data.code === 0) {
              this.$message({
                message: "操作成功",
                type: "success",
                duration: 1500,
                onClose: () => {
                  this.visible = false;
                  this.$emit("refreshDataList");
                },
              });
            } else {
              this.$message.error(data.msg);
            }
          });
        }
      });
    },
  },
  components: {
    SingleUpload,
  },
};
</script>
```

添加`<el-image></el-image>`及其他标签,`brand.vue`使用`<el-image>`
参照[官方文档](), 在`src/components/element-ui/index.js`中导入标签(版本不匹配的可以删掉)
``` js
import {
  Pagination,
  Dialog,
  Autocomplete,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Menu,
  Submenu,
  MenuItem,
  MenuItemGroup,
  Input,
  InputNumber,
  Radio,
  RadioGroup,
  RadioButton,
  Checkbox,
  CheckboxButton,
  CheckboxGroup,
  Switch,
  Select,
  Option,
  OptionGroup,
  Button,
  ButtonGroup,
  Table,
  TableColumn,
  DatePicker,
  TimeSelect,
  TimePicker,
  Popover,
  Tooltip,
  Breadcrumb,
  BreadcrumbItem,
  Form,
  FormItem,
  Tabs,
  TabPane,
  Tag,
  Tree,
  Alert,
  Slider,
  Icon,
  Row,
  Col,
  Upload,
  Progress,
  Spinner,
  Badge,
  Card,
  Rate,
  Steps,
  Step,
  Carousel,
  CarouselItem,
  Collapse,
  CollapseItem,
  Cascader,
  ColorPicker,
  Transfer,
  Container,
  Header,
  Aside,
  Main,
  Footer,
  Timeline,
  TimelineItem,
  Link,
  Divider,
  Image,
  Calendar,
  Loading,
  MessageBox,
  Message,
  Notification
} from 'element-ui';

Vue.use(Pagination);
Vue.use(Dialog);
Vue.use(Autocomplete);
Vue.use(Dropdown);
Vue.use(DropdownMenu);
Vue.use(DropdownItem);
Vue.use(Menu);
Vue.use(Submenu);
Vue.use(MenuItem);
Vue.use(MenuItemGroup);
Vue.use(Input);
Vue.use(InputNumber);
Vue.use(Radio);
Vue.use(RadioGroup);
Vue.use(RadioButton);
Vue.use(Checkbox);
Vue.use(CheckboxButton);
Vue.use(CheckboxGroup);
Vue.use(Switch);
Vue.use(Select);
Vue.use(Option);
Vue.use(OptionGroup);
Vue.use(Button);
Vue.use(ButtonGroup);
Vue.use(Table);
Vue.use(TableColumn);
Vue.use(DatePicker);
Vue.use(TimeSelect);
Vue.use(TimePicker);
Vue.use(Popover);
Vue.use(Tooltip);
Vue.use(Breadcrumb);
Vue.use(BreadcrumbItem);
Vue.use(Form);
Vue.use(FormItem);
Vue.use(Tabs);
Vue.use(TabPane);
Vue.use(Tag);
Vue.use(Tree);
Vue.use(Alert);
Vue.use(Slider);
Vue.use(Icon);
Vue.use(Row);
Vue.use(Col);
Vue.use(Upload);
Vue.use(Progress);
Vue.use(Spinner);
Vue.use(Badge);
Vue.use(Card);
Vue.use(Rate);
Vue.use(Steps);
Vue.use(Step);
Vue.use(Carousel);
Vue.use(CarouselItem);
Vue.use(Collapse);
Vue.use(CollapseItem);
Vue.use(Cascader);
Vue.use(ColorPicker);
Vue.use(Transfer);
Vue.use(Container);
Vue.use(Header);
Vue.use(Aside);
Vue.use(Main);
Vue.use(Footer);
Vue.use(Timeline);
Vue.use(TimelineItem);
Vue.use(Link);
Vue.use(Divider);
Vue.use(Image);
Vue.use(Calendar);
```
`brand.vue`页面如下(图片出不来,是由于地址失效了,暂且忽略):
``` html
<template>
  <div class="mod-config">
    <el-form
      :inline="true"
      :model="dataForm"
      @keyup.enter.native="getDataList()"
    >
      <el-form-item>
        <el-input
          v-model="dataForm.key"
          placeholder="参数名"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item>
        <el-button @click="getDataList()">查询</el-button>
        <el-button
          v-if="isAuth('product:brand:save')"
          type="primary"
          @click="addOrUpdateHandle()"
          >新增</el-button
        >
        <el-button
          v-if="isAuth('product:brand:delete')"
          type="danger"
          @click="deleteHandle()"
          :disabled="dataListSelections.length <= 0"
          >批量删除</el-button
        >
      </el-form-item>
    </el-form>
    <el-table
      :data="dataList"
      border
      v-loading="dataListLoading"
      @selection-change="selectionChangeHandle"
      style="width: 100%"
    >
      <el-table-column
        type="selection"
        header-align="center"
        align="center"
        width="50"
      >
      </el-table-column>
      <el-table-column
        prop="brandId"
        header-align="center"
        align="center"
        label="品牌id"
      >
      </el-table-column>
      <el-table-column
        prop="name"
        header-align="center"
        align="center"
        label="品牌名"
      >
      </el-table-column>
      <el-table-column
        prop="logo"
        header-align="center"
        align="center"
        label="品牌logo地址"
      >
      <template slot-scope="scope" >
        <el-image 
          style="width: 100px; height: 80px"
          :src="scope.row.logo"
          fit="fit"></el-image>
      </template>
      </el-table-column>
      <el-table-column
        prop="descript"
        header-align="center"
        align="center"
        label="介绍"
      >
      </el-table-column>
      <el-table-column
        prop="showStatus"
        header-align="center"
        align="center"
        label="显示状态"
      >
        <template slot-scope="scope">
          <el-switch
            v-model="scope.row.showStatus"
            active-color="#13ce66"
            inactive-color="#ff4949"
            :active-value="1"
            :inactive-value="0"
            @change="updateBrandStatus(scope.row)"
          >
          </el-switch>
        </template>
      </el-table-column>
      <el-table-column
        prop="firstLetter"
        header-align="center"
        align="center"
        label="检索首字母"
      >
      </el-table-column>
      <el-table-column
        prop="sort"
        header-align="center"
        align="center"
        label="排序"
      >
      </el-table-column>
      <el-table-column
        fixed="right"
        header-align="center"
        align="center"
        width="150"
        label="操作"
      >
        <template slot-scope="scope">
          <el-button
            type="text"
            size="small"
            @click="addOrUpdateHandle(scope.row.brandId)"
            >修改</el-button
          >
          <el-button
            type="text"
            size="small"
            @click="deleteHandle(scope.row.brandId)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      @size-change="sizeChangeHandle"
      @current-change="currentChangeHandle"
      :current-page="pageIndex"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pageSize"
      :total="totalPage"
      layout="total, sizes, prev, pager, next, jumper"
    >
    </el-pagination>
    <!-- 弹窗, 新增 / 修改 -->
    <add-or-update
      v-if="addOrUpdateVisible"
      ref="addOrUpdate"
      @refreshDataList="getDataList"
    ></add-or-update>
  </div>
</template>

<script>
import AddOrUpdate from "./brand-add-or-update";
export default {
  data() {
    return {
      dataForm: {
        key: "",
      },
      dataList: [],
      pageIndex: 1,
      pageSize: 10,
      totalPage: 0,
      dataListLoading: false,
      dataListSelections: [],
      addOrUpdateVisible: false,
    };
  },
  components: {
    AddOrUpdate,
  },
  activated() {
    this.getDataList();
  },
  methods: {
    updateBrandStatus(data){
      console.log("最新信息",data);
      let {brandId,showStatus} = data;
       this.$http({
        url: this.$http.adornUrl("/product/brand/update"),
        method: "post",
        data: this.$http.adornData({brandId,showStatus:showStatus},false)
      }).then(({ data }) => {
       this.$message({
         type:"success",
         message:"状态更新成功"
       })
      });
    },
    // 获取数据列表
    getDataList() {
      this.dataListLoading = true;
      this.$http({
        url: this.$http.adornUrl("/product/brand/list"),
        method: "get",
        params: this.$http.adornParams({
          page: this.pageIndex,
          limit: this.pageSize,
          key: this.dataForm.key,
        }),
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.dataList = data.page.list;
          this.totalPage = data.page.totalCount;
        } else {
          this.dataList = [];
          this.totalPage = 0;
        }
        this.dataListLoading = false;
      });
    },
    // 每页数
    sizeChangeHandle(val) {
      this.pageSize = val;
      this.pageIndex = 1;
      this.getDataList();
    },
    // 当前页
    currentChangeHandle(val) {
      this.pageIndex = val;
      this.getDataList();
    },
    // 多选
    selectionChangeHandle(val) {
      this.dataListSelections = val;
    },
    // 新增 / 修改
    addOrUpdateHandle(id) {
      this.addOrUpdateVisible = true;
      this.$nextTick(() => {
        this.$refs.addOrUpdate.init(id);
      });
    },
    // 删除
    deleteHandle(id) {
      var ids = id
        ? [id]
        : this.dataListSelections.map((item) => {
            return item.brandId;
          });
      this.$confirm(
        `确定对[id=${ids.join(",")}]进行[${id ? "删除" : "批量删除"}]操作?`,
        "提示",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }
      ).then(() => {
        this.$http({
          url: this.$http.adornUrl("/product/brand/delete"),
          method: "post",
          data: this.$http.adornData(ids, false),
        }).then(({ data }) => {
          if (data && data.code === 0) {
            this.$message({
              message: "操作成功",
              type: "success",
              duration: 1500,
              onClose: () => {
                this.getDataList();
              },
            });
          } else {
            this.$message.error(data.msg);
          }
        });
      });
    },
  },
};
</script>
```

#### JSR303数据校验
填写form时应该有前端校验，后端也应该有校验
**前端:**
前端的校验是element-ui表单验证. Form 组件提供了表单验证的功能，只需要通过 rules 属性传入约定的验证规则，并将 Form-Item 的 prop 属性设置为需校验的字段名即可。

**后端:**
1. 使用校验注解
   在Java中提供了一系列的校验方式，它这些校验方式在“javax.validation.constraints”包中，提供了如`@Email`，`@NotNull`等注解。
   ``` xml
   <!--jsr3参数校验器-->
   <dependency>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-validation</artifactId>
   </dependency>
   ```
   里面依赖了hibernate-validator
   在非空处理方式上提供了`@NotNull`，`@NotBlank`和`@NotEmpty`
   - @NotNull
    The annotated element must not be null. Accepts any type.
    注解元素禁止为null，能够接收任何类型
   - @NotEmpty
    the annotated element must not be null nor empty.
    该注解修饰的字段不能为null或""
    Supported types are:
    支持以下几种类型
    CharSequence (length of character sequence is evaluated) 字符序列（字符序列长度的计算）
    Collection (collection size is evaluated) 集合长度的计算
    Map (map size is evaluated) map长度的计算
    Array (array length is evaluated) 数组长度的计算
   - @NotBlank
    The annotated element must not be null and must contain at least one non-whitespace character. Accepts CharSequence. 该注解不能为null，并且至少包含一个非空格字符。接收字符序列。
   - @Valid
2. controller中加校验注解`@Valid`，开启校验
   ``` java
    @RequestMapping("/save")
    public R save(@Valid @RequestBody BrandEntity brand){
      brandService.save(brand);

      return R.ok();
    }
    ```
    实体类中加上字段
    测试：
    ``` JSON
    POST http://localhost:88/api/product/brand/save
    {
        "timestamp": "2020-04-29T09:20:46.383+0000",
        "status": 400,
        "error": "Bad Request",
        "errors": [
            {
                "codes": [
                    "NotBlank.brandEntity.name",
                    "NotBlank.name",
                    "NotBlank.java.lang.String",
                    "NotBlank"
                ],
                "arguments": [
                    {
                        "codes": [
                            "brandEntity.name",
                            "name"
                        ],
                        "arguments": null,
                        "defaultMessage": "name",
                        "code": "name"
                    }
                ],
                "defaultMessage": "不能为空",
                "objectName": "brandEntity",
                "field": "name",
                "rejectedValue": "",
                "bindingFailure": false,
                "code": "NotBlank"
            }
        ],
        "message": "Validation failed for object='brandEntity'. Error count: 1",
        "path": "/product/brand/save"
    }
    ```
    能够看到`"defaultMessage": “不能为空”`，这些错误消息定义在`hibernate-validator``的`\org\hibernate\validator\ValidationMessages_zh_CN.properties`文件中。在该文件中定义了很多的错误规则：

``` yml
javax.validation.constraints.AssertFalse.message     = 只能为false
javax.validation.constraints.AssertTrue.message      = 只能为true
javax.validation.constraints.DecimalMax.message      = 必须小于或等于{value}
javax.validation.constraints.DecimalMin.message      = 必须大于或等于{value}
javax.validation.constraints.Digits.message          = 数字的值超出了允许范围(只允许在{integer}位整数和{fraction}位小数范围内)
javax.validation.constraints.Email.message           = 不是一个合法的电子邮件地址
javax.validation.constraints.Future.message          = 需要是一个将来的时间
javax.validation.constraints.FutureOrPresent.message = 需要是一个将来或现在的时间
javax.validation.constraints.Max.message             = 最大不能超过{value}
javax.validation.constraints.Min.message             = 最小不能小于{value}
javax.validation.constraints.Negative.message        = 必须是负数
javax.validation.constraints.NegativeOrZero.message  = 必须是负数或零
javax.validation.constraints.NotBlank.message        = 不能为空
javax.validation.constraints.NotEmpty.message        = 不能为空
javax.validation.constraints.NotNull.message         = 不能为null
javax.validation.constraints.Null.message            = 必须为null
javax.validation.constraints.Past.message            = 需要是一个过去的时间
javax.validation.constraints.PastOrPresent.message   = 需要是一个过去或现在的时间
javax.validation.constraints.Pattern.message         = 需要匹配正则表达式"{regexp}"
javax.validation.constraints.Positive.message        = 必须是正数
javax.validation.constraints.PositiveOrZero.message  = 必须是正数或零
javax.validation.constraints.Size.message            = 个数必须在{min}和{max}之间

org.hibernate.validator.constraints.CreditCardNumber.message        = 不合法的信用卡号码
org.hibernate.validator.constraints.Currency.message                = 不合法的货币 (必须是{value}其中之一)
org.hibernate.validator.constraints.EAN.message                     = 不合法的{type}条形码
org.hibernate.validator.constraints.Email.message                   = 不是一个合法的电子邮件地址
org.hibernate.validator.constraints.Length.message                  = 长度需要在{min}和{max}之间
org.hibernate.validator.constraints.CodePointLength.message         = 长度需要在{min}和{max}之间
org.hibernate.validator.constraints.LuhnCheck.message               = ${validatedValue}的校验码不合法, Luhn模10校验和不匹配
org.hibernate.validator.constraints.Mod10Check.message              = ${validatedValue}的校验码不合法, 模10校验和不匹配
org.hibernate.validator.constraints.Mod11Check.message              = ${validatedValue}的校验码不合法, 模11校验和不匹配
org.hibernate.validator.constraints.ModCheck.message                = ${validatedValue}的校验码不合法, ${modType}校验和不匹配
org.hibernate.validator.constraints.NotBlank.message                = 不能为空
org.hibernate.validator.constraints.NotEmpty.message                = 不能为空
org.hibernate.validator.constraints.ParametersScriptAssert.message  = 执行脚本表达式"{script}"没有返回期望结果
org.hibernate.validator.constraints.Range.message                   = 需要在{min}和{max}之间
org.hibernate.validator.constraints.SafeHtml.message                = 可能有不安全的HTML内容
org.hibernate.validator.constraints.ScriptAssert.message            = 执行脚本表达式"{script}"没有返回期望结果
org.hibernate.validator.constraints.URL.message                     = 需要是一个合法的URL

org.hibernate.validator.constraints.time.DurationMax.message        = 必须小于${inclusive == true ? '或等于' : ''}${days == 0 ? '' : days += '天'}${hours == 0 ? '' : hours += '小时'}${minutes == 0 ? '' : minutes += '分钟'}${seconds == 0 ? '' : seconds += '秒'}${millis == 0 ? '' : millis += '毫秒'}${nanos == 0 ? '' : nanos += '纳秒'}
org.hibernate.validator.constraints.time.DurationMin.message        = 必须大于${inclusive == true ? '或等于' : ''}${days == 0 ? '' : days += '天'}${hours == 0 ? '' : hours += '小时'}${minutes == 0 ? '' : minutes += '分钟'}${seconds == 0 ? '' : seconds += '秒'}${millis == 0 ? '' : millis += '毫秒'}${nanos == 0 ? '' : nanos += '纳秒'}
```

想要自定义错误消息，可以覆盖默认的错误提示信息，如`@NotBlank`的默认message是
``` java
public @interface NotBlank {
	String message() default "{javax.validation.constraints.NotBlank.message}";
}
```

可以在添加注解的时候，修改message：
``` java
@NotBlank(message = "品牌名必须非空")
private String name;
```

当再次发送请求时，得到的错误提示信息：
``` json
{
    "timestamp": "2020-04-29T09:36:04.125+0000",
    "status": 400,
    "error": "Bad Request",
    "errors": [
        {
            "codes": [
                "NotBlank.brandEntity.name",
                "NotBlank.name",
                "NotBlank.java.lang.String",
                "NotBlank"
            ],
            "arguments": [
                {
                    "codes": [
                        "brandEntity.name",
                        "name"
                    ],
                    "arguments": null,
                    "defaultMessage": "name",
                    "code": "name"
                }
            ],
            "defaultMessage": "品牌名必须非空",
            "objectName": "brandEntity",
            "field": "name",
            "rejectedValue": "",
            "bindingFailure": false,
            "code": "NotBlank"
        }
    ],
    "message": "Validation failed for object='brandEntity'. Error count: 1",
    "path": "/product/brand/save"
}
```
但是这种返回的错误结果并不符合我们的业务需要。


3. `BindResult`, 给校验的Bean后，紧跟一个`BindResult`，就可以获取到校验的结果。拿到校验的结果，就可以自定义的封装。
    ``` java
    @RequestMapping("/save")
    public R save(@Valid @RequestBody BrandEntity brand, BindingResult result){
        if( result.hasErrors()){
            Map<String,String> map=new HashMap<>();
            //1.获取错误的校验结果
            result.getFieldErrors().forEach((item)->{
                //获取发生错误时的message
                String message = item.getDefaultMessage();
                //获取发生错误的字段
                String field = item.getField();
                map.put(field,message);
            });
            return R.error(400,"提交的数据不合法").put("data",map);
        }else {
            brandService.save(brand);
        }
        return R.ok();
    }
    ```
    实体类`BrandEntity`中增加字段校验注解
    ``` java
    @Data
    @TableName("pms_brand")
    public class BrandEntity implements Serializable {
      private static final long serialVersionUID = 1L;

      /**
      * 品牌id
      */
      @TableId
      private Long brandId;
      /**
      * 品牌名
      */
      @NotBlank(message = "品牌名必须提交")
      private String name;
      /**
      * 品牌logo地址
      */
      @NotEmpty
      @URL(message = "logo必须是一个合法的url地址")
      private String logo;
      /**
      * 介绍
      */
      private String descript;
      /**
      * 显示状态[0-不显示；1-显示]
      */
      private Integer showStatus;
      /**
      * 检索首字母
      */
      @NotEmpty
      @Pattern(regexp = "^[a-zA-Z]$", message = "检索首字母必须是一个字母")
      private String firstLetter;
      /**
      * 排序
      */
      @NotNull
      @Min(value = 0, message = "排序必须大于0")
      private Integer sort;

    }
    ```
    
    这种是针对于该请求设置了一个内容校验，如果针对于每个请求都单独进行配置，显然不是太合适，实际上可以统一的对于异常进行处理。

4. 统一异常处理`@ControllerAdvice`, 统一异常处理
   可以使用SpringMvc所提供的`@ControllerAdvice`，通过`basePackages`能够说明处理哪些路径下的异常。
   * 抽取一个异常处理类
      ``` java
      /**
       * 集中处理所有异常
       */
      @Slf4j
      @RestControllerAdvice(basePackages = "cn.cheakin.gulimall.product.controller")
      public class GulimallExceptionControllerAdvice {

          @ExceptionHandler(value = Exception.class) // 也可以返回ModelAndView
          public R handleValidException(MethodArgumentNotValidException exception){
              Map<String,String> map=new HashMap<>();
              // 获取数据校验的错误结果
              BindingResult bindingResult = exception.getBindingResult();
              bindingResult.getFieldErrors().forEach(fieldError -> {
                  String message = fieldError.getDefaultMessage();
                  String field = fieldError.getField();
                  map.put(field, message);
              });

              log.error("数据校验出现问题{},异常类型{}", exception.getMessage(),exception.getClass());

              return R.error(400,"数据校验出现问题").put("data",map);
          }
      }
      ```
      测试： `http://localhost:88/api/product/brand/save`, 会返回异常信息
   * 常用异常处理
      ``` java
      @ExceptionHandler(value = Throwable.class)
      public R handleException(Throwable throwable){
          log.error("未知异常{},异常类型{}", throwable.getMessage(), throwable.getClass());
          return R.error(400,"数据校验出现问题");
      }
      ```
   * 错误状态码
      上面代码中，针对于错误状态码，是我们进行随意定义的，然而正规开发过程中，错误状态码有着严格的定义规则，如该在项目中我们的错误状态码定义
      为了定义这些错误状态码，我们可以单独定义一个常量类，用来存储这些错误状态码, 在`gulimall-common`的`exception`包下创建
      ``` java
      /**
        * 错误码和错误信息定义类
        * 1. 错误码定义规则为5为数字
        * 2. 前两位表示业务场景，最后三位表示错误码。例如：100001。10:通用 001:系统未知异常
        * 3. 维护错误码后需要维护错误描述，将他们定义为枚举形式
        * 错误码列表：
        *  10: 通用
        *      001：参数格式校验
        *  11: 商品
        *  12: 订单
        *  13: 购物车
        *  14: 物流
        */
       public enum BizCodeEnum {

           UNKNOW_EXEPTION(10000,"系统未知异常"),

           VALID_EXCEPTION( 10001,"参数格式校验失败");

           private int code;
           private String msg;

           BizCodeEnum(int code, String msg) {
               this.code = code;
               this.msg = msg;
           }

           public int getCode() {
               return code;
           }

           public String getMsg() {
               return msg;
           }
       }
      ```
   * 测试： `http://localhost:88/api/product/brand/save`

#### 分组校验功能（完成多场景的复杂校验）
比如在新增和更新的接口中, 校验规则不一样, 此时就可以使用分组校验功能
1. groups
   给校验注解，标注上groups，指定什么情况下才需要进行校验
   groups里面的内容要以接口的形式显示出来
   如：指定在更新和添加的时候，都需要进行校验。新增时不需要带id，修改时必须带id, 如
   ``` java
   @Data
   @TableName("pms_brand")
   public class BrandEntity implements Serializable {
     private static final long serialVersionUID = 1L;
 
     /**
     * 品牌id
     */
     @NotNull(message="修改必须指定品牌id", groups = {UpdateGroup.class})
     @Null(message="新增不能指定id", groups = {AddGroup.class})
     @TableId
     private Long brandId;
     /**
     * 品牌名
     */
     @NotBlank(message = "品牌名必须提交", groups = {AddGroup.class, UpdateGroup.class})
     private String name;
     /**
     * 品牌logo地址
     */
     @NotBlank(message = "logo必须是一个合法的url地址", groups = {AddGroup.class})
     @URL(message = "logo必须是一个合法的url地址", groups = {UpdateGroup.class})
     private String logo;
     /**
     * 介绍
     */
     private String descript;
     /**
     * 显示状态[0-不显示；1-显示]
     */
     private Integer showStatus;
     /**
     * 检索首字母
     */
     @NotEmpty(groups = {AddGroup.class})
     @Pattern(regexp = "^[a-zA-Z]$", message = "检索首字母必须是一个字母", groups = {AddGroup.class, UpdateGroup.class})
     private String firstLetter;
     /**
     * 排序
     */
     @NotNull(groups = {AddGroup.class})
     @Min(value = 0, message = "排序必须大于0", groups = {AddGroup.class, UpdateGroup.class})
     private Integer sort;
 
   }
   ```
   接口的也增加和指定校验分组
   ``` java
   @RequestMapping("/save")
    public R save(@RequestBody @Validated({AddGroup.class}) BrandEntity brand){
        brandService.save(brand);
        return R.ok();
    }

    @RequestMapping("/update")
    public R update(@RequestBody @Validated({UpdateGroup.class}) BrandEntity brand){
		brandService.updateById(brand);
        return R.ok();
    }
    ```
    在这种情况下，没有指定分组的校验注解，默认是不起作用的。想要起作用就必须要加groups。
2. @Validated
3. 分组情况下，校验注解生效问题

#### 自定义校验功能
要校验showStatus的01状态，可以用正则，但我们可以利用其他方式解决
复杂场景。比如我们想要下面的场景
``` java
/**
 * 显示状态[0-不显示；1-显示]
 */
@NotNull(groups = {AddGroup.class, UpdateStatusGroup.class})
@ListValue(vals = {0,1}, groups = {AddGroup.class, UpdateGroup.class, UpdateStatusGroup.class})
private Integer showStatus;
```
0. 添加依赖(这个依赖被`spring-boot-starter-validation`集成了)
   ``` xml
   <dependency>
      <groupId>javax.validation</groupId>
      <artifactId>validation-api</artifactId>
      <version>2.0.1.Final</version>
   </dependency>
   ```

1. 编写自定义的校验注解
   必须有3个属性
   message()错误信息
   groups()分组校验
   payload()自定义负载信息
   ``` java
    @Documented
    @Constraint(validatedBy = { ListValueConstraintValidator.class})
    @Target({ METHOD, FIELD, ANNOTATION_TYPE, CONSTRUCTOR, PARAMETER, TYPE_USE })
    @Retention(RUNTIME)
    public @interface ListValue {
        // 使用该属性去Validation.properties中取
        String message() default "{com.atguigu.common.validator.ListValue.message}";

        Class<?>[] groups() default { };

        Class<? extends Payload>[] payload() default { };

        int[] vals() default {};
    }
    ```
   该属性值取哪里取呢？
   `gulimall-common`创建文件`ValidationMessages.properties`(注意编码)
   ``` yml
   cn.cheakin.common.validator.ListValue.message=必须提交指定的值 [0,1]
   ```

2. 编写自定义的校验器
   ``` java
    public class ListValueConstraintValidator implements ConstraintValidator<ListValue,Integer> {
        private Set<Integer> set=new HashSet<>();

        // 初始化方法
        @Override
        public void initialize(ListValue constraintAnnotation) {
            int[] value = constraintAnnotation.vals();
            for (int val : value) {
                set.add(val);
            }
        }

        /**
        * 判断是否校验成功
        * @param value 需要校验的值
        * @param context
        * @return
        */
        @Override
        public boolean isValid(Integer value, ConstraintValidatorContext context) {
            return  set.contains(value);
        }
    }
    ```

3. 关联校验器和校验注解  
  `@Constraint(validatedBy = { ListValueConstraintValidator.class})`
  一个校验注解可以匹配多个校验器

4. 使用实例
  ``` java
  /**
	 * 显示状态[0-不显示；1-显示]
	 */
	@ListValue(value = {0,1},groups ={AddGroup.class})
	private Integer showStatus;
  ```

在`brand.vue`中可以直接修改显示状态, 校验和直接更新对象不同, 所以需要再写一个更新status的接口
`brand.vue`中把`/product/brand/update`修改为`/product/brand/update/status`即可
后端在`BrandController`中新增接口
``` javas
/**
  * 修改状态
  */
@RequestMapping("/update/status")
//@RequiresPermissions("product:brand:update")
public R updateStatus(@RequestBody @Validated({UpdateStatusGroup.class}) BrandEntity brand){
    brandService.updateById(brand);

    return R.ok();
}
```
将对应的实体字段校验加上
``` java
/**
  * 显示状态[0-不显示；1-显示]
  */
@NotNull(groups = {AddGroup.class, UpdateStatusGroup.class})
@ListValue(vals = {0,1}, groups = {AddGroup.class, UpdateStatusGroup.class})
private Integer showStatus;
```
并且在`gulimall-common`中新增`UpdateStatusGroup`类(同上, 内容为空)
``` java
public interface UpdateStatusGroup {

}
```

#### 品牌分类级联管理
此处对应视频P75
##### 品牌管理分页
我们发现品牌管理页面的分页是错的，原因是还没有使用分页去查询
MyBatis Plus 官网： https://baomidou.com/pages/97710a/

在`gulimall-common`的`pom.xml`中导入插件依赖(注意版本)
``` xml
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-extension</artifactId>
    <version>3.3.1</version>
</dependency>
```
在`gulimall-product`中的config包下新建立`MyBatisConfig`类
``` java
@Configuration
@EnableTransactionManagement    // 开启事务
@MapperScan("cn.cheakin.gulimall.product.dao")
public class MybatisConfig {

    // 引入分页插件
    @Bean
    public PaginationInterceptor paginationInterceptor() {
        PaginationInterceptor paginationInterceptor = new PaginationInterceptor();
        // 设置请求的页面大于最大页后操作， true调回到首页，false 继续请求  默认false
        paginationInterceptor.setOverflow(true);
        // 设置最大单页限制数量，默认 500 条，-1 不受限制
        paginationInterceptor.setLimit(1000);
        return paginationInterceptor;
    }
}
```
修改`gulimall-product`中`BrandServiceImpl`的`queryPage()`方法
``` java
@Override
    public PageUtils queryPage(Map<String, Object> params) {
        //1、获取key
        String key = (String) params.get("key");
        QueryWrapper<BrandEntity> queryWrapper = new QueryWrapper<>();
        if (!StringUtils.isEmpty(key)) {
            queryWrapper.eq("brand_id", key).or().like("name", key);
        }

        IPage<BrandEntity> page = this.page(
                new Query<BrandEntity>().getPage(params),
                queryWrapper

        );

        return new PageUtils(page);
    }
```
![/GuliaMall/1659015135646.jpg)

##### 品牌关联分类
代码需要先拷贝**前端**项目的common和peoduct

接下来写后端接口
`CategoryBrandRelationController`新增和修改接口
``` java
/**
  * 获取当前品牌关联的所有分类列表
  */
@GetMapping("/catelog/list")
//@RequiresPermissions("product:categorybrandrelation:list")
public R cateloglist(@RequestParam("brandId")Long brandId){
    List<CategoryBrandRelationEntity> data = categoryBrandRelationService.list(
            new QueryWrapper<CategoryBrandRelationEntity>().eq("brand_id",brandId)
    );

    return R.ok().put("data", data);
}

/**
  * 保存
  */
@RequestMapping("/save")
//@RequiresPermissions("product:categorybrandrelation:save")
public R save(@RequestBody CategoryBrandRelationEntity categoryBrandRelation){
//		categoryBrandRelationService.save(categoryBrandRelation);
    categoryBrandRelationService.saveDetail(categoryBrandRelation);
    return R.ok();
}
```
`CategoryBrandRelationServiceImpl`中新增
``` java
@Autowired
BrandDao brandDao;
@Autowired
CategoryDao categoryDao;

@Override
public void saveDetail(CategoryBrandRelationEntity categoryBrandRelation) {
    Long brandId = categoryBrandRelation.getBrandId();
    Long catelogId = categoryBrandRelation.getCatelogId();
    //1、查询详细名字
    BrandEntity brandEntity = brandDao.selectById(brandId);
    CategoryEntity categoryEntity = categoryDao.selectById(catelogId);

    categoryBrandRelation.setBrandName(brandEntity.getName());
    categoryBrandRelation.setCatelogName(categoryEntity.getName());

    this.save(categoryBrandRelation);
}
```
关联表是直接插入了分类名, 当分类名称被修改时, 也需要同步修改关联表
`BrandController`类
``` java
/**
 * 保存
 */
@RequestMapping("/save")
//@RequiresPermissions("product:brand:save")
public R save(@RequestBody @Validated({AddGroup.class}) BrandEntity brand){
    brandService.updateDetail(brand);
    return R.ok();
}
```
`BrandServiceImpl`类
``` java
@Autowired
CategoryBrandRelationService categoryBrandRelationService;

@Transactional
@Override
public void updateDetail(BrandEntity brand) {
    //保证冗余字段的数据一致
    this.updateById(brand);
    if (!StringUtils.isEmpty(brand.getName())) {
        //同步更新其他关联表中的数据
        categoryBrandRelationService.updateBrand(brand.getBrandId(), brand.getName());

        //TODO 更新其他关联
    }
}
```
`CategoryBrandRelationServiceImpl`类
``` java
@Override
public void updateBrand(Long brandId, String name) {
    CategoryBrandRelationEntity relationEntity = new CategoryBrandRelationEntity();
    relationEntity.setBrandId(brandId);
    relationEntity.setBrandName(name);
    this.update(relationEntity,new UpdateWrapper<CategoryBrandRelationEntity>().eq("brand_id",brandId));
}
```

接下来修改分类的更新
`CategoryController`
``` java
/**
 * 修改
 */
@RequestMapping("/update")
//@RequiresPermissions("product:category:update")
public R update(@RequestBody CategoryEntity category){
//		categoryService.updateById(category);
  categoryService.updateCascade(category);
  return R.ok();
}
```
`CategoryServiceImpl`
``` java
@Autowired
CategoryBrandRelationService categoryBrandRelationService;

/**
 * 级联更新所有关联的数据
 * @param category
 */
@Transactional
@Override
public void updateCascade(CategoryEntity category) {
  this.updateById(category);
  categoryBrandRelationService.updateCategory(category.getCatId(), category.getName());
}
```
`CategoryBrandRelationServiceImpl`
``` java
@Override
public void updateCategory(Long catId, String name) {
    this.baseMapper.updateCategory(catId,name);
}
```
`CategoryBrandRelationDao`
``` java
void updateCategory(@Param("catId") Long catId, @Param("name") String name);
```
`CategoryBrandRelationDao.xml`
``` xml
<update id="updateCategory">
    UPDATE `pms_category_brand_relation` SET catelog_name=#{name} WHERE catelog_id=#{catId}
</update>
```

### 属性分组, SPU和SKU管理
#### SPU&SKU&规格参数&销售属性
SPU：standard product unit(标准化产品单元)：是商品信息聚合的最小单位，是
一组可复用、易检索的标准化信息的集合，该集合描述了一个产品的特性。
如iphoneX是SPU
SKU：stock keeping unit(库存量单位)：库存进出计量的基本单元，可以是件/盒/
托盘等单位。SKU是对于大型连锁超市DC配送中心物流管理的一个必要的方法。
现在已经被引申为产品统一编号的简称，每种产品对应有唯一的SKU号。
如iphoneX 64G 黑色 是SKU

同一个SPU拥有的特性叫基本属性。如机身长度，这个是手机共用的属性。而每
款手机的属性值不同

能决定库存量的叫销售属性。如颜色

基本属性[规格参数]与[销售属性]
每个分类下的商品共享规格参数，与销售属性。只是有些商品不一定要用这个分
类下全部的属性；

属性是以三级分类组织起来的
规格参数中有些是可以提供检索的
规格参数也是基本属性，他们具有自己的分组
属性的分组也是以三级分类组织起来的
属性名确定的，但是值是每一个商品不同来决定的


数据库表
pms数据库下的attr属性表，attr-group表

attr-group-id：几号分组
catelog-id：什么类别下的，比如手机
根据商品找到spu-id，attr-id

属性关系-规格参数-销售属性-三级分类 关联关系
![/GuliaMall/1658842569662.png)
SPU-SKU属性表
![/GuliaMall/1658842766050.jpg)

#### 属性分组-前端组件抽取&父子组件交互
导入菜单数据
![[sys_menus.sql]]

`common`和`product`模块代码略

接口文档地址: `https://easydoc.xyz/s/78237135`

##### 属性分组
现在想要实现点击菜单的左边，能够实现在右边展示数据

根据请求地址http://localhost:8001/#/product-attrgroup

所以应该有`product/attrgroup.vue`。我们之前写过`product/cateory.vue`，现在我们要抽象到`common/cateory.vue`中
1. 左侧内容：
   要在左面显示菜单，右面显示表格复制`<el-row :gutter="20">`，放到`attrgroup.vue`的`<template>`。20表示列间距
   在element-ui文档里找到布局:
	  ``` html
	  <el-row :gutter="20">
    <el-col :span="6"><div class="grid-content bg-purple"></div></el-col>
    <el-col :span="18"><div class="grid-content bg-purple"></div></el-col>
   </el-row>
	  ```
   分为2个模块，分别占6列和18列
   有了布局之后，要在里面放内容。接下来要抽象一个分类vue。新建`common/category.vue`，生成vue模板。把之前写的el-tree放到template标签中
   ```html
   <el-tree :data="menus" :props="defaultProps" node-key="catId" ref="menuTree" @node-click="nodeClick"	></el-tree>
   ```
   所以他把menus绑定到了菜单上，所以我们应该在export default 中有menus的信息该具体信息会随着点击等事件的发生会改变值（或比如created生命周期时），tree也就同步变化了

   common/category写好后，就可以在attrgroup.vue中导入使用了
   ``` html
   <script>
   import Category from "../common/category";
   export default {
     //import引入的组件需要注入到对象中才能使用。组件名:自定义的名字，一致可以省略
     components: { Category},
     ...
   }
   ```


	导入了之后，就可以在attrgroup.vue中找合适位置放好
	``` html
	<el-col :span="6">
	<category @tree-node-click="treenodeclick"></category>
    </el-col>
    ```


2. 右侧表格内容：
    开始填写属性分组页面右侧的表格

    复制`\modules\product\attrgroup.vue`中的部分内
    容div到`attrgroup.vue`
    批量删除是弹窗add-or-update
    导入data、结合components

    **父子组件**
    要实现功能：点击左侧，右侧表格对应内容显示。

    父子组件传递数据：category.vue点击时，引用它的attgroup.vue能感知到， 然后
    通知到add-or-update

    比如嵌套div，里层div有事件后冒泡到外层div（是指一次点击调用了两个div的点
    击函数）

    子组件（category）给父组件（attrgroup）传递数据，事件机制；

    去element-ui的tree部分找event事件，看node-click()

    在category中绑定node-click事件，
    ``` html
    <el-tree :data="menus" :props="defaultProps" node-key="catId" ref="menuTree" @node-click="nodeClick"	></el-tree>
    ```

    this.$emit()
    子组件给父组件发送一个事件，携带上数据；
    ``` js
    nodeClick(data,Node,component){
        console.log("子组件被点击",data,Node,component);
        this.$emit("tree-node-click",data,Node,component);
    }, 
    ```
    第一个参数事件名字随便写，
    后面可以写任意多的东西，事件发生时都会传出去
    `this.$emit(事件名,"...携带的数据");`
    父组件中的获取发送的事件
    在attr-group中写
    `<category @tree-node-click="treeNodeClick"></category>`
    表明他的子组件可能会传递过来点击事件，用自定义的函数接收传递过来的参数

    父组件中进行处理
    ``` js
    //获取发送的事件数据
    treeNodeClick(data,Node,component){
        console.log("attgroup感知到的category的节点被点击",data,Node,component);
        console.log("刚才被点击的菜单ID",data.catId);
    },
    ```

#### 按接口文档开发
https://easydoc.xyz/s/78237135/ZUqEdvA4/OXTgKobR

##### 查询功能
`GET /product/attrgroup/list/{catelogId}`

按照这个url，在`gulimall-product`项目下的`AttrgroupController`里修改
``` java
/**
 * 列表
 * @param  catelogId 0的话查所有
 */
@RequestMapping("/list/{catelogId}")
public R list(@RequestParam Map<String, Object> params,@PathVariable Long catelogId){
    //        PageUtils page = attrGroupService.queryPage(params);
    PageUtils page = attrGroupService.queryPage(params,catelogId);
    return R.ok().put("page", page);
}
```
增加接口与实现
``` java
@Override // AttrGroupServiceImpl.java
public PageUtils queryPage(Map<String, Object> params, Long catelogId) {
    String key = (String) params.get("key");
    QueryWrapper<AttrGroupEntity> wrapper = new QueryWrapper<>();
    // key不为空
    if (!StringUtils.isEmpty(key)) {
        wrapper.and((obj) ->
                    obj.eq("attr_group_id", key).or().like("attr_group_name", key)
                   );
    }
    if (catelogId == 0) {
        // Query可以把map封装为IPage
        IPage<AttrGroupEntity> page =
            this.page(new Query<AttrGroupEntity>().getPage(params),
                      wrapper);
        return new PageUtils(page);
    } else {
        // 增加id信息
        wrapper.eq("catelog_id", catelogId);

        IPage<AttrGroupEntity> page =
            this.page(new Query<AttrGroupEntity>().getPage(params),
                      wrapper);
        return new PageUtils(page);
    }
}
```

测试:
``` json
localhost:88/api/product/attrgroup/list/1
localhost:88/api/product/attrgroup/list/1?page=1&key=aa
{
    "msg": "success",
    "code": 0,
    "page": {
        "totalCount": 0,
        "pageSize": 10,
        "totalPage": 0,
        "currPage": 1,
        "list": []
    }
}
```

然后调整前端
发送请求时url携带id信息，`${this.catId}`，get参数携带page信息
打击第3级分类时才查，修改`attr-group.vue`中的函数即可
``` js
//感知树节点被点击
treenodeclick(data, node, component) {
    if (node.level == 3) {
        this.catId = data.catId;
        this.getDataList(); //重新查询
    }
},
    
// 获取数据列表
getDataList() {
    this.dataListLoading = true;
    this.$http({
        url: this.$http.adornUrl(`/product/attrgroup/list/${this.catId}`),
        method: "get",
        params: this.$http.adornParams({
            page: this.pageIndex,
            limit: this.pageSize,
            key: this.dataForm.key
        })
    }).then(({ data }) => {
        if (data && data.code === 0) {
            this.dataList = data.page.list;
            this.totalPage = data.page.totalCount;
        } else {
            this.dataList = [];
            this.totalPage = 0;
        }
        this.dataListLoading = false;
    });
},
```

##### 新增功能
上面演示了查询功能，下面写insert分类
但是想要下面这个效果：
下拉菜单应该是手机一级分类的，这个功能是级联选择器`<el-cascader>`
级联选择的下拉同样是个options数组，多级的话用children属性即可,只需为 `Cascader` 的options属性指定选项数组即可渲染出一个级联选择器。通过props.expandTrigger可以定义展开子级菜单的触发方式。

去`renren-fast-vue`里找`src\views\modules\product\attrgroup-add-or-update.vue`
修改对应的位置为`<el-cascader ...>`
把data()里的数组categorys绑定到options上即可，更详细的设置可以用props绑定

@JsonInclude去空字段
优化：没有下级菜单时不要有下一级空菜单，在java端把children属性空值去掉，
空集合时去掉字段，
可以用@`JsonInclude(Inlcude.NON_EMPTY)`注解标注在实体类的属性上，
``` java
@TableField(exist =false)
@JsonInclude(JsonInclude.Include.NON_EMPTY)
private List<CategoryEntity> children;
```
提交完后返回页面也刷新了，是用到了父子组件。在$message弹窗结束回调$this.emit

接下来要解决的问题是，修改了该vue后，新增是可以用，修改回显就有问题
了，应该回显3级
``` html
<el-button
  type="text"
  size="small"
  @click="addOrUpdateHandle(scope.row.attrGroupId)"
  >修改</el-button>

<script>
  // 新增 / 修改
  addOrUpdateHandle(id) {
    // 先显示弹窗
    this.addOrUpdateVisible = true;
    // .$nextTick(代表渲染结束后再接着执行
    this.$nextTick(() => {
      // this是attrgroup.vue
      // $refs是它里面的所有组件。在本vue里使用的时候，标签里会些ref=""
      // addOrUpdate这个组件
      // 组件的init(id);方法
      this.$refs.addOrUpdate.init(id);
    });
  },
</script>
```
在init方法里进行回显,但是分类的id还是不对，应该是用数组封装的路径
``` js
init(id) {
  this.dataForm.attrGroupId = id || 0;
  this.visible = true;
  this.$nextTick(() => {
    this.$refs["dataForm"].resetFields();
    if (this.dataForm.attrGroupId) {
      this.$http({
        url: this.$http.adornUrl(
          `/product/attrgroup/info/${this.dataForm.attrGroupId}`
        ),
        method: "get",
        params: this.$http.adornParams()
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.dataForm.attrGroupName = data.attrGroup.attrGroupName;
          this.dataForm.sort = data.attrGroup.sort;
          this.dataForm.descript = data.attrGroup.descript;
          this.dataForm.icon = data.attrGroup.icon;
          this.dataForm.catelogId = data.attrGroup.catelogId;
          //查出catelogId的完整路径
          this.catelogPath =  data.attrGroup.catelogPath;
        }
      });
    }
  });
```

修改AttrGroupEntity
``` java
/**
* 三级分类修改的时候回显路径
*/
@TableField(exist = false)
private Long[] catelogPath;
```
修改controller
``` java
@Autowired
private CategoryService categoryService;

/**
 * 信息
 */
@RequestMapping("/info/{attrGroupId}")
//@RequiresPermissions("product:attrgroup:info")
public R info(@PathVariable("attrGroupId") Long attrGroupId){
    AttrGroupEntity attrGroup = attrGroupService.getById(attrGroupId);
    // 用当前当前分类id查询完整路径并写入 attrGroup
    attrGroup.setCatelogPath(categoryService.findCatelogPath(attrGroup.getCatelogId()));
    return R.ok().put("attrGroup", attrGroup);
}
```
添加service
``` java
@Override // CategoryServiceImpl
public Long[] findCatelogPath(Long catelogId) {
    List<Long> paths = new ArrayList<>();
    paths = findParentPath(catelogId, paths);
    // 收集的时候是顺序 前端是逆序显示的 所以用集合工具类给它逆序一下
    Collections.reverse(paths);
    return paths.toArray(new Long[paths.size()]);
}
/**
  * 递归收集所有父节点
  */
private List<Long> findParentPath(Long catlogId, List<Long> paths) {
    // 1、收集当前节点id
    paths.add(catlogId);
    CategoryEntity byId = this.getById(catlogId);
    if (byId.getParentCid() != 0) {
        findParentPath(byId.getParentCid(), paths);
    }
    return paths;
}
```

优化：会话关闭时清空内容，防止下次开启还遗留数据; 级联选择器可以搜索;
``` html
<el-dialog
    :title="!dataForm.id ? '新增' : '修改'"
    :close-on-click-modal="false"
    :visible.sync="visible"
    @closed="dialogClose"
  >...</el-dialog>
  ...
  <el-cascader filterable placeholder="试试搜索：手机" v-model="catelogPath" :options="categorys"  :props="props"></el-cascader>

<script>
...
dialogClose(){
  this.catelogPath = [];
},
...
</script>
```




#### 品牌关联分类
参考: 品牌管理->品牌关联分类

### 平台属性
提前先在`gulimall-common`的`constant`包中新建常量(对应视频P79)
``` java
public class ProductConstant {

    public enum AttrEnum {
        ATTR_TYPE_BASE(1, "基本属性"), ATTR_TYPE_SALE(0, "销售属性");
        private int code;
        private String msg;

        AttrEnum(int code, String msg) {
            this.code = code;
            this.msg = msg;
        }

        public int getCode() {
            return code;
        }

        public String getMsg() {
            return msg;
        }
    }
}
```

#### 属性的分页查询使用模糊匹配
*前面的代码已经修改过了, 这里还是演示一次. * `AttrGroupServiceImp`
``` java
@Override
public PageUtils queryPage(Map<String, Object> params, Long catelogId) {
    String key = (String) params.get("key");
    QueryWrapper<AttrGroupEntity> wrapper = new QueryWrapper<>();
    // key不为空
    if (StringUtils.isNotEmpty(key)) {
        wrapper.and((obj) ->
                obj.eq("attr_group_id", key).or().like("attr_group_name", key)
        );
    }
    if (catelogId == 0) {
        // Query可以把map封装为IPage
        IPage<AttrGroupEntity> page =
                this.page(new Query<AttrGroupEntity>().getPage(params),
                        wrapper);
        return new PageUtils(page);
    } else {
        // 增加id信息
        wrapper.eq("catelog_id", catelogId);

        IPage<AttrGroupEntity> page =
                this.page(new Query<AttrGroupEntity>().getPage(params),
                        wrapper);
        return new PageUtils(page);
    }
}
```

#### 规格参数新增与VO
**PO、DO、TO、DTO、VO、BO、POJO、DA0**
1. PO持久对象
   PO就是对应数据库中某个表中的一条记录，多个记录可以用PO的集合。PO中应该不包含任何对数据的操作。
2. DO（Domain 0bject)领域对象
   就是从现实世界中推象出来的有形或无形的业务实体。
3. TO(Transfer 0bject)，数据传输对象传输的对象
   不同的应用程序之间传输的对象。微服务
4. DTO(Data Transfer Obiect)数据传输对象
   这个概念来源于J2EE的设汁模式，原来的目的是为了EJB的分布式应用握供粗粒度的数据实体，以减少分布式调用的次数，从而握分布式调用的性能和降低网络负载，但在这里，泛指用于示层与服务层之间的数据传输对象。
5. **VO(value object)值对象**
   通常用干业务层之闾的数据传递，和PO一样也是仅仅包含数据而已。但应是抽象出的业务对象，可以和表对应，也可以不，这根据业务的需要。用new关韃字创建，由GC回收的
   Viewobject：视图对象
   接受页面传递来的对象，封装对象
   将业务处理完成的对象，封装成页面要用的数据
6. BO(business object)业务对象
   从业务模型的度看．见IJML元#领嵫模型的领嵫对象。封装业务逻辑的java对象，通过用DAO方法，结合PO,VO进行业务操作。businessobject:业务对象主要作用是把业务逻辑封装为一个对苤。这个对象可以包括一个或多个其它的对彖。比如一个简历，有教育经历、工怍经历、社会关系等等。我们可以把教育经历对应一个PO工作经历
7. POJO简单无规则java对象
   传统意义的 java 对象。就是说在一些 Object/Relation Mapping 工具中，能够做到维护数据库表记录的perslsent object 完全是一个符合 Java Bean 规范的纯 Java 对象，没有增加别的居性和方法。我的理解就是最基本的 java Bean ，只有属性字段及 setter 和 getter方法！。
   POIO是 DO/DTO/BO/VO 的统称。
8. DAO(data access object)数据访问对象
   是一个sun的一个标准 j2ee 设计模式， 这个模式中有个接口就是 DAO ， 它负持人层的操作。为业务层提供接口。此对象用于访问数据库。通常和 PO 结合使用，DAO 中包含了各种数据库的操作方法。通过它写据库进行相关的操作。夹在业务逻辑与数据库资源中间。配合 VO，提供数据库的 CRUD 操作.

创建`AttrVo`类
``` java
@Data
public class AttrVo {
    /**
     * 属性id
     */
    private Long attrId;
    /**
     * 属性名
     */
    private String attrName;
    /**
     * 是否需要检索[0-不需要，1-需要]
     */
    private Integer searchType;
    /**
     * 值类型[0-为单个值，1-可以选择多个值]
     */
    private Integer valueType;
    /**
     * 属性图标
     */
    private String icon;
    /**
     * 可选值列表[用逗号分隔]
     */
    private String valueSelect;
    /**
     * 属性类型[0-销售属性，1-基本属性，2-既是销售属性又是基本属性]
     */
    private Integer attrType;
    /**
     * 启用状态[0 - 禁用，1 - 启用]
     */
    private Long enable;
    /**
     * 所属分类
     */
    private Long catelogId;
    /**
     * 快速展示【是否展示在介绍上；0-否 1-是】，在sku中仍然可以调整
     */
    private Integer showDesc;

    private Long attrGroupId;
}
```
`AttrController`
``` java
/**
* 保存
*/
@RequestMapping("/save")
//@RequiresPermissions("product:attr:save")
public R save(@RequestBody AttrVo attr){
attrService.saveAttr(attr);

  return R.ok();
}
```
`AttrServiceImpl `
``` java
@Autowired
    AttrAttrgroupRelationDao relationDao;

@Transactional
@Override
public void saveAttr(AttrVo attr) {
    AttrEntity attrEntity = new AttrEntity();
//        attrEntity.setAttrName(attr.getAttrName());
    BeanUtils.copyProperties(attr,attrEntity);
    //1、保存基本数据
    this.save(attrEntity);
    //2、保存关联关系
    AttrAttrgroupRelationEntity relationEntity = new AttrAttrgroupRelationEntity();
    relationEntity.setAttrGroupId(attr.getAttrGroupId());
    relationEntity.setAttrId(attrEntity.getAttrId());
    relationDao.insert(relationEntity);
}
```

#### 规格参数列表
`AttrController`
``` java
///product/attr/base/list/{catelogId}
@GetMapping("/{attrType}/list/{catelogId}")
public R baseAttrList(@RequestParam Map<String, Object> params,
                      @PathVariable("catelogId") Long catelogId,
                      @PathVariable("attrType")String type){

    PageUtils page = attrService.queryBaseAttrPage(params,catelogId,type);
    return R.ok().put("page", page);
}
```
`AttrServiceImpl`
``` java
@Autowired
AttrGroupDao attrGroupDao;
@Autowired
CategoryDao categoryDao;

@Override
public PageUtils queryBaseAttrPage(Map<String, Object> params, Long catelogId, String type) {
   QueryWrapper<AttrEntity> queryWrapper = new QueryWrapper<AttrEntity>().eq("attr_type","base".equalsIgnoreCase(type)?ProductConstant.AttrEnum.ATTR_TYPE_BASE.getCode():ProductConstant.AttrEnum.ATTR_TYPE_SALE.getCode());

    if(catelogId != 0){
        queryWrapper.eq("catelog_id",catelogId);
    }

    String key = (String) params.get("key");
    if(!StringUtils.isEmpty(key)){
        //attr_id  attr_name
        queryWrapper.and((wrapper)->{
            wrapper.eq("attr_id",key).or().like("attr_name",key);
        });
    }

    IPage<AttrEntity> page = this.page(
            new Query<AttrEntity>().getPage(params),
            queryWrapper
    );

    PageUtils pageUtils = new PageUtils(page);
    List<AttrEntity> records = page.getRecords();
    List<AttrRespVo> respVos = records.stream().map((attrEntity) -> {
        AttrRespVo attrRespVo = new AttrRespVo();
        BeanUtils.copyProperties(attrEntity, attrRespVo);

        //1、设置分类和分组的名字
        if("base".equalsIgnoreCase(type)){
            AttrAttrgroupRelationEntity attrId = relationDao.selectOne(new QueryWrapper<AttrAttrgroupRelationEntity>().eq("attr_id", attrEntity.getAttrId()));
            if (attrId != null && attrId.getAttrGroupId()!=null) {
                AttrGroupEntity attrGroupEntity = attrGroupDao.selectById(attrId.getAttrGroupId());
                attrRespVo.setGroupName(attrGroupEntity.getAttrGroupName());
            }

        }


        CategoryEntity categoryEntity = categoryDao.selectById(attrEntity.getCatelogId());
        if (categoryEntity != null) {
            attrRespVo.setCatelogName(categoryEntity.getName());
        }
        return attrRespVo;
    }).collect(Collectors.toList());

    pageUtils.setList(respVos);
    return pageUtils;
}
```
`AttrRespVo`
``` java
@Data
public class AttrRespVo extends AttrVo {
    /**
     * 			"catelogName": "手机/数码/手机", //所属分类名字
     * 			"groupName": "主体", //所属分组名字
     */
    private String catelogName;
    private String groupName;

    private Long[] catelogPath;
}
```

#### 规格修改
`AttrController`
``` java
/**
  * 信息
  */
@RequestMapping("/info/{attrId}")
//@RequiresPermissions("product:attr:info")
public R info(@PathVariable("attrId") Long attrId){
AttrRespVo respVo = attrService.getAttrInfo(attrId);

    return R.ok().put("attr", respVo);
}

/**
  * 修改
  */
@RequestMapping("/update")
//@RequiresPermissions("product:attr:update")
public R update(@RequestBody AttrVo attr){
attrService.updateAttr(attr);

    return R.ok();
}
```
`AttrServiceImpl`
``` java
@Autowired
CategoryService categoryService;

@Override
public AttrRespVo getAttrInfo(Long attrId) {
    AttrRespVo respVo = new AttrRespVo();
    AttrEntity attrEntity = this.getById(attrId);
    BeanUtils.copyProperties(attrEntity,respVo);

    if(attrEntity.getAttrType() == ProductConstant.AttrEnum.ATTR_TYPE_BASE.getCode()){
        //1、设置分组信息
        AttrAttrgroupRelationEntity attrgroupRelation = relationDao.selectOne(new QueryWrapper<AttrAttrgroupRelationEntity>().eq("attr_id", attrId));
        if(attrgroupRelation!=null){
            respVo.setAttrGroupId(attrgroupRelation.getAttrGroupId());
            AttrGroupEntity attrGroupEntity = attrGroupDao.selectById(attrgroupRelation.getAttrGroupId());
            if(attrGroupEntity!=null){
                respVo.setGroupName(attrGroupEntity.getAttrGroupName());
            }
        }
    }

    //2、设置分类信息
    Long catelogId = attrEntity.getCatelogId();
    Long[] catelogPath = categoryService.findCatelogPath(catelogId);

    respVo.setCatelogPath(catelogPath);

    CategoryEntity categoryEntity = categoryDao.selectById(catelogId);
    if(categoryEntity!=null){
        respVo.setCatelogName(categoryEntity.getName());
    }

    return respVo;
}

@Transactional
@Override
public void updateAttr(AttrVo attr) {
    AttrEntity attrEntity = new AttrEntity();
    BeanUtils.copyProperties(attr,attrEntity);
    this.updateById(attrEntity);

    if(attrEntity.getAttrType() == ProductConstant.AttrEnum.ATTR_TYPE_BASE.getCode()){
        //1、修改分组关联
        AttrAttrgroupRelationEntity relationEntity = new AttrAttrgroupRelationEntity();

        relationEntity.setAttrGroupId(attr.getAttrGroupId());
        relationEntity.setAttrId(attr.getAttrId());

        Integer count = relationDao.selectCount(new QueryWrapper<AttrAttrgroupRelationEntity>().eq("attr_id", attr.getAttrId()));
        if(count>0){

            relationDao.update(relationEntity,new UpdateWrapper<AttrAttrgroupRelationEntity>().eq("attr_id",attr.getAttrId()));

        }else{
            relationDao.insert(relationEntity);
        }
    }
}
```

#### 销售属性维护
**设置常量**
在`gulimall-common`的`constant`包中新建常量(重复)
``` java
public class ProductConstant {

    public enum AttrEnum {
        ATTR_TYPE_BASE(1, "基本属性"), ATTR_TYPE_SALE(0, "销售属性");
        private int code;
        private String msg;

        AttrEnum(int code, String msg) {
            this.code = code;
            this.msg = msg;
        }

        public int getCode() {
            return code;
        }

        public String getMsg() {
            return msg;
        }
    }

    public enum ProductStatusEnum {
        NEW_SPU(0, "新建"),
        SPU_UP(1, "商品上架"),
        SPU_DOWN(2, "商品下架"),
        ;

        private int code;

        private String msg;

        public int getCode() {
            return code;
        }

        public String getMsg() {
            return msg;
        }

        ProductStatusEnum(int code, String msg) {
            this.code = code;
            this.msg = msg;
        }
    }
}
```

**修改之前的类型判断**
略

#### 查询分组关联属性&删除关联
`AttrGroupController`
``` java
@Autowired
AttrService attrService;

///product/attrgroup/{attrgroupId}/attr/relation
@GetMapping("/{attrgroupId}/attr/relation")
public R attrRelation(@PathVariable("attrgroupId") Long attrgroupId) {
    List<AttrEntity> entities = attrService.getRelationAttr(attrgroupId);
    return R.ok().put("data", entities);
}
```
`AttrServiceImpl`
``` java
/**
  * 根据分组id查找关联的所有基本属性
  * @param attrgroupId
  * @return
  */
@Override
public List<AttrEntity> getRelationAttr(Long attrgroupId) {
    List<AttrAttrgroupRelationEntity> entities = relationDao.selectList(new QueryWrapper<AttrAttrgroupRelationEntity>().eq("attr_group_id", attrgroupId));

    List<Long> attrIds = entities.stream().map((attr) -> {
        return attr.getAttrId();
    }).collect(Collectors.toList());

    if(attrIds == null || attrIds.size() == 0){
        return null;
    }
    Collection<AttrEntity> attrEntities = this.listByIds(attrIds);
    return (List<AttrEntity>) attrEntities;
}
```
`AttrGroupRelationVo`
``` java
@Data
public class AttrGroupRelationVo {

    //"attrId":1,"attrGroupId":2
    private Long attrId;
    private Long attrGroupId;
}
```
`AttrController`
```java
///product/attrgroup/attr/relation/delete
@PostMapping("/attr/relation/delete")
public R deleteRelation(@RequestBody AttrGroupRelationVo[] vos) {
    attrService.deleteRelation(vos);

    return R.ok();
}
```
`AttrServiceImpl`
``` java
 @Override
public void deleteRelation(AttrGroupRelationVo[] vos) {
    //relationDao.delete(new QueryWrapper<>().eq("attr_id",1L).eq("attr_group_id",1L));

    List<AttrAttrgroupRelationEntity> entities = Arrays.asList(vos).stream().map((item) -> {
        AttrAttrgroupRelationEntity relationEntity = new AttrAttrgroupRelationEntity();
        BeanUtils.copyProperties(item, relationEntity);
        return relationEntity;
    }).collect(Collectors.toList());
    relationDao.deleteBatchRelation(entities);
}
```
`AttrAttrgroupRelationDao`
``` java
void deleteBatchRelation(@Param("entities") List<AttrAttrgroupRelationEntity> entities);
```
`AttrAttrgroupRelationDao.xml`
``` xml
<delete id="deleteBatchRelation">
    DELETE FROM `pms_attr_attrgroup_relation` WHERE
    <foreach collection="entities" item="item" separator="Or">
        (attr_id=#{item.attrId}) AND attr_group_id=${item.attrGroupId})
    </foreach>
</delete>
```

#### 查询分组未关联的属性
**修改查询关联**
之前的代码以处理, 略

**查询分组未关联的属性**
`AttrGroupController`
``` java
///product/attrgroup/{attrgroupId}/noattr/relation
@GetMapping("/{attrgroupId}/noattr/relation")
public R attrNoRelation(@PathVariable("attrgroupId") Long attrgroupId,
                        @RequestParam Map<String, Object> params) {
    PageUtils page = attrService.getNoRelationAttr(params, attrgroupId);
    return R.ok().put("page", page);
}
```
`AttrServiceImpl`
``` java
/**
  * 获取当前分组没有关联的所有属性
  * @param params
  * @param attrgroupId
  * @return
  */
@Override
public PageUtils getNoRelationAttr(Map<String, Object> params, Long attrgroupId) {
    //1、当前分组只能关联自己所属的分类里面的所有属性
    AttrGroupEntity attrGroupEntity = attrGroupDao.selectById(attrgroupId);
    Long catelogId = attrGroupEntity.getCatelogId();
    //2、当前分组只能关联别的分组没有引用的属性
    //2.1)、当前分类下的其他分组
    List<AttrGroupEntity> group = attrGroupDao.selectList(new QueryWrapper<AttrGroupEntity>().eq("catelog_id", catelogId));
    List<Long> collect = group.stream().map(item -> {
        return item.getAttrGroupId();
    }).collect(Collectors.toList());

    //2.2)、这些分组关联的属性
    List<AttrAttrgroupRelationEntity> groupId = relationDao.selectList(new QueryWrapper<AttrAttrgroupRelationEntity>().in("attr_group_id", collect));
    List<Long> attrIds = groupId.stream().map(item -> {
        return item.getAttrId();
    }).collect(Collectors.toList());

    //2.3)、从当前分类的所有属性中移除这些属性；
    QueryWrapper<AttrEntity> wrapper = new QueryWrapper<AttrEntity>().eq("catelog_id", catelogId).eq("attr_type",ProductConstant.AttrEnum.ATTR_TYPE_BASE.getCode());
    if(attrIds!=null && attrIds.size()>0){
        wrapper.notIn("attr_id", attrIds);
    }
    String key = (String) params.get("key");
    if(!StringUtils.isEmpty(key)){
        wrapper.and((w)->{
            w.eq("attr_id",key).or().like("attr_name",key);
        });
    }
    IPage<AttrEntity> page = this.page(new Query<AttrEntity>().getPage(params), wrapper);

    PageUtils pageUtils = new PageUtils(page);

    return pageUtils;
}
```

#### 新增分组与属性关联
`AttrGroupController`
``` java
@Autowired
AttrAttrgroupRelationService relationService;

///product/attrgroup/attr/relation
@PostMapping("/attr/relation")
public R addRelation(@RequestBody List<AttrGroupRelationVo> vos) {

    relationService.saveBatch(vos);
    return R.ok();
}
```
`AttrAttrgroupRelationServiceImpl`
``` java
@Override
public void saveBatch(List<AttrGroupRelationVo> vos) {
    List<AttrAttrgroupRelationEntity> collect = vos.stream().map(item -> {
        AttrAttrgroupRelationEntity relationEntity = new AttrAttrgroupRelationEntity();
        BeanUtils.copyProperties(item, relationEntity);
        return relationEntity;
    }).collect(Collectors.toList());
    this.saveBatch(collect);
}
```




### 新增商品
接口文档地址: `https://easydoc.xyz/s/78237135`
#### 调试会员等级相关接口
**后端**
检查`gulimall-member`的配置以及开启服务注册(@EnableDiscoveryClient)

在`gulimall-gateway`的`application.yml`中为`gulimall-member`添加路由规则(注意顺序, 需要在admin之前)
``` yml
- id: member_route
  uri: lb://gulimall-member
  predicates:
    - Path=/api/member/**
  filters:
    - RewritePath=/api/(?<segment>.*),/$\{segment}
```

**前端**
将前端的`common`, `coupon`, `member`, `order`, `product`, `ware`模块的代码拷贝到`renren-fast-vue\src\views\modules`中

#### 获取分类关联的品牌
* 前端pubsub、publish报错
  视频 p84 关于pubsub、publish报错，无法发送查询品牌信息的请求：
  1. `npm install --save pubsub-js`, (无法安装的话可以尝试`npm install --save pubsub-js`)
  2. 在src下的main.js中引用：
    - `import PubSub from 'pubsub-js'`
    - `Vue.prototype.PubSub = PubSub`
* 后端启动报循环依赖的问题
  - 可以在配置文件中配置: `spring.main.allow-circular-references=true`
  - 或是在循环依赖的地方使用`@Lazy`注解

`CategoryBrandRelationController`
``` java
/**
  *  /product/categorybrandrelation/brands/list
  *
  *  1、Controller：处理请求，接受和校验数据
  *  2、Service接受controller传来的数据，进行业务处理
  *  3、Controller接受Service处理完的数据，封装页面指定的vo
  */
@GetMapping("/brands/list")
public R relationBrandsList(@RequestParam(value = "catId",required = true)Long catId){
    List<BrandEntity> vos = categoryBrandRelationService.getBrandsByCatId(catId);

    List<BrandVo> collect = vos.stream().map(item -> {
        BrandVo brandVo = new BrandVo();
        brandVo.setBrandId(item.getBrandId());
        brandVo.setBrandName(item.getName());

        return brandVo;
    }).collect(Collectors.toList());

    return R.ok().put("data",collect);

}
```
`BrandVo`
``` java
@Data
public class BrandVo {

    /**
     * "brandId": 0,
     * "brandName": "string",
     */
    private Long brandId;
    private String  brandName;
}
```
`CategoryBrandRelationServiceImpl`
``` java
@Autowired
CategoryBrandRelationDao relationDao;
@Autowired
BrandService brandService;

@Override
public List<BrandEntity> getBrandsByCatId(Long catId) {
    List<CategoryBrandRelationEntity> catelogId = relationDao.selectList(new QueryWrapper<CategoryBrandRelationEntity>().eq("catelog_id", catId));
    List<BrandEntity> collect = catelogId.stream().map(item -> {
        Long brandId = item.getBrandId();
        BrandEntity byId = brandService.getById(brandId);
        return byId;
    }).collect(Collectors.toList());
    return collect;
}
```

#### 获取分类下所有分组以及属性
`AttrGroupController`
``` java
///product/attrgroup/{catelogId}/withattr
@GetMapping("/{catelogId}/withattr")
public R getAttrGroupWithAttrs(@PathVariable("catelogId") Long catelogId) {

    //1、查出当前分类下的所有属性分组，
    //2、查出每个属性分组的所有属性
    List<AttrGroupWithAttrsVo> vos = attrGroupService.getAttrGroupWithAttrsByCatelogId(catelogId);
    return R.ok().put("data", vos);
}
```
`AttrGroupWithAttrsVo`
``` java
@Data
public class AttrGroupWithAttrsVo {

    /**
     * 分组id
     */
    private Long attrGroupId;
    /**
     * 组名
     */
    private String attrGroupName;
    /**
     * 排序
     */
    private Integer sort;
    /**
     * 描述
     */
    private String descript;
    /**
     * 组图标
     */
    private String icon;
    /**
     * 所属分类id
     */
    private Long catelogId;

    private List<AttrEntity> attrs;
}
```
`AttrGroupServiceImpl`
``` java
@Autowired
AttrService attrService;

@Override
public List<AttrGroupWithAttrsVo> getAttrGroupWithAttrsByCatelogId(Long catelogId) {
    //1、查询分组信息
    List<AttrGroupEntity> attrGroupEntities = this.list(new QueryWrapper<AttrGroupEntity>().eq("catelog_id", catelogId));

    //2、查询所有属性
    return attrGroupEntities.stream().map(group -> {
        AttrGroupWithAttrsVo attrsVo = new AttrGroupWithAttrsVo();
        BeanUtils.copyProperties(group, attrsVo);
        List<AttrEntity> attrs = attrService.getRelationAttr(attrsVo.getAttrGroupId());
        attrsVo.setAttrs(attrs);
        return attrsVo;
    }).collect(Collectors.toList());
}
```

视频 p85 数据库里少了`value_type`字段, 解决如下(用笔记中的sql创建的话就没有问题, 可以忽略)：
在数据库的`pms_attr`表加上`value_type`字段，类型为`tinyint`就行；
在代码中，`AttyEntity.java`、`AttrVo.java`中各添加：`private Integer valueType`，
在`AttrDao.xml`中添加：`<result property="valueType" column="value_type"/>`

视频 p85 规格参数显示不出来页面，原因是要在每个分组属性上至少关联一个属性。控制台foreach报错null. 解决如下：
在`spuadd.vue`的`showBaseAttrs()`方法中在 //先对表单的baseAttrs进行初始化加上非空判断 `if (item.attrs != null)`就可以了
``` js
data.data.forEach(item => {
  let attrArray = [];
  if (item.attrs != null) {
    item.attrs.forEach(attr => {
    attrArray.push({
      attrId: attr.attrId,
      attrValues: "",
      showDesc: attr.showDesc
    });
  });
  }
  
  this.dataResp.baseAttrs.push(attrArray);
});
```

#### 商品新增vo抽取
参照视频生成以下这些vo:
1. 其中价格和小数字段需要换为`BigDecimal`类型;
2. 使用`@Data`替换get和set方法;
3. 主键id更换为`Long`类型;
`Attr`
``` java
@Data
public class Attr {

    private Long attrId;
    private String attrName;
    private String attrValue;

}
```
`BaseAttrs `
``` java
@Data
public class BaseAttrs {

    private Long attrId;
    private String attrValues;
    private int showDesc;
}
```
`Bounds `
``` java
@Data
public class Bounds {

    private BigDecimal buyBounds;
    private BigDecimal growBounds;

}
```
`Images`
``` java
@Data
public class Images {

    private String imgUrl;
    private int defaultImg;

}
```
`MemberPrice`
``` java
@Data
public class MemberPrice {

    private Long id;
    private String name;
    private BigDecimal price;

}
```
`Skus`
``` java
@Data
public class Skus {

    private List<Attr> attr;
    private String skuName;
    private BigDecimal price;
    private String skuTitle;
    private String skuSubtitle;
    private List<Images> images;
    private List<String> descar;
    private int fullCount;
    private BigDecimal discount;
    private int countStatus;
    private BigDecimal fullPrice;
    private BigDecimal reducePrice;
    private int priceStatus;
    private List<MemberPrice> memberPrice;

}
```
`SpuSaveVo`
``` java
@Data
public class SpuSaveVo {

    private String spuName;
    private String spuDescription;
    private Long catalogId;
    private Long brandId;
    private BigDecimal weight;
    private int publishStatus;
    private List<String> decript;
    private List<String> images;
    private Bounds bounds;
    private List<BaseAttrs> baseAttrs;
    private List<Skus> skus;

}
```

#### 商品新增业务流程
**接下来写产品对应的接口**
保存的业务流程涉及到了远程服务调用, 那么远程服务就需要保证以下几点(视频P90)
1. 远程服务必须上线(配置注册中心地址)
2. 一定要开启服务注册与发现功能(@EnableDiscoveryClient)
3. 一定要开启远程调用功能(@EnableFeignClients(basePackages = "xxx")), 且需要声明可远程调用的接口(FeignClient)
以后就不一一列举了
`SpuInfoController`
``` java
/**
  * 修改
  */
@RequestMapping("/update")
//@RequiresPermissions("product:spuinfo:update")
public R update(@RequestBody SpuSaveVo vo){
// spuInfoService.updateById(spuInfo);
    spuInfoService.saveSpuInfo(vo);

    return R.ok();
}
```
`SpuInfoServiceImpl`
``` java
@Autowired
SpuInfoDescService spuInfoDescService;
@Autowired
SpuImagesService imagesService;
@Autowired
AttrService attrService;
@Autowired
ProductAttrValueService attrValueService;
@Autowired
SkuInfoService skuInfoService;
@Autowired
SkuImagesService skuImagesService;
@Autowired
SkuSaleAttrValueService skuSaleAttrValueService;

/**
  * //TODO 高级部分完善
  * @param vo
  */
@Transactional
@Override
public void saveSpuInfo(SpuSaveVo vo) {
    //1、保存spu基本信息 pms_spu_info
    SpuInfoEntity infoEntity = new SpuInfoEntity();
    BeanUtils.copyProperties(vo, infoEntity);
    infoEntity.setCreateTime(new Date());
    infoEntity.setUpdateTime(new Date());
    this.saveBaseSpuInfo(infoEntity);

    //2、保存Spu的描述图片 pms_spu_info_desc
    List<String> decript = vo.getDecript();
    SpuInfoDescEntity descEntity = new SpuInfoDescEntity();
    descEntity.setSpuId(infoEntity.getId());
    descEntity.setDecript(String.join(",", decript));
    spuInfoDescService.saveSpuInfoDesc(descEntity);

    //3、保存spu的图片集 pms_spu_images
    List<String> images = vo.getImages();
    imagesService.saveImages(infoEntity.getId(), images);

    //4、保存spu的规格参数;pms_product_attr_value
    List<BaseAttrs> baseAttrs = vo.getBaseAttrs();
    List<ProductAttrValueEntity> collect = baseAttrs.stream().map(attr -> {
        ProductAttrValueEntity valueEntity = new ProductAttrValueEntity();
        valueEntity.setAttrId(attr.getAttrId());
        AttrEntity id = attrService.getById(attr.getAttrId());
        valueEntity.setAttrName(id.getAttrName());
        valueEntity.setAttrValue(attr.getAttrValues());
        valueEntity.setQuickShow(attr.getShowDesc());
        valueEntity.setSpuId(infoEntity.getId());

        return valueEntity;
    }).collect(Collectors.toList());
    attrValueService.saveProductAttr(collect);

    //5、保存spu的积分信息；gulimall_sms->sms_spu_bounds
    Bounds bounds = vo.getBounds();
    SpuBoundTo spuBoundTo = new SpuBoundTo();
    BeanUtils.copyProperties(bounds, spuBoundTo);
    spuBoundTo.setSpuId(infoEntity.getId());
    R r = couponFeignService.saveSpuBounds(spuBoundTo);
    if (r.getCode() != 0) {
        log.error("远程保存spu积分信息失败");
    }

    //5、保存当前spu对应的所有sku信息；
    List<Skus> skus = vo.getSkus();
    if (skus != null && skus.size() > 0) {
        skus.forEach(item -> {
            String defaultImg = "";
            for (Images image : item.getImages()) {
                if (image.getDefaultImg() == 1) {
                    defaultImg = image.getImgUrl();
                }
            }
            //    private String skuName;
            //    private BigDecimal price;
            //    private String skuTitle;
            //    private String skuSubtitle;
            SkuInfoEntity skuInfoEntity = new SkuInfoEntity();
            BeanUtils.copyProperties(item, skuInfoEntity);
            skuInfoEntity.setBrandId(infoEntity.getBrandId());
            skuInfoEntity.setCatalogId(infoEntity.getCatalogId());
            skuInfoEntity.setSaleCount(0L);
            skuInfoEntity.setSpuId(infoEntity.getId());
            skuInfoEntity.setSkuDefaultImg(defaultImg);
            //5.1）、sku的基本信息；pms_sku_info
            skuInfoService.saveSkuInfo(skuInfoEntity);

            Long skuId = skuInfoEntity.getSkuId();

            List<SkuImagesEntity> imagesEntities = item.getImages().stream().map(img -> {
                SkuImagesEntity skuImagesEntity = new SkuImagesEntity();
                skuImagesEntity.setSkuId(skuId);
                skuImagesEntity.setImgUrl(img.getImgUrl());
                skuImagesEntity.setDefaultImg(img.getDefaultImg());
                return skuImagesEntity;
            }).filter(entity -> {
                //返回true就是需要，false就是剔除
                return !StringUtils.isEmpty(entity.getImgUrl());
            }).collect(Collectors.toList());
            //5.2）、sku的图片信息；pms_sku_image
            skuImagesService.saveBatch(imagesEntities);

            List<Attr> attr = item.getAttr();
            List<SkuSaleAttrValueEntity> skuSaleAttrValueEntities = attr.stream().map(a -> {
                SkuSaleAttrValueEntity attrValueEntity = new SkuSaleAttrValueEntity();
                BeanUtils.copyProperties(a, attrValueEntity);
                attrValueEntity.setSkuId(skuId);

                return attrValueEntity;
            }).collect(Collectors.toList());
            //5.3）、sku的销售属性信息：pms_sku_sale_attr_value
            skuSaleAttrValueService.saveBatch(skuSaleAttrValueEntities);

            // //5.4）、sku的优惠、满减等信息；gulimall_sms->sms_sku_ladder\sms_sku_full_reduction\sms_member_price
            SkuReductionTo skuReductionTo = new SkuReductionTo();
            BeanUtils.copyProperties(item, skuReductionTo);
            skuReductionTo.setSkuId(skuId);
            if (skuReductionTo.getFullCount() > 0 || skuReductionTo.getFullPrice().compareTo(new BigDecimal("0")) == 1) {
                R r1 = couponFeignService.saveSkuReduction(skuReductionTo);
                if (r1.getCode() != 0) {
                    log.error("远程保存sku优惠信息失败");
                }
            }
        });
    }
}

@Override
public void saveBaseSpuInfo(SpuInfoEntity infoEntity) {
    this.baseMapper.insert(infoEntity);
}
```
`SpuInfoDescServiceImpl`
``` java
@Override
public void saveSpuInfoDesc(SpuInfoDescEntity descEntity) {
    this.baseMapper.insert(descEntity);
}
```
`SpuImagesServiceImpl`
``` java
@Override
public void saveImages(Long id, List<String> images) {
    if(images == null || images.size() == 0){

    }else{
        List<SpuImagesEntity> collect = images.stream().map(img -> {
            SpuImagesEntity spuImagesEntity = new SpuImagesEntity();
            spuImagesEntity.setSpuId(id);
            spuImagesEntity.setImgUrl(img);

            return spuImagesEntity;
        }).collect(Collectors.toList());

        this.saveBatch(collect);
    }
}
```
`ProductAttrValueServiceImpl`
``` java
@Override
public void saveProductAttr(List<ProductAttrValueEntity> collect) {
    this.saveBatch(collect);
}
```
`SkuInfoServiceImpl`
``` java
@Override
public void saveSkuInfo(SkuInfoEntity skuInfoEntity) {
    this.baseMapper.insert(skuInfoEntity);
}
```
涉及远程调用, 在启动类上添加`@EnableFeignClients`注解
新建`CouponFeignService`接口
``` java
@FeignClient("gulimall-coupon")
public interface CouponFeignService {

    /**
     * 1、CouponFeignService.saveSpuBounds(spuBoundTo);
     * 1）、@RequestBody将这个对象转为json。
     * 2）、找到gulimall-coupon服务，给/coupon/spubounds/save发送请求。
     * 将上一步转的json放在请求体位置，发送请求；
     * 3）、对方服务收到请求。请求体里有json数据。
     * (@RequestBody SpuBoundsEntity spuBounds)；将请求体的json转为SpuBoundsEntity；
     * 只要json数据模型是兼容的。双方服务无需使用同一个to
     *
     * @param spuBoundTo
     * @return
     */
    @PostMapping("/coupon/spubounds/save")
    R saveSpuBounds(@RequestBody SpuBoundTo spuBoundTo);

    @PostMapping("/coupon/skufullreduction/saveinfo")
    R saveSkuReduction(@RequestBody SkuReductionTo skuReductionTo);
}
```
to一般都是服务间调用, 所以不指定的话都是在`gulimall-common`中
`gulimall-common`中`SpuBoundTo`
``` java
@Data
public class SpuBoundTo {

    private Long spuId;
    private BigDecimal buyBounds;
    private BigDecimal growBounds;

}
```
`gulimall-coupon`中`SpuBoundsController`
``` java
/**
  * 保存
  */
@PostMapping("/save")
//@RequiresPermissions("coupon:spubounds:save")
public R save(@RequestBody SpuBoundsEntity spuBounds){
spuBoundsService.save(spuBounds);

    return R.ok();
}
```
`gulimall-common`中`SkuReductionTo`
``` java
@Data
public class SkuReductionTo {

    private Long skuId;
    private int fullCount;
    private BigDecimal discount;
    private int countStatus;
    private BigDecimal fullPrice;
    private BigDecimal reducePrice;
    private int priceStatus;
    private List<MemberPrice> memberPrice;

}
```
同样的, `SkuReductionTo`中也需要`MemberPrice`, 直接从`gulimall-product`拷贝到`gulimall-common`里即可
``` java
@Data
public class MemberPrice {

    private Long id;
    private String name;
    private BigDecimal price;

}
```
`gulimall-coupon`中`SkuFullReductionController`
``` java
@PostMapping("/saveinfo")
public R saveInfo(@RequestBody SkuReductionTo reductionTo){

    skuFullReductionService.saveSkuReduction(reductionTo);
    return R.ok();
}
```
`gulimall-coupon`中`SkuFullReductionServiceImpl`
``` java
@Autowired
SkuLadderService skuLadderService;
@Autowired
MemberPriceService memberPriceService;

@Override
public void saveSkuReduction(SkuReductionTo reductionTo) {
    //1、// //5.4）、sku的优惠、满减等信息；gulimall_sms->sms_sku_ladder\sms_sku_full_reduction\sms_member_price
    //sms_sku_ladder
    SkuLadderEntity skuLadderEntity = new SkuLadderEntity();
    skuLadderEntity.setSkuId(reductionTo.getSkuId());
    skuLadderEntity.setFullCount(reductionTo.getFullCount());
    skuLadderEntity.setDiscount(reductionTo.getDiscount());
    skuLadderEntity.setAddOther(reductionTo.getCountStatus());
    if(reductionTo.getFullCount() > 0){
        skuLadderService.save(skuLadderEntity);
    }

    //2、sms_sku_full_reduction
    SkuFullReductionEntity reductionEntity = new SkuFullReductionEntity();
    BeanUtils.copyProperties(reductionTo,reductionEntity);
    if(reductionEntity.getFullPrice().compareTo(new BigDecimal("0"))==1){
        this.save(reductionEntity);
    }

    //3、sms_member_price
    List<MemberPrice> memberPrice = reductionTo.getMemberPrice();

    List<MemberPriceEntity> collect = memberPrice.stream().map(item -> {
        MemberPriceEntity priceEntity = new MemberPriceEntity();
        priceEntity.setSkuId(reductionTo.getSkuId());
        priceEntity.setMemberLevelId(item.getId());
        priceEntity.setMemberLevelName(item.getName());
        priceEntity.setMemberPrice(item.getPrice());
        priceEntity.setAddOther(1);
        return priceEntity;
    }).filter(item->{
        return item.getMemberPrice().compareTo(new BigDecimal("0")) == 1;
    }).collect(Collectors.toList());

    memberPriceService.saveBatch(collect);
}
```
由于使用远程调用, 以后可能会经常使用到`R::getCode()`, 所以在`gulimall-common`的`R`类中新增
``` java
public Integer getCode() {

    return (Integer) this.get("code");
}
```

#### debug
由于服务启的较多, 我们可以为每个应用都限制内存占用, 新版IDEA如: 
![/GuliaMall/1659279776189.jpg)
为方便一次启动多个服务, 可以船舰一个复合应用, 以后直接启动创建的复合应用即可: 
![/GuliaMall/1659280330784.jpg)

debug时，mysql默认的隔离级别为读已提交，为了能够在调试过程中，获取到数据库中的数据信息，可以调整隔离级别为读未提交：
``` sql
SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
```

视频p92 feign超时异常导致读取失败, 解决如下：
在`gulimall-product`的`application.yml`添加如下即可解决(时间设置长点就行了)
``` yml
ribbon:
  ReadTimeout: 30000
  ConnectTimeout: 30000
```


修改`guliamll-product`中`SpuInfoDescEntity`的id插入方式
``` java
@Data
@TableName("pms_spu_info_desc")
public class SpuInfoDescEntity implements Serializable {
	private static final long serialVersionUID = 1L;

	/**
	 * 商品id
	 */
	@TableId(type = IdType.INPUT)
	private Long spuId;
	/**
	 * 商品介绍
	 */
	private String decript;

}
```
`gulimall-common`的`R`类
``` java
public Integer getCode() {

    return (Integer) this.get("code");
}
```

### 商品管理
接口文档地址: `https://easydoc.xyz/s/78237135`
#### SPU检索
`SpuInfoController`
``` java
/**
  * 列表
  */
@RequestMapping("/list")
//@RequiresPermissions("product:spuinfo:list")
public R list(@RequestParam Map<String, Object> params) {
    // PageUtils page = spuInfoService.queryPage(params);
    PageUtils page = spuInfoService.queryPageByCondition(params);

    return R.ok().put("page", page);
}
```
`SpuInfoServiceImpl`
``` java
@Override
public PageUtils queryPageByCondition(Map<String, Object> params) {
    QueryWrapper<SpuInfoEntity> wrapper = new QueryWrapper<>();

    String key = (String) params.get("key");
    if (!StringUtils.isEmpty(key)) {
        wrapper.and((w) -> {
            w.eq("id", key).or().like("spu_name", key);
        });
    }
    // status=1 and (id=1 or spu_name like xxx)
    String status = (String) params.get("status");
    if (!StringUtils.isEmpty(status)) {
        wrapper.eq("publish_status", status);
    }

    String brandId = (String) params.get("brandId");
    if (!StringUtils.isEmpty(brandId) && !"0".equalsIgnoreCase(brandId)) {
        wrapper.eq("brand_id", brandId);
    }

    String catelogId = (String) params.get("catelogId");
    if (!StringUtils.isEmpty(catelogId) && !"0".equalsIgnoreCase(catelogId)) {
        wrapper.eq("catalog_id", catelogId);
    }

    /**
      * status: 2
      * key:
      * brandId: 9
      * catelogId: 225
      */

    IPage<SpuInfoEntity> page = this.page(
            new Query<SpuInfoEntity>().getPage(params),
            wrapper
    );

    return new PageUtils(page);
}
```
发现前端字段映射错误, 修改`spu.vue`的状态映射
``` html
<el-select style="width:160px" v-model="dataForm.status" clearable>
  <el-option label="新建" :value="0"></el-option>
  <el-option label="上架" :value="1"></el-option>
  <el-option label="下架" :value="2"></el-option>
</el-select>
```

**设置日期数据规则**
在对应项目的`application.yml`文件中
``` YML
spring:
	jackson:
		date-format: yyyy-MM-dd HH:mm:ss
```
这样返回时间的时候就是被格式化过的了

#### SKU检索
`SkuInfoController`
``` java
@RequestMapping("/list")
//@RequiresPermissions("product:skuinfo:list")
public R list(@RequestParam Map<String, Object> params){
    // PageUtils page = skuInfoService.queryPage(params);
    PageUtils page = skuInfoService.queryPageByCondition(params);

    return R.ok().put("page", page);
}
```
`SkuInfoServiceImpl`
``` java
@Override
public PageUtils queryPageByCondition(Map<String, Object> params) {
    QueryWrapper<SkuInfoEntity> queryWrapper = new QueryWrapper<>();
    /**
      * key:
      * catelogId: 0
      * brandId: 0
      * min: 0
      * max: 0
      */
    String key = (String) params.get("key");
    if (!StringUtils.isEmpty(key)) {
        queryWrapper.and((wrapper) -> {
            wrapper.eq("sku_id", key).or().like("sku_name", key);
        });
    }

    String catelogId = (String) params.get("catelogId");
    if (!StringUtils.isEmpty(catelogId) && !"0".equalsIgnoreCase(catelogId)) {

        queryWrapper.eq("catalog_id", catelogId);
    }

    String brandId = (String) params.get("brandId");
    if (!StringUtils.isEmpty(brandId) && !"0".equalsIgnoreCase(catelogId)) {
        queryWrapper.eq("brand_id", brandId);
    }

    String min = (String) params.get("min");
    if (!StringUtils.isEmpty(min)) {
        queryWrapper.ge("price", min);
    }

    String max = (String) params.get("max");

    if (!StringUtils.isEmpty(max)) {
        try {
            BigDecimal bigDecimal = new BigDecimal(max);

            if (bigDecimal.compareTo(new BigDecimal("0")) == 1) {
                queryWrapper.le("price", max);
            }
        } catch (Exception e) {

        }
    }

    IPage<SkuInfoEntity> page = this.page(
            new Query<SkuInfoEntity>().getPage(params),
            queryWrapper
    );

    return new PageUtils(page);
}
```


### 仓库管理
接口文档地址: `https://easydoc.xyz/s/78237135`
#### 整合ware服务 & 获取仓库列表
**整合gulimall-ware**
仓库管理在`gulimall-ware`中, 所以需要将`gulimall-ware`注册到注册中心
`gulimall-ware`的`application.yml`中指定注册中心地址, 顺便指定以下服务名字
``` yml
spring:
  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1:8848
```
并在启动类上使用`@EnableDiscoveryClient`注解开启服务注册与发现功能
同时启动类上使用`@MapperScan("cn.cheakin.gulimall.ware.dao")`开启mybatis-plus的包扫描(配置文件或配置类中配置了也可以忽略), 使用`@EnableTransactionManagement`开启事务功能(同样的, 配置文件或配置类中配置了也可以忽略)
*在启动设置中设置jvm的内存占用`-Xmx100m`(之前设置过了就可以忽略了)*

**配置网关**
在`gulimall-gateway`的`application.yml`中配置仓库服务的路由规则(注意顺序, 要在admin的路由之前)
``` yml
- id: ware_route
  uri: lb://gulimall-ware
  predicates:
    - Path=/api/ware/**
  filters:
    - RewritePath=/api/(?<segment>.*),/$\{segment}
```

**获取仓库列表**
`gulimall-ware`的`WareInfoServiceImpl`
``` java
@Override
public PageUtils queryPage(Map<String, Object> params) {
    QueryWrapper<WareInfoEntity> wareInfoEntityQueryWrapper = new QueryWrapper<>();
    String key = (String) params.get("key");
    if(!StringUtils.isEmpty(key)){
        wareInfoEntityQueryWrapper.eq("id",key).or()
                .like("name",key)
                .or().like("address",key)
                .or().like("areacode",key);
    }

    IPage<WareInfoEntity> page = this.page(
            new Query<WareInfoEntity>().getPage(params),
            wareInfoEntityQueryWrapper
    );

    return new PageUtils(page);
}
```

为方便调试我们设置一下日志打印级别, 在`application.yml`中
``` yml
logging:
  level:
    cn.cheakin: debug # 注意更换包名
```

#### 查询库存 & 创建采购需求
**查询库存**
`WareSkuServiceImpl`
``` java
@Override
public PageUtils queryPage(Map<String, Object> params) {
    /**
      * skuId: 1
      * wareId: 2
      */
    QueryWrapper<WareSkuEntity> queryWrapper = new QueryWrapper<>();
    String skuId = (String) params.get("skuId");
    if(!StringUtils.isEmpty(skuId)){
        queryWrapper.eq("sku_id",skuId);
    }

    String wareId = (String) params.get("wareId");
    if(!StringUtils.isEmpty(wareId)){
        queryWrapper.eq("ware_id",wareId);
    }


    IPage<WareSkuEntity> page = this.page(
            new Query<WareSkuEntity>().getPage(params),
            queryWrapper
    );

    return new PageUtils(page);
}
```

**创建采购需求(查询)**
`PurchaseDetailServiceImpl`
``` java
@Override
public PageUtils queryPage(Map<String, Object> params) {
    /**
      * status: 0,//状态
      *    wareId: 1,//仓库id
      */

    QueryWrapper<PurchaseDetailEntity> queryWrapper = new QueryWrapper<PurchaseDetailEntity>();

    String key = (String) params.get("key");
    if(!StringUtils.isEmpty(key)){
        //purchase_id  sku_id
        queryWrapper.and(w->{
            w.eq("purchase_id",key).or().eq("sku_id",key);
        });
    }

    String status = (String) params.get("status");
    if(!StringUtils.isEmpty(status)){
        //purchase_id  sku_id
        queryWrapper.eq("status",status);
    }

    String wareId = (String) params.get("wareId");
    if(!StringUtils.isEmpty(wareId)){
        //purchase_id  sku_id
        queryWrapper.eq("ware_id",wareId);
    }

    IPage<PurchaseDetailEntity> page = this.page(
            new Query<PurchaseDetailEntity>().getPage(params),
            queryWrapper
    );

    return new PageUtils(page);
}
```

#### 合并采购需求
![/GuliaMall/1659368290028.jpg)
**查询未领取的采购单**
`PurchaseServiceImpl`
``` java
@Override
public PageUtils queryPageUnreceivePurchase(Map<String, Object> params) {
    IPage<PurchaseEntity> page = this.page(
            new Query<PurchaseEntity>().getPage(params),
            new QueryWrapper<PurchaseEntity>().eq("status",0).or().eq("status",1)
    );

    return new PageUtils(page);
}
```

**合并采购需求**
`PurchaseController`
``` java
///ware/purchase/unreceive/list
///ware/purchase/merge
@PostMapping("/merge")
public R merge(@RequestBody MergeVo mergeVo){

    purchaseService.mergePurchase(mergeVo);
    return R.ok();
}
```
创建`MergeVo`
```java
@Data
public class MergeVo {

    private Long purchaseId; //整单id
    private List<Long> items;//[1,2,3,4] //合并项集合
    
}
```
`PurchaseServiceImpl`
``` java
@Autowired
PurchaseDetailService detailService;

@Transactional
@Override
public void mergePurchase(MergeVo mergeVo) {
    Long purchaseId = mergeVo.getPurchaseId();
    if(purchaseId == null){
        //1、新建一个
        PurchaseEntity purchaseEntity = new PurchaseEntity();

        purchaseEntity.setStatus(WareConstant.PurchaseStatusEnum.CREATED.getCode());
        purchaseEntity.setCreateTime(new Date());
        purchaseEntity.setUpdateTime(new Date());
        this.save(purchaseEntity);
        purchaseId = purchaseEntity.getId();
    }

    //TODO 确认采购单状态是0,1才可以合并

    List<Long> items = mergeVo.getItems();
    Long finalPurchaseId = purchaseId;
    List<PurchaseDetailEntity> collect = items.stream().map(i -> {
        PurchaseDetailEntity detailEntity = new PurchaseDetailEntity();

        detailEntity.setId(i);
        detailEntity.setPurchaseId(finalPurchaseId);
        detailEntity.setStatus(WareConstant.PurchaseDetailStatusEnum.ASSIGNED.getCode());
        return detailEntity;
    }).collect(Collectors.toList());

    detailService.updateBatchById(collect);

    PurchaseEntity purchaseEntity = new PurchaseEntity();
    purchaseEntity.setId(purchaseId);
    purchaseEntity.setUpdateTime(new Date());
    this.updateById(purchaseEntity);
}
```
在`gulimall-common`中创建`WareConstant`常量类
``` java
public class WareConstant {

    public enum  PurchaseStatusEnum{
        CREATED(0,"新建"),ASSIGNED(1,"已分配"),
        RECEIVE(2,"已领取"),FINISH(3,"已完成"),
        HASERROR(4,"有异常");
        private int code;
        private String msg;

        PurchaseStatusEnum(int code,String msg){
            this.code = code;
            this.msg = msg;
        }

        public int getCode() {
            return code;
        }

        public String getMsg() {
            return msg;
        }
    }


    public enum  PurchaseDetailStatusEnum{
        CREATED(0,"新建"),ASSIGNED(1,"已分配"),
        BUYING(2,"正在采购"),FINISH(3,"已完成"),
        HASERROR(4,"采购失败");
        private int code;
        private String msg;

        PurchaseDetailStatusEnum(int code,String msg){
            this.code = code;
            this.msg = msg;
        }

        public int getCode() {
            return code;
        }

        public String getMsg() {
            return msg;
        }
    }
}
```

**设置日期数据规则**
在对应项目的`application.yml`文件中
``` YML
spring:
	jackson:
		date-format: yyyy-MM-dd HH:mm:ss
```

#### 领取采购单
这里不属于仓库模块中的内容, 所以直接使用接口调用的方式测试
`PurchaseController`
``` java
/**
  * 领取采购单
  * @return
  */
@PostMapping("/received")
public R received(@RequestBody List<Long> ids){

    purchaseService.received(ids);

    return R.ok();
}
```
`PurchaseServiceImpl`
``` java
/**
  *
  * @param ids 采购单id
  */
@Override
public void received(List<Long> ids) {
    //1、确认当前采购单是新建或者已分配状态
    List<PurchaseEntity> collect = ids.stream().map(id -> {
        PurchaseEntity byId = this.getById(id);
        return byId;
    }).filter(item -> {
        if (item.getStatus() == WareConstant.PurchaseStatusEnum.CREATED.getCode() ||
                item.getStatus() == WareConstant.PurchaseStatusEnum.ASSIGNED.getCode()) {
            return true;
        }
        return false;
    }).map(item->{
        item.setStatus(WareConstant.PurchaseStatusEnum.RECEIVE.getCode());
        item.setUpdateTime(new Date());
        return item;
    }).collect(Collectors.toList());

    //2、改变采购单的状态
    this.updateBatchById(collect);

    //3、改变采购项的状态
    collect.forEach((item)->{
        List<PurchaseDetailEntity> entities = detailService.listDetailByPurchaseId(item.getId());
        List<PurchaseDetailEntity> detailEntities = entities.stream().map(entity -> {
            PurchaseDetailEntity entity1 = new PurchaseDetailEntity();
            entity1.setId(entity.getId());
            entity1.setStatus(WareConstant.PurchaseDetailStatusEnum.BUYING.getCode());
            return entity1;
        }).collect(Collectors.toList());
        detailService.updateBatchById(detailEntities);
    });
}
```
`PurchaseDetailServiceImpl`
``` java
@Override
public List<PurchaseDetailEntity> listDetailByPurchaseId(Long id) {
    List<PurchaseDetailEntity> purchaseId = this.list(new QueryWrapper<PurchaseDetailEntity>().eq("purchase_id", id));

    return purchaseId;
}
```

#### 完成采购
同样的, 这里不属于仓库模块中的内容, 所以直接使用接口调用的方式测试
`PurchaseController`
``` java
///ware/purchase/done
@PostMapping("/done")
public R finish(@RequestBody PurchaseDoneVo doneVo){

    purchaseService.done(doneVo);

    return R.ok();
}
```
创建`PurchaseDoneVo`
``` java
@Data
public class PurchaseDoneVo {

    @NotNull
    private Long id;//采购单id

    private List<PurchaseItemDoneVo> items;

}
```
创建`PurchaseItemDoneVo`
``` java
@Data
public class PurchaseItemDoneVo {

    //{itemId:1,status:4,reason:""}
    private Long itemId;
    private Integer status;
    private String reason;

}
```
`PurchaseServiceImpl`
``` java
@Autowired
WareSkuService wareSkuService;

@Autowired
ProductFeignService productFeignService;

@Transactional
@Override
public void done(PurchaseDoneVo doneVo) {
    Long id = doneVo.getId();

    //2、改变采购项的状态
    Boolean flag = true;
    List<PurchaseItemDoneVo> items = doneVo.getItems();

    List<PurchaseDetailEntity> updates = new ArrayList<>();
    for (PurchaseItemDoneVo item : items) {
        PurchaseDetailEntity detailEntity = new PurchaseDetailEntity();
        if(item.getStatus() == WareConstant.PurchaseDetailStatusEnum.HASERROR.getCode()){
            flag = false;
            detailEntity.setStatus(item.getStatus());
        }else{
            detailEntity.setStatus(WareConstant.PurchaseDetailStatusEnum.FINISH.getCode());
            ////3、将成功采购的进行入库
            PurchaseDetailEntity entity = detailService.getById(item.getItemId());
            wareSkuService.addStock(entity.getSkuId(),entity.getWareId(),entity.getSkuNum());
        }
        detailEntity.setId(item.getItemId());
        updates.add(detailEntity);
    }

    detailService.updateBatchById(updates);

    //1、改变采购单状态
    PurchaseEntity purchaseEntity = new PurchaseEntity();
    purchaseEntity.setId(id);
    purchaseEntity.setStatus(flag?WareConstant.PurchaseStatusEnum.FINISH.getCode():WareConstant.PurchaseStatusEnum.HASERROR.getCode());
    purchaseEntity.setUpdateTime(new Date());
    this.updateById(purchaseEntity);
}
```
`WareSkuServiceImpl`
``` java
@Autowired
WareSkuDao wareSkuDao;

@Override
public void addStock(Long skuId, Long wareId, Integer skuNum) {
    //1、判断如果还没有这个库存记录新增
    List<WareSkuEntity> entities = wareSkuDao.selectList(new QueryWrapper<WareSkuEntity>().eq("sku_id", skuId).eq("ware_id", wareId));
    if(entities == null || entities.size() == 0){
        WareSkuEntity skuEntity = new WareSkuEntity();
        skuEntity.setSkuId(skuId);
        skuEntity.setStock(skuNum);
        skuEntity.setWareId(wareId);
        skuEntity.setStockLocked(0);
        //TODO 远程查询sku的名字，如果失败，整个事务无需回滚
        //1、自己catch异常
        //TODO 还可以用什么办法让异常出现以后不回滚？高级
        try {
            R info = productFeignService.info(skuId);
            Map<String,Object> data = (Map<String, Object>) info.get("skuInfo");

            if(info.getCode() == 0){
                skuEntity.setSkuName((String) data.get("skuName"));
            }
        }catch (Exception e){

        }

        wareSkuDao.insert(skuEntity);
    }else{
        wareSkuDao.addStock(skuId,wareId,skuNum);
    }
}
```
`WareSkuDao`
``` java
void addStock(@Param("skuId") Long skuId, @Param("wareId") Long wareId, @Param("skuNum") Integer skuNum);
```
`WareSkuDao.xml`
``` xml
<update id="addStock">
    UPDATE `wms_ware_sku` Set stock=stock+#{skuNum} WHERE sku_id=#{skuId} AND ware_id=#{wareId}
</update>
```
远程获取sku信息
**启动类上使用`@EnableFeignClients`注解**, 创建`ProductFeignService`
``` java
@FeignClient("gulimall-product")
public interface ProductFeignService {

    /**
     * /product/skuinfo/info/{skuId}
     * <p>
     * 1)、让所有请求过网关；
     * 1、@FeignClient("gulimall-gateway")：给gulimall-gateway所在的机器发请求
     * 2、/api/product/skuinfo/info/{skuId}
     * 2）、直接让后台指定服务处理
     * 1、@FeignClient("gulimall-gateway")
     * 2、/product/skuinfo/info/{skuId}
     *
     * @return R
     */
    @RequestMapping("/product/skuinfo/info/{skuId}")
    R info(@PathVariable("skuId") Long skuId);
}
```

**开启分页功能**
`WareMyBatisConfig`
``` java
@EnableTransactionManagement
@MapperScan("cn.cheakin.gulimall.ware.dao") // 注意切换包名
@Configuration
public class WareMyBatisConfig {

    //引入分页插件
    @Bean
    public PaginationInterceptor paginationInterceptor() {
        PaginationInterceptor paginationInterceptor = new PaginationInterceptor();
        // 设置请求的页面大于最大页后操作， true调回到首页，false 继续请求  默认false
//        paginationInterceptor.setOverflow(true);
//        // 设置最大单页限制数量，默认 500 条，-1 不受限制
//        paginationInterceptor.setLimit(1000);
        return paginationInterceptor;
    }
}
```





#### SPU规格维护
**BUG解决**
视频p100 页面有问题
1. 点击规格找不到页面，以及规格回显问题
   原因是因为没有菜单, 解决如下：
   ``` sql
   INSERT INTO sys_menu (menu_id, parent_id, name, url, perms, type, icon, order_num) VALUES (76, 37, '规格维护', 'product/attrupdate', '', 2, 'log', 0);
   ```
2. 规格回显问题不出来
   因为那个属性的值类型是多选而pms_product_attr_value这个表里面的属性值存的单个值。前端展示将这个值用；切割成数组来展示的。切完数组里面只有一个值就转成字符串。所以在多选下拉就赋不了值, 解决如下：
   将页面`attrupdate.vue`中`showBaseAttrs()`这个方法里面的代码
   ``` js
   if (v.length == 1) {
        v = v[0] +  ''
   }
   // 换成下面这个
   if (v.length == 1 && attr.valueType == 0) {
      v = v[0] + ''
   }
   ```

**SPU规格维护**
`guliamll-product`的`AttrController`
``` java
@Autowired
ProductAttrValueService productAttrValueService;

// /product/attr/base/listforspu/{spuId}
@GetMapping("/base/listforspu/{spuId}")
public R baseAttrlistforspu(@PathVariable("spuId") Long spuId){

    List<ProductAttrValueEntity> entities = productAttrValueService.baseAttrListforspu(spuId);

    return R.ok().put("data",entities);
}
```
`guliamll-product`的`ProductAttrValueServiceImpl`
``` java
@Override
public List<ProductAttrValueEntity> baseAttrListforspu(Long spuId) {
    List<ProductAttrValueEntity> entities = this.baseMapper.selectList(new QueryWrapper<ProductAttrValueEntity>().eq("spu_id", spuId));
    return entities;
}
```

**修改商品规格**
`guliamll-product`的`AttrController`
``` java
///product/attr/update/{spuId}
@PostMapping("/update/{spuId}")
public R updateSpuAttr(@PathVariable("spuId") Long spuId,
                        @RequestBody List<ProductAttrValueEntity> entities){

    productAttrValueService.updateSpuAttr(spuId,entities);

    return R.ok();
}
```
`guliamll-product`的`ProductAttrValueServiceImpl`
``` java
@Transactional
@Override
public void updateSpuAttr(Long spuId, List<ProductAttrValueEntity> entities) {
    //1、删除这个spuId之前对应的所有属性
    this.baseMapper.delete(new QueryWrapper<ProductAttrValueEntity>().eq("spu_id",spuId));


    List<ProductAttrValueEntity> collect = entities.stream().map(item -> {
        item.setSpuId(spuId);
        return item;
    }).collect(Collectors.toList());
    this.saveBatch(collect);
}
```


### bug解决
视频p84 pubsub、publish报错, 解决如下：
* 前端pubsub、publish报错
  视频 p84 关于pubsub、publish报错，无法发送查询品牌信息的请求：
  1. `npm install --save pubsub-js`, (无法安装的话可以尝试`npm install --save pubsub-js`)
  2. 在src下的main.js中引用：
    - `import PubSub from 'pubsub-js'`
    - `Vue.prototype.PubSub = PubSub`
* 后端启动报循环依赖的问题
  - 可以在配置文件中配置: `spring.main.allow-circular-references=true`
  - 或是在循环依赖的地方使用`@Lazy`注解

视频 p85 数据库里少了`value_type`字段, 解决如下(用笔记中的sql创建的话就没有问题, 可以忽略)：
在数据库的`pms_attr`表加上`value_type`字段，类型为`tinyint`就行；
在代码中，`AttyEntity.java`、`AttrVo.java`中各添加：`private Integer valueType`，
在`AttrDao.xml`中添加：`<result property="valueType" column="value_type"/>`

视频p85 规格参数显示不出来页面，原因是要在每个分组属性上至少关联一个属性。控制台foreach报错null. 解决如下：
在`spuadd.vue`的`showBaseAttrs()`方法中在 //先对表单的baseAttrs进行初始化加上非空判断 `if (item.attrs != null)`就可以了
``` js
data.data.forEach(item => {
  let attrArray = [];
  if (item.attrs != null) {
    item.attrs.forEach(attr => {
    attrArray.push({
      attrId: attr.attrId,
      attrValues: "",
      showDesc: attr.showDesc
    });
  });
  }
  
  this.dataResp.baseAttrs.push(attrArray);
});
```

视频p92 feign超时异常导致读取失败, 解决如下：
在`gulimall-product`的`application.yml`添加如下即可解决(时间设置长点就行了)
``` yml
ribbon:
  ReadTimeout: 30000
  ConnectTimeout: 30000
```

视频p100 页面有问题
1. 点击规格找不到页面，以及规格回显问题
   原因是因为没有菜单, 解决如下：
   ``` sql
   INSERT INTO sys_menu (menu_id, parent_id, name, url, perms, type, icon, order_num) VALUES (76, 37, '规格维护', 'product/attrupdate', '', 2, 'log', 0);
   ```
2. 规格回显问题不出来
   因为那个属性的值类型是多选而pms_product_attr_value这个表里面的属性值存的单个值。前端展示将这个值用；切割成数组来展示的。切完数组里面只有一个值就转成字符串。所以在多选下拉就赋不了值, 解决如下：
   将页面`attrupdate.vue`中`showBaseAttrs()`这个方法里面的代码
   ``` js
   if (v.length == 1) {
        v = v[0] +  ''
   }
   // 换成下面这个
   if (v.length == 1 && attr.valueType == 0) {
      v = v[0] + ''
   }
   ```



## 总结
分布式基础篇总结
1. 分布式基附概念
   微服务、注册中心、配置中心、远程调用、 Feign、网关
2. 基础开发
   springboot2.0、 SpringCloud、 Mybatis-Plus、Vue组件化、阿里云对象存储
3. 环境
   Vmware、 Linux、 Docker、 MYSQL、 Redis、逆向工程&人人开源
4. 开发规范
   数据校验JSR303、全局异常处理、全局统一返回、全局跨域处理
   枚举状态，业务状态码、VO与TO与PO划分，逻组删除
   Lombok @Data  @Slf4j

