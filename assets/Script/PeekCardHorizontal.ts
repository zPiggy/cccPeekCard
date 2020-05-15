const { ccclass, property } = cc._decorator;
//横版 搓牌
@ccclass
export default class PeekCardHorizontal extends cc.Node {
    mask: cc.Mask = undefined;      //总遮罩
    cardBack: cc.Node = undefined;    //牌背
    cardFace: cc.Node = undefined;    //牌面
    shadowMask: cc.Mask = undefined;  //牌面遮罩
    shadow: cc.Node = undefined;  //牌面阴影

    finger1: cc.Node = undefined;  //手指1
    finger2: cc.Node = undefined;  //手指2

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

    /**是否已经开牌 开牌后禁止一切触摸事件 */
    _isOpenCard: boolean = false;
    /**是否开始移动 */
    _isMoveStart: boolean = false;
    _cardSize: cc.Size = undefined;
    /**触摸开始点 */
    _tStartPos: cc.Vec2 = undefined;
    /**触摸移动向量 */
    _tMoveVec: cc.Vec2 = undefined;
    _rotation: number = 0;
    _inFingers: number[] = [];
    /**搓牌完成回调函数 */
    _finishCallBack: Function = undefined;


    constructor() {
        super("PeekCardHorizontal");
        // this.setContentSize(1280, 720)  //默认大小
        this.setContentSize(720, 1280)
        this.mask = new cc.Node().addComponent(cc.Mask);
        this.addChild(this.mask.node);
        //添加牌背牌面
        this.cardBack = new cc.Node().addComponent(cc.Sprite).node;
        this.cardFace = new cc.Node().addComponent(cc.Sprite).node;
        this.mask.node.addChild(this.cardBack)
        this.mask.node.addChild(this.cardFace)
        //添加阴影
        this.shadowMask = new cc.Node().addComponent(cc.Mask);
        this.shadowMask.type = cc.Mask.Type.IMAGE_STENCIL;        //遮罩类型设置为与牌面图相同
        this.shadowMask.alphaThreshold = 0.1;
        this.cardFace.addChild(this.shadowMask.node);

        this.shadow = new cc.Node().addComponent(cc.Sprite).node;
        this.shadow.parent = this.shadowMask.node;
        this.shadow.setAnchorPoint(0, 0.5);

        this.finger1 = new cc.Node().addComponent(cc.Sprite).node;
        this.finger2 = new cc.Node().addComponent(cc.Sprite).node;
        this.addChild(this.finger1)
        this.addChild(this.finger2)

        this.on(cc.Node.EventType.TOUCH_START, this._touchStart, this);
        this.on(cc.Node.EventType.TOUCH_MOVE, this._touchMove, this);
        this.on(cc.Node.EventType.TOUCH_END, this._touchEnd, this);

    }
    /**
    * 设置搓牌完成回调
    * @param {Function} callback 
    */
    setFinishCallBack(callback: Function) {
        this._finishCallBack = callback;
    }

    init() {
        if (!this._cardSize) {
            this._cardSize = this.cardBack.getContentSize();
        }
        this._initCardNode(this.mask.node, this._cardSize, 90);
        this._initCardNode(this.cardBack, this._cardSize);
        this._initCardNode(this.cardFace, this._cardSize);
        this._initCardNode(this.shadowMask.node, this._cardSize);
        //设置牌面在遮罩左边
        this.cardFace.setPosition(-this.mask.node.width, 0);
        //设置阴影大小以及位置
        this.shadow.setRotation(0);//0
        // this.shadow.height = 40;
        // this.shadow.width = Math.sqrt(Math.pow(this._cardSize.height, 2) + Math.pow(this._cardSize.width, 2)) * 2;

        this.shadow.width = 40;
        this.shadow.height = Math.sqrt(Math.pow(this._cardSize.height, 2) + Math.pow(this._cardSize.width, 2)) * 2;

        var x = this.cardFace.width / 2 + this.shadowMask.node.width / 2;
        var y = this.cardFace.height / 2 + this.shadowMask.node.height / 2
        this.shadow.setPosition(x, y);
        //隐藏手指
        this._initFinger();

        this._initStatus();


        // cc.log("init mask:" + this.mask.node.getContentSize());
        // cc.log("back:" + this.cardBack.getContentSize());
        // cc.log("face:" + this.cardFace.getContentSize());
        // cc.log("shadowmask:" + this.shadowMask.node.getContentSize());
        // cc.log("shadow:" + this.shadow.getContentSize());
    }

    _touchStart(event?: cc.Event.EventTouch) {
        if (this._isOpenCard) {
            return;
        }
        this._tStartPos = event.getLocation();//获得滑动初始点

        // cc.log("touchstart mask:" + this.mask.node.getContentSize());
        // cc.log("back:" + this.cardBack.getContentSize());
        // cc.log("face:" + this.cardFace.getContentSize());
        // cc.log("shadowmask:" + this.shadowMask.node.getContentSize());
        // cc.log("shadow:" + this.shadow.getContentSize());
    }
    _touchMove(event?: cc.Event.EventTouch) {
        if (this._isOpenCard || !this._tStartPos) {
            return;
        }
        let _tEndPos = event.getLocation();
        let _tPrePos = event.getPreviousLocation();
        if (_tEndPos.equals(_tPrePos)) {    //忽略相同点
            cc.log("忽略相同点");
            return;
        }
        //规定方向向量为: 开始点到当前点的向量。 规定移动向量为: 上一个点到当前点的向量
        let startToEndVec = _tEndPos.sub(this._tStartPos);
        let preToEndVec = _tEndPos.sub(_tPrePos);

        //规定 达到最小长度才确定方向
        let length = startToEndVec.mag();
        // cc.log("1", _tEndPos, _tPrePos, this._tStartPos, length);
        if (this._isMoveStart == false && length >= this._directionLength) {
            this._isMoveStart = true;
            this._tMoveVec = this._fixedDirection(startToEndVec);//返回相对水平或垂直方向的阴影向量，或 本身
            this._rotation = this._getSignAngle(this._tMoveVec, cc.v2(1, 0));//得到阴影向量与x轴2者之间的夹角

            // cc.log("当前旋转角度::", this._rotation);
            //设置外接矩形(w,h)
            let size = this._getOutRectSize(this.cardBack, this._rotation);

            this.mask.node.setContentSize(size);
            //设置旋转角度
            // this.mask.node.rotation = this._rotation;
            // this.cardBack.rotation = -this._rotation;
            // this.cardFace.rotation = this._rotation;
            // this.shadow.rotation = -this._rotation;

            this.mask.node.rotation = this._rotation;
            this.cardBack.rotation = -this._rotation + 90;
            this.cardFace.rotation = this._rotation + 90;
            this.shadow.rotation = -90 - this._rotation; //阴影ok

            //根据移动方向 设置牌面和阴影 移动前的起始位置
            let quadrant = this._getQuadrant(this._tMoveVec);
            let faceVertexs = this._getNodeVertexByNodeSpaceAR(this.cardFace);

            // cc.log("faceVertexs:" + faceVertexs);
            switch (quadrant) {
                case 1:
                case 5:
                    //牌面在遮罩左边
                    this.cardFace.setPosition(-this.mask.node.width, this.cardBack.y);
                    //阴影设置在牌面的右下顶点
                    this.shadow.setPosition(faceVertexs[1]);//0    //2
                    cc.log("牌面在遮罩左边,阴影设置在牌面的右下顶点");
                    break;
                case 2:
                case 6:
                    //牌面在遮罩右边
                    this.cardFace.setPosition(-this.mask.node.width, -this.cardBack.y);
                    //阴影设置在牌面的左下顶点
                    this.shadow.setPosition(faceVertexs[2]); //1    //3
                    cc.log("牌面在遮罩右边,阴影设置在牌面的左下顶点");

                    break;
                case 3:
                case 7:
                    //牌面在遮罩右边
                    this.cardFace.setPosition(-this.mask.node.width, -this.cardBack.y);
                    //阴影设置在牌面的左上顶点
                    this.shadow.setPosition(faceVertexs[3]);//2   //0
                    cc.log("牌面在遮罩右边,阴影设置在牌面的左上顶点");

                    break;
                case 4:
                case 8:
                    //牌面在遮罩左边
                    this.cardFace.setPosition(-this.mask.node.width, this.cardBack.y);

                    //阴影设置在牌面的右上顶点
                    this.shadow.setPosition(faceVertexs[0]);//0    //1
                    cc.log("牌面在遮罩左边,阴影设置在牌面的右上顶点");

                    break;
                default://9 原点
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
            let maskPolygon = this._getNodeVertexByWorldSpaceAR(this.mask.node);//4个点 左上开始，顺时针，左下结束
            //判断顶点是否落在多边形内
            this._inFingers = [];
            for (let i = 0; i < vertexs.length; i++) {
                if (cc.Intersection.pointInPolygon(vertexs[i], maskPolygon)) {//牌面的四个点与mask的那个四边形 是否相交
                    this._inFingers.push(i);
                }
            }
            for (let i = 0; i < this._inFingers.length; i++) {
                var index = this._inFingers[i]; //顶点下标
                var finger: cc.Node = this["finger" + (i + 1)];//手指1,2
                if (finger) {
                    finger.active = true;
                    finger.setPosition(finger.parent.convertToNodeSpaceAR(vertexs[index]))//设置基于父节点的坐标
                    finger.rotation = -this._rotation;//设置角度
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


    setCardSize(w: number | cc.Size, h?: number) {
        var size = this._getSize(w, h);
        let size2 = cc.size(250, 360);//横轴
        this._cardSize = size2;

        this.mask.node.setContentSize(size2);
        this.cardBack.setContentSize(size);
        this.cardFace.setContentSize(size);
        this.shadowMask.node.setContentSize(size);
        // this.shadow.setContentSize(size.width, size.height * 2);

        this.shadow.setContentSize(size.width * 2, size.height);
    }

    async setCardBack(spf: string | cc.SpriteFrame) {
        spf = await this._setNodeSpriteFrame(this.cardBack, spf);
        //设置阴影的遮罩模板

        this.shadowMask.spriteFrame = spf;
        this.shadowMask.type = cc.Mask.Type.IMAGE_STENCIL;
        this.shadowMask.alphaThreshold = 0.1;
    }
    async setCardFace(spf: string | cc.SpriteFrame) {
        await this._setNodeSpriteFrame(this.cardFace, spf);
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
        await this._setNodeSpriteFrame(this.shadow, spf);
    }
    async setFinger(spf: string | cc.SpriteFrame, index: 1 | 2) {
        await this._setNodeSpriteFrame(this["finger" + index], spf);
        this["finger" + index].setContentSize(50, 80);
    }

    /**
     * 检测是否开牌
     */
    _canOpen() {
        let localPos = this.mask.node.getPosition();
        var length = localPos.mag();//遮罩初始坐标是(0, 0) 此处坐标即向量
        var maxLength = this.mask.node.width;
        if (length > maxLength / 2) {//遮罩 大于遮罩的1/2
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
        // return cc.size(w, h);
        return cc.size(h, w); //横竖互换
    }
    /**
     * 将节点沿 unitVec 方向移动 length 个 unitVec 长度;
     * (先从父节点下的坐标系的坐标转换成世界坐标，再加减移动的长度，再转换回基于父节点下的坐标)
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
        var radian = v1.signAngle(v2);//求弧度
        var angle = 180 / Math.PI * radian;//求角度 180度 = PI个弧度  180/pi = 1弧度等于多少角度
        return angle;
    }
    /**
     * 修正水平或竖直方向
     *
     * @date 2019-04-19
     * @param {cc.Vec2} moveDirection
     * @returns
     * @memberof PeekCard
     * @returns 返回相对水平或垂直方向的阴影向量，或 本身
     */
    _fixedDirection(moveDirection: cc.Vec2) {
        if (this.angleFixed) {//10
            var fAngle = this.angleFixed;
            var xVec = cc.v2(1, 0); //x轴上的向量
            var angle = this._getSignAngle(moveDirection, xVec);//鼠标点到(1,0)的角度
            //角度<=10并且角度大于-10  或  (角度小于-170 或 角度大于170)
            if ((angle <= (fAngle + 0) && angle >= (-fAngle + 0)) ||
                (angle <= (fAngle + (-180)) || angle >= (-fAngle + 180))
            ) {
                //向量的投影：向量a的长度(模)乘a和b的夹角,就是a在b上的向量投影(标量)，赋予上b向量的方向就是投影向量;
                moveDirection = moveDirection.project(xVec);
                return moveDirection;
            }
            var yVec = cc.v2(0, 1); //y轴上的向量
            var angle = this._getSignAngle(moveDirection, yVec);//鼠标点到(0,1)的角度
            //角度<=10并且角度大于-10  或  (角度小于-170 或 角度大于170)
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
    _getNodeVertexByWorldSpaceAR(node: cc.Node, offset: number = 0): Array<cc.Vec2> {
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
    _getNodeVertexByNodeSpaceAR(node: cc.Node, offset: number = 0): Array<cc.Vec2> {
        var left = node.width * node.anchorX + offset; //乘锚点是为啥？
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
    _getQuadrant(vec: cc.Vec2): number {
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

    _initCardNode(node: cc.Node, size: cc.Size, rotate = 0) {
        node.setContentSize(size);
        node.setRotation(rotate);
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

    /**返回cc.Size */
    _getSize(x: number | cc.Size, y?: number): cc.Size {
        if (x == undefined) {
            return cc.size(0, 0);
        }
        else if (x instanceof cc.Size) {//类型是cc.Size
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
    async _loadSpriteFrameSync(url: string): Promise<cc.SpriteFrame> {
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
    async _setNodeSpriteFrame(node: cc.Node, spf: string | cc.SpriteFrame): Promise<cc.SpriteFrame> {
        if (typeof spf === "string") {
            spf = await this._loadSpriteFrameSync(spf)
        }
        node.getComponent(cc.Sprite).spriteFrame = spf;
        return spf;
    }

}
