import BaseComponent from "../../Script/Base/BaseComponent";

const { ccclass, property } = cc._decorator;
@ccclass
export default class PeekCard extends BaseComponent {

    @property(cc.Mask)
    mask: cc.Mask = undefined;
    @property({
        type: cc.Node,
        tooltip: "mask/cardBack"
    })
    cardBack: cc.Node = undefined;
    @property({
        type: cc.Node,
        tooltip: "mask/cardFace"
    })
    cardFace: cc.Node = undefined;
    @property({
        type: cc.Mask,
        tooltip: "mask/cardFace/shadowMask"
    })
    shadowMask: cc.Mask = undefined;
    @property({
        type: cc.Node,
        tooltip: "mask/cardFace/shadowMask/shadow"
    })
    shadow: cc.Node = undefined;

    @property(cc.Node)
    finger1: cc.Node = undefined;
    @property(cc.Node)
    finger2: cc.Node = undefined;
    ////// 运行状态属性 ///////
    /**
     * 方向向量最小长度(滑动灵敏度) 值越大灵敏度越低
     * 在手机上手指较粗需要将滑动灵敏度降低 否则翻拍方向可能不是你预想的方向
     */
    _directionLength: number = 5;
    /**
     * 此速度是触摸移动速度的倍数
     * 备注：牌面移动速度是触摸速度的2倍 所以真正的翻牌速度是触摸速度的0.5倍
     */
    _moveSpeed: number = 0.5;
    /**
     * 此修正角度为触摸方向在水平或者竖直方向的偏移角度在修正角度内时，修正角度为水平或者竖直
     * 使更容易操作水平和竖直方向的搓牌
     */
    angleFixed: number = 10;

    _isOpenCard: boolean = false;    //是否已经开牌 开牌后禁止一切触摸事件
    _isMoveStart: boolean = false;
    _cardSize: cc.Size = undefined;
    _tStartPos: cc.Vec2 = undefined; //触摸开始点
    _tMoveVec: cc.Vec2 = undefined;  //触摸移动向量
    _rotation: number = 0;
    _inFingers: number[] = [];

    _finishCallBack: Function = undefined;    //搓牌完成回调函数

    start() {
        this.node.on(cc.Node.EventType.TOUCH_START, this._touchStart, this)
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this._touchMove, this)
        this.node.on(cc.Node.EventType.TOUCH_END, this._touchEnd, this)
    }
    /**
     * 设置搓牌完成回调
     * @param {Function} callback 
     */
    setFinishCallBack(callback: Function) {
        this._finishCallBack = callback;
    }
    /**
     * 初始化搓牌(每次开始搓牌前必须调用)
     *
     * @date 2019-04-16
     * @memberof PeekCard
     */
    init() {
        if (!this._cardSize) {
            this._cardSize = this.cardBack.getContentSize();
        }
        this._initCardNode(this.mask.node, this._cardSize);
        this._initCardNode(this.cardBack, this._cardSize);
        this._initCardNode(this.cardFace, this._cardSize);
        this._initCardNode(this.shadowMask.node, this._cardSize);
        //设置牌面在遮罩左边
        this.cardFace.setPosition(-this.mask.node.width, 0);
        //设置阴影大小以及位置
        this.shadow.setRotation(0);
        this.shadow.height = Math.sqrt(Math.pow(this._cardSize.height, 2) + Math.pow(this._cardSize.width, 2)) * 2
        this.shadow.width = 40;
        var x = this.cardFace.width / 2 + this.shadowMask.node.width / 2;
        var y = this.cardFace.height / 2 + this.shadowMask.node.height / 2
        this.shadow.setPosition(x, y);
        //隐藏手指
        this._initFinger();

        this._initStatus();
    }
    _touchStart(event?: cc.Event.EventTouch) {
        if (this._isOpenCard) {
            return;
        }
        this._tStartPos = event.getLocation();
    }
    _touchMove(event?: cc.Event.EventTouch) {
        if (this._isOpenCard || !this._tStartPos) {
            return;
        }
        let _tEndPos = event.getLocation();
        let _tPrePos = event.getPreviousLocation();
        if (_tEndPos.equals(_tPrePos)) {    //忽略相同点
            return;
        }
        //规定方向向量为: 开始点到当前点的向量。 规定移动向量为: 上一个点到当前点的向量
        let startToEndVec = _tEndPos.sub(this._tStartPos);
        let preToEndVec = _tEndPos.sub(_tPrePos);

        //规定 达到最小长度才确定方向
        let length = startToEndVec.mag();

        cc.log("1", _tEndPos, _tPrePos, this._tStartPos, length);

        if (this._isMoveStart == false && length >= this._directionLength) {
            this._isMoveStart = true;
            this._tMoveVec = this._fixedDirection(startToEndVec);
            this._rotation = this._getSignAngle(this._tMoveVec, cc.v2(1, 0));
            // cc.log("当前旋转角度::", this._rotation);
            //设置外接矩形
            let size = this._getOutRectSize(this.cardBack, this._rotation);
            this.mask.node.setContentSize(size);
            //设置旋转角度
            this.mask.node.rotation = this._rotation;
            this.cardBack.rotation = -this._rotation;
            this.cardFace.rotation = this._rotation;
            this.shadow.rotation = -this._rotation;
            //根据移动方向 设置牌面和阴影 移动前的起始位置
            let quadrant = this._getQuadrant(this._tMoveVec);
            let faceVertexs = this._getNodeVertexByNodeSpaceAR(this.cardFace);
            switch (quadrant) {
                case 1:
                case 5:
                    //牌面在遮罩左边
                    this.cardFace.setPosition(-this.mask.node.width, this.cardBack.y);
                    //阴影设置在牌面的右下顶点
                    this.shadow.setPosition(faceVertexs[2]);
                    break;
                case 2:
                case 6:
                    //牌面在遮罩右边
                    this.cardFace.setPosition(-this.mask.node.width, -this.cardBack.y);
                    //阴影设置在牌面的左下顶点
                    this.shadow.setPosition(faceVertexs[3]);
                    break;
                case 3:
                case 7:
                    //牌面在遮罩右边
                    this.cardFace.setPosition(-this.mask.node.width, -this.cardBack.y);
                    //阴影设置在牌面的左上顶点
                    this.shadow.setPosition(faceVertexs[0]);
                    break;
                case 4:
                case 8:
                    //牌面在遮罩左边
                    this.cardFace.setPosition(-this.mask.node.width, this.cardBack.y);
                    //阴影设置在牌面的右上顶点
                    this.shadow.setPosition(faceVertexs[1]);
                    break;
                default:
                    cc.error("移动的方向向量为cc.Vec2(0, 0)");      //走进来算我输
                    this._isMoveStart = false;
                    break;
            }

        }
        else if (this._isMoveStart) {
            //移动向量在方向向量上的分量
            let unitV = preToEndVec.project(this._tMoveVec);
            let _unitV = unitV.neg();   //反向移动向量
            //移动
            this._moveByVec2(this.mask.node, unitV, 2);
            this._moveByVec2(this.cardBack, _unitV, 2);
            this._moveByVec2(this.cardFace, unitV, 2);
            this._moveByVec2(this.shadow, _unitV, 2);
            //显示手指
            let vertexs = this._getNodeVertexByWorldSpaceAR(this.cardFace, -10);
            let maskPolygon = this._getNodeVertexByWorldSpaceAR(this.mask.node);
            //判断顶点是否落在多边形内
            this._inFingers = [];
            for (let i = 0; i < vertexs.length; i++) {
                if (cc.Intersection.pointInPolygon(vertexs[i], maskPolygon)) {
                    this._inFingers.push(i);
                }
            }
            for (let i = 0; i < this._inFingers.length; i++) {
                var index = this._inFingers[i]; //顶点下标
                var finger: cc.Node = this["finger" + (i + 1)];
                if (finger) {
                    finger.active = true;
                    finger.setPosition(finger.parent.convertToNodeSpaceAR(vertexs[index]))
                    finger.rotation = -this._rotation;
                }
            }

            length = this._inFingers.length;
            //隐藏不必要的手指
            if (length == 0) {
                this.finger1.active = false
                this.finger2.active = false
            }
            else if (length == 1) {
                this.finger2.active = false
            }
            if (this._canOpen()) {
                //开牌
                this.openCard();
            }
            if (unitV.x * this._tMoveVec.x <= 0 && unitV.y * this._tMoveVec.y <= 0 && length == 0) {
                this._touchEnd();
                this._tStartPos = undefined;
                console.log("禁止继续回退");
            }
        }

    }
    _touchEnd(event?: cc.Event.EventTouch) {
        if (this._isOpenCard || !this._tStartPos) {
            return;
        }
        this.init();
    }

    setContentSize(w: number | cc.Size, h?: number) {
        var size = this._getSize(w, h)
        this.node.setContentSize(size);
    }
    setCardSize(w: number | cc.Size, h?: number) {
        var size = this._getSize(w, h);
        this._cardSize = size;

        this.mask.node.setContentSize(size);
        this.cardBack.setContentSize(size);
        this.cardFace.setContentSize(size);
        this.shadowMask.node.setContentSize(size);
        this.shadow.setContentSize(size.width, size.height * 2)
    }

    async setCardBack(spf: string | cc.SpriteFrame) {
        spf = await this._setNodeSpriteFrame(this.cardBack, spf)
        //设置阴影的遮罩模板
        this.shadowMask.spriteFrame = spf;
        this.shadowMask.type = cc.Mask.Type.IMAGE_STENCIL;
        this.shadowMask.alphaThreshold = 0.1;
    }
    async setCardFace(spf: string | cc.SpriteFrame) {
        this._setNodeSpriteFrame(this.cardFace, spf);

    }
    /**
     * 设置阴影 
     * 注意:根据具体阴影图需要具体设置阴影精灵的锚点和宽高大小
     *
     * @date 2019-04-16
     * @param {(string | cc.SpriteFrame)} spf
     * @memberof PeekCard
     */
    async setShadow(spf: string | cc.SpriteFrame) {
        this._setNodeSpriteFrame(this.shadow, spf);
    }
    async setFinger(spf: string | cc.SpriteFrame, index: 1 | 2) {
        this._setNodeSpriteFrame(this["finger" + index], spf);
    }

    /**
     * 检测是否开牌
     */
    _canOpen() {
        let localPos = this.mask.node.getPosition();
        var length = localPos.mag();//遮罩初始坐标是(0, 0) 此处坐标即向量
        var maxLength = this.mask.node.width;
        if (length > maxLength / 2) {
            return true;
        }
        return false;
    }
    openCard() {
        this.init();
        cc.log("开牌");
        //显示牌面
        this.cardFace.setPosition(0, 0);
        this._isOpenCard = true;
        if (typeof this._finishCallBack === "function") {
            this._finishCallBack();
        }
    }

    /**
     * 获得最小外接矩形的大小
     *
     * @date 2019-04-16
     * @param {cc.Node} inRect 内接矩形
     * @param {number} angle -180~180的角度
     * @memberof PeekCardNode
     */
    _getOutRectSize(inRect: cc.Node, angle: number) {
        angle = Math.abs(angle);
        if (angle > 90 && angle <= 180) {
            angle = 180 - angle;
        }
        var radian = Math.PI / 180 * angle;
        var w = inRect.height * Math.sin(radian) + inRect.width * Math.cos(radian);
        var h = inRect.height * Math.cos(radian) + inRect.width * Math.sin(radian);
        return cc.size(w, h);
    }
    /**
     * 将节点沿 unitVec 方向移动 length 个 unitVec 长度
     *
     * @date 2019-04-16
     * @param {cc.Node} node
     * @param {cc.Vec2} unitVec
     * @param {number} length
     * @memberof PeekCardNode
     */
    _moveByVec2(node: cc.Node, unitVec: cc.Vec2, length: number = 1) {
        var wp = node.parent.convertToWorldSpaceAR(node.getPosition());
        wp = cc.v2(wp.x + unitVec.x * length, wp.y + unitVec.y * length);
        var localP = node.parent.convertToNodeSpaceAR(wp);
        node.setPosition(localP);
    }
    /**
     * 获得 v1=>v2 的夹角
     *
     * @date 2019-04-16
     * @param {cc.Vec2} v1
     * @param {cc.Vec2} v2
     * @returns -180 ~ 180
     * @memberof PeekCard
     */
    _getSignAngle(v1: cc.Vec2, v2: cc.Vec2) {
        var radian = v1.signAngle(v2);
        var angle = 180 / Math.PI * radian;
        return angle;
    }
    /**
     * 修正水平或竖直方向
     *
     * @date 2019-04-19
     * @param {cc.Vec2} moveDirection
     * @returns
     * @memberof PeekCard
     */
    _fixedDirection(moveDirection: cc.Vec2) {
        if (this.angleFixed) {
            var fAngle = this.angleFixed;
            var xVec = cc.v2(1, 0)
            var angle = this._getSignAngle(moveDirection, xVec);
            if ((angle <= (fAngle + 0) && angle >= (-fAngle + 0)) ||
                (angle <= (fAngle + (-180)) || angle >= (-fAngle + 180))
            ) {
                moveDirection = moveDirection.project(xVec);
                return moveDirection;
            }
            var yVec = cc.v2(0, 1);
            var angle = this._getSignAngle(moveDirection, yVec);
            if ((angle <= (fAngle + 0) && angle >= (-fAngle + 0)) ||
                (angle <= (fAngle + (-180)) || angle >= (-fAngle + 180))
            ) {
                moveDirection = moveDirection.project(yVec);
                return moveDirection;
            }
        }
        return moveDirection;
    }
    /**
     * 获得节点的顶点坐标列表(基于世界坐标系)
     * 从左上角顶点开始顺时针存入数组
     *
     * @date 2019-04-16
     * @param {cc.Node} node 
     * @param {number} [offset=0] 偏移量 即放大或缩放顶点围成矩形的大小
     * @returns cc.Vec2[] 顶点数组
     * @memberof PeekCardNode
     */
    _getNodeVertexByWorldSpaceAR(node: cc.Node, offset: number = 0) {
        let vertexs = this._getNodeVertexByNodeSpaceAR(node, offset);
        for (let i = 0; i < vertexs.length; i++) {
            vertexs[i] = node.convertToWorldSpaceAR(vertexs[i]);
        }
        return vertexs;
    }
    /**
     * 获得节点的顶点坐标列表(基于节点坐标系)
     * 从左上角顶点开始顺时针存入数组
     * 
     * @date 2019-04-16
     * @param {cc.Node} node
     * @param {number} [offset=0] 偏移量 即放大或缩放顶点围成矩形的大小
     * @returns cc.Vec2[] 顶点数组
     * @memberof PeekCardNode
     */
    _getNodeVertexByNodeSpaceAR(node: cc.Node, offset: number = 0) {
        var left = node.width * node.anchorX + offset;
        var right = node.width * (1 - node.anchorX) + offset;
        var bottom = node.height * node.anchorY + offset;
        var top = node.height * (1 - node.anchorY) + offset;
        let lt = cc.v2(-left, top);
        let rt = cc.v2(right, top);
        let rb = cc.v2(right, -bottom);
        let lb = cc.v2(-left, -bottom);

        return [lt, rt, rb, lb];
    }
    /**
     * 获取坐标所在象限
     * @returns  1 2 3 4 表示1~4象限 5x正轴 6y正轴 7x负轴 8y负轴 9原点
     */
    _getQuadrant(vec: cc.Vec2) {
        if (vec.x == 0 && vec.y == 0) {
            return 9; //原点
        } else if (vec.x == 0 && vec.y > 0) {
            return 6 //y正轴
        } else if (vec.x == 0 && vec.y < 0) {
            return 8 //y负轴
        } else if (vec.x > 0 && vec.y == 0) {
            return 5 //x正轴
        } else if (vec.x < 0 && vec.y == 0) {
            return 7 //x负轴
        } else if (vec.x > 0 && vec.y > 0) {
            return 1 //第一象限
        } else if (vec.x < 0 && vec.y > 0) {
            return 2 //第二象限
        } else if (vec.x < 0 && vec.y < 0) {
            return 3//第三象限
        } else if (vec.x > 0 && vec.y < 0) {
            return 4 //第四象限
        }
        else {
            cc.error("判断象限错误::" + JSON.stringify(vec));
        }

        return 0;
    }

    _initCardNode(node: cc.Node, size: cc.Size) {
        node.setContentSize(size);
        node.setRotation(0);
        node.setPosition(0, 0);
    }
    _initFinger() {
        this._inFingers = [];
        this.finger1.active = false;
        this.finger2.active = false;
    }
    _initStatus() {
        this._isOpenCard = false; //改变状态 未开牌
        this._isMoveStart = false;
        this._rotation = 0;
    }


    _getSize(x: number | cc.Size, y?: number) {
        if (x == undefined) {
            return cc.size(0, 0);
        }
        else if (x instanceof cc.Size) {
            return x;
        }
        else if (y != undefined) {
            return cc.size(x, y)
        }
        else {
            return cc.size(x, x)
        }
    }
    /**
     * 同步获取精灵帧
     * 
     * @date 2019-04-16
     * @param {string} url 图片路径
     * @returns
     * @memberof PeekCard
     */
    async _loadSpriteFrameSync(url: string) {
        var res = cc.loader.getRes(url, cc.SpriteFrame)
        if (res) {
            return res;
        }
        return new Promise<cc.SpriteFrame>((resolve) => {
            cc.loader.loadRes(url, cc.SpriteFrame, (err, res: cc.SpriteFrame) => {
                resolve(res)
            });
        })
    }
    /**
     * 设置牌相关节点的精灵帧
     *
     * @date 2019-04-16
     * @param {cc.Node} node
     * @param {(string | cc.SpriteFrame)} spf
     * @memberof PeekCard
     */
    async _setNodeSpriteFrame(node: cc.Node, spf: string | cc.SpriteFrame) {
        if (typeof spf === "string") {
            spf = await this._loadSpriteFrameSync(spf)
        }
        node.getComponent(cc.Sprite).spriteFrame = spf;
        return spf;
    }
}
