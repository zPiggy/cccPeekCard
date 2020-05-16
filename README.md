# cccPeekCard
cocosCreator mask遮罩实现360°搓牌(咪牌)

核心思路是: 遮罩与遮罩下子节点反向移动和旋转实现牌背禁止不动和牌面随触摸移动

如果想移植到cocos2dx 或者cocos2dx-js下需要更换向量API 以及实现坐标系的转换 左下角坐标系 <==> 锚点坐标系

使用方法
    1. 拖动 PeekCard 脚本到场景中 执行组件的 reset 操作即可自动创建好所有节点
            // 设置扑克牌大小 (原始纹理不拉伸情况下的大小)
            this.peekCard.setCardSize(cc.size(90 * 3, 130 * 3))
            await this.peekCard.setCardBack("Cards/Cards051");
            await this.peekCard.setCardFace("Cards/Cards000");
            await this.peekCard.setShadow("shadow");
            await this.peekCard.setFinger("HelloWorld", 1);
            await this.peekCard.setFinger("HelloWorld", 2);
            // 没有特殊需求时不需要设置手指纹理 如果有需要手指的大小和纹理需要在代码中再次调整
            await this.peekCard.setFinger(null, 1);
            await this.peekCard.setFinger(null, 2);
            this.peekCard._directionLength = 20;
            this.peekCard._moveSpeed = 0.6;
            this.peekCard.angleFixed = 5;

            this.peekCard.init();

    2. 动态创建搓牌节点
            var peekCard = new cc.Node("PeekCard").addComponent(PeekCard);
            this.node.addChild(peekCard.node);
            // 动态创建时一定要第一时间设置好原始方向
            peekCard.originalDirType = PeekCard.DirType.vertical;
            // 优先设置牌大小
            peekCard.setCardSize(cc.size(250, 360));
            // 动态设置搓牌方向(允许在其他位置调用)
            peekCard.dirType = dirType;

            await peekCard.setCardBack("Cards/Cards051");
            await peekCard.setCardFace("Cards/Cards000");
            await peekCard.setShadow("shadow");
            // 没有特殊需求时不需要设置手指纹理 如果有需要手指的大小和纹理需要在代码中再次调整
            await peekCard.setFinger("HelloWorld", 1);
            await peekCard.setFinger("HelloWorld", 2);
            peekCard._directionLength = 20;
            peekCard._moveSpeed = 0.6;
            peekCard.angleFixed = 5;

            peekCard.init();

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
