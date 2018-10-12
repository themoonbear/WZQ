var NameConfig = require("Name");
cc.Class({
    extends: cc.Component,

    properties: {
        playerName: cc.Label,
        score: cc.Label,
        chess: cc.Sprite,
        robot: false,
        chessFlag: 0,
    },
    onLoad(){
        if(this.robot){
            let robotName = NameConfig[Math.floor(Math.random()*NameConfig.length)];
            this.SetName(robotName);
        }
        this.tip = this.chess.getComponent(cc.Animation);
    },
    UpdateScore(){
        let score = Number.parseInt(this.score.string);
        this.score.string = String(++score);
    },
    TipPut(){
        this.tip.play();
        if(this.robot){
            this.scheduleOnce(function() {
                this.node.emit("ai");
            }, Math.floor(1 + Math.random()*3));
        }
    },
    StopTip(){
        this.tip.stop();
    },
    Name(){
        return this.playerName.string;
    },
    SetName(playerName){
        this.playerName.string = playerName;
    },
    Chess(){
        return this.chess.spriteFrame;
    },
    IsRobot(){
        return this.robot;
    },
    GetFlag(){
        return String(this.chessFlag);
    },
    Stop(){
        this.StopTip();
        this.unscheduleAllCallbacks();
    }
});
