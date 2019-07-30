const {ccclass, property} = cc._decorator;

import {GLB} from "./GLBConfig";
import {WS} from "./Socket";

var SPEED = 5;

@ccclass
export default class Level extends cc.Component {

    @property(cc.Node)
    p1: cc.Node = null;

    @property(cc.Node)
    p2: cc.Node = null;

    @property(cc.Node)
    line: cc.Node = null;

    @property(cc.Node)
    ndResult: cc.Node = null;

    @property(cc.Node)
    ndBtn: cc.Node = null;

    @property(cc.Label)
    labTime: cc.Label = null;

    @property({
        type: cc.AudioClip
    })
    audioClick: cc.AudioClip = null;
    
    _gameStatus: number; //0准备开始 1游戏中 2游戏结束 3暂停游戏 4音乐中断
    _speed: number;
    _iCount: number;
    _bJump: boolean;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        this.initCanvas();
        this.initParas();
        this.initEvent();
        this.initShow();

        var manager = cc.director.getCollisionManager();
        manager.enabled = true;
        manager.enabledDebugDraw = true;
        manager.enabledDrawBoundingBox = true;

        let time = 5;
        let self = this;
        var seq = cc.sequence(cc.repeat(
            cc.sequence(cc.delayTime(1),
                cc.callFunc(()=>{
                    time--;
                    self.labTime.string = time.toString();
                })), 5), 
            cc.delayTime(1),
            cc.callFunc(()=>{
                self.gameStart();
                self.labTime.node.parent.active = false;
            }));
        this.labTime.node.runAction(seq);
    }

    update (dt) {
        if (this._gameStatus == 1){
            this.line.y -= this._speed;
            if (this.line.y < -640) this.line.y = 640;
        }
    }

    initCanvas(){
        var canvas = this.node.getComponent(cc.Canvas);
        var size = canvas.designResolution;
        var cSize = cc.view.getFrameSize();
        if (cSize.width/cSize.height >= size.width/size.height){
            canvas.fitWidth = false;
            canvas.fitHeight = true;
        }else{
            canvas.fitWidth = true;
            canvas.fitHeight = false;
        }
    }

    initParas(){
        this._gameStatus = 0;
    }

    initEvent(){
        this.ndBtn.on("click", function (argument) {
            if (this._gameStatus == 0){
                // this.gameStart();
            }else if (this._gameStatus == 1){
                if (this._bJump == true) return;
                WS.sendMsg(GLB.JUMP);
                this.jump();
            } else if (this._gameStatus == 3){
                // this._gameStatus = 1;
            }
        }, this);
        cc.find("back", this.ndResult).on("click", function (argument) {
            cc.director.loadScene("Lobby");
        }, this);
        cc.find("temp", this.node).on("click", function(params) {
            this.ndResult.active = !this.ndResult.active;
        }, this);

        this.line.on(cc.Node.EventType.TOUCH_START, function (touch, event) {
            let touchLoc = touch.getLocation();
            if (cc.Intersection.pointInPolygon(touchLoc, this.collider.world.points)) {
                cc.log("Hit!");
            } else {
                cc.log("No hit");
            }
        }, this);
    }

    initShow(){
        this.labTime.node.parent.active = true;
    }

    onResponse(cmd, msg){
        var args = msg.split("|");
        if (cmd == GLB.JUMP){
            var moveBy = cc.moveBy(0.5, cc.v2(100, 0));
            var moveBack = cc.moveBy(0.5, cc.v2(-100, 0));
            var seq = cc.sequence(moveBy, moveBack);
            this.p2.runAction(seq);
        }else if (cmd == GLB.LOSE){
            this.gameOver("赢了");
        }
    }

    jump(){
        var self = this;
        this._bJump = true;
        var moveBy = cc.moveBy(0.5, cc.v2(100, 0));
        var moveBack = cc.moveBy(0.5, cc.v2(-100, 0));
        var cb = cc.callFunc(()=>{
            self._bJump = false;
        })
        var seq = cc.sequence(moveBy, moveBack, cb);
        this.p1.runAction(seq);
    }

    showResult(str){
        cc.find("lab", this.ndResult).getComponent(cc.Label).string = str;
    }

    gameStart(){
        var anim1 = this.p1.getComponent(cc.Animation);
        anim1.play();
        var anim2 = this.p2.getComponent(cc.Animation);
        anim2.play();
        this._speed = SPEED;
        this._gameStatus = 1;
        this._iCount = 0;
        this._bJump = false;
    }

    gameOver(str){
        this._gameStatus = 2;
        var anim1 = this.p1.getComponent(cc.Animation);
        anim1.stop();
        var anim2 = this.p2.getComponent(cc.Animation);
        anim2.stop();
        this.ndResult.active = true;
        this.p1.active = false;
        this.p2.active = false;
        this.showResult(str);
    }

    playSound(sName){
        if (sName == "click") cc.audioEngine.play(this.audioClick, false, 1);
    }

    onCol(){
        if (this._bJump == false) {
            WS.sendMsg(GLB.LOSE);
            this.gameOver("输了");
        }
    }
}