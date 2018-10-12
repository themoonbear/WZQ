var Player = require("Player");
var gridRadius = 40;
var maxGrid = 15;
var spaceAR = 280;
var fixRadius = 40;
var Direction = {
    TOP: 0,
    BOTTOM: 1,
    LEFT: 2,
    RIGHT: 3,
    LEFT_TOP: 4,
    LEFT_BOTTOM: 5,
    RIGHT_TOP: 6,
    RIGHT_BOTTOM: 7
};
cc.Class({
    extends: cc.Component,

    properties: {
        chessboard : cc.Node,
        line : cc.Graphics,
        result: cc.Label,
        chessPrefab : cc.Prefab,
        playerA: Player,
        playerB: Player,
        clickSound: {
            url: cc.AudioClip,
            default:null
        },
        chessSound:{
            url: cc.AudioClip,
            default:null
        },
        winSound:{
            url: cc.AudioClip,
            default:null
        },
        talkSound:{
            url: cc.AudioClip,
            default:null
        },
        bgMusic:{
            url: cc.AudioClip,
            default: null
        }
    },

    onLoad () {
        this.drawGrid();
        this.initChessPool();
        this.initChessBoardEvent();
        this.initRobotEvent(); 
        cc.audioEngine.play(this.bgMusic, true, 0.1);   
    },

    start () {
        this.onStartBtn();
    },

    drawGrid(){
        this.grid = this.chessboard.getComponent(cc.Graphics);
        for(let i = 0 ; i < 15; i++){
            let radius = i*gridRadius;
            //横线，从左往右
            this.grid.moveTo(gridRadius, gridRadius + radius);
            this.grid.lineTo(spaceAR*2 + gridRadius, gridRadius + radius);
            this.grid.stroke();
            // //竖线,从下向上
            this.grid.moveTo(gridRadius + radius, gridRadius);
            this.grid.lineTo(gridRadius + radius, spaceAR*2 + gridRadius);
            this.grid.stroke();            
        }               
    },
    initChessPool(){
        if(this.chessPool){
            this.chessPool.clear();
        }else{
            this.chessPool = new cc.NodePool();
        }
        let initCount = 225;
        for(let i = 0 ; i < initCount; ++i){
            let chess = cc.instantiate(this.chessPrefab);
            this.chessPool.put(chess);
        }
    },
    recycleChess(chess){
        this.chessPool.put(chess);
    },
    getChess(frame){
        let chess = null;
        if(this.chessPool.size() > 0){
            chess = this.chessPool.get();
        }else{
            chess = cc.instantiate(this.chessPrefab);
        }
        chess.getComponent(cc.Sprite).spriteFrame = frame;
        return chess;
    },    
    initChessBoardEvent(){
        this.chessboard.on(cc.Node.EventType.TOUCH_END, this.onTouchBoard.bind(this));
    },
    initRobotEvent(){
        let robot = (this.playerA.IsRobot() ? this.playerA : this.playerB);
        robot.node.on('ai', this.onAI.bind(this));
    },
    initData(){       
        this.curPlayer = null;
        this.curChessIdx = null;
        this.chessDownNum = 0;
        this.chessMatrix = [
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
        ];      
    },
    onCloseBtn(){
        cc.audioEngine.play(this.clickSound, false, 1);
        console.log("close");
    },
    onBackBtn(){
        console.log("back");
    },
    onStartBtn(){
        cc.audioEngine.play(this.clickSound, false, 1);
        this.gameStart = true;
        this.resetData();
        this.hideResult();        
        //重新开始
        this.selectPut();
    },
    resetData(){
        for(let i = 1 ; i <= this.chessDownNum; i++){
            this.recycleChess(this.chessboard.getChildByTag(i));            
        }
        this.playerA.Stop();
        this.playerB.Stop();         
        this.line.clear();
        this.initData();
    },
    hideResult(){
        this.result.node.active = false;
    },
    showResult(winner){
        this.stopTalk();
        cc.audioEngine.play(this.winSound, false, 1);
        this.result.node.active = true;
        this.result.string = winner + "获得胜利！";
        this.result.node.getComponent(cc.Animation).play();
    },

    selectPut(){
        this.stopTalk();
        if(!this.curPlayer){
            this.curPlayer = this.playerA.IsRobot() ? this.playerB : this.playerA;
        }else{
            this.curPlayer.StopTip();
            this.curPlayer = (this.curPlayer == this.playerB) ? this.playerA : this.playerB;
        }
        this.curPlayer.TipPut();
        this.schedule(this.onTalk, 60);
    },
    stopTalk(){
        if(this.talk){
            cc.audioEngine.stop(this.talk);
        }
        this.talk = null;
        this.unschedule(this.onTalk);
    },
    onTalk(){
        this.talk = cc.audioEngine.play(this.talkSound, false, 1);
    },
    onTouchBoard(event){
        if(!this.gameStart || !this.curPlayer || this.curPlayer.IsRobot()){
            return;
        }
        let idx = this.getMatrixIdx(event.getLocation());
        if(!this.canPut(idx)){
            return;
        }
        this.putChess(this.curPlayer, idx);               
    },
    onAI(){
        let newIdx = null;               
        if(this.chessDownNum == 1){
            newIdx = this.getAIFirstChessIdx(this.curChessIdx);
        }else{
            let maxX = 0, maxY = 0, maxWeight = 0, tem;
            for(let i = maxGrid-1; i >= 0 ; i--){
                for(let j = maxGrid-1; j>= 0; j--){
                    let p = cc.v2(i,j);
                    if(!this.canPut(p)){
                        continue;
                    }
                    tem = this.caculateWeight(i,j);
                    if(tem > maxWeight){
                        maxWeight = tem;
                        maxX = i;
                        maxY = j;
                    }
                }
            }
            newIdx = cc.v2(maxX, maxY);
        }
        this.putChess(this.curPlayer,newIdx); 
    },
    caculateWeight(x,y){
        let weight = 19 - (Math.abs(x-19/2) + Math.abs(y-19/2)), info;
        let robotFlag, playerFlag;
        if(this.playerA.IsRobot()){
            robotFlag = this.playerA.GetFlag();
            playerFlag = this.playerB.GetFlag();
        }else{
            robotFlag = this.playerB.GetFlag();
            playerFlag = this.playerA.GetFlag();
        }
        //x
        info = this.putDirectX(x,y,robotFlag);
        weight += this.weightStatus(info, true);
        info = this.putDirectX(x,y,playerFlag);
        weight += this.weightStatus(info, false);
        //y
        info = this.putDirectY(x,y,robotFlag);
        weight += this.weightStatus(info, true);
        info = this.putDirectY(x,y,playerFlag);
        weight += this.weightStatus(info, false);
        //xy
        info = this.putDirectXY(x,y,robotFlag);
        weight += this.weightStatus(info, true);
        info = this.putDirectXY(x,y,playerFlag);
        weight += this.weightStatus(info, false);
        //yx
        info = this.putDirectYX(x,y,robotFlag);
        weight += this.weightStatus(info, true);
        info = this.putDirectYX(x,y,playerFlag);
        weight += this.weightStatus(info, false);
        return weight;        
    },
    weightStatus(info, robot){
        let weight = 0;
        switch(info.nums){
            case 1:
                if(info.side1 && info.side2){
                    weight = robot ? 15 : 10;
                }
                break;
            case 2:
                if(info.side1 && info.side2){
                    weight = robot ? 100 : 50;
                }else if(info.side1 || info.side2){
                    weight = robot ? 10 : 5;
                }
                break;
            case 3:
                if(info.side1 && info.side2){
                    weight = robot ? 500 : 200;
                }else if(info.side1 || info.side2){
                    weight = robot ? 30 : 20;
                }
                break;
            case 4:
                if(info.side1 && info.side2){
                    weight = robot ? 5000 : 2000;
                }else if(info.side1 || info.side2){
                    weight = robot ? 400 : 100;
                }
                break;
            case 5:
                weight = robot ? 100000 : 10000;
                break;
            default:
                weight = robot ? 500000 : 250000;
                break;
        }
        return weight;
    },
    putDirectX(x, y, flag){
        let m, n, nums=1,side1 =false,side2=false;
        for(m=y-1;m>=0;m--){
            let chessFlag = this.getFlag(x,m);
            if(chessFlag===flag){
                nums++;
            }else{
                if(chessFlag === 0){
                    side1 = true;
                }
                break;
            }
        }
        for(m=y+1;m<maxGrid;m++){
            let chessFlag = this.getFlag(x,m);
            if(chessFlag===flag){
                nums++;
            }else{
                if(chessFlag===0){
                    side2=true;
                }
                break;
            }
        }
        return {nums: nums, side1: side1, side2: side2};
    },
    putDirectY(x,y, flag){
        let m, n, nums=1,side1 =false,side2=false;
        for(m=x-1;m>=0;m--){
            let chessFlag = this.getFlag(m,y);
            if(chessFlag===flag){
                nums++;
            }else{
                if(chessFlag === 0){
                    side1 = true;
                }
                break;
            }
        }
        for(m=x+1;m<maxGrid;m++){
            let chessFlag = this.getFlag(m,y);
            if(chessFlag===flag){
                nums++;
            }else{
                if(chessFlag===0){
                    side2=true;
                }
                break;
            }
        }
        return {nums: nums, side1: side1, side2: side2};
    },
    putDirectXY(x,y,flag){
        let m, n, nums=1,side1 =false,side2=false;
        for(m=x-1, n=y-1;m>=0,n>=0;m--,n--){
            let chessFlag = this.getFlag(m,n);
            if(chessFlag===flag){
                nums++;
            }else{
                if(chessFlag === 0){
                    side1 = true;
                }
                break;
            }
        }
        for(m=x+1,n=y+1;m<maxGrid,n<maxGrid;m++,n++){
            let chessFlag = this.getFlag(m,n);
            if(chessFlag===flag){
                nums++;
            }else{
                if(chessFlag===0){
                    side2=true;
                }
                break;
            }
        }
        return {nums: nums, side1: side1, side2: side2};        
    },
    putDirectYX(x,y,flag){
        let m, n, nums=1,side1 =false,side2=false;
        for(m=x-1, n=y+1;m>=0,n<maxGrid;m--,n++){
            let chessFlag = this.getFlag(m,n);
            if(chessFlag===flag){
                nums++;
            }else{
                if(chessFlag === 0){
                    side1 = true;
                }
                break;
            }
        }
        for(m=x+1,n=y-1;m<maxGrid,n>=0;m++,n--){
            let chessFlag = this.getFlag(m,n);
            if(chessFlag===flag){
                nums++;
            }else{
                if(chessFlag===0){
                    side2=true;
                }
                break;
            }
        }
        return {nums: nums, side1: side1, side2: side2};        
    },    
    getAIFirstChessIdx(curIdx){
        let idx = cc.v2(curIdx);
        if(idx.x < 3 || idx.x > maxGrid-3 || idx.y < 3 || idx.y > maxGrid-3){
            idx.x = maxGrid >> 1;
            idx.y = maxGrid >> 1;
        }else{
            let direction = Math.floor(Math.random()*8);
            switch(direction){
                case Direction.TOP:
                    idx.y = curIdx.y-1;
                    break;
                case Direction.BOTTOM:
                    idx.y = curIdx.y+1;
                    break;
                case Direction.LEFT:
                    idx.x = curIdx.x-1;
                    break;
                case Direction.RIGHT:
                    idx.x = curIdx.x+1;
                    break;
                case Direction.LEFT_TOP:
                    idx.x = curIdx.x-1;
                    idx.y = curIdx.y-1;
                    break;
                case Direction.LEFT_BOTTOM:
                    idx.x = curIdx.x-1;
                    idx.y = curIdx.y+1;
                    break;
                case Direction.RIGHT_TOP:
                    idx.x = curIdx.x+1;
                    idx.y = curIdx.y-1;
                    break;
                case Direction.RIGHT_BOTTOM:
                    idx.x = curIdx.x+1;
                    idx.y = curIdx.y+1;
                    break;
                default:
                    idx.x = curIdx.x-1;
                    idx.y = curIdx.y-1;
                    break;
            }
        }
        return idx;
    },
    putChess(player, idx){
        cc.audioEngine.play(this.chessSound, false, 1);
        this.chessDownNum++;         
        this.curChessIdx = idx;
        let position = this.getPosition(idx);       
        let chess = this.getChess(player.Chess());
        chess.tag = this.chessDownNum;
        chess.parent = this.chessboard;
        chess.setPosition(position);        
        this.chessMatrix[idx.x*maxGrid + idx.y] = player.GetFlag();
        player.StopTip();

        if(this.checkResult(idx)){
            this.gameStart = false;
            player.UpdateScore();
            this.showResult(player.Name());
            return;
        }
        this.selectPut();         
    },
    canPut(matrixIdx){
        if(!matrixIdx || this.chessMatrix[matrixIdx.x*maxGrid + matrixIdx.y] != 0){
            return false;
        }
        return true;
    },
    getPosition(matrixIdx){
        return cc.v2(matrixIdx.x*gridRadius - spaceAR, matrixIdx.y*gridRadius - spaceAR);
    },
    getMatrixIdx(location){
        let position = this.chessboard.convertToWorldSpaceAR(location);
        let x = Math.round((position.x - fixRadius - spaceAR - gridRadius)/gridRadius);
        let y = Math.round((position.y - fixRadius - spaceAR - gridRadius)/gridRadius);
        if(x < 0 || x > 14 || y < 0 || y > 14){
            return null;
        }    
        return cc.v2(x,y);
    },
    getFlag(x,y){
        return this.chessMatrix[x*maxGrid +y];
    },
    checkResult(idx){
        let hcount = 0,
        vcount = 0,
        lbhcount = 0,
        rbhcount = 0,
        temp = 0,
        countArray = [];
        let flag = this.curPlayer.GetFlag();
        //左-1
        for (let i = idx.x; i >= 0; i--) {
            temp = this.getFlag(i, idx.y);
            if (temp < 0 || temp !== flag) {
                break;
            }
            hcount++;
            countArray.push(cc.v2(i,idx.y));
        }
        //右-1
        for (let i = idx.x + 1; i < maxGrid; i++) {
            temp = this.getFlag(i, idx.y);
            if (temp < 0 || temp !== flag) {
                break;
            }
            hcount++;
            countArray.push(cc.v2(i,idx.y));
        }

        if (countArray.length < 5) {
            countArray = [];
            //上-2
            for (let j = idx.y; j >= 0; j--) {
                temp = this.getFlag(idx.x, j);
                if (temp < 0 || temp !== flag) {
                    break;
                }
                vcount++;
                countArray.push(cc.v2(idx.x,j));
            }
            //下-2
            for (let j = idx.y + 1; j < maxGrid; j++) {
                temp = this.getFlag(idx.x, j);
                if (temp < 0 || temp !== flag) {
                    break;
                }
                vcount++;
                countArray.push(cc.v2(idx.x,j));
            }
        }

        if (countArray.length < 5) {
            countArray = [];
            //左上
            for (let i = idx.x, j = idx.y; i >= 0, j >= 0; i--, j--) {
                if (i < 0 || j < 0) break;
                temp = this.getFlag(i, j);
                if (temp < 0 || temp !== flag) {
                    break;
                }
                lbhcount++;
                countArray.push(cc.v2(i,j));
            }
            //右下
            if (idx.x < maxGrid - 1 && idx.y < maxGrid - 1) {
                for (let i = idx.x + 1, j = idx.y + 1; i < maxGrid, j < maxGrid; i++, j++) {
                    if (i >= maxGrid || j >= maxGrid) break;
                    temp = this.getFlag(i, j);
                    if (temp < 0 || temp !== flag) {
                        break;
                    }
                    lbhcount++;
                    countArray.push(cc.v2(i,j));
                }
            }
        }
        if (countArray.length < 5) {
            countArray = [];
            //右上
            for (let i = idx.x, j = idx.y; i < maxGrid, j >= 0; i++, j--) {
                if (i >= maxGrid || j < 0) break;
                temp = this.getFlag(i, j);
                if (temp < 0 || temp !== flag) {
                    break;
                }
                rbhcount++;
                countArray.push(cc.v2(i,j));
            }
            //左下
            if (idx.x >= 1 && idx.y < maxGrid - 1) {
                for (let i = idx.x - 1, j = idx.y + 1; i > 0, j < maxGrid; i--, j++) {
                    if (j >= maxGrid || i < 0) break;
                    temp = this.getFlag(i, j);
                    if (temp < 0 || temp !== flag) {
                        break;
                    }
                    rbhcount++;
                    countArray.push(cc.v2(i,j));
                }
            }
        }

        if (hcount >= 5 || vcount >= 5 || lbhcount >= 5 || rbhcount >= 5) {
            this.drawWinLine(countArray);
            return true;
        }        
        return false;
    },
    drawWinLine(countArray){
        countArray.sort(function(p1, p2){
            return (p1.x + p1.y) > (p2.x + p2.y); 
        });
        console.log(JSON.stringify(countArray));
        let startP = this.getPosition(countArray.shift());
        let endP = this.getPosition(countArray.pop());
        this.line.moveTo(startP.x , startP.y);
        this.line.lineTo(endP.x, endP.y);
        this.line.stroke();
    }
});
