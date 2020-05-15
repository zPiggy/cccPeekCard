
export enum EMIDir {
    Top = 4,
    Bottom = 1,
    Left = 2,
    Right = 3,
}

const { ccclass, property } = cc._decorator;
//(当前脚本所在的节点位置需为0,0)
@ccclass
export default class MiPai extends cc.Component {
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
    _isHorizontal: boolean = true;
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

    start() {
        this.init();
        this.node.on(cc.Node.EventType.TOUCH_START, this._touchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this._touchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this._touchEnd, this);

        console.log("start")
    }

    init() {
        this.cardBackNode.active = true;
        this.cardBackNode.opacity = 255;
        this.cardBackNode.setRotation(0);

        this.cardValueNode.active = false;
        this.cardValueNode.setRotation(0)
        this.cardValueNode.opacity = 255;

        this.trueCardNode.active = false;
        this.trueCardNode.opacity = 255;
        // this.trueCardNode.setRotation(90);
        this.trueCardNode.setRotation(0);

        this.cardBackNode.setPosition(cc.Vec2.ZERO);
        this.cardValueNode.setPosition(cc.Vec2.ZERO);
        this.trueCardNode.setPosition(cc.Vec2.ZERO);
        this.maskNode.setPosition(cc.Vec2.ZERO);

        this.maskNode.opacity = 255;

        // this.initPos_cardValue = cc.Vec2.ZERO;
        this._initStatus();
    }

    _initStatus() {
        this._isOpenCard = false; //改变状态 未开牌
        this._isMoveStart = false;
        this._isHorizontal = true;
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

            let endX = this._tStartPos.x - _tEndPos.x;
            let endY = this._tStartPos.y - _tEndPos.y;

            this.cardValueNode.active = true;

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

            }

        }
        else if (this._isMoveStart) {//移动
            this._is_End_Show = true;

            let endX = this._tStartPos.x - _tEndPos.x;
            let endY = this._tStartPos.y - _tEndPos.y;

            this.cardValueNode.active = true;

            // if (Math.abs(endX) > Math.abs(endY)) {//因为是旋转90
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
            }

            if (this._canOpen()) {
                //开牌
                this.openCard();
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




        let initPos_cardValue = cc.Vec2.ZERO;
        if (this._miDir) {
            switch (this._miDir) {
                case EMIDir.Top:
                    initPos_cardValue = cc.v2(this.cardBackNode.width, this.cardBackNode.y);
                    break;
                case EMIDir.Bottom:
                    initPos_cardValue = cc.v2(-this.cardBackNode.width, this.cardBackNode.y);
                    break;
                case EMIDir.Left:
                    initPos_cardValue = cc.v2(this.cardBackNode.x, this.cardBackNode.height)
                    break;
                case EMIDir.Right:
                    initPos_cardValue = cc.v2(this.cardBackNode.x, -this.cardBackNode.height);
                    break;

                default:
                    break;
            }
        }

        let offest_time = 0.4;
        let openEndFunc = cc.moveTo(offest_time, this.initPos_cardBack);
        this.cardBackNode.stopAllActions();
        this.cardBackNode.runAction(openEndFunc);

        // if (this.initPos_cardValue) {
        // cc.log('this.initPos_cardValue:' + this.initPos_cardValue);
        let openEndFunc_value = cc.sequence(
            cc.moveTo(offest_time, initPos_cardValue),
            cc.callFunc(() => {
                console.log("touch end callback");
                // this.isFirstTouch = true;
                this._touchID = 0;
                this.init();
            }, this)
        );
        this.cardValueNode.stopAllActions();
        this.cardValueNode.runAction(openEndFunc_value);
        // }

        let openEndFunc_mask = cc.moveTo(offest_time, this.initPos_mask);

        this.maskNode.stopAllActions();
        this.maskNode.runAction(openEndFunc_mask);

    }

    /**
     * 检测是否开牌
     */
    _canOpen() {
        let localPos = this.maskNode.getPosition();
        var length = localPos.mag();//遮罩初始坐标是(0, 0) 此处坐标即向量
        var maxLength = this.maskNode.height; //.height;// .height;
        if (!this._isHorizontal) {//因为mask旋转了90度，所以加非
            maxLength = this.maskNode.width;
        }
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
        // this.maskNode.siz.setContentSize

        this.cardValueNode.active = true;
        let offset_time = 0.4;
        let fade_offset_time = 0.4;
        let endPos = cc.Vec2.ZERO;
        let vec_temp = cc.Vec2.ZERO;
        let unitV = cc.Vec2.ZERO;//endPos.project(vec_temp);
        let _unitV = cc.Vec2.ZERO;//unitV.neg();   //反向移动向量

        let self = this;

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
                        // self.trueCardNode.setRotation(270);
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
                        // self.trueCardNode.setRotation(270);
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
                        self.trueCardNode.setRotation(180);
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
                    self.trueCardNode.setRotation(180);
                    self.cardBackNode.active = false;

                    let openEndFunc_mask = cc.fadeTo(fade_offset_time, 0);
                    self.maskNode.stopAllActions();
                    self.maskNode.runAction(openEndFunc_mask);

                }).start();
                break;
            default:
                break;
        }

        // let mytween = cc.tween(this.maskNode).to(0.5, { width: 180, height: 270 }).start();
        // mytween.stop();

    }


    /**
     * 将节点沿 unitVec 方向移动 length 个 unitVec 长度;
     * (先从父节点下的坐标系的坐标转换成世界坐标，再加减移动的长度，再转换回基于父节点下的坐标)
     * @date 2019-10-29
     * @param {cc.Node} node
     * @param {cc.Vec2} unitVec
     * @param {number} length
     * @memberof MiPai
     */
    _moveByVec2(node: cc.Node, unitVec: cc.Vec2, length: number = 1) {
        var wp = node.parent.convertToWorldSpaceAR(node.getPosition());
        wp = cc.v2(wp.x + unitVec.x * length, wp.y + unitVec.y * length);
        var localP = node.parent.convertToNodeSpaceAR(wp);
        node.setPosition(localP);
        // cc.log('localP' + localP);
    }
}
