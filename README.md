# cccPeekCard
cocosCreator mask遮罩实现360°搓牌(咪牌)

核心思路是: 遮罩与遮罩下子节点反向移动和旋转实现牌背禁止不动和牌面随触摸移动

如果想移植到cocos2dx 或者cocos2dx-js下需要更换向量API 以及实现坐标系的转换 左下角坐标系 <==> 锚点坐标系

使用方法

        var peekCardNode = new PeekCardNode();
        parent.addChild(peekCardNode)
        peekCardNode.setCardSize(cc.size(250, 360))
        peekCardNode.setCardBack("Cards/Cards051");
        peekCardNode.setCardFace("Cards/Cards000");
        peekCardNode.setShadow("shadow");//可以不适用阴影
        peekCardNode.setFinger("HelloWorld", 1);//可以不使用手指
        peekCardNode.setFinger("HelloWorld", 2);

        peekCardNode.init(); //触摸前必须调用
