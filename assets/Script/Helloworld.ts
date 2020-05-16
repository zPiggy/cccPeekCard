import PeekCard from "./PeekCard";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Helloworld extends cc.Component {

    @property(PeekCard)
    peekCard: PeekCard = undefined;


    async start() {


        if (false) {
            window["peekCard"] = this.peekCard;

            ////// 拖动 PeekCard 脚本到场景中 执行组件的 reset 操作即可自动创建好所有节点
            console.log("预先做好的搓牌节点 ", PeekCard.DirType[this.peekCard.dirType]);

            this.peekCard.node.active = true;

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

            this.peekCard.init();   //搓牌前必须调用
        }
        else {
            this.peekCard.node.active = false;
            this.buildPeekCard(PeekCard.DirType.horizontal);
        }

    }

    async buildPeekCard(dirType: PeekCard["dirType"]) {
        console.log("动态创建搓牌节点 ", PeekCard.DirType[dirType]);
        var peekCard = new cc.Node("PeekCard").addComponent(PeekCard);
        window["peekCard"] = peekCard;
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
        await peekCard.setFinger("HelloWorld", cc.size(40, 80));

        peekCard.directionLength = 20;
        peekCard.moveSpeed = 0.6;
        peekCard.angleFixed = 5;

        peekCard.init();    //搓牌前必须调用


    }

}
