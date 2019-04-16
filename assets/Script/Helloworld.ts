import PeekCardNode from "./PeekCardNode";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Helloworld extends cc.Component {


    start() {
        var peekCardNode = new PeekCardNode();
        this.node.addChild(peekCardNode)
        peekCardNode.setCardSize(cc.size(250, 360))
        peekCardNode.setCardBack("Cards/Cards051");
        peekCardNode.setCardFace("Cards/Cards000");
        peekCardNode.setShadow("shadow");
        peekCardNode.setFinger("HelloWorld", 1);
        peekCardNode.setFinger("HelloWorld", 2);

        peekCardNode.init();
    }
}
