const { ccclass, property } = cc._decorator;
/**
 * 搓牌类
 *
 * @export
 * @class PokerCard
 * @extends {cc.Node}
 * @example
 * var peekCardNode = new PeekCardNode();
 * parent.addChild(peekCardNode)
 * peekCardNode.setCardSize(cc.size(250, 330))
 * peekCardNode.setCardBack("Cards/Cards051");
 * peekCardNode.setCardFace("Cards/Cards000");
 * peekCardNode.setShadow("shadow");
 * peekCardNode.setFinger("HelloWorld", 1);
 * peekCardNode.setFinger("HelloWorld", 2);
 * 
 * peekCardNode.init();
 */
@ccclass
export default class PeekCardNode extends cc.Node {
    mask: cc.Mask = undefined;      //总遮罩
    back: cc.Sprite = undefined;    //牌背
    face: cc.Sprite = undefined;    //牌面
    faceMask: cc.Mask = undefined;  //牌面遮罩
    shadow: cc.Sprite = undefined;  //牌面阴影

    finger1: cc.Sprite = undefined;  //手指1
    finger2: cc.Sprite = undefined;  //手指2

    _cardSize: cc.Size = undefined;
    //触摸事件
    _tStartPos: cc.Vec2 = undefined;
    _moveDirection: cc.Vec2 = undefined;
    _rotation: number = 0;
    _isOpenCard: boolean = false;
    _isMoveStart: boolean = false;
    /**
     * 手指被使用数组
     * 数组下标与顶点下标一致 表示该顶点正在被该手指遮住
     */
    _infinger: cc.Sprite[] = [];
    // _isOver: boolean = false
    constructor() {
        super("PeekCardNode");
        this.setContentSize(1280, 720)  //默认大小

        this.mask = new cc.Node().addComponent(cc.Mask);
        this.addChild(this.mask.node);
        //添加牌背牌面
        this.back = new cc.Node().addComponent(cc.Sprite);
        this.face = new cc.Node().addComponent(cc.Sprite);
        this.mask.node.addChild(this.back.node)
        this.mask.node.addChild(this.face.node)
        //添加阴影
        this.faceMask = new cc.Node().addComponent(cc.Mask);
        this.faceMask.type = cc.Mask.Type.IMAGE_STENCIL;        //遮罩类型设置为与牌面图相同
        this.faceMask.alphaThreshold = 0.1;
        this.face.node.addChild(this.faceMask.node);

        this.shadow = new cc.Node().addComponent(cc.Sprite);
        this.shadow.node.parent = this.faceMask.node;
        this.shadow.node.setAnchorPoint(0, 0.5)

        this.finger1 = new cc.Node().addComponent(cc.Sprite);
        this.finger2 = new cc.Node().addComponent(cc.Sprite);
        this.addChild(this.finger1.node)
        this.addChild(this.finger2.node)

        this.on(cc.Node.EventType.TOUCH_START, this.touchStart, this);
        this.on(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
        this.on(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
        this.on(cc.Node.EventType.TOUCH_CANCEL, this.touchCancel, this);

    }
    touchStart(event?: cc.Event.EventTouch) {
        if (this._isOpenCard) {
            return;
        }
        this._tStartPos = event.getLocation();
    }
    touchMove(event?: cc.Event.EventTouch) {
        if (this._isOpenCard || !this._tStartPos) {
            return;
        }

        let _tEndPos = event.getLocation();         //当前点
        let _prePos = event.getPreviousLocation();  //上一个点
        //定义 开始点到当前点的向量 为移动方向向量
        let startToEndVec = _tEndPos.sub(this._tStartPos);
        let preToEndVec = _tEndPos.sub(_prePos);    //移动向量
        //规定 当移动超过 35 才确定方向 小于40是限制玩家过快的触摸
        let length = startToEndVec.mag();
        if (length >= 35 && length <= 40 && this._isMoveStart === false) {
            this._isMoveStart = true;
            this._moveDirection = startToEndVec;
            this._rotation = this.getSignAngle(this._moveDirection, cc.v2(1, 0));
            cc.log("当前旋转角度::", this._rotation);
            //设置外接矩形
            let size = this.getOutRectSize(this.back.node, this._rotation);
            this.mask.node.setContentSize(size);
            //设置旋转角度
            this.mask.node.rotation = this._rotation;
            this.back.node.rotation = -this._rotation;
            this.face.node.rotation = this._rotation;
            this.shadow.node.rotation = -this._rotation;
            //根据移动方向 设置牌面和阴影 移动前的起始位置
            let quadrant = this.getQuadrant(this._moveDirection);
            let faceVertexs = this.getNodeVertexByNodeSpaceAR(this.face.node);
            switch (quadrant) {
                case 1:
                case 5:
                    //牌面在遮罩左边
                    this.face.node.setPosition(-this.mask.node.width, this.back.node.y);
                    //阴影设置在牌面的右下顶点
                    this.shadow.node.setPosition(faceVertexs[2]);
                    break;
                case 2:
                case 6:
                    //牌面在遮罩右边
                    this.face.node.setPosition(-this.mask.node.width, -this.back.node.y);
                    //阴影设置在牌面的左下顶点
                    this.shadow.node.setPosition(faceVertexs[3]);
                    break;
                case 3:
                case 7:
                    //牌面在遮罩右边
                    this.face.node.setPosition(-this.mask.node.width, -this.back.node.y);
                    //阴影设置在牌面的左上顶点
                    this.shadow.node.setPosition(faceVertexs[0]);
                    break;
                case 4:
                case 8:
                    //牌面在遮罩左边
                    this.face.node.setPosition(-this.mask.node.width, this.back.node.y);
                    //阴影设置在牌面的右上顶点
                    this.shadow.node.setPosition(faceVertexs[1]);
                    break;
                default:
                    cc.error("移动的方向向量为cc.Vec2(0, 0)");
                    this._isMoveStart = false;
                    break;
            }

        }
        else if (this._isMoveStart) {
            //移动向量在方向向量上的分量
            let unitV = preToEndVec.project(this._moveDirection);
            let _unitV = unitV.neg();   //反向移动向量
            //移动
            this.moveByVec2(this.mask.node, unitV, 2);
            this.moveByVec2(this.back.node, _unitV, 2);
            this.moveByVec2(this.face.node, unitV, 2);
            this.moveByVec2(this.shadow.node, _unitV, 2);
            //显示手指
            let vertexs = this.getNodeVertexByWorldSpaceAR(this.face.node, -20);
            let maskPolygon = this.getNodeVertexByWorldSpaceAR(this.mask.node);
            //判断顶点是否落在多边形内
            let length = 0;
            for (let i = 0; i < vertexs.length; i++) {
                //判断当前手指是否已经被此顶点使用
                let finger = this._infinger[i];
                //判断顶点是否落在遮罩内
                if (cc.Intersection.pointInPolygon(vertexs[i], maskPolygon)) {
                    if (!finger) {
                        if (length >= 2) {
                            //游戏结束
                            this._isOpenCard = true;
                            this.touchEnd();
                        }
                        else if (!this.finger1.node.active) {
                            this._infinger[i] = this.finger1;
                            finger = this.finger1;
                        }
                        else if (!this.finger2.node.active) {
                            this._infinger[i] = this.finger2;
                            finger = this.finger2;
                        }
                    }
                    if (finger) {
                        length++;
                        finger.node.active = true;
                        finger.node.setPosition(finger.node.parent.convertToNodeSpaceAR(vertexs[i]))
                        finger.node.rotation = -this._rotation;
                    }
                }
            }
            let localPos = this.mask.node.getPosition();
            if (Math.abs(localPos.x) >= Math.abs(this.mask.node.width / 2) || Math.abs(localPos.y) >= Math.abs(this.mask.node.height / 2)) {
                //开牌
                this._isOpenCard = true;
                this.touchEnd();
            }
            if (unitV.x * this._moveDirection.x < 0 && unitV.y * this._moveDirection.y < 0 && length == 0) {
                this.touchEnd();
                this._tStartPos = undefined;
            }

        }

    }
    touchEnd(event?: cc.Event.EventTouch) {
        cc.log("搓牌结束");

        if (this._isOpenCard) {
            this.openCard();
            this._isOpenCard = true;    //重置状态为已经开牌
        }
        else {
            this.init();
        }
    }
    touchCancel() {

    }

    init() {
        if (!this._cardSize) {
            this._cardSize = this.back.node.getContentSize();
        }
        //总遮罩复位
        this.mask.node.setContentSize(this._cardSize);
        this.mask.node.setRotation(0);
        this.mask.node.setPosition(0, 0)
        //牌背牌面复位
        this.back.node.setRotation(0);
        this.back.node.setPosition(0, 0);
        this.back.node.setContentSize(this._cardSize)
        this.face.node.setRotation(0);
        this.face.node.setPosition(0, 0);
        // this.face.node.setPosition(-this._cardSize.width, -this._cardSize.height)
        this.face.node.setPosition(-this._cardSize.width, 0)
        this.face.node.setContentSize(this._cardSize)

        //牌面遮罩复位
        this.faceMask.node.setRotation(0);
        this.faceMask.node.setPosition(0, 0);
        this.faceMask.node.setContentSize(this._cardSize);
        //阴影复位
        this.shadow.node.setRotation(0);
        this.shadow.node.height = this._cardSize.height * 2;  //阴影长度
        this.shadow.node.setPosition(this.shadow.node.width, this.shadow.node.height);

        this.finger1.node.active = false;
        this.finger2.node.active = false;

        this._infinger = [];        //清空手指使用列表

        this._isOpenCard = false;   //改变状态 未开牌

        this._isMoveStart = false;

        this._rotation = 0;

    }
    setCardSize(size) {
        this._cardSize = size;
    }
    setCardBack(spf: cc.SpriteFrame | string) {
        if (typeof spf === "string") {
            cc.loader.loadRes(spf, cc.SpriteFrame, (err, spf) => {
                this.back.spriteFrame = spf;
                if (this._cardSize) {
                    this.back.node.setContentSize(this._cardSize)
                }
            })
        }
        else {
            this.back.spriteFrame = spf;
        }
        this.back.node.setContentSize(this._cardSize)
    }
    setCardFace(spf: cc.SpriteFrame | string) {
        if (typeof spf === "string") {
            cc.loader.loadRes(spf, cc.SpriteFrame, (err, spf) => {
                this.face.spriteFrame = spf;
                this.faceMask.spriteFrame = spf;
                if (this._cardSize) {
                    this.face.node.setContentSize(this._cardSize)
                    this.faceMask.node.setContentSize(this._cardSize)
                }
            })
        }
        else {
            this.face.spriteFrame = spf;
            this.faceMask.spriteFrame = spf;
        }
        this.face.node.setContentSize(this._cardSize)
        this.faceMask.node.setContentSize(this._cardSize)
    }
    setShadow(spf: cc.SpriteFrame | string) {
        if (typeof spf === "string") {
            cc.loader.loadRes(spf, cc.SpriteFrame, (err, spf) => {
                this.shadow.spriteFrame = spf;
                if (this._cardSize) {
                    this.shadow.node.height = this._cardSize.height * 2
                }
            })
        }
        else {
            this.shadow.spriteFrame = spf;
        }
        this.shadow.node.height = this._cardSize.height * 2

    }
    setFinger(spf: cc.SpriteFrame | string, index: 1 | 2) {
        if (typeof spf === "string") {
            cc.loader.loadRes(spf, cc.SpriteFrame, (err, spf) => {
                this["finger" + index].spriteFrame = spf;
                this["finger" + index].node.setContentSize(60, 100);
            })
        }
        else {
            this["finger" + index].spriteFrame = spf;
            this["finger" + index].node.setContentSize(60, 100);
        }
    }

    openCard() {
        this.init();
        //显示牌面
        this.face.node.setPosition(0, 0);
    }
    /**
     * 将节点沿 unitVec 方向移动 length 个 unitVec 长度
     *
     * @param {cc.Node} node
     * @param {cc.Vec2} unitVec
     * @param {number} length
     * @memberof PeekCardNode
     */
    moveByVec2(node: cc.Node, unitVec: cc.Vec2, length: number = 1) {
        var wp = node.parent.convertToWorldSpaceAR(node.getPosition());
        wp = cc.v2(wp.x + unitVec.x * length, wp.y + unitVec.y * length);
        var localP = node.parent.convertToNodeSpaceAR(wp);
        node.setPosition(localP);
    }
    /**
     * 获得 v1->v2 的夹角角度(带方向)
     * 
     * @param {cc.Vec2} v1
     * @param {cc.Vec2} v2
     * @memberof PeekCardNode
     * @returns -180~180的角度
     */
    getSignAngle(v1: cc.Vec2, v2: cc.Vec2) {
        var radian = v1.signAngle(v2);
        var angle = 180 / Math.PI * radian;
        return angle;
    }
    /**
     * 获得最小外接矩形的大小
     *
     * @param {cc.Node} inRect 内接矩形
     * @param {number} angle -180~180的角度
     * @memberof PeekCardNode
     */
    getOutRectSize(inRect: cc.Node, angle: number) {
        angle = Math.abs(angle);
        if (angle > 90 && angle <= 180) {
            angle = 180 - angle;
        }

        var radian = Math.PI / 180 * angle;
        var size = cc.size(0, 0);
        var w = inRect.height * Math.sin(radian) + inRect.width * Math.cos(radian);
        var h = inRect.height * Math.cos(radian) + inRect.width * Math.sin(radian);
        size.width = w;
        size.height = h;
        return size;
    }

    /**
     * 获得节点的顶点坐标列表(基于世界坐标系)
     * 从左上角顶点开始顺时针存入数组
     *
     * @param {cc.Node} node 
     * @param {number} [offset=0] 偏移量 即放大或缩放顶点围成矩形的大小
     * @returns cc.Vec2[] 顶点数组
     * @memberof PeekCardNode
     */
    getNodeVertexByWorldSpaceAR(node: cc.Node, offset: number = 0) {
        let vertexs = this.getNodeVertexByNodeSpaceAR(node, offset);
        for (let i = 0; i < vertexs.length; i++) {
            vertexs[i] = node.convertToWorldSpaceAR(vertexs[i]);
        }
        return vertexs;
    }
    /**
     * 获得节点的顶点坐标列表(基于节点坐标系)
     * 从左上角顶点开始顺时针存入数组
     * 
     * @param {cc.Node} node
     * @param {number} [offset=0] 偏移量 即放大或缩放顶点围成矩形的大小
     * @returns cc.Vec2[] 顶点数组
     * @memberof PeekCardNode
     */
    getNodeVertexByNodeSpaceAR(node: cc.Node, offset: number = 0) {
        var x = node.width / 2 + offset;
        var y = node.height / 2 + offset;
        let lt = cc.v2(-x, y);
        let rt = cc.v2(x, y);
        let rb = cc.v2(x, -y);
        let lb = cc.v2(-x, -y);

        return [lt, rt, rb, lb];
    }
    /**
     * 获取坐标所在象限
     * @returns  1 2 3 4 表示1~4象限 5x正轴 6y正轴 7x负轴 8y负轴 9原点
     */
    getQuadrant(vec: cc.Vec2) {
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


}
