---
title: SpringCloud
createTime: 2024/12/09 22:37:18
permalink: /article/e3gd7xj1/
tags:
   - SpringCloud
---
# SpringCloud

# 开始准备

## 聚合父工程Project创建

1. New Project

2. 聚合总父工程名字

3. Maven选择

    https://cloud.spring.io/spring-cloud-static/Hoxton.SR3/reference/html/spring-cloud.html

4. 工程名字

5. 字符编码

6. 注解生效激活

7. java编译版本选择8

8. FileType过滤


## 子工程创建

1. 建Module

2. 改POM

3. 写YML

4. 主启动

5. 业务类编码（MVC）

6. 测试


## 版本选择

SpringBoot是以数字划分版本SpringCloud是以字母划分版本。

### 兼容性：

可以在https://start.spring.io/actuator/info中查看当pringCloud和SpringBoot之间的兼容性；

### 版本支持：

可以在SpringCloud官网查看官方提供和支持的版本，可以在对应版本的文档中查看推荐的SpringBoot版本

## 问题

`<dependencyManagement>标签中指定的版本报错 解决办法：在<dependencyManagement>标签之外，使用`

``` xml
 <dependencies>  
 	<dependency>  
        <groupId>org.xxxx</groupId>  
        <artifactId>xxxx-xxx</artifactId>  
        <version>x.x.x.RELEASE</version>  
     </dependency> 
</dependencies>
```

重新在版本锁定之外从远程下载需要使用的版本，下载完成后删除即可。 

# 0. 基础

## 项目流程

每个模块都会以一下步骤完成项目

1. 新建项目

2. 改POM

3. 写YML

4. 主启动

5. 写业务

6. 测试


# 1. 服务注册中心

## Eureka服务注册与发现

### Eureka基础知识

#### 什么是服务治理

 Spring Cloud封装了Netlix公司开发的Eureka模块来实现服务治理。在传统的rpc远程调用框架中，管理每个服务与服务之间依赖关系比较复杂,管理比较复杂,所以需要使用服务治理，管理服务于服务之间依赖关系，可以实现服务调用、负载均衡、容错等,实现服务发现与注册。 

#### 什么是服务注册与发现 

什么是服务注册与发现Eureka采用了CS的设计架构，Eureka Server 作为服务注册功能的服务器，它是服务注册中心。而系统中的其他微服务，使用Eureka的客户端连接到Eureka Server并维持心跳连接。这样系统的维护人员就可以通过Eureka Server来监控系统中各个微服务是否正常运行。在服务注册与发现中，有一个注册中心。当服务體启动的时候，会把当前自己服务器的信息比如服务地址通讯地址等以别名方式注册到注册中心上。另-方(消费者|服务提供者)，以该别名的方式去注册中心，上获取到实际的服务通讯地址，然后再实现本地RPC调用RPC远程调用框架核心设计思想:在于注册中心，因为使用注册中心管理每个服务与服务之间的一个依赖关系(服务治理概念)。 在任何rpc远程框架中，都会有一个注册中心(存放服务地址相关信息(接口地址)) 

#### Eureka系统架构图示

![1608456102697_image.png](/SpringCloud/1608456102697_image.png)

#### Eureka两个组件

##### Eureka Server

Eureka Server提供服务注册服务各个微服务节点通过配置启动后，会在EurekaServer中进行注册， 这样EurekaServer中的服务注册表中将 会存储所有可用服务节点的信息，服务节点的信息可以在界面中直观看到。 

##### Eureka Client

EurekaClient通过注册中心进行访问是一个Java客户端，用于简化Eureka Server的交互，客户端同时也具备一个内置的、 使用轮询(round-robin)负载算法的负载均衡器。在应用启动后，将会向Eureka Server发送心跳(默认周期为30秒)。如果Eureka Server在多个心跳周期内没有接收到某个节点的心跳，EurekaServer将会从服务注册表中把这个服务节点移除(默认90秒) 



### 单机Eureka构建

#### 注册中心（Eureka Server）（7001）

o 1. 建Module

o 2. 改POM 

``` xml
<!--eureka-server 2.X-->
<dependency>     
    <groupId>org.springframework.cloud</groupId>     
    <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
</dependency> 
```

o 3. 写YML 

``` properties
server:  
	port: 7001

spring:  application:   
	name: cloud-eureka-serviceeureka:  
	instance:   # eureka服务端的实例名称   
	hostname: localhost  # 单机#   
	hostname: eureka7001.com  # 集群   
	# Eureka客户端向服务端发送心跳的时间间隔,单位为秒(默认是30秒)#   
	lease-renewal-interval-in-seconds: 1   # Eureka服务端在收到最后一次心跳后等待时间上限 ,单位为秒(默认是90秒),超时剔除服务#   
	lease-expiration-duration-in-seconds: 2  
	server:   # 禁用自我保护,保证不可用服务被及时删除   
	enable-self-preservation: true   
	eviction-interval-timer-in-ms: 2000  client:   # false表示不向注册中心注册自己   
	register-with-eureka: false   # false表示自己端就是注册中心,我的职责就是维护服务实例,并不需要检索服务   
	fetch-registry: false   
	service-url:    # 设置与Eureka Server交互的地址查询服务和注册服务都需要依赖这个地址    defaultZone: http://${eureka.instance.hostname}:${server.port}/eureka/   # 单机#    defaultZone: http://eureka7002.com:7002/eureka/  # 集群，相互注册 
```

o 4. 主启动（服务注册中心） 启动类添加`@EnableEurekaServer`注解 

o 5. 业务类编码（MVC）

o 6. 测试 http://localhost:7001/ 

![1608478807868_image.png](/SpringCloud/1608478807868_image.png)

#### 客户端（Eureka Client）（80、8001）

o 2. 修改客户端（8001）的pom 

``` xml
<dependency>       
    <groupId>org.springframework.cloud</groupId>       
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>     
</dependency> 
```

o 3. 改客户端的YML `eureka:  client:   # 表示是否将自己注册进Eurekaserver默认为true。   register-with-eureka: true   # 足否从Eurekaserver抓收已有的注册信息，默以为true。单节点无所谓，集群必须设咒为true才能配ribbon使用负载均衡   fetch-registry: true   service-url:    defaultZone: http://localhost:7001/eureka  # 单机版#    defaultZone: http://eureka7001.com:7001/eureka,http://eureka7002.com:7002/eureka   # 集群版  instance:   instance-id: payment8001   # 注意此处   # 访问路径可以显示ip地址   prefer-ip-address: true` 

o 4. 主启动 添加`@EnableEurekaClient`注解 

o 6. 测试 先启动注册中心，再启动客户端（用户名为服务名）测试访问：http://localhost:7001/ 

![1608564088776_image.png](/SpringCloud/1608564088776_image.png)

### 集群Eureka构建

 互相注册，相互守望将支付服务8001微服务发布到2台Eureka集群上将订单服务80微服务发布到2台Eureka集群上 

#### 注册中心集群

o cloud-eurka-server7001

o 新建cloud-eurka-server7002 参考cloud-eureka-server7001 

o 改POM 参考cloud-eureka-server7001 

o 修改映射配置 在本地跑则新增两个映射(C:\Windows\System32\drivers\etc\hosts)127.0.0.1 eurka7001.com127.0.0.1 eurka7002.com 

o 写YML

**7001** 

``` properties
server:  port: 7001spring:  application:   name: cloud-eureka-serviceeureka:  instance:   # eureka服务端的实例名称   #   hostname: localhost  # 单机   hostname: eureka7001.com  # 集群   # Eureka客户端向服务端发送心跳的时间间隔,单位为秒(默认是30秒)   #   lease-renewal-interval-in-seconds: 1   # Eureka服务端在收到最后一次心跳后等待时间上限 ,单位为秒(默认是90秒),超时剔除服务  #   lease-expiration-duration-in-seconds: 2  server:   # 禁用自我保护,保证不可用服务被及时删除   enable-self-preservation: true   eviction-interval-timer-in-ms: 2000  client:   # false表示不向注册中心注册自己   register-with-eureka: false   # false表示自己端就是注册中心,我的职责就是维护服务实例,并不需要检索服务   fetch-registry: false   service-url:    # 设置与Eureka Server交互的地址查询服务和注册服务都需要依赖这个地址    #    defaultZone: http://${eureka.instance.hostname}:${server.port}/eureka/   # 单机    defaultZone: http://eureka7002.com:7002/eureka/  # 集群，相互注册,注册其他服务端 
```

**7002**

``` properties
 server:  port: 7002spring:  application:   name: cloud-eureka-serviceeureka:  instance:   # hostname: localhost   hostname:  eureka7002.com   # Eureka客户端向服务端发送心跳的时间间隔,单位为秒(默认是30秒)   lease-renewal-interval-in-seconds: 1   # Eureka服务端在收到最后一次心跳后等待时间上限 ,单位为秒(默认是90秒),超时剔除服务   lease-expiration-duration-in-seconds: 2  server:   # 禁用自我保护   enable-self-preservation: true   eviction-interval-timer-in-ms: 2000  client:   register-with-eureka: false   fetch-registry: false   service-url:    # defaultZone: http://${eureka.instance.hostname}:${server.port}/eureka/    defaultZone: http://eureka7001.com:7001/eureka/ 
```

o 主启动（服务注册中心） 启动类添加`@EnableEurekaServer`注解 

#### 将订单服务80微服务发布到2台Eureka集群上

 修改YML：defaultZone: http://eureka7001.com:7001/eureka,http://eureka7002.com:7002/eureka   # 集群版 

· 将支付服务8001微服务发布到2台Eureka集群上 修改YML：defaultZone: http://eureka7001.com:7001/eureka,http://eureka7002.com:7002/eureka   # 集群版 

· 测试1 先启动注册中心，在启动服务 

#### 支付服务提供者8001集群环境构建

也可以使用IDEA的多例模式构建：https://blog.csdn.net/dyr_1203/article/details/84876380 

o cloud-provider-payment8001

o 新建cloud-provider-payment8002 参考cloud-provider-payment8001 

o 改POM 参考cloud-provider-payment8001 

o 改YML

8001 

``` properties
server:  port: 8001spring:  application:   name: cloud-payment-service  datasource:   # 当前数据源操作类型   type: com.alibaba.druid.pool.DruidDataSource   # mysql驱动类   driver-class-name: com.mysql.cj.jdbc.Driver   url: jdbc:mysql://localhost:3306/mp?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=GMT%2B8   username: root   password: rooteureka:  client:   # 表示是否将自己注册进Eurekaserver默认为true。   register-with-eureka: true   # 足否从Eurekaserver抓收已有的注册信息，默以为true。单节点无所谓，集群必须设咒为true才能配ribbon使用负载均衡   fetch-registry: true   service-url:#    defaultZone: http://localhost:7001/eureka  # 单机版    defaultZone: http://eureka7001.com:7001/eureka,http://eureka7002.com:7002/eureka   # 集群版  instance:   instance-id: payment8001   # 访问路径可以显示ip地址   prefer-ip-address: truemybatis:  mapper-locations: classpath:mapper/*.xml  type-aliases-package: com.bilibili.springcloud.entities 
```

8002 

``` properties
server:  port: 8002spring:  application:   name: cloud-payment-service  datasource:   # 当前数据源操作类型   type: com.alibaba.druid.pool.DruidDataSource   # mysql驱动类   driver-class-name: com.mysql.cj.jdbc.Driver   url: jdbc:mysql://localhost:3306/mp?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=GMT%2B8   username: root   password: rooteureka:  client:   # 表示是否将自己注册进Eurekaserver默认为true。   register-with-eureka: true   # 足否从Eurekaserver抓收已有的注册信息，默以为true。单节点无所谓，集群必须设咒为true才能配ribbon使用负载均衡   fetch-registry: true   service-url:#    defaultZone: http://localhost:7001/eureka  # 单机版    defaultZone: http://eureka7001.com:7001/eureka,http://eureka7002.com:7002/eureka   # 集群版  instance:   instance-id: payment8002   # 访问路径可以显示ip地址   prefer-ip-address: truemybatis:  mapper-locations: classpath:mapper/*.xml  type-aliases-package: com.bilibili.springcloud.entities 
```

o 业务类 参考cloud-provider-payment8001 

o 主启动

#### 负载均衡

o 集群中订单服务的访问地址不能写死 Eureka是通过服务名访问，不关注具体主机（由负载均衡完成）；所以暴露时同样的服务使用同样的服务名 

o 使用负载均衡注解 在消费者的RestTemplate上使用@LoadBalanced注解（默认使用轮询）赋予负载均衡能力ApplicationContextBean是Ribbon的内容，见后文 

#### 注意

Eureka是通过服务名访问，不关注具体主机（由负载均衡完成）；所以暴露时同样的服务使用同样的服务名 

### actuator

微服务信息完善 引入POM：`!--监控--><dependency>   <groupId>org.springframework.boot</groupId>   <artifactId>spring-boot-starter-actuator</artifactId></dependency>添加YML配置：eureka:  instance:   # 主机名称，服务名修改   instance-id: payment8002   # 访问路径可以显示ip地址   prefer-ip-address: true` 

 主机名称，服务名修改

· 访问信息显示ip

### 服务发现Discovery

· 对于注册进eureka里的微服务，可以通过服务发现来获取该服务的信息

· 修改`cloud-provider-payment8001`的Controller 注入（import org.springframework.cloud.client.discovery.DiscoveryClient;）包下的DiscoveryClientprivate DiscoveryClient discoveryClient;添加接口：@GetMapping("/discovery")   
``` java
public Object discovery() {     List<String> services = discoveryClient.getServices();     for (String service : services) {       log.info("*****service:"+service);     }     List<ServiceInstance> instances = discoveryClient.getInstances("CLOUD-PAYMENT-SERVICE");     for (ServiceInstance instance : instances) {       log.info(instance.getServiceId()+"\t"+instance.getHost()+"\t"+instance.getPort()+"\t"+instance.getUri());     }     return this.discoveryClient;   } 

```

· 8001主启动类 添加@EnableDiscoveryClient注解 

· 自测

### eureka自我保护

· 概述 概述：保护模式主要用于一组客户端和Eureka Server之间存在网络分区场景下的保护。一旦进入保护模式，Eureka Server将会尝试保护其服务注册表中的信息，不再删除服务注册表中的数据，也就是不会注销任何微服务。属于CPA里面的AP分支 

· 如何禁用自我保护

o 注册中心7001 自我保护默认是开启的，通过下面的命令控制自我保护的开启或关闭eureka.server.enable-self-preservation: false使用下面的命令控制服务端销毁注册信息的是时间eureka.server.eviction-interval-timer-in-ms: 2000 

o 客户端8001 通过下面的命令控制客户端发送心跳包的时间（默认30秒）lease-renewal-interval-in-seconds: 1Eureka服务端在收到最后一次心跳后等待时间上限（默认90秒），超时将剔除服务 

## Zookeeper服务注册与发现 

Zookeeper已停止更新，而SpringCloud集成了Zookeeper 

### 注册中心Zookeeper

zoopeeker是一个分布式协调工具，可以实现注册中心功能，本章节将使用zoopeeker服务器取代Eureka服务器，使用zoopeeker作为服务注册中心安装河东过程省略，注意：关闭linuxfu武器服务器防火墙后启动zoopeeker 

### 服务提供者

· 新建项目

·改POM`<dependencies> <dependency> <groupId>com.bilibili.springcloud</groupId> <artifactId>cloud-api-commons</artifactId> <version>${project.version}</version> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-web</artifactId> </dependency> <!--SpringBoot整合Zookeeper客户端--> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-starter-zookeeper-discovery</artifactId> <exclusions> <!--先排除自带的zookeeper3.5.3--> <exclusion> <groupId>org.apache.zookeeper</groupId> <artifactId>zookeeper</artifactId> </exclusion> </exclusions> </dependency> <!--添加zookeeper3.4.9版本--> <dependency> <groupId>org.apache.zookeeper</groupId> <artifactId>zookeeper</artifactId> <version>3.4.14</version> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-actuator</artifactId> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter</artifactId> </dependency> <dependency> <groupId>org.projectlombok</groupId> <artifactId>lombok</artifactId> <optional>true</optional> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-test</artifactId> <scope>test</scope> </dependency> </dependencies>` 

· 写YML  `server:  port: 8004spring:  application:   # 服务别名---注册zookeeper到注册中心的名称   name: cloud-payment-service  cloud:   zookeeper:    # 默认localhost:2181    connect-string: localhost:2181` 

· 主启动 服务发现以后都使用@EnableDiscoveryClient注解 

· 写业务 `@Slf4j@RestControllerpublic class PaymentController {   @Value("${server.port}")   private String serverPort;   @RequestMapping(value = "payment/zk")   public String paymentZk() {     return "SpringCloud with zookeeper:" + serverPort + "\t" + UUID.randomUUID().toString();   }}` 

· 测试

o 可能与discovery携带的zk与服务器端的zk不兼容 可能与discovery携带的zk与服务器端的zk不兼容；那么我们可以引入自己服务器端zk版本的pom坐标，详见POM 

o 可能会出现日志冲突 可能会出现日志冲突；那么我们可以在POM中引入的zk中排除掉冲突的包。详见POM 

o docker查看zookeeper注册服务 docker查看zookeeper注册服务首先找到正在运行的容器didocker ps然后执行如下操作docker exec -it add905a36402（this is id） bashcd bin./zkCli.shls /services 

· 验证 http://localhost:8004/payment/zk 

o http://localhost:8004/payment/zk

· 节点类型

o 服务节点分为持久和临时。zk是服务节点是临时的

### 服务消费者

· 新建项目cloud-consumerzk-order80

·改POM

``` xml
<dependencies> <dependency> <groupId>com.bilibili.springcloud</groupId> <artifactId>cloud-api-commons</artifactId> <version>${project.version}</version> </dependency> <!--SpringBoot整合Zookeeper客户端--> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-starter-zookeeper-discovery</artifactId> <exclusions> <!--先排除自带的zookeeper3.5.3--> <exclusion> <groupId>org.apache.zookeeper</groupId> <artifactId>zookeeper</artifactId> </exclusion> </exclusions> </dependency> <!--添加zookeeper3.4.9版本--> <dependency> <groupId>org.apache.zookeeper</groupId> <artifactId>zookeeper</artifactId> <version>3.4.14</version> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-actuator</artifactId> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-web</artifactId> </dependency> <dependency> <groupId>org.projectlombok</groupId> <artifactId>lombok</artifactId> <optional>true</optional> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-test</artifactId> <scope>test</scope> </dependency> </dependencies> 
```

· 写YML `server:  port: 80spring:  application:   # 服务别名   name: cloud-consumer-order  cloud:   zookeeper:    # 注册到zookeeper地址    connect-string: localhost:2181` 

· 主启动 `@EnableDiscoveryClient  //该注解用于向使用consul或者zookeeper作为注册中心时注册服务@SpringBootApplicationpublic class OrderZKMain80 {   public static void main(String[] args) {     SpringApplication.run(OrderZKMain80.class, args);   }}` 

· 写业务

o config `@Configurationpublic class ApplicationContextConfig {   @Bean   @LoadBalanced   public RestTemplate getRestTemplate() {     return new RestTemplate();   }}` 

o controller `@Slf4j@RestControllerpublic class OrderZKController {   public static final String INVOKE_URL = "http://cloud-provider-payment";   @Resource   private RestTemplate restTemplate;   @GetMapping("/consumer/payment/zk")   public String paymentInfo() {     return restTemplate.getForObject(INVOKE_URL + "/payment/zk", String.class);   }}` 

· 测试 前提是服务提供者已注册 

o http://localhost/consumer/payment/zk

## Consul服务注册与发现

### Consul简介

#### 官网

o consul.io

#### 功能

 Consul是-套开源的分布式服务发现和配置管理系统,由HashiCorp公司用Go语言开发。提供了微服务系统中的服务治理、配置中心、控制总线等功能。这些功能中的每一个都可以根据需要单独使用，也可以一 起使用以构建全方位的服务网格，总之Consul提供了-种完整的服务网格解决方案。它具有很多优点。包括: 基于raft协议,比较简洁; 支持健康检查,同时支持HTTP和DNS协议支持跨数据中心的WAN集群提供图形界面跨平台，支持Linux、 Mac、Windows 

##### 服务发现

提供HTTP和DNS两种发现方式。

##### 健康监测

支持多种方式，HTTP、TCP、Docker. Shel脚本定制化

##### KV存储

Key，Value的存储方式

##### 多数据中心

Key，Value的存储方式

##### 可视化Web界面

#### 安装

 查找镜像docker search consul下载镜像至本地docker pull consul查看本地镜像docker images启动镜像docker run -d --name myConsul -p 8500:8500 [id]查看服务docker ps 

o 测试localhost:8500/ui/dc1/services

### 服务提供者

· 新建项目cloud-providerconsul-payment8006

·改POM

``` xml
<dependencies> <!--SpringCloud consul-server--> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-starter-consul-discovery</artifactId> </dependency> <dependency> <groupId>com.bilibili.springcloud</groupId> <artifactId>cloud-api-commons</artifactId> <version>${project.version}</version> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-web</artifactId> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-actuator</artifactId> </dependency> <dependency> <groupId>org.projectlombok</groupId> <artifactId>lombok</artifactId> <optional>true</optional> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-test</artifactId> <scope>test</scope> </dependency> </dependencies> 
```

· 写YML `server:  # consul服务端口  port: 8006spring:  application:   name: cloud-provider-payment  cloud:   consul:    # consul注册中心地址    host: localhost    port: 8500    discovery:     hostname: 127.0.0.1     service-name: ${spring.application.name}` 

· 主启动 `@EnableDiscoveryClient@SpringBootApplicationpublic class PaymentMain8006 {   public static void main(String[] args) {     SpringApplication.run(PaymentMain8006.class, args);   }}` 

· 写业务 `@Slf4j@RestControllerpublic class PaymentController {   @Value("${server.port}")   private String serverPort;   @RequestMapping(value = "/payment/consul")   public String paymentZk() {     return "SpringCloud with consul:" + serverPort + "\t" + UUID.randomUUID().toString();   }}` 

· 测试

o 服务提供者

http://localhost:8006/payment/consul

o 注册中心

测试

· http://localhost:8500/

问题 consul报红叉是因为consul的安全检查要检查你的服务，他会访问 ip:8006/actuator/health这个接口，如果你项目是在内网，consul是在外网那就访问不到，就会报红叉 

### 服务消费者

· 新建项目cloud-consumerconsul-order80

·改POM`<dependencies> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-starter-consul-discovery</artifactId> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-web</artifactId> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-actuator</artifactId> </dependency> <dependency> <groupId>org.projectlombok</groupId> <artifactId>lombok</artifactId> <optional>true</optional> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-test</artifactId> <scope>test</scope> </dependency> </dependencies>` 

· 写YML `server:  port: 80spring:  application:   name: cloud-consumer-order  cloud:   consul:    host: localhost    port: 8500    discovery:     service-name: ${spring.application.name}` 

· 主启动 `@EnableDiscoveryClient@SpringBootApplicationpublic class OrderConsulMain80 {   public static void main(String[] args) {     SpringApplication.run(OrderConsulMain80 .class, args);   }}` 

· 写业务

o config `@Configurationpublic class ApplicationContextConfig {   @Bean   @LoadBalanced   public RestTemplate getRestTemplate(){     return new RestTemplate();   }}` 

o controller `@Slf4j@RestControllerpublic class OrderConsulController {   public static final String INVOKE_URL = "http://cloud-provider-payment";   @Resource   private RestTemplate restTemplate;   @GetMapping("/consumer/payment/consul")   public String payment(){     return restTemplate.getForObject(INVOKE_URL + "/payment/consul",String.class );   }}` 

· 测试

o 消费者服务

http://localhost/consumer/payment/consul

o 注册中心

http://localhost:8500/

## 三个注册中心的异同点 

### CAP

· C:Consistency (强一致性)

· A:Availability (可用性)

· P:Partition tolerance ( 分区容错性)

· CAP理论关注粒度是数据，而不是整体系统设计 业务展示T-1 

### 经典CAP图

· AP(Eureka) AP架构当网络分区出现后，为了保证可用性，系统B可以返回旧值，保证系统的可用性。结论:违背了一致性C的要求,只满足可用性和分区容错，即AP 

· CP(Zookeeper/Consul) CP架构当网络分区出现后，为了保证一致性,就必须拒接请求,否则无法保证一致性结论:违背了可用性A的要求，只满足-致性和分区容错，即CP 

# 2. 服务调用

## Ribbon负载均衡服务调用

### 概述

#### 是什么

 Spring Cloud Ribbon是基于Netflix Ribbon实现的一套 客户端 负载均衡的工具。简单的说，Ribbon是Ntflix发布的开源项目， 主要功能是提供客户端的软件负载均衡算法和服务调用。Ribbon客户端组件提供一 系列完善的配置项如连接超时，重试等。简单的说，I就是在配置文件中列出Load Balancer (简称LB)后面所有的机器，Ribbon会自动的帮助你基于某种规则(如简单轮询，随机连接等)去连接这些机器。我们很容易使用Ribbon实现自定义的负载均衡算法。 

#### 官网

o https://github.com/Netflix/ribbon/wiki/Getting-Started

o ribbon现已进入维护模式

#### 能干什么

o LB(LoadBanlance负载均衡) LB负载均衡(Load Balance)是什么简单的说就是将用户的请求平摊的分配到多个服务上,从而达到系统的HA (高可用)。常见的负载均衡有软件Nginx，LVS, 硬件F5等。Ribbon本地负载均衡客户端VS Nginx服务端负载均衡(集中式)区别Nginx是服务器负载均衡，客户端所有请求都会交给nginx,然后由nginx实现转发请求。即负载均衡是由服务端实现的。Ribbon本地负载均衡(程序内)，在调用微服务接口时候，会在注册中心上获取注册信息服务列表之后缓存到JVM本地，从而在本地实现RPC远程服务调用技术。 

集中式LB 集中式LB即在服务的消费方和提供方之间使用独立的LB设施(可以是硬件，如F5,也可以是软件,如nginx),由该设施负责把访问请求通过某种略转发至服务的提供方; 

程序内LB 进程内LB将LB逻辑集成到消费方，消费方从服务注册中心获知有哪些地址可用，然后自己再从这些地址中选择出一个合适的服务器。Ribbon就属于进程内LB, 它只是一 个类库,集成于消费方进程，消费方通过它来获取到服务提供方的地址。 

o 此前通过Eureka中，80是通过轮询负载访问8001和8002

o 即：负载均衡+RestTemplate调用

### Ribbon负载均衡演示

#### 架构说明

 总结: Ribbon其实就是一个软负载均衡的客户端组件，他可以和其他所需请求的客户端结合使用，和eureka结合只是其中的一个实例。 

o ![1609563596892_image.png](/SpringCloud/1609563596892_image.png)

#### POM

o spring-cloud-starter-netflix-eureka-client中已经集成了Ribbon

![1609564073810_image.png](/SpringCloud/1609564073810_image.png)

#### RestTemplate使用

##### 官网

##### getObject()/getForEntity()

 getObject()返回对象为响应体中数据转化成的对象，基本上可以理解为JsongetForEntity()返回对象为ResponseEntity对象，包含了响应中的一些重要信息，比如响应头、响应状态码、响应体等 

##### postObject()/postForEntity()

##### GET请求方法
``` java
 @GetMapping("/consumer/payment/getForEntity/{id}")   public CommonResult<Payment> getPayment2(@PathVariable("id") Long id){     ResponseEntity<CommonResult> entity = restTemplate.getForEntity(PAYMENT_URL + "/payment/get/getForEntity/" + id, CommonResult.class);     if (entity.getStatusCode().is2xxSuccessful()) {       log.info(entity.getStatusCode() + "\t" + entity.getBody());       return entity.getBody();     } else {       return new CommonResult<Payment>().fail(400, "操作失败！");     }   } 
```

##### POST请求方法
``` java
 @PostMapping("/consumer/payment/postForEntity")   public CommonResult<Payment> creat2(Payment payment) {     ResponseEntity<CommonResult> entity = restTemplate.postForEntity(PAYMENT_URL + "/payment/create/postForEntity/", payment, CommonResult.class);     if (entity.getStatusCode().is2xxSuccessful()) {       return entity.getBody();     } else {       return new CommonResult<Payment>().fail(400, "操作失败！");     }   } 
```
### Ribbon核心组件IRule

#### IRule:根据特定算法中从服务列表中选取一个要访问的服务

![1609590536668_image.png](/SpringCloud/1609590536668_image.png)

##### com.netflix.loadbalancer. RoundRobinRule

轮询

##### com.netflix.loadbalancer. RandomRule

随机

##### com.netflixloadbalancer.RetryRule

先按照RoundRobinRule的策略获取服务， 如果获取服务失败则在指定时间内会进行重试，获取可用的服务

##### WeightedResponseTimeRule

对RoundRobinRule的扩展， 响应速度越快的实例选择权重越大，越容易被选择

##### BestAvailableRule

会先过滤掉由于多次访问故障而处于断路器跳闸状态的服务，然后选择一个并发量最小的服务

##### AvailabilityFilteringRule

先过滤掉故障实例， 再选择并发较小的实例

##### ZoneAvoidanceRule

默认规则，复合判断server所在区 域的性能和server的可用性选择服务器

#### 如何替换

o 修改cloud-consumer-order80

o 注意配置细节 官方文档明确给出了警告:这个自定义配置类不能放在@ComponentScan所扫描的当前包下以及子包下，否则我们自定义的这个配置类就会被所有的Ribbon客户端所共享,达不到特殊化定制的目的了。即：@ComponentScan是主启动类中@SpringBootApplication的子注解，所以不能在能在主启动类的包下创建 

o 新建Packge和规则类

新建包myrule

· 切记不能和主启动类同包

此包下新建MySelfRule规则类 /** * Ribbon的配置类 */@Configurationpublic class MySelfRule {   //   @Bean   public IRule myRule() {     return new RandomRule();   //定义为随机   }}不要忘记注入到Ben 

o 主启动添加@RibbonClient @SpringBootApplication@EnableEurekaClient@RibbonClient(name = "CLOUD-PAYMENT-SERVICE", configuration = MySelfRule.class)public class OrderMain80 {   public static void main(String[] args) {     SpringApplication.run(OrderMain80.class, args);   }} 

o 测试

### Ribbon负载均衡算法

#### 原理

o 轮询 负载均衡算法: rest接口第几次请求数%服务器集群总数量=实际调用服务器位置下标，每次服务重启动后rest接口计数从1开始。 

![1609604219881_image.png](/SpringCloud/1609604219881_image.png)

#### 手写

#### 7001/7002集群启动

#### 8001/8002微服务改造

Controller `@GetMapping("/lb")   public String getPaymentLB() {     return serverPort;   }` 

#### 80订单微服务改造

1. ApplicationContextBean去掉注解@LoadBalance，使用自己的注解

2. LoadBalance接口 `public interface LoadBalancer {   /**   * 集群对象   * @param serviceInstances   * @return   */   ServiceInstance instances(List<ServiceInstance> serviceInstances);} `

3. MyLB(实现接口) `@Componentpublic class MyLB implements LoadBalancer {   private AtomicInteger atomicInteger = new AtomicInteger(0);   public final int getAndIncrement() {     int current;     int next;  //第几次访问此接口     do {  //自旋锁       current = this.atomicInteger.get();       next = current >= Integer.MAX_VALUE ? 0 : current++;     }while (!this.atomicInteger.compareAndSet(current, next));     System.out.println("****next:" + next);     return next;   }   @Override   public ServiceInstance instances(List<ServiceInstance> serviceInstances) {     int index =  getAndIncrement() % serviceInstances.size();  //访问次数对集群数取余     return serviceInstances.get(index);   }}注意添加@Component注解` 

4. OrderController `/** 自定义的负载均衡 */   @Resource   private LoadBalancer loadBalancer;   @Resource   private DiscoveryClient discoveryClient;   @GetMapping("/consumer/payment/lb")   public String getPaymentLB() {     List<ServiceInstance> instances = discoveryClient.getInstances("CLOUD-PAYMENT-SERVICE");     if (instances == null || instances.size() <= 0) {       return null;     }     ServiceInstance serviceInstance = loadBalancer.instances(instances);     URI uri = serviceInstance.getUri();     return restTemplate.getForObject(uri+"/payment/lb", String.class);   }` 

5. 测试

· http://localhost/consumer/payment/lb

## OpenFeign

### 概述

#### 官网

o https://spring.io/projects/spring-cloud-openfeign

#### OpenFeign是什么

o OpenFeign是一个声明式的Web服务客户端，让编写Web服务客户端变得非常容易，只需创建一一个接口并在接口上添加注解即可 Feign是一 个声明式WebService客户端。使用Feign能让编写Web Service客户端更加简单。它的使用方法是定义-一个服务接口然后在上面添加注解。Feignt也支持可拔插式的编码器和解码器。Spring Cloud对Feign进行了封装，使其支持了Spring MVC标准注解和HttpMessageConverters。Feign可以与Eureka和Ribbon组合使用以支持负载均衡 

#### 能干什么

 Feign能干什么Feign旨在使编写Java Http客户端变得更容易。前面在使用Ribbon+ RestTemplate时,利用RestTemplate对http请求的封装处理，形成了-套模版化的调用方法。但是在实际开发中，由于对服务依赖的调用可能不止一处，‘往往一个接口会被多处调用， 所以通常都会针对每个微服务自行封装一些客户端类来包装这些依赖服务的调用’。所以，Feign在此基础 上做了进一步封装， 由他来帮助我们定义和实现依赖服务接口的定义。在Feign的实现下，‘我们只需创建一个接口并使用注解的方式来配置它(以前是Dao接口上面标注Mapper注解现在是一个微服务接口.上面标注一 个Feign注解即可)’，即可完成对服务提供方的接口绑定，简化了使用Spring cloud Ribbon时，自动封装服务调用客户端的开发量。Feign集成了Ribbon利用Ribbon维护了Payment的服务列表信息，并且通过轮询实现了客户端的负载均衡。而与Ribbon不同的是，‘通过feign只需要定义服务绑定接口且以声明式的方法’，优雅而简单的实现了服务调用。 

#### Feign和OpenFeign的区别

![1609666933697_image.png](/SpringCloud/1609666933697_image.png)

### OpenFeign使用步骤

#### 接口+注解

o 微服务调用接口+@FeignClient

#### 新建项目cloud-consumer-feign-order80

o Feign使用再消费端

#### 改POM

`<dependencies> <!--openfeign--> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-starter-openfeign</artifactId> </dependency> <!--eureka client--> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId> </dependency> <dependency> <groupId>com.bilibili.springcloud</groupId> <artifactId>cloud-api-commons</artifactId> <version>${project.version}</version> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-web</artifactId> </dependency> <!--监控--> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-actuator</artifactId> </dependency> <!--热部署--> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-devtools</artifactId> <scope>runtime</scope> <optional>true</optional> </dependency> <dependency> <groupId>org.projectlombok</groupId> <artifactId>lombok</artifactId> <optional>true</optional> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-test</artifactId> <scope>test</scope> </dependency> </dependencies>` 

#### 写YML 
```
server:  port: 80eureka:  client:   # 是否将自己注册进Eureka Server   register-with-eureka: false   # 是否从Eureka Server获取注册信息   fetch-registry: true   service-url:    defaultZone: http://eureka7001.com:7001/eureka,http://eureka7002.com:7002/eureka 
```
#### 主启动 
```
@EnableFeignClients@EnableEurekaClient@SpringBootApplicationpublic class OrderFeignMain80 {   public static void main(String[] args) {     SpringApplication.run(OrderFeignMain80.class, args);   }} 
```
#### 写业务

o 业务逻辑接口+@FeignClient配置调用provider服务(8001/8002)新建PaymentFeignService接口并新增注解@FeignClient `@Component@FeignClient("CLOUD-PAYMENT-SERVICE")public interface PaymentFeignService {   @GetMapping("/payment/get/{id}")   public CommonResult getPaymentById(@PathVariable("id") Long id);}` 

o 控制层Controller `@Slf4j@RestControllerpublic class OrderFeignClientController {   @Resource   private PaymentFeignService paymentFeignService;   @GetMapping("/consumer/payment/get/{id}")   public CommonResult<Payment> getPaymentById(@PathVariable("id") Long id){     return paymentFeignService.getPaymentById(id);   }}` 

#### 测试

##### 先启动2个eureka集群7001/7002

##### 再启动2个微服务8001/8002

##### 启动OpenFeign80

##### 分支主题

##### Feign自带负载均衡配置项

### OpenFeign超时控制

 在实际中，存在有的服务需要处理较长时间，而消费者不愿等待，存在时间差，所以需要消费者与提供者双方协调好时间 

· 超时设置，故意设置超时演示错误情况

#### 服务提供方8001故意写暂停程序

##### controller
```
 /**   * 模拟服务超时，暂停3秒   * @return   */   @GetMapping("/payment/feign/timeout")   public String paymentFeignTimeout(){     //暂停几秒线程     try {       TimeUnit.SECONDS.sleep(3);     } catch (InterruptedException e) {       e.printStackTrace();     }     return serverPort;   } 
```
#### 服务消费方80添加超时方法

##### service
```
 /**   * 长处理服务   * @return   */   @GetMapping("/payment/feign/timeout")   String paymentFeignTimeout(); 
```
##### controller
```
 /**   * 长处理服务   * @return   */   @GetMapping("/consumer/payment/feign/timeout")   public String paymentFeignTimeout() {     //OpenFeign-ribbon，客户端一般默认等待1秒钟     return paymentFeignService.paymentFeignTimeout();   } 
```
#### 测试

##### 8001自测

· http://localhost:8001/payment/feign/timeout

· 延迟但返回

##### 80测试

· http://localhost/consumer/payment/feign/timeout

· 超时

![1609681724718_image.png](/SpringCloud/1609681724718_image.png)

#### OpenFeign默认等待1秒，超时后报错

#### 是什么

##### OpenFeign默认支持Ribbon

 默认Feign客户端只等待一秒钟， 但是服务端处理需要超过1秒钟，导致Feign客户端不想等待了，直接返回报错。为了避免这样的情况，有时候我们需要设置Feign客户端的超时控制。yml文件中开启配置 

#### YML文件里需要开启OpenFeign

 server:  port: 80eureka:  client:   # 是否将自己注册进Eureka Server   register-with-eureka: false   # 是否从Eureka Server获取注册信息   fetch-registry: true   service-url:    defaultZone: http://eureka7001.com:7001/eureka,http://eureka7002.com:7002/eureka# 设置feign客户端超时时间(OpenFeign默认支持ribbon)ribbon:  # 指的是建立连接所用的时间,适用于网络状态正常的情况下,两端连接所用的时间  ReadTimeout: 5000  # 指的是建立连接后从服务器读取到可用资源所用的时间  ConnectTimeout: 5000 

##### 延迟后返回

### OpenFeign日志打印功能

#### 是什么

 Feign提供了日志打印功能，我们可以通过配置来调整日志级别，从而了解Feign中Http请求的细节。说白了就是`对Feign接口的调用情况进行监控和输出` 

#### 日志级别

o NONE:默认的，不显示任何日志;

o BASIC:仅记录请求方法、URL、响应状态码及执行时间;

o HEADERS:除了BASIC中定义的信息之外，还有请求和响应的头信息;

o FULL: 除了.HEADERS中定义的信息之外,还有请求和响应的正文及元数据。

#### 配置日志bean

##### config

FeignConfig此处设置为FULL级

 @Configurationpublic class FeignConfig {   @Bean   public Logger.Level feignLoggerLevel() {     // 请求和响应的头信息,请求和响应的正文及元数据     return Logger.Level.FULL;   }} 

##### YML文件里面需要开启日志客户端
```
 server:  port: 80eureka:  client:   # 是否将自己注册进Eureka Server   register-with-eureka: false   # 是否从Eureka Server获取注册信息   fetch-registry: true   service-url:    defaultZone: http://eureka7001.com:7001/eureka,http://eureka7002.com:7002/eureka# 设置feign客户端超时时间(OpenFeign默认支持ribbon)ribbon:  # 指的是建立连接所用的时间,适用于网络状态正常的情况下,两端连接所用的时间  ReadTimeout: 5000  # 指的是建立连接后从服务器读取到可用资源所用的时间  ConnectTimeout: 5000logging:  level:   # feign日志以什么级别监控哪个接口   com.bilibili.springcloud.service.PaymentFeignService: debug 
```
#### 后台日志产看

![1609683321415_image.png](/SpringCloud/1609683321415_image.png)

o 

# 3. 服务降级(Hystrix)

## 概述

### 分布式系统面临的问题

o 复杂分布式体系结构中的应用程序有数十个依赖关系,每个依赖关系在某些时候将不可避免地失败。

o 服务雪崩

服务雪崩多个微服务之间调用的时候，假设微服务A调用微服务B和微服务C,微服务B和微服务C又调用其它的微服务,这就是所谓的“扇出”，如果扇出的链路上某个微服务的调用响应时间过长或者不可用，对微服务A的调用就会占用越来越多的系统资源,进而引起系统崩溃,所谓的“雪崩效应”.对于高流量的应用来说，单-的后端依赖可能会导致所有服务器上的所有资源都在几秒钟内饱和。比失败更糟糕的是,这些应用程序还可能导致服务之间的延迟增加，备份队列，线程和其他系统资源紧张，导致整个系统发生更多的级联故障。这些都表示需要对故障和延迟进行隔离和管理，以便单个依赖关系的失败，不能取消整个应用程序或系统。 

### Hystrix简介

 	Hystrix是一 个用于处理分布式系统的`延迟`和`容错`的开源库,在分布式系统里,许多依赖不可避免的会调用失败，比如超时、异常等，Hystrix能够保证在一 个依赖出问题的情况下，`不会导致整体服务失败，避免级联故障,以提高分布式系统的弹性`。“断路器”本身是-种开关装置，当某个服务单元发生故障之后，通过断路器的故障监控(类似熔断保险丝)，`向调用方返回一个符合预期的、可处理的备选响应(FallBack) ，而不是长时间的等待或者抛出调用方无法处理的异常`，这样就保证了服务调用方的线程不会被长时间、不必要地占用，从而避免了故障在分布式系统中的蔓延，乃至雪崩。 

### 能干什么

1. 服务降级

2. 服务熔断

3. 接近实时的监控

4. ............


### 官网

o https://github.com/Netflix/Hystrix

### 官宣停更进维

## Hystrix重要概念

### 服务降级fallback

#### 服务器忙，请稍后再试，不让客户端等待并立刻返回-一个友好提示，fallback

#### 哪些情况会出发降级

1. 程序运行异常

2. 超时

3. 服务熔断触发服务降级

4. 线程池/信号量打满也会导致服务降级


### 服务熔断break

o 类比保险丝达到最大服务访问后，直接拒绝访问，拉闸限电，然后调用服务降级的方法并返回友好提示

### 服务限流flowlimit

o 秒杀高并发等操作，严禁-窝蜂的过来拥挤，大家排队，-秒钟N个，有序进行

## Hystrix案例

### 构建

#### 新建项目cloud-provider-hystrix-payment8001

#### o改POM

```
<dependencies> <!--hystrix--> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-starter-netflix-hystrix</artifactId> </dependency> <!--eureka client--> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId> </dependency> <dependency> <groupId>com.atguigu.springcloud</groupId> <artifactId>cloud-api-common</artifactId> <version>${project.version}</version> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-web</artifactId> </dependency> <!--监控--> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-actuator</artifactId> </dependency> <!--热部署--> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-devtools</artifactId> <scope>runtime</scope> <optional>true</optional> </dependency> <dependency> <groupId>org.projectlombok</groupId> <artifactId>lombok</artifactId> <optional>true</optional> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-test</artifactId> <scope>test</scope> </dependency> </dependencies> 
```

#### 写YML

```
server:  port: 8001spring:  application:   name: cloud-provider-hystrix-paymenteureka:  client:   register-with-eureka: true   fetch-registry: true   service-url:#    defaultZone: http://eureka7001.com:7001/eureka,http://eureka7002.com:7002/eureka    defaultZone: http://eureka7001.com:7001/eureka 
```

#### 主启动

```
@EnableEurekaClient@SpringBootApplicationpublic class PaymentHystrixMain8001 {   public static void main(String[] args) {     SpringApplication.run(PaymentHystrixMain8001.class, args);   }} 
```

#### 写业务

##### service(模拟正常和异常)

```
@Servicepublic class PaymentService {   public String paymentInfo_OK(Integer id) {     return "线程池:" + Thread.currentThread().getName() + " paymentInfo_OK,id:" + id + "\t" + "O(∩_∩)O哈哈~";   }   /**   * 模拟超时访问   * HystrixCommand:一旦调用服务方法失败并抛出了错误信息后,会自动调用@HystrixCommand标注好的fallbckMethod调用类中的指定方法   * execution.isolation.thread.timeoutInMilliseconds:线程超时时间3秒钟   * @param id   * @return   */   public String paymentInfo_TimeOut(Integer id) {     ///int age = 10 / 0;     int timeNumber = 5;     try {       // 暂停5秒钟       TimeUnit.SECONDS.sleep(timeNumber);     } catch (InterruptedException e) {       e.printStackTrace();     }     return "线程池:" + Thread.currentThread().getName() + " paymentInfo_TimeOut,id:" + id + "\t" +         " 耗时(秒)" + timeNumber;   }   } 
```

##### controller(模拟正常和异常)

```
@Slf4j@RestControllerpublic class PaymentController {   @Resource   private PaymentService paymentService;   @Value("${server.port}")   private String servicePort;   /**   * 正常访问   * @param id   * @return   */   @GetMapping("/payment/hystrix/ok/{id}")   public String paymentInfo_OK(@PathVariable("id") Integer id) {     String result = paymentService.paymentInfo_OK(id);     log.info("*****result:" + result);     return result;   }   /**   * 超时访问   * @param id   * @return   */   @GetMapping("/payment/hystrix/timeout/{id}")   public String paymentInfo_TimeOut(@PathVariable("id") Integer id) {     String result = paymentService.paymentInfo_TimeOut(id);     log.info("*****result:" + result);     return result;   }} 
```

#### 测试

##### 启动erueka7001

##### 启动cloud-provider-hystrix-payment8001

##### 访问

· 正常o http://localhost:8001/payment/hystrix/ok/1

![1609767328316_image.png](/SpringCloud/1609767328316_image.png)

· 异常o http://localhost:8001/payment/hystrix/timeout/1

延迟正常返回

![1609767472565_image.png](/SpringCloud/1609767472565_image.png)

#### 上述Moudle都正常

· 下一节以此为基础，正常->错误->降级熔断->恢复

### 高并发测试

#### 使用JMeter压测

![1609770208448_image.png](/SpringCloud/1609770208448_image.png)

![1609770218354_image.png](/SpringCloud/1609770218354_image.png)

![1609770245421_image.png](/SpringCloud/1609770245421_image.png)

[1609770405752_image.png](/SpringCloud/1609770405752_image.png)

#### 此时再访问正常/异常接口都会出现延迟

tomcat的默认的工作线程数被打满了,没有多余的线程来分解压力和处理。

#### 80访问接口同样会被阻塞

##### 新建项目cloud-consumer-feign-hystrix-order80

##### §改POM

```
<dependencies> <!--hystrix--> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-starter-netflix-hystrix</artifactId> </dependency> <!--openfeign--> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-starter-openfeign</artifactId> </dependency> <!--eureka client--> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId> </dependency> <dependency> <groupId>com.atguigu.springcloud</groupId> <artifactId>cloud-api-common</artifactId> <version>${project.version}</version> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-web</artifactId> </dependency> <!--监控--> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-actuator</artifactId> </dependency> <!--热部署--> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-devtools</artifactId> <scope>runtime</scope> <optional>true</optional> </dependency> <dependency> <groupId>org.projectlombok</groupId> <artifactId>lombok</artifactId> <optional>true</optional> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-test</artifactId> <scope>test</scope> </dependency> </dependencies> 
```

##### 写YML

```
server:  port: 80eureka:  client:   register-with-eureka: false   fetch-registry: true   service-url:#    defaultZone: http://eureka7001.com:7001/eureka,http://eureka7002.com:7002/eureka    defaultZone: http://eureka7001.com:7001/eureka 
```

##### 主启动
```
@EnableFeignClients@SpringBootApplicationpublic class OrderHystrixMain80 {   public static void main(String[] args) {     SpringApplication.run(OrderHystrixMain80.class, args);   }} 
```
##### 写业务

###### service

```
@FeignClient("CLOUD-PROVIDER-HYSTRIX-PAYMENT")public interface PaymentHystrixService {   /**   * 正常访问   * @param id   * @return   */   @GetMapping("/payment/hystrix/ok/{id}")   String paymentInfo_OK(@PathVariable("id") Integer id);   /**   * 超时   * @param id   * @return   */   @GetMapping("/payment/hystrix/timeout/{id}")   String paymentInfo_TimeOut(@PathVariable("id") Integer id);} 
```

###### controller

```
@Slf4j@RestControllerpublic class OrderHystrixController {   @Resource   private PaymentHystrixService paymentHystrixService;   /**   * 正常访问   * @param id   * @return   */   @GetMapping("/consumer/payment/hystrix/ok/{id}")   public String paymentInfo_OK(@PathVariable("id") Integer id) {     return paymentHystrixService.paymentInfo_OK(id);   }   /**   * 超时   * @param id   * @return   */   @GetMapping("/consumer/payment/hystrix/timeout/{id}")   public String paymentInfo_TimeOut(@PathVariable("id") Integer id) {     //int age = 10/0;     return paymentHystrixService.paymentInfo_TimeOut(id);   }} 
```

##### Jmeter下测试

· 要么延迟返回

· 要么直接超时

![1609772746345_image.png](/SpringCloud/1609772746345_image.png)

### 故障现象和导致原因

o 8001同一层次的其它接口服务被困死，因为tomcat线程池里面的工作线程已经被挤占完毕

o 80此时调用8001，客户端访问响应缓慢，转圈圈

### 上诉结论

o 正因为有上述故障或不佳表现才有我们的降级/容错/限流等技术诞生

### 如何解决？解决的要求

#### 超时导致服务器变慢(转圈)

解决：超时不再等待（告知结果）

#### 出错(宕机或程序运行出错)

解决：出错有兜底策略

#### 解决

1. 对方服务(8001 )超时了,调用者(80)不能一直卡死等待，必须有服务降级

2. 对方服务(8001)down机了，调用者(80)不能一直卡死等待，必须有服务降级

3. 对方服务(8001)OK,调用者(80)自己出故障或有自我要求(自己的等待时间小于服务提供者)，自己处理降级


### **· 服务降级**

#### 降级配置

@HystrixCommand

#### 8001先从自身找问题

设置自身调用超时时间的峰值，峰值内可以正常运行,超过了需要有兜底的方法处理，作服务降级fallback

#### 8001fallback

##### 主启动类激活

**· 添加注解@EnableCircuitBreaker**

@EnableFeignClients@EnableEurekaClient@SpringBootApplicationpublic class OrderHystrixMain80 {   public static void main(String[] args) {     SpringApplication.run(OrderHystrixMain80.class, args);   }} 

##### 业务类启用

/**   * 模拟超时访问   * HystrixCommand:一旦调用服务方法失败并抛出了错误信息后,会自动调用@HystrixCommand标注好的fallbckMethod调用类中的指定方法   * execution.isolation.thread.timeoutInMilliseconds:线程超时时间3秒钟   * @param id   * @return   */   @HystrixCommand(fallbackMethod = "payment_TimeOutHandler", commandProperties = {       @HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "3000")   }) //服务降级后的处理方法，上限3秒   public String paymentInfo_TimeOut(Integer id) {     ///int age = 10 / 0;     int timeNumber = 5;     try {       // 暂停5秒钟       TimeUnit.SECONDS.sleep(timeNumber);     } catch (InterruptedException e) {       e.printStackTrace();     }     return "线程池:" + Thread.currentThread().getName() + " paymentInfo_TimeOut,id:" + id + "\t" +         " 耗时(秒)" + timeNumber;   }/**   * 兜底方案   *   * @param id   * @return   */public String payment_TimeOutHandler(Integer id) {     return "线程池:" + Thread.currentThread().getName() + " 系统繁忙或运行错误,请稍后重试,id:" + id + "\t" + "o(╥﹏╥)o";   } 

###### **· @HystrixCommand报异常后如何处理**

一旦调用服务方法失败并抛出了错误信息后，会自动调用@HystrixCommand标注好的fallbackMethod调用类中的指定方法 

##### 当服务不可用，服务进行降级

###### 测试

· http://localhost/consumer/payment/hystrix/timeout/1

#### 80fallback

##### 80订单微服务，也可以更好的保护自己，自己也依样画葫芦进行客户端降级保护

##### YML

```
server:  port: 80eureka:  client:   register-with-eureka: false   fetch-registry: true   service-url:#    defaultZone: http://eureka7001.com:7001/eureka,http://eureka7002.com:7002/eureka    defaultZone: http://eureka7001.com:7001/eurekafeign:  hystrix:   # 在feign中开启Hystrix   enabled: true 
```

###### **· controller中超时时间配置不生效原因** 

关键在于feign:hystrix:enabled: true的作用，官网解释“Feign将使用断路器包装所有方法”，也就是将@FeignClient标记的那个service接口下所有的方法进行了hystrix包装（类似于在这些方法上加了一个@HystrixCommand），这些方法会应用一个默认的超时时间为1s，所以你的service方法也有一个1s的超时时间，service1s就会报异常，controller立马进入备用方法，controller上那个3秒那超时时间就没有效果了。改变这个默认超时时间方法：hystrix:  command:   default:    execution:     isolation:      thread:       timeoutInMilliseconds: 3000ribbon:  ReadTimeout: 5000  ConnectTimeout: 5000 

##### 主启动

```
· 添加@EnableFeignClients @EnableHystrix@EnableFeignClients@SpringBootApplicationpublic class OrderHystrixMain80 {   public static void main(String[] args) {     SpringApplication.run(OrderHystrixMain80.class, args);   }} 
```

##### 业务类

###### controller 

```
@Servicepublic class PaymentService {   public String paymentInfo_OK(Integer id) {     return "线程池:" + Thread.currentThread().getName() + " paymentInfo_OK,id:" + id + "\t" + "O(∩_∩)O哈哈~";   }   /**   * 模拟超时访问   * HystrixCommand:一旦调用服务方法失败并抛出了错误信息后,会自动调用@HystrixCommand标注好的fallbckMethod调用类中的指定方法   * execution.isolation.thread.timeoutInMilliseconds:线程超时时间3秒钟   * @param id   * @return   */   @HystrixCommand(fallbackMethod = "payment_TimeOutHandler",  //服务降级后的处理方法       commandProperties = {         @HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "5000")       })   public String paymentInfo_TimeOut(Integer id) {//     int age = 10 / 0;  //运行异常     int timeNumber = 3000;  // 暂停毫秒，超时     try {       TimeUnit.MILLISECONDS.sleep(timeNumber);     } catch (InterruptedException e) {       e.printStackTrace();     }     return "线程池:" + Thread.currentThread().getName() + " paymentInfo_TimeOut,id:" + id + "\t" +         " 耗时(毫秒)" + timeNumber;   }   /**   * 兜底方案   * @param id   * @return   */   public String payment_TimeOutHandler(Integer id) {     return "线程池:" + Thread.currentThread().getName() + " 系统繁忙或运行错误,请稍后重试,id:" + id + "\t" + "o(╥﹏╥)o";   }} 
```

#### 目前问题

每个业务方法对应-一个兜底的方法，代码膨胀

统一和自定义的分开

#### 解决问题

##### 针对：每个方法配置一个? ? ?膨胀

1: 1每个方法配置-个服务降级方法，技术上可以，实际上傻X1: N除了个别重要核心业务有专属，其它普通的可以通过@DefaultProperties(defaulFallback= ")统-跳转到统-处理结果页面通用的和独享的各自分开，避免了代码膨胀，合理减少了代码量, o0.∩)O哈哈~ 

###### **· feign接口系列**

###### **· @ DefaultProperties(defaultFallback = "")**

*在80controller上添加注解@DefaultProperties(defaultFallback = "payment_Global_FallbackMethod")并写对应的payment_Global_FallbackMethod()方法* 

###### 	o 设置全局默认(没有指定)兜底方法

**· controller配置** 

```
@RestController@Slf4j@DefaultProperties(defaultFallback = "payment_Global_FallbackMethod")public class OrderHystrixController {   @Resource   private PaymentHystrixService paymentHystrixService;   /**   * 正常访问   * http://localhost/consumer/payment/hystrix/ok/32   *   * @param id   * @return   */   @GetMapping("/consumer/payment/hystrix/ok/{id}")   public String paymentInfo_OK(@PathVariable("id") Integer id) {     return paymentHystrixService.paymentInfo_OK(id);   }   /**   * 超时访问   * http://localhost/consumer/payment/hystrix/timeout/32   *   * @param id   * @return   */   @GetMapping("/consumer/payment/hystrix/timeout/{id}")   /*@HystrixCommand(fallbackMethod = "paymentTimeOutFallbackMethod", commandProperties = {       @HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "1500")   })*/   @HystrixCommand   public String paymentInfo_TimeOut(@PathVariable("id") Integer id) {     //int age = 10/0;     return paymentHystrixService.paymentInfo_TimeOut(id);   }   /**   * 超时方法fallback   * @param id   * @return   */   public String paymentTimeOutFallbackMethod(@PathVariable("id") Integer id) {     return "我是消费者80,对方支付系统繁忙请10秒种后再试或者自己运行出错请检查自己,o(╥﹏╥)o";   }   /**   * 全局fallback   *   * @return   */   public String payment_Global_FallbackMethod() {     return "Global异常处理信息,请稍后重试.o(╥﹏╥)o";   }} 
```

##### 针对：和业务逻辑混一起? ? ?混乱

###### **· 服务降级，客户端去调用服务端，碰上服务端宕机或关闭**

###### 本次案例服务降级处理是在客户端80实现完成的，与服务端8001没有关系只需要为Feign客户端定义的接口添加一个服务降级处理的实现类即可实现解耦

###### 未来我们要面对的异常

1. 运行

2. 超时

3. 宕机


###### **· 再看我们的业务类PaymentController**

o 每个方法都需要提供一个兜底方法。为此，我们需要解耦

###### 修改cloud-consumer-feign-hystrix-order80根据cloud-consumer-feign-hystrix- order80已经有的PaymentHystrixService接口,重新新建一个类(PaymentFallbackService)实现该接口， 统一为接口里面的方法进行异常处理

**o 实现service**

```
PaymentFallbackService类实现PaymentFeignClientService接口 public class PaymentFallbackService implements PaymentHystrixService {   @Override   public String paymentInfo_OK(Integer id) {     return "----PaymentFallbackService fall back-paymentInfo_OK,o(╥﹏╥)o";   }   @Override   public String paymentInfo_TimeOut(Integer id) {     return "----PaymentFallbackService fall back-paymentInfo_TimeOut,o(╥﹏╥)o";   }} 
```

**o service加注解** 

```
@FeignClient(value = "CLOUD-PROVIDER-HYSTRIX-PAYMENT", fallback = PaymentFallbackService.class)public interface PaymentHystrixService {   /**   * 正常访问   * @param id   * @return   */   @GetMapping("/payment/hystrix/ok/{id}")   String paymentInfo_OK(@PathVariable("id") Integer id);   /**   * 超时   * @param id   * @return   */   @GetMapping("/payment/hystrix/timeout/{id}")   String paymentInfo_TimeOut(@PathVariable("id") Integer id);} 
```

###### **· YML** 

*别忘了添加feign:  hystrix:   # 在feign中开启Hystrix   enabled: true* 

###### **· PaymentFeignClientService接口]**

###### **· 测试**

1. 单个eureka先启动7001

2. PaymentHystrixMain8001启动

3. 正常访问测试 http://localhost/consumer/payment/hystrix/ok/1

4. 故意关闭微服务8001 http://localhost/consumer/payment/hystrix/ok/1

   此时服务端proyider已经down了，但是我们做了服务降级处理，让客户端在服务端不可用时也会获得提示信息而不会挂起耗死服务器

5. 客户端自己调用提示

   ![1609861242174_image.png](/SpringCloud/1609861242174_image.png)

### 服务熔断

#### 熔断是什么

熔断机制概述熔断机制是应对雪崩效应的一-种微服务链路保护机制。当扇出链路的某个微服务出错不可用或者响应时间太长时，会进行服务的降级，进而熔断该节点微服务的调用，快速返回错误的响应信息。当检测到该节点微服务调用响应正常后，恢复调用链路。在Spring Cloud框架里,熔断机制通过Hystrix实现。Hystrix会监控微服务间调用的状况，当失败的调用到一定阈值，缺省是5秒内20次调用失败，就会启动熔断机制。熔断机制的注解是@HystrixCommand. 

#### 实操

##### 修改cloud-provider-hystrix-payment8001

##### PaymentService

###### 	· 新增熔断方法

``` java
//====服务熔断========================

    /**
     * 在10秒窗口期中10次请求有6次是请求失败的,断路器将起作用
     * @param id
     * @return
     */
    @HystrixCommand(
            fallbackMethod = "paymentCircuitBreaker_fallback", commandProperties = {
            @HystrixProperty(name = "circuitBreaker.enabled", value = "true"),// 是否开启断路器
            @HystrixProperty(name = "circuitBreaker.requestVolumeThreshold", value = "10"),// 请求次数
            @HystrixProperty(name = "circuitBreaker.sleepWindowInMilliseconds", value = "10000"),// 时间窗口期/时间范文
            @HystrixProperty(name = "circuitBreaker.errorThresholdPercentage", value = "60")// 失败率达到多少后跳闸
    }
    )
    public String paymentCircuitBreaker(@PathVariable("id") Integer id) {
        if (id < 0) {
            throw new RuntimeException("*****id不能是负数");
        }
        String serialNumber = IdUtil.simpleUUID();
        return Thread.currentThread().getName() + "\t" + "调用成功,流水号:" + serialNumber;
    }
    
    public String paymentCircuitBreaker_fallback(@PathVariable("id") Integer id) {
        return "id 不能负数,请稍后重试,o(╥﹏╥)o id:" + id;
    }
```

##### **PaymentController**

###### 新增熔断接口 

``` java
/**   * 服务熔断   * http://localhost:8001/payment/circuit/32   * @param id   * @return   */   @GetMapping("/payment/circuit/{id}")   public String paymentCircuitBreaker(@PathVariable("id") Integer id) {     String result = paymentService.paymentCircuitBreaker(id);     log.info("***result:" + result);     return result;   } 
```

##### 测试

###### 正确

o http://localhost:8001/payment/circuit/1

###### 错误

o http://localhost:8001/payment/circuit/-1

###### 在频繁错误后突然访问正确接口即可观察到服务被熔断

#### 总结

##### 熔断类型

###### 熔断打开

o 请求不再进行调用当前服务。内部设置时钟- -般为MTTR (平均故障处理时间)，当打开时长达到所设时钟则进入半熔断状态

###### 熔断关闭

o 熔断关闭不会对服务进行熔断

###### 熔断半开

o 部分请求根据规则调用当前服务，如果请求成功目符合规则则认为当前服务恢复正常，关闭熔断

##### 流程

###### 断路器在什么情况下开始起作用

o 涉及到断路器的三个重要参数:快照时间窗、请求总数阀值、错误百分比阀值。 涉及到断路器的三个重要参数:快照时间窗、请求总数阀值、错误百分比阀值。1:快照时间窗:断路器确定是否打开需要统计一些请求和错误数据， 而统计的时间范围就是快照时间窗，默认为最近的10秒。2:请求总数阀值:在快照时间窗内，必须满足请求总数阀值才有资格熔断。默认为20,意味着在10秒内，如果该hystrix命令的调用次数不足20次,即使所有的请求都超时或其他原因失败，断路器都不会打开。3:错误百分比阀值:当请求总数在快照时间窗内超过了阀值，比如发生了30次调用，如果在这30次调用中，有15次发生了超时异常，也就是超过50%的错误百分比，在默认设定50%阀值情况下，这时候就会将断路器打开。 

![1609939698855_image.png](/SpringCloud/1609939698855_image.png)

###### 断路器开启或关闭的条件

- 当满足一定的阀值的时候(默认10秒内超过20个请求次数)

- 当失败率达到一定的时候(默认10秒内超过50%的请求失败)

- 到达以上阀值，断路器将会开启

- 当开启的时候，所有请求都不会进行转发

- 一段时间之后(默认是5秒)，这个时候断路器是半开状态，会让其中一个请求进行转发。如果成功，断路器会关闭，若失败，继续开启。重复4和5


###### 断路器打开之后 

1:再有请求调用的时候，将不会调用主逻辑，而是直接调用降级fallback。通过断路器，实现了自动地发现错误并将降级逻辑切换为主逻辑，减少响应延迟的效果。2:原来的主逻辑要如何恢复呢?对于这-问题，hystrix也为我们实现了 自动恢复功能。当断路器打开，对主逻辑进行熔断之后, hystrix会启动- 个休眠时间窗，在这个时间窗内，降级逻辑是临时的成为主逻辑,当休眠时间窗到期，断路器将进入半开状态，释放- -次请求到原来的主逻辑上,如果此次请求正常返回,那么断路器将继续闭合,主逻辑恢复,如果这次请求依然有问题，断路器继续进入打开状态,休眠时间窗重新计时。 

###### All配置

### 服务限流

o 详见--后面高级篇讲解alibaba的Sentinel说明

### Hystrix工作流程

### 服务监控HystrixDashbord

#### 概述 

除了隔离依赖服务的调用以外，Hystrix还提供 了准实时的调用监控(Hystrix Dashboard) . Hystrix会持续地记录所有通过Hystrix发起的请求的执行信息，并以统计报表和图形的形式展示给用户，包括每秒执行多少请求多少成功，多少失败等。Netflix通过hystrix-metrics-event-stream项目实现了对以上指标的监控。Spring Cloud也提供了Hystrix Dashboard的整合，对监控内容转化成可视化界面。 

#### 仪表盘9001

##### 新建项目cloud-consumer-hystrix-dashboard9001

##### o改POM

```
<dependencies> <!--hystrix dashboard--> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-starter-netflix-hystrix-dashboard</artifactId> </dependency> <!--actuator监控信息完善--> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-actuator</artifactId> </dependency> <!--热部署--> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-devtools</artifactId> <scope>runtime</scope> <optional>true</optional> </dependency> <dependency> <groupId>org.projectlombok</groupId> <artifactId>lombok</artifactId> <optional>true</optional> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-test</artifactId> <scope>test</scope> </dependency> </dependencies> 
```

##### 写YML 

```
server:  port: 9001 
```

##### 主启动+@EnableHystrixDashboard 

```
@EnableHystrixDashboard@SpringBootApplicationpublic class HystrixDashboardMain9001 {   public static void main(String[] args) {     SpringApplication.run(HystrixDashboardMain9001.class, args);   }} 
```

##### 所有Provider微服务提供类(8001/8002/8003)都需要监控依赖配置 

```
<!--监控-->     <dependency>       <groupId>org.springframework.boot</groupId>       <artifactId>spring-boot-starter-actuator</artifactId>     </dependency> 
```

##### 测试

http://localhost:9001/hystrix

#### 断路器演示(服务监控hystrixDashboard)

##### 8001服务提供者添加监控 依赖 
```
<!--监控-->     <dependency>       <groupId>org.springframework.boot</groupId>       <artifactId>spring-boot-starter-actuator</artifactId>     </dependency> 
```
##### 9001监控8001就填写8001的地址

##### 测试

###### 成功

· http://localhost:8001/payment/circuit/1

###### 失败

· http://localhost:8001/payment/circuit/-1

###### 查看仪表盘

- 7色 实心圆:共有两种含义。它通过颜色的变化代表了实例的健康程度，它的健康度从绿色<黄色<橙色<红色递减。该实心圆除了颜色的变化之外,它的大小也会根据实例的请求流量发生变化，流量越大该实心圆就越大。所以通过该实心圆的展示，就可以在大量的实例中快速的发现故障实例和高压力实例。 

- 1圈

- 1线

- 整图说明

  ![1609943207187_image.png](/SpringCloud/1609943207187_image.png)

· 

###### 报错修改 

报错Unable to connect to Command Metric Stream. 

**8001**

· 8001主启动 `@EnableHystrixDashboard@SpringBootApplicationpublic class HystrixDashboardMain9001 {   public static void main(String[] args) {     SpringApplication.run(HystrixDashboardMain9001.class, args);   }   /**   * 此配置是为了服务监控而配置，与服务容错本身无观，springCloud 升级之后的坑   * ServletRegistrationBean因为springboot的默认路径不是/hystrix.stream   * 只要在自己的项目中配置上下面的servlet即可   * @return   */   @Bean   public ServletRegistrationBean getServlet(){     HystrixMetricsStreamServlet streamServlet = new HystrixMetricsStreamServlet();     ServletRegistrationBean<HystrixMetricsStreamServlet> registrationBean = new ServletRegistrationBean<>(streamServlet);     registrationBean.setLoadOnStartup(1);     registrationBean.addUrlMappings("/hystrix.stream");     registrationBean.setName("HystrixMetricsStreamServlet");     return registrationBean;   }}` 

· YML `#暴露全部的监控信息management:  endpoints:   web:    exposure:     include: "*" `

**9001**

· YML `#暴露全部的监控信息management:  endpoints:   web:    exposure:     include: "*" `





# 4. 服务网关(gateway)
## zuul
已停更，略。。。

## 概述
### 是什么 
Cloud 全家桶中很重要的一个组件就是网关，在 1.x 版本中都是采用 Zuul 网关，但是在 2.x 版本中，zuul 升级一种跳票，SpringCloud 最后自己研发了一个网关替代Zuul, 那就是 SpringCloud GateWay 换句话说 gateway 就是原 zuul 1.x 版本的`替代方案SpringCloud GateWay 是 Spring Cloud 的一个全新的项目， 基于 Spring 5.0 + Spring Boot 2.0 和 Project Reactor 等技术开发的网关，它旨在为微服务架构通过一种鸡蛋呢有效的统一的API 路由管理方式Spring Cloud GateWay 作为 Spring Cloud 生态系统的网关， 目标是替代 Zuul ， 在Spring Cloud2.0 以上版本种，没有对新版本的 Zuul 2.0 以上版本最高性能版本进行集成，仍然还是使用的 Zuul 1.x 非 Reactor 模式的老版本，为了提升网关性能， Spring Cloud GateWay 基于 WebFlux 框架实现的，而WebFlux 框架底层则使用了高性能的 Reactor 模式通讯框架 NettySpring Cloud GateWay 的目标是提供统一的路由方式且基于Filter 链的方式提供网关的基本功能，例如：安全，监控/指标， 和限流。 

#### SpringCloud Gateway使用的Webflux中的reactor: netty响应式比亲车给你组件，底层采用了netty通讯框架

### 能干什么
* 反向代理
* 鉴权
* 流量控制
* 熔断
* 日志监控
* ......
![1610027754330_image.png](/SpringCloud/1610027754330_image.png)

### 微服务中的网关层 
网关是在微服务访问的入口，对外是负载均衡Nginx

### zuul和gateway选择

#### 我们为什选择gateway
1. ntix不靠谐，zuul2.0 -直跳票，迟迟不发布
2. springcloud gateway具有如下特征 
   Spring Cloud Gateway 具有如下特征：基于 Spring Framework5 . Project Reactor 和Spring Boot 2.0 进行构建。动态路由：能够匹配任何请求属性；可以路由指定 Predicate (断言) 和 Filter （过滤器）集成 Hystrix 的断路器功能；集成 Spring Cloud 服务发现功能抑郁编写Predicate (断言) 和 Filter (过滤器)请求限流共恩感支持路径重写。 
3. springcloud gateway和zuul的区别目 
   Spring Cloud Gatway 和 Zuul 的区别在SpringCloud Finchley 正式版之前， Spring Cloud 推荐的网关是 Netflix 提供的 Zuul1、Zuul 1.x 是基于阻塞 I/0 的 API Gateway2、Zuul 1.x 基于 Servlet 2.5 使用阻塞架构他不支持任何常链接（如 WebSocket ） Zuul 的涉及模式和 Niginx 很像， 每次 I / 0 操作都是从工作线程种选择一个执行，请求线程被阻塞到工作线程完成，但是差别是 Nginx 使用的是 C++ 实现，Zuul 使用的是Java 实现，而JVM 本省会有第一次加载比较慢的情况，使得 Zuul 的性能相对较差3、Zuul2.x 理想更为陷阱，想基于Netty 非阻塞和支持常谅解， 但是 SpringCloud 目前没有整合。 Zuul2.x 的性能较 Zuul1.x 有较大的提升。在性能方面，根据官方提供的基准测试， Spring Cloud Gateway 的 RPS（每秒请求数）是Zuul 的 1.6 倍
4. Spring Cloud Gateway 建立在 Spring Framework5、 Project Reactor 和Spring Boot 2之上，使用非阻塞 API。
5. Spring Cloud Gateway 还支持 websocket ， 并且与 Spring 紧密集成拥有更好的开发体验。 

#### zuul1.X模型 
Springcloud 中集成的Zuul 版本， 采用的是 Tomcat 容器，使用的是传统的 Servlet IO 处理模型。servlet 由 servlet container 进行生命周期管理。container 启动时，构造 servlet 对象并调用 servlet init（） 进行初始化；container 运行时接受请求，并为每一个请求分配一个线程（一般从线程池中获取空闲线程，）然后调用service（）container 关闭时调用 servlet destory ()销毁 servlet上述模型的缺点：servlet 是一个简单的网络 I/O 模型，当前请求进入servlet container 时，servlet container 就会为其绑定一个线程， 在并发不高的场景下，这种模型适用的。但是一旦在高并发（比如用jmeter压测）， 线程数量就会上涨， 而线程资源代价时昂贵的（上下文切换，内存消耗大）严重影响请求的处理时间。在一些简单业务场景下， 不希望为每个 request分配一个线程，只需要1个或这几个线程就能应对极大的并发请求。这种场景下servlet 模型没有优势。所以 zuul1.x 时基于 servelt 智商的一个阻塞式处理模型，即 spring 实现了， 处理锁鱼哦request 请求的 servlet （DispatcherServlet ） 并由该 servlet 阻塞式处理。所以 ，springcloud zuul 无法摆脱 servlet 模型的弊端。 

#### gateway模型
**webflux** 
传统 Web 框架， 比如说： struts2 , spring mvc 等都是基于 Servlet API 与 Servlet 容器之上运行的。在Servlet3.1 之后有了异步非阻塞的支持。 而WebFlux 是一个典型的非阻塞的异步的框架，它的核心是基于 Reactor 的相关 API 实现的 ， 相对于传统的Web 框架来说，他可以运行在诸如 Netty ，Undertow 支持 Servlet 3.1 的容器上。 非阻塞+ 函数式编程 （Spring 5 必须让你使用 java8）Spring WebFlux 是Spring 5.0 引入的新的响应式框架，区别于 Spring MVC， 它不需要依赖 Servlet API， 它完全是异步非阻塞的， 并且基于 Reactor 来实现响应式流规范。 

## 三大核心概念
* Route(路由)
  路由是构建网关的基本模块，它由ID，目标URI， 一系列的断言和过滤器组成，如果断言为true则匹配该路由
* Predicate(断言)
  参考的是Java8的jva.util.functin.Predicate开发人员可以匹配HTTP请求中的所有内容(例如请求头或请求参数)，如果请求与断言相匹配则进行路由
* Filter(过滤)
  指的是Spring框架中Gatewayfilter的实例，使用过滤器，可以在请求被路由前或者之后对请求进行修改。
* 总体 
  web请求，通过-些匹配条件，定位到真正的服务节点。并在这个转发过程的前后，进行一些精细化控制。predicate就是我们的匹配条件;而fiter, 就可以理解为一个无所不能的拦截器。 有了这两个元素，再加上目标uri,就可以实现一个具体的路由了 

## Gateway工作流程
![1610027063825_image.png](/SpringCloud/1610027063825_image.png)
· 路由转发+执行过滤器链 

客户端向Spring Cloud Gateway发出请求。然后在Gateway Handler Mapping中找到与请求相匹配的路由，将其发送到GatewayWeb Handler.Handler再通过指定的过滤器链来将请求发送到我们实际的服务执行业务逻辑，然后返回。过滤器之间用虚线分开是因为过滤器可能会在发送代理请求之前( "pre" )或之后( "post" )执行业务逻辑。Filter在"pre" 类型的过滤器可以做参数校验、权限校验、流量监控、日志输出、协议转换等，在"post" 类型的过滤器中可以做响应内容、响应头的修改，日志的输出，流量监控等有着非常重要的作用。 

## 入门配置

### 新建项目cloud-gateway-gateway9527

### 改POM

``` xml
<dependencies> 
    <dependency> 
        <groupId>org.springframework.cloud</groupId> 
        <artifactId>spring-cloud-starter-gateway</artifactId> 
    </dependency> 
    <!--gateway无需web和actuator--> 
    <dependency> 
        <groupId>org.springframework.cloud</groupId> 
        <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId> 
    </dependency> 
    <dependency> 
        <groupId>org.projectlombok</groupId> 
        <artifactId>lombok</artifactId> 
        <optional>true</optional> 
    </dependency> 
    <dependency> 
        <groupId>org.springframework.boot</groupId> 
        <artifactId>spring-boot-starter-test</artifactId> 
        <scope>test</scope> 
    </dependency> 
    <dependency> 
        <groupId>com.atguigu.springcloud</groupId> 
        <artifactId>cloud-api-common</artifactId> 
        <version>${project.version}</version> 
    </dependency> 
</dependencies> 
```

### 写YML 
``` yml
server:  
port: 9527
spring:  
    application:   
    name: cloud-gateway
    eureka:  
        instance:   
        hostname: 
        cloud-gateway-service  client:   fetch-registry: true   register-with-eureka: true   service-url:    defaultZone: http://eureka7001.com:7001/eureka/ 
```
### 主启动

### 9527网关如何做路由配置

#### cloud-provider-payment8001看看controller的访问地址

- get

- lb


#### 我们目前不想暴露8001端口，希望在8001外面套一层9527

##### 	YML

```
server:  port: 9527spring:  application:   name: cloud-gateway  cloud:   gateway:    discovery:     locator:      enabled: true # 开启从注册中心动态创建路由的功能，利用微服务名称j进行路由    routes:     - id: payment_route # 路由的id,没有规定规则但要求唯一,建议配合服务名      #匹配后提供服务的路由地址      uri: http://localhost:8001      predicates:       - Path=/payment/get/** # 断言，路径相匹配的进行路由       #- After=2017-01-20T17:42:47.789-07:00[America/Denver]       #- Before=2017-01-20T17:42:47.789-07:00[America/Denver]       #- Cookie=username,zzyy       #- Header=X-Request-Id, \d+ #请求头要有X-Request-Id属性，并且值为正数       #- Host=**.atguigu.com       #- Method=GET       #- Query=username, \d+ # 要有参数名username并且值还要是正整数才能路由      # 过滤      #filters:      #  - AddRequestHeader=X-Request-red, blue     - id: payment_route2      uri: http://localhost:8001      predicates:       Path=/payment/lb/** #断言,路径相匹配的进行路由eureka:  instance:   hostname: cloud-gateway-service  client:   fetch-registry: true   register-with-eureka: true   service-url:    defaultZone: http://eureka7001.com:7001/eureka/ 
```

### 测试

#### 启动7001

#### 启动8001

#### 启动9527网关

网关层不需要web和actuact依赖

#### 访问说明

![1610029851571_image.png](/SpringCloud/1610029851571_image.png)

#### 添加网关前

· http://localhost:8001/payment/get/1

#### 添加网关后

· http://localhost:8001/payment/get/1

· http://localhost:9527/payment/get/1

### YML配置说明

#### Gateway网关路由有两种配置方式:

##### 在配置文件yml中配置

· 见前面步骤

##### 代码中注，入Routelocator的Bean

## 通过微服务名实现动态路由

#### 默认情况下Gateway会根据注册中心注册的服务列表，以注册中心上微服务名为路径创建动态路由进行转发，从而实现动态路由的功能

#### 启动

##### 7001

##### 8001/8002

##### 9527

###### 修改YML从注册中心获取路由地址 

``` yml
server:  
    port: 9527
spring:  
    application:   
        name: cloud-gateway  
    cloud:   
        gateway:    discovery:     locator:      enabled: true # 开启从注册中心动态创建路由的功能，利用微服务名称进行路由    routes:     - id: payment_route # 路由的id,没有规定规则但要求唯一,建议配合服务名      #匹配后提供服务的路由地址      # uri: http://localhost:8001  # 匹配后提供服务的路由地址      uri: lb://cloud-payment-service  # 匹配后提供服务的路由地址，lb代表从注册中心获取服务      predicates:       - Path=/payment/get/** # 断言，路径相匹配的进行路由           - id: payment_route2      # uri: http://localhost:8001  # 匹配后提供服务的路由地址      uri: lb://cloud-payment-service  # 匹配后提供服务的路由地址，lb代表从注册中心获取服务      predicates:       Path=/payment/lb/** #断言,路径相匹配的进行路由eureka:  instance:   hostname: cloud-gateway-service  client:   fetch-registry: true   register-with-eureka: true   service-url:    defaultZone: http://eureka7001.com:7001/eureka/ 
```



#### 测试
o http://localhost:9527/payment/lb

###### 		动态且负载均衡的访问服务

## Predicate的使用
1. After Route Predicate
2. Before Route Predicate
3. Between Route Predicate
4. Cookie Route Predicate
5. Header Route Predicate
6. Host Route Predicate
7. Method Route Predicate
8. Method Route Predicate
9. Query Route Predicate
10. 总结: 说白了，Predicate就是为了实现一-组匹配规则，让请求过来找到对应的Route进行处理。

## Filter的使用

### 是什么 

路由过滤器可用于修改进入的HTTP请求和返回的HTTP响应，路由过滤器只能指定路由进行使用。Spring Cloud Gateway内置了多种路由过滤器，他们都由Gatewayfilter的工厂类来产生 

### gateway的Filter

#### 生命周期，Only Two

- pre

- post


#### 种类，Only Two

- Gatewayfilter

- GlobalFilter


### 常用的gatewayFilter

#### AddRequestParameter

#### YML

```
spring:  cloud:   gateway:    routes:      filters:       - AddRequestHeader=X-Request-red, blue 
```

#### 省略

### 自定义过滤器

#### 自定义全局GlobalFilter

##### 两个主要接口介绍

###### filter

o implements GlobalFilter, Ordered

##### 能干嘛

- 全局日志记录

- 统一网关鉴权

- ......


##### filter 

```
@Slf4j@Componentpublic class MyLogGatewayFilter implements GlobalFilter, Ordered {   @Override   public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {     log.info("come in global filter: {}", new Date());     ServerHttpRequest request = exchange.getRequest();     String uname = request.getQueryParams().getFirst("uname");     if (uname == null) {       log.info("用户名为null，非法用户");       exchange.getResponse().setStatusCode(HttpStatus.NOT_ACCEPTABLE);       return exchange.getResponse().setComplete();     }     // 放行     return chain.filter(exchange);   }   @Override   public int getOrder() {     return 0;   }} 
```

##### 测试

# 5. 服务配置(Config)

## 概述

### 分布式系统面临的问题

微服务意味着要将单体应用中的业务拆分成一个个子服务。 每个服务的粒度相对较小，因此系统中会出现大量的服务。由于每个服务都需要必要的配置信息才能运行，所以一套集中式的、 动态的配置管理设施是必不可少的。SpringCloud提供了ConfigServer来解决这个问题，我们每-个微服务自己带着-个applicationyml, 上百个配置文件的管理../(ToT)/~~ 

### 是什么

o SpringCloud Config为微服务架构中的微服务提供集中化的外部配置支持，配置服务器为各个不同微服务应用的所有环境提供了一 个中心化的外部配置。 

![1610120419217_image.png](/SpringCloud/1610120419217_image.png)

### 能干什么

- 集中管理配置文件

- 不同环境不同配置，动态化的配置更新，分环境部署比如dev/test/prod/beta/release

- 运行期间动态调整配置，不再需要在每个服务部署的机器上编写配置文件，服务会向配置中心统一拉取配置自己的信息

- 当配置发生变动时，服务不需要重启即可感知到配置的变化并应用新的配置

- 将配置信息以REST接口的形式暴露

  posy/curl

## Config服务端配置与测试

### 新建项目cloud-config-certer-3344它即为Cloud的配置cloudConfig Center 

### 改POM

```
<dependencies> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-starter-bus-amqp</artifactId> </dependency> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-config-server</artifactId> </dependency> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-web</artifactId> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-actuator</artifactId> </dependency> <dependency> <groupId>org.projectlombok</groupId> <artifactId>lombok</artifactId> <optional>true</optional> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-test</artifactId> <scope>test</scope> </dependency> </dependencies> 
```



### 写YML 

```
server:  port: 3344spring:  application:   name: cloud-config-center  profiles:   active: native #设置为本地启动的方式，而不是通过git(默认git)  cloud:   config:    server:     native:  # 可以指定本地目录      search-locations: classpath:/config#     git: # 也可以指定远程仓库#      uri: git@github.com:leelovejava/springcloud-config.git#      search-paths:#       - spring-config#    label: master  rabbitmq:   host: localhost   port: 5672   username: guest   password: guesteureka:  client:   service-url:    defaultZone: http://eureka7001.com:7001/eureka# 暴露bus刷新配置的端点management:  endpoints:   web:    exposure:     include: "bus-refresh" 
```

### 主启动@EnableConfigServer 

```
@SpringBootApplication@EnableConfigServerpublic class ConfigCenterMain3344 {   public static void main(String[] args) {     SpringApplication.run(ConfigCenterMain3344.class, args);   }} 
```

### 配置文件

o ![1610156226844_image.png](/SpringCloud/1610156226844_image.png)

### 测试

#### 启动7001

#### 启动3344

http://localhost:3344/config/config-dev.yml

### 配置的读取规则

#### /{label)/(application)-(profile).yml

如：http://localhost:3344/master/config-dev.yml（git的master分支中config-dev.yml)

#### /{application}-{profile}.yml

如：http://localhost:3344/config-dev.yml（git上默认使用master分支）

#### /pictio:[o0il1el([label]l

如：http://localhost:3344/config/dev/master（返回JSON）

## Config客户端配置与测试

### 新建项目cloud-config-client-3355

### 改POM

`<dependencies> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-starter-bus-amqp</artifactId> </dependency> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-starter-config</artifactId> </dependency> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-web</artifactId> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-actuator</artifactId> </dependency> <dependency> <groupId>org.projectlombok</groupId> <artifactId>lombok</artifactId> <optional>true</optional> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-test</artifactId> <scope>test</scope> </dependency> </dependencies>` 

### 写配置文件

 applicaiton.yml是用户级的资源配置项bootstrap.yml是系统级的，优先级更加高Spring Cloud会创建-个"Bootstrap Context"，作为Spring应用的ppliation Context的父上下文。初始化的时候，Bootstrap Context负责从外部源加载配置属性并解析配置。这两个上下文共享一个从外部获取的Environment.Bootp,属性有高优先级，默认情况下，它们不会被本地配置覆盖。.. Boostp cotext和ppliction Contexi有着不同的约定，所以新增了一个bootstrap.ym'文件，保证Bootstrap Context和Application Context'配置的分离。要将Client模块下的applicationymI文件改为bootstrap:yml,这是很关键的，因为botstrap.ym是比pplication.yml先加载的。bootstrapyml优先级高于plicationyml 

o bootstrap.yml `server:  port: 3355spring:  application:   name: config-client  cloud:   config:    label: config # 分支名称    name: config #配置文件名称    profile: dev # 读取的后缀，上述三个综合，为master分支上的config-dev.yml的配置文件被读取，http://config-3344.com:3344/master/config-dev.yml    uri: http://localhost:3344 #配置中心的地址  rabbitmq: #rabbitmq相关配置，15672是web管理端口，5672是mq访问端口   port: 5672   host: localhost   username: guest   password: guesteureka:  client:   service-url:    defaultZone: http://eureka7001.com:7001/eureka` 

### 主启动 

```
@SpringBootApplication@EnableConfigServerpublic class ConfigCenterMain3344 {   public static void main(String[] args) {     SpringApplication.run(ConfigCenterMain3344.class, args);   }} 
```



### 写业务

o controller以Rest的风格访问配置文件 

```
@RestController@RefreshScopepublic class ConfigClientController {   @Value("${config.info}")   private String configInfo;   @GetMapping("/configInfo")   public String getConfigInfo(){     return configInfo;   }} 
```



### 测试

#### 启动3344并自测

http://localhost:3344/config/config-dev.yml

#### 启动3355

http://localhost:3355/configInfo

### 成功实现了客户端3355访问SpringCloud Config3344通过GitHub获取配置信息

### 3344能动态刷新，但3355不能

## Config客户端之动态刷新

### 成功实现了客户端3355访问SpringCloud Config3344通过GitHub获取配置信息

### 动态刷新

#### 修改3355模块

#### POM引入actuator监控 

```
<dependency>       <groupId>org.springframework.boot</groupId>       <artifactId>spring-boot-starter-actuator</artifactId>     </dependency> 
```

#### 修改YML，暴露监控端口 

```
management:  endpoints:   web:    exposure:     include: "*" 
```

#### @RefreshScope业务类Controller修改

#### 此时修改配置文件---> 3344 ---3355此时仍然3355仍然不能动态刷新

#### 需要运维，人员发送Post请求刷新3355 

curl方式POST：curl -X PSOT "http://localhost:3355/actuator/refresh" 

#### 还有什么问题 

假如有多个微服务客户端33553366/3377。。。每个微服务都要执行一次post请求，手动刷新?可否广播，一次通知，处处生效?我们想大范围的自动刷新，求方法



# 6. 服务总线

## 概述

### 原由

· Spring. Cloud Bus配合Spring Cloud Config使用可以实现配置的动态刷新。

### 是什么

· Bus支持两种消息代理: RabbitMQ 和Kafka Spring Cloud Bus是用来将分布式系统的节点与轻量级消息系统链接起来的框架，它整合了Java的事件处理机制和消息中间件的功能。Spring Clud Bus目前支持RbbitMQ和Kafka。 

o ![图一.png](/SpringCloud/1610165929225_image.png)

### 能干嘛

· Spring Cloud Bus能管理和传播分布式系统间的消息，就像一个分布式执行器，可用于广播状态更改、事件推送等，也可以当作微服务间的通信通道

o ![图二.png](/SpringCloud/1610166056125_image.png)

### 为何被称之为总线

 什么是总线在微服务架构的系统中，通常会使用轻量级的消息代理来构建-个共用的消息主题， 并让系统中所有微服务实例都连接上来。由于该主题中产生的消息会被所有实例监听和消费，所以称它为消息总线。在总线上的各个实例，都可以方便地广播-些需要让其他连接在该主题上的实例都知道的消息。基本原理Cofiglin实例都监听MQ中同一个topic默认是springCloudBus).当-个服务刷新数据的时候， 它会把这个信息放入到Topic中，这样其它监听同一Topic的服务就能得到通知，然后去更新自身的配置。 



## RabbitMQ环境配置

略

## SpringCloud Bus动态刷新全局广播

### 演示广播效果，增加复杂度，再以3355为模板再制作一-个3366

#### 新建项目cloud-config-client-3366

#### 改POM

```
<dependencies> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-starter-bus-amqp</artifactId> </dependency> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-starter-config</artifactId> </dependency> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-web</artifactId> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-actuator</artifactId> </dependency> <dependency> <groupId>org.projectlombok</groupId> <artifactId>lombok</artifactId> <optional>true</optional> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-test</artifactId> <scope>test</scope> </dependency> </dependencies> 
```



#### 写YML 

```
server:  port: 3366spring:  application:   name: config-client  cloud:   config:    label: config # 分支名称    name: config #配置文件名称    profile: dev # 读取的后缀，上述三个综合，为master分支上的config-dev.yml的配置文件被读取，http://config-3344.com:3344/master/config-dev.yml    uri: http://localhost:3344 #配置中心的地址eureka:  client:   service-url:    defaultZone: http://eureka7001.com:7001/eurekamanagement:  endpoints:   web:    exposure:     include: "*" 
```



#### 主启动

```
 @SpringBootApplication@EnableEurekaClientpublic class ConfigClientMain3366 {   public static void main(String[] args) {     SpringApplication.run(ConfigClientMain3366.class, args);   }} 
```



#### 写业务

##### controller 

``` java
@RestController@RefreshScopepublic class ConfigClientController {   @Value("${server.port}")   private String serverPort;   @Value("${config.info}")   private String configInfo;   @GetMapping("/configInfo")   public String getConfigInfo(){     return "server.port = " + serverPort + "\t configInfo=" + configInfo;   }} 
```



### 设计思想

#### 1)利用消息总线触发-一个客户端/bus/refresh，而刷新所有客户端的配置

#### 2)利用消息总线触发一个服务端ConfigServer的/bus/refresh端 点，而刷新所有客户端的配置

#### 图二的架构显然更加适合，图一不适合的原因如下

- 打破了微服务的职表单一性，因为微服务本省是业务模块，它本不应该承担配置刷新的职麦

- 破坏了微服务各个节点的对等性

- 有一定的局限性，例如，在微服务迁移时，它的网络地址常常会发生变化，如果此时时想自动属性，会增加更多的工作


### 给cloud- cnfig-center-334配置中心服务端添加消息总线支持

#### POM 

```
<!--添加消息总线RabbitMQ支持-->     <dependency>       <groupId>org.springframework.cloud</groupId>       <artifactId>spring-cloud-starter-bus-amqp</artifactId>     </dependency>     <dependency>       <groupId>org.springframework.boot</groupId>       <artifactId>spring-boot-starter-actuator</artifactId>     </dependency> 
```

#### YML 

```
rabbitmq: #rabbitmq相关配置，15672是web管理端口，5672是mq访问端口   port: 5672   host: localhost   username: guest   password: guest 
```

### 给cloud-config-client-355客户端添加消息总线支持

#### POM 

`<!--添加消息总线RabbitMQ支持-->     <dependency>       <groupId>org.springframework.cloud</groupId>       <artifactId>spring-cloud-starter-bus-amqp</artifactId>     </dependency>     <dependency>` 

#### YML

 rabbitmq: #rabbitmq相关配置，15672是web管理端口，5672是mq访问端口   port: 5672   host: localhost   username: guest   password: guest 

### 给cloud -config-client-3366客户端添加消息总线支持

#### POM 

`<!--添加消息总线RabbitMQ支持-->     <dependency>       <groupId>org.springframework.cloud</groupId>       <artifactId>spring-cloud-starter-bus-amqp</artifactId>     </dependency>     <dependency>` 

#### YML 

rabbitmq: #rabbitmq相关配置，15672是web管理端口，5672是mq访问端口   port: 5672   host: localhost   username: guest   password: guest 

### 测试此时一次修改，广播通知，处处生效

· curl -X POST "http://localhost:3344/actuator/bus-refresh"



## SpringCloud Bus动态刷新定点广播

### 不想全部通知，只想定点通知

· 如：只通知3355，不通知3366

### 步骤

- 指定具体某一个实例生效而不是全部

- 公式: http://[配置中心地址和端口]/actuator/bus-refresh/ {destination}

- /bus/refresh请求不再发送到具体的服务实例上，而是发给config server并通过destination参数类指定需要更新配置的服务或实例


### 测试

· 只通知3355，不通知3366

· curl -X POST "http:/localhost:3344/actuator/bus-refresh/config-client:3355"

### 总结

· ![1610173526368_image.png](/SpringCloud/1610173526368_image.png)





# 7. 消息驱动(SpringCloud Stream)

## 消息驱动概述

### 是什么

o 息中间件的差异,降低切换成本，统一消息的编程模型 什么是SpringCloudtream方定义Spring Cloud Strem是-个构建消息驱动微服务的框架。应用程序通过inputs或者outputs来屿Spring Cloud Stream中binder对象交互。通过我们配置来inding(绑定)，而Spring Cloud Strom的binder对象负责与消息中间件交互。所以，我们只需要搞清楚如何与Spring Cloud srem交互就可以方便使用消息驱动的方式。通过使用Spring ltgatio来连接消息代理中间件以实现消息事件驱动。Spring Cloud Stream为-些供应商的消息中间件产品提供了个性化的自动化配置实现，引用了发布-订阅、消费组、分区的三个核心概念。目前仅支持RbitMQ. Kafka. 

o 官网: https://spring.io/projects/spring-cloud-stream

### 设计思想

#### 标准MQ

![1610187888181_image.png](/SpringCloud/1610187888181_image.png)

生产者/消费者之间靠消息媒介传递信息内容

· Message

消息必须走特定的通道

· 消息通道MessageChannel

消息通道里的消息如何被消费呢，谁负责收发处理

· 消息通道MessageChannel的子接口SubscribableChannel,由MessageHandler消息处理器所订阅

### 为什么用Cloud Stream 

比方说我们用到了RabitMQ和Kafka,由于这两个消息中间件的架构上的不同，像RabbitMQ有exchange, kafka有Topic和Paritions分区，这些中间件的差异性导致我们实际项目开发给我们造成了一定的困扰， 我们如果用了两个消息队列的其中一种， 后面的业务需求，我想往另外-种消息队列进行迁移，这时候无疑就是一个灾难性的，一大堆东西都要重新推倒重新做，因为它跟我们的系统耦合了，这时候springcloud Stream给我们提供了一种解耦合的方式。 

##### stream凭什么可以统一底层差异?

在没有绑定器这个概念的情况下，我们的SpringBoot应用要直接与消息中间件进行信息交互的时候，由于各消息中间件构建的初衷不同，它们的实现细节上会有较大的差异性通过定义绑定器作为中间层，完美地实现了应用程序与消息中间件细节之间的隔离。通过向应用程序暴露统一的hanne通道， 使得应用程序不需要再考虑备种不同的消息中间件实现。通过定义绑定器Binder作为中间层，实现了应用程序与消息中间件细节之间的隔离。 

· 通过定义绑定器Binder作为中间层，实现了应用程序与消息中间件细节之间的隔离。

![1610188367352_image.png](/SpringCloud/1610188367352_image.png)

##### Binder

· INPUT对应于消费者

· OUTPUT对应于生产者

### Stream中的消息通信方式遵循了发布-订阅模式

#### Topic主题进行广播

· 在RabbitMQ就是Exchange

· 在Kakfa中就是Topic

### Spring Cloud Stream标准流程套路

### Binder

很方便的连接中间件，屏蔽差异

### Channel

通道，是队列Queue的- -种抽象，在消息通讯系统中就是实现存储和转发的媒介，通过Channel对队列进行配置

### Source和Sink

简单的可理解为参照对象是Spring Cloud Stream自身，从Stream发布消息就是输出，接受消息就是输入。

o ![1610188595275_image.png](/SpringCloud/1610188595275_image.png)

### 编码API和常用注解

o ![1610188780486_image.png](/SpringCloud/1610188780486_image.png)

## 案例说明

### RabbitMQ环境已经OK

### 工程中新建三个子模块 

o cloud-stream- rabbitmq-provider8801，作为生产者进行发消息模块

o cloud-stream-rabbitmq-consumer8802，作为消息接收模块

o cloud-stream- rabbitmq-consumer8803作为消息接收模块

## 消息驱动之生产者

#### 新建项目cloud-stream-rabbitmq-provider8801

#### 改POM
```
<dependencies> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-web</artifactId> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-actuator</artifactId> </dependency> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId> </dependency> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-starter-stream-rabbit</artifactId> </dependency> <dependency> <groupId>org.projectlombok</groupId> <artifactId>lombok</artifactId> <optional>true</optional> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-test</artifactId> <scope>test</scope> </dependency> </dependencies> 
```
#### 写YML 
```
server:  port: 8801spring:  application:   name: cloud-stream-provider  rabbitmq:   host: localhost   port: 5672   sername: guest   password: guest  cloud:   stream:    binders: # 在此处配置要绑定的rabbitMQ的服务信息     defaultRabbit: # 表示定义的名称，用于binding的整合      type: rabbit # 消息中间件类型    bindings: # 服务的整合处理     output: # 这个名字是一个通道的名称      destination: studyExchange # 表示要使用的exchange名称定义      content-type: application/json # 设置消息类型，本次为json，文本则设为text/plain    binder: defaultRabbit # 设置要绑定的消息服务的具体设置eureka:  client:   service-url:    defaultZone: http://eureka7001.com:7001/eureka  instance:   lease-renewal-interval-in-seconds: 2 # 设置心跳的间隔时间，默认30   lease-expiration-duration-in-seconds: 5 # 超过5秒间隔，默认90   instance-id: send-8801.com # 主机名   prefer-ip-address: true # 显示ip 
```
· 主启动 `@SpringBootApplicationpublic class StreamMQMain8801 {   public static void main(String[] args) {     SpringApplication.run(StreamMQMain8801.class, args);   }}` 

#### 写业务

##### controller 
```
@EnableBinding(Source.class)   //定义为消息的推送管道public class IMessageProviderImpl implements IMessageProvider {   @Override   public String send() {     return null;   }} 
```
##### service 

`public interface IMessageProvider {   /**   * 消息发送   */   String send();} `

`impl @EnableBinding(Source.class)   //定义为消息的推送管道public class IMessageProviderImpl implements IMessageProvider {   @Override   public String send() {     return null;   }} `

#### 测试

##### 启动7001

##### rabbitMQ 

##### 启动8801

##### 访问

http://localhost:8801/sendMessage

## 消息驱动之消费者

#### 新建项目cloud-stream-rabbitmq-provider8802

#### 改POM
``` xml
<dependencies> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-web</artifactId> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-actuator</artifactId> </dependency> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId> </dependency> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-starter-stream-rabbit</artifactId> </dependency> <dependency> <groupId>org.projectlombok</groupId> <artifactId>lombok</artifactId> <optional>true</optional> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-test</artifactId> <scope>test</scope> </dependency> </dependencies> 
```
#### 写YML 
```
server:  port: 8802spring:  application:   name: cloud-stream-consumer  rabbitmq:  # 设置rabbitMQ的相关环境配置   host: localhost   port: 5672   username: guest   password: guest  cloud:   stream:    binders: # 在此处配置要绑定的rabbitMQ的服务信息     defaultRabbit: # 表示定义的名称，用于binding的整合      type: rabbit # 消息中间件类型    bindings: # 服务的整合处理     input: # 这个名字是一个通道的名称      destination: studyExchange # 表示要使用的exchange名称定义      content-type: application/json # 设置消息类型，本次为json，文本则设为text/plain      binder: defaultRabbit # 设置要绑定的消息服务的具体设置eureka:  client:   service-url:    defaultZone: http://eureka7001.com:7001/eureka  instance:   lease-renewal-interval-in-seconds: 2 # 设置心跳的间隔时间，默认30   lease-expiration-duration-in-seconds: 5 # 超过5秒间隔，默认90   instance-id: receive-8802.com #主机名   prefer-ip-address: true # 显示ip 
```
#### 主启动 
```
@SpringBootApplicationpublic class StreamMQMain8802 {   public static void main(String[] args) {     SpringApplication.run(StreamMQMain8802.class, args);   }} 
```
#### 写业务

##### controller 
```
@Component@EnableBinding(Sink.class)public class ReceiveMessageListenerController {   @Value("${server.port}")   private String serverPort;   @StreamListener(Sink.INPUT)   public void input(Message<String> message){     System.out.println("消费者1号，----->接收到的消息："+ message.getPayload() +"\t port:" + serverPort);   }} 
```
#### 测试8801发送，8802接收消息

##### 8801访问

http://localhost:8801/sendMessage

##### 8802

![1610203970351_image.png](/SpringCloud/1610203970351_image.png)

## 分组消费与持久化

### 依照8802，clone出来一份运行8803

o cloud-stream-rabbitmq-consumer8803过程略

### 启动

#### RabbitMQ

#### 7001

服务注册

#### 8801

消息生产

#### 8802

消息消费

#### 8803

消息消费

### 运行后有两个问题

o 有重复消费问题

o 消息持久化问题

### 重复消费

#### 目前是8802/8803同时都收到了，存在重复消费问题

#### 如何解决

分组和持久化属性group 

比如在如下场景中，订单系统我们做集群部署，都会从RabbitMQ中获取订单信息, 那如果一个订单同时被两个服务获取到，那么就会造成数据错误，我们得避免这种情况。这时我们就可以使用Stream中的消息分组来解决注意在Stream中处于同一个group中的多个消费者是竞争关系，就能够保证消息只会被其中一个应用消费一次。不同组是可以全面消费的(重复消费)， 

![1610206613014_image.png](/SpringCloud/1610206613014_image.png)

### 分组

#### 原理

微服务应用放置于同- -个group中，就能够保证消息只会被其中一个应用消费一次。不同的组是可以消费的，同一个组内会发生竞争关系，只有其中一个可以消费。

#### MQ默认单独成组，8802/8803都变成不同组，group两个不同

#### group: bilibiliA、bilibiliB

##### 8802修改YML
```
· group: bilibiliA server:  port: 8802spring:  application:   name: cloud-stream-consumer  rabbitmq:  # 设置rabbitMQ的相关环境配置   host: localhost   port: 5672   username: guest   password: guest  cloud:   stream:    binders: # 在此处配置要绑定的rabbitMQ的服务信息     defaultRabbit: # 表示定义的名称，用于binding的整合      type: rabbit # 消息中间件类型    bindings: # 服务的整合处理     input: # 这个名字是一个通道的名称      destination: studyExchange # 表示要使用的exchange名称定义      content-type: application/json # 设置消息类型，本次为json，文本则设为text/plain      binder: defaultRabbit # 设置要绑定的消息服务的具体设置      group: bilibiliAeureka:  client:   service-url:    defaultZone: http://eureka7001.com:7001/eureka  instance:   lease-renewal-interval-in-seconds: 2 # 设置心跳的间隔时间，默认30   lease-expiration-duration-in-seconds: 5 # 超过5秒间隔，默认90   instance-id: receive-8802.com #主机名   prefer-ip-address: true # 显示ip 
```
##### 8803修改YML
```
· group: bilibiliA server:  port: 8803spring:  application:   name: cloud-stream-consumer  rabbitmq:  # 设置rabbitMQ的相关环境配置   host: localhost   port: 5672   username: guest   password: guest  cloud:   stream:    binders: # 在此处配置要绑定的rabbitMQ的服务信息     defaultRabbit: # 表示定义的名称，用于binding的整合      type: rabbit # 消息中间件类型    bindings: # 服务的整合处理     input: # 这个名字是一个通道的名称      destination: studyExchange # 表示要使用的exchange名称定义      content-type: application/json # 设置消息类型，本次为json，文本则设为text/plain      binder: defaultRabbit # 设置要绑定的消息服务的具体设置      group: bilibiliAeureka:  client:   service-url:    defaultZone: http://eureka7001.com:7001/eureka  instance:   lease-renewal-interval-in-seconds: 2 # 设置心跳的间隔时间，默认30   lease-expiration-duration-in-seconds: 5 # 超过5秒间隔，默认90   instance-id: receive-8802.com #主机名   prefer-ip-address: true # 显示ip 
```
#### 我们自己配置 

分布式微服务应用为了实现高可用和负载均衡，实际上都会部署多个实例，本例阳哥启动了两个消费微服务(8802/8803)多数情况，生产者发送消息给某个具体微服务时只希望被消费-饮，按照上面我们启动两个应用的例子，虽然它们同属一个应用，但是这个消息出现了被重复消费两次的情况。为了解决这个问题，在Spring Cloud Stream中提供了消费组的概念。 

#### 结论

· 同一个组的多个微服务实例，每次只会有一个拿到

#### 8802/8803实现了轮询分组，每次只有一个消费者8801模块的发的消息只能被8802或8803其中一个接收到，这样避免了重复消费。

#### 8802/8803都变成相同组，group两个相同

### 持久化

o 通过上述，解决了重复消费问题，再看看持久化

o 停止8802/8803并去除掉8802的分组group: bilibiliA

8803的分组group: bilibiliA没有去掉

o 8801先发送4条消息到rabbitmq

o 先启动8802，无分组属性配置，后台没有打出来消息

o 再启动8803，有分组属性配置，后台打出来了MQ上的消息

# 8. 链路追踪

## SpringCloud Sleuth分布式请求链路跟踪

### 概述

#### 为什么会出现这个技术?需要解决哪些问题?

##### 问题

在微服务框架中。-个由客户端发起的请求在后端系统中会经过多个不同的的服务节点调用来协同产生最后的请求结果，每-个前段请求都会形成一条复杂的分布式服务调用链路，链路中的任何-环出现高延时或错误都会引起整个请求最后的失败。 

### 是什么

- tp://github.com/spring-cloud/spring-cloud-sleuth

- Spring Cloud Sleuth提供了一套完整的服务跟踪的解决方案

- 在分布式系统中提供追踪解决方案并且兼容支持了zipkin


### 搭建链路监控步骤

#### 1. zipkin

##### 下载

- SpringCloud从F版起已不需要自己构建Zipkin Server了，只需调用jar包即可

- http//d.bintray.com/openzipkin/maven/io/zipkin/java/zipkin-server/

- zipkin-server-2.12.9-exec.jar


##### 运行jar

cmd运行 java -jar zipkin.jar

##### 运行控制台

##### 	http://localhost:9411/zinkin/

###### 	术语

**· 完整的调用链路** 

表示一请求链路，一条链路通过Trace Id唯一标识。 Span标识发起的请求信息，各span通过parent id关联起来 

o ![1610257462352_image.png](/SpringCloud/1610257462352_image.png)

简化

![1610257660421_image.png](/SpringCloud/1610257660421_image.png)

**· 名词解释**

- Trace:类似于树结构的Span集合，表示一条调用链路，存在唯一标识

- span:表示调用链路来源，通俗的理解span就是一次请求信息


#### 2.服务提供者

##### cloud. -provider-payment8001

##### POM 
```
<dependency>       <groupId>org.springframework.cloud</groupId>       <artifactId>spring-cloud-starter-zipkin</artifactId>     </dependency> 
```
##### YML 
```
spring:  # zipkin/sleuth链路跟踪  zipkin:   base-url: http://localhost:9411  sleuth:   sampler:    # 采样值介于0到1之间,1表示全部采集    probability: 1 
```
##### 业务类PaymentController 
```
/**   * 链路跟踪   * @return   */   @GetMapping(value = "/payment/zipkin")   public String paymentZipkin() {     return "hi,i'am paymentZipkin server fall back,welcome to bilibili,O(∩_∩)O哈哈~";   } 
```
#### 3.服务消费者(调用方)

##### cloud-consumer-order80

##### POM 
```
<!--包含了sleuth+zipkin-->     <dependency>       <groupId>org.springframework.cloud</groupId>       <artifactId>spring-cloud-starter-zipkin</artifactId>     </dependency> 
```
##### YML 
```
spring:  # zipkin/sleuth链路跟踪  zipkin:   base-url: http://localhost:9411  sleuth:   sampler:    # 采样值介于0到1之间,1表示全部采集    probability: 1 
```
##### 业务类OrderController 
```
/**   * 链路跟踪 zipkin+sleuth   * http://localhost/consumer/payment/zipkin   *   * @return   */   @GetMapping("/consumer/payment/zipkin")   public String paymentZipkin() {     return restTemplate.getForObject("http://localhost:8001/payment/zipkin/", String.class);   } 
```
#### 4.依次启动eureka7001/8001/80

o 80调用8001几次测试下

#### 5.打开浏览器访问: http://localhost:9411/zipkin/

o 首页，调用记录

![1610277535670_image.png](/SpringCloud/1610277535670_image.png)

o 查看依赖关系

![1610277563808_image.png](/SpringCloud/1610277563808_image.png)

o 原理

![1610257462352_image.png](/SpringCloud/1610257462352_image.png)

# **SpringCloud Alibaba

## SpringCloud Alibaba入门简介

why会出现SpringCloud alibaba

· Spring Cloud Netlix项目进入维护模式 Spring Cloud Netfli将不再开发新的组件我们都知道Spring Cloud版本迭代算是比较快的，因而出现了很多重大ISSUE都还来不及Fix就又推另-一个Release了. 进入维护模式意思就是目前一直以后一段时间Spring Cloud Netflix提供的服务和功能就这么多了，不在开发新的组件和功能了。以后将以维护和Merge分支Full Request为主 

· SpringCloud alibaba

o https://spring.io/projects/spring-cloud-alibaba

SpringCloud alibaba带来了什么

· 能干嘛 服务限流降级:默认支持Servlet. Feign. RestTemplate. Dubbo和RocketMQ限流降级功能的接入，可以在运行时通过控制台实时修改限流降级规则，还支持查着限流降级Metrics监控。服务注册与发现:适配Spring Cloud服务注册与发现标准，默认集成了Ribbon的支持。分布式配置管理:支持分布式系统中的外部化配置，配置更改时自动刷新。消息驱动能力:基于Spring Cloud Strem为微服务应用构建消息驱动能力。阿里云对象存储:阿里云提供的海量、安全、低成本、高可靠的云存储服务。支持在任何应用、任何时间、任何地点存储和访问任意类型的数据。分布式任务调度:提供秒级、 精准。高可靠、高可用的定时(基于Cron表达式)任务调度服务。同时提供分布式的任务执行模型，如网格任务。网格任务支持海量子任务均匀分配到所有Worker (schedulerx: client) 上执行。 

· 怎么玩 Sentinel阿里巴巴开源产品，把流量作为切入点，从流量控制，熔断降级。系统负载保护等多个维度保护服务的稳定性。Nacos阿里巴巴开源产品，一个更易于构建云原生应用的动态服务发现。配置管理和服务管理平台。RocketMQApache RocketMa"基于Java的高性船，高香吐量的分布式消息和流计算平台。DubboApache Dubbo~是-数高性能 Java RPC框架。Seata阿里巴巴开源产品，一个最于使用的高性船微服务分布式事务解决方案。Alibaba Cloud osS阿里云对象存储服务，(obje Stoag sesicee.简称OSS). 。是阿里云提供的海量。安全。低成本、高可靠的云存儒服好。您可以在任何应用、任何时间，任何地点存储和访问任意类型的数范。Alibaba Cloud SchedulerX阿里中间件团队开发的一款分布式任务调度产品，支持周期性的任务与固定时间点触发任务。 

SpringCloud alibaba学习资料获取

· https://github.com/alibaba/spring-cloud-alibaba/blob/master/README-zh.md

## SpringCloud AlibabaNacos服务注册和配置中心

Nacos简介

· 为什么叫Nacos

o 前四个字母分别为Naming和Configuration的前两个字母，最后的s为Service。

· 是什么

o 一个更易于构建云原生应用的动态服务发现、配置管理和服务管理平台。

o Nacos: Dynamic Naming and Configuration Service

o Nacos就是注册中心+配置中心的组合

等价于Nacos = Eureka+ Config + Bus

· 能干嘛

o 替代Eureka做服务注册中心

o 替代Config做服务配置中必

· 去哪下

o nacos.io

o 文档

https://nacos.io/zh-cn/docs/what-is-nacos.html

· 各中注册中心比较

o 

安装并运行Nacos

· 安装 docker pull nacos/nacos-serverrun --env MODE=standalone --name nacos -d -p 8848:8848 nacos/nacos-server若包内存不足：docker run -e JVM_XMS=256m -e JVM_XMX=256m --env MODE=standalone --name myNacos -d -p 8848:8848 nacos/nacos-server参考：https://blog.csdn.net/jinxilongjxl/article/details/109718879 

· 测试访问：http://localhost:8848/nacos/

o 账号密码默认nacosnacos

Nacos作为服务注册中心演示

· 官网文档

o 官网

https://spring-cloud-alibaba-group.github.io/github-pages/hoxton/en-us/index.html

o 中文文档

https://spring-cloud-alibaba-group.github.io/github-pages/hoxton/zh-cn/index.html

· 父POM `<!--Spring cloud alibaba 2.2.1.RELEASE-->       <dependency>         <groupId>com.alibaba.cloud</groupId>         <artifactId>spring-cloud-alibaba-dependencies</artifactId>         <version>2.2.1.RELEASE</version>         <type>pom</type>         <scope>import</scope>       </dependency>` 

· 基于Nacos的服务提供者

o 新建项目cloudalibaba-provider-payment9001

o改POM`<dependencies> <!--alibaba-nacos--> <dependency> <groupId>com.alibaba.cloud</groupId> <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-web</artifactId> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-actuator</artifactId> </dependency> <dependency> <groupId>org.projectlombok</groupId> <artifactId>lombok</artifactId> <optional>true</optional> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-test</artifactId> <scope>test</scope> </dependency> </dependencies>` 

o 写YML `server:  port: 9001spring:  application:   name: nacos-payment-provider  cloud:   nacos:    discovery:     server-addr: localhost:8848management:  endpoints:   web:    exposure:     include: "*"` 

o 主启动 `@SpringBootApplication@EnableDiscoveryClientpublic class PaymentMain9001 {   public static void main(String[] args) {     SpringApplication.run(PaymentMain9001.class, args);   }}` 

o 写业务

controller `@RestControllerpublic class PaymentController {   @Value("${server.port}")   private String serverPort;   @GetMapping("/payment/nacos/{id}")   public String getPayment(@PathVariable("id") Integer id){     return "nacos register, serverport=" + serverPort + "\t id:" + id;   }   }` 

o 测试

http://localhost:9001/payment/nacos/1

nacos控制台

· 

nacos服务注册中心+服务提供者9001都OK了

o 为了下一章节演示nacos的负载均衡，参照9001新建9002

1. 可以参考9001创建9002

2.通过虚拟的方式参考9001运行9002
```
· -DServer.port=9011 
```
测试

· http://localhost:9002/payment/nacos/1

o 

· 基于Nacos的服务消费者

o 新建项目cloudalibaba-consumer-nacos-order83

o改POM`<dependencies> <dependency> <groupId>com.alibaba.cloud</groupId> <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId> </dependency> <dependency> <groupId>com.atguigu.springcloud</groupId> <artifactId>cloud-api-common</artifactId> <version>${project.version}</version> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-web</artifactId> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-actuator</artifactId> </dependency> <dependency> <groupId>org.projectlombok</groupId> <artifactId>lombok</artifactId> <optional>true</optional> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-test</artifactId> <scope>test</scope> </dependency> </dependencies>` 

o 写YML server:  port: 83spring:  application:   name: nacos-order-consumer  cloud:   nacos:    discovery:     server-addr: localhost:8848#消费者将要去访问的微服务名称（注册成功进nacos的微服务提供者）service-url:  nacos-user-service: http://nacos-payment-provider 

o 主启动 @SpringBootApplication@EnableDiscoveryClientpublic class OrderNacosMain83 {   public static void main(String[] args) {     SpringApplication.run(OrderNacosMain83.class, args);   }} 

o 写业务

config @Configurationpublic class ApplicationContextConfig {   @Bean   @LoadBalanced   public RestTemplate getRestTemplate(){     return new RestTemplate();   }} 

controller @RestController@Slf4jpublic class OrderNacosController {   @Resource   private RestTemplate restTemplate;   @Value("${service-url.nacos-user-service}")   private String serverUrl;   @GetMapping("/consumer/payment/nacos/{id}")   public String paymentInfo(@PathVariable("id") Integer id){     return restTemplate.getForObject(serverUrl + "/payment/nacos/" + id, String.class);   }} 

o 测试

http://localhost:83/consumer/payment/nacos/1

· 轮询9001和9002

· 服务注册中心对比

o 

o 

o Nacos支持AP和CP模式的切换 C是所有节点在同-时间看到的数据是一致的; 而A的定义是所有的请求都会收到响应。何时选择使用何种模式?一般来说，如果不需要存储服务吸别的信息且服务实例是通过nacos-client注册，并能够保持心跳上报。那么就可以选择AP模式。当前主流的服务如Spring cloud和Dubbo服务，都适用于AP模式，AP模式为了服务的可能性而减弱了一致性， 因此AP模式下只支持注册临时实例。如果需要在服务级别编辑或者存储配置信息，那么CP是必须，K8S服务和DNS服务则适用于CP模式。CP模式下则支持注册持久化实例，此时则是以Raft协议为集群运行模式,该模式下注册实例之前必须先注册服务，如果服务不存在，则会返回错识。 

Nacos作为服务配置中心演示

· Nacos作为配置中心-基础配置

o 新建项目cloudalibaba-config-nacos-client3377

o改POM`<dependencies> <dependency> <groupId>com.alibaba.cloud</groupId> <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId> </dependency> <dependency> <groupId>com.alibaba.cloud</groupId> <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-web</artifactId> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-actuator</artifactId> </dependency> <dependency> <groupId>org.projectlombok</groupId> <artifactId>lombok</artifactId> <optional>true</optional> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-test</artifactId> <scope>test</scope> </dependency> </dependencies>` 

o 写YML Nacos同springcloud-config-样, 在项目初始化时，要保证先从配置中心进行配置拉取，拉取配置之后，才能保证项目的正常启动。springboot中配置文件的加载是存在优先级顺序的，bootstrap优先级高于application 

application.yml `spring:  profiles:   active: dev # 开发环境#   active: test # 测试环境#   active: info # 开发环境 `

bootstrap.yml `server:  port: 3377spring:  application:   name: nacos-config-client  cloud:   nacos:    discovery:     server-addr: localhost:8848 # 注册中心    config:     server-addr: localhost:8848 # 配置中心     file-extension: yml # 这里指定的文件格式需要和nacos上新建的配置文件后缀相同，否则读不到     group: TEST_GROUP     namespace: 4ccc4c4c-51ec-4bd1-8280-9e70942c0d0c#  ${spring.application.name}-${spring.profile.active}.${spring.cloud.nacos.config.file-extension}` 

o 主启动 `@SpringBootApplication@EnableDiscoveryClientpublic class NacosConfigClientMain3377 {   public static void main(String[] args) {     SpringApplication.run(NacosConfigClientMain3377.class, args);   }}` 

o 写业务

controller `@RestController@RefreshScope // 支持nacos的动态刷新public class ConfigClientController {   @Value("${config.info}")   private String configInfo;   @GetMapping("/config/info")   public String getConfigInfo(){     return configInfo;   }}` 

o 在Nacos中添加配置信息

Nacos中的匹配规则

· 理论

o Nacos中的dataid的组成格式及与SpringBoot配置文件中的匹配规则

o 官网

https://nacos.io/zh-cn/docs/quick-start-spring-cloud.html

公式：${spring.application.name}-${spring.profile.active}.${spring.cloud.nacos.config.file-extension}

· 实操

o 配置新增





o Nacos界面配置对应

设置DataId

公式

$(spring.application.name)-$(spring.profiles. active).${spring.cloud.nacos.config. file extension)

prefix默认为spring.application.name 的值

spring, profile active即为当前环境对应的profile,可以通过配置项spring. profile.active来配置。

file exetension 为配置内容的数据格式，可以通过配置项spring cloud nacos .config file -extension来配置

小总结说明



o 历史配置

o 测试

启动前需要在nacos客户端配置管理配置管理栏目下有对应的ypml配置文件

运行cloud config nacos client3377的主启动类

调用接口查看配置信息

· http://localhost:3377/config/info

· Nacos作为配置中心-分类配置

o 问题

多环境多项目管理区 问题1:实际开发中，通常一个系统会准备dev开发环境test测试环境prod生产环境如何保证指定环境启动时服务能正确读取到Nacos上相应环境的配置文件呢?问题2:-个大型分布式微服务系统会有很多微服务子项目，每个微服务项目又都会有相应的开发环境测试环境、预发环境、正式环境...那怎么对这些微服务配置进行管理呢? 

o Nacos的图形化管理界面

命名空间

· 

配置管理

· 

o Namespace+ Group+ Data ID三者关系?为什么这么设计?

是什么 1是什么类似Java里面的package名和类名最外层的namespace是可以用于区分部署环境的，Group和DatalD逻辑 上区分两个目标对象。 

三者情况

· 

默认情况 默认情况:Namespace=public, Group=DEFAULT, GROUP,默认Cluster是DEFAULTNacos默认的命名空间是public, Namespace主要用来实现隔离。比方说我们现在有3三个环境:开发、测试、生产环境，我们就可以创建E个Namespace,不同的Namespace之间是隔离的。Group默认是DEFAULT_ GROUP, Group可以把不同的微服务划分到同-个分组里面去Service就是微服务; -个Service可以包含多个Cluster (集群)，Nacos默Cluster是DEFAULT, Cluster是对指定微服务的一 个虚拟划分。比方说为了客灾，将Service微服务分别部署在了杭州机房和广州机房,这时就可以给杭州机房的Service微服务起一个集群名称(HZ) ,给广州机房的Service微服务起-个集群名称(GZ) .还可以尽量让同一个机房的微服务互相调用，以提升性能。最后是Instance,就是微服务的实例。 

o Case

三种方案加载配置

· DatalD方案

o 指定spring.profile. active和配置文件的DatalD来使不同环境下读取不同的配置

o 默认空间+默认分组+可以建多个DatalD



o 通过spring. profile.active属性就能进行多环境下配置文件的读取

3377application.yml spring:  profiles:   active: dev # 开发环境#   active: test # 测试环境#   active: info # 开发环境 

o 测试

http://localhost:3377/config/info

· Group方案

o 通过Group实现环境区分

新建Group



o 在nacos图形界面控制台，上面新建配置文件DatalD



o bootstrap+ application



· Namespace方案

o 新建dev/test的Namespace



o 回到服务管理-服务列表查看享

o 按照域名配置填写重

o YML

bootstrap spring:  cloud:   nacos:    config:     group: TEST_GROUP    namespace: 4410c076-c5d1-49e6-866a-13eecc5e7fbb 

application

Nacos集群和持久化配置(重要)

· 官网说明

o https://nacos.io/zh-cn/docs/cluster-mode-quick-start.html

o 说明 默认Nacos使用嵌入式数据库实现数据的存储。所以，如果启动多个默认配置下的Nacos节点，数据存储是存在一致性问题的。为了解决这个问题，Nacos采用了集中式存储的方式来支持集群化部署，目前只支持MySQL的存储。 

https://nacos.io/zh-cn/docs/deployment.html

支持MySQL

· 

· Nacos持久化配置解释

o Nacos默认自带的是嵌入式数据库derby

可产看源码POM

o derby到mysq|切换配置步骤

nacos -server-1.1.4\nacos\conf目录下找到sql脚本

· nacos -mysql.sql

· 执行脚本

nacos- server-1.1.4\nacos\conf目录下找到application.properties

o 启动Nacos,可以看到是个全新的空记录界面，以前是记录进derby

· Linux版Nacos+ MySQL生产环境配置

o 集群配置

1. Linux服务器上mysq|数据库配置

· sq|语句源文件 https://nacos.io/zh-cn/docs/cluster-mode-quick-start.html 

· 自己Linux机器上的Mysq|数据库粘贴

2. application.properties配置

· 位置

o X/nacos/conf/

· 内容 spring.datasource.platform=mysqldb.num=1db.url.0=jdbc:mysql://127.0.0.1:3306/nacos?characterEncoding=utf8&connectTimeout=1000&socketTimeout=3000&autoReconnect=true&useUnicode=true&useSSL=false&serverTimezone=UTCdb.user=rootdb.password=root 

3. Linux服务器上nacos的集群配置cluster.conf

· 梳理出3台nacos集器的不同服务端口号

· 复制出cluster.conf

· 内容 host1:port1host2:port2host3:port3 

o 这个IP不能写127.0.01.必须是Linux命令hostname -i能够识别的IP

4.编辑Nacos的启动脚本startup.sh,使它能够接受不同的启动端口

· /mynacos/nacos/bin目录下有startup.sh

· 在什么地方，修改什么，怎么修改

· 思考 集群启动，我们希望可以类似其它软件的hell命令,传递不同的端口号启动不同的nacos实例。命令: ./startup.sh -p 3333表示启动端口号为3333的nacos服务器实例，和上一一步的cluster.conf配置的- 致。 

· 修改内容

o 

· 执行方式

o ./startup. sh -p 3333

o ./startup. sh -p 4444

o ./startup. sh -p 5555

5. Nginx的配置，由它作为负载均衡器

· 修改noix的配置文件

o nginx.conf



· 按照指定启动

o . /nginx -C /usr/local/nginx/conf/nginx. cenf

6.截止到此处，1个Nginx+ 3个nacos注册中心+ 1个mysq|

· 测试通过nginx访问nacos

o http://host:port/nacos/#/login

· 新建一个配置测试口

· linux服务器的mysql插入一条记录

o 测试

微服务cloudalibaba- provider-payment9002启动注册进nacos集群

· YML

o 高可用小总结



## SpringCloud AlibabaSentinel实现熔断与限流

Sentinel

· 官网

o https://github.com/alibaba/Sentinel

o 中文：https://github.com/alibaba/Sentinel/wiki/%E4%BB%8B%E7%BB%8D

· 去哪下

· 能干嘛

o 

· 怎么玩

o 服务使用中的各种问题白

服务雪崩

服务降级

服务熔断

服务限流

安装Sentinel控制台 Sentinel分为两个部分:●核心库(Java 客户端)不依赖任何框架/库，能够运行于所有Java运行时环境。同时对Dubbo、Spring Cloud等框架也有较好的支持。●控制台(Dashboard) 基于Spring Boot开发。打包后可以直接运行，不需要额外的Tomcat等应用容器， 

· sentinel组件由2部分构成

o 后台

o 前台8080

· 安装步骤用

o 下载

o 运行命令

前提

· java8、8080端口空闲

命令

· java -jar sentinel-dashboard-1.8.0.jar

o 访问sentinel管理界面

http://localhost:8080

登录账号密码均为sentinel

初始化演示工程

· 启动Nacos8848成功

o http://localhost:8848/nacos

· Module

o 新建项目cloudalibaba-sentinel-service8401

o改POM`<dependencies> <dependency> <groupId>com.alibaba.cloud</groupId> <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId> </dependency> <!-- sentinel-datasource-nacos 后续持久化用 --> <dependency> <groupId>com.alibaba.csp</groupId> <artifactId>sentinel-datasource-nacos</artifactId> </dependency> <dependency> <groupId>com.alibaba.cloud</groupId> <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId> </dependency> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-starter-openfeign</artifactId> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-web</artifactId> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-actuator</artifactId> </dependency> <dependency> <groupId>org.projectlombok</groupId> <artifactId>lombok</artifactId> <optional>true</optional> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-test</artifactId> <scope>test</scope> </dependency> <dependency> <groupId>com.atguigu.springcloud</groupId> <artifactId>cloud-api-common</artifactId> <version>${project.version}</version> </dependency> </dependencies>` 

o 写YML `server:  port: 8401spring:  application:   name: cloudalibaba-sentinel-service  cloud:   nacos:    discovery:     # Nacos服务注册中心地址     server-addr: localhost:8848   sentinel:    transport:     # sentinel dashboard 地址     dashboard: localhost:8080     # 默认为8719，如果被占用会自动+1，直到找到为止     port: 8719    # 流控规则持久化到nacos    datasource:     dsl:      nacos:       server-addr: localhost:8848       data-id: ${spring.application.name}       group-id: DEFAULT_GROUP       data-type: json       rule-type: flowmanagement:  endpoints:   web:    exposure:     include: "*"` 

o 主启动 `@SpringBootApplication@EnableDiscoveryClientpublic class MainApp8401 {   public static void main(String[] args) {     SpringApplication.run(MainApp8401.class, args);   }}` 

o 写业务

controller
```
· FlowLimitController  @RestController@Slf4jpublic class FlowLimitController {   @GetMapping("/testA")   public String testA(){//     try {//       TimeUnit.MILLISECONDS.sleep(800);//     } catch (InterruptedException e) {//       e.printStackTrace();//     }     return "testA-----";   }   @GetMapping("/testB")   public String testB(){     log.info(Thread.currentThread().getName() + "...testB ");     return "testB  -----";   }   } 
```
o 测试

· 启动Sentinel8080 `@RestController@Slf4jpublic class FlowLimitController {   @GetMapping("/testA")   public String testA(){//     try {//       TimeUnit.MILLISECONDS.sleep(800);//     } catch (InterruptedException e) {//       e.printStackTrace();//     }     return "testA-----";   }   @GetMapping("/testB")   public String testB(){     log.info(Thread.currentThread().getName() + "...testB ");     return "testB  -----";   }   @GetMapping("/testD")   public String testD(){     try {       TimeUnit.SECONDS.sleep(1);     } catch (InterruptedException e) {       e.printStackTrace();     }     log.info("testD 测试RT");     return "testD -----";   }   @GetMapping("/testException")   public String testException(){     log.info("testException 异常比例");     int age = 10 /0 ;     return "testException -----";   }   @GetMapping("/testExceptionCount")   public String testExceptionCount(){     log.info("testExceptionCount 异常数");     int age = 10 /0 ;     return "testExceptionCount -----";   }   @GetMapping("/testHotKey")   @SentinelResource(value = "testHotKey", blockHandler = "dealTestHotKey")   public String testHotKey(@RequestParam(value = "p1", required = false) String p1,               @RequestParam(value = "p2", required = false) String p2){     int age = 10 /0;     return "testHotKey -----";   }   public String dealTestHotKey(String p1, String p2, BlockException blockException){     return "dealTestHotKey---------";   }}` 

· 启动微服务8401

o 空空如也，啥都没有

o Sentinel采用的懒加载说明

执行一次访问即可

· http://localhost:8401/testA

· http://localhost:8401/testB

o 效果



o 结论

sentinel8080正在监控微服务8401

流控规则

· 基本介绍

o 



· 流控模式

o 直接(默认)

直接->快速失败(默认)

配置及说明 QPS：表示1秒钟内查询1次就是OK, 若超过次数1,就直接-快速失败，报默认错误线程数：当调用该ap的线程数达到问值的时候，进行限流 

· 

测试

· 快速点击访问http://localhost:8401/testA

· 结果

o 

· 思考???

o 直接调用默认报错信息，技术方面OKbut, 是否应该有我们自己的后续处理?

类似有个fallback的兜底方法?

o 关联

是什么

· 当关联的资源达到阈值时，就限流自己

· 即当与A关联的资源B达到阀值后，就限流A自己

· 即B惹事，A挂了

配置A 当关联资源/testB的qps阀值超过1时，就限流/testA的Rest访问地址, 当关联资源到阈值后限制配置好的资源名 

· 

postman模拟并发密集访问testB

· 

运行后发现testA挂了

· 

o 链路

多个请求调用了同一个微服务

· 流控效果

o 直接->快速失败(默认的流控处理)

公式：阈值除以coldFactor(默认值为3),经过预热时长后才会达到阈值

o 预热 Warm UpWarm Up ( RuleConstant.CONTPOL, BEHAVIOR JHARPLUP)方式，即预热/冷启动方式。当系统长期处于低水位的情况下，当流量突然增加时，直接把系统拉升到高水位可能瞬间把系统压垮。通过“冷启动，让通过的流量缓慢增加，在一定时间内逐渐增加到调值上限，给冷系统-个预热的时间。 避免冷系统被压垮，详细文档可以参考流量控制. Warm Up文档,具体的例子可以参见WhrmUplowDemo. 

说明

· 默认coldFactor为3，即请求QPS从threshold / 3开始,经预热时长逐渐升至设定的QPS阈值。

· 限流冷启动

配置 默认coldFactor为3,即请求QPS从(threshold/ 3)开始，经多少预热时长才逐渐升至设定的QPS问值。 

· 案例：阀值为10+预热时长设置5秒.系统初始化的阀值为10/ 3约等于3，即阀值刚开始为3;然后过了5秒后阀值才慢慢升高恢复到10 

o 排队等待 匀速排队匀速排队( RuleConstant CONTRPOL BEHAVIOR RATE LITER )方式会严格控制请求通过的间隔时间，也即是让请求以均匀的速度通过，对应的是漏桶算法。详细文档可以参考流星控制-匀速器模式，具体的例子可以参见PaceFlowDemo, 

说明

· 

配置

· controller，testB打印线程

· 

测试

· 

· 每秒仅通过一次

降级规则

· 基本介绍 RT (平均响应时间，秒级)平均响应时间超出阈值且在时间窗口内通过的请求>=5, 两个条件同时满足后触发降级窗口期过后关闭断路器RT最大4900 (更大的需要通过Dscsp.sentinelstatisticmaxt-=000X才能生效)异常比列(秒级)QPS == 5且异常比例(秒级统计)超过阅值时，触发降级;时间官口结束后，关闭降级异常数(分钟级)异常数(分钟统计)超过间值时，触发降级;时间官口结束后，关闭降级 

o 进一步说明 Sentinel熔断降级会在调用链路中某个资源出现不稳定状态时(例如调用超时或异常比例升高) ,对这个资源的调用进行限制，让请求快速失败，避免影响到其它的资源而导致级联错误。当资源被降级后，在接下来的降级时间窗口之内，对该资源的调用都自动培断(默认行为是抛出DegradeException)。 

o Sentinel的断路器是没有半开状态的

半开的状态系统自动去检测是否请求有异常,没有异常就关闭断路器恢复使用，有异常则继续打开断路器不可用。具体可以参考Hystrix

Hystrix

· 

· 降级策略实战

o 慢调用比例RT 慢调用比例 (SLOW_REQUEST_RATIO)：选择以慢调用比例作为阈值，需要设置允许的慢调用 RT（即最大的响应时间），请求的响应时间大于该值则统计为慢调用。当单位统计时长（statIntervalMs）内请求数目大于设置的最小请求数目，并且慢调用的比例大于阈值，则接下来的熔断时长内请求会自动被熔断。经过熔断时长后熔断器会进入探测恢复状态（HALF-OPEN 状态），若接下来的一个请求响应时间小于设置的慢调用 RT 则结束熔断，若大于设置的慢调用 RT 则会再次被熔断。 

是什么

· 

测试

· 代码

o controller @GetMapping("/testD")   public String testD(){     try {       TimeUnit.SECONDS.sleep(1);     } catch (InterruptedException e) {       e.printStackTrace();     }     log.info("testD 测试RT");     return "testD -----";   } 

· 配置

o 

· jmeter压测

o 



· 效果

o 

o 异常比例 异常比例( DEGRADE GRADE EXCEPTION RATIO):当资源的每秒请求量>=5,并且每秒异常总数占通过量的比值超过阈值( DegradeRule中的count )之后，资源进入降级状态，即在接下的时间窗口( DegradeRule中的timeMindou, 以s为单位)之内,对这个方法的调用都会自动地返回。异常比率的阈值范围是[0.0, 1.0]. 代表0%- 100%。 

是什么

· 

测试

· 代码
```
o controller @GetMapping("/testException")   public String testException(){     log.info("testException 异常比例");     int age = 10 /0 ;     return "testException -----";   } 
```
· 配置

o 

· Jmeter压测(同时满足两个条件）

o http://localhost:8401/testException

· 效果

o 

o 异常数

是什么 异常数(DEGRADE GRADE EXCEPTION CounT):当资源近1分钟的异常数目超过调值之后会进行熔断。注意由于统计时间窗口是分钟级别的,若tinenindt小于60s,则结束熔断状态后仍可能再进入熔断状态。时间窗口-定要大于等于60秒。 

· 

异常数是按照分钟统计的

测试

· 代码
```
o controller @GetMapping("/testExceptionCount")   public String testExceptionCount(){     log.info("testExceptionCount 异常数");     int age = 10 /0 ;     return "testExceptionCount -----";   } 
```
· 配置

o 

· 压测

o 访问3次以上http://localhost:8401/testExceptionCount

· 效果

o 

热点key限流

· 基本介绍

o 是什么



· 官网

o https://github.com/alibaba/Sentinel/wiki/%E7%83%AD%E7%82%B9%E5%8F%82%E6%95%B0%E9%99%90%E6%B5%81

· 承上启下复习start 兜底方法分为系统默认和客户自定义。两种之前的案例,限流出问题后，都是用sentinel系统默认的提示: Blocked by Sentinel (flow limiting)我们能不能自定?类似hystrix,某个方法出问题了,就找对应的兜底降级方法?结论从@HystrixCommand到@SeninelResource 

o @SeninelResource

· 配置

o controller `@GetMapping("/testHotKey")   @SentinelResource(value = "testHotKey", blockHandler = "dealTestHotKey")   //value唯一即可，dealTestHotKey()兜底方法   public String testHotKey(@RequestParam(value = "p1", required = false) String p1,               @RequestParam(value = "p2", required = false) String p2){//     int age = 10 /0;     return "testHotKey -----";   }   public String dealTestHotKey(String p1, String p2, BlockException blockException){     return "dealTestHotKey---------";   }` 
```
@SentinelResource(value = "testHotKey", blockHandler = "dealTestHotKey")
```
绑定资源名为testHotKey，兜底方法为dealTestHotKey

o 

第0个参数（方法的参数列表）点击率超过每秒1次，则对此资源限流

· 测试

o 正常访问http://localhost:8401/testHotKey?p1=a



o 过快访问（每秒超过1次）访问http://localhost:8401/testHotKey?p1=a



· 参数例外项

o 上述案例演示了第一个参数p1,当QPS超过1秒1次点击后马上被限流

o 特例情况

普通

· 超过1秒钟一个后，达到阈值1后马上被限流

我们期望p1参数当它是某个特殊值时，它的限流值和平时不一-样

特例

· 假如当p1的值等于5时，它的阈值可以达到200

o 配置



· 当第0个参数的值为5时，阈值调整到每秒3次

o 测试

正常访问http://localhost:8401/testHotKey?p1=5

· 

过快访问（每秒超过3次）访问http://localhost:8401/testHotKey?p1=5

· 

o 前提条件

热点参数的注意点，参数必须是基本类型或者String（可选）

· 其它

o 运行异常并不会（如10/0），降级（熔断）；处理方法看后面

系统规则（系统自适应限流）

· 是什么

o https://github.com/alibaba/Sentinel/wiki/%E7%B3%BB%E7%BB%9F%E8%87%AA%E9%80%82%E5%BA%94%E9%99%90%E6%B5%81

· 各项配置参数说明 系统规则支持以下的模式：Load 自适应（仅对 Linux/Unix-like 机器生效）：系统的 load1 作为启发指标，进行自适应系统保护。当系统 load1 超过设定的启发值，且系统当前的并发线程数超过估算的系统容量时才会触发系统保护（BBR 阶段）。系统容量由系统的 maxQps * minRt 估算得出。设定参考值一般是 CPU cores * 2.5。CPU usage（1.5.0+ 版本）：当系统 CPU 使用率超过阈值即触发系统保护（取值范围 0.0-1.0），比较灵敏。平均 RT：当单台机器上所有入口流量的平均 RT 达到阈值即触发系统保护，单位是毫秒。并发线程数：当单台机器上所有入口流量的并发线程数达到阈值即触发系统保护。入口 QPS：当单台机器上所有入口流量的 QPS 达到阈值即触发系统保护。 

· 例：配置全局QPS

o 

对于整个系统，访问QPS大于每秒2次就熔断

o 此时过快访问（每秒超过2次）访问http://localhost:8401/tesA也会被限流



@SentinelResource

· 按资源名称限流+后续处理

o 启动Nacos成功

o 启动Sentinel成功

o 修改Modulecloudalibaba-sentinel-service8401

改POM

· 引入自定义的common工具包 `<dependency>       <groupId>com.bilibili.springcloud</groupId>       <artifactId>cloud-api-commons</artifactId>       <version>${project.version}</version>     </dependency>` 

写业务

· controller
```
o RateLimitController @GetMapping("/byResource")   @SentinelResource(value = "byResource", blockHandler = "handleException")   public CommonResult<> byResource(){     return new CommonResult(200, "按资源名称限流测试OK", new Payment(2020L, "serial001"));   }   public CommonResult handleException(BlockException blockException){     return new CommonResult().fail(444, blockException.getClass().getCanonicalName()+"\t服务不可用");   } 
```
o 配置流控规则

配置步骤

· 

图形配置和代码关系

表示1秒钟内查询次数大于1,就跑到我们自定义的处流，限流.

o 测试

http://localhost:8401/byResource

· 正常

o 

· 过快(每秒大于1次)

o 

o 额外问题

此时关闭问服务8401看看

Sentinel控制台，流控规则消失了

· sentinel时临时的

· 按照UrI地址限流+后续处理

o 通过访问的URL来限流，会返回Sentinel自 带默认的限流处理信息

o 业务类RateLimitController `@GetMapping("/rateLimit/byUrl")   @SentinelResource(value = "byUrl")  //无兜底方案   public CommonResult byUrl(){     return new CommonResult(200, "by url限流测试OK", new Payment(2020L, "serial002"));   }` 

o 访问一次，注册到sentinel

o Sentinel控制台配置



o 测试

http://localhost:8401/rateLimit/byUrl

· 正常

o 

· 过快

o 使用系统默认处理

· 上面兜底方案面临的问题

o 1系统默认的, 没有体现我们自己的业务要求。

o 2依照现有条件,我们自定义的处理方法又和业务代码耦合在一块, 不直观。

o 3每个业务方法都添加一个兜底的，那代码膨胀加剧。

o 4全局统-的处理方法没有体现。

· 客户自定义限流处理逻辑

o 创建CustomerBlockHandler类用于自定义限流处理逻辑

o 自定义限流处理类

CustomerBlockHandler `public class CustomerBlockHandler {   public static CommonResult handlerException(BlockException exception) {     return new CommonResult().fail(444, "客户自定义，global handlerException---1");   }   public static CommonResult handlerException2(BlockException exception) {     return new CommonResult().fail(444, "客户自定义，global handlerException---2");   }}` 

o RateLimitController `@GetMapping("/rateLimit/customerBlockHandler")   @SentinelResource(value = "customerBlockHandler",       blockHandlerClass = CustomerBlockHandler.class,       blockHandler = "handlerException2") //注意次此处注解;定义兜底处理类和方法   public CommonResult customerBlockHandler(){     return new CommonResult(200, "客户自定义 限流测试OK", new Payment(2020L, "serial003"));   }` 

o 启动微服务后先调用一次，注册进sentinel

http://localhost:8401/rateLimit/customerBlockHandler

o Sentinel控制台配置



o 测试后我们自定义的限流处理出来了

正常

· 

过快

· 使用自定义方法处理

o 进一步说明



· 更多注解属性说明

o 上述配置，也可以通过代码的方式进行配置，但部推荐

o Sentinel主要有三个核心Api

SphU定义资源

Tracer定义统计

ContextUtil定义了上下文

服务熔断功能

· sentinel整合ribbon + openFeign + fallback

· Ribbon系列

o 启动nacos和sentinel

o 提供者9003/9004

新建项目cloudalibaba-provider-payment9003

§改POM`<dependencies> <dependency> <groupId>com.alibaba.cloud</groupId> <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId> </dependency> <dependency> <groupId>com.atguigu.springcloud</groupId> <artifactId>cloud-api-common</artifactId> <version>${project.version}</version> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-web</artifactId> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-actuator</artifactId> </dependency> <dependency> <groupId>org.projectlombok</groupId> <artifactId>lombok</artifactId> <optional>true</optional> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-test</artifactId> <scope>test</scope> </dependency> </dependencies>` 

写YML `server:  port: 9003spring:  application:   name: nacos-payment-provider  cloud:   nacos:    discovery:     server-addr: localhost:8848management:  endpoints:   web:    exposure:     include: "*"` 

主启动 `@SpringBootApplication@EnableDiscoveryClientpublic class PaymentMain9003 {   public static void main(String[] args) {     SpringApplication.run(PaymentMain9003.class, args);   }}` 

写业务

· controller，模拟了一个数据库 `@RestControllerpublic class PaymentController {   @Value("${server.port}")   private String serverPort;   public static Map<Long , Payment> hashMap = new HashMap<>();   static {     hashMap.put(1L,new Payment(1L, IdUtil.simpleUUID()));     hashMap.put(2L,new Payment(2L, IdUtil.simpleUUID()));     hashMap.put(3L,new Payment(3L, IdUtil.simpleUUID()));   }   @GetMapping("/paymentSQL/{id}")   public CommonResult<Payment> paymentSQL(@PathVariable("id") Long id){     Payment payment = hashMap.get(id);     return new CommonResult<>(200, "from mysql,serverPort:" + serverPort, payment);   }}` 

虚拟配置并启动9004

· 9004 CopyOf 9003

测试

· http://localhost:9003/paymentSQL/1

o 

· http://localhost:9004/paymentSQL/1

o 分支主题

o 消费者84

新建项目cloudalibaba-consumer-nacos-order84

§改POM`<dependencies> <dependency> <groupId>com.alibaba.cloud</groupId> <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId> </dependency> <!-- sentinel-datasource-nacos 后续持久化用 --> <dependency> <groupId>com.alibaba.csp</groupId> <artifactId>sentinel-datasource-nacos</artifactId> </dependency> <dependency> <groupId>com.alibaba.cloud</groupId> <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId> </dependency> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-starter-openfeign</artifactId> </dependency> <dependency> <groupId>com.atguigu.springcloud</groupId> <artifactId>cloud-api-common</artifactId> <version>${project.version}</version> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-web</artifactId> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-actuator</artifactId> </dependency> <dependency> <groupId>org.projectlombok</groupId> <artifactId>lombok</artifactId> <optional>true</optional> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-test</artifactId> <scope>test</scope> </dependency> </dependencies>` 

写YML `server:  port: 84spring:  application:   name: nacos-order-consumer  cloud:   nacos:    discovery:     server-addr: localhost:8848   sentinel:    transport:     dashboard: localhost:8080     port: 8719service-url:  nacos-user-service: http://nacos-payment-provider#激活sentinel对feign的支持feign:  sentinel:   enabled: true` 

主启动 `@SpringBootApplication@EnableDiscoveryClient@EnableFeignClientspublic class OrderNacosMain84 {   public static void main(String[] args) {     SpringApplication.run(OrderNacosMain84.class, args);   }}` 

写业务、测试

· config `@Configurationpublic class ApplicationContextConfig {   @Bean   @LoadBalanced   public RestTemplate getRestTemplate(){     return new RestTemplate();   }} `

· controller `@RestController@Slf4jpublic class CircleBreakerController {   private static final String SERVICE_URL = "http://nacos-payment-provider";   @Resource   private RestTemplate restTemplate;   @RequestMapping("/consumer/fallback/{id}")   @SentinelResource(value = "fallback") //仅注册，没有配置//   @SentinelResource(value = "fallback",fallback = "handlerFallback") //配置了fallback的，fallback只负责业务异常//   @SentinelResource(value = "fallback",blockHandler = "blockHandler") // 配置了blockHandler，只负责sentinel控制台配置违规//   @SentinelResource(value = "fallback",fallback = "handlerFallback", blockHandler = "blockHandler",//       exceptionsToIgnore = {IllegalArgumentException.class}) // 配置了blockHandler和fallback   public CommonResult<Payment> fallback(@PathVariable("id") Long id){     CommonResult<Payment> commonResult = restTemplate.getForObject(SERVICE_URL + "/paymentSQL/" + id, CommonResult.class);     //数据库是由1、2、3     if(id == 4){   //4表示非法参数       throw new IllegalArgumentException("IllegalArgumentException,非法参数异常");     }else if(commonResult.getData() == null){   //5表示空指针异常       throw new NullPointerException("NullPointerException,该ID没有记录，空指针异常");     }     return commonResult;   }     // 本例是fallback   public CommonResult handlerFallback(Long id, Throwable e){     Payment payment = new Payment(id, null);     return new CommonResult(444, "兜底异常handler，exception内容"+e.getMessage(), payment);   }   public CommonResult blockHandler(Long id, BlockException exception){     Payment payment = new Payment(id, null);     return new CommonResult<>(445, "blockHandler-sentinel 限流，无此流水号：blockException" + exception.getMessage(), payment);   }}` 

o 目的

fallback管运行异常

blockHandler管配置违规

o 测试地址：模拟数据库中仅有1、2、3，4表示非法参数，5表示空指针异常

http://localhost:84/consumer/fallback/1

能够轮询访问服务

o 使用@SentinelResource(value = "fallback") //仅注册，没有配置

http://localhost:84/consumer/fallback/4

http://localhost:84/consumer/fallback/5

o 使用@SentinelResource(value = "fallback",fallback = "handlerFallback") //配置了fallback的，fallback只负责业务异常

http://localhost:84/consumer/fallback/4服务降级（兜底）

http://localhost:84/consumer/fallback/5

o 使用@SentinelResource(value = "fallback",blockHandler = "blockHandler") // 配置了blockHandler，只负责sentinel控制台配置违规



没有兜底方案，但仍有sentinel的限流

http://localhost:84/consumer/fallback/4http://localhost:84/consumer/fallback/5

正常访问

过快访问

o 使用@SentinelResource(value = "fallback",fallback = "handlerFallback", blockHandler = "blockHandler")// 配置了blockHandler和fallback

限流配置

java走fallback的降级sentinel违规走限流方案限流>降级

若blockHandler和fallback都进行了配置,则被限流降级而抛出BlockException时只会进入blockHandler处理逻辑。

http://localhost:84/consumer/fallback/4

正常

过快

o 忽略属性

忽略特定异常



exceptionsToIgnore = {IllegalArgumentException.class}

效果

http://localhost:84/consumer/fallback/4此时不再走降级方法

· Feign系列

o 修改84

84消费者调用提供者9003

Feign组件一般是消费侧

o 改POM `<dependency>       <groupId>org.springframework.cloud</groupId>       <artifactId>spring-cloud-starter-openfeign</artifactId>     </dependency>` 

o 写YML #激活sentinel对feign的支持feign:  sentinel:   enabled: true 

o 主启动@EnableFeignClients

o 写业务

service

· PaymentService `@FeignClient(value = "nacos-payment-provider", fallback = PaymentFallbackService.class)public interface PaymentService {   @GetMapping("/paymentSQL/{id}")   CommonResult<Payment> paymentSQL(@PathVariable("id") Long id);}` 

· PaymentFallbackService `@Componentpublic class PaymentFallbackService implements PaymentService {   @Override   public CommonResult<Payment> paymentSQL(Long id) {     return new CommonResult<>(444, "fallback");   }}` 

`controller // --------------- open feign---------   @Resource   private PaymentService paymentService;   @GetMapping("/consumer/paymentSQL/{id}")   public CommonResult<Payment> paymentSQL(@PathVariable("id") Long id){     return paymentService.paymentSQL(id);   }` 

o 测试

http://localhost:84/consumer/paymentSQL/1

测试84调用此时故意关闭9003和9004微服务提供者84消费侧自动降级，不会被耗死

· 未关闭

· 关闭后

· 熔断框架比较

o 

规则持久化

· 是什么

o 一旦我们重启应用，sentinel规则将消失，生产环境需要将配置规则进行持久化

· 怎么玩

o 将限流配置规则持久化进Nacos保存，只要刷新8401某个rest地址，sentine|控制台的流控规则就能看i到，只要Nacos里而的配置不删除，针对8401,上sentinel.上的流控规则持续有效

· 步骤 添加Nacos业务规则配置-日内容解析启动8401后刷新sentinel发现业务规则有了快速访问测试接口C3)停止8401再看sentinel重新启动8401再看sentinel4) 

o 修改cloudalibaba-sentinel-service8401

o 改POM `<dependency>       <groupId>com.alibaba.csp</groupId>       <artifactId>sentinel-datasource-nacos</artifactId>     </dependency>` 

o 写YML `spring:  cloud:   sentinel:    transport:    datasource:     dsl:      nacos:       server-addr: localhost:8848       data-id: ${spring.application.name}       group-id: DEFAULT_GROUP       data-type: json       rule-type: flow` 

添加Nacos数据源配置

o 添加Nacos业务规则配置

内容解析 [   {     "resource": "/rateLimit/byUrl",     "limitApp" : "default",     "grade": 1,     "count" : 1,     "strategy": 0,     "controlBehavior" : 0,     "clusterMode": false   }]解释：resource： 资源名称limitApp： 来源应用grade： 阈值类型，0表示线程数，1表示 QPScount: 单机阈值strategy: 流控模式， 0 - 表示直接，1表示关联，2表示链路controlBehavior： 流控效果，0表示快速失败，1表示Warm up , 2表示排队clusterMode： 是否集群。 

o 启动8401后刷新sentine|发现业务规则有了

o 快速访问测试接口

正常运行

o 停止8401再看sentinel

已经没有服务的配置过的规则了

o 重新启动8401再看sentinel

多次调用接口，激活服务

重新配置出现了，持久化验证通过

## SpringCloud AlibabaSeata处理分布式事务

分布式事务问题

· 分布式前

o 单机单库没这个问题

o 从1:1->1:N->N:N的转变

· 分布式之后 单体应用被拆分成微服务应用，原来的三个模块被拆分成三个独立的应用，分别使用三个独立的数据源，业务操作需要调用三个服务来完成。此时每个服务内部的数据一致性由本地事务来保证， 但是全局的数据一致性问题没法保证。如：下单、减库存、扣账户、增订单操作 

· 一句话

o 一次业务操作需要跨多个数据源或需要跨多个系统进行远程调用，就会产生分布式事务

Seata简介

· 是什么

o Seata是一款开源的分布式事务解决方案，致力于在微服务架构下提供高性能和简单易用的分布式事务服务。

o 官网地址

http://seata.io

· 能干嘛

o 一个典型的分布式事务过程

分布式事务处理过程的一ID+三组件模型

· Transaction ID XID

o 全局唯一的事务ID

· 3组件概念

o Transaction Coordinator (TC)

事务协调器，维护全局事务的运行状态，负责协调并驱动全局事务的提交或回滚;

o Transaction Manager (TM)

控制全局事务的边界， 负责开启-个全局事务，并最终发起全局提交或全局回滚的决议;

o Resource Manager (RM)

控制分支事务，负责分支注册、状态汇报，并接收事务协调器的指令，驱动分支(本地)事务的提交和回滚

处理过程口

· 1. TM向TC申请开启一个全局事务，全局事务创建成功并生成一个全局唯一的XID;

· 2. XID 在微服务调用链路的.上下文中传播:

· 3. RM向TC注册分支事务，将其纳入XID对应全局事务的管辖:

· 4. TM向TC发超针对XID的全局提交或回浓决议:

· 5. TC 调度XID下管辖的全部分支事务完成提交或回滚请求。

· 去哪下

o https://github.com/seata/seata/releases

· 怎么玩

o 本地@Transactional

o 全局@GlobalTransactional

SEATA的分布式交易解决方案

· 

Seata-Server安装

· 下载

o https://github.com/seata/seata/releases

· seata-server.zip解压到指定目录并修改conf目录下的file.conf配置文件

o 先备份原始file.conf文件

o 主要修改:自定义事务组名称+事务日志存储模式为db +数据库连接信息

· file.conf

o 分支主题

o store模块

· mysq|5.7数据库新建库seata

o 建表db_ store.sql见http://seata.io/zh-cn/docs/user/quickstart.html

· 在seata库里建表

· 修改seata-server\seata\conf自录下的registry.conf配置文件

o 配置注册至nacos registry {  # file 、nacos 、eureka、redis、zk、consul、etcd3、sofa  type = "nacos"  loadBalance = "RandomLoadBalance"  loadBalanceVirtualNodes = 10  nacos {   application = "seata-server"   serverAddr = "127.0.0.1:8848"   group = "SEATA_GROUP"   namespace = ""   cluster = "default"   username = ""   password = ""  }} 

· 先启动Nacos

· 再启动seata-server

o seata-server\seata\bin

seata-server.bat

o 

订单/库存/账户业务数据库准备

· 以下演示都需要先启动Nacos后启动Seata，保证两个都OK

o Seata没启动报错no available server to connect

· 分布式事务业务说明

o 业务说明 这里我们会创建三个服务，-个订单服务, -个库存服务, -个账户服务。当用户下单时，会在订单服务中创建一个订单， 然后通过远程调用库存服务来扣减下单商品的库存，再通过远程调用账户服务来扣减用户账户里面的余额，I最后在订单服务中修改订单状态为已完成。该操作跨越三个数据库,有两次远程调用,很明显会有分布式事务问题。 

o 下订单--->扣库存--->减账户(余额)

· 创建业务数据库

o seata_ order: 存储订单的数据库;

o seata_ storage: 存储库存的数据库;

o seata_ account:存储账户信息的数据库。

o 建库SQL create database seata_order;create database seata_storage;create database seata_account; 

· 按照上述3库分别建对应业务表
```
o seata_ order库下建t_ order表 use seata_order;create table t_order (`id` bigint(20) not null auto_increment primary key,`user_id` bigint(20) default null comment '用户ID',`product_id` bigint(20) default null comment '产品ID',`count` int(11) default null comment '数量',`money` decimal(18,2) default null comment '金额',`status` int(1) default null comment '订单状态：0-创建中，1-已完结') engine=INNODB auto_increment = 1 default charset = 'utf8';select * from t_order; 

o seata_ storage库下建t_ storage 表 use seata_storage;create table t_storage (`id` bigint(20) not null auto_increment primary key,`product_id` bigint(20) default null comment '产品ID',`total` int(11) default null comment '总库存',`used` int(11) default null comment '使用库存',`residue` int(11) default null comment '剩余库存') engine=INNODB auto_increment = 1 default charset = 'utf8';insert into t_storage(`id`, `product_id`, `total`, `used`, `residue`) values('1', '1', '100' , '0', '100');select * from t_storage; 

o seata_ account库下建t account表 use seata_account;create table t_account (`id` bigint(20) not null auto_increment primary key,`user_id` bigint(20) default null comment '用户ID',`total` decimal(18,2) default null comment '总额度',`used` decimal(18,2) default null comment '使用额度',`residue` decimal(18,2) default '0' null comment '剩余额度') engine=INNODB auto_increment = 1 default charset = 'utf8';insert into t_account(`id`, `user_id`, `total`, `used`, `residue`) values('1', '1', '10000' , '0', '10000');select * from t_account; 
```
· 按照上述3库分别建对应的回滚日志表

o 订单-库存-账户3个库下都需要建各自的回滚日志表

o \seata-server\seata\conf目录下的db. undo_ log.sql
```
o 建表SQL -- for AT mode you must to init this sql for you business database. the seata server not need it.CREATE TABLE IF NOT EXISTS `undo_log`(   `id`       BIGINT(20)  NOT NULL AUTO_INCREMENT COMMENT 'increment id',   `branch_id`   BIGINT(20)  NOT NULL COMMENT 'branch transaction id',   `xid`      VARCHAR(100) NOT NULL COMMENT 'global transaction id',   `context`    VARCHAR(128) NOT NULL COMMENT 'undo_log context,such as serialization',   `rollback_info` LONGBLOB   NOT NULL COMMENT 'rollback info',   `log_status`   INT(11)    NOT NULL COMMENT '0:normal status,1:defense status',   `log_created`  DATETIME   NOT NULL COMMENT 'create datetime',   `log_modified`  DATETIME   NOT NULL COMMENT 'modify datetime',   PRIMARY KEY (`id`),   UNIQUE KEY `ux_undo_log` (`xid`, `branch_id`)) ENGINE = InnoDB  AUTO_INCREMENT = 1  DEFAULT CHARSET = utf8 COMMENT ='AT transaction mode undo table'; 
```
· 最终效果

o 

订单/库存/账户业务微服务准备

· 业务需求

o 下订单-减库存->扣余额->改(订单)状态

· 新建订单Order-Module

o 新建项目seata-order-service2001

o改POM`<dependencies> <!-- nacos --> <dependency> <groupId>com.alibaba.cloud</groupId> <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId> </dependency> <!-- nacos --> <!-- seata--> <dependency> <groupId>io.seata</groupId> <artifactId>seata-spring-boot-starter</artifactId> <version>1.4.0</version> </dependency> <dependency> <groupId>com.alibaba.cloud</groupId> <artifactId>spring-cloud-starter-alibaba-seata</artifactId> <version>2.2.1.RELEASE</version> <exclusions> <exclusion> <groupId>io.seata</groupId> <artifactId>seata-spring-boot-starter</artifactId> </exclusion> </exclusions> </dependency> <!-- seata--> <!--feign--> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-starter-openfeign</artifactId> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-web</artifactId> </dependency> <dependency> <groupId>org.mybatis.spring.boot</groupId> <artifactId>mybatis-spring-boot-starter</artifactId> </dependency> <dependency> <groupId>com.alibaba</groupId> <artifactId>druid-spring-boot-starter</artifactId> </dependency> <dependency> <groupId>mysql</groupId> <artifactId>mysql-connector-java</artifactId> </dependency> <!--jdbc--> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-jdbc</artifactId> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-actuator</artifactId> </dependency> <dependency> <groupId>org.projectlombok</groupId> <artifactId>lombok</artifactId> <optional>true</optional> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-test</artifactId> <scope>test</scope> </dependency> </dependencies>` 

o 写YML

0.9.0

· application.yml `server:  port: 2001spring:  application:   name: seata-order-service  cloud:   alibaba:    seata:     # 自定义事务组名称需要与seata-server中的对应     tx-service-group: fsp_tx_group   nacos:    discovery:     server-addr: 127.0.0.1:8848  datasource:   # 当前数据源操作类型   type: com.alibaba.druid.pool.DruidDataSource   # mysql驱动类   driver-class-name: com.mysql.cj.jdbc.Driver   url: jdbc:mysql://localhost:3306/seata_order?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=GMT%2B8   username: root   password: rootfeign:  hystrix:   enabled: falselogging:  level:   io:    seata: infomybatis:  mapper-locations: classpath*:mapper/*.xml` 

· file.conf `transport {  # tcp udt unix-domain-socket  type = "TCP"  #NIO NATIVE  server = "NIO"  #enable heartbeat  heartbeat = true  #thread factory for netty  thread-factory {   boss-thread-prefix = "NettyBoss"   worker-thread-prefix = "NettyServerNIOWorker"   server-executor-thread-prefix = "NettyServerBizHandler"   share-boss-worker = false   client-selector-thread-prefix = "NettyClientSelector"   client-selector-thread-size = 1   client-worker-thread-prefix = "NettyClientWorkerThread"   # netty boss thread size,will not be used for UDT   boss-thread-size = 1   #auto default pin or 8   worker-thread-size = 8  }  shutdown {   # when destroy server, wait seconds   wait = 3  }  serialization = "seata"  compressor = "none"}service {  #vgroup->rgroup  # 事务组名称  vgroup_mapping.fsp_tx_group = "default"  #only support single node  default.grouplist = "127.0.0.1:8091"  #degrade current not support  enableDegrade = false  #disable  disable = false  #unit ms,s,m,h,d represents milliseconds, seconds, minutes, hours, days, default permanent  max.commit.retry.timeout = "-1"  max.rollback.retry.timeout = "-1"}client {  async.commit.buffer.limit = 10000  lock {   retry.internal = 10   retry.times = 30  }  report.retry.count = 5  tm.commit.retry.count = 1  tm.rollback.retry.count = 1}## transaction log storestore {  ## store mode: file、db  #mode = "file"  mode = "db"  ## file store  file {   dir = "sessionStore"   # branch session size , if exceeded first try compress lockkey, still exceeded throws exceptions   max-branch-session-size = 16384   # globe session size , if exceeded throws exceptions   max-global-session-size = 512   # file buffer size , if exceeded allocate new buffer   file-write-buffer-cache-size = 16384   # when recover batch read size   session.reload.read_size = 100   # async, sync   flush-disk-mode = async  }  ## database store  db {   ## the implement of javax.sql.DataSource, such as DruidDataSource(druid)/BasicDataSource(dbcp) etc.   datasource = "dbcp"   ## mysql/oracle/h2/oceanbase etc.   db-type = "mysql"   driver-class-name = "com.mysql.jdbc.Driver"   url = "jdbc:mysql://localhost.132:3306/seata"   user = "root"   password = "root"   min-conn = 1   max-conn = 3   global.table = "global_table"   branch.table = "branch_table"   lock-table = "lock_table"   query-limit = 100  }}lock {  ## the lock store mode: local、remote  mode = "remote"  local {   ## store locks in user's database  }  remote {   ## store locks in the seata's server  }}recovery {  #schedule committing retry period in milliseconds  committing-retry-period = 1000  #schedule asyn committing retry period in milliseconds  asyn-committing-retry-period = 1000  #schedule rollbacking retry period in milliseconds  rollbacking-retry-period = 1000  #schedule timeout retry period in milliseconds  timeout-retry-period = 1000}transaction {  undo.data.validation = true  undo.log.serialization = "jackson"  undo.log.save.days = 7  #schedule delete expired undo_log in milliseconds  undo.log.delete.period = 86400000  undo.log.table = "undo_log"}## metrics settingsmetrics {  enabled = false  registry-type = "compact"  # multi exporters use comma divided  exporter-list = "prometheus"  exporter-prometheus-port = 9898}support {  ## spring  spring {   # auto proxy the DataSource bean   datasource.autoproxy = false  }}` 

· registry.conf `registry {  # file 、nacos 、eureka、redis、zk、consul、etcd3、sofa  type = "nacos"  nacos {   #serverAddr = "localhost"   serverAddr = "localhost:8848"   namespace = ""   cluster = "default"  }  eureka {   serviceUrl = "http://localhost:8761/eureka"   application = "default"   weight = "1"  }  redis {   serverAddr = "localhost:6379"   db = "0"  }  zk {   cluster = "default"   serverAddr = "127.0.0.1:2181"   session.timeout = 6000   connect.timeout = 2000  }  consul {   cluster = "default"   serverAddr = "127.0.0.1:8500"  }  etcd3 {   cluster = "default"   serverAddr = "http://localhost:2379"  }  sofa {   serverAddr = "127.0.0.1:9603"   application = "default"   region = "DEFAULT_ZONE"   datacenter = "DefaultDataCenter"   cluster = "default"   group = "SEATA_GROUP"   addressWaitTime = "3000"  }  file {   name = "file.conf"  }}config {  # file、nacos 、apollo、zk、consul、etcd3  type = "file"  nacos {   serverAddr = "localhost"   namespace = ""  }  consul {   serverAddr = "127.0.0.1:8500"  }  apollo {   app.id = "seata-server"   apollo.meta = "http://192.168.1.204:8801"  }  zk {   serverAddr = "127.0.0.1:2181"   session.timeout = 6000   connect.timeout = 2000  }  etcd3 {   serverAddr = "http://localhost:2379"  }  file {   name = "file.conf"  }}` 

1.4.0

· application.yml `server:  port: 3001spring:  application:   name: seata-order-service  cloud:   nacos:    discovery:     server-addr: localhost:8848   alibaba:    seata:     tx-service-group: seata-order-service-group  datasource:   # 当前数据源操作类型   type: com.alibaba.druid.pool.DruidDataSource   # mysql驱动类   driver-class-name: com.mysql.cj.jdbc.Driver   url: jdbc:mysql://localhost:3306/seata_order?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=GMT%2B8   username: root   password: rootfeign:  hystrix:   enabled: falselogging:  level:   io:    seata: infomybatis:  mapper-locations: classpath*:mapper/*.xml# Seata 配置项，对应 SeataProperties 类seata:  application-id: ${spring.application.name} # Seata 应用编号，默认为 ${spring.application.name}  tx-service-group: my_tx_group # Seata 事务组编号，用于 TC 集群名;同一事务同一分组#  enable-auto-data-source-proxy: true  # Seata 服务配置项，对应 ServiceProperties 类  service:   # 虚拟组和分组的映射   vgroup-mapping:    my_tx_group: default  # 此处key需要与tx-service-group的value一致，否则会报 no available service 'null' found, please make sure registry config correct 异常  config:   type: nacos   nacos:    namespace:  ""    serverAddr: localhost:8848    group: SEATA_GROUP    userName: "nacos"    password: "nacos"  # Seata 注册中心配置项，对应 RegistryProperties 类  registry:   type: nacos # 注册中心类型，默认为 file   nacos:    application: seata-server#    cluster: default # 使用的 Seata 分组#    namespace: ""# Nacos 命名空间    group: SEATA_GROUP    serverAddr: localhost # Nacos 服务地址    userName: "nacos"    password: "nacos"` 

o 主启动 `@EnableDiscoveryClient@EnableFeignClients@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)public class SeataOrderMain2001 {   public static void main(String[] args) {     SpringApplication.run(SeataOrderMain2001.class, args);   }}` 

o 写业务

domain
```
· CommonResult `/** * 统一返回结果体 **/@Data@AllArgsConstructor@NoArgsConstructorpublic class CommonResult<T> {   private Integer code;   private String message;   private T data;   public CommonResult(Integer code, String message) {     this(code, message, null);   }}` 
```
```
· Order /** * 订单实体类 **/@Data@AllArgsConstructor@NoArgsConstructorpublic class Order {   private Long id;   private Long userId;   private Long productId;   private Integer count;   private BigDecimal money;   /**   * 订单状态 0:创建中,1:已完结   */   private Integer status;} 
```
dao
```
· OrderDao @Mapperpublic interface OrderDao {   /**   * 1 新建订单   * @param order   * @return   */   int create(Order order);   /**   * 2 修改订单状态,从0改为1   * @param userId   * @param status   * @return   */   int update(@Param("userId") Long userId, @Param("status") Integer status);} 
```
· resources文件夹下新建mapper文件夹后添加

oOrderMapper.xml`<?xml version="1.0" encoding="UTF-8" ?><!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd"><mapper namespace="com.bilibili.springcloud.dao.OrderDao"> <resultMap id="BaseResultMap" type="com.bilibili.springcloud.domain.Order"> <id column="id" property="id" jdbcType="BIGINT"></id> <result column="user_id" property="userId" jdbcType="BIGINT"></result> <result column="product_id" property="productId" jdbcType="BIGINT"></result> <result column="count" property="count" jdbcType="INTEGER"></result> <result column="money" property="money" jdbcType="DECIMAL"></result> <result column="status" property="status" jdbcType="INTEGER"></result> </resultMap> <insert id="create" parameterType="com.bilibili.springcloud.domain.Order" useGeneratedKeys="true" keyProperty="id"> insert into t_order(user_id,product_id,count,money,status) values (#{userId},#{productId},#{count},#{money},0); </insert> <update id="update"> update t_order set status =1 where user_id =#{userId} and status=#{status}; </update></mapper>` 

service

· OrderService `public interface OrderService {   /**   * 创建订单   * @param order   */   void create(Order order);} `

· impl
```
o OrderServiceImpl /** * 账户 **/@Service@Slf4jpublic class OrderServiceImpl implements OrderService {   @Resource   private OrderDao orderDao;   @Resource   private AccountService accountService;   @Resource   private StorageService storageService;   /**   * 创建订单->调用库存服务扣减库存->调用账户服务扣减账户余额->修改订单状态   * 简单说:   * 下订单->减库存->减余额->改状态   * GlobalTransactional seata开启分布式事务,异常时回滚,name保证唯一即可   *   * @param order 订单对象   */   @Override   ///@GlobalTransactional(name = "fsp-create-order", rollbackFor = Exception.class)   public void create(Order order) {     // 1 新建订单     log.info("----->开始新建订单");     orderDao.create(order);     // 2 扣减库存     log.info("----->订单微服务开始调用库存,做扣减Count");     storageService.decrease(order.getProductId(), order.getCount());     log.info("----->订单微服务开始调用库存,做扣减End");     // 3 扣减账户     log.info("----->订单微服务开始调用账户,做扣减Money");     accountService.decrease(order.getUserId(), order.getMoney());     log.info("----->订单微服务开始调用账户,做扣减End");     // 4 修改订单状态,从0到1,1代表已完成     log.info("----->修改订单状态开始");     orderDao.update(order.getUserId(), 0);     log.info("----->下订单结束了,O(∩_∩)O哈哈~");   }} 
```
· StorageService `/** * 库存服务 **/@FeignClient(value = "seata-storage-service")public interface StorageService {   /**   * 减库存   *   * @param productId   * @param count   * @return   */   @PostMapping(value = "/storage/decrease")   CommonResult decrease(@RequestParam("productId") Long productId, @RequestParam("count") Integer count);}` 

· AccountService `@FeignClient(value = "seata-account-service")public interface AccountService {   /**   * 减余额   *   * @param userId   * @param money   * @return   */   @PostMapping(value = "/account/decrease")   CommonResult decrease(@RequestParam("userId") Long userId, @RequestParam("money") BigDecimal money);}` 

· IdGeneratorSnowflake `@Slf4j@Componentpublic class IdGeneratorSnowflake {   private long workerId = 0;   private long datacenterId = 1;   private Snowflake snowflake = IdUtil.createSnowflake(workerId, datacenterId);   @PostConstruct   public void init() {     try {       workerId = NetUtil.ipv4ToLong(NetUtil.getLocalhostStr());       log.info("当前机器的workerId:{}", workerId);     } catch (Exception e) {       log.info("当前机器的workerId获取失败", e);       workerId = NetUtil.getLocalhostStr().hashCode();       log.info("当前机器 workId:{}", workerId);     }   }   public synchronized long snowflakeId() {     return snowflake.nextId();   }   public synchronized long snowflakeId(long workerId, long datacenterId) {     snowflake = IdUtil.createSnowflake(workerId, datacenterId);     return snowflake.nextId();   }   public static void main(String[] args) {     // 1236610764324864000     System.out.println(new IdGeneratorSnowflake().snowflakeId());   }}` 

controller `@RestControllerpublic class OrderController {   @Resource   private OrderService orderService;   @Resource   private IdGeneratorSnowflake idGeneratorSnowflake;   /**   * 创建订单   *   * @param order   * @return   */   @GetMapping("/order/create")   public CommonResult create(Order order) {     orderService.create(order);     return new CommonResult(200, "订单创建成功");   }   /**   * 生成id,通过雪花算法   *   * @return   */   @GetMapping("/snowflake")   public String getIDBySnowflake() {     ExecutorService threadPool = Executors.newFixedThreadPool(5);     for (int i = 0; i < 20; i++) {       threadPool.submit(() -> {         System.out.println(idGeneratorSnowflake.snowflakeId());       });     }     threadPool.shutdown();     return "hello snowflake";   }}` 

0.9.0->config

· 新建库存Storage -Module

o 新建项目seata-order-service2002

o改POM`<dependencies> <!-- nacos --> <dependency> <groupId>com.alibaba.cloud</groupId> <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId> </dependency> <!-- nacos --> <!-- seata--> <dependency> <groupId>io.seata</groupId> <artifactId>seata-spring-boot-starter</artifactId> <version>1.4.0</version> </dependency> <dependency> <groupId>com.alibaba.cloud</groupId> <artifactId>spring-cloud-starter-alibaba-seata</artifactId> <version>2.2.1.RELEASE</version> <exclusions> <exclusion> <groupId>io.seata</groupId> <artifactId>seata-spring-boot-starter</artifactId> </exclusion> </exclusions> </dependency> <!-- seata--> <!--feign--> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-starter-openfeign</artifactId> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-web</artifactId> </dependency> <dependency> <groupId>org.mybatis.spring.boot</groupId> <artifactId>mybatis-spring-boot-starter</artifactId> </dependency> <dependency> <groupId>com.alibaba</groupId> <artifactId>druid-spring-boot-starter</artifactId> </dependency> <dependency> <groupId>mysql</groupId> <artifactId>mysql-connector-java</artifactId> </dependency> <!--jdbc--> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-jdbc</artifactId> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-actuator</artifactId> </dependency> <dependency> <groupId>org.projectlombok</groupId> <artifactId>lombok</artifactId> <optional>true</optional> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-test</artifactId> <scope>test</scope> </dependency> </dependencies>` 

o 写YML `server:  port: 2002spring:  application:   name: seata-storage-service  cloud:    discovery:     server-addr: 127.0.0.1:8848  datasource:   # 当前数据源操作类型   type: com.alibaba.druid.pool.DruidDataSource   # mysql驱动类   driver-class-name: com.mysql.cj.jdbc.Driver   url: jdbc:mysql://localhost:3306/seata_storage?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=GMT%2B8   username: root   password: rootfeign:  hystrix:   enabled: falselogging:  level:   io:    seata: infomybatis:  mapper-locations: classpath*:mapper/*.xml  # Seata 配置项，对应 SeataProperties 类seata:  application-id: ${spring.application.name} # Seata 应用编号，默认为 ${spring.application.name}  tx-service-group: my_tx_group # Seata 事务组编号，用于 TC 集群名;同一事务同一分组  #  enable-auto-data-source-proxy: true  # Seata 服务配置项，对应 ServiceProperties 类  service:   # 虚拟组和分组的映射   vgroup-mapping:   my_tx_group: default  # 此处key需要与tx-service-group的value一致，否则会报 no available service 'null' found, please make sure registry config correct 异常  config:   type: nacos   nacos:    namespace:  ""    serverAddr: localhost:8848    group: SEATA_GROUP    userName: "nacos"    password: "nacos"  # Seata 注册中心配置项，对应 RegistryProperties 类  registry:   type: nacos # 注册中心类型，默认为 file   nacos:    application: seata-server    #    cluster: default # 使用的 Seata 分组    #    namespace: ""# Nacos 命名空间    group: SEATA_GROUP    serverAddr: localhost # Nacos 服务地址    userName: "nacos"    password: "nacos"` 

o 主启动 `@EnableDiscoveryClient@EnableFeignClients@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)public class StorageMain2002 {   public static void main(String[] args) {     SpringApplication.run(StorageMain2002.class, args);   }}` 

o 写业务

domain

· CommonResult `/** * 统一返回结果体 **/@Data@AllArgsConstructor@NoArgsConstructorpublic class CommonResult<T> {   private Integer code;   private String message;   private T data;   public CommonResult(Integer code, String message) {     this(code, message, null);   }}` 

· Storage `/** * 库存实体类 **/@Data@AllArgsConstructor@NoArgsConstructorpublic class Storage {   private Long id;   /**   * 产品id   */   private Long productId;   /**   * 总库存   */   private Integer total;   /**   * 已用库存   */   private Integer used;   /**   * 剩余库存   */   private Integer residue;}` 

controller `@RestControllerpublic class StorageController {   @Resource   private StorageService storageService;   /**   * 减库存   *   * @param productId   * @param count   * @return   */   @PostMapping(value = "/storage/decrease")   public CommonResult decrease(@RequestParam("productId") Long productId, @RequestParam("count") Integer count) {     storageService.decrease(productId, count);     return new CommonResult(200, "扣减库存成功");   }}` 

dao

· StorageDao `@Mapperpublic interface StorageDao {   /**   * 减库存   * @param productId   * @param count   * @return   */   int decrease(@Param("productId") Long productId, @Param("count") Integer count);}` 

· resources文件夹下新建mapper文件夹后添加

oStorageMapper.xml`<?xml version="1.0" encoding="UTF-8" ?><!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd"><mapper namespace="com.bilibili.springcloud.dao.StorageDao"> <resultMap id="BaseResultMap" type="com.bilibili.springcloud.domain.Storage"> <id column="id" property="id" jdbcType="BIGINT"></id> <result column="product_id" property="productId" jdbcType="BIGINT"></result> <result column="total" property="total" jdbcType="INTEGER"></result> <result column="used" property="used" jdbcType="INTEGER"></result> <result column="residue" property="residue" jdbcType="INTEGER"></result> </resultMap> <!--减库存--> <update id="decrease"> update t_storage set used =used + #{count},residue=residue-#{count} where product_id=#{productId}; </update></mapper>` 

service

· impl

o StorageServiceImpl `@Servicepublic class StorageServiceImpl implements StorageService {   @Resource   private StorageDao storageDao;   /**   * 减库存   *   * @param productId   * @param count   * @return   */   @Override   public void decrease(Long productId, Integer count) {     storageDao.decrease(productId, count);   }}` 

· StorageService `public interface StorageService {   /**   * 减库存   *   * @param productId   * @param count   * @return   */   void decrease(Long productId, Integer count);}` 

· 新建账户Account-Module

o 新建项目seata-order-service2003

o改POM`<dependencies> <!-- nacos --> <dependency> <groupId>com.alibaba.cloud</groupId> <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId> </dependency> <!-- nacos --> <!-- seata--> <dependency> <groupId>io.seata</groupId> <artifactId>seata-spring-boot-starter</artifactId> <version>1.4.0</version> </dependency> <dependency> <groupId>com.alibaba.cloud</groupId> <artifactId>spring-cloud-starter-alibaba-seata</artifactId> <version>2.2.1.RELEASE</version> <exclusions> <exclusion> <groupId>io.seata</groupId> <artifactId>seata-spring-boot-starter</artifactId> </exclusion> </exclusions> </dependency> <!-- seata--> <!--feign--> <dependency> <groupId>org.springframework.cloud</groupId> <artifactId>spring-cloud-starter-openfeign</artifactId> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-web</artifactId> </dependency> <dependency> <groupId>org.mybatis.spring.boot</groupId> <artifactId>mybatis-spring-boot-starter</artifactId> </dependency> <dependency> <groupId>com.alibaba</groupId> <artifactId>druid-spring-boot-starter</artifactId> </dependency> <dependency> <groupId>mysql</groupId> <artifactId>mysql-connector-java</artifactId> </dependency> <!--jdbc--> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-jdbc</artifactId> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-actuator</artifactId> </dependency> <dependency> <groupId>org.projectlombok</groupId> <artifactId>lombok</artifactId> <optional>true</optional> </dependency> <dependency> <groupId>org.springframework.boot</groupId> <artifactId>spring-boot-starter-test</artifactId> <scope>test</scope> </dependency> </dependencies>` 

o 写YML `server:  port: 2002spring:  application:   name: seata-storage-service  cloud:    discovery:     server-addr: 127.0.0.1:8848  datasource:   # 当前数据源操作类型   type: com.alibaba.druid.pool.DruidDataSource   # mysql驱动类   driver-class-name: com.mysql.cj.jdbc.Driver   url: jdbc:mysql://localhost:3306/seata_storage?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=GMT%2B8   username: root   password: rootfeign:  hystrix:   enabled: falselogging:  level:   io:    seata: infomybatis:  mapper-locations: classpath*:mapper/*.xml  # Seata 配置项，对应 SeataProperties 类seata:  application-id: ${spring.application.name} # Seata 应用编号，默认为 ${spring.application.name}  tx-service-group: my_tx_group # Seata 事务组编号，用于 TC 集群名;my_tx_group  #  enable-auto-data-source-proxy: true  # Seata 服务配置项，对应 ServiceProperties 类  service:   # 虚拟组和分组的映射   vgroup-mapping:    my_tx_group: default  # 此处key需要与tx-service-group的value一致，否则会报 no available service 'null' found, please make sure registry config correct 异常  config:   type: nacos   nacos:    namespace:  ""    serverAddr: localhost:8848    group: SEATA_GROUP    userName: "nacos"    password: "nacos"  # Seata 注册中心配置项，对应 RegistryProperties 类  registry:   type: nacos # 注册中心类型，默认为 file   nacos:    application: seata-server    #    cluster: default # 使用的 Seata 分组    #    namespace: ""# Nacos 命名空间    group: SEATA_GROUP    serverAddr: localhost # Nacos 服务地址    userName: "nacos"    password: "nacos"` 

o 主启动 `@EnableDiscoveryClient@EnableFeignClients@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)public class SeataAccountMain2003 {   public static void main(String[] args) {     SpringApplication.run(SeataAccountMain2003.class, args);   }}` 

o 写业务

domain

· CommonResult `/** * 统一返回结果体 **/@Data@AllArgsConstructor@NoArgsConstructorpublic class CommonResult<T> {   private Integer code;   private String message;   private T data;   public CommonResult(Integer code, String message) {     this(code, message, null);   }}` 

· Account `/** * 账户实体类 */@Data@AllArgsConstructor@NoArgsConstructorpublic class Account {   private Long id;   /**   * 用户id   */   private Long userId;   /**   * 总额度   */   private Integer total;   /**   * 已用额度   */   private Integer used;   /**   * 剩余额度   */   private Integer residue;}` 

controller `@RestControllerpublic class AccountController {   @Resource   private AccountService accountService;   @PostMapping(value = "/account/decrease")   public CommonResult decrease(@RequestParam("userId") Long userId, @RequestParam("money") BigDecimal money) {     accountService.decrease(userId, money);     return new CommonResult(200, "扣减账户余额成功");   }}` 

dao

· AccountDao `@Mapperpublic interface AccountDao {   /**   * 扣减账户余额   *   * @param userId   * @param money   * @return   */   int decrease(@Param("userId") Long userId, @Param("money") BigDecimal money);}` 

· resources文件夹下新建mapper文件夹后添加

oAccountMapper.xml`<?xml version="1.0" encoding="UTF-8" ?><!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd"><mapper namespace="com.bilibili.springcloud.dao.OrderDao"> <resultMap id="BaseResultMap" type="com.bilibili.springcloud.domain.Order"> <id column="id" property="id" jdbcType="BIGINT"></id> <result column="user_id" property="userId" jdbcType="BIGINT"></result> <result column="product_id" property="productId" jdbcType="BIGINT"></result> <result column="count" property="count" jdbcType="INTEGER"></result> <result column="money" property="money" jdbcType="DECIMAL"></result> <result column="status" property="status" jdbcType="INTEGER"></result> </resultMap> <insert id="create" parameterType="com.bilibili.springcloud.domain.Order" useGeneratedKeys="true" keyProperty="id"> insert into t_order(user_id,product_id,count,money,status) values (#{userId},#{productId},#{count},#{money},0); </insert> <update id="update"> update t_order set status =1 where user_id =#{userId} and status=#{status}; </update></mapper>` 

service

· AccountService `/** * 库存服务 **/@Servicepublic interface AccountService {   /**   * 减库存   *   * @param userId 用户id   * @param money  金额   * @return   */   void decrease(Long userId, BigDecimal money);}` 

· impl
```
o AccountServiceImpl /** * 账户业务实现类 **/@Service@Slf4jpublic class AccountServiceImpl implements AccountService {   @Resource   private AccountDao accountDao;   @Override   public void decrease(Long userId, BigDecimal money) {     log.info("*******->account-service中扣减账户余额开始");     // 模拟超时异常,全局事务回滚     /*try {       // 暂停20秒钟       TimeUnit.SECONDS.sleep(20);     } catch (InterruptedException e) {       e.printStackTrace();     }*/     accountDao.decrease(userId, money);     log.info("*******->account-service中扣减账户余额结束");   }} 
```
· 注意

o 需要与server端同步到nacos的组名相同



o 参考

https://blog.csdn.net/lzb348110175/article/details/107701927

https://www.cnblogs.com/qlqwjy/p/13909056.html

Test

· 下订单->减库存->扣余额->改(订单)状态

· 数据库初始情况

o 

· 正常下单

o http://localhost:2001/order/create?userld=1&productld=1&count=10&money=100

o 

正常

· 超时异常，没加@GlobalTransactional

o AccountServiceImpl添加超时 @Override   public void decrease(Long userId, BigDecimal money) {     log.info("*******->account-service中扣减账户余额开始");     // 模拟超时异常,全局事务回滚     try {       // 暂停20秒钟       TimeUnit.SECONDS.sleep(20);     } catch (InterruptedException e) {       e.printStackTrace();     }     accountDao.decrease(userId, money);     log.info("*******->account-service中扣减账户余额结束");   } 

o 数据库情况



不正常

o 故障情况

当库存和账户金额扣减后，订单状态并没有设置为已经完成，没有从零改为1

而且由于feign的重试机制，账户余额还有可能被多次扣减

· 超时异常，添加@GlobalITransactional
```
o AccountServiceImpl添加超时 @Override   public void decrease(Long userId, BigDecimal money) {     log.info("*******->account-service中扣减账户余额开始");     // 模拟超时异常,全局事务回滚     try {       // 暂停20秒钟       TimeUnit.SECONDS.sleep(20);     } catch (InterruptedException e) {       e.printStackTrace();     }     accountDao.decrease(userId, money);     log.info("*******->account-service中扣减账户余额结束");   } 
```
```
o OrderServiceImpl@GlobalTransactional @Override   @GlobalTransactional(name = "fsp-create-order", rollbackFor = Exception.class)   public void create(Order order) {     // 1 新建订单     log.info("----->开始新建订单");     orderDao.create(order);     // 2 扣减库存     log.info("----->订单微服务开始调用库存,做扣减Count");     storageService.decrease(order.getProductId(), order.getCount());     log.info("----->订单微服务开始调用库存,做扣减End");     // 3 扣减账户     log.info("----->订单微服务开始调用账户,做扣减Money");     accountService.decrease(order.getUserId(), order.getMoney());     log.info("----->订单微服务开始调用账户,做扣减End");     // 4 修改订单状态,从0到1,1代表已完成     log.info("----->修改订单状态开始");     orderDao.update(order.getUserId(), 0);     log.info("----->下订单结束了,O(∩_∩)O哈哈~");   } 
```
o 下单后数据库数据并没有任何改变

事务回滚，没有插入和修改数据

补充

· 再看TC/TM/RM三大组件

o 

o 分布式事务的执行流程

TM开启分布式事务(TM 向TC注册全局事务记录) ;

按业务场景，编排数据库、服务等事务内资源(RM向TC汇报资源准备状态) ;

TM结束分布式事务,事务-阶段结束(TM 通知TC提交/回滚分布式事务) ;

TC汇总事务信息，决定分布式事务是提交还是回滚;

TC通知所有RM提交/回滚资源，事务二阶段结束。

· AT模式如何做到对业务的无侵入

o 一阶段加载 在一-阶段，Seata会拦截“业务SQL" ，1解析SQL语义，找到“业务SQL" 要更新的业务数据，在业务数据被更新前，将其保存成"before image"2执行“业务SQL"更新业务数据，在业务数据更新之后,3其保存成"after image" ，最后生成行锁。以上操作全部在一个数据库事务内完成，这样保证了-阶段操作的原子性。 



o 二阶段提交 二阶段如是顺利提交的话，因为“业务SQL"在- -阶段已经提交至数据库，所以Seata框架只需将一阶段保存的快照数据和行锁删掉， 完成数据清理即可. 



o 二阶段回滚 二阶段回滚:二阶段如果是回滚的话，Seata 就需要回滚一阶段已经执行的“业务 SQL" .还原业务数据。回滚方式便是用"before image"还原业务数据;但在还顾前要首先要校验脏写,对比“数据库当前业务数据"和"after image"如果两份数据完全一致就说明没有脏写, 可以还原业务数据,如果不一致就说明有脏写, 出现脏写就需要转人工处理。 



· debug

· 补充

 

   