(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/assets/Script/Helloworld.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {"use strict";
cc._RF.push(module, 'e1b90/rohdEk4SdmmEZANaD', 'Helloworld', __filename);
// Script/Helloworld.ts

Object.defineProperty(exports, "__esModule", { value: true });
var PeekCardNode_1 = require("./PeekCardNode");
var _a = cc._decorator, ccclass = _a.ccclass, property = _a.property;
var Helloworld = /** @class */ (function (_super) {
    __extends(Helloworld, _super);
    function Helloworld() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Helloworld.prototype.start = function () {
        var peekCardNode = new PeekCardNode_1.default();
        this.node.addChild(peekCardNode);
        peekCardNode.setCardSize(cc.size(250, 360));
        peekCardNode.setCardBack("Cards/Cards051");
        peekCardNode.setCardFace("Cards/Cards000");
        peekCardNode.setShadow("shadow");
        peekCardNode.setFinger("HelloWorld", 1);
        peekCardNode.setFinger("HelloWorld", 2);
        peekCardNode.init();
    };
    Helloworld = __decorate([
        ccclass
    ], Helloworld);
    return Helloworld;
}(cc.Component));
exports.default = Helloworld;

cc._RF.pop();
        }
        if (CC_EDITOR) {
            __define(__module.exports, __require, __module);
        }
        else {
            cc.registerModuleFunc(__filename, function () {
                __define(__module.exports, __require, __module);
            });
        }
        })();
        //# sourceMappingURL=Helloworld.js.map
        