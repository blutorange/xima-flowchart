//
// KLay Layered and KLayJS is licensed under the Eclipse Public License.
// See http://rtsys.informatik.uni-kiel.de/confluence/display/KIELER/Overview
//  and http://rtsys.informatik.uni-kiel.de/~kieler/epl-v10.html.
//

// http://naiad.formcloud.de/formcycle/flowchart.jsp?pid=2300
// naiad.formcloud.de
// root
// /master_

XV = function (folder,servlet,paper) {
    var self = this
    D = this
    self.folder = folder
    self.paper = paper
    self.paperWidth = self.paper.clientWidth
    self.paperHeight = self.paper.clientHeight
    self.svg = d3.select(paper).append("svg")
        .attr("width", self.paperWidth)
        .attr("height", self.paperHeight)
        .attr("id","paper-svg")
    self.svgDefs = []
    self.svgG = self.svg.append("g").attr("id","paper-g")
    self.svgNode = self.svg.node()
    self.svgGNode = self.svgG.node()
    self.svgTranslate0 = Pt(0,0)
    self.svgScale0 = Pt(1,1)
    XV.setTranslate(self.svgGNode,self.svgTranslate0)
    XV.setScale(self.svgGNode,self.svgScale0)
    
    d3.json(folder+"data/workflow.json",function(error,data){
        if (error){self.handleError(error);return}
        d3.json(folder+"data/layout.json",function(error,layout){
            if (error){self.handleError(error);return}                
            self.data = data
            self.layout = layout
            self.highlightElements = {}
            self.highlightElements.edgeStatus = {}
            self.layout.edgeStatus.highlightMode = XV.browserSupport.elementsFromPoint ? self.layout.edgeStatus.highlightMode : "TOPMOST"
            self.resources = data.properties["de.xima.fc.resources"]
            self.main()
        })
    })
    return this
}
XV.prototype.handleError = function (error){
    var self = this
    var errMsg = String(error) + "\n"
    for (var key in error) {
        errMsg += (key + ": " + error[key] + "\n")
    }
    self.removeLoadBar()
    $(this.paper).children("svg").hide()
    $(this.paper).append($('<p>')
        .text('Leider gab es einen Fehler beim Laden des Diagrams. Bitte versuchen Sie es später erneut oder starten Sie ihren Browser neu.')
        .css({"color":"red","font-weight":"700","font-size":"3em"})
    )
    .append($('<pre>')
        .text('Fehlerdetails: ' + errMsg)
        .css({"color":"black","font-weight":"100","font-size":"1.0em"})
    )
    $(self.paper).trigger("error")
}

XV.IDS = {}
XV.setDefault = function(obj,key,type,def){
    try {
        obj[key] = obj.hasOwnProperty(key) ? type(obj[key]) : def
    }
    catch(e){
        obj[key] = def
    }
}
// http://stackoverflow.com/questions/8486099/how-do-i-parse-a-url-query-parameters-in-javascript
XV.getJsonFromUrl = function(hashBased) {
    var query
    if(hashBased) {
        var pos = location.href.indexOf("?")
        if(pos==-1){return []}
        query = location.href.substr(pos+1)
    }
    else {
        query = location.search.substr(1)
    }
    var result = {}
    query.split("&").forEach(function(part) {
        if(!part){return}
        part = part.replace("+"," ")
        var eq = part.indexOf("=")
        var key = eq>-1 ? part.substr(0,eq) : part
        var val = eq>-1 ? decodeURIComponent(part.substr(eq+1)) : ""
        var from = key.indexOf("[")
        if(from==-1){
            result[decodeURIComponent(key)] = val
        }
        else {
            var to = key.indexOf("]")
            var index = decodeURIComponent(key.substring(from+1,to))
            key = decodeURIComponent(key.substring(0,from))
            if(!result[key]){result[key] = []}
            if(!index){
                result[key].push(val)
            }
            else {
                result[key][index] = val
            }
        }
    })
    return result
}
XV.browserSupport = {}
XV.checkBrowserSupport = function(){
    // document.elementsFromPoint
    XV.setElementsFromPoint()
    // classList.add for SVG
    XV.setClassListAdd()
}
// Workaround for browsers not supporting elementsFromPoint but elementFromPoint
// elementsFromPoint does not work properly for some svg element in Opera.
XV.setElementsFromPoint = function(){
    var avail = true
    var fix = false
    var test = document.getElementById('eFPTest')
    var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0
    if (document.elementFromPoint){
        if (document.elementsFromPoint) {
            var rect = test.getClientRects()[0]
            var el = document.elementsFromPoint(rect.left,rect.top)
            if (!isOpera && el && el.length>0 && el[0].id==="eFPTest") { // elementsFromPoint somewhat broken in opera for now
                XV.elementsFromPoint = document.elementsFromPoint.bind(document)
                XV.elementsAtPointDT = -1
                console.log("elementsFromPoint: native")
            }
            else {
                fix = true
                XV.elementsFromPoint = XV.elementsFromPointFix            
                XV.elementsAtPointDT = 1000
                console.log("elementsFromPoint: fix")
            }
        }
        else {
            fix = true            
            XV.elementsFromPoint = XV.elementsFromPointFix
            XV.elementsAtPointDT = 1000
            console.log("elementsFromPoint: fix")
        }
    }
    else {
        fix = false
        console.log("elementsFromPoint: unavailable")
        XV.elementsAtPointDT = -1
        avail = false
    }
    $(test).remove()
    XV.browserSupport.elementsFromPoint = avail
    XV.browserSupport.elementsFromPointFix = fix
}
// JQuery's addClass does not work with svg elements, so we need
// to resort to javascript's classList.add.
// IE does not support classList on svg element, so we need a work-around.
XV.setClassListAdd = function() {
    var avail = true
    if (document.getElementById("ieSvgClassTest").classList !== undefined){
        XV.addClass = function(el,clazz) {
            el.classList.add(clazz)
        }
        XV.removeClass = function(el,clazz) {
            el.classList.remove(clazz)
        }        
    }
    else {
        avail = false
        // IE fix
        XV.addClass = function(el,clazz) {
            var classList = _.words(el.getAttribute("class")||"",/[^ ]+/g)
            if (classList.indexOf(clazz)<0) {
                classList.push(clazz)
                el.setAttribute("class",classList.join(" "))
            }
        }
        XV.removeClass = function(el,clazz) {
            var classList = _.words(el.getAttribute("class")||"",/[^ ]+/g)
            var idx = classList.indexOf(clazz)            
            if (idx>0) {
                classList.splice(idx,1)
                el.setAttribute("class",classList.join(" "))
            }
        }        
    }    
    
    XV.browserSupport.classListAdd = avail
}
XV.elementsFromPointFix = function(x,y){
    var elements = []
    var pointerEvents = []
    var el
    while (el = document.elementFromPoint(x,y)){
        var pointerEvent = $(el).css("pointer-events") || el.getAttribute("pointer-events")
        elements.push(el)
        pointerEvents.push(pointerEvent)
        $(el).css("pointer-events","none")
        el.removeAttribute("pointer-events")
        if ((el.tagName||el.nodeName)==="HTML"){break} // in some(all?) browsers, elementFromPoint always returns at least the root html
    }
    for (var i=0;i<elements.length;i++){
        $(elements[i]).css("pointer-events",pointerEvents[i] || "auto")
    }
    return elements
}
XV.actionClass = [
    "GENERAL",   // Abschlussseite
    "GENERAL",   // Callback
    "GENERAL",  // Datei an Vorgang anhängen
    "GENERAL",  // Datei ausliefern
    "GENERAL",   // Datenbank SQL
    "GENERAL",  //  EMail
    "GENERAL",   // Export Persistence
    "GENERAL",   // Export XML
    "GENERAL",   // Externe Resource
    "GENERAL",   // Formular ändern
    "GENERAL",   // Komprimieren
    "GENERAL",   // PDF Fill
    "GENERAL",   // Post Request
    "GENERAL",   // Plugin ausführen
    "GENERAL",  // Speichern (Dateisystem)
    "GENERAL",   // Statusänderung
    "GENERAL",   // Textdatei erzeugen
    "GENERAL",   // Upload bereitstellen
    "GENERAL",   // Verarbeitung abbrechen
    "GENERAL",   // Duplizieren
    "GENERAL",   // Neue Prozess-ID
    "GENERAL",   // Postfach kopieren
    "GENERAL",   // Postfach verschieben
    "GENERAL",   // Vorgang löschen
    "GENERAL",   // Weiterleitung
    "GENERAL",   // Word Fill
    "GENERAL",  // XML Einlesen
]
XV.uniqueID = function(id){
    var newId
    XV.IDS[id] = XV.IDS[id] || []
    newId = id + "-xima-clone-" + XV.IDS[id].length
    XV.IDS[id].push(newId)
    return newId
}
XV.clone = function(el,a,b,callback){
    var clone = $(el).clone(a,b)
    clone.find("[id]").addBack(clone.filter("[id]")).each(function(){
        var self = this
        var id = self.getAttribute("id")
        var newId = XV.uniqueID(id)
        callback && callback(id,newId)
        self.setAttribute("id",newId)
        XV.addClass(self,"id-"+id)
    })
    return clone[0]
}
XV.allElementsAtMouse = function(clientX,clientY,selector){
    var elements = XV.elementsFromPoint(clientX,clientY) //document.elementsFromPoint(clientX,clientY)
    return $(elements).filter(selector)
}
// Axis-aligned line.
XV.getPointLineDistance = function(rx,ry,line){
    if (line.direction=="vertical"){
        return (ry<line.ymin) ? Math.sqrt((rx-line.xm)*(rx-line.xm)+(ry-line.ymin)*(ry-line.ymin)) : (ry>line.ymax) ? Math.sqrt((rx-line.xm)*(rx-line.xm)+(ry-line.ymax)*(ry-line.ymax)) : Math.abs(rx-line.xm)
    }
    else {
        return (rx<line.xmin) ? Math.sqrt((rx-line.xmin)*(rx-line.xmin)+(ry-line.ym)*(ry-line.ym)) : (rx>line.xmax) ? Math.sqrt((rx-line.xmax)*(rx-line.xmax)+(ry-line.ym)*(ry-line.ym)) : Math.abs(ry-line.ym)
    }
}
// Axis-aligned bounding box.
XV.getPointBBoxDistance = function(rx,ry,xmin,ymin,xmax,ymax){
    var r1,r2,r3,r4
    // right edge
    r1 = (ry<ymin) ? Math.sqrt((rx-xmax)*(rx-xmax)+(ry-ymin)*(ry-ymin)) : (ry>ymax) ? Math.sqrt((rx-xmax)*(rx-xmax)+(ry-ymax)*(ry-ymax)) : Math.abs(rx-xmax)
    // top edge
    r2 = (rx<xmin) ? Math.sqrt((rx-xmin)*(rx-xmin)+(ry-ymin)*(ry-ymin)) : (rx>xmax) ? Math.sqrt((rx-xmax)*(rx-xmax)+(ry-ymin)*(ry-ymin)) : Math.abs(ry-ymin)
    // left edge
    r3 = (ry<ymin) ? Math.sqrt((rx-xmin)*(rx-xmin)+(ry-ymin)*(ry-ymin)) : (ry>ymax) ? Math.sqrt((rx-xmin)*(rx-xmin)+(ry-ymax)*(ry-ymax)) : Math.abs(rx-xmin)
    // bottom edge
    r4 = (rx<xmin) ? Math.sqrt((rx-xmin)*(rx-xmin)+(ry-ymax)*(ry-ymax)) : (rx>xmax) ? Math.sqrt((rx-xmax)*(rx-xmax)+(ry-ymax)*(ry-ymax)) : Math.abs(ry-ymax)
    return Math.min(r1,r2,r3,r4)
}
XV.moveElementBy = function(el,dx,dy){
    return XV.setTransform(el,function(r){return {x:r.x+dx,y:r.y+dy}})
}
XV.getTranslate = function(el){
    var attr = el.getAttribute("transform") || ""
    var trans
    try {
        var match = attr.match(/translate\(\s*([0-9.\-]+)[ ,]([0-9.\-]+)\)/)
        trans = {x:parseFloat(match[1]),y:parseFloat(match[2])}
    }
    catch(e){
        trans = {x:0,y:0}
    }
    return trans
}
XV.getScale = function(el){
    var attr = el.getAttribute("transform") || ""
    var scale
    try {
        var match = attr.match(/scale\(\s*([0-9.\-]+)([ ,]([0-9.\-]+))?\)/)
        scale = {x:parseFloat(match[1]),y:parseFloat(match[3]||match[1])}
    }
    catch(e){
        scale = {x:1,y:1}
    }
    return scale
}
XV.getNewTranslate = function(el,translate){
    var trans, newTransform
    if (el.getAttribute){
        trans = el.getAttribute("transform") || ""
    }
    else {
        trans = el || ""
    }
    try {
        var hasMatch = false
        newTransform  = trans.replace(/translate\(\s*([0-9.\-]+)[ ,]([0-9.\-]+)\)/,function(_,x,y){
            hasMatch = true
            if ((typeof translate)=="function"){
                x = parseInt(x)
                y = parseInt(y)
                translate = translate({x:x,y:y})
            }
            return "translate(" + translate.x + "," + (translate.y||translate.x) + ")"
        })
        if (!hasMatch){
            if ((typeof translate)=="function"){
                translate = translate({x:0,y:0})
            }
            newTransform = trans + (trans.length>0 ? "," : "") + "translate(" + translate.x + "," + (translate.y||translate.x) + ")"            
        }
    }
    catch(e){
        if ((typeof translate)=="function"){
            translate = translate({x:0,y:0})
        }
        newTransform = trans + (trans.length>0 ? "," : "") + "translate(" + translate.x + "," + (translate.y||translate.x) + ")"
    }
    return newTransform
}
XV.getNewScale = function(el,scale){
    var trans, newTransform
    var trans, newTransform
    if (el.getAttribute){
        trans = el.getAttribute("transform") || ""
    }
    else {
        trans = el || ""
    }
    try {
        var hasMatch = false
        newTransform  = trans.replace(/scale\(\s*([0-9.\-]+)([ ,]([0-9.\-]+))?\)/,function(_,x,__,y){
            hasMatch = true
            if ((typeof scale)=="function"){
                x = parseInt(x)
                y = parseInt(y||x)
                scale = scale({x:x,y:y})
            }
            return "scale(" + scale.x + "," + (scale.y||scale.x) + ")"
        })
        if (!hasMatch){
            if ((typeof scale)=="function"){
                scale = scale({x:1,y:1})
            }
            newTransform = trans + (trans.length>0 ? "," : "") + "scale(" + scale.x + "," + (scale.y||scale.x) + ")"            
        }
    }
    catch(e){
        if ((typeof scale)=="function"){
            scale = scale({x:1,y:1})
        }
        newTransform = trans + (trans.length>0 ? "," : "") + "scale(" + scale.x + "," + (scale.y||scale.x) + ")"
    }
    return newTransform
}
XV.getNewTransform = function(el,translate,scale){
    return XV.getNewScale(XV.getNewTranslate(el,translate),scale)
}
XV.setTranslate = function (el,translate){
    el.setAttribute("transform",XV.getNewTranslate(el,translate))
    return el
}
XV.setScale = function (el,scale){
    el.setAttribute("transform",XV.getNewScale(el,scale))
    return el
}
XV.setTransform = function(el,translate,scale){
    XV.setTranslate(el,translate)
    XV.setScale(el,scale)
    return el
}
XV.isRangeIntersecting = function(s1,s2,q1,q2){
    return q1>=s1&&q1<=s2 || q2>=s1&&q2<=s2 || s1>=q1&&s1<=q2
}
// getBBox is broken.
XV.prototype.getBBoxFix = function(el) {
    var cRectEl = el.getBoundingClientRect()
    var cRectSvg = this.svgNode.getBoundingClientRect()
    var width = cRectEl.width
    var height = cRectEl.height
    var x = cRectEl.left - cRectSvg.left
    var y = cRectEl.top - cRectSvg.top
    return {width:width, height:height, x:x, y:y}
}
XV.generateTransitionLines = function(edge){
    var lines = []
    var kGraphEdge = edge.kGraphEdge
    var bendPoints = kGraphEdge.bendPoints
    var len = bendPoints.length
    var minX = Math.min(kGraphEdge.sourcePoint.x,kGraphEdge.targetPoint.x)
    var maxX = Math.max(kGraphEdge.sourcePoint.x,kGraphEdge.targetPoint.x)
    var minY = Math.min(kGraphEdge.sourcePoint.y,kGraphEdge.targetPoint.y)
    var maxY = Math.max(kGraphEdge.sourcePoint.y,kGraphEdge.targetPoint.y)
    function addLine(p1,p2){
        var line = {}
        line.x1 = p1.x
        line.x2 = p2.x
        line.y1 = p1.y
        line.y2 = p2.y
        line.xmin = Math.min(line.x1,line.x2)
        line.xmax = Math.max(line.x1,line.x2)
        line.ymin = Math.min(line.y1,line.y2)
        line.ymax = Math.max(line.y1,line.y2)
        if (Math.abs(line.x2-line.x1) < Math.abs(line.y2-line.y1)){
            line.direction = "vertical"
            line.length = Math.abs(line.y2-line.y1)
        }
        else {
            line.direction = "horizontal"
            line.length = Math.abs(line.x2-line.x1)
        }
        line.xm = (line.x1+line.x2)/2
        line.ym = (line.y1+line.y2)/2
        lines.push(line)
    }
    if (bendPoints.length>0){
        addLine(kGraphEdge.sourcePoint,bendPoints[0])
    }
    for (var i=0;i<len-1;i++){
        addLine(bendPoints[i],bendPoints[i+1])
        minX = Math.min(bendPoints[i].x,minX)
        maxX = Math.max(bendPoints[i].x,maxX)
        minY = Math.min(bendPoints[i].y,minY)
        maxY = Math.max(bendPoints[i].y,maxY)
    }
    if (bendPoints.length>0){
        addLine(bendPoints[len-1],kGraphEdge.targetPoint)
        minX = Math.min(bendPoints[len-1].x,minX)
        maxX = Math.max(bendPoints[len-1].x,maxX)
        minY = Math.min(bendPoints[len-1].y,minY)
        maxY = Math.max(bendPoints[len-1].y,maxY)        
    }
    else {
        addLine(kGraphEdge.sourcePoint,kGraphEdge.targetPoint)
    }
    edge.lines = lines
    edge.bBox = {x1:minX,x2:maxX,y1:minY,y2:maxY,width:maxX-minX,height:maxY-minY}
}
XV.mergeElements = function(els){
    els = $(els)
    var first = els.first()
    for (var i=1;i<els.length;i++){
        first.append(els[i].childNodes)
    }
    return els.first()
}
XV.simpleBlockEndTokens = {'{':'}','[':']','(':')'}
XV.stringifyCSSToken = function(token){
    if (token instanceof Func) {
        return token.name + "(" + XV.stringifyCSSToken(token.value) + ")"
    }
    else if (token instanceof SimpleBlock){
        return token.name + XV.stringifyCSSToken(token.value) + XV.simpleBlockEndTokens[token.name]
    }
    else if (token instanceof QualifiedRule) {
        return XV.stringifyCSSToken(token.prelude) + XV.stringifyCSSToken(token.value)
    }
    else if (token instanceof Declaration) {
        return token.name + ":" + XV.stringifyCSSToken(token.value) + (token.important ? ' !important' : '')
    }
    else if (token instanceof Array) {
        return _.map(token,function(t){return XV.stringifyCSSToken(t)}).join('')
    }
    else if (token.toSource) {
        return token.toSource()
    }
    else {
        throw new SyntaxError("cannot parse as css token: " + token)
    }
}
XV.convertIdSelectorsToClassSelectors = function(oldSelectors,prefix){
    var newSelectors = {}
    var delimToken = new DelimToken()
    delimToken.value = "."
    var convertSelector = function(oldSelector){
        var prelude = parseARule(oldSelector + " {}").prelude
        var newSelector = []
        prelude.forEach(function(token){
            if ((token instanceof HashToken) && (token.type === "id")){
                var identToken = new IdentToken()
                identToken.value = prefix + token.value
                newSelector.push(delimToken)
                newSelector.push(identToken)
            }
            else {
                newSelector.push(token)
            }
        })
        return XV.stringifyCSSToken(newSelector)
    }
    for (var key in oldSelectors) {
        var oldSelector = oldSelectors[key]
        if (oldSelector instanceof Array) {
            var ns = []
            oldSelector.forEach(function(os){
                ns.push(convertSelector(os))
            })
            newSelectors[key] = ns
        }
        else {
            newSelectors[key] = convertSelector(oldSelector)
        }
    }
    return newSelectors
}

// Get svg coordinates corresponding to the current mouse position.
XV.prototype.getPositionFromMouse = function(ev){
    var svgGNode = this.svgGNode
    var translate = XV.getTranslate(svgGNode)
    var scale = XV.getScale(svgGNode)
    var offset = $(svgGNode).offset()
    var pX = d3.event.pageX
    var pY = d3.event.pageY
    return {x:(pX+offset.left-translate.x)/scale.x,y:(pY+offset.top-translate.y)/scale.y}
}
XV.prototype.showTextPopup = function (el,text){
    var self = this
    var popup = $('#dynamic-popup')
    popup.css("opacity","0.0")
    popup.addClass("popupOpen")
    popup.text(text)
    // Determine popup position relative to element.
    var BBoxText = el.getBoundingClientRect()
    var BBoxPopup = popup[0].getBoundingClientRect()
    var centerTextX = (BBoxText.left+BBoxText.right)/2
    var centerTextY = (BBoxText.top+BBoxText.bottom)/2
    var screenX = document.documentElement.clientWidth
    var screenY = document.documentElement.clientHeight
    var popupX, popupY
    if (centerTextY>screenY/2) {
        popupY = BBoxText.top-BBoxPopup.height // above the text box
    }
    else {
        popupY = BBoxText.top+BBoxText.height // below the text box
    }
    if (centerTextX<screenX/2) {
        popupX = BBoxText.left+BBoxText.width // to the right of the text box
    }
    else {
        popupX = BBoxText.left-BBoxPopup.width // to the left of the text box
    }
    // Keep it on screen.
    if(popupX<0){popupX=0}
    if(popupY<0){popupY=0}
    if(popupX>screenX-BBoxPopup.width){popupX=screenX-BBoxPopup.width}
    if(popupY>screenY-BBoxPopup.height){popupY=screenY-BBoxPopup.height}
    // Apply positioning.
    popup.css({
        "top": popupY+"px",
        "left": popupX+"px",
    })
    popup.animate({
        "opacity": "1.0",
    }, self.layout.popupText.fadeIn, "swing")
    
}
XV.prototype.resURL = function (file){
    return this.folder + file
}
// !! "begin" attribute is not supported !! (used for animations)
XV.prototype.cleanupDefs = function(defs,svg){
    this.defsID = this.defsID || 0
    var self = this
    var prefix = "xima-svg-defs-" + (self.defsID++) + "-"
    var subID = 0
    var idHash = {}
    // Merge all defs into one defs.
    var def = XV.mergeElements(defs)
    
    // Assign unique ids.
    def = XV.clone(def,false,false,function(oldID,newID){
        idHash[oldID] = newID
    })
    
    // Replace references to defined elements in svg.
    // Based upon https://github.com/svg/svgo/blob/master/plugins/cleanupIDs.js, https://github.com/svg/svgo/blob/master/LICENSE (MIT)
    var refsRegUrl = /^url\(("|')?#(.+?)\1\)$/
    var refsRegHref = /^#(.+?)$/
    var refsRegUrlG = /url\(("|')?#(.+?)\1\)/g
    var m,h
    var referencesProps = ['clip-path','color-profile','fill','filter','marker-start','marker-mid','marker-end','mask','stroke']
    ;[def,svg].forEach(function(cont){
        var items = cont.getElementsByTagName("*")
        for (var i = items.length; i--;) {
            var item = items[i]
            if (item.tagName =='style' || item.tagName === 'script'){continue}
            var attrs = item.attributes
            for (var j = attrs.length; j--;){
                var attr = attrs[j]
                ;(referencesProps.indexOf(attr.name)!=-1) && (m=attr.value.match(refsRegUrl)) && (h=idHash[m[2]]) && (attr.value="url('#" + h + "')")
                ;(attr.name === "xlink:href") && (m=attr.value.match(refsRegHref)) && (h=idHash[m[1]]) && (attr.value='#'+h)
                if (attr.name === "style"){
                    // parse the css..
                    var css = parseACommaSeparatedListOfComponentValues(attr.value)[0]
                    var len = css.length
                    for (var k = 0; k<len-2; k++){
                        var token = css[k]
                        var val = css[k+2]
                        if ((token instanceof IdentToken) && (referencesProps.indexOf(token.value)!=-1) && (css[k+1] instanceof ColonToken)) {
                            if (val instanceof URLToken) {
                                var id = val.value.substring(1,val.value.length)
                                ;(h=idHash[id]) && (val.value='#' + h)
                            }
                            else if ((val instanceof Func) && val.name==="url"){
                                var id = val.value[0].value.substring(1,val.value.length)
                                ;(h=idHash[id]) && (val.value[0].value='#' + h)                                
                            }
                        }
                    }
                    // re-stringify the css and apply
                    attr.value = XV.stringifyCSSToken(css)
                }
            }
        }
    })
    return def
}
XV.prototype.newStatusNodes = function() {
    var self = this
    
    /* Needs support for edge routing for arbitrary node positions first.
    var drag = d3.behavior.drag()
      .on("dragstart",function(){d3.event.sourceEvent.stopPropagation()})
      .on("drag",function(){XV.moveElementBy(this,d3.event.dx,d3.event.dy)})
    */
    
    return this.svgG.selectAll('g.node-status')
        .data(self.statusNodes)
        .enter()
        .append(function(d){return d.svgGNode})
        .each(function(d){
            d.svgG.select(d.classSelectors.textTitle).text(" ") // make sure bounding box is not affected by overflowing text
                                                                // emptying the text completely makes getBoundingClientRect report false dimensions...
            d.translate0 = XV.getTranslate(d.svgGNode),
            d.scale0 = XV.getScale(d.svgGNode),
            d.bBox0 = self.getBBoxFix(d.svgGNode)
        })
        //.call(drag)
        .classed("node-status",true)
        .style("visibility","hidden")
        .attr("id",function(d){return d.ximaNode.id})
        .attr("transform",function(d){return XV.getNewTransform("",d.translate0,d.scale0)})
}
XV.prototype.setLoadBar = function(text,pct){
    var self = this
    self.loadDialog.bar.animate({"opacity":Math.random()*0.3+0.6},0*(Math.random()*90+30),"swing",function(){
        self.loadDialog.bar.progressbar("value",pct)
        self.loadDialog.details.text(text)        
    })
}
XV.prototype.removeLoadBar = function() {
    var self=this
    if (self.loadDialog){
        self.loadDialog.bar.animate({"opacity":1},500,"swing",function(){
            self.loadDialog.bar.progressbar("value",100)
        })
    }
    else {
        $('#loadBlock').hide()
        $('#loadDialog').hide()
    }
}
XV.prototype.getkGraphBBox = function() {
    var self = this
    var statusNodes = self.statusNodes
    var transitionEdges = self.transitionEdges
    var minX = statusNodes[0].kGraphNode.x, maxX = statusNodes[0].kGraphNode.x
    var minY = statusNodes[0].kGraphNode.y, maxY = statusNodes[0].kGraphNode.y
    statusNodes.forEach(function(node){
        minX = Math.min(minX,node.kGraphNode.x)
        maxX = Math.max(maxX,node.kGraphNode.x)
        minY = Math.min(minY,node.kGraphNode.y)
        maxY = Math.max(maxY,node.kGraphNode.y)
    })
    transitionEdges.forEach(function(edge){
        edge.kGraphEdge.bendPoints.forEach(function(point){
            minX = Math.min(minX,point.x)
            maxX = Math.max(maxX,point.x)
            minY = Math.min(minY,point.y)
            maxY = Math.max(maxY,point.y)            
        })
    })
    return {x1:minX,x2:maxX,y1:minY,y2:maxY}
}
XV.prototype.getImageFont = function(id){
    var self = this
    var imageFont = self.resources.image.font[id]
    var codepoint = imageFont.codepoint
    var fontId = imageFont.font
    var fontFamily = self.getFont(fontId)    
    return {char:String.fromCharCode(codepoint),fontFamily:fontFamily}
}
XV.prototype.getFont = function(id){
    var self = this
    var font = self.resources.font[id]
    var sourceType = font.sourceType
    var sourceData = font.sourceData
    if (!font.loaded) {
        if (sourceType == "FAMILY") {
            var family
            switch (sourceData) {
                case "de.xima.fc.resource.font.sentinel":
                    family = "ximaSentinel"
                    break;
            }
            return family
        }
    }
    font.loaded = true
}
XV.prototype.setWrappedText = function(elText,elBBox,elEllipsis,text,callbackMouseover,callbackMouseout){
    var self = this
    callbackMouseover = callbackMouseover || $.noop
    callbackMouseout = callbackMouseout || $.noop
    
    function recursiveY() {
        if (textDim.height > BBoxDim.height && textDim.height > 1) {
            var fontSize = jElText.css("font-size")
            var ratioY = BBoxDim.height/textDim.height
            var newFontSize = fontSize.replace(/[0-9.\-]+/,function(fs){
                return parseFloat(fs)*ratioY*0.9
            })
            jElText.css("font-size",newFontSize)
            textDim = self.getBBoxFix(elText)            
            return recursiveY()
        }
    }
    
    function recursiveX() {
        // Get dimensions.
        if (textDim.width > BBoxDim.width && elText.textContent.length>0) {
            isOverflow = true
            // Clip text
            var ratioX = BBoxDim.width/textDim.width
            var text = elText.textContent
            var newChars = Math.round(ratioX*text.length)
            if(newChars==text.length){newChars--}
            elText.textContent = text.substr(0,newChars)
            // Recompute bounding box
            textDim = self.getBBoxFix(elText)
            // Reposition
            // Not needed for now.
            //recursiveX()
        }        
    }

    var isOverflow = false
    var jElText = $(elText)
    var jElEllipsis = $(elEllipsis)
    var parText = $(elText).closest("text")[0]
    var textDim = self.getBBoxFix(elText)
    var BBoxDim = self.getBBoxFix(elBBox)
    jElEllipsis.css("visibility","hidden")

    // Set new text
    elText.textContent = text
    elText.__ORIGINAL_TEXT__ = text
    
    // Get dimensions.
    var textDim = self.getBBoxFix(elText)
    var BBoxDim = self.getBBoxFix(elBBox)
    
    recursiveY()
    recursiveX()

    if (isOverflow) {
        // Setup callback
        if (callbackMouseover){
            $(parText).on("mouseover",function(){callbackMouseover(this,elText.textContent,elText.__ORIGINAL_TEXT__)})
        }
        if (callbackMouseout){
            $(parText).on("mouseout",function(){callbackMouseout(this,elText.textContent,elText.__ORIGINAL_TEXT__)})
        }        
        // Show Ellipsis
        jElEllipsis.css("visibility","visible")
    }
    return isOverflow
}
XV.prototype.zoomToKGraphBoundaries = function () {
    var self = this
    var paperX = self.paperWidth
    var paperY = self.paperHeight
    var minX = self.kGraphBBox.x1-0.1*paperX
    var maxX = self.kGraphBBox.x2+0.1*paperX
    var minY = self.kGraphBBox.y1-0.1*paperY
    var maxY = self.kGraphBBox.y2+0.1*paperY
    var scaleX = paperX/(maxX-minX)
    var scaleY = paperY/(maxY-minY)
    var scale = Math.min(scaleX,scaleY)
    var transform = 'scale(' + scale + '),translate(' + -minX*scale + ',' + -minY*scale + ')'
    self.svgGZoom.scale(scale)
    self.svgGZoom.translate([-minX*scale,-minY*scale])
    self.svgG.transition()
        .duration(scale>1 ? scale*200 : 2000-scale*1800)
        .attr("transform",transform)
}
// This function assumes that no transition edge intersects itself.
XV.prototype.computeEdgeIntersections = function() {
    var self = this
    var transitionEdges = self.transitionEdges
    var lenEdges = transitionEdges.length
    var intersectionsCross = []
    var intersectionsTip = []
    var time = (new Date()).getTime()
    for (var edgeI=0;edgeI<lenEdges-1;edgeI++){
        var edgeA = transitionEdges[edgeI]
        for (var edgeJ=edgeI+1;edgeJ<lenEdges;edgeJ++){
            var edgeB = transitionEdges[edgeJ]
            // Check bounding boxes for intersection.
            if (XV.isRangeIntersecting(edgeA.bBox.x1,edgeA.bBox.x2,edgeB.bBox.x1,edgeB.bBox.x2) &&
                XV.isRangeIntersecting(edgeA.bBox.y1,edgeA.bBox.y2,edgeB.bBox.y1,edgeB.bBox.y2)){
                // Check whether any lines intersect.
                edgeA.lines.forEach(function(lineA){
                    edgeB.lines.forEach(function(lineB){
                        if (lineA.direction==lineB.direction){return}
                        if (lineA.direction=="horizontal" && lineB.xm >= lineA.xmin && lineB.xm<=lineA.xmax && lineA.ym>=lineB.ymin && lineA.ym<=lineB.ymax){
                            var ratioX = (lineB.xm-lineA.xmin)/(lineA.length)
                            var ratioY = (lineA.ym-lineB.ymin)/(lineB.length)
                            if (ratioX>0.01 && ratioX < 0.99 && ratioY>0.01 && ratioY < 0.99) {
                                intersectionsCross.push({x:lineB.xm,y:lineA.ym,horizontalLine:lineA,verticalLine:lineB,horizontalEdge:edgeA,verticalEdge:edgeB})
                            }
                            else {
                                intersectionsTip.push({x:lineB.xm,y:lineA.ym,horizontalLine:lineA,verticalLine:lineB,horizontalEdge:edgeA,verticalEdge:edgeB})                                
                            }
                        }
                        else if (lineB.direction=="horizontal" && lineA.xm >= lineB.xmin && lineA.xm<=lineB.xmax && lineB.ym>=lineA.ymin && lineB.ym<=lineA.ymax){
                            var ratioX = (lineA.xm-lineB.xmin)/(lineB.length)
                            var ratioY = (lineB.ym-lineA.ymin)/(lineA.length)
                            if (ratioX>0.01 && ratioX < 0.99 && ratioY>0.01 && ratioY < 0.99) {
                                intersectionsCross.push({x:lineA.xm,y:lineB.ym,horizontalLine:lineB,verticalLine:lineA,horizontalEdge:edgeB,verticalEdge:edgeB})
                            }
                            else {
                                intersectionsTip.push({x:lineA.xm,y:lineB.ym,horizontalLine:lineB,verticalLine:lineA,horizontalEdge:edgeB,verticalEdge:edgeB})                                
                            }
                        }
                    })
                })
            }
        }
    }
    console.log(((new Date()).getTime()-time)/1000)
    return {cross:intersectionsCross,tip:intersectionsTip}
}
// Get the edge closest to the point.
// Checks edges whose bounding boxes are closest first.
XV.prototype.getClosestEdge = function(rx,ry){
    var self = this
    var edges = _.map(self.transitionEdges,function(edge){
        var bBox = edge.bBox
        var distance = XV.getPointBBoxDistance(rx,ry,bBox.x1,bBox.y1,bBox.x2,bBox.y2)
        return {distanceBBox:distance,edge:edge}
    })
    var sortedEdges = _.sortBy(edges,function(edge){return edge.distanceBBox})
    var dMin = null
    var eMin = null
    var lMin = null
    sortedEdges.forEach(function(edge){
        if (!dMin || edge.distanceBBox <= dMin){
            var lmin = _.min(edge.edge.lines,function(line){
                return XV.getPointLineDistance(rx,ry,line)
            })
            var dmin = XV.getPointLineDistance(rx,ry,lmin)
            if (!dMin || dmin<dMin){
                dMin = dmin
                eMin = edge.edge
                lMin = lmin
            }
        }
    })
    return {distance:dMin, edge:eMin, line:lMin}
}
// Enter invisible broad edges for detecting mouseover.
XV.prototype.triggerStatusEdgeHighlight = function(els){
    var self = this
    var hElEs = self.highlightElements.edgeStatus
    // Unhighlight old edges.
    for (var id in hElEs) {
        var par = hElEs[id]
        XV.removeClass(par,"is-mouseover") // remove highlight
        delete hElEs[id]
    }
    // Highlight new edges.
    els.each(function(){
        var par = this.parentNode
        hElEs[par.getAttribute("id")] = par
        $('svg g.edge-status').last().after(par) // put edge in front
        XV.addClass(par,"is-mouseover") // highlight edge                    
    })
}
XV.prototype.setTooltipActionIcon = function(){
    var jTooltip = $('#actionTooltip').detach()
    var jDisplayName = jTooltip.find('#displayName')
    var jActions = jTooltip.find('#actions')
    $('#paper').tooltip({
        items: '.text-action-active',
        content: function(){
            Z=this
            var elD = d3.select(this)
            var d = elD.datum()
            var displayName = d.actions[0].properties["de.xima.fc.action.displayName"]
            jDisplayName.text(displayName)
            jActions.empty()
            d.actions.forEach(function(action){
                var li = document.createElement("li")
                var span1 = document.createElement("span")
                var span2 = document.createElement("span")
                var cond = action.properties["de.xima.fc.action.condition"]
                span1.classList.add("tooltip-action-status-name")
                span2.classList.add("tooltip-action-condition-name")
                span1.textContent = action.properties["de.xima.fc.status.name"]
                span2.textContent = cond.type==="NONE" ? "" : (" (" + cond.displayName + ")")
                li.appendChild(span1)
                li.appendChild(span2)
                jActions.append(li)
            })
            return jTooltip
        },
    })
}

// STEP 0: Load and show loading bar.
//         Setup zoom and dragging gestures.
//         Setup line interpolator.
// Proceed to step 1.
XV.prototype.main = function(){
    var self = this

    var loadDialog = $('#loadDialog')
    var loadLabel = $('#loadDialogLabel')
    var loadBar = $('#loadDialogBar')
    var loadDetails = $('#loadDialogDetails')
    var loadBlock = $("#loadBlock")
    var zoom, zoomed
    var lineInterpolator
    
    // Load Bar
    loadDialog.dialog({
        autoOpen: true,
        closeOnEscape: false,
        dialogClass: "dialog-no-close dialogLoad",
        hide: {
            effect: "explode",
            duration: 1000,
        },
        resizable: false,
        width: Math.min(window.innerWidth*0.9,800),
    })
    loadBar.progressbar({
        value: 0,
        change: function(){
            loadLabel.text((loadBar.progressbar("value").toFixed(1))+ "% abgeschlossen")
        },
        complete: function(){
            loadDialog.dialog("close")
            loadBlock.animate({"opacity":"0"},1000,"swing",function(){$(this).hide()})
        },
    })

    // Zooming & Dragging
    var zoomed = function() {
        self.svgG.attr("transform", "translate(" + d3.event.translate + "),scale(" + d3.event.scale + ")")
    }
    var zoom = d3.behavior.zoom()
      .scaleExtent([self.layout.diagram.scaleMin,self.layout.diagram.scaleMax])
      .on("zoom",zoomed)
    self.svg.call(zoom)
    
    // Line interpolator
    // Line + Arrow in curve direction
    var patternPoints = self.layout.edgeStatus.patternPoints
    var patternDirection = self.layout.edgeStatus.patternDirection
    var patternOrigin = self.layout.edgeStatus.patternOrigin
    var pattern = LS.createPattern(patternPoints,patternDirection,patternOrigin)
    lineInterpolator = new d3.svg.line()
    lineInterpolator.x(function(d){return d.x})
    lineInterpolator.y(function(d){return d.y})
    lineInterpolator.interpolate(function(points){
        var path = _.map(points,function(r){return r[0] + " " + r[1]}).join("L")
        var mpoints = _.map(points,function(r){return{x:r[0],y:r[1]}})
        LS.transformPoints(mpoints,pattern,0,LS.getBezier,function(pts){
            path += "M"
            path += pts[1].x + " " + pts[1].y + " L"
            path += pts[2].x + " " + pts[2].y + " " + pts[3].x + " " + pts[3].y + " " + pts[4].x + " " + pts[4].y + " Z "
        })
        return path
    })

    self.loadDialog = {dialog:loadDialog,bar:loadBar,block:loadBlock,details:loadDetails}
    self.lineInterpolator = lineInterpolator    
    self.svgGZoom = zoom
    self.readLayoutSVG()
}
// STEP 1: Read svg data from layout.json.
// Proceed to STEP 2 upon completion.
XV.prototype.readLayoutSVG = function() {
    var self = this
    var entries = [self.layout.status.main]
    var promises = []
    var len = entries.length
    var pct = 2, dpct = (9-2)/len
    self.setLoadBar("Lese Layoutresourcen und erstelle Promise-Objekte...",2)
    
    // Read svg file and replace all selectors (eg. #button-expand => .id-button-expand).
    entries.forEach(function(node){
        var url = self.resURL(node.svg)
        var selectors = node.selectors
        var promise = d3.promise.xml(url,"image/svg+xml")
        promise.then(function(data){        
            var svgData = d3.select(data.documentElement)
            var svgGData = svgData.select(self.layout.status.main.selectors.MAIN)
            var svgDefs = $(svgData.node().childNodes).filter('defs')
            var viewBox = svgData.attr("viewBox").trim(" ").match(/([0-9\-.]+) ([0-9\-.]+) ([0-9\-.]+) ([0-9\-.]+)/)
            self.setLoadBar("Lese Layoutresourcen und erstelle Promise-Objekte für ViewBox " + viewBox.join(",") + "...",pct+=dpct)
            var x0 = parseFloat(viewBox[1])
            var y0 = parseFloat(viewBox[2])
            var width = parseFloat(viewBox[3])
            var height = parseFloat(viewBox[4])
            var oldSelectors = self.layout.status.main.selectors
            var newSelectors = {}            

            // Create unique ids and replace references.
            var newDefs = self.cleanupDefs(svgDefs,svgData.node())
            
            // Get class selectors from id selectors.
            var newSelectors = XV.convertIdSelectorsToClassSelectors(oldSelectors,'id-')

            node.svgData = svgData
            node.svgGData = svgGData
            node.bBox = {x0:x0,y0:y0,width:width,height:height}
            node.classSelectors = newSelectors
            // Append defs from svg.
            self.svgNode.appendChild(newDefs)
            self.svgDefs.push(newDefs)        
            self.setLoadBar("Bearbeitung des Objektes " + url + " wird finalisiert...",pct+=dpct)            
        })
        promises.push(promise)
    })
    // Proceed to next step once all svg files are loaded.
    Promise.all(promises).then(function(){
        self.setLoadBar("Einlesen der Layoutresourcen abgeschlossen...",20)                    
        self.loadNodesToDomLayered()
    })    
}
// Step 2: Bind data to status nodes and load to DOM.
// Proceed to step 3 upon completion.
XV.prototype.loadNodesToDomLayered = function(){
    var self = this 
    self.setLoadBar("Füge Knoten in DOM-Struktur ein...",21)                            
    var statusMain = self.layout.status.main
    var svgData = statusMain.svgData
    var len=self.data.children.length, pct=21, dpct=(38-21)/len
    // Create status node data.
    var statusNodes = []
    var statusNodesHash = {}
    self.data.children.forEach(function(node){
        self.setLoadBar("Bearbeite Knoten " + node.id + " und erstelle eineindeutige ID...",pct+=dpct)
        var svgData = statusMain.svgData
        var newStatusGNode = $(XV.clone(svgData.node())).children("g")[0]
        var newStatusGNodeD3 = d3.select(newStatusGNode)
        var actionsHash = {}
        var statusNode = {
            svgG : newStatusGNodeD3,
            svgGNode : newStatusGNode,
            ximaNode : node,
            selectors : statusMain.selectors,
            classSelectors : statusMain.classSelectors,
            actions : node.children,
            actionsHash : actionsHash,
        }       
        node.children.forEach(function(action){
            actionsHash[action.id] = action
        })
        statusNodes.push(statusNode)
        statusNodesHash[node.id] = statusNode
    })

    self.setLoadBar("Binde Graphdaten an DOM-Struktur...",39)
    // Bind data to status nodes and enter nodes.
    self.statusNodes = statusNodes
    self.statusNodesHash = statusNodesHash
    self.newStatusNodes()
    self.setLoadBar("Finalisiere Knotenbindung...",40)

    // Proceed to next step.
    self.prepareLayoutLayered()
}
// Step 3: Generate kGraph.
// Proceed to Step 4 upon completion.
XV.prototype.prepareLayoutLayered = function () {
    var self = this
    self.setLoadBar("Erstelle kGraph-Datenstruktur...",41)
    var data = self.data
    var layout = self.layout
    var statusMain = layout.status.main
    var statusMainBBox = statusMain.bBox
    var kGraph = {}
    var kGraphNodeHash = {}
    var kGraphEdgeHash = {}    
    var portID = 0
    var transitionEdges = []
    
    kGraph.id = data.id
    kGraph.children = []
    kGraph.edges = []
    kGraph.properties = {}
    
    var kGraphNodes = kGraph.children
    var kGraphEdges = kGraph.edges
    var kGraphProperties  = kGraph.properties
    var kGraphAllPorts = {}

    kGraph.properties["de.cau.cs.kieler.direction"] = layout.diagram.direction
    kGraph.properties["de.cau.cs.kieler.klay.layered.nodePlace"] = layout.diagram.nodePlace
    kGraph.properties["de.cau.cs.kieler.edgeRouting"] = layout.diagram.edgeRouting
    kGraph.properties["de.cau.cs.kieler.spacing"] = layout.diagram.spacing
    kGraph.properties["de.cau.cs.kieler.klay.layered.edgeSpacingFactor"] = layout.diagram.edgeSpacingFactor
    kGraph.properties["de.cau.cs.kieler.klay.layered.nodeLayering"] = layout.diagram.nodeLayering
    kGraph.properties["de.cau.cs.kieler.klay.layered.thoroughness"] = layout.diagram.thoroughness
    kGraph.properties["de.cau.cs.kieler.klay.layered.interactiveReferencePoint"] = layout.diagram.interactiveReferencePoint
    
    
    // Parse transition edges and add to kGraph.
    // Also creates one port for each transition.
    data.edges.forEach(function(edge,idx){
        self.setLoadBar("Füge Graphkante " + edge.id +" hinzu...",41+idx*(60-41)/(data.edges.length-1))
        var kGraphEdge = {}
        var sourceID = edge.source
        var targetID = edge.target
        var statusNodeSource = self.statusNodesHash[sourceID]
        var statusNodeTarget = self.statusNodesHash[targetID]
        var statusNodeSourceBBox = self.getBBoxFix(statusNodeSource.svgGNode)
        var statusNodeTargetBBox = self.getBBoxFix(statusNodeTarget.svgGNode)
        var classSelectorsSource = statusNodeSource.classSelectors
        var classSelectorsTarget = statusNodeTarget.classSelectors
        var svgGSource = statusNodeSource.svgG
        var svgGTarget = statusNodeTarget.svgG
        var properties = edge.properties
        var linkType = properties["de.xima.fc.transition.type"]
        var portSourceID, portTargetID
        var transitionEdge = {}

        var kGraphPortSource = {}
        var kGraphPortTarget = {}
        
        // Get the DOM elements representing the source out-ports
        // and target in-ports.
        var portsOut = {
            AUTO: svgGSource.select(classSelectorsSource.portOutAuto),
            MANUAL: svgGSource.select(classSelectorsSource.portOutManual),
            TIMED : svgGSource.select(classSelectorsSource.portOutTimed),
        }
        var portsIn = {
            AUTO: svgGTarget.select(classSelectorsTarget.portInAuto),
            MANUAL : svgGTarget.select(classSelectorsTarget.portInManual),
            TIMED : svgGTarget.select(classSelectorsTarget.portInTimed),
        }
        var portsOutBBox = {
            AUTO : self.getBBoxFix(portsOut.AUTO.node()),
            MANUAL : self.getBBoxFix(portsOut.MANUAL.node()),
            TIMED : self.getBBoxFix(portsOut.TIMED.node()),
        }
        var portsInBBox = {
            AUTO : self.getBBoxFix(portsIn.AUTO.node()),
            MANUAL : self.getBBoxFix(portsIn.MANUAL.node()),
            TIMED : self.getBBoxFix(portsIn.TIMED.node()),
        }        

        // Defaults.
        kGraphAllPorts[sourceID] = kGraphAllPorts[sourceID] || {MANUAL:[],AUTO:[],TIMED:[],IN:[]}
        kGraphAllPorts[targetID] = kGraphAllPorts[targetID] || {MANUAL:[],AUTO:[],TIMED:[],IN:[]}
        var kGraphPortsSource = kGraphAllPorts[sourceID]
        var kGraphPortsTarget = kGraphAllPorts[targetID]

        // Setup edge data.
        transitionEdge.kGraphEdge = kGraphEdge
            
        // Set port properties (id,coordinates, width, height)

        // Source
        if (statusMain.maxPortsOut[linkType] < 0 || kGraphPortsSource[linkType].length < statusMain.maxPortsOut[linkType]) {
            portSourceID = "de.xima.fc.port-" + portID++   
            kGraphPortSource.id = portSourceID
            kGraphPortSource.x = portsOutBBox[linkType].x - statusNodeSourceBBox.x
            kGraphPortSource.y = portsOutBBox[linkType].y - statusNodeSourceBBox.y
            kGraphPortSource.width = portsOutBBox[linkType].width
            kGraphPortSource.height = portsOutBBox[linkType].height
            kGraphPortSource.properties = {}
            kGraphPortsSource[linkType].push(kGraphPortSource)
        }
        else {
            portSourceID = kGraphPortsSource[linkType][0].id
        }
        // Target
        if (statusMain.maxPortsIn < 0 || kGraphPortsTarget.IN.length < statusMain.maxPortsIn){
            portTargetID = "de.xima.fc.port-" + portID++            
            kGraphPortTarget.id = portTargetID
            kGraphPortTarget.x = portsInBBox[linkType].x - statusNodeTargetBBox.x
            kGraphPortTarget.y = portsInBBox[linkType].y - statusNodeTargetBBox.y
            kGraphPortTarget.width = portsInBBox[linkType].width
            kGraphPortTarget.height = portsInBBox[linkType].height
            kGraphPortsTarget.IN.push(kGraphPortTarget)
        }
        else {
            portTargetID = kGraphPortsTarget.IN[0].id
        }
        
        // Set edge properties (id, source, target, source port, target ort)
        kGraphEdge.id = edge.id
        kGraphEdge.source = sourceID
        kGraphEdge.target = targetID
        kGraphEdge.properties = {}
        kGraphEdge.sourcePort = portSourceID
        kGraphEdge.targetPort = portTargetID

        transitionEdges.push(transitionEdge)        
        kGraphEdges.push(kGraphEdge)
    })
 
    // Parse status nodes and add to kGraph.
    // Also add ports to the status node.
    data.children.forEach(function(node,idx){
        self.setLoadBar("Füge Graphknoten " + node.id +" hinzu...",60+idx*(70-60)/(data.children.length-1))

        var kGraphNode = {}
        var allPorts = kGraphAllPorts[node.id]
        var allPortsArray = []
        
        allPortsArray = allPortsArray
            .concat(allPorts.MANUAL)
            .concat(allPorts.AUTO)
            .concat(allPorts.TIMED)
            .concat(allPorts.IN)
        kGraphNode.id = node.id
        kGraphNode.properties = {}
        kGraphNode.labels = []
        kGraphNode.width = statusMainBBox.width
        kGraphNode.height = statusMainBBox.height
        kGraphNode.ports = allPortsArray
        console.log(allPorts)
        
        kGraphNode.properties["de.cau.cs.kieler.portConstraints"] = "FIXED_POS"
        kGraphNode.properties["de.cau.cs.kieler.portSpacing"] = 1
        
        if (node.properties["de.xima.fc.status.isIncoming"]) {
            kGraphNode.properties["de.cau.cs.kieler.klay.layered.layerConstraint"] = "FIRST"
        }
        if (node.properties["de.xima.fc.status.isOutgoing"]) {
            kGraphNode.properties["de.cau.cs.kieler.klay.layered.layerConstraint"] = "LAST"
        }    
        
        kGraphNodes.push(kGraphNode)
    })
    
    // Create node hash<NodeID,Node> 
    kGraph.children.forEach(function(child){
        kGraphNodeHash[child.id] = child
    })
    kGraph.edges.forEach(function(child){
        kGraphEdgeHash[child.id] = child
    })

    this.kGraph = kGraph
    this.kGraphNodeHash = kGraphNodeHash
    this.kGraphEdgeHash = kGraphEdgeHash
    this.transitionEdges = transitionEdges
    
    // Proceed to next step.
    self.generateMainGraphLayered()
}
// Step 4: Run the KLay layouter.
//         Bind node data and update nodes.
//         Create edge data, bind it and update edges.
// Proceed to step 5 upon completion.
XV.prototype.generateMainGraphLayered = function() {    
    var self = this
    self.setLoadBar("Berechnen Knotenanordnung und optimiere Kantenverlauf...",75)    
    var kGraph = self.kGraph
    var kGraphNodeHash = self.kGraphNodeHash
    var kGraphEdgeHash = self.kGraphEdgeHash
    var transitionEdges = self.transitionEdges
    
    var onSuccess = function(layouted) {
        var statusNodes = self.statusNodes
        var nodeStatusD3 = self.svgG.selectAll('g.node-status')   
        var edgeStatusD3 = self.svgG.selectAll('g.edge-status')
        statusNodes.forEach(function(node){
            var id = node.ximaNode.id        
            var kGraphNode = kGraphNodeHash[id]
            node.kGraphNode = kGraphNode
        })
        
        // Set bendingPoints to empty array in none were needed.
        transitionEdges.forEach(function(edge,idx){
            self.setLoadBar("Setze Zwischenpunkte und interpoliere für " + edge.kGraphEdge.id + "...",75+idx*(85-75)/(transitionEdges.length-1))
            edge.kGraphEdge.bendPoints = edge.kGraphEdge.bendPoints || []
        })
        
        // Get graph boundaries.
        self.kGraphBBox = self.getkGraphBBox()   
        
        // Generate lines from edge vertices.
        self.transitionEdges.forEach(function(edge){
            XV.generateTransitionLines(edge)            
        })
        
        // Compute edge intersections.
        self.transitionEdgesIntersections = self.computeEdgeIntersections()
        self.setLoadBar("Berechne Schnittstellen zwischen Graphkanten...",90)
        
        var nodeStatusData = nodeStatusD3.data(statusNodes)
        var edgeStatusData = edgeStatusD3.data(transitionEdges)
        self.unhideNodeStatusD3Layered(nodeStatusData)        
        self.updateNodeStatusD3Layered(nodeStatusData)
        self.updateEdgeStatusD3Layered(edgeStatusData)
        self.setupGlobalEvents()
    }
    
    // Start layouter.
    var layouter = $klay.layout({
        graph: kGraph,
        options : {},
        success : onSuccess,
        error : function(error){self.handleError(error)},
    })
}
XV.prototype.unhideNodeStatusD3Layered = function(nodeD3){
    var self = this
    nodeD3.style({"opacity":"0.0","visibility":"visible"})
        .transition("node-unhide")
        .duration(500)
        .style({"opacity" : "1.0"})
}
XV.prototype.updateNodeStatusD3Layered = function(nodeD3){
    var self = this
    nodeD3.each(function(d){
        var ximaProperties = d.ximaNode.properties
        var ximaActions = d.actions
        // Get properties.
        var deletable = ximaProperties["de.xima.fc.status.deletable"]
        var onError = ximaProperties["de.xima.fc.status.onError"]
        var name = ximaProperties["de.xima.fc.status.name"]
        var actions = { "GENERAL": []}
        var actionsUnique = {"GENERAL": []}
        var actionsUniqueHash = {"GENERAL": {}}
        ximaActions.forEach(function(action){
            var actionType = action.properties["de.xima.fc.action.type"]
            var actionClass = XV.actionClass[actionType]
            actions[actionClass].push(action)
            if (!actionsUniqueHash[actionClass][actionType]){
                actionsUniqueHash[actionClass][actionType] = [action]
                actionsUnique[actionClass].push(actionsUniqueHash[actionClass][actionType])
            }
            else {
                actionsUniqueHash[actionClass][actionType].push(action)
            }
        })
        console.log(actionsUnique)
        // Get DOM elements.
        var elText = d.svgG.select(d.classSelectors.textTitle)
        var elTextBBox = d.svgG.select(d.classSelectors.textTitleBBox)
        var elTextEllipsis = d.svgG.select(d.classSelectors.textTitleEllipsis)
        
        var elDeletableTrue = d.svgG.select(d.classSelectors.iconDeletableTrue)
        var elDeletableFalse = d.svgG.select(d.classSelectors.iconDeletableFalse)
        var elOnErrorNext = d.svgG.select(d.classSelectors.iconOnErrorNext)
        var elOnErrorStop = d.svgG.select(d.classSelectors.iconOnErrorStop) 

        var elActionsGeneralMain = []
        var elActionsGeneralSub = []        
        d.classSelectors.textActionGeneralIconsMain.forEach(function(selector) {
            elActionsGeneralMain.push(d.svgG.select(selector))
        })
        d.classSelectors.textActionGeneralIconsSub.forEach(function(selector) {
            elActionsGeneralSub.push(d.svgG.select(selector))
        })
        
        // Apply properties.
        
        // Name
        var isOverflow = self.setWrappedText(elText.node(),elTextBBox.node(),elTextEllipsis.node(),name)
        if (isOverflow){
            elText.classed({"node-status-title-overflow":true})
                .attr("title",name)
            $(elText.node()).tooltip({
                show : {
                    effect: "fade",  
                    duration: 350,
                },
                track: true,
            })
        }
        
        // Flags
        if (deletable) {
            elDeletableTrue.style("visibility","visible")
            elDeletableFalse.style("visibility","hidden")
        }
        else {
            elDeletableTrue.style("visibility","hidden")
            elDeletableFalse.style("visibility","visible")
        }
        if (onError == "STOP") {
            elOnErrorStop.style("visibility","visible")
            elOnErrorNext.style("visibility","hidden")
        }
        else {
            elOnErrorStop.style("visibility","hidden")
            elOnErrorNext.style("visibility","visible")
        }
        
        // Actions
        var elActionsGeneral
        var actionsDataGeneral = []
        if (actionsUnique.GENERAL > elActionsGeneralSub.length) {
            d.svgG.select(d.classSelectors.textActionGeneralSub).style({"visibility":"hidden"})
            elActionsGeneral = elActionsGeneralMain
        }
        else {
             d.svgG.select(d.classSelectors.textActionGeneralMain).style({"visibility":"hidden"})
            elActionsGeneral = elActionsGeneralSub
        }
        elActionsGeneral.forEach(function(elActionGeneral,idx){
            var actionGeneral = actionsUnique.GENERAL[idx]
            if (actionGeneral){
                var icons = actionGeneral[0].properties["de.xima.fc.action.icons"]
                var iconAction = self.getImageFont(icons.action)
                elActionGeneral.style({"visibility":"visible"})
                    .text(iconAction.char)
                    .style({"font-family":iconAction.fontFamily})
                var actionDataGeneral = {}
                actionDataGeneral.actions = actionGeneral
                actionDataGeneral.exists = true
                actionsDataGeneral.push(actionDataGeneral)
                XV.addClass(elActionGeneral.node(),"text-action-active")
                XV.addClass(elActionGeneral.node(),"text-action-general")
                if (actionDataGeneral.actions.find(function(action){return action.properties["de.xima.fc.action.onError"]!=="STOP"})) {
                    XV.addClass(elActionGeneral.node(),"text-action-on-error-next-action")
                }
                else {
                    XV.addClass(elActionGeneral.node(),"text-action-on-error-stop")
                }
                console.log(999)
                if (actionDataGeneral.actions.find(function(action){console.log(action);return action.properties["de.xima.fc.action.condition"]["type"] !=="NONE"})) {
                    XV.addClass(elActionGeneral.node(),"text-action-has-condition")
                }
                else {
                    XV.addClass(elActionGeneral.node(),"text-action-has-not-condition")
                }                
            }
            else {
                XV.addClass(elActionGeneral.node(),"text-action-inactive")
                XV.addClass(elActionGeneral.node(),"text-action-general")
                elActionGeneral.style({"visibility":"hidden"})
                actionsDataGeneral.push({exists:false,actions:[]})
            }
        })        
        d.actionsD3 = d3.selectAll(_.flatten(elActionsGeneral,1))
        d.actionsD3.data(actionsDataGeneral)
    })
    
    nodeD3.transition("node-move")
        .duration(500)
        .attr("transform",function(d){
            var newX = d.kGraphNode.x
            var newY = d.kGraphNode.y
            var dx = newX - d.bBox0.x
            var dy = newY - d.bBox0.y
            var translate0 = d.translate0
            var scale0 = d.scale0
            var newTransform = XV.getNewTranslate(this,function(r){return Pt.addC(r,dx,dy)})
            return newTransform
        })
}
XV.prototype.updateEdgeStatusD3Layered = function(edgeD3) {
    var self = this
    var nodeEnter = edgeD3.enter()
    var edgesOverlayWidth = self.layout.diagram.spacing*self.layout.diagram.edgeSpacingFactor*0.9
    
    var nodeEnterG = nodeEnter.append("g")
        .classed({"edge-status":true})
        .attr("id",function(d){return d.kGraphEdge.id})
        .each(function(d){
            d.edgeG = this
        })
    
// debug: intersections    
self.svgG.selectAll('circle.debug-intersections-cross')
      .data(self.transitionEdgesIntersections.cross)
      .enter()
      .append("circle")
      .attr("cx",function(d){return d.x})
      .attr("cy",function(d){return d.y})
      .attr("r","2")
      .style({"fill":"#f00"})
self.svgG.selectAll('circle.debug-intersections-tip')
      .data(self.transitionEdgesIntersections.tip)
      .enter()
      .append("circle")
      .attr("cx",function(d){return d.x})
      .attr("cy",function(d){return d.y})
      .attr("r","2")
      .style({"fill":"#0f0"})

   // Enter edges for the edge highlight effect on mouseover.
   var nodeEnterHighlight = nodeEnterG
        .append("path")
        .classed({"edge-path-highlight":true})
        .style({"fill":"none","opacity":"0.0"})
        .attr({"transform":"scale(0)"})
   
    // Enter visible edges.
    var nodeEnterPath = nodeEnterG
        .append("path")
        .classed({"edge-path":true})
        .style({"fill":"none","opacity":"0.0"})
        .attr({"transform":"scale(0)","stroke-dasharray":self.layout.edgeStatus.dashArray})
    
   var nodeEnterMouseover = nodeEnterG
        .append("path")
        .classed({"edge-path-mouseover":true})
        .style({"stroke-width":edgesOverlayWidth,"fill":"none","opacity":"0.0","stroke":"transparent"})
        .attr({"transform":"scale(0)"})
        .on("mouseover",function(){
            var selfEl = this
            switch(self.layout.edgeStatus.highlightMode){
                case "ALL":
                    var cX = d3.event.clientX
                    var cY = d3.event.clientY
                    var els = XV.allElementsAtMouse(cX,cY,"path.edge-path-mouseover")
                    self.triggerStatusEdgeHighlight(els)
                    break;
                case "TOPMOST":
                    var par = selfEl.parentNode
                    $('svg g.edge-status').last().after(par) // put edge in front
                    XV.addClass(par,"is-mouseover") // highlight edge
                    break;
            }
        })    
        .on("mouseout",function(){
            var selfEl = this            
            switch(self.layout.edgeStatus.highlightMode){
                case "ALL":
                    var cX = d3.event.clientX
                    var cY = d3.event.clientY
                    var els = XV.allElementsAtMouse(cX,cY,"path.edge-path-mouseover")
                    self.triggerStatusEdgeHighlight(els)
                    break;
                case "TOPMOST":
                    var par = selfEl.parentNode
                    XV.removeClass(par,"is-mouseover") // remove highlight
                    break;
            }
        })
    var time = (new Date()).getTime()   
    if (self.layout.edgeStatus.highlightMode=="ALL") {
        nodeEnterMouseover.on("mousemove",function(){
            var dt = (new Date()).getTime()-time
            if (dt>XV.elementsAtPointDT){
                var cX = d3.event.clientX
                var cY = d3.event.clientY
                var els = XV.allElementsAtMouse(cX,cY,"path.edge-path-mouseover")
                self.triggerStatusEdgeHighlight(els)
                time = (new Date()).getTime()
            }
        })
    }

   // Update highlight edges.
   var nodeUpdatePath = edgeD3.select("path.edge-path-highlight").attr("d",function(d){
        var kGraphEdge = d.kGraphEdge
        var bendPoints = kGraphEdge.bendPoints
        var points = [kGraphEdge.sourcePoint].concat(bendPoints).concat([kGraphEdge.targetPoint])
        return self.lineInterpolator(points)
    })    
    .transition("edge-enter-highlight")
    .duration(500)
    .style({"opacity":"1.0"})
    .attr({"transform":"scale(1)"})  

   
    // Update edges.
    var nodeUpdatePath = edgeD3.select("path.edge-path").attr("d",function(d){
        var kGraphEdge = d.kGraphEdge
        var bendPoints = kGraphEdge.bendPoints
        var points = [kGraphEdge.sourcePoint].concat(bendPoints).concat([kGraphEdge.targetPoint])
        return self.lineInterpolator(points)
    })    
    .transition("edge-enter")
    .duration(500)
    .style({"opacity":"1.0"})
    .attr({"transform":"scale(1)"})  
    
    // Update invisible edges for mouseover.
    var nodeUpdateMouseover = edgeD3.select("path.edge-path-mouseover").attr("d",function(d){
        var kGraphEdge = d.kGraphEdge
        var bendPoints = kGraphEdge.bendPoints
        var points = [kGraphEdge.sourcePoint].concat(bendPoints).concat([kGraphEdge.targetPoint])
        return self.lineInterpolator(points)
    })    
    .transition("edge-enter-mouseover")
    .duration(500)
    .attr({"transform":"scale(1)"})
}
// Step 5: Setup global triggers, events etc.
XV.prototype.setupGlobalEvents = function(){
    var self = this
    
    
    /* Trigger events when mouse is close to an edge.
    self.svgNode.setAttribute("pointer-events","visible")
    var pos = self.getPositionFromMouse(d3.event)
    var edge = self.getClosestEdge(pos.x,pos.y)
    */

    self.setTooltipActionIcon()

    
    self.setLoadBar("Finalisiere Darstellung...",99)

    
    self.removeLoadBar()
}

// Enter diagram mode.
$(document).on("ready",function(){
    XV.checkBrowserSupport()
    var folder = "./"
    var element = document.getElementById('paper')
    var urlParams = XV.getJsonFromUrl()
    XV.setDefault(urlParams,"pid",parseInt,2300)
    XV.setDefault(urlParams,"lang",String,"de")
    var servlet = "http://naiad.formcloud.de/formcycle/flowchart.jsp?pid=" + urlParams.pid + "&lang=" + urlParams.lang
    console.log(servlet)
    var xv = new XV(folder,servlet,element)
})
