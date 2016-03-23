/**
 * Created by Administrator on 2016/3/23.
 */
(function () {
    window.h5Lock = function (obj) {
        this.width      = obj.width
        this.height     = obj.height
        this.chooseType = Number(localStorage.getItem('chooseType')) || obj.chooseType
    }

    //
    h5Lock.prototype.init = function () {

        //
        this.initDom()
        this.pswObj = window.localStorage.getItem('passwordxx') ? {
            step:2,
            spassword: JSON.parse(window.localStorage.getItem('passwordxx'))
        }:{};

        var lastPoint  = []
        this.touchFlag = false

        this.makeState()
        //
        this.canvas = document.getElementById('canvas')
        this.ctx = this.canvas.getContext('2d')
        this.createCircle()

        // 监听触摸事件
        this.bindEvent()
    }

    //
    h5Lock.prototype.initDom = function(){
        var wrap = document.createElement('div')
        var str  = '<h4 id="title" class="title">请绘制解锁图案</h4>'+
                '<a id="updatePassword" style="position: absolute;right: 5px;top: 5px;color: #FFFFFF; font-size: 10px;display: none">重置密码</a>'+
                '<canvas id="canvas" width="300" height="300" style="background-color: #305066;display: inline-block;margin-top: 15px;"></canvas>'
        wrap.setAttribute('style','position:absolute;top:0;left:0;right:0;bottom:0')

        wrap.innerHTML = str
        document.body.appendChild(wrap)
    }

    h5Lock.prototype.createCircle = function () { //
        var num   = this.chooseType
        var count = 0
        this.r    = this.ctx.canvas.width / (2 + 4 * num)

        this.lastPoint  = []
        this.arr        = []
        this.resetPoint = []

        var r = this.r

        for(var i = 0;i < num; i++){
            for(var j = 0;j <num; j++){
                count++;
                var obj = {
                    x: j * 4 * r + 3 * r,
                    y: i * 4 * r + 3 * r,
                    index:count
                };
                this.arr.push(obj)
                this.resetPoint.push(obj)
            }
        }

        this.ctx.clearRect(0,0,this.ctx.canvas.width,this.ctx.canvas.height)
        for(var i = 0; i < this.arr.length; i++){
            this.drawCle(this.arr[i].x, this.arr[i].y)
        }
    }

    // 获取touch点相对于canvas的坐标
    h5Lock.prototype.getPosition = function(e){
        var rect = e.currentTarget.getBoundingClientRect()
        var po   = {
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top
        }
        return po;
    }

    h5Lock.prototype.bindEvent = function() {
        var self = this
        this.canvas.addEventListener('touchstart', function (e) {

            e.preventDefault()  // 某些android 的 touchmove不宜触发 所以增加此行代码 ?
            var po = self.getPosition(e) // 得到当前的位置
            //console.log(po)
            for(var i = 0;i < self.arr.length; i++){
                if(Math.abs(po.x - self.arr[i].x) < self.r && Math.abs(po.y - self.arr[i].y) < self.r){
                    self.touchFlag = true
                    self.drawPoint(self.arr[i].x,self.arr[i].y) // 画实心圆
                    self.lastPoint.push(self.arr[i])
                    self.resetPoint.splice(i,1) // 删除resetPoint 中的第i 个元素
                    break;
                }
            }
        },false);

        this.canvas.addEventListener('touchmove',function(e){
            if(self.touchFlag){
                self.update(self.getPosition(e))
            }
        },false)
        this.canvas.addEventListener('touchend',function(e){
            if(self.touchFlag){
                self.touchFlag = false
                self.storePass(self.lastPoint)
                setTimeout(function(){
                    self.reset()
                },300)
            }
        },false)

        document.addEventListener('touchmove', function (e) {
            e.preventDefault()
        },false);

        document.getElementById('updatePassword').addEventListener('click',function(){
            self.updatePassword();
        })
    }

    // touchend 之后  重置解锁面板
    h5Lock.prototype.reset = function () {
        this.makeState()
        this.createCircle()
    }

    // 改变当前状态
    h5Lock.prototype.makeState = function () {
        /*var step = this.pswObj.step;
        var updatePassword = document.getElementById('updatePassword');

        if(step == 2){
            document.getElementById('updatePassword').style.display = 'block';
            document.getElementById('title').innerHTML = '请解锁'
        }
        if(step == 1){
            updatePassword.style.display = 'none'
        }
        else{
            updatePassword.style.display = 'none'
        }*/
        if (this.pswObj.step == 2) {
            document.getElementById('updatePassword').style.display = 'block';
            //document.getElementById('chooseType').style.display = 'none';
            document.getElementById('title').innerHTML = '请解锁';
        } else if (this.pswObj.step == 1) {
            //document.getElementById('chooseType').style.display = 'none';
            document.getElementById('updatePassword').style.display = 'none';
        } else {
            document.getElementById('updatePassword').style.display = 'none';
            //document.getElementById('chooseType').style.display = 'block';
        }
    }

    // 储存密码
    h5Lock.prototype.storePass = function (psw) {
        if (this.pswObj.step == 1){
            if(this.checkPass(this.pswObj.fpassword,psw)){
                this.pswObj.step = 2
                this.pswObj.spassword = psw

                document.getElementById('title').innerHTML = '密码保存成功'
                this.drawStatusPoint('#2cff26')
                window.localStorage.setItem('passwordxx',JSON.stringify(this.pswObj.spassword))
                window.localStorage.setItem('chooseType',this.chooseType)
            }
            else {
                document.getElementById('title').innerHTML = '两次不一致，重新输入';
                this.drawStatusPoint('red');
                delete this.pswObj.step;
            }
        }
        else if(this.pswObj.step == 2){
            if (this.checkPass(this.pswObj.spassword, psw)) {
                document.getElementById('title').innerHTML = '解锁成功';
                this.drawStatusPoint('#2CFF26');
            } else {
                this.drawStatusPoint('red');
                document.getElementById('title').innerHTML = '解锁失败';
            }
        }
        else {
            this.pswObj.step = 1;
            this.pswObj.fpassword = psw;
            document.getElementById('title').innerHTML = '再次输入';
        }

    }

    // 检查密码
    h5Lock.prototype.checkPass = function (psw1,psw2) {

        var p1 = '',p2 = '';
        for(var i = 0 ; i < psw1.length;i++){
            p1 += psw1[i].index + psw1[i].index
        }
        for (var i = 0 ; i < psw2.length ; i++) {
            p2 += psw2[i].index + psw2[i].index;
        }
        return p1 === p2;
    }

    // 重置密码
    h5Lock.prototype.updatePassword = function () {
        window.localStorage.removeItem('passwordxx');
        window.localStorage.removeItem('chooseType');
        this.pswObj = {};
        document.getElementById('title').innerHTML = '绘制解锁图案';
        this.reset();
    }

    // 当密码输入正确时，改变解锁图案的颜色
    h5Lock.prototype.drawStatusPoint = function (type) {
        for(var i = 0; i < this.lastPoint.length;i++){
            this.ctx.strokeStyle = type
            this.ctx.beginPath()
            this.ctx.arc(this.lastPoint[i].x,this.lastPoint[i].y,this.r,0,Math.PI * 2,true)
            this.ctx.closePath()
            this.ctx.stroke()
        }
    }

    // 当touchmove事件触发的时候使用
    h5Lock.prototype.update = function (po) {

        // 清空绘画面板
        this.ctx.clearRect(0,0,this.ctx.canvas.width,this.ctx.canvas.height)

        //初始化解锁面板
        for(var i = 0;i < this.arr.length;i++){
            this.drawCle(this.arr[i].x,this.arr[i].y)
        }

        this.drawPoint(this.lastPoint)
        this.drawLine(po,this.lastPoint) // 画每帧的轨迹

        for(var i = 0; i < this.resetPoint.length;i++){
            var pt = this.resetPoint[i]

            if(Math.abs(pt.x - po.x) < this.r && Math.abs(pt.y - po.y) < this.r){
                this.pickPoints(this.lastPoint[this.lastPoint.length - 1],pt)  // 当进入一个新的点时，绘制圆心
                break;
            }

        }
    }

    function getDis(a,b){
        return Math.sqrt(Math.pow(a.x - b.x,2) + Math.pow(a.y - b.y,2))
    }

    // 当进入一个新的点时，绘制圆心
    h5Lock.prototype.pickPoints = function(fromPt,toPt){
        var lineLength = getDis(fromPt,toPt)
        var dir = toPt.index > fromPt.index ? 1 : -1;

        var len = this.resetPoint.length
        var i = dir === 1 ? 0 : (len - 1);
        var limit = dir === 1 ? len : -1;

        while(i!=limit){
            var pt = this.resetPoint[i]

            if(getDis(fromPt,pt) + getDis(pt,toPt) === lineLength){
                this.drawPoint(pt.x,pt.y)
                this.lastPoint.push(pt)
                this.resetPoint.splice(i,1)
                break;
            }
            i += dir
        }
    }

    // 画每帧的轨迹
    h5Lock.prototype.drawLine = function (po,lastPoint) {
        this.ctx.beginPath()
        this.ctx.lineWidth = 3

        this.ctx.moveTo(this.lastPoint[0].x,this.lastPoint[0].y)
        for(var i = 1;i < this.lastPoint.length; i++){
            this.ctx.lineTo(this.lastPoint[i].x,this.lastPoint[i].y)
        }

        this.ctx.lineTo(po.x,po.y)

        this.ctx.stroke()
        this.ctx.closePath()
    }

    // 初始化圆心
    h5Lock.prototype.drawPoint = function (){
        for(var i = 0;i <this.lastPoint.length; i++){
            this.ctx.fillStyle = "#cfe6ff"
            this.ctx.beginPath()
            this.ctx.arc(this.lastPoint[i].x,this.lastPoint[i].y,this.r / 2,0, Math.PI * 2,true)
            this.ctx.closePath()
            this.ctx.fill()
        }
    }

    // 初始化解锁面板
    h5Lock.prototype.drawCle = function(x,y){
        this.ctx.strokeStyle = '#cfe6ff'
        this.ctx.lineWidth = 2
        this.ctx.beginPath()
        this.ctx.arc(x,y,this.r,0,2 * Math.PI,true)
        this.ctx.closePath()
        this.ctx.stroke()
    }
})()