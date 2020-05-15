import PeekCardNode from "./PeekCardNode";
import PeekCard from "../Prefab/PeekCard/PeekCard";
import PeekCardHorizontal from "./PeekCardHorizontal";


export enum DirType {
    horizontal = 0,
    vertical = 1
}

const { ccclass, property } = cc._decorator;

@ccclass
export default class Helloworld extends cc.Component {

    @property(PeekCard)
    peekCard: PeekCard = undefined;

    @property({ type: cc.Enum(DirType), visible: false })
    private _type: DirType = DirType.vertical;

    @property({ type: cc.Enum(DirType) })//暴露到编辑器上的选项 可选方向
    get dirType() { return this._type; }
    set dirType(type) {
        this._type = type;
    }

    start() {

        cc.log(this._type);
        if (this._type == DirType.horizontal) {
            this.buildPeekCardNodeHoz();
        }
        else {
            this.buildPeekCardNode();
        }



        /////////////////
        // this.peekCard.setCardSize(cc.size(270, 390))
        // this.peekCard.setCardBack("Cards/Cards051");
        // this.peekCard.setCardFace("Cards/Cards000");
        // this.peekCard.setShadow("shadow");
        // this.peekCard.setFinger("HelloWorld", 1);
        // this.peekCard.setFinger("HelloWorld", 2);
        // this.peekCard.init();
    }
    async buildPeekCardNode() {
        var peekCardNode = new PeekCardNode();
        this.node.addChild(peekCardNode)
        peekCardNode.setCardSize(cc.size(250, 360))
        await peekCardNode.setCardBack("Cards/Cards051");
        await peekCardNode.setCardFace("Cards/Cards000");
        await peekCardNode.setShadow("shadow");
        await peekCardNode.setFinger("HelloWorld", 1);
        await peekCardNode.setFinger("HelloWorld", 2);
        peekCardNode._directionLength = 20;
        peekCardNode._moveSpeed = 0.6;
        peekCardNode.angleFixed = 15;

        peekCardNode.init();
    }
    /**在原版基础上修改的牌处于横轴方向 */
    async buildPeekCardNodeHoz() {
        var peekCardNode = new PeekCardHorizontal();
        this.node.addChild(peekCardNode)

        peekCardNode.setCardSize(cc.size(360, 250));
        await peekCardNode.setCardBack("Cards/Cards051");
        await peekCardNode.setCardFace("Cards/Cards000");
        await peekCardNode.setShadow("shadow");
        await peekCardNode.setFinger("HelloWorld", 1);
        await peekCardNode.setFinger("HelloWorld", 2);
        peekCardNode._directionLength = 20;
        peekCardNode._moveSpeed = 0.6;
        peekCardNode.angleFixed = 15;

        peekCardNode.init();

        peekCardNode.setFinishCallBack(() => {
            cc.log("搓牌完成。。。。。")
        })
    }

}
