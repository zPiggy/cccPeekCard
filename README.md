# cccPeekCard
cocosCreator mask遮罩实现360°搓牌(咪牌)

核心思路是: 遮罩与遮罩下子节点反向移动和旋转实现牌背禁止不动和牌面随触摸移动

如果想移植到cocos2dx 或者cocos2dx-js下需要更换向量API 以及实现坐标系的转换 左下角坐标系 <==> 锚点坐标系

使用方法

    //由于搓牌内部API改为同步 ，所以最好使用一个函数创建搓牌节点
    async buildPeekCardNode() {
        var peekCardNode = new PeekCardNode();
        this.node.addChild(peekCardNode)
        peekCardNode.setCardSize(cc.size(250, 360))
        await peekCardNode.setCardBack("Cards/Cards051");
        await peekCardNode.setCardFace("Cards/Cards000");
        await peekCardNode.setShadow("shadow");
        //peekCardNode.width = 40;      //根据需求调整阴影宽度
        await peekCardNode.setFinger("HelloWorld", 1);  //不设置手指则不显示
        await peekCardNode.setFinger("HelloWorld", 2);
        //以下三个属性根据实际需求进行调整
        peekCardNode._directionLength = 20;     
        peekCardNode._moveSpeed = 0.6;
        peekCardNode.angleFixed = 15;

        peekCardNode.init();    //搓牌前必须调用
    }
