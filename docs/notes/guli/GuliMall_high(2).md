---
title: GuliMall_high (2)
tags: SpringCloud,GuliMall,谷粒商城
---
### 商品详情
#### 环境搭建
host文件中添加域名映射
``` json
192.168.56.10 item.gulimall.com
```

nginx中前面已经是使用泛域名了，就不需要再配置了

`gateway`服务的`application.yml`中配置网关
``` yml
- id: mall_host_route 
    uri: lb://gulimall-product
    predicates:
      - Host=gulimall.com, item.gulimall.com
```

将课件中的`shangpinxiangqing.html`复制到`product`服务的静态文件目录下，并重命名为`item.html`，且替换内容，完整内容后面会贴出
* `href="`替换为`href="static/item/`
* `src="`替换为`src="static/item/`

静态文件放在 nginx 目录下(`/mydata/nginx/html/static/item/`)实现动静分离, 

`procut`中新建`ItemController`
``` java
@Controller
public class ItemController {

    /**
     * 展示当前sku的详情
     * @param skuId
     * @return
     */
    @GetMapping("/{skuId}.html")
    public String skuItem(Long skuId) {

        return "item";
    }

}
```

`search`服务的`list.html`修改跳转地址
```html
<p class="da">
    <a th:href="|http://item.gulimall.com/${product.skuId}.html|">
        <img th:src="${product.skuImg}" class="dim">
    </a>
</p>
```

#### 模型抽取 & 规格参数 & 销售属性组合
`ItemController`
``` java
@Controller
public class ItemController {
    @Autowired
    SkuInfoService skuInfoService;

    /**
     * 展示当前sku的详情
     *
     * @param skuId
     * @return
     */
    @GetMapping("/{skuId}.html")
    public String skuItem(@PathVariable("skuId") Long skuId, Model model) {
        SkuItemVo vos = skuInfoService.item(skuId);
        model.addAttribute("item", vos);
        return "item";
    }

}
```
`SkuItemVo`
``` java
@ToString
@Data
public class SkuItemVo {

    //1、sku基本信息的获取  pms_sku_info
    private SkuInfoEntity info;

    private boolean hasStock = true;

    //2、sku的图片信息    pms_sku_images
    private List<SkuImagesEntity> images;

    //3、获取spu的销售属性组合
    private List<SkuItemSaleAttrVo> saleAttr;

    //4、获取spu的介绍
    private SpuInfoDescEntity desc;

    //5、获取spu的规格参数信息
    private List<SpuItemAttrGroupVo> groupAttrs;

    @Data
    public static class SkuItemSaleAttrVo {
        private Long attrId;

        private String attrName;

        //private List<String> attrValues;
        private String attrValues;
    }

    @ToString
    @Data
    public static class SpuItemAttrGroupVo {
        private String groupName;

        //private List<SpuBaseAttrVo> attrs;
        private List<Attr> attrs;
    }

    /*@ToString
    @Data
    public static class SpuBaseAttrVo {
        private String attrName;

        private String attrValue;
    }*/

}
```
`SkuInfoServiceImpl`
``` java
@Autowired
SkuImagesService skuImagesService;
@Autowired
SpuInfoDescService spuInfoDescService;
@Autowired
AttrGroupService attrGroupService;
@Autowired
SkuSaleAttrValueService skuSaleAttrValueService;

@Override
public SkuItemVo item(Long skuId) {
    SkuItemVo skuItemVo = new SkuItemVo();

    //1、sku基本信息的获取  pms_sku_info
    SkuInfoEntity info = this.getById(skuId);
    skuItemVo.setInfo(info);
    Long spuId = info.getSpuId();
    Long catalogId = info.getCatalogId();

    //2、sku的图片信息    pms_sku_images
    List<SkuImagesEntity> imagesEntities = skuImagesService.getImagesBySkuId(skuId);
    skuItemVo.setImages(imagesEntities);

    //3、获取spu的销售属性组合
    List<SkuItemVo.SkuItemSaleAttrVo> saleAttrVos = skuSaleAttrValueService.getSaleAttrBySpuId(spuId);
    skuItemVo.setSaleAttr(saleAttrVos);

    //4、获取spu的介绍    pms_spu_info_desc
    SpuInfoDescEntity spuInfoDescEntity = spuInfoDescService.getById(spuId);
    skuItemVo.setDesc(spuInfoDescEntity);

    //5、获取spu的规格参数信息
    List<SkuItemVo.SpuItemAttrGroupVo> attrGroupVos = attrGroupService.getAttrGroupWithAttrsBySpuId(spuId, catalogId);
    skuItemVo.setGroupAttrs(attrGroupVos);

    return skuItemVo;
}
```

`SkuImagesServiceImpl`
``` java
@Override
public List<SkuImagesEntity> getImagesBySkuId(Long skuId) {
    return this.baseMapper.selectList(new QueryWrapper<SkuImagesEntity>().eq("sku_id", skuId));
}
```

`AttrGroupServiceImpl`
``` java
@Override
public List<SkuItemVo.SpuItemAttrGroupVo> getAttrGroupWithAttrsBySpuId(Long spuId, Long catalogId) {
    //1、查出当前spu对应的所有属性的分组信息以及当前分组下的所有属性对应的值
    AttrGroupDao baseMapper = this.getBaseMapper();
    return baseMapper.getAttrGroupWithAttrsBySpuId(spuId, catalogId);
}
```
`AttrGroupDao`
``` java
List<SkuItemVo.SpuItemAttrGroupVo> getAttrGroupWithAttrsBySpuId(@Param("spuId") Long spuId, @Param("catalogId") Long catalogId);
```
`AttrGroupDao.xml`
``` xml
<!--返回集合里面元素的类型， 只要有嵌套属性就要封装自定义结果-->
<resultMap id="spuItemAttrGroupVo" type="cn.cheakin.gulimall.product.vo.SkuItemVo$SpuItemAttrGroupVo">
    <result property="groupName" column="attr_group_name"/>
    <collection property="attrs" ofType="cn.cheakin.gulimall.product.vo.Attr">
        <result property="attrId" column="attr_id"/>
        <result property="attrName" column="attr_name"/>
        <result property="attrValue" column="attr_value"/>
    </collection>
</resultMap>
<select id="getAttrGroupWithAttrsBySpuId" resultMap="spuItemAttrGroupVo">
    SELECT product.spu_id,
            pag.attr_group_id,
            pag.attr_group_name,
            product.attr_id,
            product.attr_name,
            product.attr_value
    FROM pms_product_attr_value product
              LEFT JOIN pms_attr_attrgroup_relation paar ON product.attr_id = paar.attr_id
              LEFT JOIN pms_attr_group pag ON paar.attr_group_id = pag.attr_group_id
    WHERE product.spu_id = #{spuId}
      AND pag.catelog_id = #{catalogId}
</select>
```
`GulimallProductApplicationTests`(单元测试), 获取spu的规格参数信息 
``` java
@Autowired
AttrGroupService attrGroupService;
@Test
public void testAttrGroupService() {
    List<SkuItemVo.SpuItemAttrGroupVo> attrGroupWithAttrsBySpuId = attrGroupService.getAttrGroupWithAttrsBySpuId(13L, 225L);
    System.out.println("attrGroupWithAttrsBySpuId = " + attrGroupWithAttrsBySpuId);
}
```

`SkuSaleAttrValueServiceImpl`
``` java
@Override
public List<SkuItemVo.SkuItemSaleAttrVo> getSaleAttrBySpuId(Long spuId) {
    SkuSaleAttrValueDao baseMapper = this.getBaseMapper();
    return baseMapper.getSaleAttrBySpuId(spuId);
}
```
`SkuSaleAttrValueDao`
``` java
List<SkuItemVo.SkuItemSaleAttrVo> getSaleAttrBySpuId(Long spuId);
```
`SkuSaleAttrValueDao.xml`
``` xml
<select id="getSaleAttrBySpuId" resultType="cn.cheakin.gulimall.product.vo.SkuItemVo$SkuItemSaleAttrVo">
    SELECT
        ssav.attr_id attr_id,
        ssav.attr_name attr_name,
        group_concat( DISTINCT ssav.attr_value ) attr_values
    FROM
        pms_sku_info info
            LEFT JOIN pms_sku_sale_attr_value ssav ON ssav.sku_id = info.sku_id
    WHERE
        info.spu_id = #{spuId}
    GROUP BY
        ssav.attr_id,
        ssav.attr_name
</select>
```
`GulimallProductApplicationTests`(单元测试), 获取spu的销售属性组合
``` java
@Autowired
SkuSaleAttrValueService skuSaleAttrValueService;
@Test
public void testSkuSaleAttrValueService() {
    List<SkuItemVo.SkuItemSaleAttrVo> saleAttrBySpuId = skuSaleAttrValueService.getSaleAttrBySpuId(13L);
    System.out.println("saleAttrBySpuId = " + saleAttrBySpuId);
}
```

#### 详情页渲染 & 销售属性渲染 & sku组合切换
`SkuItemVo`
``` java
private boolean hasStock = true;
```

`SkuItemVo`
``` java
@Data
public static class SkuItemSaleAttrVo {
    private Long attrId;

    private String attrName;

    //private List<String> attrValues;
    //private String attrValues;
    private List<AttrValueWithSkuIdVO> attrValues;
}
```
`AttrValueWithSkuIdVO`
``` java
@Data
public class AttrValueWithSkuIdVO {

    private String attrValue;

    private String skuIds;

}
```
`SkuSaleAttrValueDao.xml`
``` xml
<resultMap id="skuItemSaleAttrVo" type="cn.cheakin.gulimall.product.vo.SkuItemVo$SkuItemSaleAttrVo">
    <result column="attr_id" property="attrId"></result>
    <result column="attr_name" property="attrName"></result>
    <collection property="attrValues" ofType="cn.cheakin.gulimall.product.vo.AttrValueWithSkuIdVO">
        <result column="attr_value" property="attrValue"></result>
        <result column="sku_ids" property="skuIds"></result>
    </collection>
</resultMap>
<select id="getSaleAttrBySpuId" resultMap="skuItemSaleAttrVo">
    SELECT
        ssav.attr_id attr_id,
        ssav.attr_name attr_name,
        ssav.attr_value,
        group_concat( DISTINCT info.sku_id ) sku_ids
    FROM
        pms_sku_info info
            LEFT JOIN pms_sku_sale_attr_value ssav ON ssav.sku_id = info.sku_id
    WHERE
        info.spu_id = #{spuId}
    GROUP BY
        ssav.attr_id,
        ssav.attr_name,
        ssav.attr_value
</select>
```

`list.html`
``` html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">

	<head>
		<meta charset="UTF-8">
		<title></title>
		<link rel="stylesheet" type="text/css" href="static/item/scss/shop.css" />
		<link rel="stylesheet" type="text/css" href="static/item/scss/jd.css"/>
		<link rel="stylesheet" href="static/item/scss/header.css" />
		<link rel="stylesheet" type="text/css" href="static/item/bootstrap/css/bootstrap.css"/>
	</head>
	<body>
		<div id="max">
		<header>
			<!--品牌官方网站-->
					<div class="min">
						<ul class="header_ul_left">
							<li class="glyphicon glyphicon-home"> <a href="static/item/shouye.html" class="aa">京东首页</a></li>
							<li class="glyphicon glyphicon-map-marker"> <a href="static/item/javascript:;">北京</a>
								<ol id="beijing">
									<li style="background: red;"><a href="static/item/javascript:;" style="color: white;">北京</a></li>
									<li><a href="static/item/javascript:;">上海</a></li>
									<li><a href="static/item/javascript:;">天津</a></li>
									<li><a href="static/item/javascript:;">重庆</a></li>
									<li><a href="static/item/javascript:;">河北</a></li>
									<li><a href="static/item/javascript:;">山西</a></li>
									<li><a href="static/item/javascript:;">河南</a></li>
									<li><a href="static/item/javascript:;">辽宁</a></li>
									<li><a href="static/item/javascript:;">吉林</a></li>
									<li><a href="static/item/javascript:;">黑龙江</a></li>
									<li><a href="static/item/javascript:;">内蒙古</a></li>
									<li><a href="static/item/javascript:;">江苏</a></li>
									<li><a href="static/item/javascript:;">山东</a></li>
									<li><a href="static/item/javascript:;">安徽</a></li>
									<li><a href="static/item/javascript:;">浙江</a></li>
									<li><a href="static/item/javascript:;">福建</a></li>
									<li><a href="static/item/javascript:;">湖北</a></li>
									<li><a href="static/item/javascript:;">湖南</a></li>
									<li><a href="static/item/javascript:;">广东</a></li>
									<li><a href="static/item/javascript:;">广西</a></li>
									<li><a href="static/item/javascript:;">江西</a></li>
									<li><a href="static/item/javascript:;">四川</a></li>
									<li><a href="static/item/javascript:;">海南</a></li>
									<li><a href="static/item/javascript:;">贵州</a></li>
									<li><a href="static/item/javascript:;">云南</a></li>
									<li><a href="static/item/javascript:;">西藏</a></li>
									<li><a href="static/item/javascript:;">陕西</a></li>
									<li><a href="static/item/javascript:;">甘肃</a></li>
									<li><a href="static/item/javascript:;">青海</a></li>
									<li><a href="static/item/javascript:;">宁夏</a></li>
									<li><a href="static/item/javascript:;">新疆</a></li>
									<li><a href="static/item/javascript:;">港澳</a></li>
									<li><a href="static/item/javascript:;">台湾</a></li>
									<li><a href="static/item/javascript:;">钓鱼岛</a></li>
									<li><a href="static/item/javascript:;">海外</a></li>
								</ol>
							</li>
						</ul>
						<ul class="header_ul_right">
							<li style="border: 0;"><a href="static/item/../登录页面\index.html" class="aa">你好，请登录</a></li>
							<li><a href="static/item/../注册页面\index.html" style="color: red;">免费注册</a> |</li>
							<li><a href="static/item/javascript:;" class="aa">我的订单</a> |</li>
							<li class="jingdong"><a href="static/item/javascript:;">我的京东</a><span class="glyphicon glyphicon-menu-down">|</span>
								<ol class="jingdong_ol">
									<li><a href="static/item/javascript:;">待处理订单</a></li>
									<li><a href="static/item/javascript:;">消息</a></li>
									<li><a href="static/item/javascript:;">返修退换货</a></li>
									<li><a href="static/item/javascript:;">我的回答</a></li>
									<li><a href="static/item/javascript:;">降价商品</a></li>
									<li><a href="static/item/javascript:;">我的关注</a></li>
									<li style="width: 100%;height: 1px;background: lavender;margin-top: 15px;"></li>
									<li style="margin-top: 0;"><a href="static/item/javascript:;">我的京豆</a></li>
									<li style="margin-top: 0;"><a href="static/item/javascript:;">我的优惠券</a></li>
									<li style="margin-bottom: 10px;"><a href="static/item/javascript:;">我的白条</a></li>

								</ol>
							</li>

							<li><a href="static/item/javascript:;" class="aa">京东会员</a> |</li>
							<li><a href="static/item/javascript:;" class="aa">企业采购</a> |</li>
							<li class="fuwu"><a href="static/item/javascript:;">客户服务</a><span class="glyphicon glyphicon-menu-down"></span> |
								<ol class="fuwu_ol">
									<h6>客户</h6>
									<li><a href="static/item/javascript:;">帮助中心</a></li>
									<li><a href="static/item/javascript:;">售后服务</a></li>
									<li><a href="static/item/javascript:;">在线客服</a></li>
									<li><a href="static/item/javascript:;">意见建议</a></li>
									<li><a href="static/item/javascript:;">电话客服</a></li>
									<li><a href="static/item/javascript:;">客服邮箱</a></li>
									<li style="margin-bottom: -5px;"><a href="static/item/javascript:;">金融咨询</a></li>
									<li style="margin-bottom: -5px;"><a href="static/item/javascript:;">售全球客服</a></li>
									<h6 style="border-top: 1px dashed darkgray;height: 30px;line-height: 30px;">商户</h6>
									<li style="margin-top: -5px;"><a href="static/item/javascript:;">合作招商</a></li>
									<li style="margin-top: -5px;"><a href="static/item/javascript:;">学习中心</a></li>
									<li><a href="static/item/javascript:;">商家后台</a></li>
									<li><a href="static/item/javascript:;">京麦工作台</a></li>
									<li><a href="static/item/javascript:;">商家帮助</a></li>
									<li><a href="static/item/javascript:;">规则平台</a></li>
								</ol>
							</li>
							<li class="daohang"><a href="static/item/javascript:;">网站导航</a><span class="glyphicon glyphicon-menu-down"></span> |
								<ol class="daohang_ol">
									<li style="width: 34%;">
										<h5>特色主题</h5>
										<p>
											<a href="static/item/javascript:;">京东试用</a>
											<a href="static/item/javascript:;">京东金融</a>
											<a href="static/item/javascript:;">全球售</a>
											<a href="static/item/javascript:;">国际站</a>
										</p>
										<p>
											<a href="static/item/javascript:;">京东会员</a>
											<a href="static/item/javascript:;">京东预售</a>
											<a href="static/item/javascript:;">买什么</a>
											<a href="static/item/javascript:;">俄语站</a>
										</p>
										<p>
											<a href="static/item/javascript:;">装机大师</a>
											<a href="static/item/javascript:;">0元评测</a>
											<a href="static/item/javascript:;">定期送</a>
											<a href="static/item/javascript:;">港澳售</a>
										</p>
										<p>
											<a href="static/item/javascript:;">优惠券</a>
											<a href="static/item/javascript:;">秒杀</a>
											<a href="static/item/javascript:;">闪购</a>
											<a href="static/item/javascript:;">印尼站</a>
										</p>
										<p>
											<a href="static/item/javascript:;">京东金融科技</a>
											<a href="static/item/javascript:;">In货推荐</a>
											<a href="static/item/javascript:;">陪伴计划</a>
											<a href="static/item/javascript:;">出海招商</a>
										</p>
									</li>
									<li>
										<h5>行业频道</h5>
										<p>
											<a href="static/item/javascript:;" class="aa_2">手机</a>
											<a href="static/item/javascript:;" class="aa_2">智能数码</a>
											<a href="static/item/javascript:;" class="aa_2">玩3C</a>
										</p>
										<p>
											<a href="static/item/javascript:;" class="aa_2">电脑办公</a>
											<a href="static/item/javascript:;" class="aa_2">家用电器</a>
											<a href="static/item/javascript:;" class="aa_2">京东智能</a>
										</p>
										<p>
											<a href="static/item/javascript:;" class="aa_2">服装城</a>
											<a href="static/item/javascript:;" class="aa_2">美妆馆</a>
											<a href="static/item/javascript:;" class="aa_2">家装城</a>
										</p>
										<p>
											<a href="static/item/javascript:;" class="aa_2">母婴</a>
											<a href="static/item/javascript:;" class="aa_2">食品</a>
											<a href="static/item/javascript:;" class="aa_2">运动户外</a>
										</p>
										<p>
											<a href="static/item/javascript:;" class="aa_2">农资频道</a>
											<a href="static/item/javascript:;" class="aa_2">整车</a>
											<a href="static/item/javascript:;" class="aa_2">图书</a>
										</p>
									</li>
									<li>
										<h5>生活服务</h5>
										<p>
											<a href="static/item/javascript:;" class="aa_2">京东众筹</a>
											<a href="static/item/javascript:;" class="aa_2">白条</a>
											<a href="static/item/javascript:;" class="aa_2">京东金融APP</a>
										</p>
										<p>
											<a href="static/item/javascript:;" class="aa_2">京东小金库</a>
											<a href="static/item/javascript:;" class="aa_2">理财</a>
											<a href="static/item/javascript:;" class="aa_2">智能家电</a>
										</p>
										<p>
											<a href="static/item/javascript:;" class="aa_2">话费</a>
											<a href="static/item/javascript:;" class="aa_2">水电煤</a>
											<a href="static/item/javascript:;" class="aa_2">彩票</a>
										</p>
										<p>
											<a href="static/item/javascript:;" class="aa_2">旅行</a>
											<a href="static/item/javascript:;" class="aa_2">机票酒店</a>
											<a href="static/item/javascript:;" class="aa_2">电影票</a>
										</p>
										<p>
											<a href="static/item/javascript:;" class="aa_2">京东到家</a>
											<a href="static/item/javascript:;" class="aa_2">京东众测</a>
											<a href="static/item/javascript:;" class="aa_2">游戏</a>
										</p>
									</li>
									<li style="border: 0;">
										<h5>更多精选</h5>
										<p>
											<a href="static/item/javascript:;" class="aa_2">合作招商</a>
											<a href="static/item/javascript:;" class="aa_2">京东通信</a>
											<a href="static/item/javascript:;" class="aa_2">京东E卡</a>
										</p>
										<p>
											<a href="static/item/javascript:;" class="aa_2">企业采购</a>
											<a href="static/item/javascript:;" class="aa_2">服务市场</a>
											<a href="static/item/javascript:;" class="aa_2">办公生活馆</a>
										</p>
										<p>
											<a href="static/item/javascript:;" class="aa_2">乡村招募</a>
											<a href="static/item/javascript:;" class="aa_2">校园加盟</a>
											<a href="static/item/javascript:;" class="aa_2">京友邦</a>
										</p>
										<p>
											<a href="static/item/javascript:;" class="aa_2">京东社区</a>
											<a href="static/item/javascript:;" class="aa_2">智能社区</a>
											<a href="static/item/javascript:;" class="aa_2">游戏社区</a>
										</p>
										<p>
											<a href="static/item/javascript:;" class="aa_2">知识产权维权</a>
											<a href="static/item/javascript:;" class="aa_2"></a>
											<a href="static/item/javascript:;" class="aa_2"></a>
										</p>
									</li>
								</ol>
							</li>
							<li class="sjjd" style="border: 0;"><a href="static/item/javascript:;" class="aa">手机京东</a>
								<div class="er">
									<div class="er_1">
										<div class="er_1_1">
											<h6><a href="static/item/#">手机京东</a></h6>
											<p>新人专享大礼包</p>

										</div>
									</div>
									<div class="er_1">
										<div class="er_1_1">
											<h6><a href="static/item/#">关注京东微信</a></h6>
											<p>微信扫一扫关注新粉最高180元惊喜礼包</p>
										</div>
									</div>
									<!--我的理财-->
									<div class="er_1" style="border: 0;">
										<img src="static/item/img/5874a555Ne8192324.jpg"/>
										<div class="er_1_1">
											<h6><a href="static/item/#">京东金融客户端</a></h6>
											<p>新人专享大礼包</p>
											<div><a href="static/item/#"><img src="static/item/img/11.png"/></a><a href="static/item/#"><img src="static/item/img/22.png"/></a></div>
										</div>
									</div>
								</div>
							</li>
						</ul>
					</div>
				</header>
				<nav>
				<div class="nav_min">
					<div class="nav_top">
						<div class="nav_top_one"><a href="static/item/#"><img src="static/item/img/111.png"/></a></div>
						<div class="nav_top_two"><input type="text"/><button>搜索</button></div>
						<div class="nav_top_three"><a href="static/item/../JD_Shop/One_JDshop.html">我的购物车</a><span class="glyphicon glyphicon-shopping-cart"></span>
							<div class="nav_top_three_1">
								<img src="static/item/img/44.png"/>购物车还没有商品，赶紧选购吧！
							</div>
						</div>
					</div>
					<div class="nav_down">
						<ul class="nav_down_ul">
							<li class="nav_down_ul_1" style="width: 24%;float: left;"><a href="static/item/javascript:;">全部商品分类</a>

							</li>
							<li class="ul_li"><a href="static/item/javascript:;">服装城</a></li>
							<li class="ul_li"><a href="static/item/javascript:;">美妆馆</a></li>
							<li class="ul_li"><a href="static/item/javascript:;">超市</a></li>
							<li class="ul_li" style="border-right: 1px solid lavender;"><a href="static/item/javascript:;">生鲜</a></li>
							<li class="ul_li"><a href="static/item/javascript:;">全球购</a></li>
							<li class="ul_li"><a href="static/item/javascript:;">闪购</a></li>
							<li class="ul_li" style="border-right: 1px solid lavender;"><a href="static/item/javascript:;">拍卖</a></li>
							<li class="ul_li"><a href="static/item/javascript:;">金融</a></li>
						</ul>
					</div>
				</div>
			</nav>

				</div>


			<div class="crumb-wrap">
			<div class="w">
				<div class="crumb">
					<div class="crumb-item">
						<a href="static/item/">手机</a>
					</div>
					<div class="crumb-item sep">></div>
					<div class="crumb-item">
						<a href="static/item/">手机通讯</a>
					</div>
					<div class="crumb-item sep">></div>
					<div class="crumb-item">
						<a href="static/item/">手机</a>
					</div>
					<div class="crumb-item sep">></div>
					<div class="crumb-item">
						<div class="crumb-item-one">
							华为 (HUAWEI)
							<img src="static/item/img/4a79b87a68623d4e8a73aff3e25fa99b.png" alt="" class="img" />
							<div class="crumb-item-two ">
								<div class="crumb-item-con clear">
									<ul class="con-ul">
										<li>
											<img src="static/item/img/5825a5a6Nde8ecb75.jpg" alt="" />
										</li>
										<li>
											<p>
												荣耀8青春版 全网通标配 3GB+32GB 幻海蓝
											</p>
											<p>
												￥1099.00
											</p>
										</li>
									</ul>
									<ul class="con-ul">
										<li>
											<img src="static/item/img/5919637aN271a1301.jpg" alt="" />
										</li>
										<li>
											<p>
												荣耀8青春版 全网通标配 3GB+32GB 幻海蓝
											</p>
											<p>
												￥1099.00
											</p>
										</li>
									</ul>
									<ul class="con-ul">
										<li>
											<img src="static/item/img/599a806bN9d829c1c.jpg" alt="" />
										</li>
										<li>
											<p>
												荣耀8青春版 全网通标配 3GB+32GB 幻海蓝
											</p>
											<p>
												￥1099.00
											</p>
										</li>
									</ul>
								</div>
								<div class="crumb-item-cons clear">
									<ul>
										<li>华为(huawei)</li>
										<li>小米(xiaomi)</li>
										<li>APPle</li>
										<li>魅族(meizu)</li>
										<li>锤子</li>

									</ul>
									<ul>
										<li>三星</li>
										<li>vivo</li>
										<li>飞利浦</li>
										<li>360</li>
										<li>更多>></li>

									</ul>
								</div>
							</div>

						</div>

					</div>
					<div class="crumb-item sep">></div>
					<div class="crumb-item">
						华为Mate 10
					</div>
				</div>

				<div class="contact">
					<ul class="contact-ul">
						<li>
							<a href="static/item/#">
								华为京东自营官方旗舰店
							</a>

							<span class="contact-sp">
								<span class="contact-sp1">
								JD
							</span>
							<span class="contact-sp2">
								自营
							    </span>
							</span>
						</li>
						<li>
							<a href="static/item/#">
								<img src="static/item/img/f5831b9848b32440b381bcd30a3d96c7.png" alt="" /> 联系供应商
							</a>
						</li>
						<li>
							<a href="static/item/#">
								<img src="static/item/img/81a6326edc82d343a5a8860a6970f93b.png" alt="" /> JIMI
							</a>
						</li>
						<li>
							<a href="static/item/#">
								<img src="static/item/img/a400e3d61d5645459f769b00d9f431e7.png" alt="" /> 关注店铺
							</a>
						</li>
					</ul>
					<div class="contact-one">
						<ul>
							<li>客服</li>
							<li><img src="static/item/img/f5831b9848b32440b381bcd30a3d96c7.png" alt="" />留言</li>
							<li><img src="static/item/img/81a6326edc82d343a5a8860a6970f93b.png" alt="" />JIMI智能</li>
							<li>
								<img src="static/item/img/1466134037230.jpg" class="contact-img" />
								<p>手机下单</p>
							</li>

						</ul>
						<div class="contact-two">
							<span><img src="static/item/img/a400e3d61d5645459f769b00d9f431e7.png" alt="" />进店逛逛</span>
							<span><img src="static/item/img/a400e3d61d5645459f769b00d9f431e7.png" alt="" />关注店铺</span>
						</div>
					</div>
				</div>

			</div>
		</div>
<div class="Shop">
		<div class="box">
			<div class="box-one ">
				<div class="boxx">

					<div class="imgbox">
						<div class="probox">
							<img class="img1" alt="" th:src="${item.info.skuDefaultImg}">
							<div class="hoverbox"></div>
						</div>
						<div class="showbox">
							<img class="img1" alt="" th:src="${item.info.skuDefaultImg}">
						</div>
					</div>

					<div class="box-lh">

						<div class="box-lh-one">
							<ul>
								<li th:each="img : ${item.images}" th:if="${!#strings.isEmpty(img.imgUrl)}"><img th:src="${img.imgUrl}" /></li>
							</ul>
						</div>
						<div id="left">
							< </div>
								<div id="right">
									>
								</div>

						</div>

						<div class="boxx-one">
							<ul>
								<li>
									<span>
										<img src="static/item/img/b769782fe4ecca40913ad375a71cb92d.png" alt="" />关注
									</span>
									<span>
										<img src="static/item/img/9224fcea62bfff479a6712ba3a6b47cc.png" alt="" />
										对比
									</span>
								</li>
								<li>

								</li>
							</ul>
						</div>

					</div>
					<div class="box-two">
						<div class="box-name" th:text="${item.info.skuTitle}">
							华为 HUAWEI Mate 10 6GB+128GB 亮黑色 移动联通电信4G手机 双卡双待
						</div>
						<div class="box-hide" th:text="${item.info.skuSubtitle}">预订用户预计11月30日左右陆续发货！麒麟970芯片！AI智能拍照！
							<a href="static/item/"><u></u></a>
						</div>
						<div class="box-yuyue">
							<div class="yuyue-one">
								<img src="static/item/img/7270ffc3baecdd448958f9f5e69cf60f.png" alt="" /> 预约抢购
							</div>
							<div class="yuyue-two">
								<ul>
									<li>
										<img src="static/item/img/f64963b63d6e5849977ddd6afddc1db5.png" />
										<span>190103</span> 人预约
									</li>
									<li>
										<img src="static/item/img/36860afb69afa241beeb33ae86678093.png" /> 预约剩余
										<span id="timer">

									</span>
									</li>
								</ul>
							</div>
						</div>
						<div class="box-summary clear">
							<ul>
								<li>京东价</li>
								<li>
									<span>￥</span>
									<span th:text="${#numbers.formatDecimal(item.info.price,3,2)}">4499.00</span>
								</li>
								<li>
									预约享资格
								</li>
								<li>
									<a href="static/item/">
										预约说明
									</a>
								</li>
							</ul>
						</div>
						<div class="box-wrap clear">
							<div class="box-wrap-one clear">
								<ul>
									<li>增值业务</li>
									<li><img src="static/item/img/90a6fa41d0d46b4fb0ff6907ca17c478.png" /></li>
									<li><img src="static/item/img/2e19336b961586468ef36dc9f7199d4f.png" /></li>
									<li><img src="static/item/img/1f80c3d6fabfd3418e54b005312c00b5.png" /></li>
								</ul>
							</div>
						</div>

						<div class="box-stock">
							<ul class="box-ul">
								<li>配送至</li>
								<li class="box-stock-li">
									<div class="box-stock-one">
										北京朝阳区管庄
										<img src="static/item/img/4a79b87a68623d4e8a73aff3e25fa99b.png" alt="" class="img" />
									</div>
									<div class="box-stock-two">
										<dl>
											<dt>
												<a>选择新地址</a>
												<img src="static/item/img/4a79b87a68623d4e8a73aff3e25fa99b.png" alt="" class="box-stock-two-img"/>
											</dt>
											<dd>
												<div class="box-stock-dd">
													<div class="box-stock-top">
														<div class="box-stock-div">北京</div>
														<div class="box-stock-div">朝阳区</div>
														<div class="box-stock-div">管庄</div>
													</div>
													<div class="box-stock-fot">
														<div class="box-stock-con" style="display: block;">
															<ul>
																<li>北京</li>
																<li>上海</li>
																<li>天津</li>
																<li>重庆</li>
															</ul>
														</div>
														<div class="box-stock-con">
															<ul>
																<li>朝阳区</li>
																<li>海淀区</li>
																<li>东城区</li>
																<li>西城区</li>
															</ul>
														</div>
														<div class="box-stock-con">
															<ul>
																<li>4环到5环之内</li>
																<li>管庄</li>
																<li>北苑</li>
															</ul>
														</div>

													</div>
												</div>
											</dd>
										</dl>

									</div>

								</li>
								<li>
									<span th:text="${item.hasStock?'有货':'无货'}">无货</span>， 此商品暂时售完
								</li>
							</ul>
						</div>
						<div class="box-supply">
							<ul class="box-ul">
								<li></li>
								<li>
									由<span>京东</span> 发货，并提供售后服务
								</li>
							</ul>
						</div>
						<div class="box-attr-3">
							<div class="box-attr clear" th:each="attr : ${item.saleAttr}">
								<dl>
									<dt>选择[[${attr.attrName}![](/</dt>
									<dd th:each="val : ${attr.attrValues}">
										<a th:attr=" class=${#lists.contains(#strings.listSplit(val.skuIds,','),item.info.skuId.toString()) ? 'sku_attr_value checked': 'sku_attr_value'}, skus=${val.skuIds} ">
											[[${val.attrValue}![](/
											<!--<img src="static/item/img/59ddfcb1Nc3edb8f1.jpg" /> 摩卡金-->
										</a>
									</dd>
								</dl>
							</div>
						</div>

						<div class="box-btns clear">
							<div class="box-btns-one">
								<input type="text" name="" id="" value="1" />
								<div class="box-btns-one1">

									<div>
										<button id="jia">
									+
									</button>
									</div>
									<div>
										<button id="jian">
										-
									</button>
									</div>

								</div>
							</div>
							<div class="box-btns-two">
								<a href="static/item/../商品分类\index.html">
									立即预约
								</a>
							</div>
							<div class="box-btns-three">
								<img src="static/item/img/e4ed3606843f664591ff1f68f7fda12d.png" alt="" /> 分享
							</div>
						</div>

						<div class="box-footer-zo">
							<div class="box-footer clear">
								<dl>
									<dt>本地活动</dt>
									<dd>
										<a href="static/item/">
											·1元500MB激活到账30元 >>
										</a>
									</dd>
								</dl>
							</div>

							<div class="box-footer">
								<dl>
									<dt>温馨提示</dt>
									<dd>·本商品不能使用 东券 京券</dd>
									<dd>·请完成预约后及时抢购！</dd>
								</dl>
							</div>
						</div>
					</div>

				</div>
			</div>
			<!--欲约抢购流程-->
			<div class="qianggoulioucheng">
				<div class="lioucheng">
					<h3>欲约抢购流程</h3>
				</div>
				<!--抢购步骤-->
				<ul class="qianggoubuzhao">
					<li>
						<img src="static/item/img/shop_03.png" />
						<dl class="buzhou">
							<dt>1.等待预约</dt>
							<dl>预约即将开始</dl>
						</dl>
					</li>
					<li>
						<img src="static/item/img/shop_04.png" />
						<dl class="buzhou">
							<dt>2.预约中</dt>
							<dl>2017-11-15 10:35 2017-11-15 23:59</dl>
						</dl>
					</li>
					<li>
						<img src="static/item/img/shop_05.png" />
						<dl class="buzhou">
							<dt>3.等待抢购</dt>
							<dl>抢购即将开始</dl>
						</dl>
					</li>
					<li>
						<img src="static/item/img/shop_06.png" />
						<dl class="buzhou">
							<dt>4.抢购中</dt>
							<dl></dl>
						</dl>
					</li>
				</ul>
			</div>

			<div class="ShopXiangqing">
				<div class="allLeft">
					<!--火热预约-->
					<div class="huoreyuyue">
						<h3>火热预约</h3>
					</div>
					<div class="dangeshopxingqing">
						<ul class="shopdange">
							<li>
								<a href="static/item/##"><img src="static/item/img/5a0afeddNb34732af.jpg" /></a>
								<p>
									<a href="static/item/##">OPPO R11s Plus 双卡双待全面屏拍照手机香槟色 全网通(6G RAM+64G ROM)标配</a>
								</p>
								<p><strong class="J-p-20015341974">￥3699.00</strong></p>
							</li>
							<li>
								<a href="static/item/##"><img src="static/item/img/5a12873eN41754123.jpg" /></a>
								<p>
									<a target="_blank" title="詹姆士（GEMRY） R19plus全网通4G 智能手机 双卡双待 6+128GB 鳄鱼纹雅致版（新品预约）" href="static/item///item.jd.com/20348283521.html">詹姆士（GEMRY） R19plus全网通4G 智能手机 双卡双待 6+128GB 鳄鱼纹雅致版（新品预约）</a>
								</p>
								<p><strong class="J-p-20348283521">￥13999.00</strong></p>
							</li>
							<li>
								<a href="static/item/##"><img src="static/item/img/59ec0131Nf239df75.jpg" /></a>
								<p>
									<a target="_blank" title="斐纳（TOMEFON） 德国家用无线无绳手持立式充电吸尘器 静音大吸力吸尘器TF-X60" href="static/item///item.jd.com/16683419775.html">斐纳（TOMEFON） 德国家用无线无绳手持立式充电吸尘器 静音大吸力吸尘器TF-X60</a>
								</p>
								<p><strong class="J-p-16683419775">￥1599.00</strong></p>
							</li>
							<li>
								<a href="static/item/##"><img src="static/item/img/59015444N27317512.jpg" /></a>
								<p>
									<a target="_blank" title="斐纳（TOMEFON） 扫地机器人德国智能导航规划全自动超薄扫地机器人吸尘器TF-D60 香槟金" href="static/item///item.jd.com/12187770381.html">斐纳（TOMEFON） 扫地机器人德国智能导航规划全自动超薄扫地机器人吸尘器TF-D60 香槟金</a>
								</p>
								<p><strong class="J-p-12187770381">￥2599.00</strong></p>
							</li>
						</ul>
					</div>
					<!--看了又看-->
					<div class="huoreyuyue">
						<h3>看了又看</h3>
					</div>
					<div class="dangeshopxingqing">
						<ul class="shopdange">
							<li>
								<a href="static/item/##"><img src="static/item/img/59e55e01N369f98f2.jpg" /></a>
								<p>
									<a target="_blank" title="华为（HUAWEI） 华为 Mate10 4G手机  双卡双待 亮黑色 全网通(6GB RAM+128GB ROM)" href="static/item///item.jd.com/17931625443.html">华为（HUAWEI） 华为 Mate10 4G手机 双卡双待 亮黑色 全网通(6GB RAM+128GB ROM)</a>
									<p><strong class="J-p-17931625443">￥4766.00</strong></p>
							</li>
							<li>
								<a href="static/item/##"><img src="static/item/img/584fcc3eNdb0ab94c.jpg" /></a>
								<p>
									<a target="_blank" title="华为 Mate 9 Pro 6GB+128GB版 琥珀金 移动联通电信4G手机 双卡双待" href="static/item///item.jd.com/3749093.html">华为 Mate 9 Pro 6GB+128GB版 琥珀金 移动联通电信4G手机 双卡双待</a>
								</p>
								<p><strong class="J-p-3749093">￥4899.00</strong></p>
							</li>
							<li>
								<!--shopjieshao-->
								<a href="static/item/##"><img src="static/item/img/59eb0df9Nd66d7585.jpg" /></a>
								<p>
									<a target="_blank" title="华为（HUAWEI） 华为 Mate10 手机 亮黑色 全网通(4+64G)标准版" href="static/item///item.jd.com/12306211773.html">华为（HUAWEI） 华为 Mate10 手机 亮黑色 全网通(4+64G)标准版</a>
								</p>
								<p><strong class="J-p-12306211773">￥4088.00</strong></p>
							</li>
							<li>
								<a href="static/item/##"><img src="static/item/img/5a002ba3N126c2f73.jpg" /></a>
								<p>
									<a target="_blank" title="斐纳（TOMEFON） 扫地机器人德国智能导航规划全自动超薄扫地机器人吸尘器TF-D60 香槟金" href="static/item///item.jd.com/12187770381.html">斐纳（TOMEFON） 扫地机器人德国智能导航规划全自动超薄扫地机器人吸尘器TF-D60 香槟金</a>
								</p>
								<p><strong class="J-p-12187770381">￥2599.00</strong></p>
							</li>
						</ul>
						<img src="static/item/img/5a084a1aNa1aa0a71.jpg" />
					</div>
				</div>
				<!--商品介绍-->
				<div class="allquanbushop">
					<ul class="shopjieshao">
						<li class="jieshoa" style="background: #e4393c;">
							<a href="static/item/##" style="color: white;">商品介绍</a>
						</li>
						<li class="baozhuang">
							<a >规格与包装</a>
						</li>
						<li class="baozhang">
							<a >售后保障</a>
						</li>
						<li class="pingjia">
							<a href="static/item/##">商品评价(4万+)</a>
						</li>
						<li class="shuoming">
							<a href="static/item/##">预约说明</a>
						</li>

					</ul>
					<button class="Lijiyuyuessss">
							立即预约
						</button>
					<ul class="shopjieshaos posi" style="display: none;">
						<li class="jieshoa" style="background: #e4393c;">
							<a href="static/item/#li1" style="color: white;">商品介绍</a>
						</li>
						<li class="baozhuang">
							<a href="static/item/#li2">规格与包装</a>
						</li>
						<li class="baozhang">
							<a href="static/item/#li3">售后保障</a>
						</li>
						<li class="pingjia">
							<a href="static/item/#li4">商品评价(4万+)</a>
						</li>
						<li class="shuoming">
							<a href="static/item/#li5">预约说明</a>
						</li>
					</ul>

					<!--商品详情-->
					<div class="huawei">
						<ul class="xuanxiangka">
								<li class="jieshoa actives" id="li1">
								<div class="shanpinsssss">
									<!--<p>
										<a href="static/item/#">品牌:华为（HUAWEI）</a>
									</p>
									<table>
										<tr>
											<td>
												<a href="static/item/##">商品名称：华为Mate 10</a>
											</td>
											<td>
												<a href="static/item/##">商品毛重：0.58kg</a>
											</td>
											<td>
												<a href="static/item/##">商品编号：5544038</a>
											</td>
											<td>
												<a href="static/item/##">商品产地：中国大陆</a>
											</td>
										</tr>
										<tr>
											<td>
												<a href="static/item/##">系统：安卓（Android）</a>
											</td>
											<td>
												<a href="static/item/##">前置摄像头像素：800万-1599万</a>
											</td>
											<td>
												<a href="static/item/##">后置摄像头像素：2000万及以上，1200万-1999万</a>
											</td>
											<td>
												<a href="static/item/##">机身内存：128GB</a>
											</td>
										</tr>
										<tr>
											<td colspan="4">
												<a href="static/item/##">全面屏，双卡双待，指纹识别，Type-C，VoLTE，2K屏，拍照神器，支持NFC，商务手机，安全手机，分辨率10</a>
											</td>
										</tr>
									</table>-->
									<img class="xiaoguo" th:src="${descp}" th:each="descp : ${#strings.listSplit(item.desc.decript,',')}"/>
									<!--<div class="guiGebox guiGebox1">
										<div class="guiGe" th:each="group : ${item.groupAttrs}">
											<h3 th:text="${group.groupName}">主体</h3>
											<dl>
												<dt th:each="attr : ${group.attrs}">品牌</dt>
												<dd>华为(HUAWEI)</dd>
												<dt>型号</dt>
												<dd class="Ptable-tips">
													<a href="static/item/#"><i>？</i></a>
												</dd>
												<dd>ALP-AL00</dd>
												<dt>入网型号</dt>
												<dd class="Ptable-tips">
													<a href="static/item/#"><i>？</i></a>
												</dd>
												<dd>ALP-AL00</dd>
												<dt>上市年份</dt>
												<dd>2017年</dd>
												<dt>上市时间</dt>
												<dd>10月</dd>
											</dl>
										</div>
										<div class="package-list">
											<h3>包装清单</h3>
											<p>手机（含内置电池） X 1、5A大电流华为SuperCharge充电器X 1、5A USB数据线 X 1、半入耳式线控耳机 X 1、快速指南X 1、三包凭证 X 1、取卡针 X 1、保护壳 X 1</p>
										</div>
									</div>-->
								</div>
							</li>
							<li class="baozhuang actives" id="li2">
								<div class="guiGebox">
									<div class="guiGe" th:each="group : ${item.groupAttrs}">
										<h3 th:text="${group.groupName}">主体</h3>
										<dl>
											<div th:each="attr : ${group.attrs}">
												<dt th:text="${attr.attrName}">品牌</dt>
												<dd th:text="${attr.attrValue}">华为(HUAWEI)</dd>
											</div>
										</dl>
									</div>
									<div class="package-list">
										<h3>包装清单</h3>
										<p>手机（含内置电池） X 1、5A大电流华为SuperCharge充电器X 1、5A USB数据线 X 1、半入耳式线控耳机 X 1、快速指南X 1、三包凭证 X 1、取卡针 X 1、保护壳 X 1</p>
									</div>
								</div>
							</li>
							<!--包装-->
							<li class="baozhang actives" id="li3">
								<div class="oBox">
		<div class="shuoHou">
			<div class="baoZhang">
				<h2>售后保障</h2>
			</div>
		</div>
		<!--厂家服务-->
		<div class="changJia">
			<div class="lianBao">
				<span class="oImg">
					<img src="static/item/img/2017.jpg" alt="" />
					<h3>厂家服务</h3>
				</span>
				<div class="wenZi">
					本产品全国联保，享受三包服务，质保期为：一年保<br />
					如因质量问题或故障，凭厂商维修中心或特约维修点的质量检测证明，享受7日内退货，15日内换货，15日以上在保质期内享受免费保修等安保服务！<br />
					(注：如厂家在商品介绍中有售后保障的说明，则此商品按照厂家说明执行售后保障服务。)您可以查询本品牌在各地售后服务中心的练习方式<a href="static/item/#">请点击这儿查询...</a><br /><br />
				</div>
			</div>
			<div class="lianBao oCn">
				<span class="oImg">
					<img src="static/item/img/2017.jpg" alt="" />
					<h3>京东承诺</h3>
				</span>
				<div class="wenZi">
					本产品全国联保，享受三包服务，质保期为：一年保<br />
					如因质量问题或故障，凭厂商维修中心或特约维修点的质量检测证明，享受7日内退货，15日内换货，15日以上在保质期内享受免费保修等安保服务！<br />
					(注：如厂家在商品介绍中有售后保障的说明，则此商品按照厂家说明执行售后保障服务。)您可以查询本品牌在各地售后服务中心的练习方式<a href="static/item/#">请点击这儿查询...</a><br /><br /><br />
				</div>
			</div>

			<div class="lianBao ">
				<span class="oImg">
					<img src="static/item/img/2017.jpg" alt="" />
					<h3>正品行货</h3>
				</span>
				<div class="wenZi hangHuo">
					京东商城向您保证所售商品均为正品行货，京东自营商品开具机打发票或电子发票。
				</div>
			</div>
			<div class="lianBao quanGuo">
				<span class="oImg">
					<img src="static/item/img/2017-1.jpg" alt="" />
					<h3>全国联保</h3>
				</span>
				<div class="wenZi">
					凭质保证书及京东商城发票，可享受全国联保服务（奢侈品、钟表除外；奢侈品、钟表由京东联系保修，享受法定三包售后服务），与您亲临商场选购的商品享受相同的质量保证。京东商城还为您提供具有竞争力的商品价格和运费政策，请您放心购买！ <br />

注：因厂家会在没有任何提前通知的情况下更改产品包装、产地或者一些附件，本司不能确保客户收到的货物与商城图片、产地、附件说明完全一致。只能确保为原厂正货！并且保证与当时市场上同样主流新品一致。若本商城没有及时更新，请大家谅解！
				</div>
			</div>
				<!--权利声明-->
			<div class="quanLi">
				<h4>权利声明:</h4>
				<div class="jingDong">
					京东上的所有商品信息、客户评价、商品咨询、网友讨论等内容，是京东重要的经营资源，未经许可，禁止非法转载使用。<br />
	<span class="oZhu">注</span>：本站商品信息均来自于合作方，其真实性、准确性和合法性由信息拥有者（合作方）负责。本站不提供任何保证，并不承担任何法律责任。
				</div>
			</div>
			<div class="quanLi jiaGe">
				<h4>价格说明:</h4>
				<div class="jingDong">
					<span class="oZhu">京东价</span>：京东价为商品的销售价，是您最终决定是否购买商品的依据。<br />
					<span class="oZhu">划线价</span>：商品展示的划横线价格为参考价，该价格可能是品牌专柜标价、商品吊牌价或由品牌供应商提供的正品零售价（如厂商指导价、建议零售价等）或该商品在京东平台上曾经展示过的销售价；由于地区、时间的差异性和市场行情波动，品牌专柜标价、商品吊牌价等可能会与您购物时展示的不一致，该价格仅供您参考。<br />
					<span class="oZhu">折扣</span>：如无特殊说明，折扣指销售商在原价、或划线价（如品牌专柜标价、商品吊牌价、厂商指导价、厂商建议零售价）等某一价格基础上计算出的优惠比例或优惠金额；如有疑问，您可在购买前联系销售商进行咨询。<br />
					<span class="oZhu">异常问题</span>：商品促销信息以商品详情页“促销”栏中的信息为准；商品的具体售价以订单结算页价格为准；如您发现活动商品售价或促销信息有异常，建议购买前先联系销售商咨询。
				</div>
			</div>
		</div>


	</div>
							</li>
							<!--评价-->
							<li class="PINgjia actives" id="li4">
								<div class="h3">
									<h3>商品评价</h3>
								</div>
								<div class="nav">
									<div class="left">
										<p class="haoping">好评度</p>
										<p><span>100%</span></p>
									</div>
									<div class="right">
										<ul>
											<li>
												<a href="static/item/##">就是快（424）</a>
											</li>
											<li>
												<a href="static/item/##">物流很快（254） </a>
											</li>
											<li>
												<a href="static/item/##">货真价实（168）</a>
											</li>
											<li>
												<a href="static/item/##">有档次（158）</a>
											</li>
											<li>
												<a href="static/item/##">国产品牌（133）</a>
											</li>
											<li>
												<a href="static/item/##">外形美观（103）</a>
											</li>
											<li>
												<a href="static/item/##">很给力（75）</a>
											</li>
											<li>
												<a href="static/item/##">反应灵敏（68）</a>
											</li>
											<li>
												<a href="static/item/##">性价比高（60）</a>
											</li>
											<li>
												<a href="static/item/##">价格优惠（50）</a>
											</li>
											<li>
												<a href="static/item/##">功能齐全（49）</a>
											</li>
											<li style="background: gainsboro;">
												<a href="static/item/##">速度太慢（5）</a>
										</ul>
									</div>
								</div>
								<!--全部评价-->
								<div class="allpingjia">
									<ul>
										<li><a href="static/item/##">全部评价（4.2万）</a></li>
										<li><a href="static/item/##">晒图（500）</a></li>
										<li><a href="static/item/##">追拼（200+）</a></li>
										<li><a href="static/item/##">好评（4.1万）</a></li>
										<li><a href="static/item/##">中评（100+）</a></li>
										<li><a href="static/item/##">差评（100+）</a></li>
										<li><a href="static/item/##"><input type="checkbox"/>只看当前商品价格</a></li>
										<li class="imga" style="float: right;"><a href="static/item/##">推荐排序 <img src="static/item/img/animaite.png"/> </a>
										</li>
									</ul>
								</div>
								</li>
								<li class="shuoming actives" id="li5"></li>
						</ul>
					</div>
				</div>
			</div>
		</div>
		<div class="headera">
			<div class="Logo-tu">
				<span><img src="static/item/img/service_items_1.png"/></span>
				<span><img src="static/item/img/service_items_2.png"/></span>
				<span><img src="static/item/img/service_items_3.png"/></span>
				<span><img src="static/item/img/service_items_4.png"/></span>
			</div>
			<div class="table">
				<dl>
					<dt><a href="static/item/##">购物指南</a></dt>
					<dd>
						<a href="static/item/##">购物流程</a>
					</dd>
					<dd>
						<a href="static/item/##">会员介绍</a>
					</dd>
					<dd>
						<a href="static/item/##">生活旅行/团购</a>
					</dd>
					<dd>
						<a href="static/item/##">常见问题</a>
					</dd>
					<dd>
						<a href="static/item/##">大家电</a>
					</dd>
					<dd>
						<a href="static/item/##">练习客服</a>
					</dd>
				</dl>
				<dl>
					<dt><a href="static/item/##">配送方式</a></dt>
					<dd>
						<a href="static/item/##">上门自提</a>
					</dd>
					<dd>
						<a href="static/item/##">211限时达</a>
					</dd>
					<dd>
						<a href="static/item/##">配送服务查询</a>
					</dd>
					<dd>
						<a href="static/item/##"></a>
					</dd>
					<dd>
						<a href="static/item/##">海外配送</a>
					</dd>
					<dd></dd>
				</dl>
				<dl>
					<dt><a href="static/item/##">支付方式</a></dt>
					<dd>
						<a href="static/item/##">货到付款</a>
					</dd>
					<dd>
						<a href="static/item/##">在线支付</a>
					</dd>
					<dd>
						<a href="static/item/##">分期付款</a>
					</dd>
					<dd>
						<a href="static/item/##">邮局汇款</a>
					</dd>
					<dd>
						<a href="static/item/##">公司转账</a>
					</dd>
					<dd></dd>
				</dl>
				<dl>
					<dt><a href="static/item/##">售后服务</a></dt>
					<dd>
						<a href="static/item/##">售后政策</a>
					</dd>
					<dd>
						<a href="static/item/##">价格保护</a>
					</dd>
					<dd>
						<a href="static/item/##">退款说明</a>
					</dd>
					<dd>
						<a href="static/item/##">返修/退换货</a>
					</dd>
					<dd>
						<a href="static/item/##">取消订单</a>
					</dd>
					<dd></dd>
				</dl>
				<dl class="dls">
					<dt><a href="static/item/##">特色服务</a></dt>
					<dd>
						<a href="static/item/##">夺宝岛</a>
					</dd>
					<dd>
						<a href="static/item/##">DIY装机</a>
					</dd>
					<dd>
						<a href="static/item/##">延保服务</a>
					</dd>
					<dd>
						<a href="static/item/##">京东E卡</a>
					</dd>
					<dd>
						<a href="static/item/##">京东通信</a>
					</dd>
					<dd>
						<a href="static/item/##">京东JD+</a>
					</dd>
				</dl>
			</div>
			<!--关于我们-->
			<div class="guanyuwomen">
				<ul>
					<li>
						<a href="static/item/##">关于我们</a>
					</li>
					<li>|</li>
					<li>
						<a href="static/item/##">联系我们</a>
					</li>
					<li>|</li>
					<li>
						<a href="static/item/##">联系客服</a>
					</li>
					<li>|</li>
					<li>
						<a href="static/item/##">合作招商</a>
					</li>
					<li>|</li>
					<li>
						<a href="static/item/##">商家帮助</a>
					</li>
					<li>|</li>
					<li>
						<a href="static/item/##">营销中心</a>
					</li>
					<li>|</li>
					<li>
						<a href="static/item/##">手机京东</a>
					</li>
					<li>|</li>
					<li>
						<a href="static/item/##">友情链接</a>
					</li>
					<li>|</li>
					<li>
						<a href="static/item/##">销售联盟</a>
					</li>
					<li>|</li>
					<li>
						<a href="static/item/##">京东社区</a>
					</li>
					<li>|</li>
					<li>
						<a href="static/item/##">风险检测</a>
					</li>
					<li>|</li>
					<li>
						<a href="static/item/##">隐私政策</a>
					</li>
					<li>|</li>
					<li>
						<a href="static/item/##">京东公益</a>
					</li>
					<li>|</li>
					<li>
						<a href="static/item/##">English Site</a>
					</li>
					<li>|</li>
					<li>
						<a href="static/item/##">Mdeila $ IR</a>
					</li>
				</ul>
			</div>
			<!--jieshoa-->
			<p class="p1"><img src="static/item/img/56a0a994Nf1b662dc.png" />
				<a href="static/item/##"> 京公网安备 11000002000088号</a>|
				<a href="static/item/##"> 京ICP证070359号</a>|
				<a href="static/item/##"> 互联网药品信息服务资格证编号(京)-经营性-2014-0008 </a>|
				<a href="static/item/##">新出发京零 字第大120007号</a>
			</p>
			<p class="p1">
				<a href="static/item/##"> 互联网出版许可证编号新出网证(京)字150号</a>|
				<a href="static/item/##"> 出版物经营许可证</a>|
				<a href="static/item/##"> 网络文化经营许可证京网文 </a>|
				<a href="static/item/##">[2014]2148-348号 </a>|
				<a href="static/item/##"> 违法和不良信息举报电话 </a>|
				<a href="static/item/##">：4006561155 </a>
			</p>
			<p class="p1">
				<a href="static/item/##"> Copyright © 2004-2017 京东JD.com 版权所有</a>|
				<a href="static/item/##"> 消费者维权热线：4006067733 经营证照</a>|
			</p>
			<p class="p1">
				<a href="static/item/##"> 京东旗下网站：京东支付</a>|
				<a href="static/item/##"> 京东云</a>
			</p>
			<p class="p3">
				<img src="static/item/img/54b8871eNa9a7067e.png" />
				<img src="static/item/img/54b8872dNe37a9860.png" />
				<img src="static/item/img/54b8875fNad1e0c4c.png" />
				<img src="static/item/img/5698dc03N23f2e3b8.jpg" />
				<img src="static/item/img/5698dc16Nb2ab99df.jpg" />
				<img src="static/item/img/56a89b8fNfbaade9a.jpg" />
			</p>
		</div>
		<div class="Fixedbian">
			<ul>
				<li class="li1"><a class="aaa" href="static/item/##">顶部</a></li>
			</ul>
		</div>
		<div class="gouwuchexiaguo">
			<img src="static/item/img/44.png" />
			<span>购物车还没有商品，赶紧选购吧！</span>
		</div>
	</body>

	<script src="static/item/js/jquery1.9.js" type="text/javascript" charset="utf-8"></script>
	<script src="static/item/js/js.js" type="text/javascript" charset="utf-8"></script>
	<script type="text/javascript">
	</script>
	<script>
		$(".sku_attr_value").click(function () {
			// 1、点击的元素添加上自定义的属性，为了识别我们是刚才被点击的
			let skus = new Array();
			let curr = $(this).attr("skus").split(",");

			//去掉同一行的所有的checked
			$(this).parent().parent().find(".sku_attr_value").removeClass("checked");
            $(this).addClass("checked");

			$("a[class='sku_attr_value checked']").each(function () {
				skus.push($(this).attr("skus").split(","));
			});

			// 2、取出他们的交集，得到skuId
			// console.log($(skus[0]).filter(skus[i])[0]);
			let filterEle = skus[0];
			for (let i = 1; i < skus.length; i++) {
				filterEle = $(filterEle).filter(skus[i]);
			}

			location.href = "http://item.gulimall.com/" + filterEle[0] + ".html";

			return false;
		});
		$(function () {
			changeCheckedStyle();
		});

		/**
		 * 切换边框
		 * 先清楚边框，然后再给正确的加上边框
		 */
		function changeCheckedStyle() {
			$(".sku_attr_value").parent().css({"border": "solid 1px #ccc"});
			$("a[class='sku_attr_value checked']").parent().css({"border": "solid 1px red"});
		};
		
	</script>

</html>
```

#### 异步编排优化
新建`MyThreadConfig`配置线程池
``` java
@EnableConfigurationProperties(ThreadPoolConfigProperties.class)
@Configuration
public class MyThreadConfig {

    @Bean
    public ThreadPoolExecutor threadPoolExecutor(ThreadPoolConfigProperties pool) {
        return new ThreadPoolExecutor(
                pool.getCoreSize(),
                pool.getMaxSize(),
                pool.getKeepAliveTime(),
                TimeUnit.SECONDS,
                new LinkedBlockingDeque<>(100000),
                Executors.defaultThreadFactory(),
                new ThreadPoolExecutor.AbortPolicy()
        );
    }
}
```
新建`ThreadPoolConfigProperties`读取线程池配置
``` java
@ConfigurationProperties(prefix = "gulimall.thread")
@Component
@Data
public class ThreadPoolConfigProperties {

    private Integer coreSize;

    private Integer maxSize;

    private Integer keepAliveTime;

}
```
可以选择加入提示
``` xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-configuration-processor</artifactId>
    <optional>true</optional>
</dependency>
```
`appliamltion.properties`
``` properties
gulimall.thread.core-size=20
gulimall.thread.max-size=200
gulimall.thread.keep-alive-time=10
```

`SkuInfoServiceImpl`
``` java
@Autowired
ThreadPoolExecutor executor;

@Override
public SkuItemVo item(Long skuId) throws ExecutionException, InterruptedException {
    SkuItemVo skuItemVo = new SkuItemVo();

    //1、sku基本信息的获取  pms_sku_info
    CompletableFuture<SkuInfoEntity> infoFuture = CompletableFuture.supplyAsync(() -> {
        SkuInfoEntity info = this.getById(skuId);
        skuItemVo.setInfo(info);
        return info;
    }, executor);

    //3、获取spu的销售属性组合
    CompletableFuture<Void> saleAttrFuture = infoFuture.thenAcceptAsync((res) -> {
        List<SkuItemVo.SkuItemSaleAttrVo> saleAttrVos = skuSaleAttrValueService.getSaleAttrBySpuId(res.getSpuId());
        skuItemVo.setSaleAttr(saleAttrVos);
    }, executor);

    //4、获取spu的介绍    pms_spu_info_desc
    CompletableFuture<Void> descFuture = infoFuture.thenAcceptAsync((res) -> {
        SpuInfoDescEntity spuInfoDescEntity = spuInfoDescService.getById(res.getSpuId());
        skuItemVo.setDesc(spuInfoDescEntity);
    }, executor);

    //5、获取spu的规格参数信息
    CompletableFuture<Void> baseAttrFuture = infoFuture.thenAcceptAsync((res) -> {
        List<SkuItemVo.SpuItemAttrGroupVo> attrGroupVos = attrGroupService.getAttrGroupWithAttrsBySpuId(res.getSpuId(), res.getCatalogId());
        skuItemVo.setGroupAttrs(attrGroupVos);
    }, executor);


    //2、sku的图片信息    pms_sku_images
    CompletableFuture<Void> imageFuture = CompletableFuture.runAsync(() -> {
        List<SkuImagesEntity> imagesEntities = skuImagesService.getImagesBySkuId(skuId);
        skuItemVo.setImages(imagesEntities);
    }, executor);

    //等到所有任务都完成
    CompletableFuture.allOf(saleAttrFuture, descFuture, baseAttrFuture, imageFuture, seckillFuture).get();

    // 非异步编排
    /*//1、sku基本信息的获取  pms_sku_info
    SkuInfoEntity info = this.getById(skuId);
    skuItemVo.setInfo(info);
    Long spuId = info.getSpuId();
    Long catalogId = info.getCatalogId();

    //2、sku的图片信息    pms_sku_images
    List<SkuImagesEntity> imagesEntities = skuImagesService.getImagesBySkuId(skuId);
    skuItemVo.setImages(imagesEntities);

    //3、获取spu的销售属性组合
    List<SkuItemVo.SkuItemSaleAttrVo> saleAttrVos = skuSaleAttrValueService.getSaleAttrBySpuId(spuId);
    skuItemVo.setSaleAttr(saleAttrVos);

    //4、获取spu的介绍    pms_spu_info_desc
    SpuInfoDescEntity spuInfoDescEntity = spuInfoDescService.getById(spuId);
    skuItemVo.setDesc(spuInfoDescEntity);

    //5、获取spu的规格参数信息
    List<SkuItemVo.SpuItemAttrGroupVo> attrGroupVos = attrGroupService.getAttrGroupWithAttrsBySpuId(spuId, catalogId);
    skuItemVo.setGroupAttrs(attrGroupVos);*/

    return skuItemVo;
}
```
Controller层页需要将异常抛出

### 认证服务
#### 环境搭建
##### 服务搭建
新建`认证中心`服务`gulimall-auth-server`, 我和视频中有差异，此处仅供参考
`auth-server`的`pom.xml`
``` xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <artifactId>gulimall</artifactId>
        <groupId>cn.cheakin</groupId>
        <version>0.0.1-SNAPSHOT</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>
    <groupId>cn.cheakin</groupId>
    <artifactId>gulimall.auth</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>gulimall-auth-server</name>
    <description>认证服务（社交登录、Oauth2.0、单点登录）</description>

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
            </exclusions>
        </dependency>

		<dependency>  
		   <groupId>org.springframework.boot</groupId>  
		   <artifactId>spring-boot-starter-web</artifactId>  
		</dependency>
        <!-- thymeleaf 模板引擎 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-thymeleaf</artifactId>
        </dependency>

        <!--使用热加载-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <optional>true</optional>
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

`application.yml`
``` yml
spring:
  application:
    name: gulimall-auth-server
  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1:8848
  thymeleaf:
    cache: false
server:
  port: 20000
```

启动类上使用`@EnableDiscoveryClient`和`@EnableFeignClients`
``` java
@EnableFeignClients
@EnableDiscoveryClient
@SpringBootApplication
public class GulimallAuthServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(GulimallAuthServerApplication.class, args);
    }

}
```

验证：启动服务，能在 nacos 中发现`auth-server`服务

##### 引入静态文件
* 登录页面
  将资料里的登录页中 index.html 放到 templates 目录下并重命名为`login.html`
  + 将`src="`全部替换为`src="/static/login/`
  + 将`href="`全部替换为`href="/static/login/`
	资料中的其他静态文件上传到服务器（虚拟机）的`/mydata/nginx/html/static/login/`目录下
	将
* 注册页面
  将资料里的注册页中 index.html 放到 templates 目录下并重命名为`reg.html`，  
	+ 将`src="`全部替换为`src="/static/reg/`
  + 将`href="`全部替换为`href="/static/reg/`
  资料中的其他静态文件上传到服务器（虚拟机）的`/mydata/nginx/html/static/login/`目录下

##### 修改hosts实现域名访问
在host文件中追加
``` json
192.168.56.10 auth.gulimall.com
```

##### 配置网关转发
`gateway`的`application.yml`中添加
``` yml
- id: gulimall_auth_route
	uri: lb://gulimall-auth-server
	predicates:
		- Host=auth.gulimall.com
```

#### 注册：验证码倒计时 & 整合短信验证码
`product`服务的`index.html`中修改登录页和注册页的地址
``` html
<li>
	<a href="http://auth.gulimall.com/login.html">你好，请登录</a>
</li>
<li>
	<a href="http://auth.gulimall.com/reg.html" class="li_2">免费注册</a>
</li>
```

**设置视图映射**
`GulimallWebConfig`
``` java
@Configuration
public class GulimallWebConfig implements WebMvcConfigurer {

    /**·
     * 视图映射:发送一个请求，直接跳转到一个页面
     * @param registry
     */
    @Override
    public void addViewControllers(ViewControllerRegistry registry) {

         registry.addViewController("/login.html").setViewName("login");
        registry.addViewController("/reg.html").setViewName("reg");
    }
}
```

在阿里云申请短信服务的过程，略

编写发送验证相关代码, 首先是controller层
``` java
@Controller  
@RequestMapping(value = "/sms")  
public class SmsSendController {  
  
    @Autowired  
    private SmsComponent smsComponent;  
  
    /**  
     * 提供给别的服务进行调用  
     * @param phone  
     * @param code  
     * @return  
     */  
    @GetMapping(value = "/sendCode")  
    public R sendCode(@RequestParam("phone") String phone, @RequestParam("code") String code) {  
        //发送验证码  
        smsComponent.sendCode(phone,code);  
        return R.ok();  
    }  
}
```

然后是service层
``` java
@ConfigurationProperties(prefix = "spring.cloud.alicloud.sms")  
@Data  
@Component  
public class SmsComponent {  
  
    private String accessKey;  
    private String secretKey;  
    private String region;  
    private String endpoint;  
    private String signName;  
    private String templateCode;  
  
  
    @SneakyThrows  
    public void sendCode(String phone, String code) {  
        StaticCredentialProvider provider = StaticCredentialProvider.create(Credential.builder()  
                .accessKeyId(accessKey)  
                .accessKeySecret(secretKey)  
                //.securityToken("<your-token>") // use STS token  
                .build());  
  
        // Configure the Client  
        AsyncClient client = AsyncClient.builder()  
                .region(region) // Region ID  
                //.httpClient(httpClient) // Use the configured HttpClient, otherwise use the default HttpClient (Apache HttpClient)                .credentialsProvider(provider)  
                //.serviceConfiguration(Configuration.create()) // Service-level configuration  
                // Client-level configuration rewrite, can set Endpoint, Http request parameters, etc.                .overrideConfiguration(  
                        ClientOverrideConfiguration.create()  
                                .setEndpointOverride(endpoint)  
                        //.setConnectTimeout(Duration.ofSeconds(30))  
                )  
                .build();  
  
        // Parameter settings for API request  
        SendSmsRequest sendSmsRequest = SendSmsRequest.builder()  
                .signName(signName)  
                .templateCode(templateCode)  
                .phoneNumbers(phone)  
                .templateParam("{\"code\": " + code + "}")  
                // Request-level configuration rewrite, can set Http request parameters, etc.  
                // .requestConfiguration(RequestConfiguration.create().setHttpHeaders(new HttpHeaders()))                .build();  
  
        // Asynchronously get the return value of the API request  
        CompletableFuture<SendSmsResponse> response = client.sendSms(sendSmsRequest);  
        // Synchronously get the return value of the API request  
        SendSmsResponse resp = response.get();  
        System.out.println(new Gson().toJson(resp));  
        // Asynchronous processing of return values  
        /*response.thenAccept(resp -> {            System.out.println(new Gson().toJson(resp));        }).exceptionally(throwable -> { // Handling exceptions            System.out.println(throwable.getMessage());            return null;        });*/  
        // Finally, close the client        client.close();  
    }  
  
}
```

##### 验证码防刷校验
需要在`auth`服务中远程调用第三方服务, 新建feign的远程调用接口
``` java
@FeignClient("gulimall-third-party")  
public interface ThirdPartFeignService {  
  
    @GetMapping(value = "/sms/sendCode")  
    R sendCode(@RequestParam("phone") String phone, @RequestParam("code") String code);  
  
}
```

在`auth`服务的`LoginController`中编写发送验证码的接口, 用到了redis, 所以需要在xml中引入依赖
``` java
@ResponseBody  
@GetMapping(value = "/sms/sendCode")  
public R sendCode(@RequestParam("phone") String phone) {  
  
    //1、接口防刷  
    String redisCode = stringRedisTemplate.opsForValue().get(AuthServerConstant.SMS_CODE_CACHE_PREFIX + phone);  
    if (!StrUtil.isEmpty(redisCode)) {  
        //活动存入redis的时间，用当前时间减去存入redis的时间，判断用户手机号是否在60s内发送验证码  
        long currentTime = Long.parseLong(redisCode.split("_")[1]);  
        if (System.currentTimeMillis() - currentTime < 60000) {  
            //60s内不能再发  
            return R.error(BizCodeEnume.SMS_CODE_EXCEPTION.getCode(), BizCodeEnume.SMS_CODE_EXCEPTION.getMsg());  
        }  
    }  
  
    //2、验证码的再次效验 redis.存key-phone,value-code  
    int code = (int) ((Math.random() * 9 + 1) * 100000);  
    String codeNum = String.valueOf(code);  
    String redisStorage = codeNum + "_" + System.currentTimeMillis();  
  
    //存入redis，防止同一个手机号在60秒内再次发送验证码  
    stringRedisTemplate.opsForValue().set(AuthServerConstant.SMS_CODE_CACHE_PREFIX + phone,  
            redisStorage, 10, TimeUnit.MINUTES);  
  
    thirdPartFeignService.sendCode(phone, codeNum);  
  
    return R.ok();  
}


```
在`common`服务中新增常量
``` java
public class AuthServerConstant {  
    public static final String SMS_CODE_CACHE_PREFIX = "sms:code:";  
//    public static final String LOGIN_USER = "loginUser";  
}
```
在`common`服务中新增异常枚举
``` java
SMS_CODE_EXCEPTION(10002, "验证码获取频率太高，请稍后再试"),
```

##### 注册接口 & 异常机制 & MD5&盐&BCrypt
`auth`服务中的`LoginController`
``` java
/**  
 * TODO: 重定向携带数据：利用session原理，将数据放在session中。  
 * TODO:只要跳转到下一个页面取出这个数据以后，session里面的数据就会删掉  
 * TODO：分布下session问题  
 * RedirectAttributes：重定向也可以保留数据，不会丢失  
 * 用户注册  
 *  
 * @return  
 */  
@PostMapping(value = "/register")  
public String register(@Valid UserRegisterVo vos, BindingResult result, RedirectAttributes attributes) {  
    //如果有错误回到注册页面  
    if (result.hasErrors()) {  
        Map<String, String> errors = result.getFieldErrors().stream().collect(Collectors.toMap(FieldError::getField, FieldError::getDefaultMessage));  
        attributes.addFlashAttribute("errors", errors);  
        //效验出错回到注册页面  
        //return "redirect:reg.html";   // 用户注册时时发送的post请求，而路径映射转发默认时使用get方式  
        //转发的话用户在刷新页面时会重新提交请求  
        /*model.addAttribute("errors", errors);  
        return "reg"; */        //return "redirect:reg.html";   //这样会重定向到ip下  
        return "redirect:http://auth.gulimall.com/reg.html";  
    }  
  
    //1、效验验证码  
    String code = vos.getCode();  
  
    //获取存入Redis里的验证码  
    String redisCode = stringRedisTemplate.opsForValue().get(AuthServerConstant.SMS_CODE_CACHE_PREFIX + vos.getPhone());  
    if (!StrUtil.isEmpty(redisCode)) {  
        //截取字符串  
        if (code.equals(redisCode.split("_")[0])) {  
            //删除验证码;令牌机制  
            stringRedisTemplate.delete(AuthServerConstant.SMS_CODE_CACHE_PREFIX + vos.getPhone());  
            //验证码通过，真正注册，调用远程服务进行注册  
            R register = memberFeignService.register(vos);  
            if (register.getCode() == 0) {  
                //成功  
                return "redirect:http://auth.gulimall.com/login.html";  
            } else {  
                //失败  
                Map<String, String> errors = new HashMap<>();  
                errors.put("msg", register.getData("msg", new TypeReference<String>() {  
                }));  
                attributes.addFlashAttribute("errors", errors);  
                return "redirect:http://auth.gulimall.com/reg.html";  
            }  
        } else {  
            //效验出错回到注册页面  
            Map<String, String> errors = new HashMap<>();  
            errors.put("code", "验证码错误");  
            attributes.addFlashAttribute("errors", errors);  
            return "redirect:http://auth.gulimall.com/reg.html";  
        }  
    } else {  
        //效验出错回到注册页面  
        Map<String, String> errors = new HashMap<>();  
        errors.put("code", "验证码错误");  
        attributes.addFlashAttribute("errors", errors);  
        return "redirect:http://auth.gulimall.com/reg.html";  
    }  
}
```
`auth`服务新建`UserRegisterVo`
``` java
@Data  
public class UserRegisterVo {  
  
    @NotEmpty(message = "用户名不能为空")  
    @Length(min = 6, max = 19, message="用户名长度在6-18字符")  
    private String userName;  
  
    @NotEmpty(message = "密码必须填写")  
    @Length(min = 6,max = 18,message = "密码必须是6—18位字符")  
    private String password;  
  
    @NotEmpty(message = "手机号不能为空")  
    @Pattern(regexp = "^[1]([3-9])[0-9]{9}$", message = "手机号格式不正确")  
    private String phone;  
  
    @NotEmpty(message = "验证码不能为空")  
    private String code;  
  
}
```
`auth`服务的远程调用接口
``` java
@FeignClient("gulimall-member")  
public interface MemberFeignService {  
  
    @PostMapping(value = "/member/member/register")  
    R register(@RequestBody UserRegisterVo vo); 
}
```

`member`服务需要有相对应的接口
`MemberController`
``` java
@Data

public class MemberUserRegisterVo {

private String userName;

private String password;

private String phone;

}
```
`member`服务中新建
``` java
@Data  
public class MemberUserRegisterVo {  
  
    private String userName;  
  
    private String password;  
  
    private String phone;  
  
}
```
MemberServiceImpl
``` java
@Resource  
private MemberLevelDao memberLevelDao;

@Override  
public void register(MemberUserRegisterVo vo) {  
    MemberEntity memberEntity = new MemberEntity();  
  
    //设置默认等级  
    MemberLevelEntity levelEntity = memberLevelDao.getDefaultLevel();  
    memberEntity.setLevelId(levelEntity.getId());  
  
    //设置其它的默认信息  
    //检查用户名和手机号是否唯一。感知异常，异常机制  
    checkPhoneUnique(vo.getPhone());  
    checkUserNameUnique(vo.getUserName());  
  
    memberEntity.setNickname(vo.getUserName());  
    memberEntity.setUsername(vo.getUserName());  
    //密码进行MD5加密  
    BCryptPasswordEncoder bCryptPasswordEncoder = new BCryptPasswordEncoder();  
    String encode = bCryptPasswordEncoder.encode(vo.getPassword());  
    memberEntity.setPassword(encode);  
    memberEntity.setMobile(vo.getPhone());  
    memberEntity.setGender(0);  
    memberEntity.setCreateTime(new Date());  
  
    //保存数据  
    this.baseMapper.insert(memberEntity);  
}

@Override  
public void checkPhoneUnique(String phone) throws PhoneException {  
  
    Integer phoneCount = this.baseMapper.selectCount(new QueryWrapper<MemberEntity>().eq("mobile", phone));  
  
    if (phoneCount > 0) {  
        throw new PhoneException();  
    }  
  
}  
  
@Override  
public void checkUserNameUnique(String userName) throws UsernameException {  
  
    Integer usernameCount = this.baseMapper.selectCount(new QueryWrapper<MemberEntity>().eq("username", userName));  
  
    if (usernameCount > 0) {  
        throw new UsernameException();  
    }  
}
```
MemberLevelDao.xml
``` sql
SELECT * FROM ums_member_level WHERE default_status = 1
```


![](/GuliMall/Pasted_image_20230130224421.png)

common服务的BizCodeEnume中新增异常消息
``` java
USER_EXIST_EXCEPTION(15001, "存在相同的用户"),  
PHONE_EXIST_EXCEPTION(15002, "存在相同的手机号");
```

#### 登录
> 前端代码修改略

auth服务中新建UserLoginVo
``` java
@Data  
public class UserLoginVo {  
  
    private String loginacct;  
  
    private String password;  
}
```
LoginController新增登录方法
``` java
@PostMapping(value = "/login")  
public String login(UserLoginVo vo, RedirectAttributes attributes, HttpSession session) {  
  
    //远程登录  
    R login = memberFeignService.login(vo);  
  
    if (login.getCode() == 0) {  
        /*MemberResponseVo data = login.getData("data", new TypeReference<MemberResponseVo>() {  
        });        session.setAttribute(LOGIN_USER, data);*/        return "redirect:http://gulimall.com";  
    } else {  
        Map<String, String> errors = new HashMap<>();  
        errors.put("msg", login.getData("msg", new TypeReference<String>() {  
        }));  
        attributes.addFlashAttribute("errors", errors);  
        return "redirect:http://auth.gulimall.com/login.html";  
    }  
}
```
auth服务的MemberFeignService中新增方法
``` java
@PostMapping(value = "/member/member/login")  
R login(@RequestBody UserLoginVo vo);
```

然后在member服务的MemberController新增登录方法
``` java
@PostMapping(value = "/login")  
public R login(@RequestBody MemberUserLoginVo vo) {  
  
    MemberEntity memberEntity = memberService.login(vo);  
    if (memberEntity != null) {  
        return R.ok().setData(memberEntity);  
    } else {  
        return R.error(BizCodeEnume.LOGIN_ACCOUNT_PASSWORD_EXCEPTION.getCode(), BizCodeEnume.LOGIN_ACCOUNT_PASSWORD_EXCEPTION.getMsg());  
    }  
}
```
member中新建MemberUserLoginVo
``` java
@Data

public class MemberUserRegisterVo {

private String userName;

private String password;

private String phone;

}
```
MemberServiceImpl新增登录对应方法
``` java
@Override  
public MemberEntity login(MemberUserLoginVo vo) {  
    String loginacct = vo.getLoginacct();  
    String password = vo.getPassword();  
  
    //1、去数据库查询 SELECT * FROM ums_member WHERE username = ? OR mobile = ?    MemberEntity memberEntity = this.baseMapper.selectOne(new QueryWrapper<MemberEntity>()  
            .eq("username", loginacct).or().eq("mobile", loginacct));  
  
    if (memberEntity == null) {  
        //登录失败  
        return null;  
    } else {  
        //获取到数据库里的password  
        String password1 = memberEntity.getPassword();  
        BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();  
        //进行密码匹配  
        boolean matches = passwordEncoder.matches(password, password1);  
        if (matches) {  
            //登录成功  
            return memberEntity;  
        }  
    }  
  
    return null;  
}
```

##### OAuth2
###### 简介
![](/GuliMall/Pasted_image_20230205235854.png)

![](/GuliMall/Pasted_image_20230206000254.png)

##### 社交登录(weibo登录)
1. 到微博开放平台
2. 登录微博，进入微连接，选择网站接入
3. 完成基本信息的录入
4. 在 我的应用 中的 高级设置 里设置回调地址
	成功：http://gulimall.com/success
	失败：http://gulimall.com/fail
5. 修改前端引导用户使用用户登录的按钮，依照文档修改后填入
	``` html
	<a href="https://api.weibo.com/oauth2/authorize?client_id=4159591980&response_type=code&redirect_uri=http://gulimall.com/success"></a>
```
6. 可以在postman中测试`换取Access Token`的步骤(code换取token只能使用一次；同一用户的AccessToken一段时间内是不会变化的)
7. 然后根据AccessToken就可以调用开放接口获取信息了

登录流程详见：[微博登录官方文档](https://open.weibo.com/wiki/%E6%8E%88%E6%9D%83%E6%9C%BA%E5%88%B6)

###### 社交登录回调
> 现在正式开始写社交登录的逻辑
![](/GuliMall/Pasted_image_20230206172139.png)

###### 社交登录 & 测试
将前端的回调地址切换为我们写的接口
``` html
<a href="https://api.weibo.com/oauth2/authorize?client_id=4159591980&response_type=code&redirect_uri=http://auth.gulimall.com/oauth2.0/weibo/success">  </a>
```
在auth服务中新建`OAuth2Controller`
``` java
@Slf4j  
@Controller  
public class OAuth2Controller {  
  
    private final MemberFeignService memberFeignService;  
  
    @Autowired  
    public OAuth2Controller(MemberFeignService memberFeignService) {  
        this.memberFeignService = memberFeignService;  
    }  
  
    @GetMapping(value = "/oauth2.0/weibo/success")  
    public String weibo(@RequestParam("code") String code, HttpSession session) throws Exception {  
  
        Map<String, Object> map = new HashMap<>(5);  
        map.put("client_id", "2077705774");  
        map.put("client_secret", "40af02bd1c7e435ba6a6e9cd3bf799fd");  
        map.put("grant_type", "authorization_code");  
        map.put("redirect_uri", "http://auth.gulimall.com/oauth2.0/weibo/success");  
        map.put("code", code);  
  
        //1、根据用户授权返回的code换取access_token  
//        HttpResponse response = HttpUtils.doPost("https://api.weibo.com", "/oauth2/access_token", "post", new HashMap<>(), map, new HashMap<>());  
//        HttpResponse post = HttpUtil.post("https://api.weibo.com/oauth2/access_token", map);  
        HttpResponse response = HttpUtil.createPost("https://api.weibo.com/oauth2/access_token").form(map).execute();  
  
        //2、处理  
        if (response.getStatus() == 200) {  
            //获取到了access_token,转为通用社交登录对象  
            //String json = JSON.toJSONString(response.getEntity());  
            SocialUser socialUser = JSON.parseObject(response.body(), SocialUser.class);  
  
            //知道了哪个社交用户  
            //1）、当前用户如果是第一次进网站，自动注册进来（为当前社交用户生成一个会员信息，以后这个社交账号就对应指定的会员）  
            //登录或者注册这个社交用户  
//            System.out.println(socialUser.getAccess_token());  
            //调用远程服务  
            R oauthLogin = memberFeignService.oauthLogin(socialUser);  
            if (oauthLogin.getCode() == 0) {  
                MemberResponseVo data = oauthLogin.getData("data", MemberResponseVo.class);  
                log.info("登录成功：用户信息：{}", data.toString());  
  
                //1、第一次使用session，命令浏览器保存卡号，JSESSIONID这个cookie  
                //以后浏览器访问哪个网站就会带上这个网站的cookie  
                //TODO 1、默认发的令牌。当前域（解决子域session共享问题）  
                //TODO 2、使用JSON的序列化方式来序列化对象到Redis中  
                session.setAttribute(LOGIN_USER, data);  
  
                //2、登录成功跳回首页  
                return "redirect:http://gulimall.com";  
            } else {  
                return "redirect:http://auth.gulimall.com/login.html";  
            }  
        } else {  
            return "redirect:http://auth.gulimall.com/login.html";  
        }  
  
    }  
  
}
```
新建社交对象`SocialUser`
``` java
@Data

public class SocialUser {

private String access_token;

private String remind_in;

private long expires_in;

private String uid;

private String isRealName;

}
```

在common服务中新建`MemberResponseVo`
``` java
@ToString
@Data
public class MemberResponseVo implements Serializable {

    private static final long serialVersionUID = 5573669251256409786L;

    private Long id;
    /**
     * 会员等级id
     */
    private Long levelId;
    /**
     * 用户名
     */
    private String username;
    /**
     * 密码
     */
    private String password;
    /**
     * 昵称
     */
    private String nickname;
    /**
     * 手机号码
     */
    private String mobile;
    /**
     * 邮箱
     */
    private String email;
    /**
     * 头像
     */
    private String header;
    /**
     * 性别
     */
    private Integer gender;
    /**
     * 生日
     */
    private Date birth;
    /**
     * 所在城市
     */
    private String city;
    /**
     * 职业
     */
    private String job;
    /**
     * 个性签名
     */
    private String sign;
    /**
     * 用户来源
     */
    private Integer sourceType;
    /**
     * 积分
     */
    private Integer integration;
    /**
     * 成长值
     */
    private Integer growth;
    /**
     * 启用状态
     */
    private Integer status;
    /**
     * 注册时间
     */
    private Date createTime;

    /**
     * 社交登录UID
     */
    private String socialUid;

    /**
     * 社交登录TOKEN
     */
    private String accessToken;

    /**
     * 社交登录过期时间
     */
    private long expiresIn;

}
```

member的`MemberController`新增登录方法
``` java
@PostMapping(value = "/oauth2/login")

public R oauthLogin(@RequestBody SocialUser socialUser) throws Exception {

MemberEntity memberEntity = memberService.login(socialUser);

if (memberEntity != null) {

return R.ok().setData(memberEntity);

} else {

return R.error(BizCodeEnume.LOGIN_ACCOUNT_PASSWORD_EXCEPTION.getCode(), BizCodeEnume.LOGIN_ACCOUNT_PASSWORD_EXCEPTION.getMsg());

}

}
```

在member服务中同样新建社交对象`SocialUser`
``` java
@Data

public class SocialUser {

private String access_token;

private String remind_in;

private long expires_in;

private String uid;

private String isRealName;

}
```
MemberServiceImpl中新增社交登录方法
``` java
public MemberEntity login(SocialUser socialUser) {  
  
        //具有登录和注册逻辑  
        String uid = socialUser.getUid();  
  
        //1、判断当前社交用户是否已经登录过系统  
        MemberEntity memberEntity = baseMapper.selectOne(new QueryWrapper<MemberEntity>().eq("social_uid", uid));  
  
        if (memberEntity != null) {  
            //这个用户已经注册过  
            //更新用户的访问令牌的时间和access_token  
            MemberEntity update = new MemberEntity();  
            update.setId(memberEntity.getId());  
            update.setAccessToken(socialUser.getAccess_token());  
            update.setExpiresIn(socialUser.getExpires_in());  
            baseMapper.updateById(update);  
  
            memberEntity.setAccessToken(socialUser.getAccess_token());  
            memberEntity.setExpiresIn(socialUser.getExpires_in());  
            return memberEntity;  
        } else {  
            //2、没有查到当前社交用户对应的记录我们就需要注册一个  
            MemberEntity register = new MemberEntity();  
            //3、查询当前社交用户的社交账号信息（昵称、性别等）  
            Map<String, Object> query = new HashMap<>();  
            query.put("access_token", socialUser.getAccess_token());  
            query.put("uid", socialUser.getUid());  
//            HttpResponse response = HttpUtils.doGet("https://api.weibo.com", "/2/users/show.json", "get", new HashMap<>(), query);  
            HttpResponse response = HttpUtil.createGet("https://api.weibo.com/2/users/show.json").form(query).execute();  
  
            if (response.getStatus() == 200) {  
                //查询成功  
                JSONObject jsonObject = JSON.parseObject(response.body());  
                String name = jsonObject.getString("name");  
                String gender = jsonObject.getString("gender");  
                String profileImageUrl = jsonObject.getString("profile_image_url");  
  
                register.setNickname(name);  
                register.setGender("m".equals(gender) ? 1 : 0);  
                register.setHeader(profileImageUrl);  
                register.setCreateTime(new Date());  
                register.setSocialUid(socialUser.getUid());  
                register.setAccessToken(socialUser.getAccess_token());  
                register.setExpiresIn(socialUser.getExpires_in());  
  
                //把用户信息插入到数据库中  
                baseMapper.insert(register);  
            }  
            return register;  
        }  
    }
```
MemberEntity中新增社交账号对应的字段, 别忘了在数据库中也需要新增对应字段
``` java
/**  
 * 社交登录UID  
 */private String socialUid;  
  
/**  
 * 社交登录TOKEN  
 */private String accessToken;  
  
/**  
 * 社交登录过期时间  
 */  
private long expiresIn;
```
然后就可以开始测试社交登录流程了

##### 分布式session
###### 分布式session不共享不同步问题
session原理，每个服务都会产生不同的session
![](/GuliMall/Pasted_image_20230206233355.png)
如果复制session, 会存在不同步问题
![](/GuliMall/Pasted_image_20230206234011.png)

###### 分布式session解决方案原理
方式1：session同步
![](/GuliMall/Pasted_image_20230206234558.png)
方式2：客户端存储
![](/GuliMall/Pasted_image_20230206234708.png)
方式3：hash一致性
![](/GuliMall/Pasted_image_20230206234740.png)
方式4：让session统一存储
![](/GuliMall/Pasted_image_20230206234755.png)
在使用了统一存储后，需要将session的作用域扩大
![](/GuliMall/Pasted_image_20230206234817.png)

###### SpringSession整合
> 官方文档： https://docs.spring.io/spring-session/reference/samples.html

使用。在项目的父级pom引入依赖
``` xml
<dependency>  
    <groupId>org.springframework.boot</groupId>  
    <artifactId>spring-boot-starter-web</artifactId>  
</dependency>
```
auth服务, product服务, search服务的配置文件中
``` yml
spring:
  session:  
    store-type: redis  
    timeout: 30m
```
在auth服务, product服务, search服务的启动类上使用`@EnableRedisHttpSession`打开redis存储session功能。
在存储对象是需要序列化对象

现在登录后修改session的作用域后，就能看到已经实现session存储的功能了

###### SpringSession完成子域session共享
在auth服务, product服务, search服务中都新建GulimallSessionConfig配置类
``` java
@Configuration
public class GulimallSessionConfig {

@Bean
public CookieSerializer cookieSerializer() {

	DefaultCookieSerializer cookieSerializer = new DefaultCookieSerializer();
	
	//放大作用域
	cookieSerializer.setDomainName("gulimall.com");
	
	cookieSerializer.setCookieName("GULISESSION");
	
	return cookieSerializer;

}

@Bean
public RedisSerializer<Object> springSessionDefaultRedisSerializer() {

	return new GenericJackson2JsonRedisSerializer();

}

}
```
现在登录后修改session的作用域后，就能看到已经实现session存储的功能了，且作用于父域了

###### SprinigSession原理

1）、@EnableRedisHttpSession导入RedisHttpSessionConfiguration配置  
      1. 给容器中添加了一个组件  
          SessionRepository -> RedisOperationsSessionRepository: redis操作session, session的增删改查封装类  
      2. SessionRepositoryFilter ==> Filter: session存储过滤器每个请求过来都要经过Filter  
          1. 创建的时候。就自动从容器中获取SessionRepository  
          2. 原始的request, response 被包装为 SessionRepositoryRequestWrapper, SessionRepositoryResponseWrapper  
          3. 以后获取session(request.getSession()) 就是sessionRepositoryRequestWrapper.getSession()  
          4. 即用了装饰者模式，使用getSession是被包装过的session  
	自动延期：redis中的数据也是有过期时间的
![](/GuliMall/Pasted_image_20230206234855.png)

###### 页面效果完成
common服务的AuthServerConstant中新增常量
``` java
public static final String LOGIN_USER = "loginUser";
```

修改auth服务中OAuth2Controller的社交登录方法
``` java
@GetMapping(value = "/oauth2.0/weibo/success")  
    public String weibo(@RequestParam("code") String code, HttpSession session, HttpServletResponse servletResponse) throws Exception {  
  
        Map<String, Object> map = new HashMap<>(5);  
        map.put("client_id", "4159591980");  
        map.put("client_secret", "cd006789a55afae7c7bccb96cf6df003");  
        map.put("grant_type", "authorization_code");  
        map.put("redirect_uri", "http://auth.gulimall.com/oauth2.0/weibo/success");  
        map.put("code", code);  
  
        //1、根据用户授权返回的code换取access_token  
//        HttpResponse response = HttpUtils.doPost("https://api.weibo.com", "/oauth2/access_token", "post", new HashMap<>(), map, new HashMap<>());  
//        HttpResponse post = HttpUtil.post("https://api.weibo.com/oauth2/access_token", map);  
        HttpResponse response = HttpUtil.createPost("https://api.weibo.com/oauth2/access_token").form(map).execute();  
  
        //2、处理  
        if (response.getStatus() == 200) {  
            //获取到了access_token,转为通用社交登录对象  
            //String json = JSON.toJSONString(response.getEntity());  
            SocialUser socialUser = JSON.parseObject(response.body(), SocialUser.class);  
  
            //知道了哪个社交用户  
            //1）、当前用户如果是第一次进网站，自动注册进来（为当前社交用户生成一个会员信息，以后这个社交账号就对应指定的会员）  
            //登录或者注册这个社交用户  
//            System.out.println(socialUser.getAccess_token());  
            //调用远程服务  
            R oauthLogin = memberFeignService.oauthLogin(socialUser);  
            if (oauthLogin.getCode() == 0) {  
                MemberResponseVo data = oauthLogin.getData("data", MemberResponseVo.class);  
                log.info("登录成功：用户信息：{}", data.toString());  
  
                //1、第一次使用session，命令浏览器保存卡号，JSESSIONID这个cookie  
                //以后浏览器访问哪个网站就会带上这个网站的cookie, 如gulimall.com, auth.gulimall.com, order.gulimall.com  
                // 发卡的时候(指定域名为父域),即使是子域系统发的卡也能让父域直接使用  
                /*session.setAttribute("loginUser", data);  
                Cookie cookie = new Cookie("JSESSIONID", "dada");                cookie.setDomain("");   // 作用域默认是请求的域名  
                servletResponse.addCookie(cookie);*/  
                //TODO 1、默认发的令牌。当前域（解决子域session共享问题）  
                //TODO 2、使用JSON的序列化方式来序列化对象到Redis中  
                session.setAttribute(AuthServerConstant.LOGIN_USER, data);  
//                session.setAttribute(LOGIN_USER, data);  
  
                //2、登录成功跳回首页  
                return "redirect:http://gulimall.com";  
            } else {  
                return "redirect:http://auth.gulimall.com/login.html";  
            }  
        } else {  
            return "redirect:http://auth.gulimall.com/login.html";  
        }  
  
    }
```

修改auth服务中LoginController的登录方法
``` java
@PostMapping(value = "/login")  
    public String login(UserLoginVo vo, RedirectAttributes attributes, HttpSession session) {  
  
        //远程登录  
        R login = memberFeignService.login(vo);  
  
        if (login.getCode() == 0) {  
            MemberResponseVo data = login.getData("data", MemberResponseVo.class);  
            session.setAttribute(AuthServerConstant.LOGIN_USER, data);  
            return "redirect:http://gulimall.com";  
        } else {  
            Map<String, String> errors = new HashMap<>();  
//            errors.put("msg", login.getData("msg", String.class));  
            errors.put("msg", login.getData("msg", String.class));  
            attributes.addFlashAttribute("errors", errors);  
            return "redirect:http://auth.gulimall.com/login.html";  
        }  
    }
```

修改前端页面, 略

auth服务的LoginController中新增已登录的跳转
``` java
@GetMapping(value = "/login.html")  
public String loginPage(HttpSession session) {  
  
    //从session先取出来用户的信息，判断用户是否已经登录过了  
    Object attribute = session.getAttribute(AuthServerConstant.LOGIN_USER);  
    //如果用户没登录那就跳转到登录页面  
    if (attribute == null) {  
        return "login";  
    } else {  
        return "redirect:http://gulimall.com";  
    }  
}
```
此时，在已登录状态下进入登录页会自动跳转至首页

前端页面修改，略

#### 单点登录
##### 单点登录介绍
在域名1下登陆后，进入域名2就不需要在登陆了
在域名2下登出后，域名1下的账号也会同时登出

xxl-sso项目演示，略

##### 单点登录流程
![](/GuliMall/单点登录流程.png)

首先修改hosts，加入域名解析
``` 
# xxl-sso Start
127.0.0.1   ssoserver.com
127.0.0.1   client1.com
127.0.0.1   client2.com
# xxl-sso End
```

![](/GuliMall/Pasted_image_20230208203234.png)

|服务|站点|端口|域名|
|--|--|--|--|
|/xxl-sso-server|登录服务器|8080|ssoserver.com|
|/xxl-sso-web-sample-springboot|项目1|8081|client1.com|
|/xxl-sso-web-sample-springboot|项目2|8082|client2.com|

###### 新建`gulimall-test-sso-server`模块
pom依赖
``` xml
<dependency>  
    <groupId>org.springframework.boot</groupId>  
    <artifactId>spring-boot-starter-thymeleaf</artifactId>  
</dependency>  
<dependency>  
    <groupId>org.springframework.boot</groupId>  
    <artifactId>spring-boot-starter-web</artifactId>  
</dependency>  
  
<dependency>  
    <groupId>org.projectlombok</groupId>  
    <artifactId>lombok</artifactId>  
    <optional>true</optional>  
</dependency>  
<dependency>  
    <groupId>org.springframework.boot</groupId>  
    <artifactId>spring-boot-starter-data-redis</artifactId>  
</dependency>  
<dependency>  
    <groupId>org.springframework.boot</groupId>  
    <artifactId>spring-boot-starter-test</artifactId>  
    <scope>test</scope>  
</dependency>
```
`application.properties`
``` xml
server.port=8080

spring.redis.host=192.168.56.10
```
前端页面`login.html`
``` html
<!DOCTYPE html>  
<html lang="en" xmlns:th="https://www.thymeleaf.org">  
<head>  
  <meta charset="UTF-8">  
  <title>登录页</title>  
</head>  
<body>  
<form action="/doLogin" method="post">  
  用户名：<input type="text" name="username"/><br/>  
  密码：<input type="password" name="password"/><br/>  
  <input type="hidden" name="url" th:value="${url}"/>  
  <input type="submit" value="登录">  
</form>  
</body>  
</html>
```
LoginController
``` java
@Controller  
public class LoginController {  
  
    @Autowired  
    StringRedisTemplate redisTemplate;  
  
    @ResponseBody  
    @GetMapping("/userinfo")  
    public String userinfo(@RequestParam(value = "token") String token) {  
        return redisTemplate.opsForValue().get(token);  
  
    }  
  
    @GetMapping("/login.html")  
    public String loginPage(@RequestParam("redirect_url") String url, Model model,  
                            @CookieValue(value = "sso_token", required = false) String sso_token) {  
        if (!StringUtils.isEmpty(sso_token)) {  
            return "redirect:" + url + "?token=" + sso_token;  
        }  
        model.addAttribute("url", url);  
        return "login";  
    }  
  
    @PostMapping(value = "/doLogin")  
    public String doLogin(@RequestParam("username") String username,  
                          @RequestParam("password") String password,  
                          @RequestParam("redirect_url") String url,  
                          HttpServletResponse response) {  
  
        //登录成功跳转，跳回到登录页  
        if (!StringUtils.isEmpty(username) && !StringUtils.isEmpty(password)) {  
  
            String uuid = UUID.randomUUID().toString().replace("-", "");  
            redisTemplate.opsForValue().set(uuid, username);  
            Cookie ssoToken = new Cookie("sso_token", uuid);  
  
            response.addCookie(ssoToken);  
            return "redirect:" + url + "?token=" + uuid;  
        }  
        return "login";  
    }  
}
```

###### 新建`gulimall-test-sso-client`模块
pom依赖
``` xml
<dependency>  
    <groupId>org.springframework.boot</groupId>  
    <artifactId>spring-boot-starter-thymeleaf</artifactId>  
</dependency>  
<dependency>  
    <groupId>org.springframework.boot</groupId>  
    <artifactId>spring-boot-starter-web</artifactId>  
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
```
`HelloController`
``` java
@Controller  
public class HelloController {  
    /**  
     * 无需登录就可访问  
     *  
     * @return  
     */  
    @ResponseBody  
    @GetMapping(value = "/hello")  
    public String hello() {  
        return "hello";  
    }  
  
    @GetMapping(value = "/employees")  
    public String employees(Model model, HttpSession session,  
                            @RequestParam(value = "token", required = false) String token) {  
  
        if (!StringUtils.isEmpty(token)) {  
            RestTemplate restTemplate = new RestTemplate();  
            ResponseEntity<String> forEntity = restTemplate.getForEntity("http://localhost:8080/userinfo?token=" + token, String.class);  
            String body = forEntity.getBody();  
  
            session.setAttribute("loginUser", body);  
        }  
        Object loginUser = session.getAttribute("loginUser");  
  
        if (loginUser == null) {  
            return "redirect:" + "http://localhost:8080/login.html" + "?redirect_url=http://localhost:8081/employees";  
        } else {  
            List<String> emps = new ArrayList<>();  
  
            emps.add("张三");  
            emps.add("李四");  
  
            model.addAttribute("emps", emps);  
            return "employees";  
        }  
    }  
  
}
```
前端页面`employees.html`
``` html
<!DOCTYPE html>  
<html lang="en" xmlns:th="http://www.thymeleaf.org">  
<head>  
  <meta charset="UTF-8">  
  <title>员工列表</title>  
</head>  
<body>  
<h1>欢迎：[[${session.loginUser})</h1>  
<ul>  
  <li th:each="emp:${emps}">姓名：[[${emp})</li>  
</ul>  
</body>  
</html>
```
`application.properties`
``` xml
server.port=8081
```

### 购物车
#### 环境搭建
创建`gulimall-cart`模块
pom文件
``` xml
dependency>  
    <groupId>cn.cheakin</groupId>  
    <artifactId>gulimall-common</artifactId>  
    <version>0.0.1-SNAPSHOT</version>  
</dependency>  
  
<dependency>  
    <groupId>org.springframework.boot</groupId>  
    <artifactId>spring-boot-starter-web</artifactId>  
</dependency>  
<!-- thymeleaf 模板引擎 -->  
<dependency>  
    <groupId>org.springframework.boot</groupId>  
    <artifactId>spring-boot-starter-thymeleaf</artifactId>  
</dependency>  

<dependency>  
   <groupId>org.springframework.boot</groupId>  
   <artifactId>spring-boot-starter-data-redis</artifactId>  
   <exclusions>      <exclusion>  
         <groupId>io.lettuce</groupId>  
         <artifactId>lettuce-core</artifactId>  
      </exclusion>  
   </exclusions>  
</dependency>  
<dependency>  
   <groupId>redis.clients</groupId>  
   <artifactId>jedis</artifactId>  
</dependency>

<!--使用热加载-->  
<dependency>  
    <groupId>org.springframework.boot</groupId>  
    <artifactId>spring-boot-devtools</artifactId>  
    <optional>true</optional>  
</dependency>
```

hosts文件中添加新的域名解析
``` 
192.168.56.10   cart.gulimall.com
```

将购物车相关的静态资源上传的虚拟机的`/mydata/nginx/html/static/cart/`目录下

将购物车的两个页面放到项目中的`/templates/`目录下，为了方便这里就直接用改完之后的页面文件

启动类上添加需要的注解`@EnableFeignClients`,`@EnableDiscoveryClient`,`@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)`

application.properties
``` yml
server.port=30000  
  
spring.application.name=gulimall-cart  
  
spring.cloud.nacos.discovery.server-addr=127.0.0.1:8848  
```

在`gateway`服务的application.yml中追加对应的网关转发
``` yml
- id: gulimall_cart_rout  
  uri: lb://gulimall-cart  
  predicates:  
    - Host=cart.gulimall.com
```

最后，可以通过修改success.html的文件名为index.html后启动项目，查看是否能正常启动。*测试完后记得改回来*

#### 数据模型分析
##### 需求描述
用户可以在**登录状态**下将商品添加到购物车【用户购物车/在线购物车】
* 放入数据库
* mongodb
* redis(采用)：登录后，会将临时购物车的数据全部合并到在线购物车，并清空临时购物车

用户可以在**未登录状态**下将商品添加到购物车【游客购物车/高线购物车/临时购物车】
* 放入localstorage(客户端存储)
* cookie
* WebSQL
* 放入reids(采用)，浏览器技术关闭，下次进入，临时购物车数据仍在

用户可以使用购物车一起结算下单
给购物车**添加商品**
用户可以**查询自己的购物车**
用户可以在购物车中**修改购买商品的数量**
用户可以在购物车中**删除商品**
**选中不选中商品**
在购物车中展示商品优惠信息
提示购物车商品价格变化

##### 数据结构
首先不同用户应该有独立的购物车，因此购物车应该以用户的作为 key 来存储，Value 是用户的所有购物车信息。这样看来基本的”k-v“结构就可以了......
但是，我们对购物车申的商品进行增、删、改操作，基本都需要根据商品 id 进行判断，为了方便后期处理，我们的购物车也应该是“k-v” 结构，key 是商品 id，value 才是这个商品的购物车信息。

综上所述，我们的购物车结构是一个双层Map: Map<String,Map<String,String>>
-第一层Map，Key 是用户id
-第二层Map，Key 是购物车中商品 id，值是购物项数据

#### VO编写
新建`CartItemVo`购物项内容
``` java
/**  
 * 购物项内容  
 */  
public class CartItemVo {  
  
    private Long skuId;  
  
    private Boolean check = true;  
  
    private String title;  
  
    private String image;  
  
    /**  
     * 商品套餐属性  
     */  
    private List<String> skuAttrValues;  
  
    private BigDecimal price;  
  
    private Integer count;  
  
    private BigDecimal totalPrice;  
  
    public Long getSkuId() {  
        return skuId;  
    }  
  
    public void setSkuId(Long skuId) {  
        this.skuId = skuId;  
    }  
  
    public Boolean getCheck() {  
        return check;  
    }  
  
    public void setCheck(Boolean check) {  
        this.check = check;  
    }  
  
    public String getTitle() {  
        return title;  
    }  
  
    public void setTitle(String title) {  
        this.title = title;  
    }  
  
    public String getImage() {  
        return image;  
    }  
  
    public void setImage(String image) {  
        this.image = image;  
    }  
  
    public List<String> getSkuAttrValues() {  
        return skuAttrValues;  
    }  
  
    public void setSkuAttrValues(List<String> skuAttrValues) {  
        this.skuAttrValues = skuAttrValues;  
    }  
  
    public BigDecimal getPrice() {  
        return price;  
    }  
  
    public void setPrice(BigDecimal price) {  
        this.price = price;  
    }  
  
    public Integer getCount() {  
        return count;  
    }  
  
    public void setCount(Integer count) {  
        this.count = count;  
    }  
  
    /**  
     * 计算当前购物项总价  
     *  
     * @return  
     */  
    public BigDecimal getTotalPrice() {  
  
        return this.price.multiply(new BigDecimal("" + this.count));  
    }  
  
    public void setTotalPrice(BigDecimal totalPrice) {  
        this.totalPrice = totalPrice;  
    }  

}
```
新建`CartVo`整个购物车存放的商品信息  
``` java
/**  
 * 整个购物车存放的商品信息  
 * 需要计算的属性需要重写get方法，保证每次获取属性都会进行计算  
 */  
public class CartVo {  
  
    /**  
     * 购物车子项信息  
     */  
    List<CartItemVo> items;  
  
    /**  
     * 商品数量  
     */  
    private Integer countNum;  
  
    /**  
     * 商品类型数量  
     */  
    private Integer countType;  
  
    /**  
     * 商品总价  
     */  
    private BigDecimal totalAmount;  
  
    /**  
     * 减免价格  
     */  
    private BigDecimal reduce = new BigDecimal("0.00");;  
  
    public List<CartItemVo> getItems() {  
        return items;  
    }  
  
    public void setItems(List<CartItemVo> items) {  
        this.items = items;  
    }  
  
    public Integer getCountNum() {  
        int count = 0;  
        if (items != null && items.size() > 0) {  
            for (CartItemVo item : items) {  
                count += item.getCount();  
            }  
        }  
        return count;  
    }  
  
    public Integer getCountType() {  
        int count = 0;  
        if (items != null && items.size() > 0) {  
            for (CartItemVo item : items) {  
                count += 1;  
            }  
        }  
        return count;  
    }  
  
  
    public BigDecimal getTotalAmount() {  
        BigDecimal amount = new BigDecimal("0");  
        // 1.计算购物项总价  
        if (!CollectionUtils.isEmpty(items)) {  
            for (CartItemVo cartItem : items) {  
                if (cartItem.getCheck()) {  
                    amount = amount.add(cartItem.getTotalPrice());  
                }  
            }  
        }  
        // 2.计算优惠后的价格  
        return amount.subtract(getReduce());  
    }  
  
    public BigDecimal getReduce() {  
        return reduce;  
    }  
  
    public void setReduce(BigDecimal reduce) {  
        this.reduce = reduce;  
    }  
}
```

#### ThreadLocal身份鉴别
cart服务的`application.properties`中添加redis配置
```
spring.redis.host=192.168.56.10
```
由于session依赖我是放到了父级pom中，所以就不需要再次引入了。如果需要的话，如下
``` pom
<dependency>  
    <groupId>org.springframework.session</groupId>  
    <artifactId>spring-session-data-redis</artifactId>  
</dependency>
```
然后将`GulimallSessionConfig`类从起来模块拷贝过来，并在类上加上`@EnableRedisHttpSession`注解

新建`UserInfoTo`
``` java
@Data  
public class UserInfoTo {  
  
    private Long userId;  
  
    private String userKey;  
  
    /**  
     * 是否临时用户  
     */  
    private Boolean tempUser = false;  
  
}
```
在common服务中新建常量
``` java
/**  
 * 购物车常量  
 */  
public class CartConstant {  
  
    public final static String TEMP_USER_COOKIE_NAME = "user-key";  
	
	public final static int TEMP_USER_COOKIE_TIMEOUT = 60*60*24*30;
}
```
创建CartController
``` java
@Controller  
public class CartController {  
  
    //@Resource  
    //private CartService cartService;  
  
    /**  
     * 去购物车页面的请求  
     * 浏览器有一个cookie:user-key 标识用户的身份，一个月过期  
     * 如果第一次使用jd的购物车功能，都会给一个临时的用户身份:  
     * 浏览器以后保存，每次访问都会带上这个cookie；  
     * <p>  
     * 登录：session有  
     * 没登录：按照cookie里面带来user-key来做  
     * 第一次，如果没有临时用户，自动创建一个临时用户  
     *  
     * @return  
     */  
    @GetMapping(value = "/cart.html")  
    public String cartListPage(HttpSession session, Model model) throws ExecutionException, InterruptedException {  
        /*Object attribute = session.getAttribute(AuthServerConstant.LOGIN_USER);  
        if (attribute == null) {            // 没登录，获取临时购物车  
        } else {            // 获取登录了的购物车  
        }*/  
        //快速得到用户信息：id,user-key  
        /*UserInfoTo userInfoTo = CartInterceptor.toThreadLocal.get();        System.out.println("userInfoTo = " + userInfoTo);*/  
        return "cartList";  
    }  
  
    /**  
	 * 添加商品到购物车  
	 * @return  
	 */  
	@GetMapping(value = "/addToCart")  
	public String addToCart(@RequestParam("skuId") Long skuId,  
	                        @RequestParam("num") Integer num,  
	                        Model model) {   
	    return "success";  
	}
  
}
```


**临时用户**
user-key 是随机生成的 id，不管有没有登录都会有这个 cookie 信息。
两个功能：新增商品到购物车、查询购物车。
新增商品：判断是否登录
是:则添加商品到后台 Redis 中，把user 的唯一标识符作为 keye。否:则添加商品到后台redis 中，使用随机生成的user-key 作为 keye
直询购物车列表：判断是否登录
否:直接根撰 user-key 查询 redis 中数据并展示是:已登录，则需要先根据 userkey 查询 redis 是否有数据。·有:需要提交到后台添加到 redis，合并数据，而后查询。否:直接去后台查询redis，而后返回。

**ThreadLocal**：可以在同一个线程中共享数据。其本质是Map，以线程为key，数据为值
![](/GuliMall/Pasted_image_20230210210324.png)
添加拦截器，创建`GulimallWebConfig`
``` java
@Configuration  
public class GulimallWebConfig implements WebMvcConfigurer {  
  
    @Override  
    public void addInterceptors(InterceptorRegistry registry) {  
        registry.addInterceptor(new CartInterceptor())//注册拦截器  
                .addPathPatterns("/**");  
    }  
}
```
创建`CartInterceptor`
``` java
/**  
 * 在执行目标方法之前，判断用户的登录状态.并封装传递给controller目标请求  
 */  
@Component  
public class CartInterceptor implements HandlerInterceptor {  
  
  
    public static ThreadLocal<UserInfoTo> toThreadLocal = new ThreadLocal<>();  
  
    /***  
     * 目标方法执行之前  
     * @param request  
     * @param response  
     * @param handler  
     * @return  
     * @throws Exception  
     */    @Override  
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {  
  
        UserInfoTo userInfoTo = new UserInfoTo();  
  
        HttpSession session = request.getSession();  
        //获得当前登录用户的信息  
        MemberResponseVo memberResponseVo = (MemberResponseVo) session.getAttribute(AuthServerConstant.LOGIN_USER);  
  
        if (memberResponseVo != null) {  
            //用户登录了  
            userInfoTo.setUserId(memberResponseVo.getId());  
        }  
  
        Cookie[] cookies = request.getCookies();  
        if (cookies != null && cookies.length > 0) {  
            for (Cookie cookie : cookies) {  
                //user-key  
                String name = cookie.getName();  
                if (name.equals(CartConstant.TEMP_USER_COOKIE_NAME)) {  
                    userInfoTo.setUserKey(cookie.getValue());  
                    //标记为已是临时用户  
                    userInfoTo.setTempUser(true);  
                }  
            }  
        }  
  
        //如果没有临时用户一定分配一个临时用户  
        if (StringUtils.isEmpty(userInfoTo.getUserKey())) {  
            String uuid = UUID.randomUUID().toString();  
            userInfoTo.setUserKey(uuid);  
        }  
  
        //目标方法执行之前  
        toThreadLocal.set(userInfoTo);  
        return true;    }  
  
  
    /**  
     * 业务执行之后，分配临时用户来浏览器保存  
     *  
     * @param request  
     * @param response  
     * @param handler  
     * @param modelAndView  
     * @throws Exception  
     */    @Override  
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {  
  
        //获取当前用户的值  
        UserInfoTo userInfoTo = toThreadLocal.get();  
  
        //如果没有临时用户一定保存一个临时用户  
        if (!userInfoTo.getTempUser()) {  
            //创建一个cookie  
            Cookie cookie = new Cookie(CartConstant.TEMP_USER_COOKIE_NAME, userInfoTo.getUserKey());  
            //扩大作用域  
            cookie.setDomain("gulimall.com");  
            //设置过期时间  
            cookie.setMaxAge(CartConstant.TEMP_USER_COOKIE_TIMEOUT);  
            response.addCookie(cookie);  
        }  
  
    }  
  
    @Override  
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {  
  
    }}
```

#### 页面环境搭建
在product服务的item.html页面中
``` html
<a class="addToCart" href="#" th:attr="skuId=${item.info.skuId}">  
 加入购物车  
</a>

$(".addToCart").click(function () {  
 let skuId = $(this).attr("skuId");  
 let num = $("#productNum").val();  
 location.href = "http://cart.gulimall.com/addCartItem?skuId=" + skuId + "&num=" + num;  
 return false;});
```
cart服务的CartController新增方法
``` java
/**  
 * 添加商品到购物车  
 * @return  
 */  
@GetMapping(value = "/addToCart")  
public String addToCart(@RequestParam("skuId") Long skuId,  
                        @RequestParam("num") Integer num,  
                        Model model) throws ExecutionException, InterruptedException{  
    CartItemVo cartItem = cartService.addToCart(skuId, num);  
    model.addAttribute("cartItem", cartItem);  
    return "success";  
}
```
在product服务的index.html页面
``` html
<span><a href="http://cart.gulimall.com/cart.html">我的购物车</a></span>
```
cart服务的cartList.html
``` html
<a href="http://gulimall.com">首页</a>
```
cart服务的success.html
``` html
<a class="btn-tobback" th:href="'http://item.gulimall.com/'+${cartItem.skuId}+'.html'">查看商品详情</a>
<a class="btn-addtocart" href="http://cart.gulimall.com/cart.html"  
   id="GotoShoppingCart"><b></b>去购物车结算</a>
```

#### 添加购物车 & 添加购物车细节
cart服务中的CartController
``` java
/**  
 * 添加商品到购物车  
 * @return  
 */  
@GetMapping(value = "/addToCart")  
public String addToCart(@RequestParam("skuId") Long skuId,  
                        @RequestParam("num") Integer num,  
                        Model model) throws ExecutionException, InterruptedException{  
    model.addToCart(skuId, num);  
    return "success";  
}
```
cart服务中新建SkuInfoVo
``` java
@Data  
public class SkuInfoVo {  
  
    private Long skuId;  
    /**  
     * spuId     */    private Long spuId;  
    /**  
     * sku名称  
     */  
    private String skuName;  
    /**  
     * sku介绍描述  
     */  
    private String skuDesc;  
    /**  
     * 所属分类id  
     */    private Long catalogId;  
    /**  
     * 品牌id  
     */    private Long brandId;  
    /**  
     * 默认图片  
     */  
    private String skuDefaultImg;  
    /**  
     * 标题  
     */  
    private String skuTitle;  
    /**  
     * 副标题  
     */  
    private String skuSubtitle;  
    /**  
     * 价格  
     */  
    private BigDecimal price;  
    /**  
     * 销量  
     */  
    private Long saleCount;  
  
}
```
cart服务中新建ProductFeignService
``` java
@FeignClient("gulimall-product")  
public interface ProductFeignService {  
  
    /**  
     * 根据skuId查询sku信息  
     * @param skuId  
     * @return  
     */  
    @RequestMapping("/product/skuinfo/info/{skuId}")  
    R getInfo(@PathVariable("skuId") Long skuId);  

	/**  
	 * 根据skuId查询pms_sku_sale_attr_value表中的信息  
	 * @param skuId  
	 * @return  
	 */  
	@GetMapping(value = "/product/skusaleattrvalue/stringList/{skuId}")  
	List<String> getSkuSaleAttrValues(@PathVariable("skuId") Long skuId);
  
}
```
从product服务中拷贝MyThreadConfig和ThreadPoolConfigProperties到car服务中
并且在application.properties添加配置信息
``` yml
#配置线程池  
gulimall.thread.coreSize=20  
gulimall.thread.maxSize=200  
gulimall.thread.keepAliveTime=10
```
cart服务中CartServiceImpl
``` java
@Slf4j  
@Service("cartService")  
public class CartServiceImpl implements CartService {  
  
    @Autowired  
    private StringRedisTemplate redisTemplate;  
  
    @Autowired  
    private ProductFeignService productFeignService;  
  
    @Autowired  
    private ThreadPoolExecutor executor;  
  
    @Override  
    public CartItemVo addToCart(Long skuId, Integer num) throws ExecutionException, InterruptedException {  
  
        //拿到要操作的购物车信息  
        BoundHashOperations<String, Object, Object> cartOps = getCartOps();  
  
        //判断Redis是否有该商品的信息  
        String productRedisValue = (String) cartOps.get(skuId.toString());  
        //如果没有就添加数据  
        if (StringUtils.isEmpty(productRedisValue)) {  
  
            //2、添加新的商品到购物车(redis)  
            CartItemVo cartItemVo = new CartItemVo();  
            //开启第一个异步任务  
            CompletableFuture<Void> getSkuInfoFuture = CompletableFuture.runAsync(() -> {  
                //1、远程查询当前要添加商品的信息  
                R productSkuInfo = productFeignService.getInfo(skuId);  
                SkuInfoVo skuInfo = productSkuInfo.getData("skuInfo", SkuInfoVo.class);  
                //数据赋值操作  
                cartItemVo.setSkuId(skuInfo.getSkuId());  
                cartItemVo.setTitle(skuInfo.getSkuTitle());  
                cartItemVo.setImage(skuInfo.getSkuDefaultImg());  
                cartItemVo.setPrice(skuInfo.getPrice());  
                cartItemVo.setCount(num);  
            }, executor);  
  
            //开启第二个异步任务  
            CompletableFuture<Void> getSkuAttrValuesFuture = CompletableFuture.runAsync(() -> {  
                //2、远程查询skuAttrValues组合信息  
                List<String> skuSaleAttrValues = productFeignService.getSkuSaleAttrValues(skuId);  
                cartItemVo.setSkuAttrValues(skuSaleAttrValues);  
            }, executor);  
  
            //等待所有的异步任务全部完成  
            CompletableFuture.allOf(getSkuInfoFuture, getSkuAttrValuesFuture).get();  
  
            String cartItemJson = JSON.toJSONString(cartItemVo);  
            cartOps.put(skuId.toString(), cartItemJson);  
  
            return cartItemVo;  
        } else {  
            //购物车有此商品，修改数量即可  
            CartItemVo cartItemVo = JSON.parseObject(productRedisValue, CartItemVo.class);  
            cartItemVo.setCount(cartItemVo.getCount() + num);  
            //修改redis的数据  
            String cartItemJson = JSON.toJSONString(cartItemVo);  
            cartOps.put(skuId.toString(), cartItemJson);  
  
            return cartItemVo;  
        }  
    }  
  
    /**  
     * 获取到我们要操作的购物车  
     *  
     * @return  
     */  
    private BoundHashOperations<String, Object, Object> getCartOps() {  
        //先得到当前用户信息  
        UserInfoTo userInfoTo = CartInterceptor.toThreadLocal.get();  
  
        String cartKey = "";  
        if (userInfoTo.getUserId() != null) {  
            //gulimall:cart:1  
            cartKey = CartConstant.CART_PREFIX + userInfoTo.getUserId();  
        } else {  
            cartKey = CartConstant.CART_PREFIX + userInfoTo.getUserKey();  
        }  
  
        //绑定指定的key操作Redis  
        return redisTemplate.boundHashOps(cartKey);  
    }  
}
```
product服务的SkuSaleAttrValueController
``` java
@GetMapping(value = "/stringList/{skuId}")  
public List<String> getSkuSaleAttrValues(@PathVariable("skuId") Long skuId) {  
    List<String> stringList = skuSaleAttrValueService.getSkuSaleAttrValuesAsStringList(skuId);  
    return stringList;  
}
```
product服务的SkuSaleAttrValueServiceImpl
``` java
@Override  
public List<String> getSkuSaleAttrValuesAsStringList(Long skuId) {  
    SkuSaleAttrValueDao baseMapper = this.baseMapper;  
    return baseMapper.getSkuSaleAttrValuesAsStringList(skuId);  
}
```
product服务的SkuSaleAttrValueDao
``` java
List<String> getSkuSaleAttrValuesAsStringList(Long skuId);
```
product服务的SkuSaleAttrValueDao.xml
``` xml
<select id="getSkuSaleAttrValuesAsStringList" resultType="java.lang.String">  
    SELECT  
        CONCAT( attr_name, "：", attr_value )  
    FROM        pms_sku_sale_attr_value    WHERE        sku_id = #{skuId}</select>
```

#### RedirectAttribute
cart服务的CartController
``` java
	/**  
     * 添加商品到购物车  
     * @return  
     */  
    @GetMapping(value = "/addToCart")  
    public String addToCart(@RequestParam("skuId") Long skuId,  
                            @RequestParam("num") Integer num,  
                            Model model,  
                            RedirectAttributes redirectAttributes) throws ExecutionException, InterruptedException{  
        /*CartItemVo cartItem = cartService.addToCart(skuId, num);  
        model.addAttribute("cartItem", cartItem);*///        return "success";  
  
        cartService.addToCart(skuId, num);  
        redirectAttributes.addAttribute("skuId", skuId);  
        return "redirect:http://cart.gulimall.com/addToCartSuccess.html";  
    }  
  
    @GetMapping(value = "/addToCartSuccess.html")  
    public String addToCartSuccess(@RequestParam("skuId") Long skuId,  
                                   Model model) throws ExecutionException, InterruptedException {  
        // 重定向到成功页面， 再次查询一次购物车即可  
        CartItemVo cartItem = cartService.getCartItem(skuId);  
        model.addAttribute("cartItem", cartItem);  
        return "success";  
    }
```
cart服务的CartServiceImpl
``` java
@Override  
public CartItemVo getCartItem(Long skuId) {  
    //拿到要操作的购物车信息  
    BoundHashOperations<String, Object, Object> cartOps = getCartOps();  
    String redisValue = (String) cartOps.get(skuId.toString());  
    return JSON.parseObject(redisValue, CartItemVo.class);  
}
```

#### 获取&合并购物车
cart服务的CartController
``` java
/**  
 * 去购物车页面的请求  
 * 浏览器有一个cookie:user-key 标识用户的身份，一个月过期  
 * 如果第一次使用jd的购物车功能，都会给一个临时的用户身份:  
 * 浏览器以后保存，每次访问都会带上这个cookie；  
 * <p>  
 * 登录：session有  
 * 没登录：按照cookie里面带来user-key来做  
 * 第一次，如果没有临时用户，自动创建一个临时用户  
 *  
 * @return  
 */  
@GetMapping(value = "/cart.html")  
public String cartListPage(HttpSession session, Model model) throws ExecutionException, InterruptedException {  
    /*Object attribute = session.getAttribute(AuthServerConstant.LOGIN_USER);  
    if (attribute == null) {        // 没登录，获取临时购物车  
    } else {        // 获取登录了的购物车  
    }*/  
    //快速得到用户信息：id,user-key  
    /*UserInfoTo userInfoTo = CartInterceptor.toThreadLocal.get();    System.out.println("userInfoTo = " + userInfoTo);*/  
    CartVo cartVo = cartService.getCart();  
    model.addAttribute("cart", cartVo);  
  
    return "cartList";  
}
```
cart服务的CartServiceImpl
``` java
/**  
 * 获取用户登录或者未登录购物车里所有的数据  
 *  
 * @return  
 * @throws ExecutionException  
 * @throws InterruptedException  
 */@Override  
public CartVo getCart() throws ExecutionException, InterruptedException {  
  
    CartVo cartVo = new CartVo();  
    UserInfoTo userInfoTo = CartInterceptor.toThreadLocal.get();  
    if (userInfoTo.getUserId() != null) {  
        //1、登录  
        String cartKey = CartConstant.CART_PREFIX + userInfoTo.getUserId();  
        //临时购物车的键  
        String temptCartKey = CartConstant.CART_PREFIX + userInfoTo.getUserKey();  
  
        //2、如果临时购物车的数据还未进行合并  
        List<CartItemVo> tempCartItems = getCartItems(temptCartKey);  
        if (tempCartItems != null) {  
            //临时购物车有数据需要进行合并操作  
            for (CartItemVo item : tempCartItems) {  
                addToCart(item.getSkuId(), item.getCount());  
            }  
            //清除临时购物车的数据  
            clearCartInfo(temptCartKey);  
        }  
  
        //3、获取登录后的购物车数据【包含合并过来的临时购物车的数据和登录后购物车的数据】  
        List<CartItemVo> cartItems = getCartItems(cartKey);  
        cartVo.setItems(cartItems);  
  
    } else {  
        //没登录  
        String cartKey = CartConstant.CART_PREFIX + userInfoTo.getUserKey();  
        //获取临时购物车里面的所有购物项  
        List<CartItemVo> cartItems = getCartItems(cartKey);  
        cartVo.setItems(cartItems);  
    }  
  
    return cartVo;  
}

/**  
 * 获取购物车里面的数据  
 *  
 * @param cartKey  
 * @return  
 */  
private List<CartItemVo> getCartItems(String cartKey) {  
    //获取购物车里面的所有商品  
    BoundHashOperations<String, Object, Object> operations = redisTemplate.boundHashOps(cartKey);  
    List<Object> values = operations.values();  
    if (values != null && values.size() > 0) {  
        return values.stream().map((obj) -> {  
            String str = (String) obj;  
            return JSON.parseObject(str, CartItemVo.class);  
        }).collect(Collectors.toList());  
    }  
    return null;  
}

@Override  
public void clearCartInfo(String cartKey) {  
    redisTemplate.delete(cartKey);  
}
```

#### 选中购物项
cart服务的CartController
``` java
/**  
 * 商品是否选中  
 *  
 * @param skuId  
 * @param checked  
 * @return  
 */  
@GetMapping(value = "/checkItem")  
public String checkItem(@RequestParam(value = "skuId") Long skuId,  
                        @RequestParam(value = "checked") Integer checked) {  
  
    cartService.checkItem(skuId, checked);  
  
    return "redirect:http://cart.gulimall.com/cart.html";  
  
}
```
cart服务的CartServiceImpl
``` java
@Override  
public void checkItem(Long skuId, Integer check) {  
  
    //查询购物车里面的商品  
    CartItemVo cartItem = getCartItem(skuId);  
    //修改商品状态  
    cartItem.setCheck(check == 1);  
  
    //序列化存入redis中  
    String redisValue = JSON.toJSONString(cartItem);  
  
    BoundHashOperations<String, Object, Object> cartOps = getCartOps();  
    cartOps.put(skuId.toString(), redisValue);  
  
}
```

#### 改变购物项数量
cart服务的CartController
``` java
@GetMapping(value = "/countItem")  
public String countItem(@RequestParam(value = "skuId") Long skuId,  
                        @RequestParam(value = "num") Integer num) {  
  
    cartService.changeItemCount(skuId, num);  
  
    return "redirect:http://cart.gulimall.com/cart.html";  
}
```
cart服务的CartServiceImpl
``` java
/**  
 * 修改购物项数量  
 *  
 * @param skuId  
 * @param num  
 */  
@Override  
public void changeItemCount(Long skuId, Integer num) {  
  
    //查询购物车里面的商品  
    CartItemVo cartItem = getCartItem(skuId);  
    cartItem.setCount(num);  
  
    BoundHashOperations<String, Object, Object> cartOps = getCartOps();  
    //序列化存入redis中  
    String redisValue = JSON.toJSONString(cartItem);  
    cartOps.put(skuId.toString(), redisValue);  
}
```

#### 删除购物项
cart服务的CartController
``` java
/**  
 * 删除商品信息  
 *  
 * @param skuId  
 * @return  
 */  
@GetMapping(value = "/deleteItem")  
public String deleteItem(@RequestParam("skuId") Integer skuId) {  
  
    cartService.deleteIdCartInfo(skuId);  
  
    return "redirect:http://cart.gulimall.com/cart.html";  
  
}
```
cart服务的CartServiceImpl
``` java
/**  
 * 删除购物项  
 *  
 * @param skuId  
 */  
@Override  
public void deleteIdCartInfo(Integer skuId) {  
  
    BoundHashOperations<String, Object, Object> cartOps = getCartOps();  
    cartOps.delete(skuId.toString());  
}
```


### 消息队列
#### MQ简介
**异步处理**
![](/GuliMall/Pasted_image_20230219173110.png)
**应用解耦**
![](/GuliMall/Pasted_image_20230219173224.png)
**流量控制**
![](/GuliMall/Pasted_image_20230219173322.png)
![](/GuliMall/Pasted_image_20230219174127.png)
![](/GuliMall/Pasted_image_20230219174139.png)

**JMS协议和AMQP协议对比**
![](/GuliMall/Pasted_image_20230219174256.png)

#### RabbitMQ概念
RabbitMQ是一个由erlang开发的AMQP(Advanved Message Queue Protocol)的开源实现。
![](/GuliMall/image.png)
**Message**
消息，消息是不具名的，它由消息头和消息体组成。消息体是不透明的，而消息头则由一系列的可选属性组成， 这些属性包括routing-key（路由键）、priority（相对于其他消息的优先权）、delivery-mode（指出该消息可 能需要持久性存储）等。

**Publisher**
消息的生产者，也是一个向交换器发布消息的客户端应用程序。

**Exchange**
交换器，用来接收生产者发送的消息并将这些消息路由给服务器中的队列。
Exchange有4种类型：direct(默认), fanout, topic, 和headers，不同类型的Exchange转发消息的策略有所区别.
![](/GuliMall/Pasted_image_20230220233154.png)
![](/GuliMall/Pasted_image_20230220233249.png)
![](/GuliMall/Pasted_image_20230220233313.png)

**Queue**
消息队列，用来保存消息直到发送给消费者。它是消息的容器，也是消息的终点。一个消息可投入一个或多个队列。消息一直 在队列里面，等待消费者连接到这个队列将其取走。

**Binding**
绑定，用于消息队列和交换器之间的关联。一个绑定就是基于路由键将交换器和消息队列连接起来的路由规则，所以可以将交 换器理解成一个由绑定构成的路由表。
Exchange和Queue的绑定可以是多对多的关系。

**Connection**
网络连接，比如一个TCP连接。

**Channel**
信道，多路复用连接中的一条独立的双向数据流通道。信道是建立在真实的TCP连接内的虚拟连接，AMQP命令都是通过信道 发出去的，不管是发布消息、订阅队列还是接收消息，这些动作都是通过信道完成。因为对于操作系统来说建立和销毁TCP都 是非常昂贵的开销，所以引入了信道的概念，以复用一条TCP连接。

**Consumer**
消息的消费者，表示一个从消息队列中取得消息的客户端应用程序。

**Virtual Host**
虚拟主机，表示一批交换器、消息队列和相关对象。虚拟主机是共享相同的身份认证和加 密环境的独立服务器域。每个 vhost 本质上就是一个mini版的RabbitMQ 服务器，拥 有自己的队列、交换器、绑定和权限机制。vhost是AMQP概念的基础，必须在连接时 指定，RabbitMQ 默认的vhost是/。

**Broker**
表示消息队列服务器实体

![](/GuliMall/Pasted_image_20230220233057.png)

#### RabbitMQ安装
``` sh
# 启动rabbitmq
docker run -d --name rabbitmq -p 5671:5671 -p 5672:5672 -p 4369:4369 -p 25672:25672 -p 15671:15671 -p 15672:15672 rabbitmq:management

# 4369,25672(Erlang发现&集群端口)
# 5672,5671(AMQP端口)
# 15672 (web管理后台端口)
# 61613,61614(STOMP协议端口)
# 1883,8883(MQTT协议端口)
# https://www.rabbitmq.com/networking.html

# rabbitmq自启
docker update rabbitmq --restart=always
```
测试：http://192.168.56.10:15672/

创建：
![](/GuliMall/Pasted_image_20230220233503.png)

#### SpringBoot整合RabbitMQ
在order服务的pom.xml中引入依赖
``` xml
<dependency>  
   <groupId>org.springframework.boot</groupId>  
   <artifactId>spring-boot-starter-amqp</artifactId>  
</dependency>
```

在启动类上使用`@EnableRabbit`注解

在配置文件中配置
``` yml
spring.rabbitmq.host=192.168.56.10  
spring.rabbitmq.port=5672  
spring.rabbitmq.virtual-host=/
```

#### AmqpAdmin使用 & RabbitTemplate使用
order服务中的GulimallOrderApplicationTestsfdvccccccccccccccccccccccccccccccccccccccccccccccccccccccccvvvvvvvvvvv" bn{})
``` java
@Autowired  
AmqpAdmin amqpAdmin;  
  
@Autowired  
RabbitTemplate rabbitTemplate;  
  
@Test  
void sendMessageTest() {  
    // 1. 发消息(任意消息)  
    /*String msg = "Hello World";    rabbitTemplate.convertAndSend(            "hello-java-exchange",            "hello.java",            msg    );    log.info("消息发送完成{}", msg);*/  
  
    /*发消息(对象)  
        如果发送的消息是个对象，我们会使用序列化机制，将对象写出去，那么对象就必须实现Serializable  
        也可以配置rabbitmq的序列化方式配置  
    */    OrderReturnReasonEntity reasonEntity = new OrderReturnReasonEntity();  
    reasonEntity.setId(1L);  
    reasonEntity.setCreateTime(new Date());  
    reasonEntity.setName("哈哈");  
    rabbitTemplate.convertAndSend(  
            "hello-java-exchange",  
            "hello.java",  
            reasonEntity  
    );  
    log.info("消息发送完成{}", reasonEntity);  
}  
  
  
/**  
 * 1. 如何创建Exchange[hello-java-exchange], Queue[hello-java-queue], Binding[hello.java]  
 * 1) 使用 AmqpAdmin 进行创建  
 * 2. 如何收发消息  
 */  
@Test  
void createExchange() {  
    Exchange directExchange = new DirectExchange(  
            "hello-java-exchange",    // 名称  
            true,    // 是否持久化  
            false   // 是否自动删除  
    );  
    amqpAdmin.declareExchange(directExchange);  
    log.info("Exchange[{}]创建成功", "hello-java-exchange");  
}  
  
@Test  
void createQueue() {  
    Queue queue = new Queue(  
            "hello-java-queue",  
            true, // 是否持久化  
            false,  // 是否排他  
            false // 是否自动删除  
    );  
    amqpAdmin.declareQueue(queue);  
    log.info("Queue[{}]创建成功", "hello-java-queue");  
}  
  
@Test  
void createBinding() {  
    Binding binding = new Binding(  
            "hello-java-queue", // 目的地  
            Binding.DestinationType.QUEUE, // 目的地类型[交换机或队列]  
            "hello-java-exchange",  // 交换机  
            "hello.java", // 路由键  
            null// 自定义参数  
    );  
    amqpAdmin.declareBinding(binding);  
    log.info("Binding[{}]创建成功", "hello-java-binding");  
}
```

#### RaabbitListeher&RabbitHandler接受消息
##### RaabbitListeher
order服务中OrderItemServiceImpl
``` java
	/**  
     * queues: 声明需要监听的所有队列  
     *  
     * 参数可以写一些类型  
     * 1. Message message: 原生消息详细信息，头+体  
     * 2. T<发送的消息的类型>  
     * 3，Channel channel：当前传输数据的通道  
     *  
     * Queue: 可以很多人都来监听。只要收到消息，队列就删除消息，而且只能有一个收到此消息  
     * 场景：  
     *      1）订单服务启动多个:同一个消息，只能有一个客户端收到  
     *      2）只有一个消息完全处理完，方法运行结束我们就可以接受下一个消息  
     */  
    @RabbitListener(queues = {"hello-java-queue"})  
    public void receiveMessage(Message message,  
                               OrderReturnReasonEntity content,  
                               Channel channel) throws InterruptedException {  
        byte[] body = message.getBody();  
        // 消息头属性信息  
        MessageProperties messageProperties = message.getMessageProperties();  
//        System.out.println("接收到消息...:" + message + "==>类型," + message);  
  
        System.out.println("接收到消息...:" + message + "==>内容," + content);  
  
        Thread.sleep(3000);  
        System.out.println("消息处理完成=>" + content.getName());  
    }
```
复制一个订单服务测试多服务场景
![](/GuliMall/Pasted_image_20230225230300.png)

##### RabbitHandler
``` java
	@RabbitHandler  
    public void receiveMessage(Message message,  
                               OrderReturnReasonEntity content,  
                               Channel channel) throws InterruptedException {  
        byte[] body = message.getBody();  
        // 消息头属性信息  
        MessageProperties messageProperties = message.getMessageProperties();  
//        System.out.println("接收到消息...:" + message + "==>类型," + message);  
  
        System.out.println("接收到消息...:" + message + "==>内容," + content);  
  
        //Thread.sleep(3000);  
        System.out.println("消息处理完成=>" + content.getName());  
    }  
  
    @RabbitHandler  
    public void receiveMessage2(OrderEntity content) throws InterruptedException {  
        System.out.println("消息处理完成=>" + content);  
    }
```
order服务的RabbitController
``` java
@RestController  
public class RabbitController {  
  
    @Autowired  
    RabbitTemplate rabbitTemplate;  
  
    @GetMapping("/senMq")  
    public String sendMq(@RequestParam(value = "num", defaultValue = "10") Integer num) {  
        for (int i = 0; i < num; i++) {  
            if (i % 2 == 0) {  
                OrderReturnReasonEntity reasonEntity = new OrderReturnReasonEntity();  
                reasonEntity.setId(1L);  
                reasonEntity.setCreateTime(new Date());  
                reasonEntity.setName("哈哈-" + i);  
                rabbitTemplate.convertAndSend(  
                        "hello-java-exchange",  
                        "hello.java",  
                        reasonEntity  
                );  
            } else {  
                OrderEntity entity = new OrderEntity();  
                entity.setOrderSn(UUID.randomUUID().toString());  
                rabbitTemplate.convertAndSend(  
                        "hello-java-exchange",  
                        "hello.java",  
                        entity  
                );  
            }  
        }  
  
        return "OK";  
    }  
  
}
```

#### 可靠投递
##### 发送端确认
![](/GuliMall/Pasted_image_20230225234934.png)

###### 确认回调ConfirmCallback
![](/GuliMall/Pasted_image_20230301220300.png)
在order服务的application.properties中，新版的配置是：
``` properties
# 开启发送端确认
spring.rabbitmq.publisher-confirm-type=correlated
```
order服务的MyRabbitConfig
``` java
/**  
 * 定制RabbitTemplate  
 * 1. 服务器收到消息就回调  
 *  1)spring.rabbitmq.publisher-confirms=true  
 *  2)设置确认回调ConfirmCallback  
 * 2. 消息正确抵达队列  
 *  1)spring.rabbitmq.publisher-returns=true  
 *    spring.rabbitmq.template.mandatory=true *  2)设置确认回调ReturnsCallback  
 * * 3. 消息端确认（保证每个消息被正确消费，此时才可以broker删除这个消息）  
 */  
@PostConstruct  // MyRabbitConfig对象创建完成以后，执行此方法  
public void initRabbitTemplate() {  
    //确认回调  
    rabbitTemplate.setConfirmCallback(new RabbitTemplate.ConfirmCallback() {  
        /**  
         * 1. 只要消息抵达Brocker就ack=true  
         *         * @param correlationData 当前消息的唯一关联数据（这个是消息的唯一id）  
         * @param ack   消息是否成功收到  
         * @param cause 失败的原因  
         */  
        @Override  
        public void confirm(CorrelationData correlationData, boolean ack, String cause) {  
            System.out.println("confirm......correlationData[" + correlationData +"]==>ack["+ack+"]==>cause["+cause+"]");  
        }  
    });   
}
```
###### 失败回调ReturnsCallback
![](/GuliMall/Pasted_image_20230301220444.png)
``` properties
# 开启发送端消息抵达队列的确认  
spring.rabbitmq.publisher-returns=true  
# 只要抵达队列，以异步的方式优先回调returnConfirm  
spring.rabbitmq.template.mandatory=true
```
order服务的MyRabbitConfig
``` java
/**  
 * 定制RabbitTemplate  
 * 1. 服务器收到消息就回调  
 *  1)spring.rabbitmq.publisher-confirms=true  
 *  2)设置确认回调ConfirmCallback  
 * 2. 消息正确抵达队列  
 *  1)spring.rabbitmq.publisher-returns=true  
 *    spring.rabbitmq.template.mandatory=true *  2)设置确认回调ReturnsCallback  
 * * 3. 消息端确认（保证每个消息被正确消费，此时才可以broker删除这个消息）  
 */  
@PostConstruct  // MyRabbitConfig对象创建完成以后，执行此方法  
public void initRabbitTemplate() {  
    //确认回调  
    rabbitTemplate.setConfirmCallback(new RabbitTemplate.ConfirmCallback() {  
        /**  
         * 1. 只要消息抵达Brocker就ack=true  
         *         * @param correlationData 当前消息的唯一关联数据（这个是消息的唯一id）  
         * @param ack   消息是否成功收到  
         * @param cause 失败的原因  
         */  
        @Override  
        public void confirm(CorrelationData correlationData, boolean ack, String cause) {  
            System.out.println("confirm......correlationData[" + correlationData +"]==>ack["+ack+"]==>cause["+cause+"]");  
        }  
    });  
  
    // 设置消息抵达队列的确认回调:  
    rabbitTemplate.setReturnsCallback(new RabbitTemplate.ReturnsCallback() {  
        /**  
         * 只要消息没有投递给指定的队列，就触发这个失败回调  
         * @param returnedMessage  
         *          returnedMessage.getMessage()    投递失败的消息详细信息  
         *          returnedMessage.getReplyCode()  回复的状态码  
         *          returnedMessage.getReplyText()  回复的文本内容  
         *          returnedMessage.getExchange()   当时这个消息发给哪个交换机  
         *          returnedMessage.getRoutingKey() 当时这个消息用哪个路由键  
         *  
         */        @Override  
        public void returnedMessage(ReturnedMessage returnedMessage) {  
            System.out.println("Fail Message[" + returnedMessage +"]");  
        }  
    });  
}
```

##### 消费端确认
###### Ack消息确认机制
![](/GuliMall/Pasted_image_20230301220740.png)
在order服务的application.properties中，新版的配置是：
``` properties
# 手动ack消息  
spring.rabbitmq.listener.simple.acknowledge-mode=manual
```
在order服务的OrderItemServiceImpl中
``` java
@RabbitHandler  
public void receiveMessage(Message message,  
						   OrderReturnReasonEntity content,  
						   Channel channel) throws InterruptedException {  
	byte[] body = message.getBody();  
	// 消息头属性信息  
	MessageProperties messageProperties = message.getMessageProperties();  
//        System.out.println("接收到消息...:" + message + "==>类型," + message);  

	System.out.println("接收到消息...:" + message + "==>内容," + content);  

	//Thread.sleep(3000);  
	System.out.println("消息处理完成=>" + content.getName());  

	// channel内按顺序自增  
	long deliveryTag = message.getMessageProperties().getDeliveryTag();  
	System.out.println("deliveryTag ==> " + deliveryTag);  

	// 签收货物，非批量模式  
	try {  
		if (deliveryTag % 2 == 0) {  
			// 收货  
			channel.basicAck(deliveryTag, false);  
			System.out.println("签收了货物..." + deliveryTag);  
		} else {  
			// 退货 requeue=false丢弃  requeue=true发回服务器，服务器重新入队  
			//long deliveryTag, boolean multiple, boolean requeue  
			channel.basicNack(deliveryTag, false, true);  
			//long deliveryTag, boolean requeue  
//            channel.basicReject();  
			System.out.println("没有签收货物..." + deliveryTag);  
		}  
	} catch (IOException e) {  
		// 网络终端  
	}  
}
```

### 订单服务
#### 页面环境搭建
将等待付款的静态页面放到服务器的`/mydata/nginx/html/static/order/detail`目录下
并将等待付款的`index.html`页面复制到订单服务的templates目录下，并重命名为`detail.html`

将订单页的静态页面放到服务器的`/mydata/nginx/html/static/order/list`目录下
并将订单页的`index.html`页面复制到订单服务的templates目录下，并重命名为`list.html`

将结算页的静态页面放到服务器的`/mydata/nginx/html/static/order/confirm`目录下
并将结算页的`index.html`页面复制到订单服务的templates目录下，并重命名为`confirm.html`

将收银页的静态页面放到服务器的`/mydata/nginx/html/static/order/pay`目录下
并将收银页的`index.html`页面复制到订单服务的templates目录下，并重命名为`pay.html`

修改hosts文件，新增订单域名的DNS解析
``` sh
# Gulimall Start
192.168.56.10   gulimall.com
192.168.56.10   search.gulimall.com
192.168.56.10   item.gulimall.com
192.168.56.10   auth.gulimall.com
192.168.56.10   cart.gulimall.com
192.168.56.10   order.gulimall.com
# Gulimall End
```

在网关服务的application.yml中增加网关转发配置
``` yml
- id: gulimall_order_rout  
  uri: lb://gulimall-order  
  predicates:  
    - Host=order.gulimall.com
```

订单服务中的pom.xml中引入thymeleaf依赖
``` yml
<dependency>  
   <groupId>org.springframework.boot</groupId>  
   <artifactId>spring-boot-starter-thymeleaf</artifactId>  
</dependency>
```
并且在application.properties中将thymeleaf缓存关闭
``` yml
spring.thymeleaf.cache=false
```
订单服务中新建视图解析的类
``` java
@RestController  
public class HelloController {  
  
    @GetMapping("/{page}.html")  
	public String listPage(@PathVariable("page") String page) {  
	    return page;  
	}
}
```

由于之前没有在注册中心注册订单服务，所以还需要在注册中心将订单服务注册
首先在启动类上使用`@EnableDiscoveryClient`，并且在applicatioin.properties中添加注册中心配置
``` properties
spring.cloud.nacos.discovery.server-addr=127.0.0.1:8848  
spring.application.name=gulimall-order
```

#### 整合SpringSession
引入SpringSession依赖
``` xml
<dependency>  
    <groupId>org.springframework.session</groupId>  
    <artifactId>spring-session-data-redis</artifactId>  
</dependency>

<dependency>  
   <groupId>org.springframework.boot</groupId>  
   <artifactId>spring-boot-starter-data-redis</artifactId>  
   <exclusions>      <exclusion>  
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
在application.properties中添加配置
``` properties
spring.session.store-type=redis

gulimall.thread.core-size=20  
gulimall.thread.max-size=200  
gulimall.thread.keep-alive-time=10
```
将product服务的GulimallSessionConfig类，MyThreadConfig类，ThreadPoolConfigProperties类复制到order服务中

启动时发现third-part服务和cart服务端口冲突，将cart服务的端口修改为30010

在启动类上添加`@EnableRedisHttpSession`注解

前端页面修改，略

#### 订单基本概念
订单构成：用户信息、订单基础信息、商品信息、优惠信息、支付信息、物流信息
![](/GuliMall/Pasted_image_20230306195625.png)

订单状态：待付款、已付款/待发货、待收货/已发货、已完成、已取消、售后中

订单流程：订单创建于支付、逆向流程
![](/GuliMall/电商订单流程图.png)

#### 订单登录拦截
前端修改，略

在order服务中新建 `LoginInterceptor`
``` java
/**  
 * 登录拦截器，未登录的用户不能进入订单服务  
 */  
public class LoginInterceptor implements HandlerInterceptor {  
    public static ThreadLocal<MemberResponseVo> loginUser = new ThreadLocal<>();  
  
    @Override  
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {  
        /*String requestURI = request.getRequestURI();  
        AntPathMatcher matcher = new AntPathMatcher();  
        boolean match1 = matcher.match("/order/order/infoByOrderSn/**", requestURI);  
        boolean match2 = matcher.match("/payed/**", requestURI);  
        if (match1||match2) return true;  */
  
        HttpSession session = request.getSession();  
        MemberResponseVo memberResponseVo = (MemberResponseVo) session.getAttribute(AuthServerConstant.LOGIN_USER);  
        if (memberResponseVo != null) {  
            loginUser.set(memberResponseVo);  
            return true;        }else {  
            session.setAttribute("msg","请先登录");  
            response.sendRedirect("http://auth.gulimall.com/login.html");  
            return false;        }  
    }  
  
    @Override  
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {  
  
    }  
    @Override  
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {  
  
    }}
```
在order服务中新建 `OrderWebConfiguration`
``` java
@Configuration  
public class OrderWebConfiguration implements WebMvcConfigurer {  
    @Override  
    public void addInterceptors(InterceptorRegistry registry) {  
        registry.addInterceptor(new LoginInterceptor()).addPathPatterns("/**");  
    }  
}
```

在order服务中新建 `OrderWebController`
``` java
@Controller  
public class OrderWebController {  

	@RequestMapping("/toTrade")  
	public String toTrade(Model model) {  
	    /*OrderConfirmVo confirmVo = orderService.confirmOrder();  
	    model.addAttribute("confirmOrder", confirmVo);  */
	    return "confirm";  
	}
}
```

#### 订单确认页模型抽取
```

在order服务中新建`OrderConfirmVo`
``` java
/**  
 * 订单确认页需要用的数据  
 */  
public class OrderConfirmVo {  
  
    @Getter  
    @Setter    /** 会员收获地址列表 **/  
    private List<MemberAddressVo> memberAddressVos;  
  
    @Getter @Setter  
    /** 所有选中的购物项 **/  
    private List<OrderItemVo> items;  
  
    /** 发票记录 **/  
    @Getter @Setter  
    /** 优惠券（会员积分） **/  
    private Integer integration;  
  
    /** 防止重复提交的令牌 **/  
    @Getter @Setter  
    private String orderToken;  
  
    @Getter @Setter  
    Map<Long,Boolean> stocks;  
  
    public Integer getCount() {  
        Integer count = 0;  
        if (items != null && items.size() > 0) {  
            for (OrderItemVo item : items) {  
                count += item.getCount();  
            }  
        }  
        return count;  
    }  
  
  
    /** 订单总额 **/  
    //BigDecimal total;  
    //计算订单总额  
    public BigDecimal getTotal() {  
        BigDecimal totalNum = BigDecimal.ZERO;  
        if (items != null && items.size() > 0) {  
            for (OrderItemVo item : items) {  
                //计算当前商品的总价格  
                BigDecimal itemPrice = item.getPrice().multiply(new BigDecimal(item.getCount().toString()));  
                //再计算全部商品的总价格  
                totalNum = totalNum.add(itemPrice);  
            }  
        }  
        return totalNum;  
    }  
  
  
    /** 应付价格 **/  
    //BigDecimal payPrice;  
    public BigDecimal getPayPrice() {  
        return getTotal();  
    }  
}
```
在order服务中新建OrderItemVo
``` java
@Data  
public class OrderItemVo {  
    private Long skuId;  
  
    private Boolean check = true;  
  
    private String title;  
  
    private String image;  
  
    /**  
     * 商品套餐属性  
     */  
    private List<String> skuAttrValues;  
  
    private BigDecimal price;  
  
    private Integer count;  
  
    private BigDecimal totalPrice;  
  
    /** 商品重量 **/  
    private BigDecimal weight = new BigDecimal("0.085");  
}
```
在order服务中新建OrderConfirmVo
``` java
/**  
 * 收货地址  
 */  
@Data  
public class MemberAddressVo {  
    private Long id;  
    /**  
     * member_id     */    private Long memberId;  
    /**  
     * 收货人姓名  
     */  
    private String name;  
    /**  
     * 电话  
     */  
    private String phone;  
    /**  
     * 邮政编码  
     */  
    private String postCode;  
    /**  
     * 省份/直辖市  
     */  
    private String province;  
    /**  
     * 城市  
     */  
    private String city;  
    /**  
     * 区  
     */  
    private String region;  
    /**  
     * 详细地址(街道)  
     */    private String detailAddress;  
    /**  
     * 省市区代码  
     */  
    private String areacode;  
    /**  
     * 是否默认  
     */  
    private Integer defaultStatus;  
}
```
在order服务中 `OrderWebController`的toTrade
``` java
@RequestMapping("/toTrade")  
	public String toTrade(Model model) {  
	    OrderConfirmVo confirmVo = orderService.confirmOrder();  
	    model.addAttribute("confirmOrder", confirmVo);
	    // 展示订单页
	    return "confirm";  
	}
```

#### 订单确认页数据获取
在启动类上加上`@EnableFeignClients`注解,开启远程服务调用
order服务中创建`MemberFeignService`
``` java
@FeignClient("gulimall-member")  
public interface MemberFeignService {  
  
    @RequestMapping("member/memberreceiveaddress/getAddressByUserId")  
    List<MemberAddressVo> getAddressByUserId(@RequestBody Long userId);  
    }
```
member服务中的`MemberReceiveAddressController`
``` java
@RequestMapping("/getAddressByUserId")  
public List<MemberReceiveAddressEntity> getAddressByUserId(@RequestBody Long userId) {  
    return memberReceiveAddressService.getAddressByUserId(userId);  
}
```
member服务中的`MemberReceiveAddressServiceImpl`
``` java
@Override  
public List<MemberReceiveAddressEntity> getAddressByUserId(Long userId) {  
    return this.list(new QueryWrapper<MemberReceiveAddressEntity>().eq("member_id", userId));  
}
```

cart服务中的CartController
``` java
/**  
 * 获取当前用户的购物车商品项  
 *  
 * @return  
 */  
@GetMapping(value = "/currentUserCartItems")  
@ResponseBody  
public List<CartItemVo> getCurrentCartItems() {  
  
    List<CartItemVo> cartItemVoList = cartService.getUserCartItems();  
  
    return cartItemVoList;  
}
```
cart服务的CartServiceImpl
``` java
@Override  
public List<CartItemVo> getUserCartItems() {  
  
    List<CartItemVo> cartItemVoList = new ArrayList<>();  
    //获取当前用户登录的信息  
    UserInfoTo userInfoTo = CartInterceptor.toThreadLocal.get();  
    //如果用户未登录直接返回null  
    if (userInfoTo.getUserId() == null) {  
        return null;  
    } else {  
        //获取购物车项  
        String cartKey = CART_PREFIX + userInfoTo.getUserId();  
        //获取所有的  
        List<CartItemVo> cartItems = getCartItems(cartKey);  
        if (cartItems == null) {  
            throw new CartExcep3tionHandler();  
        }  
        //筛选出选中的  
        cartItemVoList = cartItems.stream()  
                .filter(CartItemVo::getCheck)  
                .peek(item -> {  
                    //更新为最新的价格（查询数据库）  
                    BigDecimal price = productFeignService.getPrice(item.getSkuId());  
                    item.setPrice(price);  
                }).collect(Collectors.toList());  
    }  
  
    return cartItemVoList;  
}
```
cart服务的ProductFeignService
``` java
/**  
 * 根据skuId查询当前商品的最新价格  
 * @param skuId  
 * @return  
 */  
@GetMapping(value = "/product/skuinfo/{skuId}/price")  
BigDecimal getPrice(@PathVariable("skuId") Long skuId);
```
product服务的`SkuInfoController`
``` java
@GetMapping("/{skuId}/price")  
public BigDecimal getPrice(@PathVariable("skuId") Long skuId) {  
    SkuInfoEntity byId = skuInfoService.getById(skuId);  
    return byId.getPrice();  
}
```

order服务新建CartFeignService
``` java
@FeignClient("gulimall-cart")  
public interface CartFeignService {  
  
    @ResponseBody  
	@RequestMapping("/currentUserCartItems")  
	List<OrderItemVo> getCurrentUserCartItems();
	
}
```

`order`服务中`OrderServiceImpl`的`confirmOrder`
``` java
@Autowired  
private MemberFeignService memberFeignService;
@Autowired  
private CartFeignService cartFeignService;

@Override  
public OrderConfirmVo confirmOrder() {  
    OrderConfirmVo confirmVo = new OrderConfirmVo();  
	MemberResponseVo memberResponseVo = LoginInterceptor.loginUser.get();  
	  
	//1. 远程查出所有收货地址  
	List<MemberAddressVo> addressByUserId = memberFeignService.getAddressByUserId(memberResponseVo.getId());  
	confirmVo.setMemberAddressVos(addressByUserId);  
	//2. 远程查出所有选中购物项  
	List<OrderItemVo> items = cartFeignService.getCurrentUserCartItems();  
	confirmVo.setItems(items);
	//3. 查询用户积分  
	confirmVo.setIntegration(memberResponseVo.getIntegration());  
	//4. 其他数据自动计算  
	//5. 放重令牌
	
    return confirmVo;  
}
```
cart服务的ProductFeignService
``` java
/**  
 * 根据skuId查询当前商品的最新价格  
 * @param skuId  
 * @return  
 */  
@GetMapping(value = "/product/skuinfo/{skuId}/price")  
BigDecimal getPrice(@PathVariable("skuId") Long skuId);
```

#### Feign远程调用丢失请求头问题
![](/GuliMall/Pasted_image_20230307220357.png)
order服务中新建GuliFeignConfig
``` java
@Configuration  
public class GuliFeignConfig {  

    @Bean  
    public RequestInterceptor requestInterceptor() {  
        return new RequestInterceptor() {  
            @Override  
            public void apply(RequestTemplate template) {  
                //1. 使用RequestContextHolder拿到老请求的请求数据  
                ServletRequestAttributes requestAttributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();  
                if (requestAttributes != null) {  
                    HttpServletRequest request = requestAttributes.getRequest();  
                    if (request != null) {  
                        //2. 将老请求得到cookie信息放到feign请求上  
                        String cookie = request.getHeader("Cookie");  
                        template.header("Cookie", cookie);  
                    }  
                }  
            }  
        };  
    }  
    
}
```
`order`服务中`OrderServiceImpl`的`confirmOrder`
``` java
@Autowired  
private ThreadPoolExecutor executor;

@Override  
public OrderConfirmVo confirmOrder() {  
    OrderConfirmVo confirmVo = new OrderConfirmVo();  
	MemberResponseVo memberResponseVo = LoginInterceptor.loginUser.get();  
	  
	//1. 远程查出所有收货地址  
	List<MemberAddressVo> addressByUserId = memberFeignService.getAddressByUserId(memberResponseVo.getId());  
	confirmVo.setMemberAddressVos(addressByUserId);  
	//2. 远程查出所有选中购物项  
	List<OrderItemVo> items = cartFeignService.getCurrentUserCartItems();  
	confirmVo.setItems(items);  
	//3. 查询用户积分  
	confirmVo.setIntegration(memberResponseVo.getIntegration());  
	//4. 其他数据自动计算  
	//5. 放重令牌
	
    return confirmVo;  
}
```

#### Feign异步调用丢失请求头问题
![](/GuliMall/Pasted_image_20230308080910.png)
order服务中新建GuliFeignConfig
``` java
@Bean  
public RequestInterceptor requestInterceptor() {  
    return new RequestInterceptor() {  
        @Override  
        public void apply(RequestTemplate template) {  
            System.out.println("RequestInterceptor线程..." + Thread.currentThread().getId());  
            // feign远程之前先进行RequestInterceptor.apply  
            //1. 使用RequestContextHolder拿到老请求的请求数据  
            ServletRequestAttributes requestAttributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();  
            if (requestAttributes != null) {  
                HttpServletRequest request = requestAttributes.getRequest();  
                if (request != null) {  
                    //2. 将老请求得到cookie信息放到feign请求上  
                    String cookie = request.getHeader("Cookie");  
                    template.header("Cookie", cookie);  
                }  
            }  
        }  
    };  
}
```
`order`服务中`OrderServiceImpl`的`confirmOrder`
``` java
@Override  
public OrderConfirmVo confirmOrder() throws ExecutionException, InterruptedException {  
    OrderConfirmVo confirmVo = new OrderConfirmVo();  
    MemberResponseVo memberResponseVo = LoginInterceptor.loginUser.get();  
    System.out.println("主线程..." + Thread.currentThread().getId());  
  
    //1. 远程查出所有收货地址  
    /*List<MemberAddressVo> addressByUserId = memberFeignService.getAddressByUserId(memberResponseVo.getId());  
    confirmVo.setMemberAddressVos(addressByUserId);*/    //2. 远程查出所有选中购物项  
    /*List<OrderItemVo> items = cartFeignService.getCurrentUserCartItems();  
    confirmVo.setItems(items);*/    //3. 查询用户积分  
    /*confirmVo.setIntegration(memberResponseVo.getIntegration());*/  
    //4. 其他数据自动计算  
    //5. 放重令牌  
  
    //1. 查出所有收货地址  
    CompletableFuture<Void> addressFuture = CompletableFuture.runAsync(() -> {  
        System.out.println("member线程..." + Thread.currentThread().getId());  
        List<MemberAddressVo> addressByUserId = memberFeignService.getAddressByUserId(memberResponseVo.getId());  
        confirmVo.setMemberAddressVos(addressByUserId);  
    }, executor);  
  
    RequestAttributes requestAttributes = RequestContextHolder.getRequestAttributes();  
    CompletableFuture<Void> itemAndStockFuture = CompletableFuture.supplyAsync(() -> {  
        System.out.println("member线程..." + Thread.currentThread().getId());  
        RequestContextHolder.setRequestAttributes(requestAttributes);   // 异步调用请求头共享  
        //2. 查出所有选中购物项  
        List<OrderItemVo> items = cartFeignService.getCurrentUserCartItems();  
        confirmVo.setItems(items);  
        return items;  
    }, executor);  
  
	//3. 查询用户积分  
	confirmVo.setIntegration(memberResponseVo.getIntegration());
  
    //5. 总价自动计算  
    //6. 防重令牌  
    CompletableFuture.allOf(itemAndStockFuture, addressFuture).get();  
  
    return confirmVo;  
}
```

#### bug修改
product服务的SkuInfoController
``` java
@GetMapping("/{skuId}/price")  
public R getPrice(@PathVariable("skuId") Long skuId) {  
    SkuInfoEntity byId = skuInfoService.getById(skuId);  
    return R.ok().setData(byId.getPrice());  
}
```
cart服务的ProductFeignService
``` java
/**  
 * 根据skuId查询当前商品的最新价格  
 * @param skuId  
 * @return  
 */  
@GetMapping(value = "/product/skuinfo/{skuId}/price")  
R getPrice(@PathVariable("skuId") Long skuId);
```
cart服务的CartServiceImpl
``` java
@Override  
public List<CartItemVo> getUserCartItems() {  

	List<CartItemVo> cartItemVoList = new ArrayList<>();  
	//获取当前用户登录的信息  
	UserInfoTo userInfoTo = CartInterceptor.toThreadLocal.get();  
	//如果用户未登录直接返回null  
	if (userInfoTo.getUserId() == null) {  
		return null;  
	} else {  
		//获取购物车项  
		String cartKey = CART_PREFIX + userInfoTo.getUserId();  
		//获取所有的  
		List<CartItemVo> cartItems = getCartItems(cartKey);  
		if (cartItems == null) {  
//                throw new CartExcep3tionHandler();  
		}  
		//筛选出选中的  
		cartItemVoList = cartItems.stream()  
				.filter(CartItemVo::getCheck)  
				.peek(item -> {  
					//更新为最新的价格（查询数据库）  
					/*BigDecimal price = productFeignService.getPrice(item.getSkuId());*/  
					BigDecimal price = productFeignService.getPrice(item.getSkuId()).getData(BigDecimal.class);  
					item.setPrice(price);  
				})  
				.collect(Collectors.toList());  
	}  

	return cartItemVoList;  
}
```
cart服务的CartController
``` java
/**  
 * 获取当前用户的购物车商品项  
 *  
 * @return  
 */  
@GetMapping(value = "/currentUserCartItems")  
@ResponseBody  
public List<CartItemVo> getCurrentCartItems() {  
  
    List<CartItemVo> cartItemVoList = cartService.getUserCartItems();  
  
    return cartItemVoList;  
}
```

#### 订单确认页渲染
前端页面，略
order服务的OrderConfirmVo
``` java
/**  
 * 订单确认页需要用的数据  
 */  
public class OrderConfirmVo {  
  
    @Getter  
    @Setter    /** 会员收获地址列表 **/  
    private List<MemberAddressVo> memberAddressVos;  
  
    @Getter @Setter  
    /** 所有选中的购物项 **/  
    private List<OrderItemVo> items;  
  
    /** 发票记录 **/  
    @Getter @Setter  
    /** 优惠券（会员积分） **/  
    private Integer integration;  
  
    /** 防止重复提交的令牌 **/  
    @Getter @Setter  
    private String orderToken;  
  
    @Getter @Setter  
    Map<Long,Boolean> stocks;  
  
    public Integer getCount() {  
        Integer count = 0;  
        if (items != null && items.size() > 0) {  
            for (OrderItemVo item : items) {  
                count += item.getCount();  
            }  
        }  
        return count;  
    }  
  
  
    /** 订单总额 **/  
    //BigDecimal total;  
    //计算订单总额  
    public BigDecimal getTotal() {  
        BigDecimal totalNum = BigDecimal.ZERO;  
        if (items != null && items.size() > 0) {  
            for (OrderItemVo item : items) {  
                //计算当前商品的总价格  
                BigDecimal itemPrice = item.getPrice().multiply(new BigDecimal(item.getCount().toString()));  
                //再计算全部商品的总价格  
                totalNum = totalNum.add(itemPrice);  
            }  
        }  
        return totalNum;  
    }  
  
  
    /** 应付价格 **/  
    //BigDecimal payPrice;  
    public BigDecimal getPayPrice() {  
        return getTotal();  
    }  
}
```

#### 订单确认页库存查询
order服务中WareFeignService
``` java
@FeignClient("gulimall-ware")  
public interface WareFeignService {  
  
    @RequestMapping("ware/waresku/hasStock")  
    List<SkuHasStockVo> getSkuHasStocks(@RequestBody List<Long> ids);  
      
}
```
order服务中SkuStockVo
```java
@Data  
public class SkuStockVo {  
  
    private Long skuId;  
  
    private Boolean hasStock;  
  
}
```
order服务中OrderServiceImpl
``` java
@Autowired  
private WareFeignService wareFeignService;

@Override  
public OrderConfirmVo confirmOrder() throws ExecutionException, InterruptedException {  
    OrderConfirmVo confirmVo = new OrderConfirmVo();  
    MemberResponseVo memberResponseVo = LoginInterceptor.loginUser.get();  
    System.out.println("主线程..." + Thread.currentThread().getId());  
  
    //1. 远程查出所有收货地址  
    /*List<MemberAddressVo> addressByUserId = memberFeignService.getAddressByUserId(memberResponseVo.getId());  
    confirmVo.setMemberAddressVos(addressByUserId);*/    //2. 远程查出所有选中购物项  
    /*List<OrderItemVo> items = cartFeignService.getCurrentUserCartItems();  
    confirmVo.setItems(items);*/  
    // 获取主线程的请求头  
    RequestAttributes requestAttributes = RequestContextHolder.getRequestAttributes();  
    //1. 查出所有收货地址  
    CompletableFuture<Void> addressFuture = CompletableFuture.runAsync(() -> {  
        System.out.println("member线程..." + Thread.currentThread().getId());  
        // 异步调用请求头共享：每一个线程都共享之前的请求头  
        RequestContextHolder.setRequestAttributes(requestAttributes);  
        List<MemberAddressVo> addressByUserId = memberFeignService.getAddressByUserId(memberResponseVo.getId());  
        confirmVo.setMemberAddressVos(addressByUserId);  
    }, executor);  
  
  
    CompletableFuture<Void> itemAndStockFuture = CompletableFuture.supplyAsync(() -> {  
        System.out.println("member线程..." + Thread.currentThread().getId());  
        RequestContextHolder.setRequestAttributes(requestAttributes);   // 异步调用请求头共享  
        //2. 查出所有选中购物项  
        List<OrderItemVo> items = cartFeignService.getCurrentUserCartItems();  
        confirmVo.setItems(items);  
        return items;  
    }, executor).thenAcceptAsync((items) -> {  
        //4. 库存  
        List<Long> skuIds = items.stream().map(OrderItemVo::getSkuId).collect(Collectors.toList());  
        R hasStocks = wareFeignService.getSkuHasStocks(skuIds);  
        List<SkuStockVo> data = hasStocks.getData(new TypeReference<List<SkuStockVo>>() {  
        });  
        if (data != null) {  
            data.stream().collect(Collectors.toMap(SkuStockVo::getSkuId, SkuStockVo::getHasStock));  
        }  
        Map<Long, Boolean> hasStockMap = data.stream().collect(Collectors.toMap(SkuStockVo::getSkuId, SkuStockVo::getHasStock));  
        confirmVo.setStocks(hasStockMap);  
    }, executor);  
  
    //3. 查询用户积分  
    confirmVo.setIntegration(memberResponseVo.getIntegration());  
  
    //5. 总价自动计算  
    //6. 防重令牌  
    CompletableFuture.allOf(itemAndStockFuture, addressFuture).get();  
  
    return confirmVo;  
}
```
order服务中GuliFeignConfig
``` java
@Bean  
public RequestInterceptor requestInterceptor() {  
    return new RequestInterceptor() {  
        @Override  
        public void apply(RequestTemplate template) {  
            System.out.println("RequestInterceptor线程..." + Thread.currentThread().getId());  
            // feign远程之前先进行RequestInterceptor.apply  
            //1. 使用RequestContextHolder拿到老请求的请求数据  
            ServletRequestAttributes requestAttributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();  
            if (requestAttributes != null) {  
                HttpServletRequest request = requestAttributes.getRequest();  
                if (request != null) {  
                    //2. 将老请求得到cookie信息放到feign请求上  
                    String cookie = request.getHeader("Cookie");  
                    template.header("Cookie", cookie);  
                }  
            }  
        }  
    };  
}
```
order服务中OrderServiceImpl
``` java
@Override  
public OrderConfirmVo confirmOrder() throws ExecutionException, InterruptedException {  
    OrderConfirmVo confirmVo = new OrderConfirmVo();  
    MemberResponseVo memberResponseVo = LoginInterceptor.loginUser.get();  
    System.out.println("主线程..." + Thread.currentThread().getId());  
  
    //1. 远程查出所有收货地址  
    /*List<MemberAddressVo> addressByUserId = memberFeignService.getAddressByUserId(memberResponseVo.getId());  
    confirmVo.setMemberAddressVos(addressByUserId);*/    //2. 远程查出所有选中购物项  
    /*List<OrderItemVo> items = cartFeignService.getCurrentUserCartItems();  
    confirmVo.setItems(items);*/  
    // 获取主线程的请求头  
    RequestAttributes requestAttributes = RequestContextHolder.getRequestAttributes();  
    //1. 查出所有收货地址  
    CompletableFuture<Void> addressFuture = CompletableFuture.runAsync(() -> {  
        System.out.println("member线程..." + Thread.currentThread().getId());  
        // 异步调用请求头共享：每一个线程都共享之前的请求头  
        RequestContextHolder.setRequestAttributes(requestAttributes);  
        List<MemberAddressVo> addressByUserId = memberFeignService.getAddressByUserId(memberResponseVo.getId());  
        confirmVo.setMemberAddressVos(addressByUserId);  
    }, executor);  
  
  
    CompletableFuture<Void> itemAndStockFuture = CompletableFuture.supplyAsync(() -> {  
        System.out.println("member线程..." + Thread.currentThread().getId());  
        RequestContextHolder.setRequestAttributes(requestAttributes);   // 异步调用请求头共享  
        //2. 查出所有选中购物项  
        List<OrderItemVo> items = cartFeignService.getCurrentUserCartItems();  
        confirmVo.setItems(items);  
        return items;  
    }, executor).thenAcceptAsync((items) -> {  
        //4. 库存  
        List<Long> skuIds = items.stream().map(OrderItemVo::getSkuId).collect(Collectors.toList());  
        R hasStocks = wareFeignService.getSkuHasStocks(skuIds);  
        /*TypeReference<List<SkuStockVo>> typeReference = new TypeReference<List<SkuStockVo>>() {};  
        List<SkuStockVo> data = hasStocks.getData(typeReference);        if (data != null) {            Map<Long, Boolean> hasStockMap = data.stream().collect(Collectors.toMap(SkuStockVo::getSkuId, SkuStockVo::getHasStock));            confirmVo.setStocks(hasStockMap);        }*/        TypeReference<List<SkuHasStockVo>> typeReference = new TypeReference<List<SkuHasStockVo>>() {};  
        List<SkuHasStockVo> data = hasStocks.getData(typeReference);  
        Map<Long, Boolean>hasStockMap = data.stream()  
                .collect(Collectors.toMap(t -> t.getSkuId(), t -> t.getHasStock()));  
  
        confirmVo.setStocks(hasStockMap);  
    }, executor);  
  
    //3. 查询用户积分  
    confirmVo.setIntegration(memberResponseVo.getIntegration());  
  
    //5. 总价自动计算  
    //6. 防重令牌  
    CompletableFuture.allOf(itemAndStockFuture, addressFuture).get();  
  
    return confirmVo;  
}
```

#### 订单确认页模拟运费效果
前端页面修改，略

ware服务的WareInfoController
``` java
@RequestMapping("/fare/{addrId}")  
public R getFare(@PathVariable("addrId") Long addrId) {  
    BigDecimal fare =  wareInfoService.getFare(addrId);  
    return R.ok().setData(fare);  
}
```
ware服务中新建
``` java
@FeignClient("gulimall-member")  
public interface MemberFeignService {  
    @RequestMapping("member/memberreceiveaddress/info/{id}")  
    R info(@PathVariable("id") Long id);  
    }
```
将order服务中的MemberAddressVo复制到ware服务中
ware服务中的WareInfoServiceImpl
``` java
@Autowired  
private MemberFeignService memberFeignService;

@Override  
public BigDecimal getFare(Long addrId) {  
    R info = memberFeignService.info(addrId);  
    MemberAddressVo data = info.getData("memberReceiveAddress", new TypeReference<MemberAddressVo>() {  
    });  
    if (data != null) {  
        String phone = data.getPhone();  
        //取电话号的最后两位作为邮费  
        String fare = phone.substring(phone.length() - 2, phone.length());  
        return new BigDecimal(fare);  
    }  
    return null;  
}
```

#### 订单确认页细节显示
``` java
@Data  
public class FareVo {  
    private MemberAddressVo address;  
    private BigDecimal fare;  
}
```
ware服务的`WareInfoServiceImpl`
``` java
@Override  
public FareVo getFare(Long addrId) {  
    FareVo fareVo = new FareVo();  
    R info = memberFeignService.info(addrId);  
    if (info.getCode() == 0) {  
        MemberAddressVo address = info.getData("memberReceiveAddress", new TypeReference<MemberAddressVo>() {  
        });  
        fareVo.setAddress(address);  
        String phone = address.getPhone();  
        //取电话号的最后两位作为邮费  
        String fare = phone.substring(phone.length() - 2, phone.length());  
        fareVo.setFare(new BigDecimal(fare));  
    }  
    return fareVo;  
}
```
ware服务的WareInfoController
``` java
@RequestMapping("/fare/{addrId}")  
public R getFare(@PathVariable("addrId") Long addrId) {  
    /*BigDecimal fare =  wareInfoService.getFare(addrId);  
    return R.ok().setData(fare);*/  
    FareVo fare = wareInfoService.getFare(addrId);  
    return R.ok().setData(fare);  
}
```

前端页面，略

#### 接口幂等性讨论
一、什么是幂等性
**接口幂等性就是用户对于同一操作发起的一次请求或者多次请求的结果是一致的**，不会因为多次点击而产生了副作用:比如说支付场景，用户购买了商品支付扣款成功，但是返回结果的时候网络异常，此时钱已经扣了，用户再次点击按钮，此时会进行第二次扣款，返回结果成功，用户查询余额返发现多扣钱了，流水记录也变成了两条。..,这就没有保证接口的幂等性。

二、哪些情况需要防止
用户多次点击按钮
用户页面回退再次提交
微服务互相调用，由于网络问题，导致请求失败。feign 触发重试机制其他业务情况

三、什么情况下需要幂等
以 SQL 为例，有些操作是天然幂等的。
SELECT* FROM table WHERid=?，无论执行多少次都不会改变状态，是天然的幂等.
UPDATE tab1SET col1=1 WHERE cl2=2,无论执行成功多少次状态都是一致的,也是幂等操作。
delete from user where userid=1，多次操作，结果一样，具备幂等性insert into user(userid,name) values(1,a) 如 userid 为唯一主键，即重复操作上面的业务，只会插入一条用户数据，具备幂等性。
UPDATE tab1SET col1=col1+1 WHERE col2=2，每次执行的结果都会发生变化，不是幂等的。insert into user(userid,name) values(1,a) 如 userid 不是主键，可以重复，那上面业务多次操作，数据都会新增多条，不具备幂等性。

四、幂等解决方案
* token 机制
	1. 服务端提供了发送 token 的接口。我们在分析业务的时候，哪些业务是存在幂等问题的,就必须在执行业务前，先去获取 token，服务器会把 token 保存到 redis 中。
	2. 然后调用业务接口请求时，把 token 携带过去，一般放在请求头部。
	3. 服务器判断 token 是否存在 redis 中，存在表示第一次请求，然后删除 token,继续执行业暑。
	4. 如果判断 token 不存在 redis 中，就表示是重复操作，直接返回重复标记给 cient，这样就保证了业务代码，不被重复执行。
	危险性:
	1. 先删除 token 还是后删除 token;
		先删除可能导致，业务确实没有执行，重试还带上之前 token，由于防重设计导致请求还是不能执行。
		后删除可能导致，业务处理成功，但是服务闪断，出现超时，没有删除 token，别人继续重试，导致业务被执行两遍
		我们最好设计为先删除 token，如果业务调用失败，就重新获取 token 再次请求。
	2. Token 获取、比较和删除必须是原子性
		redis.getltoken) 、token.equals、redis.deltoken)如果这两个操作不是原子，可能导致，高并发下，都 get 到同样的数据，判断都成功，继续业务并发执行(2) 可以在 redis 使用 lua 脚本完成这个操作
		`if redis.call('get', KEYS(1]) == ARGVI1] then return redis.call('del', KEYS[1]) else return 0 end`
* 各种锁机制
	1. 悲观锁
		select * from xxxx where id = 1 for update;
		悲观锁使用时一般伴随事务一起使用，数据锁定时间可能会很长，需要根据实际情况选用。另外要注意的是，id 字段一定是主键或者唯一索引，不然可能造成锁表的结果，处理起来会非常麻烦。
	1. 乐观锁
		这种方法适合在更新的场景中，
		update t goods set count = count -1 , version = version + 1 where good id=2 and version = 1根据 version 版本，也就是在操作库存前先获取当前商品的 version 版本号，然后操作的时候带上此 version 号。我们梳理下，我们第一次操作库存时，得到 version 为 1，调用库存服务version 变成了 2: 但返回给订单服务出现了问题，订单服务又一次发起调用库存服务，当订单服务传如的 version 还是 1，再执行上面的 sl语句时，就不会执行:因为 version 已经变为2了，where 条件就不成立。这样就保证了不管调用几次，只会真正的处理一次。乐观锁主要使用于处理读多写少的问题
* 业务层分布式锁
	如果多个机器可能在同一时同时处理相同的数据,比如多台机器定时任务都拿到了相同数据处理，我们就可以加分布式锁，锁定此数据，处理完成后释放锁。获取到锁的必须先判断这个数据是否被处理过。
* 各种唯一约束
	1. 数据库唯一约束
		插入数据，应该按照唯一索引进行插入，比如订单号,相同的订单就不可能有两条记录插入。我们在数据库层面防止重复。
		这个机制是利用了数据库的主键唯一约束的特性，解决了在 insert 场景时幂等问题。但主键的要求不是自增的主键，这样就需要业务生成全局唯一的主键。如果是分库分表场景下，路由规则要保证相同请求下，落地在同一个数据库和同一表中，要不然数据库主键约束就不起效果了，因为是不同的数据库和表主键不相关。
	2. redis set 防重
		很多数据需要处理，只能被处理一次，比如我们可以计算数据的 MD5 将其放入 redis 的 set每次处理数据，先看这个 MD5 是否已经存在，存在就不处理。
	3. 防重表
		使用订单号 orderNo 做为去重表的唯一索引，把唯一索引插入去重表，再进行业务操作，且他们在同一个事务中。这个保证了重复请求时，因为去重表有唯一约束，导致请求失败，避免了幂等问题。这里要注意的是，去重表和业务表应该在同一库中，这样就保证了在同一事务，即使业务操作失败了，也会把去重表的数据回滚。这个很好的保证了数据一致性。
		之前说的 redis 防重也算
	4. 全局请求唯一id
		调用接口时，生成一个唯一id，redis 将数据保存到集合中(去重)，存在即处理过。可以使用 nginx 设置每一个请求的唯一 id:proxy set header X-Request-ld Srequest id;

#### 订单确认页完成
![](/GuliMall/订单确认页流程.png)

order服务新建OrderConstant
``` java
public class OrderConstant {  
    public static final String USER_ORDER_TOKEN_PREFIX = "order:token";  
}
```
order服务的OrderServiceImpl
``` java
@Autowired  
private StringRedisTemplate redisTemplate;

@Override  
public OrderConfirmVo confirmOrder() throws ExecutionException, InterruptedException {  
    OrderConfirmVo confirmVo = new OrderConfirmVo();  
    MemberResponseVo memberResponseVo = LoginInterceptor.loginUser.get();  
    System.out.println("主线程..." + Thread.currentThread().getId());  
  
    //1. 远程查出所有收货地址  
    /*List<MemberAddressVo> addressByUserId = memberFeignService.getAddressByUserId(memberResponseVo.getId());  
    confirmVo.setMemberAddressVos(addressByUserId);*/    //2. 远程查出所有选中购物项  
    /*List<OrderItemVo> items = cartFeignService.getCurrentUserCartItems();  
    confirmVo.setItems(items);*/  
    // 获取主线程的请求头  
    RequestAttributes requestAttributes = RequestContextHolder.getRequestAttributes();  
    //1. 查出所有收货地址  
    CompletableFuture<Void> addressFuture = CompletableFuture.runAsync(() -> {  
        System.out.println("member线程..." + Thread.currentThread().getId());  
        // 异步调用请求头共享：每一个线程都共享之前的请求头  
        RequestContextHolder.setRequestAttributes(requestAttributes);  
        List<MemberAddressVo> addressByUserId = memberFeignService.getAddressByUserId(memberResponseVo.getId());  
        confirmVo.setMemberAddressVos(addressByUserId);  
    }, executor);  
  
  
    CompletableFuture<Void> itemAndStockFuture = CompletableFuture.supplyAsync(() -> {  
        System.out.println("member线程..." + Thread.currentThread().getId());  
        RequestContextHolder.setRequestAttributes(requestAttributes);   // 异步调用请求头共享  
        //2. 查出所有选中购物项  
        List<OrderItemVo> items = cartFeignService.getCurrentUserCartItems();  
        confirmVo.setItems(items);  
        return items;  
    }, executor).thenAcceptAsync((items) -> {  
        //4. 库存  
        List<Long> skuIds = items.stream().map(OrderItemVo::getSkuId).collect(Collectors.toList());  
        R hasStocks = wareFeignService.getSkuHasStocks(skuIds);  
        /*TypeReference<List<SkuStockVo>> typeReference = new TypeReference<List<SkuStockVo>>() {};  
        List<SkuStockVo> data = hasStocks.getData(typeReference);        if (data != null) {            Map<Long, Boolean> hasStockMap = data.stream().collect(Collectors.toMap(SkuStockVo::getSkuId, SkuStockVo::getHasStock));            confirmVo.setStocks(hasStockMap);        }*/        TypeReference<List<SkuHasStockVo>> typeReference = new TypeReference<List<SkuHasStockVo>>() {};  
        List<SkuHasStockVo> data = hasStocks.getData(typeReference);  
        Map<Long, Boolean>hasStockMap = data.stream()  
                .collect(Collectors.toMap(t -> t.getSkuId(), t -> t.getHasStock()));  
  
        confirmVo.setStocks(hasStockMap);  
    }, executor);  
  
    //3. 查询用户积分  
    confirmVo.setIntegration(memberResponseVo.getIntegration());  
  
    //5. 总价自动计算  
    //6. 防重令牌  
    String token = UUID.randomUUID().toString().replace("-", "");  
    redisTemplate.opsForValue().set(OrderConstant.USER_ORDER_TOKEN_PREFIX + memberResponseVo.getId(), token, 30, TimeUnit.MINUTES);  
    confirmVo.setOrderToken(token);  
  
    CompletableFuture.allOf(itemAndStockFuture, addressFuture).get();  
  
    return confirmVo;  
}
```

前端页面修改，略

order服务新建OrderSubmitVo
``` java
/**  
 * 封装订单提交的数据  
 */
@Data  
public class OrderSubmitVo {  
  
    /** 收获地址的id **/  
    private Long addrId;  
  
    /** 支付方式 **/  
    private Integer payType;  
    //无需提交要购买的商品，去购物车再获取一遍  
    //优惠、发票  
  
    /** 防重令牌 **/  
    private String orderToken;  
  
    /** 应付价格 **/  
    private BigDecimal payPrice;  
  
    /** 订单备注 **/  
    private String remarks;  
  
    //用户相关的信息，直接去session中取出即可  
}
```
order服务的OrderWebController
``` java
/**  
 * 下单功能  
 * 下单，去创建订单，验令牌，锁库存...  
 * 下单成功来到支付选择页  
 * 下单失败回到订单确认页重新确定订单信息  
 * @param submitVo  
 * @param model  
 * @param attributes  
 * @return  
 */  
@RequestMapping("/submitOrder")  
public String submitOrder(OrderSubmitVo submitVo, Model model, RedirectAttributes attributes) {  
    System.out.println("订单提交的数据 ==> " + submitVo);  
    return null;
}
```

#### 原子验令牌 & 构造订单数据 & 构造订单项数据 & 订单验价 & 保存订单数据 & 锁定库存 & 提交订单的问题
order服务新建SubmitOrderResponseVo
``` java
@Data  
public class SubmitOrderResponseVo {  
  
    private OrderEntity order;  
  
    /** 错误状态码 **/  
    private Integer code;  
}
```
order服务的OrderWebController
``` java
/**  
 * 下单功能  
 * 下单，去创建订单，验令牌，锁库存...  
 * 下单成功来到支付选择页  
 * 下单失败回到订单确认页重新确定订单信息  
 * @param submitVo  
 * @param model  
 * @param attributes  
 * @return  
 */  
@RequestMapping("/submitOrder")  
public String submitOrder(OrderSubmitVo submitVo, Model model, RedirectAttributes attributes) {  
    /*System.out.println("订单提交的数据 ==> " + submitVo);    return null;*/  
    try{  
        SubmitOrderResponseVo responseVo=orderService.submitOrder(submitVo);  
        Integer code = responseVo.getCode();  
        if (code==0){  
            model.addAttribute("order", responseVo.getOrder());  
            return "pay";  
        }else {  
            String msg = "下单失败;";  
            switch (code) {  
                case 1:  
                    msg += "防重令牌校验失败";  
                    break;                
                case 2:  
                    msg += "商品价格发生变化";  
                    break;            }  
            attributes.addFlashAttribute("msg", msg);  
            return "redirect:http://order.gulimall.com/toTrade";  
        }  
    }catch (Exception e){  
        if (e instanceof NoStockException){  
            String msg = "下单失败，商品无库存";  
            attributes.addFlashAttribute("msg", msg);  
        }  
        return "redirect:http://order.gulimall.com/toTrade";  
    }  
}
```
order服务的OrderServiceImpl
``` java
@Autowired  
private WareFeignService wareFeignService;
@Autowired  
private ProductFeignService productFeignService;
@Autowired  
private OrderItemService orderItemService;

@Transactional  
@Override    
public SubmitOrderResponseVo submitOrder(OrderSubmitVo submitVo) {  
	SubmitOrderResponseVo responseVo = new SubmitOrderResponseVo();  
	responseVo.setCode(0);  
	//1. 验证防重令牌【令牌的对比和删除必须保证原子性】  
	//  0令牌失败  1删除成功  
	MemberResponseVo memberResponseVo = LoginInterceptor.loginUser.get();  
	String script= "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";  
	Long execute = redisTemplate.execute(new DefaultRedisScript<>(script,Long.class), Arrays.asList(OrderConstant.USER_ORDER_TOKEN_PREFIX + memberResponseVo.getId()), submitVo.getOrderToken());  
	if (execute == 0L) {  
		//1.1 防重令牌验证失败  
		responseVo.setCode(1);  
		return responseVo;  
	}else {  
		//2. 创建订单、订单项  
		OrderCreateTo order = createOrderTo(memberResponseVo,submitVo);  

		//3. 验价  
		BigDecimal payAmount = order.getOrder().getPayAmount();  
		BigDecimal payPrice = submitVo.getPayPrice();  
		if (Math.abs(payAmount.subtract(payPrice).doubleValue()) < 0.01) {  
			//4. 保存订单  
			saveOrder(order);  
			//5. 锁定库存, 只要有异常就回滚订单数据  
			List<OrderItemVo> orderItemVos = order.getOrderItems().stream().map((item) -> {  
				OrderItemVo orderItemVo = new OrderItemVo();  
				orderItemVo.setSkuId(item.getSkuId());  
				orderItemVo.setCount(item.getSkuQuantity());  
				return orderItemVo;  
			}).collect(Collectors.toList());  
			WareSkuLockVo lockVo = new WareSkuLockVo();  
			lockVo.setOrderSn(order.getOrder().getOrderSn());  
			lockVo.setLocks(orderItemVos);  
			R r = wareFeignService.orderLockStock(lockVo);  
			//5.1 锁定库存成功  
			if (r.getCode()==0){  
//                    int i = 10 / 0;  
				responseVo.setOrder(order.getOrder());  
				responseVo.setCode(0);  

				//发送消息到订单延迟队列，判断过期订单  
//                    rabbitTemplate.convertAndSend("order-event-exchange","order.create.order",order.getOrder());  

				//清除购物车记录  
				BoundHashOperations<String, Object, Object> ops = redisTemplate.boundHashOps(CartConstant.CART_PREFIX + memberResponseVo.getId());  
				for (OrderItemEntity orderItem : order.getOrderItems()) {  
					ops.delete(orderItem.getSkuId().toString());  
				}  
				return responseVo;  
			}else {  
				//5.1 锁定库存失败  
				String msg = (String) r.get("msg");  
				throw new NoStockException(msg);  
			}  

		}else {  
			//验价失败  
			responseVo.setCode(2);  
			return responseVo;  
		}  
	}  
}  

private OrderCreateTo createOrderTo(MemberResponseVo memberResponseVo, OrderSubmitVo submitVo) {  
	//用IdWorker生成订单号  
	String orderSn = IdWorker.getTimeId();  
	//构建订单  
	OrderEntity entity = buildOrder(memberResponseVo, submitVo,orderSn);  
	//构建订单项  
	List<OrderItemEntity> orderItemEntities = buildOrderItems(orderSn);  
	//计算价格  
	compute(entity, orderItemEntities);  
	OrderCreateTo createTo = new OrderCreateTo();  
	createTo.setOrder(entity);  
	createTo.setOrderItems(orderItemEntities);  
	return createTo;  
}  

/**  
 * 构建订单  
 * @param memberResponseVo  
 * @param submitVo  
 * @param orderSn  
 * @return  
 */  
private OrderEntity buildOrder(MemberResponseVo memberResponseVo, OrderSubmitVo submitVo, String orderSn) {  

	OrderEntity orderEntity =new OrderEntity();  

	orderEntity.setOrderSn(orderSn);  

	//2) 设置用户信息  
	orderEntity.setMemberId(memberResponseVo.getId());  
	orderEntity.setMemberUsername(memberResponseVo.getUsername());  

	//3) 获取邮费和收件人信息并设置  
	R r = wareFeignService.getFare(submitVo.getAddrId());  
	FareVo fareVo = r.getData(FareVo.class);  
	BigDecimal fare = fareVo.getFare();  
	orderEntity.setFreightAmount(fare);  
	MemberAddressVo address = fareVo.getAddress();  
	orderEntity.setReceiverName(address.getName());  
	orderEntity.setReceiverPhone(address.getPhone());  
	orderEntity.setReceiverPostCode(address.getPostCode());  
	orderEntity.setReceiverProvince(address.getProvince());  
	orderEntity.setReceiverCity(address.getCity());  
	orderEntity.setReceiverRegion(address.getRegion());  
	orderEntity.setReceiverDetailAddress(address.getDetailAddress());  

	//4) 设置订单相关的状态信息  
	orderEntity.setStatus(OrderStatusEnum.CREATE_NEW.getCode());  
	orderEntity.setConfirmStatus(0);  
	orderEntity.setAutoConfirmDay(7);  

	return orderEntity;  
}  

/**  
 * 构建所有订单项数据  
 * @param orderSn  
 * @return  
 */  
private List<OrderItemEntity> buildOrderItems(String orderSn) {  
	// 最后确定每个购物项的价格  
	List<OrderItemVo> checkedItems = cartFeignService.getCurrentUserCartItems();  
	List<OrderItemEntity> orderItemEntities = checkedItems.stream().map((item) -> {  
		OrderItemEntity orderItemEntity = buildOrderItem(item);  
		//1) 设置订单号  
		orderItemEntity.setOrderSn(orderSn);  
		return orderItemEntity;  
	}).collect(Collectors.toList());  
	return orderItemEntities;  
}  

/**  
 * 构建某一个订单项  
 * @param item  
 * @return  
 */  
private OrderItemEntity buildOrderItem(OrderItemVo item) {  
	OrderItemEntity orderItemEntity = new OrderItemEntity();  
	Long skuId = item.getSkuId();  
	//2) 设置sku相关属性  
	orderItemEntity.setSkuId(skuId);  
	orderItemEntity.setSkuName(item.getTitle());  
	orderItemEntity.setSkuAttrsVals(StringUtils.collectionToDelimitedString(item.getSkuAttrValues(), ";"));  
	orderItemEntity.setSkuPic(item.getImage());  
	orderItemEntity.setSkuPrice(item.getPrice());  
	orderItemEntity.setSkuQuantity(item.getCount());  
	//3) 通过skuId查询spu相关属性并设置  
	R r = productFeignService.getSpuBySkuId(skuId);  
	if (r.getCode() == 0) {  
		SpuInfoTo spuInfo = r.getData(new TypeReference<SpuInfoTo>() {  
		});  
		orderItemEntity.setSpuId(spuInfo.getId());  
		orderItemEntity.setSpuName(spuInfo.getSpuName());  
		orderItemEntity.setSpuBrand(spuInfo.getBrandName());  
		orderItemEntity.setCategoryId(spuInfo.getCatalogId());  
	}  
	//4) 商品的优惠信息(不做)  

	//5) 商品的积分成长，为价格x数量  
	orderItemEntity.setGiftGrowth(item.getPrice().multiply(new BigDecimal(item.getCount())).intValue());  
	orderItemEntity.setGiftIntegration(item.getPrice().multiply(new BigDecimal(item.getCount())).intValue());  

	//6) 订单项订单价格信息  
	orderItemEntity.setPromotionAmount(BigDecimal.ZERO);  
	orderItemEntity.setCouponAmount(BigDecimal.ZERO);  
	orderItemEntity.setIntegrationAmount(BigDecimal.ZERO);  

	//7) 实际价格  
	BigDecimal origin = orderItemEntity.getSkuPrice().multiply(new BigDecimal(orderItemEntity.getSkuQuantity()));  
	BigDecimal realPrice = origin.subtract(orderItemEntity.getPromotionAmount())  
			.subtract(orderItemEntity.getCouponAmount())  
			.subtract(orderItemEntity.getIntegrationAmount());  
	orderItemEntity.setRealAmount(realPrice);  

	return orderItemEntity;  
}  

private void compute(OrderEntity entity, List<OrderItemEntity> orderItemEntities) {  
	//总价  
	BigDecimal total = BigDecimal.ZERO;  
	//优惠价格  
	BigDecimal promotion=new BigDecimal("0.0");  
	BigDecimal integration=new BigDecimal("0.0");  
	BigDecimal coupon=new BigDecimal("0.0");  
	//积分  
	Integer integrationTotal = 0;  
	Integer growthTotal = 0;  

	for (OrderItemEntity orderItemEntity : orderItemEntities) {  
		total=total.add(orderItemEntity.getRealAmount());  
		promotion=promotion.add(orderItemEntity.getPromotionAmount());  
		integration=integration.add(orderItemEntity.getIntegrationAmount());  
		coupon=coupon.add(orderItemEntity.getCouponAmount());  
		integrationTotal += orderItemEntity.getGiftIntegration();  
		growthTotal += orderItemEntity.getGiftGrowth();  
	}  

	entity.setTotalAmount(total);  
	entity.setPromotionAmount(promotion);  
	entity.setIntegrationAmount(integration);  
	entity.setCouponAmount(coupon);  
	entity.setIntegration(integrationTotal);  
	entity.setGrowth(growthTotal);  

	//付款价格=商品价格+运费  
	entity.setPayAmount(entity.getFreightAmount().add(total));  

	//设置删除状态(0-未删除，1-已删除)  
	entity.setDeleteStatus(0);  
}  

/**  
 * 保存订单数据  
 * @param orderCreateTo  
 */  
private void saveOrder(OrderCreateTo orderCreateTo) {  
	try {  
		OrderEntity order = orderCreateTo.getOrder();  
		order.setCreateTime(new Date());  
		order.setModifyTime(new Date());  
		this.save(order);  
		orderItemService.saveBatch(orderCreateTo.getOrderItems());  
	} catch (Exception e) {  
		e.printStackTrace();  
	}  
}
```
order服务新建OrderCreateTo
``` java
@Data  
public class OrderCreateTo {  
    private OrderEntity order;  
  
    private List<OrderItemEntity> orderItems;  
  
    /** 订单计算的应付价格 **/  
    private BigDecimal payPrice;  
  
    /** 运费 **/  
    private BigDecimal fare;  
}
```
order服务新建OrderStatusEnum
``` java
public enum OrderStatusEnum {  
  
    CREATE_NEW(0,"待付款"),  
    PAYED(1,"已付款"),  
    SENDED(2,"已发货"),  
    RECIEVED(3,"已完成"),  
    CANCLED(4,"已取消"),  
    SERVICING(5,"售后中"),  
    SERVICED(6,"售后完成");  
  
  
    private String msg;  
    private Integer code;  
  
    public String getMsg() {  
        return msg;  
    }  
  
    public Integer getCode() {  
        return code;  
    }  
  
    OrderStatusEnum(Integer code, String msg){  
        this.msg = msg;  
        this.code = code;  
    }  
}
```
order服务的WareFeignService
``` java
@RequestMapping("/ware/wareinfo/fare/{addrId}")  
R getFare(@PathVariable("addrId") Long addrId);
```
从ware服务拷贝FareVo到order服务中

product服务的SpuInfoController
``` java
@RequestMapping("/skuId/{skuId}")  
public R getSpuBySkuId(@PathVariable("skuId") Long skuId) {  
    SpuInfoEntity spuInfoEntity = spuInfoService.getSpuBySkuId(skuId);  
    return R.ok().setData(spuInfoEntity);  
}
```
product服务的SpuInfoServiceImpl
``` java
@Override  
public SpuInfoEntity getSpuBySkuId(Long skuId) {  
    SkuInfoEntity skuInfoEntity = skuInfoService.getById(skuId);  
    SpuInfoEntity spu = this.getById(skuInfoEntity.getSpuId());  
    BrandEntity brandEntity = brandService.getById(spu.getBrandId());  
    spu.setBrandName(brandEntity.getName());  
    return spu;  
}
```
product服务的SpuInfoController
``` java
@RequestMapping("/skuId/{skuId}")  
public R getSpuBySkuId(@PathVariable("skuId") Long skuId) {  
    SpuInfoEntity spuInfoEntity = spuInfoService.getSpuBySkuId(skuId);  
    return R.ok().setData(spuInfoEntity);  
}
```
product服务的SpuInfoEntity新增属性
``` java
@TableField(exist = false)  
private String brandName;
```

order服务的ProductFeignService
``` java
@FeignClient("gulimall-product")  
public interface ProductFeignService {  
    @RequestMapping("product/spuinfo/skuId/{skuId}")  
    R getSpuBySkuId(@PathVariable("skuId") Long skuId);  
  
    /*@RequestMapping("product/skuinfo/info/{skuId}")  
	R info(@PathVariable("skuId") Long skuId);*/
}
```
order服务中新建SpuInfoTo
``` java
@Data  
public class SpuInfoTo {  
    private Long id;  
    /**  
     * 商品名称  
     */  
    private String spuName;  
    /**  
     * 商品描述  
     */  
    private String spuDescription;  
    /**  
     * 所属分类id  
     */    private Long catalogId;  
    /**  
     * 品牌id  
     */    private Long brandId;  
  
    private String brandName;  
    /**  
     *     */    private BigDecimal weight;  
    /**  
     * 上架状态[0 - 下架，1 - 上架]  
     */    private Integer publishStatus;  
    /**  
     *     */    private Date createTime;  
    /**  
     *     */    private Date updateTime;  
}
```
order服务中新建
``` java
@Data  
public class WareSkuLockVo {  
    private String OrderSn;  //订单号
  
    private List<OrderItemVo> locks;  //需要所住的所有信息
}
```

将order服务中的OrderItemVo和WareSkuLockVo复制到ware服务中
ware服务的WareSkuController
``` java
/**  
 * 下订单时锁库存  
 * @param lockVo  
 * @return  
 */  
@RequestMapping("/lock/order")  
public R orderLockStock(@RequestBody WareSkuLockVo lockVo) {  
    /*List<LockStockResult> stockResults = wareSkuService.orderLockStock(lockVo);  
    return R.ok().setData(stockResults);*/  
    
    try {  
        Boolean lock = wareSkuService.orderLockStock(lockVo);  
        return R.ok();  
    } catch (NoStockException e) {  
        return R.error(BizCodeEnume.NO_STOCK_EXCEPTION.getCode(), BizCodeEnume.NO_STOCK_EXCEPTION.getMsg());  
    }  
}
```
order服务的WareFeignService
``` java
@RequestMapping("/ware/waresku/lock/order")  
R orderLockStock(@RequestBody WareSkuLockVo itemVos);
```

ware服务的WareSkuServiceImpl
``` java
/**  
 * 为某个订单锁定库存  
 * 默认只要是运行时异常都会回滚  
 *  
 * @param vo  
 * @return  
 */  
@Transactional(rollbackFor = NoStockException.class)  
@Override  
public Boolean orderLockStock(WareSkuLockVo vo) {  
    // 1.找到每个商品在哪个仓库都用库存  
    List<OrderItemVo> locks = vo.getLocks();  
    List<SkuWareHasStock> collect = locks.stream().map((item) -> {  
        SkuWareHasStock stock = new SkuWareHasStock();  
        Long skuId = item.getSkuId();  
        stock.setSkuId(skuId);  
        stock.setNum(item.getCount());  
        //查询这个商品在哪个仓库都用库存  
        List<Long> wareIds = baseMapper.listWareIdsHasStock(item.getSkuId(), item.getCount());  
		stock.setWareId(wareIds);
        return stock;  
    }).collect(Collectors.toList());  
  
    Boolean allLock = false;  
    // 2.锁定库存  
    for (SkuWareHasStock hasStock : collect) {  
        Long skuId = hasStock.getSkuId();  
        List<Long> wareIds = hasStock.getWareId();  
        if (wareIds == null || wareIds.size() == 0) {  
            throw new NoStockException(skuId);  
        }  
        for (Long wareId : wareIds) {  
            // 锁定成功就返回1，否则就是0  
            Long count = baseMapper.lockSkuStock(skuId, wareId, hasStock.getNum());  
            if (count == 0) {  
                allLock = false;  
                break;            } else {  
                //锁定成功，保存工作单详情  
                /*WareOrderTaskDetailEntity detailEntity = WareOrderTaskDetailEntity.builder()  
                        .skuId(skuId)                        .skuName("")                        .skuNum(lockVo.getNum())                        .taskId(taskEntity.getId())                        .wareId(wareId)                        .lockStatus(1).build();                wareOrderTaskDetailService.save(detailEntity);                //发送库存锁定消息至延迟队列  
                StockLockedTo lockedTo = new StockLockedTo();                lockedTo.setId(taskEntity.getId());                StockDetailTo detailTo = new StockDetailTo();                BeanUtils.copyProperties(detailEntity, detailTo);                lockedTo.setDetailTo(detailTo);                rabbitTemplate.convertAndSend("stock-event-exchange", "stock.locked", lockedTo);*/  
                allLock = true;  
  
            }  
        }  
        if (allLock == false) {  
            //当前商品锁定失败，前面锁定成功的要解锁  
            throw new NoStockException(skuId);  
        }  
  
    }  
    //  3.全部都是锁定成功的  
    return true;  
}  
  
@Data  
class SkuWareHasStock {  
    private Long skuId;  
    private Integer num;  
    private List<Long> wareId;  
}
```
ware服务的WareSkuDao
``` java
List<Long> listWareIdsHasStock(@Param("skuId") Long skuId, @Param("count") Integer count);
```
ware服务的WareSkuDao.xml
``` xml
<select id="listWareIdsHasStock" resultType="java.lang.Long">  
    SELECT ware_id FROM wms_ware_sku  
    WHERE sku_id=#{skuId} AND stock-stock_locked>=#{count}
</select>
```
ware服务新建NoStockException
``` java
public class NoStockException extends RuntimeException{  
  
    @Setter  
    @Getter    
    private Long skuId;  
  
    public NoStockException(Long skuId) {  
        super("商品id:"+skuId+";库存不足");  
    }  
  
    public NoStockException(String message) {  
        super(message);  
    }  
}
```
ware服务的WareSkuDao.xml
``` xml
<update id="lockSkuStock">  
    UPDATE wms_ware_sku  
    SET stock_locked=stock_locked+#{num}    WHERE sku_id=#{skuId}      AND ware_id=#{wareId}      AND stock-stock_locked>#{num}</update>
```
common服务的BizCodeEnume
``` java
NO_STOCK_EXCEPTION(21000, "商品库存不足");
```

将`oms_order`表和`oms_order_item`表中的`order_sn`字段长度修改为64位


### 分布式事务
#### 本地事务在分布式下的问题
![](/GuliMall/Pasted_image_20230316235808.png)

#### 本地事务隔离级别&传播行为等复习
1. 事务的基本性质
	数据库事务的几个特性: 原子性(Atomicity)、一致性( Consistency )、隔离性或独立性(lsolation)和持久性(Durabilily)，简称就是 ACID:
	* 原子性: 一系列的操作整体不可拆分，要么同时成功，要么同时失败
	* 一致性: 数据在事务的前后，业务整体一致。
		转账。A:1000: B:1000:转 200事务成功: A: 800B: 1200
	* 隔离性: 事务之间互相隔离。
	* 持久性: 一旦事务成功，数据一定会落盘在数据库。
	在以往的单体应用中，我们多个业务操作使用同一条连接操作不同的数据表，一旦有异常,我们可以很容易的整体回滚:
	
	Business: 我们具体的业务代码
	Storage: 库存业务代码: 扣库存
	Order: 订单业务代码:保存订单
	Account: 账号业务代码: 减账户余额比如买东西业务，扣库存，下订单，账户扣款，是一个整体:必须同时成功或者失败
2. 事务的隔离级别
	* READ UNCOMMITTED (读未提交)
		该隔离级别的事务会读到其它未提交事务的数据，此现象也称之为脏读。
	* READ COMMITTED (读提交)
		一个事务可以读取另一个已提交的事务，多次读取会造成不一样的结果，此现象称为不可重复读问题，Oracle 和 SQL Server 的默认隔离级别。
	* REPEATABLE READ (可重复读)
		该隔离级别是 MysQL 默认的隔离级别，在同一个事务里，select 的结果是事务开始时时间点的状态，因此，同样的 select 操作读到的结果会是一致的，但是，会有幻读现象。MySQl的 InnoDB 引擎可以通过 next-key locks 机制(参考下文"行锁的算法"节)来避免幻读。
	* SERIALIZABLE (序列化)
		在该隔离级别下事务都是串行顺序执行的，MysQL 数据库的 nnoDB 引警会给读操作隐式加一把读共享锁，从而避免了脏读、不可重读复读和幻读问题。
3. 事务的传播行为
	1. PROPAGATION REQUIRED: 如果当前没有事务，就创建一个新事务，如果当前存在事务,就加入该事务，该设置是最常用的设置。
	2. PROPAGATION SUPPORTS: 支持当前事务，如果当前存在事务，就加入该事务，如果当前不存在事务，就以非事务执行。
	3. PROPAGATION MANDATORY:支持当前事务，如果当前存在事务，就加入该事务，如果当前不存在事务，就抛出异常。
	4. PROPAGATION REQUIRES NEW: 创建新事务，无论当前存不存在事务，都创建新事务。
	5. PROPAGATION NOT SUPPORTED: 以非事务方式执行操作，如果当前存在事务，就把当前事务挂起。
	6. PROPAGATION NEVER: 以非事务方式执行，如果当前存在事务，则抛出异常。
	7. PROPAGATION NESTED: 如果当前存在事务，则在嵌套事务内执行。如果当前没有事务则执行与 PROPAGATION REQUIRED 类似的操作。
4. SpringBoot 事务关键点
	* 事务的自动配置
		TransactionAutoConfiguration
	* 事务的坑
		在同一个类里面，编写两个方法，内部调用的时候，会导致事务设置失效。原因是没有用到代理对象的缘故。
		解决:
		1. 导入 spring-boot-starter-aop
		2. @EnableTransactionManagement(proxyTargetClass = true)
		3. @EnableAspectJAutoProxy(exposeProxy=true)，开启AspectJ动态代理功能
		4. AopContext.currentProxy() 调用方法，使用AOP的上下文拿到当前的代理对象

#### 分布式CAP&Raft原理
为什么有分布式事务

分布式系统经常出现的异常
机器宕机、网络异常、消息丢失、消息乱序、数据错误、不可靠的 TCP、存储数据丢失...
![](/GuliMall/Pasted_image_20230321072735.png)
分布式事务是企业集成中的一个技术难点,也是每一个分布式系统架构中都会涉及到的一个东西，特别是在微服务架构中，几乎可以说是无法避免。

#### CAP 定理与 BASE 理论
1. CAP 定理
	CAP 原则又称 CAP 定理，指的是在一个分布式系统中
	* 一致性 (Consistency) : 在分布式系统中的所有数据备份，在同一时刻是否同样的值。(等同于所有节点访问同一份最新的数据副本)
	* 可用性 ( Availability): 在集群中一部分节点故障后，集群整体是否还能响应客户端的读写请求。(对数据更新具备高可用性)
	* 分区容错性 (Partition tolerance):大多数分布式系统都分布在多个子网络。每个子网络就叫做一个区 (partition)分区容错的意思是，区间通信可能失败。比如，一台服务器放在中国，另一台服务器放在美国，这就是两个区，它们之间可能无法通信。
	CAP 原则指的是，这三个要素最多只能同时实现两点，**不可能三者兼顾**。
	![](/GuliMall/Pasted_image_20230321073309.png)
	一般来说，分区容错无法避免，因此可以认为 CAP 的 P 总是成立。CAP 定理告诉我们剩下的 C 和 A 无法同时做到。
	
	分布式系统中实现一致性的 raft 算法、paxos
	http://thesecretlivesofdata.com/raft/
	https://raft.github.io/

2. 面临的问题
	对于多数大型互联网应用的场景，主机众多、部署分散，而且现在的集群规模越来越大，所以节点故障、网络故障是常态，而且要保证服务可用性达到 99.99999%(N 个 9)，即保证P和A，舍弃 C。

3. BASE 理论
	是对 CAP 理论的延伸，思想是即使无法做到强一致性(CAP 的一致性就是强一致性)，但可以采用适当的采取弱一致性，即**最终一致性**。
	
	BASE 是指
	* 基本可用 ( Basically Available)
		基本可用是指分布式系统在出现故障的时候,允许损失部分可用性(例如响应时间、功能上的可用性)，允许损失部分可用性。需要注意的是，基本可用绝不等价于系统不可用。
		* 响应时间上的损失: 正常情况下搜索引擎需要在 0.5 秒之内返回给用户相应的查询结果，但由于出现故障(比如系统部分机房发生断电或断网故障)，查询结果的响应时间增加到了 1~2 秒。
		* 功能上的损失: 购物网站在购物高峰(如双十一)时，为了保护系统的稳定性，部分消费者可能会被引导到一个降级页面。
	* 软状态 ( Soft state)
		软状态是指允许系统存在中间状态，而该中间状态不会影响系统整体可用性。分布式存储中一般一份数据会有多个副本，允许不同副本同步的延时就是软状态的体现。mysql replication 的异步复制也是一种体现。
	* 最终一致性 (Eventual Consistency)
		最终一致性是指系统中的所有数据副本经过一定时间后，最终能够达到一致的状态。弱一致性和强一致性相反，最终一致性是弱一致性的一种特殊情况。

4. 强一致性弱一致一性
	从客户端角度，多进程并发访问时，更新过的数据在不同进程如何获取的不同策略，决定了不同的一致性。对于关系型数据库，要求更新过的数据能被后续的访问都能看到，这是**强一致性**。如果能容忍后续的部分或者全部访问不到，则是**弱一致性**。如果经过一段时间后要求能访问到更新后的数据，则是**最终一致性**。

#### 分布式事务常见解决方案
分布式事务几种方案
1. 2PC模式
	数据库支持的 2PC[2 phase commit 二阶提交]，又叫做 XA Transactions。MysQL 从 5.5 版本开始支持，SQL Server 2005 开始支持，Oracle 7 开始支持。其中，XA 是一个两阶段提交协议，该协议分为以下两个阶段:
	
	第一阶段: 事务协调器要求每个涉及到事务的数据库预提交(precommit)此操作，并反映是否可以提交.
	第二阶段:事务协调器要求每个数据库提交数据。其中，如果有任何一个数据库否决此次提交，那么所有数据库都会被要求回滚它们在此事冬中的那部分信息。
    ![](/GuliMall/Pasted_image_20230322214613.png)
	* XA 协议比较简单，而且一旦商业数据库实现了 XA 协议，使用分布式事务的成本也比较低。
	* **XA 性能不理想**，特别是在交易下单链路，往往并发量很高，XA 无法满足高并发场景XA 目前在商业数据库支持的比较理想，**在 mysql 数据库中支持的不太理想**，mysql 的XA 实现，没有记录 prepare 阶段日志，主备切换回导致主库与备库数据不一致。
	* 许多 nosql 也没有支持 XA，这让 XA 的应用场景变得非常狭隘。
	* 也有 3PC，引入了超时机制(无论协调者还是参与者，在向对方发送请求后，若长时间未收到回应则做出相应处理)

2. 柔性事务 - TCC 事务补偿型方案
	刚性事务: 遵循 ACID 原则，强一致性。
	柔性事务: 遵循 BASE 理论，最终一致性；
	与刚性事务不同，柔性事务允许一定时间内，不同节点的数据不一致，但要求最终一致。
	![](/GuliMall/Pasted_image_20230322215711.png)
	一阶段 prepare 行为: 调用 自定义 的 prepare 逻辑。
	二阶段 commit 行为: 调用 自定义 的 commit 逻辑。
	三阶段 rollback 行为: 调用 自定义的 rollback 逻辑。
	所谓 TCC 模式，是指支持把 自定义 的分支事务纳入到全局事务的管理中。
	![](/GuliMall/Pasted_image_20230322215955.png)

3. 柔性事务 - 最大努力通知型方案
	按规律进行通知，**不保证数据一定能通知成功，但会提供可查询操作接口进行核对**。这种方案主要用在与第三方系统通讯时，比如: 调用微信或支付宝支付后的支付结果通知。这种方案也是结合 MQ 进行实现，例如: 通过 MQ 发送 http 请求，设置最大通知次数。达到通知次数后即不再通知。
	
	案例: 银行通知、商户通知等(各大交易业务平台间的商户通知:多次通知、查询校对、对账文件)，支付宝的支付成功异步回调

4. 柔性事务 - 可靠消息+最终一致性方案(异确保型)
	实现: 业务处理服务在业务事务提交之前，向实时消息服务请求发送消息，实时消息服务只记录消息数据，而不是真正的发送。业务处理服务在业务事务提交之后，向实时消息服务确认发送。只有在得到确认发送指令后，实时消息服务才会真正发送。


``` java
<dependency>  
    <groupId>com.alibaba.cloud</groupId>  
    <artifactId>spring-cloud-starter-alibaba-seata</artifactId>  
</dependency>
```
order服务中新建`MySeataConfig`
``` java
@Configuration  
public class MySeataConfig {  
    @Autowired  
    DataSourceProperties dataSourceProperties;  
  
  
    @Bean  
    public DataSource dataSource(DataSourceProperties dataSourceProperties) {  
  
        HikariDataSource dataSource = dataSourceProperties.initializeDataSourceBuilder().type(HikariDataSource.class).build();  
        if (StringUtils.hasText(dataSourceProperties.getName())) {  
            dataSource.setPoolName(dataSourceProperties.getName());  
        }  
  
        return new DataSourceProxy(dataSource);  
    }  
}
```
同样的在ware服务中的`MySeataConfig`也需要
``` java
@Autowired  
DataSourceProperties dataSourceProperties;  
  
@Bean  
public DataSource dataSource(DataSourceProperties dataSourceProperties) {  
  
    HikariDataSource dataSource = dataSourceProperties.initializeDataSourceBuilder().type(HikariDataSource.class).build();  
    if (StringUtils.hasText(dataSourceProperties.getName())) {  
        dataSource.setPoolName(dataSourceProperties.getName());  
    }  
  
    return new DataSourceProxy(dataSource);  
}
```

需要将register.conf和file.conf放到order服务和ware服务中

#### 最终一致性库存解锁逻辑
![](/GuliMall/消息队列流程.jpg)

### 订单服务
#### RabbitMQ延时队列
![](/GuliMall/Pasted_image_20230323224601.png)
常用解决方案：
spring 的 schedule 定时任务轮询数据库
缺点：消耗系统内存、增加了数据库的压力、存在较大的时间误差
解决：rabbitmg的消息TTL和死信Exchange结合

消息的TTL(Time To Live)
* 消息的TTL就是**消息的存活时间**
* RabbitMQ可以对**队列**和**消息**分别设置TTL。
	* 对队列设置就是队列没有消费者连着的保留时间，**也可以对每-一个单独的消息做单独的设置。超过了这个时间，我们认为这个消息就死了，称之为死信**。
	* 如果队列设置了，消息也设置了，那么会**取小的**。所以一个消息如果被路由到不同的列中，这个消息死亡的时间有可能不一样(不同的队列设置)。这里单讲单个消息的TTL，因为它才是实现延迟任务的关键。可以通过**设置消息的expiration字段或者x-message-ttl属性来设置时间**，两者是一样的效果。

死信 Dead Letter Exchanges (DLX)
* 一个消息在满足如下条件下，会进**死信路由**，记住这里是路由而不是队列个路由可以对应很多队列。(什么是死信)
	* 一个消息被Consumer拒收了，并且reject方法的参数里requeue是false。也就是说不会被再次放在队列里，被其他消费者使用。(basic.reject/ basic.nack) requeue=false上面的消息的TTL到了，消息过期了。
	* 队列的长度限制满了。排在前面的消息会被丢弃或者扔到死信路由上
* Dead Letter Exchange其实就是一种普通的exchange，和创建其他exchange没有两样。只是在某一个设置Dead Letter Exchange的队列中有消息过期了，会自动触发消息的转发，发送到Dead Letter Exchange中去。
* 我们既可以控制消息在一段时间后变成死信，又可以控制变成死信的消息被路由到某一个指定的交换机，结合二者，其实就可以实现一个延时队列
* 手动ack&异常消息统一放在一个队列处理建议的两种方式
	* catch异常后，手动发送到指定队列，然后使用channel给rabbitmq确认消息已消费
	* 给Queue绑定死信队列，使用nack (requque为false) 确认消息消费失败

延时队列实现1（给交换机设置过期时间。推荐）
![](/GuliMall/Pasted_image_20230323233555.png)
延时队列实现2（给消息设置过期时间。不推荐，因为MQ是惰性检查机制，不能及时失效，扫到了才会被失效）
![](/GuliMall/Pasted_image_20230323233632.png)

#### 延时队列定时关单模拟
![](/GuliMall/Pasted_image_20230324230149.png)
![](/GuliMall/Pasted_image_20230324231619.png)
在order服务中application.properties
``` yml
spring.rabbitmq.host=192.168.56.10  
spring.rabbitmq.virtual-host=/
```
在order服务中创建 MyRabbitmqConfig
``` java
/**  
 * 容器中的 Binding, Queue, Exchange 都会自动创建在 RabbitMQ 服务器上  
 */  
@Configuration  
public class MyRabbitmqConfig {  
  
    /**  
     * 延迟队列  
     * @return  
     */  
    @Bean  
    public Queue orderDelayQueue() {  
        /**  
         Queue(String name,  队列名字  
         boolean durable,  是否持久化  
         boolean exclusive,  是否排他  
         boolean autoDelete, 是否自动删除  
         Map<String, Object> arguments) 属性  
         */  
        HashMap<String, Object> arguments = new HashMap<>();  
        arguments.put("x-dead-letter-exchange", "order-event-exchange");    //死信交换机  
        arguments.put("x-dead-letter-routing-key", "order.release.order");  //死信路由键  
        arguments.put("x-message-ttl", 60000); // 消息过期时间 1分钟  
        return new Queue("order.delay.queue",true,false,false, arguments);  
    }  
  
    /**  
     * 普通队列  
     *  
     * @return  
     */  
    @Bean  
    public Queue orderReleaseOrderQueue() {  
        Queue queue = new Queue("order.release.order.queue", true, false, false);  
        return queue;  
    }  
  
    /**  
     * 交换机  
     * @return  
     */  
    @Bean  
    public Exchange orderEventExchange() {  
        /**  
         *   String name,         *   boolean durable,         *   boolean autoDelete,         *   Map<String, Object> arguments  
         */        return new TopicExchange("order-event-exchange", true, false);  
    }  
  
    /**  
     * 创建订单的binding  
     * @return  
     */  
    @Bean  
    public Binding orderCreateOrderBinding() {  
        /**  
         * String destination, 目的地（队列名或者交换机名字）  
         * DestinationType destinationType, 目的地类型（Queue、Exhcange）  
         * String exchange,  
         * String routingKey,         * Map<String, Object> arguments  
         * */        return new Binding("order.delay.queue", Binding.DestinationType.QUEUE, "order-event-exchange", "order.create.order", null);  
    }  
  
    @Bean  
    public Binding orderReleaseOrderBinding() {  
        return new Binding("order.release.order.queue",  
                Binding.DestinationType.QUEUE,  
                "order-event-exchange",  
                "order.release.order",  
                null);  
    }  
  
}
```
在order服务的MyRabbitmqConfig中添加一个监听
``` java
@RabbitListener(queues = "order.release.order.queue")  
public void listener(OrderEntity entity, Channel channel, Message message) throws IOException {  
    System.out.println("收到过期的订单信息，准备关闭订单" + entity.getOrderSn());  
    channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);  
}
```
在order服务的HelloController新增测试接口
``` java
@Autowired  
private RabbitTemplate rabbitTemplate;  
  
@ResponseBody  
@GetMapping("/testCreateOrderTest")  
public String createOrderTest() {  
    //订单下单成功  
    OrderEntity orderEntity = new OrderEntity();  
    orderEntity.setOrderSn(UUID.randomUUID().toString());  
    orderEntity.setModifyTime(new Date());  
  
    // 给MQ发送消息  
    rabbitTemplate.convertAndSend("order-event-exchange","order.create.order",orderEntity);  
    return "ok";  
}
```

#### 创建业务交换机&队列
ware服务的pom.xm中引入依赖
``` xml
<dependency>  
   <groupId>org.springframework.boot</groupId>  
   <artifactId>spring-boot-starter-amqp</artifactId>  
</dependency>
```
ware服务的application.properties
``` yml
spring.rabbitmq.host=192.168.56.10  
spring.rabbitmq.virtual-host=/
```
并且在启动类是加上@EnableRabbit
然后将ware服务的MyRabbitConfig设置和创建MQ
``` java
@Configuration  
public class MyRabbitConfig {  
  
    /**  
     * 使用JSON序列化机制，进行消息转换  
     */  
    @Bean  
    public MessageConverter messageConverter() {  
        return new Jackson2JsonMessageConverter();  
    }  

	@RabbitListener(queues = "stock.release.stock.queue")  
	public void handle(Message message) {  
	    System.out.println("收到过期的订单信息，准备解锁库存" + message.getBody());  
	}
  
    @Bean  
    public Exchange stockEventExchange() {  
        return new TopicExchange("stock-event-exchange", true, false);  
    }  
  
    /**  
     * 普通队列，用于解锁库存  
     * @return  
     */  
    @Bean  
    public Queue stockReleaseStockQueue() {  
        return new Queue("stock.release.stock.queue", true, false, false, null);  
    }  
  
    /**  
     * 延迟队列  
     * @return  
     */  
    @Bean  
    public Queue stockDelayQueue() {  
        HashMap<String, Object> arguments = new HashMap<>();  
        arguments.put("x-dead-letter-exchange", "stock-event-exchange");  
        arguments.put("x-dead-letter-routing-key", "stock.release");  
        arguments.put("x-message-ttl", 120000); // 消息过期时间 2分钟  
        return new Queue("stock.delay.queue", true, false, false, arguments);  
    }  
  
    /**  
     * 交换机和普通队列绑定  
     * @return  
     */  
    @Bean  
    public Binding stockReleaseBinding() {  
        return new Binding("stock.release.stock.queue",  
                Binding.DestinationType.QUEUE,  
                "stock-event-exchange",  
                "stock.release.#",  
                null);  
    }  
  
    /**  
     * 交换机和延迟队列绑定  
     * @return  
     */  
    @Bean  
    public Binding stockLockedBinding() {  
        return new Binding("stock.delay.queue",  
                Binding.DestinationType.QUEUE,  
                "stock-event-exchange",  
                "stock.locked",  
                null);  
    }  
  
}
```
在不需要seata的服务里排除掉，否则会导致报错
``` xml
<exclusion>  
    <groupId>com.alibaba.cloud</groupId>  
    <artifactId>spring-cloud-starter-alibaba-seata</artifactId>  
</exclusion>
```

#### 监听库存解锁  & 库存解锁逻辑
`wms_ware_order_task_detail`表新增`wareid`和`lockStatus`字段，对应的实体类和xml都要新增
为WareOrderTaskDetailEntity实体类添加`@NoArgsConstructor`、`@AllArgsConstructor`注解

在common服务中新建StockLockedTo
``` java
@Data  
public class StockLockedTo {  
    private Long id;    //库存工作单的id  
    private List<String> detailId;  //工作单详情
}
```

ware服务的WareSkuServiceImpl, 在类上使用`@RabbitListener(queues = "stock.release.stock.queue")`注解
``` java
/**  
 * 1.库存自动解锁  
 *  下单成功,库存锁定成功,接下来的业务调用失败,导致订单回滚,之前锁定的库存就要自动解锁  
 * 2.订单失败  
 *  库存锁定失败  
 * @param to  
 * @param message  
 */  
@RabbitHandler  
public void handleStockLockedRelease(StockLockedTo to, Message message) {  
    System.out.println("收到解锁库存的消息");  
    StockDetailTo detail = to.getDetailTo();  
    Long detailId = detail.getId();  
    //解锁  
    //1、查询数据库关于这个订单的锁定库存信息  
    //  有：证明库存锁定成功了  
    //   解锁：订单情况  
    //       1、没有这个订单，必须解锁库存  
    //       2、有这个订单，不一定解锁库存  
    //           订单状态：已取消：解锁库存  
    //                   没取消：不能解锁库存  
    //  没有：库存锁定失败了，库存回滚了，这种情况无需解锁  
    WareOrderTaskDetailEntity byId = wareOrderTaskDetailService.getById(detailId);  
    if (byId != null) {  
        //解锁  
        Long id = to.getId();  
        WareOrderTaskEntity taskEntity = wareOrderTaskService.getById(id);  
        String orderSn = taskEntity.getOrderSn();  
        //TODO 远程查询订单服务，查询订单状态  
        R r = orderFeignService.getOrderStatus(orderSn);  
        if (r.getCode() == 0) {  
            //订单数据返回成功  
            OrderVo data = r.getData(new TypeReference<OrderVo>() {  
            });  
            if (data == null || data.getStatus() == 4) {  
                //订单不存在或者订单已经取消了，才能解锁库存  
                if (byId.getLockStatus() == 1) {  
                    unLockStock(detail.getSkuId(), detail.getWareId(), detail.getSkuNum(), detailId);  
                }  
            }  
        } else {  
            //消息拒绝以后重新放到队列里面，让别人继续消费解锁  
            throw new RuntimeException("远程服务失败");  
        }  
    } else {  
        //无需解锁  
    }  
}  
  
private void unLockStock(Long skuId, Long wareId, Integer skuNum, Long detailId) {  
    //库存解锁  
    wareSkuDao.unLockStock(skuId, wareId, skuNum);  
    //更新库存工作单的状态  
    WareOrderTaskDetailEntity entity = new WareOrderTaskDetailEntity();  
    entity.setId(detailId);  
    entity.setLockStatus(2);  
    wareOrderTaskDetailService.updateById(entity);  
}
```
order服务的OrderController
``` java
@GetMapping("/status/{orderSn}")  
public R getOrderStatus(@PathVariable("orderSn") String orderSn){  
    OrderEntity orderEntity = orderService.getOrderByOrderSn(orderSn);  
    return R.ok().setData(orderEntity.getStatus());  
}
```
order服务的OrderServiceImpl
``` java
@Override  
public OrderEntity getOrderByOrderSn(String orderSn) {  
    return baseMapper.selectOne(new QueryWrapper<OrderEntity>().eq("order_sn", orderSn));  
}
```
ware服务中新建OrderFeignService
``` java
@FeignClient("gulimall-order")  
public interface OrderFeignService {  
    @RequestMapping("order/order/infoByOrderSn/{OrderSn}")  
    R infoByOrderSn(@PathVariable("OrderSn") String OrderSn);  
}
```

order服务的OrderController
``` java
@GetMapping("/status/{orderSn}")  
public R getOrderStatus(@PathVariable("orderSn") String orderSn){  
    OrderEntity orderEntity = orderService.getOrderByOrderSn(orderSn);  
    return R.ok().setData(orderEntity.getStatus());  
}
```
order服务的OrderServiceImpl
``` java
@Override  
public OrderEntity getOrderByOrderSn(String orderSn) {  
    return baseMapper.selectOne(new QueryWrapper<OrderEntity>().eq("order_sn", orderSn));  
}
```
ware服务新建OrderVo
``` java
@Data  
public class OrderVo {  
   /**  
    * id    
    */   
    private Long id;  
   /**  
    * member_id    
    */   
    private Long memberId;  
   /**  
    * 订单号  
    */  
   private String orderSn;  
   /**  
    * 使用的优惠券  
    */  
   private Long couponId;  
   /**  
    * create_time    */   private Date createTime;  
   /**  
    * 用户名  
    */  
   private String memberUsername;  
   /**  
    * 订单总额  
    */  
   private BigDecimal totalAmount;  
   /**  
    * 应付总额  
    */  
   private BigDecimal payAmount;  
   /**  
    * 运费金额  
    */  
   private BigDecimal freightAmount;  
   /**  
    * 促销优化金额（促销价、满减、阶梯价）  
    */  
   private BigDecimal promotionAmount;  
   /**  
    * 积分抵扣金额  
    */  
   private BigDecimal integrationAmount;  
   /**  
    * 优惠券抵扣金额  
    */  
   private BigDecimal couponAmount;  
   /**  
    * 后台调整订单使用的折扣金额  
    */  
   private BigDecimal discountAmount;  
   /**  
    * 支付方式【1->支付宝；2->微信；3->银联； 4->货到付款；】  
    */  
   private Integer payType;  
   /**  
    * 订单来源[0->PC订单；1->app订单]  
    */   private Integer sourceType;  
   /**  
    * 订单状态【0->待付款；1->待发货；2->已发货；3->已完成；4->已关闭；5->无效订单】  
    */  
   private Integer status;  
   /**  
    * 物流公司(配送方式)  
    */   private String deliveryCompany;  
   /**  
    * 物流单号  
    */  
   private String deliverySn;  
   /**  
    * 自动确认时间（天）  
    */  
   private Integer autoConfirmDay;  
   /**  
    * 可以获得的积分  
    */  
   private Integer integration;  
   /**  
    * 可以获得的成长值  
    */  
   private Integer growth;  
   /**  
    * 发票类型[0->不开发票；1->电子发票；2->纸质发票]  
    */   private Integer billType;  
   /**  
    * 发票抬头  
    */  
   private String billHeader;  
   /**  
    * 发票内容  
    */  
   private String billContent;  
   /**  
    * 收票人电话  
    */  
   private String billReceiverPhone;  
   /**  
    * 收票人邮箱  
    */  
   private String billReceiverEmail;  
   /**  
    * 收货人姓名  
    */  
   private String receiverName;  
   /**  
    * 收货人电话  
    */  
   private String receiverPhone;  
   /**  
    * 收货人邮编  
    */  
   private String receiverPostCode;  
   /**  
    * 省份/直辖市  
    */  
   private String receiverProvince;  
   /**  
    * 城市  
    */  
   private String receiverCity;  
   /**  
    * 区  
    */  
   private String receiverRegion;  
   /**  
    * 详细地址  
    */  
   private String receiverDetailAddress;  
   /**  
    * 订单备注  
    */  
   private String note;  
   /**  
    * 确认收货状态[0->未确认；1->已确认]  
    */   private Integer confirmStatus;  
   /**  
    * 删除状态【0->未删除；1->已删除】  
    */  
   private Integer deleteStatus;  
   /**  
    * 下单时使用的积分  
    */  
   private Integer useIntegration;  
   /**  
    * 支付时间  
    */  
   private Date paymentTime;  
   /**  
    * 发货时间  
    */  
   private Date deliveryTime;  
   /**  
    * 确认收货时间  
    */  
   private Date receiveTime;  
   /**  
    * 评价时间  
    */  
   private Date commentTime;  
   /**  
    * 修改时间  
    */  
   private Date modifyTime;  
  
}
```
ware服务的WareSkuDao.xml
``` xml
<update id="unLockStock">  
    UPDATE wms_ware_sku  
	SET stock_locked=stock_locked-#{skuNum}  
	WHERE sku_id=#{skuId}  
	  AND ware_id=#{wareId}
</update>
```
在order服务中application.properties，启动手动模式
``` yml
spring.rabbitmq.host=192.168.56.10  
spring.rabbitmq.virtual-host=/
spring.rabbitmq.listener.simple.acknowledge-mode=manual
```

#### 库存自动解锁完成
order服务的LoginInterceptor
``` java
@Override  
public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {  
    String requestURI = request.getRequestURI();  
    AntPathMatcher matcher = new AntPathMatcher();  
    boolean match1 = matcher.match("/order/order/status/**", requestURI);  
    if (match1||match2) return true;  
  
    HttpSession session = request.getSession();  
    MemberResponseVo memberResponseVo = (MemberResponseVo) session.getAttribute(AuthServerConstant.LOGIN_USER);  
    if (memberResponseVo != null) {  
        loginUser.set(memberResponseVo);  
        return true;    }else {  
        // 没登陆就去登录  
        session.setAttribute("msg","请先登录");  
        response.sendRedirect("http://auth.gulimall.com/login.html");  
        return false;    }  
}
```
ware服务中将消息监听抽取出来StockReleaseListener
``` java
@Slf4j  
@Component  
@RabbitListener(queues = {"stock.release.stock.queue"})  
public class StockReleaseListener {  
  
    @Autowired  
    private WareSkuService wareSkuService;  
  
    @RabbitHandler  
    public void handleStockLockedRelease(StockLockedTo to, Message message, Channel channel) throws IOException {  
        log.info("************************收到库存解锁的消息********************************");  
        try {  
            wareSkuService.unLockStock(to);  
            channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);  
        } catch (Exception e) {  
            channel.basicReject(message.getMessageProperties().getDeliveryTag(),true);  
        }  
    }  
  
    /*@RabbitHandler  
    public void handleStockLockedRelease(OrderTo orderTo, Message message, Channel channel) throws IOException {        log.info("************************从订单模块收到库存解锁的消息********************************");  
        try {            wareSkuService.unlock(orderTo);            channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);        } catch (Exception e) {            channel.basicReject(message.getMessageProperties().getDeliveryTag(),true);        }    }*/}
```
ware服务的WareSkuServiceImpl
``` java
@Override  
public void unLockStock(StockLockedTo to) {  
    System.out.println("收到解锁库存的消息");  
    StockDetailTo detail = to.getDetailTo();  
    Long detailId = detail.getId();  
    //解锁  
    //1、查询数据库关于这个订单的锁定库存信息  
    //  有：证明库存锁定成功了  
    //   解锁：订单情况  
    //       1、没有这个订单，必须解锁库存  
    //       2、有这个订单，不一定解锁库存  
    //           订单状态：已取消：解锁库存  
    //                   没取消：不能解锁库存  
    //  没有：库存锁定失败了，库存回滚了，这种情况无需解锁  
    WareOrderTaskDetailEntity byId = wareOrderTaskDetailService.getById(detailId);  
    if (byId != null) {  
        //解锁  
        Long id = to.getId();  
        WareOrderTaskEntity taskEntity = wareOrderTaskService.getById(id);  
        String orderSn = taskEntity.getOrderSn();  
        //TODO 远程查询订单服务，查询订单状态  
        R r = orderFeignService.getOrderStatus(orderSn);  
        if (r.getCode() == 0) {  
            //订单数据返回成功  
            OrderVo data = r.getData(new TypeReference<OrderVo>() {  
            });  
            if (data == null || data.getStatus() == 4) {  
                //订单不存在或者订单已经取消了，才能解锁库存  
                if (byId.getLockStatus() == 1) {  
                    unLockStock(detail.getSkuId(), detail.getWareId(), detail.getSkuNum(), detailId);  
                }  
                /*channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);*/  
            }  
        } else {  
            //消息拒绝以后重新放到队列里面，让别人继续消费解锁  
            /*channel.basicReject(message.getMessageProperties().getDeliveryTag(), true);*/  
            throw new RuntimeException("远程服务失败");  
        }  
    } else {  
        //无需解锁  
        /*channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);*/  
    }  
}  
  
private void unLockStock(Long skuId, Long wareId, Integer skuNum, Long detailId) {  
    //库存解锁  
    wareSkuDao.unLockStock(skuId, wareId, skuNum);  
    //更新库存工作单的状态  
    WareOrderTaskDetailEntity entity = new WareOrderTaskDetailEntity();  
    entity.setId(detailId);  
    entity.setLockStatus(2);  
    wareOrderTaskDetailService.updateById(entity);  
}
```

#### 定时关单完成
order服务新建OrderCloseListener
``` java
@Component  
@RabbitListener(queues = {"order.release.order.queue"})  
public class OrderCloseListener {  
  
    @Autowired  
    private OrderService orderService;  
  
    @RabbitHandler  
    public void listener(OrderEntity orderEntity, Message message, Channel channel) throws IOException {  
        System.out.println("收到过期的订单信息，准备关闭订单" + orderEntity.getOrderSn());  
        long deliveryTag = message.getMessageProperties().getDeliveryTag();  
        try {  
            orderService.closeOrder(orderEntity);  
            channel.basicAck(deliveryTag,false);  
        } catch (Exception e){  
            channel.basicReject(deliveryTag,true);  
        }  
  
    }  
}
```
order服务的OrderServiceImpl
``` java
@Override  
public void closeOrder(OrderEntity orderEntity) {  
    //查询当前订单的状态信息  
    OrderEntity order = this.getById(orderEntity.getId());  
    if (order.getStatus() == OrderStatusEnum.CREATE_NEW.getCode()) {  
        //关单  
        OrderEntity updateOrder = new OrderEntity();  
        updateOrder.setId(order.getId());  
        updateOrder.setStatus(OrderStatusEnum.CANCLED.getCode());  
        this.updateById(updateOrder);  
  
        //关单后发送消息通知其他服务进行关单相关的操作，如解锁库存  
        OrderTo orderTo = new OrderTo();  
        BeanUtils.copyProperties(order,orderTo);  
        rabbitTemplate.convertAndSend("order-event-exchange", "order.release.other",orderTo);  
    }  
}
```
order服务的MyRabbitmqConfig
``` java
@Bean  
public Binding orderReleaseOtherBinding() {  
    return new Binding("stock.release.stock.queue",  
            Binding.DestinationType.QUEUE,  
            "order-event-exchange",  
            "order.release.other.#",  
            null);  
}
```
ware服务中handleOrderCloseRelease
``` java
@RabbitHandler  
public void handleOrderCloseRelease(OrderTo orderTo, Message message, Channel channel) throws IOException {  
    log.info("************************从订单模块收到库存解锁的消息********************************");  
    try {  
        wareSkuService.unlock(orderTo);  
        channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);  
    } catch (Exception e) {  
        channel.basicReject(message.getMessageProperties().getDeliveryTag(),true);  
    }  
}
```
common服务中新建
``` java
@Data  
public class OrderTo {  
    private Long id;  
    /**  
     * member_id     */    private Long memberId;  
    /**  
     * 订单号  
     */  
    private String orderSn;  
    /**  
     * 使用的优惠券  
     */  
    private Long couponId;  
    /**  
     * create_time     */    private Date createTime;  
    /**  
     * 用户名  
     */  
    private String memberUsername;  
    /**  
     * 订单总额  
     */  
    private BigDecimal totalAmount;  
    /**  
     * 应付总额  
     */  
    private BigDecimal payAmount;  
    /**  
     * 运费金额  
     */  
    private BigDecimal freightAmount;  
    /**  
     * 促销优化金额（促销价、满减、阶梯价）  
     */  
    private BigDecimal promotionAmount;  
    /**  
     * 积分抵扣金额  
     */  
    private BigDecimal integrationAmount;  
    /**  
     * 优惠券抵扣金额  
     */  
    private BigDecimal couponAmount;  
    /**  
     * 后台调整订单使用的折扣金额  
     */  
    private BigDecimal discountAmount;  
    /**  
     * 支付方式【1->支付宝；2->微信；3->银联； 4->货到付款；】  
     */  
    private Integer payType;  
    /**  
     * 订单来源[0->PC订单；1->app订单]  
     */    private Integer sourceType;  
    /**  
     * 订单状态【0->待付款；1->待发货；2->已发货；3->已完成；4->已关闭；5->无效订单】  
     */  
    private Integer status;  
    /**  
     * 物流公司(配送方式)  
     */    private String deliveryCompany;  
    /**  
     * 物流单号  
     */  
    private String deliverySn;  
    /**  
     * 自动确认时间（天）  
     */  
    private Integer autoConfirmDay;  
    /**  
     * 可以获得的积分  
     */  
    private Integer integration;  
    /**  
     * 可以获得的成长值  
     */  
    private Integer growth;  
    /**  
     * 发票类型[0->不开发票；1->电子发票；2->纸质发票]  
     */    private Integer billType;  
    /**  
     * 发票抬头  
     */  
    private String billHeader;  
    /**  
     * 发票内容  
     */  
    private String billContent;  
    /**  
     * 收票人电话  
     */  
    private String billReceiverPhone;  
    /**  
     * 收票人邮箱  
     */  
    private String billReceiverEmail;  
    /**  
     * 收货人姓名  
     */  
    private String receiverName;  
    /**  
     * 收货人电话  
     */  
    private String receiverPhone;  
    /**  
     * 收货人邮编  
     */  
    private String receiverPostCode;  
    /**  
     * 省份/直辖市  
     */  
    private String receiverProvince;  
    /**  
     * 城市  
     */  
    private String receiverCity;  
    /**  
     * 区  
     */  
    private String receiverRegion;  
    /**  
     * 详细地址  
     */  
    private String receiverDetailAddress;  
    /**  
     * 订单备注  
     */  
    private String note;  
    /**  
     * 确认收货状态[0->未确认；1->已确认]  
     */    private Integer confirmStatus;  
    /**  
     * 删除状态【0->未删除；1->已删除】  
     */  
    private Integer deleteStatus;  
    /**  
     * 下单时使用的积分  
     */  
    private Integer useIntegration;  
    /**  
     * 支付时间  
     */  
    private Date paymentTime;  
    /**  
     * 发货时间  
     */  
    private Date deliveryTime;  
    /**  
     * 确认收货时间  
     */  
    private Date receiveTime;  
    /**  
     * 评价时间  
     */  
    private Date commentTime;  
    /**  
     * 修改时间  
     */  
    private Date modifyTime;  
}
```
ware服务的WareSkuServiceImpl
``` java
//防止订单服务卡顿，导致订单状态消息一直改不了，库存消息优先到期，查订单状态新建状态，什么都不做  
//导致卡顿的订单，永远不能解锁库存  
@Transactional
@Override  
public void unLockStock(OrderTo orderTo) {  
    String orderSn = orderTo.getOrderSn();  
    //查一下最新库存的状态，防止重复解锁库存  
    WareOrderTaskEntity taskEntity = wareOrderTaskService.getOrderTaskByOrderSn(orderSn);  
    Long id = taskEntity.getId();  
    //按照工作单找到所有 没有解锁的库存，进行解锁  
    List<WareOrderTaskDetailEntity> entities = wareOrderTaskDetailService.list(new QueryWrapper<WareOrderTaskDetailEntity>()
    .eq("task_id", id)
    .eq("lock_status", 1));  
    for (WareOrderTaskDetailEntity entity : entities) {  
        unLockStock(entity.getSkuId(), entity.getWareId(), entity.getSkuNum(), entity.getId());  
    }  
}
```
ware服务的WareOrderTaskServiceImpl
``` java
@Override  
public WareOrderTaskEntity getOrderTaskByOrderSn(String orderSn) {  
    WareOrderTaskEntity entity = this.getOne(new QueryWrapper<WareOrderTaskEntity>().eq("order_sn", orderSn));  
    return entity;  
}
```

#### 消息丢失、积压、重复等解决方案
**如何保证消息可靠性**
1. 消息丢失
	* 消息发送出去，由于网络问题没有抵达服务器
		* 做好容错方法 (try-catch) ，发送消息可能会网络失败，失败后要有重试机制，可记录到数据库，采用定期扫描重发的方式
		* 做好日志记录，每个消息状态是否都被服务器收到都应该记录
		* 做好定期重发，如果消息没有发送成功，定期去数据库扫描未成功的消息进行重发
	* 消息抵达Broker，Broker要将消息写入磁盘(持久化) 才算成功。此时Broker尚未持久化完成，宕机。
		* publisher也必须加入确认回调机制，确认成功的消息，修改数据库消息状态
	* 自动ACK的状态下。消费者收到消息，但没来得及消息然后宕机
		* 一定开启手动ACK，消费成功才移除，失败或者没来得及处理就noAck并重新入队
2. 消息重复
	* 消息消费成功，事务已经提交，ack时，机器宕机。导致没有ack成功，Broker的消息重新由unack变为ready，并发送给其他消费者
	* 消息消费失败，由于重试机制，自动又将消息发送出去
	* 成功消费，ack时宕机，消息由unack变为ready，Broker又重新发送
		* 消费者的业务消费接口应该设计为**幂等性**的。比如扣库存有工作单的状态标志
		* 使用**防重表** (redis/mysql)发送消息每一个都有业务的唯一标识，处理过就不用处理
		* rabbitMQ的每一个消息都有redelivered字段，可以获取**是否是被重新投递过来的**，而不是第一次投递过来的
3. 消息积压
	* 消费者宕机积压
	* 消费者消费能力不足积压
	* 发送者发送流量太大
		* 上线更多的消费者，进行正常消费
		* 上线专门的队列消费服务，将消息先批量取出来，记录数据库，离线慢慢处理

### 支付
#### 支付宝沙箱&代码
支付宝开放平台：https: /open.alipay.com/platform/home.htm

#### RSA、加密加签、密钥等
加密-对称加密
![](/GuliMall/Pasted_image_20230329000230.png)
加密-非对称加密
![](/GuliMall/Pasted_image_20230329000259.png)
![](/GuliMall/Pasted_image_20230329001155.png)

什么是公钥、私钥、加密、签名和验签?
1. 公私
	公钥和私钥是一个相对概念
	它们的公私性是相对于生成者来说的。
	一对密钥生成后，保存在生成者手里的就是私钥，生成者发布出去大家用的就是公钥
2. 加密和数字签名
	* 加密是指:
		* 我们使用一对公私钥中的一个密钥来对数据进行加密,而使用另一个密钥来进行解密的技术。
		* 公钥和私钥都可以用来加密，也都可以用来解密。
		* 但这个加解密必须是一对密钥之间的互相加解密，否则不能成功
		* 加密的目的是:为了确保数据传输过程中的不可读性，就是不想让别人看到。
	* 签名:
		* 给我们将要发送的数据，做上一个唯一签名(类似于指纹)
		* 用来互相验证接收方和发送方的身份;
		* 在验证身份的基础上再验证一下传递的数据是否被篡改过。因此使用数字签名可以用来达到数据的明文传输。
	* 验签
		* 支付宝为了验证请求的数据是否商户本人发的，
		* 商户为了验证响应的数据是否支付宝发的



#### 内网穿透
内网穿透功能可以允许我们使用外网的网址来访问主机;正常的外网需要访问我们项目的流程是:
1. 买服务器并且有公网固定 IP
2. 买域名映射到服务器的 IP
3. 域名需要进行备案和审核
![](/GuliMall/Pasted_image_20230329000431.png)
![](/GuliMall/Pasted_image_20230329000454.png)
![](/GuliMall/Pasted_image_20230329000513.png)

使用场景
1. 开发测试(微信、支付宝)
2. 智慧互联
3. 远程控制
4. 私有云

内网穿的几个常用软件
1. natapp: https://natapp.cn/
2. 续断: www.zhexi.tech 
3. 花生壳: https://www.oray.coml

### 订单服务
#### 整合支付前需要注意的问题
需要检查所有项目的编码方式都是`utf-8`格式的

#### 整合支付
在order服务的pom.xml中引入依赖
``` xml
<!--导入支付宝的SDK-->  
<dependency>  
	<groupId>com.alipay.sdk</groupId>  
	<artifactId>alipay-sdk-java</artifactId>  
	<version>4.35.87.ALL</version>  
</dependency>
```
order中新增AlipayTemplate
``` java
@ConfigurationProperties(prefix = "alipay")  
@Component  
@Data  
public class AlipayTemplate {  
  
	//在支付宝创建的应用的id  
	// private String app_id = "2016092200568607";  
	private String app_id = "2021003186669001";  
	  
	// 商户私钥，您的PKCS8格式RSA2私钥  
	private String merchant_private_key = "";  
	// 支付宝公钥,查看地址：https://openhome.alipay.com/platform/keyManage.htm 对应APPID下的支付宝公钥。  
	private String alipay_public_key = "";  
	// 服务器[异步通知]页面路径 需http://格式的完整路径，不能加?id=123这类自定义参数，必须外网可以正常访问  
	// 支付宝会悄悄的给我们发送一个请求，告诉我们支付成功的信息  
	private String notify_url;  
	  
	// 页面跳转同步通知页面路径 需http://格式的完整路径，不能加?id=123这类自定义参数，必须外网可以正常访问  
	//同步通知，支付成功，一般跳转到成功页  
	private String return_url = "http://order.gulimall.com/memberOrder.html";  
	  
	// 签名方式  
	private String sign_type = "RSA2";  
	  
	// 字符编码格式  
	private String charset = "utf-8";  
	  
	// 支付宝网关； https://openapi.alipaydev.com/gateway.doprivate String gatewayUrl = "https://openapi.alipaydev.com/gateway.do";  
	  
	public String pay(PayVo vo) throws AlipayApiException {  
	  
		//AlipayClient alipayClient = new DefaultAlipayClient(AlipayTemplate.gatewayUrl, AlipayTemplate.app_id, AlipayTemplate.merchant_private_key, "json", AlipayTemplate.charset, AlipayTemplate.alipay_public_key, AlipayTemplate.sign_type);  
		//1、根据支付宝的配置生成一个支付客户端  
		AlipayClient alipayClient = new DefaultAlipayClient(gatewayUrl,  
		app_id, merchant_private_key, "json",  
		charset, alipay_public_key, sign_type);  
		  
		//2、创建一个支付请求 //设置请求参数  
		AlipayTradePagePayRequest alipayRequest = new AlipayTradePagePayRequest();  
		alipayRequest.setReturnUrl(return_url);  
		alipayRequest.setNotifyUrl(notify_url);  
		  
		//商户订单号，商户网站订单系统中唯一订单号，必填  
		String out_trade_no = vo.getOut_trade_no();  
		//付款金额，必填  
		String total_amount = vo.getTotal_amount();  
		//订单名称，必填  
		String subject = vo.getSubject();  
		//商品描述，可空  
		String body = vo.getBody();  
		  
		alipayRequest.setBizContent("{\"out_trade_no\":\""+ out_trade_no +"\","  
		+ "\"total_amount\":\""+ total_amount +"\","  
		+ "\"subject\":\""+ subject +"\","  
		+ "\"body\":\""+ body +"\","  
		+ "\"product_code\":\"FAST_INSTANT_TRADE_PAY\"}");  
		  
		String result = alipayClient.pageExecute(alipayRequest).getBody();  
		  
		//会收到支付宝的响应，响应的是一个页面，只要浏览器显示这个页面，就会自动来到支付宝的收银台页面  
		System.out.println("支付宝的响应："+result);  
		  
		return result;  
	  
	}  
}
```
order服务中新增PayVo
``` java
@Data  
public class PayVo {  
	private String out_trade_no; // 商户订单号 必填  
	private String subject; // 订单名称 必填  
	private String total_amount; // 付款金额 必填  
	private String body; // 商品描述 可空  
}
```

前端页面，略

order服务中新建PayWebController
``` java
@Controller  
public class PayWebController {  
  
	@Autowired  
	private AlipayTemplate alipayTemplate;  
	@Autowired  
	private OrderService orderService;  
	  
	@ResponseBody  
	@GetMapping(value = "/aliPayOrder",produces = "text/html")  
	public String aliPayOrder(@RequestParam("orderSn") String orderSn) throws AlipayApiException {  
		System.out.println("接收到订单信息orderSn："+orderSn);  
		PayVo payVo = orderService.getOrderPay(orderSn);  
		String pay = alipayTemplate.pay(payVo);  
		return pay;  
	}  
  
}
```
order服务的OrderServiceImpl
``` java
@Override  
public PayVo getOrderPay(String orderSn) {  
	OrderEntity orderEntity = this.getOne(new QueryWrapper<OrderEntity>().eq("order_sn", orderSn));  
	PayVo payVo = new PayVo();  
	payVo.setOut_trade_no(orderSn);  
	BigDecimal payAmount = orderEntity.getPayAmount().setScale(2, BigDecimal.ROUND_UP);  
	payVo.setTotal_amount(payAmount.toString());  
	  
	List<OrderItemEntity> orderItemEntities = orderItemService.list(new QueryWrapper<OrderItemEntity>().eq("order_sn", orderSn));  
	OrderItemEntity orderItemEntity = orderItemEntities.get(0);  
	payVo.setSubject(orderItemEntity.getSkuName());  
	payVo.setBody(orderItemEntity.getSkuAttrsVals());  
	return payVo;  
}
```

#### 支付成功同步回调
将前端页面拷贝到template目录下，并重命名为orderList.html
然后将静态资源上传到`/mydata/nginx/html/static/member/`目录下
前端页面修改，略

member服务中的pom.xml中引入依赖
``` java
<!-- thymeleaf 模板引擎 -->  
<dependency>  
	<groupId>org.springframework.boot</groupId>  
	<artifactId>spring-boot-starter-thymeleaf</artifactId>  
</dependency>
```
然后在application.yml中将缓存关闭
``` yml
spring.thymeleaf.cache=false
```
member服务中新增MemberWebController
``` java
@Controller  
public class MemberWebController {  
  
	@GetMapping("/memberOrder.html")  
	public String memberOrderPage(){  
	
		//查出当前登录的用户的所有订单列表数据  
		return "orderList";  
	}  
}
```
member服务中新增LoginInterceptor
``` java
/**  
* 登录拦截器，未登录的用户不能进入订单服务  
*/  
public class LoginInterceptor implements HandlerInterceptor {  
	public static ThreadLocal<MemberResponseVo> loginUser = new ThreadLocal<>();  
	  
	@Override  
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {  
		String requestURI = request.getRequestURI();  
		AntPathMatcher matcher = new AntPathMatcher();  
		boolean match1 = matcher.match("/member/**", requestURI);
		boolean match2 = matcher.match("/payed/**", requestURI);  
		if (match1||match2) return true;  
		  
		HttpSession session = request.getSession();  
		MemberResponseVo memberResponseVo = (MemberResponseVo) session.getAttribute(AuthServerConstant.LOGIN_USER);  
		if (memberResponseVo != null) {  
			loginUser.set(memberResponseVo);  
			return true;  
		}else {  
			// 没登陆就去登录  
			session.setAttribute("msg","请先登录");  
			response.sendRedirect("http://auth.gulimall.com/login.html");  
			return false;  
		}  
}  
  
	@Override  
	public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {  
	  
	}  
	  
	@Override  
	public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {  
	  
	}  
}
```
member服务中新增MemberWebConfiguration
``` java
@Configuration  
public class MemberWebConfiguration implements WebMvcConfigurer {  
	@Autowired  
	LoginInterceptor loginInterceptor;  
  
	@Override  
	public void addInterceptors(InterceptorRegistry registry) {  
		registry.addInterceptor(loginInterceptor).addPathPatterns("/**");  
	}  
}
```

在gateway的application.yml中添加路由规则
``` java
- id: gulimall_member_rout  
	uri: lb://gulimall-member  
	predicates:  
		- Host=member.gulimall.com
```
host文件中添加域名映射
``` sh
192.168.56.10   member.gulimall.com
```

在member服务的pom.xml中引入依赖
``` java
<dependency>  
	<groupId>org.springframework.session</groupId>  
	<artifactId>spring-session-data-redis</artifactId>  
</dependency>

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
然后在application.yml中开启session，在启动类上加上`@EnableRedisHttpSession`注解
```
spring.session.store-type=redis  
  
spring.redis.host=192.168.56.10
```
把order服务的GulimallSessionConfig拷贝到member服务中

#### 订单列表页渲染完成
order服务的OrderController
``` java
/**  
* 分页查询当前登录用户的所有订单  
* @param params  
* @return  
*/
@PostMapping("/listWithItem")  
public R listWithItem(@RequestBody Map<String, Object> params){  
PageUtils page = orderService.queryPageWithItem(params);  
  
return R.ok().put("page", page);  
}
```
order服务的OrderServiceImpl
``` java
@Override  
public PageUtils queryPageWithItem(Map<String, Object> params) {  
	MemberResponseVo memberResponseVo = LoginInterceptor.loginUser.get();  
	IPage<OrderEntity> page = this.page(  
		new Query<OrderEntity>().getPage(params),  
		new QueryWrapper<OrderEntity>()  
			.eq("member_id", memberResponseVo.getId())  
			.orderByDesc("id")  
	);  
	  
	List<OrderEntity> orderSn = page.getRecords().stream().map(order -> {  
	List<OrderItemEntity> itemEntities = orderItemService.list(new QueryWrapper<OrderItemEntity>()  
			.eq("order_sn", order.getOrderSn()));  
		order.setItemEntities(itemEntities);  
		return order;  
	}).collect(Collectors.toList());  
	  
	page.setRecords(orderSn);  
	  
	return new PageUtils(page);  
}
```
order服务的OrderEntity
``` java
private List<OrderItemEntity> items;
```
order服务中新建OrderFeignService
``` java
@FeignClient("gulimall-order")  
public interface OrderFeignService {  
  
	@PostMapping("/order/order/listWithItem") // 需要完整的路径  
	public R listWithItem(@RequestBody Map<String, Object> params);  
  
}
```
member服务的MemberWebController
``` java
@GetMapping("/memberOrder.html")  
public String memberOrderPage(@RequestParam(value = "pageNum", defaultValue = "1") Integer pageNum,  
Model model){  
	//查出当前登录的用户的所有订单列表数据  
	Map<String, Object> page = orderFeignService.listWithItem(null);  
	page.put("pageNum", pageNum.toString());  
	orderFeignService.listWithItem(page);  
	model.addAttribute("orders", page);  
	return "orderList";  
}
```

将order服务的GuliFeignConfig拷贝到member服务中

前端页面修改，略

#### 异步通知内网穿透环境搭建
![](/GuliMall/Pasted_image_20230329000513.png)
order服务中新建OrderPayedListener
``` java
/**  
* 异步接收支付宝成功回调  
*/  
@RestController  
public class OrderPayedListener {  
  
	@Autowired  
	private AlipayTemplate alipayTemplate;  
	  
	@Autowired  
	private OrderService orderService;  
	  
	@PostMapping("/payed/notify")  
	public String handlerAlipay(HttpServletRequest request, PayAsyncVo payAsyncVo) throws AlipayApiException {  
		System.out.println("收到支付宝异步通知******************");  
		// 只要收到支付宝的异步通知，返回 success 支付宝便不再通知  
		return "success";  
	}  
	  
	@GetMapping("/payed/test")  
	public String test() {  
		return "test";  
	}  
}
```
在AlipayTemplate中配置好内网穿透的外网访问地址
在nginx中添加指定的转发地址(在sever_name中添加上内网穿透的外网访问地址)，保存后把nginx重启一下`docker restart nginx`
``` sh
location /payed/ {
	proxy_set_header Host $host;
	proxy_pass http://order.gulimall.com;
}
```
在order服务的
``` java
@Override  
public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {  
	String requestURI = request.getRequestURI();  
	AntPathMatcher matcher = new AntPathMatcher();  
	boolean match1 = matcher.match("/order/order/status/**", requestURI);  
	boolean match2 = matcher.match("/payed/**", requestURI);  
	if (match1||match2) return true;  
	  
	HttpSession session = request.getSession();  
	MemberResponseVo memberResponseVo = (MemberResponseVo) session.getAttribute(AuthServerConstant.LOGIN_USER);  
	if (memberResponseVo != null) {  
		loginUser.set(memberResponseVo);  
		return true;  
	}else {  
		// 没登陆就去登录  
		session.setAttribute("msg","请先登录");  
		response.sendRedirect("http://auth.gulimall.com/login.html");  
		return false;  
	}  
}
```

#### 支付完成
order服务中OrderPayedListener的handlerAlipay
``` java
@PostMapping("/payed/notify")  
public String handlerAlipay(HttpServletRequest request, PayAsyncVo payAsyncVo) throws AlipayApiException {  
	System.out.println("收到支付宝异步通知******************");  
	// 只要收到支付宝的异步通知，返回 success 支付宝便不再通知  
	// 获取支付宝POST过来反馈信息  
	//TODO 需要验签  
	Map<String, String> params = new HashMap<>();  
	Map<String, String[]> requestParams = request.getParameterMap();  
	for (String name : requestParams.keySet()) {  
		String[] values = requestParams.get(name);  
		String valueStr = "";  
		for (int i = 0; i < values.length; i++) {  
			valueStr = (i == values.length - 1) ? valueStr + values[i]  
			: valueStr + values[i] + ",";  
		}  
		//乱码解决，这段代码在出现乱码时使用  
		// valueStr = new String(valueStr.getBytes("ISO-8859-1"), "utf-8");  
		params.put(name, valueStr);  
	}  
	  
	boolean signVerified = AlipaySignature.rsaCheckV1(params, alipayTemplate.getAlipay_public_key(),  
	alipayTemplate.getCharset(), alipayTemplate.getSign_type()); //调用SDK验证签名  
	  
	if (signVerified){  
		System.out.println("支付宝异步通知验签成功");  
		//修改订单状态  
		String result = orderService.handlerPayResult(payAsyncVo);  
		return result;  
	}else {  
		System.out.println("支付宝异步通知验签失败");  
		return "error";  
	}  
}
```
order服务中新建PayAsyncVo，并且在applicaion.properties中配置时间格式`spring.mvc.date-format=yyyy-MM-dd HH:mm:ss`
``` java
@ToString  
@Data  
public class PayAsyncVo {  
  
	private String gmt_create;  
	private String charset;  
	private String gmt_payment;  
	private Date notify_time;  
	private String subject;  
	private String sign;  
	private String buyer_id;//支付者的id  
	private String body;//订单的信息  
	private String invoice_amount;//支付金额  
	private String version;  
	private String notify_id;//通知id  
	private String fund_bill_list;  
	private String notify_type;//通知类型； trade_status_syncprivate String out_trade_no;//订单号  
	private String total_amount;//支付的总额  
	private String trade_status;//交易状态 TRADE_SUCCESSprivate String trade_no;//流水号  
	private String auth_app_id;//  
	private String receipt_amount;//商家收到的款  
	private String point_amount;//  
	private String app_id;//应用id  
	private String buyer_pay_amount;//最终支付的金额  
	private String sign_type;//签名类型  
	private String seller_id;//商家的id  
  
}
```
order服务中的OrderServiceImpl
``` java
@Autowired  
private PaymentInfoService paymentInfoService;

/**  
* 处理支付宝的支付结果  
* @param payAsyncVo  
*/  
@Override  
public String handlerPayResult(PayAsyncVo payAsyncVo) {  
	//保存交易流水  
	PaymentInfoEntity infoEntity = new PaymentInfoEntity();  
	String orderSn = payAsyncVo.getOut_trade_no();  
	infoEntity.setOrderSn(orderSn);  
	infoEntity.setAlipayTradeNo(payAsyncVo.getTrade_no());  
	infoEntity.setSubject(payAsyncVo.getSubject());  
	String trade_status = payAsyncVo.getTrade_status();  
	infoEntity.setPaymentStatus(trade_status);  
	infoEntity.setCreateTime(new Date());  
	infoEntity.setCallbackTime(payAsyncVo.getNotify_time());  
	paymentInfoService.save(infoEntity);  
	  
	//判断交易状态是否成功  
	if (trade_status.equals("TRADE_SUCCESS") || trade_status.equals("TRADE_FINISHED")) {  
		baseMapper.updateOrderStatus(orderSn, OrderStatusEnum.PAYED.getCode(), OrderStatusEnum.PAYED.PAYED.getCode());  
	}  
}
```
将oms_payment_info的order_sn和alipay_trade_no字段添加上唯一索引，并且将order_sn字段的长度改为64
order服务的OrderDao.xml中
``` java
<update id="updateOrderStatus">  
	update oms_order set status=#{code} where order_sn=#{outTradeNo}  
</update>
```

#### 收单
1. 订单在支付页，不支付，一直刷新，订单过期了才支付，订单状态改为已支付了，但是库存解锁了。
	* 使用支付宝自动收单功能解决。只要一段时间不支付，就不能支付了。
2. 由于时延等问题。订单解锁完成，正在解锁库存的时候，异步通知才到。
	* 订单解锁，手动调用收单。
3. 网络阻塞问题，订单支付成功的异步通知一直不到达
	* 查询订单列表时，ajax获取当前未支付的订单状态，查询订单状态时，再获取一下支付宝此订单的状态
4. 其他各种问题
	* 每天晚上闲时下载支付宝对账单--进行对账

方案一
order服务为的
``` java
@ConfigurationProperties(prefix = "alipay") // 配置文件中是不认“_”的，需要转换为驼峰的写法  
@Component  
@Data  
public class AlipayTemplate {  
  
	//在支付宝创建的应用的id  
	private String app_id;  
	  
	// 商户私钥，您的PKCS8格式RSA2私钥  
	private String merchant_private_key;  
	// 支付宝公钥,查看地址：https://openhome.alipay.com/platform/keyManage.htm 对应APPID下的支付宝公钥。  
	private String alipay_public_key;  
	  
	// 服务器[异步通知]页面路径 需http://格式的完整路径，不能加?id=123这类自定义参数，必须外网可以正常访问  
	// 支付宝会悄悄的给我们发送一个请求，告诉我们支付成功的信息  
	private String notify_url;  
	  
	// 页面跳转同步通知页面路径 需http://格式的完整路径，不能加?id=123这类自定义参数，必须外网可以正常访问  
	//同步通知，支付成功，一般跳转到成功页  
	private String return_url = "http://member.gulimall.com/memberOrder.html";  
	  
	// 签名方式  
	private String sign_type = "RSA2";  
	  
	// 字符编码格式  
	private String charset = "utf-8";  
	  
	private String timeout = "30m";  
	  
	// 支付宝网关； https://openapi.alipaydev.com/gateway.doprivate String gatewayUrl = "https://openapi.alipaydev.com/gateway.do";  
	  
	public String pay(PayVo vo) throws AlipayApiException {  
	  
		//AlipayClient alipayClient = new DefaultAlipayClient(AlipayTemplate.gatewayUrl, AlipayTemplate.app_id, AlipayTemplate.merchant_private_key, "json", AlipayTemplate.charset, AlipayTemplate.alipay_public_key, AlipayTemplate.sign_type);  
		//1、根据支付宝的配置生成一个支付客户端  
		AlipayClient alipayClient = new DefaultAlipayClient(gatewayUrl,  
		app_id, merchant_private_key, "json",  
		charset, alipay_public_key, sign_type);  
		  
		//2、创建一个支付请求 //设置请求参数  
		AlipayTradePagePayRequest alipayRequest = new AlipayTradePagePayRequest();  
		alipayRequest.setReturnUrl(return_url);  
		alipayRequest.setNotifyUrl(notify_url);  
		  
		//商户订单号，商户网站订单系统中唯一订单号，必填  
		String out_trade_no = vo.getOut_trade_no();  
		//付款金额，必填  
		String total_amount = vo.getTotal_amount();  
		//订单名称，必填  
		String subject = vo.getSubject();  
		//商品描述，可空  
		String body = vo.getBody();  
		  
		alipayRequest.setBizContent("{\"out_trade_no\":\""+ out_trade_no +"\","  
			+ "\"total_amount\":\""+ total_amount +"\","  
			+ "\"subject\":\""+ subject +"\","  
			+ "\"body\":\""+ body +"\","  
			+ "\"timeout_express\":\"" + timeout + "\","  
			+ "\"product_code\":\"FAST_INSTANT_TRADE_PAY\"}");  
		  
		String result = alipayClient.pageExecute(alipayRequest).getBody();  
		  
		//会收到支付宝的响应，响应的是一个页面，只要浏览器显示这个页面，就会自动来到支付宝的收银台页面  
		System.out.println("支付宝的响应："+result);  
		  
		return result;  
	  
	}  
}
```

方式二
在关单的同时，调用支付宝的收单接口。
order服务的OrderCloseListener中


### 秒杀
#### 后台添加秒杀商品
在getway服务的application.yml中添加
``` yml
#将路径为Path=/api/coupon/**转发至优惠服务  
- id: gulimall-coupon  
	uri: lb://gulimall-coupon  
	predicates:  
		- Path=/api/coupon/**  
	filters:  
		- RewritePath=/api/(?<segment>/?.*),/$\{segment}
```
coupon服务的SeckillSkuRelationServiceImpl
``` java
@Override  
public PageUtils queryPage(Map<String, Object> params) {  
	QueryWrapper<SeckillSkuRelationEntity> queryWrapper = new QueryWrapper<>();  
	// 场次id  
	String promotionSessionId = (String) params.get("promotionSessionId");  
	if (StringUtils.isEmpty(promotionSessionId)) {  
		queryWrapper.eq("promotion_session_id", promotionSessionId);  
	}  
	IPage<SeckillSkuRelationEntity> page = this.page(  
		new Query<SeckillSkuRelationEntity>().getPage(params),  
		queryWrapper  
	);  
	  
	return new PageUtils(page);  
}
```

#### 定时任务&Cron表达式
秒杀业务
秒杀具有瞬间高并发的特点，针对这一特点，必须要做限流 + 异步 + 缓存(页面静态化)+ 独立部署。

新建秒杀服务，seckill
pom.xml依赖如下
``` java
<dependencies>  
	<dependency>  
		<groupId>cn.cheakin</groupId>  
		<artifactId>gulimall-common</artifactId>  
		<version>0.0.1-SNAPSHOT</version>  
	</dependency>  
	  
	<dependency>  
		<groupId>org.springframework.boot</groupId>  
		<artifactId>spring-boot-starter-web</artifactId>  
	</dependency>  
	<!-- thymeleaf 模板引擎 -->  
	<dependency>  
		<groupId>org.springframework.boot</groupId>  
		<artifactId>spring-boot-starter-thymeleaf</artifactId>  
	</dependency>  
	  
	<dependency>  
		<groupId>org.springframework.boot</groupId>  
		<artifactId>spring-boot-starter-amqp</artifactId>  
	</dependency>  
	  
	  
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
</dependencies>
```
application.properties配置如下
``` properties
spring.application.name=gulimall-seckill  
server.port=2500  
  
spring.cloud.nacos.discovery.server-addr=127.0.0.1:8848  
  
spring.redis.host=192.168.56.10
```
启动类上使用`@EnableDiscoveryClient` 注解开启服务注册
启动类上使用`@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)`关闭数据库扫描
然后在启动参数里使用`-Xmx100m`显示内存消耗

![](/GuliMall/aHR0cHM6Ly90eXBvcmEtb3NzLm9zcy1jbi1iZWlqaW5nLmFsaXl1bmNzLmNvbS9pbWFnZS0yMDIwMDgxOTIyMTA0MTY3Ny5wbmc.png)


cron表达式
语法：秒 分 时日 月 周 年 (Spring 不支持）
|Field Name|Mandatory|Allowed Values|Allowed Special Characters|
|--|--|--|--|
|Seconds|YES|0-59|, - * /|
|Minutes|YES|0-59|, - * /|
|Hours|YES|0-23|, - * /|
|Day of month|YES|1-31|, - * ? / L W|
|Month|YES|1-12 or JAN-DEC|, - * /|
|Day of weekYear|YES|1-7 or SUN-SAT|, - * ? / L #|
|Year|NO|empty, 1970-2099|, - * /|

#### SpringBoot整合定时任务与异步任务
seckill服务新建HelloSchedule
``` java
/**  
* 定时任务  
*     1. @EnableScheduling 开启定时任务  
*     2. @Scheduled 开启一个定时任务  
*     3. 自动配置 TaskSchedulingAutoConfiguration  
*  
* 异步任务  
*     1. @EnableAsync 开启异步任务功能  
*     2. @Async 给希望异步执行的方法上标注  
*     3. 自动配置类 TaskExecutionAutoConfiguration 属性绑定在TaskExecutionProperties  
*  
*/  
  
//@EnableAsync  
//@EnableScheduling  
@Component  
@Slf4j  
public class HelloSchedule {  
  
	/**  
	* 1. Spring中由6位组成，不允许第7位的年  
	* 2. 在周几的位置，1-7代表周一到周日，MON-SUN也可以  
	* 3. 定时任务不应该阻塞。默认是阻塞的  
	*     1）可以让业务运行以异步的方式，自己提交到线程池  
	*         CompletableFuture.runAsync(() -> {  
	*             xxxService.hello();  
	*         }, executor);  
	*     2) 支持定时任务线程池:设置 TaskSchedulingProperties  
	*         spring.task.scheduling.pool.size=5  
	*     3) 让定时任务异步执行  
	*  
	*     解决：使用异步+定时任务来完成定时任务不阻塞的功能  
	*  
	*  
	* @throws InterruptedException  
	*/  
	@Scheduled(cron = "0 0 3 * * ?")  
	@Async  
	public void hello() throws InterruptedException {  
		Thread.sleep(3000);  
		log.info("hello...");  
		  
		/*CompletableFuture.runAsync(() -> {  
		xxxService.hello();  
		}, executor);*/  
	}  
}
```
seckill服务的applicaiont.properties中
``` properties
#spring.task.scheduling.pool.size=5  
spring.task.execution.pool.core-size=20  
spring.task.execution.pool.max-size=50
```

#### 时间日期处理 & 秒杀商品上架 & 幂等性保证
seckill中在HelloSchedule不需要定时任务所以把使用的注解注释掉

seckill服务中新建ScheduledConfig
``` java
@EnableAsync //开启对异步的支持，防止定时任务之间相互阻塞  
@EnableScheduling //开启对定时任务的支持  
@Configuration  
public class ScheduledConfig {  
}
```
seckill服务中新建SecKillScheduled
``` java
/**  
* 秒杀商品的定时上架  
* 每天王航3点：上架最近三天需要秒杀的商品  
* 当天 00:00:00 - 23:59:59  
* 明天 00:00:00 - 23:59:59  
* 后天 00:00:00 - 23:59:59  
*/  
@Component  
public class SecKillScheduled {  
  
    @Autowired  
    private RedissonClient redissonClient;  
      
    @Autowired  
    private SecKillService secKillService;  
      
    //秒杀商品上架功能的锁  
    private final String upload_lock = "seckill:upload:lock";  
      
    /**  
    * 定时任务  
    * 每天三点上架最近三天的秒杀商品  
    */  
    @Async  
    // @Scheduled(cron = "0 0 3 * * ?")  
    @Scheduled(cron = "0 55 22 * * ?")  
    public void uploadSeckillSkuLatest3Days() {  
        // 重复上架无需处理  
        //为避免分布式情况下多服务同时上架的情况，使用分布式锁  
        RLock lock = redissonClient.getLock(upload_lock);  
        try {  
            lock.lock(10, TimeUnit.SECONDS);  
            secKillService.uploadSeckillSkuLatest3Days();  
        }catch (Exception e){  
            e.printStackTrace();  
        }finally {  
            lock.unlock();  
        }  
    }  
  
}
```
seckill服务中新建SecKillServiceImpl
``` java
@Autowired  
private CouponFeignService couponFeignService;  
@Autowired  
private ProductFeignService productFeignService;  
  
@Autowired  
private RedissonClient redissonClient;  
@Autowired  
private StringRedisTemplate redisTemplate;

//K: SESSION_CACHE_PREFIX + startTime + "_" + endTime  
//V: sessionId+"-"+skuId的List  
private final String SESSION_CACHE_PREFIX = "seckill:sessions:";  
  
//K: 固定值SECKILL_CHARE_PREFIX  
//V: hash，k为sessionId+"-"+skuId，v为对应的商品信息SecKillSkuRedisTo  
private final String SECKILL_CHARE_PREFIX = "seckill:skus";  
  
//K: SKU_STOCK_SEMAPHORE+商品随机码  
//V: 秒杀的库存件数  
private final String SKU_STOCK_SEMAPHORE = "seckill:stock:"; //+商品随机码

@Override  
public void uploadSeckillSkuLatest3Days() {  
    R r = couponFeignService.getLates3DaySession();  
    if (r.getCode() == 0) {  
        List<SeckillSessionWithSkusVo> sessions = r.getData(new TypeReference<List<SeckillSessionWithSkusVo>>() {  
        });  
        //在redis中分别保存秒杀场次信息和场次对应的秒杀商品信息  
        saveSessionInfos(sessions);  
        saveSessionSkuInfos(sessions);  
    }  
}

private void saveSessionInfos(List<SeckillSessionWithSkusVo> sessions) {  
    sessions.stream().forEach(session->{  
        String key = SESSION_CACHE_PREFIX + session.getStartTime().getTime() + "_" + session.getEndTime().getTime();  
        //当前活动信息未保存过  
        if (!redisTemplate.hasKey(key)){  
            List<String> values = session.getRelationSkus().stream()  
                // .map(item -> item.getSkuId().toString())  
                .map(item -> item.getPromotionSessionId() + "_" + item.getSkuId())
                .collect(Collectors.toList());  
            redisTemplate.opsForList().leftPushAll(key,values);  
        }  
    });  
}

private void saveSessionSkuInfos(List<SeckillSessionWithSkusVo> sessions) {  
    BoundHashOperations<String, Object, Object> ops = redisTemplate.boundHashOps(SECKILL_CHARE_PREFIX);  
    sessions.stream().forEach(session->{  
        session.getRelationSkus().stream().forEach(seckillSkuVo -> {  
            // String key = seckillSkuVo.getSkuId().toString();  
            String key = seckillSkuVo.getPromotionSessionId() + "_" + seckillSkuVo.getSkuId();
            if (!ops.hasKey(key)){  
                // 缓存商品  
                SecKillSkuRedisTo redisTo = new SecKillSkuRedisTo();  
                //2.sku的秒杀信息  
                BeanUtils.copyProperties(seckillSkuVo, redisTo);  
                  
                //1.sku的基本数据  
                R r = productFeignService.getSkuInfo(seckillSkuVo.getSkuId());  
                if (r.getCode() == 0) {  
                    SkuInfoVo info = r.getData("skuInfo", new TypeReference<SkuInfoVo>() {  
                    });  
                    redisTo.setSkuInfoVo(info);  
                }  
                  
                //3.设置上当前上坪的秒杀时间信息  
                redisTo.setStartTime(session.getStartTime().getTime());  
                redisTo.setEndTime(session.getEndTime().getTime());  
                  
                //4.生成商品随机码，防止恶意攻击  
                String token = UUID.randomUUID().toString().replace("-", "");  
                redisTo.setRandomCode(token);  
                
                //5.使用库存作为Redisson信号量限制库存  限流
                RSemaphore semaphore = redissonClient.getSemaphore(SKU_STOCK_SEMAPHORE + token);  
                semaphore.trySetPermits(seckillSkuVo.getSeckillCount());  
                
                //序列化为json并保存  
                String jsonString = JSON.toJSONString(redisTo);  
                ops.put(key, jsonString);  
                
            }  
        });  
    });  
}
```
seckill的启动类上使用@EnableFeignClients注解开启远程调用功能
seckill服务中新建CouponFeignService
``` java
@FeignClient(value = "gulimall-coupon")  
public interface CouponFeignService {  
  
	@RequestMapping("coupon/seckillsession/getSeckillSessionsIn3Days")  
	R getSeckillSessionsIn3Days();  
  
}
```

coupon服务的SeckillSessionController
``` java
@RequestMapping("/getSeckillSessionsIn3Days")  
public R getSeckillSessionsIn3Days() {  
	List<SeckillSessionEntity> seckillSessionEntities=seckillSessionService.getSeckillSessionsIn3Days();  
	return R.ok().setData(seckillSessionEntities);  
}
```
coupon服务的SeckillSessionServiceImpl
``` java
@Autowired  
private SeckillSkuRelationService seckillSkuRelationService;

@Override  
public List<SeckillSessionEntity> getLates3DaySession() {  
	QueryWrapper<SeckillSessionEntity> queryWrapper = new QueryWrapper<SeckillSessionEntity>()  
		.between("start_time", getStartTime(), getEndTime());  
	List<SeckillSessionEntity> seckillSessionEntities = this.list(queryWrapper);  
	List<SeckillSessionEntity> list = seckillSessionEntities.stream().map(session -> {  
	List<SeckillSkuRelationEntity> skuRelationEntities = seckillSkuRelationService.list(new QueryWrapper<SeckillSkuRelationEntity>()  
		.eq("promotion_session_id", session.getId()));  
		session.setRelationSkus(skuRelationEntities);  
		return session;  
	}).collect(Collectors.toList());  
	return list;  
}  
  
//当前天数的 00:00:00
private String getStartTime() {  
	LocalDate now = LocalDate.now();  
	LocalDateTime time = now.atTime(LocalTime.MIN);  
	String format = time.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));  
	return format;  
}  
  
//当前天数+2 23:59:59..  
private String getEndTime() {  
	LocalDate now = LocalDate.now();  
	LocalDateTime time = now.plusDays(2).atTime(LocalTime.MAX);  
	String format = time.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));  
	return format;  
}
```
coupon服务的SeckillSessionEntity
``` java
@TableField(exist = false)
private List<SeckillSkuRelationEntity> relationSkus;
```

seckill服务中新建SeckillSessionWithSkusVo
``` java
@Data  
public class SeckillSessionWithSkusVo {  
  
    private Long id;  
    /**  
    * 场次名称  
    */  
    private String name;  
    /**  
    * 每日开始时间  
    */  
    private Date startTime;  
    /**  
    * 每日结束时间  
    */  
    private Date endTime;  
    /**  
    * 启用状态  
    */  
    private Integer status;  
    /**  
    * 创建时间  
    */  
    private Date createTime;  
      
    private List<SeckillSkuVo> relationSkus;  
  
}
```
seckill服务中新建SeckillSkuVo
``` java
@Data  
public class SeckillSkuVo {  
  
    private Long id;  
    /**  
    * 活动id  
    */  
    private Long promotionId;  
    /**  
    * 活动场次id  
    */  
    private Long promotionSessionId;  
    /**  
    * 商品id  
    */  
    private Long skuId;  
    /**  
    * 秒杀价格  
    */  
    private BigDecimal seckillPrice;  
    /**  
    * 秒杀总量  
    */  
    private Integer seckillCount;  
    /**  
    * 每人限购数量  
    */  
    private Integer seckillLimit;  
    /**  
    * 排序  
    */  
    private Integer seckillSort;  
  
}
```
seckill服务中新建SecKillSkuRedisTo
``` java
@Data  
public class SecKillSkuRedisTo {  
  
    private Long id;  
    /**  
    * 活动id  
    */  
    private Long promotionId;  
    /**  
    * 活动场次id  
    */  
    private Long promotionSessionId;  
    /**  
    * 商品id  
    */  
    private Long skuId;  
    /**  
    * 秒杀价格  
    */  
    private BigDecimal seckillPrice;  
    /**  
    * 秒杀总量  
    */  
    private Integer seckillCount;  
    /**  
    * 每人限购数量  
    */  
    private Integer seckillLimit;  
    /**  
    * 排序  
    */  
    private Integer seckillSort;  
      
    private SkuInfoVo skuInfoVo;  
      
    //当前商品秒杀的开始时间  
    private Long startTime;  
      
    //当前商品秒杀的结束时间  
    private Long endTime;  
      
    //当前商品秒杀的随机码  
    private String randomCode;  
  
}
```
seckill服务中新建SkuInfoVo
``` java
@Data  
public class SkuInfoVo {  
  
    private Long skuId;  
    /**  
    * spuId  
    */  
    private Long spuId;  
    /**  
    * sku名称  
    */  
    private String skuName;  
    /**  
    * sku介绍描述  
    */  
    private String skuDesc;  
    /**  
    * 所属分类id  
    */  
    private Long catalogId;  
    /**  
    * 品牌id  
    */  
    private Long brandId;  
    /**  
    * 默认图片  
    */  
    private String skuDefaultImg;  
    /**  
    * 标题  
    */  
    private String skuTitle;  
    /**  
    * 副标题  
    */  
    private String skuSubtitle;  
    /**  
    * 价格  
    */  
    private BigDecimal price;  
    /**  
    * 销量  
    */  
    private Long saleCount;  
  
}
```
seckill服务中新建ProductFeignService
``` java
@FeignClient(value = "gulimall-product")  
public interface ProductFeignService {  
  
    @RequestMapping("product/skuinfo/info/{skuId}")  
    R getSkuInfo(@PathVariable("skuId") Long skuId);  
  
}
```
seckill服务中的pom.xml
``` java
<dependency>  
    <groupId>org.redisson</groupId>  
    <artifactId>redisson</artifactId>  
    <version>3.17.6</version>  
</dependency>
```
seckill服务中新建RedissonConfig
``` java
@Configuration  
public class RedissonConfig {  
    @Bean  
    public RedissonClient redissonClient(){  
        Config config = new Config();  
        config.useSingleServer().setAddress("redis://192.168.56.10:6379");  
        RedissonClient redissonClient = Redisson.create(config);  
        return redissonClient;  
    }  
}
```
![](/GuliMall/Pasted_image_20230402194914.png)
![](/GuliMall/Pasted_image_20230402194933.png)


#### 查询秒杀商品
seckill服务的SecKillController
``` java
@Autowired  
private SecKillService secKillService;  
  
/**  
* 当前时间可以参与秒杀的商品信息  
* @return  
*/  
@GetMapping(value = "/currentSeckillSkus")  
@ResponseBody  
public R currentSeckillSkus() {  
    //获取到当前可以参加秒杀商品的信息  
    List<SecKillSkuRedisTo> vos = secKillService.getCurrentSeckillSkus();  
      
    return R.ok().setData(vos);  
}
```
seckill的SecKillServiceImpl
``` java
//前时间可以参与秒杀的商品信息  
@Override  
public List<SecKillSkuRedisTo> getCurrentSeckillSkus() {  
    //1.确定当前时间与那个秒杀场次  
    Set<String> keys = redisTemplate.keys(SESSION_CACHE_PREFIX + "*");  
    long time = System.currentTimeMillis();  
    for (String key : keys) {  
        String replace = key.replace(SESSION_CACHE_PREFIX, "");  
        String[] split = replace.split("_");  
        long start = Long.parseLong(split[0]);  
        long end = Long.parseLong(split[1]);  
        //当前秒杀活动处于有效期内  
        if (time > start && time < end) {  
            //2.获取当前场需要的所有商品信息  
            List<String> range = redisTemplate.opsForList().range(key, -100, 100);  
            BoundHashOperations<String, String, String> hashOps = redisTemplate.boundHashOps(SECKILL_CHARE_PREFIX);  
            List<String> list = hashOps.multiGet(range);
            if (list != null) {  
                List<SecKillSkuRedisTo> collect = list.stream().map((item) -> {  
                    SecKillSkuRedisTo to = JSON.parseObject((String) item, SecKillSkuRedisTo.class);  
                    // to.setRandomCode(null);//当前秒杀开始就需要随机码  
                    return to;  
                }).collect(Collectors.toList());  
                return collect;  
            }  
            break;  
        }  
    }  
    return null;  
}
```

gateway服务的application.yml新增秒杀服务的映射
``` yml
- id: gulimall_seckill_rout  
    uri: lb://gulimall-seckill  
    predicates:  
    - Host=seckill.gulimall.com
```
hosts文件中新dns解析记录
``` sh
192.168.56.10   seckill.gulimall.com
```

前端页面修改，略

#### 秒杀页面渲染
seckill服务的SecKillController
``` java
/**  
* 根据skuId获取该商品是否有秒杀活动  
*  
* @param skuId skuId  
* @return R  
*/  
@GetMapping("/sku/seckill/{skuId}")  
@ResponseBody  
    public R getSkuSeckillInfo(@PathVariable("skuId") Long skuId) {  
    SecKillSkuRedisTo skuRedisTos = secKillService.getSkuSeckillInfo(skuId);  
    return R.ok().setData(skuRedisTos);  
}
```
seckill的SecKillServiceImpl
``` java
//根据skuId获取该商品是否有秒杀活动  
@Override  
public SecKillSkuRedisTo getSkuSeckillInfo(Long skuId) {  
    List<SecKillSkuRedisTo> skuRedisTos = new ArrayList<>();  
      
    //1、获取redis中所有参与秒杀的key信息  
    BoundHashOperations<String, String, String> hashOps = redisTemplate.boundHashOps(SKUKILL_CACHE_PREFIX);  
    Set<String> keys = hashOps.keys();  
    if (keys != null && keys.size() > 0) {  
        //定义正则  
        String regx = "\\d_" + skuId;  
        for (String key : keys) {  
            if (key.matches(regx)) {  
                //正则匹配成功返回数据  
                String json = hashOps.get(key);  
                SecKillSkuRedisTo skuRedisTo = JSON.parseObject(json, SecKillSkuRedisTo.class);  
                //2、处理随机码，只有到商品秒杀时间才能显示随机码  
                if (skuRedisTo != null) {  
                    Long startTime = skuRedisTo.getStartTime();  
                    long currentTime = System.currentTimeMillis();  
                    if (currentTime < startTime) {  
                        //秒杀还未开始，将随机码置空  
                        skuRedisTo.setRandomCode(null);  
                    }  
                    return skuRedisTo;
                }  
            }  
        }  
        return skuRedisTos;  
    }  
    return null;  
}
```

product服务新建SeckillFeignService
``` java
@FeignClient(value = "gulimall-seckill")  
public interface SeckillFeignService {  
  
    /**  
    * 根据skuId获取该商品是否有秒杀活动  
    * @param skuId skuId  
    * @return R  
    */  
    @GetMapping("/sku/seckill/{skuId}")  
    R getSkuSeckillInfo(@PathVariable("skuId") Long skuId);  
  
}
```
product服务的SkuItemVo
``` java
//6、秒杀商品的优惠信息  
private SeckillInfoVo seckillInfo;
```
product服务的SeckillInfoVo
``` java
@Data  
public class SeckillInfoVo {  
  
    /**  
    * 活动id  
    */  
    private Long promotionId;  
      
    /**  
    * 活动场次id  
    */  
    private Long promotionSessionId;  
    /**  
    * 商品id  
    */  
    private Long skuId;  
      
    /**  
    * 商品秒杀随机码  
    */  
    private String randomCode;  
    /**  
    * 秒杀价格  
    */  
    private BigDecimal seckillPrice;  
    /**  
    * 秒杀总量  
    */  
    private Integer seckillCount;  
    /**  
    * 每人限购数量  
    */  
    private Integer seckillLimit;  
    /**  
    * 排序  
    */  
    private Integer seckillSort;  
    //当前商品秒杀的开始时间  
    private Long startTime;  
      
    //当前商品秒杀的结束时间  
    private Long endTime;  
  
}
```
product服务的新建SeckillSkuVo
``` java
@Data  
public class SeckillSkuVo implements Serializable {  
  
    /**  
    * id  
    */  
    private Long id;  
    /**  
    * 活动id  
    */  
    private Long promotionId;  
    /**  
    * 活动场次id  
    */  
    private Long promotionSessionId;  
    /**  
    * 商品id  
    */  
    private Long skuId;  
    /**  
    * 秒杀价格  
    */  
    private BigDecimal seckillPrice;  
    /**  
    * 秒杀总量  
    */  
    private BigDecimal seckillCount;  
    /**  
    * 每人限购数量  
    */  
    private BigDecimal seckillLimit;  
    /**  
    * 排序  
    */  
    private Integer seckillSort;  
    /**  
    * 当前商品的开始时间  
    */  
    private Long startTime;  
    /**  
    * 当前商品的结束时间  
    */  
    private Long endTime;  
    /**  
    * 秒杀随机码  
    */  
    private String randomCode;  
    /**  
    * 商品的详细信息  
    */  
    private SkuInfoVo skuInfoTo;  
  
}
```
product服务的SkuInfoVo
``` java
@Data  
public class SkuInfoVo implements Serializable {  
  
    /**  
    * skuId  
    */  
    private Long skuId;  
    /**  
    * spuId  
    */  
    private Long spuId;  
    /**  
    * sku名称  
    */  
    private String skuName;  
    /**  
    * sku介绍描述  
    */  
    private String skuDesc;  
    /**  
    * 所属分类id  
    */  
    private Long catalogId;  
    /**  
    * 品牌id  
    */  
    private Long brandId;  
    /**  
    * 默认图片  
    */  
    private String skuDefaultImg;  
    /**  
    * 标题  
    */  
    private String skuTitle;  
    /**  
    * 副标题  
    */  
    private String skuSubtitle;  
    /**  
    * 价格  
    */  
    private BigDecimal price;  
    /**  
    * 销量  
    */  
    private Long saleCount;  
  
}
```
product服务的
``` java
@Override  
public SkuItemVo item(Long skuId) throws ExecutionException, InterruptedException {  
    SkuItemVo skuItemVo = new SkuItemVo();  
      
    //1、sku基本信息的获取 
    pms_sku_infoCompletableFuture<SkuInfoEntity> infoFuture = CompletableFuture.supplyAsync(() -> {  
        SkuInfoEntity info = this.getById(skuId);  
        skuItemVo.setInfo(info);  
        return info;  
    }, executor);  
      
    //3、获取spu的销售属性组合  
    CompletableFuture<Void> saleAttrFuture = infoFuture.thenAcceptAsync((res) -> {  
        List<SkuItemVo.SkuItemSaleAttrVo> saleAttrVos = skuSaleAttrValueService.getSaleAttrBySpuId(res.getSpuId());  
        skuItemVo.setSaleAttr(saleAttrVos);  
    }, executor);  
          
    //4、获取spu的介绍 
    pms_spu_info_descCompletableFuture<Void> descFuture = infoFuture.thenAcceptAsync((res) -> {  
        SpuInfoDescEntity spuInfoDescEntity = spuInfoDescService.getById(res.getSpuId());  
        skuItemVo.setDesc(spuInfoDescEntity);  
    }, executor);  
      
    //5、获取spu的规格参数信息  
    CompletableFuture<Void> baseAttrFuture = infoFuture.thenAcceptAsync((res) -> {  
        List<SkuItemVo.SpuItemAttrGroupVo> attrGroupVos = attrGroupService.getAttrGroupWithAttrsBySpuId(res.getSpuId(), res.getCatalogId());  
        skuItemVo.setGroupAttrs(attrGroupVos);  
    }, executor);  
      
      
    //2、sku的图片信息 
    pms_sku_imagesCompletableFuture<Void> imageFuture = CompletableFuture.runAsync(() -> {  
        List<SkuImagesEntity> imagesEntities = skuImagesService.getImagesBySkuId(skuId);  
        skuItemVo.setImages(imagesEntities);  
    }, executor);  
      
    CompletableFuture<Void> seckillFuture = CompletableFuture.runAsync(() -> {  
        //3、远程调用查询当前sku是否参与秒杀优惠活动  
        R skuSeckilInfo = seckillFeignService.getSkuSeckillInfo(skuId);  
        if (skuSeckilInfo.getCode() == 0) {  
            //查询成功  
            if (skuSeckilInfo.getData() != null) {  
                SeckillInfoVo seckilInfoData = skuSeckilInfo.getData("data", new TypeReference<SeckillInfoVo>() {  
                });  
                skuItemVo.setSeckillSkuVo(seckilInfoData);  
                long currentTime = System.currentTimeMillis();  
                if (currentTime > seckilInfoData.getEndTime()) {  
                    skuItemVo.setSeckillSkuVo(null);  
                }  
            }
        }  
    }, executor);  
      
    //等到所有任务都完成  
    CompletableFuture.allOf(saleAttrFuture, descFuture, baseAttrFuture, imageFuture, seckillFuture).get();  
    // CompletableFuture.allOf(saleAttrFuture, descFuture, baseAttrFuture, imageFuture).get();  
      
    // 非异步编排  
    /*//1、sku基本信息的获取 pms_sku_infoSkuInfoEntity info = this.getById(skuId);  
    skuItemVo.setInfo(info);  
    Long spuId = info.getSpuId();  
    Long catalogId = info.getCatalogId();  
      
    //2、sku的图片信息 pms_sku_imagesList<SkuImagesEntity> imagesEntities = skuImagesService.getImagesBySkuId(skuId);  
    skuItemVo.setImages(imagesEntities);  
      
    //3、获取spu的销售属性组合  
    List<SkuItemVo.SkuItemSaleAttrVo> saleAttrVos = skuSaleAttrValueService.getSaleAttrBySpuId(spuId);  
    skuItemVo.setSaleAttr(saleAttrVos);  
      
    //4、获取spu的介绍 pms_spu_info_descSpuInfoDescEntity spuInfoDescEntity = spuInfoDescService.getById(spuId);  
    skuItemVo.setDesc(spuInfoDescEntity);  
      
    //5、获取spu的规格参数信息  
    List<SkuItemVo.SpuItemAttrGroupVo> attrGroupVos = attrGroupService.getAttrGroupWithAttrsBySpuId(spuId, catalogId);  
    skuItemVo.setGroupAttrs(attrGroupVos);*/  
      
    return skuItemVo;  
}
```

前端修改页面，略

#### 秒杀系统设计
秒杀（高并发）系统关注的问题
![](/GuliMall/Pasted_image_20230329222101.png)
![](/GuliMall/Pasted_image_20230329222139.png)

#### 登录检查
前端页面修改，略

seckill服务的pom.xml
``` xml
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
seckill服务的qpplicaiont.properties
``` properties
spring.session.store-type=redis
```
然后将其他服务的GulimallSessionConfig复制到seckill服务，并且加上@EnableRedisHttpSession注解

seckill服务的
``` java
@Component  
public class LoginUserInterceptor implements HandlerInterceptor {  
  
    public static ThreadLocal<MemberResponseVo> loginUser = new ThreadLocal<>();  
  
    @Override  
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {  
  
        String uri = request.getRequestURI();  
        AntPathMatcher antPathMatcher = new AntPathMatcher();  
        boolean match = antPathMatcher.match("/kill", uri);  
          
        if (match) {  
            HttpSession session = request.getSession();  
            //获取登录的用户信息  
            MemberResponseVo attribute = (MemberResponseVo) session.getAttribute(AuthServerConstant.LOGIN_USER);  
            if (attribute != null) {  
            //把登录后用户的信息放在ThreadLocal里面进行保存  
                loginUser.set(attribute);  
                return true;  
            } else {  
                //未登录，返回登录页面  
                response.setContentType("text/html;charset=UTF-8");  
                PrintWriter out = response.getWriter();  
                out.println("<script>alert('请先进行登录，再进行后续操作！');location.href='http://auth.gulimall.com/login.html'</script>");  
                // session.setAttribute("msg", "请先进行登录");  
                // response.sendRedirect("http://auth.gulimall.com/login.html");  
                return false;  
            }  
        }  
        return true;  
    }  
      
    @Override  
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {  
      
    }  
      
    @Override  
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {  
      
    }  
}
```
seckill服务新增SeckillWebConfig
``` java
/**  
* springWEB自定义配置  
*/  
@Configuration  
public class SeckillWebConfig implements WebMvcConfigurer {  
    /**  
    * 添加自定义的拦截器  
    * @param registry 注册  
    */  
    @Override  
    public void addInterceptors(InterceptorRegistry registry) {  
        registry.addInterceptor(new LoginUserInterceptor()).addPathPatterns("/**");  
    }  
}
```

#### 秒杀流程 & 秒杀效果完成
seckill服务的SecKillController
``` java
@Autowired  
private RabbitTemplate rabbitTemplate;

/**  
* 商品进行秒杀(秒杀开始)  
* @param killId  
* @param key  
* @param num  
* @return  
*/  
@GetMapping(value = "/kill")  
public String seckill(@RequestParam("killId") String killId,  
                    @RequestParam("key") String key,  
                    @RequestParam("num") Integer num,  
                    Model model) {  
  
    String orderSn = null;  
    try {  
        //1、判断是否登录  
        orderSn = secKillService.kill(killId,key,num);  
        model.addAttribute("orderSn",orderSn);  
    } catch (Exception e) {  
        e.printStackTrace();  
    }  
    return "success";  
}
```
seckill服务的SecKillServiceImpl
``` java
//当前商品进行秒杀（秒杀开始）  
@Override  
    public String kill(String killId, String key, Integer num) throws InterruptedException {  
    long s1 = System.currentTimeMillis();  
    MemberResponseVo respVo = LoginUserInterceptor.loginUser.get();  
      
    //1、获取当前秒杀商品的详细信息  
    BoundHashOperations<String, String, String> hashOps = redisTemplate.boundHashOps(SKUKILL_CACHE_PREFIX);  
      
    String json = hashOps.get(killId);  
    if (StringUtils.isEmpty(json)) {  
        return null;  
    } else {  
        SecKillSkuRedisTo redis = JSON.parseObject(json, SecKillSkuRedisTo.class);  
        //校验合法性  
        Long startTime = redis.getStartTime();  
        Long endTime = redis.getEndTime();  
        long time = new Date().getTime();  
          
        long ttl = endTime - time;  
          
        //1、校验时间的合法性  
        if (time >= startTime && time <= endTime) {  
            //2、校验随机码和商品id  
            String randomCode = redis.getRandomCode();  
            String skuId = redis.getPromotionSessionId() + "_" + redis.getSkuId();  
            if (randomCode.equals(key) && killId.equals(skuId)) {  
                //3、验证购物数量是否合理  
                if (num <= redis.getSeckillLimit()) {  
                //4、验证这个人是否已经购买过。幂等性; 如果只要秒杀成功，就去占位。 userId_SessionId_skuId//SETNX  
                String redisKey = respVo.getId() + "_" + skuId;  
                //自动过期  
                Boolean aBoolean = redisTemplate.opsForValue().setIfAbsent(redisKey, num.toString(), ttl, TimeUnit.MILLISECONDS);  
                if (aBoolean) {  
                    //占位成功说明从来没有买过  
                    RSemaphore semaphore = redissonClient.getSemaphore(SKU_STOCK_SEMAPHORE + randomCode);  
                    //120 20ms  
                    boolean b = semaphore.tryAcquire(num);  
                    if (b) {  
                        //秒杀成功;  
                        //快速下单。发送MQ消息 10msString timeId = IdWorker.getTimeId();  
                        SeckillOrderTo orderTo = new SeckillOrderTo();  
                        orderTo.setOrderSn(timeId);  
                        orderTo.setMemberId(respVo.getId());  
                        orderTo.setNum(num);  
                        orderTo.setPromotionSessionId(redis.getPromotionSessionId());  
                        orderTo.setSkuId(redis.getSkuId());  
                        orderTo.setSeckillPrice(redis.getSeckillPrice());  
                        rabbitTemplate.convertAndSend("order-event-exchange", "order.seckill.order", orderTo);  
                        long s2 = System.currentTimeMillis();  
                        log.info("耗时...{}", (s2 - s1));  
                        return timeId;  
                    }  
                return null;  
              
            } else {  
                //说明已经买过了  
                return null;  
            }  
              
            }  
            } else {  
            return null;  
            }  
          
        } else {  
            return null;  
        }  
    }  
      
    return null;  
}
```
seckill服务中的pom.xml
``` xml
<dependency>  
    <groupId>org.springframework.boot</groupId>  
    <artifactId>spring-boot-starter-amqp</artifactId>  
</dependency>
```
seckill服务的application.properties
``` properties
spring.rabbitmq.virtual-host=/
spring.rabbitmq.host=192.168.56.10
```
seckill服务新建
``` java
@Configuration  
public class MyRabbitConfig {  
  
    /**  
    * 使用JSON序列化机制，进行消息转换  
    */  
    @Bean  
    public MessageConverter messageConverter(){  
      
        return new Jackson2JsonMessageConverter();  
    }  
  
}
```
common服务中新建
``` java
@Data  
public class SeckillOrderTo {  
  
    private String orderSn; //订单号  
    private Long promotionSessionId; //活动场次id  
    private Long skuId; //商品id  
    private BigDecimal seckillPrice; //秒杀价格  
    private Integer num; //购买数量  
    private Long memberId;//会员id；  
  
}
```
order服务的MyRabbitmqConfig中
``` java
/**  
* 商品秒杀队列  
* @return  
*/  
@Bean  
public Queue orderSecKillOrrderQueue() {  
    Queue queue = new Queue("order.seckill.order.queue", true, false, false);  
    return queue;  
}  
  
@Bean  
public Binding orderSecKillOrrderQueueBinding() {  
    //String destination, DestinationType destinationType, String exchange, String routingKey,  
    // Map<String, Object> arguments  
    Binding binding = new Binding(  
        "order.seckill.order.queue",  
        Binding.DestinationType.QUEUE,  
        "order-event-exchange",  
        "order.seckill.order",  
        null);  
      
    return binding;  
}
```
order服务的OrderServiceImpl
``` java
@Override  
public void createSeckillOrder(SeckillOrderTo seckillOrder) {  
    //TODO 保存订单信息  
    OrderEntity orderEntity = new OrderEntity();  
    orderEntity.setOrderSn(seckillOrder.getOrderSn());  
    orderEntity.setMemberId(seckillOrder.getMemberId());  
      
    orderEntity.setStatus(OrderStatusEnum.CREATE_NEW.getCode());  
      
    BigDecimal multiply = seckillOrder.getSeckillPrice().multiply(new BigDecimal("" + seckillOrder.getNum()));  
    orderEntity.setPayAmount(multiply);  
    this.save(orderEntity);  
      
    //TODO 保存订单项信息  
    OrderItemEntity orderItemEntity = new OrderItemEntity();  
    orderItemEntity.setOrderSn(seckillOrder.getOrderSn());  
    orderItemEntity.setRealAmount(multiply);  
    //TODO 获取当前SKU的详细信息进行设置 productFeignService.getSpuInfoBySkuId()orderItemEntity.setSkuQuantity(seckillOrder.getNum());  
      
    orderItemService.save(orderItemEntity);  
}
```

#### 秒杀页面完成
前端页面修改，略
seckill的pom.xml
``` xml
<dependency>  
    <groupId>org.springframework.boot</groupId>  
    <artifactId>spring-boot-starter-thymeleaf</artifactId>  
</dependency>
```
seckill的application.properties
``` properties
spring.thymeleaf.cache=false
```

### Sentinel
#### 高并发方法&介绍
![](/GuliMall/Pasted_image_20230329222101.png)
![](/GuliMall/Pasted_image_20230329222139.png)

* 什么是熔断
    A服务调用 B 服务的某个功能，由于网络不稳定问题，或者 B 服务卡机，导致功能时间超长。如果这样子的次数太多。我们就可以直接将 B 断路了 (A 不再请求 B 接口)，凡是调用 B 的直接返回降级数据，不必等待 B 的超长执行。 这样 B 的故障问题，就不会级联影响到 A。
* 什么是降级
    整个网站处于流量高峰期，服务器压力剧增，根据当前业务情况及流量，对一些服务和页面进行有策略的降级[停止服务，所有的调用直接返回降级数据]。以此缓解服务器资源的的压力，以保证核心业务的正常运行，同时也保持了客户和大部分客户的得到正确的相应。
* 异同
    * 相同点:
        1. 为了保证集群大部分服务的可用性和可靠性，防止崩溃，牺牲小我
        2. 用户最终都是体验到某个功能不可用
    * 不同点:
        1. 熔断是被调用方故障，触发的系统主动规则
        2. 降级是基于全局考虑，停止一些正常服务，释放资源
* 什么是限流
    对打入服务的请求流量进行控制，使服务能够承担不超过自己能力的流量压力

#### 基本概念
官方文档：[介绍 · alibaba/Sentinel Wiki (github.com)](https://github.com/alibaba/Sentinel/wiki/%E4%BB%8B%E7%BB%8D)

#### 整合SpringBoot
common服务的pom.xml
``` java
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId>
</dependency>
```
下载对应版本的的文件，[Releases · alibaba/Sentinel (github.com)](https://github.com/alibaba/Sentinel/releases)
seckill的application.properties
``` properties
spring.cloud.sentinel.transport.dashboard=localhost:8080  
spring.cloud.sentinel.transport.port=8719
```

#### 自定义流控响应
导入依赖
``` xml
<dependency>  
    <groupId>org.springframework.boot</groupId>  
    <artifactId>spring-boot-starter-actuator</artifactId>  
</dependency>
```
seckill的application.properties
``` properties
management.endpoints.web.exposure.include=*
```
seckill服务新建SeckillSentinelConfig
``` java
@Configuration  
public class SeckillSentinelConfig implements BlockExceptionHandler {  
  
    @Override  
    public void handle(HttpServletRequest request, HttpServletResponse response, BlockException e) throws Exception {  
        R error = R.error(BizCodeEnume.TOO_MANY_REQUEST.getCode(), BizCodeEnume.TOO_MANY_REQUEST.getMsg());
        response.setCharacterEncoding("UTF-8");  
        response.setContentType("application/json");  
        response.getWriter().write(JSON.toJSONString(error));  
    }  
  
}
```
common的BizCodeEnume中
``` java
TOO_MANY_REQUEST(10002, "请求流量过大"),
```

#### 全服务引入
在auth, cart, coupon, gateway, member, order, product, search, third-party, ware服务的pom引入
``` xml
<dependency>  
    <groupId>org.springframework.boot</groupId>  
    <artifactId>spring-boot-starter-actuator</artifactId>  
</dependency>
```
并且在配置文件中加上
``` properties
spring.cloud.sentinel.transport.dashboard=localhost:8080  
management.endpoints.web.exposure.include=*
```

order服务的循环依赖，略

#### 流控模式&效果
流控模式：直接、关联、链路
流控效果：快速失败、预热、排队等候

#### 熔断降级
product服务的application.properties
``` properties
feign.sentinel.enabled=true
```
pruduct服务新建SeckillFeignServiceFallBack，SeckillFeignService上使用`@FeignClient(value = "gulimall-seckill", fallback = SeckillFeignServiceFallBack.class)`
``` java
@Slf4j  
@Component  
public class SeckillFeignServiceFallBack implements SeckillFeignService {  
    @Override  
    public R getSkuSeckillInfo(Long skuId) {  
        log.info("熔断方法调用...getSkuSeckillInfo");  
        return R.error(BizCodeEnume.TOO_MANY_REQUEST.getCode(), BizCodeEnume.TOO_MANY_REQUEST.getMsg());  
    }  
}
```
降级策略：平均响应时间、异常比例、异常数

在每个服务配置中都开启远程调用的熔断降级
``` properties
feign.sentinel.enabled=true
```

#### 自定义受保护资源
方式一：
seckill服务的SecKillServiceImpl
``` java
//当前时间可以参与秒杀的商品信息  
@Override  
public List<SecKillSkuRedisTo> getCurrentSeckillSkus() {  
    try (Entry entry = SphU.entry("seckillSku")) {  
        //1.确定当前时间与那个秒杀场次  
        Set<String> keys = redisTemplate.keys(SESSION_CACHE_PREFIX + "*");  
        long time = System.currentTimeMillis();  
        for (String key : keys) {  
            String replace = key.replace(SESSION_CACHE_PREFIX, "");  
            String[] split = replace.split("_");  
            long start = Long.parseLong(split[0]);  
            long endTime = Long.parseLong(split[1]);  
            //当前秒杀活动处于有效期内  
            if (time > start && time < endTime) {  
                //2.获取当前场需要的所有商品信息  
                List<String> range = redisTemplate.opsForList().range(key, -100, 100);  
                BoundHashOperations<String, String, String> hashOps = redisTemplate.boundHashOps(SKUKILL_CACHE_PREFIX);  
                List<String> list = hashOps.multiGet(range);  
                if (list != null) {  
                    List<SecKillSkuRedisTo> collect = list.stream().map((item) -> {  
                    SecKillSkuRedisTo to = JSON.parseObject((String) item, SecKillSkuRedisTo.class);  
                    // to.setRandomCode(null);//当前秒杀开始就需要随机码  
                    return to;  
                    }).collect(Collectors.toList());  
                    return collect;  
                }  
                break;  
            }  
        }  
    } catch (BlockException e) {  
        log.error("资源被限流", e.getMessage());  
    }  
    return null;  
}
```

方式二
在seckill服务SecKillServiceImpl的getCurrentSeckillSkus上使用`@SentinelResource(value = "getCurrentSeckillSkusResource",blockHandler = "blockHandler")`注解，并新增降级方法
``` java
public List<SecKillSkuRedisTo> blockHandler(BlockException e){  
    log.error("getCurrentSeckillSkusResource被限流了..");  
    return null;  
}
```
blockHandler 函数会在原方法被限流/降级/系统保护的时候调用，而 fallback 函数会针对所有类型的异常。

#### 网关流控
gateway服务的pom.xml中引入依赖
``` xml
<dependency>  
    <groupId>com.alibaba.cloud</groupId>  
    <artifactId>spring-cloud-alibaba-sentinel-gateway</artifactId>  
    <version>2.1.0.RELEASE</version>  
</dependency>
```
网关限流相较于不同的熔断降级，可以有更多的选择。比如对指定的网关限流，对API分组

#### 定制网关流控返回
gateway服务中新建
``` java
@Configuration  
public class SentinelGatewayConfig implements BlockRequestHandler {  
  
    //网关限流了请求，就会调用此回调 Mono Flux@Override  
    public Mono<ServerResponse> handleRequest(ServerWebExchange exchange, Throwable t) {  
        R error = R.error(BizCodeEnume.TOO_MANY_REQUEST.getCode(), BizCodeEnume.TOO_MANY_REQUEST.getMsg());  
        String errJson = JSON.toJSONString(error);  
          
        // Mono<String> aaa = Mono.just("aaa");  
        Mono<ServerResponse> body = ServerResponse.ok().body(Mono.just(errJson), String.class);  
        return body;  
    }  
      
    // FlowRule flowRule = new FlowRule();  
    // flowRule.setRefResource("gulimall_seckill_route");  
    //// flowRule.set  
    // FlowRuleManager.loadRules(Arrays.asList(flowRule));  
}
```

### Sleuth-链路追踪
#### 基本概念&整合
基本术语
* Span (跨度): 基本工作单元，发送一个远程调度任务 就会产生一个 Span，Span 是一个64 位 ID 唯一标识的，Trace 是用另一个 64 位ID 唯一标识的，Span 还有其他数据信息，比如摘要、时间戳事件、Span 的ID、以及进度ID。
* Trace (跟踪) : 一系列 Span 组成的一个树状结构。请求一个微服务系统的 API 接口，这个API 接口，需要调用多个微服务，调用每个微服务都会产生一个新的 Span，所有由这个请求产生的 Span 组成了这个 Trace。
* Annotation(标注): 用来及时记录一个事件的，一些核心注解用来定义一个请求的开始和结束 。这些注解包括以下:
    * cs - cient Sent -客户端发送一个请求，这个注解描述了这个 Span 的开始
    * sr- Server Received-服务端获得请求并准备开始处理它,如果将其 sr 减去 cs 时间戳便可得到网络传输的时间。
    * ss- Server Sent (服务端发送响应) -该注解表明请求处理的完成(当请求返回客户端)，如果 ss 的时间戳减去 sr 时间戳，就可以得到服务器请求的时间。
    * cr- Client Received (客户端接收响应) -此时 Span 的结束，如果 cr 的时间戳减去cs 时间戳便可以得到整个请求所消耗的时间。
![](/GuliMall/Pasted_image_20230413214622.png)

整合Sleuth
在common服务中引入依赖
``` xml
<dependency>  
    <groupId>com.alibaba.cloud</groupId>  
    <artifactId>spring-cloud-alibaba-dependencies</artifactId>  
    <version>2021.0.1.0</version>  
</dependency>
```
``` xml
<!--链路追踪-->  
<dependency>  
    <groupId>org.springframework.cloud</groupId>  
    <artifactId>spring-cloud-starter-sleuth</artifactId>  
</dependency>
```
在配置中开启日志服务
``` properties
logging.level.org.springframework.cloud.openfeign:debug  
logging.level.org.springframework.cloud.sleuth: debug
```

#### 整合Zipkin效果
在docker中安装zipkin服务器
``` sh
docker run -d -p 9411:9411 openzipkin/zipkin
```
在common中引入依赖
``` xml
<!--zipkin中包含了sleuth-->  
<dependency>  
    <groupId>org.springframework.cloud</groupId>  
    <artifactId>spring-cloud-starter-zipkin</artifactId>  
</dependency>
```
在添加相关配置
``` properties
#服务追踪  
spring.zipkin.base-url=http://192.168.56.10:9411/  
spring.zipkin.discovery-client-enabled=false  
spring.zipkin.sender.type=web  
spring.sleuth.sampler.probability=1
```

zipkin数据的数据持久化，略

#### zipkin界面分析
略

### 分布式高级篇总结
略

