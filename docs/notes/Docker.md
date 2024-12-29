---
title: Docker
createTime: 2024/12/30 00:15:34
tag:
  - Docker
permalink: /article/1yyawbcq/
---

## 基础命令

### 镜像命令

```
docker image  #查看本地镜像
```

```
docker search XXX  #从远程仓库查找镜像
```

--- docker search mysql --filter=start=3000  #从远程仓库查找收藏大于3000的mysql镜像



docker pull XXX[:tag]  #下载指定镜像,tag为版本号,*tag的缺省值是latest*

*
*

docker rmi -f 镜像id  #删除指定镜像

docker rmi -f 镜像id 镜像id 镜像id  #删除多个指定镜像

docker rmi $(docker image -aq)  #删除全部镜像



### 容器命令

#### 启动容器

*有了镜像才可以创建容器*

```
*docker run [可选参数] 镜像id*
```

\#参数说明

--name="NAME"  容器名称(用以区分容器)

-d              后台方式运行

-it              使用交互方式运行，进入容器查看内容

exit  #容器停止并推出，从容器中退出至主机docker

Ctrl+P+Q  #容器不停止退出

-p              指定容器端口 -p 8080:8080

-p ip:主机端口:容器端口

-p 主机端口:容器端口  (常用)

-p 容器端口

-e                配置容器（如数据库密码）



#### 查看容器

docker ps [可选参数]  #产看所有容器

 -a, --all       #当前正在运行的容器

  -f, --filter filter  #筛选容器

  -n, --last int     #最近创建的容器

  -q, --quiet      #仅列出容器



#### 删除容器

docker rm 容器id  #删除指定容器（不能删除正在运行的容器）

docker rm -f 容器id  #强制删除指定容器

docker ps -f $(docker ps -aq)  #删除所有容器

docker ps -a -q |xargs docker rm  #删除所有容器(linux命令)



#### 操作容器

docker start 容器id  #启动指定容器

docker restart 容器id  #重启指定容器

docekr stop 容器id  #停止指定容器

docker kill 容器id  #强制停止指定容器



### 其他命令

docker -d 容器id  #后台启动



docker logs   #产看docker日志

docker logs -f -t  容器id/镜像id



docker inspect  容器id/镜像id  #查看指定容器/镜像的详细信息



docker exec -it 容器id bashShell  #进入正在运行容器的内部1，进入容器后开启一个新终端

docker attach 容器id  #进入正在运行容器的内部2，进入容器后打开正砸运行的终端



docker cp 容器id:容器内路径  目的主机路径





### commit镜像

*docker中的镜像是一个分层目录的（多个镜像是可以使用相同的目录的）*

在我们修改了一个容器的内容后，我们可以将这个容器构造成为一个新的镜像，一便我们在以后复用这个镜像

docker commit -m="test" -a="CK" 容器id to 新容器名:新tag  #提交一个新的镜像





## 容器数据卷

*当我们在docker中部署了数据库，我们在写入数据库后，数据同样保存到了docker中，假如该容器被删除了，那么我们的数据也将丢失* 

所以我们可以利用‘数据卷’技术，使得容器和主机公用同一个目录，或多个容器使用同一个目录



#### 使用数据卷

docker run -it -v 主机目录:容器目录  镜像id  #以目录映射和交互的方式运行指定镜像

-v 容器内路径        #匿名挂载

-v 卷名:容器内路径    #具名挂载

-v 主机路径:容器路径    #指定路径挂载





#### 实例

docker pull mysql5.7

docker images

docker run -d -p 3306:3306 -v /home/mysql/conf:/etc/mysql/conf.d -v /home/mysql/data:/var/lib/mysql -v /home/mysql/log:/var/log/mysql -e MYSQL_ROOT_PASSWORD=123456 --name mysql5.7 mysql:5.7

或 docker run -d -p 3306:3306 -v x:/environment/docker/mysql/conf:/etc/mysql/conf.d -v x:/environment/docker/mysql/data:/var/lib/mysql -v x:/environment/docker/mysql/log:/var/log/mysql -e MYSQL_ROOT_PASSWORD=123456 --name mysql5.7 mysql:5.7



#### 具名挂载和匿名挂载

如:

docker run -d -p --name nginx02 -v juming-nginx:/etc/nginx:ro nginx  #readOnly，该路径只能由主机操作

docker run -d -p --name nginx02 -v juming-nginx:/etc/nginx:rw nginx  #readWrite





### 数据共享卷

docker run -d -p 331.:3306 -e MYSQL_ROOT_PASSWORD=123456 --name mysql02 --valumes-from-mysql01 mysql:5.7  #启动mysql5.7，且数据卷指定到容器mysql01，与mysql01共享（若mysql01是指定路径挂载，则3个路径都可以（备份而非指向））



由此，容器建间的配置信息和传递，数据全容器的生命周期一直持续到没有容器使用为止。而一旦数据持久化到了本地，则不会再删除了





## Dockerfile

*dockerfile就是构建镜像的文件*

镜像是一层层的，脚本命令是一个个的，所以一个命令就是一层



如

docker build -f /home/docker-test-volume/dockerfile1 -t ck:1.0 .  #构建一个名为ck版本为1.0的镜像，最后有一个点不要漏了

-f  执行的文件路径，缺省值为当前目录下的dockerfile

-t  指定创建出的文件名机版本号



### 构建Dockerfile

每个保留的关键字（指令）都必须是大写；

执行从上到下；

\#表示注释；

每一个指令都会创建提交一个新的镜像层，并提交



### Dockerfile的指令

FROM  #指定基础镜像，表示此次镜像在from指定的镜像之上构建

MAINTAINER  #镜像作者

RUN  #镜像构建是需要运行的命令

ADD  #步骤：tomcat镜像。这个tomcat压缩包！添加内容

WORKDIR  #镜像的工作目录

VOLUME  #挂载的目录

EXPOSE  #保留端口配置

CMD  #指定这个容器启动的时候要运行的命令，只有最后一个会生效，可被替代

ENTRYPOINT  #指定这个容器启动的时候要运行的命令，可以追加命令

ONBUILD  #当构建一个被继承 DockerFile 这个时候就会运行 ONBUILD 的指令并触发

COPY  #类似ADD，将我们文件拷贝到镜像中

ENV  #构建时设置环境变量



## Docker网络

docker在安装后会在主机上注册一个网卡，docker内部则是使用 veth pair 技术。容器1连接到docker0，docker0再转发到目的地址

docker exec -it 容器id ip addr  #查看指定容器的ip地址

*docker top* *容器id  #**查看指定容器的进程信息*

*docker port* *容器id  #**查看指定容器的端口*

*docker inspect* *容器id*

*
*

### --link（）

docker exec -it tomcat01 ping tomcat02  #tomcat01容器 ping tomcat02容器



docker run -d -l --name tomcat01 --link tomcat02 tomcat  #将 tomcat01容器 与 tomcat02容器 连接起来

--link的本质是新增了host映射，就可以通过名称ping



### 自定义网络

docker network ls  #产看docker的网络配置

docker network inspect redis-net  #查看指定网络配置的详细信息

docker network rm XXX # 删除指定网络配置



#### 网络模式：

brige  桥接（默认）,在默认启动时缺省值时 --net brige

none  不配置

host   和宿主共享

container  容器网络连通（使用少）





docker network create --driver bridge --subnet 192.168.0.0/16 --gateway 192.168.0.1 mynet

--driver bridge  桥接，缺省值是127.X.0.0，x又18依次递增

--subnet 192.168.0.0/16  子网地址(192.168.255.255)，缺省值是172.x.0.0/16

--gateway 192.168.0.1  网关，缺省值是172.x.0.1

*自定义网络不仅可以通过ip连通，也可以通过容器名连通*

*
*

*
*

*将容器连接到我们的网络中*

*docker network connect mynet tomcat01*  

*
*

docker 是将这个容器连接加入到我们自定义的网络中，此时这个容器就要两个ip了





## DockerCompose

管理多个描述文件(DockerCompose)，定义运行多个容器服务

Compose是docker的开源项目,需要安装



### 三个步骤

- 使dockerfile在我们的项目中可以正常运行
- 写docker-compose.yml配置多个容器服务
- `docker compose up` 启动



实例:

```
version: "3.9"  # optional since v1.27.0
services:
  web:
    build: .
    ports:
      - "5000:5000"
    volumes:
      - .:/code
      - logvolume01:/var/log
    links:
      - redis
  redis:
    image: redis
volumes:
  logvolume01: {}
```

流程：

1. 创建网络
2. 执行 docker-compose.yaml
3. 启动服务

启动一个compose, 容器会在同一个网络一下, 我们可以通过域名(服务名)访问



```
docker-compose down  #停止容器
```



### yaml 规则

docker-compose的核心

```
version: "3.9"  #版本
services:               #服务
    #服务1
  web:                      
    #服务配置
    build: .
    ports:
    volumes:
    links:
  #服务2
  redis:
    image: redis
#其他配置
network:
configs:
volumes:
  logvolume01: {}
```



docker基础、原理、网络、服务、集群、错误排查、日志





## Docker Swarm

![image.png](https://cdn.nlark.com/yuque/0/2021/png/2818547/1622616877393-65a2ed97-59dd-4cda-857c-466e7c5b2259.png)

```
docekr swarm init  #开启DockerSwarm
```

1. 生成主键点init
2. 加入（管理者、worker），管理者管理worker

宕机后会自动选举出leader

### Raft一致性协议

docker swarm采用raft一致性协议（选举由**大多数**选出），在搭建集群时可以做到服务的高可用。（至少3台，才能在由机器宕机后选举出）



### 弹性！扩缩容！集群！

以docker compose up 启动一个单机项目

集群：swarm 

```
docker service
```

容器 =》 服务！

容器 =》 服务！ =》 副本！

![image.png](https://cdn.nlark.com/yuque/0/2021/png/2818547/1622617155811-572ba574-fa10-491f-8abf-6061a6a3c8fd.png)





### 基本命令

```
docker run  #容器启动
docker service  #服务启动
```



**服务管理只能在管理者中管理** 

```
docekr service ls  查看docker中的服务
```



每一个服务可以都创建多个副本，docker会将部分服务分配到节点中

```
docekr service create -p 8888:80 --name my-nginx nginx  #创建服务
docker service update --replices 10 my-nginx  #将my-nginx扩展到10个副本
docekr service scale my-nginx=5  #服务动态扩缩容，效果同--replices
```



```
docker service rm my-nginx  #移除服务
```



副本仍然是以容器的方式去运行的，如图

![image.png](https://cdn.nlark.com/yuque/0/2021/png/2818547/1622617034971-9a9832b2-62dd-4c70-8dea-6323238bf47f.png)





命令->管理->api->调度->工作节点（创建task容器）





在节点中可以运行节点本地的服务，工作节点才可运行集群中的服务（非工作节点不可以运行）（参考 `--mode命令` ），如图

![image.png](https://cdn.nlark.com/yuque/0/2021/png/2818547/1622617618830-c01496aa-e9f9-4423-8bc8-92fd7813a8dc.png)



swarm中的网络

- Overlay

docker部署在不同机器上，只要docker加入同一个网络，则容器间可以ping通

- ingress

特殊overlay网络，可以实现容器间的负载均衡





## Docker Stack

docker-compose 单机部署

docker stack 集群部署



docker stack deploy xxx.yaml

```
version: "3"

services:
  wordpress:
    image: wordpress
    ports:
      - 80:80
    networks:
      - overlay
    environment:
      WORDPRESS_DB_HOST: db:3306
      WORDPRESS_DB_USER: wordpress
      WORDPRESS_DB_PASSWORD: wordpress
    deploy:
      mode: replicated
      replicas: 3
```



## Docker Secret
配置密码，创建证书

略



## Docker Config
略



## 其他
### [Docker容器启用Spring Profiles](https://segmentfault.com/a/1190000011367595)
https://segmentfault.com/a/1190000011367595
https://www.cnblogs.com/woshimrf/p/springboot-docker.html

### Docker中的容器与宿主机共享网络的方式
1. docker在创建时就会在宿主机上创建一张虚拟网卡，docker中的容器都会使用这张虚拟网考。所以，在运行容器时，配置住宿主机的ip未此即可（一般是x.x.x.1）
2. 将容器的网络模式使用host就可以将容器和宿主机共享网络了。网络模式有host、bridge、none。

### docker设置容器重启方式

`docker update redis --restart=alwasys`

|                |                                                              |
| -------------- | ------------------------------------------------------------ |
| no             | 默认策略，在容器退出时不重启容器                             |
| on-failure     | 在容器非正常退出时（退出状态非0），才会重启容器              |
| on-failure:3   | 在容器非正常退出时重启容器，最多重启3次                      |
| always         | 在容器退出时总是重启容器                                     |
| unless-stopped | 在容器退出时总是重启容器，但是不考虑在Docker守护进程启动时就已经停止了的容器 |



### docker远程连接

windows下开启了远程连接且已打开端口，但还是无法连接，可以尝试管理员cmd执行下面的命令（your-public-ip就是你本机的IP地址）

`netsh interface portproxy add v4tov4 listenport=2375 connectaddress=127.0.0.1 connectport=2375 listenaddress=<your-public-ip> protocol=tcp`

### IDEA中使用远程docker发布

1. IDEA安装docker，连接

   * 下载docker插件

[//]: # (     ![image-20210811131745546]&#40;C:\Users\Miittech\AppData\Roaming\Typora\typora-user-images\image-20210811131745546.png&#41;)

   * 连接远程docker

[//]: # (     ![image-20210811132100880]&#40;C:\Users\Miittech\AppData\Roaming\Typora\typora-user-images\image-20210811132100880.png&#41;)

2. 编写`Dockerfile`文件，例如

   ```shell
   # 基础镜像，使用alpine操作系统，使用openjkd11
   FROM openjdk:11
   
   #拷贝jar包
   COPY target/*.jar app.jar
   
   # 声明挂载点，容器内此路径会对应宿主机的某个文件夹
   #VOLUME ["/point", "/tempfile", "/logs"]
   
   # 暴露的端口
   EXPOSE 8000
   
   # 启动容器时的进程
   ENTRYPOINT ["java","-jar","/app.jar","--spring.profiles.active=test"]
   ```

3. 设置启动参数

   * 安装docker插件后dockerfile文件会有启动按钮

[//]: # (     ![image-20210811132314028]&#40;C:\Users\Miittech\AppData\Roaming\Typora\typora-user-images\image-20210811132314028.png&#41;)

   * 设置启动参数

[//]: # (     ![image-20210811132811335]&#40;C:\Users\Miittech\AppData\Roaming\Typora\typora-user-images\image-20210811132811335.png&#41;)

   * 还可以设置启动前的操作，如maven打包(`clean package -Dstaging=true`)

[//]: # (     ![image-20210811132955436]&#40;C:\Users\Miittech\AppData\Roaming\Typora\typora-user-images\image-20210811132955436.png&#41;)

[//]: # (     ![image-20210811133139817]&#40;C:\Users\Miittech\AppData\Roaming\Typora\typora-user-images\image-20210811133139817.png&#41;)

4. 启动

   略

### 修改MySQL容器中的时区
``` sh
# 1. 进入mysql容器
docker exec -it mysql /bin/bash

#2. 设置系统时间
ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && echo "Asia/Shanghai" > /etc/timezone

# 3. 退出容器
exit

# 4. 重启mysql
docker restart mysql


# 5. 查看mysql时间
select now()
```
> 参考：[Docker修改Mysql容器系统时间 - 简书 (jianshu.com)](https://www.jianshu.com/p/1fb02ae38fc5)

## 一些Docker容器的安装命令
### 安装MinIO
```shell
## 下载镜像
docker pull minio/minio

## 启动容器
docker run -d -p 9000:9000 -p 9001:9001  \
-e "MINIO_ACCESS_KEY=admin" \
-e "MINIO_SECRET_KEY=admin123456" \
--restart=always \
--name minio \
minio/minio server /data
```

> MinIO SDK地址
>[MinIO | Java Client API Reference(官方)](https://docs.min.io/docs/java-client-api-reference.html)
>[Java Client API参考文档 | Minio中文文档(中文)](http://docs.minio.org.cn/docs/master/java-client-api-reference#putObject)

### 安装Rancher
#Rancher
``` sh
docker run -d --restart=unless-stopped -p 8080:80 -p 8443:443 --privileged --name rancher rancher/rancher:stable
# --privileged：忽略证书

#或
docker run -d --restart=unless-stopped -p 8080:80 -p 8443:443 -v /mydata/rancher/rancher-data:/var/lib/rancher/ -v /etc/timezone:/etc/timezone -v /etc/localtime:/etc/localtime rancher/rancher:stable
```

### 安装MySQL
#MySQL
``` sh
docker run --name mysql -v /mydata/mysql/data:/var/lib/mysql -v /mydata/mysql/conf.d:/etc/mysql/conf.d -e MYSQL_ROOT_PASSWORD=root -p 3306:3306 -d mysql:5.7
# -e MYSQL_ROOT_PASSWORD=123456 指定初始密码
# -e TZ=Asia/Shanghai 设置时区，提前想好要不要设置


# 创建完后如果需要远程连接的话，执行下面指令。（高版本的话，下面指令要分开执行，不能合成一条）
create user 'root'@'%' identified by '123456';  # 创建账户
grant all privileges on *.* to 'root'@'%' with grant option;  # 赋予权限
flush privileges;  # 刷新


# 修改时区1，启动时携带参数
-e TZ=Asia/Shanghai

# 修改时区2，设置容器时区
docker exec -it mysql /bin/bash
date
ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
exit # 退出重启docker
docker restart mysql

# 修改时区3，修改mysql配置
docker exec -it mysql /bin/bash # 进入容器 
mysql -uroot -p # 连接 mysql 服务 
set global time_zone = '+08:00'; # 设置全局会话时区 
set session time_zone = '+08:00'; # 设置当前会话时区 
show variables like '%time_zone%'; # 设置后查看 Mysql 时区配置属性。

```