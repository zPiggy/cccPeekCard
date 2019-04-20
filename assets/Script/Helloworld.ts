import PeekCardNode from "./PeekCardNode";
import PeekCard from "../Prefab/PeekCard/PeekCard";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Helloworld extends cc.Component {

    @property(PeekCard)
    peekCard: PeekCard = undefined;

    start() {
        this.buildPeekCardNode();

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
}
