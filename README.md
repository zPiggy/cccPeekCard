# cccPeekCard
cocosCreator mask遮罩实现360°搓牌(咪牌)

核心思路是: 遮罩与遮罩下子节点反向移动和旋转实现牌背禁止不动和牌面随触摸移动

如果想移植到cocos2dx 或者cocos2dx-js下需要更换向量API 以及实现坐标系的转换 左下角坐标系 <==> 锚点坐标系

- 使用方法

        1.拖动 PeekCard 脚本到场景中 执行组件的 reset 操作即可自动创建好所有节点
            // 设置搓牌区域大小 默认是Canvas设计分辨率大小
            this.peekCard.setTouchAreaSize(cc.size(1280, 720))
            // 设置扑克牌大小 (原始纹理不拉伸情况下的大小)
            this.peekCard.setCardSize(cc.size(90 * 3, 130 * 3))
            await this.peekCard.setCardBack("Cards/Cards051");
            await this.peekCard.setCardFace("Cards/Cards000");
            await this.peekCard.setShadow("shadow");
            // 没有特殊需求时不需要设置手指纹理 如果有需要手指的大小和纹理需要在代码中再次调整
            await this.peekCard.setFinger(null);
            this.peekCard.directionLength = 20;
            this.peekCard.moveSpeed = 0.6;
            this.peekCard.angleFixed = 5;

            this.peekCard.init();       //搓牌前必须调用

        2. 动态创建搓牌节点
            var peekCard = new cc.Node("PeekCard").addComponent(PeekCard);
            this.node.addChild(peekCard.node);
            // 动态创建时一定要第一时间设置好原始方向
            peekCard._originalDir = peekCard._dirType = PeekCard.DirType.vertical;
            // 设置搓牌区域大小 默认是Canvas设计分辨率大小
            this.peekCard.setTouchAreaSize(cc.size(1280, 720))
            // 优先设置牌大小
            peekCard.setCardSize(cc.size(90 * 3 - 20, 130 * 3 - 30));
    
            // 动态设置搓牌方向(允许在其他位置调用)
            peekCard.dirType = dirType;
            
            await peekCard.setCardBack("Cards/Cards051");
            await peekCard.setCardFace("Cards/Cards000");
            await peekCard.setShadow("shadow");
            // 设置手指纹理和大小
            await peekCard.setFinger("HelloWorld", cc.size(40, 80));
    
            peekCard.directionLength = 20;
            peekCard.moveSpeed = 0.6;
            peekCard.angleFixed = 5;
    
            peekCard.init();        //搓牌前必须调用
        3. 做成预制动态加载
            .....

- 注意事项

        自行根据项目实际需求调整参数

        由于搓牌可能存在运行时动态设置搓牌方向的操作, 此操作会引起 SpriteFrame 被修改，如果可视范围内存在正在被使用的 SpriteFrame 则会引起形变。
        推荐 
        1.搓牌的扑克牌资源独立
        2.动态设置搓牌方向时确保当前屏幕可视范围内没有其他搓牌资源

    }
