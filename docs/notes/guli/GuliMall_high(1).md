---
title: GuliMall_high (1)
tags: SpringCloud,GuliMall,谷粒商城
---
# 谷粒商城
> 参考: [Java项目《谷粒商城》Java架构师 | 微服务 | 大型电商项目](https://www.bilibili.com/video/BV1np4y1C7Yf)
> [从前慢-谷粒商城篇章4](https://blog.csdn.net/unique_perfect/article/details/114685933)
> [guli-mall](https://www.yuque.com/zhangshuaiyin/guli-mall)

# 谷粒商城-高级篇
围绕商城前端的流程系统. 搜索、结算、登录, 以及周边治理、流控、链路追踪等
## ES(ElasticSearch)
官方文档: https://www.elastic.co/guide/index.html
全文搜索属于最常见的需求，开源的 Elasticsearch （以下简称 Elastic）是目前全文搜索引擎的首选。它可以快速地储存、搜索和分析海量数据。
Elastic 的底层是开源库 Lucene。但是，你没法直接用 Lucene，必须自己写代码去调用它的接口。Elastic 是 Lucene 的封装，提供了 REST API 的操作接口，开箱即用。

### 基本概念
**Index(索引)**
动词: 相当于MySQL中的insert
名词：相当于MySQL的Database

**Type类型**
在Index中，可以定义一个或多个类型
类似于MySQL的Table，每一种类型的数据放在一起

**Document文档**
保存在某个索引(Index)下，某种类型(Type)的一个数据文档(Document)，文档是json格式的，
Document就像是MySQL中的某个Table里面的内容。每一行对应的列叫属性

![/GuliaMall/1659623601145.jpg)


ElasticSearch7-去掉type概念
* 关系型数据库中两个数据表示是独立的，即使他们里面有相同名称的列也不影响使用，但ES中不是这样的。elasticsearch是基于Lucene开发的搜索引擎，而ES中不同type下名称相同的filed最终在Lucene中的处理方式是一样的。
  - 两个不同type下的两个user_name，在ES同一个索引下其实被认为是同一个filed，你必须在两个不同的type中定义相同的filed映射。否则，不同type中的相同字段名称就会在处理中出现冲突的情况，导致Lucene处理效率下降。
  - 去掉type就是为了提高ES处理数据的效率。
* Elasticsearch 7.x
  URL中的type参数为可选。比如，索引一个文档不再要求提供文档类型。
* Elasticsearch8.x
  不再支持URL中的type参数。
* 解决: 将索引从多类型迁移到单类型，每种类型文档一个独立索引

### 安装ElasticSearch, Kibana(Docker)
1. 下载镜像文件(版本间有区别, 注意版本)
    ``` shell
    # 存储和检索数据
    docker pull elasticsearch:7.4.2
    # 可视化检索数据
    docker pull kibana:7.4.2
    ```
    elasticsearch 和 kibana 版本要统一
2. 配置挂载数据文件夹
    ``` shell
    # 创建配置文件目录
    mkdir -p /mydata/elasticsearch/config
    # 创建数据目录
    mkdir -p /mydata/elasticsearch/data
    # 将/mydata/elasticsearch/文件夹中文件都可读可写, 视频后面会讲
    chmod -R 777 /mydata/elasticsearch/
    # 配置任意机器可以访问 elasticsearch
    echo "http.host: 0.0.0.0" >/mydata/elasticsearch/config/elasticsearch.yml
    ```
3. 创建实例(启动Elasticsearch)
    命令后面的 \ 是换行符，注意前面有空格
    ``` shell
    # elasticsearch.yml 要先创建, 不然会被自动创建为文件夹
    docker run --name elasticsearch -p 9200:9200 -p 9300:9300 \
      -e  "discovery.type=single-node" \
      -e ES_JAVA_OPTS="-Xms64m -Xmx512m" \
      -v /mydata/elasticsearch/config/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml \
      -v /mydata/elasticsearch/data:/usr/share/elasticsearch/data \
      -v  /mydata/elasticsearch/plugins:/usr/share/elasticsearch/plugins \
      -d elasticsearch:7.4.2  
    ```
    `-p 9200:9200 -p 9300:9300`：向外暴露两个端口，9200用于HTTP REST API请求，9300 ES 在分布式集群状态下 ES 之间的通信端口；
    `-e  "discovery.type=single-node"`：es 以单节点运行
    `-e ES_JAVA_OPTS="-Xms64m -Xmx512m"`：**设置启动占用内存，不设置可能会占用当前系统所有内存**
    `-v xxx`：挂载容器中的配置文件、数据文件、插件数据到本机的文件夹；
    `-d elasticsearch:7.4.2 `：指定要启动的镜像

    测试: 
    访问`IP:9200`(没改过配置文件的话就是: 192.168.56.10:9200), 能正常返回json就说明启动成功
4. 设置 Elasticsearch 随Docker启动
    ``` shell
    # 当前 Docker 开机自启，所以 ES 现在也是开机自启
    docker update elasticsearch --restart=always
    ```
5. 启动可视化Kibana
    ``` shell
    # 注意修改主机地址
    docker run --name kibana \
      -e ELASTICSEARCH_HOSTS=http://192.168.56.10:9200 \
      -p 5601:5601 \
      -d kibana:7.4.2
    ```
    测试: 
    访问`IP:5601`(没改过配置文件的话就是: 192.168.56.10:5601), 能正常返回打开就说明启动成功
6. 设置 Kibana 随Docker启动
    ``` shell
    # 当前 Docker 开机自启，所以 kibana 现在也是开机自启
    docker update kibana --restart=always
    ```




### ES-入门
Elasticsearch 是可以通过 `REST API` 接口来操作数据的，那么下面接通过几个接口的请求来演示它的使用。（当前虚拟机IP为192.168.56.10）
#### _cat
1. /_cat/nodes: 查看所有节点
   GET http://192.168.56.10:9200/_cat/nodes
   返回值中带`*`表示此节点是主节点
2. /_cat/health: 查看ES健康状况
   GET http://192.168.56.10:9200/_cat/health
3. /_cat/master: 查看主节点信息
   GET http://192.168.56.10:9200/_cat/master
4. /_cat/indicies: 查看所有索引
   *等价于 mysql 数据库的 show databases;*
   GET http://192.168.56.10:9200/_cat/indces


#### 新增数据(索引一个文档)
索引一个文档, 即保存一个数据，保存在哪个索引的哪个类型下（哪张数据库哪张表下），保存时用唯一标识指定
**PUT/POST `/customer/external/1`**, 注意设置为json格式
``` json
PUT http://192.168.56.10:9200/customer/external/1
POST http://192.168.56.10:9200/customer/external/1

// 在customer索引下的external类型下保存1号数据为
{
 "name":"John Doe"
}

// 接口返回
{
    "_index": "customer", // 表明该数据在哪个数据库下
    "_type": "external",  // 表明该数据在哪个类型下
    "_id": "1", // 表明被保存数据的id
    "_version": 1,  // 被保存数据的版本
    "result": "created",  // 这里是创建了一条数据，如果重新put一条数据，则该状态会变为updated，并且版本号也会发生变化。
    "_shards": {
        "total": 2,
        "successful": 1,
        "failed": 0
    },
    "_seq_no": 0,
    "_primary_term": 1
}
```
PUT和POST都可以
POST新增。如果不指定id，会自动生成id。指定id就会修改这个数据，并新增版本号；
PUT可以新增也可以修改。PUT必须指定id；由于PUT需要指定id，我们一般用来做修改操作，不指定id会报错。
唯一区分是post不指定id时永远为创建

#### 查询数据&乐观锁字段
**查看文档**
GET /customer/external/1
``` json
GET http://192.168.56.10:9200/customer/external/1

// 返回结果
{
    "_index": "customer", 
    "_type": "external",
    "_id": "1",
    "_version": 2,
    "_seq_no": 1, // 并发控制字段，每次更新都会+1，用来做乐观锁
    "_primary_term": 1, // 同上，主分片重新分配，如重启，就会变化
    "found": true,
    "_source": {  // 真正的内容
        "name": "John Doe"
    }
}
```
通过`if_seq_no=1&if_primary_term=1`，当序列号匹配的时候，才进行修改，否则不修改, 当携带数据与实际值不匹配时更新失败

实例：将id=1的数据更新为name=2，起始_seq_no=18(错误值)，_primary_term=1
``` json
// 将name更新为1
PUT http://192.168.56.10:9200/customer/external/1?if_seq_no=2&if_primary_term=1
{
 "name":"2"
}

// 返回结果
状态码为409的错误
```

#### 更新文档
``` json
POST /customer/external/1/_update
{
    "doc":{
        "name":"111"
    }
}
```
或者
``` json
POST /customer/external/1
// 注意请求体内容格式
{
    "name":"222"
}
```

不同：带有update情况下
* POST操作会对比源文档数据，如果相同不会有什么操作，文档version不增加。
* PUT操作总会重新保存并增加version版本
* POST时带_update对比元数据如果一样就不进行任何操作。

看场景：
对于大并发更新，不带update
对于大并发查询偶尔更新，带update；对比更新，重新计算分配规则
POST更新文档，带有_update

#### 删除数据(文档&索引) & bulk批量操作导入样本测试数据
DELETE /customer/external/1
DELETE /customer
> 注：elasticsearch并没有提供删除类型的操作，只提供了删除索引和文档的操作。

**删除数据**
DELETE /customer/external/1
实例：删除id=1的数据，删除后继续查询
``` json 
DELETE http://192.168.56.10:9200/customer/external/1
// 返回结果: 成功
{
    "_index": "customer",
    "_type": "external",
    "_id": "1",
    "_version": 14,
    "result": "deleted",
    "_shards": {
        "total": 2,
        "successful": 1,
        "failed": 0
    },
    "_seq_no": 22,
    "_primary_term": 6
}


// 再次执行删除
DELETE http://192.168.56.10:9200/customer/external/1
// 返回结果: 失败
{
    "_index": "customer",
    "_type": "external",
    "_id": "1",
    "_version": 15,
    "result": "not_found",
    "_shards": {
        "total": 2,
        "successful": 1,
        "failed": 0
    },
    "_seq_no": 23,
    "_primary_term": 6
}

// 再次查询
GET http://192.168.56.10:9200/customer/external/1
// 返回结果: 失败
{
    "_index": "customer",
    "_type": "external",
    "_id": "1",
    "found": false
}
```

**删除索引**
DELTE /customer
实例：删除整个costomer索引数据
``` json
// 删除前，查询所有的索引
GET http://192.168.56.10:9200/_cat/indices
// 返回结果: 所有索引
green  open .kibana_task_manager_1   fpHzUpIiRXuuMseNzGqO9w 1 0 2 0 30.4kb 30.4kb
green  open .apm-agent-configuration mA-5E7Y9SM2tPkxQjFIY2A 1 0 0 0   283b   283b
green  open .kibana_1                aN7CsIGbTzyKGgy_iKvXVg 1 0 8 0 22.8kb 22.8kb
yellow open customer                 aDw6iUCKTLCKWSAkm3x3kg 1 1 1 0  3.5kb  3.5kb

// 删除 customer 索引
DELTE http://192.168.56.10:9200/customer
// 返回结果: 成功
{
    "acknowledged": true
}

// 再次删除 customer 索引
DELTE http://192.168.56.10:9200/customer
// 返回结果: 失败, 找不到索引了
{
    "error": {
        "root_cause": [
            {
                "type": "index_not_found_exception",
                "reason": "no such index [customer]",
                "resource.type": "index_or_alias",
                "resource.id": "customer",
                "index_uuid": "_na_",
                "index": "customer"
            }
        ],
        "type": "index_not_found_exception",
        "reason": "no such index [customer]",
        "resource.type": "index_or_alias",
        "resource.id": "customer",
        "index_uuid": "_na_",
        "index": "customer"
    },
    "status": 404
}


// 删除后，再次查询所有的索引
GET http://192.168.56.10:9200/_cat/indices
// 返回结果: 没有已经被删除的索引了
green open .kibana_task_manager_1   DhtDmKrsRDOUHPJm1EFVqQ 1 0 2 0 31.3kb 31.3kb
green open .apm-agent-configuration vxzRbo9sQ1SvMtGkx6aAHQ 1 0 0 0   283b   283b
green open .kibana_1                rdJ5pejQSKWjKxRtx-EIkQ 1 0 8 3 28.8kb 28.8kb
```

**bulk批量操作导入样本测试数据**
POST /customer/external/_bulk

ES的批量操作——bulk, 匹配导入数据
``` json
POST http://192.168.56.10:9200/customer/external/_bulk
// 两行为一个整体
{"index":{"_id":"1"}}
{"name":"a"}
{"index":{"_id":"2"}}
{"name":"b"}
```
注意格式json和text均不可，要去kibana里的 Dev Tools 操作
语法格式：
{action:{metadata}}\n
{request body  }\n
{action:{metadata}}\n
{request body  }\n

实例1: 执行多条数据
``` json
POST /customer/external/_bulk
{"index":{"_id":"1"}}
{"name":"John Doe"}
{"index":{"_id":"2"}}
{"name":"John Doe"}
// 执行结果
#! Deprecation: [types removal] Specifying types in bulk requests is deprecated.
{
  "took" : 318,  //花费了多少ms
  "errors" : false, //没有发生任何错误
  "items" : [ //每个数据的结果
    {
      "index" : { //保存
        "_index" : "customer", //索引
        "_type" : "external", //类型
        "_id" : "1", //文档
        "_version" : 1, //版本
        "result" : "created", //创建
        "_shards" : {
          "total" : 2,
          "successful" : 1,
          "failed" : 0
        },
        "_seq_no" : 0,
        "_primary_term" : 1,
        "status" : 201 //新建完成
      }
    },
    {
      "index" : { //第二条记录
        "_index" : "customer",
        "_type" : "external",
        "_id" : "2",
        "_version" : 1,
        "result" : "created",
        "_shards" : {
          "total" : 2,
          "successful" : 1,
          "failed" : 0
        },
        "_seq_no" : 1,
        "_primary_term" : 1,
        "status" : 201
      }
    }
  ]
}
```
这里的批量操作，当发生某一条执行发生失败时，其他的数据仍然能够接着执行，也就是说彼此之间是独立的。

bulk api以此按顺序执行所有的action（动作）。如果一个单个的动作因任何原因失败，它将继续处理它后面剩余的动作。当bulk api返回时，它将提供每个动作的状态（与发送的顺序相同），所以您可以检查是否一个指定的动作是否失败了。

实例2：对于整个索引执行批量操作
``` json
POST /_bulk
{"delete":{"_index":"website","_type":"blog","_id":"123"}}
{"create":{"_index":"website","_type":"blog","_id":"123"}}
{"title":"my first blog post"}
{"index":{"_index":"website","_type":"blog"}}
{"title":"my second blog post"}
{"update":{"_index":"website","_type":"blog","_id":"123"}}
{"doc":{"title":"my updated blog post"}}
// 运行结果：
#! Deprecation: [types removal] Specifying types in bulk requests is deprecated.
{
  "took" : 304,
  "errors" : false,
  "items" : [
    {
      "delete" : { //删除
        "_index" : "website",
        "_type" : "blog",
        "_id" : "123",
        "_version" : 1,
        "result" : "not_found", //没有该记录
        "_shards" : {
          "total" : 2,
          "successful" : 1,
          "failed" : 0
        },
        "_seq_no" : 0,
        "_primary_term" : 1,
        "status" : 404 //没有该记录
      }
    },
    {
      "create" : {  //创建
        "_index" : "website",
        "_type" : "blog",
        "_id" : "123",
        "_version" : 2,
        "result" : "created",
        "_shards" : {
          "total" : 2,
          "successful" : 1,
          "failed" : 0
        },
        "_seq_no" : 1,
        "_primary_term" : 1,
        "status" : 201
      }
    },
    {
      "index" : {  //保存
        "_index" : "website",
        "_type" : "blog",
        "_id" : "5sKNvncBKdY1wAQmeQNo",
        "_version" : 1,
        "result" : "created",
        "_shards" : {
          "total" : 2,
          "successful" : 1,
          "failed" : 0
        },
        "_seq_no" : 2,
        "_primary_term" : 1,
        "status" : 201
      }
    },
    {
      "update" : { //更新
        "_index" : "website",
        "_type" : "blog",
        "_id" : "123",
        "_version" : 3,
        "result" : "updated",
        "_shards" : {
          "total" : 2,
          "successful" : 1,
          "failed" : 0
        },
        "_seq_no" : 3,
        "_primary_term" : 1,
        "status" : 200
      }
    }
  ]
}
```

样本测试数据
准备了一份顾客银行账户信息的虚构的JSON文档样本。每个文档都有下列的schema（模式）。
`https://gitee.com/xlh_blog/common_content/blob/master/es测试数据.json`，导入测试数据
<details>
<summary>样本测试数据</summary>  

``` json
{"index":{"_id":"1"}}
{"account_number":1,"balance":39225,"firstname":"Amber","lastname":"Duke","age":32,"gender":"M","address":"880 Holmes Lane","employer":"Pyrami","email":"amberduke@pyrami.com","city":"Brogan","state":"IL"}
{"index":{"_id":"6"}}
{"account_number":6,"balance":5686,"firstname":"Hattie","lastname":"Bond","age":36,"gender":"M","address":"671 Bristol Street","employer":"Netagy","email":"hattiebond@netagy.com","city":"Dante","state":"TN"}
{"index":{"_id":"13"}}
{"account_number":13,"balance":32838,"firstname":"Nanette","lastname":"Bates","age":28,"gender":"F","address":"789 Madison Street","employer":"Quility","email":"nanettebates@quility.com","city":"Nogal","state":"VA"}
{"index":{"_id":"18"}}
{"account_number":18,"balance":4180,"firstname":"Dale","lastname":"Adams","age":33,"gender":"M","address":"467 Hutchinson Court","employer":"Boink","email":"daleadams@boink.com","city":"Orick","state":"MD"}
{"index":{"_id":"20"}}
{"account_number":20,"balance":16418,"firstname":"Elinor","lastname":"Ratliff","age":36,"gender":"M","address":"282 Kings Place","employer":"Scentric","email":"elinorratliff@scentric.com","city":"Ribera","state":"WA"}
{"index":{"_id":"25"}}
{"account_number":25,"balance":40540,"firstname":"Virginia","lastname":"Ayala","age":39,"gender":"F","address":"171 Putnam Avenue","employer":"Filodyne","email":"virginiaayala@filodyne.com","city":"Nicholson","state":"PA"}
{"index":{"_id":"32"}}
{"account_number":32,"balance":48086,"firstname":"Dillard","lastname":"Mcpherson","age":34,"gender":"F","address":"702 Quentin Street","employer":"Quailcom","email":"dillardmcpherson@quailcom.com","city":"Veguita","state":"IN"}
{"index":{"_id":"37"}}
{"account_number":37,"balance":18612,"firstname":"Mcgee","lastname":"Mooney","age":39,"gender":"M","address":"826 Fillmore Place","employer":"Reversus","email":"mcgeemooney@reversus.com","city":"Tooleville","state":"OK"}
{"index":{"_id":"44"}}
{"account_number":44,"balance":34487,"firstname":"Aurelia","lastname":"Harding","age":37,"gender":"M","address":"502 Baycliff Terrace","employer":"Orbalix","email":"aureliaharding@orbalix.com","city":"Yardville","state":"DE"}
{"index":{"_id":"49"}}
{"account_number":49,"balance":29104,"firstname":"Fulton","lastname":"Holt","age":23,"gender":"F","address":"451 Humboldt Street","employer":"Anocha","email":"fultonholt@anocha.com","city":"Sunriver","state":"RI"}
{"index":{"_id":"51"}}
{"account_number":51,"balance":14097,"firstname":"Burton","lastname":"Meyers","age":31,"gender":"F","address":"334 River Street","employer":"Bezal","email":"burtonmeyers@bezal.com","city":"Jacksonburg","state":"MO"}
{"index":{"_id":"56"}}
{"account_number":56,"balance":14992,"firstname":"Josie","lastname":"Nelson","age":32,"gender":"M","address":"857 Tabor Court","employer":"Emtrac","email":"josienelson@emtrac.com","city":"Sunnyside","state":"UT"}
{"index":{"_id":"63"}}
{"account_number":63,"balance":6077,"firstname":"Hughes","lastname":"Owens","age":30,"gender":"F","address":"510 Sedgwick Street","employer":"Valpreal","email":"hughesowens@valpreal.com","city":"Guilford","state":"KS"}
{"index":{"_id":"68"}}
{"account_number":68,"balance":44214,"firstname":"Hall","lastname":"Key","age":25,"gender":"F","address":"927 Bay Parkway","employer":"Eventex","email":"hallkey@eventex.com","city":"Shawmut","state":"CA"}
{"index":{"_id":"70"}}
{"account_number":70,"balance":38172,"firstname":"Deidre","lastname":"Thompson","age":33,"gender":"F","address":"685 School Lane","employer":"Netplode","email":"deidrethompson@netplode.com","city":"Chestnut","state":"GA"}
{"index":{"_id":"75"}}
{"account_number":75,"balance":40500,"firstname":"Sandoval","lastname":"Kramer","age":22,"gender":"F","address":"166 Irvington Place","employer":"Overfork","email":"sandovalkramer@overfork.com","city":"Limestone","state":"NH"}
{"index":{"_id":"82"}}
{"account_number":82,"balance":41412,"firstname":"Concetta","lastname":"Barnes","age":39,"gender":"F","address":"195 Bayview Place","employer":"Fitcore","email":"concettabarnes@fitcore.com","city":"Summerfield","state":"NC"}
{"index":{"_id":"87"}}
{"account_number":87,"balance":1133,"firstname":"Hewitt","lastname":"Kidd","age":22,"gender":"M","address":"446 Halleck Street","employer":"Isologics","email":"hewittkidd@isologics.com","city":"Coalmont","state":"ME"}
{"index":{"_id":"94"}}
{"account_number":94,"balance":41060,"firstname":"Brittany","lastname":"Cabrera","age":30,"gender":"F","address":"183 Kathleen Court","employer":"Mixers","email":"brittanycabrera@mixers.com","city":"Cornucopia","state":"AZ"}
{"index":{"_id":"99"}}
{"account_number":99,"balance":47159,"firstname":"Ratliff","lastname":"Heath","age":39,"gender":"F","address":"806 Rockwell Place","employer":"Zappix","email":"ratliffheath@zappix.com","city":"Shaft","state":"ND"}
{"index":{"_id":"102"}}
{"account_number":102,"balance":29712,"firstname":"Dena","lastname":"Olson","age":27,"gender":"F","address":"759 Newkirk Avenue","employer":"Hinway","email":"denaolson@hinway.com","city":"Choctaw","state":"NJ"}
{"index":{"_id":"107"}}
{"account_number":107,"balance":48844,"firstname":"Randi","lastname":"Rich","age":28,"gender":"M","address":"694 Jefferson Street","employer":"Netplax","email":"randirich@netplax.com","city":"Bellfountain","state":"SC"}
{"index":{"_id":"114"}}
{"account_number":114,"balance":43045,"firstname":"Josephine","lastname":"Joseph","age":31,"gender":"F","address":"451 Oriental Court","employer":"Turnabout","email":"josephinejoseph@turnabout.com","city":"Sedley","state":"AL"}
{"index":{"_id":"119"}}
{"account_number":119,"balance":49222,"firstname":"Laverne","lastname":"Johnson","age":28,"gender":"F","address":"302 Howard Place","employer":"Senmei","email":"lavernejohnson@senmei.com","city":"Herlong","state":"DC"}
{"index":{"_id":"121"}}
{"account_number":121,"balance":19594,"firstname":"Acevedo","lastname":"Dorsey","age":32,"gender":"M","address":"479 Nova Court","employer":"Netropic","email":"acevedodorsey@netropic.com","city":"Islandia","state":"CT"}
{"index":{"_id":"126"}}
{"account_number":126,"balance":3607,"firstname":"Effie","lastname":"Gates","age":39,"gender":"F","address":"620 National Drive","employer":"Digitalus","email":"effiegates@digitalus.com","city":"Blodgett","state":"MD"}
{"index":{"_id":"133"}}
{"account_number":133,"balance":26135,"firstname":"Deena","lastname":"Richmond","age":36,"gender":"F","address":"646 Underhill Avenue","employer":"Sunclipse","email":"deenarichmond@sunclipse.com","city":"Austinburg","state":"SC"}
{"index":{"_id":"138"}}
{"account_number":138,"balance":9006,"firstname":"Daniel","lastname":"Arnold","age":39,"gender":"F","address":"422 Malbone Street","employer":"Ecstasia","email":"danielarnold@ecstasia.com","city":"Gardiner","state":"MO"}
{"index":{"_id":"140"}}
{"account_number":140,"balance":26696,"firstname":"Cotton","lastname":"Christensen","age":32,"gender":"M","address":"878 Schermerhorn Street","employer":"Prowaste","email":"cottonchristensen@prowaste.com","city":"Mayfair","state":"LA"}
{"index":{"_id":"145"}}
{"account_number":145,"balance":47406,"firstname":"Rowena","lastname":"Wilkinson","age":32,"gender":"M","address":"891 Elton Street","employer":"Asimiline","email":"rowenawilkinson@asimiline.com","city":"Ripley","state":"NH"}
{"index":{"_id":"152"}}
{"account_number":152,"balance":8088,"firstname":"Wolfe","lastname":"Rocha","age":21,"gender":"M","address":"457 Guernsey Street","employer":"Hivedom","email":"wolferocha@hivedom.com","city":"Adelino","state":"MS"}
{"index":{"_id":"157"}}
{"account_number":157,"balance":39868,"firstname":"Claudia","lastname":"Terry","age":20,"gender":"F","address":"132 Gunnison Court","employer":"Lumbrex","email":"claudiaterry@lumbrex.com","city":"Castleton","state":"MD"}
{"index":{"_id":"164"}}
{"account_number":164,"balance":9101,"firstname":"Cummings","lastname":"Little","age":26,"gender":"F","address":"308 Schaefer Street","employer":"Comtrak","email":"cummingslittle@comtrak.com","city":"Chaparrito","state":"WI"}
{"index":{"_id":"169"}}
{"account_number":169,"balance":45953,"firstname":"Hollie","lastname":"Osborn","age":34,"gender":"M","address":"671 Seaview Court","employer":"Musaphics","email":"hollieosborn@musaphics.com","city":"Hanover","state":"GA"}
{"index":{"_id":"171"}}
{"account_number":171,"balance":7091,"firstname":"Nelda","lastname":"Hopper","age":39,"gender":"M","address":"742 Prospect Place","employer":"Equicom","email":"neldahopper@equicom.com","city":"Finderne","state":"SC"}
{"index":{"_id":"176"}}
{"account_number":176,"balance":18607,"firstname":"Kemp","lastname":"Walters","age":28,"gender":"F","address":"906 Howard Avenue","employer":"Eyewax","email":"kempwalters@eyewax.com","city":"Why","state":"KY"}
{"index":{"_id":"183"}}
{"account_number":183,"balance":14223,"firstname":"Hudson","lastname":"English","age":26,"gender":"F","address":"823 Herkimer Place","employer":"Xinware","email":"hudsonenglish@xinware.com","city":"Robbins","state":"ND"}
{"index":{"_id":"188"}}
{"account_number":188,"balance":41504,"firstname":"Tia","lastname":"Miranda","age":24,"gender":"F","address":"583 Ainslie Street","employer":"Jasper","email":"tiamiranda@jasper.com","city":"Summerset","state":"UT"}
{"index":{"_id":"190"}}
{"account_number":190,"balance":3150,"firstname":"Blake","lastname":"Davidson","age":30,"gender":"F","address":"636 Diamond Street","employer":"Quantasis","email":"blakedavidson@quantasis.com","city":"Crumpler","state":"KY"}
{"index":{"_id":"195"}}
{"account_number":195,"balance":5025,"firstname":"Kaye","lastname":"Gibson","age":31,"gender":"M","address":"955 Hopkins Street","employer":"Zork","email":"kayegibson@zork.com","city":"Ola","state":"WY"}
{"index":{"_id":"203"}}
{"account_number":203,"balance":21890,"firstname":"Eve","lastname":"Wyatt","age":33,"gender":"M","address":"435 Furman Street","employer":"Assitia","email":"evewyatt@assitia.com","city":"Jamestown","state":"MN"}
{"index":{"_id":"208"}}
{"account_number":208,"balance":40760,"firstname":"Garcia","lastname":"Hess","age":26,"gender":"F","address":"810 Nostrand Avenue","employer":"Quiltigen","email":"garciahess@quiltigen.com","city":"Brooktrails","state":"GA"}
{"index":{"_id":"210"}}
{"account_number":210,"balance":33946,"firstname":"Cherry","lastname":"Carey","age":24,"gender":"M","address":"539 Tiffany Place","employer":"Martgo","email":"cherrycarey@martgo.com","city":"Fairacres","state":"AK"}
{"index":{"_id":"215"}}
{"account_number":215,"balance":37427,"firstname":"Copeland","lastname":"Solomon","age":20,"gender":"M","address":"741 McDonald Avenue","employer":"Recognia","email":"copelandsolomon@recognia.com","city":"Edmund","state":"ME"}
{"index":{"_id":"222"}}
{"account_number":222,"balance":14764,"firstname":"Rachelle","lastname":"Rice","age":36,"gender":"M","address":"333 Narrows Avenue","employer":"Enaut","email":"rachellerice@enaut.com","city":"Wright","state":"AZ"}
{"index":{"_id":"227"}}
{"account_number":227,"balance":19780,"firstname":"Coleman","lastname":"Berg","age":22,"gender":"M","address":"776 Little Street","employer":"Exoteric","email":"colemanberg@exoteric.com","city":"Eagleville","state":"WV"}
{"index":{"_id":"234"}}
{"account_number":234,"balance":44207,"firstname":"Betty","lastname":"Hall","age":37,"gender":"F","address":"709 Garfield Place","employer":"Miraclis","email":"bettyhall@miraclis.com","city":"Bendon","state":"NY"}
{"index":{"_id":"239"}}
{"account_number":239,"balance":25719,"firstname":"Chang","lastname":"Boyer","age":36,"gender":"M","address":"895 Brigham Street","employer":"Qaboos","email":"changboyer@qaboos.com","city":"Belgreen","state":"NH"}
{"index":{"_id":"241"}}
{"account_number":241,"balance":25379,"firstname":"Schroeder","lastname":"Harrington","age":26,"gender":"M","address":"610 Tapscott Avenue","employer":"Otherway","email":"schroederharrington@otherway.com","city":"Ebro","state":"TX"}
{"index":{"_id":"246"}}
{"account_number":246,"balance":28405,"firstname":"Katheryn","lastname":"Foster","age":21,"gender":"F","address":"259 Kane Street","employer":"Quantalia","email":"katherynfoster@quantalia.com","city":"Bath","state":"TX"}
{"index":{"_id":"253"}}
{"account_number":253,"balance":20240,"firstname":"Melissa","lastname":"Gould","age":31,"gender":"M","address":"440 Fuller Place","employer":"Buzzopia","email":"melissagould@buzzopia.com","city":"Lumberton","state":"MD"}
{"index":{"_id":"258"}}
{"account_number":258,"balance":5712,"firstname":"Lindsey","lastname":"Hawkins","age":37,"gender":"M","address":"706 Frost Street","employer":"Enormo","email":"lindseyhawkins@enormo.com","city":"Gardners","state":"AK"}
{"index":{"_id":"260"}}
{"account_number":260,"balance":2726,"firstname":"Kari","lastname":"Skinner","age":30,"gender":"F","address":"735 Losee Terrace","employer":"Singavera","email":"kariskinner@singavera.com","city":"Rushford","state":"WV"}
{"index":{"_id":"265"}}
{"account_number":265,"balance":46910,"firstname":"Marion","lastname":"Schneider","age":26,"gender":"F","address":"574 Everett Avenue","employer":"Evidends","email":"marionschneider@evidends.com","city":"Maplewood","state":"WY"}
{"index":{"_id":"272"}}
{"account_number":272,"balance":19253,"firstname":"Lilly","lastname":"Morgan","age":25,"gender":"F","address":"689 Fleet Street","employer":"Biolive","email":"lillymorgan@biolive.com","city":"Sunbury","state":"OH"}
{"index":{"_id":"277"}}
{"account_number":277,"balance":29564,"firstname":"Romero","lastname":"Lott","age":31,"gender":"M","address":"456 Danforth Street","employer":"Plasto","email":"romerolott@plasto.com","city":"Vincent","state":"VT"}
{"index":{"_id":"284"}}
{"account_number":284,"balance":22806,"firstname":"Randolph","lastname":"Banks","age":29,"gender":"M","address":"875 Hamilton Avenue","employer":"Caxt","email":"randolphbanks@caxt.com","city":"Crawfordsville","state":"WA"}
{"index":{"_id":"289"}}
{"account_number":289,"balance":7798,"firstname":"Blair","lastname":"Church","age":29,"gender":"M","address":"370 Sutton Street","employer":"Cubix","email":"blairchurch@cubix.com","city":"Nile","state":"NH"}
{"index":{"_id":"291"}}
{"account_number":291,"balance":19955,"firstname":"Lynn","lastname":"Pollard","age":40,"gender":"F","address":"685 Pierrepont Street","employer":"Slambda","email":"lynnpollard@slambda.com","city":"Mappsville","state":"ID"}
{"index":{"_id":"296"}}
{"account_number":296,"balance":24606,"firstname":"Rosa","lastname":"Oliver","age":34,"gender":"M","address":"168 Woodbine Street","employer":"Idetica","email":"rosaoliver@idetica.com","city":"Robinson","state":"WY"}
{"index":{"_id":"304"}}
{"account_number":304,"balance":28647,"firstname":"Palmer","lastname":"Clark","age":35,"gender":"M","address":"866 Boulevard Court","employer":"Maximind","email":"palmerclark@maximind.com","city":"Avalon","state":"NH"}
{"index":{"_id":"309"}}
{"account_number":309,"balance":3830,"firstname":"Rosemarie","lastname":"Nieves","age":30,"gender":"M","address":"206 Alice Court","employer":"Zounds","email":"rosemarienieves@zounds.com","city":"Ferney","state":"AR"}
{"index":{"_id":"311"}}
{"account_number":311,"balance":13388,"firstname":"Vinson","lastname":"Ballard","age":23,"gender":"F","address":"960 Glendale Court","employer":"Gynk","email":"vinsonballard@gynk.com","city":"Fairforest","state":"WY"}
{"index":{"_id":"316"}}
{"account_number":316,"balance":8214,"firstname":"Anita","lastname":"Ewing","age":32,"gender":"M","address":"396 Lombardy Street","employer":"Panzent","email":"anitaewing@panzent.com","city":"Neahkahnie","state":"WY"}
{"index":{"_id":"323"}}
{"account_number":323,"balance":42230,"firstname":"Chelsea","lastname":"Gamble","age":34,"gender":"F","address":"356 Dare Court","employer":"Isosphere","email":"chelseagamble@isosphere.com","city":"Dundee","state":"MD"}
{"index":{"_id":"328"}}
{"account_number":328,"balance":12523,"firstname":"Good","lastname":"Campbell","age":27,"gender":"F","address":"438 Hicks Street","employer":"Gracker","email":"goodcampbell@gracker.com","city":"Marion","state":"CA"}
{"index":{"_id":"330"}}
{"account_number":330,"balance":41620,"firstname":"Yvette","lastname":"Browning","age":34,"gender":"F","address":"431 Beekman Place","employer":"Marketoid","email":"yvettebrowning@marketoid.com","city":"Talpa","state":"CO"}
{"index":{"_id":"335"}}
{"account_number":335,"balance":35433,"firstname":"Vera","lastname":"Hansen","age":24,"gender":"M","address":"252 Bushwick Avenue","employer":"Zanilla","email":"verahansen@zanilla.com","city":"Manila","state":"TN"}
{"index":{"_id":"342"}}
{"account_number":342,"balance":33670,"firstname":"Vivian","lastname":"Wells","age":36,"gender":"M","address":"570 Cobek Court","employer":"Nutralab","email":"vivianwells@nutralab.com","city":"Fontanelle","state":"OK"}
{"index":{"_id":"347"}}
{"account_number":347,"balance":36038,"firstname":"Gould","lastname":"Carson","age":24,"gender":"F","address":"784 Pulaski Street","employer":"Mobildata","email":"gouldcarson@mobildata.com","city":"Goochland","state":"MI"}
{"index":{"_id":"354"}}
{"account_number":354,"balance":21294,"firstname":"Kidd","lastname":"Mclean","age":22,"gender":"M","address":"691 Saratoga Avenue","employer":"Ronbert","email":"kiddmclean@ronbert.com","city":"Tioga","state":"ME"}
{"index":{"_id":"359"}}
{"account_number":359,"balance":29927,"firstname":"Vanessa","lastname":"Harvey","age":28,"gender":"F","address":"679 Rutledge Street","employer":"Zentime","email":"vanessaharvey@zentime.com","city":"Williston","state":"IL"}
{"index":{"_id":"361"}}
{"account_number":361,"balance":23659,"firstname":"Noreen","lastname":"Shelton","age":36,"gender":"M","address":"702 Tillary Street","employer":"Medmex","email":"noreenshelton@medmex.com","city":"Derwood","state":"NH"}
{"index":{"_id":"366"}}
{"account_number":366,"balance":42368,"firstname":"Lydia","lastname":"Cooke","age":31,"gender":"M","address":"470 Coleman Street","employer":"Comstar","email":"lydiacooke@comstar.com","city":"Datil","state":"TN"}
{"index":{"_id":"373"}}
{"account_number":373,"balance":9671,"firstname":"Simpson","lastname":"Carpenter","age":21,"gender":"M","address":"837 Horace Court","employer":"Snips","email":"simpsoncarpenter@snips.com","city":"Tolu","state":"MA"}
{"index":{"_id":"378"}}
{"account_number":378,"balance":27100,"firstname":"Watson","lastname":"Simpson","age":36,"gender":"F","address":"644 Thomas Street","employer":"Wrapture","email":"watsonsimpson@wrapture.com","city":"Keller","state":"TX"}
{"index":{"_id":"380"}}
{"account_number":380,"balance":35628,"firstname":"Fernandez","lastname":"Reid","age":33,"gender":"F","address":"154 Melba Court","employer":"Cosmosis","email":"fernandezreid@cosmosis.com","city":"Boyd","state":"NE"}
{"index":{"_id":"385"}}
{"account_number":385,"balance":11022,"firstname":"Rosalinda","lastname":"Valencia","age":22,"gender":"M","address":"933 Lloyd Street","employer":"Zoarere","email":"rosalindavalencia@zoarere.com","city":"Waverly","state":"GA"}
{"index":{"_id":"392"}}
{"account_number":392,"balance":31613,"firstname":"Dotson","lastname":"Dean","age":35,"gender":"M","address":"136 Ford Street","employer":"Petigems","email":"dotsondean@petigems.com","city":"Chical","state":"SD"}
{"index":{"_id":"397"}}
{"account_number":397,"balance":37418,"firstname":"Leonard","lastname":"Gray","age":36,"gender":"F","address":"840 Morgan Avenue","employer":"Recritube","email":"leonardgray@recritube.com","city":"Edenburg","state":"AL"}
{"index":{"_id":"400"}}
{"account_number":400,"balance":20685,"firstname":"Kane","lastname":"King","age":21,"gender":"F","address":"405 Cornelia Street","employer":"Tri@Tribalog","email":"kaneking@tri@tribalog.com","city":"Gulf","state":"VT"}
{"index":{"_id":"405"}}
{"account_number":405,"balance":5679,"firstname":"Strickland","lastname":"Fuller","age":26,"gender":"M","address":"990 Concord Street","employer":"Digique","email":"stricklandfuller@digique.com","city":"Southmont","state":"NV"}
{"index":{"_id":"412"}}
{"account_number":412,"balance":27436,"firstname":"Ilene","lastname":"Abbott","age":26,"gender":"M","address":"846 Vine Street","employer":"Typhonica","email":"ileneabbott@typhonica.com","city":"Cedarville","state":"VT"}
{"index":{"_id":"417"}}
{"account_number":417,"balance":1788,"firstname":"Wheeler","lastname":"Ayers","age":35,"gender":"F","address":"677 Hope Street","employer":"Fortean","email":"wheelerayers@fortean.com","city":"Ironton","state":"PA"}
{"index":{"_id":"424"}}
{"account_number":424,"balance":36818,"firstname":"Tracie","lastname":"Gregory","age":34,"gender":"M","address":"112 Hunterfly Place","employer":"Comstruct","email":"traciegregory@comstruct.com","city":"Onton","state":"TN"}
{"index":{"_id":"429"}}
{"account_number":429,"balance":46970,"firstname":"Cantu","lastname":"Lindsey","age":31,"gender":"M","address":"404 Willoughby Avenue","employer":"Inquala","email":"cantulindsey@inquala.com","city":"Cowiche","state":"IA"}
{"index":{"_id":"431"}}
{"account_number":431,"balance":13136,"firstname":"Laurie","lastname":"Shaw","age":26,"gender":"F","address":"263 Aviation Road","employer":"Zillanet","email":"laurieshaw@zillanet.com","city":"Harmon","state":"WV"}
{"index":{"_id":"436"}}
{"account_number":436,"balance":27585,"firstname":"Alexander","lastname":"Sargent","age":23,"gender":"M","address":"363 Albemarle Road","employer":"Fangold","email":"alexandersargent@fangold.com","city":"Calpine","state":"OR"}
{"index":{"_id":"443"}}
{"account_number":443,"balance":7588,"firstname":"Huff","lastname":"Thomas","age":23,"gender":"M","address":"538 Erskine Loop","employer":"Accufarm","email":"huffthomas@accufarm.com","city":"Corinne","state":"AL"}
{"index":{"_id":"448"}}
{"account_number":448,"balance":22776,"firstname":"Adriana","lastname":"Mcfadden","age":35,"gender":"F","address":"984 Woodside Avenue","employer":"Telequiet","email":"adrianamcfadden@telequiet.com","city":"Darrtown","state":"WI"}
{"index":{"_id":"450"}}
{"account_number":450,"balance":2643,"firstname":"Bradford","lastname":"Nielsen","age":25,"gender":"M","address":"487 Keen Court","employer":"Exovent","email":"bradfordnielsen@exovent.com","city":"Hamilton","state":"DE"}
{"index":{"_id":"455"}}
{"account_number":455,"balance":39556,"firstname":"Lynn","lastname":"Tran","age":36,"gender":"M","address":"741 Richmond Street","employer":"Optyk","email":"lynntran@optyk.com","city":"Clinton","state":"WV"}
{"index":{"_id":"462"}}
{"account_number":462,"balance":10871,"firstname":"Calderon","lastname":"Day","age":27,"gender":"M","address":"810 Milford Street","employer":"Cofine","email":"calderonday@cofine.com","city":"Kula","state":"OK"}
{"index":{"_id":"467"}}
{"account_number":467,"balance":6312,"firstname":"Angelica","lastname":"May","age":32,"gender":"F","address":"384 Karweg Place","employer":"Keeg","email":"angelicamay@keeg.com","city":"Tetherow","state":"IA"}
{"index":{"_id":"474"}}
{"account_number":474,"balance":35896,"firstname":"Obrien","lastname":"Walton","age":40,"gender":"F","address":"192 Ide Court","employer":"Suremax","email":"obrienwalton@suremax.com","city":"Crucible","state":"UT"}
{"index":{"_id":"479"}}
{"account_number":479,"balance":31865,"firstname":"Cameron","lastname":"Ross","age":40,"gender":"M","address":"904 Bouck Court","employer":"Telpod","email":"cameronross@telpod.com","city":"Nord","state":"MO"}
{"index":{"_id":"481"}}
{"account_number":481,"balance":20024,"firstname":"Lina","lastname":"Stanley","age":33,"gender":"M","address":"361 Hanover Place","employer":"Strozen","email":"linastanley@strozen.com","city":"Wyoming","state":"NC"}
{"index":{"_id":"486"}}
{"account_number":486,"balance":35902,"firstname":"Dixie","lastname":"Fuentes","age":22,"gender":"F","address":"991 Applegate Court","employer":"Portico","email":"dixiefuentes@portico.com","city":"Salix","state":"VA"}
{"index":{"_id":"493"}}
{"account_number":493,"balance":5871,"firstname":"Campbell","lastname":"Best","age":24,"gender":"M","address":"297 Friel Place","employer":"Fanfare","email":"campbellbest@fanfare.com","city":"Kidder","state":"GA"}
{"index":{"_id":"498"}}
{"account_number":498,"balance":10516,"firstname":"Stella","lastname":"Hinton","age":39,"gender":"F","address":"649 Columbia Place","employer":"Flyboyz","email":"stellahinton@flyboyz.com","city":"Crenshaw","state":"SC"}
{"index":{"_id":"501"}}
{"account_number":501,"balance":16572,"firstname":"Kelley","lastname":"Ochoa","age":36,"gender":"M","address":"451 Clifton Place","employer":"Bluplanet","email":"kelleyochoa@bluplanet.com","city":"Gouglersville","state":"CT"}
{"index":{"_id":"506"}}
{"account_number":506,"balance":43440,"firstname":"Davidson","lastname":"Salas","age":28,"gender":"M","address":"731 Cleveland Street","employer":"Sequitur","email":"davidsonsalas@sequitur.com","city":"Lloyd","state":"ME"}
{"index":{"_id":"513"}}
{"account_number":513,"balance":30040,"firstname":"Maryellen","lastname":"Rose","age":37,"gender":"F","address":"428 Durland Place","employer":"Waterbaby","email":"maryellenrose@waterbaby.com","city":"Kiskimere","state":"RI"}
{"index":{"_id":"518"}}
{"account_number":518,"balance":48954,"firstname":"Finch","lastname":"Curtis","age":29,"gender":"F","address":"137 Ryder Street","employer":"Viagrand","email":"finchcurtis@viagrand.com","city":"Riverton","state":"MO"}
{"index":{"_id":"520"}}
{"account_number":520,"balance":27987,"firstname":"Brandy","lastname":"Calhoun","age":32,"gender":"M","address":"818 Harden Street","employer":"Maxemia","email":"brandycalhoun@maxemia.com","city":"Sidman","state":"OR"}
{"index":{"_id":"525"}}
{"account_number":525,"balance":23545,"firstname":"Holly","lastname":"Miles","age":25,"gender":"M","address":"746 Ludlam Place","employer":"Xurban","email":"hollymiles@xurban.com","city":"Harold","state":"AR"}
{"index":{"_id":"532"}}
{"account_number":532,"balance":17207,"firstname":"Hardin","lastname":"Kirk","age":26,"gender":"M","address":"268 Canarsie Road","employer":"Exposa","email":"hardinkirk@exposa.com","city":"Stouchsburg","state":"IL"}
{"index":{"_id":"537"}}
{"account_number":537,"balance":31069,"firstname":"Morin","lastname":"Frost","age":29,"gender":"M","address":"910 Lake Street","employer":"Primordia","email":"morinfrost@primordia.com","city":"Rivera","state":"DE"}
{"index":{"_id":"544"}}
{"account_number":544,"balance":41735,"firstname":"Short","lastname":"Dennis","age":21,"gender":"F","address":"908 Glen Street","employer":"Minga","email":"shortdennis@minga.com","city":"Dale","state":"KY"}
{"index":{"_id":"549"}}
{"account_number":549,"balance":1932,"firstname":"Jacqueline","lastname":"Maxwell","age":40,"gender":"M","address":"444 Schenck Place","employer":"Fuelworks","email":"jacquelinemaxwell@fuelworks.com","city":"Oretta","state":"OR"}
{"index":{"_id":"551"}}
{"account_number":551,"balance":21732,"firstname":"Milagros","lastname":"Travis","age":27,"gender":"F","address":"380 Murdock Court","employer":"Sloganaut","email":"milagrostravis@sloganaut.com","city":"Homeland","state":"AR"}
{"index":{"_id":"556"}}
{"account_number":556,"balance":36420,"firstname":"Collier","lastname":"Odonnell","age":35,"gender":"M","address":"591 Nolans Lane","employer":"Sultraxin","email":"collierodonnell@sultraxin.com","city":"Fulford","state":"MD"}
{"index":{"_id":"563"}}
{"account_number":563,"balance":43403,"firstname":"Morgan","lastname":"Torres","age":30,"gender":"F","address":"672 Belvidere Street","employer":"Quonata","email":"morgantorres@quonata.com","city":"Hollymead","state":"KY"}
{"index":{"_id":"568"}}
{"account_number":568,"balance":36628,"firstname":"Lesa","lastname":"Maynard","age":29,"gender":"F","address":"295 Whitty Lane","employer":"Coash","email":"lesamaynard@coash.com","city":"Broadlands","state":"VT"}
{"index":{"_id":"570"}}
{"account_number":570,"balance":26751,"firstname":"Church","lastname":"Mercado","age":24,"gender":"F","address":"892 Wyckoff Street","employer":"Xymonk","email":"churchmercado@xymonk.com","city":"Gloucester","state":"KY"}
{"index":{"_id":"575"}}
{"account_number":575,"balance":12588,"firstname":"Buchanan","lastname":"Pope","age":39,"gender":"M","address":"581 Sumner Place","employer":"Stucco","email":"buchananpope@stucco.com","city":"Ellerslie","state":"MD"}
{"index":{"_id":"582"}}
{"account_number":582,"balance":33371,"firstname":"Manning","lastname":"Guthrie","age":24,"gender":"F","address":"271 Jodie Court","employer":"Xerex","email":"manningguthrie@xerex.com","city":"Breinigsville","state":"NM"}
{"index":{"_id":"587"}}
{"account_number":587,"balance":3468,"firstname":"Carly","lastname":"Johns","age":33,"gender":"M","address":"390 Noll Street","employer":"Gallaxia","email":"carlyjohns@gallaxia.com","city":"Emison","state":"DC"}
{"index":{"_id":"594"}}
{"account_number":594,"balance":28194,"firstname":"Golden","lastname":"Donovan","age":26,"gender":"M","address":"199 Jewel Street","employer":"Organica","email":"goldendonovan@organica.com","city":"Macdona","state":"RI"}
{"index":{"_id":"599"}}
{"account_number":599,"balance":11944,"firstname":"Joanna","lastname":"Jennings","age":36,"gender":"F","address":"318 Irving Street","employer":"Extremo","email":"joannajennings@extremo.com","city":"Bartley","state":"MI"}
{"index":{"_id":"602"}}
{"account_number":602,"balance":38699,"firstname":"Mcgowan","lastname":"Mcclain","age":33,"gender":"M","address":"361 Stoddard Place","employer":"Oatfarm","email":"mcgowanmcclain@oatfarm.com","city":"Kapowsin","state":"MI"}
{"index":{"_id":"607"}}
{"account_number":607,"balance":38350,"firstname":"White","lastname":"Small","age":38,"gender":"F","address":"736 Judge Street","employer":"Immunics","email":"whitesmall@immunics.com","city":"Fairfield","state":"HI"}
{"index":{"_id":"614"}}
{"account_number":614,"balance":13157,"firstname":"Salazar","lastname":"Howard","age":35,"gender":"F","address":"847 Imlay Street","employer":"Retrack","email":"salazarhoward@retrack.com","city":"Grill","state":"FL"}
{"index":{"_id":"619"}}
{"account_number":619,"balance":48755,"firstname":"Grimes","lastname":"Reynolds","age":36,"gender":"M","address":"378 Denton Place","employer":"Frenex","email":"grimesreynolds@frenex.com","city":"Murillo","state":"LA"}
{"index":{"_id":"621"}}
{"account_number":621,"balance":35480,"firstname":"Leslie","lastname":"Sloan","age":26,"gender":"F","address":"336 Kansas Place","employer":"Dancity","email":"lesliesloan@dancity.com","city":"Corriganville","state":"AR"}
{"index":{"_id":"626"}}
{"account_number":626,"balance":19498,"firstname":"Ava","lastname":"Richardson","age":31,"gender":"F","address":"666 Nautilus Avenue","employer":"Cinaster","email":"avarichardson@cinaster.com","city":"Sutton","state":"AL"}
{"index":{"_id":"633"}}
{"account_number":633,"balance":35874,"firstname":"Conner","lastname":"Ramos","age":34,"gender":"M","address":"575 Agate Court","employer":"Insource","email":"connerramos@insource.com","city":"Madaket","state":"OK"}
{"index":{"_id":"638"}}
{"account_number":638,"balance":2658,"firstname":"Bridget","lastname":"Gallegos","age":31,"gender":"M","address":"383 Wogan Terrace","employer":"Songlines","email":"bridgetgallegos@songlines.com","city":"Linganore","state":"WA"}
{"index":{"_id":"640"}}
{"account_number":640,"balance":35596,"firstname":"Candace","lastname":"Hancock","age":25,"gender":"M","address":"574 Riverdale Avenue","employer":"Animalia","email":"candacehancock@animalia.com","city":"Blandburg","state":"KY"}
{"index":{"_id":"645"}}
{"account_number":645,"balance":29362,"firstname":"Edwina","lastname":"Hutchinson","age":26,"gender":"F","address":"892 Pacific Street","employer":"Essensia","email":"edwinahutchinson@essensia.com","city":"Dowling","state":"NE"}
{"index":{"_id":"652"}}
{"account_number":652,"balance":17363,"firstname":"Bonner","lastname":"Garner","age":26,"gender":"M","address":"219 Grafton Street","employer":"Utarian","email":"bonnergarner@utarian.com","city":"Vandiver","state":"PA"}
{"index":{"_id":"657"}}
{"account_number":657,"balance":40475,"firstname":"Kathleen","lastname":"Wilder","age":34,"gender":"F","address":"286 Sutter Avenue","employer":"Solgan","email":"kathleenwilder@solgan.com","city":"Graniteville","state":"MI"}
{"index":{"_id":"664"}}
{"account_number":664,"balance":16163,"firstname":"Hart","lastname":"Mccormick","age":40,"gender":"M","address":"144 Guider Avenue","employer":"Dyno","email":"hartmccormick@dyno.com","city":"Carbonville","state":"ID"}
{"index":{"_id":"669"}}
{"account_number":669,"balance":16934,"firstname":"Jewel","lastname":"Estrada","age":28,"gender":"M","address":"896 Meeker Avenue","employer":"Zilla","email":"jewelestrada@zilla.com","city":"Goodville","state":"PA"}
{"index":{"_id":"671"}}
{"account_number":671,"balance":29029,"firstname":"Antoinette","lastname":"Cook","age":34,"gender":"M","address":"375 Cumberland Street","employer":"Harmoney","email":"antoinettecook@harmoney.com","city":"Bergoo","state":"VT"}
{"index":{"_id":"676"}}
{"account_number":676,"balance":23842,"firstname":"Lisa","lastname":"Dudley","age":34,"gender":"M","address":"506 Vanderveer Street","employer":"Tropoli","email":"lisadudley@tropoli.com","city":"Konterra","state":"NY"}
{"index":{"_id":"683"}}
{"account_number":683,"balance":4381,"firstname":"Matilda","lastname":"Berger","age":39,"gender":"M","address":"884 Noble Street","employer":"Fibrodyne","email":"matildaberger@fibrodyne.com","city":"Shepardsville","state":"TN"}
{"index":{"_id":"688"}}
{"account_number":688,"balance":17931,"firstname":"Freeman","lastname":"Zamora","age":22,"gender":"F","address":"114 Herzl Street","employer":"Elemantra","email":"freemanzamora@elemantra.com","city":"Libertytown","state":"NM"}
{"index":{"_id":"690"}}
{"account_number":690,"balance":18127,"firstname":"Russo","lastname":"Swanson","age":35,"gender":"F","address":"256 Roebling Street","employer":"Zaj","email":"russoswanson@zaj.com","city":"Hoagland","state":"MI"}
{"index":{"_id":"695"}}
{"account_number":695,"balance":36800,"firstname":"Gonzales","lastname":"Mcfarland","age":26,"gender":"F","address":"647 Louisa Street","employer":"Songbird","email":"gonzalesmcfarland@songbird.com","city":"Crisman","state":"ID"}
{"index":{"_id":"703"}}
{"account_number":703,"balance":27443,"firstname":"Dona","lastname":"Burton","age":29,"gender":"M","address":"489 Flatlands Avenue","employer":"Cytrex","email":"donaburton@cytrex.com","city":"Reno","state":"VA"}
{"index":{"_id":"708"}}
{"account_number":708,"balance":34002,"firstname":"May","lastname":"Ortiz","age":28,"gender":"F","address":"244 Chauncey Street","employer":"Syntac","email":"mayortiz@syntac.com","city":"Munjor","state":"ID"}
{"index":{"_id":"710"}}
{"account_number":710,"balance":33650,"firstname":"Shelton","lastname":"Stark","age":37,"gender":"M","address":"404 Ovington Avenue","employer":"Kraggle","email":"sheltonstark@kraggle.com","city":"Ogema","state":"TN"}
{"index":{"_id":"715"}}
{"account_number":715,"balance":23734,"firstname":"Tammi","lastname":"Hodge","age":24,"gender":"M","address":"865 Church Lane","employer":"Netur","email":"tammihodge@netur.com","city":"Lacomb","state":"KS"}
{"index":{"_id":"722"}}
{"account_number":722,"balance":27256,"firstname":"Roberts","lastname":"Beasley","age":34,"gender":"F","address":"305 Kings Hwy","employer":"Quintity","email":"robertsbeasley@quintity.com","city":"Hayden","state":"PA"}
{"index":{"_id":"727"}}
{"account_number":727,"balance":27263,"firstname":"Natasha","lastname":"Knapp","age":36,"gender":"M","address":"723 Hubbard Street","employer":"Exostream","email":"natashaknapp@exostream.com","city":"Trexlertown","state":"LA"}
{"index":{"_id":"734"}}
{"account_number":734,"balance":20325,"firstname":"Keri","lastname":"Kinney","age":23,"gender":"M","address":"490 Balfour Place","employer":"Retrotex","email":"kerikinney@retrotex.com","city":"Salunga","state":"PA"}
{"index":{"_id":"739"}}
{"account_number":739,"balance":39063,"firstname":"Gwen","lastname":"Hardy","age":33,"gender":"F","address":"733 Stuart Street","employer":"Exozent","email":"gwenhardy@exozent.com","city":"Drytown","state":"NY"}
{"index":{"_id":"741"}}
{"account_number":741,"balance":33074,"firstname":"Nielsen","lastname":"Good","age":22,"gender":"M","address":"404 Norfolk Street","employer":"Kiggle","email":"nielsengood@kiggle.com","city":"Cumberland","state":"WA"}
{"index":{"_id":"746"}}
{"account_number":746,"balance":15970,"firstname":"Marguerite","lastname":"Wall","age":28,"gender":"F","address":"364 Crosby Avenue","employer":"Aquoavo","email":"margueritewall@aquoavo.com","city":"Jeff","state":"MI"}
{"index":{"_id":"753"}}
{"account_number":753,"balance":33340,"firstname":"Katina","lastname":"Alford","age":21,"gender":"F","address":"690 Ross Street","employer":"Intrawear","email":"katinaalford@intrawear.com","city":"Grimsley","state":"OK"}
{"index":{"_id":"758"}}
{"account_number":758,"balance":15739,"firstname":"Berta","lastname":"Short","age":28,"gender":"M","address":"149 Surf Avenue","employer":"Ozean","email":"bertashort@ozean.com","city":"Odessa","state":"UT"}
{"index":{"_id":"760"}}
{"account_number":760,"balance":40996,"firstname":"Rhea","lastname":"Blair","age":37,"gender":"F","address":"440 Hubbard Place","employer":"Bicol","email":"rheablair@bicol.com","city":"Stockwell","state":"LA"}
{"index":{"_id":"765"}}
{"account_number":765,"balance":31278,"firstname":"Knowles","lastname":"Cunningham","age":23,"gender":"M","address":"753 Macdougal Street","employer":"Thredz","email":"knowlescunningham@thredz.com","city":"Thomasville","state":"WA"}
{"index":{"_id":"772"}}
{"account_number":772,"balance":37849,"firstname":"Eloise","lastname":"Sparks","age":21,"gender":"M","address":"608 Willow Street","employer":"Satiance","email":"eloisesparks@satiance.com","city":"Richford","state":"NY"}
{"index":{"_id":"777"}}
{"account_number":777,"balance":48294,"firstname":"Adkins","lastname":"Mejia","age":32,"gender":"M","address":"186 Oxford Walk","employer":"Datagen","email":"adkinsmejia@datagen.com","city":"Faywood","state":"OK"}
{"index":{"_id":"784"}}
{"account_number":784,"balance":25291,"firstname":"Mabel","lastname":"Thornton","age":21,"gender":"M","address":"124 Louisiana Avenue","employer":"Zolavo","email":"mabelthornton@zolavo.com","city":"Lynn","state":"AL"}
{"index":{"_id":"789"}}
{"account_number":789,"balance":8760,"firstname":"Cunningham","lastname":"Kerr","age":27,"gender":"F","address":"154 Sharon Street","employer":"Polarium","email":"cunninghamkerr@polarium.com","city":"Tuskahoma","state":"MS"}
{"index":{"_id":"791"}}
{"account_number":791,"balance":48249,"firstname":"Janine","lastname":"Huber","age":38,"gender":"F","address":"348 Porter Avenue","employer":"Viocular","email":"janinehuber@viocular.com","city":"Fivepointville","state":"MA"}
{"index":{"_id":"796"}}
{"account_number":796,"balance":23503,"firstname":"Mona","lastname":"Craft","age":35,"gender":"F","address":"511 Henry Street","employer":"Opticom","email":"monacraft@opticom.com","city":"Websterville","state":"IN"}
{"index":{"_id":"804"}}
{"account_number":804,"balance":23610,"firstname":"Rojas","lastname":"Oneal","age":27,"gender":"M","address":"669 Sandford Street","employer":"Glukgluk","email":"rojasoneal@glukgluk.com","city":"Wheaton","state":"ME"}
{"index":{"_id":"809"}}
{"account_number":809,"balance":47812,"firstname":"Christie","lastname":"Strickland","age":30,"gender":"M","address":"346 Bancroft Place","employer":"Anarco","email":"christiestrickland@anarco.com","city":"Baden","state":"NV"}
{"index":{"_id":"811"}}
{"account_number":811,"balance":26007,"firstname":"Walls","lastname":"Rogers","age":28,"gender":"F","address":"352 Freeman Street","employer":"Geekmosis","email":"wallsrogers@geekmosis.com","city":"Caroleen","state":"NV"}
{"index":{"_id":"816"}}
{"account_number":816,"balance":9567,"firstname":"Cornelia","lastname":"Lane","age":20,"gender":"F","address":"384 Bainbridge Street","employer":"Sulfax","email":"cornelialane@sulfax.com","city":"Elizaville","state":"MS"}
{"index":{"_id":"823"}}
{"account_number":823,"balance":48726,"firstname":"Celia","lastname":"Bernard","age":33,"gender":"F","address":"466 Amboy Street","employer":"Mitroc","email":"celiabernard@mitroc.com","city":"Skyland","state":"GA"}
{"index":{"_id":"828"}}
{"account_number":828,"balance":44890,"firstname":"Blanche","lastname":"Holmes","age":33,"gender":"F","address":"605 Stryker Court","employer":"Motovate","email":"blancheholmes@motovate.com","city":"Loomis","state":"KS"}
{"index":{"_id":"830"}}
{"account_number":830,"balance":45210,"firstname":"Louella","lastname":"Chan","age":23,"gender":"M","address":"511 Heath Place","employer":"Conferia","email":"louellachan@conferia.com","city":"Brookfield","state":"OK"}
{"index":{"_id":"835"}}
{"account_number":835,"balance":46558,"firstname":"Glover","lastname":"Rutledge","age":25,"gender":"F","address":"641 Royce Street","employer":"Ginkogene","email":"gloverrutledge@ginkogene.com","city":"Dixonville","state":"VA"}
{"index":{"_id":"842"}}
{"account_number":842,"balance":49587,"firstname":"Meagan","lastname":"Buckner","age":23,"gender":"F","address":"833 Bushwick Court","employer":"Biospan","email":"meaganbuckner@biospan.com","city":"Craig","state":"TX"}
{"index":{"_id":"847"}}
{"account_number":847,"balance":8652,"firstname":"Antonia","lastname":"Duncan","age":23,"gender":"M","address":"644 Stryker Street","employer":"Talae","email":"antoniaduncan@talae.com","city":"Dawn","state":"MO"}
{"index":{"_id":"854"}}
{"account_number":854,"balance":49795,"firstname":"Jimenez","lastname":"Barry","age":25,"gender":"F","address":"603 Cooper Street","employer":"Verton","email":"jimenezbarry@verton.com","city":"Moscow","state":"AL"}
{"index":{"_id":"859"}}
{"account_number":859,"balance":20734,"firstname":"Beulah","lastname":"Stuart","age":24,"gender":"F","address":"651 Albemarle Terrace","employer":"Hatology","email":"beulahstuart@hatology.com","city":"Waiohinu","state":"RI"}
{"index":{"_id":"861"}}
{"account_number":861,"balance":44173,"firstname":"Jaime","lastname":"Wilson","age":35,"gender":"M","address":"680 Richardson Street","employer":"Temorak","email":"jaimewilson@temorak.com","city":"Fidelis","state":"FL"}
{"index":{"_id":"866"}}
{"account_number":866,"balance":45565,"firstname":"Araceli","lastname":"Woodward","age":28,"gender":"M","address":"326 Meadow Street","employer":"Olympix","email":"araceliwoodward@olympix.com","city":"Dana","state":"KS"}
{"index":{"_id":"873"}}
{"account_number":873,"balance":43931,"firstname":"Tisha","lastname":"Cotton","age":39,"gender":"F","address":"432 Lincoln Road","employer":"Buzzmaker","email":"tishacotton@buzzmaker.com","city":"Bluetown","state":"GA"}
{"index":{"_id":"878"}}
{"account_number":878,"balance":49159,"firstname":"Battle","lastname":"Blackburn","age":40,"gender":"F","address":"234 Hendrix Street","employer":"Zilphur","email":"battleblackburn@zilphur.com","city":"Wanamie","state":"PA"}
{"index":{"_id":"880"}}
{"account_number":880,"balance":22575,"firstname":"Christian","lastname":"Myers","age":35,"gender":"M","address":"737 Crown Street","employer":"Combogen","email":"christianmyers@combogen.com","city":"Abrams","state":"OK"}
{"index":{"_id":"885"}}
{"account_number":885,"balance":31661,"firstname":"Valdez","lastname":"Roberson","age":40,"gender":"F","address":"227 Scholes Street","employer":"Delphide","email":"valdezroberson@delphide.com","city":"Chilton","state":"MT"}
{"index":{"_id":"892"}}
{"account_number":892,"balance":44974,"firstname":"Hill","lastname":"Hayes","age":29,"gender":"M","address":"721 Dooley Street","employer":"Fuelton","email":"hillhayes@fuelton.com","city":"Orason","state":"MT"}
{"index":{"_id":"897"}}
{"account_number":897,"balance":45973,"firstname":"Alyson","lastname":"Irwin","age":25,"gender":"M","address":"731 Poplar Street","employer":"Quizka","email":"alysonirwin@quizka.com","city":"Singer","state":"VA"}
{"index":{"_id":"900"}}
{"account_number":900,"balance":6124,"firstname":"Gonzalez","lastname":"Watson","age":23,"gender":"M","address":"624 Sullivan Street","employer":"Marvane","email":"gonzalezwatson@marvane.com","city":"Wikieup","state":"IL"}
{"index":{"_id":"905"}}
{"account_number":905,"balance":29438,"firstname":"Schultz","lastname":"Moreno","age":20,"gender":"F","address":"761 Cedar Street","employer":"Paragonia","email":"schultzmoreno@paragonia.com","city":"Glenshaw","state":"SC"}
{"index":{"_id":"912"}}
{"account_number":912,"balance":13675,"firstname":"Flora","lastname":"Alvarado","age":26,"gender":"M","address":"771 Vandervoort Avenue","employer":"Boilicon","email":"floraalvarado@boilicon.com","city":"Vivian","state":"ID"}
{"index":{"_id":"917"}}
{"account_number":917,"balance":47782,"firstname":"Parks","lastname":"Hurst","age":24,"gender":"M","address":"933 Cozine Avenue","employer":"Pyramis","email":"parkshurst@pyramis.com","city":"Lindcove","state":"GA"}
{"index":{"_id":"924"}}
{"account_number":924,"balance":3811,"firstname":"Hilary","lastname":"Leonard","age":24,"gender":"M","address":"235 Hegeman Avenue","employer":"Metroz","email":"hilaryleonard@metroz.com","city":"Roosevelt","state":"ME"}
{"index":{"_id":"929"}}
{"account_number":929,"balance":34708,"firstname":"Willie","lastname":"Hickman","age":35,"gender":"M","address":"430 Devoe Street","employer":"Apextri","email":"williehickman@apextri.com","city":"Clay","state":"MS"}
{"index":{"_id":"931"}}
{"account_number":931,"balance":8244,"firstname":"Ingrid","lastname":"Garcia","age":23,"gender":"F","address":"674 Indiana Place","employer":"Balooba","email":"ingridgarcia@balooba.com","city":"Interlochen","state":"AZ"}
{"index":{"_id":"936"}}
{"account_number":936,"balance":22430,"firstname":"Beth","lastname":"Frye","age":36,"gender":"M","address":"462 Thatford Avenue","employer":"Puria","email":"bethfrye@puria.com","city":"Hiseville","state":"LA"}
{"index":{"_id":"943"}}
{"account_number":943,"balance":24187,"firstname":"Wagner","lastname":"Griffin","age":23,"gender":"M","address":"489 Ellery Street","employer":"Gazak","email":"wagnergriffin@gazak.com","city":"Lorraine","state":"HI"}
{"index":{"_id":"948"}}
{"account_number":948,"balance":37074,"firstname":"Sargent","lastname":"Powers","age":40,"gender":"M","address":"532 Fiske Place","employer":"Accuprint","email":"sargentpowers@accuprint.com","city":"Umapine","state":"AK"}
{"index":{"_id":"950"}}
{"account_number":950,"balance":30916,"firstname":"Sherrie","lastname":"Patel","age":32,"gender":"F","address":"658 Langham Street","employer":"Futurize","email":"sherriepatel@futurize.com","city":"Garfield","state":"OR"}
{"index":{"_id":"955"}}
{"account_number":955,"balance":41621,"firstname":"Klein","lastname":"Kemp","age":33,"gender":"M","address":"370 Vanderbilt Avenue","employer":"Synkgen","email":"kleinkemp@synkgen.com","city":"Bonanza","state":"FL"}
{"index":{"_id":"962"}}
{"account_number":962,"balance":32096,"firstname":"Trujillo","lastname":"Wilcox","age":21,"gender":"F","address":"914 Duffield Street","employer":"Extragene","email":"trujillowilcox@extragene.com","city":"Golconda","state":"MA"}
{"index":{"_id":"967"}}
{"account_number":967,"balance":19161,"firstname":"Carrie","lastname":"Huffman","age":36,"gender":"F","address":"240 Sands Street","employer":"Injoy","email":"carriehuffman@injoy.com","city":"Leroy","state":"CA"}
{"index":{"_id":"974"}}
{"account_number":974,"balance":38082,"firstname":"Deborah","lastname":"Yang","age":26,"gender":"F","address":"463 Goodwin Place","employer":"Entogrok","email":"deborahyang@entogrok.com","city":"Herald","state":"KY"}
{"index":{"_id":"979"}}
{"account_number":979,"balance":43130,"firstname":"Vaughn","lastname":"Pittman","age":29,"gender":"M","address":"446 Tompkins Place","employer":"Phormula","email":"vaughnpittman@phormula.com","city":"Fingerville","state":"WI"}
{"index":{"_id":"981"}}
{"account_number":981,"balance":20278,"firstname":"Nolan","lastname":"Warner","age":29,"gender":"F","address":"753 Channel Avenue","employer":"Interodeo","email":"nolanwarner@interodeo.com","city":"Layhill","state":"MT"}
{"index":{"_id":"986"}}
{"account_number":986,"balance":35086,"firstname":"Norris","lastname":"Hubbard","age":31,"gender":"M","address":"600 Celeste Court","employer":"Printspan","email":"norrishubbard@printspan.com","city":"Cassel","state":"MI"}
{"index":{"_id":"993"}}
{"account_number":993,"balance":26487,"firstname":"Campos","lastname":"Olsen","age":37,"gender":"M","address":"873 Covert Street","employer":"Isbol","email":"camposolsen@isbol.com","city":"Glendale","state":"AK"}
{"index":{"_id":"998"}}
{"account_number":998,"balance":16869,"firstname":"Letha","lastname":"Baker","age":40,"gender":"F","address":"206 Llama Court","employer":"Dognosis","email":"lethabaker@dognosis.com","city":"Dunlo","state":"WV"}
{"index":{"_id":"2"}}
{"account_number":2,"balance":28838,"firstname":"Roberta","lastname":"Bender","age":22,"gender":"F","address":"560 Kingsway Place","employer":"Chillium","email":"robertabender@chillium.com","city":"Bennett","state":"LA"}
{"index":{"_id":"7"}}
{"account_number":7,"balance":39121,"firstname":"Levy","lastname":"Richard","age":22,"gender":"M","address":"820 Logan Street","employer":"Teraprene","email":"levyrichard@teraprene.com","city":"Shrewsbury","state":"MO"}
{"index":{"_id":"14"}}
{"account_number":14,"balance":20480,"firstname":"Erma","lastname":"Kane","age":39,"gender":"F","address":"661 Vista Place","employer":"Stockpost","email":"ermakane@stockpost.com","city":"Chamizal","state":"NY"}
{"index":{"_id":"19"}}
{"account_number":19,"balance":27894,"firstname":"Schwartz","lastname":"Buchanan","age":28,"gender":"F","address":"449 Mersereau Court","employer":"Sybixtex","email":"schwartzbuchanan@sybixtex.com","city":"Greenwich","state":"KS"}
{"index":{"_id":"21"}}
{"account_number":21,"balance":7004,"firstname":"Estella","lastname":"Paul","age":38,"gender":"M","address":"859 Portal Street","employer":"Zillatide","email":"estellapaul@zillatide.com","city":"Churchill","state":"WV"}
{"index":{"_id":"26"}}
{"account_number":26,"balance":14127,"firstname":"Lorraine","lastname":"Mccullough","age":39,"gender":"F","address":"157 Dupont Street","employer":"Zosis","email":"lorrainemccullough@zosis.com","city":"Dennard","state":"NH"}
{"index":{"_id":"33"}}
{"account_number":33,"balance":35439,"firstname":"Savannah","lastname":"Kirby","age":30,"gender":"F","address":"372 Malta Street","employer":"Musanpoly","email":"savannahkirby@musanpoly.com","city":"Muse","state":"AK"}
{"index":{"_id":"38"}}
{"account_number":38,"balance":10511,"firstname":"Erna","lastname":"Fields","age":32,"gender":"M","address":"357 Maple Street","employer":"Eweville","email":"ernafields@eweville.com","city":"Twilight","state":"MS"}
{"index":{"_id":"40"}}
{"account_number":40,"balance":33882,"firstname":"Pace","lastname":"Molina","age":40,"gender":"M","address":"263 Ovington Court","employer":"Cytrak","email":"pacemolina@cytrak.com","city":"Silkworth","state":"OR"}
{"index":{"_id":"45"}}
{"account_number":45,"balance":44478,"firstname":"Geneva","lastname":"Morin","age":21,"gender":"F","address":"357 Herkimer Street","employer":"Ezent","email":"genevamorin@ezent.com","city":"Blanco","state":"AZ"}
{"index":{"_id":"52"}}
{"account_number":52,"balance":46425,"firstname":"Kayla","lastname":"Bradshaw","age":31,"gender":"M","address":"449 Barlow Drive","employer":"Magnemo","email":"kaylabradshaw@magnemo.com","city":"Wawona","state":"AZ"}
{"index":{"_id":"57"}}
{"account_number":57,"balance":8705,"firstname":"Powell","lastname":"Herring","age":21,"gender":"M","address":"263 Merit Court","employer":"Digiprint","email":"powellherring@digiprint.com","city":"Coral","state":"MT"}
{"index":{"_id":"64"}}
{"account_number":64,"balance":44036,"firstname":"Miles","lastname":"Battle","age":35,"gender":"F","address":"988 Homecrest Avenue","employer":"Koffee","email":"milesbattle@koffee.com","city":"Motley","state":"ID"}
{"index":{"_id":"69"}}
{"account_number":69,"balance":14253,"firstname":"Desiree","lastname":"Harrison","age":24,"gender":"M","address":"694 Garland Court","employer":"Barkarama","email":"desireeharrison@barkarama.com","city":"Hackneyville","state":"GA"}
{"index":{"_id":"71"}}
{"account_number":71,"balance":38201,"firstname":"Sharpe","lastname":"Hoffman","age":39,"gender":"F","address":"450 Conklin Avenue","employer":"Centree","email":"sharpehoffman@centree.com","city":"Urbana","state":"WY"}
{"index":{"_id":"76"}}
{"account_number":76,"balance":38345,"firstname":"Claudette","lastname":"Beard","age":24,"gender":"F","address":"748 Dorset Street","employer":"Repetwire","email":"claudettebeard@repetwire.com","city":"Caln","state":"TX"}
{"index":{"_id":"83"}}
{"account_number":83,"balance":35928,"firstname":"Mayo","lastname":"Cleveland","age":28,"gender":"M","address":"720 Brooklyn Road","employer":"Indexia","email":"mayocleveland@indexia.com","city":"Roberts","state":"ND"}
{"index":{"_id":"88"}}
{"account_number":88,"balance":26418,"firstname":"Adela","lastname":"Tyler","age":21,"gender":"F","address":"737 Clove Road","employer":"Surelogic","email":"adelatyler@surelogic.com","city":"Boling","state":"SD"}
{"index":{"_id":"90"}}
{"account_number":90,"balance":25332,"firstname":"Herman","lastname":"Snyder","age":22,"gender":"F","address":"737 College Place","employer":"Lunchpod","email":"hermansnyder@lunchpod.com","city":"Flintville","state":"IA"}
{"index":{"_id":"95"}}
{"account_number":95,"balance":1650,"firstname":"Dominguez","lastname":"Le","age":20,"gender":"M","address":"539 Grace Court","employer":"Portica","email":"dominguezle@portica.com","city":"Wollochet","state":"KS"}
{"index":{"_id":"103"}}
{"account_number":103,"balance":11253,"firstname":"Calhoun","lastname":"Bruce","age":33,"gender":"F","address":"731 Clarkson Avenue","employer":"Automon","email":"calhounbruce@automon.com","city":"Marienthal","state":"IL"}
{"index":{"_id":"108"}}
{"account_number":108,"balance":19015,"firstname":"Christensen","lastname":"Weaver","age":21,"gender":"M","address":"398 Dearborn Court","employer":"Quilk","email":"christensenweaver@quilk.com","city":"Belvoir","state":"TX"}
{"index":{"_id":"110"}}
{"account_number":110,"balance":4850,"firstname":"Daphne","lastname":"Byrd","age":23,"gender":"F","address":"239 Conover Street","employer":"Freakin","email":"daphnebyrd@freakin.com","city":"Taft","state":"MN"}
{"index":{"_id":"115"}}
{"account_number":115,"balance":18750,"firstname":"Nikki","lastname":"Doyle","age":31,"gender":"F","address":"537 Clara Street","employer":"Fossiel","email":"nikkidoyle@fossiel.com","city":"Caron","state":"MS"}
{"index":{"_id":"122"}}
{"account_number":122,"balance":17128,"firstname":"Aurora","lastname":"Fry","age":31,"gender":"F","address":"227 Knapp Street","employer":"Makingway","email":"aurorafry@makingway.com","city":"Maybell","state":"NE"}
{"index":{"_id":"127"}}
{"account_number":127,"balance":48734,"firstname":"Diann","lastname":"Mclaughlin","age":33,"gender":"F","address":"340 Clermont Avenue","employer":"Enomen","email":"diannmclaughlin@enomen.com","city":"Rutherford","state":"ND"}
{"index":{"_id":"134"}}
{"account_number":134,"balance":33829,"firstname":"Madelyn","lastname":"Norris","age":30,"gender":"F","address":"176 Noel Avenue","employer":"Endicil","email":"madelynnorris@endicil.com","city":"Walker","state":"NE"}
{"index":{"_id":"139"}}
{"account_number":139,"balance":18444,"firstname":"Rios","lastname":"Todd","age":35,"gender":"F","address":"281 Georgia Avenue","employer":"Uberlux","email":"riostodd@uberlux.com","city":"Hannasville","state":"PA"}
{"index":{"_id":"141"}}
{"account_number":141,"balance":20790,"firstname":"Liliana","lastname":"Caldwell","age":29,"gender":"M","address":"414 Huron Street","employer":"Rubadub","email":"lilianacaldwell@rubadub.com","city":"Hiwasse","state":"OK"}
{"index":{"_id":"146"}}
{"account_number":146,"balance":39078,"firstname":"Lang","lastname":"Kaufman","age":32,"gender":"F","address":"626 Beverley Road","employer":"Rodeomad","email":"langkaufman@rodeomad.com","city":"Mahtowa","state":"RI"}
{"index":{"_id":"153"}}
{"account_number":153,"balance":32074,"firstname":"Bird","lastname":"Cochran","age":31,"gender":"F","address":"691 Bokee Court","employer":"Supremia","email":"birdcochran@supremia.com","city":"Barrelville","state":"NE"}
{"index":{"_id":"158"}}
{"account_number":158,"balance":9380,"firstname":"Natalie","lastname":"Mcdowell","age":27,"gender":"M","address":"953 Roder Avenue","employer":"Myopium","email":"nataliemcdowell@myopium.com","city":"Savage","state":"ND"}
{"index":{"_id":"160"}}
{"account_number":160,"balance":48974,"firstname":"Hull","lastname":"Cherry","age":23,"gender":"F","address":"275 Beaumont Street","employer":"Noralex","email":"hullcherry@noralex.com","city":"Whipholt","state":"WA"}
{"index":{"_id":"165"}}
{"account_number":165,"balance":18956,"firstname":"Sims","lastname":"Mckay","age":40,"gender":"F","address":"205 Jackson Street","employer":"Comtour","email":"simsmckay@comtour.com","city":"Tilden","state":"DC"}
{"index":{"_id":"172"}}
{"account_number":172,"balance":18356,"firstname":"Marie","lastname":"Whitehead","age":20,"gender":"M","address":"704 Monaco Place","employer":"Sultrax","email":"mariewhitehead@sultrax.com","city":"Dragoon","state":"IL"}
{"index":{"_id":"177"}}
{"account_number":177,"balance":48972,"firstname":"Harris","lastname":"Gross","age":40,"gender":"F","address":"468 Suydam Street","employer":"Kidstock","email":"harrisgross@kidstock.com","city":"Yettem","state":"KY"}
{"index":{"_id":"184"}}
{"account_number":184,"balance":9157,"firstname":"Cathy","lastname":"Morrison","age":27,"gender":"M","address":"882 Pine Street","employer":"Zytrek","email":"cathymorrison@zytrek.com","city":"Fedora","state":"FL"}
{"index":{"_id":"189"}}
{"account_number":189,"balance":20167,"firstname":"Ada","lastname":"Cortez","age":38,"gender":"F","address":"700 Forest Place","employer":"Micronaut","email":"adacortez@micronaut.com","city":"Eagletown","state":"TX"}
{"index":{"_id":"191"}}
{"account_number":191,"balance":26172,"firstname":"Barr","lastname":"Sharpe","age":28,"gender":"M","address":"428 Auburn Place","employer":"Ziggles","email":"barrsharpe@ziggles.com","city":"Springdale","state":"KS"}
{"index":{"_id":"196"}}
{"account_number":196,"balance":29931,"firstname":"Caldwell","lastname":"Daniel","age":28,"gender":"F","address":"405 Oliver Street","employer":"Furnigeer","email":"caldwelldaniel@furnigeer.com","city":"Zortman","state":"NE"}
{"index":{"_id":"204"}}
{"account_number":204,"balance":27714,"firstname":"Mavis","lastname":"Deleon","age":39,"gender":"F","address":"400 Waldane Court","employer":"Lotron","email":"mavisdeleon@lotron.com","city":"Stollings","state":"LA"}
{"index":{"_id":"209"}}
{"account_number":209,"balance":31052,"firstname":"Myers","lastname":"Noel","age":30,"gender":"F","address":"691 Alton Place","employer":"Greeker","email":"myersnoel@greeker.com","city":"Hinsdale","state":"KY"}
{"index":{"_id":"211"}}
{"account_number":211,"balance":21539,"firstname":"Graciela","lastname":"Vaughan","age":22,"gender":"M","address":"558 Montauk Court","employer":"Fishland","email":"gracielavaughan@fishland.com","city":"Madrid","state":"PA"}
{"index":{"_id":"216"}}
{"account_number":216,"balance":11422,"firstname":"Price","lastname":"Haley","age":35,"gender":"M","address":"233 Portland Avenue","employer":"Zeam","email":"pricehaley@zeam.com","city":"Titanic","state":"UT"}
{"index":{"_id":"223"}}
{"account_number":223,"balance":9528,"firstname":"Newton","lastname":"Fletcher","age":26,"gender":"F","address":"654 Dewitt Avenue","employer":"Assistia","email":"newtonfletcher@assistia.com","city":"Nipinnawasee","state":"AK"}
{"index":{"_id":"228"}}
{"account_number":228,"balance":10543,"firstname":"Rosella","lastname":"Albert","age":20,"gender":"M","address":"185 Gotham Avenue","employer":"Isoplex","email":"rosellaalbert@isoplex.com","city":"Finzel","state":"NY"}
{"index":{"_id":"230"}}
{"account_number":230,"balance":10829,"firstname":"Chris","lastname":"Raymond","age":28,"gender":"F","address":"464 Remsen Street","employer":"Cogentry","email":"chrisraymond@cogentry.com","city":"Bowmansville","state":"SD"}
{"index":{"_id":"235"}}
{"account_number":235,"balance":17729,"firstname":"Mcpherson","lastname":"Mueller","age":31,"gender":"M","address":"541 Strong Place","employer":"Tingles","email":"mcphersonmueller@tingles.com","city":"Brantleyville","state":"AR"}
{"index":{"_id":"242"}}
{"account_number":242,"balance":42318,"firstname":"Berger","lastname":"Roach","age":21,"gender":"M","address":"125 Wakeman Place","employer":"Ovium","email":"bergerroach@ovium.com","city":"Hessville","state":"WI"}
{"index":{"_id":"247"}}
{"account_number":247,"balance":45123,"firstname":"Mccormick","lastname":"Moon","age":37,"gender":"M","address":"582 Brighton Avenue","employer":"Norsup","email":"mccormickmoon@norsup.com","city":"Forestburg","state":"DE"}
{"index":{"_id":"254"}}
{"account_number":254,"balance":35104,"firstname":"Yang","lastname":"Dodson","age":21,"gender":"M","address":"531 Lott Street","employer":"Mondicil","email":"yangdodson@mondicil.com","city":"Enoree","state":"UT"}
{"index":{"_id":"259"}}
{"account_number":259,"balance":41877,"firstname":"Eleanor","lastname":"Gonzalez","age":30,"gender":"M","address":"800 Sumpter Street","employer":"Futuris","email":"eleanorgonzalez@futuris.com","city":"Jenkinsville","state":"ID"}
{"index":{"_id":"261"}}
{"account_number":261,"balance":39998,"firstname":"Millicent","lastname":"Pickett","age":34,"gender":"F","address":"722 Montieth Street","employer":"Gushkool","email":"millicentpickett@gushkool.com","city":"Norwood","state":"MS"}
{"index":{"_id":"266"}}
{"account_number":266,"balance":2777,"firstname":"Monique","lastname":"Conner","age":35,"gender":"F","address":"489 Metrotech Courtr","employer":"Flotonic","email":"moniqueconner@flotonic.com","city":"Retsof","state":"MD"}
{"index":{"_id":"273"}}
{"account_number":273,"balance":11181,"firstname":"Murphy","lastname":"Chandler","age":20,"gender":"F","address":"569 Bradford Street","employer":"Zilch","email":"murphychandler@zilch.com","city":"Vicksburg","state":"FL"}
{"index":{"_id":"278"}}
{"account_number":278,"balance":22530,"firstname":"Tamra","lastname":"Navarro","age":27,"gender":"F","address":"175 Woodruff Avenue","employer":"Norsul","email":"tamranavarro@norsul.com","city":"Glasgow","state":"VT"}
{"index":{"_id":"280"}}
{"account_number":280,"balance":3380,"firstname":"Vilma","lastname":"Shields","age":26,"gender":"F","address":"133 Berriman Street","employer":"Applidec","email":"vilmashields@applidec.com","city":"Adamstown","state":"ME"}
{"index":{"_id":"285"}}
{"account_number":285,"balance":47369,"firstname":"Hilda","lastname":"Phillips","age":28,"gender":"F","address":"618 Nixon Court","employer":"Comcur","email":"hildaphillips@comcur.com","city":"Siglerville","state":"NC"}
{"index":{"_id":"292"}}
{"account_number":292,"balance":26679,"firstname":"Morrow","lastname":"Greene","age":20,"gender":"F","address":"691 Nassau Street","employer":"Columella","email":"morrowgreene@columella.com","city":"Sanborn","state":"FL"}
{"index":{"_id":"297"}}
{"account_number":297,"balance":20508,"firstname":"Tucker","lastname":"Patrick","age":35,"gender":"F","address":"978 Whitwell Place","employer":"Valreda","email":"tuckerpatrick@valreda.com","city":"Deseret","state":"CO"}
{"index":{"_id":"300"}}
{"account_number":300,"balance":25654,"firstname":"Lane","lastname":"Tate","age":26,"gender":"F","address":"632 Kay Court","employer":"Genesynk","email":"lanetate@genesynk.com","city":"Lowell","state":"MO"}
{"index":{"_id":"305"}}
{"account_number":305,"balance":11655,"firstname":"Augusta","lastname":"Winters","age":29,"gender":"F","address":"377 Paerdegat Avenue","employer":"Vendblend","email":"augustawinters@vendblend.com","city":"Gwynn","state":"MA"}
{"index":{"_id":"312"}}
{"account_number":312,"balance":8511,"firstname":"Burgess","lastname":"Gentry","age":25,"gender":"F","address":"382 Bergen Court","employer":"Orbixtar","email":"burgessgentry@orbixtar.com","city":"Conestoga","state":"WI"}
{"index":{"_id":"317"}}
{"account_number":317,"balance":31968,"firstname":"Ruiz","lastname":"Morris","age":31,"gender":"F","address":"972 Dean Street","employer":"Apex","email":"ruizmorris@apex.com","city":"Jacksonwald","state":"WV"}
{"index":{"_id":"324"}}
{"account_number":324,"balance":44976,"firstname":"Gladys","lastname":"Erickson","age":22,"gender":"M","address":"250 Battery Avenue","employer":"Eternis","email":"gladyserickson@eternis.com","city":"Marne","state":"IA"}
{"index":{"_id":"329"}}
{"account_number":329,"balance":31138,"firstname":"Nellie","lastname":"Mercer","age":25,"gender":"M","address":"967 Ebony Court","employer":"Scenty","email":"nelliemercer@scenty.com","city":"Jardine","state":"AK"}
{"index":{"_id":"331"}}
{"account_number":331,"balance":46004,"firstname":"Gibson","lastname":"Potts","age":34,"gender":"F","address":"994 Dahill Road","employer":"Zensus","email":"gibsonpotts@zensus.com","city":"Frizzleburg","state":"CO"}
{"index":{"_id":"336"}}
{"account_number":336,"balance":40891,"firstname":"Dudley","lastname":"Avery","age":25,"gender":"M","address":"405 Powers Street","employer":"Genmom","email":"dudleyavery@genmom.com","city":"Clarksburg","state":"CO"}
{"index":{"_id":"343"}}
{"account_number":343,"balance":37684,"firstname":"Robbie","lastname":"Logan","age":29,"gender":"M","address":"488 Linden Boulevard","employer":"Hydrocom","email":"robbielogan@hydrocom.com","city":"Stockdale","state":"TN"}
{"index":{"_id":"348"}}
{"account_number":348,"balance":1360,"firstname":"Karina","lastname":"Russell","age":37,"gender":"M","address":"797 Moffat Street","employer":"Limozen","email":"karinarussell@limozen.com","city":"Riegelwood","state":"RI"}
{"index":{"_id":"350"}}
{"account_number":350,"balance":4267,"firstname":"Wyatt","lastname":"Wise","age":22,"gender":"F","address":"896 Bleecker Street","employer":"Rockyard","email":"wyattwise@rockyard.com","city":"Joes","state":"MS"}
{"index":{"_id":"355"}}
{"account_number":355,"balance":40961,"firstname":"Gregory","lastname":"Delacruz","age":38,"gender":"M","address":"876 Cortelyou Road","employer":"Oulu","email":"gregorydelacruz@oulu.com","city":"Waterloo","state":"WV"}
{"index":{"_id":"362"}}
{"account_number":362,"balance":14938,"firstname":"Jimmie","lastname":"Dejesus","age":26,"gender":"M","address":"351 Navy Walk","employer":"Ecolight","email":"jimmiedejesus@ecolight.com","city":"Berlin","state":"ME"}
{"index":{"_id":"367"}}
{"account_number":367,"balance":40458,"firstname":"Elaine","lastname":"Workman","age":20,"gender":"M","address":"188 Ridge Boulevard","employer":"Colaire","email":"elaineworkman@colaire.com","city":"Herbster","state":"AK"}
{"index":{"_id":"374"}}
{"account_number":374,"balance":19521,"firstname":"Blanchard","lastname":"Stein","age":30,"gender":"M","address":"313 Bartlett Street","employer":"Cujo","email":"blanchardstein@cujo.com","city":"Cascades","state":"OR"}
{"index":{"_id":"379"}}
{"account_number":379,"balance":12962,"firstname":"Ruthie","lastname":"Lamb","age":21,"gender":"M","address":"796 Rockaway Avenue","employer":"Incubus","email":"ruthielamb@incubus.com","city":"Hickory","state":"TX"}
{"index":{"_id":"381"}}
{"account_number":381,"balance":40978,"firstname":"Sophie","lastname":"Mays","age":31,"gender":"M","address":"261 Varanda Place","employer":"Uneeq","email":"sophiemays@uneeq.com","city":"Cressey","state":"AR"}
{"index":{"_id":"386"}}
{"account_number":386,"balance":42588,"firstname":"Wallace","lastname":"Barr","age":39,"gender":"F","address":"246 Beverly Road","employer":"Concility","email":"wallacebarr@concility.com","city":"Durham","state":"IN"}
{"index":{"_id":"393"}}
{"account_number":393,"balance":43936,"firstname":"William","lastname":"Kelly","age":24,"gender":"M","address":"178 Lawrence Avenue","employer":"Techtrix","email":"williamkelly@techtrix.com","city":"Orin","state":"PA"}
{"index":{"_id":"398"}}
{"account_number":398,"balance":8543,"firstname":"Leticia","lastname":"Duran","age":35,"gender":"F","address":"305 Senator Street","employer":"Xleen","email":"leticiaduran@xleen.com","city":"Cavalero","state":"PA"}
{"index":{"_id":"401"}}
{"account_number":401,"balance":29408,"firstname":"Contreras","lastname":"Randolph","age":38,"gender":"M","address":"104 Lewis Avenue","employer":"Inrt","email":"contrerasrandolph@inrt.com","city":"Chesapeake","state":"CT"}
{"index":{"_id":"406"}}
{"account_number":406,"balance":28127,"firstname":"Mccarthy","lastname":"Dunlap","age":28,"gender":"F","address":"684 Seacoast Terrace","employer":"Canopoly","email":"mccarthydunlap@canopoly.com","city":"Elliott","state":"NC"}
{"index":{"_id":"413"}}
{"account_number":413,"balance":15631,"firstname":"Pugh","lastname":"Hamilton","age":39,"gender":"F","address":"124 Euclid Avenue","employer":"Techade","email":"pughhamilton@techade.com","city":"Beaulieu","state":"CA"}
{"index":{"_id":"418"}}
{"account_number":418,"balance":10207,"firstname":"Reed","lastname":"Goff","age":32,"gender":"M","address":"959 Everit Street","employer":"Zillan","email":"reedgoff@zillan.com","city":"Hiko","state":"WV"}
{"index":{"_id":"420"}}
{"account_number":420,"balance":44699,"firstname":"Brandie","lastname":"Hayden","age":22,"gender":"M","address":"291 Ash Street","employer":"Digifad","email":"brandiehayden@digifad.com","city":"Spelter","state":"NM"}
{"index":{"_id":"425"}}
{"account_number":425,"balance":41308,"firstname":"Queen","lastname":"Leach","age":30,"gender":"M","address":"105 Fair Street","employer":"Magneato","email":"queenleach@magneato.com","city":"Barronett","state":"NH"}
{"index":{"_id":"432"}}
{"account_number":432,"balance":28969,"firstname":"Preston","lastname":"Ferguson","age":40,"gender":"F","address":"239 Greenwood Avenue","employer":"Bitendrex","email":"prestonferguson@bitendrex.com","city":"Idledale","state":"ND"}
{"index":{"_id":"437"}}
{"account_number":437,"balance":41225,"firstname":"Rosales","lastname":"Marquez","age":29,"gender":"M","address":"873 Ryerson Street","employer":"Ronelon","email":"rosalesmarquez@ronelon.com","city":"Allendale","state":"CA"}
{"index":{"_id":"444"}}
{"account_number":444,"balance":44219,"firstname":"Dolly","lastname":"Finch","age":24,"gender":"F","address":"974 Interborough Parkway","employer":"Zytrac","email":"dollyfinch@zytrac.com","city":"Vowinckel","state":"WY"}
{"index":{"_id":"449"}}
{"account_number":449,"balance":41950,"firstname":"Barnett","lastname":"Cantrell","age":39,"gender":"F","address":"945 Bedell Lane","employer":"Zentility","email":"barnettcantrell@zentility.com","city":"Swartzville","state":"ND"}
{"index":{"_id":"451"}}
{"account_number":451,"balance":31950,"firstname":"Mason","lastname":"Mcleod","age":31,"gender":"F","address":"438 Havemeyer Street","employer":"Omatom","email":"masonmcleod@omatom.com","city":"Ryderwood","state":"NE"}
{"index":{"_id":"456"}}
{"account_number":456,"balance":21419,"firstname":"Solis","lastname":"Kline","age":33,"gender":"M","address":"818 Ashford Street","employer":"Vetron","email":"soliskline@vetron.com","city":"Ruffin","state":"NY"}
{"index":{"_id":"463"}}
{"account_number":463,"balance":36672,"firstname":"Heidi","lastname":"Acosta","age":20,"gender":"F","address":"692 Kenmore Terrace","employer":"Elpro","email":"heidiacosta@elpro.com","city":"Ezel","state":"SD"}
{"index":{"_id":"468"}}
{"account_number":468,"balance":18400,"firstname":"Foreman","lastname":"Fowler","age":40,"gender":"M","address":"443 Jackson Court","employer":"Zillactic","email":"foremanfowler@zillactic.com","city":"Wakarusa","state":"WA"}
{"index":{"_id":"470"}}
{"account_number":470,"balance":20455,"firstname":"Schneider","lastname":"Hull","age":35,"gender":"M","address":"724 Apollo Street","employer":"Exospeed","email":"schneiderhull@exospeed.com","city":"Watchtower","state":"ID"}
{"index":{"_id":"475"}}
{"account_number":475,"balance":24427,"firstname":"Morales","lastname":"Jacobs","age":22,"gender":"F","address":"225 Desmond Court","employer":"Oronoko","email":"moralesjacobs@oronoko.com","city":"Clayville","state":"CT"}
{"index":{"_id":"482"}}
{"account_number":482,"balance":14834,"firstname":"Janie","lastname":"Bass","age":39,"gender":"M","address":"781 Grattan Street","employer":"Manglo","email":"janiebass@manglo.com","city":"Kenwood","state":"IA"}
{"index":{"_id":"487"}}
{"account_number":487,"balance":30718,"firstname":"Sawyer","lastname":"Vincent","age":26,"gender":"F","address":"238 Lancaster Avenue","employer":"Brainquil","email":"sawyervincent@brainquil.com","city":"Galesville","state":"MS"}
{"index":{"_id":"494"}}
{"account_number":494,"balance":3592,"firstname":"Holden","lastname":"Bowen","age":30,"gender":"M","address":"374 Elmwood Avenue","employer":"Endipine","email":"holdenbowen@endipine.com","city":"Rosine","state":"ID"}
{"index":{"_id":"499"}}
{"account_number":499,"balance":26060,"firstname":"Lara","lastname":"Perkins","age":26,"gender":"M","address":"703 Monroe Street","employer":"Paprikut","email":"laraperkins@paprikut.com","city":"Barstow","state":"NY"}
{"index":{"_id":"502"}}
{"account_number":502,"balance":31898,"firstname":"Woodard","lastname":"Bailey","age":31,"gender":"F","address":"585 Albee Square","employer":"Imperium","email":"woodardbailey@imperium.com","city":"Matheny","state":"MT"}
{"index":{"_id":"507"}}
{"account_number":507,"balance":27675,"firstname":"Blankenship","lastname":"Ramirez","age":31,"gender":"M","address":"630 Graham Avenue","employer":"Bytrex","email":"blankenshipramirez@bytrex.com","city":"Bancroft","state":"CT"}
{"index":{"_id":"514"}}
{"account_number":514,"balance":30125,"firstname":"Solomon","lastname":"Bush","age":34,"gender":"M","address":"409 Harkness Avenue","employer":"Snacktion","email":"solomonbush@snacktion.com","city":"Grayhawk","state":"TX"}
{"index":{"_id":"519"}}
{"account_number":519,"balance":3282,"firstname":"Lorna","lastname":"Franco","age":31,"gender":"F","address":"722 Schenck Court","employer":"Zentia","email":"lornafranco@zentia.com","city":"National","state":"FL"}
{"index":{"_id":"521"}}
{"account_number":521,"balance":16348,"firstname":"Josefa","lastname":"Buckley","age":34,"gender":"F","address":"848 Taylor Street","employer":"Mazuda","email":"josefabuckley@mazuda.com","city":"Saranap","state":"NM"}
{"index":{"_id":"526"}}
{"account_number":526,"balance":35375,"firstname":"Sweeney","lastname":"Fulton","age":33,"gender":"F","address":"550 Martense Street","employer":"Cormoran","email":"sweeneyfulton@cormoran.com","city":"Chalfant","state":"IA"}
{"index":{"_id":"533"}}
{"account_number":533,"balance":13761,"firstname":"Margarita","lastname":"Diaz","age":23,"gender":"M","address":"295 Tapscott Street","employer":"Zilodyne","email":"margaritadiaz@zilodyne.com","city":"Hondah","state":"ID"}
{"index":{"_id":"538"}}
{"account_number":538,"balance":16416,"firstname":"Koch","lastname":"Barker","age":21,"gender":"M","address":"919 Gerry Street","employer":"Xplor","email":"kochbarker@xplor.com","city":"Dixie","state":"WY"}
{"index":{"_id":"540"}}
{"account_number":540,"balance":40235,"firstname":"Tammy","lastname":"Wiggins","age":32,"gender":"F","address":"186 Schenectady Avenue","employer":"Speedbolt","email":"tammywiggins@speedbolt.com","city":"Salvo","state":"LA"}
{"index":{"_id":"545"}}
{"account_number":545,"balance":27011,"firstname":"Lena","lastname":"Lucas","age":20,"gender":"M","address":"110 Lamont Court","employer":"Kindaloo","email":"lenalucas@kindaloo.com","city":"Harleigh","state":"KY"}
{"index":{"_id":"552"}}
{"account_number":552,"balance":14727,"firstname":"Kate","lastname":"Estes","age":39,"gender":"M","address":"785 Willmohr Street","employer":"Rodeocean","email":"kateestes@rodeocean.com","city":"Elfrida","state":"HI"}
{"index":{"_id":"557"}}
{"account_number":557,"balance":3119,"firstname":"Landry","lastname":"Buck","age":20,"gender":"M","address":"558 Schweikerts Walk","employer":"Protodyne","email":"landrybuck@protodyne.com","city":"Edneyville","state":"AL"}
{"index":{"_id":"564"}}
{"account_number":564,"balance":43631,"firstname":"Owens","lastname":"Bowers","age":22,"gender":"M","address":"842 Congress Street","employer":"Nspire","email":"owensbowers@nspire.com","city":"Machias","state":"VA"}
{"index":{"_id":"569"}}
{"account_number":569,"balance":40019,"firstname":"Sherri","lastname":"Rowe","age":39,"gender":"F","address":"591 Arlington Place","employer":"Netility","email":"sherrirowe@netility.com","city":"Bridgetown","state":"SC"}
{"index":{"_id":"571"}}
{"account_number":571,"balance":3014,"firstname":"Ayers","lastname":"Duffy","age":28,"gender":"F","address":"721 Wortman Avenue","employer":"Aquasseur","email":"ayersduffy@aquasseur.com","city":"Tilleda","state":"MS"}
{"index":{"_id":"576"}}
{"account_number":576,"balance":29682,"firstname":"Helena","lastname":"Robertson","age":33,"gender":"F","address":"774 Devon Avenue","employer":"Vicon","email":"helenarobertson@vicon.com","city":"Dyckesville","state":"NV"}
{"index":{"_id":"583"}}
{"account_number":583,"balance":26558,"firstname":"Castro","lastname":"West","age":34,"gender":"F","address":"814 Williams Avenue","employer":"Cipromox","email":"castrowest@cipromox.com","city":"Nescatunga","state":"IL"}
{"index":{"_id":"588"}}
{"account_number":588,"balance":43531,"firstname":"Martina","lastname":"Collins","age":31,"gender":"M","address":"301 Anna Court","employer":"Geekwagon","email":"martinacollins@geekwagon.com","city":"Oneida","state":"VA"}
{"index":{"_id":"590"}}
{"account_number":590,"balance":4652,"firstname":"Ladonna","lastname":"Tucker","age":31,"gender":"F","address":"162 Kane Place","employer":"Infotrips","email":"ladonnatucker@infotrips.com","city":"Utting","state":"IA"}
{"index":{"_id":"595"}}
{"account_number":595,"balance":12478,"firstname":"Mccall","lastname":"Britt","age":36,"gender":"F","address":"823 Hill Street","employer":"Cablam","email":"mccallbritt@cablam.com","city":"Vernon","state":"CA"}
{"index":{"_id":"603"}}
{"account_number":603,"balance":28145,"firstname":"Janette","lastname":"Guzman","age":31,"gender":"F","address":"976 Kingston Avenue","employer":"Splinx","email":"janetteguzman@splinx.com","city":"Boomer","state":"NC"}
{"index":{"_id":"608"}}
{"account_number":608,"balance":47091,"firstname":"Carey","lastname":"Whitley","age":32,"gender":"F","address":"976 Lawrence Street","employer":"Poshome","email":"careywhitley@poshome.com","city":"Weogufka","state":"NE"}
{"index":{"_id":"610"}}
{"account_number":610,"balance":40571,"firstname":"Foster","lastname":"Weber","age":24,"gender":"F","address":"323 Rochester Avenue","employer":"Firewax","email":"fosterweber@firewax.com","city":"Winston","state":"NY"}
{"index":{"_id":"615"}}
{"account_number":615,"balance":28726,"firstname":"Delgado","lastname":"Curry","age":28,"gender":"F","address":"706 Butler Street","employer":"Zoxy","email":"delgadocurry@zoxy.com","city":"Gracey","state":"SD"}
{"index":{"_id":"622"}}
{"account_number":622,"balance":9661,"firstname":"Paulette","lastname":"Hartman","age":38,"gender":"M","address":"375 Emerald Street","employer":"Locazone","email":"paulettehartman@locazone.com","city":"Canterwood","state":"OH"}
{"index":{"_id":"627"}}
{"account_number":627,"balance":47546,"firstname":"Crawford","lastname":"Sears","age":37,"gender":"F","address":"686 Eastern Parkway","employer":"Updat","email":"crawfordsears@updat.com","city":"Bison","state":"VT"}
{"index":{"_id":"634"}}
{"account_number":634,"balance":29805,"firstname":"Deloris","lastname":"Levy","age":38,"gender":"M","address":"838 Foster Avenue","employer":"Homelux","email":"delorislevy@homelux.com","city":"Kempton","state":"PA"}
{"index":{"_id":"639"}}
{"account_number":639,"balance":28875,"firstname":"Caitlin","lastname":"Clements","age":32,"gender":"F","address":"627 Aster Court","employer":"Bunga","email":"caitlinclements@bunga.com","city":"Cetronia","state":"SC"}
{"index":{"_id":"641"}}
{"account_number":641,"balance":18345,"firstname":"Sheppard","lastname":"Everett","age":39,"gender":"F","address":"791 Norwood Avenue","employer":"Roboid","email":"sheppardeverett@roboid.com","city":"Selma","state":"AK"}
{"index":{"_id":"646"}}
{"account_number":646,"balance":15559,"firstname":"Lavonne","lastname":"Reyes","age":31,"gender":"F","address":"983 Newport Street","employer":"Parcoe","email":"lavonnereyes@parcoe.com","city":"Monument","state":"LA"}
{"index":{"_id":"653"}}
{"account_number":653,"balance":7606,"firstname":"Marcia","lastname":"Bennett","age":33,"gender":"F","address":"455 Bragg Street","employer":"Opticall","email":"marciabennett@opticall.com","city":"Magnolia","state":"NC"}
{"index":{"_id":"658"}}
{"account_number":658,"balance":10210,"firstname":"Bass","lastname":"Mcconnell","age":32,"gender":"F","address":"274 Ocean Avenue","employer":"Combot","email":"bassmcconnell@combot.com","city":"Beyerville","state":"OH"}
{"index":{"_id":"660"}}
{"account_number":660,"balance":46427,"firstname":"Moon","lastname":"Wood","age":33,"gender":"F","address":"916 Amersfort Place","employer":"Olucore","email":"moonwood@olucore.com","city":"Como","state":"VA"}
{"index":{"_id":"665"}}
{"account_number":665,"balance":15215,"firstname":"Britney","lastname":"Young","age":36,"gender":"M","address":"766 Sackman Street","employer":"Geoforma","email":"britneyyoung@geoforma.com","city":"Tuttle","state":"WI"}
{"index":{"_id":"672"}}
{"account_number":672,"balance":12621,"firstname":"Camille","lastname":"Munoz","age":36,"gender":"F","address":"959 Lewis Place","employer":"Vantage","email":"camillemunoz@vantage.com","city":"Whitmer","state":"IN"}
{"index":{"_id":"677"}}
{"account_number":677,"balance":8491,"firstname":"Snider","lastname":"Benton","age":26,"gender":"M","address":"827 Evans Street","employer":"Medicroix","email":"sniderbenton@medicroix.com","city":"Kaka","state":"UT"}
{"index":{"_id":"684"}}
{"account_number":684,"balance":46091,"firstname":"Warren","lastname":"Snow","age":25,"gender":"M","address":"756 Oakland Place","employer":"Bizmatic","email":"warrensnow@bizmatic.com","city":"Hatteras","state":"NE"}
{"index":{"_id":"689"}}
{"account_number":689,"balance":14985,"firstname":"Ines","lastname":"Chaney","age":28,"gender":"M","address":"137 Dikeman Street","employer":"Zidant","email":"ineschaney@zidant.com","city":"Nettie","state":"DC"}
{"index":{"_id":"691"}}
{"account_number":691,"balance":10792,"firstname":"Mclean","lastname":"Colon","age":22,"gender":"M","address":"876 Classon Avenue","employer":"Elentrix","email":"mcleancolon@elentrix.com","city":"Unionville","state":"OK"}
{"index":{"_id":"696"}}
{"account_number":696,"balance":17568,"firstname":"Crane","lastname":"Matthews","age":32,"gender":"F","address":"721 Gerritsen Avenue","employer":"Intradisk","email":"cranematthews@intradisk.com","city":"Brewster","state":"WV"}
{"index":{"_id":"704"}}
{"account_number":704,"balance":45347,"firstname":"Peters","lastname":"Kent","age":22,"gender":"F","address":"871 Independence Avenue","employer":"Extragen","email":"peterskent@extragen.com","city":"Morriston","state":"CA"}
{"index":{"_id":"709"}}
{"account_number":709,"balance":11015,"firstname":"Abbott","lastname":"Odom","age":29,"gender":"M","address":"893 Union Street","employer":"Jimbies","email":"abbottodom@jimbies.com","city":"Leeper","state":"NJ"}
{"index":{"_id":"711"}}
{"account_number":711,"balance":26939,"firstname":"Villarreal","lastname":"Horton","age":35,"gender":"F","address":"861 Creamer Street","employer":"Lexicondo","email":"villarrealhorton@lexicondo.com","city":"Lydia","state":"MS"}
{"index":{"_id":"716"}}
{"account_number":716,"balance":19789,"firstname":"Paul","lastname":"Mason","age":34,"gender":"F","address":"618 Nichols Avenue","employer":"Slax","email":"paulmason@slax.com","city":"Snowville","state":"OK"}
{"index":{"_id":"723"}}
{"account_number":723,"balance":16421,"firstname":"Nixon","lastname":"Moran","age":27,"gender":"M","address":"569 Campus Place","employer":"Cuizine","email":"nixonmoran@cuizine.com","city":"Buxton","state":"DC"}
{"index":{"_id":"728"}}
{"account_number":728,"balance":44818,"firstname":"Conley","lastname":"Preston","age":28,"gender":"M","address":"450 Coventry Road","employer":"Obones","email":"conleypreston@obones.com","city":"Alden","state":"CO"}
{"index":{"_id":"730"}}
{"account_number":730,"balance":41299,"firstname":"Moore","lastname":"Lee","age":30,"gender":"M","address":"797 Turner Place","employer":"Orbean","email":"moorelee@orbean.com","city":"Highland","state":"DE"}
{"index":{"_id":"735"}}
{"account_number":735,"balance":3984,"firstname":"Loraine","lastname":"Willis","age":32,"gender":"F","address":"928 Grove Street","employer":"Gadtron","email":"lorainewillis@gadtron.com","city":"Lowgap","state":"NY"}
{"index":{"_id":"742"}}
{"account_number":742,"balance":24765,"firstname":"Merle","lastname":"Wooten","age":26,"gender":"M","address":"317 Pooles Lane","employer":"Tropolis","email":"merlewooten@tropolis.com","city":"Bentley","state":"ND"}
{"index":{"_id":"747"}}
{"account_number":747,"balance":16617,"firstname":"Diaz","lastname":"Austin","age":38,"gender":"M","address":"676 Harway Avenue","employer":"Irack","email":"diazaustin@irack.com","city":"Cliff","state":"HI"}
{"index":{"_id":"754"}}
{"account_number":754,"balance":10779,"firstname":"Jones","lastname":"Vega","age":25,"gender":"F","address":"795 India Street","employer":"Gluid","email":"jonesvega@gluid.com","city":"Tyhee","state":"FL"}
{"index":{"_id":"759"}}
{"account_number":759,"balance":38007,"firstname":"Rose","lastname":"Carlson","age":27,"gender":"M","address":"987 Navy Street","employer":"Aquasure","email":"rosecarlson@aquasure.com","city":"Carlton","state":"CT"}
{"index":{"_id":"761"}}
{"account_number":761,"balance":7663,"firstname":"Rae","lastname":"Juarez","age":34,"gender":"F","address":"560 Gilmore Court","employer":"Entropix","email":"raejuarez@entropix.com","city":"Northchase","state":"ID"}
{"index":{"_id":"766"}}
{"account_number":766,"balance":21957,"firstname":"Thomas","lastname":"Gillespie","age":38,"gender":"M","address":"993 Williams Place","employer":"Octocore","email":"thomasgillespie@octocore.com","city":"Defiance","state":"MS"}
{"index":{"_id":"773"}}
{"account_number":773,"balance":31126,"firstname":"Liza","lastname":"Coffey","age":36,"gender":"F","address":"540 Bulwer Place","employer":"Assurity","email":"lizacoffey@assurity.com","city":"Gilgo","state":"WV"}
{"index":{"_id":"778"}}
{"account_number":778,"balance":46007,"firstname":"Underwood","lastname":"Wheeler","age":28,"gender":"M","address":"477 Provost Street","employer":"Decratex","email":"underwoodwheeler@decratex.com","city":"Sardis","state":"ID"}
{"index":{"_id":"780"}}
{"account_number":780,"balance":4682,"firstname":"Maryanne","lastname":"Hendricks","age":26,"gender":"F","address":"709 Wolcott Street","employer":"Sarasonic","email":"maryannehendricks@sarasonic.com","city":"Santel","state":"NH"}
{"index":{"_id":"785"}}
{"account_number":785,"balance":25078,"firstname":"Fields","lastname":"Lester","age":29,"gender":"M","address":"808 Chestnut Avenue","employer":"Visualix","email":"fieldslester@visualix.com","city":"Rowe","state":"PA"}
{"index":{"_id":"792"}}
{"account_number":792,"balance":13109,"firstname":"Becky","lastname":"Jimenez","age":40,"gender":"F","address":"539 Front Street","employer":"Isologia","email":"beckyjimenez@isologia.com","city":"Summertown","state":"MI"}
{"index":{"_id":"797"}}
{"account_number":797,"balance":6854,"firstname":"Lindsay","lastname":"Mills","age":26,"gender":"F","address":"919 Quay Street","employer":"Zoinage","email":"lindsaymills@zoinage.com","city":"Elliston","state":"VA"}
{"index":{"_id":"800"}}
{"account_number":800,"balance":26217,"firstname":"Candy","lastname":"Oconnor","age":28,"gender":"M","address":"200 Newel Street","employer":"Radiantix","email":"candyoconnor@radiantix.com","city":"Sandston","state":"OH"}
{"index":{"_id":"805"}}
{"account_number":805,"balance":18426,"firstname":"Jackson","lastname":"Sampson","age":27,"gender":"F","address":"722 Kenmore Court","employer":"Daido","email":"jacksonsampson@daido.com","city":"Bellamy","state":"ME"}
{"index":{"_id":"812"}}
{"account_number":812,"balance":42593,"firstname":"Graves","lastname":"Newman","age":32,"gender":"F","address":"916 Joralemon Street","employer":"Ecrater","email":"gravesnewman@ecrater.com","city":"Crown","state":"PA"}
{"index":{"_id":"817"}}
{"account_number":817,"balance":36582,"firstname":"Padilla","lastname":"Bauer","age":36,"gender":"F","address":"310 Cadman Plaza","employer":"Exoblue","email":"padillabauer@exoblue.com","city":"Ahwahnee","state":"MN"}
{"index":{"_id":"824"}}
{"account_number":824,"balance":6053,"firstname":"Dyer","lastname":"Henson","age":33,"gender":"M","address":"650 Seaview Avenue","employer":"Nitracyr","email":"dyerhenson@nitracyr.com","city":"Gibsonia","state":"KS"}
{"index":{"_id":"829"}}
{"account_number":829,"balance":20263,"firstname":"Althea","lastname":"Bell","age":37,"gender":"M","address":"319 Cook Street","employer":"Hyplex","email":"altheabell@hyplex.com","city":"Wadsworth","state":"DC"}
{"index":{"_id":"831"}}
{"account_number":831,"balance":25375,"firstname":"Wendy","lastname":"Savage","age":37,"gender":"M","address":"421 Veranda Place","employer":"Neurocell","email":"wendysavage@neurocell.com","city":"Fresno","state":"MS"}
{"index":{"_id":"836"}}
{"account_number":836,"balance":20797,"firstname":"Lloyd","lastname":"Lindsay","age":25,"gender":"F","address":"953 Dinsmore Place","employer":"Suretech","email":"lloydlindsay@suretech.com","city":"Conway","state":"VA"}
{"index":{"_id":"843"}}
{"account_number":843,"balance":15555,"firstname":"Patricia","lastname":"Barton","age":34,"gender":"F","address":"406 Seabring Street","employer":"Providco","email":"patriciabarton@providco.com","city":"Avoca","state":"RI"}
{"index":{"_id":"848"}}
{"account_number":848,"balance":15443,"firstname":"Carmella","lastname":"Cash","age":38,"gender":"M","address":"988 Exeter Street","employer":"Bristo","email":"carmellacash@bristo.com","city":"Northridge","state":"ID"}
{"index":{"_id":"850"}}
{"account_number":850,"balance":6531,"firstname":"Carlene","lastname":"Gaines","age":37,"gender":"F","address":"753 Monroe Place","employer":"Naxdis","email":"carlenegaines@naxdis.com","city":"Genoa","state":"OR"}
{"index":{"_id":"855"}}
{"account_number":855,"balance":40170,"firstname":"Mia","lastname":"Stevens","age":31,"gender":"F","address":"326 Driggs Avenue","employer":"Aeora","email":"miastevens@aeora.com","city":"Delwood","state":"IL"}
{"index":{"_id":"862"}}
{"account_number":862,"balance":38792,"firstname":"Clayton","lastname":"Golden","age":38,"gender":"F","address":"620 Regent Place","employer":"Accusage","email":"claytongolden@accusage.com","city":"Ona","state":"NC"}
{"index":{"_id":"867"}}
{"account_number":867,"balance":45453,"firstname":"Blanca","lastname":"Ellison","age":23,"gender":"F","address":"593 McKibben Street","employer":"Koogle","email":"blancaellison@koogle.com","city":"Frystown","state":"WY"}
{"index":{"_id":"874"}}
{"account_number":874,"balance":23079,"firstname":"Lynette","lastname":"Higgins","age":22,"gender":"M","address":"377 McKinley Avenue","employer":"Menbrain","email":"lynettehiggins@menbrain.com","city":"Manitou","state":"TX"}
{"index":{"_id":"879"}}
{"account_number":879,"balance":48332,"firstname":"Sabrina","lastname":"Lancaster","age":31,"gender":"F","address":"382 Oak Street","employer":"Webiotic","email":"sabrinalancaster@webiotic.com","city":"Lindisfarne","state":"AZ"}
{"index":{"_id":"881"}}
{"account_number":881,"balance":26684,"firstname":"Barnes","lastname":"Ware","age":38,"gender":"F","address":"666 Hooper Street","employer":"Norali","email":"barnesware@norali.com","city":"Cazadero","state":"GA"}
{"index":{"_id":"886"}}
{"account_number":886,"balance":14867,"firstname":"Willa","lastname":"Leblanc","age":38,"gender":"F","address":"773 Bergen Street","employer":"Nurali","email":"willaleblanc@nurali.com","city":"Hilltop","state":"NC"}
{"index":{"_id":"893"}}
{"account_number":893,"balance":42584,"firstname":"Moses","lastname":"Campos","age":38,"gender":"F","address":"991 Bevy Court","employer":"Trollery","email":"mosescampos@trollery.com","city":"Freetown","state":"AK"}
{"index":{"_id":"898"}}
{"account_number":898,"balance":12019,"firstname":"Lori","lastname":"Stevenson","age":29,"gender":"M","address":"910 Coles Street","employer":"Honotron","email":"loristevenson@honotron.com","city":"Shindler","state":"VT"}
{"index":{"_id":"901"}}
{"account_number":901,"balance":35038,"firstname":"Irma","lastname":"Dotson","age":23,"gender":"F","address":"245 Mayfair Drive","employer":"Bleeko","email":"irmadotson@bleeko.com","city":"Lodoga","state":"UT"}
{"index":{"_id":"906"}}
{"account_number":906,"balance":24073,"firstname":"Vicki","lastname":"Suarez","age":36,"gender":"M","address":"829 Roosevelt Place","employer":"Utara","email":"vickisuarez@utara.com","city":"Albrightsville","state":"AR"}
{"index":{"_id":"913"}}
{"account_number":913,"balance":47657,"firstname":"Margery","lastname":"Monroe","age":25,"gender":"M","address":"941 Fanchon Place","employer":"Exerta","email":"margerymonroe@exerta.com","city":"Bannock","state":"MD"}
{"index":{"_id":"918"}}
{"account_number":918,"balance":36776,"firstname":"Dianna","lastname":"Hernandez","age":25,"gender":"M","address":"499 Moultrie Street","employer":"Isologica","email":"diannahernandez@isologica.com","city":"Falconaire","state":"ID"}
{"index":{"_id":"920"}}
{"account_number":920,"balance":41513,"firstname":"Jerri","lastname":"Mitchell","age":26,"gender":"M","address":"831 Kent Street","employer":"Tasmania","email":"jerrimitchell@tasmania.com","city":"Cotopaxi","state":"IA"}
{"index":{"_id":"925"}}
{"account_number":925,"balance":18295,"firstname":"Rosario","lastname":"Jackson","age":24,"gender":"M","address":"178 Leonora Court","employer":"Progenex","email":"rosariojackson@progenex.com","city":"Rivereno","state":"DE"}
{"index":{"_id":"932"}}
{"account_number":932,"balance":3111,"firstname":"Summer","lastname":"Porter","age":33,"gender":"F","address":"949 Grand Avenue","employer":"Multiflex","email":"summerporter@multiflex.com","city":"Spokane","state":"OK"}
{"index":{"_id":"937"}}
{"account_number":937,"balance":43491,"firstname":"Selma","lastname":"Anderson","age":24,"gender":"M","address":"205 Reed Street","employer":"Dadabase","email":"selmaanderson@dadabase.com","city":"Malo","state":"AL"}
{"index":{"_id":"944"}}
{"account_number":944,"balance":46478,"firstname":"Donaldson","lastname":"Woodard","age":38,"gender":"F","address":"498 Laurel Avenue","employer":"Zogak","email":"donaldsonwoodard@zogak.com","city":"Hasty","state":"ID"}
{"index":{"_id":"949"}}
{"account_number":949,"balance":48703,"firstname":"Latasha","lastname":"Mullins","age":29,"gender":"F","address":"272 Lefferts Place","employer":"Zenolux","email":"latashamullins@zenolux.com","city":"Kieler","state":"MN"}
{"index":{"_id":"951"}}
{"account_number":951,"balance":36337,"firstname":"Tran","lastname":"Burris","age":25,"gender":"F","address":"561 Rutland Road","employer":"Geoform","email":"tranburris@geoform.com","city":"Longbranch","state":"IL"}
{"index":{"_id":"956"}}
{"account_number":956,"balance":19477,"firstname":"Randall","lastname":"Lynch","age":22,"gender":"F","address":"490 Madison Place","employer":"Cosmetex","email":"randalllynch@cosmetex.com","city":"Wells","state":"SD"}
{"index":{"_id":"963"}}
{"account_number":963,"balance":30461,"firstname":"Griffin","lastname":"Sheppard","age":20,"gender":"M","address":"682 Linden Street","employer":"Zanymax","email":"griffinsheppard@zanymax.com","city":"Fannett","state":"NM"}
{"index":{"_id":"968"}}
{"account_number":968,"balance":32371,"firstname":"Luella","lastname":"Burch","age":39,"gender":"M","address":"684 Arkansas Drive","employer":"Krag","email":"luellaburch@krag.com","city":"Brambleton","state":"SD"}
{"index":{"_id":"970"}}
{"account_number":970,"balance":19648,"firstname":"Forbes","lastname":"Wallace","age":28,"gender":"M","address":"990 Mill Road","employer":"Pheast","email":"forbeswallace@pheast.com","city":"Lopezo","state":"AK"}
{"index":{"_id":"975"}}
{"account_number":975,"balance":5239,"firstname":"Delores","lastname":"Booker","age":27,"gender":"F","address":"328 Conselyea Street","employer":"Centice","email":"deloresbooker@centice.com","city":"Williams","state":"HI"}
{"index":{"_id":"982"}}
{"account_number":982,"balance":16511,"firstname":"Buck","lastname":"Robinson","age":24,"gender":"M","address":"301 Melrose Street","employer":"Calcu","email":"buckrobinson@calcu.com","city":"Welch","state":"PA"}
{"index":{"_id":"987"}}
{"account_number":987,"balance":4072,"firstname":"Brock","lastname":"Sandoval","age":20,"gender":"F","address":"977 Gem Street","employer":"Fiberox","email":"brocksandoval@fiberox.com","city":"Celeryville","state":"NY"}
{"index":{"_id":"994"}}
{"account_number":994,"balance":33298,"firstname":"Madge","lastname":"Holcomb","age":31,"gender":"M","address":"612 Hawthorne Street","employer":"Escenta","email":"madgeholcomb@escenta.com","city":"Alafaya","state":"OR"}
{"index":{"_id":"999"}}
{"account_number":999,"balance":6087,"firstname":"Dorothy","lastname":"Barron","age":22,"gender":"F","address":"499 Laurel Avenue","employer":"Xurban","email":"dorothybarron@xurban.com","city":"Belvoir","state":"CA"}
{"index":{"_id":"4"}}
{"account_number":4,"balance":27658,"firstname":"Rodriquez","lastname":"Flores","age":31,"gender":"F","address":"986 Wyckoff Avenue","employer":"Tourmania","email":"rodriquezflores@tourmania.com","city":"Eastvale","state":"HI"}
{"index":{"_id":"9"}}
{"account_number":9,"balance":24776,"firstname":"Opal","lastname":"Meadows","age":39,"gender":"M","address":"963 Neptune Avenue","employer":"Cedward","email":"opalmeadows@cedward.com","city":"Olney","state":"OH"}
{"index":{"_id":"11"}}
{"account_number":11,"balance":20203,"firstname":"Jenkins","lastname":"Haney","age":20,"gender":"M","address":"740 Ferry Place","employer":"Qimonk","email":"jenkinshaney@qimonk.com","city":"Steinhatchee","state":"GA"}
{"index":{"_id":"16"}}
{"account_number":16,"balance":35883,"firstname":"Adrian","lastname":"Pitts","age":34,"gender":"F","address":"963 Fay Court","employer":"Combogene","email":"adrianpitts@combogene.com","city":"Remington","state":"SD"}
{"index":{"_id":"23"}}
{"account_number":23,"balance":42374,"firstname":"Kirsten","lastname":"Fox","age":20,"gender":"M","address":"330 Dumont Avenue","employer":"Codax","email":"kirstenfox@codax.com","city":"Walton","state":"AK"}
{"index":{"_id":"28"}}
{"account_number":28,"balance":42112,"firstname":"Vega","lastname":"Flynn","age":20,"gender":"M","address":"647 Hyman Court","employer":"Accupharm","email":"vegaflynn@accupharm.com","city":"Masthope","state":"OH"}
{"index":{"_id":"30"}}
{"account_number":30,"balance":19087,"firstname":"Lamb","lastname":"Townsend","age":26,"gender":"M","address":"169 Lyme Avenue","employer":"Geeknet","email":"lambtownsend@geeknet.com","city":"Epworth","state":"AL"}
{"index":{"_id":"35"}}
{"account_number":35,"balance":42039,"firstname":"Darla","lastname":"Bridges","age":27,"gender":"F","address":"315 Central Avenue","employer":"Xeronk","email":"darlabridges@xeronk.com","city":"Woodlake","state":"RI"}
{"index":{"_id":"42"}}
{"account_number":42,"balance":21137,"firstname":"Harding","lastname":"Hobbs","age":26,"gender":"F","address":"474 Ridgewood Place","employer":"Xth","email":"hardinghobbs@xth.com","city":"Heil","state":"ND"}
{"index":{"_id":"47"}}
{"account_number":47,"balance":33044,"firstname":"Georgia","lastname":"Wilkerson","age":23,"gender":"M","address":"369 Herbert Street","employer":"Endipin","email":"georgiawilkerson@endipin.com","city":"Dellview","state":"WI"}
{"index":{"_id":"54"}}
{"account_number":54,"balance":23406,"firstname":"Angel","lastname":"Mann","age":22,"gender":"F","address":"229 Ferris Street","employer":"Amtas","email":"angelmann@amtas.com","city":"Calverton","state":"WA"}
{"index":{"_id":"59"}}
{"account_number":59,"balance":37728,"firstname":"Malone","lastname":"Justice","age":37,"gender":"F","address":"721 Russell Street","employer":"Emoltra","email":"malonejustice@emoltra.com","city":"Trucksville","state":"HI"}
{"index":{"_id":"61"}}
{"account_number":61,"balance":6856,"firstname":"Shawn","lastname":"Baird","age":20,"gender":"M","address":"605 Monument Walk","employer":"Moltonic","email":"shawnbaird@moltonic.com","city":"Darlington","state":"MN"}
{"index":{"_id":"66"}}
{"account_number":66,"balance":25939,"firstname":"Franks","lastname":"Salinas","age":28,"gender":"M","address":"437 Hamilton Walk","employer":"Cowtown","email":"frankssalinas@cowtown.com","city":"Chase","state":"VT"}
{"index":{"_id":"73"}}
{"account_number":73,"balance":33457,"firstname":"Irene","lastname":"Stephenson","age":32,"gender":"M","address":"684 Miller Avenue","employer":"Hawkster","email":"irenestephenson@hawkster.com","city":"Levant","state":"AR"}
{"index":{"_id":"78"}}
{"account_number":78,"balance":48656,"firstname":"Elvira","lastname":"Patterson","age":23,"gender":"F","address":"834 Amber Street","employer":"Assistix","email":"elvirapatterson@assistix.com","city":"Dunbar","state":"TN"}
{"index":{"_id":"80"}}
{"account_number":80,"balance":13445,"firstname":"Lacey","lastname":"Blanchard","age":30,"gender":"F","address":"823 Himrod Street","employer":"Comdom","email":"laceyblanchard@comdom.com","city":"Matthews","state":"MO"}
{"index":{"_id":"85"}}
{"account_number":85,"balance":48735,"firstname":"Wilcox","lastname":"Sellers","age":20,"gender":"M","address":"212 Irving Avenue","employer":"Confrenzy","email":"wilcoxsellers@confrenzy.com","city":"Kipp","state":"MT"}
{"index":{"_id":"92"}}
{"account_number":92,"balance":26753,"firstname":"Gay","lastname":"Brewer","age":34,"gender":"M","address":"369 Ditmars Street","employer":"Savvy","email":"gaybrewer@savvy.com","city":"Moquino","state":"HI"}
{"index":{"_id":"97"}}
{"account_number":97,"balance":49671,"firstname":"Karen","lastname":"Trujillo","age":40,"gender":"F","address":"512 Cumberland Walk","employer":"Tsunamia","email":"karentrujillo@tsunamia.com","city":"Fredericktown","state":"MO"}
{"index":{"_id":"100"}}
{"account_number":100,"balance":29869,"firstname":"Madden","lastname":"Woods","age":32,"gender":"F","address":"696 Ryder Avenue","employer":"Slumberia","email":"maddenwoods@slumberia.com","city":"Deercroft","state":"ME"}
{"index":{"_id":"105"}}
{"account_number":105,"balance":29654,"firstname":"Castillo","lastname":"Dickerson","age":33,"gender":"F","address":"673 Oxford Street","employer":"Tellifly","email":"castillodickerson@tellifly.com","city":"Succasunna","state":"NY"}
{"index":{"_id":"112"}}
{"account_number":112,"balance":38395,"firstname":"Frederick","lastname":"Case","age":30,"gender":"F","address":"580 Lexington Avenue","employer":"Talkalot","email":"frederickcase@talkalot.com","city":"Orovada","state":"MA"}
{"index":{"_id":"117"}}
{"account_number":117,"balance":48831,"firstname":"Robin","lastname":"Hays","age":38,"gender":"F","address":"347 Hornell Loop","employer":"Pasturia","email":"robinhays@pasturia.com","city":"Sims","state":"WY"}
{"index":{"_id":"124"}}
{"account_number":124,"balance":16425,"firstname":"Fern","lastname":"Lambert","age":20,"gender":"M","address":"511 Jay Street","employer":"Furnitech","email":"fernlambert@furnitech.com","city":"Cloverdale","state":"FL"}
{"index":{"_id":"129"}}
{"account_number":129,"balance":42409,"firstname":"Alexandria","lastname":"Sanford","age":33,"gender":"F","address":"934 Ridgecrest Terrace","employer":"Kyagoro","email":"alexandriasanford@kyagoro.com","city":"Concho","state":"UT"}
{"index":{"_id":"131"}}
{"account_number":131,"balance":28030,"firstname":"Dollie","lastname":"Koch","age":22,"gender":"F","address":"287 Manhattan Avenue","employer":"Skinserve","email":"dolliekoch@skinserve.com","city":"Shasta","state":"PA"}
{"index":{"_id":"136"}}
{"account_number":136,"balance":45801,"firstname":"Winnie","lastname":"Holland","age":38,"gender":"M","address":"198 Mill Lane","employer":"Neteria","email":"winnieholland@neteria.com","city":"Urie","state":"IL"}
{"index":{"_id":"143"}}
{"account_number":143,"balance":43093,"firstname":"Cohen","lastname":"Noble","age":39,"gender":"M","address":"454 Nelson Street","employer":"Buzzworks","email":"cohennoble@buzzworks.com","city":"Norvelt","state":"CO"}
{"index":{"_id":"148"}}
{"account_number":148,"balance":3662,"firstname":"Annmarie","lastname":"Snider","age":34,"gender":"F","address":"857 Lafayette Walk","employer":"Edecine","email":"annmariesnider@edecine.com","city":"Hollins","state":"OH"}
{"index":{"_id":"150"}}
{"account_number":150,"balance":15306,"firstname":"Ortega","lastname":"Dalton","age":20,"gender":"M","address":"237 Mermaid Avenue","employer":"Rameon","email":"ortegadalton@rameon.com","city":"Maxville","state":"NH"}
{"index":{"_id":"155"}}
{"account_number":155,"balance":27878,"firstname":"Atkinson","lastname":"Hudson","age":39,"gender":"F","address":"434 Colin Place","employer":"Qualitern","email":"atkinsonhudson@qualitern.com","city":"Hoehne","state":"OH"}
{"index":{"_id":"162"}}
{"account_number":162,"balance":6302,"firstname":"Griffith","lastname":"Calderon","age":35,"gender":"M","address":"871 Vandervoort Place","employer":"Quotezart","email":"griffithcalderon@quotezart.com","city":"Barclay","state":"FL"}
{"index":{"_id":"167"}}
{"account_number":167,"balance":42051,"firstname":"Hampton","lastname":"Ryan","age":20,"gender":"M","address":"618 Fleet Place","employer":"Zipak","email":"hamptonryan@zipak.com","city":"Irwin","state":"KS"}
{"index":{"_id":"174"}}
{"account_number":174,"balance":1464,"firstname":"Gamble","lastname":"Pierce","age":23,"gender":"F","address":"650 Eagle Street","employer":"Matrixity","email":"gamblepierce@matrixity.com","city":"Abiquiu","state":"OR"}
{"index":{"_id":"179"}}
{"account_number":179,"balance":13265,"firstname":"Elise","lastname":"Drake","age":25,"gender":"M","address":"305 Christopher Avenue","employer":"Turnling","email":"elisedrake@turnling.com","city":"Loretto","state":"LA"}
{"index":{"_id":"181"}}
{"account_number":181,"balance":27983,"firstname":"Bennett","lastname":"Hampton","age":22,"gender":"F","address":"435 Billings Place","employer":"Voipa","email":"bennetthampton@voipa.com","city":"Rodman","state":"WY"}
{"index":{"_id":"186"}}
{"account_number":186,"balance":18373,"firstname":"Kline","lastname":"Joyce","age":32,"gender":"M","address":"285 Falmouth Street","employer":"Tetratrex","email":"klinejoyce@tetratrex.com","city":"Klondike","state":"SD"}
{"index":{"_id":"193"}}
{"account_number":193,"balance":13412,"firstname":"Patty","lastname":"Petty","age":34,"gender":"F","address":"251 Vermont Street","employer":"Kinetica","email":"pattypetty@kinetica.com","city":"Grantville","state":"MS"}
{"index":{"_id":"198"}}
{"account_number":198,"balance":19686,"firstname":"Rachael","lastname":"Sharp","age":38,"gender":"F","address":"443 Vernon Avenue","employer":"Powernet","email":"rachaelsharp@powernet.com","city":"Canoochee","state":"UT"}
{"index":{"_id":"201"}}
{"account_number":201,"balance":14586,"firstname":"Ronda","lastname":"Perry","age":25,"gender":"F","address":"856 Downing Street","employer":"Artiq","email":"rondaperry@artiq.com","city":"Colton","state":"WV"}
{"index":{"_id":"206"}}
{"account_number":206,"balance":47423,"firstname":"Kelli","lastname":"Francis","age":20,"gender":"M","address":"671 George Street","employer":"Exoswitch","email":"kellifrancis@exoswitch.com","city":"Babb","state":"NJ"}
{"index":{"_id":"213"}}
{"account_number":213,"balance":34172,"firstname":"Bauer","lastname":"Summers","age":27,"gender":"M","address":"257 Boynton Place","employer":"Voratak","email":"bauersummers@voratak.com","city":"Oceola","state":"NC"}
{"index":{"_id":"218"}}
{"account_number":218,"balance":26702,"firstname":"Garrison","lastname":"Bryan","age":24,"gender":"F","address":"478 Greenpoint Avenue","employer":"Uniworld","email":"garrisonbryan@uniworld.com","city":"Comptche","state":"WI"}
{"index":{"_id":"220"}}
{"account_number":220,"balance":3086,"firstname":"Tania","lastname":"Middleton","age":22,"gender":"F","address":"541 Gunther Place","employer":"Zerology","email":"taniamiddleton@zerology.com","city":"Linwood","state":"IN"}
{"index":{"_id":"225"}}
{"account_number":225,"balance":21949,"firstname":"Maryann","lastname":"Murphy","age":24,"gender":"F","address":"894 Bridgewater Street","employer":"Cinesanct","email":"maryannmurphy@cinesanct.com","city":"Cartwright","state":"RI"}
{"index":{"_id":"232"}}
{"account_number":232,"balance":11984,"firstname":"Carr","lastname":"Jensen","age":34,"gender":"F","address":"995 Micieli Place","employer":"Biohab","email":"carrjensen@biohab.com","city":"Waikele","state":"OH"}
{"index":{"_id":"237"}}
{"account_number":237,"balance":5603,"firstname":"Kirby","lastname":"Watkins","age":27,"gender":"F","address":"348 Blake Court","employer":"Sonique","email":"kirbywatkins@sonique.com","city":"Freelandville","state":"PA"}
{"index":{"_id":"244"}}
{"account_number":244,"balance":8048,"firstname":"Judith","lastname":"Riggs","age":27,"gender":"F","address":"590 Kosciusko Street","employer":"Arctiq","email":"judithriggs@arctiq.com","city":"Gorham","state":"DC"}
{"index":{"_id":"249"}}
{"account_number":249,"balance":16822,"firstname":"Mckinney","lastname":"Gallagher","age":38,"gender":"F","address":"939 Seigel Court","employer":"Premiant","email":"mckinneygallagher@premiant.com","city":"Catharine","state":"NH"}
{"index":{"_id":"251"}}
{"account_number":251,"balance":13475,"firstname":"Marks","lastname":"Graves","age":39,"gender":"F","address":"427 Lawn Court","employer":"Dentrex","email":"marksgraves@dentrex.com","city":"Waukeenah","state":"IL"}
{"index":{"_id":"256"}}
{"account_number":256,"balance":48318,"firstname":"Simon","lastname":"Hogan","age":31,"gender":"M","address":"789 Suydam Place","employer":"Dancerity","email":"simonhogan@dancerity.com","city":"Dargan","state":"GA"}
{"index":{"_id":"263"}}
{"account_number":263,"balance":12837,"firstname":"Thornton","lastname":"Meyer","age":29,"gender":"M","address":"575 Elliott Place","employer":"Peticular","email":"thorntonmeyer@peticular.com","city":"Dotsero","state":"NH"}
{"index":{"_id":"268"}}
{"account_number":268,"balance":20925,"firstname":"Avis","lastname":"Blackwell","age":36,"gender":"M","address":"569 Jerome Avenue","employer":"Magnina","email":"avisblackwell@magnina.com","city":"Bethany","state":"MD"}
{"index":{"_id":"270"}}
{"account_number":270,"balance":43951,"firstname":"Moody","lastname":"Harmon","age":39,"gender":"F","address":"233 Vanderbilt Street","employer":"Otherside","email":"moodyharmon@otherside.com","city":"Elwood","state":"MT"}
{"index":{"_id":"275"}}
{"account_number":275,"balance":2384,"firstname":"Reynolds","lastname":"Barnett","age":31,"gender":"M","address":"394 Stockton Street","employer":"Austex","email":"reynoldsbarnett@austex.com","city":"Grandview","state":"MS"}
{"index":{"_id":"282"}}
{"account_number":282,"balance":38540,"firstname":"Gay","lastname":"Schultz","age":25,"gender":"F","address":"805 Claver Place","employer":"Handshake","email":"gayschultz@handshake.com","city":"Tampico","state":"MA"}
{"index":{"_id":"287"}}
{"account_number":287,"balance":10845,"firstname":"Valerie","lastname":"Lang","age":35,"gender":"F","address":"423 Midwood Street","employer":"Quarx","email":"valerielang@quarx.com","city":"Cannondale","state":"VT"}
{"index":{"_id":"294"}}
{"account_number":294,"balance":29582,"firstname":"Pitts","lastname":"Haynes","age":26,"gender":"M","address":"901 Broome Street","employer":"Aquazure","email":"pittshaynes@aquazure.com","city":"Turah","state":"SD"}
{"index":{"_id":"299"}}
{"account_number":299,"balance":40825,"firstname":"Angela","lastname":"Talley","age":36,"gender":"F","address":"822 Bills Place","employer":"Remold","email":"angelatalley@remold.com","city":"Bethpage","state":"DC"}
{"index":{"_id":"302"}}
{"account_number":302,"balance":11298,"firstname":"Isabella","lastname":"Hewitt","age":40,"gender":"M","address":"455 Bedford Avenue","employer":"Cincyr","email":"isabellahewitt@cincyr.com","city":"Blanford","state":"IN"}
{"index":{"_id":"307"}}
{"account_number":307,"balance":43355,"firstname":"Enid","lastname":"Ashley","age":23,"gender":"M","address":"412 Emerson Place","employer":"Avenetro","email":"enidashley@avenetro.com","city":"Catherine","state":"WI"}
{"index":{"_id":"314"}}
{"account_number":314,"balance":5848,"firstname":"Norton","lastname":"Norton","age":35,"gender":"M","address":"252 Ditmas Avenue","employer":"Talkola","email":"nortonnorton@talkola.com","city":"Veyo","state":"SC"}
{"index":{"_id":"319"}}
{"account_number":319,"balance":15430,"firstname":"Ferrell","lastname":"Mckinney","age":36,"gender":"M","address":"874 Cranberry Street","employer":"Portaline","email":"ferrellmckinney@portaline.com","city":"Rose","state":"WV"}
{"index":{"_id":"321"}}
{"account_number":321,"balance":43370,"firstname":"Marta","lastname":"Larsen","age":35,"gender":"M","address":"617 Williams Court","employer":"Manufact","email":"martalarsen@manufact.com","city":"Sisquoc","state":"MA"}
{"index":{"_id":"326"}}
{"account_number":326,"balance":9692,"firstname":"Pearl","lastname":"Reese","age":30,"gender":"F","address":"451 Colonial Court","employer":"Accruex","email":"pearlreese@accruex.com","city":"Westmoreland","state":"MD"}
{"index":{"_id":"333"}}
{"account_number":333,"balance":22778,"firstname":"Trudy","lastname":"Sweet","age":27,"gender":"F","address":"881 Kiely Place","employer":"Acumentor","email":"trudysweet@acumentor.com","city":"Kent","state":"IA"}
{"index":{"_id":"338"}}
{"account_number":338,"balance":6969,"firstname":"Pierce","lastname":"Lawrence","age":35,"gender":"M","address":"318 Gallatin Place","employer":"Lunchpad","email":"piercelawrence@lunchpad.com","city":"Iola","state":"MD"}
{"index":{"_id":"340"}}
{"account_number":340,"balance":42072,"firstname":"Juarez","lastname":"Gutierrez","age":40,"gender":"F","address":"802 Seba Avenue","employer":"Billmed","email":"juarezgutierrez@billmed.com","city":"Malott","state":"OH"}
{"index":{"_id":"345"}}
{"account_number":345,"balance":9812,"firstname":"Parker","lastname":"Hines","age":38,"gender":"M","address":"715 Mill Avenue","employer":"Baluba","email":"parkerhines@baluba.com","city":"Blackgum","state":"KY"}
{"index":{"_id":"352"}}
{"account_number":352,"balance":20290,"firstname":"Kendra","lastname":"Mcintosh","age":31,"gender":"F","address":"963 Wolf Place","employer":"Orboid","email":"kendramcintosh@orboid.com","city":"Bladensburg","state":"AK"}
{"index":{"_id":"357"}}
{"account_number":357,"balance":15102,"firstname":"Adele","lastname":"Carroll","age":39,"gender":"F","address":"381 Arion Place","employer":"Aquafire","email":"adelecarroll@aquafire.com","city":"Springville","state":"RI"}
{"index":{"_id":"364"}}
{"account_number":364,"balance":35247,"firstname":"Felicia","lastname":"Merrill","age":40,"gender":"F","address":"229 Branton Street","employer":"Prosely","email":"feliciamerrill@prosely.com","city":"Dola","state":"MA"}
{"index":{"_id":"369"}}
{"account_number":369,"balance":17047,"firstname":"Mcfadden","lastname":"Guy","age":28,"gender":"F","address":"445 Lott Avenue","employer":"Kangle","email":"mcfaddenguy@kangle.com","city":"Greenbackville","state":"DE"}
{"index":{"_id":"371"}}
{"account_number":371,"balance":19751,"firstname":"Barker","lastname":"Allen","age":32,"gender":"F","address":"295 Wallabout Street","employer":"Nexgene","email":"barkerallen@nexgene.com","city":"Nanafalia","state":"NE"}
{"index":{"_id":"376"}}
{"account_number":376,"balance":44407,"firstname":"Mcmillan","lastname":"Dunn","age":21,"gender":"F","address":"771 Dorchester Road","employer":"Eargo","email":"mcmillandunn@eargo.com","city":"Yogaville","state":"RI"}
{"index":{"_id":"383"}}
{"account_number":383,"balance":48889,"firstname":"Knox","lastname":"Larson","age":28,"gender":"F","address":"962 Bartlett Place","employer":"Bostonic","email":"knoxlarson@bostonic.com","city":"Smeltertown","state":"TX"}
{"index":{"_id":"388"}}
{"account_number":388,"balance":9606,"firstname":"Julianne","lastname":"Nicholson","age":26,"gender":"F","address":"338 Crescent Street","employer":"Viasia","email":"juliannenicholson@viasia.com","city":"Alleghenyville","state":"MO"}
{"index":{"_id":"390"}}
{"account_number":390,"balance":7464,"firstname":"Ramona","lastname":"Roy","age":32,"gender":"M","address":"135 Banner Avenue","employer":"Deminimum","email":"ramonaroy@deminimum.com","city":"Dodge","state":"ID"}
{"index":{"_id":"395"}}
{"account_number":395,"balance":18679,"firstname":"Juliet","lastname":"Whitaker","age":31,"gender":"M","address":"128 Remsen Avenue","employer":"Toyletry","email":"julietwhitaker@toyletry.com","city":"Yonah","state":"LA"}
{"index":{"_id":"403"}}
{"account_number":403,"balance":18833,"firstname":"Williamson","lastname":"Horn","age":32,"gender":"M","address":"223 Strickland Avenue","employer":"Nimon","email":"williamsonhorn@nimon.com","city":"Bawcomville","state":"NJ"}
{"index":{"_id":"408"}}
{"account_number":408,"balance":34666,"firstname":"Lidia","lastname":"Guerrero","age":30,"gender":"M","address":"254 Stratford Road","employer":"Snowpoke","email":"lidiaguerrero@snowpoke.com","city":"Fairlee","state":"LA"}
{"index":{"_id":"410"}}
{"account_number":410,"balance":31200,"firstname":"Fox","lastname":"Cardenas","age":39,"gender":"M","address":"987 Monitor Street","employer":"Corpulse","email":"foxcardenas@corpulse.com","city":"Southview","state":"NE"}
{"index":{"_id":"415"}}
{"account_number":415,"balance":19449,"firstname":"Martinez","lastname":"Benson","age":36,"gender":"M","address":"172 Berkeley Place","employer":"Enersol","email":"martinezbenson@enersol.com","city":"Chumuckla","state":"AL"}
{"index":{"_id":"422"}}
{"account_number":422,"balance":40162,"firstname":"Brigitte","lastname":"Scott","age":26,"gender":"M","address":"662 Vermont Court","employer":"Waretel","email":"brigittescott@waretel.com","city":"Elrama","state":"VA"}
{"index":{"_id":"427"}}
{"account_number":427,"balance":1463,"firstname":"Rebekah","lastname":"Garrison","age":36,"gender":"F","address":"837 Hampton Avenue","employer":"Niquent","email":"rebekahgarrison@niquent.com","city":"Zarephath","state":"NY"}
{"index":{"_id":"434"}}
{"account_number":434,"balance":11329,"firstname":"Christa","lastname":"Huff","age":25,"gender":"M","address":"454 Oriental Boulevard","employer":"Earthpure","email":"christahuff@earthpure.com","city":"Stevens","state":"DC"}
{"index":{"_id":"439"}}
{"account_number":439,"balance":22752,"firstname":"Lula","lastname":"Williams","age":35,"gender":"M","address":"630 Furman Avenue","employer":"Vinch","email":"lulawilliams@vinch.com","city":"Newcastle","state":"ME"}
{"index":{"_id":"441"}}
{"account_number":441,"balance":47947,"firstname":"Dickson","lastname":"Mcgee","age":29,"gender":"M","address":"478 Knight Court","employer":"Gogol","email":"dicksonmcgee@gogol.com","city":"Laurelton","state":"AR"}
{"index":{"_id":"446"}}
{"account_number":446,"balance":23071,"firstname":"Lolita","lastname":"Fleming","age":32,"gender":"F","address":"918 Bridge Street","employer":"Vidto","email":"lolitafleming@vidto.com","city":"Brownlee","state":"HI"}
{"index":{"_id":"453"}}
{"account_number":453,"balance":21520,"firstname":"Hood","lastname":"Powell","age":24,"gender":"F","address":"479 Brevoort Place","employer":"Vortexaco","email":"hoodpowell@vortexaco.com","city":"Alderpoint","state":"CT"}
{"index":{"_id":"458"}}
{"account_number":458,"balance":8865,"firstname":"Aida","lastname":"Wolf","age":21,"gender":"F","address":"403 Thames Street","employer":"Isis","email":"aidawolf@isis.com","city":"Bordelonville","state":"ME"}
{"index":{"_id":"460"}}
{"account_number":460,"balance":37734,"firstname":"Aguirre","lastname":"White","age":21,"gender":"F","address":"190 Crooke Avenue","employer":"Unq","email":"aguirrewhite@unq.com","city":"Albany","state":"NJ"}
{"index":{"_id":"465"}}
{"account_number":465,"balance":10681,"firstname":"Pearlie","lastname":"Holman","age":29,"gender":"M","address":"916 Evergreen Avenue","employer":"Hometown","email":"pearlieholman@hometown.com","city":"Needmore","state":"UT"}
{"index":{"_id":"472"}}
{"account_number":472,"balance":25571,"firstname":"Lee","lastname":"Long","age":32,"gender":"F","address":"288 Mill Street","employer":"Comverges","email":"leelong@comverges.com","city":"Movico","state":"MT"}
{"index":{"_id":"477"}}
{"account_number":477,"balance":25892,"firstname":"Holcomb","lastname":"Cobb","age":40,"gender":"M","address":"369 Marconi Place","employer":"Steeltab","email":"holcombcobb@steeltab.com","city":"Byrnedale","state":"CA"}
{"index":{"_id":"484"}}
{"account_number":484,"balance":3274,"firstname":"Staci","lastname":"Melendez","age":35,"gender":"F","address":"751 Otsego Street","employer":"Namebox","email":"stacimelendez@namebox.com","city":"Harborton","state":"NV"}
{"index":{"_id":"489"}}
{"account_number":489,"balance":7879,"firstname":"Garrett","lastname":"Langley","age":36,"gender":"M","address":"331 Bowne Street","employer":"Zillidium","email":"garrettlangley@zillidium.com","city":"Riviera","state":"LA"}
{"index":{"_id":"491"}}
{"account_number":491,"balance":42942,"firstname":"Teresa","lastname":"Owen","age":24,"gender":"F","address":"713 Canton Court","employer":"Plasmos","email":"teresaowen@plasmos.com","city":"Bartonsville","state":"NH"}
{"index":{"_id":"496"}}
{"account_number":496,"balance":14869,"firstname":"Alison","lastname":"Conrad","age":35,"gender":"F","address":"347 Varet Street","employer":"Perkle","email":"alisonconrad@perkle.com","city":"Cliffside","state":"OH"}
{"index":{"_id":"504"}}
{"account_number":504,"balance":49205,"firstname":"Shanna","lastname":"Chambers","age":23,"gender":"M","address":"220 Beard Street","employer":"Corporana","email":"shannachambers@corporana.com","city":"Cashtown","state":"AZ"}
{"index":{"_id":"509"}}
{"account_number":509,"balance":34754,"firstname":"Durham","lastname":"Pacheco","age":40,"gender":"M","address":"129 Plymouth Street","employer":"Datacator","email":"durhampacheco@datacator.com","city":"Loveland","state":"NC"}
{"index":{"_id":"511"}}
{"account_number":511,"balance":40908,"firstname":"Elba","lastname":"Grant","age":24,"gender":"F","address":"157 Bijou Avenue","employer":"Dognost","email":"elbagrant@dognost.com","city":"Coyote","state":"MT"}
{"index":{"_id":"516"}}
{"account_number":516,"balance":44940,"firstname":"Roy","lastname":"Smith","age":37,"gender":"M","address":"770 Cherry Street","employer":"Parleynet","email":"roysmith@parleynet.com","city":"Carrsville","state":"RI"}
{"index":{"_id":"523"}}
{"account_number":523,"balance":28729,"firstname":"Amalia","lastname":"Benjamin","age":40,"gender":"F","address":"173 Bushwick Place","employer":"Sentia","email":"amaliabenjamin@sentia.com","city":"Jacumba","state":"OK"}
{"index":{"_id":"528"}}
{"account_number":528,"balance":4071,"firstname":"Thompson","lastname":"Hoover","age":27,"gender":"F","address":"580 Garden Street","employer":"Portalis","email":"thompsonhoover@portalis.com","city":"Knowlton","state":"AL"}
{"index":{"_id":"530"}}
{"account_number":530,"balance":8840,"firstname":"Kathrine","lastname":"Evans","age":37,"gender":"M","address":"422 Division Place","employer":"Spherix","email":"kathrineevans@spherix.com","city":"Biddle","state":"CO"}
{"index":{"_id":"535"}}
{"account_number":535,"balance":8715,"firstname":"Fry","lastname":"George","age":34,"gender":"M","address":"722 Green Street","employer":"Ewaves","email":"frygeorge@ewaves.com","city":"Kenmar","state":"DE"}
{"index":{"_id":"542"}}
{"account_number":542,"balance":23285,"firstname":"Michelle","lastname":"Mayo","age":35,"gender":"M","address":"657 Caton Place","employer":"Biflex","email":"michellemayo@biflex.com","city":"Beaverdale","state":"WY"}
{"index":{"_id":"547"}}
{"account_number":547,"balance":12870,"firstname":"Eaton","lastname":"Rios","age":32,"gender":"M","address":"744 Withers Street","employer":"Podunk","email":"eatonrios@podunk.com","city":"Chelsea","state":"IA"}
{"index":{"_id":"554"}}
{"account_number":554,"balance":33163,"firstname":"Townsend","lastname":"Atkins","age":39,"gender":"M","address":"566 Ira Court","employer":"Acruex","email":"townsendatkins@acruex.com","city":"Valle","state":"IA"}
{"index":{"_id":"559"}}
{"account_number":559,"balance":11450,"firstname":"Tonia","lastname":"Schmidt","age":38,"gender":"F","address":"508 Sheffield Avenue","employer":"Extro","email":"toniaschmidt@extro.com","city":"Newry","state":"CT"}
{"index":{"_id":"561"}}
{"account_number":561,"balance":12370,"firstname":"Sellers","lastname":"Davis","age":30,"gender":"M","address":"860 Madoc Avenue","employer":"Isodrive","email":"sellersdavis@isodrive.com","city":"Trail","state":"KS"}
{"index":{"_id":"566"}}
{"account_number":566,"balance":6183,"firstname":"Cox","lastname":"Roman","age":37,"gender":"M","address":"349 Winthrop Street","employer":"Medcom","email":"coxroman@medcom.com","city":"Rosewood","state":"WY"}
{"index":{"_id":"573"}}
{"account_number":573,"balance":32171,"firstname":"Callie","lastname":"Castaneda","age":36,"gender":"M","address":"799 Scott Avenue","employer":"Earthwax","email":"calliecastaneda@earthwax.com","city":"Marshall","state":"NH"}
{"index":{"_id":"578"}}
{"account_number":578,"balance":34259,"firstname":"Holmes","lastname":"Mcknight","age":37,"gender":"M","address":"969 Metropolitan Avenue","employer":"Cubicide","email":"holmesmcknight@cubicide.com","city":"Aguila","state":"PA"}
{"index":{"_id":"580"}}
{"account_number":580,"balance":13716,"firstname":"Mcmahon","lastname":"York","age":34,"gender":"M","address":"475 Beacon Court","employer":"Zillar","email":"mcmahonyork@zillar.com","city":"Farmington","state":"MO"}
{"index":{"_id":"585"}}
{"account_number":585,"balance":26745,"firstname":"Nieves","lastname":"Nolan","age":32,"gender":"M","address":"115 Seagate Terrace","employer":"Jumpstack","email":"nievesnolan@jumpstack.com","city":"Eastmont","state":"UT"}
{"index":{"_id":"592"}}
{"account_number":592,"balance":32968,"firstname":"Head","lastname":"Webster","age":36,"gender":"F","address":"987 Lefferts Avenue","employer":"Empirica","email":"headwebster@empirica.com","city":"Rockingham","state":"TN"}
{"index":{"_id":"597"}}
{"account_number":597,"balance":11246,"firstname":"Penny","lastname":"Knowles","age":33,"gender":"M","address":"139 Forbell Street","employer":"Ersum","email":"pennyknowles@ersum.com","city":"Vallonia","state":"IA"}
{"index":{"_id":"600"}}
{"account_number":600,"balance":10336,"firstname":"Simmons","lastname":"Byers","age":37,"gender":"M","address":"250 Dictum Court","employer":"Qualitex","email":"simmonsbyers@qualitex.com","city":"Wanship","state":"OH"}
{"index":{"_id":"605"}}
{"account_number":605,"balance":38427,"firstname":"Mcclain","lastname":"Manning","age":24,"gender":"M","address":"832 Leonard Street","employer":"Qiao","email":"mcclainmanning@qiao.com","city":"Calvary","state":"TX"}
{"index":{"_id":"612"}}
{"account_number":612,"balance":11868,"firstname":"Dunn","lastname":"Cameron","age":32,"gender":"F","address":"156 Lorimer Street","employer":"Isonus","email":"dunncameron@isonus.com","city":"Virgie","state":"ND"}
{"index":{"_id":"617"}}
{"account_number":617,"balance":35445,"firstname":"Kitty","lastname":"Cooley","age":22,"gender":"M","address":"788 Seagate Avenue","employer":"Ultrimax","email":"kittycooley@ultrimax.com","city":"Clarktown","state":"MD"}
{"index":{"_id":"624"}}
{"account_number":624,"balance":27538,"firstname":"Roxanne","lastname":"Franklin","age":39,"gender":"F","address":"299 Woodrow Court","employer":"Silodyne","email":"roxannefranklin@silodyne.com","city":"Roulette","state":"VA"}
{"index":{"_id":"629"}}
{"account_number":629,"balance":32987,"firstname":"Mcclure","lastname":"Rodgers","age":26,"gender":"M","address":"806 Pierrepont Place","employer":"Elita","email":"mcclurerodgers@elita.com","city":"Brownsville","state":"MI"}
{"index":{"_id":"631"}}
{"account_number":631,"balance":21657,"firstname":"Corrine","lastname":"Barber","age":32,"gender":"F","address":"447 Hunts Lane","employer":"Quarmony","email":"corrinebarber@quarmony.com","city":"Wyano","state":"IL"}
{"index":{"_id":"636"}}
{"account_number":636,"balance":8036,"firstname":"Agnes","lastname":"Hooper","age":25,"gender":"M","address":"865 Hanson Place","employer":"Digial","email":"agneshooper@digial.com","city":"Sperryville","state":"OK"}
{"index":{"_id":"643"}}
{"account_number":643,"balance":8057,"firstname":"Hendricks","lastname":"Stokes","age":23,"gender":"F","address":"142 Barbey Street","employer":"Remotion","email":"hendricksstokes@remotion.com","city":"Lewis","state":"MA"}
{"index":{"_id":"648"}}
{"account_number":648,"balance":11506,"firstname":"Terry","lastname":"Montgomery","age":21,"gender":"F","address":"115 Franklin Avenue","employer":"Enervate","email":"terrymontgomery@enervate.com","city":"Bascom","state":"MA"}
{"index":{"_id":"650"}}
{"account_number":650,"balance":18091,"firstname":"Benton","lastname":"Knight","age":28,"gender":"F","address":"850 Aitken Place","employer":"Pholio","email":"bentonknight@pholio.com","city":"Cobbtown","state":"AL"}
{"index":{"_id":"655"}}
{"account_number":655,"balance":22912,"firstname":"Eula","lastname":"Taylor","age":30,"gender":"M","address":"520 Orient Avenue","employer":"Miracula","email":"eulataylor@miracula.com","city":"Wacissa","state":"IN"}
{"index":{"_id":"662"}}
{"account_number":662,"balance":10138,"firstname":"Daisy","lastname":"Burnett","age":33,"gender":"M","address":"114 Norman Avenue","employer":"Liquicom","email":"daisyburnett@liquicom.com","city":"Grahamtown","state":"MD"}
{"index":{"_id":"667"}}
{"account_number":667,"balance":22559,"firstname":"Juliana","lastname":"Chase","age":32,"gender":"M","address":"496 Coleridge Street","employer":"Comtract","email":"julianachase@comtract.com","city":"Wilsonia","state":"NJ"}
{"index":{"_id":"674"}}
{"account_number":674,"balance":36038,"firstname":"Watts","lastname":"Shannon","age":22,"gender":"F","address":"600 Story Street","employer":"Joviold","email":"wattsshannon@joviold.com","city":"Fairhaven","state":"ID"}
{"index":{"_id":"679"}}
{"account_number":679,"balance":20149,"firstname":"Henrietta","lastname":"Bonner","age":33,"gender":"M","address":"461 Bond Street","employer":"Geekol","email":"henriettabonner@geekol.com","city":"Richville","state":"WA"}
{"index":{"_id":"681"}}
{"account_number":681,"balance":34244,"firstname":"Velazquez","lastname":"Wolfe","age":33,"gender":"M","address":"773 Eckford Street","employer":"Zisis","email":"velazquezwolfe@zisis.com","city":"Smock","state":"ME"}
{"index":{"_id":"686"}}
{"account_number":686,"balance":10116,"firstname":"Decker","lastname":"Mcclure","age":30,"gender":"F","address":"236 Commerce Street","employer":"Everest","email":"deckermcclure@everest.com","city":"Gibbsville","state":"TN"}
{"index":{"_id":"693"}}
{"account_number":693,"balance":31233,"firstname":"Tabatha","lastname":"Zimmerman","age":30,"gender":"F","address":"284 Emmons Avenue","employer":"Pushcart","email":"tabathazimmerman@pushcart.com","city":"Esmont","state":"NC"}
{"index":{"_id":"698"}}
{"account_number":698,"balance":14965,"firstname":"Baker","lastname":"Armstrong","age":36,"gender":"F","address":"796 Tehama Street","employer":"Nurplex","email":"bakerarmstrong@nurplex.com","city":"Starks","state":"UT"}
{"index":{"_id":"701"}}
{"account_number":701,"balance":23772,"firstname":"Gardner","lastname":"Griffith","age":27,"gender":"M","address":"187 Moore Place","employer":"Vertide","email":"gardnergriffith@vertide.com","city":"Coventry","state":"NV"}
{"index":{"_id":"706"}}
{"account_number":706,"balance":5282,"firstname":"Eliza","lastname":"Potter","age":39,"gender":"M","address":"945 Dunham Place","employer":"Playce","email":"elizapotter@playce.com","city":"Woodruff","state":"AK"}
{"index":{"_id":"713"}}
{"account_number":713,"balance":20054,"firstname":"Iris","lastname":"Mcguire","age":21,"gender":"F","address":"508 Benson Avenue","employer":"Duflex","email":"irismcguire@duflex.com","city":"Hillsboro","state":"MO"}
{"index":{"_id":"718"}}
{"account_number":718,"balance":13876,"firstname":"Hickman","lastname":"Dillard","age":22,"gender":"F","address":"132 Etna Street","employer":"Genmy","email":"hickmandillard@genmy.com","city":"Curtice","state":"NV"}
{"index":{"_id":"720"}}
{"account_number":720,"balance":31356,"firstname":"Ruth","lastname":"Vance","age":32,"gender":"F","address":"229 Adams Street","employer":"Zilidium","email":"ruthvance@zilidium.com","city":"Allison","state":"IA"}
{"index":{"_id":"725"}}
{"account_number":725,"balance":14677,"firstname":"Reeves","lastname":"Tillman","age":26,"gender":"M","address":"674 Ivan Court","employer":"Cemention","email":"reevestillman@cemention.com","city":"Navarre","state":"MA"}
{"index":{"_id":"732"}}
{"account_number":732,"balance":38445,"firstname":"Delia","lastname":"Cruz","age":37,"gender":"F","address":"870 Cheever Place","employer":"Multron","email":"deliacruz@multron.com","city":"Cresaptown","state":"NH"}
{"index":{"_id":"737"}}
{"account_number":737,"balance":40431,"firstname":"Sampson","lastname":"Yates","age":23,"gender":"F","address":"214 Cox Place","employer":"Signidyne","email":"sampsonyates@signidyne.com","city":"Brazos","state":"GA"}
{"index":{"_id":"744"}}
{"account_number":744,"balance":8690,"firstname":"Bernard","lastname":"Martinez","age":21,"gender":"M","address":"148 Dunne Place","employer":"Dragbot","email":"bernardmartinez@dragbot.com","city":"Moraida","state":"MN"}
{"index":{"_id":"749"}}
{"account_number":749,"balance":1249,"firstname":"Rush","lastname":"Boyle","age":36,"gender":"M","address":"310 Argyle Road","employer":"Sportan","email":"rushboyle@sportan.com","city":"Brady","state":"WA"}
{"index":{"_id":"751"}}
{"account_number":751,"balance":49252,"firstname":"Patrick","lastname":"Osborne","age":23,"gender":"M","address":"915 Prospect Avenue","employer":"Gynko","email":"patrickosborne@gynko.com","city":"Takilma","state":"MO"}
{"index":{"_id":"756"}}
{"account_number":756,"balance":40006,"firstname":"Jasmine","lastname":"Howell","age":32,"gender":"M","address":"605 Elliott Walk","employer":"Ecratic","email":"jasminehowell@ecratic.com","city":"Harrodsburg","state":"OH"}
{"index":{"_id":"763"}}
{"account_number":763,"balance":12091,"firstname":"Liz","lastname":"Bentley","age":22,"gender":"F","address":"933 Debevoise Avenue","employer":"Nipaz","email":"lizbentley@nipaz.com","city":"Glenville","state":"NJ"}
{"index":{"_id":"768"}}
{"account_number":768,"balance":2213,"firstname":"Sondra","lastname":"Soto","age":21,"gender":"M","address":"625 Colonial Road","employer":"Navir","email":"sondrasoto@navir.com","city":"Benson","state":"VA"}
{"index":{"_id":"770"}}
{"account_number":770,"balance":39505,"firstname":"Joann","lastname":"Crane","age":26,"gender":"M","address":"798 Farragut Place","employer":"Lingoage","email":"joanncrane@lingoage.com","city":"Kirk","state":"MA"}
{"index":{"_id":"775"}}
{"account_number":775,"balance":27943,"firstname":"Wilson","lastname":"Merritt","age":33,"gender":"F","address":"288 Thornton Street","employer":"Geeky","email":"wilsonmerritt@geeky.com","city":"Holtville","state":"HI"}
{"index":{"_id":"782"}}
{"account_number":782,"balance":3960,"firstname":"Maldonado","lastname":"Craig","age":36,"gender":"F","address":"345 Myrtle Avenue","employer":"Zilencio","email":"maldonadocraig@zilencio.com","city":"Yukon","state":"ID"}
{"index":{"_id":"787"}}
{"account_number":787,"balance":11876,"firstname":"Harper","lastname":"Wynn","age":21,"gender":"F","address":"139 Oceanic Avenue","employer":"Interfind","email":"harperwynn@interfind.com","city":"Gerber","state":"ND"}
{"index":{"_id":"794"}}
{"account_number":794,"balance":16491,"firstname":"Walker","lastname":"Charles","age":32,"gender":"M","address":"215 Kenilworth Place","employer":"Orbin","email":"walkercharles@orbin.com","city":"Rivers","state":"WI"}
{"index":{"_id":"799"}}
{"account_number":799,"balance":2889,"firstname":"Myra","lastname":"Guerra","age":28,"gender":"F","address":"625 Dahlgreen Place","employer":"Digigene","email":"myraguerra@digigene.com","city":"Draper","state":"CA"}
{"index":{"_id":"802"}}
{"account_number":802,"balance":19630,"firstname":"Gracie","lastname":"Foreman","age":40,"gender":"F","address":"219 Kent Avenue","employer":"Supportal","email":"gracieforeman@supportal.com","city":"Westboro","state":"NH"}
{"index":{"_id":"807"}}
{"account_number":807,"balance":29206,"firstname":"Hatfield","lastname":"Lowe","age":23,"gender":"M","address":"499 Adler Place","employer":"Lovepad","email":"hatfieldlowe@lovepad.com","city":"Wiscon","state":"DC"}
{"index":{"_id":"814"}}
{"account_number":814,"balance":9838,"firstname":"Morse","lastname":"Mcbride","age":26,"gender":"F","address":"776 Calyer Street","employer":"Inear","email":"morsemcbride@inear.com","city":"Kingstowne","state":"ND"}
{"index":{"_id":"819"}}
{"account_number":819,"balance":3971,"firstname":"Karyn","lastname":"Medina","age":24,"gender":"F","address":"417 Utica Avenue","employer":"Qnekt","email":"karynmedina@qnekt.com","city":"Kerby","state":"WY"}
{"index":{"_id":"821"}}
{"account_number":821,"balance":33271,"firstname":"Trisha","lastname":"Blankenship","age":22,"gender":"M","address":"329 Jamaica Avenue","employer":"Chorizon","email":"trishablankenship@chorizon.com","city":"Sexton","state":"VT"}
{"index":{"_id":"826"}}
{"account_number":826,"balance":11548,"firstname":"Summers","lastname":"Vinson","age":22,"gender":"F","address":"742 Irwin Street","employer":"Globoil","email":"summersvinson@globoil.com","city":"Callaghan","state":"WY"}
{"index":{"_id":"833"}}
{"account_number":833,"balance":46154,"firstname":"Woodward","lastname":"Hood","age":22,"gender":"M","address":"398 Atkins Avenue","employer":"Zedalis","email":"woodwardhood@zedalis.com","city":"Stonybrook","state":"NE"}
{"index":{"_id":"838"}}
{"account_number":838,"balance":24629,"firstname":"Latonya","lastname":"Blake","age":37,"gender":"F","address":"531 Milton Street","employer":"Rugstars","email":"latonyablake@rugstars.com","city":"Tedrow","state":"WA"}
{"index":{"_id":"840"}}
{"account_number":840,"balance":39615,"firstname":"Boone","lastname":"Gomez","age":38,"gender":"M","address":"256 Hampton Place","employer":"Geekular","email":"boonegomez@geekular.com","city":"Westerville","state":"HI"}
{"index":{"_id":"845"}}
{"account_number":845,"balance":35422,"firstname":"Tracy","lastname":"Vaughn","age":39,"gender":"M","address":"645 Rockaway Parkway","employer":"Andryx","email":"tracyvaughn@andryx.com","city":"Wilmington","state":"ME"}
{"index":{"_id":"852"}}
{"account_number":852,"balance":6041,"firstname":"Allen","lastname":"Hammond","age":26,"gender":"M","address":"793 Essex Street","employer":"Tersanki","email":"allenhammond@tersanki.com","city":"Osmond","state":"NC"}
{"index":{"_id":"857"}}
{"account_number":857,"balance":39678,"firstname":"Alyce","lastname":"Douglas","age":23,"gender":"M","address":"326 Robert Street","employer":"Earbang","email":"alycedouglas@earbang.com","city":"Thornport","state":"GA"}
{"index":{"_id":"864"}}
{"account_number":864,"balance":21804,"firstname":"Duffy","lastname":"Anthony","age":23,"gender":"M","address":"582 Cooke Court","employer":"Schoolio","email":"duffyanthony@schoolio.com","city":"Brenton","state":"CO"}
{"index":{"_id":"869"}}
{"account_number":869,"balance":43544,"firstname":"Corinne","lastname":"Robbins","age":25,"gender":"F","address":"732 Quentin Road","employer":"Orbaxter","email":"corinnerobbins@orbaxter.com","city":"Roy","state":"TN"}
{"index":{"_id":"871"}}
{"account_number":871,"balance":35854,"firstname":"Norma","lastname":"Burt","age":32,"gender":"M","address":"934 Cyrus Avenue","employer":"Magnafone","email":"normaburt@magnafone.com","city":"Eden","state":"TN"}
{"index":{"_id":"876"}}
{"account_number":876,"balance":48568,"firstname":"Brady","lastname":"Glover","age":21,"gender":"F","address":"565 Oceanview Avenue","employer":"Comvex","email":"bradyglover@comvex.com","city":"Noblestown","state":"ID"}
{"index":{"_id":"883"}}
{"account_number":883,"balance":33679,"firstname":"Austin","lastname":"Jefferson","age":34,"gender":"M","address":"846 Lincoln Avenue","employer":"Polarax","email":"austinjefferson@polarax.com","city":"Savannah","state":"CT"}
{"index":{"_id":"888"}}
{"account_number":888,"balance":22277,"firstname":"Myrna","lastname":"Herman","age":39,"gender":"F","address":"649 Harwood Place","employer":"Enthaze","email":"myrnaherman@enthaze.com","city":"Idamay","state":"AR"}
{"index":{"_id":"890"}}
{"account_number":890,"balance":31198,"firstname":"Alvarado","lastname":"Pate","age":25,"gender":"M","address":"269 Ashland Place","employer":"Ovolo","email":"alvaradopate@ovolo.com","city":"Volta","state":"MI"}
{"index":{"_id":"895"}}
{"account_number":895,"balance":7327,"firstname":"Lara","lastname":"Mcdaniel","age":36,"gender":"M","address":"854 Willow Place","employer":"Acusage","email":"laramcdaniel@acusage.com","city":"Imperial","state":"NC"}
{"index":{"_id":"903"}}
{"account_number":903,"balance":10238,"firstname":"Wade","lastname":"Page","age":35,"gender":"F","address":"685 Waldorf Court","employer":"Eplosion","email":"wadepage@eplosion.com","city":"Welda","state":"AL"}
{"index":{"_id":"908"}}
{"account_number":908,"balance":45975,"firstname":"Mosley","lastname":"Holloway","age":31,"gender":"M","address":"929 Eldert Lane","employer":"Anivet","email":"mosleyholloway@anivet.com","city":"Biehle","state":"MS"}
{"index":{"_id":"910"}}
{"account_number":910,"balance":36831,"firstname":"Esmeralda","lastname":"James","age":23,"gender":"F","address":"535 High Street","employer":"Terrasys","email":"esmeraldajames@terrasys.com","city":"Dubois","state":"IN"}
{"index":{"_id":"915"}}
{"account_number":915,"balance":19816,"firstname":"Farrell","lastname":"French","age":35,"gender":"F","address":"126 McKibbin Street","employer":"Techmania","email":"farrellfrench@techmania.com","city":"Wescosville","state":"AL"}
{"index":{"_id":"922"}}
{"account_number":922,"balance":39347,"firstname":"Irwin","lastname":"Pugh","age":32,"gender":"M","address":"463 Shale Street","employer":"Idego","email":"irwinpugh@idego.com","city":"Ivanhoe","state":"ID"}
{"index":{"_id":"927"}}
{"account_number":927,"balance":19976,"firstname":"Jeanette","lastname":"Acevedo","age":26,"gender":"M","address":"694 Polhemus Place","employer":"Halap","email":"jeanetteacevedo@halap.com","city":"Harrison","state":"MO"}
{"index":{"_id":"934"}}
{"account_number":934,"balance":43987,"firstname":"Freida","lastname":"Daniels","age":34,"gender":"M","address":"448 Cove Lane","employer":"Vurbo","email":"freidadaniels@vurbo.com","city":"Snelling","state":"NJ"}
{"index":{"_id":"939"}}
{"account_number":939,"balance":31228,"firstname":"Hodges","lastname":"Massey","age":37,"gender":"F","address":"431 Dahl Court","employer":"Kegular","email":"hodgesmassey@kegular.com","city":"Katonah","state":"MD"}
{"index":{"_id":"941"}}
{"account_number":941,"balance":38796,"firstname":"Kim","lastname":"Moss","age":28,"gender":"F","address":"105 Onderdonk Avenue","employer":"Digirang","email":"kimmoss@digirang.com","city":"Centerville","state":"TX"}
{"index":{"_id":"946"}}
{"account_number":946,"balance":42794,"firstname":"Ina","lastname":"Obrien","age":36,"gender":"M","address":"339 Rewe Street","employer":"Eclipsent","email":"inaobrien@eclipsent.com","city":"Soham","state":"RI"}
{"index":{"_id":"953"}}
{"account_number":953,"balance":1110,"firstname":"Baxter","lastname":"Black","age":27,"gender":"M","address":"720 Stillwell Avenue","employer":"Uplinx","email":"baxterblack@uplinx.com","city":"Drummond","state":"MN"}
{"index":{"_id":"958"}}
{"account_number":958,"balance":32849,"firstname":"Brown","lastname":"Wilkins","age":40,"gender":"M","address":"686 Delmonico Place","employer":"Medesign","email":"brownwilkins@medesign.com","city":"Shelby","state":"WY"}
{"index":{"_id":"960"}}
{"account_number":960,"balance":2905,"firstname":"Curry","lastname":"Vargas","age":40,"gender":"M","address":"242 Blake Avenue","employer":"Pearlesex","email":"curryvargas@pearlesex.com","city":"Henrietta","state":"NH"}
{"index":{"_id":"965"}}
{"account_number":965,"balance":21882,"firstname":"Patrica","lastname":"Melton","age":28,"gender":"M","address":"141 Rodney Street","employer":"Flexigen","email":"patricamelton@flexigen.com","city":"Klagetoh","state":"MD"}
{"index":{"_id":"972"}}
{"account_number":972,"balance":24719,"firstname":"Leona","lastname":"Christian","age":26,"gender":"F","address":"900 Woodpoint Road","employer":"Extrawear","email":"leonachristian@extrawear.com","city":"Roderfield","state":"MA"}
{"index":{"_id":"977"}}
{"account_number":977,"balance":6744,"firstname":"Rodgers","lastname":"Mccray","age":21,"gender":"F","address":"612 Duryea Place","employer":"Papricut","email":"rodgersmccray@papricut.com","city":"Marenisco","state":"MD"}
{"index":{"_id":"984"}}
{"account_number":984,"balance":1904,"firstname":"Viola","lastname":"Crawford","age":35,"gender":"F","address":"354 Linwood Street","employer":"Ginkle","email":"violacrawford@ginkle.com","city":"Witmer","state":"AR"}
{"index":{"_id":"989"}}
{"account_number":989,"balance":48622,"firstname":"Franklin","lastname":"Frank","age":38,"gender":"M","address":"270 Carlton Avenue","employer":"Shopabout","email":"franklinfrank@shopabout.com","city":"Guthrie","state":"NC"}
{"index":{"_id":"991"}}
{"account_number":991,"balance":4239,"firstname":"Connie","lastname":"Berry","age":28,"gender":"F","address":"647 Gardner Avenue","employer":"Flumbo","email":"connieberry@flumbo.com","city":"Frierson","state":"MO"}
{"index":{"_id":"996"}}
{"account_number":996,"balance":17541,"firstname":"Andrews","lastname":"Herrera","age":30,"gender":"F","address":"570 Vandam Street","employer":"Klugger","email":"andrewsherrera@klugger.com","city":"Whitehaven","state":"MN"}
{"index":{"_id":"0"}}
{"account_number":0,"balance":16623,"firstname":"Bradshaw","lastname":"Mckenzie","age":29,"gender":"F","address":"244 Columbus Place","employer":"Euron","email":"bradshawmckenzie@euron.com","city":"Hobucken","state":"CO"}
{"index":{"_id":"5"}}
{"account_number":5,"balance":29342,"firstname":"Leola","lastname":"Stewart","age":30,"gender":"F","address":"311 Elm Place","employer":"Diginetic","email":"leolastewart@diginetic.com","city":"Fairview","state":"NJ"}
{"index":{"_id":"12"}}
{"account_number":12,"balance":37055,"firstname":"Stafford","lastname":"Brock","age":20,"gender":"F","address":"296 Wythe Avenue","employer":"Uncorp","email":"staffordbrock@uncorp.com","city":"Bend","state":"AL"}
{"index":{"_id":"17"}}
{"account_number":17,"balance":7831,"firstname":"Bessie","lastname":"Orr","age":31,"gender":"F","address":"239 Hinsdale Street","employer":"Skyplex","email":"bessieorr@skyplex.com","city":"Graball","state":"FL"}
{"index":{"_id":"24"}}
{"account_number":24,"balance":44182,"firstname":"Wood","lastname":"Dale","age":39,"gender":"M","address":"582 Gelston Avenue","employer":"Besto","email":"wooddale@besto.com","city":"Juntura","state":"MI"}
{"index":{"_id":"29"}}
{"account_number":29,"balance":27323,"firstname":"Leah","lastname":"Santiago","age":33,"gender":"M","address":"193 Schenck Avenue","employer":"Isologix","email":"leahsantiago@isologix.com","city":"Gerton","state":"ND"}
{"index":{"_id":"31"}}
{"account_number":31,"balance":30443,"firstname":"Kristen","lastname":"Santana","age":22,"gender":"F","address":"130 Middagh Street","employer":"Dogspa","email":"kristensantana@dogspa.com","city":"Vale","state":"MA"}
{"index":{"_id":"36"}}
{"account_number":36,"balance":15902,"firstname":"Alexandra","lastname":"Nguyen","age":39,"gender":"F","address":"389 Elizabeth Place","employer":"Bittor","email":"alexandranguyen@bittor.com","city":"Hemlock","state":"KY"}
{"index":{"_id":"43"}}
{"account_number":43,"balance":33474,"firstname":"Ryan","lastname":"Howe","age":25,"gender":"M","address":"660 Huntington Street","employer":"Microluxe","email":"ryanhowe@microluxe.com","city":"Clara","state":"CT"}
{"index":{"_id":"48"}}
{"account_number":48,"balance":40608,"firstname":"Peck","lastname":"Downs","age":39,"gender":"F","address":"594 Dwight Street","employer":"Ramjob","email":"peckdowns@ramjob.com","city":"Coloma","state":"WA"}
{"index":{"_id":"50"}}
{"account_number":50,"balance":43695,"firstname":"Sheena","lastname":"Kirkland","age":33,"gender":"M","address":"598 Bank Street","employer":"Zerbina","email":"sheenakirkland@zerbina.com","city":"Walland","state":"IN"}
{"index":{"_id":"55"}}
{"account_number":55,"balance":22020,"firstname":"Shelia","lastname":"Puckett","age":33,"gender":"M","address":"265 Royce Place","employer":"Izzby","email":"sheliapuckett@izzby.com","city":"Slovan","state":"HI"}
{"index":{"_id":"62"}}
{"account_number":62,"balance":43065,"firstname":"Lester","lastname":"Stanton","age":37,"gender":"M","address":"969 Doughty Street","employer":"Geekko","email":"lesterstanton@geekko.com","city":"Itmann","state":"DC"}
{"index":{"_id":"67"}}
{"account_number":67,"balance":39430,"firstname":"Isabelle","lastname":"Spence","age":39,"gender":"M","address":"718 Troy Avenue","employer":"Geeketron","email":"isabellespence@geeketron.com","city":"Camptown","state":"WA"}
{"index":{"_id":"74"}}
{"account_number":74,"balance":47167,"firstname":"Lauri","lastname":"Saunders","age":38,"gender":"F","address":"768 Lynch Street","employer":"Securia","email":"laurisaunders@securia.com","city":"Caroline","state":"TN"}
{"index":{"_id":"79"}}
{"account_number":79,"balance":28185,"firstname":"Booker","lastname":"Lowery","age":29,"gender":"M","address":"817 Campus Road","employer":"Sensate","email":"bookerlowery@sensate.com","city":"Carlos","state":"MT"}
{"index":{"_id":"81"}}
{"account_number":81,"balance":46568,"firstname":"Dennis","lastname":"Gilbert","age":40,"gender":"M","address":"619 Minna Street","employer":"Melbacor","email":"dennisgilbert@melbacor.com","city":"Kersey","state":"ND"}
{"index":{"_id":"86"}}
{"account_number":86,"balance":15428,"firstname":"Walton","lastname":"Butler","age":36,"gender":"M","address":"999 Schenck Street","employer":"Unisure","email":"waltonbutler@unisure.com","city":"Bentonville","state":"IL"}
{"index":{"_id":"93"}}
{"account_number":93,"balance":17728,"firstname":"Jeri","lastname":"Booth","age":31,"gender":"M","address":"322 Roosevelt Court","employer":"Geekology","email":"jeribooth@geekology.com","city":"Leming","state":"ND"}
{"index":{"_id":"98"}}
{"account_number":98,"balance":15085,"firstname":"Cora","lastname":"Barrett","age":24,"gender":"F","address":"555 Neptune Court","employer":"Kiosk","email":"corabarrett@kiosk.com","city":"Independence","state":"MN"}
{"index":{"_id":"101"}}
{"account_number":101,"balance":43400,"firstname":"Cecelia","lastname":"Grimes","age":31,"gender":"M","address":"972 Lincoln Place","employer":"Ecosys","email":"ceceliagrimes@ecosys.com","city":"Manchester","state":"AR"}
{"index":{"_id":"106"}}
{"account_number":106,"balance":8212,"firstname":"Josefina","lastname":"Wagner","age":36,"gender":"M","address":"418 Estate Road","employer":"Kyaguru","email":"josefinawagner@kyaguru.com","city":"Darbydale","state":"FL"}
{"index":{"_id":"113"}}
{"account_number":113,"balance":41652,"firstname":"Burt","lastname":"Moses","age":27,"gender":"M","address":"633 Berry Street","employer":"Uni","email":"burtmoses@uni.com","city":"Russellville","state":"CT"}
{"index":{"_id":"118"}}
{"account_number":118,"balance":2223,"firstname":"Ballard","lastname":"Vasquez","age":33,"gender":"F","address":"101 Bush Street","employer":"Intergeek","email":"ballardvasquez@intergeek.com","city":"Century","state":"MN"}
{"index":{"_id":"120"}}
{"account_number":120,"balance":38565,"firstname":"Browning","lastname":"Rodriquez","age":33,"gender":"M","address":"910 Moore Street","employer":"Opportech","email":"browningrodriquez@opportech.com","city":"Cutter","state":"ND"}
{"index":{"_id":"125"}}
{"account_number":125,"balance":5396,"firstname":"Tanisha","lastname":"Dixon","age":30,"gender":"M","address":"482 Hancock Street","employer":"Junipoor","email":"tanishadixon@junipoor.com","city":"Wauhillau","state":"IA"}
{"index":{"_id":"132"}}
{"account_number":132,"balance":37707,"firstname":"Horton","lastname":"Romero","age":35,"gender":"M","address":"427 Rutherford Place","employer":"Affluex","email":"hortonromero@affluex.com","city":"Hall","state":"AK"}
{"index":{"_id":"137"}}
{"account_number":137,"balance":3596,"firstname":"Frost","lastname":"Freeman","age":29,"gender":"F","address":"191 Dennett Place","employer":"Beadzza","email":"frostfreeman@beadzza.com","city":"Sabillasville","state":"HI"}
{"index":{"_id":"144"}}
{"account_number":144,"balance":43257,"firstname":"Evans","lastname":"Dyer","age":30,"gender":"F","address":"912 Post Court","employer":"Magmina","email":"evansdyer@magmina.com","city":"Gordon","state":"HI"}
{"index":{"_id":"149"}}
{"account_number":149,"balance":22994,"firstname":"Megan","lastname":"Gonzales","age":21,"gender":"M","address":"836 Tampa Court","employer":"Andershun","email":"megangonzales@andershun.com","city":"Rockhill","state":"AL"}
{"index":{"_id":"151"}}
{"account_number":151,"balance":34473,"firstname":"Kent","lastname":"Joyner","age":20,"gender":"F","address":"799 Truxton Street","employer":"Kozgene","email":"kentjoyner@kozgene.com","city":"Allamuchy","state":"DC"}
{"index":{"_id":"156"}}
{"account_number":156,"balance":40185,"firstname":"Sloan","lastname":"Pennington","age":24,"gender":"F","address":"573 Opal Court","employer":"Hopeli","email":"sloanpennington@hopeli.com","city":"Evergreen","state":"CT"}
{"index":{"_id":"163"}}
{"account_number":163,"balance":43075,"firstname":"Wilda","lastname":"Norman","age":33,"gender":"F","address":"173 Beadel Street","employer":"Kog","email":"wildanorman@kog.com","city":"Bodega","state":"ME"}
{"index":{"_id":"168"}}
{"account_number":168,"balance":49568,"firstname":"Carissa","lastname":"Simon","age":20,"gender":"M","address":"975 Flatbush Avenue","employer":"Zillacom","email":"carissasimon@zillacom.com","city":"Neibert","state":"IL"}
{"index":{"_id":"170"}}
{"account_number":170,"balance":6025,"firstname":"Mann","lastname":"Madden","age":36,"gender":"F","address":"161 Radde Place","employer":"Farmex","email":"mannmadden@farmex.com","city":"Thermal","state":"LA"}
{"index":{"_id":"175"}}
{"account_number":175,"balance":16213,"firstname":"Montoya","lastname":"Donaldson","age":28,"gender":"F","address":"481 Morton Street","employer":"Envire","email":"montoyadonaldson@envire.com","city":"Delco","state":"MA"}
{"index":{"_id":"182"}}
{"account_number":182,"balance":7803,"firstname":"Manuela","lastname":"Dillon","age":21,"gender":"M","address":"742 Garnet Street","employer":"Moreganic","email":"manueladillon@moreganic.com","city":"Ilchester","state":"TX"}
{"index":{"_id":"187"}}
{"account_number":187,"balance":26581,"firstname":"Autumn","lastname":"Hodges","age":35,"gender":"M","address":"757 Granite Street","employer":"Ezentia","email":"autumnhodges@ezentia.com","city":"Martinsville","state":"KY"}
{"index":{"_id":"194"}}
{"account_number":194,"balance":16311,"firstname":"Beck","lastname":"Rosario","age":39,"gender":"M","address":"721 Cambridge Place","employer":"Zoid","email":"beckrosario@zoid.com","city":"Efland","state":"ID"}
{"index":{"_id":"199"}}
{"account_number":199,"balance":18086,"firstname":"Branch","lastname":"Love","age":26,"gender":"M","address":"458 Commercial Street","employer":"Frolix","email":"branchlove@frolix.com","city":"Caspar","state":"NC"}
{"index":{"_id":"202"}}
{"account_number":202,"balance":26466,"firstname":"Medina","lastname":"Brown","age":31,"gender":"F","address":"519 Sunnyside Court","employer":"Bleendot","email":"medinabrown@bleendot.com","city":"Winfred","state":"MI"}
{"index":{"_id":"207"}}
{"account_number":207,"balance":45535,"firstname":"Evelyn","lastname":"Lara","age":35,"gender":"F","address":"636 Chestnut Street","employer":"Ultrasure","email":"evelynlara@ultrasure.com","city":"Logan","state":"MI"}
{"index":{"_id":"214"}}
{"account_number":214,"balance":24418,"firstname":"Luann","lastname":"Faulkner","age":37,"gender":"F","address":"697 Hazel Court","employer":"Zolar","email":"luannfaulkner@zolar.com","city":"Ticonderoga","state":"TX"}
{"index":{"_id":"219"}}
{"account_number":219,"balance":17127,"firstname":"Edwards","lastname":"Hurley","age":25,"gender":"M","address":"834 Stockholm Street","employer":"Austech","email":"edwardshurley@austech.com","city":"Bayview","state":"NV"}
{"index":{"_id":"221"}}
{"account_number":221,"balance":15803,"firstname":"Benjamin","lastname":"Barrera","age":34,"gender":"M","address":"568 Main Street","employer":"Zaphire","email":"benjaminbarrera@zaphire.com","city":"Germanton","state":"WY"}
{"index":{"_id":"226"}}
{"account_number":226,"balance":37720,"firstname":"Wilkins","lastname":"Brady","age":40,"gender":"F","address":"486 Baltic Street","employer":"Dogtown","email":"wilkinsbrady@dogtown.com","city":"Condon","state":"MT"}
{"index":{"_id":"233"}}
{"account_number":233,"balance":23020,"firstname":"Washington","lastname":"Walsh","age":27,"gender":"M","address":"366 Church Avenue","employer":"Candecor","email":"washingtonwalsh@candecor.com","city":"Westphalia","state":"MA"}
{"index":{"_id":"238"}}
{"account_number":238,"balance":21287,"firstname":"Constance","lastname":"Wong","age":28,"gender":"M","address":"496 Brown Street","employer":"Grainspot","email":"constancewong@grainspot.com","city":"Cecilia","state":"IN"}
{"index":{"_id":"240"}}
{"account_number":240,"balance":49741,"firstname":"Oconnor","lastname":"Clay","age":35,"gender":"F","address":"659 Highland Boulevard","employer":"Franscene","email":"oconnorclay@franscene.com","city":"Kilbourne","state":"NH"}
{"index":{"_id":"245"}}
{"account_number":245,"balance":22026,"firstname":"Fran","lastname":"Bolton","age":28,"gender":"F","address":"147 Jerome Street","employer":"Solaren","email":"franbolton@solaren.com","city":"Nash","state":"RI"}
{"index":{"_id":"252"}}
{"account_number":252,"balance":18831,"firstname":"Elvia","lastname":"Poole","age":22,"gender":"F","address":"836 Delevan Street","employer":"Velity","email":"elviapoole@velity.com","city":"Groveville","state":"MI"}
{"index":{"_id":"257"}}
{"account_number":257,"balance":5318,"firstname":"Olive","lastname":"Oneil","age":35,"gender":"F","address":"457 Decatur Street","employer":"Helixo","email":"oliveoneil@helixo.com","city":"Chicopee","state":"MI"}
{"index":{"_id":"264"}}
{"account_number":264,"balance":22084,"firstname":"Samantha","lastname":"Ferrell","age":35,"gender":"F","address":"488 Fulton Street","employer":"Flum","email":"samanthaferrell@flum.com","city":"Brandywine","state":"MT"}
{"index":{"_id":"269"}}
{"account_number":269,"balance":43317,"firstname":"Crosby","lastname":"Figueroa","age":34,"gender":"M","address":"910 Aurelia Court","employer":"Pyramia","email":"crosbyfigueroa@pyramia.com","city":"Leyner","state":"OH"}
{"index":{"_id":"271"}}
{"account_number":271,"balance":11864,"firstname":"Holt","lastname":"Walter","age":30,"gender":"F","address":"645 Poplar Avenue","employer":"Grupoli","email":"holtwalter@grupoli.com","city":"Mansfield","state":"OR"}
{"index":{"_id":"276"}}
{"account_number":276,"balance":11606,"firstname":"Pittman","lastname":"Mathis","age":23,"gender":"F","address":"567 Charles Place","employer":"Zuvy","email":"pittmanmathis@zuvy.com","city":"Roeville","state":"KY"}
{"index":{"_id":"283"}}
{"account_number":283,"balance":24070,"firstname":"Fuentes","lastname":"Foley","age":30,"gender":"M","address":"729 Walker Court","employer":"Knowlysis","email":"fuentesfoley@knowlysis.com","city":"Tryon","state":"TN"}
{"index":{"_id":"288"}}
{"account_number":288,"balance":27243,"firstname":"Wong","lastname":"Stone","age":39,"gender":"F","address":"440 Willoughby Street","employer":"Zentix","email":"wongstone@zentix.com","city":"Wheatfields","state":"DC"}
{"index":{"_id":"290"}}
{"account_number":290,"balance":26103,"firstname":"Neva","lastname":"Burgess","age":37,"gender":"F","address":"985 Wyona Street","employer":"Slofast","email":"nevaburgess@slofast.com","city":"Cawood","state":"DC"}
{"index":{"_id":"295"}}
{"account_number":295,"balance":37358,"firstname":"Howe","lastname":"Nash","age":20,"gender":"M","address":"833 Union Avenue","employer":"Aquacine","email":"howenash@aquacine.com","city":"Indio","state":"MN"}
{"index":{"_id":"303"}}
{"account_number":303,"balance":21976,"firstname":"Huffman","lastname":"Green","age":24,"gender":"F","address":"455 Colby Court","employer":"Comtest","email":"huffmangreen@comtest.com","city":"Weeksville","state":"UT"}
{"index":{"_id":"308"}}
{"account_number":308,"balance":33989,"firstname":"Glass","lastname":"Schroeder","age":25,"gender":"F","address":"670 Veterans Avenue","employer":"Realmo","email":"glassschroeder@realmo.com","city":"Gratton","state":"NY"}
{"index":{"_id":"310"}}
{"account_number":310,"balance":23049,"firstname":"Shannon","lastname":"Morton","age":39,"gender":"F","address":"412 Pleasant Place","employer":"Ovation","email":"shannonmorton@ovation.com","city":"Edgar","state":"AZ"}
{"index":{"_id":"315"}}
{"account_number":315,"balance":1314,"firstname":"Clare","lastname":"Morrow","age":33,"gender":"F","address":"728 Madeline Court","employer":"Gaptec","email":"claremorrow@gaptec.com","city":"Mapletown","state":"PA"}
{"index":{"_id":"322"}}
{"account_number":322,"balance":6303,"firstname":"Gilliam","lastname":"Horne","age":27,"gender":"M","address":"414 Florence Avenue","employer":"Shepard","email":"gilliamhorne@shepard.com","city":"Winesburg","state":"WY"}
{"index":{"_id":"327"}}
{"account_number":327,"balance":29294,"firstname":"Nell","lastname":"Contreras","age":27,"gender":"M","address":"694 Gold Street","employer":"Momentia","email":"nellcontreras@momentia.com","city":"Cumminsville","state":"AL"}
{"index":{"_id":"334"}}
{"account_number":334,"balance":9178,"firstname":"Cross","lastname":"Floyd","age":21,"gender":"F","address":"815 Herkimer Court","employer":"Maroptic","email":"crossfloyd@maroptic.com","city":"Kraemer","state":"AK"}
{"index":{"_id":"339"}}
{"account_number":339,"balance":3992,"firstname":"Franco","lastname":"Welch","age":38,"gender":"F","address":"776 Brightwater Court","employer":"Earthplex","email":"francowelch@earthplex.com","city":"Naomi","state":"ME"}
{"index":{"_id":"341"}}
{"account_number":341,"balance":44367,"firstname":"Alberta","lastname":"Bradford","age":30,"gender":"F","address":"670 Grant Avenue","employer":"Bugsall","email":"albertabradford@bugsall.com","city":"Romeville","state":"MT"}
{"index":{"_id":"346"}}
{"account_number":346,"balance":26594,"firstname":"Shelby","lastname":"Sanchez","age":36,"gender":"F","address":"257 Fillmore Avenue","employer":"Geekus","email":"shelbysanchez@geekus.com","city":"Seymour","state":"CO"}
{"index":{"_id":"353"}}
{"account_number":353,"balance":45182,"firstname":"Rivera","lastname":"Sherman","age":37,"gender":"M","address":"603 Garden Place","employer":"Bovis","email":"riverasherman@bovis.com","city":"Otranto","state":"CA"}
{"index":{"_id":"358"}}
{"account_number":358,"balance":44043,"firstname":"Hale","lastname":"Baldwin","age":40,"gender":"F","address":"845 Menahan Street","employer":"Kidgrease","email":"halebaldwin@kidgrease.com","city":"Day","state":"AK"}
{"index":{"_id":"360"}}
{"account_number":360,"balance":26651,"firstname":"Ward","lastname":"Hicks","age":34,"gender":"F","address":"592 Brighton Court","employer":"Biotica","email":"wardhicks@biotica.com","city":"Kanauga","state":"VT"}
{"index":{"_id":"365"}}
{"account_number":365,"balance":3176,"firstname":"Sanders","lastname":"Holder","age":31,"gender":"F","address":"453 Cypress Court","employer":"Geekola","email":"sandersholder@geekola.com","city":"Staples","state":"TN"}
{"index":{"_id":"372"}}
{"account_number":372,"balance":28566,"firstname":"Alba","lastname":"Forbes","age":24,"gender":"M","address":"814 Meserole Avenue","employer":"Isostream","email":"albaforbes@isostream.com","city":"Clarence","state":"OR"}
{"index":{"_id":"377"}}
{"account_number":377,"balance":5374,"firstname":"Margo","lastname":"Gay","age":34,"gender":"F","address":"613 Chase Court","employer":"Rotodyne","email":"margogay@rotodyne.com","city":"Waumandee","state":"KS"}
{"index":{"_id":"384"}}
{"account_number":384,"balance":48758,"firstname":"Sallie","lastname":"Houston","age":31,"gender":"F","address":"836 Polar Street","employer":"Squish","email":"salliehouston@squish.com","city":"Morningside","state":"NC"}
{"index":{"_id":"389"}}
{"account_number":389,"balance":8839,"firstname":"York","lastname":"Cummings","age":27,"gender":"M","address":"778 Centre Street","employer":"Insurity","email":"yorkcummings@insurity.com","city":"Freeburn","state":"RI"}
{"index":{"_id":"391"}}
{"account_number":391,"balance":14733,"firstname":"Holman","lastname":"Jordan","age":30,"gender":"M","address":"391 Forrest Street","employer":"Maineland","email":"holmanjordan@maineland.com","city":"Cade","state":"CT"}
{"index":{"_id":"396"}}
{"account_number":396,"balance":14613,"firstname":"Marsha","lastname":"Elliott","age":38,"gender":"F","address":"297 Liberty Avenue","employer":"Orbiflex","email":"marshaelliott@orbiflex.com","city":"Windsor","state":"TX"}
{"index":{"_id":"404"}}
{"account_number":404,"balance":34978,"firstname":"Massey","lastname":"Becker","age":26,"gender":"F","address":"930 Pitkin Avenue","employer":"Genekom","email":"masseybecker@genekom.com","city":"Blairstown","state":"OR"}
{"index":{"_id":"409"}}
{"account_number":409,"balance":36960,"firstname":"Maura","lastname":"Glenn","age":31,"gender":"M","address":"183 Poly Place","employer":"Viagreat","email":"mauraglenn@viagreat.com","city":"Foscoe","state":"DE"}
{"index":{"_id":"411"}}
{"account_number":411,"balance":1172,"firstname":"Guzman","lastname":"Whitfield","age":22,"gender":"M","address":"181 Perry Terrace","employer":"Springbee","email":"guzmanwhitfield@springbee.com","city":"Balm","state":"IN"}
{"index":{"_id":"416"}}
{"account_number":416,"balance":27169,"firstname":"Hunt","lastname":"Schwartz","age":28,"gender":"F","address":"461 Havens Place","employer":"Danja","email":"huntschwartz@danja.com","city":"Grenelefe","state":"NV"}
{"index":{"_id":"423"}}
{"account_number":423,"balance":38852,"firstname":"Hines","lastname":"Underwood","age":21,"gender":"F","address":"284 Louise Terrace","employer":"Namegen","email":"hinesunderwood@namegen.com","city":"Downsville","state":"CO"}
{"index":{"_id":"428"}}
{"account_number":428,"balance":13925,"firstname":"Stephens","lastname":"Cain","age":20,"gender":"F","address":"189 Summit Street","employer":"Rocklogic","email":"stephenscain@rocklogic.com","city":"Bourg","state":"HI"}
{"index":{"_id":"430"}}
{"account_number":430,"balance":15251,"firstname":"Alejandra","lastname":"Chavez","age":34,"gender":"M","address":"651 Butler Place","employer":"Gology","email":"alejandrachavez@gology.com","city":"Allensworth","state":"VT"}
{"index":{"_id":"435"}}
{"account_number":435,"balance":14654,"firstname":"Sue","lastname":"Lopez","age":22,"gender":"F","address":"632 Stone Avenue","employer":"Emergent","email":"suelopez@emergent.com","city":"Waterford","state":"TN"}
{"index":{"_id":"442"}}
{"account_number":442,"balance":36211,"firstname":"Lawanda","lastname":"Leon","age":27,"gender":"F","address":"126 Canal Avenue","employer":"Xixan","email":"lawandaleon@xixan.com","city":"Berwind","state":"TN"}
{"index":{"_id":"447"}}
{"account_number":447,"balance":11402,"firstname":"Lucia","lastname":"Livingston","age":35,"gender":"M","address":"773 Lake Avenue","employer":"Soprano","email":"lucialivingston@soprano.com","city":"Edgewater","state":"TN"}
{"index":{"_id":"454"}}
{"account_number":454,"balance":31687,"firstname":"Alicia","lastname":"Rollins","age":22,"gender":"F","address":"483 Verona Place","employer":"Boilcat","email":"aliciarollins@boilcat.com","city":"Lutsen","state":"MD"}
{"index":{"_id":"459"}}
{"account_number":459,"balance":18869,"firstname":"Pamela","lastname":"Henry","age":20,"gender":"F","address":"361 Locust Avenue","employer":"Imageflow","email":"pamelahenry@imageflow.com","city":"Greenfields","state":"OH"}
{"index":{"_id":"461"}}
{"account_number":461,"balance":38807,"firstname":"Mcbride","lastname":"Padilla","age":34,"gender":"F","address":"550 Borinquen Pl","employer":"Zepitope","email":"mcbridepadilla@zepitope.com","city":"Emory","state":"AZ"}
{"index":{"_id":"466"}}
{"account_number":466,"balance":25109,"firstname":"Marcie","lastname":"Mcmillan","age":30,"gender":"F","address":"947 Gain Court","employer":"Entroflex","email":"marciemcmillan@entroflex.com","city":"Ronco","state":"ND"}
{"index":{"_id":"473"}}
{"account_number":473,"balance":5391,"firstname":"Susan","lastname":"Luna","age":25,"gender":"F","address":"521 Bogart Street","employer":"Zaya","email":"susanluna@zaya.com","city":"Grazierville","state":"MI"}
{"index":{"_id":"478"}}
{"account_number":478,"balance":28044,"firstname":"Dana","lastname":"Decker","age":35,"gender":"M","address":"627 Dobbin Street","employer":"Acrodance","email":"danadecker@acrodance.com","city":"Sharon","state":"MN"}
{"index":{"_id":"480"}}
{"account_number":480,"balance":40807,"firstname":"Anastasia","lastname":"Parker","age":24,"gender":"M","address":"650 Folsom Place","employer":"Zilladyne","email":"anastasiaparker@zilladyne.com","city":"Oberlin","state":"WY"}
{"index":{"_id":"485"}}
{"account_number":485,"balance":44235,"firstname":"Albert","lastname":"Roberts","age":40,"gender":"M","address":"385 Harman Street","employer":"Stralum","email":"albertroberts@stralum.com","city":"Watrous","state":"NM"}
{"index":{"_id":"492"}}
{"account_number":492,"balance":31055,"firstname":"Burnett","lastname":"Briggs","age":35,"gender":"M","address":"987 Cass Place","employer":"Pharmex","email":"burnettbriggs@pharmex.com","city":"Cornfields","state":"TX"}
{"index":{"_id":"497"}}
{"account_number":497,"balance":13493,"firstname":"Doyle","lastname":"Jenkins","age":30,"gender":"M","address":"205 Nevins Street","employer":"Unia","email":"doylejenkins@unia.com","city":"Nicut","state":"DC"}
{"index":{"_id":"500"}}
{"account_number":500,"balance":39143,"firstname":"Pope","lastname":"Keith","age":28,"gender":"F","address":"537 Fane Court","employer":"Zboo","email":"popekeith@zboo.com","city":"Courtland","state":"AL"}
{"index":{"_id":"505"}}
{"account_number":505,"balance":45493,"firstname":"Shelley","lastname":"Webb","age":29,"gender":"M","address":"873 Crawford Avenue","employer":"Quadeebo","email":"shelleywebb@quadeebo.com","city":"Topanga","state":"IL"}
{"index":{"_id":"512"}}
{"account_number":512,"balance":47432,"firstname":"Alisha","lastname":"Morales","age":29,"gender":"M","address":"623 Batchelder Street","employer":"Terragen","email":"alishamorales@terragen.com","city":"Gilmore","state":"VA"}
{"index":{"_id":"517"}}
{"account_number":517,"balance":3022,"firstname":"Allyson","lastname":"Walls","age":38,"gender":"F","address":"334 Coffey Street","employer":"Gorganic","email":"allysonwalls@gorganic.com","city":"Dahlen","state":"GA"}
{"index":{"_id":"524"}}
{"account_number":524,"balance":49334,"firstname":"Salas","lastname":"Farley","age":30,"gender":"F","address":"499 Trucklemans Lane","employer":"Xumonk","email":"salasfarley@xumonk.com","city":"Noxen","state":"AL"}
{"index":{"_id":"529"}}
{"account_number":529,"balance":21788,"firstname":"Deann","lastname":"Fisher","age":23,"gender":"F","address":"511 Buffalo Avenue","employer":"Twiist","email":"deannfisher@twiist.com","city":"Templeton","state":"WA"}
{"index":{"_id":"531"}}
{"account_number":531,"balance":39770,"firstname":"Janet","lastname":"Pena","age":38,"gender":"M","address":"645 Livonia Avenue","employer":"Corecom","email":"janetpena@corecom.com","city":"Garberville","state":"OK"}
{"index":{"_id":"536"}}
{"account_number":536,"balance":6255,"firstname":"Emma","lastname":"Adkins","age":33,"gender":"F","address":"971 Calder Place","employer":"Ontagene","email":"emmaadkins@ontagene.com","city":"Ruckersville","state":"GA"}
{"index":{"_id":"543"}}
{"account_number":543,"balance":48022,"firstname":"Marina","lastname":"Rasmussen","age":31,"gender":"M","address":"446 Love Lane","employer":"Crustatia","email":"marinarasmussen@crustatia.com","city":"Statenville","state":"MD"}
{"index":{"_id":"548"}}
{"account_number":548,"balance":36930,"firstname":"Sandra","lastname":"Andrews","age":37,"gender":"M","address":"973 Prospect Street","employer":"Datagene","email":"sandraandrews@datagene.com","city":"Inkerman","state":"MO"}
{"index":{"_id":"550"}}
{"account_number":550,"balance":32238,"firstname":"Walsh","lastname":"Goodwin","age":22,"gender":"M","address":"953 Canda Avenue","employer":"Proflex","email":"walshgoodwin@proflex.com","city":"Ypsilanti","state":"MT"}
{"index":{"_id":"555"}}
{"account_number":555,"balance":10750,"firstname":"Fannie","lastname":"Slater","age":31,"gender":"M","address":"457 Tech Place","employer":"Kineticut","email":"fannieslater@kineticut.com","city":"Basye","state":"MO"}
{"index":{"_id":"562"}}
{"account_number":562,"balance":10737,"firstname":"Sarah","lastname":"Strong","age":39,"gender":"F","address":"177 Pioneer Street","employer":"Megall","email":"sarahstrong@megall.com","city":"Ladera","state":"WY"}
{"index":{"_id":"567"}}
{"account_number":567,"balance":6507,"firstname":"Diana","lastname":"Dominguez","age":40,"gender":"M","address":"419 Albany Avenue","employer":"Ohmnet","email":"dianadominguez@ohmnet.com","city":"Wildwood","state":"TX"}
{"index":{"_id":"574"}}
{"account_number":574,"balance":32954,"firstname":"Andrea","lastname":"Mosley","age":24,"gender":"M","address":"368 Throop Avenue","employer":"Musix","email":"andreamosley@musix.com","city":"Blende","state":"DC"}
{"index":{"_id":"579"}}
{"account_number":579,"balance":12044,"firstname":"Banks","lastname":"Sawyer","age":36,"gender":"M","address":"652 Doone Court","employer":"Rooforia","email":"bankssawyer@rooforia.com","city":"Foxworth","state":"ND"}
{"index":{"_id":"581"}}
{"account_number":581,"balance":16525,"firstname":"Fuller","lastname":"Mcintyre","age":32,"gender":"M","address":"169 Bergen Place","employer":"Applideck","email":"fullermcintyre@applideck.com","city":"Kenvil","state":"NY"}
{"index":{"_id":"586"}}
{"account_number":586,"balance":13644,"firstname":"Love","lastname":"Velasquez","age":26,"gender":"F","address":"290 Girard Street","employer":"Zomboid","email":"lovevelasquez@zomboid.com","city":"Villarreal","state":"SD"}
{"index":{"_id":"593"}}
{"account_number":593,"balance":41230,"firstname":"Muriel","lastname":"Vazquez","age":37,"gender":"M","address":"395 Montgomery Street","employer":"Sustenza","email":"murielvazquez@sustenza.com","city":"Strykersville","state":"OK"}
{"index":{"_id":"598"}}
{"account_number":598,"balance":33251,"firstname":"Morgan","lastname":"Coleman","age":33,"gender":"M","address":"324 McClancy Place","employer":"Aclima","email":"morgancoleman@aclima.com","city":"Bowden","state":"WA"}
{"index":{"_id":"601"}}
{"account_number":601,"balance":20796,"firstname":"Vickie","lastname":"Valentine","age":34,"gender":"F","address":"432 Bassett Avenue","employer":"Comvene","email":"vickievalentine@comvene.com","city":"Teasdale","state":"UT"}
{"index":{"_id":"606"}}
{"account_number":606,"balance":28770,"firstname":"Michael","lastname":"Bray","age":31,"gender":"M","address":"935 Lake Place","employer":"Telepark","email":"michaelbray@telepark.com","city":"Lemoyne","state":"CT"}
{"index":{"_id":"613"}}
{"account_number":613,"balance":39340,"firstname":"Eddie","lastname":"Mccarty","age":34,"gender":"F","address":"971 Richards Street","employer":"Bisba","email":"eddiemccarty@bisba.com","city":"Fruitdale","state":"NY"}
{"index":{"_id":"618"}}
{"account_number":618,"balance":8976,"firstname":"Cheri","lastname":"Ford","age":30,"gender":"F","address":"803 Ridgewood Avenue","employer":"Zorromop","email":"cheriford@zorromop.com","city":"Gambrills","state":"VT"}
{"index":{"_id":"620"}}
{"account_number":620,"balance":7224,"firstname":"Coleen","lastname":"Bartlett","age":38,"gender":"M","address":"761 Carroll Street","employer":"Idealis","email":"coleenbartlett@idealis.com","city":"Mathews","state":"DE"}
{"index":{"_id":"625"}}
{"account_number":625,"balance":46010,"firstname":"Cynthia","lastname":"Johnston","age":23,"gender":"M","address":"142 Box Street","employer":"Zentry","email":"cynthiajohnston@zentry.com","city":"Makena","state":"MA"}
{"index":{"_id":"632"}}
{"account_number":632,"balance":40470,"firstname":"Kay","lastname":"Warren","age":20,"gender":"F","address":"422 Alabama Avenue","employer":"Realysis","email":"kaywarren@realysis.com","city":"Homestead","state":"HI"}
{"index":{"_id":"637"}}
{"account_number":637,"balance":3169,"firstname":"Kathy","lastname":"Carter","age":27,"gender":"F","address":"410 Jamison Lane","employer":"Limage","email":"kathycarter@limage.com","city":"Ernstville","state":"WA"}
{"index":{"_id":"644"}}
{"account_number":644,"balance":44021,"firstname":"Etta","lastname":"Miller","age":21,"gender":"F","address":"376 Lawton Street","employer":"Bluegrain","email":"ettamiller@bluegrain.com","city":"Baker","state":"MD"}
{"index":{"_id":"649"}}
{"account_number":649,"balance":20275,"firstname":"Jeanine","lastname":"Malone","age":26,"gender":"F","address":"114 Dodworth Street","employer":"Nixelt","email":"jeaninemalone@nixelt.com","city":"Keyport","state":"AK"}
{"index":{"_id":"651"}}
{"account_number":651,"balance":18360,"firstname":"Young","lastname":"Reeves","age":34,"gender":"M","address":"581 Plaza Street","employer":"Krog","email":"youngreeves@krog.com","city":"Sussex","state":"WY"}
{"index":{"_id":"656"}}
{"account_number":656,"balance":21632,"firstname":"Olson","lastname":"Hunt","age":36,"gender":"M","address":"342 Jaffray Street","employer":"Volax","email":"olsonhunt@volax.com","city":"Bangor","state":"WA"}
{"index":{"_id":"663"}}
{"account_number":663,"balance":2456,"firstname":"Rollins","lastname":"Richards","age":37,"gender":"M","address":"129 Sullivan Place","employer":"Geostele","email":"rollinsrichards@geostele.com","city":"Morgandale","state":"FL"}
{"index":{"_id":"668"}}
{"account_number":668,"balance":45069,"firstname":"Potter","lastname":"Michael","age":27,"gender":"M","address":"803 Glenmore Avenue","employer":"Ontality","email":"pottermichael@ontality.com","city":"Newkirk","state":"KS"}
{"index":{"_id":"670"}}
{"account_number":670,"balance":10178,"firstname":"Ollie","lastname":"Riley","age":22,"gender":"M","address":"252 Jackson Place","employer":"Adornica","email":"ollieriley@adornica.com","city":"Brethren","state":"WI"}
{"index":{"_id":"675"}}
{"account_number":675,"balance":36102,"firstname":"Fisher","lastname":"Shepard","age":27,"gender":"F","address":"859 Varick Street","employer":"Qot","email":"fishershepard@qot.com","city":"Diaperville","state":"MD"}
{"index":{"_id":"682"}}
{"account_number":682,"balance":14168,"firstname":"Anne","lastname":"Hale","age":22,"gender":"F","address":"708 Anthony Street","employer":"Cytrek","email":"annehale@cytrek.com","city":"Beechmont","state":"WV"}
{"index":{"_id":"687"}}
{"account_number":687,"balance":48630,"firstname":"Caroline","lastname":"Cox","age":31,"gender":"M","address":"626 Hillel Place","employer":"Opticon","email":"carolinecox@opticon.com","city":"Loma","state":"ND"}
{"index":{"_id":"694"}}
{"account_number":694,"balance":33125,"firstname":"Craig","lastname":"Palmer","age":31,"gender":"F","address":"273 Montrose Avenue","employer":"Comvey","email":"craigpalmer@comvey.com","city":"Cleary","state":"OK"}
{"index":{"_id":"699"}}
{"account_number":699,"balance":4156,"firstname":"Gallagher","lastname":"Marshall","age":37,"gender":"F","address":"648 Clifford Place","employer":"Exiand","email":"gallaghermarshall@exiand.com","city":"Belfair","state":"KY"}
{"index":{"_id":"702"}}
{"account_number":702,"balance":46490,"firstname":"Meadows","lastname":"Delgado","age":26,"gender":"M","address":"612 Jardine Place","employer":"Daisu","email":"meadowsdelgado@daisu.com","city":"Venice","state":"AR"}
{"index":{"_id":"707"}}
{"account_number":707,"balance":30325,"firstname":"Sonya","lastname":"Trevino","age":30,"gender":"F","address":"181 Irving Place","employer":"Atgen","email":"sonyatrevino@atgen.com","city":"Enetai","state":"TN"}
{"index":{"_id":"714"}}
{"account_number":714,"balance":16602,"firstname":"Socorro","lastname":"Murray","age":34,"gender":"F","address":"810 Manhattan Court","employer":"Isoswitch","email":"socorromurray@isoswitch.com","city":"Jugtown","state":"AZ"}
{"index":{"_id":"719"}}
{"account_number":719,"balance":33107,"firstname":"Leanna","lastname":"Reed","age":25,"gender":"F","address":"528 Krier Place","employer":"Rodeology","email":"leannareed@rodeology.com","city":"Carrizo","state":"WI"}
{"index":{"_id":"721"}}
{"account_number":721,"balance":32958,"firstname":"Mara","lastname":"Dickson","age":26,"gender":"M","address":"810 Harrison Avenue","employer":"Comtours","email":"maradickson@comtours.com","city":"Thynedale","state":"DE"}
{"index":{"_id":"726"}}
{"account_number":726,"balance":44737,"firstname":"Rosemary","lastname":"Salazar","age":21,"gender":"M","address":"290 Croton Loop","employer":"Rockabye","email":"rosemarysalazar@rockabye.com","city":"Helen","state":"IA"}
{"index":{"_id":"733"}}
{"account_number":733,"balance":15722,"firstname":"Lakeisha","lastname":"Mccarthy","age":37,"gender":"M","address":"782 Turnbull Avenue","employer":"Exosis","email":"lakeishamccarthy@exosis.com","city":"Caberfae","state":"NM"}
{"index":{"_id":"738"}}
{"account_number":738,"balance":44936,"firstname":"Rosalind","lastname":"Hunter","age":32,"gender":"M","address":"644 Eaton Court","employer":"Zolarity","email":"rosalindhunter@zolarity.com","city":"Cataract","state":"SD"}
{"index":{"_id":"740"}}
{"account_number":740,"balance":6143,"firstname":"Chambers","lastname":"Hahn","age":22,"gender":"M","address":"937 Windsor Place","employer":"Medalert","email":"chambershahn@medalert.com","city":"Dorneyville","state":"DC"}
{"index":{"_id":"745"}}
{"account_number":745,"balance":4572,"firstname":"Jacobs","lastname":"Sweeney","age":32,"gender":"M","address":"189 Lott Place","employer":"Comtent","email":"jacobssweeney@comtent.com","city":"Advance","state":"NJ"}
{"index":{"_id":"752"}}
{"account_number":752,"balance":14039,"firstname":"Jerry","lastname":"Rush","age":31,"gender":"M","address":"632 Dank Court","employer":"Ebidco","email":"jerryrush@ebidco.com","city":"Geyserville","state":"AR"}
{"index":{"_id":"757"}}
{"account_number":757,"balance":34628,"firstname":"Mccullough","lastname":"Moore","age":30,"gender":"F","address":"304 Hastings Street","employer":"Nikuda","email":"mcculloughmoore@nikuda.com","city":"Charco","state":"DC"}
{"index":{"_id":"764"}}
{"account_number":764,"balance":3728,"firstname":"Noemi","lastname":"Gill","age":30,"gender":"M","address":"427 Chester Street","employer":"Avit","email":"noemigill@avit.com","city":"Chesterfield","state":"AL"}
{"index":{"_id":"769"}}
{"account_number":769,"balance":15362,"firstname":"Francis","lastname":"Beck","age":28,"gender":"M","address":"454 Livingston Street","employer":"Furnafix","email":"francisbeck@furnafix.com","city":"Dunnavant","state":"HI"}
{"index":{"_id":"771"}}
{"account_number":771,"balance":32784,"firstname":"Jocelyn","lastname":"Boone","age":23,"gender":"M","address":"513 Division Avenue","employer":"Collaire","email":"jocelynboone@collaire.com","city":"Lisco","state":"VT"}
{"index":{"_id":"776"}}
{"account_number":776,"balance":29177,"firstname":"Duke","lastname":"Atkinson","age":24,"gender":"M","address":"520 Doscher Street","employer":"Tripsch","email":"dukeatkinson@tripsch.com","city":"Lafferty","state":"NC"}
{"index":{"_id":"783"}}
{"account_number":783,"balance":11911,"firstname":"Faith","lastname":"Cooper","age":25,"gender":"F","address":"539 Rapelye Street","employer":"Insuron","email":"faithcooper@insuron.com","city":"Jennings","state":"MN"}
{"index":{"_id":"788"}}
{"account_number":788,"balance":12473,"firstname":"Marianne","lastname":"Aguilar","age":39,"gender":"F","address":"213 Holly Street","employer":"Marqet","email":"marianneaguilar@marqet.com","city":"Alfarata","state":"HI"}
{"index":{"_id":"790"}}
{"account_number":790,"balance":29912,"firstname":"Ellis","lastname":"Sullivan","age":39,"gender":"F","address":"877 Coyle Street","employer":"Enersave","email":"ellissullivan@enersave.com","city":"Canby","state":"MS"}
{"index":{"_id":"795"}}
{"account_number":795,"balance":31450,"firstname":"Bruce","lastname":"Avila","age":34,"gender":"M","address":"865 Newkirk Placez","employer":"Plasmosis","email":"bruceavila@plasmosis.com","city":"Ada","state":"ID"}
{"index":{"_id":"803"}}
{"account_number":803,"balance":49567,"firstname":"Marissa","lastname":"Spears","age":25,"gender":"M","address":"963 Highland Avenue","employer":"Centregy","email":"marissaspears@centregy.com","city":"Bloomington","state":"MS"}
{"index":{"_id":"808"}}
{"account_number":808,"balance":11251,"firstname":"Nola","lastname":"Quinn","age":20,"gender":"M","address":"863 Wythe Place","employer":"Iplax","email":"nolaquinn@iplax.com","city":"Cuylerville","state":"NH"}
{"index":{"_id":"810"}}
{"account_number":810,"balance":10563,"firstname":"Alyssa","lastname":"Ortega","age":40,"gender":"M","address":"977 Clymer Street","employer":"Eventage","email":"alyssaortega@eventage.com","city":"Convent","state":"SC"}
{"index":{"_id":"815"}}
{"account_number":815,"balance":19336,"firstname":"Guthrie","lastname":"Morse","age":30,"gender":"M","address":"685 Vandalia Avenue","employer":"Gronk","email":"guthriemorse@gronk.com","city":"Fowlerville","state":"OR"}
{"index":{"_id":"822"}}
{"account_number":822,"balance":13024,"firstname":"Hicks","lastname":"Farrell","age":25,"gender":"M","address":"468 Middleton Street","employer":"Zolarex","email":"hicksfarrell@zolarex.com","city":"Columbus","state":"OR"}
{"index":{"_id":"827"}}
{"account_number":827,"balance":37536,"firstname":"Naomi","lastname":"Ball","age":29,"gender":"F","address":"319 Stewart Street","employer":"Isotronic","email":"naomiball@isotronic.com","city":"Trona","state":"NM"}
{"index":{"_id":"834"}}
{"account_number":834,"balance":38049,"firstname":"Sybil","lastname":"Carrillo","age":25,"gender":"M","address":"359 Baughman Place","employer":"Phuel","email":"sybilcarrillo@phuel.com","city":"Kohatk","state":"CT"}
{"index":{"_id":"839"}}
{"account_number":839,"balance":38292,"firstname":"Langley","lastname":"Neal","age":39,"gender":"F","address":"565 Newton Street","employer":"Liquidoc","email":"langleyneal@liquidoc.com","city":"Osage","state":"AL"}
{"index":{"_id":"841"}}
{"account_number":841,"balance":28291,"firstname":"Dalton","lastname":"Waters","age":21,"gender":"M","address":"859 Grand Street","employer":"Malathion","email":"daltonwaters@malathion.com","city":"Tonopah","state":"AZ"}
{"index":{"_id":"846"}}
{"account_number":846,"balance":35099,"firstname":"Maureen","lastname":"Glass","age":22,"gender":"M","address":"140 Amherst Street","employer":"Stelaecor","email":"maureenglass@stelaecor.com","city":"Cucumber","state":"IL"}
{"index":{"_id":"853"}}
{"account_number":853,"balance":38353,"firstname":"Travis","lastname":"Parks","age":40,"gender":"M","address":"930 Bay Avenue","employer":"Pyramax","email":"travisparks@pyramax.com","city":"Gadsden","state":"ND"}
{"index":{"_id":"858"}}
{"account_number":858,"balance":23194,"firstname":"Small","lastname":"Hatfield","age":36,"gender":"M","address":"593 Tennis Court","employer":"Letpro","email":"smallhatfield@letpro.com","city":"Haena","state":"KS"}
{"index":{"_id":"860"}}
{"account_number":860,"balance":23613,"firstname":"Clark","lastname":"Boyd","age":37,"gender":"M","address":"501 Rock Street","employer":"Deepends","email":"clarkboyd@deepends.com","city":"Whitewater","state":"MA"}
{"index":{"_id":"865"}}
{"account_number":865,"balance":10574,"firstname":"Cook","lastname":"Kelley","age":28,"gender":"F","address":"865 Lincoln Terrace","employer":"Quizmo","email":"cookkelley@quizmo.com","city":"Kansas","state":"KY"}
{"index":{"_id":"872"}}
{"account_number":872,"balance":26314,"firstname":"Jane","lastname":"Greer","age":36,"gender":"F","address":"717 Hewes Street","employer":"Newcube","email":"janegreer@newcube.com","city":"Delshire","state":"DE"}
{"index":{"_id":"877"}}
{"account_number":877,"balance":42879,"firstname":"Tracey","lastname":"Ruiz","age":34,"gender":"F","address":"141 Tompkins Avenue","employer":"Waab","email":"traceyruiz@waab.com","city":"Zeba","state":"NM"}
{"index":{"_id":"884"}}
{"account_number":884,"balance":29316,"firstname":"Reva","lastname":"Rosa","age":40,"gender":"M","address":"784 Greene Avenue","employer":"Urbanshee","email":"revarosa@urbanshee.com","city":"Bakersville","state":"MS"}
{"index":{"_id":"889"}}
{"account_number":889,"balance":26464,"firstname":"Fischer","lastname":"Klein","age":38,"gender":"F","address":"948 Juliana Place","employer":"Comtext","email":"fischerklein@comtext.com","city":"Jackpot","state":"PA"}
{"index":{"_id":"891"}}
{"account_number":891,"balance":34829,"firstname":"Jacobson","lastname":"Clemons","age":24,"gender":"F","address":"507 Wilson Street","employer":"Quilm","email":"jacobsonclemons@quilm.com","city":"Muir","state":"TX"}
{"index":{"_id":"896"}}
{"account_number":896,"balance":31947,"firstname":"Buckley","lastname":"Peterson","age":26,"gender":"M","address":"217 Beayer Place","employer":"Earwax","email":"buckleypeterson@earwax.com","city":"Franklin","state":"DE"}
{"index":{"_id":"904"}}
{"account_number":904,"balance":27707,"firstname":"Mendez","lastname":"Mcneil","age":26,"gender":"M","address":"431 Halsey Street","employer":"Macronaut","email":"mendezmcneil@macronaut.com","city":"Troy","state":"OK"}
{"index":{"_id":"909"}}
{"account_number":909,"balance":18421,"firstname":"Stark","lastname":"Lewis","age":36,"gender":"M","address":"409 Tilden Avenue","employer":"Frosnex","email":"starklewis@frosnex.com","city":"Axis","state":"CA"}
{"index":{"_id":"911"}}
{"account_number":911,"balance":42655,"firstname":"Annie","lastname":"Lyons","age":21,"gender":"M","address":"518 Woods Place","employer":"Enerforce","email":"annielyons@enerforce.com","city":"Stagecoach","state":"MA"}
{"index":{"_id":"916"}}
{"account_number":916,"balance":47887,"firstname":"Jarvis","lastname":"Alexander","age":40,"gender":"M","address":"406 Bergen Avenue","employer":"Equitax","email":"jarvisalexander@equitax.com","city":"Haring","state":"KY"}
{"index":{"_id":"923"}}
{"account_number":923,"balance":48466,"firstname":"Mueller","lastname":"Mckee","age":26,"gender":"M","address":"298 Ruby Street","employer":"Luxuria","email":"muellermckee@luxuria.com","city":"Coleville","state":"TN"}
{"index":{"_id":"928"}}
{"account_number":928,"balance":19611,"firstname":"Hester","lastname":"Copeland","age":22,"gender":"F","address":"425 Cropsey Avenue","employer":"Dymi","email":"hestercopeland@dymi.com","city":"Wolcott","state":"NE"}
{"index":{"_id":"930"}}
{"account_number":930,"balance":47257,"firstname":"Kinney","lastname":"Lawson","age":39,"gender":"M","address":"501 Raleigh Place","employer":"Neptide","email":"kinneylawson@neptide.com","city":"Deltaville","state":"MD"}
{"index":{"_id":"935"}}
{"account_number":935,"balance":4959,"firstname":"Flowers","lastname":"Robles","age":30,"gender":"M","address":"201 Hull Street","employer":"Xelegyl","email":"flowersrobles@xelegyl.com","city":"Rehrersburg","state":"AL"}
{"index":{"_id":"942"}}
{"account_number":942,"balance":21299,"firstname":"Hamilton","lastname":"Clayton","age":26,"gender":"M","address":"413 Debevoise Street","employer":"Architax","email":"hamiltonclayton@architax.com","city":"Terlingua","state":"NM"}
{"index":{"_id":"947"}}
{"account_number":947,"balance":22039,"firstname":"Virgie","lastname":"Garza","age":30,"gender":"M","address":"903 Matthews Court","employer":"Plasmox","email":"virgiegarza@plasmox.com","city":"Somerset","state":"WY"}
{"index":{"_id":"954"}}
{"account_number":954,"balance":49404,"firstname":"Jenna","lastname":"Martin","age":22,"gender":"M","address":"688 Hart Street","employer":"Zinca","email":"jennamartin@zinca.com","city":"Oasis","state":"MD"}
{"index":{"_id":"959"}}
{"account_number":959,"balance":34743,"firstname":"Shaffer","lastname":"Cervantes","age":40,"gender":"M","address":"931 Varick Avenue","employer":"Oceanica","email":"shaffercervantes@oceanica.com","city":"Bowie","state":"AL"}
{"index":{"_id":"961"}}
{"account_number":961,"balance":43219,"firstname":"Betsy","lastname":"Hyde","age":27,"gender":"F","address":"183 Junius Street","employer":"Tubalum","email":"betsyhyde@tubalum.com","city":"Driftwood","state":"TX"}
{"index":{"_id":"966"}}
{"account_number":966,"balance":20619,"firstname":"Susanne","lastname":"Rodriguez","age":35,"gender":"F","address":"255 Knickerbocker Avenue","employer":"Comtrek","email":"susannerodriguez@comtrek.com","city":"Trinway","state":"TX"}
{"index":{"_id":"973"}}
{"account_number":973,"balance":45756,"firstname":"Rice","lastname":"Farmer","age":31,"gender":"M","address":"476 Nassau Avenue","employer":"Photobin","email":"ricefarmer@photobin.com","city":"Suitland","state":"ME"}
{"index":{"_id":"978"}}
{"account_number":978,"balance":21459,"firstname":"Melanie","lastname":"Rojas","age":33,"gender":"M","address":"991 Java Street","employer":"Kage","email":"melanierojas@kage.com","city":"Greenock","state":"VT"}
{"index":{"_id":"980"}}
{"account_number":980,"balance":42436,"firstname":"Cash","lastname":"Collier","age":33,"gender":"F","address":"999 Sapphire Street","employer":"Ceprene","email":"cashcollier@ceprene.com","city":"Glidden","state":"AK"}
{"index":{"_id":"985"}}
{"account_number":985,"balance":20083,"firstname":"Martin","lastname":"Gardner","age":28,"gender":"F","address":"644 Fairview Place","employer":"Golistic","email":"martingardner@golistic.com","city":"Connerton","state":"NJ"}
{"index":{"_id":"992"}}
{"account_number":992,"balance":11413,"firstname":"Kristie","lastname":"Kennedy","age":33,"gender":"F","address":"750 Hudson Avenue","employer":"Ludak","email":"kristiekennedy@ludak.com","city":"Warsaw","state":"WY"}
{"index":{"_id":"997"}}
{"account_number":997,"balance":25311,"firstname":"Combs","lastname":"Frederick","age":20,"gender":"M","address":"586 Lloyd Court","employer":"Pathways","email":"combsfrederick@pathways.com","city":"Williamson","state":"CA"}
{"index":{"_id":"3"}}
{"account_number":3,"balance":44947,"firstname":"Levine","lastname":"Burks","age":26,"gender":"F","address":"328 Wilson Avenue","employer":"Amtap","email":"levineburks@amtap.com","city":"Cochranville","state":"HI"}
{"index":{"_id":"8"}}
{"account_number":8,"balance":48868,"firstname":"Jan","lastname":"Burns","age":35,"gender":"M","address":"699 Visitation Place","employer":"Glasstep","email":"janburns@glasstep.com","city":"Wakulla","state":"AZ"}
{"index":{"_id":"10"}}
{"account_number":10,"balance":46170,"firstname":"Dominique","lastname":"Park","age":37,"gender":"F","address":"100 Gatling Place","employer":"Conjurica","email":"dominiquepark@conjurica.com","city":"Omar","state":"NJ"}
{"index":{"_id":"15"}}
{"account_number":15,"balance":43456,"firstname":"Bobbie","lastname":"Sexton","age":21,"gender":"M","address":"232 Sedgwick Place","employer":"Zytrex","email":"bobbiesexton@zytrex.com","city":"Hendersonville","state":"CA"}
{"index":{"_id":"22"}}
{"account_number":22,"balance":40283,"firstname":"Barrera","lastname":"Terrell","age":23,"gender":"F","address":"292 Orange Street","employer":"Steelfab","email":"barreraterrell@steelfab.com","city":"Bynum","state":"ME"}
{"index":{"_id":"27"}}
{"account_number":27,"balance":6176,"firstname":"Meyers","lastname":"Williamson","age":26,"gender":"F","address":"675 Henderson Walk","employer":"Plexia","email":"meyerswilliamson@plexia.com","city":"Richmond","state":"AZ"}
{"index":{"_id":"34"}}
{"account_number":34,"balance":35379,"firstname":"Ellison","lastname":"Kim","age":30,"gender":"F","address":"986 Revere Place","employer":"Signity","email":"ellisonkim@signity.com","city":"Sehili","state":"IL"}
{"index":{"_id":"39"}}
{"account_number":39,"balance":38688,"firstname":"Bowers","lastname":"Mendez","age":22,"gender":"F","address":"665 Bennet Court","employer":"Farmage","email":"bowersmendez@farmage.com","city":"Duryea","state":"PA"}
{"index":{"_id":"41"}}
{"account_number":41,"balance":36060,"firstname":"Hancock","lastname":"Holden","age":20,"gender":"M","address":"625 Gaylord Drive","employer":"Poochies","email":"hancockholden@poochies.com","city":"Alamo","state":"KS"}
{"index":{"_id":"46"}}
{"account_number":46,"balance":12351,"firstname":"Karla","lastname":"Bowman","age":23,"gender":"M","address":"554 Chapel Street","employer":"Undertap","email":"karlabowman@undertap.com","city":"Sylvanite","state":"DC"}
{"index":{"_id":"53"}}
{"account_number":53,"balance":28101,"firstname":"Kathryn","lastname":"Payne","age":29,"gender":"F","address":"467 Louis Place","employer":"Katakana","email":"kathrynpayne@katakana.com","city":"Harviell","state":"SD"}
{"index":{"_id":"58"}}
{"account_number":58,"balance":31697,"firstname":"Marva","lastname":"Cannon","age":40,"gender":"M","address":"993 Highland Place","employer":"Comcubine","email":"marvacannon@comcubine.com","city":"Orviston","state":"MO"}
{"index":{"_id":"60"}}
{"account_number":60,"balance":45955,"firstname":"Maude","lastname":"Casey","age":31,"gender":"F","address":"566 Strauss Street","employer":"Quilch","email":"maudecasey@quilch.com","city":"Enlow","state":"GA"}
{"index":{"_id":"65"}}
{"account_number":65,"balance":23282,"firstname":"Leonor","lastname":"Pruitt","age":24,"gender":"M","address":"974 Terrace Place","employer":"Velos","email":"leonorpruitt@velos.com","city":"Devon","state":"WI"}
{"index":{"_id":"72"}}
{"account_number":72,"balance":9732,"firstname":"Barlow","lastname":"Rhodes","age":25,"gender":"F","address":"891 Clinton Avenue","employer":"Zialactic","email":"barlowrhodes@zialactic.com","city":"Echo","state":"TN"}
{"index":{"_id":"77"}}
{"account_number":77,"balance":5724,"firstname":"Byrd","lastname":"Conley","age":24,"gender":"F","address":"698 Belmont Avenue","employer":"Zidox","email":"byrdconley@zidox.com","city":"Rockbridge","state":"SC"}
{"index":{"_id":"84"}}
{"account_number":84,"balance":3001,"firstname":"Hutchinson","lastname":"Newton","age":34,"gender":"F","address":"553 Locust Street","employer":"Zaggles","email":"hutchinsonnewton@zaggles.com","city":"Snyderville","state":"DC"}
{"index":{"_id":"89"}}
{"account_number":89,"balance":13263,"firstname":"Mcdowell","lastname":"Bradley","age":28,"gender":"M","address":"960 Howard Alley","employer":"Grok","email":"mcdowellbradley@grok.com","city":"Toftrees","state":"TX"}
{"index":{"_id":"91"}}
{"account_number":91,"balance":29799,"firstname":"Vonda","lastname":"Galloway","age":20,"gender":"M","address":"988 Voorhies Avenue","employer":"Illumity","email":"vondagalloway@illumity.com","city":"Holcombe","state":"HI"}
{"index":{"_id":"96"}}
{"account_number":96,"balance":15933,"firstname":"Shirley","lastname":"Edwards","age":38,"gender":"M","address":"817 Caton Avenue","employer":"Equitox","email":"shirleyedwards@equitox.com","city":"Nelson","state":"MA"}
{"index":{"_id":"104"}}
{"account_number":104,"balance":32619,"firstname":"Casey","lastname":"Roth","age":29,"gender":"M","address":"963 Railroad Avenue","employer":"Hotcakes","email":"caseyroth@hotcakes.com","city":"Davenport","state":"OH"}
{"index":{"_id":"109"}}
{"account_number":109,"balance":25812,"firstname":"Gretchen","lastname":"Dawson","age":31,"gender":"M","address":"610 Bethel Loop","employer":"Tetak","email":"gretchendawson@tetak.com","city":"Hailesboro","state":"CO"}
{"index":{"_id":"111"}}
{"account_number":111,"balance":1481,"firstname":"Traci","lastname":"Allison","age":35,"gender":"M","address":"922 Bryant Street","employer":"Enjola","email":"traciallison@enjola.com","city":"Robinette","state":"OR"}
{"index":{"_id":"116"}}
{"account_number":116,"balance":21335,"firstname":"Hobbs","lastname":"Wright","age":24,"gender":"M","address":"965 Temple Court","employer":"Netbook","email":"hobbswright@netbook.com","city":"Strong","state":"CA"}
{"index":{"_id":"123"}}
{"account_number":123,"balance":3079,"firstname":"Cleo","lastname":"Beach","age":27,"gender":"F","address":"653 Haring Street","employer":"Proxsoft","email":"cleobeach@proxsoft.com","city":"Greensburg","state":"ME"}
{"index":{"_id":"128"}}
{"account_number":128,"balance":3556,"firstname":"Mack","lastname":"Bullock","age":34,"gender":"F","address":"462 Ingraham Street","employer":"Terascape","email":"mackbullock@terascape.com","city":"Eureka","state":"PA"}
{"index":{"_id":"130"}}
{"account_number":130,"balance":24171,"firstname":"Roxie","lastname":"Cantu","age":33,"gender":"M","address":"841 Catherine Street","employer":"Skybold","email":"roxiecantu@skybold.com","city":"Deputy","state":"NE"}
{"index":{"_id":"135"}}
{"account_number":135,"balance":24885,"firstname":"Stevenson","lastname":"Crosby","age":40,"gender":"F","address":"473 Boardwalk ","employer":"Accel","email":"stevensoncrosby@accel.com","city":"Norris","state":"OK"}
{"index":{"_id":"142"}}
{"account_number":142,"balance":4544,"firstname":"Vang","lastname":"Hughes","age":27,"gender":"M","address":"357 Landis Court","employer":"Bolax","email":"vanghughes@bolax.com","city":"Emerald","state":"WY"}
{"index":{"_id":"147"}}
{"account_number":147,"balance":35921,"firstname":"Charmaine","lastname":"Whitney","age":28,"gender":"F","address":"484 Seton Place","employer":"Comveyer","email":"charmainewhitney@comveyer.com","city":"Dexter","state":"DC"}
{"index":{"_id":"154"}}
{"account_number":154,"balance":40945,"firstname":"Burns","lastname":"Solis","age":31,"gender":"M","address":"274 Lorraine Street","employer":"Rodemco","email":"burnssolis@rodemco.com","city":"Ballico","state":"WI"}
{"index":{"_id":"159"}}
{"account_number":159,"balance":1696,"firstname":"Alvarez","lastname":"Mack","age":22,"gender":"F","address":"897 Manor Court","employer":"Snorus","email":"alvarezmack@snorus.com","city":"Rosedale","state":"CA"}
{"index":{"_id":"161"}}
{"account_number":161,"balance":4659,"firstname":"Doreen","lastname":"Randall","age":37,"gender":"F","address":"178 Court Street","employer":"Calcula","email":"doreenrandall@calcula.com","city":"Belmont","state":"TX"}
{"index":{"_id":"166"}}
{"account_number":166,"balance":33847,"firstname":"Rutledge","lastname":"Rivas","age":23,"gender":"M","address":"352 Verona Street","employer":"Virxo","email":"rutledgerivas@virxo.com","city":"Brandermill","state":"NE"}
{"index":{"_id":"173"}}
{"account_number":173,"balance":5989,"firstname":"Whitley","lastname":"Blevins","age":32,"gender":"M","address":"127 Brooklyn Avenue","employer":"Pawnagra","email":"whitleyblevins@pawnagra.com","city":"Rodanthe","state":"ND"}
{"index":{"_id":"178"}}
{"account_number":178,"balance":36735,"firstname":"Clements","lastname":"Finley","age":39,"gender":"F","address":"270 Story Court","employer":"Imaginart","email":"clementsfinley@imaginart.com","city":"Lookingglass","state":"MN"}
{"index":{"_id":"180"}}
{"account_number":180,"balance":34236,"firstname":"Ursula","lastname":"Goodman","age":32,"gender":"F","address":"414 Clinton Street","employer":"Earthmark","email":"ursulagoodman@earthmark.com","city":"Rote","state":"AR"}
{"index":{"_id":"185"}}
{"account_number":185,"balance":43532,"firstname":"Laurel","lastname":"Cline","age":40,"gender":"M","address":"788 Fenimore Street","employer":"Prismatic","email":"laurelcline@prismatic.com","city":"Frank","state":"UT"}
{"index":{"_id":"192"}}
{"account_number":192,"balance":23508,"firstname":"Ramsey","lastname":"Carr","age":31,"gender":"F","address":"209 Williamsburg Street","employer":"Strezzo","email":"ramseycarr@strezzo.com","city":"Grapeview","state":"NM"}
{"index":{"_id":"197"}}
{"account_number":197,"balance":17246,"firstname":"Sweet","lastname":"Sanders","age":33,"gender":"F","address":"712 Homecrest Court","employer":"Isosure","email":"sweetsanders@isosure.com","city":"Sheatown","state":"VT"}
{"index":{"_id":"200"}}
{"account_number":200,"balance":26210,"firstname":"Teri","lastname":"Hester","age":39,"gender":"M","address":"653 Abbey Court","employer":"Electonic","email":"terihester@electonic.com","city":"Martell","state":"MD"}
{"index":{"_id":"205"}}
{"account_number":205,"balance":45493,"firstname":"Johnson","lastname":"Chang","age":28,"gender":"F","address":"331 John Street","employer":"Gleamink","email":"johnsonchang@gleamink.com","city":"Sultana","state":"KS"}
{"index":{"_id":"212"}}
{"account_number":212,"balance":10299,"firstname":"Marisol","lastname":"Fischer","age":39,"gender":"M","address":"362 Prince Street","employer":"Autograte","email":"marisolfischer@autograte.com","city":"Oley","state":"SC"}
{"index":{"_id":"217"}}
{"account_number":217,"balance":33730,"firstname":"Sally","lastname":"Mccoy","age":38,"gender":"F","address":"854 Corbin Place","employer":"Omnigog","email":"sallymccoy@omnigog.com","city":"Escondida","state":"FL"}
{"index":{"_id":"224"}}
{"account_number":224,"balance":42708,"firstname":"Billie","lastname":"Nixon","age":28,"gender":"F","address":"241 Kaufman Place","employer":"Xanide","email":"billienixon@xanide.com","city":"Chapin","state":"NY"}
{"index":{"_id":"229"}}
{"account_number":229,"balance":2740,"firstname":"Jana","lastname":"Hensley","age":30,"gender":"M","address":"176 Erasmus Street","employer":"Isotrack","email":"janahensley@isotrack.com","city":"Caledonia","state":"ME"}
{"index":{"_id":"231"}}
{"account_number":231,"balance":46180,"firstname":"Essie","lastname":"Clarke","age":34,"gender":"F","address":"308 Harbor Lane","employer":"Pharmacon","email":"essieclarke@pharmacon.com","city":"Fillmore","state":"MS"}
{"index":{"_id":"236"}}
{"account_number":236,"balance":41200,"firstname":"Suzanne","lastname":"Bird","age":39,"gender":"F","address":"219 Luquer Street","employer":"Imant","email":"suzannebird@imant.com","city":"Bainbridge","state":"NY"}
{"index":{"_id":"243"}}
{"account_number":243,"balance":29902,"firstname":"Evangelina","lastname":"Perez","age":20,"gender":"M","address":"787 Joval Court","employer":"Keengen","email":"evangelinaperez@keengen.com","city":"Mulberry","state":"SD"}
{"index":{"_id":"248"}}
{"account_number":248,"balance":49989,"firstname":"West","lastname":"England","age":36,"gender":"M","address":"717 Hendrickson Place","employer":"Obliq","email":"westengland@obliq.com","city":"Maury","state":"WA"}
{"index":{"_id":"250"}}
{"account_number":250,"balance":27893,"firstname":"Earlene","lastname":"Ellis","age":39,"gender":"F","address":"512 Bay Street","employer":"Codact","email":"earleneellis@codact.com","city":"Sunwest","state":"GA"}
{"index":{"_id":"255"}}
{"account_number":255,"balance":49339,"firstname":"Iva","lastname":"Rivers","age":38,"gender":"M","address":"470 Rost Place","employer":"Mantrix","email":"ivarivers@mantrix.com","city":"Disautel","state":"MD"}
{"index":{"_id":"262"}}
{"account_number":262,"balance":30289,"firstname":"Tameka","lastname":"Levine","age":36,"gender":"F","address":"815 Atlantic Avenue","employer":"Acium","email":"tamekalevine@acium.com","city":"Winchester","state":"SD"}
{"index":{"_id":"267"}}
{"account_number":267,"balance":42753,"firstname":"Weeks","lastname":"Castillo","age":21,"gender":"F","address":"526 Holt Court","employer":"Talendula","email":"weekscastillo@talendula.com","city":"Washington","state":"NV"}
{"index":{"_id":"274"}}
{"account_number":274,"balance":12104,"firstname":"Frieda","lastname":"House","age":33,"gender":"F","address":"171 Banker Street","employer":"Quonk","email":"friedahouse@quonk.com","city":"Aberdeen","state":"NJ"}
{"index":{"_id":"279"}}
{"account_number":279,"balance":15904,"firstname":"Chapman","lastname":"Hart","age":32,"gender":"F","address":"902 Bliss Terrace","employer":"Kongene","email":"chapmanhart@kongene.com","city":"Bradenville","state":"NJ"}
{"index":{"_id":"281"}}
{"account_number":281,"balance":39830,"firstname":"Bean","lastname":"Aguirre","age":20,"gender":"F","address":"133 Pilling Street","employer":"Amril","email":"beanaguirre@amril.com","city":"Waterview","state":"TX"}
{"index":{"_id":"286"}}
{"account_number":286,"balance":39063,"firstname":"Rosetta","lastname":"Turner","age":35,"gender":"M","address":"169 Jefferson Avenue","employer":"Spacewax","email":"rosettaturner@spacewax.com","city":"Stewart","state":"MO"}
{"index":{"_id":"293"}}
{"account_number":293,"balance":29867,"firstname":"Cruz","lastname":"Carver","age":28,"gender":"F","address":"465 Boerum Place","employer":"Vitricomp","email":"cruzcarver@vitricomp.com","city":"Crayne","state":"CO"}
{"index":{"_id":"298"}}
{"account_number":298,"balance":34334,"firstname":"Bullock","lastname":"Marsh","age":20,"gender":"M","address":"589 Virginia Place","employer":"Renovize","email":"bullockmarsh@renovize.com","city":"Coinjock","state":"UT"}
{"index":{"_id":"301"}}
{"account_number":301,"balance":16782,"firstname":"Minerva","lastname":"Graham","age":35,"gender":"M","address":"532 Harrison Place","employer":"Sureplex","email":"minervagraham@sureplex.com","city":"Belleview","state":"GA"}
{"index":{"_id":"306"}}
{"account_number":306,"balance":2171,"firstname":"Hensley","lastname":"Hardin","age":40,"gender":"M","address":"196 Maujer Street","employer":"Neocent","email":"hensleyhardin@neocent.com","city":"Reinerton","state":"HI"}
{"index":{"_id":"313"}}
{"account_number":313,"balance":34108,"firstname":"Alston","lastname":"Henderson","age":36,"gender":"F","address":"132 Prescott Place","employer":"Prosure","email":"alstonhenderson@prosure.com","city":"Worton","state":"IA"}
{"index":{"_id":"318"}}
{"account_number":318,"balance":8512,"firstname":"Nichole","lastname":"Pearson","age":34,"gender":"F","address":"656 Lacon Court","employer":"Yurture","email":"nicholepearson@yurture.com","city":"Juarez","state":"MO"}
{"index":{"_id":"320"}}
{"account_number":320,"balance":34521,"firstname":"Patti","lastname":"Brennan","age":37,"gender":"F","address":"870 Degraw Street","employer":"Cognicode","email":"pattibrennan@cognicode.com","city":"Torboy","state":"FL"}
{"index":{"_id":"325"}}
{"account_number":325,"balance":1956,"firstname":"Magdalena","lastname":"Simmons","age":25,"gender":"F","address":"681 Townsend Street","employer":"Geekosis","email":"magdalenasimmons@geekosis.com","city":"Sterling","state":"CA"}
{"index":{"_id":"332"}}
{"account_number":332,"balance":37770,"firstname":"Shepherd","lastname":"Davenport","age":28,"gender":"F","address":"586 Montague Terrace","employer":"Ecraze","email":"shepherddavenport@ecraze.com","city":"Accoville","state":"NM"}
{"index":{"_id":"337"}}
{"account_number":337,"balance":43432,"firstname":"Monroe","lastname":"Stafford","age":37,"gender":"F","address":"183 Seigel Street","employer":"Centuria","email":"monroestafford@centuria.com","city":"Camino","state":"DE"}
{"index":{"_id":"344"}}
{"account_number":344,"balance":42654,"firstname":"Sasha","lastname":"Baxter","age":35,"gender":"F","address":"700 Bedford Place","employer":"Callflex","email":"sashabaxter@callflex.com","city":"Campo","state":"MI"}
{"index":{"_id":"349"}}
{"account_number":349,"balance":24180,"firstname":"Allison","lastname":"Fitzpatrick","age":22,"gender":"F","address":"913 Arlington Avenue","employer":"Veraq","email":"allisonfitzpatrick@veraq.com","city":"Marbury","state":"TX"}
{"index":{"_id":"351"}}
{"account_number":351,"balance":47089,"firstname":"Hendrix","lastname":"Stephens","age":29,"gender":"M","address":"181 Beaver Street","employer":"Recrisys","email":"hendrixstephens@recrisys.com","city":"Denio","state":"OR"}
{"index":{"_id":"356"}}
{"account_number":356,"balance":34540,"firstname":"Lourdes","lastname":"Valdez","age":20,"gender":"F","address":"700 Anchorage Place","employer":"Interloo","email":"lourdesvaldez@interloo.com","city":"Goldfield","state":"OK"}
{"index":{"_id":"363"}}
{"account_number":363,"balance":34007,"firstname":"Peggy","lastname":"Bright","age":21,"gender":"M","address":"613 Engert Avenue","employer":"Inventure","email":"peggybright@inventure.com","city":"Chautauqua","state":"ME"}
{"index":{"_id":"368"}}
{"account_number":368,"balance":23535,"firstname":"Hooper","lastname":"Tyson","age":39,"gender":"M","address":"892 Taaffe Place","employer":"Zaggle","email":"hoopertyson@zaggle.com","city":"Nutrioso","state":"ME"}
{"index":{"_id":"370"}}
{"account_number":370,"balance":28499,"firstname":"Oneill","lastname":"Carney","age":25,"gender":"F","address":"773 Adelphi Street","employer":"Bedder","email":"oneillcarney@bedder.com","city":"Yorklyn","state":"FL"}
{"index":{"_id":"375"}}
{"account_number":375,"balance":23860,"firstname":"Phoebe","lastname":"Patton","age":25,"gender":"M","address":"564 Hale Avenue","employer":"Xoggle","email":"phoebepatton@xoggle.com","city":"Brule","state":"NM"}
{"index":{"_id":"382"}}
{"account_number":382,"balance":42061,"firstname":"Finley","lastname":"Singleton","age":37,"gender":"F","address":"407 Clay Street","employer":"Quarex","email":"finleysingleton@quarex.com","city":"Bedias","state":"LA"}
{"index":{"_id":"387"}}
{"account_number":387,"balance":35916,"firstname":"April","lastname":"Hill","age":29,"gender":"M","address":"818 Bayard Street","employer":"Kengen","email":"aprilhill@kengen.com","city":"Chloride","state":"NC"}
{"index":{"_id":"394"}}
{"account_number":394,"balance":6121,"firstname":"Lorrie","lastname":"Nunez","age":38,"gender":"M","address":"221 Ralph Avenue","employer":"Bullzone","email":"lorrienunez@bullzone.com","city":"Longoria","state":"ID"}
{"index":{"_id":"399"}}
{"account_number":399,"balance":32587,"firstname":"Carmela","lastname":"Franks","age":23,"gender":"M","address":"617 Dewey Place","employer":"Zensure","email":"carmelafranks@zensure.com","city":"Sanders","state":"DC"}
{"index":{"_id":"402"}}
{"account_number":402,"balance":1282,"firstname":"Pacheco","lastname":"Rosales","age":32,"gender":"M","address":"538 Pershing Loop","employer":"Circum","email":"pachecorosales@circum.com","city":"Elbert","state":"ID"}
{"index":{"_id":"407"}}
{"account_number":407,"balance":36417,"firstname":"Gilda","lastname":"Jacobson","age":29,"gender":"F","address":"883 Loring Avenue","employer":"Comveyor","email":"gildajacobson@comveyor.com","city":"Topaz","state":"NH"}
{"index":{"_id":"414"}}
{"account_number":414,"balance":17506,"firstname":"Conway","lastname":"Daugherty","age":37,"gender":"F","address":"643 Kermit Place","employer":"Lyria","email":"conwaydaugherty@lyria.com","city":"Vaughn","state":"NV"}
{"index":{"_id":"419"}}
{"account_number":419,"balance":34847,"firstname":"Helen","lastname":"Montoya","age":29,"gender":"F","address":"736 Kingsland Avenue","employer":"Hairport","email":"helenmontoya@hairport.com","city":"Edinburg","state":"NE"}
{"index":{"_id":"421"}}
{"account_number":421,"balance":46868,"firstname":"Tamika","lastname":"Mccall","age":27,"gender":"F","address":"764 Bragg Court","employer":"Eventix","email":"tamikamccall@eventix.com","city":"Tivoli","state":"RI"}
{"index":{"_id":"426"}}
{"account_number":426,"balance":4499,"firstname":"Julie","lastname":"Parsons","age":31,"gender":"M","address":"768 Keap Street","employer":"Goko","email":"julieparsons@goko.com","city":"Coldiron","state":"VA"}
{"index":{"_id":"433"}}
{"account_number":433,"balance":19266,"firstname":"Wilkinson","lastname":"Flowers","age":39,"gender":"M","address":"154 Douglass Street","employer":"Xsports","email":"wilkinsonflowers@xsports.com","city":"Coultervillle","state":"MN"}
{"index":{"_id":"438"}}
{"account_number":438,"balance":16367,"firstname":"Walter","lastname":"Velez","age":27,"gender":"F","address":"931 Farragut Road","employer":"Virva","email":"waltervelez@virva.com","city":"Tyro","state":"WV"}
{"index":{"_id":"440"}}
{"account_number":440,"balance":41590,"firstname":"Ray","lastname":"Wiley","age":31,"gender":"F","address":"102 Barwell Terrace","employer":"Polaria","email":"raywiley@polaria.com","city":"Hardyville","state":"IA"}
{"index":{"_id":"445"}}
{"account_number":445,"balance":41178,"firstname":"Rodriguez","lastname":"Macias","age":34,"gender":"M","address":"164 Boerum Street","employer":"Xylar","email":"rodriguezmacias@xylar.com","city":"Riner","state":"AL"}
{"index":{"_id":"452"}}
{"account_number":452,"balance":3589,"firstname":"Blackwell","lastname":"Delaney","age":39,"gender":"F","address":"443 Sackett Street","employer":"Imkan","email":"blackwelldelaney@imkan.com","city":"Gasquet","state":"DC"}
{"index":{"_id":"457"}}
{"account_number":457,"balance":14057,"firstname":"Bush","lastname":"Gordon","age":34,"gender":"M","address":"975 Dakota Place","employer":"Softmicro","email":"bushgordon@softmicro.com","city":"Chemung","state":"PA"}
{"index":{"_id":"464"}}
{"account_number":464,"balance":20504,"firstname":"Cobb","lastname":"Humphrey","age":21,"gender":"M","address":"823 Sunnyside Avenue","employer":"Apexia","email":"cobbhumphrey@apexia.com","city":"Wintersburg","state":"NY"}
{"index":{"_id":"469"}}
{"account_number":469,"balance":26509,"firstname":"Marci","lastname":"Shepherd","age":26,"gender":"M","address":"565 Hall Street","employer":"Shadease","email":"marcishepherd@shadease.com","city":"Springhill","state":"IL"}
{"index":{"_id":"471"}}
{"account_number":471,"balance":7629,"firstname":"Juana","lastname":"Silva","age":36,"gender":"M","address":"249 Amity Street","employer":"Artworlds","email":"juanasilva@artworlds.com","city":"Norfolk","state":"TX"}
{"index":{"_id":"476"}}
{"account_number":476,"balance":33386,"firstname":"Silva","lastname":"Marks","age":31,"gender":"F","address":"183 Eldert Street","employer":"Medifax","email":"silvamarks@medifax.com","city":"Hachita","state":"RI"}
{"index":{"_id":"483"}}
{"account_number":483,"balance":6344,"firstname":"Kelley","lastname":"Harper","age":29,"gender":"M","address":"758 Preston Court","employer":"Xyqag","email":"kelleyharper@xyqag.com","city":"Healy","state":"IA"}
{"index":{"_id":"488"}}
{"account_number":488,"balance":6289,"firstname":"Wilma","lastname":"Hopkins","age":38,"gender":"M","address":"428 Lee Avenue","employer":"Entality","email":"wilmahopkins@entality.com","city":"Englevale","state":"WI"}
{"index":{"_id":"490"}}
{"account_number":490,"balance":1447,"firstname":"Strong","lastname":"Hendrix","age":26,"gender":"F","address":"134 Beach Place","employer":"Duoflex","email":"stronghendrix@duoflex.com","city":"Allentown","state":"ND"}
{"index":{"_id":"495"}}
{"account_number":495,"balance":13478,"firstname":"Abigail","lastname":"Nichols","age":40,"gender":"F","address":"887 President Street","employer":"Enquility","email":"abigailnichols@enquility.com","city":"Bagtown","state":"NM"}
{"index":{"_id":"503"}}
{"account_number":503,"balance":42649,"firstname":"Leta","lastname":"Stout","age":39,"gender":"F","address":"518 Bowery Street","employer":"Pivitol","email":"letastout@pivitol.com","city":"Boonville","state":"ND"}
{"index":{"_id":"508"}}
{"account_number":508,"balance":41300,"firstname":"Lawrence","lastname":"Mathews","age":27,"gender":"F","address":"987 Rose Street","employer":"Deviltoe","email":"lawrencemathews@deviltoe.com","city":"Woodburn","state":"FL"}
{"index":{"_id":"510"}}
{"account_number":510,"balance":48504,"firstname":"Petty","lastname":"Sykes","age":28,"gender":"M","address":"566 Village Road","employer":"Nebulean","email":"pettysykes@nebulean.com","city":"Wedgewood","state":"MO"}
{"index":{"_id":"515"}}
{"account_number":515,"balance":18531,"firstname":"Lott","lastname":"Keller","age":27,"gender":"M","address":"827 Miami Court","employer":"Translink","email":"lottkeller@translink.com","city":"Gila","state":"TX"}
{"index":{"_id":"522"}}
{"account_number":522,"balance":19879,"firstname":"Faulkner","lastname":"Garrett","age":29,"gender":"F","address":"396 Grove Place","employer":"Pigzart","email":"faulknergarrett@pigzart.com","city":"Felt","state":"AR"}
{"index":{"_id":"527"}}
{"account_number":527,"balance":2028,"firstname":"Carver","lastname":"Peters","age":35,"gender":"M","address":"816 Victor Road","employer":"Housedown","email":"carverpeters@housedown.com","city":"Nadine","state":"MD"}
{"index":{"_id":"534"}}
{"account_number":534,"balance":20470,"firstname":"Cristina","lastname":"Russo","age":25,"gender":"F","address":"500 Highlawn Avenue","employer":"Cyclonica","email":"cristinarusso@cyclonica.com","city":"Gorst","state":"KS"}
{"index":{"_id":"539"}}
{"account_number":539,"balance":24560,"firstname":"Tami","lastname":"Maddox","age":23,"gender":"F","address":"741 Pineapple Street","employer":"Accidency","email":"tamimaddox@accidency.com","city":"Kennedyville","state":"OH"}
{"index":{"_id":"541"}}
{"account_number":541,"balance":42915,"firstname":"Logan","lastname":"Burke","age":32,"gender":"M","address":"904 Clarendon Road","employer":"Overplex","email":"loganburke@overplex.com","city":"Johnsonburg","state":"OH"}
{"index":{"_id":"546"}}
{"account_number":546,"balance":43242,"firstname":"Bernice","lastname":"Sims","age":33,"gender":"M","address":"382 Columbia Street","employer":"Verbus","email":"bernicesims@verbus.com","city":"Sena","state":"KY"}
{"index":{"_id":"553"}}
{"account_number":553,"balance":28390,"firstname":"Aimee","lastname":"Cohen","age":28,"gender":"M","address":"396 Lafayette Avenue","employer":"Eplode","email":"aimeecohen@eplode.com","city":"Thatcher","state":"NJ"}
{"index":{"_id":"558"}}
{"account_number":558,"balance":8922,"firstname":"Horne","lastname":"Valenzuela","age":20,"gender":"F","address":"979 Kensington Street","employer":"Isoternia","email":"hornevalenzuela@isoternia.com","city":"Greenbush","state":"NC"}
{"index":{"_id":"560"}}
{"account_number":560,"balance":24514,"firstname":"Felecia","lastname":"Oneill","age":26,"gender":"M","address":"995 Autumn Avenue","employer":"Mediot","email":"feleciaoneill@mediot.com","city":"Joppa","state":"IN"}
{"index":{"_id":"565"}}
{"account_number":565,"balance":15197,"firstname":"Taylor","lastname":"Ingram","age":37,"gender":"F","address":"113 Will Place","employer":"Lyrichord","email":"tayloringram@lyrichord.com","city":"Collins","state":"ME"}
{"index":{"_id":"572"}}
{"account_number":572,"balance":49355,"firstname":"Therese","lastname":"Espinoza","age":20,"gender":"M","address":"994 Chester Court","employer":"Gonkle","email":"thereseespinoza@gonkle.com","city":"Hayes","state":"UT"}
{"index":{"_id":"577"}}
{"account_number":577,"balance":21398,"firstname":"Gilbert","lastname":"Serrano","age":38,"gender":"F","address":"294 Troutman Street","employer":"Senmao","email":"gilbertserrano@senmao.com","city":"Greer","state":"MT"}
{"index":{"_id":"584"}}
{"account_number":584,"balance":5346,"firstname":"Pearson","lastname":"Bryant","age":40,"gender":"F","address":"971 Heyward Street","employer":"Anacho","email":"pearsonbryant@anacho.com","city":"Bluffview","state":"MN"}
{"index":{"_id":"589"}}
{"account_number":589,"balance":33260,"firstname":"Ericka","lastname":"Cote","age":39,"gender":"F","address":"425 Bath Avenue","employer":"Venoflex","email":"erickacote@venoflex.com","city":"Blue","state":"CT"}
{"index":{"_id":"591"}}
{"account_number":591,"balance":48997,"firstname":"Rivers","lastname":"Macdonald","age":34,"gender":"F","address":"919 Johnson Street","employer":"Ziore","email":"riversmacdonald@ziore.com","city":"Townsend","state":"IL"}
{"index":{"_id":"596"}}
{"account_number":596,"balance":4063,"firstname":"Letitia","lastname":"Walker","age":26,"gender":"F","address":"963 Vanderveer Place","employer":"Zizzle","email":"letitiawalker@zizzle.com","city":"Rossmore","state":"ID"}
{"index":{"_id":"604"}}
{"account_number":604,"balance":10675,"firstname":"Isabel","lastname":"Gilliam","age":23,"gender":"M","address":"854 Broadway ","employer":"Zenthall","email":"isabelgilliam@zenthall.com","city":"Ventress","state":"WI"}
{"index":{"_id":"609"}}
{"account_number":609,"balance":28586,"firstname":"Montgomery","lastname":"Washington","age":30,"gender":"M","address":"169 Schroeders Avenue","employer":"Kongle","email":"montgomerywashington@kongle.com","city":"Croom","state":"AZ"}
{"index":{"_id":"611"}}
{"account_number":611,"balance":17528,"firstname":"Katherine","lastname":"Prince","age":33,"gender":"F","address":"705 Elm Avenue","employer":"Zillacon","email":"katherineprince@zillacon.com","city":"Rew","state":"MI"}
{"index":{"_id":"616"}}
{"account_number":616,"balance":25276,"firstname":"Jessie","lastname":"Mayer","age":35,"gender":"F","address":"683 Chester Avenue","employer":"Emtrak","email":"jessiemayer@emtrak.com","city":"Marysville","state":"HI"}
{"index":{"_id":"623"}}
{"account_number":623,"balance":20514,"firstname":"Rose","lastname":"Combs","age":32,"gender":"F","address":"312 Grimes Road","employer":"Aquamate","email":"rosecombs@aquamate.com","city":"Fostoria","state":"OH"}
{"index":{"_id":"628"}}
{"account_number":628,"balance":42736,"firstname":"Buckner","lastname":"Chen","age":37,"gender":"M","address":"863 Rugby Road","employer":"Jamnation","email":"bucknerchen@jamnation.com","city":"Camas","state":"TX"}
{"index":{"_id":"630"}}
{"account_number":630,"balance":46060,"firstname":"Leanne","lastname":"Jones","age":31,"gender":"M","address":"451 Bayview Avenue","employer":"Wazzu","email":"leannejones@wazzu.com","city":"Kylertown","state":"OK"}
{"index":{"_id":"635"}}
{"account_number":635,"balance":44705,"firstname":"Norman","lastname":"Gilmore","age":33,"gender":"M","address":"330 Gates Avenue","employer":"Comfirm","email":"normangilmore@comfirm.com","city":"Riceville","state":"TN"}
{"index":{"_id":"642"}}
{"account_number":642,"balance":32852,"firstname":"Reyna","lastname":"Harris","age":35,"gender":"M","address":"305 Powell Street","employer":"Bedlam","email":"reynaharris@bedlam.com","city":"Florence","state":"KS"}
{"index":{"_id":"647"}}
{"account_number":647,"balance":10147,"firstname":"Annabelle","lastname":"Velazquez","age":30,"gender":"M","address":"299 Kensington Walk","employer":"Sealoud","email":"annabellevelazquez@sealoud.com","city":"Soudan","state":"ME"}
{"index":{"_id":"654"}}
{"account_number":654,"balance":38695,"firstname":"Armstrong","lastname":"Frazier","age":25,"gender":"M","address":"899 Seeley Street","employer":"Zensor","email":"armstrongfrazier@zensor.com","city":"Cherokee","state":"UT"}
{"index":{"_id":"659"}}
{"account_number":659,"balance":29648,"firstname":"Dorsey","lastname":"Sosa","age":40,"gender":"M","address":"270 Aberdeen Street","employer":"Daycore","email":"dorseysosa@daycore.com","city":"Chamberino","state":"SC"}
{"index":{"_id":"661"}}
{"account_number":661,"balance":3679,"firstname":"Joanne","lastname":"Spencer","age":39,"gender":"F","address":"910 Montauk Avenue","employer":"Visalia","email":"joannespencer@visalia.com","city":"Valmy","state":"NH"}
{"index":{"_id":"666"}}
{"account_number":666,"balance":13880,"firstname":"Mcguire","lastname":"Lloyd","age":40,"gender":"F","address":"658 Just Court","employer":"Centrexin","email":"mcguirelloyd@centrexin.com","city":"Warren","state":"MT"}
{"index":{"_id":"673"}}
{"account_number":673,"balance":11303,"firstname":"Mcdaniel","lastname":"Harrell","age":33,"gender":"M","address":"565 Montgomery Place","employer":"Eyeris","email":"mcdanielharrell@eyeris.com","city":"Garnet","state":"NV"}
{"index":{"_id":"678"}}
{"account_number":678,"balance":43663,"firstname":"Ruby","lastname":"Shaffer","age":28,"gender":"M","address":"350 Clark Street","employer":"Comtrail","email":"rubyshaffer@comtrail.com","city":"Aurora","state":"MA"}
{"index":{"_id":"680"}}
{"account_number":680,"balance":31561,"firstname":"Melton","lastname":"Camacho","age":32,"gender":"F","address":"771 Montana Place","employer":"Insuresys","email":"meltoncamacho@insuresys.com","city":"Sparkill","state":"IN"}
{"index":{"_id":"685"}}
{"account_number":685,"balance":22249,"firstname":"Yesenia","lastname":"Rowland","age":24,"gender":"F","address":"193 Dekalb Avenue","employer":"Coriander","email":"yeseniarowland@coriander.com","city":"Lupton","state":"NC"}
{"index":{"_id":"692"}}
{"account_number":692,"balance":10435,"firstname":"Haney","lastname":"Barlow","age":21,"gender":"F","address":"267 Lenox Road","employer":"Egypto","email":"haneybarlow@egypto.com","city":"Detroit","state":"IN"}
{"index":{"_id":"697"}}
{"account_number":697,"balance":48745,"firstname":"Mallory","lastname":"Emerson","age":24,"gender":"F","address":"318 Dunne Court","employer":"Exoplode","email":"malloryemerson@exoplode.com","city":"Montura","state":"LA"}
{"index":{"_id":"700"}}
{"account_number":700,"balance":19164,"firstname":"Patel","lastname":"Durham","age":21,"gender":"F","address":"440 King Street","employer":"Icology","email":"pateldurham@icology.com","city":"Mammoth","state":"IL"}
{"index":{"_id":"705"}}
{"account_number":705,"balance":28415,"firstname":"Krystal","lastname":"Cross","age":22,"gender":"M","address":"604 Drew Street","employer":"Tubesys","email":"krystalcross@tubesys.com","city":"Dalton","state":"MO"}
{"index":{"_id":"712"}}
{"account_number":712,"balance":12459,"firstname":"Butler","lastname":"Alston","age":37,"gender":"M","address":"486 Hemlock Street","employer":"Quordate","email":"butleralston@quordate.com","city":"Verdi","state":"MS"}
{"index":{"_id":"717"}}
{"account_number":717,"balance":29270,"firstname":"Erickson","lastname":"Mcdonald","age":31,"gender":"M","address":"873 Franklin Street","employer":"Exotechno","email":"ericksonmcdonald@exotechno.com","city":"Jessie","state":"MS"}
{"index":{"_id":"724"}}
{"account_number":724,"balance":12548,"firstname":"Hopper","lastname":"Peck","age":31,"gender":"M","address":"849 Hendrickson Street","employer":"Uxmox","email":"hopperpeck@uxmox.com","city":"Faxon","state":"UT"}
{"index":{"_id":"729"}}
{"account_number":729,"balance":41812,"firstname":"Katy","lastname":"Rivera","age":36,"gender":"F","address":"791 Olive Street","employer":"Blurrybus","email":"katyrivera@blurrybus.com","city":"Innsbrook","state":"MI"}
{"index":{"_id":"731"}}
{"account_number":731,"balance":4994,"firstname":"Lorene","lastname":"Weiss","age":35,"gender":"M","address":"990 Ocean Court","employer":"Comvoy","email":"loreneweiss@comvoy.com","city":"Lavalette","state":"WI"}
{"index":{"_id":"736"}}
{"account_number":736,"balance":28677,"firstname":"Rogers","lastname":"Mcmahon","age":21,"gender":"F","address":"423 Cameron Court","employer":"Brainclip","email":"rogersmcmahon@brainclip.com","city":"Saddlebrooke","state":"FL"}
{"index":{"_id":"743"}}
{"account_number":743,"balance":14077,"firstname":"Susana","lastname":"Moody","age":23,"gender":"M","address":"842 Fountain Avenue","employer":"Bitrex","email":"susanamoody@bitrex.com","city":"Temperanceville","state":"TN"}
{"index":{"_id":"748"}}
{"account_number":748,"balance":38060,"firstname":"Ford","lastname":"Branch","age":25,"gender":"M","address":"926 Cypress Avenue","employer":"Buzzness","email":"fordbranch@buzzness.com","city":"Beason","state":"DC"}
{"index":{"_id":"750"}}
{"account_number":750,"balance":40481,"firstname":"Cherie","lastname":"Brooks","age":20,"gender":"F","address":"601 Woodhull Street","employer":"Kaggle","email":"cheriebrooks@kaggle.com","city":"Groton","state":"MA"}
{"index":{"_id":"755"}}
{"account_number":755,"balance":43878,"firstname":"Bartlett","lastname":"Conway","age":22,"gender":"M","address":"453 Times Placez","employer":"Konnect","email":"bartlettconway@konnect.com","city":"Belva","state":"VT"}
{"index":{"_id":"762"}}
{"account_number":762,"balance":10291,"firstname":"Amanda","lastname":"Head","age":20,"gender":"F","address":"990 Ocean Parkway","employer":"Zentury","email":"amandahead@zentury.com","city":"Hegins","state":"AR"}
{"index":{"_id":"767"}}
{"account_number":767,"balance":26220,"firstname":"Anthony","lastname":"Sutton","age":27,"gender":"F","address":"179 Fayette Street","employer":"Xiix","email":"anthonysutton@xiix.com","city":"Iberia","state":"TN"}
{"index":{"_id":"774"}}
{"account_number":774,"balance":35287,"firstname":"Lynnette","lastname":"Alvarez","age":38,"gender":"F","address":"991 Brightwater Avenue","employer":"Gink","email":"lynnettealvarez@gink.com","city":"Leola","state":"NC"}
{"index":{"_id":"779"}}
{"account_number":779,"balance":40983,"firstname":"Maggie","lastname":"Pace","age":32,"gender":"F","address":"104 Harbor Court","employer":"Bulljuice","email":"maggiepace@bulljuice.com","city":"Floris","state":"MA"}
{"index":{"_id":"781"}}
{"account_number":781,"balance":29961,"firstname":"Sanford","lastname":"Mullen","age":26,"gender":"F","address":"879 Dover Street","employer":"Zanity","email":"sanfordmullen@zanity.com","city":"Martinez","state":"TX"}
{"index":{"_id":"786"}}
{"account_number":786,"balance":3024,"firstname":"Rene","lastname":"Vang","age":33,"gender":"M","address":"506 Randolph Street","employer":"Isopop","email":"renevang@isopop.com","city":"Vienna","state":"NJ"}
{"index":{"_id":"793"}}
{"account_number":793,"balance":16911,"firstname":"Alford","lastname":"Compton","age":36,"gender":"M","address":"186 Veronica Place","employer":"Zyple","email":"alfordcompton@zyple.com","city":"Sugartown","state":"AK"}
{"index":{"_id":"798"}}
{"account_number":798,"balance":3165,"firstname":"Catherine","lastname":"Ward","age":30,"gender":"F","address":"325 Burnett Street","employer":"Dreamia","email":"catherineward@dreamia.com","city":"Glenbrook","state":"SD"}
{"index":{"_id":"801"}}
{"account_number":801,"balance":14954,"firstname":"Molly","lastname":"Maldonado","age":37,"gender":"M","address":"518 Maple Avenue","employer":"Straloy","email":"mollymaldonado@straloy.com","city":"Hebron","state":"WI"}
{"index":{"_id":"806"}}
{"account_number":806,"balance":36492,"firstname":"Carson","lastname":"Riddle","age":31,"gender":"M","address":"984 Lois Avenue","employer":"Terrago","email":"carsonriddle@terrago.com","city":"Leland","state":"MN"}
{"index":{"_id":"813"}}
{"account_number":813,"balance":30833,"firstname":"Ebony","lastname":"Bishop","age":20,"gender":"M","address":"487 Ridge Court","employer":"Optique","email":"ebonybishop@optique.com","city":"Fairmount","state":"WA"}
{"index":{"_id":"818"}}
{"account_number":818,"balance":24433,"firstname":"Espinoza","lastname":"Petersen","age":26,"gender":"M","address":"641 Glenwood Road","employer":"Futurity","email":"espinozapetersen@futurity.com","city":"Floriston","state":"MD"}
{"index":{"_id":"820"}}
{"account_number":820,"balance":1011,"firstname":"Shepard","lastname":"Ramsey","age":24,"gender":"F","address":"806 Village Court","employer":"Mantro","email":"shepardramsey@mantro.com","city":"Tibbie","state":"NV"}
{"index":{"_id":"825"}}
{"account_number":825,"balance":49000,"firstname":"Terra","lastname":"Witt","age":21,"gender":"F","address":"590 Conway Street","employer":"Insectus","email":"terrawitt@insectus.com","city":"Forbestown","state":"AR"}
{"index":{"_id":"832"}}
{"account_number":832,"balance":8582,"firstname":"Laura","lastname":"Gibbs","age":39,"gender":"F","address":"511 Osborn Street","employer":"Corepan","email":"lauragibbs@corepan.com","city":"Worcester","state":"KS"}
{"index":{"_id":"837"}}
{"account_number":837,"balance":14485,"firstname":"Amy","lastname":"Villarreal","age":35,"gender":"M","address":"381 Stillwell Place","employer":"Fleetmix","email":"amyvillarreal@fleetmix.com","city":"Sanford","state":"IA"}
{"index":{"_id":"844"}}
{"account_number":844,"balance":26840,"firstname":"Jill","lastname":"David","age":31,"gender":"M","address":"346 Legion Street","employer":"Zytrax","email":"jilldavid@zytrax.com","city":"Saticoy","state":"SC"}
{"index":{"_id":"849"}}
{"account_number":849,"balance":16200,"firstname":"Barry","lastname":"Chapman","age":26,"gender":"M","address":"931 Dekoven Court","employer":"Darwinium","email":"barrychapman@darwinium.com","city":"Whitestone","state":"WY"}
{"index":{"_id":"851"}}
{"account_number":851,"balance":22026,"firstname":"Henderson","lastname":"Price","age":33,"gender":"F","address":"530 Hausman Street","employer":"Plutorque","email":"hendersonprice@plutorque.com","city":"Brutus","state":"RI"}
{"index":{"_id":"856"}}
{"account_number":856,"balance":27583,"firstname":"Alissa","lastname":"Knox","age":25,"gender":"M","address":"258 Empire Boulevard","employer":"Geologix","email":"alissaknox@geologix.com","city":"Hartsville/Hartley","state":"MN"}
{"index":{"_id":"863"}}
{"account_number":863,"balance":23165,"firstname":"Melendez","lastname":"Fernandez","age":40,"gender":"M","address":"661 Johnson Avenue","employer":"Vixo","email":"melendezfernandez@vixo.com","city":"Farmers","state":"IL"}
{"index":{"_id":"868"}}
{"account_number":868,"balance":27624,"firstname":"Polly","lastname":"Barron","age":22,"gender":"M","address":"129 Frank Court","employer":"Geofarm","email":"pollybarron@geofarm.com","city":"Loyalhanna","state":"ND"}
{"index":{"_id":"870"}}
{"account_number":870,"balance":43882,"firstname":"Goff","lastname":"Phelps","age":21,"gender":"M","address":"164 Montague Street","employer":"Digigen","email":"goffphelps@digigen.com","city":"Weedville","state":"IL"}
{"index":{"_id":"875"}}
{"account_number":875,"balance":19655,"firstname":"Mercer","lastname":"Pratt","age":24,"gender":"M","address":"608 Perry Place","employer":"Twiggery","email":"mercerpratt@twiggery.com","city":"Eggertsville","state":"MO"}
{"index":{"_id":"882"}}
{"account_number":882,"balance":10895,"firstname":"Mari","lastname":"Landry","age":39,"gender":"M","address":"963 Gerald Court","employer":"Kenegy","email":"marilandry@kenegy.com","city":"Lithium","state":"NC"}
{"index":{"_id":"887"}}
{"account_number":887,"balance":31772,"firstname":"Eunice","lastname":"Watts","age":36,"gender":"F","address":"707 Stuyvesant Avenue","employer":"Memora","email":"eunicewatts@memora.com","city":"Westwood","state":"TN"}
{"index":{"_id":"894"}}
{"account_number":894,"balance":1031,"firstname":"Tyler","lastname":"Fitzgerald","age":32,"gender":"M","address":"787 Meserole Street","employer":"Jetsilk","email":"tylerfitzgerald@jetsilk.com","city":"Woodlands","state":"WV"}
{"index":{"_id":"899"}}
{"account_number":899,"balance":32953,"firstname":"Carney","lastname":"Callahan","age":23,"gender":"M","address":"724 Kimball Street","employer":"Mangelica","email":"carneycallahan@mangelica.com","city":"Tecolotito","state":"MT"}
{"index":{"_id":"902"}}
{"account_number":902,"balance":13345,"firstname":"Hallie","lastname":"Jarvis","age":23,"gender":"F","address":"237 Duryea Court","employer":"Anixang","email":"halliejarvis@anixang.com","city":"Boykin","state":"IN"}
{"index":{"_id":"907"}}
{"account_number":907,"balance":12961,"firstname":"Ingram","lastname":"William","age":36,"gender":"M","address":"826 Overbaugh Place","employer":"Genmex","email":"ingramwilliam@genmex.com","city":"Kimmell","state":"AK"}
{"index":{"_id":"914"}}
{"account_number":914,"balance":7120,"firstname":"Esther","lastname":"Bean","age":32,"gender":"F","address":"583 Macon Street","employer":"Applica","email":"estherbean@applica.com","city":"Homeworth","state":"MN"}
{"index":{"_id":"919"}}
{"account_number":919,"balance":39655,"firstname":"Shauna","lastname":"Hanson","age":27,"gender":"M","address":"557 Hart Place","employer":"Exospace","email":"shaunahanson@exospace.com","city":"Outlook","state":"LA"}
{"index":{"_id":"921"}}
{"account_number":921,"balance":49119,"firstname":"Barbara","lastname":"Wade","age":29,"gender":"M","address":"687 Hoyts Lane","employer":"Roughies","email":"barbarawade@roughies.com","city":"Sattley","state":"CO"}
{"index":{"_id":"926"}}
{"account_number":926,"balance":49433,"firstname":"Welch","lastname":"Mcgowan","age":21,"gender":"M","address":"833 Quincy Street","employer":"Atomica","email":"welchmcgowan@atomica.com","city":"Hampstead","state":"VT"}
{"index":{"_id":"933"}}
{"account_number":933,"balance":18071,"firstname":"Tabitha","lastname":"Cole","age":21,"gender":"F","address":"916 Rogers Avenue","employer":"Eclipto","email":"tabithacole@eclipto.com","city":"Lawrence","state":"TX"}
{"index":{"_id":"938"}}
{"account_number":938,"balance":9597,"firstname":"Sharron","lastname":"Santos","age":40,"gender":"F","address":"215 Matthews Place","employer":"Zenco","email":"sharronsantos@zenco.com","city":"Wattsville","state":"VT"}
{"index":{"_id":"940"}}
{"account_number":940,"balance":23285,"firstname":"Melinda","lastname":"Mendoza","age":38,"gender":"M","address":"806 Kossuth Place","employer":"Kneedles","email":"melindamendoza@kneedles.com","city":"Coaldale","state":"OK"}
{"index":{"_id":"945"}}
{"account_number":945,"balance":23085,"firstname":"Hansen","lastname":"Hebert","age":33,"gender":"F","address":"287 Conduit Boulevard","employer":"Capscreen","email":"hansenhebert@capscreen.com","city":"Taycheedah","state":"AK"}
{"index":{"_id":"952"}}
{"account_number":952,"balance":21430,"firstname":"Angelique","lastname":"Weeks","age":33,"gender":"M","address":"659 Reeve Place","employer":"Exodoc","email":"angeliqueweeks@exodoc.com","city":"Turpin","state":"MD"}
{"index":{"_id":"957"}}
{"account_number":957,"balance":11373,"firstname":"Michael","lastname":"Giles","age":31,"gender":"M","address":"668 Court Square","employer":"Yogasm","email":"michaelgiles@yogasm.com","city":"Rosburg","state":"WV"}
{"index":{"_id":"964"}}
{"account_number":964,"balance":26154,"firstname":"Elena","lastname":"Waller","age":34,"gender":"F","address":"618 Crystal Street","employer":"Insurety","email":"elenawaller@insurety.com","city":"Gallina","state":"NY"}
{"index":{"_id":"969"}}
{"account_number":969,"balance":22214,"firstname":"Briggs","lastname":"Lynn","age":30,"gender":"M","address":"952 Lester Court","employer":"Quinex","email":"briggslynn@quinex.com","city":"Roland","state":"ID"}
{"index":{"_id":"971"}}
{"account_number":971,"balance":22772,"firstname":"Gabrielle","lastname":"Reilly","age":32,"gender":"F","address":"964 Tudor Terrace","employer":"Blanet","email":"gabriellereilly@blanet.com","city":"Falmouth","state":"AL"}
{"index":{"_id":"976"}}
{"account_number":976,"balance":31707,"firstname":"Mullen","lastname":"Tanner","age":26,"gender":"M","address":"711 Whitney Avenue","employer":"Pulze","email":"mullentanner@pulze.com","city":"Mooresburg","state":"MA"}
{"index":{"_id":"983"}}
{"account_number":983,"balance":47205,"firstname":"Mattie","lastname":"Eaton","age":24,"gender":"F","address":"418 Allen Avenue","employer":"Trasola","email":"mattieeaton@trasola.com","city":"Dupuyer","state":"NJ"}
{"index":{"_id":"988"}}
{"account_number":988,"balance":17803,"firstname":"Lucy","lastname":"Castro","age":34,"gender":"F","address":"425 Fleet Walk","employer":"Geekfarm","email":"lucycastro@geekfarm.com","city":"Mulino","state":"VA"}
{"index":{"_id":"990"}}
{"account_number":990,"balance":44456,"firstname":"Kelly","lastname":"Steele","age":35,"gender":"M","address":"809 Hoyt Street","employer":"Eschoir","email":"kellysteele@eschoir.com","city":"Stewartville","state":"ID"}
{"index":{"_id":"995"}}
{"account_number":995,"balance":21153,"firstname":"Phelps","lastname":"Parrish","age":25,"gender":"M","address":"666 Miller Place","employer":"Pearlessa","email":"phelpsparrish@pearlessa.com","city":"Brecon","state":"ME"}
```
</details>

``` json
// 导入数据
POST bank/account/_bulk
'上面的数据'

// 查看所有索引
GET http://192.168.56.10:9200/_cat/indices
// 返回结果: 包含刚才的索引和刚导入了1000条
yellow open bank                     3XRJM9ncSYK5SFTI1tFiEA 1 1 1000 0 428.1kb 428.1kb
```

### ES-进阶
#### 两种查询方式(search API)
ES支持两种基本方式检索:
* 通过 REST request uri 发送搜索参数 （uri +检索参数）;
* 通过 REST request body 来发送它们（uri+请求体）;

信息检索
官方文档: https://www.elastic.co/guide/en/elasticsearch/reference/7.x/getting-started-search.html

``` json
// 请求参数方式检索
GET bank/_search?q=*&sort=account_number:asc  // q=* 查询所有; sort 排序条件; asc 升序;

//检索bank下所有信息，包括type和docs
GET bank/_search
{
  "query": {
    "match_all": {}
  },
  "sort": [
    {
      "account_number": "asc"
    }
  ]
} // query 查询条件; sort 排序条件
```
检索了1000条数据，但是根据相关性算法，只返回10条

| 键               | 含义                                           |
| ---------------- | ---------------------------------------------- |
| took             | 花费多少ms搜索                                 |
| timed_out        | 是否超时                                       |
| _shards          | 多少分片被搜索了，以及多少成功/失败的搜索分片  |
| max_score        | 文档相关性最高得分                             |
| hits.total.value | 多少匹配文档被找到                             |
| hits.sort        | 结果的排序key，没有的话按照score排序           |
| hits._score      | 相关得分 (not applicable when using match_all) |

``` json
//uri+请求体进行检索(多个排序规则)
GET /bank/_search
{
  "query": { "match_all": {} },
  "sort": [
    { "account_number": "asc" },
    { "balance":"desc" }
  ]
}
```

#### Query DSL
官方文档: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html
Elasticsearch提供了一个可以执行查询的Json风格的DSL(domain-specific language领域特定语言)。这个被称为Query DSL，该查询语言非常全面。

##### (1) 基本语法格式
一个查询语句的典型结构
``` js
QUERY_NAME:{
   ARGUMENT:VALUE,
   ARGUMENT:VALUE,
    ...
}
```
如果针对于某个字段，那么它的结构如下：
``` js
{
  QUERY_NAME:{
     FIELD_NAME:{
       ARGUMENT:VALUE,
       ARGUMENT:VALUE,...
      }   
   }
}
```

示例
``` json
GET bank/_search
{
  "query": {
    "match_all": {} // match_all 查询类型【代表查询所有的所有】，es中可以在query中组合非常多的查询类型完成复杂查询；
  },
  "from": 0,  // 从第几条数据开始
  "size": 5,  // 每页有多少数据
  "_source":["balance"],  // 要返回的字段
  "sort": [ // 排序，多字段排序，会在前序字段相等时后续字段内部排序，否则以前序为准；
    {
      "account_number": {
        "order": "desc"
      }
    }
  ]
}
```

##### (2) 返回部分字段
``` json
GET bank/_search
{
  "query": {
    "match_all": {}
  },
  "from": 0,
  "size": 5,
  "sort": [
    {
      "account_number": {
        "order": "desc"
      }
    }
  ],
  "_source": ["balance","firstname"]
}

// 查询结果：
{
  "took" : 18,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 1000,
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [
      {
        "_index" : "bank",
        "_type" : "account",
        "_id" : "999",
        "_score" : null,
        "_source" : {
          "firstname" : "Dorothy",
          "balance" : 6087
        },
        "sort" : [
          999
        ]
      },
      ...
  }
}
```


##### (3) match 匹配查询
``` json
// 基本类型（非字符串），精确控制
GET bank/_search
{
  "query": {
    "match": {
      "account_number": "20"
    }
  }
}

// 查询结果：match返回account_number=20的数据。
{
  "took" : 1,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 1,  // 得到一条
      "relation" : "eq"
    },
    "max_score" : 1.0,  // 最大得分
    "hits" : [
      {
        "_index" : "bank",
        "_type" : "account",
        "_id" : "20",
        "_score" : 1.0,
        "_source" : {
          "account_number" : 20,
          "balance" : 16418,
          "firstname" : "Elinor",
          "lastname" : "Ratliff",
          "age" : 36,
          "gender" : "M",
          "address" : "282 Kings Place",
          "employer" : "Scentric",
          "email" : "elinorratliff@scentric.com",
          "city" : "Ribera",
          "state" : "WA"
        }
      }
    ]
  }
}
```

``` json
// 字符串，全文检索
GET bank/_search
{
  "query": {
    "match": {
      "address": "kings"
    }
  }
}

// 查询结果：全文检索，最终会按照评分进行排序，会对检索条件进行分词匹配。
{
  "took" : 30,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 2,
      "relation" : "eq"
    },
    "max_score" : 5.990829,
    "hits" : [
      {
        "_index" : "bank",
        "_type" : "account",
        "_id" : "20",
        "_score" : 5.990829,
        "_source" : {
          "account_number" : 20,
          "balance" : 16418,
          "firstname" : "Elinor",
          "lastname" : "Ratliff",
          "age" : 36,
          "gender" : "M",
          "address" : "282 Kings Place",
          "employer" : "Scentric",
          "email" : "elinorratliff@scentric.com",
          "city" : "Ribera",
          "state" : "WA"
        }
      },
      {
        "_index" : "bank",
        "_type" : "account",
        "_id" : "722",
        "_score" : 5.990829,
        "_source" : {
          "account_number" : 722,
          "balance" : 27256,
          "firstname" : "Roberts",
          "lastname" : "Beasley",
          "age" : 34,
          "gender" : "F",
          "address" : "305 Kings Hwy",
          "employer" : "Quintity",
          "email" : "robertsbeasley@quintity.com",
          "city" : "Hayden",
          "state" : "PA"
        }
      }
    ]
  }
}
```
全文检索按照评分进行排序, 会对检索条件进行分词匹配;

##### (4) match_phrase【短句匹配】
将需要匹配的值当成一整个单词（不分词）进行检索

``` json
// 前面的是包含mill或road就查出来，我们现在要都包含才查出
GET bank/_search
{
  "query": {
    "match_phrase": {
      "address": "mill road"
    }
  }
}

// 查看结果：查处address中包含mill road的所有记录，并给出相关性得分
{
  "took" : 32,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 1,
      "relation" : "eq"
    },
    "max_score" : 8.926605,
    "hits" : [
      {
        "_index" : "bank",
        "_type" : "account",
        "_id" : "970",
        "_score" : 8.926605,
        "_source" : {
          "account_number" : 970,
          "balance" : 19648,
          "firstname" : "Forbes",
          "lastname" : "Wallace",
          "age" : 28,
          "gender" : "M",
          "address" : "990 Mill Road",
          "employer" : "Pheast",
          "email" : "forbeswallace@pheast.com",
          "city" : "Lopezo",
          "state" : "AK"
        }
      }
    ]
  }
}
```
match_phrase和match的区别，观察如下实例：
``` json
// 使用match_phrase查询
GET /bank/_search
{
  "query": {
    "match_phrase": {
      "address": "990 Mill"
    }
  }
}

// 查询结果：
{
  "took" : 0,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 1,
      "relation" : "eq"
    },
    "max_score" : 10.806405,
    "hits" : [
      {
        "_index" : "bank",
        "_type" : "account",
        "_id" : "970",
        "_score" : 10.806405,
        "_source" : {
          "account_number" : 970,
          "balance" : 19648,
          "firstname" : "Forbes",
          "lastname" : "Wallace",
          "age" : 28,
          "gender" : "M",
          "address" : "990 Mill Road",
          "employer" : "Pheast",
          "email" : "forbeswallace@pheast.com",
          "city" : "Lopezo",
          "state" : "AK"
        }
      }
    ]
  }
}
```

``` json
使用match的keyword查询
GET /bank/_search
{
  "query": {
    "match": {
      "address.keyword": "990 Mill"
    }
  }
}

//查询结果: 一条也未匹配到
{
  "took" : 0,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 0,
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [ ]
  }
}

// 修改匹配条件为“990 Mill Road”
GET /bank/_search
{
  "query": {
    "match": {
      "address.keyword": "990 Mill Road"
    }
  }
}
// 查询结果: 查询出一条数据
{
  "took" : 1,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 1,
      "relation" : "eq"
    },
    "max_score" : 6.5032897,
    "hits" : [
      {
        "_index" : "bank",
        "_type" : "account",
        "_id" : "970",
        "_score" : 6.5032897,
        "_source" : {
          "account_number" : 970,
          "balance" : 19648,
          "firstname" : "Forbes",
          "lastname" : "Wallace",
          "age" : 28,
          "gender" : "M",
          "address" : "990 Mill Road",
          "employer" : "Pheast",
          "email" : "forbeswallace@pheast.com",
          "city" : "Lopezo",
          "state" : "AK"
        }
      }
    ]
  }
}
```
不同
* 文本字段的匹配，使用keyword，匹配的条件就是要显示字段的全部值，要进行精确匹配的。
* match_phrase是做短语匹配，只要文本中包含匹配条件，就能匹配到。

#### (5) multi_math【多字段匹配】
state或者address中包含mill，并且在查询过程中，**会对于查询条件进行分词**。
``` json
GET /bank/_search
{
  "query": {
    "multi_match": {
      "query": "mill",
      "fields": [
        "state",
        "address"
      ]
    }
  }
}

// 查询结果：
{
  "took" : 28,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 4,
      "relation" : "eq"
    },
    "max_score" : 5.4032025,
    "hits" : [
      {
        "_index" : "bank",
        "_type" : "account",
        "_id" : "970",
        "_score" : 5.4032025,
        "_source" : {
          "account_number" : 970,
          "balance" : 19648,
          "firstname" : "Forbes",
          "lastname" : "Wallace",
          "age" : 28,
          "gender" : "M",
          "address" : "990 Mill Road",
          "employer" : "Pheast",
          "email" : "forbeswallace@pheast.com",
          "city" : "Lopezo",
          "state" : "AK"
        }
      },
      {
        "_index" : "bank",
        "_type" : "account",
        "_id" : "136",
        "_score" : 5.4032025,
        "_source" : {
          "account_number" : 136,
          "balance" : 45801,
          "firstname" : "Winnie",
          "lastname" : "Holland",
          "age" : 38,
          "gender" : "M",
          "address" : "198 Mill Lane",
          "employer" : "Neteria",
          "email" : "winnieholland@neteria.com",
          "city" : "Urie",
          "state" : "IL"
        }
      },
      {
        "_index" : "bank",
        "_type" : "account",
        "_id" : "345",
        "_score" : 5.4032025,
        "_source" : {
          "account_number" : 345,
          "balance" : 9812,
          "firstname" : "Parker",
          "lastname" : "Hines",
          "age" : 38,
          "gender" : "M",
          "address" : "715 Mill Avenue",
          "employer" : "Baluba",
          "email" : "parkerhines@baluba.com",
          "city" : "Blackgum",
          "state" : "KY"
        }
      },
      {
        "_index" : "bank",
        "_type" : "account",
        "_id" : "472",
        "_score" : 5.4032025,
        "_source" : {
          "account_number" : 472,
          "balance" : 25571,
          "firstname" : "Lee",
          "lastname" : "Long",
          "age" : 32,
          "gender" : "F",
          "address" : "288 Mill Street",
          "employer" : "Comverges",
          "email" : "leelong@comverges.com",
          "city" : "Movico",
          "state" : "MT"
        }
      }
    ]
  }
}
```

#### (6) bool用来做复合查询
复合语句可以合并，任何其他查询语句，包括符合语句。这也就意味着，复合语句之间可以互相嵌套，可以表达非常复杂的逻辑。

* must：必须达到must所列举的所有条件
* must_not：必须不匹配must_not所列举的所有条件。
* should：应该满足should所列举的条件。满足条件最好，不满足也可以，满足得分更高

must：必须达到must所列举的所有条件
``` json
// 实例：查询gender=m，并且address=mill的数据
GET bank/_search
{
   "query":{
        "bool":{
             "must":[
              {"match":{"address":"mill"}},
              {"match":{"gender":"M"}}
             ]
         }
    }
}
// 查询结果：
{
  "took" : 1,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 3,
      "relation" : "eq"
    },
    "max_score" : 6.0824604,
    "hits" : [
      {
        "_index" : "bank",
        "_type" : "account",
        "_id" : "970",
        "_score" : 6.0824604,
        "_source" : {
          "account_number" : 970,
          "balance" : 19648,
          "firstname" : "Forbes",
          "lastname" : "Wallace",
          "age" : 28,
          "gender" : "M",
          "address" : "990 Mill Road",
          "employer" : "Pheast",
          "email" : "forbeswallace@pheast.com",
          "city" : "Lopezo",
          "state" : "AK"
        }
      },
      {
        "_index" : "bank",
        "_type" : "account",
        "_id" : "136",
        "_score" : 6.0824604,
        "_source" : {
          "account_number" : 136,
          "balance" : 45801,
          "firstname" : "Winnie",
          "lastname" : "Holland",
          "age" : 38,
          "gender" : "M",
          "address" : "198 Mill Lane",
          "employer" : "Neteria",
          "email" : "winnieholland@neteria.com",
          "city" : "Urie",
          "state" : "IL"
        }
      },
      {
        "_index" : "bank",
        "_type" : "account",
        "_id" : "345",
        "_score" : 6.0824604,
        "_source" : {
          "account_number" : 345,
          "balance" : 9812,
          "firstname" : "Parker",
          "lastname" : "Hines",
          "age" : 38,
          "gender" : "M",
          "address" : "715 Mill Avenue",
          "employer" : "Baluba",
          "email" : "parkerhines@baluba.com",
          "city" : "Blackgum",
          "state" : "KY"
        }
      }
    ]
  }
}
```

must_not：必须不是指定的情况
``` json
// 实例：查询gender=m，并且address=mill的数据，但是age不等于38的
GET bank/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "gender": "M" }},
        { "match": {"address": "mill"}}
      ],
      "must_not": [
        { "match": { "age": "38" }}
      ]
   }
}
// 查询结果：
{
  "took" : 4,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 1,
      "relation" : "eq"
    },
    "max_score" : 6.0824604,
    "hits" : [
      {
        "_index" : "bank",
        "_type" : "account",
        "_id" : "970",
        "_score" : 6.0824604,
        "_source" : {
          "account_number" : 970,
          "balance" : 19648,
          "firstname" : "Forbes",
          "lastname" : "Wallace",
          "age" : 28,
          "gender" : "M",
          "address" : "990 Mill Road",
          "employer" : "Pheast",
          "email" : "forbeswallace@pheast.com",
          "city" : "Lopezo",
          "state" : "AK"
        }
      }
    ]
  }
}
```

should：应该达到should列举的条件，如果到达会增加相关文档的评分，并不会改变查询的结果。如果query中只有should且只有一种匹配规则，那么should的条件就会被作为默认匹配条件二区改变查询结果。
``` json
// 实例：匹配lastName应该等于Wallace的数据
GET bank/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "gender": "M"
          }
        },
        {
          "match": {
            "address": "mill"
          }
        }
      ],
      "must_not": [
        {
          "match": {
            "age": "18"
          }
        }
      ],
      "should": [
        {
          "match": {
            "lastname": "Wallace"
          }
        }
      ]
    }
  }
}
// 查询结果：
{
  "took" : 5,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 3,
      "relation" : "eq"
    },
    "max_score" : 12.585751,
    "hits" : [
      {
        "_index" : "bank",
        "_type" : "account",
        "_id" : "970",
        "_score" : 12.585751,
        "_source" : {
          "account_number" : 970,
          "balance" : 19648,
          "firstname" : "Forbes",
          "lastname" : "Wallace",
          "age" : 28,
          "gender" : "M",
          "address" : "990 Mill Road",
          "employer" : "Pheast",
          "email" : "forbeswallace@pheast.com",
          "city" : "Lopezo",
          "state" : "AK"
        }
      },
      {
        "_index" : "bank",
        "_type" : "account",
        "_id" : "136",
        "_score" : 6.0824604,
        "_source" : {
          "account_number" : 136,
          "balance" : 45801,
          "firstname" : "Winnie",
          "lastname" : "Holland",
          "age" : 38,
          "gender" : "M",
          "address" : "198 Mill Lane",
          "employer" : "Neteria",
          "email" : "winnieholland@neteria.com",
          "city" : "Urie",
          "state" : "IL"
        }
      },
      {
        "_index" : "bank",
        "_type" : "account",
        "_id" : "345",
        "_score" : 6.0824604,
        "_source" : {
          "account_number" : 345,
          "balance" : 9812,
          "firstname" : "Parker",
          "lastname" : "Hines",
          "age" : 38,
          "gender" : "M",
          "address" : "715 Mill Avenue",
          "employer" : "Baluba",
          "email" : "parkerhines@baluba.com",
          "city" : "Blackgum",
          "state" : "KY"
        }
      }
    ]
  }
}
```
**能够看到相关度越高，得分也越高。**

#### (7) Filter【结果过滤】
上面的must和should影响相关性得分，而must_not仅仅是一个filter ，不贡献得分

must改为filter就使must不贡献得分. 如果只有filter条件的话，我们会发现得分都是0
*一个key多个值可以用terms*

并不是所有的查询都需要产生分数，特别是哪些仅用于filtering过滤的文档。为了不计算分数，elasticsearch会自动检查场景并且优化查询的执行。

不参与评分更快

``` json
// 这里先是查询所有匹配address=mill的文档，然后再根据10000<=balance<=20000进行过滤查询结果
GET bank/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": {"address": "mill" } }
      ],
      "filter": {  // query.bool.filter
        "range": {
          "balance": {
            "gte": "10000",
            "lte": "300000"
          }
        }
      }
    }
  }
}
// 查询结果：
{
  "took" : 2,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 1,
      "relation" : "eq"
    },
    "max_score" : 5.4032025,
    "hits" : [
      {
        "_index" : "bank",
        "_type" : "account",
        "_id" : "970",
        "_score" : 5.4032025,
        "_source" : {
          "account_number" : 970,
          "balance" : 19648,
          "firstname" : "Forbes",
          "lastname" : "Wallace",
          "age" : 28,
          "gender" : "M",
          "address" : "990 Mill Road",
          "employer" : "Pheast",
          "email" : "forbeswallace@pheast.com",
          "city" : "Lopezo",
          "state" : "AK"
        }
      }
    ]
  }
}
```

> 文档
> Each must, should, and must_not element in a Boolean query is referred to as a query clause. How well a document meets the criteria in each must or should clause contributes to the document’s relevance score. The higher the score, the better the document matches your search criteria. By default, Elasticsearch returns documents ranked by these relevance scores.
> 在boolean查询中，must, should 和must_not 元素都被称为查询子句 。 文档是否符合每个“must”或“should”子句中的标准，决定了文档的“相关性得分”。 得分越高，文档越符合您的搜索条件。 默认情况下，Elasticsearch返回根据这些相关性得分排序的文档。
> 
> The criteria in a must_not clause is treated as a filter. It affects whether or not the document is included in the results, but does not contribute to how documents are scored. You can also explicitly specify arbitrary filters to include or exclude documents based on structured data.
> “must_not”子句中的条件被视为“过滤器”。 它影响文档是否包含在结果中， 但不影响文档的评分方式。 还可以显式地指定任意过滤器来包含或排除基于结构化数据的文档。

filter在使用过程中，并不会计算相关性得分：

``` json
GET bank/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "address": "mill"
          }
        }
      ],
      "filter": {
        "range": {
          "balance": {
            "gte": "10000",
            "lte": "20000"
          }
        }
      }
    }
  }
}
// 查询结果：
{
  "took" : 1,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 213,
      "relation" : "eq"
    },
    "max_score" : 0.0,
    "hits" : [
      {
        "_index" : "bank",
        "_type" : "account",
        "_id" : "20",
        "_score" : 0.0,
        "_source" : {
          "account_number" : 20,
          "balance" : 16418,
          "firstname" : "Elinor",
          "lastname" : "Ratliff",
          "age" : 36,
          "gender" : "M",
          "address" : "282 Kings Place",
          "employer" : "Scentric",
          "email" : "elinorratliff@scentric.com",
          "city" : "Ribera",
          "state" : "WA"
        }
      },
      {
        "_index" : "bank",
        "_type" : "account",
        "_id" : "37",
        "_score" : 0.0,
        "_source" : {
          "account_number" : 37,
          "balance" : 18612,
          "firstname" : "Mcgee",
          "lastname" : "Mooney",
          "age" : 39,
          "gender" : "M",
          "address" : "826 Fillmore Place",
          "employer" : "Reversus",
          "email" : "mcgeemooney@reversus.com",
          "city" : "Tooleville",
          "state" : "OK"
        }
      },
        省略。。。
    ]
  }
}
```
能看到所有文档的 “_score” : 0.0。

#### (8) term
和match一样。匹配某个属性的值。
全文检索字段用match，其他非text字段匹配用term。**不要使用term来进行文本字段查询**
ES默认存储text值时用分词分析，所以要搜索text值，使用match
官方文档:https://www.elastic.co/guide/en/elasticsearch/reference/7.6/query-dsl-term-query.html

每个字段都可以keyword
字段.keyword: 要一一匹配到
match_phrase: 子串包含即可

``` json
// 使用term匹配查询
GET bank/_search
{
  "query": {
    "term": {
      "address": "mill Road"
    }
  }
}
// 查询结果： 一条也没有匹配
{
  "took" : 0,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 0, //没有
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [ ]
  }
}

// 而更换为match匹配时，能够匹配到32个文档
{
  "took" : 5,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 32,
      "relation" : "eq"
    },
    "max_score" : 8.926605,
    "hits" : [
      ...
    ]
    ...
  }
}
```
也就是说，全文检索字段用match，其他非text字段匹配用term。

#### (9) Aggregation（聚合）
前面介绍了存储、检索，但还没介绍分析
聚合提供了从数据中分组和提取数据的能力。最简单的聚合方法大致等于SQL Group by和SQL聚合函数。

在elasticsearch中，执行搜索返回hits（命中结果），并且同时返回聚合结果，把以响应中的所有hits（命中结果）分隔开的能力。这是非常强大且有效的，你可以执行查询和多个聚合，并且在一次使用中得到各自的（任何一个的）返回结果，使用一次简洁和简化的API啦避免网络往返。

aggs：执行聚合。聚合语法如下：
``` json
"aggs":{ //聚合
    "aggs_name":{  //这次聚合的名字，方便展示在结果集
        "AGG_TYPE":{  //聚合的类型(avg,term,terms)
        }
     },
     ...
}
```

terms：看值的可能性分布
avg：看值的分布平均值
``` json
// 例：搜索address中包含mill的所有人的年龄分布以及平均年龄，但不显示这些人的详情. 
GET bank/_search
{
  "query": { // 查询出包含mill的
    "match": {
      "address": "Mill"
    }
  },
  "aggs": { // 基于查询聚合
    "ageAgg": {  // 聚合的名字，随便起
      "terms": { // 看值的可能性分布
        "field": "age",
        "size": 10  //仅要前10个
      }
    },
    "ageAvg": { 
      "avg": { // 看age值的平均
        "field": "age"
      }
    },
    "balanceAvg": {
      "avg": { // 看balance的平均
        "field": "balance"
      }
    }
  },
  "size": 0  // 不看详情->分页页大小为0
}
// 查询结果：
{
  "took" : 2,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 4, // 命中4条
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [ ]
  },
  "aggregations" : {
    "ageAgg" : { // 第一个聚合的结果
      "doc_count_error_upper_bound" : 0,
      "sum_other_doc_count" : 0,
      "buckets" : [
        {
          "key" : 38, // age=38的
          "doc_count" : 2 // 有2个记录
        },
        {
          "key" : 28, // age=28的
          "doc_count" : 1 // 有1个记录
        },
        {
          "key" : 32,
          "doc_count" : 1
        }
      ]
    },
    "ageAvg" : { // 第二个聚合的结果
      "value" : 34.0
    },
    "balanceAvg" : {
      "value" : 25208.0
    }
  }
}
```

**子聚合**
``` json
//复杂例子：按照年龄聚合，并且求这些年龄段的这些人的平均薪资
//写到一个聚合里是基于上个聚合进行子聚合。

//下面求每个age分布的平均balance
GET bank/_search
{
  "query": {
    "match_all": {}
  },
  "aggs": {
    "ageAgg": {
      "terms": { // 看分布
        "field": "age",
        "size": 100
      },
      "aggs": { // 再次聚合, 与terms并列
        "ageAvg": { // 聚合名:ageAvg
          "avg": {  //聚合类型:avg
            "field": "balance"
          }
        }
      }
    }
  },
  "size": 0
}
// 输出结果：
{
  "took" : 49,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 1000,
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [ ]
  },
  "aggregations" : {
    "ageAgg" : {
      "doc_count_error_upper_bound" : 0,
      "sum_other_doc_count" : 0,
      "buckets" : [
        {
          "key" : 31,
          "doc_count" : 61,
          "ageAvg" : {
            "value" : 28312.918032786885
          }
        },
        {
          "key" : 39,
          "doc_count" : 60,
          "ageAvg" : {
            "value" : 25269.583333333332
          }
        },
        {
          "key" : 26,
          "doc_count" : 59,
          "ageAvg" : {
            "value" : 23194.813559322032
          }
        },
        {
          "key" : 32,
          "doc_count" : 52,
          "ageAvg" : {
            "value" : 23951.346153846152
          }
        },
        ...
      ]
    }
  }
}
```

再看另一个复杂聚合例子
``` json
//复杂子聚合：查出所有年龄分布，并且这些年龄段中M的平均薪资和F的平均薪资以及这个年龄段的总体平均薪资
GET bank/_search
{
  "query": {
    "match_all": {}
  },
  "aggs": {
    "ageAgg": {
      "terms": {  // 看age分布
        "field": "age",
        "size": 100
      },
      "aggs": { // 子聚合
        "genderAgg": {
          "terms": { // 看gender分布
            "field": "gender.keyword" // 注意这里，文本字段应该用.keyword
          },
          "aggs": { // 子子聚合1
            "balanceAvg": {
              "avg": { // 男性的平均
                "field": "balance"
              }
            }
          }
        },
        "ageBalanceAvg": {  //子子聚合1
          "avg": { //age分布的平均（男女）
            "field": "balance"
          }
        }
      }
    }
  },
  "size": 0
}
// 输出结果：
{
  "took" : 119,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 1000,
      "relation" : "eq"
    },
    "max_score" : null,
    "hits" : [ ]
  },
  "aggregations" : {
    "ageAgg" : {
      "doc_count_error_upper_bound" : 0,
      "sum_other_doc_count" : 0,
      "buckets" : [
        {
          "key" : 31, // age=31的
          "doc_count" : 61, // 有61条记录
          "genderAgg" : {
            "doc_count_error_upper_bound" : 0,
            "sum_other_doc_count" : 0,
            "buckets" : [
              {
                "key" : "M",  // age=31&gender=M的
                "doc_count" : 35, // 有35条记录
                "balanceAvg" : {
                  "value" : 29565.628571428573  // 薪资平均值
                }
              },
              {
                "key" : "F",
                "doc_count" : 26,
                "balanceAvg" : {
                  "value" : 26626.576923076922
                }
              }
            ]
          },
          "ageBalanceAvg" : {
            "value" : 28312.918032786885
          }
        }
      ]
        .......//省略其他
    }
  }
}
```

nested对象聚合
``` json
GET articles/_search
{
  "size": 0, 
  "aggs": {
    "nested": {
      "nested": {
        "path": "payment"
      },
      "aggs": {
        "amount_avg": {
          "avg": {
            "field": "payment.amount"
          }
        }
      }
    }
  }
}
```

### ES-映射(Mapping)
映射定义文档如何被存储检索的
官方文档: https://www.elastic.co/guide/en/elasticsearch/reference/7.x/mapping-types.html

#### (1) 字段类型
**ES6.0以后已经移除字段类型了, 官方文档: https://www.elastic.co/guide/en/elasticsearch/reference/7.16/removal-of-types.html

可选择的字段类型: https://www.elastic.co/guide/en/elasticsearch/reference/7.16/mapping-types.html

* 核心类型
* 复合类型
* 地理类型
* 特定类型
* 核心数据类型

**核心类型**
1. 字符串
   text ⽤于全⽂索引，搜索时会自动使用分词器进⾏分词再匹配
   keyword 不分词，搜索时需要匹配完整的值
2. 数值型
   整型： byte，short，integer，long
   浮点型： float, half_float, scaled_float，double
3. 日期类型：date
4. 范围型
   integer_range， long_range， float_range，double_range，date_range
   gt是大于，lt是小于，e是equals等于。
   age_limit的区间包含了此值的文档都算是匹配。
5. 布尔: boolean
6. ⼆进制
   binary 会把值当做经过 base64 编码的字符串，默认不存储，且不可搜索

**复杂数据类型**
1. 对象: object一个对象中可以嵌套对象。
2. 数组: Array
3. 嵌套类型: nested 用于json对象数组

#### (2) 映射
Mapping(映射)
Maping是用来定义一个文档（document），以及它所包含的属性（field）是如何存储和索引的。

比如：使用maping来定义：
哪些字符串属性应该被看做全文本属性（full text fields）；
哪些属性包含数字，日期或地理位置；
文档中的所有属性是否都嫩被索引（all 配置）；
日期的格式；
自定义映射规则来执行动态添加属性；

查看mapping信息
``` json
// 查看mapping信息：
GET bank/_mapping
{
  "bank" : {
    "mappings" : {
      "properties" : {
        "account_number" : {
          "type" : "long" // long类型
        },
        "address" : {
          "type" : "text", // 文本类型，会进行全文检索，进行分词
          "fields" : {
            "keyword" : { // addrss.keyword
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        },
        "age" : {
          "type" : "long"
        },
        "balance" : {
          "type" : "long"
        },
        "city" : {
          "type" : "text",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        },
        "email" : {
          "type" : "text",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        },
        "employer" : {
          "type" : "text",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        },
        "firstname" : {
          "type" : "text",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        },
        "gender" : {
          "type" : "text",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        },
        "lastname" : {
          "type" : "text",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        },
        "state" : {
          "type" : "text",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        }
      }
    }
  }
}
```

##### 新版本改变
ElasticSearch7-去掉type概念
关系型数据库中两个数据表示是独立的，即使他们里面有相同名称的列也不影响使用，但ES中不是这样的。elasticsearch是基于Lucene开发的搜索引擎，而ES中不同type下名称相同的filed最终在Lucene中的处理方式是一样的。
两个不同type下的两个user_name，在ES同一个索引下其实被认为是同一个filed，你必须在两个不同的type中定义相同的filed映射。否则，不同type中的相同字段名称就会在处理中出现冲突的情况，导致Lucene处理效率下降。
去掉type就是为了提高ES处理数据的效率。

Elasticsearch 7.x URL中的type参数为可选。比如，索引一个文档不再要求提供文档类型。
Elasticsearch 8.x 不再支持URL中的type参数。

> 解决：
> 将索引从多类型迁移到单类型，每种类型文档一个独立索引
> 将已存在的索引下的类型数据，全部迁移到指定位置即可。详见数据迁移

> Elasticsearch 7.x
> Specifying types in requests is deprecated. For instance, indexing a document no longer requires a document type. The new index APIs are PUT {index}/_doc/{id} in case of explicit ids and POST {index}/_doc for auto-generated ids. Note that in 7.0, _doc is a permanent part of the path, and represents the endpoint name rather than the document type.
> The include_type_name parameter in the index creation, index template, and mapping APIs will default to false. Setting the parameter at all will result in a deprecation warning.
The _default_ mapping type is removed.
> Elasticsearch 8.x
> Specifying types in requests is no longer supported.
> The include_type_name parameter is removed.



**创建映射**
PUT /my_index
第一次存储数据的时候es就猜出(适配)了映射
字段映射类型: https://www.elastic.co/guide/en/elasticsearch/reference/7.16/mapping-params.html


第一次存储数据前可以指定映射
``` json
创建索引并指定映射
PUT /my_index
{
  "mappings": {
    "properties": {
      "age": {
        "type": "integer"
      },
      "email": {
        "type": "keyword" // 指定为keyword
      },
      "name": {
        "type": "text" // 全文检索。保存时候分词，检索时候进行分词匹配
      }
    }
  }
}

// 输出：
{
  "acknowledged" : true,
  "shards_acknowledged" : true,
  "index" : "my_index"
}
```

**查看映射**
GET /my_index
``` json
GET /my_index
// 输出结果：
{
  "my_index" : {
    "aliases" : { },
    "mappings" : {
      "properties" : {
        "age" : {
          "type" : "integer"
        },
        "email" : {
          "type" : "keyword"
        },
        "employee-id" : {
          "type" : "keyword",
          "index" : false
        },
        "name" : {
          "type" : "text"
        }
      }
    },
    "settings" : {
      "index" : {
        "creation_date" : "1588410780774",
        "number_of_shards" : "1",
        "number_of_replicas" : "1",
        "uuid" : "ua0lXhtkQCOmn7Kh3iUu0w",
        "version" : {
          "created" : "7060299"
        },
        "provided_name" : "my_index"
      }
    }
  }
}
```

##### 添加新的字段映射
PUT /my_index/_mapping
``` json
PUT /my_index/_mapping
{
  "properties": {
    "employee-id": {
      "type": "keyword",
      "index": false // 字段不能被检索。检索
    }
  }
}
```
这里的 "index": false，表明新增的字段不能被检索，只是一个冗余字段。

**不能更新映射**, 对于已经存在的字段映射，我们不能更新。更新必须创建新的索引，进行数据迁移。

##### 数据迁移
需要创建一个新索引, 然后再迁移过去
查询原索引
``` json
GET /bank/_search
// 结果中查出
"age":{"type":"long"}
```
想要将年龄修改为integer
创建新的索引
``` json
PUT /newbank
{
  "mappings": {
    "properties": {
      "account_number": {
        "type": "long"
      },
      "address": {
        "type": "text"
      },
      "age": {
        "type": "integer"
      },
      "balance": {
        "type": "long"
      },
      "city": {
        "type": "keyword"
      },
      "email": {
        "type": "keyword"
      },
      "employer": {
        "type": "keyword"
      },
      "firstname": {
        "type": "text"
      },
      "gender": {
        "type": "keyword"
      },
      "lastname": {
        "type": "text",
        "fields": {
          "keyword": {
            "type": "keyword",
            "ignore_above": 256
          }
        }
      },
      "state": {
        "type": "keyword"
      }
    }
  }
}
```
查看 newbank 的映射：
``` json
GET /newbank/_mapping
// 能够看到age的映射类型被修改为了integer.
"age":{"type":"integer"}
```


先创建new_twitter的正确映射。
略

然后使用如下方式进行数据迁移。
6.0以后写法, eg:
``` json
POST _reindex
{
  "source":{
      "index":"twitter"
   },
  "dest":{
      "index":"new_twitters"
   }
}
```

老版本写法, eg:
``` json
POST _reindex
{
  "source":{
      "index":"twitter",
      "twitter":"twitter"
   },
  "dest":{
      "index":"new_twitters"
   }
}
```

案例：原来类型为account，新版本没有类型了，所以我们把他去掉
// 查询原映射
``` json
GET /bank/_search
{
  "took" : 0,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 1000,
      "relation" : "eq"
    },
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "bank",
        "_type" : "account",//原来类型为account，新版本没有类型了，所以我们把他去掉
        "_id" : "1",
        "_score" : 1.0,
        "_source" : {
          "account_number" : 1,
          "balance" : 39225,
          "firstname" : "Amber",
          "lastname" : "Duke",
          "age" : 32,
          "gender" : "M",
          "address" : "880 Holmes Lane",
          "employer" : "Pyrami",
          "email" : "amberduke@pyrami.com",
          "city" : "Brogan",
          "state" : "IL"
        }
      },
      ...
    ]
  }
}
```

将bank中的数据迁移到newbank中
``` json
POST _reindex
{
  "source": {
    "index": "bank",
    "type": "account"
  },
  "dest": {
    "index": "newbank"
  }
}
// 运行输出：
#! Deprecation: [types removal] Specifying types in reindex requests is deprecated.
{
  "took" : 768,
  "timed_out" : false,
  "total" : 1000,
  "updated" : 0,
  "created" : 1000,
  "deleted" : 0,
  "batches" : 1,
  "version_conflicts" : 0,
  "noops" : 0,
  "retries" : {
    "bulk" : 0,
    "search" : 0
  },
  "throttled_millis" : 0,
  "requests_per_second" : -1.0,
  "throttled_until_millis" : 0,
  "failures" : [ ]
}
```

重新查看 newbank 中的数据
``` json
GET /newbank/_search
// 输出
{
  ...
  "hits" : {
    "total" : {
      "value" : 1000,
      "relation" : "eq"
    },
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "newbank",
        "_type" : "_doc", //没有了类型
  ...
```


### ES-分词
一个**tokenizer**（分词器）接收一个字符流，将之分割为独立的**tokens**（词元，通常是独立的单词），然后输出tokens流。
例如：whitespace **tokenizer**遇到空白字符时分割文本。它会将文本`Quick brown fox!`分割为`[Quick,brown,fox!]`
该**tokenizer**（分词器）还负责记录各个**terms**(词条)的顺序或**position**位置（用于**phrase**短语和**word proximity**词近邻查询），以及**term**（词条）所代表的原始**word**（单词）的**start**（起始）和**end**（结束）的**character offsets**（字符串偏移量）（用于高亮显示搜索的内容）。
**elasticsearch**提供了很多内置的分词器（标准分词器），可以用来构建custom analyzers（自定义分词器）。

关于分词器： https://www.elastic.co/guide/en/elasticsearch/reference/7.6/analysis.html
``` json
POST _analyze
{
  "analyzer": "standard", //标准分词器
  "text": "The 2 Brown-Foxes bone."
}
// 执行结果：
{
  "tokens" : [
    {
      "token" : "the",
      "start_offset" : 0,
      "end_offset" : 3,
      "type" : "<ALPHANUM>",
      "position" : 0
    },
    {
      "token" : "2",
      "start_offset" : 4,
      "end_offset" : 5,
      "type" : "<NUM>",
      "position" : 1
    },
    {
      "token" : "brown",
      "start_offset" : 6,
      "end_offset" : 11,
      "type" : "<ALPHANUM>",
      "position" : 2
    },
    {
      "token" : "foxes",
      "start_offset" : 12,
      "end_offset" : 17,
      "type" : "<ALPHANUM>",
      "position" : 3
    },
    {
      "token" : "bone",
      "start_offset" : 18,
      "end_offset" : 22,
      "type" : "<ALPHANUM>",
      "position" : 4
    }
  ]
}
```

对于中文，我们需要安装额外的分词器

#### (1) 安装ik分词器
所有的语言分词，默认使用的都是`Standard Analyzer`，但是这些分词器针对于中文的分词，并不友好。为此需要安装中文的分词器。

IK 分词器的版本需要跟 Elasticsearch 的版本对应，当前选择的版本为 7.4.2，下载地址为：[Github Release](https://github.91chi.fun/https://github.com//medcl/elasticsearch-analysis-ik/releases/download/v7.4.2/elasticsearch-analysis-ik-7.4.2.zip)


在前面安装的elasticsearch时，我们已经将elasticsearch容器的`/usr/share/elasticsearch/plugins`目录，映射到宿主机的`/mydata/elasticsearch/plugins`目录下，所以比较方便的做法就是下载`/elasticsearch-analysis-ik-7.4.2.zip`文件，然后解压到目录ik下即可。安装完毕后，需要重启elasticsearch容器。
**下载**
``` shell
# 进入挂载的插件目录 /mydata/elasticsearch/plugins
cd /mydata/elasticsearch/plugins

# 安装 wget 下载工具
yum install -y wget

# 下载对应版本的 IK 分词器（这里是7.4.2）
wget https://github.com/medcl/elasticsearch-analysis-ik/releases/download/v7.4.2/elasticsearch-analysis-ik-7.4.2.zip
```
这里已经在挂载的 plugins 目录安装好了 IK分词器。现在我们进入到 es 容器内部检查是否成功安装. 确认是否安装好了分词器
``` shell
# 进入容器内部
docker exec -it elasticsearch /bin/bash

# 查看 es 插件目录
ls /usr/share/elasticsearch/plugins

# 可以看到 elasticsearch-analysis-ik-7.4.2.zip
```
所以我们之后只需要在挂载的目录/mydata/elasticsearch/plugins下进行操作即可。
**解压**
``` shell
# 进入到 es 的插件目录(宿主机)
cd /mydata/elasticsearch/plugins

# 解压到 plugins 目录下的 ik 目录(yum install -y unzip)
unzip elasticsearch-analysis-ik-7.4.2.zip -d ik
# 还是提示没有命令, 遂放弃命令模式, 使用ssh,sftp方式解压
#1.开启远程连接, 修改配置文件
vi /etc/ssh/sshd_config
#2.开启远程连接: 'I'键进入插入模式, 将'PaswordAuthentication no'改成'PasswordAuthentication yes', 然后按esc, 输入':wq'保存并退出
#3.重启远程连接服务
service sshd restart
#然后就可以使用远程连接工具测试了

# 删除下载的压缩包
rm -f elasticsearch-analysis-ik-7.4.2.zip 

# 修改文件夹访问权限
chmod -R 777 ik/
```
**查看安装的ik插件**
``` ssh
# 进入 es 容器内部
docker exec -it elasticsearch /bin/bash

# 进入 es bin 目录
cd /usr/share/elasticsearch/bin

# 执行查看命令  显示 ik
elasticsearch-plugin list

# 退出容器
exit

# 重启 Elasticsearch
docker restart elasticsearch
```

#### (2) 测试分词器
``` json
使用默认分词器
GET _analyze
{
   "text":"我是中国人"
}
// 执行结果：
{
  "tokens" : [
    {
      "token" : "我",
      "start_offset" : 0,
      "end_offset" : 1,
      "type" : "<IDEOGRAPHIC>",
      "position" : 0
    },
    {
      "token" : "是",
      "start_offset" : 1,
      "end_offset" : 2,
      "type" : "<IDEOGRAPHIC>",
      "position" : 1
    },
    {
      "token" : "中",
      "start_offset" : 2,
      "end_offset" : 3,
      "type" : "<IDEOGRAPHIC>",
      "position" : 2
    },
    {
      "token" : "国",
      "start_offset" : 3,
      "end_offset" : 4,
      "type" : "<IDEOGRAPHIC>",
      "position" : 3
    },
    {
      "token" : "人",
      "start_offset" : 4,
      "end_offset" : 5,
      "type" : "<IDEOGRAPHIC>",
      "position" : 4
    }
  ]
}

// 使用ik分词器
GET _analyze
{
   "analyzer": "ik_smart", 
   "text":"我是中国人"
}
// 输出结果：
{
  "tokens" : [
    {
      "token" : "我",
      "start_offset" : 0,
      "end_offset" : 1,
      "type" : "CN_CHAR",
      "position" : 0
    },
    {
      "token" : "是",
      "start_offset" : 1,
      "end_offset" : 2,
      "type" : "CN_CHAR",
      "position" : 1
    },
    {
      "token" : "中国人",
      "start_offset" : 2,
      "end_offset" : 5,
      "type" : "CN_WORD",
      "position" : 2
    }
  ]
}

//使用ik的ik_max_word分词
GET _analyze
{
   "analyzer": "ik_max_word", 
   "text":"我是中国人"
}
// 输出结果：
{
  "tokens" : [
    {
      "token" : "我",
      "start_offset" : 0,
      "end_offset" : 1,
      "type" : "CN_CHAR",
      "position" : 0
    },
    {
      "token" : "是",
      "start_offset" : 1,
      "end_offset" : 2,
      "type" : "CN_CHAR",
      "position" : 1
    },
    {
      "token" : "中国人",
      "start_offset" : 2,
      "end_offset" : 5,
      "type" : "CN_WORD",
      "position" : 2
    },
    {
      "token" : "中国",
      "start_offset" : 2,
      "end_offset" : 4,
      "type" : "CN_WORD",
      "position" : 3
    },
    {
      "token" : "国人",
      "start_offset" : 3,
      "end_offset" : 5,
      "type" : "CN_WORD",
      "position" : 4
    }
  ]
}
```

#### (3) 自定义词库
比如我们要把尚硅谷算作一个词
修改`/usr/local/elasticsearch/plugins/ik/config`中的`IKAnalyzer.cfg.xml`
``` xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
<properties>
	<comment>IK Analyzer 扩展配置</comment>
	<!--用户可以在这里配置自己的扩展字典 -->
	<entry key="ext_dict"></entry>
	 <!--用户可以在这里配置自己的扩展停止词字典-->
	<entry key="ext_stopwords"></entry>
	<!--用户可以在这里配置远程扩展字典 -->
	<entry key="remote_ext_dict">http://192.168.11.129/es/fenci.txt</entry> 
	<!--用户可以在这里配置远程扩展停止词字典-->
	<!-- <entry key="remote_ext_stopwords">words_location</entry> -->
</properties>
```
修改完成后，需要重启elasticsearch容器，否则修改不生效。`docker restart elasticsearch`

更新完成后，es只会对于新增的数据用更新分词。历史数据是不会重新分词的。如果想要历史数据重新分词，需要执行：
`POST my_index/_update_by_query?conflicts=proceed`

**安装Nginx**
我们在 nginx 中自定义分词文件，通过配置 es 的 ik 配置文件来远程调用 nginx 中的分词文件来实现自定义扩展词库。*默认 nginx 请求的是 数据目录的 html 静态目录*

安装Nginx, 随便启动一个nginx实例，只是为了复制出配置
``` shell
# 启动ngin容器, 没有镜像会自动下载
docker run -p 80:80 --name nginx -d nginx:1.10  
``` 
将容器内的配置文件拷贝到`/mydata/nginx/conf`下
``` shell
# 创建配置目录
mkdir -p /mydata/nginx/conf

# 拷贝出 Nginx 容器的配置
# 将nginx容器中的nginx目录复制到本机的/mydata/nginx/conf目录
docker container cp nginx:/etc/nginx /mydata/nginx/conf

# 复制的是nginx目录，将该目录的所有文件移动到 conf 目录
mv /mydata/nginx/conf/nginx/* /mydata/nginx/conf/

# 删除多余的 /mydata/nginx/conf/nginx目录
rm -rf /mydata/nginx/conf/nginx
```
删除临时nginx容器
``` shell
# 停止运行 nginx 容器
docker stop nginx

# 删除 nginx 容器
docker rm nginx
```
启动真正需要的nginx容器
``` shell
# 启动容器
docker run -p 80:80 --name nginx \
  -v /mydata/nginx/html:/usr/share/nginx/html \
  -v /mydata/nginx/logs:/var/log/nginx \
  -v /mydata/nginx/conf/:/etc/nginx \
  -d nginx:1.10

# 设置 nginx 随 Docker 启动
docker update nginx --restart=always
```
测试 nginx
``` shell
# 创建一个首页到nginx中
echo '<h1>Gulimall</h1>' >/mydata/nginx/html/index.html
```
访问：ngix所在主机的IP:80/index.html(http://192.168.56.10)
能正常访问说明安装成功

**自定义扩展分词库**
nginx 默认请求地址为 `ip:port/fenci.txt`；本机为：`192.168.56.10/fenci.txt`
如果想要增加新的词语，只需要在该文件追加新的行并保存新的词语即可。

给 es 配置自定义词库
``` shell
# nginx 中自定义分词文件
echo "蔡徐坤" > /mydata/nginx/html/fenci.txt

# 打开并编辑 ik 插件配置文件
vi /mydata/elasticsearch/plugins/ik/config/IKAnalyzer.cfg.xml

# 修改为以下内容：
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
<properties>
    <comment>IK Analyzer 扩展配置</comment>
    <!--用户可以在这里配置自己的扩展字典 -->
    <entry key="ext_dict"></entry>
      <!--用户可以在这里配置自己的扩展停止词字典-->
    <entry key="ext_stopwords"></entry>
    <!--用户可以在这里配置远程扩展字典 -->
    <!-- <entry key="remote_ext_dict">words_location</entry> -->
    <entry key="remote_ext_dict">http://192.168.56.10/fenci.txt</entry>
    <!--用户可以在这里配置远程扩展停止词字典-->
    <!-- <entry key="remote_ext_stopwords">words_location</entry> -->
</properties>

# 重启 elasticsearch 容器
docker restart elasticsearch
```
测试效果：
``` json
GET _analyze
{
   "analyzer": "ik_max_word", 
   "text":"我是练习时长两年半的蔡徐坤"
}
//输出结果：
{
  "tokens" : [
    {
      "token" : "我",
      "start_offset" : 0,
      "end_offset" : 1,
      "type" : "CN_CHAR",
      "position" : 0
    },
    {
      "token" : "是",
      "start_offset" : 1,
      "end_offset" : 2,
      "type" : "CN_CHAR",
      "position" : 1
    },
    {
      "token" : "练习",
      "start_offset" : 2,
      "end_offset" : 4,
      "type" : "CN_WORD",
      "position" : 2
    },
    {
      "token" : "时长",
      "start_offset" : 4,
      "end_offset" : 6,
      "type" : "CN_WORD",
      "position" : 3
    },
    {
      "token" : "两年",
      "start_offset" : 6,
      "end_offset" : 8,
      "type" : "CN_WORD",
      "position" : 4
    },
    {
      "token" : "两",
      "start_offset" : 6,
      "end_offset" : 7,
      "type" : "COUNT",
      "position" : 5
    },
    {
      "token" : "年半",
      "start_offset" : 7,
      "end_offset" : 9,
      "type" : "CN_WORD",
      "position" : 6
    },
    {
      "token" : "的",
      "start_offset" : 9,
      "end_offset" : 10,
      "type" : "CN_CHAR",
      "position" : 7
    },
    {
      "token" : "蔡徐坤",
      "start_offset" : 10,
      "end_offset" : 13,
      "type" : "CN_WORD",
      "position" : 8
    }
  ]
}
```

### ES-项目整合
#### Elasticsearch-Rest-Client
java操作es有两种方式

1. 通过 9300:TCP
   * spring-data-elasticsearch:transport-api.jar;
     * springboot版本不同，ransport-api.jar不同，不能适配es版本
     * 7.x已经不建议使用，8以后就要废弃
2. 9200: HTTP
   有诸多包
   * jestClient: 非官方，更新慢；
   * RestTemplate：模拟HTTP请求，ES很多操作需要自己封装，麻烦；
   * HttpClient：同上；
   * Elasticsearch-Rest-Client：官方RestClient，封装了ES操作，API层次分明，上手简单；
最终选择Elasticsearch-Rest-Client（elasticsearch-rest-high-level-client）
https://www.elastic.co/guide/en/elasticsearch/client/java-rest/current/java-rest-high.html

#### 整合high-level-client
创建项目`gulimall-search`项目
过程略
`pom.xml`
``` xml
<dependencies>
    <dependency>
        <groupId>cn.cheakin</groupId>
        <artifactId>gulimall-common</artifactId>
        <version>0.0.1-SNAPSHOT</version>
        <!--不需要数据库连接, 或者在启动类上使用`@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)`-->
        <exclusions>
            <exclusion>
                <groupId>com.baomidou</groupId>
                <artifactId>mybatis-plus-boot-starter</artifactId>
            </exclusion>
        </exclusions>
    </dependency>

    <dependency>
        <groupId>org.elasticsearch.client</groupId>
        <artifactId>elasticsearch-rest-high-level-client</artifactId>
        <version>7.4.2</version>
    </dependency>
</dependencies>
```
查看依赖关系发现es的依赖还是有问题, 是因为springboot中自带了其他版本的elasticsearch, 所以需要在`父级pom.xml`中覆盖掉
```xml
<properties>
    ......
    <elasticsearch.version>7.4.2</elasticsearch.version>
</properties>

<dependencyManagement>
    <dependencies>
        ......

        <!-- 重写覆盖 spring-boot-dependencies 中的依赖版本  -->
        <dependency>
            <groupId>org.elasticsearch.client</groupId>
            <artifactId>elasticsearch-rest-high-level-client</artifactId>
            <version>${elasticsearch.version}</version>
        </dependency>
        <dependency>
            <groupId>org.elasticsearch</groupId>
            <artifactId>elasticsearch</artifactId>
            <version>${elasticsearch.version}</version>
        </dependency>
        <dependency>
            <groupId>org.elasticsearch.client</groupId>
            <artifactId>elasticsearch-rest-client</artifactId>
            <version>${elasticsearch.version}</version>
        </dependency>
    </dependencies>
</dependencyManagement>
```

`applicaion.yml`
```yml
spring:
  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1:8848
  application:
    name: gulimall-search
```
注册到注册中心: 
1.使用`@EnableDiscoveryClient`注解
2.创建`bootstrap.properties`
``` yml
spring.cloud.nacos.config.server-addr=127.0.0.1:8848
spring.cloud.nacos.config.namespace=gulimall-search
```
创建配置类`GulimallElasticSearchConfig`, 给容器中注入RestHighLevelClient
``` java
@Configuration
public class GulimallElasticSearchConfig {

    @Bean
    public RestHighLevelClient esRestClient() {
        return new RestHighLevelClient(
                RestClient.builder(
                        new HttpHost("192.168.56.10", 9200, "http")));
    }
}
```
单元测试测试整合ES, `GulimallSearchAplicationTests`中
``` java
@Autowired
private RestHighLevelClient client;

@Test
void contextLoads() {
    System.out.println("client = " + client);
}
```
能够正常打印内存的地址即为成功

#### 测试保存
首先配置请求选项, 在`GulimallElasticSearchConfig`中配置
``` java
/**
  * 配置请求选项
  */
public static final RequestOptions COMMON_OPTIONS;
static {
    RequestOptions.Builder builder = RequestOptions.DEFAULT.toBuilder();
    // builder.addHeader("Authorization", "Bearer " + TOKEN);
    // builder.setHttpAsyncResponseConsumerFactory(
    //         new HttpAsyncResponseConsumerFactory
    //                 .HeapBufferedResponseConsumerFactory(30 * 1024 * 1024 * 1024));
    COMMON_OPTIONS = builder.build();
}
```
在`GulimallSearchApplicationTests`中测试
``` java
/**
     * 测试存储数据到 es
     * source 方法用于保存数据，数据的格式为键值对形式的类型
     * - json 字符串
     * - Map
     * - XContentBuilder
     * - KV 键值对
     * - 实体类对象转json
     */
    @Test
    void indexData() throws IOException {
        IndexRequest indexRequest = new IndexRequest("users");
        indexRequest.id("1");
        indexRequest.source("userName", "张三", "age", 18, "gender", "男");

        // KV 键值对
        // indexRequest.source("username", "zhangsan", "age", 12, "address", "sz");

        // json 字符串
        indexRequest.source("{" +
                "\"user\":\"kimchy\"," +
                "\"postDate\":\"2013-01-30\"," +
                "\"message\":\"trying out Elasticsearch\"" +
                "}", XContentType.JSON);

        // 同步执行
        IndexResponse index = client.index(indexRequest, GulimallElasticSearchConfig.COMMON_OPTIONS);

        // 提取响应的数据
        System.out.println("index = " + index);
    }
```
运行后的返回
``` ``
``` java
index = IndexResponse[index=users,type=_doc,id=1,version=1,result=created,seqNo=0,primaryTerm=1,shards={"total":2,"successful":1,"failed":0}]

```

#### 测试复杂检索
`GulimallSearchApplicationTests`
``` java
/**
  * 检索地址中带有 mill 的人员年龄分布和平均薪资
  * @throws IOException
  */
@Test
void searchData() throws IOException {
    // 1. 创建检索请求
    SearchRequest searchRequest = new SearchRequest();
    // 指定索引
    searchRequest.indices("bank");
    // 指定 DSL 检索条件
    SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder();
    // 1.1 构建检索条件 address 包含 mill
    searchSourceBuilder.query(QueryBuilders.matchQuery("address", "mill"));
    // 1.2 按照年龄值分布进行聚合
    TermsAggregationBuilder ageAgg = AggregationBuilders.terms("ageAgg").field("age").size(10);
    searchSourceBuilder.aggregation(ageAgg);
    // 1.3 计算平均薪资
    AvgAggregationBuilder balanceAvg = AggregationBuilders.avg("balanceAvg").field("balance");
    searchSourceBuilder.aggregation(balanceAvg);

    System.out.println("检索条件：" + searchSourceBuilder.toString());
    searchRequest.source(searchSourceBuilder);


    // 2. 执行检索, 获得响应
    SearchResponse searchResponse = client.search(searchRequest, GulimallElasticSearchConfig.COMMON_OPTIONS);

    // 3. 分析结果
    // 3.1 获取所有查到的记录
    SearchHits hits = searchResponse.getHits();
    SearchHit[] searchHits = hits.getHits();
    for (SearchHit hit : searchHits) {
        // 数据字符串
        String jsonString = hit.getSourceAsString();
        System.out.println(jsonString);
        // 可以通过 json 转换成实体类对象
        // Account account = JSON.parseObject(jsonString, Account.class);
    }

    // 3.2 获取检索的分析信息(聚合数据等)
    Aggregations aggregations = searchResponse.getAggregations();
    // for (Aggregation aggregation : aggregations.asList()) {
    //     System.out.println("当前聚合名：" + aggregation.getName());
    // }
    Terms ageAgg1 = aggregations.get("ageAgg");
    for (Terms.Bucket bucket : ageAgg1.getBuckets()) {
        String keyAsString = bucket.getKeyAsString();
        System.out.println("年龄：" + keyAsString + " 岁的有 " + bucket.getDocCount() + " 人");
    }

    Avg balanceAvg1 = aggregations.get("balanceAvg");
    System.out.println("平均薪资: " + balanceAvg1.getValue());
}
```
打印结果
``` java
检索条件：{"query":{"match":{"address":{"query":"mill","operator":"OR","prefix_length":0,"max_expansions":50,"fuzzy_transpositions":true,"lenient":false,"zero_terms_query":"NONE","auto_generate_synonyms_phrase_query":true,"boost":1.0}}},"aggregations":{"ageAgg":{"terms":{"field":"age","size":10,"min_doc_count":1,"shard_min_doc_count":0,"show_term_doc_count_error":false,"order":[{"_count":"desc"},{"_key":"asc"}]}},"balanceAvg":{"avg":{"field":"balance"}}}}
{"account_number":970,"balance":19648,"firstname":"Forbes","lastname":"Wallace","age":28,"gender":"M","address":"990 Mill Road","employer":"Pheast","email":"forbeswallace@pheast.com","city":"Lopezo","state":"AK"}
{"account_number":136,"balance":45801,"firstname":"Winnie","lastname":"Holland","age":38,"gender":"M","address":"198 Mill Lane","employer":"Neteria","email":"winnieholland@neteria.com","city":"Urie","state":"IL"}
{"account_number":345,"balance":9812,"firstname":"Parker","lastname":"Hines","age":38,"gender":"M","address":"715 Mill Avenue","employer":"Baluba","email":"parkerhines@baluba.com","city":"Blackgum","state":"KY"}
{"account_number":472,"balance":25571,"firstname":"Lee","lastname":"Long","age":32,"gender":"F","address":"288 Mill Street","employer":"Comverges","email":"leelong@comverges.com","city":"Movico","state":"MT"}
年龄：38 岁的有 2 人
年龄：28 岁的有 1 人
年龄：32 岁的有 1 人
平均薪资: 25208.0

```

## 商城业务
### 商品上架
#### sku在es中存储模型分析
ES在内存中，所以在检索中优于mysql。ES也支持集群，数据分片存储。

需求：
上架的商品才可以在网站展示。
上架的商品需要可以被检索。

分析sku在es中如何存储
商品mapping

分析：商品上架在es中是存sku还是spu？
1）检索的时候输入名字，是需要按照sku的title进行全文检索的
2）检素使用商品规格，规格是spu的公共属性，每个spu是一样的
3）按照分类id进去的都是直接列出spu的，还可以切换。
4〕我们如果将sku的全量信息保存到es中（包括spu属性〕就太多字段了
方案1：
``` json
{
    skuId:1
    spuId:11
    skyTitile:华为xx
    price:999
    saleCount:99
    attr:[
        {尺寸:5},
        {CPU:高通945},
        {分辨率:全高清}
	]
}
```
缺点：如果每个sku都存储规格参数(如尺寸)，会有冗余存储，因为每个spu对应的sku的规格参数都一样
100万的数据: 将会冗余100万*20=1000000*2KB=2000MB=2G

方案2：
`sku索引`
``` json
{
    spuId:1
    skuId:11
}
```
`attr索引`
``` json
{
    skuId:11
    attr:[
        {尺寸:5},
        {CPU:高通945},
        {分辨率:全高清}
	]
}
```
先找到4000个符合要求的spu，再根据4000个spu查询对应的属性，封装了4000个id，long 8B*4000=32000B=32KB
1K个人检索，就是32MB
将公共的attr分离出来, 通过二次查找索引,耗时较长

**结论：如果将规格参数单独建立索引，会出现检索时出现大量数据传输的问题，会引起网络网络因此选用方案1，以空间换时间**

建立product索引
最终选用的数据模型：
``` json
PUT product
{
    "mappings":{
        "properties": {
            "skuId":{ "type": "long" },
            "spuId":{ "type": "keyword" },  # 不可分词
            "skuTitle": {
                "type": "text",
                "analyzer": "ik_smart"  # 中文分词器
            },
            "skuPrice": { "type": "keyword" },
            "skuImg"  : { "type": "keyword" },
            "saleCount":{ "type":"long" },
            "hasStock": { "type": "boolean" },
            "hotScore": { "type": "long"  },
            "brandId":  { "type": "long" },
            "catalogId": { "type": "long"  },
            "brandName": {"type": "keyword"},
            "brandImg":{
                "type": "keyword",
                "index": false,  # 不可被检索，不生成index
                "doc_values": false # 不可被聚合
            },
            "catalogName": {"type": "keyword" },
            "attrs": {
                "type": "nested",
                "properties": {
                    "attrId": {"type": "long"  },
                    "attrName": {
                        "type": "keyword",
                        "index": false,
                        "doc_values": false
                    },
                    "attrValue": {"type": "keyword" }
                }
            }
        }
    }
}
```
其中
`"type": "keyword"` 保持数据精度问题，可以检索，但不分词
`"index":false` 代表不可被检索
`"doc_values": false` 不可被聚合，es就不会维护一些聚合的信息
冗余存储的字段：不用来检索，也不用来分析，节省空间

库存是bool。
检索品牌id，但是不检索品牌名字、图片
用skuTitle分词和检索

#### nested(嵌入式对象)
属性是`"type": "nested"`, 因为是内部的属性进行检索
官方文档: https://www.elastic.co/guide/en/elasticsearch/reference/current/nested.html

数组类型的对象会被扁平化处理（对象的每个属性会分别存储到一起）
user.name=["aaa","bbb"]
user.addr=["ccc","ddd"]

这种存储方式，可能会发生如下错误：
错误检索到`{aaa,ddd}`，这个组合是不存在的
数组的扁平化处理会使检索能检索到本身不存在的，为了解决这个问题，就采用了嵌入式属性，数组里是对象时用嵌入式属性nested（不是对象无需用嵌入式属性）


#### 构造基本数据、SKU检索属性、远程查询库存&泛型结果封装、远程上架接口、上架接口调试
**构造基本数据**
`gulimlla-product`的`SpuInfoController`中
``` java
/**
  * 商品上架功能
  *
  * @param spuId
  * @return
  */
@PostMapping("/{spuId}/up")
public R upSpu(@PathVariable Long spuId) {
    spuInfoService.up(spuId);
    return R.ok();
}
```
`gulimall-common`中创建`SkuEsModel`
``` java
@Data
public class SkuEsModel {

    private Long skuId;

    private Long spuId;

    private String skuTitle;

    private BigDecimal skuPrice;

    private String skuImg;

    private Long saleCount;

    /**
     * 是否有库存
     */
    private Boolean hasStock;

    /**
     * 热度
     */
    private Long hotScore;

    private Long brandId;

    private Long catalogId;

    private String brandName;

    private String brandImg;

    private String catalogName;

    private List<Attrs> attrs;

    @Data
    public static class Attrs {

        private Long attrId;

        private String attrName;

        private String attrValue;
    }
}
```
`gulimlla-product`的`SpuInfoServiceImpl`
``` java
@Autowired
BrandService brandService;
@Autowired
CategoryService categoryService;

@Autowired
private WareFeignService wareFeignService;
@Autowired
private SearchFeignService searchFeignService;

@Override
public void up(Long spuId) {

    // 1、查出当前spuId对应的所有sku信息,品牌的名字
    List<SkuInfoEntity> skuInfoEntities = skuInfoService.getSkusBySpuId(spuId);

    // TODO 4、查出当前sku的所有可以被用来检索的规格属性
    List<ProductAttrValueEntity> baseAttrs = productAttrValueService.baseAttrListforspu(spuId);

    List<Long> attrIds = baseAttrs.stream().map(ProductAttrValueEntity::getAttrId).collect(Collectors.toList());

    List<Long> searchAttrIds = attrService.selectSearchAttrs(attrIds);
    //转换为Set集合
    Set<Long> idSet = new HashSet<>(searchAttrIds);

    List<SkuEsModel.Attrs> attrsList = baseAttrs.stream()
            .filter(item -> idSet.contains(item.getAttrId()))
            .map(item -> {
                SkuEsModel.Attrs attrs = new SkuEsModel.Attrs();
                BeanUtils.copyProperties(item, attrs);
                return attrs;
            }).collect(Collectors.toList());

    List<Long> skuIdList = skuInfoEntities.stream().map(SkuInfoEntity::getSkuId).collect(Collectors.toList());
    // TODO 1、发送远程调用，库存系统查询是否有库存
    Map<Long, Boolean> stockMap = null;
    try {
        R skuHasStock = wareFeignService.getSkuHasStock(skuIdList);

        TypeReference<List<SkuHasStockVo>> typeReference = new TypeReference<List<SkuHasStockVo>>() {};
        stockMap = skuHasStock.getData(typeReference).stream()
                .collect(Collectors.toMap(SkuHasStockVo::getSkuId, item -> item.getHasStock()));
    } catch (Exception e) {
        log.error("库存服务查询异常：原因{}", e);
    }

    //2、封装每个sku的信息
    Map<Long, Boolean> finalStockMap = stockMap;
    List<SkuEsModel> collect = skuInfoEntities.stream().map(sku -> {
        //组装需要的数据
        SkuEsModel esModel = new SkuEsModel();
        esModel.setSkuPrice(sku.getPrice());
        esModel.setSkuImg(sku.getSkuDefaultImg());

        // 设置库存信息
        if (finalStockMap == null) {
            esModel.setHasStock(true);
        } else {
            esModel.setHasStock(finalStockMap.get(sku.getSkuId()));
        }

        // TODO 2、热度评分。0
        esModel.setHotScore(0L);

        // TODO 3、查询品牌和分类的名字信息
        BrandEntity brandEntity = brandService.getById(sku.getBrandId());
        esModel.setBrandName(brandEntity.getName());
        esModel.setBrandId(brandEntity.getBrandId());
        esModel.setBrandImg(brandEntity.getLogo());

        CategoryEntity categoryEntity = categoryService.getById(sku.getCatalogId());
        esModel.setCatalogId(categoryEntity.getCatId());
        esModel.setCatalogName(categoryEntity.getName());

        // 设置检索属性
        esModel.setAttrs(attrsList);

        BeanUtils.copyProperties(sku, esModel);

        return esModel;
    }).collect(Collectors.toList());

    // TODO 5、将数据发给es进行保存：mall-search
    R r = searchFeignService.productStatusUp(collect);

    if (r.getCode() == 0) {
        // 远程调用成功
        // TODO 6、修改当前spu的状态
        this.baseMapper.updaSpuStatus(spuId, ProductConstant.ProductStatusEnum.SPU_UP.getCode());
    } else {
        // 远程调用失败
        // TODO 7、重复调用？接口幂等性:重试机制
    }
}
```
**SKU检索属性**
`gulimlla-product`的`SkuInfoServiceImpl`
``` java
@Override
public List<SkuInfoEntity> getSkusBySpuId(Long spuId) {
    return this.list(new QueryWrapper<SkuInfoEntity>().eq("spu_id", spuId));
}
```
`gulimlla-product`的`AttrServiceImpl`
``` java
/**
  * 在指定的所有属性集合里面，挑出检索属性
  * @param attrIds
  * @return
  */
@Override
public List<Long> selectSearchAttrs(List<Long> attrIds) {
    return this.baseMapper.selectSearchAttrIds(attrIds);
}
```
`AttrDao.xml`
``` xml
<select id="selectSearchAttrIds" resultType="java.lang.Long">
    SELECT attr_id FROM pms_attr WHERE attr_id IN
    <foreach collection="attrIds" item="id" separator="," open="(" close=")">
        #{id}
    </foreach>
    AND search_type = 1
</select>
```
`gulimlla-ware`的`WareSkuController`
``` java
/**
  * 查询sku是否有库存
  * @return
  */
@PostMapping(value = "/hasStock")
public R getSkuHasStock(@RequestBody List<Long> skuIds) {
    //skuId stock
    List<SkuHasStockVo> vos = wareSkuService.getSkuHasStock(skuIds);

//        return R.ok().put("data", vos);
    /*R<List<SkuHasStockVo>> ok = R.ok();
    ok.setData(vos);
    return ok;*/
    return R.ok().setData(vos);
}
```
`gulimlla-ware`中新建`SkuHasStockVo`
``` java
@Data
public class SkuHasStockVo {

    private Long skuId;

    private Boolean hasStock;

}
```
`gulimlla-ware`的`WareSkuServiceImpl`
``` java
/**
  * 判断是否有库存
  * @param skuIds
  * @return
  */
@Override
public List<SkuHasStockVo> getSkuHasStock(List<Long> skuIds) {
    return skuIds.stream().map(skuId -> {
        Long count = this.baseMapper.getSkuStock(item);
        SkuHasStockVo skuHasStocskuIdkVo = new SkuHasStockVo();
        skuHasStockVo.setSkuId(skuId);
        skuHasStockVo.setHasStock(count == null?false:count > 0);
        return skuHasStockVo;
    }).collect(Collectors.toList());
}
```
`WareSkuDao.xml`
``` xml
<select id="getSkuStock" resultType="java.lang.Long">
    SELECT SUM(stock - stock_locked)
    FROM wms_ware_sku
    WHERE sku_id = #{skuId}
</select>
```
**远程查询库存&泛型结果封装**
`gulimlla-product`中新建`WareFeignService`, 注意使用完整路径
``` java
@FeignClient("gulimall-ware")
public interface WareFeignService {

    /**
     * 1、R设计的时候可以加上泛型
     * 2、直接返回我们想要的结果
     * 3、自己封装解析结果
     * @param skuIds
     * @return
     */
    @PostMapping(value = "/ware/waresku/hasStock")
   R getSkuHasStock(@RequestBody List<Long> skuIds);
    // R<List<SkuHasStockVo>> getSkuHasStock(@RequestBody List<Long> skuIds);

}
```
`gulimall-common`的`R`中, *我的项目中的JSON工具与视频中的不同，我使用的`Hutool工具`*
``` java
public <T> T getData(String name , TypeReference<T> typeReference) {
    Object data = this.get(name);	// 默认返回是map类型的
    String s = JSON.toJSONString(data);
    T t = JSON.parseObject(s, typeReference);
    return t;
}

public <T> T getData(TypeReference<T> typeReference) {
    return getData("data", typeReference);
}

public <T> T getData(String name , Class<T> clazz) {
    Object data = this.get(name);	// 默认返回是map类型的
    String s = JSON.toJSONString(data);
    T t = JSON.parseObject(s, clazz);
    return t;
}

public <T> T getData(Class<T> clazz) {
    return getData("data", clazz);
}

public R setData(Object data) {
  put("data", data);
  return this;
}
```
拷贝一份`gulimall-ware`中的`SkuHasStockVo`到`gulimall-common`中
``` java
@Data
public class SkuHasStockVo {

    private Long skuId;

    private Boolean hasStock;

}
```
**远程上架接口**
`guliamll-search`中新建`ElasticSaveController`
``` java
@Slf4j
@RequestMapping(value = "/search/save")
@RestController
public class ElasticSaveController {

    @Autowired
    private ProductSaveService productSaveService;

    /**
     * 上架商品
     *
     * @param skuEsModels
     * @return
     */
    @PostMapping(value = "/product")
    public R productStatusUp(@RequestBody List<SkuEsModel> skuEsModels) {

        boolean status = false;
        try {
            status = productSaveService.productStatusUp(skuEsModels);
        } catch (IOException e) {
            log.error("ElasticSaveController - 商品上架错误: ", e);
            return R.error(BizCodeEnum.PRODUCT_UP_EXCEPTION.getCode(), BizCodeEnum.PRODUCT_UP_EXCEPTION.getMsg());
        }

        if (status) {
            return R.error(BizCodeEnum.PRODUCT_UP_EXCEPTION.getCode(), BizCodeEnum.PRODUCT_UP_EXCEPTION.getMsg());
        } else {
            return R.ok();
        }
    }
}
```
`guliamll-search`中新建`ProductSaveService`， 以及对应的实现`ProductSaveServiceImpl`
``` java
@Slf4j
@Service("productSaveService")
public class ProductSaveServiceImpl implements ProductSaveService {

    @Autowired
    private RestHighLevelClient esRestClient;

    @Override
    public boolean productStatusUp(List<SkuEsModel> skuEsModels) throws IOException {

        //1.在es中建立索引，建立号映射关系（doc/json/product-mapping.json）

        //2. 在ES中保存这些数据
        BulkRequest bulkRequest = new BulkRequest();
        for (SkuEsModel skuEsModel : skuEsModels) {
            //构造保存请求
            IndexRequest indexRequest = new IndexRequest(EsConstant.PRODUCT_INDEX);
            indexRequest.id(skuEsModel.getSkuId().toString());
            String jsonString = JSONUtil.toJsonStr(skuEsModel);
            indexRequest.source(jsonString, XContentType.JSON);
            bulkRequest.add(indexRequest);
        }

        BulkResponse bulk = esRestClient.bulk(bulkRequest, GulimallElasticSearchConfig.COMMON_OPTIONS);

        //TODO 如果批量错误
        boolean hasFailures = bulk.hasFailures();

        List<String> collect = Arrays.stream(bulk.getItems()).map(BulkItemResponse::getId).collect(Collectors.toList());

        log.info("商品上架完成:{}, 返回数据:{}", collect, bulk.toString());
        return hasFailures;
    }
}
```
`guliamll-search`中新建`EsConstant`
``` java
public class EsConstant {

    /**
     * 在es中的索引, 已经修改完映射并数据迁移
     */
    public static final String PRODUCT_INDEX = "gulimall_product";

    public static final Integer PRODUCT_PAGE_SIZE = 2;
}
```
`guliamll-search`中新建`product-mapping.txt`, 并通过ES创建映射
``` json
// PUT product
{
  "mappings": {
    "properties": {
      "skuId": {
        "type": "long"
      },
      "spuId": {
        "type": "long"
      },
      "skuTitle": {
        "type": "text",
        "analyzer": "ik_smart"
      },
      "skuPrice": {
        "type": "keyword"
      },
      "skuImg": {
        "type": "keyword",
        "index": false,
        "doc_values": false
      },
      "saleCount": {
        "type": "long"
      },
      "hosStock": {
        "type": "boolean"
      },
      "hotScore": {
        "type": "long"
      },
      "brandId": {
        "type": "long"
      },
      "catelogId": {
        "type": "long"
      },
      "brandName": {
        "type": "keyword",
        "index": false,
        "doc_values": false
      },
      "brandImg": {
        "type": "keyword",
        "index": false,
        "doc_values": false
      },
      "catelogName": {
        "type": "keyword",
        "index": false,
        "doc_values": false
      },
      "attrs": {
        "type": "nested",
        "properties": {
          "attrId": {
            "type": "long"
          },
          "attrName": {
            "type": "keyword",
            "index": false,
            "doc_values": false
          },
          "attrValue": {
            "type": "keyword"
          }
        }
      }
    }
  }
}
```
`gulimall-common`中修改`BizCodeEnum`, 增加错误码`PRODUCT_UP_EXCEPTION(11000, "商品上架异常")`
`gulimlla-product`中新建`SearchFeignService`
``` java
@FeignClient("gulimall-search")
public interface SearchFeignService {

    @PostMapping(value = "/search/save/product")
    R productStatusUp(@RequestBody List<SkuEsModel> skuEsModels);

}
```
在`gulimall-common`中修改`ProductConstant`
``` java
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
```
`SpuInfoDao.xml`
``` xml
<update id="updaSpuStatus">
    UPDATE pms_spu_info
    SET publish_status = #{code},
        update_time    = NOW()
    WHERE id = #{spuId}
</update>
```
`gulimall-search`的`application.yml`中添加ES服务的路由
``` yml
- id: search_route
  uri: lb://gulimall-search
  predicates:
    - Path=/api/search/**
  filters:
    - RewritePath=/api/(?<segment>.*),/$\{segment}
```

### 首页
哪里用到就在响应的地方拷贝前端代码和引入依赖
#### 整合thymeleaf
首先在`gulimall=product`中引用. 版本依然由spirngboot的版本指定, 不需要再指定了
``` xml
<!-- thymeleaf 模板引擎 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>
```
按照视频将文件放入`resourcec/static/`和`resourcec/templates`中
在`applicaion.yml`中配置, 关闭缓存
``` yml
spring:
  thymeleaf:
    cache: false
```

**测试**
访问`http://localhost:10000/`能够进入首页
访问`http://localhost:10000/index/css/GL.css`能够正常返回css文件内容

#### 渲染一级分类
为了不用修改后重启, 我们可以使用热加载, 在需要使用的服务的`pom.xml`中添加
``` xml
<!--使用热加载-->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-devtools</artifactId>
    <optional>true</optional>
</dependency>
```

`index.html`中需要指定
``` xml
<html lang="en" xmlns:th="http://www.thymeleaf.org">
```
在`gulimall-product`中新建`IndexController`
``` java
@Controller
public class IndexController {
    @Autowired
    CategoryService categoryService;

    @GetMapping({"/", "/index.html"})   // thymeleaf中自动自动配置前缀`classpath:/templates/`
    public String indexPage(Model model) {

        // TODO 1.查出所有的1级分类
        List<CategoryEntity> categoryEntities = categoryService.getLevel1Categorys();

        model.addAttribute("categorys", categoryEntities);
        return "index"; // thymeleaf中自动配置后缀`.html`
    }
}
```
`gulimall-product`中的`CategoryServiceImpl`中
``` java
@Override
public List<CategoryEntity> getLevel1Categorys() {
    List<CategoryEntity> categoryEntities = baseMapper.selectList(new QueryWrapper<CategoryEntity>().eq("parent_cid", 0));
    return categoryEntities;
}
```
`index.html`渲染一级分类
``` html
<div class="header_main_left">
  <ul>
    <li th:each="category : ${categorys}">
      <a href="#" class="header_main_left_a" th:attr="ctg-data = ${category.catId}"><b th:text="${category.name}">家用电器</b></a>
    </li>
  </ul>
</div>
```

#### 渲染二级三级分类数据
`gulimall-product`中根据对应的json结构创建`Catelog2Vo`
``` java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Catelog2Vo {

    /**
     * 一级父分类的id
     */
    private String catalog1Id;

    /**
     * 三级子分类
     */
    private List<Category3Vo> catalog3List;

    private String id;

    private String name;

    /**
     * 三级分类vo
     */
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Category3Vo {

        /**
         * 父分类、二级分类id
         */
        private String catalog2Id;

        private String id;

        private String name;
    }
}
```
`IndexController`
``` java
/**
  * 二级、三级分类数据
  * @return
  */
@GetMapping(value = "/index/catalog.json")
@ResponseBody
public Map<String, List<Catelog2Vo>> getCatalogJson() {
    Map<String, List<Catelog2Vo>> catalogJson = categoryService.getCatalogJson();
    return catalogJson;
}
```
`CategoryServiceImpl`
``` java
@Override
public Map<String, List<Catelog2Vo>> getCatalogJson() {
    // 1.查出所有一级分类
    List<CategoryEntity> level1Categorys = getLevel1Categorys();

    // 2.封装数据
    // 1.每一个一级分类,查到这个一级分类的二级分类
    Map<String, List<Catelog2Vo>> parent_cid = level1Categorys.stream().collect(Collectors.toMap(k -> k.getCatId().toString(), v -> {
        // 1.每一个一级分类,查到这个一级分类的二级分类
        List<CategoryEntity> categoryEntities = baseMapper.selectList(new QueryWrapper<CategoryEntity>().eq("parent_cid", v.getCatId()));

        // 2.封装上面的结果
        List<Catelog2Vo> catelog2Vos = null;
        if (categoryEntities != null) {
            catelog2Vos = categoryEntities.stream().map(l2 -> {
                Catelog2Vo catelog2Vo = new Catelog2Vo(v.getCatId().toString(), null, l2.getCatId().toString(), l2.getName());
                List<CategoryEntity> level3Catelog = baseMapper.selectList(new QueryWrapper<CategoryEntity>().eq(("parent_cid"), l2.getCatId()));
                if (level3Catelog != null) {
                    List<Catelog2Vo.Category3Vo> collect = level3Catelog.stream().map(l3 -> {
                        // 2.封装成指定格式
                        Catelog2Vo.Category3Vo category3Vo = new Catelog2Vo.Category3Vo(l2.getCatId().toString(), l3.getCatId().toString(), l3.getName());
                        return category3Vo;
                    }).collect(Collectors.toList());
                    catelog2Vo.setCatalog3List(collect);
                }
                return catelog2Vo;
            }).collect(Collectors.toList());
        }

        return catelog2Vos;
    }));
    return parent_cid;
}
```
修改`catalogLoader.js`中的接口,从`index/json/catalog.json`修改为`index/catalog.json`

测试: 访问`http://localhost:10000/index/catalog.json`, 若正常返回json数据则成功


### nginx
#### 搭建域名访问环境一(反向代理配置)
##### 修改 Windows hosts 文件
位置：C:\Windows\System32\drivers\etc
在后面追加以下内容(**ip是虚拟机的ip地址**)
``` json
# guli mall #
192.168.56.10	gulimall.com
```

##### 在虚拟机中将nginx设置为自动启动
``` shell
docker update nginx --restart=always
```

此时直接访问`gulimall.com`就是访问我们的虚拟机, 80端口就是访问到nginx中了

##### 配置nginx
**ngin配置文件**
![/GuliaMall/1661572925281.jpg)

我们将docker中nginx目录映射到了虚拟机的`/mydata/nginx`中了, 所以我们直接`vi /mydata/nginx/conf/nginx.conf`查看nginx的配置
``` shell
user  nginx;
worker_processes  1;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile        on;
    #tcp_nopush     on;

    keepalive_timeout  65;

    #gzip  on;

    include /etc/nginx/conf.d/*.conf;
}
```
可以看到，在 `http` 块中最后有 `include /etc/nginx/conf.d/*.conf;` 这句配置说明在 conf.d 目录下所有 .conf 后缀的文件内容都会作为 nginx 配置文件 http 块中的配置。这是为了防止主配置文件太复杂，也可以对不同的配置进行分类。
下面我们参考 conf.d 目录下的配置，来配置 gulimall 的 server 块配置


**gulimall.conf**
默认配置下，我们访问 gulimall.com 会请求 nginx 默认的 index 页面，现在我们要做的是当访问 gulimall.com 的时候转发到我们的商品模块的商城首页界面。

由于虚拟装在我们本机上, 本机和虚拟机将会有个共用的网段, 默认是本机的ip是`192.168.56.1`
所以我们配置当访问 nginx `/`请求时代理到 `192.168.56.1:10000` 商品服务首页
首先我们拷贝一份nginx配置(在`/mydata/nginx/conf/conf.d/`目录下)执行
``` shell
cp default.conf gulimall.conf

# 然后开始编辑gulimall.conf
vi gulimall.conf
```
`gulimall.conf`, 注意配置需要以分号结尾, vim中可以使用`:set number`显示行号
``` shell
server {
    listen       80;
    server_name  gulimall.com;

    #charset koi8-r;
    #access_log  /var/log/nginx/log/host.access.log  main;

    location / {
      proxy_pass http://192.168.56.1:10000;
    }

    #error_page  404              /404.html;

    # redirect server error pages to the static page /50x.html
    #
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}
```
配置并保存后, 还需要重启nginx: `docker restart nginx`

测试: 此时再访问`http://gulimall.com/`就能跳到商城首页了. 
> 转发路径
> 1. `gulimall.com`这个域名由本机的host转发到了`虚拟机(192.168.56.10)`中;
> 2. 虚拟机中的nginx监听`80`端口且来自`gulimall.com`的请求, 转发到`192.168.56.10:10000(主机的1000端口上)`;
> 3. 主机的1000端口运行着我们的product服务, 所以访问`gulimall.com`就相当于访问了`localhost:10000`;


#### 搭建域名访问环境二(负载均衡到网关)
Nginx官网: https://www.nginx.com/

**修改 nginx.conf**
`vi /mydata/nginx/conf/nginx.conf`, 修改 http 块，配置上游服务器为网关地址
```shell

user  nginx;
worker_processes  1;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile        on;
    #tcp_nopush     on;

    keepalive_timeout  65;

    #gzip  on;
    upstream gulimall {
        server 192.168.56.1:88;
    }
    include /etc/nginx/conf.d/*.conf;
}
```

**修改 gulimall.conf**
`vi /mydata/nginx/conf/conf.d/gulimall.conf`, 配置代理地址为上面配置的上游服务器名
```shell
server {
    listen       80;
    server_name  gulimall.com;

    #charset koi8-r;
    #access_log  /var/log/nginx/log/host.access.log  main;

    location / {
      #proxy_set_header Host $host
      proxy_pass http://gulimall;
    }

    #error_page  404              /404.html;

    # redirect server error pages to the static page /50x.html
    #
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}
```
配置完成同样需要重启nginx: `docker restart nginx`

**配置网关**
在`gulimall-gateway`的`application.yml`中配置域名的路由规则
``` yml
- id: gulimall_host_rout #需要放在后面, 优先匹配api/**请求
  uri: lb://gulimall-product
  predicates:
    - Host=**.gulimall.com
```
配置完后重启网关服务

测试访问`gulimall.com`时发现仍然访问不通, 原因时nginx转发时请求的头丢失了, 所以我们需要配置一下`gulimall.conf`
```shell
server {
    listen       80;
    server_name  gulimall.com;

    #charset koi8-r;
    #access_log  /var/log/nginx/log/host.access.log  main;

    location / {
      proxy_set_header Host $host;
      proxy_pass http://gulimall;
    }

    #error_page  404              /404.html;

    # redirect server error pages to the static page /50x.html
    #
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}
```

测试: 访问`http://gulimall.com/`能够正常访问到商城首页, 且访问`http://gulimall.com/api/product/attrattrgrouprelation/list`能偶正常返回json, 则证明成功

![/GuliaMall/1661602383885.jpg)


## 性能压测
### 压力测试
#### 基本介绍
压力测试考察当前软硬件环境下系统所能承受的最大负荷并帮助找出系统瓶颈所在。压测都是为了系统在线上的处理能力和稳定性维持在一个标准范围内，做到心中有数。

使用压力测试，我们有希望找到很多种用其他测试方法更难发现的错误。有两种错误类型是:**内存泄漏，并发与同步**。

有效的压力测试系统将应用以下这些关键条件:**重复，并发，量级，随机变化**。

**性能指标**
* 响应时间（Response Time: RT）
 响应时间指用户从客户端发起一个请求开始，到客户端接收到从服务器端返回的响应结束，整个过程所耗费的时间。
* HPS（Hits Per Second） ：每秒点击次数，单位是次/秒。
* **TPS**（Transaction per Second）：系统每秒处理交易数，单位是笔/秒。
* **QPS**（Query per Second）：系统每秒处理查询次数，单位是次/秒。
 对于互联网业务中，如果某些业务有且仅有一个请求连接，那么TPS=QPS=HPS，一般情况下用 TPS 来衡量整个业务流程，用 QPS 来衡量接口查询次数，用HPS 来表示对服务器单击请求。
* 无论 TPS、QPS、HPS,此指标是衡量系统处理能力非常重要的指标，越大越好，根据经验，一般情况下：
 金融行业：1000TPS~50000TPS，不包括互联网化的活动
 保险行业：100TPS~100000TPS，不包括互联网化的活动
 制造行业：10TPS~5000TPS
 互联网电子商务：10000TPS~1000000TPS
 互联网中型网站：1000TPS~50000TPS
 互联网小型网站：500TPS~10000TPS
* 最大响应时间（Max Response Time） 指用户发出请求或者指令到系统做出反应（响应）的最大时间。
* 最少响应时间（Mininum ResponseTime） 指用户发出请求或者指令到系统做出反应（响应）的最少时间。
* 90%响应时间（90% Response Time） 是指所有用户的响应时间进行排序，第90%的响应时间。
* 从外部看，性能测试主要关注如下三个指标
 吞吐量：每秒钟系统能够处理的请求数、任务数。
 响应时间：服务处理一个请求或一个任务的耗时。
 错误率：一批请求中结果出错的请求所占比例。

#### Apache JMeter
官网下载地址: https://jmeter.apache.org/download_jmeter.cgi

测试过程略

**JMeter在windows 10下地址占用的bug**
压力测试在应用程序加大了, 仍让没有丝毫丝毫好转的迹象. 原因是由于windows本身的策略, tcp/ip默认情况下仅允许1024-5000端口, 并且要四分钟来循环回收他们. 就导致我们在短时间内跑大量的请求时将端口占满了. 根据弹幕, windows 11不存在这个问题

解决方式: 
1. cmd 中，用 regedit 命令打开注册表
2. 在 HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters 下，
   1. 右击 parameters，添加一个新的 DWORD，名字为 MaxUserPort
   2. 然后双击 MaxUserPort，输入数值数据为 65534，基数选择十进制（如果是分布式运行的话，控制机器和负载机器都需要这样操作哦）
3. 修改配置完毕之后记得重启机器才会生效
https://support.microsoft.com/zh-cn/help/196271/when-you-try-to-connect-from-tcp-ports-greater-than-5000-you-receive-t
TCPTimedWaitDelay：30

### 性能监控
**JMeter结果分析**
* 有错误率同开发确认，确定是否允许错误的发生或者错误率允许在多大的范围内；
* Throughput 吞吐量每秒请求的数大于并发数，则可以慢慢的往上面增加；若在压测的机器性能很好的情况下，出现吞吐量小于并发数，说明并发数不能再增加了，可以慢慢的往下减，找到最佳的并发数；
* 压测结束，登陆相应的 web 服务器查看 CPU 等性能指标，进行数据的分析;
* 最大的 tps，不断的增加并发数，加到 tps 达到一定值开始出现下降，那么那个值就是最大的 tps。
* 最大的并发数：最大的并发数和最大的 tps 是不同的概率，一般不断增加并发数，达到一个值后，服务器出现请求超时，则可认为该值为最大的并发数。
* 压测过程出现性能瓶颈，若压力机任务管理器查看到的 cpu、网络和cpu 都正常，未达
到 90%以上，则可以说明服务器有问题，压力机没有问题。
* 影响性能考虑点包括：
  数据库、应用程序、中间件（tomact、Nginx）、网络和操作系统等方面
* 首先考虑自己的应用属于 CPU 密集型还是 IO 密集型

#### 堆内存与垃圾回收 & jvisualvm使用
略

### 优化
#### 中间件对性能的影响 & 简单优化吞吐量
**压测nginx**
访问`192.168.56.1:80`, 过程略  

**压测网关gateway**
访问`localhost:88`, 过程略  

**压测简单服务**
`gulimall-product`中写一个简单服务
``` java
@ResponseBody
@GetMapping(value = "/hello")
public String hello() {
    return "hello";
}
```
访问`localhost:10000/hello`, 过程略  

**压测 gateway+简单服务**
在`gulimall-gateway`的`application.yml`中把简单请求路由加进去
``` YML
- id: product_route
  uri: lb://gulimall-product
  predicates:
    - Path=/api/product/**,/hello
  filters:
    - RewritePath=/api/(?<segment>.*),/$\{segment}
```
访问`localhost:88/hello`, 过程略  

**压测 全链路(nginx+gateway+简单服务)**
访问`gulimall.com:80/helo`, 过程略  

每增加一个中间件, 都会增加一层交互, 交互同样是需要资源的. 中间件越多，性能损失越大，大多都损失在网络交互了；

**压测 首页一级菜单**
访问`localhost:10000`, 过程略  
大概率是由dd, thymeleaf拖慢了

**压测 首页三级分类数据**
访问`localhost:10000/index/catalog.json`, 过程略  
大概率是由db拖慢了

**压测 首页全量数据**
访问`localhost:10000/`, 过程略  
大概率是由静态资源拖慢了

**压测 首页渲染(开缓存)**
修改`gulimall-product`的`application.yml`的thymeleaf缓存
``` yml
spring:
  thymeleaf:
    cache: true
```
访问`localhost:10000/`, 过程略  

**压测 首页渲染(开缓存, 优化数据库, 关日志)**
1. 修改`gulimall-product`的`application.yml`的日志输出级别
    ``` yml
    logging:
      level:
      cn.cheakin.gulimall: error
    ```
2. 给`pms_category`表的`parent_cid`字段加索引  

访问`localhost:10000/`, 过程略  

* 中间件越多，性能损失越大，大多都损失在网络交互了；
* 业务：
  * Db（MySQL 优化）
  * 模板的渲染速度（缓存）
  * 静态资源

#### nginx动静分离
![/GuliaMall/1661789564930.jpg)
1. 首先，把商品服务中静态文件夹 index 放到 nginx 下 /mydata/nginx/html/static目录；
2. 给模板中所有静态资源的请求路径前都加上 /static；
3. 修改 Nginx 配置文件 /mydata/nginx/conf/conf.d/gulimall.conf
  ``` shell
  # /static/ 下所有的请求都转给 nginx
  location /static/ {
    root /usr/share/nginx/html;
  }
  ```
  配置完成后重启nginx: `docker restart nginx`


#### 模拟线上应用内存崩溃宕机
加大JMeter的线程, 比如设置200个线程, 然后访问`localhost:10000/`. 不久服务就会崩溃了......

**调大内存**
在IDE中设置`gulimall-product`的内: `-Xmx1024m -Xms1024m -Xmn512m`(最大内存大小, 初始内存大小, 新生带内存大小).
原因是, Full gc 最会影响性能，根据代码问题，避免 full gc 频率。可以适当调大年轻代容量，让大对象可以在年轻代触发 young gc，调整大对象在年轻代的回收频次，尽可能保证大对象在年轻代回收，减小老年代缩短回收时间；

此时再访问`localhost:10000/`, 相较于之前就已经能正常访问了

#### 优化三级分类数据获取
**性能优化：将数据库的多次查询变为一次**
`CategoryServiceImpl`
``` java
@Override
public Map<String, List<Catelog2Vo>> getCatalogJson() {
    // 性能优化：将数据库的多次查询变为一次
    List<CategoryEntity> selectList = this.baseMapper.selectList(null);

    //1、查出所有分类
    //1、1）查出所有一级分类
    List<CategoryEntity> level1Categories = getParentCid(selectList, 0L);

    //封装数据
    Map<String, List<Catelog2Vo>> parentCid = level1Categories.stream().collect(Collectors.toMap(k -> k.getCatId().toString(), v -> {
        //1、每一个的一级分类,查到这个一级分类的二级分类
        List<CategoryEntity> categoryEntities = getParentCid(selectList, v.getCatId());

        //2、封装上面的结果
        List<Catelog2Vo> catalogs2Vos = null;
        if (categoryEntities != null) {
            catalogs2Vos = categoryEntities.stream().map(l2 -> {
                Catelog2Vo catalogs2Vo = new Catelog2Vo(v.getCatId().toString(), null, l2.getCatId().toString(), l2.getName().toString());

                //1、找当前二级分类的三级分类封装成vo
                List<CategoryEntity> level3Catelog = getParentCid(selectList, l2.getCatId());

                if (level3Catelog != null) {
                    List<Catelog2Vo.Category3Vo> category3Vos = level3Catelog.stream().map(l3 -> {
                        //2、封装成指定格式
                        Catelog2Vo.Category3Vo category3Vo = new Catelog2Vo.Category3Vo(l2.getCatId().toString(), l3.getCatId().toString(), l3.getName());

                        return category3Vo;
                    }).collect(Collectors.toList());
                    catalogs2Vo.setCatalog3List(category3Vos);
                }

                return catalogs2Vo;
            }).collect(Collectors.toList());
        }

        return catalogs2Vos;
    }));

    return parentCid;
}

private List<CategoryEntity> getParentCid(List<CategoryEntity> selectList, Long parent_cid) {
    return selectList.stream().filter(item -> item.getParentCid().equals(parent_cid)).collect(Collectors.toList());
}
```
压测, 访问`localhost:10000/index/catalog.json`

## 缓存
### 缓存使用
#### 本地缓存与分布式缓存
**哪些数据适合放入缓存？**
* 即时性、数据一致性要求不高的
* 访问量大且更新频率不高的数据（读多，写少）
![/GuliaMall/1661863979953.jpg)

**本地缓存**
`CategoryServiceImpl`
``` java
private Map<String, Object> cache = new HashMap<>();

@Override
public Map<String, List<Catelog2Vo>> getCatalogJson() {

    // 本地缓存
    Map<String, List<Catelog2Vo>> catalogJson  = (Map<String, List<Catelog2Vo>>)cache.get("catalogJson");

    if (catalogJson == null) {
        List<CategoryEntity> selectList = this.baseMapper.selectList(null);

        //1、查出所有分类
        //1、1）查出所有一级分类
        List<CategoryEntity> level1Categories = getParentCid(selectList, 0L);

        //封装数据
        Map<String, List<Catelog2Vo>> parentCid = level1Categories.stream().collect(Collectors.toMap(k -> k.getCatId().toString(), v -> {
            //1、每一个的一级分类,查到这个一级分类的二级分类
            List<CategoryEntity> categoryEntities = getParentCid(selectList, v.getCatId());

            //2、封装上面的结果
            List<Catelog2Vo> catalogs2Vos = null;
            if (categoryEntities != null) {
                catalogs2Vos = categoryEntities.stream().map(l2 -> {
                    Catelog2Vo catalogs2Vo = new Catelog2Vo(v.getCatId().toString(), null, l2.getCatId().toString(), l2.getName().toString());

                    //1、找当前二级分类的三级分类封装成vo
                    List<CategoryEntity> level3Catelog = getParentCid(selectList, l2.getCatId());

                    if (level3Catelog != null) {
                        List<Catelog2Vo.Category3Vo> category3Vos = level3Catelog.stream().map(l3 -> {
                            //2、封装成指定格式
                            Catelog2Vo.Category3Vo category3Vo = new Catelog2Vo.Category3Vo(l2.getCatId().toString(), l3.getCatId().toString(), l3.getName());

                            return category3Vo;
                        }).collect(Collectors.toList());
                        catalogs2Vo.setCatalog3List(category3Vos);
                    }

                    return catalogs2Vo;
                }).collect(Collectors.toList());
            }

            return catalogs2Vos;
        }));

        cache.put("catalogJson", parentCid);
        return parentCid;
    }

    return catalogJson;
}
```
本地缓存的方式, 在单体应用中没有问题; 但在分布式服务中, 数据无法保证同时更新, 所以在分布式中无法使用本地缓存.

所以可以选择使用**缓存中间件**来解决这个问题, 如: redis
![/GuliaMall/1661865417745.jpg)


#### 整合redis测试
虚拟机初始化时已安装 Redis  

在`gulimall-product`的`pom.yml`中引入redis
``` xml
<!-- redis -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```
并且在`application.yml`中配置redis地址等信息(端口默认就是6379)
``` yml
spring:
  redis:
    host: 192.168.50.10
    port: 6379
```
在`gulimall-product`的`GulimallProductApplicationTests`中写单测试
``` java
@Autowired
StringRedisTemplate stringRedisTemplate;
@Test
public void teststringRedisTemplate() {
    // hello world
    ValueOperations<String, String> ops = stringRedisTemplate.opsForValue();

    // 保存
    ops.set("hello", "world_" + UUID.randomUUID().toString());

    // 查询
    ops.get("hello");
}
```

#### 改造三级分类业务
`CategoryServiceImpl`, 顺便将 从数据库查询 封装为 getCatalogJsonFromDB() 方法
``` java
@Autowired
StringRedisTemplate redisTemplate;

@Override
public Map<String, List<Catelog2Vo>> getCatalogJson() {
    //1、加入缓存逻辑
    String catalogJson = redisTemplate.opsForValue().get("catalogJson");
    if (StringUtils.isEmpty(catalogJson)) {
        //2、缓存中没有
        Map<String, List<Catelog2Vo>> catalogJsonFromDB = getCatalogJsonFromDB();
        // 3、查询到的数据存放到缓存中，将对象转成 JSON 存储
        redisTemplate.opsForValue().set("catalogJSON", JSONUtil.toJsonStr(catalogJsonFromDB));
        return catalogJsonFromDB;
    }
    TypeReference<Map<String, List<Catelog2Vo>>> typeReference = new TypeReference<Map<String, List<Catelog2Vo>>>() {
    };
    Map<String, List<Catelog2Vo>> result = JSONUtil.toBean(catalogJson, typeReference, true);
    return result;
}

// 从数据库查询并封装分类数据
public Map<String, List<Catelog2Vo>> getCatalogJsonFromDB() {
    System.out.println("查询了数据库");

    // 性能优化：将数据库的多次查询变为一次
    List<CategoryEntity> selectList = this.baseMapper.selectList(null);

    //1、查出所有分类
    //1、1）查出所有一级分类
    List<CategoryEntity> level1Categories = getParentCid(selectList, 0L);

    //封装数据
    Map<String, List<Catelog2Vo>> parentCid = level1Categories.stream().collect(Collectors.toMap(k -> k.getCatId().toString(), v -> {
        //1、每一个的一级分类,查到这个一级分类的二级分类
        List<CategoryEntity> categoryEntities = getParentCid(selectList, v.getCatId());

        //2、封装上面的结果
        List<Catelog2Vo> catalogs2Vos = null;
        if (categoryEntities != null) {
            catalogs2Vos = categoryEntities.stream().map(l2 -> {
                Catelog2Vo catalogs2Vo = new Catelog2Vo(v.getCatId().toString(), null, l2.getCatId().toString(), l2.getName().toString());

                //1、找当前二级分类的三级分类封装成vo
                List<CategoryEntity> level3Catelog = getParentCid(selectList, l2.getCatId());

                if (level3Catelog != null) {
                    List<Catelog2Vo.Category3Vo> category3Vos = level3Catelog.stream().map(l3 -> {
                        //2、封装成指定格式
                        Catelog2Vo.Category3Vo category3Vo = new Catelog2Vo.Category3Vo(l2.getCatId().toString(), l3.getCatId().toString(), l3.getName());

                        return category3Vo;
                    }).collect(Collectors.toList());
                    catalogs2Vo.setCatalog3List(category3Vos);
                }

                return catalogs2Vo;
            }).collect(Collectors.toList());
        }

        return catalogs2Vos;
    }));

    return parentCid;
}
```
访问`localhost:10000/index/catalog.json`后, 查看redis中就会缓存相应的数据了

#### 压力测试出的内存泄露及解决
压测, 访问`localhost:10000/index/catalog.json`. 这里可能会产生堆外内存溢出异常：OutOfDirectMemoryError。
下面进行分析：
* SpringBoot 2.0 以后默认使用 lettuce 作为操作 redis 的客户端，它使用 netty 进行网络通信；
* lettuce 的 bug 导致 netty 堆外内存溢出；
* netty 如果没有指定堆外内存，默认使用 -Xmx 参数指定的内存； 
* 可以通过 -Dio.netty.maxDirectMemory 进行设置；
解决方案：不能只使用 -Dio.netty.maxDirectMemory 去调大堆外内存，这样只会延缓异常出现的时间。

升级 lettuce 客户端，或使用 jedis 客户端
`gulimall-product`的`pom.yml`中
``` xml
<!-- redis -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
    <exclusions>
        <exclusion>
            <groupId>io.lettuce</groupId>
            <artifactId>lettuce-core</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
  <groupId>redis.clients</groupId>
  <artifactId>jedis</artifactId>
</dependency>
```
再次压测, 访问`localhost:10000/index/catalog.json`

#### 缓存击穿、穿透、雪崩
1. 缓存穿透
   缓存穿透是指查询一个一定不存在的数据，由于缓存是不命中，将去查询数据库，但是数据库也无此记录，我们没有将这次查询的 null 写入缓存，这将导致这个不存在的数据每次请求都要到存储层去查询，失去了缓存的意义。
   在流量大时，可能 DB 就挂掉了，要是有人利用不存在的 key 频繁攻击我们的应用，这就是漏洞。  
   **解决**：缓存空结果、并且设置短的过期时间。
2. 缓存雪崩
   缓存雪崩是指在我们设置缓存时采用了相同的过期时间，导致缓存在某一时刻同时失效，请求全部转发到 DB，DB 瞬时压力过重雪崩。  
   解决：原有的失效时间基础上增加一个随机值，比如 1-5 分钟随机，这样每一个缓存的过期时间的重复率就会降低，就很难引发集体失效的事件。
3. 缓存击穿
   对于一些设置了过期时间的 key，如果这些 key 可能会在某些时间点被超高并发地访问，是一种非常“热点”的数据。
   这个时候，需要考虑一个问题：如果这个 key 在大量请求同时进来前正好失效，那么所有对这个 key 的数据查询都落到 db，我们称为缓存击穿。
   **解决**：加锁

**解决缓存缓存穿透**
解决缓存缓存穿透, 给数据加上过期时间
`guliamall-product`的`CategoryServiceImpl`
``` java
@Override
public Map<String, List<Catelog2Vo>> getCatalogJson() {
    //1、加入缓存逻辑
    String catalogJson = redisTemplate.opsForValue().get("catalogJson");
    if (StringUtils.isEmpty(catalogJson)) {
        //2、缓存中没有
        Map<String, List<Catelog2Vo>> catalogJsonFromDB = getCatalogJsonFromDB();
        // 3、查询到的数据存放到缓存中，将对象转成 JSON 存储
//            redisTemplate.opsForValue().set("catalogJSON", JSONUtil.toJsonStr(catalogJsonFromDB));
        String s = JSONUtil.toJsonStr(catalogJsonFromDB);
        redisTemplate.opsForValue().set("catalogJSON", JSONUtil.toJsonStr(catalogJsonFromDB), 1, TimeUnit.DAYS);
        return catalogJsonFromDB;
    }
    TypeReference<Map<String, List<Catelog2Vo>>> typeReference = new TypeReference<Map<String, List<Catelog2Vo>>>() {
    };
    Map<String, List<Catelog2Vo>> result = JSONUtil.toBean(catalogJson, typeReference, true);
    return result;
}
```

#### 加锁解决缓存击穿问题 & 本地所在分布式下的问题
给查询实例线程加锁
`CategoryServiceImpl`
``` java
@Override
public Map<String, List<Catelog2Vo>> getCatalogJson() {
    //1、加入缓存逻辑
    String catalogJson = redisTemplate.opsForValue().get("catalogJson");
    if (StringUtils.isEmpty(catalogJson)) {
      System.out.println("缓存未命中,即将查数据库");
        //2、缓存中没有
        Map<String, List<Catelog2Vo>> catalogJsonFromDB = getCatalogJsonFromDB();
        return catalogJsonFromDB;
    }
    TypeReference<Map<String, List<Catelog2Vo>>> typeReference = new TypeReference<Map<String, List<Catelog2Vo>>>() {};
    Map<String, List<Catelog2Vo>> result = JSONUtil.toBean(catalogJson, typeReference, true);
    return result;
}

public Map<String, List<Catelog2Vo>> getCatalogJsonFromDB() {
    System.out.println("查询了数据库");
    // 加实例的线程锁查询
    //只要是同一把锁, 就能锁住,需要这个锁的所有线程
    //1.synchronized (this): SpringBoot所有的组件在容器中都是单例的
    synchronized (this) {
        //得到锁以后, 我们应该再去缓存中确定一次, 如果没有才需要继续查询
        String catalogJson = redisTemplate.opsForValue().get("catalogJson");
        if (!StringUtils.isEmpty(catalogJson)) {
            Map<String, List<Catelog2Vo>> result = JSONUtil.toBean(catalogJson, new TypeReference<Map<String, List<Catelog2Vo>>>() {
            }, true);
            return result;
        }

        List<CategoryEntity> selectList = this.baseMapper.selectList(null);

        //1、查出所有分类
        //1、1）查出所有一级分类
        List<CategoryEntity> level1Categories = getParentCid(selectList, 0L);

        //封装数据
        Map<String, List<Catelog2Vo>> parentCid = level1Categories.stream().collect(Collectors.toMap(k -> k.getCatId().toString(), v -> {
            //1、每一个的一级分类,查到这个一级分类的二级分类
            List<CategoryEntity> categoryEntities = getParentCid(selectList, v.getCatId());

            //2、封装上面的结果
            List<Catelog2Vo> catalogs2Vos = null;
            if (categoryEntities != null) {
                catalogs2Vos = categoryEntities.stream().map(l2 -> {
                    Catelog2Vo catalogs2Vo = new Catelog2Vo(v.getCatId().toString(), null, l2.getCatId().toString(), l2.getName().toString());

                    //1、找当前二级分类的三级分类封装成vo
                    List<CategoryEntity> level3Catelog = getParentCid(selectList, l2.getCatId());

                    if (level3Catelog != null) {
                        List<Catelog2Vo.Category3Vo> category3Vos = level3Catelog.stream().map(l3 -> {
                            //2、封装成指定格式
                            Catelog2Vo.Category3Vo category3Vo = new Catelog2Vo.Category3Vo(l2.getCatId().toString(), l3.getCatId().toString(), l3.getName());

                            return category3Vo;
                        }).collect(Collectors.toList());
                        catalogs2Vo.setCatalog3List(category3Vos);
                    }

                    return catalogs2Vo;
                }).collect(Collectors.toList());
            }

            return catalogs2Vos;
        }));
        // 3、查询到的数据存放到缓存中，将对象转成 JSON 存储
//            redisTemplate.opsForValue().set("catalogJSON", JSONUtil.toJsonStr(catalogJsonFromDB));
        String s = JSONUtil.toJsonStr(parentCid);
        redisTemplate.opsForValue().set("catalogJSON", JSONUtil.toJsonStr(parentCid), 1, TimeUnit.DAYS);

        return parentCid;
    }
}
```
给实例加锁的方式在单体应用中可以, 但在分布式中就无法有效的锁住了
![/GuliaMall/1661960337842.jpg)

### 分布式锁
#### 分布式锁原理与原理
redis 中有一个 SETNX 命令，该命令会向 redis 中保存一条数据，如果不存在则保存成功，存在则返回失败。
我们约定保存成功即为加锁成功，之后加锁成功的线程才能执行真正的业务操作。
![/GuliaMall/1662036584048.jpg)

`CategoryServiceImpl`
``` java
public Map<String, List<Catelog2Vo>> getCatalogJsonFromDbWithRedisLock() {

    //1、占分布式锁。去redis占坑      设置过期时间必须和加锁是同步的，保证原子性（避免死锁）
    String uuid = UUID.randomUUID().toString();
    Boolean lock = redisTemplate.opsForValue().setIfAbsent("lock", uuid, 300, TimeUnit.SECONDS);
    if (lock) {
        System.out.println("获取分布式锁成功...");
        Map<String, List<Catelog2Vo>> dataFromDb = null;
        try {
            //加锁成功...执行业务
            //2、设置过期时间，必须和加锁是同步的，是原子的
            //redisTemplate.expire("lock", 30, TimeUnit.SECONDS);
            dataFromDb = getDataFromDb();
        } finally {
            // lua 脚本解锁
            String script = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
            // 删除锁
            redisTemplate.execute(new DefaultRedisScript<>(script, Long.class), Arrays.asList("lock"), uuid);
        }
        //先去redis查询下保证当前的锁是自己的
        //获取值对比，对比成功删除=原子性  lua脚本解锁
          /*String lockValue = redisTemplate.opsForValue().get("lock");
          if (uuid.equals(lockValue)) {
              //删除我自己的锁
              redisTemplate.delete("lock");
          }*/
        return dataFromDb;
    } else {
        System.out.println("获取分布式锁失败...等待重试...");
        //加锁失败...重试机制
        //休眠一百毫秒
        try {
            TimeUnit.MILLISECONDS.sleep(100);
        } catch (Exception e) {

        }
        return getCatalogJsonFromDbWithRedisLock();     //自旋的方式
    }
}

private Map<String, List<Catelog2Vo>> getDataFromDb() {
    String catalogJson = redisTemplate.opsForValue().get("catalogJson");
    if (!StringUtils.isEmpty(catalogJson)) {
        Map<String, List<Catelog2Vo>> result = JSONUtil.toBean(catalogJson, new TypeReference<Map<String, List<Catelog2Vo>>>() {
        }, true);
        return result;
    }
    System.out.println("查询了数据库......");

    List<CategoryEntity> selectList = this.baseMapper.selectList(null);

    List<CategoryEntity> level1Categories = getParentCid(selectList, 0L);

    //封装数据
    Map<String, List<Catelog2Vo>> parentCid = level1Categories.stream().collect(Collectors.toMap(k -> k.getCatId().toString(), v -> {
        //1、每一个的一级分类,查到这个一级分类的二级分类
        List<CategoryEntity> categoryEntities = getParentCid(selectList, v.getCatId());

        //2、封装上面的结果
        List<Catelog2Vo> catalogs2Vos = null;
        if (categoryEntities != null) {
            catalogs2Vos = categoryEntities.stream().map(l2 -> {
                Catelog2Vo catalogs2Vo = new Catelog2Vo(v.getCatId().toString(), null, l2.getCatId().toString(), l2.getName().toString());

                //1、找当前二级分类的三级分类封装成vo
                List<CategoryEntity> level3Catelog = getParentCid(selectList, l2.getCatId());

                if (level3Catelog != null) {
                    List<Catelog2Vo.Category3Vo> category3Vos = level3Catelog.stream().map(l3 -> {
                        //2、封装成指定格式
                        Catelog2Vo.Category3Vo category3Vo = new Catelog2Vo.Category3Vo(l2.getCatId().toString(), l3.getCatId().toString(), l3.getName());

                        return category3Vo;
                    }).collect(Collectors.toList());
                    catalogs2Vo.setCatalog3List(category3Vos);
                }

                return catalogs2Vo;
            }).collect(Collectors.toList());
        }

        return catalogs2Vos;
    }));

    String s = JSONUtil.toJsonStr(parentCid);
    redisTemplate.opsForValue().set("catalogJSON", JSONUtil.toJsonStr(parentCid), 1, TimeUnit.DAYS);

    return parentCid;
}
```
压测, 访问`localhost:10000/index/catalog.json`, 发现四个服务仅查询了一次数据库

#### Redisson
##### 简介&整合 & lock锁测试 & lock看门狗原理-redisson如何解决死锁
Redisson官方文档: https://github.com/redisson/redisson/wiki
1. 引入依赖
    `pom.yml`中引入redisson
    ``` yml
    <dependency>
      <groupId>org.redisson</groupId>
      <artifactId>redisson</artifactId>
      <version>3.17.6</version>
    </dependency>
    ```
2. 配置 redisson
    创建`MyRedissonConfig`类
    ``` java
    @Configuration
    public class MyRedissonConfig {

        /**
        * 所有对 Redisson 的使用都是通过 RedissonClient
        *
        * @return
        * @throws IOException
        */
        @Bean(destroyMethod = "shutdown")
        public RedissonClient redisson() throws IOException {
            // 1、创建配置
            Config config = new Config();
            // Redis url should start with redis:// or rediss://
            config.useSingleServer().setAddress("redis://192.168.56.10:6379");

            // 2、根据 Config 创建出 RedissonClient 实例
            return Redisson.create(config);
        }

    }
    ```
3. 使用
    基于Redis的Redisson分布式可重入锁RLock Java对象实现了java.util.concurrent.locks.Lock接口。同时还提供了异步（Async）、反射式（Reactive）和RxJava2标准的接口。
    
    在`/hello`接口中测试
    `IndexController`
    ``` java
    @ResponseBody
    @GetMapping(value = "/hello")
    public String hello() {
        //1、获取一把锁，只要锁的名字一样，就是同一把锁
        RLock myLock = redisson.getLock("my-lock");
        //2、加锁
        myLock.lock();      //阻塞式等待。默认加的锁都是30s
        //1）、锁的自动续期，如果业务超长，运行期间自动锁上新的30s。不用担心业务时间长，锁自动过期被删掉
        //2）、加锁的业务只要运行完成，就不会给当前锁续期，即使不手动解锁，锁默认会在30s内自动过期，不会产生死锁问题

        // myLock.lock(10,TimeUnit.SECONDS);   //10秒钟自动解锁,自动解锁时间一定要大于业务执行时间
        //问题：在锁时间到了以后，不会自动续期
        //1、如果我们传递了锁的超时时间，就发送给redis执行脚本，进行占锁，默认超时就是 我们制定的时间
        //2、如果我们指定锁的超时时间，就使用 lockWatchdogTimeout = 30 * 1000 【看门狗默认时间】
        //只要占锁成功，就会启动一个定时任务【重新给锁设置过期时间，新的过期时间就是看门狗的默认时间】,每隔10秒都会自动的再次续期，续成30秒
        // internalLockLeaseTime 【看门狗时间】 / 3， 10s
        try {
            System.out.println("加锁成功，执行业务..." + Thread.currentThread().getId());
            try { TimeUnit.SECONDS.sleep(20); } catch (InterruptedException e) { e.printStackTrace(); }
        } catch (Exception ex) {
            ex.printStackTrace();
        } finally {
            //3、解锁  假设解锁代码没有运行，Redisson会不会出现死锁
            System.out.println("释放锁..." + Thread.currentThread().getId());
            myLock.unlock();
        }
        return "hello";
    }
    ```
* 锁的自动续期，如果业务时间很长，运行期间自动给锁续期 30 s，不用担心业务时间过长，锁自动过期被删掉；
* 加锁的业务只要运行完成，就不会给当前锁续期，即使不手动续期，默认也会在 30 s 后解锁；

##### 读写锁测试 & 读写锁补充
`IndexController`
``` java
@Autowired
StringRedisTemplate stringRedisTemplate;

/**
  * 保证一定能读到最新数据，修改期间，写锁是一个排它锁（互斥锁、独享锁），读锁是一个共享锁
  * 写锁没释放读锁必须等待
  * 读 + 读 ：相当于无锁，并发读，只会在Redis中记录好，所有当前的读锁。他们都会同时加锁成功
  * 写 + 读 ：必须等待写锁释放
  * 写 + 写 ：阻塞方式
  * 读 + 写 ：有读锁。写也需要等待
  * 只要有读或者写的存都必须等待
  * @return
  */
@GetMapping(value = "/write")
@ResponseBody
public String writeValue() {
    String s = "";
    RReadWriteLock readWriteLock = redisson.getReadWriteLock("rw-lock");
    RLock rLock = readWriteLock.writeLock();
    try {
        //1、改数据加写锁，读数据加读锁
        rLock.lock();
        s = UUID.randomUUID().toString();
        TimeUnit.SECONDS.sleep(3000);
        stringRedisTemplate.opsForValue().set("writeValue",s);
    } catch (InterruptedException e) {
        e.printStackTrace();
    } finally {
        rLock.unlock();
    }
    return s;
}

@GetMapping(value = "/read")
@ResponseBody
public String readValue() {
    String s = "";
    RReadWriteLock readWriteLock = redisson.getReadWriteLock("rw-lock");
    //加读锁
    RLock rLock = readWriteLock.readLock();
    rLock.lock();
    try {
        //TimeUnit.SECONDS.sleep(3000);
        s = stringRedisTemplate.opsForValue().get("writeValue");
        try { TimeUnit.SECONDS.sleep(10); } catch (InterruptedException e) { e.printStackTrace(); }
    } catch (Exception e) {
        e.printStackTrace();
    } finally {
        rLock.unlock();
    }
    return s;
}
```

##### 闭锁测试
`IndexController`
``` java
/**
  * 放假、锁门
  * 1班没人了
  * 5个班，全部走完，我们才可以锁大门
  * 分布式闭锁
  */
@GetMapping(value = "/lockDoor")
@ResponseBody
public String lockDoor() throws InterruptedException {
    RCountDownLatch door = redisson.getCountDownLatch("door");
    door.trySetCount(5);
    door.await();       //等待闭锁完成
    return "放假了...";
}

@GetMapping(value = "/gogogo/{id}")
@ResponseBody
public String gogogo(@PathVariable("id") Long id) {
    RCountDownLatch door = redisson.getCountDownLatch("door");
    door.countDown();       //计数-1
    return id + "班的人都走了...";
}
```

##### 信号量测试
`IndexController`
``` java
/**
  * 车库停车
  * 3车位
  * 信号量也可以做分布式限流
  */
@GetMapping(value = "/park")
@ResponseBody
public String park() throws InterruptedException {
    RSemaphore park = redisson.getSemaphore("park");
    park.acquire();     //获取一个信号、获取一个值,占一个车位
    boolean flag = park.tryAcquire();
    if (flag) {
        //执行业务
    } else {
        return "error";
    }
    return "ok=>" + flag;
}

@GetMapping(value = "/go")
@ResponseBody
public String go() {
    RSemaphore park = redisson.getSemaphore("park");
    park.release();     //释放一个车位
    return "ok";
}
```

#### 缓存一致性
**双写模式**
![/GuliaMall/1662216036683.jpg)

**失效模式**
![/GuliaMall/1662216345680.jpg)

* 无论是双写模式还是失效模式，都会导致缓存的不一致问题。即多个实例同时更新会出事。怎么办？
  1. 如果是用户维度数据（订单数据、用户数据），这种并发几率非常小，不用考虑这个问题，缓存数据加 上过期时间，每隔一段时间触发读的主动更新即可
  2. 如果是菜单，商品介绍等基础数据，也可以去使用canal订阅binlog的方式。
  3. 缓存数据+过期时间也足够解决大部分业务对于缓存的要求。
  4. 通过加锁保证并发读写，写写的时候按顺序排好队。读读无所谓。所以适合使用读写锁。（业务不关心 脏数据，允许临时脏数据可忽略）；

* 总结：
  * 我们能放入缓存的数据本就不应该是实时性、一致性要求超高的。所以缓存数据的时候加上过期时间，保 证每天拿到当前最新数据即可。
  * 我们不应该过度设计，增加系统的复杂性
  * 遇到实时性、一致性要求高的数据，就应该查数据库，即使慢点。

**Cannal**
![/GuliaMall/1662217400314.jpg)

`CategoryServiceImpl`
``` java
@Autowired
RedissonClient redisson;

/**
  * 缓存里的数据如何和数据库的数据保持一致？？
  * 缓存数据一致性
  * 1)、双写模式
  * 2)、失效模式
  * @return
  */
public Map<String, List<Catelog2Vo>> getCatalogJsonFromDbWithRedissonLock() {

    //1、占分布式锁。去redis占坑
    //（锁的粒度，越细越快:具体缓存的是某个数据，11号商品） product-11-lock
    RLock lock = redisson.getLock("catalogJson-lock");
    lock.lock();

    Map<String, List<Catelog2Vo>> dataFromDb = null;
    try {
        dataFromDb = getDataFromDb();
    } finally {
        lock.unlock();
    }

    return dataFromDb;
}
```

### SpringCache
#### 简介
官方文档: https://docs.spring.io/spring-framework/docs/5.2.22.RELEASE/spring-framework-reference/integration.html#cache

**基础概念**
![/GuliaMall/1662219184233.jpg)

#### 整合&体验@Cache
**引入依赖**
redis(已引入), cache, 在`gulimall-product`的`pom.xml`中引入
```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-cache</artifactId>
</dependency>
```

**写配置**
* 自动配置了：
  - CacheAutoConfiguration 会导入 RedisCacheConfiguration;
  - 会自动装配缓存管理器 RedisCacheManager;
* 手动配置：
  新建`application.properties`
  ``` yml
  spring.cache.type=redis

  #spring.cache.cache-names=qq
  ```
**测试使用缓存**
1. 常用注解:  
  `@Cacheable` ：触发将数据保存到缓存的操作
  `@CacheEvict`: 触发将数据从缓存删除的操作；
  `@CachePut`：不影响方法执行更新缓存；
  `@Cacheing`：组合以上多个操作；
  `@CacheConfig`：在类级别共享缓存的相同配置；
2. 开启缓存功能
   在启动类上使用`@@EnableCaching`注解
3. 只需要注解就能完成缓存操作
   `CategoryServiceImpl`
   ``` java
   //每一个需要缓存的数据我们都来指定要放到那个名字的缓存。【缓存的分区(按照业务类型分)】
   @Cacheable(value = {"category"})  //代表当前方法的结果需要缓存，如果缓存中有，方法都不用调用，如果缓存中没有，会调用方法。最后将方法的结果放入缓存
   @Override
   public List<CategoryEntity> getLevel1Categorys() {
       List<CategoryEntity> categoryEntities = baseMapper.selectList(new QueryWrapper<CategoryEntity>().eq("parent_cid", 0));
       return categoryEntities;
   }
   ```
   测试, 访问`localhost:10000`, 首页出现后, 查看redis就会出现响应的缓存数据了
  
#### @Cacheeable细节设置
`pom.xml`中设置过期时间
``` xml
spring.cache.redis.time-to-live=3600000
```
``
``` java
/**
  * 1、每一个需要缓存的数据我们都来指定要放到那个名字的缓存。【缓存的分区(按照业务类型分)】
  * 2、@Cacheable(value = {"category"})
  *      代表当前方法的结果需要缓存，
  *      如果缓存中有，方法都不用调用，如果缓存中没有，会调用方法。最后将方法的结果放入缓存
  * 3、默认行为
  *   3.1 如果缓存中有，方法不再调用
  *   3.2 key是默认生成的:缓存的名字::SimpleKey::[](自动生成key值)
  *   3.3 缓存的value值，默认使用jdk序列化机制，将序列化的数据存到redis中
  *   3.4 默认ttl时间是 -1：
  *
  *   自定义操作：key的生成
  *    1. 指定生成缓存的key：        key属性指定，接收一个 SpEl
  *    2. 指定缓存的数据的存活时间:  配置文档中修改存活时间 ttl
  *    3. 将数据保存为json格式:     自定义配置类 MyCacheManager
  */
@Cacheable(value = {"category"}, key = "#root.method.name")
@Override
public List<CategoryEntity> getLevel1Categorys() {
    List<CategoryEntity> categoryEntities = baseMapper.selectList(new QueryWrapper<CategoryEntity>().eq("parent_cid", 0));
    return categoryEntities;
}
```

#### 自定义缓存配置
新建`MyCacheConfig`配置类
``
``` java
@EnableConfigurationProperties(CacheProperties.class)
@Configuration
@EnableCaching
public class MyCacheConfig {

//    @Autowired
//    CacheProperties cacheProperties;

    /**
     * 配置文件的配置没有用上
     * 1. 原来和配置文件绑定的配置类为：@ConfigurationProperties(prefix = "spring.cache")
     *                                public class CacheProperties
     * 2. 要让他生效，要加上 @EnableConfigurationProperties(CacheProperties.class)
     */
    @Bean
    public RedisCacheConfiguration redisCacheConfiguration(CacheProperties cacheProperties) {

        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig();
        // config = config.entryTtl();
        config = config.serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()));
        config = config.serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()));

        CacheProperties.Redis redisProperties = cacheProperties.getRedis();
        //将配置文件中所有的配置都生效
        if (redisProperties.getTimeToLive() != null) {
            config = config.entryTtl(redisProperties.getTimeToLive());
        }
        if (redisProperties.getKeyPrefix() != null) {
            config = config.prefixKeysWith(redisProperties.getKeyPrefix());
        }
        if (!redisProperties.isCacheNullValues()) {
            config = config.disableCachingNullValues();
        }
        if (!redisProperties.isUseKeyPrefix()) {
            config = config.disableKeyPrefix();
        }
        return config;
    }

}
```
`application.yml`新增配置
``` yml
#如果指定了前缀就用我们指定的前缀，如果没有就默认使用缓存的名字作为前缀
spring.cache.redis.key-prefix=CACHE_
spring.cache.redis.use-key-prefix=false

#是否缓存空值，防止缓存穿透
spring.cache.redis.cache-null-values=true
```

#### @CacheEvict
`CategoryServiceImpl`
``` java
/**
  * 级联更新所有关联的数据
  * @CacheEvict: 失效模式
  * @param category
  */
@CacheEvict(value = "category", key = "getLevel1Categorys")
@Transactional
@Override
public void updateCascade(CategoryEntity category) {
    this.updateById(category);
    categoryBrandRelationService.updateCategory(category.getCatId(), category.getName());

    // 同修改缓存中的数据
    //redis.del('catelogJson'); 等待下次主动查询时更新
}

@Cacheable(value = "category", key = "#root.methodName")
@Override
public Map<String, List<Catelog2Vo>> getCatalogJson() {
    System.out.println("查询了数据库");
    List<CategoryEntity> selectList = this.baseMapper.selectList(null);
    List<CategoryEntity> level1Categories = getParentCid(selectList, 0L);

    //封装数据
    Map<String, List<Catelog2Vo>> parent_cid = level1Categories.stream().collect(Collectors.toMap(k -> k.getCatId().toString(), v -> {
        //1、每一个的一级分类,查到这个一级分类的二级分类
        List<CategoryEntity> categoryEntities = getParentCid(selectList, v.getCatId());

        //2、封装上面的结果
        List<Catelog2Vo> catalogs2Vos = null;
        if (categoryEntities != null) {
            catalogs2Vos = categoryEntities.stream().map(l2 -> {
                Catelog2Vo catalogs2Vo = new Catelog2Vo(v.getCatId().toString(), null, l2.getCatId().toString(), l2.getName().toString());
                //1、找当前二级分类的三级分类封装成vo
                List<CategoryEntity> level3Catelog = getParentCid(selectList, l2.getCatId());
                if (level3Catelog != null) {
                    List<Catelog2Vo.Category3Vo> category3Vos = level3Catelog.stream().map(l3 -> {
                        //2、封装成指定格式
                        Catelog2Vo.Category3Vo category3Vo = new Catelog2Vo.Category3Vo(l2.getCatId().toString(), l3.getCatId().toString(), l3.getName());
                        return category3Vo;
                    }).collect(Collectors.toList());
                    catalogs2Vo.setCatalog3List(category3Vos);
                }

                return catalogs2Vo;
            }).collect(Collectors.toList());
        }

        return catalogs2Vos;
    }));

    return parent_cid;
}

//    @Override
public Map<String, List<Catelog2Vo>> getCatalogJson2() {
    //1、加入缓存逻辑
    String catalogJson = redisTemplate.opsForValue().get("catalogJson");
    if (StringUtils.isEmpty(catalogJson)) {
        System.out.println("缓存未命中,即将查数据库");
        //2、缓存中没有
        Map<String, List<Catelog2Vo>> catalogJsonFromDB = getCatalogJsonFromDbWithRedisLock();
        return catalogJsonFromDB;
    }
    TypeReference<Map<String, List<Catelog2Vo>>> typeReference = new TypeReference<Map<String, List<Catelog2Vo>>>() {
    };
    Map<String, List<Catelog2Vo>> result = JSONUtil.toBean(catalogJson, typeReference, true);
    return result;
}
```
测试, 访问`gulimall.com`, 可以看到redis中缓存了两个对应的数据, 且刷新页面时不会再次查询数据库

**一次操作多个缓存**
`CategoryServiceImpl`
``` java
/**
  * 级联更新所有关联的数据
  * @CacheEvict: 失效模式
  * 1. 同时进行多个缓存操作： @Caching
  * 2. 指定删除某个分区下的所有数据    @CacheEvict(value = {"category"}, allEntries = true)
  * 3. 存储统一类型的数据, 都可以指定成统一分区. 分区名默认就是缓存的前缀
  * @param category
  */
//    @CacheEvict(value = "category", key = "'getLevel1Categorys'")
/*@Caching(evict = {
        @CacheEvict(value = "category", key = "'getLevel1Categorys'"),
        @CacheEvict(value = "category", key = "'getCatalogJson'")
})*/
@CacheEvict(value = {"category"}, allEntries = true)    //清除模式
//    @CachePut   //双写模式
@Transactional
@Override
public void updateCascade(CategoryEntity category) {
    this.updateById(category);
    categoryBrandRelationService.updateCategory(category.getCatId(), category.getName());

    // 同修改缓存中的数据
    //redis.del('catelogJson'); 等待下次主动查询时更新
}
```
`application.yml`
``` yml
#如果指定了前缀就用我们指定的前缀，如果没有就默认使用缓存的名字作为前缀
#spring.cache.redis.key-prefix=CACHE_
spring.cache.redis.use-key-prefix=true

#是否缓存空值，防止缓存穿透
spring.cache.redis.cache-null-values=true
```

#### 原理与不足
``
``` java
/**
  * 1、每一个需要缓存的数据我们都来指定要放到那个名字的缓存。【缓存的分区(按照业务类型分)】
  * 2、@Cacheable(value = {"category"})
  *      代表当前方法的结果需要缓存，
  *      如果缓存中有，方法都不用调用，如果缓存中没有，会调用方法。最后将方法的结果放入缓存
  * 3、默认行为
  *   3.1 如果缓存中有，方法不再调用
  *   3.2 key是默认生成的:缓存的名字::SimpleKey::[](自动生成key值)
  *   3.3 缓存的value值，默认使用jdk序列化机制，将序列化的数据存到redis中
  *   3.4 默认ttl时间是 -1：
  *
  *   自定义操作：key的生成
  *    1. 指定生成缓存的key：        key属性指定，接收一个 SpEl
  *    2. 指定缓存的数据的存活时间:  配置文档中修改存活时间 ttl
  *    3. 将数据保存为json格式:     自定义配置类 MyCacheManager
  * <p>
  * 4、Spring-Cache的不足之处：
  *  1）、读模式
  *      缓存穿透：查询一个null数据。解决方案：缓存空数据
  *      缓存击穿：大量并发进来同时查询一个正好过期的数据。解决方案：加锁 ? 默认是无加锁的;使用sync = true来解决击穿问题
  *      缓存雪崩：大量的key同时过期。解决：加随机时间。加上过期时间
  *  2)、写模式：（缓存与数据库一致）
  *      1）、读写加锁。
  *      2）、引入Canal,感知到MySQL的更新去更新Redis
  *      3）、读多写多，直接去数据库查询就行
  * <p>
  * 总结：
  * 常规数据（读多写少，即时性，一致性要求不高的数据，完全可以使用Spring-Cache）：写模式(只要缓存的数据有过期时间就足够了)
  * 特殊数据：特殊设计
  * <p>
  * 原理：
  * CacheManager(RedisCacheManager)->Cache(RedisCache)->Cache负责缓存的读写
  *
  * @return
  */
@Cacheable(value = {"category"}, key = "#root.method.name", sync = true)
@Override
public List<CategoryEntity> getLevel1Categorys() {
    List<CategoryEntity> categoryEntities = baseMapper.selectList(new QueryWrapper<CategoryEntity>().eq("parent_cid", 0));
    return categoryEntities;
}
```

## 商城业务
### 检索服务
#### 搭建页面环境
**添加模板页面**
在`gulimall-search`的`pom.xml`中引入模板引擎
``` xml
<!-- 模板引擎 -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>
```
将资料中的前端页面放到`search`服务模块下的`resource/templates`下, 
在`index.html`中加上命名空间`xmlns:th="http://www.thymeleaf.org"`, 
把所有的资源引用修改到`/static/search/`下

利用nginx的动静分离, 移动静态资源到虚拟机的`mydata/nginx/html/search/`目录下

**配置域名转发**
在`host`中添加`192.168.56.10 search.gulimall.com`
修改虚拟机中`/mydata/nginx/conf/conf.d/gulimall.conf`nginx转发配置, 将所有 *.gulimall.com 的请求都经由nginx转发给网关
``` shell
server {
  listen       80;
  server_name  gulimall.com *.gulimall.com;
  ...
}
```
修改完后, 重启nginx: `docker restart nginx`

**配置网关服务转发到 search 服务**
修改`gulimall-gateway`的`application.yml`
``` yml
- id: gulimall_host_rout  #需要放在后面, 优先匹配api/**请求
  uri: lb://gulimall-product
  predicates:
    - Host=gulimall.com

- id: gulimall_search_rout
  uri: lb://gulimall-search
  predicates:
    - Host=search.gulimall.com
```
![/GuliaMall/1662477474041.jpg)

测试, 访问`search.gulimall.com`, 能正常访问返回页面表示正常

#### 调整页面跳转
`gulimall-search`的`pom.xml`中加上热启动依赖
``` xml
<!--使用热加载-->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-devtools</artifactId>
    <optional>true</optional>
</dependency>
```
`application.yml`中将页面缓存关闭`spring.thymeleaf.cache=false`
修改静态文件`index.html`首页的跳转路径为:`http://gulimall.com`(标题图片)

点击首页仍然跳转不了, 需要看一下nginx中`gulimall.conf`的配置(上面给你修改过正确就不需要改了),
*也有可能是没有启动product服务*
``` shell
server {
  listen       80;
  server_name  gulimall.com *.gulimall.com;
  ...
}
```

在首页使用搜索功能, 发现跳转到`list.html`页面, 将`search`服务中的`index.html`文件名修改问`list.html`
`search`服务中新建`SearchController`
``` java
@Controller
public class SearchController {
    
    @GetMapping("/list.html")
    public String listPage() {
        return "list";
    }
    
}
```

发现在首页点击搜索后无法正常跳转, 修改`product`服务的`index.html`中的搜索事件
``` html
...
<a href="javascript:search();"><img src="/static/index/img/img_09.png" /></a>
...
function search() {
      var keyword=$("#searchText").val()
      window.location.href="/static/http://search.gulimall.com/list.html?keyword="+keyword;
  }
```
为了方便热加载, 需要再把`product`服务中`application.yml`的缓存关了
``` yml
spring:
  thymeleaf:
    cache: false
```

#### 检索查询参数模型分析 & 检索返回结果模型分析抽取
`SearchParam`
``` java
/**
 * 封装页面所有可能传递过来的查询条件
 **/
@Data
public class SearchParam {

    /**
     * 页面传递过来的全文匹配关键字
     */
    private String keyword;

    /**
     * 三级分类id
     */
    private Long catalog3Id;

    /**
     * 排序条件：sort=[price/salecount/hotscore]_[desc/asc]
     */
    private String sort;

    /**
     * 过滤条件：是否显示有货, 0/1
     */
    private Integer hasStock;

    /**
     * 过滤条件：价格区间查询, 1_500/_500/500_
     */
    private String skuPrice;

    /**
     * 品牌id,可以多选
     */
    private List<Long> brandId;

    /**
     * 按照属性进行筛选
     */
    private List<String> attrs;

    /**
     * 页码
     */
    private Integer pageNum = 1;
    
}
```
`SearchResponse`
``` java
@Data
public class SearchResponse {

    /**
     * 查询到的所有商品信息
     */
    private List<SkuEsModel> products;

    /**
     * 当前页码
     */
    private Integer pageNum;

    /**
     * 总记录数
     */
    private Long total;

    /**
     * 总页码
     */
    private Integer totalPages;

    private List<Integer> pageNavs;

    /**
     * 当前查询到的结果，所有涉及到的品牌
     */
    private List<BrandVo> brands;

    /**
     * 当前查询到的结果，所有涉及到的所有分类
     */
    private List<CatalogVo> catalogs;

    /**
     * 当前查询到的结果，所有涉及到的所有属性
     */
    private List<AttrVo> attrs;


    //===========================以上是返回给页面的所有信息============================//


    @Data
    public static class BrandVo {
        private Long brandId;
        private String brandName;
        private String brandImg;
    }

    @Data
    public static class CatalogVo {
        private Long catalogId;
        private String catalogName;
    }

    @Data
    public static class AttrVo {
        private Long attrId;
        private String attrName;
        private List<String> attrValue;
    }

}
```
`SearchController`
``` java
@Autowired
private MallSearchService mallSearchService;

/**
  * 自动将页面提交过来的所有请求参数封装成我们指定的对象
  */
@GetMapping(value = "/list.html")
public String listPage(SearchParam param, Model model) {

    //1、根据传递来的页面的查询参数，去es中检索商品
    SearchResult result = mallSearchService.search(param);

    model.addAttribute("result", result);

    return "list";
}
```
`MallSearchService`
``` java
public interface MallSearchService {

    /**
     * 搜索
     *
     * @param param 检索的所有参数
     * @return 返回检索的结果，里面包含页面需要的所有信息
     */
    SearchResult search(SearchParam param);

}
```
`MallSearchServiceImpl`
``` java
@Service
public class MallSearchServiceImpl implements MallSearchService {

    @Override
    public SearchResult search(SearchParam param) {
        return null;
    }

}
```
![/GuliaMall/1662570156688.jpg)

#### 检索DSL测试-查询部分
*这里我的索引(mall_product)和视频中(procut)有出入, 所以我这里先将数据迁移到`product`索引下*
``` json
# 创建新的索引，下面进行数据迁移
PUT /product
{
  "mappings": {
    "properties": {
      "skuId": {
        "type": "long"
      },
      "spuId": {
        "type": "long"
      },
      "skuTitle": {
        "type": "text",
        "analyzer": "ik_smart"
      },
      "skuPrice": {
        "type": "keyword"
      },
      "skuImg": {
        "type": "keyword"
      },
      "saleCount": {
        "type": "long"
      },
      "hosStock": {
        "type": "boolean"
      },
      "hotScore": {
        "type": "long"
      },
      "brandId": {
        "type": "long"
      },
      "catalogId": {
        "type": "long"
      },
      "brandName": {
        "type": "keyword"
      },
      "brandImg": {
        "type": "keyword"
      },
      "catalogName": {
        "type": "keyword"
      },
      "attrs": {
        "type": "nested",
        "properties": {
          "attrId": {
            "type": "long"
          },
          "attrName": {
            "type": "keyword"
          },
          "attrValue": {
            "type": "keyword"
          }
        }
      }
    }
  }
}
# 数据迁移
POST _reindex
{
  "source": {
    "index": "mall_product"
  },
  "dest": {
    "index": "product"
  }
}
```

在Kibana中测试查询
``` json
GET product/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "skuTitle": "华为"
          }
        }
      ],
      "filter": [
        {
          "term": {
            "catalogId": "225"
          }
        },
        {
          "terms": {
            "brandId": [
              "1",
              "2",
              "9"
            ]
          }
        },
        {
          "nested": {
            "path": "attrs",
            "query": {
              "bool": {
                "must": [
                  {
                    "term": {
                      "attrs.attrId": {
                        "value": "15"
                      }
                    }
                  },
                  {
                    "terms": {
                      "attrs.attrValue": [
                        "海思（Hisilicon）",
                        "以官网信息为准"
                      ]
                    }
                  }
                ]
              }
            }
          }
        },
        {
          "term": {
            "hasStock": "true"
          }
        },
        {
          "range": {
            "skuPrice": {
              "gte": 0,
              "lte": 6000
            }
          }
        }
      ]
    }
  },
  "sort": [
    {
      "skuPrice": {
        "order": "desc"
      }
    }
  ],
  "from": 0,
  "size": 1,
  "highlight": {
    "fields": {"skuTitle": {}}, 
    "pre_tags": "<b style='color:red'>",
    "post_tags": "</b>"
  }
}
```
模糊匹配、过滤（按属性，分类，品牌，价格区间，库存）、排序、分页、高亮

#### 检索DSL测试-聚合部分
**迁移数据**
``` json
# 创建新的索引，下面进行数据迁移
PUT /gulimall_product
{
  "mappings": {
    "properties": {
      "skuId": {
        "type": "long"
      },
      "spuId": {
        "type": "long"
      },
      "skuTitle": {
        "type": "text",
        "analyzer": "ik_smart"
      },
      "skuPrice": {
        "type": "keyword"
      },
      "skuImg": {
        "type": "keyword"
      },
      "saleCount": {
        "type": "long"
      },
      "hosStock": {
        "type": "boolean"
      },
      "hotScore": {
        "type": "long"
      },
      "brandId": {
        "type": "long"
      },
      "catalogId": {
        "type": "long"
      },
      "brandName": {
        "type": "keyword"
      },
      "brandImg": {
        "type": "keyword"
      },
      "catalogName": {
        "type": "keyword"
      },
      "attrs": {
        "type": "nested",
        "properties": {
          "attrId": {
            "type": "long"
          },
          "attrName": {
            "type": "keyword"
          },
          "attrValue": {
            "type": "keyword"
          }
        }
      }
    }
  }
}
# 数据迁移
POST _reindex
{
  "source": {
    "index": "product"
  },
  "dest": {
    "index": "gulimall_product"
  }
}
```
修改`search`服务的`EsConstant`配置中的索引名·
``` java
public static final String PRODUCT_INDEX = "gulimall_product";
```

**测试聚合**
``` json
GET gulimall_product/_search
{
  "query": {
    "match_all": {}
  },
  "aggs": {
    "brand_agg": {
      "terms": {
        "field": "brandId",
        "size": 10
      },
      "aggs": {
        "brand_name_agg": {
          "terms": {
            "field": "brandName",
            "size": 10
          }
        },
        "brand_img_agg": {
          "terms": {
            "field": "brandImg",
            "size": 10
          }
        }
      }
    },
    "catalog_agg": {
      "terms": {
        "field": "catalogId",
        "size": 10
      },
      "aggs": {
        "catalog_name_agg": {
          "terms": {
            "field": "catalogName",
            "size": 10
          }
        }
      }
    },
    "attr_agg": {
      "nested": {
        "path": "attrs"
      },
      "aggs": {
        "attr_id_agg": {
          "terms": {
            "field": "attrs.attrId",
            "size": 10
          },
          "aggs": {
            "attr_name_agg": {
              "terms": {
                "field": "attrs.attrName",
                "size": 10
              }
            },
            "attr_value_agg": {
              "terms": {
                "field": "attrs.attrValue",
                "size": 10
              }
            }
          }
        }
      }
    }
  }
}
```
如果是嵌入式的属性，查询、聚合、分析都应该用嵌入式的

**完整的查询**
``` json
GET gulimall_product/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "skuTitle": "华为"
          }
        }
      ],
      "filter": [
        {
          "term": {
            "catalogId": "225"
          }
        },
        {
          "terms": {
            "brandId": [
              "1",
              "2",
              "9"
            ]
          }
        },
        {
          "nested": {
            "path": "attrs",
            "query": {
              "bool": {
                "must": [
                  {
                    "term": {
                      "attrs.attrId": {
                        "value": "15"
                      }
                    }
                  },
                  {
                    "terms": {
                      "attrs.attrValue": [
                        "海思（Hisilicon）",
                        "以官网信息为准"
                      ]
                    }
                  }
                ]
              }
            }
          }
        },
        {
          "term": {
            "hasStock": "true"
          }
        },
        {
          "range": {
            "skuPrice": {
              "gte": 0,
              "lte": 6000
            }
          }
        }
      ]
    }
  },
  "sort": [
    {
      "skuPrice": {
        "order": "desc"
      }
    }
  ],
  "from": 0,
  "size": 1,
  "highlight": {
    "fields": {"skuTitle": {}}, 
    "pre_tags": "<b style='color:red'>",
    "post_tags": "</b>"
  },
  
  "aggs": {
    "brand_agg": {
      "terms": {
        "field": "brandId",
        "size": 10
      },
      "aggs": {
        "brand_name_agg": {
          "terms": {
            "field": "brandName",
            "size": 10
          }
        },
        "brand_img_agg": {
          "terms": {
            "field": "brandImg",
            "size": 10
          }
        }
      }
    },
    "catalog_agg": {
      "terms": {
        "field": "catalogId",
        "size": 10
      },
      "aggs": {
        "catalog_name_agg": {
          "terms": {
            "field": "catalogName",
            "size": 10
          }
        }
      }
    },
    "attr_agg": {
      "nested": {
        "path": "attrs"
      },
      "aggs": {
        "attr_id_agg": {
          "terms": {
            "field": "attrs.attrId",
            "size": 10
          },
          "aggs": {
            "attr_name_agg": {
              "terms": {
                "field": "attrs.attrName",
                "size": 10
              }
            },
            "attr_value_agg": {
              "terms": {
                "field": "attrs.attrValue",
                "size": 10
              }
            }
          }
        }
      }
    }
  }
}
```

#### SearchRequset构建-检索 & 排序、分页、高亮&测试 & 聚合
**SearchRequset构建-检索**
`search`服务的`SearchParam`中；默认显示有货状态，分页默认第一页
``` java
private Integer hasStock = 1;

private Integer pageNum = 1;
```
将分页的页大小设置在常量中定义，在`EsConstant`中
``` java
public static final Integer PRODUCT_PAGE_SIZE = 2;
```
`MallSearchServiceImpl`
``` java
@Autowired
private RestHighLevelClient client;

@Override
public SearchResult search(SearchParam param) {
    //1、动态构建出查询需要的DSL语句
    SearchResult result = null;

    //1、准备检索请求
    SearchRequest searchRequest = buildSearchRequest(param);

    try {
        //2、执行检索请求
        SearchResponse response = client.search(searchRequest, GulimallElasticSearchConfig.COMMON_OPTIONS);

        //3、分析响应数据，封装成我们需要的格式
        result = buildSearchResult(response, param);
    } catch (IOException e) {
        throw new RuntimeException(e);
    }

    return result;
}

/**
  * 准备检索请求
  * 模糊匹配，过滤（按照属性，分类，品牌，价格区间，库存），排序，分页，高亮，聚合分析
  * @return
  */
private SearchRequest buildSearchRequest(SearchParam param) {
    SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();

    /**
      * 查询：模糊匹配，过滤（按照属性，分类，品牌，价格区间，库存）
      */
    //1. 构建 bool-query
    BoolQueryBuilder boolQuery = QueryBuilders.boolQuery();

    //1.1 bool-must 模糊匹配
    if (!StringUtils.isEmpty(param.getKeyword())) {
        boolQuery.must(QueryBuilders.matchQuery("skuTitle", param.getKeyword()));
    }

    //1.2.1 bool-filter catalogId 按照三级分类id查询
    if (null != param.getCatalog3Id()) {
        boolQuery.filter(QueryBuilders.termQuery("catalogId", param.getCatalog3Id()));
    }
    //1.2.2 bool-filter brandId 按照品牌id查询
    if (param.getBrandId() != null && param.getBrandId().size() > 0) {
        boolQuery.filter(QueryBuilders.termsQuery("brandId", param.getBrandId()));
    }
    //1.2.3 bool-filter attrs 按照指定的属性查询
    if (param.getAttrs() != null && param.getAttrs().size() > 0) {
        //attrs=1_5寸:8寸&2_16G:8G
        for (String attrStr : param.getAttrs()) {
            BoolQueryBuilder nestedboolQuery = QueryBuilders.boolQuery();

            //attrs=1_5寸:8寸
            String[] s = attrStr.split("_");
            String attrId = s[0]; // 检索的属性id
            String[] attrValues = s[1].split(":");//这个属性检索用的值
            nestedboolQuery.must(QueryBuilders.termQuery("attrs.attrId", attrId));
            nestedboolQuery.must(QueryBuilders.termsQuery("attrs.attrValue", attrValues));
            // 每一个属性都要生成一个 nested 查询
            NestedQueryBuilder nestedQuery = QueryBuilders.nestedQuery("attrs", nestedboolQuery, ScoreMode.None);
            boolQuery.filter(nestedQuery);
        }
    }
    //1.2.4 bool-filter hasStock 按照是否有库存查询
    if (null != param.getHasStock()) {
        boolQuery.filter(QueryBuilders.termQuery("hasStock", param.getHasStock() == 1));
    }
    //1.2.5 skuPrice bool-filter 按照价格区间查询
    if (!StringUtils.isEmpty(param.getSkuPrice())) {
        //skuPrice形式为：1_500或_500或500_
        RangeQueryBuilder rangeQueryBuilder = QueryBuilders.rangeQuery("skuPrice");
        String[] price = param.getSkuPrice().split("_");
        if (price.length == 2) {
            rangeQueryBuilder.gte(price[0]).lte(price[1]);
        } else if (price.length == 1) {
            if (param.getSkuPrice().startsWith("_")) {
                rangeQueryBuilder.lte(price[1]);
            }
            if (param.getSkuPrice().endsWith("_")) {
                rangeQueryBuilder.gte(price[0]);
            }
        }
        boolQuery.filter(rangeQueryBuilder);
    }

    // 封装所有的查询条件
    sourceBuilder.query(boolQuery);


    /**
      * 排序，分页，高亮
      */
    // 2.1 排序  形式为sort=hotScore_asc/desc
    if (!StringUtils.isEmpty(param.getSort())) {
        String sort = param.getSort();
        // sort=hotScore_asc/desc
        String[] sortFields = sort.split("_");

        SortOrder sortOrder = "asc".equalsIgnoreCase(sortFields[1]) ? SortOrder.ASC : SortOrder.DESC;
        sourceBuilder.sort(sortFields[0], sortOrder);
    }

    // 2.2 分页 from = (pageNum - 1) * pageSize
    sourceBuilder.from((param.getPageNum() - 1) * EsConstant.PRODUCT_PAGE_SIZE);
    sourceBuilder.size(EsConstant.PRODUCT_PAGE_SIZE);


    // 2.3 高亮
    if (!StringUtils.isEmpty(param.getKeyword())) {
        HighlightBuilder highlightBuilder = new HighlightBuilder();
        highlightBuilder.field("skuTitle");
        highlightBuilder.preTags("<b style='color:red'>");
        highlightBuilder.postTags("</b>");

        sourceBuilder.highlighter(highlightBuilder);
    }

//        System.out.println("构建的DSL语句" + sourceBuilder.toString());


    /**
      * 聚合分析
      */
    //1. 按照品牌进行聚合
    TermsAggregationBuilder brand_agg = AggregationBuilders.terms("brand_agg");
    brand_agg.field("brandId").size(50);

    //1.1 品牌的子聚合-品牌名聚合
    brand_agg.subAggregation(AggregationBuilders.terms("brand_name_agg").field("brandName").size(1));
    //1.2 品牌的子聚合-品牌图片聚合
    brand_agg.subAggregation(AggregationBuilders.terms("brand_img_agg").field("brandImg").size(1));
    sourceBuilder.aggregation(brand_agg);

    //2. 按照分类信息进行聚合
    TermsAggregationBuilder catalog_agg = AggregationBuilders.terms("catalog_agg");
    catalog_agg.field("catalogId").size(20);
    catalog_agg.subAggregation(AggregationBuilders.terms("catalog_name_agg").field("catalogName").size(1));
    sourceBuilder.aggregation(catalog_agg);

    // 3. 按照属性信息进行聚合
    NestedAggregationBuilder attr_agg = AggregationBuilders.nested("attr_agg", "attrs");
    //3.1 按照属性ID进行聚合
    TermsAggregationBuilder attr_id_agg = AggregationBuilders.terms("attr_id_agg").field("attrs.attrId");
    attr_agg.subAggregation(attr_id_agg);
    //3.1.1 在每个属性ID下，按照属性名进行聚合
    attr_id_agg.subAggregation(AggregationBuilders.terms("attr_name_agg").field("attrs.attrName").size(1));
    //3.1.2 在每个属性ID下，按照属性值进行聚合
    attr_id_agg.subAggregation(AggregationBuilders.terms("attr_value_agg").field("attrs.attrValue").size(50));
    sourceBuilder.aggregation(attr_agg);

    System.out.println("构建的DSL语句" + sourceBuilder.toString());
    
    SearchRequest searchRequest = new SearchRequest(new String[]{EsConstant.PRODUCT_INDEX}, sourceBuilder);
    return searchRequest;
}
```
测试：通过`http://localhost:12000/list.html`接口，将生成的查询json拷贝出来，再使用`kibana`测试

#### SearchResponse分析&封装 & 验证封装正确性
`MallSearchServiceImpl`
``` java
/**
  * 构建结果数据
  * 模糊匹配，过滤（按照属性、分类、品牌，价格区间，库存），完成排序、分页、高亮,聚合分析功能
  * @return
  */
private SearchResult buildSearchResult(SearchResponse response, SearchParam param) {
    SearchResult result = new SearchResult();

    //1、返回的所有查询到的商品
    SearchHits hits = response.getHits();

    List<SkuEsModel> esModels = new ArrayList<>();
    //遍历所有商品信息
    if (hits.getHits() != null && hits.getHits().length > 0) {
        for (SearchHit hit : hits.getHits()) {
            String sourceAsString = hit.getSourceAsString();
            SkuEsModel esModel = JSONUtil.toBean(sourceAsString, SkuEsModel.class);

            //判断是否按关键字检索，若是就显示高亮，否则不显示
            if (!StringUtils.isEmpty(param.getKeyword())) {
                //拿到高亮信息显示标题
                HighlightFie ld skuTitle = hit.getHighlightFields().get("skuTitle");
                String skuTitleValue = skuTitle.getFragments()[0].string();
                esModel.setSkuTitle(skuTitleValue);
            }
            esModels.add(esModel);
        }
    }
    result.setProduct(esModels);

    //2、当前商品涉及到的所有属性信息
    List<SearchResult.AttrVo> attrVos = new ArrayList<>();
    //获取属性信息的聚合
    ParsedNested attr_agg = response.getAggregations().get("attr_agg");
    ParsedLongTerms attr_id_agg = attr_agg.getAggregations().get("attr_id_agg");
    for (Terms.Bucket bucket : attr_id_agg.getBuckets()) {
        SearchResult.AttrVo attrVo = new SearchResult.AttrVo();
        //1、得到属性的id
        long attrId = bucket.getKeyAsNumber().longValue();
        attrVo.setAttrId(attrId);
        //2、得到属性的名字
        ParsedStringTerms attrNameAgg = bucket.getAggregations().get("attr_name_agg");
        String attrName = attrNameAgg.getBuckets().get(0).getKeyAsString();
        attrVo.setAttrName(attrName);
        //3、得到属性的所有值
        ParsedStringTerms attrValueAgg = bucket.getAggregations().get("attr_value_agg");
        List<String> attrValues = attrValueAgg.getBuckets().stream().map(MultiBucketsAggregation.Bucket::getKeyAsString).collect(Collectors.toList());
        attrVo.setAttrValue(attrValues);

        attrVos.add(attrVo);
    }

    result.setAttrs(attrVos);

    //3、当前商品涉及到的所有品牌信息
    List<SearchResult.BrandVo> brandVos = new ArrayList<>();
    //获取到品牌的聚合
    ParsedLongTerms brand_agg = response.getAggregations().get("brand_agg");
    for (Terms.Bucket bucket : brand_agg.getBuckets()){
        SearchResult.BrandVo brandVo = new SearchResult.BrandVo();
        //1、得到品牌的id
        long brandId = bucket.getKeyAsNumber().longValue();
        brandVo.setBrandId(brandId);
        //2、得到品牌的名字
        ParsedStringTerms brandNameAgg = bucket.getAggregations().get("brand_name_agg");
        String brandName = brandNameAgg.getBuckets().get(0).getKeyAsString();
        brandVo.setBrandName(brandName);
        //3、得到品牌的图片
        ParsedStringTerms brandImgAgg = bucket.getAggregations().get("brand_img_agg");
        String brandImg = brandImgAgg.getBuckets().get(0).getKeyAsString();
        brandVo.setBrandImg(brandImg);

        brandVos.add(brandVo);
    }
    result.setBrands(brandVos);

    //4、当前商品涉及到的所有分类信息
    //获取到分类的聚合
    List<SearchResult.CatalogVo> catalogVos = new ArrayList<>();
    ParsedLongTerms catalog_agg = response.getAggregations().get("catalog_agg");
    for (Terms.Bucket bucket : catalog_agg.getBuckets()) {
        SearchResult.CatalogVo catalogVo = new SearchResult.CatalogVo();
        //得到分类id
        String keyAsString = bucket.getKeyAsString();
        catalogVo.setCatalogId(Long.parseLong(keyAsString));

        //得到分类名
        ParsedStringTerms catalogNameAgg = bucket.getAggregations().get("catalog_name_agg");
        String catalogName = catalogNameAgg.getBuckets().get(0).getKeyAsString();
        catalogVo.setCatalogName(catalogName);
        catalogVos.add(catalogVo);
    }

    result.setCatalogs(catalogVos);
    //===============以上可以从聚合信息中获取====================//

    //5、分页信息-页码
    result.setPageNum(param.getPageNum());
    //5、1分页信息、总记录数
    long total = hits.getTotalHits().value;
    result.setTotal(total);
    //5、2分页信息-总页码-计算
    int totalPages = (int) total % EsConstant.PRODUCT_PAGE_SIZE == 0 ?
            (int) total / EsConstant.PRODUCT_PAGE_SIZE : ((int) total / EsConstant.PRODUCT_PAGE_SIZE + 1);
    result.setTotalPages(totalPages);

    return result;
}
```

#### 页面渲染(页面基本数据渲染 & 页面筛选条件渲染 & 页面分页数据渲染 & 页面排序功能 & 页面排序字段回显 & 页面价格区间搜索 & 面包屑导航 & 条件删除与URL编码问题 & 条件筛选联动)
`list.html`
``` html
<!doctype html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <link rel="stylesheet" href="/static/search//css/index.css">
    <link rel="stylesheet" type="text/css" href="/static/search/font/iconfont.css">
    <!--<script src="/static/search/./js/jquery-3.2.1.min.js"></script>-->
    <script src="/static/search/js/jquery-1.12.4.js"></script>
    <title>Document</title>
</head>
<body>
<!--头部-->
<div class="header_head">
    <div class="header_head_box">
        <b class="header_head_p">
            <div style="overflow: hidden">
                <a href="http://gulimall.com" class="header_head_p_a1" style="width:73px;">
                    谷粒商城首页
                </a>
                <a href="/static/search/#" class="header_head_p_a">
                    <!--<img src="/static/search/img/img_05.png" style="border-radius: 50%;"/>-->
                    北京</a>
            </div>
            <div class="header_head_p_cs">
                <a href="/static/search/#" style="background: #C81623;color: #fff;">北京</a>
                <a href="/static/search/#">上海</a>
                <a href="/static/search/#">天津</a>
                <a href="/static/search/#">重庆</a>
                <a href="/static/search/#">河北</a>
                <a href="/static/search/#">山西</a>
                <a href="/static/search/#">河南</a>
                <a href="/static/search/#">辽宁</a>
                <a href="/static/search/#">吉林</a>
                <a href="/static/search/#">黑龙江</a>
                <a href="/static/search/#">内蒙古</a>
                <a href="/static/search/#">江苏</a>
                <a href="/static/search/#">山东</a>
                <a href="/static/search/#">安徽</a>
                <a href="/static/search/#">浙江</a>
                <a href="/static/search/#">福建</a>
                <a href="/static/search/#">湖北</a>
                <a href="/static/search/#">湖南</a>
                <a href="/static/search/#">广东</a>
                <a href="/static/search/#">广西</a>
                <a href="/static/search/#">江西</a>
                <a href="/static/search/#">四川</a>
                <a href="/static/search/#">海南</a>
                <a href="/static/search/#">贵州</a>
                <a href="/static/search/#">云南</a>
                <a href="/static/search/#">西藏</a>
                <a href="/static/search/#">陕西</a>
                <a href="/static/search/#">甘肃</a>
                <a href="/static/search/#">青海</a>
                <a href="/static/search/#">宁夏</a>
                <a href="/static/search/#">新疆</a>
                <a href="/static/search/#">港澳</a>
                <a href="/static/search/#">台湾</a>
                <a href="/static/search/#">钓鱼岛</a>
                <a href="/static/search/#">海外</a>
            </div>
        </b>
        <ul>
            <li>
                <a href="/static/search/#" class="li_2">你好，请登录</a>
            </li>
            <li>
                <a href="/static/search/#">免费注册</a>
            </li>
            <span>|</span>
            <li>
                <a href="/static/search/#">我的订单</a>
            </li>
            <span>|</span>
            <li class="header_wdjd" style="width:80px;">
                <a href="/static/search/#">我的谷粒商城</a>
                <img src="/static/search/image/down-@1x.png"/>
                <!--<b class="glyphicon glyphicon-menu-down"></b>-->
                <div class="header_wdjd_txt">
                    <ul>
                        <li>
                            <a href="/static/search/#">待处理订单</a>
                        </li>
                        <li>
                            <a href="/static/search/#">消息</a>
                        </li>
                        <li>
                            <a href="/static/search/#">返修退换货</a>
                        </li>
                        <li>
                            <a href="/static/search/#">我的回答</a>
                        </li>
                        <li>
                            <a href="/static/search/#">降价商品</a>
                        </li>
                        <li>
                            <a href="/static/search/#">我的关注</a>
                        </li>
                    </ul>
                    <ul>
                        <li>
                            <a href="/static/search/#">我的京豆</a>
                        </li>
                        <li>
                            <a href="/static/search/#">我的优惠券</a>
                        </li>
                        <li>
                            <a href="/static/search/#">我的白条</a>
                        </li>
                        <li>
                            <a href="/static/search/#">我的理财</a>
                        </li>
                    </ul>
                </div>
            </li>
            <span>|</span>
            <li>
                <a href="/static/search/#">谷粒商城会员</a>
            </li>
            <span>|</span>
            <li>
                <a href="/static/search/#">企业采购</a>
            </li>
            <span>|</span>
            <li class="header_wdjd1">
                <a href="/static/search/#">客户服务</a>
                <img src="/static/search/image/down-@1x.png"/>
                <!--<b class="glyphicon glyphicon-menu-down"></b>-->
                <div class="header_wdjd_txt">
                    <ul>
                        <p style="width:100%;">客户</p>
                        <li>
                            <a href="/static/search/#">帮助中心</a>
                        </li>
                        <li>
                            <a href="/static/search/#">售后服务</a>
                        </li>
                        <li>
                            <a href="/static/search/#">在线客服</a>
                        </li>
                        <li>
                            <a href="/static/search/#">意见建议</a>
                        </li>
                        <li>
                            <a href="/static/search/#">电话客服</a>
                        </li>
                        <li>
                            <a href="/static/search/#">客服邮箱</a>
                        </li>
                        <li>
                            <a href="/static/search/#">金融资讯</a>
                        </li>
                        <li>
                            <a href="/static/search/#">售全球客服</a>
                        </li>
                    </ul>
                    <ul>
                        <p style="width:100%;">商户</p>
                        <li>
                            <a href="/static/search/#">合作招商</a>
                        </li>
                        <li>
                            <a href="/static/search/#">学习中心</a>
                        </li>
                        <li>
                            <a href="/static/search/#">商家后台</a>
                        </li>
                        <li>
                            <a href="/static/search/#">京麦工作台</a>
                        </li>
                        <li>
                            <a href="/static/search/#">商家帮助</a>
                        </li>
                        <li>
                            <a href="/static/search/#">规则平台</a>
                        </li>
                    </ul>
                </div>
            </li>
            <span>|</span>
            <li class="header_wzdh">
                <a href="/static/search/#">网站导航</a>
                <img src="/static/search/image/down-@1x.png"/>
                <!--<b class="glyphicon glyphicon-menu-down"></b>-->
                <div class="header_wzdh_txt">
                    <ul style="width: 25%;">
                        <p style="width:100%;">特色主题</p>
                        <li>
                            <a href="/static/search/#">谷粒商城试用</a>
                        </li>
                        <li>
                            <a href="/static/search/#">谷粒商城金融</a>
                        </li>
                        <li>
                            <a href="/static/search/#">全球售</a>
                        </li>
                        <li>
                            <a href="/static/search/#">国际站</a>
                        </li>
                        <li>
                            <a href="/static/search/#">谷粒商城会员</a>
                        </li>
                        <li>
                            <a href="/static/search/#">谷粒商城预售</a>
                        </li>
                        <li>
                            <a href="/static/search/#">买什么</a>
                        </li>
                        <li>
                            <a href="/static/search/#">俄语站</a>
                        </li>
                        <li>
                            <a href="/static/search/#">装机大师</a>
                        </li>
                        <li>
                            <a href="/static/search/#">0元评测</a>
                        </li>
                        <li>
                            <a href="/static/search/#">定期送</a>
                        </li>
                        <li>
                            <a href="/static/search/#">港澳售</a>
                        </li>
                        <li>
                            <a href="/static/search/#">优惠券</a>
                        </li>
                        <li>
                            <a href="/static/search/#">秒杀</a>
                        </li>
                        <li>
                            <a href="/static/search/#">闪购</a>
                        </li>
                        <li>
                            <a href="/static/search/#">印尼站</a>
                        </li>
                        <li>
                            <a href="/static/search/#">谷粒商城金融科技</a>
                        </li>
                        <li>
                            <a href="/static/search/#">In货推荐</a>
                        </li>
                        <li>
                            <a href="/static/search/#">陪伴计划</a>
                        </li>
                        <li>
                            <a href="/static/search/#">出海招商</a>
                        </li>
                    </ul>
                    <ul style="width: 20%;">
                        <p style="width:100%;">行业频道</p>
                        <li>
                            <a href="/static/search/#">手机</a>
                        </li>
                        <li>
                            <a href="/static/search/#">智能数码</a>
                        </li>
                        <li>
                            <a href="/static/search/#">玩3c</a>
                        </li>
                        <li>
                            <a href="/static/search/#">电脑办公</a>
                        </li>
                        <li>
                            <a href="/static/search/#">家用电器</a>
                        </li>
                        <li>
                            <a href="/static/search/#">谷粒商城智能</a>
                        </li>
                        <li>
                            <a href="/static/search/#">服装城</a>
                        </li>
                        <li>
                            <a href="/static/search/#">美妆馆</a>
                        </li>
                        <li>
                            <a href="/static/search/#">家装城</a>
                        </li>
                        <li>
                            <a href="/static/search/#">母婴</a>
                        </li>
                        <li>
                            <a href="/static/search/#">食品</a>
                        </li>
                        <li>
                            <a href="/static/search/#">运动户外</a>
                        </li>
                        <li>
                            <a href="/static/search/#">农资频道</a>
                        </li>
                        <li>
                            <a href="/static/search/#">整车</a>
                        </li>
                        <li>
                            <a href="/static/search/#">图书</a>
                        </li>
                    </ul>
                    <ul style="width: 21%;">
                        <p style="width:100%;">生活服务</p>
                        <li>
                            <a href="/static/search/#">白条</a>
                        </li>
                        <li>
                            <a href="/static/search/#">谷粒商城金融App</a>
                        </li>
                        <li>
                            <a href="/static/search/#">谷粒商城小金库</a>
                        </li>
                        <li>
                            <a href="/static/search/#">理财</a>
                        </li>
                        <li>
                            <a href="/static/search/#">智能家电</a>
                        </li>
                        <li>
                            <a href="/static/search/#">话费</a>
                        </li>
                        <li>
                            <a href="/static/search/#">水电煤</a>
                        </li>
                        <li>
                            <a href="/static/search/#">彩票</a>
                        </li>
                        <li>
                            <a href="/static/search/#">旅行</a>
                        </li>
                        <li>
                            <a href="/static/search/#">机票酒店</a>
                        </li>
                        <li>
                            <a href="/static/search/#">电影票</a>
                        </li>
                        <li>
                            <a href="/static/search/#">谷粒商城到家</a>
                        </li>
                        <li>
                            <a href="/static/search/#">谷粒商城众测</a>
                        </li>
                        <li>
                            <a href="/static/search/#">游戏</a>
                        </li>
                    </ul>
                    <ul style="width: 23%; border-right: 0;">
                        <p style="width:100%;">更多精选</p>
                        <li>
                            <a href="/static/search/#">合作招商</a>
                        </li>
                        <li>
                            <a href="/static/search/#">谷粒商城通信</a>
                        </li>
                        <li>
                            <a href="/static/search/#">谷粒商城E卡</a>
                        </li>
                        <li>
                            <a href="/static/search/#">企业采购</a>
                        </li>
                        <li>
                            <a href="/static/search/#">服务市场</a>
                        </li>
                        <li>
                            <a href="/static/search/#">办公生活馆</a>
                        </li>
                        <li>
                            <a href="/static/search/#">乡村招募</a>
                        </li>
                        <li>
                            <a href="/static/search/#">校园加盟</a>
                        </li>
                        <li>
                            <a href="/static/search/#">京友帮</a>
                        </li>
                        <li>
                            <a href="/static/search/#">谷粒商城社区</a>
                        </li>
                        <li>
                            <a href="/static/search/#">智能社区</a>
                        </li>
                        <li>
                            <a href="/static/search/#">游戏社区</a>
                        </li>
                        <li>
                            <a href="/static/search/#">知识产权维权</a>
                        </li>
                    </ul>
                </div>
            </li>
            <span>|</span>
            <li class="header_sjjd">
                <a href="/static/search/#">手机谷粒商城</a>
                <div class="header_sjjd_div">
                    <img src="/static/search/img/01.png"/>
                </div>
            </li>
        </ul>
    </div>
</div>

<!--搜索导航-->
<div class="header_sous">
    <div class="logo">
        <a href="http://gulimall.com"><img src="/static/search/./image/logo1.jpg" alt=""></a>
    </div>
    <div class="header_form">
        <input id="keyword_input" type="text" placeholder="手机" th:value="${param.keyword}"/>
        <a href="javascript:searchByKeyword();">搜索</a>
    </div>
    <div class="header_ico">
        <div class="header_gw">
            <span><a href="/static/search/#">我的购物车</a></span>
            <img src="/static/search/image/settleup-@1x.png"/>
            <span>0</span>
        </div>
        <div class="header_ko">
            <p>购物车中还没有商品，赶紧选购吧！</p>
        </div>
    </div>
    <div class="header_form_nav">
        <ul>
            <li>
                <a href="/static/search/#">谷粒商城之家</a>
            </li>
            <li>
                <a href="/static/search/#">谷粒商城专卖店</a>
            </li>
            <li>
                <a href="/static/search/#">平板</a>
            </li>
            <li>
                <a href="/static/search/#">电脑</a>
            </li>
            <li>
                <a href="/static/search/#">ipad</a>
            </li>
        </ul>
    </div>
    <nav>
        <ul>
            <li class="nav_li1">
                <a href="/static/search/#">全部商品分类</a>
            </li>
            <li class="nav_li">
                <a href="/static/search/#">服装城</a>
            </li>
            <li class="nav_li">
                <a href="/static/search/#">没装馆</a>
            </li>
            <li class="nav_li">
                <a href="/static/search/#">超市</a>
            </li>
            <li class="nav_li">
                <a href="/static/search/#">生鲜</a>
            </li>
        </ul>
        <div class="spacer">|</div>
        <ul>
            <li class="nav_li">
                <a href="/static/search/#">全球购</a>
            </li>
            <li class="nav_li">
                <a href="/static/search/#">闪购</a>
            </li>
            <li class="nav_li">
                <a href="/static/search/#">拍卖</a>
            </li>
        </ul>
        <div class="spacer">|</div>
        <ul>
            <li class="nav_li">
                <a href="/static/search/#">金融</a>
            </li>
        </ul>

    </nav>
    <div class="header_main_left">
        <ul>
            <li>
                <a href="/static/search/#" class="header_main_left_a"><b>家用电器</b></a>
            </li>
            <li class="header_li2">
                <a href="/static/search/#" class="header_main_left_a"><b>手机</b> / <b>运营商</b> / <b>数码</b></a>
                <div class="header_main_left_main">
                    <div class="header_sj">
                        <a href="/static/search/#" class="header_sj_a">玩3c</a>
                        <a href="/static/search/#" class="header_sj_a">手机频道</a>
                        <a href="/static/search/#" class="header_sj_a">网上营业厅</a>
                        <a href="/static/search/#" class="header_sj_a">配件选购中心</a>
                        <a href="/static/search/#" class="header_sj_a">企业购</a>
                        <a href="/static/search/#" class="header_sj_a">以旧换新</a>
                    </div>
                    <ol class="header_ol">
                        <a href="/static/search/#" style="color: #111;" class="aaa">手机通讯 ></a>
                        <li>
                            <a href="/static/search/#" style="color: #999;">手机</a>
                            <a href="/static/search/#" style="color: #999;">对讲机</a>
                            <a href="/static/search/#" style="color: #999;">手机维修</a>
                            <a href="/static/search/#" style="color: #999;">以旧换新</a>
                        </li>
                        <a href="/static/search/#" style="color: #111;" class="aaa">运营商 ></a>
                        <li>
                            <a href="/static/search/#" style="color: #999;">合约机</a>
                            <a href="/static/search/#" style="color: #999;">固话宽带</a>
                            <a href="/static/search/#" style="color: #999;">办套餐</a>
                            <a href="/static/search/#" style="color: #999;">从话费/流量</a>
                            <a href="/static/search/#" style="color: #999;">中国电信</a>
                            <a href="/static/search/#" style="color: #999;">中国移动</a>
                            <a href="/static/search/#" style="color: #999;">中国联通</a>
                            <a href="/static/search/#" style="color: #999;">谷粒商城通信</a>
                            <a href="/static/search/#" style="color: #999;">170选号</a>
                        </li>
                        <a href="/static/search/#" style="color: #111;" class="aaa">手机配件 ></a>
                        <li style="height: 60px;">

                            <a href="/static/search/#" style="color: #999;">手机壳</a>
                            <a href="/static/search/#" style="color: #999;">贴膜</a>
                            <a href="/static/search/#" style="color: #999;">手机储存卡</a>
                            <a href="/static/search/#" style="color: #999;">数据线</a>
                            <a href="/static/search/#" style="color: #999;">存电器</a>
                            <a href="/static/search/#" style="color: #999;">手机耳机</a>
                            <a href="/static/search/#" style="color: #999;">创业配件</a>
                            <a href="/static/search/#" style="color: #999;">手机饰品</a>
                            <a href="/static/search/#" style="color: #999;">手机电池</a>
                            <a href="/static/search/#" style="color: #999;">苹果周边</a>
                            <a href="/static/search/#" style="color: #999;">移动电源</a>
                            <a href="/static/search/#" style="color: #999;">蓝牙耳机</a>
                            <a href="/static/search/#" style="color: #999;">手机支架</a>
                            <a href="/static/search/#" style="color: #999;">车载配件</a>
                            <a href="/static/search/#" style="color: #999;">拍照配件</a>

                        </li>
                        <a href="/static/search/#" style="color: #111;" class="aaa">摄影摄像 ></a>
                        <li style="height: 60px;">

                            <a href="/static/search/#" style="color: #999;">数码相机</a>
                            <a href="/static/search/#" style="color: #999;">单电/微单相机</a>
                            <a href="/static/search/#" style="color: #999;">单反相机</a>
                            <a href="/static/search/#" style="color: #999;">拍立得</a>
                            <a href="/static/search/#" style="color: #999;">运动相机</a>
                            <a href="/static/search/#" style="color: #999;">摄像机</a>
                            <a href="/static/search/#" style="color: #999;">镜头</a>
                            <a href="/static/search/#" style="color: #999;">户外器材</a>
                            <a href="/static/search/#" style="color: #999;">影棚器材</a>
                            <a href="/static/search/#" style="color: #999;">冲印服务</a>
                            <a href="/static/search/#" style="color: #999;">数码相框</a>
                        </li>
                        <a href="/static/search/#" style="color: #111;" class="aaa">数码配件 ></a>
                        <li style="height: 60px;">

                            <a href="/static/search/#" style="color: #999;">三脚架/云台</a>
                            <a href="/static/search/#" style="color: #999;">相机包</a>
                            <a href="/static/search/#" style="color: #999;">滤镜</a>
                            <a href="/static/search/#" style="color: #999;">散光灯/手柄</a>
                            <a href="/static/search/#" style="color: #999;">相机清洁</a>
                            <a href="/static/search/#" style="color: #999;">机身附件</a>
                            <a href="/static/search/#" style="color: #999;">镜头附件</a>
                            <a href="/static/search/#" style="color: #999;">读卡器</a>
                            <a href="/static/search/#" style="color: #999;">支架</a>
                            <a href="/static/search/#" style="color: #999;">电池/存电器</a>

                        </li>
                        <a href="/static/search/#" style="color: #111;" class="aaa">影音娱乐 ></a>
                        <li>

                            <a href="/static/search/#" style="color: #999;">耳机/耳麦</a>
                            <a href="/static/search/#" style="color: #999;">音箱/音响</a>
                            <a href="/static/search/#" style="color: #999;">智能音箱</a>
                            <a href="/static/search/#" style="color: #999;">便携/无线音箱</a>
                            <a href="/static/search/#" style="color: #999;">收音机</a>
                            <a href="/static/search/#" style="color: #999;">麦克风</a>
                            <a href="/static/search/#" style="color: #999;">MP3/MP4</a>
                            <a href="/static/search/#" style="color: #999;">专业音频</a>
                        </li>
                        <a href="/static/search/#" style="color: #111;" class="aaa">智能设备 ></a>
                        <li style="height: 60px;">

                            <a href="/static/search/#" style="color: #999;">智能手环</a>
                            <a href="/static/search/#" style="color: #999;">智能手表</a>
                            <a href="/static/search/#" style="color: #999;">智能眼镜</a>
                            <a href="/static/search/#" style="color: #999;">智能机器人</a>
                            <a href="/static/search/#" style="color: #999;">运动跟踪器</a>
                            <a href="/static/search/#" style="color: #999;">健康监测</a>
                            <a href="/static/search/#" style="color: #999;">智能配饰</a>
                            <a href="/static/search/#" style="color: #999;">智能家居</a>
                            <a href="/static/search/#" style="color: #999;">体感车</a>
                            <a href="/static/search/#" style="color: #999;">无人机</a>
                            <a href="/static/search/#" style="color: #999;">其他配件</a>
                        </li>
                        <a href="/static/search/#" style="color: #111;" class="aaa">电子教育 ></a>
                        <li>
                            <a href="/static/search/#" style="color: #999;">学生平板</a>
                            <a href="/static/search/#" style="color: #999;">点读机</a>
                            <a href="/static/search/#" style="color: #999;">早教益智</a>
                            <a href="/static/search/#" style="color: #999;">录音笔</a>
                            <a href="/static/search/#" style="color: #999;">电纸书</a>
                            <a href="/static/search/#" style="color: #999;">电子词典</a>
                            <a href="/static/search/#" style="color: #999;">复读机</a>
                        </li>
                    </ol>
                    <div class="header_r">
                        <div class="header_r_tu">
                            <a href="/static/search/#"><img src="/static/search/img/56b2f385n8e4eb051.jpg"/></a>
                            <a href="/static/search/#"><img src="/static/search/img/56b2f385n8e4eb051.jpg"/></a>
                            <a href="/static/search/#"><img src="/static/search/img/56b2f385n8e4eb051.jpg"/></a>
                            <a href="/static/search/#"><img src="/static/search/img/56b2f385n8e4eb051.jpg"/></a>
                            <a href="/static/search/#"><img src="/static/search/img/56b2f385n8e4eb051.jpg"/></a>
                            <a href="/static/search/#"><img src="/static/search/img/56b2f385n8e4eb051.jpg"/></a>
                            <a href="/static/search/#"><img src="/static/search/img/56b2f385n8e4eb051.jpg"/></a>
                            <a href="/static/search/#"><img src="/static/search/img/56b2f385n8e4eb051.jpg"/></a>
                        </div>
                        <div class="header_r_tu1">
                            <a href="/static/search/#"><img src="/static/search/img/JD_ash7 - 副本.png"/></a>
                            <a href="/static/search/#"><img src="/static/search/img/JD_ash6.png"/></a>
                        </div>
                    </div>
                </div>
            </li>
            <li>
                <a href="/static/search/#" class="header_main_left_a"><b>电脑</b> / <b>办公</b></a>
            </li>
            <li>
                <a href="/static/search/#" class="header_main_left_a"><b>家居</b> / <b>家具</b> / <b>家装</b> /
                    <b>厨具</b></a>
            </li>
            <li>
                <a href="/static/search/#" class="header_main_left_a"><b>男装</b> / <b>女装</b> / <b>童装</b> /
                    <b>内衣</b></a>
            </li>
            <li>
                <a href="/static/search/#" class="header_main_left_a"><b>美妆个护 </b>/ <b>宠物</b></a>
            </li>
            <li>
                <a href="/static/search/#" class="header_main_left_a"><b>女鞋</b> / <b>箱包</b> / <b>钟表</b> /
                    <b>珠宝</b></a>
            </li>
            <li>
                <a href="/static/search/#" class="header_main_left_a"><b>男鞋</b> / <b>运动</b> / <b>户外</b></a>
            </li>
            <li>
                <a href="/static/search/#" class="header_main_left_a"><b>汽车</b> / <b>汽车用品</b></a>
            </li>
            <li>
                <a href="/static/search/#" class="header_main_left_a"><b>母婴</b> / <b>玩具乐器</b></a>
            </li>
            <li>
                <a href="/static/search/#" class="header_main_left_a"><b>食品</b> / <b>酒类</b> / <b>生鲜</b> /
                    <b>特产</b></a>
            </li>
            <li>
                <a href="/static/search/#" class="header_main_left_a"><b>礼品鲜花</b> / <b>农资绿植</b></a>
            </li>
            <li>
                <a href="/static/search/#" class="header_main_left_a"><b>医药保健</b> / <b>计生情趣</b></a>
            </li>
            <li>
                <a href="/static/search/#" class="header_main_left_a"><b>图书</b> / <b>音箱</b>/ <b>电子书</b></a>
            </li>
            <li>
                <a href="/static/search/#" class="header_main_left_a"><b>机票</b> / <b>酒店</b> / <b>旅游</b> /
                    <b>生活</b></a>
            </li>
            <li>
                <a href="/static/search/#" class="header_main_left_a"><b>理财</b> / <b>众筹</b> / <b>白条</b> /
                    <b>保险</b></a>
            </li>
        </ul>

    </div>
</div>

<hr style="border: 1px solid red;margin-top: -7px;">

<!--热卖促销-->
<div class="JD_temai">
    <div class="JD_main">
        <div class="JD_left">
            <div class="hd">
                热卖推荐
            </div>
            <div class="bd mc">
                <ul class="mc">
                    <li>
                        <a href="/static/search/#" class="mc_a"><img src="/static/search/./img/5a28b5a1n8a5c095f.jpg"
                                                                     alt=""></a>
                        <div class="mc_div">
                            <a href="/static/search/#" class="mc_div_a1">
                                <em>华为 HUAWEI nova 2S 全面屏四摄 6GB +64GB 曜石黑 移动联通电信4G手机 双卡双待</em>
                            </a>
                            <p>
                                <strong>
                                    <em class="number J-p-5963064">￥2999.00</em>
                                </strong>
                            </p>
                            <a href="/static/search/#" class="mc_div_a2">立即抢购</a>
                        </div>
                    </li>
                    <li>
                        <a href="/static/search/#" class="mc_a"><img src="/static/search/./img/59f5eef1n99542494.jpg"
                                                                     alt=""></a>
                        <div class="mc_div">
                            <a href="/static/search/#" class="mc_div_a1">
                                <em>【预约版】华为 HUAWEI 畅享7S 全面屏双摄 4GB +64GB 黑色 移动联通电信4G手机
                                    双卡双待</em>
                            </a>
                            <p>
                                <strong>
                                    <em class="number J-p-5963064">￥1699.00</em>
                                </strong>
                            </p>
                            <a href="/static/search/#" class="mc_div_a2">立即抢购</a>
                        </div>
                    </li>
                    <li style="margin-right: 0">
                        <a href="/static/search/#" class="mc_a"><img src="/static/search/./img/59f5eef1n99542494.jpg"
                                                                     alt=""></a>
                        <div class="mc_div">
                            <a href="/static/search/#" class="mc_div_a1">
                                <em>华为 HUAWEI nova 2S 全面屏四摄 6GB +64GB 曜石黑 移动联通电信4G手机 双卡双待</em>
                            </a>
                            <p>
                                <strong>
                                    <em class="number J-p-5963064">￥2999.00</em>
                                </strong>
                            </p>
                            <a href="/static/search/#" class="mc_div_a2">立即抢购</a>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
        <div class="JD_right">
            <div class="hd"> 促销活动</div>
            <div class="bd">
                <ul>
                    <li> . <a href="/static/search/#">红米千元全面屏手机上市</a></li>
                    <li> . <a href="/static/search/#">锤子坚果Pro2火爆预约中</a></li>
                    <li> . <a href="/static/search/#">大牌新品 疯狂抢购</a></li>
                    <li> . <a href="/static/search/#">X20 vivo蓝新色上市</a></li>
                    <li> . <a href="/static/search/#">荣耀畅玩7X新品上市</a></li>
                </ul>
            </div>
        </div>
    </div>
</div>

<!--手机-->
<div class="JD_ipone">
    <div class="JD_ipone_bar">
        <div class="JD_ipone_one a">
            <a href="/static/search/#">手机</a>
        </div>
        <i><img src="/static/search/image/right-@1x.png" alt=""></i>
        <div class="JD_ipone_one b">
            <a href="/static/search/#" class="qqq">手机通讯录 <img src="/static/search/image/down-@1x.png" alt=""></a>
            <div>
                <a href="/static/search/#">手机通讯</a>
                <a href="/static/search/#">运营商</a>
                <a href="/static/search/#">手机配件</a>
                <a href="/static/search/#">手机服务</a>
            </div>
        </div>
        <i><img src="/static/search/image/right-@1x.png" alt=""></i>
        <div class="JD_ipone_one c">
            <a href="/static/search/#" class="qqq">手机 <img src="/static/search/image/down-@1x.png" alt=""></a>
            <div>
                <a href="/static/search/#">手机</a>
                <a href="/static/search/#">老人机</a>
                <a href="/static/search/#">对讲机</a>
                <a href="/static/search/#">女性手机</a>
                <a href="/static/search/#">超续航手机</a>
                <a href="/static/search/#">全面屏手机</a>
                <a href="/static/search/#">拍照手机</a>
                <a href="/static/search/#">游戏手机</a>
            </div>
        </div>
        <div class="JD_ipone_one c">
            <!-- 遍历面包屑功能 -->
            <a th:href="${nav.link}" th:each="nav:${result.navs}"><span th:text="${nav.navName}"></span>：<span
                    th:text="${nav.navValue}"></span> x</a>
        </div>
        <i><img src="/static/search/image/right-@1x.png" alt=""></i>
    </div>
</div>

<!--商品筛选和排序-->
<div class="JD_banner w">
    <div class="JD_nav">
        <div class="JD_selector">
            <!--手机商品筛选-->
            <div class="title">
                <h3><b>手机</b><em>商品筛选</em></h3>
                <div class="st-ext">共&nbsp;<span>10135</span>个商品</div>
            </div>
            <div class="JD_nav_logo" th:with="brandid = ${param.getBrandId}">
                <!--品牌-->
                <div class="JD_nav_wrap" th:if="${#strings.isEmpty(brandid)}">
                    <div class="sl_key">
                        <span><b>品牌：</b></span>
                    </div>
                    <div class="sl_value">
                        <div class="sl_value_logo">
                            <ul>
                                <li th:each="brand:${result.brands}">
                                    <a href="/static/search/#"
                                       th:href="${'javascript:searchProducts(&quot;brandId&quot;, '+brand.brandId+')'}">
                                        <img th:src="${brand.brandImg}" alt="">
                                        <div th:text="${brand.brandName}">
                                            华为(HUAWEI)
                                        </div>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div class="sl_ext">
                        <a href="/static/search/#">
                            更多
                            <i style='background: url("image/search.ele.png")no-repeat 3px 7px'></i>
                            <b style='background: url("image/search.ele.png")no-repeat 3px -44px'></b>
                        </a>
                        <a href="/static/search/#">
                            多选
                            <i>+</i>
                            <span>+</span>
                        </a>
                    </div>
                </div>

                <!--分类-->
                <div class="JD_pre">
                    <div class="sl_key">
                        <span><b>分类：</b></span>
                    </div>
                    <div class="sl_value">
                        <ul>
                            <li th:each="catalog:${result.catalogs}">
                                <a href="/static/search/#"
                                   th:href="${'javascript:searchProducts(&quot;catalog3Id&quot;, '+catalog.catalogId+')'}"
                                   th:text="${catalog.catalogName}">5.56英寸及以上</a>
                            </li>
                        </ul>
                    </div>
                    <div class="sl_ext">
                        <a href="/static/search/#">
                            更多
                            <i style='background: url("image/search.ele.png")no-repeat 3px 7px'></i>
                            <b style='background: url("image/search.ele.png")no-repeat 3px -44px'></b>
                        </a>
                        <a href="/static/search/#">
                            多选
                            <i>+</i>
                            <span>+</span>
                        </a>
                    </div>
                </div>

                <!--其他的所有需要展示的属性-->
                <div class="JD_pre" th:each="attr : ${result.attrs}" th:if="${!#lists.contains(result.attrIds, attr.attrId)}">
                    <div class="sl_key">
                        <span th:text="${attr.attrName}">屏幕尺寸：</span>
                    </div>
                    <div class="sl_value">
                        <ul>
                            <li th:each="val:${attr.attrValue}">
                                <a href="/static/search/#"
                                   th:href="${'javascript:searchProducts(&quot;attrs&quot;, &quot;'+attr.attrId+'_'+val+'&quot;)'}"
                                   th:text="${val}">5.56英寸及以上</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="JD_show">
                <a href="/static/search/#">
                    <span>
                        更多选项（ CPU核数、网络、机身颜色 等）
                    </span>
                </a>
            </div>
        </div>
        <!--排序-->
        <div class="JD_banner_main">
            <!--商品精选-->
            <div class="JD_con_left">
                <div class="JD_con_left_bar">
                    <div class="JD_con_one">
                        <div class="mt">
                            <h3>商品精选</h3>
                            <span>广告</span>
                        </div>
                        <div class="mc">
                            <ul>
                                <li>
                                    <a href="/static/search/#"
                                       title="vivo X9s 全网通 4GB+64GB 磨砂黑 移动联通电信4G手机 双卡双待"><img
                                            src="/static/search/img/59bf3c47n91d65c73.jpg" alt=""></a>
                                    <a href="/static/search/#"
                                       title="【预约版】华为 HUAWEI 畅享7S 全面屏双摄 4GB +64GB 黑色 移动联通电信4G手机 双卡双待">
                                        <em>华为 HUAWEI nova 2S 全面屏四摄 6GB +64GB 曜石黑 移动联通电信4G手机
                                            双卡双待</em>
                                    </a>
                                    <div class="mc_price">
                                        <strong class="price">
                                            <span class="J-p-5963064">￥2999.00</span>
                                        </strong>
                                        <span class="mc-ico" title="购买本商品送赠品">
                                            <i class="goods-icons">赠品</i>
                                        </span>
                                    </div>
                                    <div class="mc_rev">
                                        已有
                                        <a href="/static/search/#" class="number">12466</a>
                                        人评价
                                    </div>
                                </li>
                                <li>
                                    <a href="/static/search/#"
                                       title="vivo X9s 全网通 4GB+64GB 磨砂黑 移动联通电信4G手机 双卡双待"><img
                                            src="/static/search/img/59bf3c47n91d65c73.jpg" alt=""></a>
                                    <a href="/static/search/#"
                                       title="【预约版】华为 HUAWEI 畅享7S 全面屏双摄 4GB +64GB 黑色 移动联通电信4G手机 双卡双待">
                                        <em>华为 HUAWEI nova 2S 全面屏四摄 6GB +64GB 曜石黑 移动联通电信4G手机
                                            双卡双待</em>
                                    </a>
                                    <div class="mc_price">
                                        <strong class="price">
                                            <span class="J-p-5963064">￥2999.00</span>
                                        </strong>
                                        <span class="mc-ico" title="购买本商品送赠品">
                                            <i class="goods-icons">赠品</i>
                                        </span>
                                    </div>
                                    <div class="mc_rev">
                                        已有
                                        <a href="/static/search/#" class="number">12466</a>
                                        人评价
                                    </div>
                                </li>
                                <li>
                                    <a href="/static/search/#"
                                       title="vivo X9s 全网通 4GB+64GB 磨砂黑 移动联通电信4G手机 双卡双待"><img
                                            src="/static/search/img/593ba628n8794c6a6.jpg" alt=""></a>
                                    <a href="/static/search/#"
                                       title="【预约版】华为 HUAWEI 畅享7S 全面屏双摄 4GB +64GB 黑色 移动联通电信4G手机 双卡双待">
                                        <em>诺基亚 7 (Nokia 7) 4GB+64GB 黑色 全网通 双卡双待 移动联通电信4G手机</em>
                                    </a>
                                    <div class="mc_price">
                                        <strong class="price">
                                            <span class="J-p-5963064">￥1799.00</span>
                                        </strong>
                                        <span class="mc-ico" title="购买本商品送赠品">
                                            <i class="goods-icons">赠品</i>
                                        </span>
                                    </div>
                                    <div class="mc_rev">
                                        已有
                                        <a href="/static/search/#" class="number">15600</a>
                                        人评价
                                    </div>
                                </li>
                                <li>
                                    <a href="/static/search/#"
                                       title="vivo X9s 全网通 4GB+64GB 磨砂黑 移动联通电信4G手机 双卡双待"><img
                                            src="/static/search/img/5919637an271a1301.jpg" alt=""></a>
                                    <a href="/static/search/#"
                                       title="【预约版】华为 HUAWEI 畅享7S 全面屏双摄 4GB +64GB 黑色 移动联通电信4G手机 双卡双待">
                                        <em>vivo Xplay6 全网通 6GB+64GB 磨砂黑 移动联通电信4G手机 双卡双待</em>
                                    </a>
                                    <div class="mc_price">
                                        <strong class="price">
                                            <span class="J-p-5963064">￥3498.00</span>
                                        </strong>
                                        <span class="mc-ico" title="购买本商品送赠品">
                                            <i class="goods-icons">赠品</i>
                                        </span>
                                    </div>
                                    <div class="mc_rev">
                                        已有
                                        <a href="/static/search/#" class="number">5369</a>
                                        人评价
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div class="JD_con_one">
                        <div class="mt">
                            <h3>达人选购</h3>
                        </div>
                        <div class="mc">
                            <ul>
                                <li>
                                    <a href="/static/search/#"
                                       title="vivo X9s 全网通 4GB+64GB 磨砂黑 移动联通电信4G手机 双卡双待"><img
                                            src="/static/search/img/59bf3c47n91d65c73.jpg" alt=""></a>
                                    <a href="/static/search/#">
                                        <em>华为 HUAWEI nova 2S 全面屏四摄 6GB +64GB 曜石黑 移动联通电信4G手机
                                            双卡双待</em>
                                    </a>
                                    <div class="mc_price">
                                        <strong class="price">
                                            <span class="J-p-5963064">￥2999.00</span>
                                        </strong>
                                    </div>
                                </li>
                                <li>
                                    <a href="/static/search/#"
                                       title="vivo X9s 全网通 4GB+64GB 磨砂黑 移动联通电信4G手机 双卡双待"><img
                                            src="/static/search/img/59bf3c47n91d65c73.jpg" alt=""></a>
                                    <a href="/static/search/#">
                                        <em>华为 HUAWEI nova 2S 全面屏四摄 6GB +64GB 曜石黑 移动联通电信4G手机
                                            双卡双待</em>
                                    </a>
                                    <div class="mc_price">
                                        <strong class="price">
                                            <span class="J-p-5963064">￥2999.00</span>
                                        </strong>
                                    </div>
                                </li>
                                <li>
                                    <a href="/static/search/#"
                                       title="vivo X9s 全网通 4GB+64GB 磨砂黑 移动联通电信4G手机 双卡双待"><img
                                            src="/static/search/img/593ba628n8794c6a6.jpg" alt=""></a>
                                    <a href="/static/search/#">
                                        <em>诺基亚 7 (Nokia 7) 4GB+64GB 黑色 全网通 双卡双待 移动联通电信4G手机</em>
                                    </a>
                                    <div class="mc_price">
                                        <strong class="price">
                                            <span class="J-p-5963064">￥1799.00</span>
                                        </strong>
                                    </div>
                                </li>
                                <li>
                                    <a href="/static/search/#"
                                       title="vivo X9s 全网通 4GB+64GB 磨砂黑 移动联通电信4G手机 双卡双待"><img
                                            src="/static/search/img/5919637an271a1301.jpg" alt=""></a>
                                    <a href="/static/search/#">
                                        <em>vivo Xplay6 全网通 6GB+64GB 磨砂黑 移动联通电信4G手机 双卡双待</em>
                                    </a>
                                    <div class="mc_price">
                                        <strong class="price">
                                            <span class="J-p-5963064">￥3498.00</span>
                                        </strong>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div class="JD_con_one" style="border:none;">
                        <div class="mt">
                            <h3>商品精选</h3>
                            <span>广告</span>
                        </div>
                        <div class="mc">
                            <ul>
                                <li>
                                    <a href="/static/search/#"><img src="/static/search/img/599a806bn9d829c1c.jpg"
                                                                    alt=""></a>
                                </li>
                                <li>
                                    <a href="/static/search/#"><img src="/static/search/img/593e4de0n5ff878a4.jpg"
                                                                    alt=""></a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <!--综合排序-->
            <div class="JD_con_right">
                <div class="filter">
                    <!--综合排序-->
                    <div class="filter_top">
                        <div class="filter_top_left" th:with="p = ${param.sort}, priceRange = ${param.skuPrice}">
                            <a th:class="${(!#strings.isEmpty(p) && #strings.startsWith(p, 'hotScore') && #strings.endsWith(p, 'desc')) ? 'sort_a desc' : 'sort_a'}"
                               th:attr="style=${(#strings.isEmpty(p) || #strings.startsWith(p, 'hotScore')) ? 'color: #fff; border-color: #e4393c; background: #e4393c;' : 'color: #333; border-color: #ccc; background: #fff;'}"
                               sort="hotScore" href="/static/search/#">综合排序 [[${(!#strings.isEmpty(p) && #strings.startsWith(p, 'hotScore') && #strings.endsWith(p, 'desc')) ? '↓' : '↑'}]]</a>
                            <a th:class="${(!#strings.isEmpty(p) && #strings.startsWith(p, 'saleCount') && #strings.endsWith(p, 'desc')) ? 'sort_a desc' : 'sort_a'}"
                               th:attr="style=${(!#strings.isEmpty(p) && #strings.startsWith(p, 'saleCount')) ? 'color: #fff; border-color: #e4393c; background: #e4393c;' : 'color: #333; border-color: #ccc; background: #fff;'}"
                               sort="saleCount" href="/static/search/#">销量 [[${(!#strings.isEmpty(p) && #strings.startsWith(p, 'saleCount') && #strings.endsWith(p, 'desc')) ? '↓' : '↑'}]]</a>
                            <a th:class="${(!#strings.isEmpty(p) && #strings.startsWith(p, 'skuPrice') && #strings.endsWith(p, 'desc')) ? 'sort_a desc' : 'sort_a'}"
                               th:attr="style=${(!#strings.isEmpty(p) && #strings.startsWith(p, 'skuPrice')) ? 'color: #fff; border-color: #e4393c; background: #e4393c;' : 'color: #333; border-color: #ccc; background: #fff;'}"
                               sort="skuPrice" href="/static/search/#">价格 [[${(!#strings.isEmpty(p) && #strings.startsWith(p, 'skuPrice') && #strings.endsWith(p, 'desc')) ? '↓' : '↑'}]]</a>
                            <a href="/static/search/#">评论分</a>
                            <a href="/static/search/#">上架时间</a>
                            <input id="skuPriceFrom" type="number"
                                   th:value="${#strings.isEmpty(priceRange)?'':#strings.substringBefore(priceRange,'_')}"
                                   style="width: 100px; margin-left: 30px">
                            -
                            <input id="skuPriceTo" type="number"
                                   th:value="${#strings.isEmpty(priceRange)?'':#strings.substringAfter(priceRange,'_')}"
                                   style="width: 100px">
                            <button id="skuPriceSearchBtn">确定</button>
                        </div>
                        <div class="filter_top_right">
                            <span class="fp-text">
                               <b>1</b><em>/</em><i>169</i>
                           </span>
                            <a href="/static/search/#" class="prev"><</a>
                            <a href="/static/search/#" class="next"> > </a>
                        </div>
                    </div>
                    <!--收货地址-->
                    <div class="filter_bottom">
                        <div class="filter_bottom_left">
                            <div class="fs-cell">收货地</div>
                            <div class="dizhi">
                                <div class="dizhi_show">
                                    <em>北京朝阳区三环以内</em>
                                    <b></b>
                                </div>
                            </div>
                            <div class="dizhi_con">
                                <ul id="tab">
                                    <li id="tab1" value="1">北京 <img src="/static/search/image/down-@1x.png" alt="">
                                    </li>
                                    <li id="tab2" value="2">朝阳 <img src="/static/search/image/down-@1x.png" alt="">
                                    </li>
                                    <li id="tab3" value="3">三环以内 <img src="/static/search/image/down-@1x.png"
                                                                          alt=""></li>
                                </ul>
                                <div id="container">
                                    <div id="content1" style="z-index: 1;">
                                        <a href="/static/search/#">北京</a>
                                        <a href="/static/search/#">上海</a>
                                        <a href="/static/search/#">天津</a>
                                        <a href="/static/search/#">重庆</a>
                                        <a href="/static/search/#">河北</a>
                                        <a href="/static/search/#">山西</a>
                                        <a href="/static/search/#">河南</a>
                                        <a href="/static/search/#">辽宁</a>
                                        <a href="/static/search/#">吉林</a>
                                        <a href="/static/search/#">黑龙江</a>
                                        <a href="/static/search/#">内蒙古</a>
                                        <a href="/static/search/#">江苏</a>
                                        <a href="/static/search/#">山东</a>
                                        <a href="/static/search/#">安徽</a>
                                        <a href="/static/search/#">浙江</a>
                                        <a href="/static/search/#">福建</a>
                                        <a href="/static/search/#">湖北</a>
                                        <a href="/static/search/#">湖南</a>
                                        <a href="/static/search/#">广东</a>
                                        <a href="/static/search/#">广西</a>
                                        <a href="/static/search/#">江西</a>
                                        <a href="/static/search/#">四川</a>
                                        <a href="/static/search/#">海南</a>
                                        <a href="/static/search/#">贵州</a>
                                        <a href="/static/search/#">云南</a>
                                        <a href="/static/search/#">西藏</a>
                                        <a href="/static/search/#">陕西</a>
                                        <a href="/static/search/#">甘肃</a>
                                        <a href="/static/search/#">青海</a>
                                        <a href="/static/search/#">宁夏</a>
                                        <a href="/static/search/#">新疆</a>
                                        <a href="/static/search/#">港澳</a>
                                        <a href="/static/search/#">台湾</a>
                                        <a href="/static/search/#">钓鱼岛</a>
                                        <a href="/static/search/#">海外</a>

                                    </div>
                                    <div id="content2">
                                        <a href="/static/search/#">朝阳区</a>
                                        <a href="/static/search/#">海淀区</a>
                                        <a href="/static/search/#">西城区</a>
                                        <a href="/static/search/#">东城区</a>
                                        <a href="/static/search/#">大兴区</a>
                                        <a href="/static/search/#">丰台区</a>
                                        <a href="/static/search/#">昌平区</a>
                                        <a href="/static/search/#">顺义区</a>

                                    </div>
                                    <div id="content3">
                                        <a href="/static/search/#">三环以内</a>
                                        <a href="/static/search/#">管庄</a>
                                        <a href="/static/search/#">北苑</a>
                                        <a href="/static/search/#">定福庄</a>
                                        <a href="/static/search/#">三环到四环之间</a>
                                        <a href="/static/search/#">四环到五环之间</a>
                                        <a href="/static/search/#">五环到六环之间</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="filter_bottom_right">
                            <ul>
                                <li>
                                    <a href="/static/search/#">
                                        <i></i>
                                        谷粒商城配送
                                    </a>
                                </li>
                                <li>
                                    <a href="/static/search/#">
                                        <i></i>
                                        京尊达 </a>
                                </li>
                                <li>
                                    <a href="/static/search/#">
                                        <i></i>
                                        货到付款
                                    </a>
                                </li>
                                <li>
                                    <a th:with="check = ${param.hasStock}">
                                        <input id="showHasStock" type="checkbox" th:checked="${#strings.equals(check,'1')?true:false}">
                                        仅显示有货
                                    </a>
                                </li>
                                <li>
                                    <a href="/static/search/#">
                                        <i></i>
                                        可配送全球
                                    </a>
                                </li>
                            </ul>
                        </div>

                    </div>
                    <!--排序内容;商品每4个是一组-->
                    <div class="rig_tab">
                        <div th:each="product:${result.getProducts()}">
                            <div class="ico">
                                <i class="iconfont icon-weiguanzhu"></i>
                                <a href="/static/search/#">关注</a>
                            </div>
                            <p class="da">
                                <a href="/static/search/#">
                                    <img th:src="${product.skuImg}" class="dim">
                                </a>
                            </p>
                            <ul class="tab_im">
                                <li><a href="/static/search/#" title="黑色">
                                    <img th:src="${product.skuImg}"></a></li>
                            </ul>
                            <p class="tab_R">
                                <span th:text="'￥'+${product.getSkuPrice()}">¥5199.00</span>
                            </p>
                            <p class="tab_JE">
                                <a href="/static/search/#" th:utext="${product.skuTitle}">
                                    Apple iPhone 7 Plus (A1661) 32G 黑色 移动联通电信4G手机
                                </a>
                            </p>
                            <p class="tab_PI">已有<span>11万+</span>热门评价
                                <a href="/static/search/#">二手有售</a>
                            </p>
                            <p class="tab_CP"><a href="/static/search/#"
                                                 title="谷粒商城Apple产品专营店">谷粒商城Apple产品...</a>
                                <a href='#' title="联系供应商进行咨询">
                                    <img src="/static/search/img/xcxc.png">
                                </a>
                            </p>
                            <div class="tab_FO">
                                <div class="FO_one">
                                    <p>自营
                                        <span>谷粒商城自营,品质保证</span>
                                    </p>
                                    <p>满赠
                                        <span>该商品参加满赠活动</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!--分页-->
                    <div class="filter_page">
                        <div class="page_wrap">
                            <span class="page_span1">
                                <a class="page_a" th:attr="pn=${result.pageNum - 1 }"
                                   th:if="${result.pageNum>1}">
                                    < 上一页
                                </a>
                                <a class="page_a" th:attr="pn=${nav}, style=${nav == result.pageNum?'border: 0;color:#ee2222;background: #fff':''}" style=""
                                    th:each="nav:${result.PageNavs}">[[${nav}]]</a>
                                <a class="page_a" th:attr="pn=${result.pageNum + 1}"
                                   th:if="${result.pageNum<result.totalPages}">
                                    下一页 >
                                </a>
                            </span>
                            <span class="page_span2">
                                <em>共<b>[[${result.totalPages}]]</b>页&nbsp;&nbsp;到第</em>
                                <input type="number" value="1">
                                <em>页</em>
                                <a class="page_submit">确定</a>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!--商品精选-->
<div class="JD_jx">
    <div class="JD_jx_title">
        <div class="mt">
            <strong class="mt-title">商品精选</strong>
            <img src="/static/search/image/u-ad.gif" alt="">
        </div>
        <div class="mc">
            <ul>
                <li>
                    <div class="mc_img">
                        <a href="/static/search/#"
                           title="【预约版】华为 HUAWEI 畅享7S 全面屏双摄 4GB +64GB 黑色 移动联通电信4G手机 双卡双待">
                            <img src="/static/search/img/5a25ffc7N98b35d49.jpg" alt="">
                        </a>
                    </div>
                    <div class="mc_name">
                        <a href="/static/search/#"
                           title="【预约版】华为 HUAWEI 畅享7S 全面屏双摄 4GB +64GB 黑色 移动联通电信4G手机 双卡双待">
                            <em>【预约版】华为 HUAWEI 畅享7S 全面屏双摄 4GB +64GB 黑色 移动联通电信4G手机 双卡双待</em>
                        </a>
                    </div>
                    <div class="mc_price">
                        <strong>
                            <span>￥1999.00</span>
                        </strong>
                        <span class="mc_ico" title="购买本商品送赠品">赠品</span>
                    </div>
                    <div class="mc_rev">
                        <a href="/static/search/#">15930</a>
                        <span>人好评</span>
                    </div>
                </li>
                <li>
                    <div class="mc_img">
                        <a href="/static/search/#"
                           title="【预约版】华为 HUAWEI 畅享7S 全面屏双摄 4GB +64GB 黑色 移动联通电信4G手机 双卡双待">
                            <img src="/static/search/img/5a25ffc7N98b35d49.jpg" alt="">
                        </a>
                    </div>
                    <div class="mc_name">
                        <a href="/static/search/#"
                           title="【预约版】华为 HUAWEI 畅享7S 全面屏双摄 4GB +64GB 黑色 移动联通电信4G手机 双卡双待">
                            <em>【预约版】华为 HUAWEI 畅享7S 全面屏双摄 4GB +64GB 黑色 移动联通电信4G手机 双卡双待</em>
                        </a>
                    </div>
                    <div class="mc_price">
                        <strong>
                            <span>￥1999.00</span>
                        </strong>
                        <span class="mc_ico" title="购买本商品送赠品">赠品</span>
                    </div>
                    <div class="mc_rev">
                        <a href="/static/search/#">15930</a>
                        <span>人好评</span>
                    </div>
                </li>
                <li>
                    <div class="mc_img">
                        <a href="/static/search/#"
                           title="【预约版】华为 HUAWEI 畅享7S 全面屏双摄 4GB +64GB 黑色 移动联通电信4G手机 双卡双待">
                            <img src="/static/search/img/5a25ffc7N98b35d49.jpg" alt="">
                        </a>
                    </div>
                    <div class="mc_name">
                        <a href="/static/search/#"
                           title="【预约版】华为 HUAWEI 畅享7S 全面屏双摄 4GB +64GB 黑色 移动联通电信4G手机 双卡双待">
                            <em>【预约版】华为 HUAWEI 畅享7S 全面屏双摄 4GB +64GB 黑色 移动联通电信4G手机 双卡双待</em>
                        </a>
                    </div>
                    <div class="mc_price">
                        <strong>
                            <span>￥1999.00</span>
                        </strong>
                        <span class="mc_ico" title="购买本商品送赠品">赠品</span>
                    </div>
                    <div class="mc_rev">
                        <a href="/static/search/#">15930</a>
                        <span>人好评</span>
                    </div>
                </li>
                <li>
                    <div class="mc_img">
                        <a href="/static/search/#"
                           title="【预约版】华为 HUAWEI 畅享7S 全面屏双摄 4GB +64GB 黑色 移动联通电信4G手机 双卡双待">
                            <img src="/static/search/img/5a25ffc7N98b35d49.jpg" alt="">
                        </a>
                    </div>
                    <div class="mc_name">
                        <a href="/static/search/#"
                           title="【预约版】华为 HUAWEI 畅享7S 全面屏双摄 4GB +64GB 黑色 移动联通电信4G手机 双卡双待">
                            <em>【预约版】华为 HUAWEI 畅享7S 全面屏双摄 4GB +64GB 黑色 移动联通电信4G手机 双卡双待</em>
                        </a>
                    </div>
                    <div class="mc_price">
                        <strong>
                            <span>￥1999.00</span>
                        </strong>
                        <span class="mc_ico" title="购买本商品送赠品">赠品</span>
                    </div>
                    <div class="mc_rev">
                        <a href="/static/search/#">15930</a>
                        <span>人好评</span>
                    </div>
                </li>
                <li>
                    <div class="mc_img">
                        <a href="/static/search/#"
                           title="【预约版】华为 HUAWEI 畅享7S 全面屏双摄 4GB +64GB 黑色 移动联通电信4G手机 双卡双待">
                            <img src="/static/search/img/5a25ffc7N98b35d49.jpg" alt="">
                        </a>
                    </div>
                    <div class="mc_name">
                        <a href="/static/search/#"
                           title="【预约版】华为 HUAWEI 畅享7S 全面屏双摄 4GB +64GB 黑色 移动联通电信4G手机 双卡双待">
                            <em>【预约版】华为 HUAWEI 畅享7S 全面屏双摄 4GB +64GB 黑色 移动联通电信4G手机 双卡双待</em>
                        </a>
                    </div>
                    <div class="mc_price">
                        <strong>
                            <span>￥1999.00</span>
                        </strong>
                        <span class="mc_ico" title="购买本商品送赠品">赠品</span>
                    </div>
                    <div class="mc_rev">
                        <a href="/static/search/#">15930</a>
                        <span>人好评</span>
                    </div>
                </li>
            </ul>


        </div>
    </div>
</div>

<!--猜你喜欢-->
<div class="JD_cnxh">
    <div class="JD_jx_title">
        <div class="mt">
            <strong class="mt-title">猜你喜欢</strong>
            <a href="/static/search/#">
                <img src="/static/search/image/update.png" alt="">
                换一批
            </a>
        </div>
        <div class="mc">
            <ul>
                <li>
                    <div class="mc_img">
                        <a href="/static/search/#"
                           title="诺基亚 7 (Nokia 7) 4GB+64GB 黑色 全网通 双卡双待 移动联通电信4G手机">
                            <img src="/static/search/img/59bf3c47n91d65c73.jpg" alt="">
                        </a>
                    </div>
                    <div class="mc_name">
                        <a href="/static/search/#"
                           title="诺基亚 7 (Nokia 7) 4GB+64GB 黑色 全网通 双卡双待 移动联通电信4G手机">
                            <em>诺基亚 7 (Nokia 7) 4GB+64GB 黑色 全网通 双卡双待 移动联通电信4G手机</em>
                        </a>
                    </div>
                    <div class="mc_rev">
                        <a href="/static/search/#">已有80万+人评价</a>
                    </div>
                    <div class="mc_price">
                        <strong>
                            <span>￥1999.00</span>
                        </strong>
                    </div>

                </li>
                <li>
                    <div class="mc_img">
                        <a href="/static/search/#"
                           title="诺基亚 7 (Nokia 7) 4GB+64GB 黑色 全网通 双卡双待 移动联通电信4G手机">
                            <img src="/static/search/img/5a28b5c6Ndec5088f.jpg" alt=""></a>
                    </div>
                    <div class="mc_name">
                        <a href="/static/search/#"
                           title="诺基亚 7 (Nokia 7) 4GB+64GB 黑色 全网通 双卡双待 移动联通电信4G手机">
                            <em>诺基亚 7 (Nokia 7) 4GB+64GB 黑色 全网通 双卡双待 移动联通电信4G手机</em>
                        </a>
                    </div>
                    <div class="mc_rev">
                        <a href="/static/search/#">已有80万+人评价</a>
                    </div>
                    <div class="mc_price">
                        <strong>
                            <span>￥1999.00</span>
                        </strong>
                    </div>

                </li>
                <li>
                    <div class="mc_img">
                        <a href="/static/search/#"
                           title="诺基亚 7 (Nokia 7) 4GB+64GB 黑色 全网通 双卡双待 移动联通电信4G手机"><img
                                src="/static/search/img/593e4de0n5ff878a4.jpg" alt=""></a>
                    </div>
                    <div class="mc_name">
                        <a href="/static/search/#"
                           title="诺基亚 7 (Nokia 7) 4GB+64GB 黑色 全网通 双卡双待 移动联通电信4G手机">
                            <em>诺基亚 7 (Nokia 7) 4GB+64GB 黑色 全网通 双卡双待 移动联通电信4G手机</em>
                        </a>
                    </div>
                    <div class="mc_rev">
                        <a href="/static/search/#">已有80万+人评价</a>
                    </div>
                    <div class="mc_price">
                        <strong>
                            <span>￥1999.00</span>
                        </strong>
                    </div>

                </li>
                <li>
                    <div class="mc_img">
                        <a href="/static/search/#"
                           title="诺基亚 7 (Nokia 7) 4GB+64GB 黑色 全网通 双卡双待 移动联通电信4G手机"><img
                                src="/static/search/img/593e4de0n5ff878a4.jpg" alt=""></a>
                    </div>
                    <div class="mc_name">
                        <a href="/static/search/#"
                           title="诺基亚 7 (Nokia 7) 4GB+64GB 黑色 全网通 双卡双待 移动联通电信4G手机">
                            <em>诺基亚 7 (Nokia 7) 4GB+64GB 黑色 全网通 双卡双待 移动联通电信4G手机</em>
                        </a>
                    </div>
                    <div class="mc_rev">
                        <a href="/static/search/#">已有80万+人评价</a>
                    </div>
                    <div class="mc_price">
                        <strong>
                            <span>￥1999.00</span>
                        </strong>
                    </div>

                </li>
                <li>
                    <div class="mc_img">
                        <a href="/static/search/#"
                           title="诺基亚 7 (Nokia 7) 4GB+64GB 黑色 全网通 双卡双待 移动联通电信4G手机"><img
                                src="/static/search/img/59c493a7N3f9b9c85 (1).jpg" alt=""></a>
                    </div>
                    <div class="mc_name">
                        <a href="/static/search/#"
                           title="诺基亚 7 (Nokia 7) 4GB+64GB 黑色 全网通 双卡双待 移动联通电信4G手机">
                            <em>诺基亚 7 (Nokia 7) 4GB+64GB 黑色 全网通 双卡双待 移动联通电信4G手机</em>
                        </a>
                    </div>
                    <div class="mc_rev">
                        <a href="/static/search/#">已有80万+人评价</a>
                    </div>
                    <div class="mc_price">
                        <strong>
                            <span>￥1999.00</span>
                        </strong>
                    </div>

                </li>
                <li>
                    <div class="mc_img">
                        <a href="/static/search/#"
                           title="诺基亚 7 (Nokia 7) 4GB+64GB 黑色 全网通 双卡双待 移动联通电信4G手机"><img
                                src="/static/search/img/59c493a7N3f9b9c85 (1).jpg" alt=""></a>
                    </div>
                    <div class="mc_name">
                        <a href="/static/search/#"
                           title="诺基亚 7 (Nokia 7) 4GB+64GB 黑色 全网通 双卡双待 移动联通电信4G手机">
                            <em>诺基亚 7 (Nokia 7) 4GB+64GB 黑色 全网通 双卡双待 移动联通电信4G手机</em>
                        </a>
                    </div>
                    <div class="mc_rev">
                        <a href="/static/search/#">已有80万+人评价</a>
                    </div>
                    <div class="mc_price">
                        <strong>
                            <span>￥1999.00</span>
                        </strong>
                    </div>

                </li>
            </ul>


        </div>
    </div>
</div>

<!--我的足迹-->
<div class="JD_zuji">
    <div class="JD_jx_title">
        <div class="mt">
            <strong class="mt-title">我的足迹</strong>
            <a href="/static/search/#">
                更多浏览记录
            </a>
        </div>
        <div class="mc">
            <ul>
                <li>
                    <div class="mc_img">
                        <a href="/static/search/#"
                           title="诺基亚 7 (Nokia 7) 4GB+64GB 黑色 全网通 双卡双待 移动联通电信4G手机">
                            <img src="/static/search/img/59e58a11Nc38676d5.jpg" alt="">
                        </a>
                    </div>
                    <div class="mc_price">
                        <strong>
                            <span>￥2998.00</span>
                        </strong>
                    </div>
                </li>
                <li>
                    <div class="mc_img">
                        <a href="/static/search/#"
                           title="诺基亚 7 (Nokia 7) 4GB+64GB 黑色 全网通 双卡双待 移动联通电信4G手机">
                            <img src="/static/search/img/5a28acccN73689386.jpg" alt="">
                        </a>
                    </div>
                    <div class="mc_price">
                        <strong>
                            <span>￥88.00</span>
                        </strong>
                    </div>
                </li>
                <li>
                    <div class="mc_img">
                        <a href="/static/search/#"
                           title="诺基亚 7 (Nokia 7) 4GB+64GB 黑色 全网通 双卡双待 移动联通电信4G手机">
                            <img src="/static/search/img/5a1690ddN441b5dce.jpg" alt="">
                        </a>
                    </div>
                    <div class="mc_price">
                        <strong>
                            <span>￥199.00</span>
                        </strong>
                    </div>
                </li>
                <li>
                    <div class="mc_img">
                        <a href="/static/search/#"
                           title="诺基亚 7 (Nokia 7) 4GB+64GB 黑色 全网通 双卡双待 移动联通电信4G手机">
                            <img src="/static/search/img/5a02bde7N7d4453b1.jpg" alt="">
                        </a>
                    </div>
                    <div class="mc_price">
                        <strong>
                            <span>￥799.00</span>
                        </strong>
                    </div>
                </li>
                <li>
                    <div class="mc_img">
                        <a href="/static/search/#"
                           title="诺基亚 7 (Nokia 7) 4GB+64GB 黑色 全网通 双卡双待 移动联通电信4G手机">
                            <img src="/static/search/img/5a122dbeN044ebf19.jpg" alt="">
                        </a>
                    </div>
                    <div class="mc_price">
                        <strong>
                            <span>￥599.00</span>
                        </strong>
                    </div>
                </li>
                <li>
                    <div class="mc_img">
                        <a href="/static/search/#"
                           title="诺基亚 7 (Nokia 7) 4GB+64GB 黑色 全网通 双卡双待 移动联通电信4G手机">
                            <img src="/static/search/img/59c493a7N3f9b9c85.jpg" alt="">
                        </a>
                    </div>
                    <div class="mc_price">
                        <strong>
                            <span>￥699.00</span>
                        </strong>
                    </div>
                </li>
                <li>
                    <div class="mc_img">
                        <a href="/static/search/#"
                           title="诺基亚 7 (Nokia 7) 4GB+64GB 黑色 全网通 双卡双待 移动联通电信4G手机">
                            <img src="/static/search/img/5a08f6f6N5bab2c1c.jpg" alt="">
                        </a>
                    </div>
                    <div class="mc_price">
                        <strong>
                            <span>￥715.00</span>
                        </strong>
                    </div>
                </li>
            </ul>


        </div>
    </div>
</div>

<div style="width: 1210px;margin: 0 auto;margin-bottom: 10px"><img src="/static/search/img/5a33a2e0N9a04b4af.jpg"
                                                                   alt=""></div>
<!--底部-->
<footer class="footer">
    <div class="footer_top">
        <ul>
            <li>
                <span></span>
                <h3>品类齐全，轻松购物</h3>
            </li>
            <li>
                <span></span>
                <h3>多仓直发，极速配发</h3>
            </li>
            <li>
                <span></span>
                <h3>正品行货，精致服务</h3>
            </li>
            <li>
                <span></span>
                <h3>天天低价，畅选无忧</h3>
            </li>
        </ul>
    </div>
    <div class="footer_center">
        <ol>
            <li>购物指南</li>
            <li><a href="/static/search/#" style="color: rgb(114, 114, 114);">购物流程</a>
            </li>
            <li><a href="/static/search/#" style="color: rgb(114, 114, 114);">会员介绍</a>
            </li>
            <li><a href="/static/search/#">生活旅行</a>
            </li>
            <li><a href="/static/search/#" style="color: rgb(114, 114, 114);">常见问题</a>
            </li>
            <li><a href="/static/search/#">大家电</a>
            </li>
            <li><a href="/static/search/#" style="color: rgb(114, 114, 114);">联系客服</a>
            </li>
        </ol>
        <ol>
            <li>配送方式</li>
            <li><a href="/static/search/#" style="color: rgb(114, 114, 114);">上门自提</a>
            </li>
            <li><a href="/static/search/#" style="color: rgb(114, 114, 114);">211限时达</a>
            </li>
            <li><a href="/static/search/#" style="color: rgb(114, 114, 114);">配送服务查询</a>
            </li>
            <li><a href="/static/search/#" style="color: rgb(114, 114, 114);">配送费收取标准</a>
            </li>
            <li><a href="/static/search/#" style="color: rgb(114, 114, 114);">海外配送</a>
            </li>
        </ol>
        <ol>
            <li>支付方式</li>
            <li><a href="/static/search/#" style="color: rgb(114, 114, 114);">货到付款</a>
            </li>
            <li><a href="/static/search/#" style="color: rgb(114, 114, 114);">在线支付</a>
            </li>
            <li><a href="/static/search/#" style="color: rgb(114, 114, 114);">分期付款</a>
            </li>
            <li><a href="/static/search/#" style="color: rgb(114, 114, 114);">邮局汇款</a>
            </li>
            <li><a href="/static/search/#" style="color: rgb(114, 114, 114);">公司转账</a>

            </li>
        </ol>
        <ol>
            <li>售后服务</li>
            <li><a href="/static/search/#" style="color: rgb(114, 114, 114);">售后政策</a>
            </li>
            <li><a href="/static/search/#" style="color: rgb(114, 114, 114);">价格保护</a>
            </li>
            <li><a href="/static/search/#" style="color: rgb(114, 114, 114);">退款说明</a>
            </li>
            <li><a href="/static/search/#" style="color: rgb(114, 114, 114);">返修/退换货</a>
            </li>
            <li><a href="/static/search/#">取消订单</a>
            </li>
        </ol>
        <ol>
            <li>特色服务</li>
            <li><a href="/static/search/#" style="color: rgb(114, 114, 114);">夺宝岛</a>
            </li>
            <li><a href="/static/search/#">DIY装机</a>
            </li>
            <li><a href="/static/search/#" style="color: rgb(114, 114, 114);">延保服务</a>
            </li>
            <li><a href="/static/search/#" style="color: rgb(114, 114, 114);">谷粒商城E卡</a>
            </li>
            <li><a href="/static/search/#" style="color: rgb(114, 114, 114);">谷粒商城通信</a>
            </li>
            <li><a href="/static/search/#" style="color: rgb(114, 114, 114);">谷粒商城gulimall+</a>
            </li>
        </ol>
        <ol>
            <li>谷粒商城自营覆盖区域</li>
            <li>
                谷粒商城已向全国2661个区县提供自<br> 营配送服务，支持货到付款、
                <br> POS机刷卡和售后上门服务。
            </li>
            <li><a href="/static/search/#" style="color: rgb(114, 114, 114);">查看详情&gt;</a>
            </li>
        </ol>
    </div>
    <div class="footer_foot">
        <p class="footer_p p1">
            <a href="/static/search/#">关于我们</a>
            <span></span>
            <a href="/static/search/#" style="color: rgb(114, 114, 114);">联系我们</a>
            <span></span>
            <a href="/static/search/#">联系客服</a>
            <span></span>
            <a href="/static/search/#" style="color: rgb(114, 114, 114);">合作招商</a>
            <span></span>
            <a href="/static/search/#" style="color: rgb(114, 114, 114);">商家帮助</a>
            <span></span>
            <a href="/static/search/#" style="color: rgb(114, 114, 114);">营销中心</a>
            <span></span>
            <a href="/static/search/#" style="color: rgb(114, 114, 114);">手机谷粒商城</a>
            <span></span>
            <a href="/static/search/#" style="color: rgb(114, 114, 114);">友情链接</a>
            <span></span>
            <a href="/static/search/#" style="color: rgb(114, 114, 114);">销售联盟</a>
            <span></span>
            <a href="/static/search/#" style="color: rgb(114, 114, 114);">谷粒商城社区</a>
            <span></span>
            <a href="/static/search/#" style="color: rgb(114, 114, 114);">风险监测</a>
            <span></span>
            <a href="/static/search/#">隐私政策</a>
            <span></span>
            <a href="/static/search/#">谷粒商城公益</a>
            <span></span>
            <a href="/static/search/#" style="color: rgb(114, 114, 114);">English Site</a>
            <span></span>
            <a href="/static/search/#">media &amp; IR</a>
        </p>
        <p class="footer_p">
            <a href="/static/search/#">京公网安备 11000002000088号</a>
            <span></span>
            <a href="/static/search/#">京ICP证070359号</a>
            <span></span>
            <a href="/static/search/#">互联网药品信息服务资格证编号(京)-经营性-2014-0008</a>
            <span></span>
            <a href="/static/search/#">新出发京零 字第大120007号</a>
        </p>
        <p class="footer_p">
            <a href="/static/search/#">互联网出版许可证编号新出网证(京)字150号</a>
            <span></span>
            <a href="/static/search/#">出版物经营许可证</a>
            <span></span>
            <a href="/static/search/#">网络文化经营许可证京网文[2014]2148-348号</a>
            <span></span>
            <a href="/static/search/#">违法和不良信息举报电话：4006561155</a>
        </p>
        <p class="footer_p">
            <a href="/static/search/#">Copyright © 2004 - 2017 谷粒商城JD.com 版权所有</a>
            <span></span>
            <a href="/static/search/#">消费者维权热线：4006067733</a>
            <a href="/static/search/#">经营证照</a>
        </p>
        <p class="footer_p">
            <a href="/static/search/#">谷粒商城旗下网站:</a>
            <a href="/static/search/#">谷粒商城支付</a>
            <span></span>
            <a href="/static/search/#">谷粒商城云</a>
        </p>
        <ul>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
        </ul>
    </div>
</footer>

<!--右侧侧边栏-->
<div class="header_bar">
    <div class="header_bar_box">
        <ul>
            <li>
                <a href="/static/search/#"><img src="/static/search/img/wo.png"/></a>
                <div class="div">
                    <a href="/static/search/#">谷粒商城会员</a>
                </div>
            </li>
            <li>
                <a href="/static/search/#"><img src="/static/search/img/gouwuche.png"/></a>
                <div class="div">
                    <a href="/static/search/#">购物车</a>
                </div>
            </li>
            <li>
                <a href="/static/search/#"><img src="/static/search/img/taoxin.png"/></a>
                <div class="div">
                    <a href="/static/search/#">我的关注</a>
                </div>
            </li>

            <li>
                <a href="/static/search/#"><img src="/static/search/img/shi.png"/></a>
                <div class="div">
                    <a href="/static/search/#">我的足迹</a>
                </div>
            </li>
            <li>
                <a href="/static/search/#"><img src="/static/search/img/xinxi.png"/></a>
                <div class="div">
                    <a href="/static/search/#">我的消息</a>
                </div>
            </li>
            <li>
                <a href="/static/search/#"><img src="/static/search/img/qianbao.png"/></a>
                <div class="div">
                    <a href="/static/search/#">资讯JIMI</a>
                </div>
            </li>
        </ul>
        <ul>
            <li>
                <a href="/static/search/#"><img src="/static/search/img/fa3f24a70d38bd439261cb7439e517a5.png"/></a>
                <div class="div">
                    <a href="/static/search/#">顶部</a>
                </div>
            </li>
            <li>
                <a href="/static/search/#"><img src="/static/search/img/xinxi.png"/></a>
                <div class="div">
                    <a href="/static/search/#">反馈</a>
                </div>
            </li>
        </ul>
    </div>
</div>

<script>
    $(".sl_ext a:nth-child(1)").hover(function () {
        $(this).children("b").stop(true).animate({top: "3px"}, 50);
        $(this).children("i").stop(true).animate({top: "-23px"}, 50)
    }, function () {
        $(this).children("b").stop(true).animate({top: "24px"}, 50);
        $(this).children("i").stop(true).animate({top: "3px"}, 50)
    });
    $(".sl_ext a:nth-child(2)").hover(function () {
        $(this).children("span").stop(true).animate({top: "-1px"}, 100);
        $(this).children("i").stop(true).animate({top: "-14px"}, 100).css({display: "none"})
    }, function () {
        $(this).children("span").stop(true).animate({top: "14px"}, 100);
        $(this).children("i").stop(true).animate({top: "-1px"}, 100).css({display: "block"})
    });
    $('.tab_im img').hover(function () {
        var a = $(this).prop('src');
        var index = $(this).parents('li').index();
        $(this).parents('li').css('border', '2px solid red').siblings('li').css('border', '1px solid #ccc');
        $(this).parents('ul').prev().find('img').prop('src', a);
        $(this).parents('ul').siblings('.tab_JE').find('a').eq(list).css('display', 'block').siblings('a').css('display', 'none');
        $(this).parents('ul').siblings('.tab_R').find('span').eq(list).css('display', 'block').siblings('span').css('display', 'none')
    });

    $(".JD_ipone_one").hover(function () {
        $(this).children("div").css({display: "block"})
    }, function () {
        $(this).children("div").css({display: "none"})
    });

    $("#tab>li").click(function () {
        var i = $(this).index();
        $("#container>div").hide().eq(i).show()
    });
    $(".dizhi_show").hover(function () {
        $(".dizhi_con").css({display: "block"})
    }, function () {
        $(".dizhi_con").css({display: "none"})
    });
    $(".dizhi_con").hover(function () {
        $(this).css({display: "block"})
    }, function () {
        $(this).css({display: "none"})
    });
    //显示隐藏
    var $li = $(".JD_nav_logo>div:gt(3)").hide();
    $('.JD_show span').click(function () {
        if ($li.is(':hidden')) {
            $li.show();
            $(this).css({width: "86px"}).text('收起 ^');
        } else {
            $li.hide();
            $('.JD_show span').css({width: "291px"}).text('更多选项（ CPU核数、网络、机身颜色 等）');
        }
        return false;
    });


    $(".rig_tab>div").hover(function () {
        var i = $(this).index();
        $(this).find('.ico').css({display: 'block'}).stop(true).animate({top: "190px"}, 300)
    }, function () {
        var i = $(this).index();
        $(this).find('.ico').css({display: 'none'}).stop(true).animate({top: "230px"})
    });

    $('.header_main_left>ul>li').hover(function () {
        $(this).css({
            background: "#f0f0f0"
        }).find('.header_main_left_main').stop(true).fadeIn(300)
    }, function () {
        $(this).css({
            background: "#fff"
        }).find(".header_main_left_a").css({
            color: "#000"
        });
        $(this).find('.header_main_left_main').stop(true).fadeOut(100)
    });
    $(".header_sj a").hover(function () {
        $(this).css({
            background: "#444"
        })
    }, function () {
        $(this).css({
            background: "#6e6568"
        })
    });


    $(".nav_li1 a").hover(function () {
        $(".header_main_left").stop(true).fadeIn()
    }, function () {
        $(".header_main_left").stop(true).fadeOut()
    });
    $(".header_main_left").hover(function () {
        $(this).stop(true).fadeIn()
    }, function () {
        $(this).stop(true).fadeOut()
    });


    //右侧侧边栏
    $(".header_bar_box ul li").hover(function () {
        $(this).css({
            background: "#7A6E6E"
        }).children(".div").css({
            display: "block"
        }).stop(true).animate({
            left: "-60px"
        }, 300)
    }, function () {
        $(this).css({
            background: "#7A6E6E"
        }).children(".div").css({
            display: "none"
        }).stop(true).animate({
            left: "0"
        }, 300)
    });


    //底部
    $(".footer_foot .p1 a").hover(function () {
        $(this).css("color", "#D70B1C")
    }, function () {
        $(this).css("color", "#727272")
    });

    $(".footer .footer_center ol li a").hover(function () {
        $(this).css("color", "#D70B1C")
    }, function () {
        $(this).css("color", "#727272")
    })

    function searchProducts(name, value) {
        // 原来的页面
        /*var herf = location.href + "";
        if (herf.indexOf("?") != -1) {
            location.href = location.href + "&" + name + "=" + value;
        } else {
            location.href = location.href + "?" + name + "=" + value;
        }*/

        location.href = replaceAndAddParamVal(location.href, name, value, false);
    }

    function searchByKeyword() {
        //searchProducts("keyword", $("#keyword_input").val());
        location.href = replaceAndAddParamVal(location.href, "keyword", $("#keyword_input").val());
    }

    $(".page_a").click(function () {
        var pn = $(this).attr("pn");
        var href = location.href;
        if (href.indexOf("pageNum") != -1) {
            //替换pageNum
            location.href = replaceAndAddParamVal(href, "pageNum", pn, false);
        } else {
            location.href = location.href + "&pageNum=" + pn;
        }
        return false;
    })

    function replaceParamVal(url, paramName, replaceVal) {
        var oUrl = url.toString();
        var re = eval('/(' + paramName + '=)([^&]*)/gi');
        var nUrl = oUrl.replace(re, paramName + '=' + replaceVal);
        return nUrl;
    };

    function replaceAndAddParamVal(url, paramName, replaceVal, forceAdd) {
        var oUrl = url.toString();
        // 如果欸有就添加, 有就替换
        var nUrl = "";
        if (oUrl.indexOf(paramName) != -1) {
            if (forceAdd) {
                if (oUrl.indexOf("?") != -1) {
                    nUrl = oUrl + "&" + paramName + "=" + replaceVal;
                } else {
                    nUrl = oUrl + "?" + paramName + "=" + replaceVal;
                }
            } else {
                var re = eval('/(' + paramName + '=)([^&]*)/gi');
                nUrl = oUrl.replace(re, paramName + '=' + replaceVal);
            }
        } else {
            var nUrl = "";
            if (oUrl.indexOf("?") != -1) {
                nUrl = oUrl + "&" + paramName + "=" + replaceVal;
            } else {
                nUrl = oUrl + "?" + paramName + "=" + replaceVal;
            }
        }
        return nUrl;
    };

    $(".sort_a").click(function () {
        // 1.当前被点击的元素变为选中状态
        //改变当前元素一级兄弟元素的样式
        // changeStyle(this);

        $(this).toggleClass("desc");
        // 2.跳转到指定位置
        var sort = $(this).attr("sort");
        sort = $(this).hasClass("desc") ? sort + "_desc" : sort + "_asc";
        location.href = replaceAndAddParamVal(location.href, "sort", sort, false);

        // 禁用默认行为
        return false;
    });

    function changeStyle(ele) {
        // location.href = replaceParamVal(href, "pageNum", pn,flase);
        // color: #333; border-color: #ccc; background: #fff    默认
        // color: #fff; border-color: #e4393c; background: #e4393c  高亮

        $(".sort_a").css({"color": "#333", "border-color": "#ccc", "background": "#fff"});
        $(".sort_a").each(function () {
            let text = $(this).text().replace("↓", "").replace("↑", "");
            $(this).text(text);
        })

        $(ele).css({"color": "#FFF", "border-color": "#e4393c", "background": "#e4393c"});
        $(ele).toggleClass("desc");

        if ($(ele).hasClass("desc")) {
            // 降序
            let text = $(ele).text().replace("↓", "").replace("↑", "");
            text = text + "↓";
            $(ele).text(text);
        } else {
            // 升序
            let text = $(ele).text().replace("↓", "").replace("↑", "");
            text = text + "↑";
            $(ele).text(text);
        }
        // 禁止默认行为
        return false;
    };

    $("#skuPriceSearchBtn").click(function () {
        let from = $(`#skuPriceFrom`).val();
        let to = $(`#skuPriceTo`).val();

        let query = from + "_" + to;
        location.href = replaceAndAddParamVal(location.href, "skuPrice", query, false);
    });

    $("#showHasStock").change(function () {
        alert($(this).prop("checked"));
        if ($(this).prop("checked")) {
            location.href = replaceAndAddParamVal(location.href, "hasStock", 1, false);
        } else {
            let re = eval('/(hasStock=)([^&]*)/gi');
            location.href = (location.href + "").replace(re, "");
        }
        return false;
    });

</script>
</body>
</html>
```

*maven依赖， 因为构建我在构建的时候已经通过在父级引入了，就不用重复引入了*
在`search`项目的启动类中使用`@EnableFeignClients`注解开启远程调用
`SearchResult`
``` java
 /* 面包屑导航数据 */
private List<NavVo> navs = new ArrayList<>();
private List<Long> attrIds = new ArrayList<>();

@Data
public static class NavVo {
    private String navName;
    private String navValue;
    private String link;
}
```
`ProductFeignService`
``` java
@FeignClient("gulimall-product")
public interface ProductFeignService {

    @GetMapping("/product/attr/info/{attrId}")
    R attrInfo(@PathVariable("attrId") Long attrId);

    @GetMapping("/product/brand/infos")
    public R brandsInfo(@RequestParam("brandIds") List<Long> brandIds);
}
```
新建`BrandVo`
``` java
@Data
public class BrandVo {

    private Long brandId;
    private String  name;

}
```
`product`服务的`BrandController`中新增对应接口
``` java
/**
  * 信息
  */
@GetMapping("/infos")
public R infos(@RequestParam("brandIds") List<Long> brandIds) {
    List<BrandEntity> brand = brandService.getBrandsByIds(brandIds);

    return R.ok().put("brand", brand);
}
```
`product`服务的`BrandServiceImpl`中对应查询  
``` java
@Override
public List<BrandEntity> getBrandsByIds(List<Long> brandIds) {
    return baseMapper.selectList(new QueryWrapper<BrandEntity>().in("brand_id", brandIds));
}
```
并且在`product`服务中为`AttrServiceImpl`的`getAttrInfo()`加入缓存
``` java
@Cacheable(value = "attr", key = "'attrinfo:'+ #root.args[0]")
@Override
public AttrRespVo getAttrInfo(Long attrId) {
    AttrRespVo respVo = new AttrRespVo();
    AttrEntity attrEntity = this.getById(attrId);
    BeanUtils.copyProperties(attrEntity, respVo);

    if (attrEntity.getAttrType() == ProductConstant.AttrEnum.ATTR_TYPE_BASE.getCode()) {
        //1、设置分组信息
        AttrAttrgroupRelationEntity attrgroupRelation = relationDao.selectOne(new QueryWrapper<AttrAttrgroupRelationEntity>().eq("attr_id", attrId));
        if (attrgroupRelation != null) {
            respVo.setAttrGroupId(attrgroupRelation.getAttrGroupId());
            AttrGroupEntity attrGroupEntity = attrGroupDao.selectById(attrgroupRelation.getAttrGroupId());
            if (attrGroupEntity != null) {
                respVo.setGroupName(attrGroupEntity.getAttrGroupName());
            }
        }
    }
```
`common`服务中重载`R`的`getData()`方法
``` java
public <T> T getData(String name , TypeReference<T> typeReference) {
  Object data = this.get(name);	// 默认返回是map类型的
  String s = JSONUtil.toJsonStr(data);
  T t = JSONUtil.toBean(s, typeReference, false);
  return t;
}
```
`search`服务中`AttrResponseVo`
``` java
@Data
public class AttrResponseVo {

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

    private String catelogName;

    private String groupName;

    private Long[] catelogPath;

}
```
`SearchController`
``` java
/**
  * 自动将页面提交过来的所有请求参数封装成我们指定的对象
  */
@GetMapping(value = "/list.html")
public String listPage(SearchParam param, Model model, HttpServletRequest request) {

    param.set_queryString(request.getQueryString());

    //1、根据传递来的页面的查询参数，去es中检索商品
    SearchResult result = mallSearchService.search(param);

    model.addAttribute("result", result);

    return "list";
}
```
`SearchParam`
``` java
/**
  * 原生的所有查询条件
  */
private String _queryString;
```
`MallSearchServiceImpl`
``` java
/**
  * 构建结果数据
  * 模糊匹配，过滤（按照属性、分类、品牌，价格区间，库存），完成排序、分页、高亮,聚合分析功能
  * @return
  */
private SearchResult buildSearchResult(SearchResponse response, SearchParam param) {
    SearchResult result = new SearchResult();

    //1、返回的所有查询到的商品
    SearchHits hits = response.getHits();

    List<SkuEsModel> esModels = new ArrayList<>();
    //遍历所有商品信息
    if (hits.getHits() != null && hits.getHits().length > 0) {
        for (SearchHit hit : hits.getHits()) {
            String sourceAsString = hit.getSourceAsString();
            SkuEsModel esModel = JSONUtil.toBean(sourceAsString, SkuEsModel.class);

            //判断是否按关键字检索，若是就显示高亮，否则不显示
            if (!StringUtils.isEmpty(param.getKeyword())) {
                //拿到高亮信息显示标题
                HighlightField skuTitle = hit.getHighlightFields().get("skuTitle");
                String skuTitleValue = skuTitle.getFragments()[0].string();
                esModel.setSkuTitle(skuTitleValue);
            }
            esModels.add(esModel);
        }
    }
    result.setProducts(esModels);

    //2、当前商品涉及到的所有属性信息
    List<SearchResult.AttrVo> attrVos = new ArrayList<>();
    //获取属性信息的聚合
    ParsedNested attr_agg = response.getAggregations().get("attr_agg");
    ParsedLongTerms attr_id_agg = attr_agg.getAggregations().get("attr_id_agg");
    for (Terms.Bucket bucket : attr_id_agg.getBuckets()) {
        SearchResult.AttrVo attrVo = new SearchResult.AttrVo();
        //1、得到属性的id
        long attrId = bucket.getKeyAsNumber().longValue();
        attrVo.setAttrId(attrId);
        //2、得到属性的名字
        ParsedStringTerms attrNameAgg = bucket.getAggregations().get("attr_name_agg");
        String attrName = attrNameAgg.getBuckets().get(0).getKeyAsString();
        attrVo.setAttrName(attrName);
        //3、得到属性的所有值
        ParsedStringTerms attrValueAgg = bucket.getAggregations().get("attr_value_agg");
        List<String> attrValues = attrValueAgg.getBuckets().stream().map(MultiBucketsAggregation.Bucket::getKeyAsString).collect(Collectors.toList());
        attrVo.setAttrValue(attrValues);

        attrVos.add(attrVo);
    }

    result.setAttrs(attrVos);

    //3、当前商品涉及到的所有品牌信息
    List<SearchResult.BrandVo> brandVos = new ArrayList<>();
    //获取到品牌的聚合
    ParsedLongTerms brand_agg = response.getAggregations().get("brand_agg");
    for (Terms.Bucket bucket : brand_agg.getBuckets()){
        SearchResult.BrandVo brandVo = new SearchResult.BrandVo();
        //1、得到品牌的id
        long brandId = bucket.getKeyAsNumber().longValue();
        brandVo.setBrandId(brandId);
        //2、得到品牌的名字
        ParsedStringTerms brandNameAgg = bucket.getAggregations().get("brand_name_agg");
        String brandName = brandNameAgg.getBuckets().get(0).getKeyAsString();
        brandVo.setBrandName(brandName);
        //3、得到品牌的图片
        ParsedStringTerms brandImgAgg = bucket.getAggregations().get("brand_img_agg");
        String brandImg = brandImgAgg.getBuckets().get(0).getKeyAsString();
        brandVo.setBrandImg(brandImg);

        brandVos.add(brandVo);
    }
    result.setBrands(brandVos);

    //4、当前商品涉及到的所有分类信息
    //获取到分类的聚合
    List<SearchResult.CatalogVo> catalogVos = new ArrayList<>();
    ParsedLongTerms catalog_agg = response.getAggregations().get("catalog_agg");
    for (Terms.Bucket bucket : catalog_agg.getBuckets()) {
        SearchResult.CatalogVo catalogVo = new SearchResult.CatalogVo();
        //得到分类id
        String keyAsString = bucket.getKeyAsString();
        catalogVo.setCatalogId(Long.parseLong(keyAsString));

        //得到分类名
        ParsedStringTerms catalogNameAgg = bucket.getAggregations().get("catalog_name_agg");
        String catalogName = catalogNameAgg.getBuckets().get(0).getKeyAsString();
        catalogVo.setCatalogName(catalogName);
        catalogVos.add(catalogVo);
    }

    result.setCatalogs(catalogVos);
    //===============以上可以从聚合信息中获取====================//

    //5、分页信息-页码
    result.setPageNum(param.getPageNum());
    //5、1分页信息、总记录数
    long total = hits.getTotalHits().value;
    result.setTotal(total);
    //5、2分页信息-总页码-计算
    int totalPages = (int) total % EsConstant.PRODUCT_PAGE_SIZE == 0 ?
            (int) total / EsConstant.PRODUCT_PAGE_SIZE : ((int) total / EsConstant.PRODUCT_PAGE_SIZE + 1);
    result.setTotalPages(totalPages);

    List<Integer> pageNavs = new ArrayList<>();
    for (int i = 1; i <= totalPages; i++) {
        pageNavs.add(i);
    }
    result.setPageNavs(pageNavs);

    //6、构建面包屑导航
    if (param.getAttrs() != null && param.getAttrs().size() > 0) {
        List<SearchResult.NavVo> collect = param.getAttrs().stream().map(attr -> {
            //1、分析每一个attrs传过来的参数值
            SearchResult.NavVo navVo = new SearchResult.NavVo();
            // attrd=2.5寸:6寸
            String[] s = attr.split("_");
            navVo.setNavValue(s[1]);
            R r = productFeignService.attrInfo(Long.parseLong(s[0]));
            result.getAttrIds().add(Long.parseLong(s[0]));
            if (r.getCode() == 0) {
                AttrResponseVo data = r.getData("attr", new TypeReference<AttrResponseVo>() {
                });
                navVo.setNavName(data.getAttrName());
            } else {
                navVo.setNavName(s[0]);
            }

            //2、取消了这个面包屑以后，我们要跳转到哪个地方，将请求的地址url里面的当前置空
            //拿到所有的查询条件，去掉当前
            String replace = replaceQueryString(param, attr, "attrs");
            navVo.setLink("http://search.gulimall.com/list.html?" + replace);

            return navVo;
        }).collect(Collectors.toList());

        result.setNavs(collect);
    }

    //品牌，分类
    if (param.getBrandId() != null && param.getBrandId().size() > 0) {
        List<SearchResult.NavVo> navs = result.getNavs();
        SearchResult.NavVo navVo = new SearchResult.NavVo();

        navVo.setNavName("品牌");
        //TODO 远程查询所有品牌
        R r = productFeignService.brandsInfo(param.getBrandId());
        if (r.getCode() == 0) {
            List<BrandVo> brand = r.getData("brand", new TypeReference<List<BrandVo>>() {
            });
            StringBuffer buffer = new StringBuffer();
            String replace = "";
            for (BrandVo brandVo : brand) {
                buffer.append(brandVo.getName() + ";");
                replace = replaceQueryString(param, brandVo.getName() + "", "brandId");
            }
            navVo.setNavValue(buffer.toString());
            navVo.setLink("http://search.gulimall.com/list.html?" + replace);
        }
        navs.add(navVo);
    }

    //TODO 分类：不需要导航取消

    return result;
}

private static String replaceQueryString(SearchParam param, String value, String key) {
    String encode = null;
    try {
        encode = URLEncoder.encode(value, "UTF-8");
        encode.replace("+", "%20");  //浏览器对空格的编码和Java不一样，差异化处理
    } catch (UnsupportedEncodingException e) {
        e.printStackTrace();
    }
    String replace = param.get_queryString().replace("&" + key + "=" + encode, "");
    return replace;
}
```

### 异步
#### 异步复习 & 异步详解
`ThreadTest`
``` java
public class ThreadTest {

    // 系统中池应该只有一二三个，每个一部任务，提交给线程池让他自己去执行就行
    public static ExecutorService executor = Executors.newFixedThreadPool(10);

    public static void main(String[] args) throws ExecutionException, InterruptedException {
        // 1.继承Thread
        /*System.out.println("main......start.....");
        Thread thread = new Thread01();
        thread.start();
        System.out.println("main......end.....");*/

        // 2.实现Runable接口
        /*Runable01 runable01 = new Runable01();
        new Thread(runable01).start();*/

        // 3.实现FutureTask + FutureTask (可以i拿到返回结果, 可以处理异常)
        /*FutureTask<Integer> futureTask = new FutureTask<>(new Callable01());
        new Thread(futureTask).start();
        // 阻塞等待整个线程执行完成, 获取返回结果
        System.out.println(futureTask.get());*/

        // 我们以后在业务代码里面, 以上三种启动线程的方式都不用【将所有的线程异步任务都交给线程池执行】

        // 4.使用线程池[ExecutorService]
        executor.execute(new Runable01());

        /**
         * 区别：
         * 1,2都不能得到返回值，3可以获取返回值
         * 1，2，3都不能控制资源
         * 4可以控制资源，性能稳定。
         */


        // 系统中池应该只有一二三个，每个一部任务，提交给线程池让他自己去执行就行
        /**
         * 七大参数
         * corePoolSize:[5]核心线程书[一直存在除非(allowCoreThreadTimeOut];线程池，创建好以后就准备就绪的的线程数量，就等待来接受任务
         *      5个  Thread thred  = new Thred();    thread.start();
         * maximumPoolSize:[200] 最大线程数量；控制资源
         * keepAliveTime:存活时间， 如果当前线程数量大于核心数量
         *      释放空闲的线程(maximumPoolSize-corePoolSize)，只要线程空闲大于指定的keepAliveTime；
         * unit:时间单位
         * BlockingQueue<Runnable>：阻塞队列。如果任务有很多，就会将目前多的任务放在队列里面。
         *      只要有线程空闲，就会去队列里面取出新的任务执行
         * threadFactory：线程的创建工厂。
         * RejectedExecutionHandler handler：如果队列满了，按照我们指定的拒绝策略拒绝执行任务
         *
         * 工作顺序
         * 1、线程池创建，准备好 core 数量的核心线程，准备接受任务
         *  (1) 、core 满了，就将再进来的任务放入阻塞队列中。空闲的 core 就会自己去阻塞队列获取任务执行
         *  (2) 、阻塞队列满了，就直接开新线程执行，最大只能开到 max 指定的数量
         *  (3) 、max满了就用RejectedExecutionHandler拒绝任务
         *  (4) 、max都执行完成，有很多空闲，在指定的时间 keepAliveTime 以后，释放 max-core这些线程
         * 3、所有的线程创建都是由指定的 factory 创建的。
         *
         *      new LinkedBlockingDeque<>(), 默认是Integer的最大值。内存会不够
         *
         *
         *
         * 面试：
         * Q: 一个线程池 core 7； ； max 20  ，queue ：50 ，100 并发进来怎么分配的；
         * A: 先有 7 个能直接得到执行，接下来 50 个进入队列排队，在多开 13 个继续执行。现在 70 个被安排上了。剩下 30 个使用拒绝策略。
         */
        // 线程池方式一
        /*ThreadPoolExecutor executor = new ThreadPoolExecutor(5,
                200,
                10,
                TimeUnit.SECONDS,
                new LinkedBlockingDeque<>(10000),
                Executors.defaultThreadFactory(),
                new ThreadPoolExecutor.AbortPolicy());*/
        // 线程池方式二：
        /*Executors.newCachedThreadPool();    // core是0，所有都可回收。创建一个可缓存线程池，如果线程池长度超过处理需要，可灵活回收空闲线程，若无可回收，则新建线程。
        Executors.newFixedThreadPool(5);     // 固定大小,core=max:都不可回收。 创建一个定长线程池，可控制线程最大并发数，超出的线程会在队列中等待。
        Executors.newScheduledThreadPool();     // 定时任务的线程池。 创建一个定长线程池，可控制线程最大并发数，超出的线程会在队列中等待。
        Executors.newSingleThreadExecutor();    // 单线程的线程池, 后台从队列中获取任务, 依次执行。 创建一个定长线程池，可控制线程最大并发数，超出的线程会在队列中等待。*/

    }

    private static void threadPool() {

        ExecutorService threadPool = new ThreadPoolExecutor(
                200,
                10,
                10L,
                TimeUnit.SECONDS,
                new LinkedBlockingDeque<Runnable>(10000),
                Executors.defaultThreadFactory(),
                new ThreadPoolExecutor.AbortPolicy()
        );

        //定时任务的线程池
        ExecutorService service = Executors.newScheduledThreadPool(2);
    }


    public static class Thread01 extends Thread {
        @Override
        public void run() {
            System.out.println("当前线程：" + Thread.currentThread().getId());
            int i = 10 / 2;
            System.out.println("运行结果：" + i);
        }
    }


    public static class Runable01 implements Runnable {
        @Override
        public void run() {
            System.out.println("当前线程：" + Thread.currentThread().getId());
            int i = 10 / 2;
            System.out.println("运行结果：" + i);
        }
    }


    public static class Callable01 implements Callable<Integer> {
        @Override
        public Integer call() throws Exception {
            System.out.println("当前线程：" + Thread.currentThread().getId());
            int i = 10 / 2;
            System.out.println("运行结果：" + i);
            return i;
        }
    }

}
```

#### CompletableFuture 启动异步任务 & 完成回调和异常感知 & handle最终处理 & 线程串行化 & 两任务组合-都要完成 & 两任务组合-一个完成
`ThreadTest`
``` java
public static ExecutorService executor = Executors.newFixedThreadPool(10);

public static void main(String[] args) throws ExecutionException, InterruptedException {
    System.out.println("main......start.....");


    /*CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
        System.out.println("当前线程：" + Thread.currentThread().getId());
        int i = 10 / 2;
        System.out.println("运行结果：" + i);
    }, executor);*/

    // 方法完成后处理1
    /*CompletableFuture<Integer> future = CompletableFuture.supplyAsync(() -> {
        System.out.println("当前线程：" + Thread.currentThread().getId());
        int i = 10 / 2;
        System.out.println("运行结果：" + i);
        return i;
    }, executor);*/
    // 方法完成后处理2
    /*CompletableFuture<Integer> future = CompletableFuture.supplyAsync(() -> {
        System.out.println("当前线程：" + Thread.currentThread().getId());
        int i = 10 / 0;
        System.out.println("运行结果：" + i);
        return i;
    }, executor).whenComplete((res,exception) -> {
        //虽然能得到异常信息，但是没法修改返回数据
        System.out.println("异步任务成功完成了...结果是：" + res + "异常是：" + exception);
    }).exceptionally(throwable -> {
        //可以感知异常，同时返回默认值
        return 10;
    });*/

    // 方法执行完后端处理
    /*CompletableFuture<Integer> future = CompletableFuture.supplyAsync(() -> {
        System.out.println("当前线程：" + Thread.currentThread().getId());
        int i = 10 / 2;
        System.out.println("运行结果：" + i);
        return i;
    }, executor).handle((result, thr) -> {
        if (result != null) {
            return result * 2;
        }
        if (thr != null) {
            System.out.println("异步任务成功完成了...结果是：" + result + "异常是：" + thr);
            return 0;
        }
        return 0;
    });*/

    /*Integer integer = future.get();
    System.out.println("main......end....." + integer);*/


    /**
      * 线程串行化
      * 1、thenRunL：不能获取上一步的执行结果
      * 2、thenAcceptAsync：能接受上一步结果，但是无返回值
      * 3、thenApplyAsync：能接受上一步结果，有返回值
      */
    // 1、thenRunL：不能获取上一步的执行结果
    /*CompletableFuture<Void> future = CompletableFuture.supplyAsync(() -> {
        System.out.println("当前线程：" + Thread.currentThread().getId());
        int i = 10 / 2;
        System.out.println("运行结果：" + i);
        return i;
    }, executor).thenRunAsync(() -> {
        System.out.println("任务2启动了...");
    }, executor);*/
    // 2、thenAcceptAsync：能接受上一步结果，但是无返回值
    /*CompletableFuture.supplyAsync(() -> {
        System.out.println("当前线程：" + Thread.currentThread().getId());
        int i = 10 / 2;
        System.out.println("运行结果：" + i);
        return i;
    }, executor).thenAcceptAsync(res -> {
        System.out.println("任务2启动了..." + res);
    }, executor);*/
    // 3、thenApplyAsync：能接受上一步结果，有返回值
    /*CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
        System.out.println("当前线程：" + Thread.currentThread().getId());
        int i = 10 / 2;
        System.out.println("运行结果：" + i);
        return i;
    }, executor).thenApplyAsync(res -> {
        System.out.println("任务2启动了..." + res);
        return "Hello" + res;
    }, executor);
    System.out.println("main......end....." + future.get());*/


    /**
      * 两个任务组合
      */
    /*CompletableFuture<Object> future01 = CompletableFuture.supplyAsync(() -> {
        System.out.println("任务1线程：" + Thread.currentThread().getId());
        int i = 10 / 2;
        System.out.println("任务1运行结果：" + i);
        return i;
    });
    CompletableFuture<Object> future02 = CompletableFuture.supplyAsync(() -> {
        System.out.println("任务2线程：" + Thread.currentThread().getId());
        try {
            Thread.sleep(3000);
            System.out.println("任务2运行结束");
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        return "Hello";
    }, executor);*/

    /**
      * 两任务组合-都要完成
      * runAfterBothAsync:   不需要任务1任务2的返回
      * thenAcceptBothAsync: 需要任务1任务2的返回
      * thenCombineAsync:    需要组合任务的返回
      */
    // runAfterBothAsync: 不需要任务1任务2的返回
    /*future01.runAfterBothAsync(future02, () -> {
        System.out.println("任务3开始");
    }, executor);*/
    // thenAcceptBothAsync: 需要任务1任务2的返回
    /*future01.thenAcceptBothAsync(future02, (f1, f2) -> {
        System.out.println("任务3开始...之前的结果" + f1 + "--->" + f2);
    }, executor);*/
    // thenCombineAsync: 需要组合任务的返回
    /*CompletableFuture<String> future = future01.thenCombineAsync(future02, (f1, f2) -> {
        return f1 + "：" + f2 + " -> hehe";
    }, executor);*/

    /**
      * 两任务组合-只要有一个完成，我们就执行任务3
      * runAfterEitherAsync: 不感知结果，自己业务返回值
      * acceptEitherAsync:   感知结果，自己没有返回值
      * applyToEitherAsync:  感知结果，自己有返回值
      */
    // runAfterEitherAsync: 不感知结果，自己业务返回值
    /*future01.runAfterEitherAsync(future02, () -> {
        System.out.println("任务3开始。。。之前的结果");
    }, executor);*/
    // acceptEitherAsync:   感知结果，自己没有返回值
    /*future01.acceptEitherAsync(future02, res -> {
        System.out.println("任务3开始。。。之前的结果" + res);
    }, executor);*/
    // applyToEitherAsync:  感知结果，自己有返回值
    /*CompletableFuture<String> future = future01.applyToEitherAsync(future02, res -> {
        System.out.println("任务3开始。。。之前的结果" + res);
        return res.toString() + "->哈哈";
    }, executor);*/

    /**
      * 多任务组合
      * allOf: 等待所有结果完成
      * anyOf: 任意一个完成
      */
    /*CompletableFuture<String> futureImag = CompletableFuture.supplyAsync(() -> {
        System.out.println("查询商品的图片信息");
        return "hello.jpg";
    });
    CompletableFuture<String> futureAttr = CompletableFuture.supplyAsync(() -> {
        System.out.println("查询商品的图片属性");
        return "黑色+256G";
    });
    CompletableFuture<String> futureDesc = CompletableFuture.supplyAsync(() -> {
        try {
            Thread.sleep(3000);
            System.out.println("查询商品介绍");
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        return "华为";
    });*/
    // allOf: 等待所有结果完成
    /*CompletableFuture<Void> allOf = CompletableFuture.allOf(futureImag, futureAttr, futureDesc);
    allOf.get();*/
    // anyOf: 任意一个完成
    /*CompletableFuture<Object> anyOf = CompletableFuture.anyOf(futureImag, futureAttr, futureDesc);
    anyOf.get();*/

    System.out.println("main......end.....");
}
```

包括k8s集群，CI/CD(持续集成)，DevOps等