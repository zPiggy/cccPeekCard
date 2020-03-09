
export enum EMIDir {
    Top = 4,
    Bottom = 1,
    Left = 2,
    Right = 3,
    LeftTop = 5,
    LeftBottom = 6,
    RightTop = 7,
    RightBottom = 8,
}

const { ccclass, property } = cc._decorator;
//(当前脚本所在的节点位置需为0,0)
@ccclass
export default class MiPaiAnyAngle extends cc.Component {
    @property(cc.Node)
    cardBackNode: cc.Node = undefined;

    @property(cc.Node)
    cardValueNode: cc.Node = undefined;

    @property(cc.Node)
    leftNumberMaskNode: cc.Node = undefined;

    @property(cc.Node)
    rightNumberMaskNode: cc.Node = undefined;

    /**牌面 */
    @property(cc.Node)
    trueCardNode: cc.Node = undefined;

    @property(cc.Node)
    maskNode: cc.Node = undefined;

    @property(cc.Node)
    cardMaskNode: cc.Node = undefined;

    @property(cc.Node)
    shadow: cc.Node = undefined;  //牌面阴影

    initPos_cardBack: cc.Vec2 = new cc.Vec2(0, 0);
    /**倒退回原始点 */
    // initPos_cardValue: cc.Vec2 = new cc.Vec2(0, 0);
    initPos_mask: cc.Vec2 = new cc.Vec2(0, 0);

    endPos_mask: cc.Vec2 = new cc.Vec2(0, 0);
    endPos_cardBack: cc.Vec2 = new cc.Vec2(0, 0);
    // endPos_cardValue: cc.Vec2 = new cc.Vec2(0, 0);

    /**是否已经开牌 开牌后禁止一切触摸事件 */
    _isOpenCard: boolean = false;
    /**是否开始移动 */
    _isMoveStart: boolean = false;
    /**触摸开始点 */
    _tStartPos: cc.Vec2 = undefined;
    /**是否横轴方向 */
    // _isHorizontal: boolean = true;
    /**眯牌方向 */
    _miDir = EMIDir.Top;

    /**
     * 方向向量最小长度(滑动灵敏度) 值越大灵敏度越低
     * 在手机上手指较粗需要将滑动灵敏度降低 否则翻拍方向可能不是你预想的方向
     */
    _directionLength: number = 15;//5;

    /**搓牌速度 */
    _cuo_speed: number = 0.5;

    /**显示翻牌的回卷 */
    _is_End_Show: boolean = false;
    /**第一次触摸的 */
    _touchID: number = 0;
    // isFirstTouch: boolean = true;

    /**触摸移动向量 */
    _tMoveVec: cc.Vec2 = undefined;
    _rotation: number = 0;
    /**
     * 此修正角度为触摸方向在水平或者竖直方向的偏移角度在修正角度内时，修正角度为水平或者竖直
     * 使更容易操作水平和竖直方向的搓牌
     */
    angleFixed: number = 10;
    _cardSize: cc.Size = undefined;

    start() {
        this.init();
        this.node.on(cc.Node.EventType.TOUCH_START, this._touchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this._touchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this._touchEnd, this);

        console.log("start")
    }

    init() {
        if (!this._cardSize) {
            this._cardSize = this.cardBackNode.getContentSize();
        }
        console.log("init ");
        this.cardBackNode.active = true;
        this.cardBackNode.opacity = 255;
        this.cardBackNode.setRotation(0);

        this.cardValueNode.active = false;
        this.cardValueNode.setRotation(0)
        this.cardValueNode.opacity = 255;

        this.trueCardNode.active = false;
        this.trueCardNode.opacity = 255;
        this.trueCardNode.setRotation(0);

        this.cardBackNode.setPosition(cc.Vec2.ZERO);
        this.cardValueNode.setPosition(cc.Vec2.ZERO);
        this.trueCardNode.setPosition(cc.Vec2.ZERO);

        this.maskNode.setPosition(cc.Vec2.ZERO);
        this.maskNode.setRotation(0);
        this.maskNode.opacity = 255;
        this.maskNode.setContentSize(this._cardSize);//还原大小

        //设置阴影大小以及位置
        this.shadow.setRotation(0);
        this.shadow.setAnchorPoint(0, 0.5);
        this.shadow.width = 40;
        this.shadow.height = Math.sqrt(Math.pow(this._cardSize.height, 2) + Math.pow(this._cardSize.width, 2)) * 2;
        let x = this.cardValueNode.width / 2 + this.cardMaskNode.width / 2;
        let y = this.cardValueNode.height / 2 + this.cardMaskNode.height / 2;
        this.shadow.setPosition(x, y);

        // this.initPos_cardValue = cc.Vec2.ZERO;
        this._initStatus();
    }

    _initStatus() {
        this._isOpenCard = false; //改变状态 未开牌
        this._isMoveStart = false;
        // this._isHorizontal = true;
        this._is_End_Show = false;

    }

    resetInit() {
        this.init();
    }

    private _touchStart(event?: cc.Event.EventTouch) {
        if (this._isOpenCard) {
            return;
        }
        // console.log(event.getID() + ":::::::_touchStart event.getID()");
        if (event.getID() < 0) {//是iphone上大部分的浏览器的touch id通常是负的 (safari,uc)

            // if (this.isFirstTouch) {
            this._touchID = event.getID();
            // this.isFirstTouch = false;
            // }
            // else {
            //     if (this._touchID != event.getID()) return;//禁止多点触碰
            // }

        }
        else if (event.getID() >= 0) {
            if (event.getID() > 1024) {//iphone 上的qq浏览器 touch id 是正的大数(例:1061335809)
                this._touchID = event.getID();
            } else {
                if (event.getID() != 0) return;//禁止多点触碰
            }

        }
        else {//undefined 或 null
            console.log(event.getID() + ":::::touchStart event.getID() undefined");
        }

        this._tStartPos = event.getLocation();//获得滑动初始点

        this.cardBackNode.stopAllActions();
        this.maskNode.stopAllActions();
        this.cardValueNode.stopAllActions();
        this.shadow.stopAllActions();

        this.init();
    }

    private _touchMove(event?: cc.Event.EventTouch) {
        if (this._isOpenCard || !this._tStartPos) {
            return;
        }
        // console.log(event.getID() + ":::::::_touchMove event.getID()");
        if (event.getID() < 0) {//是iphone上的touch id通常是负的
            if (this._touchID != event.getID()) return;//禁止多点触碰
        }
        else if (event.getID() >= 0) {
            if (event.getID() > 1024) {//iphone 上的qq浏览器 touch id 是正的大数(例:1061335809)
                if (this._touchID != event.getID()) return;//禁止多点触碰
            } else {
                if (event.getID() != 0) return;//禁止多点触碰
            }
        }
        else {//undefined 或 null
            console.log(event.getID() + ":::::_touchMove event.getID() undefined");
        }

        let _tEndPos = event.getLocation();
        let _tPrePos = event.getPreviousLocation();


        if (_tEndPos.equals(_tPrePos)) {    //忽略相同点
            cc.log("忽略相同点");
            // if (length <= 0) {
            //     this.init();
            //     this._tStartPos = event.getLocation();
            //     console.log("相同点另一边继续回退ttttttttttttttt2");
            // }
            return;
        }
        //规定方向向量为: 开始点到当前点的向量。 规定移动向量为: 上一个点到当前点的向量
        let startToEndVec = _tEndPos.sub(this._tStartPos);
        let preToEndVec = _tEndPos.sub(_tPrePos);

        //规定 达到最小长度才确定方向
        let length = startToEndVec.mag();


        //设定初始位置和横竖轴而已
        if (!this._isMoveStart && length >= this._directionLength) {
            this._is_End_Show = false;

            this._isMoveStart = true;

            this.cardValueNode.active = true;

            this.calDir(startToEndVec);

            //#region 
            /*
            if (Math.abs(endX) > Math.abs(endY)) {
                //手势向左右
                //判断向左还是向右 
                if (endX > 0) {
                    //向左函数
                    cc.log('left');
                    //倒退回原始点的位置赋值
                    // this.initPos_cardValue = new cc.Vec2(this.cardBackNode.x, this.cardBackNode.height);
                    //设置牌初始位置
                    this.cardValueNode.setPosition(-this.cardBackNode.width, this.cardBackNode.y);

                    this._miDir = EMIDir.Left;
                } else {
                    //向右函数
                    cc.log('right');
                    // this.initPos_cardValue = new cc.Vec2(this.cardBackNode.x, -this.cardBackNode.height);
                    this.cardValueNode.setPosition(this.cardBackNode.width, this.cardBackNode.y);


                    this._miDir = EMIDir.Right;
                }
                this._isHorizontal = true;

            } else {
                //手势向上下
                //判断手势向上还是向下
                if (endY > 0) {
                    //向下函数
                    cc.log('down');
                    // this.initPos_cardValue = new cc.Vec2(-this.cardBackNode.width, this.cardBackNode.y);
                    this.cardValueNode.setPosition(this.cardBackNode.x, this.cardBackNode.height);
                    this._miDir = EMIDir.Bottom;

                } else {
                    //向上函数
                    cc.log('up');
                    // this.initPos_cardValue = new cc.Vec2(this.cardBackNode.width, this.cardBackNode.y);
                    this.cardValueNode.setPosition(this.cardBackNode.x, -this.cardBackNode.height);
                    this._miDir = EMIDir.Top;

                }
                this._isHorizontal = false;

            }*/
            //#endregion
        }
        else if (this._isMoveStart) {//移动
            this._is_End_Show = true;

            this.cardValueNode.active = true;

            //移动向量在方向向量上的分量
            let unitV = preToEndVec.project(this._tMoveVec);
            let _unitV = unitV.neg();   //反向移动向量
            //移动
            this._moveByVec2(this.maskNode, unitV, 2);
            this._moveByVec2(this.cardBackNode, _unitV, 2);
            this._moveByVec2(this.cardValueNode, unitV, 2);
            this._moveByVec2(this.shadow, _unitV, 2);


            //#region 
            /*
            if (this._isHorizontal) {
                let xVec = cc.v2(1, 0); //x轴上的向量

                //移动向量在方向向量上的分量
                let unitV = preToEndVec.project(xVec);
                let _unitV = unitV.neg();   //反向移动向量

                //手势向左右
                //判断向左还是向右 
                if (endX > 0) {
                    //向左函数
                    cc.log('left' + unitV);
                    this.cardValueNode.setPosition(this.cardBackNode.x, this.maskNode.height);
                    this.cardValueNode.setRotation(180);
                    this._moveByVec2(this.cardValueNode, new cc.Vec2(-endX, 0), this._cuo_speed);

                    this._moveByVec2(this.maskNode, unitV, this._cuo_speed);
                    this._moveByVec2(this.cardBackNode, _unitV, this._cuo_speed);

                    // this.initPos_cardValue = new cc.Vec2(this.cardBackNode.x, this.cardBackNode.height);

                    this._miDir = EMIDir.Left;

                } else {
                    //向右函数
                    cc.log('right' + unitV);
                    this.cardValueNode.setPosition(this.cardBackNode.x, -this.maskNode.height);
                    this.cardValueNode.setRotation(180);

                    this._moveByVec2(this.cardValueNode, new cc.Vec2(-endX, 0), this._cuo_speed);

                    this._moveByVec2(this.maskNode, unitV, this._cuo_speed);
                    this._moveByVec2(this.cardBackNode, _unitV, this._cuo_speed);

                    // this.initPos_cardValue = new cc.Vec2(this.cardBackNode.x, -this.cardBackNode.height);
                    this._miDir = EMIDir.Right;

                }
            } else {

                let yVec = cc.v2(0, 1); //y轴上的向量
                let unitV = preToEndVec.project(yVec);
                let _unitV = unitV.neg();   //反向移动向量

                //手势向上下
                //判断手势向上还是向下
                if (endY > 0) {
                    //向下函数
                    cc.log('down');

                    this.cardValueNode.setPosition(-this.maskNode.width, this.cardBackNode.y);
                    this._moveByVec2(this.cardValueNode, new cc.Vec2(0, -endY), this._cuo_speed);
                    this._moveByVec2(this.maskNode, unitV, this._cuo_speed);
                    this._moveByVec2(this.cardBackNode, _unitV, this._cuo_speed);

                    // this.initPos_cardValue = new cc.Vec2(-this.cardBackNode.width, this.cardBackNode.y);
                    this._miDir = EMIDir.Bottom;

                } else {
                    //向上函数
                    cc.log('up');
                    this.cardValueNode.setPosition(this.maskNode.width, this.cardBackNode.y);
                    this._moveByVec2(this.cardValueNode, new cc.Vec2(0, -endY), this._cuo_speed);
                    this._moveByVec2(this.maskNode, unitV, this._cuo_speed);
                    this._moveByVec2(this.cardBackNode, _unitV, this._cuo_speed);

                    // this.initPos_cardValue = new cc.Vec2(this.cardBackNode.width, this.cardBackNode.y);
                    this._miDir = EMIDir.Top;

                }
            }*/
            //#endregion

            if (this._canOpen()) {
                //开牌
                this.openCard();
            }
            let len_temp = (startToEndVec.project(this._tMoveVec)).mag();

            console.log("touchMove --------------------------");
            // console.log("unitV.x:" + unitV.x);
            // console.log("unitV.y:" + unitV.y);
            // console.log("this._tMoveVec.x:" + this._tMoveVec.x);
            // console.log("this._tMoveVec.y:" + this._tMoveVec.y);
            console.log("length:" + length);
            console.log("len_temp:" + len_temp);


            if (unitV.x * this._tMoveVec.x <= 0 && unitV.y * this._tMoveVec.y <= 0 //&& length <= this._directionLength + 10
                // && typeof length === 'number' && length % 1 === 0) {
                && (len_temp <= this._directionLength)
            ) {
                this.init();
                // this._tStartPos = undefined;
                this._tStartPos = event.getLocation();//.sub(cc.v2(5, 5));
                console.log("另一边继续回退ttttttttttttttt");
            }
        }
    }

    private _touchEnd(event?: cc.Event.EventTouch) {
        if (this._isOpenCard || !this._tStartPos) {
            return;
        }
        // console.log(event.getID() + ":::::::_touchEnd event.getID()");

        if (event.getID() < 0) {//是iphone上的touch id通常是负的

            if (this._touchID != event.getID()) return;//禁止多点触碰
        }
        else if (event.getID() >= 0) {
            if (event.getID() > 1024) {//iphone 上的qq浏览器 touch id 是正的大数(例:1061335809)
                if (this._touchID != event.getID()) return;//禁止多点触碰
            } else {
                if (event.getID() != 0) return;//禁止多点触碰
            }
        }
        else {//undefined 或 null
            console.log(event.getID() + ":::::_touchEnd event.getID() undefined");
        }

        if (!this._is_End_Show) { return; }

        // if (!this._isMoveStart) { return; }


        //test
        // this._touchID = 0;
        // this.init();
        // return;

        let _tEndPos = event.getLocation();
        cc.log("_tEndPos:" + _tEndPos);
        //开始的点
        // let startToEndVec = this._tStartPos.sub(_tEndPos);
        // let startToEndVec = _tEndPos.sub(this._tStartPos);

        let startToEndVec = _tEndPos.sub(this._tStartPos);
        // this._tMoveVec = this._fixedDirection(startToEndVec);

        // this._rotation = this._getSignAngle(this._tMoveVec, cc.v2(1, 0));//得到阴影向量与x轴2者之间的夹角

        // //设置外接矩形(w,h)
        // let size = this._getOutRectSize(this.cardBackNode, this._rotation);
        // this.maskNode.setContentSize(size);

        // this.calDir(startToEndVec, true);


        //移动向量在方向向量上的分量
        let unitV = startToEndVec.project(this._tMoveVec);
        let _unitV = unitV.neg();   //反向移动向量

        // let length = startToEndVec.mag();

        console.log("touchEnd --------------------------");
        console.log("unitV.x:" + unitV.x);
        console.log("unitV.y:" + unitV.y);
        console.log("this._tMoveVec.x:" + this._tMoveVec.x);
        console.log("this._tMoveVec.y:" + this._tMoveVec.y);
        // console.log("length:" + length);

        console.log("_unitV.x:" + _unitV.x);
        console.log("_unitV.y:" + _unitV.y);

        let offest_len = 1;//length / 60;//(length / unitV.mag());
        // let _offest_len = 2;//length / 60;//(length / _unitV.mag());

        console.log("offest_len:" + offest_len);
        // console.log("_offest_len:" + _offest_len);

        //移动
        this._moveByVec2(this.maskNode, _unitV, offest_len, true);
        this._moveByVec2(this.cardBackNode, unitV, offest_len, true);
        this._moveByVec2(this.cardValueNode, _unitV, offest_len, true, true);
        this._moveByVec2(this.shadow, unitV, offest_len, true);

        this._tStartPos = undefined;

        //#region 
        // let initPos_cardValue = cc.Vec2.ZERO;
        // if (this._miDir) {
        //     switch (this._miDir) {
        //         case EMIDir.Top:
        //             initPos_cardValue = cc.v2(this.cardBackNode.width, this.cardBackNode.y);
        //             break;
        //         case EMIDir.Bottom:
        //             initPos_cardValue = cc.v2(-this.cardBackNode.width, this.cardBackNode.y);
        //             break;
        //         case EMIDir.Left:
        //             initPos_cardValue = cc.v2(this.cardBackNode.x, this.cardBackNode.height)
        //             break;
        //         case EMIDir.Right:
        //             initPos_cardValue = cc.v2(this.cardBackNode.x, -this.cardBackNode.height);
        //             break;

        //         default:
        //             break;
        //     }
        // }

        // let offest_time = 0.4;
        // let openEndFunc = cc.moveTo(offest_time, this.initPos_cardBack);
        // this.cardBackNode.stopAllActions();
        // this.cardBackNode.runAction(openEndFunc);

        // let openEndFunc_value = cc.sequence(
        //     cc.moveTo(offest_time, initPos_cardValue),
        //     cc.callFunc(() => {
        //         console.log("touch end callback");
        //         // this.isFirstTouch = true;
        //         this._touchID = 0;
        //         this.init();
        //     }, this)
        // );

        // this.cardValueNode.stopAllActions();
        // this.cardValueNode.runAction(openEndFunc_value);

        // let openEndFunc_mask = cc.moveTo(offest_time, this.initPos_mask);

        // this.maskNode.stopAllActions();
        // this.maskNode.runAction(openEndFunc_mask);
        //#endregion
    }

    /**
     * 检测是否开牌
     */
    _canOpen() {
        let localPos = this.maskNode.getPosition();
        var length = localPos.mag();//遮罩初始坐标是(0, 0) 此处坐标即向量
        var maxLength = this.maskNode.width;
        // if (!this._isHorizontal) {//因为mask旋转了90度，所以加非
        //     maxLength = this.maskNode.height;
        // }
        // cc.log('max:' + maxLength);
        // cc.log('localpos:' + localPos)
        // cc.log('length:' + length)
        if (length > maxLength / 2) {//遮罩 大于遮罩的1/2
            return true;
        }
        return false;
    }
    openCard() {
        cc.log("开牌--------------------");

        this._isOpenCard = true;

        this.cardValueNode.active = true;
        let offset_time = 0.4;
        let fade_offset_time = 0.4;
        let endPos = cc.Vec2.ZERO;
        let vec_temp = cc.Vec2.ZERO;
        let unitV = cc.Vec2.ZERO;//endPos.project(vec_temp);
        let _unitV = cc.Vec2.ZERO;//unitV.neg();   //反向移动向量

        let self = this;

        //#region 
        switch (this._miDir) {
            case EMIDir.Top:
                cc.log('EMIDir.Top');
                endPos = cc.v2(this.maskNode.height / 2, 0);
                vec_temp = cc.v2(0, 1); //y轴上的向量
                unitV = endPos.project(vec_temp);
                _unitV = unitV.neg();   //反向移动向量

                this.cardValueNode.setPosition(cc.v2(this.cardValueNode.x + unitV.x, this.cardValueNode.y + unitV.y));
                this.maskNode.setPosition(cc.v2(this.maskNode.x + unitV.x, this.maskNode.y + unitV.y));
                this.cardBackNode.setPosition(cc.v2(this.cardBackNode.x + _unitV.x, this.cardBackNode.y + _unitV.y));

                cc.tween(this.maskNode).to(offset_time, { x: 0, y: 0 }).start();
                cc.tween(this.cardBackNode).to(offset_time, { x: 0, y: 0 }).start();
                cc.tween(this.cardValueNode).to(offset_time, { x: 0, y: 0 })
                    .call(() => {
                        self.trueCardNode.active = true;
                        self.trueCardNode.setRotation(180);
                        self.cardBackNode.active = false;

                        let openEndFunc_mask = cc.fadeTo(fade_offset_time, 0);
                        self.maskNode.stopAllActions();
                        self.maskNode.runAction(openEndFunc_mask);
                    })
                    .start();

                break;
            case EMIDir.Bottom:
                cc.log('EMIDir.Bottom');
                endPos = cc.v2(this.maskNode.height / 2, 0);
                vec_temp = cc.v2(0, 1); //y轴上的向量
                unitV = endPos.project(vec_temp);
                _unitV = unitV.neg();   //反向移动向量

                this.cardValueNode.setPosition(cc.v2(this.cardValueNode.x + unitV.x, this.cardValueNode.y + unitV.y));
                this.maskNode.setPosition(cc.v2(this.maskNode.x + unitV.x, this.maskNode.y + unitV.y));
                this.cardBackNode.setPosition(cc.v2(this.cardBackNode.x + _unitV.x, this.cardBackNode.y + _unitV.y));

                cc.tween(this.maskNode).to(offset_time, { x: 0, y: 0 }).start();
                cc.tween(this.cardBackNode).to(offset_time, { x: 0, y: 0 }).start();
                cc.tween(this.cardValueNode).to(offset_time, { x: 0, y: 0 })
                    .call(() => {
                        self.trueCardNode.active = true;
                        self.trueCardNode.setRotation(180);
                        self.cardBackNode.active = false;

                        let openEndFunc_mask = cc.fadeTo(fade_offset_time, 0);
                        self.maskNode.stopAllActions();
                        self.maskNode.runAction(openEndFunc_mask);
                    })
                    .start();
                break;
            case EMIDir.Left:
                cc.log('EMIDir.Left');

                endPos = cc.v2(0, this.maskNode.width / 2);
                vec_temp = cc.v2(1, 0); //x轴上的向量
                unitV = endPos.project(vec_temp);
                _unitV = unitV.neg();   //反向移动向量

                this.cardValueNode.setPosition(cc.v2(this.cardValueNode.x + unitV.x, this.cardValueNode.y + unitV.y));
                // this.cardValueNode.setRotation(180);
                this.maskNode.setPosition(cc.v2(this.maskNode.x + unitV.x, this.maskNode.y + unitV.y));
                this.cardBackNode.setPosition(cc.v2(this.cardBackNode.x + _unitV.x, this.cardBackNode.y + _unitV.y));

                cc.tween(this.maskNode).to(offset_time, { x: 0, y: 0 }).start();
                cc.tween(this.cardBackNode).to(offset_time, { x: 0, y: 0 }).start();
                cc.tween(this.cardValueNode).to(offset_time, { x: 0, y: 0 })
                    .call(() => {
                        self.trueCardNode.active = true;
                        // self.trueCardNode.setRotation(180);//270
                        self.cardBackNode.active = false;

                        let openEndFunc_mask = cc.fadeTo(fade_offset_time, 0);
                        self.maskNode.stopAllActions();
                        self.maskNode.runAction(openEndFunc_mask);
                    })
                    .start();

                break;
            case EMIDir.Right:
                cc.log('EMIDir.Right');

                endPos = cc.v2(0, this.maskNode.width / 2);
                vec_temp = cc.v2(1, 0); //x轴上的向量
                unitV = endPos.project(vec_temp);
                _unitV = unitV.neg();   //反向移动向量

                this.cardValueNode.setPosition(cc.v2(this.cardValueNode.x + unitV.x, this.cardValueNode.y + unitV.y));
                this.maskNode.setPosition(cc.v2(this.maskNode.x + unitV.x, this.maskNode.y + unitV.y));
                this.cardBackNode.setPosition(cc.v2(this.cardBackNode.x + _unitV.x, this.cardBackNode.y + _unitV.y));

                cc.tween(this.maskNode).to(offset_time, { x: 0, y: 0 }).start();
                cc.tween(this.cardBackNode).to(offset_time, { x: 0, y: 0 }).start();
                cc.tween(this.cardValueNode).to(offset_time, { x: 0, y: 0 }).call(() => {

                    self.trueCardNode.active = true;
                    // self.trueCardNode.setRotation(180);//270
                    self.cardBackNode.active = false;

                    let openEndFunc_mask = cc.fadeTo(fade_offset_time, 0);
                    self.maskNode.stopAllActions();
                    self.maskNode.runAction(openEndFunc_mask);

                }).start();
                break;
            default:
                break;
        }

        //#endregion

        // let mytween = cc.tween(this.maskNode).to(0.5, { width: 180, height: 270 }).start();
        // mytween.stop();

    }

    /**计算方向 */
    calDir(vec: cc.Vec2, backroll: boolean = false) {
        this._tMoveVec = this._fixedDirection(vec);//返回相对水平或垂直方向的阴影向量，或 本身
        this._rotation = this._getSignAngle(this._tMoveVec, cc.v2(1, 0));//得到阴影向量与x轴2者之间的夹角
        console.log("this._rotation:" + this._rotation);

        //设置外接矩形(w,h)
        let size = this._getOutRectSize(this.cardBackNode, this._rotation);
        this.maskNode.setContentSize(size);

        this.maskNode.rotation = this._rotation + 90;// + 90;
        this.cardBackNode.rotation = -this._rotation + 270;// + 90;
        this.cardValueNode.rotation = this._rotation + 270;//+90;
        this.shadow.rotation = - this._rotation; //阴影ok  -90   270 - this._rotation


        //根据移动方向 设置牌面和阴影 移动前的起始位置
        let quadrant = this._getQuadrant(this._tMoveVec);
        let faceVertexs = this._getNodeVertexByNodeSpaceAR(this.cardValueNode);


        // console.log("quadrant:" + quadrant);
        // console.log("faceVertexs:" + faceVertexs);

        switch (quadrant) {
            case 1:
            case 5:
                //牌面在遮罩左边
                this.cardValueNode.setPosition(this.maskNode.width, this.cardBackNode.y);


                //阴影设置在牌面的右下顶点
                this.shadow.setPosition(faceVertexs[1]);//0    //2
                cc.log("牌面在遮罩左边,阴影设置在牌面的右下顶点");
                this._miDir = EMIDir.Right;

                break;
            case 2:
            case 6:
                //牌面在遮罩右边
                this.cardValueNode.setPosition(this.maskNode.width, -this.cardBackNode.y);
                //阴影设置在牌面的左下顶点
                this.shadow.setPosition(faceVertexs[2]); //1    //3
                cc.log("牌面在遮罩右边,阴影设置在牌面的左下顶点");
                this._miDir = EMIDir.Bottom;
                break;
            case 3:
            case 7:
                //牌面在遮罩右边
                this.cardValueNode.setPosition(this.maskNode.width, -this.cardBackNode.y);
                //阴影设置在牌面的左上顶点
                this.shadow.setPosition(faceVertexs[3]);//2   //0
                cc.log("牌面在遮罩右边,阴影设置在牌面的左上顶点");
                this._miDir = EMIDir.Left;
                break;
            case 4:
            case 8:
                //牌面在遮罩左边
                this.cardValueNode.setPosition(this.maskNode.width, this.cardBackNode.y);

                //阴影设置在牌面的右上顶点
                this.shadow.setPosition(faceVertexs[0]);//0    //1
                cc.log("牌面在遮罩左边,阴影设置在牌面的右上顶点");
                this._miDir = EMIDir.Top;
                break;
            default://9 原点
                cc.error("移动的方向向量为cc.Vec2(0, 0)");      //走进来算我输
                this._isMoveStart = false;
                break;
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
     * @date 2019-10-29
     * @param {cc.Node} node
     * @param {cc.Vec2} unitVec
     * @param {number} length
     * @memberof MiPaiAnyAngle
     */
    _moveByVec2(node: cc.Node, unitVec: cc.Vec2, length: number = 1, action: boolean = false
        , is_cardValueNode: boolean = false) {
        var wp = node.parent.convertToWorldSpaceAR(node.getPosition());
        wp = cc.v2(wp.x + unitVec.x * length, wp.y + unitVec.y * length);
        var localP = node.parent.convertToNodeSpaceAR(wp);

        if (action) {
            let offest_time = 0.4;//5;// test

            // console.log("name:" + node.name + " wp:" + wp + " localP:" + localP);
            node.stopAllActions();
            if (is_cardValueNode) {
                node.runAction(cc.sequence(cc.moveTo(offest_time, localP), cc.callFunc(() => {
                    console.log("touch end callback");
                    this._touchID = 0;
                    this.init();
                }, this)));
            } else {
                node.runAction(cc.moveTo(offest_time, localP));
            }
        } else {
            node.setPosition(localP);
        }
        // cc.log('localP' + localP);
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
}
