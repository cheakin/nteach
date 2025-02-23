---
title: Gulimall_cluster
tags: [ SpringCloud, GuliMall, 谷粒商城]
createTime: 2025/02/23 23:06:50
permalink: /article/4gxo1d4y/
---
# 谷粒商城-集群篇(cluster)  
![](/GuliMall/谷粒商城-微服务架构图 1.jpg)
## k8s  
### 简介  
Kubernetes 简称 k8s。是用于自动部署，扩展和管理容器化应用程序的开源系统。  
中文官网:https://kubernetes.io/zh/  
中文社区:https://www.kubernetes.org.cn/  
官方文档https://kubernetes.io/zh/docs/home/  
社区文档http://docs.kubernetes.org.cn/  
  
略  
  
### 架构原理&核心概念  
#### 架构原理  
1. 整体主从方式  
![](/GuliMall/Pasted_image_20230415224652.png)  
![](/GuliMall/Pasted_image_20230415225115.png)  
2. Master 节点架构  
![](/GuliMall/Pasted_image_20230415225249.png)  
* kube-apiserver  
* 对外暴露 K8S 的 api 接口，是外界进行资源操作的唯一入口  
* 提供认证、授权、访问控制、API 注册和发现等机制  
* etcd  
* etcd 是兼具一致性和高可用性的键值数据库，可以作为保存 Kubernetes 所有集群数据的后台数据库。  
* Kubernetes 集群的 etcd 数据库通常需要有个备份计划  
* kube-scheduler  
* 主节点上的组件，该组件监视那些新创建的未指定运行节点的 Pod，并选择节点让 Pod 在上面运行。  
* 所有对 k8s 的集群操作，都必须经过主节点进行调度  
* Kube-controller-manager  
* 在主节点上运行控制器的组件  
* 这些控制器包括:  
* 节点控制器 (Node Controller) : 负责在节点出现故障时进行通知和响应  
* 副本控制器 (Replication Controller): 负责为系统中的每个副本控制器对象维护正确数量的 Pod。  
* 端点控制器 (Endpoints Controller): 填充端点(Endpoints)对象(即加入 Service与 Pod)  
* 服务帐户和令牌控制器 (Service Account & Token Controllers): 为新的命名空间创建默认帐户和 API 访问令牌  
3. Node 节点架构  
![](/GuliMall/Pasted_image_20230415225809.png)  
* kubelet  
* 一个在集群中每个节点上运行的代理。它保证容器都运行在 Pod 中。  
* 负责维护容器的生命周期，同时也负责 Volume (CSI) 和网络 (CNI) 的管理  
* kube-proxy  
* 负责为 Service 提供 cluster 内部的服务发现和负载均衡  
* 容器运行环境(Container Runtime)  
* 容器运行环境是负责运行容器的软件  
* Kubernetes 支持多个容器运行环境: Docker、containerd、cri-o、rktlet 以及任何实现 Kubernetes CRI (容器运行环境接口)。  
* fluentd  
* 是一个守护进程，它有助于提供集群层面日志 集群层面的日志  
  
#### 核心概念  
![](/GuliMall/Pasted_image_20230415231830.png)  
* Container: 容器，可以是 docker 启动的一个容器  
* Pod:  
* k8s 使用 Pod 来组织一组容器  
* 一个 Pod 中的所有容器共享同一网络。  
* Pod 是 k8s 中的最小部署单元  
* Volume  
![](/GuliMall/Pasted_image_20230415232643.png)  
* 声明在 Pod 容器中可访问的文件目录  
* 可以被挂载在 Pod 中一个或多个容器指定路径下  
* 支持多种后端存储抽象(本地存储，分布式存储，云存储  
* Controllers: 更高层次对象，部署和管理 Pod;  
* ReplicaSet: 确保预期的 Pod 副本数量  
* Deplotment: 无状态应用部署  
* StatefulSet: 有状态应用部署  
* DaemonSet: 确保所有 Node 都运行一个指定 Pod  
* Job: 一次性任务  
* Cronjob: 定时任务  
* Deployment:  
![](/GuliMall/Pasted_image_20230415232745.png)  
* 定义一组 Pod 的副本数目、版本等  
* 通过控制器 (Controller) 维持 Pod 数目(自动回复失败的 Pod)  
* 通过控制器以指定的策略控制版本(滚动升级，回滚等)  
* Service  
![](/GuliMall/Pasted_image_20230415232807.png)  
* 定义一组 Pod 的访问策略  
* Pod 的负载均衡，提供一个或者多个 Pod 的稳定访问地址  
* 支持多种方式 (ClusterlP、NodePort、LoadBalance)  
* Label: 标签，用于对象资源的查询，筛选  
![](/GuliMall/Pasted_image_20230415233047.png)  
* Namespace: 命名空间，逻辑隔离  
* 一个集群内部的逻辑隔离机制 (鉴权，资源)  
* 每个资源都属于一个 namespace  
* 同一个 namespace 所有资源名不能重复  
* 不同 namespace 可以资源名重复  
![](/GuliMall/Pasted_image_20230415233145.png)  
* API:  
我们通过 kubernetes 的 API 来操作整个集群。可以通过 kubectl、ui、curl 最终发送 http+json/yaml 方式的请求给 API Server,然后控制 k8s集群。**k8s 里的所有的资源对象都可以采用 yaml 或JSON 格式的文件定义或描述**  
![](/GuliMall/Pasted_image_20230415233417.png)  
  
### 集群搭建  
#### 环境准备  
流程叙述  
![](/GuliMall/Pasted_image_20230415233639.png)  
# 谷粒商城-集群篇(cluster)  
![](/GuliMall/谷粒商城-微服务架构图 1.jpg)  
  
## k8s  
### 简介  
Kubernetes 简称 k8s。是用于自动部署，扩展和管理容器化应用程序的开源系统。  
中文官网:https://kubernetes.io/zh/  
中文社区:https://www.kubernetes.org.cn/  
官方文档https://kubernetes.io/zh/docs/home/  
社区文档http://docs.kubernetes.org.cn/  
  
略  
  
### 架构原理&核心概念  
#### 架构原理  
1. 整体主从方式  
![](/GuliMall/Pasted_image_20230415224652.png)  
![](/GuliMall/Pasted_image_20230415225115.png)  
2. Master 节点架构  
![](/GuliMall/Pasted_image_20230415225249.png)  
* kube-apiserver  
* 对外暴露 K8S 的 api 接口，是外界进行资源操作的唯一入口  
* 提供认证、授权、访问控制、API 注册和发现等机制  
* etcd  
* etcd 是兼具一致性和高可用性的键值数据库，可以作为保存 Kubernetes 所有集群数据的后台数据库。  
* Kubernetes 集群的 etcd 数据库通常需要有个备份计划  
* kube-scheduler  
* 主节点上的组件，该组件监视那些新创建的未指定运行节点的 Pod，并选择节点让 Pod 在上面运行。  
* 所有对 k8s 的集群操作，都必须经过主节点进行调度  
* Kube-controller-manager  
* 在主节点上运行控制器的组件  
* 这些控制器包括:  
* 节点控制器 (Node Controller) : 负责在节点出现故障时进行通知和响应  
* 副本控制器 (Replication Controller): 负责为系统中的每个副本控制器对象维护正确数量的 Pod。  
* 端点控制器 (Endpoints Controller): 填充端点(Endpoints)对象(即加入 Service与 Pod)  
* 服务帐户和令牌控制器 (Service Account & Token Controllers): 为新的命名空间创建默认帐户和 API 访问令牌  
3. Node 节点架构  
![](/GuliMall/Pasted_image_20230415225809.png)  
* kubelet  
* 一个在集群中每个节点上运行的代理。它保证容器都运行在 Pod 中。  
* 负责维护容器的生命周期，同时也负责 Volume (CSI) 和网络 (CNI) 的管理  
* kube-proxy  
* 负责为 Service 提供 cluster 内部的服务发现和负载均衡  
* 容器运行环境(Container Runtime)  
* 容器运行环境是负责运行容器的软件  
* Kubernetes 支持多个容器运行环境: Docker、containerd、cri-o、rktlet 以及任何实现 Kubernetes CRI (容器运行环境接口)。  
* fluentd  
* 是一个守护进程，它有助于提供集群层面日志 集群层面的日志  
  
#### 核心概念  
![](/GuliMall/Pasted_image_20230415231830.png)  
* Container: 容器，可以是 docker 启动的一个容器  
* Pod:  
* k8s 使用 Pod 来组织一组容器  
* 一个 Pod 中的所有容器共享同一网络。  
* Pod 是 k8s 中的最小部署单元  
* Volume  
![](/GuliMall/Pasted_image_20230415232643.png)  
* 声明在 Pod 容器中可访问的文件目录  
* 可以被挂载在 Pod 中一个或多个容器指定路径下  
* 支持多种后端存储抽象(本地存储，分布式存储，云存储  
* Controllers: 更高层次对象，部署和管理 Pod;  
* ReplicaSet: 确保预期的 Pod 副本数量  
* Deplotment: 无状态应用部署  
* StatefulSet: 有状态应用部署  
* DaemonSet: 确保所有 Node 都运行一个指定 Pod  
* Job: 一次性任务  
* Cronjob: 定时任务  
* Deployment:  
![](/GuliMall/Pasted_image_20230415232745.png)  
* 定义一组 Pod 的副本数目、版本等  
* 通过控制器 (Controller) 维持 Pod 数目(自动回复失败的 Pod)  
* 通过控制器以指定的策略控制版本(滚动升级，回滚等)  
* Service  
![](/GuliMall/Pasted_image_20230415232807.png)  
* 定义一组 Pod 的访问策略  
* Pod 的负载均衡，提供一个或者多个 Pod 的稳定访问地址  
* 支持多种方式 (ClusterlP、NodePort、LoadBalance)  
* Label: 标签，用于对象资源的查询，筛选  
![](/GuliMall/Pasted_image_20230415233047.png)  
* Namespace: 命名空间，逻辑隔离  
* 一个集群内部的逻辑隔离机制 (鉴权，资源)  
* 每个资源都属于一个 namespace  
* 同一个 namespace 所有资源名不能重复  
* 不同 namespace 可以资源名重复  
![](/GuliMall/Pasted_image_20230415233145.png)  
* API:  
我们通过 kubernetes 的 API 来操作整个集群。可以通过 kubectl、ui、curl 最终发送 http+json/yaml 方式的请求给 API Server,然后控制 k8s集群。**k8s 里的所有的资源对象都可以采用 yaml 或JSON 格式的文件定义或描述**  
![](/GuliMall/Pasted_image_20230415233417.png)  
  
### 集群搭建  
#### 环境准备  
流程叙述  
![](/GuliMall/Pasted_image_20230415233639.png)  
1. 通过 Kubectl 提交一个创建 RC(Replication Controller) 的请求,该请求通过 APIServer被写入 etcd 中  
2. 此时 Controller Manager 通过 API Server 的监听资源变化的接口监听到此 RC事件  
3. 分析之后，发现当前集群中还没有它所对应的 Pod 实例，  
4. 于是根据 RC 里的 Pod 模板定义生成一个 Pod 对象，通过 APIServer 写入 etcd5、  
5. 此事件被 Scheduler 发现，它立即执行一个复杂的调度流程，为这个新 Pod 选定一个落户的 Node，然后通过 API Server 讲这一结果写入到 etcd 中，  
6. 目标 Node 上运行的 Kubelet 进程通过 APIServer 监测到这个"新生的"Pod，并按照它的定义，启动该 Pod 并任劳任怨地负责它的下半生，直到 Pod 的生命结束。  
7. 随后，我们通过 Kubectl 提交一个新的映射到该 Pod 的 Service 的创建请求  
8. ControllerManager 通过 Label 标签查询到关联的 Pod 实例，然后生成 Service 的Endpoints 信息，并通过 APIServer 写入到 etcd 中，  
9. 接下来，所有 Node 上运行的 Proxy 进程通过 APIServer 查询并监听 Service 对象与其对应的 Endpoints 信息，建立一个软件方式的负载均衡器来实现 Service 访问到后端Pod 的流量转发功能。  
k8s 里的所有的资源对象都可以采用 yaml 或JSON 格式的文件定义或描述  
  
部署步骤  
1. 在所有节点上安装 Docker 和 kubeadm  
2. 部署 Kubernetes Master  
3. 部署容器网络插件  
4. 部署 Kubernetes Node，将节点加入 Kubernetes 集群中5.部署 Dashboard Web 页面，可视化查看 Kubernetes 资源  
![](/GuliMall/Pasted_image_20230416205816.png)  
  
#### 创建三个虚拟机  
``` bat
vagrant ssh k8s-node1  
```  
  
``` sh
su root  
  
vi /etc/ssh/sshd_config  
  
service sshd restart  
  
exit;  
exit;  
```  
  
#### NAT网络和前置环境  
``` sh
ip route show  
  
ip addr show  
```  
全局设置添加一个NAT网络  
将3个节点的网卡1的连接方式都设置为`NAT网络`，并且刷新MAC地址  
  
为了和教程保持一致，可以修改一些ip  
``` sh
vi /etc/sysconfig/network-scripts/ifcfg-eth0  
  
BOOTPROTO=“static” # 使用静态IP地址，默认为dhcp  
IPADDR=10.0.2.5 # ip地址  
GATEWAY=10.0.2.1  # 网关  
NETMASK=255.255.255.0  # 子网掩码  
DNS1=114.114.114.114 # DNS服务器  
  
service network restart  
```  
设置linux环境（三个节点都执行）  
``` sh
# 关闭防火墙  
systemctl stop firewalld  
systemctl disable firewalld  
  
# 关闭selinux  
cat /etc/selinux/config  
sed -i 's/enforcing/disabled/' /etc/selinux/config  
cat /etc/selinux/config  
setenforce 0  
  
# 关闭swap  
swapoff -a # 临时  
cat /etc/fstab  
sed -ri 's/.*swap.*/#&/' /etc/fstab # 永久  
free -g # 验证，swap 必须为 0:  
# 添加主机名与 IP 对应关系  
vi /etc/hosts  
10.0.2.15 k8s-node1  
10.0.2.24 k8s-node2  
10.0.2.25 k8s-node3  
cat /etc/hosts  
# hostnamectl set-hostname <newhostname> :指定新的 hostname# su 切换过来  
  
#将桥接的 IPv4 流量传递到 iptables 的链  
cat > /etc/sysctl.d/k8s.conf << EOF  
net.bridge.bridge-nf-call-ip6tables = 1  
net.bridge.bridge-nf-call-iptables = 1  
EOF  
sysctl --system  
  
# 疑难问题遇见提示是只读的文件系统，运行如下命令  
mount -o remount rw  
  
# date 查看时间 (可选）  
yum install -y ntpdate  
ntpdate time.windows.com # 同步最新时间  
```  
  
#### 安装docker、kubelet、kubeadm、kubectl  
安装docker  
``` sh
# 卸载旧版本  
sudo yum remove docker \  
docker-client \  
docker-client-latest \  
docker-common \  
docker-latest \  
docker-latest-logrotate \  
docker-logrotate \  
docker-engine  
  
# 安装所需的软件包  
sudo yum install -y yum-utils device-mapper-persistent-data lvm2  
  
# 设置稳定的仓库（阿里）  
sudo yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo  
  
# 安装Docker，以及cli  
sudo yum -y install docker-ce docker-ce-cli containerd.io  
  
#配置docker加速  
sudo mkdir -p /etc/docker  
sudo tee /etc/docker/daemon.json <<-'EOF'  
{  
"registry-mirrors": ["https://wh9z3wm8.mirror.aliyuncs.com"]  
}  
EOF
sudo systemctl daemon-reload  
sudo systemctl restart docker  
  
# 设置docker开机自启  
systemctl enable docker  
```  
  
安装kubeadm, kebelet, kubectl  
``` sh
# 添加阿里云yum源  
cat > /etc/yum.repos.d/kubernetes.repo << EOF  
[kubernetes]  
name=Kubernetes  
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64  
enabled=1  
gpgcheck=0  
repo_gpgcheck=0  
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg  
EOF  
  
# 安装 kubeadm，kubelet 和 kubectlyum list|grep kube  
yum install -y kubelet-1.17.3 kubeadm-1.17.3 kubectl-1.17.3  
  
# 设置kuvelet启动，并开机启动  
systemctl enable kubelet  
systemctl start kubelet  
```  
  
#### 集群安装完成  
**master节点初始化**  
``` sh
chmod 700 master_images.sh  
```  
master_images.sh内容  
``` sh
#!/bin/bash  
  
images=(  
kube-apiserver:v1.17.3  
kube-proxy:v1.17.3  
kube-controller-manager:v1.17.3  
kube-scheduler:v1.17.3  
coredns:1.6.5  
etcd:3.4.3-0  
pause:3.1  
)  
  
for imageName in ${images[@]} ; do  
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/$imageName  
# docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/$imageName k8s.gcr.io/$imageName  
done  
```  
初始化master节点  
``` sh
kubeadm init \  
--apiserver-advertise-address=10.0.2.15 \  
--image-repository registry.aliyuncs.com/google_containers \  
--kubernetes-version v1.17.3 \  
--service-cidr=10.96.0.0/16 \  
--pod-network-cidr=10.244.0.0/16  
  
# 初始化完后，根据提示知悉  
mkdir -p $HOME/.kube  
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config  
sudo chown $(id -u):$(id -g) $HOME/.kube/config  
# https://kubernetes.io/docs/concepts/cluster-administration/addons/  
  
# 根据mater节点自动生成的密钥, 让node节点加入  
kubeadm join 10.0.2.15:6443 --token p7p9jr.kdlwlgywze84j93h \  
--discovery-token-ca-cert-hash sha256:004442540f3c0a9a83e96b533804b4c042b299d73944aa02435f1d04ebd036dc  
```  
由于默认拉取镜像地址 k8s.gcr.io 国内无法访问，这里指定阿里云镜像仓库地址。可以手动按照我们的 images.sh 先拉取镜像,地址变为 registry.aliyuncs.com/google containers 也可以。  
科普: 无类别域间路由 (Classless Inter-Domain Routing、CIDR) 是一个用于给用户分配 IP地址以及在互联网上有效地路由 IP 数据包的对 IP 地址进行归类的方法。拉取可能失败，需要下载镜像。  
运行完成提前复制: 加入集群的令牌  
  
安装 Pod 网络插件 (CNI)  
``` sh
# 安装 Pod 网络插件 (CNI)，教程中的地址已经挂了
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml
# 或是运行本地的  
kubeadm apply -f kube-flannel.yml  
  
# 检查  
kubectl get pods  
kubectl get ns  
kubectl get pods --all-namespaces  
  
kubectl get nodes  
```  
  
将node节点加入mater中  
``` sh
# 使用刚才mater节点生成的密钥，在node节点中直接运行  
kubeadm join 10.0.2.15:6443 --token p7p9jr.kdlwlgywze84j93h \  
--discovery-token-ca-cert-hash sha256:004442540f3c0a9a83e96b533804b4c042b299d73944aa02435f1d04ebd036dc  
```  
  查看节点状态
``` sh
# 查看节点信息  
kubectl get nodes  
  
# 监控节点状态  
watch kubectl get pod -n kube-system -o wide  
```  
如果token过期
``` sh
kubeadm token create --print-join-command  
kubeadm token create --ttl 0 --print-join-command  
```

### 入门
#### 基本操作体验
部署一个tomcat
``` sh 
kubectl create deployment tomcat6 --image=tomcat:6.0.53-jre8

# 查看状态
kubectl get pods -o wide
```
暴露nginx访问
``` sh 
kubectl expose deployment tomcat6 --port=80 --target-port=8080 --type=NodePort
# Pod 的 80 映射容器的 8080; service 会代理 Pod 的 80
```
扩容
``` sh 
# 扩容
kubectl scale --replicas=3 deployment tomcat6
# 缩容
kubectl scale --replicas=1 deployment tomcat6
```
删除
``` sh
kubectl delete deploy/nginx
kubectl delete service/nginx-service

kubectl delete deployment.apps/tomcat6
kubectl delete service/tomcat6
```
其他
``` sh
kubectl get all
kubectl get nodes
kubectl get pods
kubectl get svc
kubectl get ns
```

#### yaml&基本使用
##### kubectl
kubectl 文档 https://kubernetes.io/zh/docs/reference/kubectl/overview/

资源类型 https://kubernetes.io/zh/docs/reference/kubectl/overview/#%E8%B5%84%E6%BA%90%E7%B1%BB%E5%9E%8B

格式化输出 https://kubernetes.io/zh/docs/reference/kubectl/overview/#%E6%A0%BC%E5%BC%8F%E5%8C%96%E8%BE%93%E5%87%BA

常用操作 https://kubernetes.io/zh/docs/reference/kubectl/overview/#%E7%A4%BA%E4%BE%8B-%E5%B8%B8%E7%94%A8%E6%93%8D%E4%BD%9C

命令参考 https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands

##### yaml
yml模板
![](/GuliMall/Pasted_image_20230420005422.png)

``` sh
kubectl create deployment tomcat6 --image=tomcat:6.0.53-jre8 --dry-run -o yaml
kubectl create deployment tomcat6 --image=tomcat:6.0.53-jre8 --dry-run -o yaml > tomcat6.yaml

kubectl apply -f tomcat6.yaml

kubectl expose deployment tomcat6 --port=80 --target-port=8080 --type=NodePort --dry-run -o yaml

kubectl get pod tomcat6-5f7ccf4cb9-lkwl9 -o yaml
kubectl get pod tomcat6-5f7ccf4cb9-lkwl9 -o yaml > mypod.yaml

kubectl apply -f mypod.yaml

kubectl delete deployment.apps/tomcat6
```

#### Pod、Service等概念 & Ingress
1. Pod 是什么，Controller 是什么 
    https://kubernetes.io/zh/docs/concepts/workloads/pods/#pods-and-controllers 
    Pod 和控制器 
    控制器可以为您创建和管理多个 Pod，管理副本和上线，并在集群范围内提供自修复能力。 例如，如果一个节点失败，控制器可以在不同的节点上调度一样的替身来自动替换 Pod。 包含一个或多个 Pod 的控制器一些示例包括： Deployment StatefulSet DaemonSet 
    控制器通常使用您提供的 Pod 模板来创建它所负责的 Pod
    ![](/GuliMall/Pasted_image_20230420080216.png)
2. Deployment&Service 是什么
    ![](/GuliMall/Pasted_image_20230420080504.png)
3. Service 的意义 
    统一应用访问入口； 
    Service 管理一组 Pod。 
    防止 Pod 失联（服务发现）、定义一组 Pod 的访问策略 
    现在 Service 我们使用 NodePort 的方式暴露，这样访问每个节点的端口，都可以访问到这 个 Pod，如果节点宕机，就会出现问题。
4. abels and selectors
    ![](/GuliMall/Pasted_image_20230420081511.png)
5. Ingress 
    通过 Service 发现 Pod 进行关联。基于域名访问。 
    通过 Ingress Controller 实现 Pod 负载均衡 
    支持 TCP/UDP 4 层负载均衡和 HTTP 7 层负载均衡
    ![](/GuliMall/Pasted_image_20230420201532.png)



``` sh
kubectl create deployment tomcat6 --image=tomcat:6.0.53-jre8 --dry-run -o yaml > tomcat6-deployment.yaml
kubectl apply -f tomcat6-deployment.yaml

kubectl expose deployment tomcat6 --port=80 --target-port=8080 --type=NodePort --dry-run -o yaml
kubectl delete deployment.apps/tomcat6
kubectl apply -f tomcat6-deployment.yaml

kubectl apply -f ingress-controller.yaml

kubectl get pods --all-namespaces
```
配置hosts
``` sh
192.168.56.102 tomcat6.atguigu.com
```

## KubeSphere
#### kubernetes-dashboard
略

### 安装
#### 最小化安装
文档：[前提条件 | KubeSphere Documents](https://v2-1.docs.kubesphere.io/docs/zh-CN/installation/prerequisites/)

安装
新版本已经不需要再单独安装helm和tiller了， 
文档：https://v3-1.docs.kubesphere.io/zh/docs/quick-start/minimal-kubesphere-on-k8s/
``` sh
# v3-1 也需要一个有一个默认的 StorageClass，这里我也用openebs，但安装方式有所差异
kubectl apply -f https://openebs.github.io/charts/openebs-operator.yaml
# 设置 openebs-hostpath 为默认
kubectl patch sc openebs-hostpath -p '{"metadata": {"annotations": {"storageclass.beta.kubernetes.io/is-default-class": "true"}}}'
# 查看
kubectl sc

# 安装 KubeSphere
kubectl apply -f https://github.com/kubesphere/ks-installer/releases/download/v3.1.1/kubesphere-installer.yaml

kubectl apply -f https://github.com/kubesphere/ks-installer/releases/download/v3.1.1/cluster-configuration.yaml

# 检查日志
kubectl logs -n kubesphere-system $(kubectl get pod -n kubesphere-system -l app=ks-install -o jsonpath='{.items[0].metadata.name}') -f 
# 查看端口
kubectl get svc/ks-console -n kubesphere-system
kubectl get pod --all-namespaces
kubectl get svc/ks-console -n kubesphere-system
```

#### 定制化安装&界面介绍
至此以后，电脑配置已经撑不住了，各位看教程继续吧！

### 进阶
#### KubeSphere
略，*电脑配置已经撑不住了，各位看教程继续吧！*

## 集群
### 集群常见的基本形式
![](/GuliMall/Pasted_image_20230504091527.png)

### MySQL
#### 常见集群形式(集群原理)
* MySQL-MMM 是Master-Master Replication Manager for MySQL (mysgl主主复制管理器)的简称，是 Google 的开源项目(Perl 脚本)。MMM 基于 MySQL Replication 做的扩展架构，主要用来监控 mysgl 主主复制并做失败转移。其原理是将真实数据库节点的IP (RIP) 映射为虚拟P (VIP) 集。mysol-mmm 的监管端会提供多人虚拟 IP (VIP)，包括一个可写 VIP多个可读 VIP，通过监管的管理，这些P 会绑定在可用 mysql之上，当某一台 mysgl 宕机时,监管会将 VIP迁移至其他 mysql。在整个监管过程中，需要在 mysql 中添加相关授权用户，以便让 mysgl 可以支持监理机的维护。授权的用户包括一个mmm monitor 用户和一个 mmm agent 用户，如果想使用mmm 的备份工具则还要添加一个 mmm tools 用户。
	![](/GuliMall/Pasted_image_20230504092916.png)
* MHA (Master High Availability) 目前在 MySQL 高可用方面是一个相对成熟的解决方案由日本 DeNA 公司 youshimaton (现就职于 Facebook 公司) 开发，是一套优秀的作为MySOL高可用性环境下故障切换和主从提升的高可用软件。在 MySOL故障切换过程中MHA 能做到在 0~30 秒之内自动完成数据库的故障切换操作(以2019 年的眼光来说太慢了)，并且在进行故障切换的过程中，MHA 能在最大程度上保证数据的一致性，以达到真正意义上的高可用。
* InnoDB Cluster 支持自动 Failover、强一致性、读写分离、读库高可用、读请求负载均衡，横向扩展的特性，是比较完备的一套方案。但是部署起来复杂，想要解决 router单点问题好需要新增组件，如没有其他更好的方案可考虑该方案。 InnoDB CIuster 主要由 MySOL Shell、MySOL Router 和 MySOL 服务器集群组成，三者协同工作，共同为MySOL 提供完整的高可用性解决方案。MySOL Shell 对管理人员提供管理接口，可以很方便的对集群进行配置和管理,MySOL Router 可以根据部署的集群状况自动的初始化，是客户端连接实例。如果有节点 down 机，集群会自动更新配置。集群包含单点写入和多点写入两种模式。在单主模式下，如果主节点 down 掉，从节点自动替换上来MySOL Router 会自动探测，并将客户端连接到新节点。
	![](/GuliMall/Pasted_image_20230504094725.png)

以下可以作为企业中常用的数据库解决方案
![](/GuliMall/Pasted_image_20230504095205.png)

#### 主从同步
Master实例
``` sh 
docker run -p 3307:3306 --name mysql-master \
-v /mydata/mysql/master/log:/var/log/mysql \
-v /mydata/mysql/master/data:/var/lib/mysql \
-v /mydata/mysql/master/conf:/etc/mysql \
-e MYSQL_ROOT_PASSWORD=root \
-d mysql:5.7

# 参数说明 
-p 3307:3306：将容器的 3306 端口映射到主机的 3307 端口
-v /mydata/mysql/master/conf:/etc/mysql：将配置文件夹挂在到主机
-v /mydata/mysql/master/log:/var/log/mysql：将日志文件夹挂载到主机
-v /mydata/mysql/master/data:/var/lib/mysql/：将配置文件夹挂载到主机
-e MYSQL_ROOT_PASSWORD=root：初始化 root


# 修改 master 基本配置 
vi /mydata/mysql/master/conf/my.cnf 

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
# 注意：skip-name-resolve 一定要加，不然连接 mysql 会超级慢

# 添加 master 主从复制部分配置 
server_id=1 
log-bin=mysql-bin 
read-only=0 
binlog-do-db=gulimall_ums 
binlog-do-db=gulimall_pms 
binlog-do-db=gulimall_oms 
binlog-do-db=gulimall_sms 
binlog-do-db=gulimall_wms 
binlog-do-db=gulimall_admin 

replicate-ignore-db=mysql 
replicate-ignore-db=sys 
replicate-ignore-db=information_schema 
replicate-ignore-db=performance_schema

# 重启 master
```

Slave实例
``` sh
docker run -p 3317:3306 --name mysql-slaver-01 \
-v /mydata/mysql/slaver/log:/var/log/mysql \
-v /mydata/mysql/slaver/data:/var/lib/mysql \
-v /mydata/mysql/slaver/conf:/etc/mysql \
-e MYSQL_ROOT_PASSWORD=root \
-d mysql:5.7

# 修改 slave 基本配置 
vi /mydata/mysql/slaver/conf/my.cnf 

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

#添加 master 主从复制部分配置 
server_id=2 
log-bin=mysql-bin 
read-only=1 
binlog-do-db=gulimall_ums 
binlog-do-db=gulimall_pms 
binlog-do-db=gulimall_oms 
binlog-do-db=gulimall_sms 
binlog-do-db=gulimall_wms 
binlog-do-db=gulimall_admin 

replicate-ignore-db=mysql 
replicate-ignore-db=sys 
replicate-ignore-db=information_schema 
replicate-ignore-db=performance_schema

# 重启 slaver
```
重启
``` sh
docker restart mysql-master mysql-slaver-01
```

为 master 授权用户来他的同步数据
``` sh 
# 1.进入 master 容器 
docker exec -it mysql /bin/bash 
# 2.进入 mysql 内部 （mysql –uroot -p）
# 2.1.授权 root 可以远程访问（ 主从无关，为了方便我们远程连接 mysql） 
grant all privileges on *.* to 'root'@'%' identified by 'root' with grant option;
flush privileges; 
# 2.2.添加用来同步的用户 
GRANT REPLICATION SLAVE ON *.* to 'backup'@'%' identified by '123456'; 
# 3.查看 master 状态 
show master status\G
```
配置 slaver 同步 master 数据
``` sh
# 1.进入 slaver 容器 
docker exec -it mysql-slaver-01 /bin/bash 
# 2.进入 mysql 内部（mysql –uroot -p） 
# 2.1.授权 root 可以远程访问（ 主从无关，为了方便我们远程连接 mysql） 
grant all privileges on *.* to 'root'@'%' identified by 'root' with grant option; 
flush privileges; 
# 2.2.设置主库连接 
change master to master_host='192.168.56.10',master_user='backup',master_password='123456',master_log_file='mysql-bin.000001',master_log_pos=0,master_port=3307; 
# 3.启动从库同步 
start slave; 
# 4.查看从库状态 
show slave status
```
![](/GuliMall/Pasted_image_20230504105146.png)
总结：
1. 主从数据库在自己配置文件中声明需要同步哪个数据库，忽略哪个数据库等信息。 并且 server-id 不能一样 
2. 主库授权某个账号密码来同步自己的数据
3. 从库使用这个账号密码连接主库来同步数据

### SharedingSphere
#### 简介
shardingSphere: http://shardingsphere.apache.org/index_zh.html 
auto_increment_offset: 1 从几开始增长 
auto_increment_increment: 2 每次的步长

#### 分库分表&读写分离配置
![](/GuliMall/Pasted_image_20230504110224.png)
账户配置 server.yaml
``` yaml
authority:
  users:
    - user: root@%
      password: root
    - user: sharding
      password: sharding

props:
  kernel-executor-size: 16  # Infinite by default.
  sql-show: false
```
分库分表配置 config-sharding.yaml
``` yaml
databaseName: sharding_db
#
dataSources:
  ds_0:
    url: jdbc:mysql://192.168.56.10:3307/demo_ds_0?serverTimezone=UTC&useSSL=false
    username: root
    password: root
    connectionTimeoutMilliseconds: 30000
    idleTimeoutMilliseconds: 60000
    maxLifetimeMilliseconds: 1800000
    maxPoolSize: 50
    minPoolSize: 1
  ds_1:
    url: jdbc:mysql://192.168.56.10:3307/demo_ds_1?serverTimezone=UTC&useSSL=false
    username: root
    password: root
    connectionTimeoutMilliseconds: 30000
    idleTimeoutMilliseconds: 60000
    maxLifetimeMilliseconds: 1800000
    maxPoolSize: 50
    minPoolSize: 1
#
rules:
- !SHARDING
  tables:
    t_order:
      actualDataNodes: ds_${0..1}.t_order_${0..1}
      tableStrategy:
        standard:
          shardingColumn: order_id
          shardingAlgorithmName: t_order_inline
      keyGenerateStrategy:
        column: order_id
        keyGeneratorName: snowflake
#      auditStrategy:
#        auditorNames:
#          - sharding_key_required_auditor
#        allowHintDisable: true
    t_order_item:
      actualDataNodes: ds_${0..1}.t_order_item_${0..1}
      tableStrategy:
        standard:
          shardingColumn: order_id
          shardingAlgorithmName: t_order_item_inline
      keyGenerateStrategy:
        column: order_item_id
        keyGeneratorName: snowflake
  bindingTables:
    - t_order,t_order_item
  defaultDatabaseStrategy:
    standard:
      shardingColumn: user_id
      shardingAlgorithmName: database_inline
  defaultTableStrategy:
    none:
#  defaultAuditStrategy:
#    auditorNames:
#      - sharding_key_required_auditor
#    allowHintDisable: true
#
  shardingAlgorithms:
    database_inline:
      type: INLINE
      props:
        algorithm-expression: ds_${user_id % 2}
    t_order_inline:
      type: INLINE
      props:
        algorithm-expression: t_order_${order_id % 2}
    t_order_item_inline:
      type: INLINE
      props:
        algorithm-expression: t_order_item_${order_id % 2}
#
  keyGenerators:
    snowflake:
      type: SNOWFLAKE
#
#  auditors:
#    sharding_key_required_auditor:
#      type: DML_SHARDING_CONDITIONS
```
读写分离配置 config-readwrite-splitting.yaml
``` yaml
databaseName: readwrite_splitting_db
#
dataSources:
  write_ds:
    url: jdbc:mysql://192.168.56.10:3307/demo_ds_0?serverTimezone=UTC&useSSL=false
    username: root
    password: root
    connectionTimeoutMilliseconds: 30000
    idleTimeoutMilliseconds: 60000
    maxLifetimeMilliseconds: 1800000
    maxPoolSize: 50
    minPoolSize: 1
  read_ds_0:
    url: jdbc:mysql://192.168.56.10:3307/demo_ds_0?serverTimezone=UTC&useSSL=false
    username: root
    password: root
    connectionTimeoutMilliseconds: 30000
    idleTimeoutMilliseconds: 60000
    maxLifetimeMilliseconds: 1800000
    maxPoolSize: 50
    minPoolSize: 1
  read_ds_1:
    url: jdbc:mysql://192.168.56.10:3317/demo_ds_0?serverTimezone=UTC&useSSL=false
    username: root
    password: root
    connectionTimeoutMilliseconds: 30000
    idleTimeoutMilliseconds: 60000
    maxLifetimeMilliseconds: 1800000
    maxPoolSize: 50
    minPoolSize: 1
#
rules:
- !READWRITE_SPLITTING
  dataSources:
    readwrite_ds:
      staticStrategy:
        writeDataSourceName: write_ds
        readDataSourceNames:
          - read_ds_0
          - read_ds_1
      loadBalancerName: random
  loadBalancers:
    random:
      type: RANDOM
```

### Redis
#### Cluster基本原理
* 客户端分区
	![](/GuliMall/Pasted_image_20230504160140.png)
	客户端分区方案 的代表为 Redis Sharding，Redis Sharding 是 Redis Cluster 出来之前，业界普遍使用的 Redis 多实例集群 方法。Java 的 Redis 客户端驱动库 Jedis，支持 RedisSharding 功能，即 ShardedJedis 以及 结合缓存池的 ShardedJedisPool。
	优点：不使用 第三方中间件，分区逻辑 可控，配置 简单，节点之间无关联，容易 线性扩展，灵活性强。
	缺点：客户端 无法 动态增删 服务节点，客户端需要自行维护 分发逻辑，客户端之间 无连接共享会造成 连接浪费

* 代理分区
	![](/GuliMall/Pasted_image_20230504160316.png)
	代理分区常用方案有 Twemproxy 和 Codis

* redis-cluster
	1. 槽
		https://redis.io/topics/cluster-tutorial/ 
		Redis 的官方多机部署方案，Redis Cluster。一组 Redis Cluster 是由多个 Redis 实例组成，官 方推荐我们使用 6 实例，其中 3 个为主节点，3 个为从结点。一旦有主节点发生故障的时候， Redis Cluster 可以选举出对应的从结点成为新的主节点，继续对外服务，从而保证服务的高 可用性。那么对于客户端来说，知道知道对应的 key 是要路由到哪一个节点呢？Redis Cluster 把所有的数据划分为 16384 个不同的槽位，可以根据机器的性能把不同的槽位分配给不同 的 Redis 实例，对于 Redis 实例来说，他们只会存储部分的 Redis 数据，当然，槽的数据是 可以迁移的，不同的实例之间，可以通过一定的协议，进行数据迁移。
		![](/GuliMall/Pasted_image_20230504165559.png)
		Redis 集群的功能限制；Redis 集群相对 单机 在功能上存在一些限制，需要开发人员提前 了解，在使用时做好规避。JAVA CRC16 校验算法
		* key 批量操作 支持有限。 
			* 类似 mset、mget 操作，目前只支持对具有相同 slot 值的 key 执行 批量操作。 对于 映射为不同 slot 值的 key 由于执行 mget、mget 等操作可能存在于多个节点上，因此不被支持。
		* key 事务操作支持有限。 
			* 只支持多 key 在 同一节点上 的 事务操作，当多个 key 分布在不同的节点上时无法使用事务功能。 
		* key 作为 数据分区 的最小粒度 
		* 不能将一个 大的键值 对象如 hash、list 等映射到不同的节点。 
		* 不支持多数据库空间
			* 单机 下的 Redis 可以支持 16 个数据库（db0 ~ db15），集群模式下只能使用一个 数据库空间，即 db0。 
		* 复制结构只支持一层
			* 从节点 只能复制 主节点，不支持嵌套树状复制结构。 
		* 命令大多会重定向，耗时多
		![](/GuliMall/Pasted_image_20230504165833.png)
	2. 一致性哈希
		一致性哈希 可以很好的解决 稳定性问题，可以将所有的存储节点排列在收尾相接的 Hash 环上，每个 key 在计算 Hash 后会顺时针找到临接的存储节点 存放。而当有节点加入或 退出 时，仅影响该节点在 Hash 环上顺时针相邻的
		![](/GuliMall/Pasted_image_20230504170313.png)
		Hash 倾斜 如果节点很少，容易出现倾斜，负载不均衡问题。一致性哈希算法，引入了虚拟节点，在整 个环上，均衡增加若干个节点。比如 a1，a2，b1，b2，c1，c2，a1 和 a2 都是属于 A 节点 的。解决 hash 倾斜问

#### Cluster集群搭建
![](/GuliMall/Pasted_image_20230504110332.png)
创建 6 个 redis 节点
``` sh
# 3 主 3 从方式，从为了同步备份，主进行 slot 数据分片
for port in $(seq 7001 7006); \
do \
mkdir -p /mydata/redis/node-${port}/conf
touch /mydata/redis/node-${port}/conf/redis.conf
cat << EOF >/mydata/redis/node-${port}/conf/redis.conf
port ${port}
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000
cluster-announce-ip 192.168.56.10
cluster-announce-port ${port}
cluster-announce-bus-port 1${port}
appendonly yes
EOF
docker run -p ${port}:${port} -p 1${port}:1${port} --name redis-${port} \
-v /mydata/redis/node-${port}/data:/data \
-v /mydata/redis/node-${port}/conf/redis.conf:/etc/redis/redis.conf \
-d redis:5.0.7 redis-server /etc/redis/redis.conf; \
done
```
使用 redis 建立集群
``` sh
docker exec -it redis-7001 bash

redis-cli --cluster create 192.168.56.10:7001 192.168.56.10:7002 192.168.56.10:7003 192.168.56.10:7004 192.168.56.10:7005 192.168.56.10:7006 --cluster-replicas 1
```
测试集群效果
``` sh
# 随便进入某个 redis 容器 
docker exec -it redis-7002 /bin/bash 
# 使用 redis-cli 的 cluster 方式进行连接 
redis-cli -c -h 192.168.56.10 -p 7006 

cluster info；# 获取集群信息 
cluster nodes；# 获取集群节点 
# Get/Set 命令测试，将会重定向 
# 节点宕机，slave 会自动提升为 master，master 开启后变为 slav
```

### ElasticSearch
#### 集群原理
https://www.elastic.co/guide/cn/elasticsearch/guide/current/index.html https://www.elastic.co/guide/cn/elasticsearch/guide/current/distributed-cluster.html elasticsearch 是天生支持集群的，他不需要依赖其他的服务发现和注册的组件，如 zookeeper 这些，因为他内置了一个名字叫 ZenDiscovery 的模块，是 elasticsearch 自己实现的一套用 于节点发现和选主等功能的组件，所以 elasticsearch 做起集群来非常简单，不需要太多额外 的配置和安装额外的第三方组件

单节点
* 一个运行中的 Elasticsearch 实例称为一个节点，而集群是由一个或者多个拥有相同 cluster.name 配置的节点组成， 它们共同承担数据和负载的压力。当有节点加入集群 中或者从集群中移除节点时，集群将会重新平均分布所有的数据。
* 当一个节点被选举成为 主节点时， 它将负责管理集群范围内的所有变更，例如增加、 删除索引，或者增加、删除节点等。 而主节点并不需要涉及到文档级别的变更和搜索 等操作，所以当集群只拥有一个主节点的情况下，即使流量的增加它也不会成为瓶颈。 任何节点都可以成为主节点。我们的示例集群就只有一个节点，所以它同时也成为了主 节点。 
* 作为用户，我们可以将请求发送到 集群中的任何节点 ，包括主节点。 每个节点都知 道任意文档所处的位置，并且能够将我们的请求直接转发到存储我们所需文档的节点。 无论我们将请求发送到哪个节点，它都能负责从各个包含我们所需文档的节点收集回数 据，并将最终结果返回給客户端。 Elasticsearch 对这一切的管理都是透明的。
![](/GuliMall/Pasted_image_20230504110344.png)

集群健康
Elasticsearch 的集群监控信息中包含了许多的统计数据，其中最为重要的一项就是 集群健 康 ， 它在 status 字段中展示为 green 、 yellow 或者 red 。 
`GET /_cluster/health status` 
字段指示着当前集群在总体上是否工作正常。它的三种颜色含义如下： 
green：所有的主分片和副本分片都正常运行。 
yellow：所有的主分片都正常运行，但不是所有的副本分片都正常运行。 
red：有主分片没能正常运行。

分片 
* 一个 分片 是一个底层的 工作单元 ，它仅保存了全部数据中的一部分。我们的文档被 存储和索引到分片内，但是应用程序是直接与索引而不是与分片进行交互。分片就认为 是一个数据区 
* 一个分片可以是 主 分片或者 副本 分片。索引内任意一个文档都归属于一个主分片， 所以主分片的数目决定着索引能够保存的最大数据量。 
* **在索引建立的时候就已经确定了主分片数**，但是副本分片数可以随时修改。 
* 让我们在包含一个空节点的集群内创建名为 blogs 的索引。 索引在默认情况下会被分 配 5 个主分片， 但是为了演示目的，我们将分配 3 个主分片和一份副本（每个主分片 拥有一个副本分片）：
	`PUT /blogs{ "settings" : { "number_of_shards" : 3, "number_of_replicas" : 1 }} `
	![](/GuliMall/Pasted_image_20230509075238.png)
此时集群的健康状况为 yellow 则表示全部 主分片都正常运行（集群可以正常服务所有请 求），但是 副本 分片没有全部处在正常状态。 实际上，所有 3 个副本分片都是 unassigned —— 它们都没有被分配到任何节点。在同一个节点上既保存原始数据又保存副本是没有意 义的，因为一旦失去了那个节点，我们也将丢失该节点上的所有副本数据。
当前我们的集群是正常运行的，但是在硬件故障时有丢失数据的风险

新增节点 
当你在同一台机器上启动了第二个节点时，只要它和第一个节点有同样的 cluster.name 配 置，它就会自动发现集群并加入到其中。 但是在不同机器上启动节点的时候，为了加入到 同一集群，你需要配置一个可连接到的单播主机列表。 详细信息请查看最好使用单播代替 组播 
![](/GuliMall/Pasted_image_20230509075408.png)
此时，cluster-health 现在展示的状态为 green ，这表示所有 6 个分片（包括 3 个主分片和 3 个副本分片）都在正常运行。我们的集群现在不仅仅是正常运行的，并且还处于 始终可 用 的状态。

水平扩容-启动第三个节点 
![](/GuliMall/Pasted_image_20230509075522.png)
Node 1 和 Node 2 上各有一个分片被迁移到了新的 Node 3 节点，现在每个节点上都拥 有 2 个分片，而不是之前的 3 个。 这表示每个节点的硬件资源（CPU, RAM, I/O）将被更少 的分片所共享，每个分片的性能将会得到提升。 
在运行中的集群上是可以动态调整副本分片数目的，我们可以按需伸缩集群。让我们把副本 数从默认的 1 增加到 2 
`PUT /blogs/_settings { "number_of_replicas" : 2 }` 
blogs 索引现在拥有 9 个分片：3 个主分片和 6 个副本分片。 这意味着我们可以将集群扩 容到 9 个节点，每个节点上一个分片。相比原来 3 个节点时，集群搜索性能可以提升 3 倍。 

应对故障 
![](/GuliMall/Pasted_image_20230509075632.png)
* 我们关闭的节点是一个主节点。而集群必须拥有一个主节点来保证正常工作，所以发生 的第一件事情就是选举一个新的主节点： Node 2 。 
* 在我们关闭 Node 1 的同时也失去了主分片 1 和 2 ，并且在缺失主分片的时候索引 也不能正常工作。 如果此时来检查集群的状况，我们看到的状态将会为 red ：不是所 有主分片都在正常工作。 
* 幸运的是，在其它节点上存在着这两个主分片的完整副本， 所以新的主节点立即将这 些分片在 Node 2 和 Node 3 上对应的副本分片提升为主分片， 此时集群的状态将会 为 yellow 。 这个提升主分片的过程是瞬间发生的，如同按下一个开关一般。 
* 为什么我们集群状态是 yellow 而不是 green 呢？ 虽然我们拥有所有的三个主分片， 但是同时设置了每个主分片需要对应 2 份副本分片，而此时只存在一份副本分片。 所 以集群不能为 green 的状态，不过我们不必过于担心：如果我们同样关闭了 Node 2 ， 我们的程序 依然 可以保持在不丢任何数据的情况下运行，因为 Node 3 为每一个分 片都保留着一份副本。 
* 如果我们重新启动 Node 1 ，集群可以将缺失的副本分片再次进行分配。如果 Node 1 依然拥有着之前的分片，它将尝试去重用它们，同时仅从主分片复制发生了修改的数据 文件。

问题与解决 
1. 主节点 主节点负责创建索引、删除索引、分配分片、追踪集群中的节点状态等工作。Elasticsearch 中的主节点的工作量相对较轻，用户的请求可以发往集群中任何一个节点，由该节点负责分 发和返回结果，而不需要经过主节点转发。**而主节点是由候选主节点通过 ZenDiscovery 机 制选举出来的，所以要想成为主节点，首先要先成为候选主节点。** 
2. 候选主节点 在 elasticsearch 集群初始化或者主节点宕机的情况下，由候选主节点中选举其中一个作为主 节点。指定候选主节点的配置为：node.master: true。 
	当主节点负载压力过大，或者集中环境中的网络问题，导致其他节点与主节点通讯的时候， 主节点没来的及响应，这样的话，某些节点就认为主节点宕机，重新选择新的主节点，这样 的话整个集群的工作就有问题了，比如我们集群中有 10 个节点，其中 7 个候选主节点，1 个候选主节点成为了主节点，这种情况是正常的情况。但是如果现在出现了我们上面所说的 主节点响应不及时，导致其他某些节点认为主节点宕机而重选主节点，那就有问题了，这剩 下的 6 个候选主节点可能有 3 个候选主节点去重选主节点，最后集群中就出现了两个主节点 的情况，这种情况官方成为“脑裂现象”； 
	集群中不同的节点对于 master 的选择出现了分歧，出现了多个 master 竞争，导致主分片 和副本的识别也发生了分歧，**对一些分歧中的分片标识为了坏片**。 
3. 数据节点 数据节点负责数据的存储和相关具体操作，比如 CRUD、搜索、聚合。所以，数据节点对机 器配置要求比较高，首先需要有足够的磁盘空间来存储数据，其次数据操作对系统 CPU、 Memory 和 IO 的性能消耗都很大。通常随着集群的扩大，需要增加更多的数据节点来提高 可用性。指定数据节点的配置：node.data: true。 
	elasticsearch 是允许一个节点既做候选主节点也做数据节点的，但是数据节点的负载较重， 所以需要考虑将二者分离开，设置专用的候选主节点和数据节点，避免因数据节点负载重导 致主节点不响应。 
4. 客户端节点 客户端节点就是既不做候选主节点也不做数据节点的节点，只负责请求的分发、汇总等等， 但是这样的工作，其实任何一个节点都可以完成，因为在 elasticsearch 中一个集群内的节点 都可以执行任何请求，其会负责将请求转发给对应的节点进行处理。所以单独增加这样的节 点更多是为了负载均衡。指定该节点的配置为： 
	node.master: false 
	node.data: false 
5. 脑裂”问题可能的成因 
	1. 网络问题：集群间的网络延迟导致一些节点访问不到 master，认为 master 挂掉了从而选 举出新的 master，并对 master 上的分片和副本标红，分配新的主分片 
	2. 节点负载：主节点的角色既为 master 又为 data，访问量较大时可能会导致 ES 停止响应造 成大面积延迟，此时其他节点得不到主节点的响应认为主节点挂掉了，会重新选取主节点。 
	3. 内存回收：data 节点上的 ES 进程占用的内存较大，引发 JVM 的大规模内存回收，造成 ES 进程失去响应。 
	* 脑裂问题解决方案（旧版）： 
		* 角色分离：即 master 节点与 data 节点分离，限制角色；数据节点是需要承担存储 和搜索的工作的，压力会很大。所以如果该节点同时作为候选主节点和数据节点， 那么一旦选上它作为主节点了，这时主节点的工作压力将会非常大，出现脑裂现象 的概率就增加了。 
		* 减少误判：配置主节点的响应时间，在默认情况下，主节点 3 秒没有响应，其他节 点就认为主节点宕机了，那我们可以把该时间设置的长一点，该配置是： `discovery.zen.ping_timeout`
		* 选举触发：discovery.zen.minimum_master_nodes:1（默认是 1），该属性定义的是 为了形成一个集群，有主节点资格并互相连接的节点的最小数目。 
			* 一 个 有 10 节 点 的 集 群 ， 且 每 个 节 点 都 有 成 为 主 节 点 的 资 格 ， discovery.zen.minimum_master_nodes 参数设置为 6。 
			* 正常情况下，10 个节点，互相连接，大于 6，就可以形成一个集群。 
			* 若某个时刻，其中有 3 个节点断开连接。剩下 7 个节点，大于 6，继续运行之 前的集群。而断开的 3 个节点，小于 6，不能形成一个集群。 
			* 该参数就是为了防止”脑裂”的产生。 
			* 建议设置为(候选主节点数 / 2) + 1

集群结构 
以三台物理机为例。在这三台物理机上，搭建了 6 个 ES 的节点，三个 data 节点，三个 master 节点（每台物理机分别起了一个 data 和一个 master），3 个 master 节点，目的是达到（n/2） +1 等于 2 的要求，这样挂掉一台 master 后（不考虑 data），n 等于 2，满足参数，其他两 个 master 节点都认为 master 挂掉之后开始重新选举， 
master 节点上 
``` sh
node.master = true 
node.data = false 
discovery.zen.minimum_master_nodes = 2 
```
data 节点上 
``` sh
node.master = false 
node.data = true
```
![](/GuliMall/Pasted_image_20230509080535.png)

#### 集群搭建
所有之前先运行：
``` sh
sysctl -w vm.max_map_count=262144

# 我们只是测试，所以临时修改。永久修改使用下面 
# 防止 JVM 报错 
echo vm.max_map_count=262144 >> /etc/sysctl.conf sysctl -p
``` 

准备 docker 网络 
Docker 创建容器时默认采用 bridge 网络，自行分配 ip，不允许自己指定。 
在实际部署中，我们需要指定容器 ip，不允许其自行分配 ip，尤其是搭建集群时，固定 ip 是必须的。 
我们可以创建自己的 bridge 网络 ： mynet，创建容器的时候指定网络为 mynet 并指定 ip 即可。
查看网络模式 `docker network ls;` 
创建一个新的 bridge 网络 `docker network create --driver bridge --subnet=172.18.12.0/16 --gateway=172.18.1.1 mynet` 
查看网络信息 `docker network inspect mynet` 
以后使用 `--network=mynet --ip 172.18.12.x` 指定 ip

3-Master 节点创建
``` sh
for port in $(seq 1 3); \
do \
mkdir -p /mydata/elasticsearch/master-${port}/config 
mkdir -p /mydata/elasticsearch/master-${port}/data 
chmod -R 777 /mydata/elasticsearch/master-${port} 
cat << EOF >/mydata/elasticsearch/master-${port}/config/elasticsearch.yml
cluster.name: my-es #集群的名称，同一个集群该值必须设置成相同的 
node.name: es-master-${port} #该节点的名字 
node.master: true #该节点有机会成为 master 节点 
node.data: false #该节点可以存储数据 
network.host: 0.0.0.0 
http.host: 0.0.0.0 #所有 http 均可访问 
http.port: 920${port} transport.tcp.port: 930${port} 
# discovery.zen.minimum_master_nodes: 2 #设置这个参数来保证集群中的节点可以知道其 它 N 个有 master 资格的节点。官方推荐（N/2）+1，新版可忽略 
discovery.zen.ping_timeout: 10s #设置集群中自动发现其他节点时 ping 连接的超时时间 
discovery.seed_hosts: ["172.18.12.21:9301", "172.18.12.22:9302", "172.18.12.23:9303"] #设置集 群中的 Master 节点的初始列表，可以通过这些节点来自动发现其他新加入集群的节点，es7 的新增配置 
cluster.initial_master_nodes: ["172.18.12.21"] #新集群初始时的候选主节点，es7 的新增配置 
EOF
docker run --name elasticsearch-node-${port} \
-p 920${port}:920${port} -p 930${port}:930${port} \
--network=mynet --ip 172.18.12.2${port} \
-e ES_JAVA_OPTS="-Xms300m -Xmx300m" \
-v /mydata/elasticsearch/master-${port}/config/elasticsearch.yml:/usr/share/elasticsearch/config/el asticsearch.yml \
-v /mydata/elasticsearch/master-${port}/data:/usr/share/elasticsearch/data \
-v /mydata/elasticsearch/master-${port}/plugins:/usr/share/elasticsearch/plugins \
-d elasticsearch:7.4.2 
done
```

3-Data-Node 创建
``` sh
for port in $(seq 4 6); \
do \
mkdir -p /mydata/elasticsearch/node-${port}/config
mkdir -p /mydata/elasticsearch/node-${port}/data
chmod -R 777 /mydata/elasticsearch/node-${port}
cat << EOF >/mydata/elasticsearch/node-${port}/config/elasticsearch.yml
cluster.name: my-es #集群的名称，同一个集群该值必须设置成相同的
node.name: es-node-${port} #该节点的名字
node.master: false #该节点有机会成为 master 节点
node.data: true #该节点可以存储数据
network.host: 0.0.0.0 #network.publish_host: 192.168.56.10 #互相通信 ip，要设置为本机可被外界访问的 ip，否则 无法通信
http.host: 0.0.0.0 #所有 http 均可访问
http.port: 920${port} transport.tcp.port: 930${port}
# discovery.zen.minimum_master_nodes: 2 #设置这个参数来保证集群中的节点可以知道其 它 N 个有 master 资格的节点。官方推荐（N/2）+1，新版可忽略 
discovery.zen.ping_timeout: 10s #设置集群中自动发现其他节点时 ping 连接的超时时间 
discovery.seed_hosts: ["172.18.12.21:9301", "172.18.12.22:9302", "172.18.12.23:9303"] #设置集 群中的 Master 节点的初始列表，可以通过这些节点来自动发现其他新加入集群的节点，es7 的新增配置
cluster.initial_master_nodes: ["172.18.12.21"] #新集群初始时的候选主节点，es7 的新增配置
EOF
docker run --name elasticsearch-node-${port} \
-p 920${port}:920${port} -p 930${port}:930${port} \
--network=mynet --ip 172.18.12.2${port} \
-e ES_JAVA_OPTS="-Xms300m -Xmx300m" \
-v /mydata/elasticsearch/node-${port}/config/elasticsearch.yml:/usr/share/elasticsearch/config/ela sticsearch.yml \
-v /mydata/elasticsearch/node-${port}/data:/usr/share/elasticsearch/data \
-v /mydata/elasticsearch/node-${port}/plugins:/usr/share/elasticsearch/plugins \
-d elasticsearch:7.4.2
done
```

测试集群 
``` sh
http://192.168.56.10:9201/_nodes/process?pretty 查看节点状况 http://192.168.56.10:9201/_cluster/stats?pretty 查看集群状态 http://192.168.56.10:9201/_cluster/health?pretty 查看集群健康状况 http://192.168.56.10:9202/_cat/nodes 查看各个节点信息 
curl localhost:9200/_cat 
/_cat/allocation
/_cat/shards
/_cat/shards/{index}
/_cat/master
/_cat/nodes
/_cat/indices
/_cat/indices/{index}
/_cat/segments
/_cat/segments/{index}
/_cat/count
/_cat/count/{index}
/_cat/recovery
/_cat/recovery/{index}
/_cat/health
/_cat/pending_tasks
/_cat/aliases
/_cat/aliases/{alias}
/_cat/thread_pool
/_cat/plugins
/_cat/fielddata
/_cat/fielddata/{fields}
/_cat/nodeattrs
/_cat/repositories
/_cat/snapshots/{repository}
```

### RabbitMQ
集群形式
RabbiMQ 是用 Erlang 开发的，集群非常方便，因为 Erlang 天生就是一门分布式语言，但其 本身并不支持负载均衡。
RabbitMQ 集群中节点包括内存节点(RAM)、磁盘节点(Disk，消息持久化)，集群中至少有 一个 Disk 节点。
* 普通模式(默认) 
	对于普通模式，集群中各节点有相同的队列结构，但消息只会存在于集群中的一个节 点。对于消费者来说，若消息进入 A 节点的 Queue 中，当从 B 节点拉取时，RabbitMQ 会 将消息从 A 中取出，并经过 B 发送给消费者。
	应用场景：该模式各适合于消息无需持久化的场合，如日志队列。当队列非持久化，且 创建该队列的节点宕机，客户端才可以重连集群其他节点，并重新创建队列。若为持久化， 只能等故障节点恢复。
* 镜像模式
	与普通模式不同之处是消息实体会主动在镜像节点间同步，而不是在取数据时临时拉 取，高可用；该模式下，mirror queue 有一套选举算法，即 1 个 master、n 个 slaver，生产 者、消费者的请求都会转至 master。
	应用场景：可靠性要求较高场合，如下单、库存队列。
	缺点：若镜像队列过多，且消息体量大，集群内部网络带宽将会被此种同步通讯所消 耗。
（1）镜像集群也是基于普通集群，即只有先搭建普通集群，然后才能设置镜像队列。
（2）若消费过程中，master 挂掉，则选举新 master，若未来得及确认，则可能会重复消费。 

搭建集群
``` sh
mkdir /mydata/rabbitmq
cd rabbitmq/
mkdir rabbitmq01 rabbitmq02 rabbitmq03

docker run -d --hostname rabbitmq01 --name rabbitmq01 -v /mydata/rabbitmq/rabbitmq01:/var/lib/rabbitmq -p 15673:15672 -p 5673:5672 -e RABBITMQ_ERLANG_COOKIE='atguigu' rabbitmq:management

docker run -d --hostname rabbitmq02 --name rabbitmq02 -v /mydata/rabbitmq/rabbitmq02:/var/lib/rabbitmq -p 15674:15672 -p 5674:5672 -e RABBITMQ_ERLANG_COOKIE='atguigu' --link rabbitmq01:rabbitmq01 rabbitmq:management

docker run -d --hostname rabbitmq03 --name rabbitmq03 -v /mydata/rabbitmq/rabbitmq03:/var/lib/rabbitmq -p 15675:15672 -p 5675:5672 -e RABBITMQ_ERLANG_COOKIE='atguigu' --link rabbitmq01:rabbitmq01 --link rabbitmq02:rabbitmq02 rabbitmq:management

# --hostname 设置容器的主机名
# RABBITMQ_ERLANG_COOKIE 节点认证作用，部署集成时 需要同步该值 
```
节点加入集群
``` sh
# 进入第一个节点
docker exec -it rabbitmq01 /bin/bash
rabbitmqctl stop_app
rabbitmqctl reset
rabbitmqctl start_app
exit

# 进入第二个节点 
docker exec -it rabbitmq02 /bin/bash
rabbitmqctl stop_app
rabbitmqctl reset
rabbitmqctl join_cluster --ram rabbit@rabbitmq01
rabbitmqctl start_app
exit

# 进入第三个节点
docker exec -it rabbitmq03 bash
rabbitmqctl stop_app
rabbitmqctl reset
rabbitmqctl join_cluster --ram rabbit@rabbitmq01
rabbitmqctl start_app
exit
```
实现镜像集群
``` sh
docker exec -it rabbitmq01 bash
rabbitmqctl set_policy -p / ha "^" '{"ha-mode":"all","ha-sync-mode":"automatic"}'

# 查看 vhost/下面的所有 policy
rabbitmqctl list_policies -p /;

# 在 cluster 中任意节点启用策略，策略会自动同步到集群节点
rabbitmqctl set_policy-p/ha-all"^"’{“ha-mode”:“all”}’
# 策略模式 all 即复制到所有节点，包含新增节点，策略正则表达式为 “^” 表示所有匹配所 有队列名称。“^hello”表示只匹配名为 hello 开始的队列
```
 集群测试
 随便在 mq 上创建一个队列，发送一个消息，保证整个集群其他节点都有这个消息。如果 master 宕机，其他节点也能成为新的 maste

## 部署
### 基础服务
#### 如何在k8s上部署有状态应用
* 有状态服务抽取配置为 ConfigMap 
* 有状态服务必须使用 pvc 持久化数据 
* 服务集群内访问使用 DNS 提供的稳定域名
![](/GuliMall/Pasted_image_20230504110413.png)

#### 部署 MySQL
启动参照docker
``` sh
ocker run -p 3307:3306 --name mysql-master \
-v /mydata/mysql/master/log:/var/log/mysql \
-v /mydata/mysql/master/data:/var/lib/mysql \
-v /mydata/mysql/master/conf:/etc/mysql \
-e MYSQL_ROOT_PASSWORD=root \
-d mysql:5.7
```
master的conf参照
``` sh
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
# 注意：skip-name-resolve 一定要加，不然连接 mysql 会超级慢

# 添加 master 主从复制部分配置 
server_id=1 
log-bin=mysql-bin 
read-only=0 
binlog-do-db=gulimall_ums 
binlog-do-db=gulimall_pms 
binlog-do-db=gulimall_oms 
binlog-do-db=gulimall_sms 
binlog-do-db=gulimall_wms 
binlog-do-db=gulimall_admin 

replicate-ignore-db=mysql 
replicate-ignore-db=sys 
replicate-ignore-db=information_schema 
replicate-ignore-db=performance_schema
```

slave的conf参照
``` sh
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

#添加 master 主从复制部分配置 
server_id=2 
log-bin=mysql-bin 
read-only=1 
binlog-do-db=gulimall_ums 
binlog-do-db=gulimall_pms 
binlog-do-db=gulimall_oms 
binlog-do-db=gulimall_sms 
binlog-do-db=gulimall_wms 
binlog-do-db=gulimall_admin 

replicate-ignore-db=mysql 
replicate-ignore-db=sys 
replicate-ignore-db=information_schema 
replicate-ignore-db=performance_schema
```

开启同步参照
``` sh
# master节点
RANT REPLICATION SLAVE ON *.* to 'backup'@'%' identified by '123456'; 
# 查看状态
show master status\G

# savle节点
change master to master_host='192.168.56.10',master_user='backup',master_password='123456',master_log_file='mysql-bin.000001',master_log_pos=0,master_port=3307; 
# 启动从库同步 
start slave; 
# 查看从库状态 
show slave status
```

#### k8s部署Redis
略

#### k8s部署ElasticSearch
略

#### k8s部署RabbitMQ
略

#### k8s部署Nacos
略

#### k8s部署Zipkin
略

#### k8s部署Sentinel
略


### 应用服务
#### k8s部署应用的流程
![](/GuliMall/Pasted_image_20230504110446.png)

#### 生产环境配置抽取
拷贝并修改配置文件中的内容
``` yaml
spring.redis.host=redis.gulimall  
spring.cloud.sentinel.transport.dashboard=sentinel-service:8080  
spring.cloud.nacos.discovery.server-addr=nacos-service.gulimall:8848  
spring.zipkin.base-url=http://zipkin-service.gulimall:9411/  
spring.datasource.url=jdbc:mysql://mysql-master.gulimall:3306/xxx
```

#### 创建微服务dockerfile
dockerfile例子
``` sh
FROM java:8  
EXPOSE 8080  
  
VOLUME /tmp  
ADD renren-fast.jar /app.jar  
RUN bash -c 'touch /app.jar'  
ENTRYPOINT ["java","-jar","/app.jar"]
```
打包命令
``` sh 
# 打包为镜像
docker build -f Dockerfile -t docker io/leifengyang/cart v1.0 .
```

将所有服务的端口都修改为8080

为每个服务都新增Dockerfile文件
``` sh
FROM java:8  
EXPOSE 8080  
  
VOLUME /tmp  
ADD target/*.jar /app.jar  
RUN bash -c 'touch /app.jar'  
ENTRYPOINT ["java","-jar","/app.jar","--spring.profiles.active=prod"]
```

#### 创建微服务k8s部署描述文件
描述文件解释
``` yaml
kind: Deployment # 接口类型
apiVersion: v1 # 接口版本
metadata:
  name: gulimall-auth-server # Deployment名称
  namespace: gulimall # 命名空间
  labels:
    app: gulimall-auth-server # 标签
spec:
  replicas: 1 # 副本数
  selector: # 选择器
    matchLabels:
      app: gulimall-auth-server # 匹配pod标签
  template: # pod模板
    metadata: # pod元数据
      labels:
        app: gulimall-auth-server # pod模板名称标签，必填
    spec: # pod模板名称标签，必填
      containers:
        name: gulimall-auth-server # 镜像名称
        image: $REGISTRY/$DOCKERHUB_NAMESPACE/$APP_NAME:$TAG_NAME # 镜像地址
        ports:
            - containerPort: 8080 # 对service暴露端口
              protocol: TCP
        resources: # CPU内存等资源限制
            limits:
              cpu: 1000m
              memory: 500Mi
            requests:
              cpu: 10m
              memory: 10Mi
        terminationMessagePath: /dev/termination-log
        terminationMessagePolicy: File
        imagePullPolicy: Always # 一直重新拉取
        restartPolicy: Always # 自启动
      terminationGracePeriodSeconds: 30 # 中断停机时长
      dnsPolicy: ClusterFirst # DNS策略
    strategy: # 更新策略
      type: RollingUpdate
      rollingUpdate: # 若replicas为3,则整个升级,pod个数在2-4个之间
        maxUnavailable: 25% # 滚动升级时允许的最大Unavailable的pod数
        maxSurge: 25% # 更新时的最大存活数
      revisionHistoryLimit: 10 # 保留的历史版本数
      progressDeadkuneSeconds: 600 # 执行上限时间
```
描述文件
``` sh
kind: Deployment
apiVersion: v1
metadata:
  name: gulimall-auth-server
  namespace: gulimall
  labels:
    app: gulimall-auth-server
spec:
  replicas: 1
  selector:
    matchLabels:
      app: gulimall-auth-server
  template:
    metadata:
      labels:
        app: gulimall-auth-server
    spec:
      containers:
        name: gulimall-auth-server
        image: $REGISTRY/$DOCKERHUB_NAMESPACE/$APP_NAME:$TAG_NAME
        ports:
            - containerPort: 8080
              protocol: TCP
        resources:
            limits:
              cpu: 1000m
              memory: 500Mi
            requests:
              cpu: 10m
              memory: 10Mi
        terminationMessagePath: /dev/termination-log
        terminationMessagePolicy: File
        imagePullPolicy: Always
        restartPolicy: Always
      terminationGracePeriodSeconds: 30
      dnsPolicy: ClusterFirst
    strategy:
      type: RollingUpdate
      rollingUpdate:
        maxUnavailable: 25%
        maxSurge: 25%
revisionHistoryLimit: 10
progressDeadkuneSeconds: 600

---
kind: Service
apiVersion: v1
metadata:
  name: gulimall-auth-server
  namespace: gulimall
  labels:
    app: gulimall-auth-server
spec:
  ports:
    - name: http
      protocol: TCP
      port: 8080
      targetPort: 8080
      nodePort: 20001
  selector:
    app: gulimall-auth-server
  type: NodePort
  sessionAffinity: None
```


#### 理解targetPort、Port、NodePort
![](/GuliMall/Pasted_image_20230504110506.png)

## 流水线
### gitee拉取代码 & 参数化构建&环境变量
Jenkinsfile
``` 
pipeline {
  agent {
    node {
      label 'maven'
    }
  }
  
  stages {
    stage('拉取代码') {
      steps {
        git(url: 'https://gitee.com/leifengyang/gulimall.git', credentialsId: 'gitee-id', branch: 'master', changelog: true, poll: false)
        sh 'echo 正在构建 $PROJECT_NAME  版本号：$PROJECT_VERSION 将会提交给 $REGISTRY 镜像仓库'
        container('maven') {
          sh 'mvn clean install -Dmaven.test.skip=true -gs `pwd`/mvn-settings.xml'
        }

      }
    }
    stage('sonar代码质量分析') {
      steps {
        container('maven') {
          withCredentials([string(credentialsId: "$SONAR_CREDENTIAL_ID", variable: 'SONAR_TOKEN')]) {
            withSonarQubeEnv('sonar') {
              sh 'echo 当前目录 `pwd`'
              sh "mvn sonar:sonar -gs `pwd`/mvn-settings.xml -Dsonar.branch=$BRANCH_NAME -Dsonar.login=$SONAR_TOKEN"
            }
          }
          timeout(time: 1, unit: 'HOURS') {
            waitForQualityGate true
          }
        }
      }
    }
    stage('构建镜像-推送镜像') {
      steps {
        container('maven') {
          sh 'mvn -Dmaven.test.skip=true -gs `pwd`/mvn-settings.xml clean package'
          sh 'cd $PROJECT_NAME && docker build -f Dockerfile -t $REGISTRY/$DOCKERHUB_NAMESPACE/$PROJECT_NAME:SNAPSHOT-$BRANCH_NAME-$BUILD_NUMBER .'
          withCredentials([usernamePassword(passwordVariable : 'DOCKER_PASSWORD' ,usernameVariable : 'DOCKER_USERNAME' ,credentialsId : "$DOCKER_CREDENTIAL_ID" ,)]) {
            sh 'echo "$DOCKER_PASSWORD" | docker login $REGISTRY -u "$DOCKER_USERNAME" --password-stdin'
            sh 'docker tag  $REGISTRY/$DOCKERHUB_NAMESPACE/$PROJECT_NAME:SNAPSHOT-$BRANCH_NAME-$BUILD_NUMBER $REGISTRY/$DOCKERHUB_NAMESPACE/$PROJECT_NAME:latest '
            sh 'docker push  $REGISTRY/$DOCKERHUB_NAMESPACE/$PROJECT_NAME:latest '
          }
        }
      }
    }
    stage('部署到k8s') {
      steps {
        input(id: "deploy-to-dev-$PROJECT_NAME", message: "是否将 $PROJECT_NAME 部署到集群中?")
        kubernetesDeploy(configs: "$PROJECT_NAME/deploy/**", enableConfigSubstitution: true, kubeconfigId: "$KUBECONFIG_CREDENTIAL_ID")
      }
    }
    stage('发布版本'){
      when{
        expression{
          return params.PROJECT_VERSION =~ /v.*/
        }
      }
      steps {
          container ('maven') {
            input(id: 'release-image-with-tag', message: '发布当前版本镜像吗?')
            sh 'docker tag  $REGISTRY/$DOCKERHUB_NAMESPACE/$PROJECT_NAME:SNAPSHOT-$BRANCH_NAME-$BUILD_NUMBER $REGISTRY/$DOCKERHUB_NAMESPACE/$PROJECT_NAME:$PROJECT_VERSION '
            sh 'docker push  $REGISTRY/$DOCKERHUB_NAMESPACE/$PROJECT_NAME:$PROJECT_VERSION '
            withCredentials([usernamePassword(credentialsId: "$GITEE_CREDENTIAL_ID", passwordVariable: 'GIT_PASSWORD', usernameVariable: 'GIT_USERNAME')]) {
                sh 'git config --global user.email "534096094@qq.com" '
                sh 'git config --global user.name "leifengyang" '
                sh 'git tag -a $PROJECT_NAME-$PROJECT_VERSION -m "$PROJECT_VERSION" '
                sh 'git push http://$GIT_USERNAME:$GIT_PASSWORD@gitee.com/$GITEE_ACCOUNT/gulimall.git --tags --ipv4'
            }
        }
      }
    }
  }
  
  environment {
    DOCKER_CREDENTIAL_ID = 'aliyun-hub-id'
    GITEE_CREDENTIAL_ID = 'gitee-id'
    KUBECONFIG_CREDENTIAL_ID = 'demo-kubeconfig'
    REGISTRY = 'registry.cn-hangzhou.aliyuncs.com'
    DOCKERHUB_NAMESPACE = 'atguigumall'
    GITEE_ACCOUNT = 'leifengyang'
    SONAR_CREDENTIAL_ID = 'sonar-qube'
    BRANCH_NAME = 'master'
  }
  parameters {
    string(name: 'PROJECT_VERSION', defaultValue: 'v0.0Beta', description: '项目版本')
    string(name: 'PROJECT_NAME', defaultValue: 'gulimall-gateway', description: '构建模块')
  }
}
```



### Sonar代码质量分析
mvn-settings.xml
``` xml
<settings>
    <mirrors>
        <mirror>
            <id>nexus-aliyun</id>
            <mirrorOf>central</mirrorOf>
            <name>Nexus aliyun</name>
            <url>http://maven.aliyun.com/nexus/content/groups/public</url>
        </mirror>
    </mirrors>
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
</settings>
```
根路径的pom.xml
``` xml
<!--sonar.java.binaries-->  
<sonar.jacoco.reportPaths>${PWD}/./target/jacoco.exec</sonar.jacoco.reportPaths>  
<sonar.groovy.binaries>target/classes</sonar.groovy.binaries>


<!--sonar-->
<plugin>
	<groupId>org.jacoco</groupId>
	<artifactId>jacoco-maven-plugin</artifactId>
	<version>0.8.2</version>
	<configuration>
		<append>true</append>
	</configuration>
	<executions>
		<execution>
			<id>agent-for-ut</id>
			<goals>
				<goal>prepare-agent</goal>
			</goals>
		</execution>
		<execution>
			<id>agent-for-it</id>
			<goals>
				<goal>prepare-agent-integration</goal>
			</goals>
		</execution>
		<execution>
			<id>jacoco-site</id>
			<phase>verify</phase>
			<goals>
				<goal>report</goal>
			</goals>
		</execution>
	</executions>
</plugin>
<plugin>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-maven-plugin</artifactId>
	<configuration>
		<fork>true</fork>
	</configuration>
</plugin>
<plugin>
	<groupId>org.sonarsource.scanner.maven</groupId>
	<artifactId>sonar-maven-plugin</artifactId>
	<version>3.6.0.1398</version>
</plugin>
```

### 构建&推送镜像
略

### 流水线编写完成
修改各个项目中K8S的部署文件，将`$APP_NAME:$TAG_NAME`修改为`$PROJECT_NAME:$PROJECT_VERSION`
略

### 移植数据库
略

### 流水线细节优化&解决OOM
修改各个项目中K8S的部署文件，将`$PROJECT_NAME:$PROJECT_VERSION`修改为`$PROJECT_NAME:latest`

修改各个项目里K8S配置文件中nodePort的值，这个值只能在30000-32767之间

修改各个项目的Dockerfile里的启动参数，加上`"-Xms128m","-Xmx300m",`

### 流水线部署所有微服务
略

### Docker镜像服务 & 整合阿里云镜像仓库
![](/GuliMall/Pasted_image_20230504110529.png)

1. 创建项目 dockerfile 
2. 上传项目到服务器。 
3. 进入项目，构建镜像到本地仓库； 
    1) `docker build -t nginx:GA-1.0 -f ./Dockerfile .` 别忘了最后的小数点。 
    2) `docker images` 查看镜像 
    3) `docker exec -it 容器 id /bin/bash;`进入容器，修改容器 
    4) `docker commit -a “leifengyang” -m “nginxxx” 容器 id mynginx:GA-2.0 1 `
        * docker commit [OPTIONS] CONTAINER [REPOSITORY[:TAG]] 2 
        * OPTIONS 说明： 
            * -a :提交的镜像作者； 
            * -c :使用 Dockerfile 指令来创建镜像；
            * -m :提交时的说明文字；
            * -p :在 commit 时，将容器暂停。     
    5) `docker login` : 登陆到一个 Docker 镜像仓库，如果未指定镜像仓库地址，默认为官 方仓库 Docker Hub 
        * `docker login -u 用户名 -p 密码 `
    6) `docker logout` : 登出一个 Docker 镜像仓库，如果未指定镜像仓库地址，默认为官 方仓库 Docker Hub 
4. 推送镜像到 docker hub 
    1) 标记镜像，`docker tag local-image:tagname username/new-repo:tagname `
    2) 上传镜像，`docker push username/new-repo:tagname  `
5. 保存镜像，加载镜像 
    1) 可以保存镜像为 tar，使用 u 盘等设备复制到任意 docker 主机，再次加载镜像 
    2) 保存：`docker save spring-boot-docker -o /home/spring-boot-docker.tar `
    3) 加载：`docker load -i spring-boot-docker.tar `
6. 阿里云操作 
    1) 登录阿里云，密码就是开通镜像仓库时的密码 
        `docker login --username=qwertyuiopasdf_aa registry.cn-hangzhou.aliyuncs.com `
    2) 拉取镜像 
        `docker pull registry.cn-hangzhou.aliyuncs.com/atguigumall/gulimall-nginx:v1.0 `
    3) 推送镜像 
        `docker tag [ImageId] registry.cn-hangzhou.aliyuncs.com/atguigumall/gulimall-nginx:v1`
        `docker push registry.cn-hangzhou.aliyuncs.com/atguigumall/gulimall-nginx:v1

### Jenkins修改阿里云镜像仓库
略

### 部署gateway & 部署auth-server & 部署cart & 部署coupon
略

### 部署完成&bug修改
seckill服务的MyRedissonConfig
``` java
@Bean
public RedissonClient redissonClient(@Value("${spring.redis.host}")String host){
	Config config = new Config();
	config.useSingleServer().setAddress("redis://" + host + ":6379");
	RedissonClient redissonClient = Redisson.create(config);
	return redissonClient;
}
```
product服务的RedissonConfig
``` java
@Bean(destroyMethod = "shutdown")
public RedissonClient redisson(@Value("${spring.redis.host}")String host) throws IOException {
	// 1、创建配置
	Config config = new Config();
	// Redis url should start with redis:// or rediss://
	config.useSingleServer().setAddress("redis://" + host + ":6379");

	// 2、根据 Config 创建出 RedissonClient 实例
	return Redisson.create(config);
}
```

### 修改为共有仓库
略

## 最终部署
![](/GuliMall/Pasted_image_20230504110529.png)
### 第一次部署前置nginx & 创建网关与应用路由 & 商城系统上线
nginx的两个压缩包
![](/GuliMall/conf.tar.gz]]
![](/GuliMall/html.tar.gz]]
nginx的Dockerfile
``` sh
FROM nginx
MAINTAINER leifengyang
ADD html.tar.gz /usr/share/nginx/html
ADD conf.tar.gz /etc/nginx
EXPOSE 80
ENTRYPOINT nginx -g "daemon off;"
```
然后再来一波打包和推送的操作

其他操作，略

### 部署VUE项目 & 测试滚动更新部署admin-vue-app
修改前端的生产地址，在index-prod.js中，`http://192.168.56.100:31003/api`
然后构建前端项目，然后打包、上传

其他操作，略

## 线上预警监控
略

## 集群部署篇-总结
略
