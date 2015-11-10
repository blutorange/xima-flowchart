Pt = function(x,y){
    return {x:x,y:y}
}
Pt.r = function(r){
    return Pt(r.x,r.y)
}
Pt.cross = function(lhs,rhs){
    return lhs.x*rhs.y-lhs.y*rhs.x
}
Pt.smul = function(lhs,rhs) {
    return Pt(lhs*rhs.x,lhs*rhs.y)
}
Pt.mul = function(lhs,rhs) {
    return lhs.x*rhs.x+lhs.y*rhs.y
}
Pt.add = function(lhs,rhs) {
    return Pt(lhs.x+rhs.x,lhs.y+rhs.y)
}
Pt.addC = function(lhs,rhs1,rhs2){
    return {x:lhs.x+rhs1,y:lhs.y+rhs2}
}
Pt.sub = function(lhs,rhs) {
    return Pt(lhs.x-rhs.x,lhs.y-rhs.y)
}
Pt.square = function(lhs) {
    return Pt.mul(lhs,lhs)
}
Pt.abs = function(lhs) {
    return Math.sqrt(Pt.square(lhs))
}
// Smaller angle.
Pt.san = function(lhs,rhs) {
    return Math.acos(Pt.mul(lhs,rhs)/Math.sqrt(Pt.square(lhs)*Pt.square(rhs)))
}
// Angle with x-axis, mathematical positive.
Pt.xan = function(lhs) {
    var san = Math.acos(lhs.x/Pt.abs(lhs))
    return lhs.y < 0 ? san : 2*Math.PI-san
}
// dir = 1, mathematically positive
// dir = 1, mathematically negative (or origin at top left)
Pt.getAngle = function(el,dir) {
    var cos = el.x
    var sin = el.y
    if (dir==-1){sin = -sin}
    var acos = Math.acos(cos)
    return sin < 0 ? 2*Math.PI-acos : acos
}

LS = function(){
    //getGlobalParametrization(pointsCurve,r,LS.getBezier)
}

// Save local variables.
LS.rtnLin = function(pPrev,tReduced,tStart,sCPrev,tSCPrev){
    var _pPrev = Pt.r(pPrev)
    var _tReduced = tReduced
    var _tStart = tStart
    var _sCPrev = Pt.r(sCPrev)
    var _tSCPrev = Pt.r(tSCPrev)
    return function(t) {
        var r = Pt.sub(_pPrev,Pt.smul((t*_tReduced+_tStart),_sCPrev))
        var tx = _tSCPrev.x
        var ty = _tSCPrev.y    
        return {
                x:r.x,
                y:r.y,
                tx:tx,
                ty:ty,
                nx:ty,
                ny:-tx
               }
    }
}
// Searches array for arr[i]>=val, returns index.
LS.binSearchGT = function(arr,val){
    var i = 0
    var j = arr.length-1
    var k
    while (j-i>1){
        var k = Math.floor((i+j)/2)
        arr[k]>=val ? j=k : i=k
    }
    return arr[i]>=val ? i : j
}
// Searches array for arr[i].tEnd>=val, returns value.
LS.binSearchGTTEnd = function(arr,val){
    var i = 0
    var j = arr.length-1
    var k
    while (j-i>1){
        var k = Math.floor((i+j)/2)
        arr[k].tEnd>=val ? j=k : i=k
    }
    return arr[i].tEnd>=val ? i : j
}
// r>0 : absolute curving radius
// r<0 : relative curving radius, -r*100 % of the distance between two points
// r=="max" : same as r=-1
LS.getGlobalParametrization = function(pointsCurve,r,interpolator) {
    var len = pointsCurve.length
    var globalT = 0
    var segments = []
    var rLast = 0
    for (var i=1; i<len-1; i++) {
        var pPrev = pointsCurve[i-1]
        var pCurr = pointsCurve[i]
        var pNext = pointsCurve[i+1]
        var sCPrev = Pt.sub(pPrev,pCurr)
        var sCNext = Pt.sub(pNext,pCurr)
        var lenCPrev = Pt.abs(sCPrev)
        var lenCNext = Pt.abs(sCNext)
        r1 = r<0 ? -r*lenCPrev : r
        r2 = r<0 ? -r*lenCNext : r
        var rCPrev = (r1>lenCPrev||r=="max") ? lenCPrev : r1*0.99
        var rCNext = (r2>lenCNext||r=="max") ? lenCNext : r2*0.99
        var tCPrev = rCPrev/lenCPrev
        var tCNext = rCNext/lenCNext
        var p1 = Pt.add(pCurr,Pt.smul(tCPrev,sCPrev))
        var p2 = Pt.add(pCurr,Pt.smul(tCNext,sCNext))
        var ipol = interpolator(p1,pCurr,p2)
        var arcLenIPol = ipol.arcLen
        
        var arcLenLin = lenCPrev-rCPrev-rLast
        var tReduced = arcLenLin/lenCPrev
        var tStart = rLast/lenCPrev
        var tSCPrev = Pt.smul(-1.0/lenCPrev,sCPrev)

        var rtnLin = LS.rtnLin(pPrev,tReduced,tStart,sCPrev,tSCPrev)
        
        segments.push({tStart:globalT,tEnd:globalT+arcLenLin,rtn:rtnLin,arcLen:arcLenLin})
        globalT += arcLenLin
    
        segments.push({tStart:globalT,tEnd:globalT+arcLenIPol,rtn:ipol.rtn,arcLen:arcLenIPol})
        globalT += arcLenIPol

        rLast = rCNext
    }

    // Last segment
    var pCurr = pointsCurve[len-1]
    var pPrev = pointsCurve[pointsCurve.length-2]
    var sCPrev = Pt.sub(pPrev,pCurr)
    var lenCPrev = Pt.abs(sCPrev)
    var arcLenLin = lenCPrev-rLast
    var tStart = rLast/lenCPrev
    var tReduced = 1.0-tStart
    var tSCPrev = Pt.smul(-1.0/lenCPrev,sCPrev)
    var rtnLin = LS.rtnLin(pPrev,tReduced,tStart,sCPrev,tSCPrev)
        
    segments.push({tStart:globalT,tEnd:globalT+arcLenLin,rtn:rtnLin,arcLen:lenCPrev-rLast})
    globalT += arcLenLin

    var rtn = function(t){
        t = t<0 ? 0 : t>globalT ? globalT : t
        var segment = t==0 ? segments[0] : (_.find(segments,function(s){return t<=s.tEnd}) || segments[segments.length-1]) // linear search
        // var segment = segments[t==0 ? 0 : LS.binSearchGTTEnd(segments,t)] // binary search
        var sTStart = segment.tStart
        var sArcLen = segment.arcLen
        var sT = (t-sTStart)/(sArcLen)
        return segment.rtn(sT || 0)
    }
    
    return {arcLen:globalT,rtn:rtn}
}
// From p0 near p1 to p2.
// Returns function r(t) and tn(t) (tangent+normal).
// t from 0 to 1, ie. r(0) = p1, r(1)=p1
LS.getBezier = function(p0,p1,p2) {
    var steps = 1000 // Increase for higher quality / resolution.
    
    // Get position r for curve parameter t=0...1.
    var getParams2 = function(t){
        var s = 1-t
        return [
                s*s*s,
                3*(s*s*t+s*t*t),
                t*t*t
               ]
    }
    var r2 = function(t) {
        var p = getParams2(t)
        return {x:p[0]*p0.x+p[1]*p1.x+p[2]*p2.x,
                y:p[0]*p0.y+p[1]*p1.y+p[2]*p2.y}
    }
    
    // Compute arc length.
    var ctrl = [0]
    var arcLen = (function(steps){
        var dt = 1.0/(steps)
        var last = p0
        var arclen = 0.0
        for (var i=1;i<steps;i++) {
            var t = i*dt
            var pos = r2(t)
            arclen += Pt.abs(Pt.sub(pos,last))
            ctrl.push(arclen)
            last = pos
        }
        arclen += Pt.abs(Pt.sub(p2,last))
        ctrl.push(arclen)        
        return arclen
    })(steps)
    ctrl.push(arcLen)
    
    // Get position, tangent and normal for curve parameter t.
    // t=0...1
    // t = ArcLen(r(t=0),r(t))/ArcLen(r(t=0),r(t=1))
    var getParams = function(t){
        var s = 1-t
        return [s*s*s,
                3*(s*s*t+s*t*t),
                t*t*t,
                -3*s*s,
                3-6*t,
                3*t*t,
               ]
    }    
    var rtn = function(t) {
        var tmp1 = t*arcLen
        //var tmp2 = _.findIndex(ctrl,function(x){return x>=tmp1}) // linear search
        var tmp2 = LS.binSearchGT(ctrl,tmp1) // binary search
        var t2 = tmp2==steps+1 ? 1 : (tmp2+(tmp1-ctrl[tmp2])/((ctrl[tmp2+1])-ctrl[tmp2]))/steps
        if (t2<0){t2=0}
        if (t2>1){t2=1}        

        var p = getParams(t2)
        var x = p[0]*p0.x+p[1]*p1.x+p[2]*p2.x
        var y = p[0]*p0.y+p[1]*p1.y+p[2]*p2.y
        var tx = p[3]*p0.x+p[4]*p1.x+p[5]*p2.x
        var ty = p[3]*p0.y+p[4]*p1.y+p[5]*p2.y
        var n = 1.0/Math.sqrt(tx*tx+ty*ty)
        tx *= n
        ty *= n
        return {
                tx:tx,
                ty:ty,
                nx:ty,
                ny:-tx,
                x:x,
                y:y
               }
    }    
    return {rtn:rtn,arcLen:arcLen}
}
LS.createPattern = function(points,dir,dirXY){
    var dirLen = Pt.abs(dir)
    var dirN = Pt.smul(1.0/dirLen,dir)
    points.forEach(function(point){
        var r = Pt.sub(point,dirXY)
        var s = Pt.smul(Pt.mul(r,dirN),dirN)
        var n = Pt.sub(r,Pt.add(s,dirXY))
        var orient = Pt.cross(dirN,n)    
        point.d = Pt.abs(n) * (orient > 0 ? 1 : -1) // +1 to the left
        point.t = Pt.mul(s,dirN)
    })
    return {points:points,dirLen:dirLen,dirN:dirN}
}
LS.transformPoints = function(pointsCurve,pattern,r,interpolator,callback){
    var pointsPattern = pattern.points
    var dirLen = pattern.dirLen
    var dirN = pattern.dirN
    var curve = LS.getGlobalParametrization(pointsCurve,r,interpolator)
    var rtn = curve.rtn
    var arcLen = curve.arcLen
    var reps = Math.ceil(arcLen/dirLen)

    for (var i=0;i<reps;i++) {
        var tStart = i*dirLen
        
        var pointsTransformed = _.map(pointsPattern,function(point){
            var coords = rtn(tStart+point.t)
            return {x:coords.x+coords.nx*point.d,y:coords.y+coords.ny*point.d,tx:coords.tx,ty:coords.ty}
        })
        callback(pointsTransformed,tStart,i)        
        
        /*
        var pointsTransformed = []
        pointsPattern.forEach(function(point){
            var coords = rtn(tStart+point.t)
            pointsTransformed.push(coords.x+coords.nx*point.d+200)
            pointsTransformed.push(coords.y+coords.ny*point.d+200)
        })
        callback(pointsTransformed,tStart,i)
        */
    }
}

// testing
LS.testing = function(id,patternType,source) {
    var draw = SVG("paper").size(1280, 720)
    
    draw.line(tx,ty,tx+2000,ty).attr({ stroke: '#000', "stroke-width" : "0.5" })
    draw.line(tx,ty,tx,ty+2000).attr({ stroke: '#000', "stroke-width" : "0.5" })

    var tx = 0
    var ty = 0

    var len = Math.random()*6+2
    
    if (source==0){
        var pts = []
        for (var i=0;i<len;i++){
            pts.push({x:Math.random()*1280,y:Math.random()*720})
        }

    }
    else {
        var p1 = Pt(100,100)
        var p2 = Pt(600,100)
        var p3 = Pt(100,600)
        var p4 = Pt(600,600)
        var p5 = Pt(900,350)
        var p6 = Pt(100,200)
        var p7 = Pt(100,100)
        var pts = [p1,p2,p3,p4,p5,p6,p7]
    }

    pts.forEach(function(point){
        draw.circle(6).move(point.x+tx-3,point.y+ty-3).attr({fill: "#f00"})
    })
    
    var time0 = (new Date()).getTime()
    if (id==1){
        var patternPoints,patternDir,patternXY
        switch(patternType){
            case 1:
                // arrow in curve direction
                patternPoints = [Pt(0,2),Pt(5,0),Pt(0,-2),Pt(0,-0.5),Pt(-15,-0.5),Pt(-15,0.5),Pt(0,0.5)]
                patternDir = Pt(30,0) 
                patternXY = Pt(0,0)
                break;
            case 2:
                // zigzag line
                patternPoints = [Pt(0,0),Pt(6,6),Pt(12,-6),Pt(18,0)] // arrow in curve direction
                patternDir = Pt(18,0) 
                patternXY = Pt(0,0)
                break;
            case 3:
                // fancy zigzag line
                patternPoints = [Pt(0,0),Pt(15,8),Pt(30,-8),Pt(45,0)] // arrow in curve direction
                patternDir = Pt(30,0) 
                patternXY = Pt(0,0)
                break;
            case 4:
                // arrow orthogonal to curve direction
                patternPoints = [Pt(0,1.5),Pt(20,0),Pt(0,-1.5)]
                patternDir = Pt(0,10) 
                patternXY = Pt(0,-5)
                break;
            case 5:
                // line with text
                patternPoints = [Pt(0,0),Pt(7,0),Pt(14,0),Pt(21,0),Pt(28,0)]
                patternDir = Pt(42,0) 
                patternXY = Pt(0,0)
                break;                
        }
        var pattern = LS.createPattern(patternPoints,patternDir,patternXY)
        var time0 = (new Date()).getTime()
        var path = ""
        LS.transformPoints(pts,pattern,-0.2,LS.getBezier,function(points,tStart,idx){
            switch(patternType){
                case 1:
                    path += "M"
                    var fst = points.shift()
                    path += (fst.x+tx) + " " + (fst.y+ty) + " "
                    path += "L"
                    points.forEach(function(point){path += (point.x+tx) + " " + (point.y+ty) + " "})
                    path += "Z "
                    break;
                case 2:
                    path += "M" + points[0].x + " " + points[0].y + " C "
                    path += points[1].x + " " + points[1].y + " " + points[2].x + " " + points[2].y + " " + points[3].x + " " + points[3].y + " "
                    break;
                case 3:
                    path += "M" + points[0].x + " " + points[0].y + " C "
                    path += points[1].x + " " + points[1].y + " " + points[2].x + " " + points[2].y + " " + points[3].x + " " + points[3].y + " "
                    break;
                case 4:
                    path += "M"
                    var fst = points.shift()
                    path += (fst.x+tx) + " " + (fst.y+ty) + " "
                    path += "L"
                    points.forEach(function(point){path += (point.x+tx) + " " + (point.y+ty) + " "})
                    path += "Z "
                    break;    
                case 5:
                    var word = "World"
                    for (var i=0;i<5;i++){
                        draw.text(word[i]).font({family:"monospace"}).move(points[i].x,points[i].y).rotate(-Pt.xan({x:points[0].tx,y:points[0].ty})*180/3.141)
                    }
                    break;
            }
        })
        $('svg').prepend($('defs').html('<linearGradient id="linear" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f00"></stop><stop offset="20%" stop-color="#ff0"></stop><stop offset="40%" stop-color="#0f0"></stop><stop offset="60%" stop-color="#0ff"><stop offset="80%" stop-color="#00f"><stop offset="100%" stop-color="#f0f"></linearGradient>'))
        switch (patternType){
            case 1:
                draw.path(path).fill("url(#linear)").stroke({width:0.2})                
                break;
            case 2:
                draw.path(path).fill("none").stroke({width:1, color:"url(#linear)"})
                break;
            case 3:
                draw.path(path).fill("none").stroke({width:1})
                break;
            case 4:
                draw.path(path).fill("url(#linear)").stroke({width:0.2})                
                break;                
        }
    }
    else if (id==2){
        var gPM = LS.getGlobalParametrization(pts,-0.2,LS.getBezier)
        for (var t=0;t<=gPM.arcLen;t+=8) {
            var v = Math.round((t/gPM.arcLen*0.7+0.15)*255)
            var rtn = gPM.rtn(t)

            draw.circle(2).move(rtn.x+tx-1,rtn.y+ty-1).attr({fill: 'rgb(' +  v + "," + v + "," + v + ")"})

            var xt = rtn.tx
            var yt = rtn.ty
            xt *= 2
            yt *= 2
            draw.line(rtn.x-xt+tx,rtn.y-yt+ty,rtn.x+xt+tx,rtn.y+yt+ty).attr({ stroke: 'rgb(' +  (255-v) + "," + v + "," + Math.round((v/255))*v + ")", "stroke-width" : "0.5" })

            var xn = rtn.nx
            var yn = rtn.ny
            xn *= 5
            yn *= 5
            draw.line(rtn.x+tx,rtn.y+ty,rtn.x+xn+tx,rtn.y+yn+ty).attr({ stroke: 'rgb(' +  (255-v) + "," + v + "," + Math.round((v/255)) + ")", "stroke-width" : "0.5" })

        }
    }
    
    var runtime = ((new Date()).getTime()-time0)/1000
    console.log("runtime",runtime,"s")
    return runtime
}
LS.showDemo = function(i){
    $('#paper').empty()
    var runtime
    var source = $('#source>option:checked').attr('id') == "pre" ? 1 : 0
    if (i==0){
        runtime = LS.testing(2,0,source)
    }
    else {
        runtime = LS.testing(1,i,source)
    }
    $('#runtime').text("Runtime: "+runtime+"s")
}