//
// KLay Layered and KLayJS is licensed under the Eclipse Public License.
// See http://rtsys.informatik.uni-kiel.de/confluence/display/KIELER/Overview
//  and http://rtsys.informatik.uni-kiel.de/~kieler/epl-v10.html.
//

// https://storiesfailedentrepreneur.files.wordpress.com/2012/08/the-procrastination-flow-chart.png
// https://plumsail.com/blog/2014/07/how-to-use-javascript-and-css-for-conditional-formatting-in-sharepoint-org-chart/


/*
    Main function. Creates a new graph.
    folder - Path to the folder containing the data files (layout.json)
    servlet - The graph data is loaded from this url.
    viewport - HTML element which will contain the graph.
    dimensionsCallback - Unused/Internal.
*/
XV = function (folder,servlet,viewport,dimensionsCallback) {
    var self = this
    dimensionsCallback = dimensionsCallback || $.noop
    D = this // debug
    self.viewportNode = viewport
    self.viewport = d3.select(viewport)
    self.dimensionsCallback = dimensionsCallback
    var dimensions = self.getDimensions()
    self.folder = folder
    self.paper = $(self.viewportNode).find("#paper")[0]
    self.svg = d3.select(paper).select('#paper-svg')
        .attr("width", dimensions.width)
        .attr("height", dimensions.height)
    self.svgDefs = []
    self.svgG = self.svg.append("g").attr("id","paper-g")
    self.svgDefs = self.svgG.append("defs").attr("id","paper-defs")
    self.svgNode = self.svg.node()
    self.svgDefsNode = self.svgDefs.node()
    self.edgeStatusG = self.svgG.append("g").attr("id","containerEdgeStatus")
    self.edgeNodeStatusG = self.svgG.append("g").attr("id","containerEdgeNodeStatus")
    self.nodeStatusG = self.svgG.append("g").attr("id","containerNodeStatus")
    self.svgGNode = self.svgG.node()
    self.nodeStatusGNode = self.nodeStatusG.node()
    self.edgeStatusGNode = self.edgeStatusG.node()
    self.edgeNodeStatusGNode = self.edgeNodeStatusG.node()
    self.svgTranslate0 = Pt(0,0)
    self.svgScale0 = Pt(1,1)
    self.mousePageX = -424242
    self.mousePageY = -424242
    self.mouseClientX = -424242
    self.mouseClientY = -424242
    self.mode = XV.MODE_VIEW
    self.onResize = []
    XV.setTranslate(self.svgGNode,self.svgTranslate0)
    XV.setScale(self.svgGNode,self.svgScale0)
    
    d3.json(folder+"data/workflow.json",function(error,data){
        if (error){self.handleError(error);return}
        d3.json(folder+"data/layout.json",function(error,layout){
            if (error){self.handleError(error);return}  
            if (!Modernizr.inlinesvg){self.handleError({reason:"Browser does not support svg."});return}
            
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
    if (error.stack) {
        errMsg += error.stack + "\n"
    }
    self.removeLoadBar()
    $(this.paper).children("svg").hide()
    $('#mainToolbarOpener').hide()
    $('.my-tooltip').hide()
    $(this.paper).append($('<p>')
        .text('Leider gab es einen Fehler beim Laden des Diagrams. Bitte versuchen Sie es später erneut, starten Ihren Browser neu oder versuchen es mit einem anderen Browser.')
        .css({"color":"red","font-weight":"700","font-size":"3em"})
    )
    .append($('<pre>')
        .text('Fehlerdetails: ' + errMsg)
        .css({"color":"black","font-weight":"100","font-size":"1.0em"})
    )
    $('#viewport').css("overflow","scroll")
    $(self.paper).trigger("error")
}

// Fix for svg elements.
XV.jWidth = $.fn.width
XV.jHeight = $.fn.height
XV.jOuterWidth = $.fn.outerWidth
XV.jOuterHeight = $.fn.outerHeight
$.fn.outerWidth = function(){
    if (this[0]) {
        if (this[0] instanceof SVGElement) {
            var wC = this[0].getBoundingClientRect().width // width
            return (wC&&wC!==0) ? wC : XV.jOuterWidth.apply(this,arguments)
        }
        else {
            return XV.jOuterWidth.apply(this,arguments)
        }
    }
    else {
        return null
    }
}
$.fn.outerHeight = function(){
    if (this[0]) {
        if (this[0] instanceof SVGElement) {
            var hC = this[0].getBoundingClientRect().height // height
            return (hC&&hC!==0) ? hC : XV.jOuterHeight.apply(this,arguments)
        }
        else {
            return XV.jOuterHeight.apply(this,arguments)
        }
    }
    else {
        return null
    }
}
$.fn.width = function(){
    if (this[0]) {
        if (this[0] instanceof SVGElement) {
            var wC = this[0].getBoundingClientRect().width // width
            return (wC&&wC!==0) ? wC : XV.jWidth.apply(this,arguments)
        }
        else {
            return XV.jWidth.apply(this,arguments)
        }
    }
    else {
        return null
    }
}
$.fn.height = function(){
    if (this[0]) {
        if (this[0] instanceof SVGElement) {
            var hC = this[0].getBoundingClientRect().height // height
            return (hC&&hC!==0) ? hC : XV.jHeight.apply(this,arguments)
        }
        else {
            return XV.jHeight.apply(this,arguments)
        }
    }
    else {
        return null
    }
}

/* 
    Utility methods.
*/

XV.MODE_VIEW = 0
XV.MODE_EDIT_MANUAL = 1
XV.EDGE_NODE_STATUS_ID = 0
XV.IDS = {}

/*
    If obj contains key, set obj[key] to type(obj[key]), or def otherwise.
    For example,
        XV.setDefault(urlParams,"pid",parseInt,2300)
    converts urlParams["pid"] to an integer and defaults to 2300.
*/
XV.setDefault = function(obj,key,type,def){
    try {
        obj[key] = obj.hasOwnProperty(key) ? type(obj[key]) : def
    }
    catch(e){
        obj[key] = def
    }
}

/*
    Parses URL parameters from the current location, taken from
    http://stackoverflow.com/questions/8486099/how-do-i-parse-a-url-query-parameters-in-javascript
*/
XV.findIndex = function(arr,val,start){
    for (var i=start;i<arr.length;i++){
        if (val(arr[i])){return i}
    }
    return -1
}
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

/*
    Alternative implementations for cross-browser support.
*/
XV.browserSupport = {}
XV.checkBrowserSupport = function(){
    XV.setElementsFromPoint()
    XV.setClassListAdd()
    XV.setMathSign()
}
/* Sign function, sign(-3)=-1, sign(0)=0, sign(3)=1. */
XV.setMathSign = function(){
    if (Math.sign) {
        XV.mathSign = Math.sign
    }
    else {
        XV.mathSign = function(x){
            return x>0 ? 1 : x<0 ? -1 : 0
        }
    }
    XV.browserSupport.mathSign = true    
}
/*
    Workaround for browsers not supporting elementsFromPoint but elementFromPoint
    elementsFromPoint does not work properly for some svg element in Opera.
*/
XV.setElementsFromPoint = function(){
    var avail = true
    var fix = false
    var test = document.getElementById('eFPTest')
    var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0
    if (document.elementFromPoint){
        if (document.elementsFromPoint) {
            var rect = test.getClientRects()[0]
            var el = document.elementsFromPoint((rect.left+rect.right)/2,(rect.top+rect.bottom)/2)
            if (!isOpera && el && el.length>0 && el[0].id==="eFPTest") { // elementsFromPoint somewhat broken in opera for now
                XV.elementsFromPoint = document.elementsFromPoint.bind(document)
                console.log("elementsFromPoint: native")
            }
            else {
                fix = true
                XV.elementsFromPoint = XV.elementsFromPointFix            
                console.log("elementsFromPoint: fix")
            }
        }
        else {
            fix = true            
            XV.elementsFromPoint = XV.elementsFromPointFix
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
/*
    JQuery's addClass does not work with svg elements, so we need
    to fall-back to javascript's classList.add.
    But IE does not support classList on svg element either.
    D3's addClass method seems to work for all browsers.
*/
XV.setClassListAdd = function() {
    var avail = true
    XV.addClass = function(el,clazz) {
        d3.select(el).classed(clazz,true)
    }
    XV.removeClass = function(el,clazz) {
        d3.select(el).classed(clazz,false)
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
        if (!el || el === document.documentElement){break} // according to the specs browsers, elementFromPoint always returns at least the root element, if present
    }
    for (var i=0;i<elements.length;i++){
        $(elements[i]).css("pointer-events",pointerEvents[i] || "auto")
    }
    return elements
}


/*
    Type for each action, defaults to GENERAL.
    Actions with the same type are grouped together visually.
*/
XV.actionClass = [
    "GENERAL",   // Abschlussseite
    "GENERAL",   // Callback
    "GENERAL",   // Datei an Vorgang anhängen
    "GENERAL",   // Datei ausliefern
    "GENERAL",   // Datenbank SQL
    "GENERAL",   // EMail
    "GENERAL",   // Export Persistence
    "GENERAL",   // Export XML
    "GENERAL",   // Externe Resource
    "GENERAL",   // Formular ändern
    "GENERAL",   // Komprimieren
    "GENERAL",   // PDF Fill
    "GENERAL",   // Post Request
    "GENERAL",   // Plugin ausführen
    "GENERAL",   // Speichern (Dateisystem)
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
    "GENERAL"    // XML Einlesen
]

/*
    Generates a unique ID for each cloned element.
    IDs are stored in XV.IDS.
*/
XV.uniqueID = function(id){
    var newId
    XV.IDS[id] = XV.IDS[id] || []
    newId = id + "-xima-clone-" + XV.IDS[id].length
    XV.IDS[id].push(newId)
    return newId
}

/*
    Clones a DOM node and assigns a new, unique ID.
*/
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

/*
    Returns all DOM elements at the given mouse position,
    optionally filtered by a selector.
*/
XV.allElementsAtMouse = function(clientX,clientY,selector){
    var elements = XV.elementsFromPoint(clientX,clientY)
    return $(elements).filter(selector)
}

/* 
    Computes the distance between a horizontal or vertical line
    and a point (rx,ry).
*/
XV.getPointLineDistance = function(rx,ry,line){
    if (line.direction==="vertical"){
        return (ry<line.ymin) ? Math.sqrt((rx-line.xm)*(rx-line.xm)+(ry-line.ymin)*(ry-line.ymin)) : (ry>line.ymax) ? Math.sqrt((rx-line.xm)*(rx-line.xm)+(ry-line.ymax)*(ry-line.ymax)) : Math.abs(rx-line.xm)
    }
    else {
        return (rx<line.xmin) ? Math.sqrt((rx-line.xmin)*(rx-line.xmin)+(ry-line.ym)*(ry-line.ym)) : (rx>line.xmax) ? Math.sqrt((rx-line.xmax)*(rx-line.xmax)+(ry-line.ym)*(ry-line.ym)) : Math.abs(ry-line.ym)
    }
}
/*
    Computes the distance between a point (rx,ry)
    and an axis-aligned rectangle (xmin...xmax,ymin..ymax).
*/
XV.getPointBBoxDistance = function(rx,ry,xmin,ymin,xmax,ymax){
    var r1,r2,r3,r4
    var i=0
    // right edge
    r1 = (ry<ymin) ? Math.sqrt((rx-xmax)*(rx-xmax)+(ry-ymin)*(ry-ymin)) : (ry>ymax) ? Math.sqrt((rx-xmax)*(rx-xmax)+(ry-ymax)*(ry-ymax)) : (Math.abs(rx-xmax) && i++)
    // top edge
    r2 = (rx<xmin) ? Math.sqrt((rx-xmin)*(rx-xmin)+(ry-ymin)*(ry-ymin)) : (rx>xmax) ? Math.sqrt((rx-xmax)*(rx-xmax)+(ry-ymin)*(ry-ymin)) : (Math.abs(ry-ymin) && i++)
    // left edge
    r3 = (ry<ymin) ? Math.sqrt((rx-xmin)*(rx-xmin)+(ry-ymin)*(ry-ymin)) : (ry>ymax) ? Math.sqrt((rx-xmin)*(rx-xmin)+(ry-ymax)*(ry-ymax)) : (Math.abs(rx-xmin) && i++)
    // bottom edge
    r4 = (rx<xmin) ? Math.sqrt((rx-xmin)*(rx-xmin)+(ry-ymax)*(ry-ymax)) : (rx>xmax) ? Math.sqrt((rx-xmax)*(rx-xmax)+(ry-ymax)*(ry-ymax)) : (Math.abs(ry-ymax) && i++)
    return i===4 ? 0 : Math.min(r1,r2,r3,r4)
}

/*
    Utility methods for transforming svg elements.
*/
/* Moves element by (dx,dy) relative to its current position. */
XV.moveElementBy = function(el,dx,dy){
    return XV.setTranslate(el,function(r){return {x:r.x+dx,y:r.y+dy}})
}
/* Moves element to the position (x,y). */
XV.moveElementTo = function(el,x,y,translate0){
    return XV.setTranslate(el,function(r){return {x:x-translate0.x,y:y-translate0.x}})
}
/* Returns the current translation as an object with the key x and y. */
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
/* Returns the current scale as an object with the keys x and y. */
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
/*
    Returns a new string that can be used as the value for the svg transform attribute.
    Sets the translate or scale factor to value given by the argument.
*/
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
            if ((typeof translate)==="function"){
                x = parseInt(x)
                y = parseInt(y)
                translate = translate({x:x,y:y})
            }
            return "translate(" + translate.x + "," + (translate.y||translate.x) + ")"
        })
        if (!hasMatch){
            if ((typeof translate)==="function"){
                translate = translate({x:0,y:0})
            }
            newTransform = trans + (trans.length>0 ? "," : "") + "translate(" + translate.x + "," + (translate.y||translate.x) + ")"            
        }
    }
    catch(e){
        if ((typeof translate)==="function"){
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
            if ((typeof scale)==="function"){
                x = parseInt(x)
                y = parseInt(y||x)
                scale = scale({x:x,y:y})
            }
            return "scale(" + scale.x + "," + (scale.y||scale.x) + ")"
        })
        if (!hasMatch){
            if ((typeof scale)==="function"){
                scale = scale({x:1,y:1})
            }
            newTransform = trans + (trans.length>0 ? "," : "") + "scale(" + scale.x + "," + (scale.y||scale.x) + ")"            
        }
    }
    catch(e){
        if ((typeof scale)==="function"){
            scale = scale({x:1,y:1})
        }
        newTransform = trans + (trans.length>0 ? "," : "") + "scale(" + scale.x + "," + (scale.y||scale.x) + ")"
    }
    return newTransform
}
XV.getNewTransform = function(el,translate,scale){
    return XV.getNewScale(XV.getNewTranslate(el,translate),scale)
}
/* Sets the svg transform attribute of the given argument to the 
   given translate or scale factor.
*/
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

/*
    Returns true if the ranges [s1...s2] and [q1...q2]
    share any common points. The ranges are closed ranges.
    Returns false otherwise.
*/
XV.isRangeIntersecting = function(s1,s2,q1,q2){
    return q1>=s1&&q1<=s2 || q2>=s1&&q2<=s2 || s1>=q1&&s1<=q2
}

// getBBox is broken.
XV.prototype.getBBoxFix = function(el) {
    if (el.nodeName === "tspan"){ // boundingClientRect for tspan broken in firefox and maybe IE
        el = $(el.parentNode).closest("text")[0] || el
    }
    var cRectEl = el.getBoundingClientRect()
    var cRectSvg = $(el).closest("svg")[0].getBoundingClientRect()
    var width = cRectEl.width
    var height = cRectEl.height
    var x = cRectEl.left - cRectSvg.left
    var y = cRectEl.top - cRectSvg.top
    return {xmin:x, ymin: y, xmax: x+width, ymax: y+height, width:width, height:height}
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
        line.orientationX = XV.kGraphCoordinateEqual(line.x1,line.x2) ? 0 : line.x2>line.x1 ? 1 : -1
        line.orientationY = XV.kGraphCoordinateEqual(line.y1,line.y2) ? 0 : line.y2>line.y1 ? 1 : -1
        line.orientation = [line.orientationX,line.orientationY]
        if (Math.abs(line.x2-line.x1) < Math.abs(line.y2-line.y1)){
            line.direction = "vertical"
            line.directionCoordinate = 1 // y-coordinate
            line.length = Math.abs(line.y2-line.y1)
        }
        else {
            line.direction = "horizontal"
            line.directionCoordinate = 0 // x-coordinate
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

/*
    Converts a token as returned by the CSS parser library
    to its string represenation. 
*/
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

/*
    Takes a CSS selector and replaces each selection of any
    id from <oldSelectors> with a selection of the corresponding class.

    For example, the ID selector
        #text-title>tspan
    is replaced with the class selector
        .text-title>tspan

    One svg file is used as the template for each status node. This program
    loads the svg file and inserts a clone of the <svg> element into the DOM
    for each status node. In order to preserve the uniqueness of IDs, a new
    unique ID needs to be generated for each clone. In order to select all
    status nodes, each clone gets the same class.
*/
XV.convertIdSelectorsToClassSelectors = function(oldSelectors,prefix){
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
    var convertSelectors = function(old){
        var newS
        if (old instanceof Array) {
            newS = _.map(old,function(o){
                return convertSelectors(o)
            })
        }
        else if ((typeof old) === "string") {
            newS = convertSelector(old)
        }
        else {
            newS = {}
            for (var key in old) {
                newS[key] = convertSelectors(old[key])
            }
        }
        return newS
    }
    return convertSelectors(oldSelectors)
}

/* Returns true iff |x1-x2|<epsilon. */
XV.kGraphCoordinateEqual = function(x1,x2) {
    return Math.abs(x1-x2) < 1E-3
}

/*
    Returns true if a.x equals b.x and a.y equals b.y as determined by
    XV.kGraphCoordinatesEqual.
*/
XV.kGraphPointsEqual = function(a,b) {
    return XV.kGraphCoordinateEqual(a.x,b.x) && XV.kGraphCoordinateEqual(a.y,b.y) 
}

/*
    Computes all intersection points between a set lines.
    Each line consists of horizontal and vertical line segments.
    Intersections are classified as "Cross" (+) or "Tip" (|-).
    This function assumes that no transition edge intersects itself.
*/
XV.computeEdgeIntersections = function(transitionEdges) {
    var self = this
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
                        if (lineA.direction==="horizontal" && lineB.xm >= lineA.xmin && lineB.xm<=lineA.xmax && lineA.ym>=lineB.ymin && lineA.ym<=lineB.ymax){
                            if (XV.kGraphCoordinateEqual(lineA.xmin,lineB.xm) || XV.kGraphCoordinateEqual(lineA.xmax,lineB.xm) ||
                                XV.kGraphCoordinateEqual(lineA.ym,lineB.ymin) || XV.kGraphCoordinateEqual(lineA.ym,lineB.ymax)) {
                                intersectionsTip.push({x:lineB.xm,y:lineA.ym,horizontalLine:lineA,verticalLine:lineB,horizontalEdge:edgeA,verticalEdge:edgeB})
                            }
                            else {
                                intersectionsCross.push({x:lineB.xm,y:lineA.ym,horizontalLine:lineA,verticalLine:lineB,horizontalEdge:edgeA,verticalEdge:edgeB})
                            }
                        }
                        else if (lineB.direction==="horizontal" && lineA.xm >= lineB.xmin && lineA.xm<=lineB.xmax && lineB.ym>=lineA.ymin && lineB.ym<=lineA.ymax){
                            if (XV.kGraphCoordinateEqual(lineA.xm,lineB.xmin) || XV.kGraphCoordinateEqual(lineA.xm,lineB.xmax) ||
                                XV.kGraphCoordinateEqual(lineA.ymin,lineB.ym) || XV.kGraphCoordinateEqual(lineA.ymax,lineB.ym)) {
                                intersectionsTip.push({x:lineA.xm,y:lineB.ym,horizontalLine:lineB,verticalLine:lineA,horizontalEdge:edgeB,verticalEdge:edgeB})
                            }
                            else {
                                intersectionsCross.push({x:lineA.xm,y:lineB.ym,horizontalLine:lineB,verticalLine:lineA,horizontalEdge:edgeB,verticalEdge:edgeB})                                
                            }
                        }
                    })
                })
            }
        }
    }
    console.log("Computing intersections took " + ((new Date()).getTime()-time)/1000 +"s.")
    return {cross:intersectionsCross,tip:intersectionsTip}
}

/*
    For each vertex (intersection point between the edges connecting two status nodes),
    computes how many inbound and outbound edges it has got. Outbound and inbound
    edges are further grouped into north, east, south and west depening on the direction
    they come from.

    This is used for displaying little arrows on each intersection point to 
    indicate the direction of each edge.
*/
XV.computeEdgeNodes = function(transitionEdgesIntersections) {
    var self = this
    var edgeNodes = []
    var time = (new Date()).getTime()
    
    // Crossing intersection.
    transitionEdgesIntersections.cross.forEach(function(point){
        var hLine = point.horizontalLine
        var vLine = point.verticalLine
        var node = _.find(edgeNodes,function(e){return XV.kGraphPointsEqual(point,e)})
        if (!node) {
            // new intersection points
            node = {}
            node.id = "edge-node-status-" + XV.EDGE_NODE_STATUS_ID++
            node.x = point.x
            node.y = point.y
            node.inbound = {east:[],west:[],south:[],north:[]}
            node.outbound = {east:[],west:[],south:[],north:[]}
            edgeNodes.push(node)
        }
        if (hLine.orientationX === 1) {
            node.inbound.west.push(hLine)
            node.outbound.east.push(hLine)
        }
        else {
            node.inbound.east.push(hLine)
            node.outbound.west.push(hLine)
        }
        if (vLine.orientationY === 1) {
            node.inbound.north.push(vLine)
            node.outbound.south.push(vLine)
        }
        else {
            node.inbound.south.push(vLine)
            node.outbound.north.push(vLine)
        }
    })
    
    // Touching intersection.
    transitionEdgesIntersections.tip.forEach(function(point){
        var hLine = point.horizontalLine
        var vLine = point.verticalLine
        var node = _.find(edgeNodes,function(e){return XV.kGraphPointsEqual(point,e)})
        if (!node) {
            // new intersection points
            node = {}
            node.id = "edge-node-status-" + XV.EDGE_NODE_STATUS_ID++
            node.x = point.x
            node.y = point.y
            node.inbound = {east:[],west:[],south:[],north:[]}
            node.outbound = {east:[],west:[],south:[],north:[]}
            edgeNodes.push(node)
        }
        // See file ./img/edgeNodes.jpg for an explanation of variable names.
        // Red and green for case (1) and (2) are wrong, they should be switched (1 green, 2 red)
        var blue = XV.kGraphCoordinateEqual(hLine.xmin,vLine.xm)
        var purple = XV.kGraphCoordinateEqual(hLine.xmax,vLine.xm)
        var red = XV.kGraphCoordinateEqual(hLine.ym,vLine.ymax)
        var green = XV.kGraphCoordinateEqual(hLine.ym,vLine.ymin)
        
        if (red) {
            if (blue) {
                // 7
                hLine.orientationX === 1 ? node.outbound.east.push(hLine) : node.inbound.east.push(hLine)
                vLine.orientationY === 1 ? node.inbound.north.push(vLine) : node.outbound.north.push(vLine)
            }
            else if (purple) {
                // 8            
                hLine.orientationX === 1 ? node.inbound.west.push(hLine) : node.outbound.west.push(hLine)
                vLine.orientationY === 1 ? node.inbound.north.push(vLine) : node.outbound.north.push(vLine)
            }
            else { // !blue && !purple
                // 2            
                hLine.orientationX === 1 ? node.inbound.west.push(hLine) && node.outbound.east.push(hLine) :
                                           node.inbound.east.push(hLine) && node.outbound.west.push(hLine)
                vLine.orientationY === 1 ? node.inbound.north.push(vLine) : node.outbound.north.push(vLine)
            }
        }
        else if (green) {
            if (blue) {
                // 5
                hLine.orientationX === 1 ? node.outbound.east.push(hLine) : node.inbound.east.push(hLine)
                vLine.orientationY === 1 ? node.outbound.south.push(vLine) : node.inbound.south.push(vLine)                
            }
            else if (purple) {
                // 6
                hLine.orientationX === 1 ? node.inbound.west.push(hLine) : node.outbound.west.push(hLine)
                vLine.orientationY === 1 ? node.outbound.south.push(vLine) : node.inbound.south.push(vLine)                
            }
            else { // !blue && !purple
                // 1
                hLine.orientationX === 1 ? node.inbound.west.push(hLine) && node.outbound.east.push(hLine) :
                                           node.inbound.east.push(hLine) && node.outbound.west.push(hLine)
                vLine.orientationY === 1 ? node.outbound.south.push(vLine) : node.inbound.south.push(vLine)                
            }
        }
        else {
            if (blue) {
                // 3
                hLine.orientationX === 1 ? node.outbound.east.push(hLine) : node.inbound.east.push(hLine)
                vLine.orientationY === 1 ? node.inbound.north.push(vLine) && node.outbound.south.push(vLine) :
                                           node.inbound.south.push(vLine) && node.outbound.north.push(vLine)
            }
            else { // purple
                // 4
                hLine.orientationX === 1 ? node.inbound.west.push(hLine) : node.outbound.west.push(hLine)
                vLine.orientationY === 1 ? node.inbound.north.push(vLine) && node.outbound.south.push(vLine) :
                                           node.inbound.south.push(vLine) && node.outbound.north.push(vLine)
            }
        }
    })
    console.log("Edge node computation took " + ((new Date()).getTime()-time)/1000 + "s.")
    return edgeNodes
}

/* Returns a CSS string for the given ID. */
XV.idToSelector = function(id) {
    var hashToken = new HashToken()
    hashToken.value = id
    return hashToken.toSource()
}
/* Return a CSS string for the ID of the given element. */
XV.getElementIDSelector = function(el) {
    return XV.idToSelector(el.id)
}
/* Returns a CSS string for given URL. */
XV.getCssUrl = function(val) {
    var urlToken = new URLToken()
    var hashToken = new HashToken()
    hashToken.value = val
    urlToken.value = XV.stringifyCSSToken(hashToken)
    return XV.stringifyCSSToken(urlToken)
}

XV.getIFrameContentDocument = function(el) {
    return (el.contentWindow) ? el.contentWindow : (el.contentDocument.document) ? el.contentDocument.document : el.contentDocument
}

/*
    Returns the position of the mouse in graph coordinates, ie. those
    used by the main <svg> element of the graph. This is invariant
    with respect to the current scrolling or zoom level.
*/
XV.getPositionFromMouse = function(x,y,svgGNode){
    var translate = XV.getTranslate(svgGNode)
    var scale = XV.getScale(svgGNode)
    var offset = svgGNode.parentNode.offset()
    var pX = x || d3.event.pageX
    var pY = y || d3.event.pageY
    return {x:(pX-offset.left-translate.x)/scale.x,y:(pY-offset.top-translate.y)/scale.y}
}

/*
    Computes the zoom and translation values for centering the graph to the current
    viewport.
 Parameters:
  - bBox : the bounding box of the graph or any other bounding box; {x1,x2,y1,y2}
  - svgGNode : the <svg><g> element used for zooming
  - zoom: d3 zooming behaviour for this element
  - positionX,positionY : how to center the graph, 0 left/top, 1 right/bottom
  - scaleXY: do not scale to boundaries but set newScale = oldScale*scaleXY
  - callback: called after computing the new transform, for custom animations
  - unlockedScales: do not lock zooming factor x and y
*/
XV.zoomGraphToBoundaries = function (bBox,svgGNode,zoom,positionX,positionY,scaleXY,callback,unlockedRatio) {
    container = svgGNode.parentNode
    positionX = parseFloat(typeof(positionX)==="number" ? positionX : 0.5,10)
    positionY = parseFloat(typeof(positionY)==="number" ? positionY : 0.5,10)

    var scaleCurrent = XV.getScale(svgGNode)
    var scm = Math.sqrt((scaleCurrent.x*scaleCurrent.x+scaleCurrent.y*scaleCurrent.y)/2) // average area
    
    var paperX = $(container).width()
    var paperY = $(container).height()
    var minX = bBox.x1-0.1*paperX
    var maxX = bBox.x2+0.1*paperX
    var minY = bBox.y1-0.1*paperY
    var maxY = bBox.y2+0.1*paperY
    var scale, scaleX, scaleY
    if (scaleXY) {
        // pre-defined zooming factor
        scaleX = scaleCurrent.x*scaleXY
        scaleY = scaleCurrent.y*scaleXY
        scale = Math.min(scaleCurrent.x,scaleCurrent.y)*scaleXY
    }
    else {
        scaleX = paperX/(maxX-minX)
        scaleY = paperY/(maxY-minY)
        scale = Math.min(scaleX,scaleY)
    }
    
    if (!unlockedRatio) {
        scaleX = scale
        scaleY = scale
    }
    
    var width = (maxX-minX)*scaleX
    var height= (maxY-minY)*scaleY
    var scr = (scale*scale)/(scm*scm)

    var dx = ((paperX-width)*positionX-minX-0.05*paperX)/scaleX
    var dy = ((paperY-height)*positionY-minY-0.05*paperY)/scaleY
    var transform = 'scale(' + scaleX + ',' + scaleY + '),translate(' + dx + ',' + dy + ')'

    zoom.translate([dx*scaleX,dy*scaleY])    
    zoom.scale(scale)

    if (callback) {
        callback.call(d3.select(svgGNode),transform)
    }
    else {
        d3.select(svgGNode).transition()
            .duration(scr>1 ? (scr>10 ? 2000 : scr*200) : 2000-scr*1800)
            .attr("transform",transform)        
    }
    
    return transform
}

/*
    A table widget for simplifying the rendering of tables.
    Used for displaying action details.
*/
XV.tableWidget = function(el,displayNames) {
    el = $(el)
    var children = el.children()
    var rows = []
    var elsHash = {}
    var elLeft = null
    var elRight = null
    for (var i=0; i<children.length; i++) {
        var e = $(children[i])
        if (!e.hasClass("no-entry")) {
            if (elLeft) {
                elRight = e
            }
            else {
                elLeft = e
            }        
        }
        if (elLeft && elRight) {
            var idLeft = elLeft.attr("id")
            var idRight = elRight.attr("id")
            elsHash[idLeft] = elLeft
            elsHash[idRight] = elRight
            elLeft.removeAttr("id").addClass(idLeft).attr("original-id",idLeft)
            elRight.removeAttr("id").addClass(idRight).attr("original-id",idRight)
            elLeft.find("[id]").each(function(){
                var self = $(this)
                var id = self.attr("id")
                elsHash[id] = self
                self.removeAttr("id").addClass(id).attr("original-id",id)
            })
            elRight.find("[id]").each(function(){
                var self = $(this)
                var id = self.attr("id")
                elsHash[id] = self
                self.removeAttr("id").addClass(id).attr("original-id",id)
            })        
            rows.push([
                {id: idLeft, element: elLeft.detach()},
                {id: idRight, element: elRight.detach()}
            ])
            elLeft = null
            elRight = null
        }        
    }
    el.empty()
    this.displayNames = displayNames || XV.tableWidget.displayNames
    this.elsHash = elsHash
    this.rows = rows
    this.rowsHash = {}
    this.colsHash = {}
    this.container = el
}
XV.tableWidget.prototype.widget = function() {
    return this.container
}
XV.tableWidget.prototype.setDisplayNames = function () {
    var self = this
    self.container.find('.use-display-name').each(function(){
        this.textContent = self.displayNames[this.getAttribute('original-id')]
    })
}
XV.tableWidget.prototype.update = function(setupCallback){
    ;(setupCallback || $.noop).call(this.elsHash,this.rowsHash)
}
XV.tableWidget.prototype.show = function(setupCallback){
    this.widget().show()
    this.setDisplayNames()
    this.update(setupCallback)
}
XV.tableWidget.prototype.asTable = function(clone,setupCallback){
    var table = $('<table class="tableWidgetTable"><tbody></tbody></table>')
    this._asABC("tr","td","td",table.children(),clone,setupCallback)
    this.container.empty().append(table)
    return this
}
XV.tableWidget.prototype.asDivDiv = function(clone,setupCallback){
    this._asABC("div","div","div",this.container.empty(),clone,setupCallback)
    return this
}
XV.tableWidget.prototype.asDivSpan = function(clone,setupCallback){
    this._asABC("div","span","span",this.container.empty(),clone,setupCallback)
    return this
}
XV.tableWidget.prototype._asABC = function(a,b,c,container,clone,setupCallback) {
    var self = this
    container.empty()
    self.rows.forEach(function(row){
        var tr = $('<' + a +' class="tableWidgetRow ' + row[0].id + ' ' + row[1].id + '"></' + a +'>')
        var tdLeft = $('<' + b + ' class="tableWidgetLeft ' + row[0].id + '"></' + b + '>')
        var tdRight = $('<' + c + ' class="tableWidgetRight ' + row[1].id + '"></' + c + '>')
        self.rowsHash[row[0].id] = tr
        self.rowsHash[row[1].id] = tr
        self.colsHash[row[0].id] = tdLeft
        self.colsHash[row[1].id] = tdRight
        ;(setupCallback || $.noop).call(self.elsHash,self.rowsHash)           
        if (clone) {
            tdLeft.append(row[0].element.clone(false,true))
            tdRight.append(row[1].element.clone(false,true))
        }
        else {
            tdLeft.append(row[0].element)
            tdRight.append(row[1].element)
        }
        tr.append(tdLeft)
        tr.append(tdRight)
        container.append(tr)
    }) 
    return container    
}

/*
    Instance methods for this graph.
/*

/* Returns the dimensions of this graph. */
XV.prototype.getDimensions = function() {
    var dims = this.dimensionsCallback(this.viewportNode) || {}
    dims.width = dims.width || window.innerWidth
    dims.height = dims.height || window.innerHeight
    return dims
}

/*
    Get the coordinates for the current mouse position in graph coordiantes,
    ie. relative to the main <svg> element. This is invariant with respect
    to the current scroll and scale level.
*/
XV.prototype.getPositionFromMouse = function(x,y){
    var svgGNode = this.svgGNode
    var translate = XV.getTranslate(svgGNode)
    var scale = XV.getScale(svgGNode)
    var offset = $('#paper>svg').offset()
    var pX = x || d3.event.pageX
    var pY = y || d3.event.pageY
    return {x:(pX-offset.left-translate.x)/scale.x,y:(pY-offset.top-translate.y)/scale.y}
}

/* Returns the url of the given file. Adds the data directory path. */
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
    var hToken = new HashToken()
    var urlToken = new URLToken()
    
    var referencesProps = ['clip-path','color-profile','fill','filter','marker-start','marker-mid','marker-end','mask','stroke']
    ;[def,svg].forEach(function(cont){
        var items = cont.getElementsByTagName("*")
        for (var i = items.length; i--;) {
            var item = items[i]
            if (item.tagName === 'style' || item.tagName === 'script'){continue}
            var attrs = item.attributes
            for (var j = attrs.length; j--;){
                var attr = attrs[j]
                ;(referencesProps.indexOf(attr.name)!=-1) && (m=attr.value.match(refsRegUrl)) && (h=idHash[m[2]]) && (hToken.value=h) && (urlToken.value=hToken.toSource) && (attr.value=urlToken.toSource()) && item.setAttribute("xima-filter-id",h)
                ;(attr.name === "xlink:href") && (m=attr.value.match(refsRegHref)) && (h=idHash[m[1]]) && (hToken.value=h) && (attr.value=hToken.toSource())
                if (attr.name === "style"){
                    // parse the css..
                    var css = parseACommaSeparatedListOfComponentValues(attr.value)[0]
                    var len = css.length
                    var k = 0
                    while(k<len-2) {
                        var token = css[k]
                        var q = XV.findIndex(css,function(t){return !(t instanceof WhitespaceToken)},k+1)
                        if(q<0){break}
                        var r = XV.findIndex(css,function(t){return !(t instanceof WhitespaceToken)},q+1)
                        if(r<0){break}
                        var val = css[r]
                        if ((token instanceof IdentToken) && (referencesProps.indexOf(token.value)!=-1) && (css[q] instanceof ColonToken)) {
                            if (val instanceof URLToken) {
                                var id = val.value.substring(1,val.value.length)
                                ;(h=idHash[id]) && (hToken.value=h) && (val.value=hToken.toSource()) && item.setAttribute("xima-filter-id",h)
                            }
                            else if ((val instanceof Func) && val.name==="url"){
                                var id = val.value[0].value.substring(1,val.value[0].length)
                                ;(h=idHash[id]) && (hToken.value=h) && (val.value[0].value=hToken.toSource()) && item.setAttribute("xima-filter-id",h)
                            }
                        }
                        k = q
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
    // Bind data to nodes, and load nodes to DOM.
    var self = this
    
    return this.nodeStatusG.selectAll('g.node-status')
        .data(self.statusNodes)
        .enter()
        .append(function(d){return d.svgGNode})
        .each(function(d){
            d.svgG.select(d.classSelectors.nodeHighlight).classed({"node-status-highlight":true})
            d.svgG.select(d.classSelectors.textTitle).text(" ") // make sure bounding box is not affected by overflowing text
                                                                // emptying the text completely makes getBoundingClientRect report false dimensions...
            d.translate0 = self.layout.status.main.translate0
            d.scale0 = self.layout.status.main.scale0
            d.bBox0 = self.getBBoxFix(d.svgGNode)
        })
        .classed({"node-status":true})
        .style("visibility","hidden")
        .attr("id",function(d){return d.ximaNode.id})
        .attr("transform",function(d){return XV.getNewTransform("",d.translate0,d.scale0)})
}
XV.prototype.newActionNodes = function(statusNode) {
    // Bind data to nodes, and load nodes to DOM.
    var self = this    
    statusNode.nodeActionG.selectAll('g.node-action')
        .data(statusNode.actions)
        .enter()
        .append(function(d){
            return d.svgGNode
        })
        .each(function(d){
            var actionNodeLayout = self.getActionNodeLayout(d)
            d.svgG.select(d.classSelectors.nodeHighlight).classed({"node-action-highlight":true})
            d.svgG.select(d.classSelectors.textTitle).text(" ") // make sure bounding box is not affected by overflowing text
                                                                // emptying the text completely makes getBoundingClientRect report false dimensions...
            d.translate0 = actionNodeLayout.translate0
            d.scale0 = actionNodeLayout.scale0
            d.bBox0 = self.getBBoxFix(d.svgGNode)
        })
        .classed({"node-action":true})
        .style("visibility","hidden")
        .attr("id",function(d){return d.ximaAction.id})
        .attr("transform",function(d){return XV.getNewTransform("",d.translate0,d.scale0)})
}

XV.prototype.setLoadBar = function(text,pct){
    var self = this
    /*
    self.loadDialog.bar.animate({"opacity":Math.random()*0.3+0.6},500,"swing",function(){
        self.loadDialog.bar.progressbar("value",pct)
        self.loadDialog.details.text(text)
    })
    */
    self.loadDialog.bar.progressbar("value",pct)
    self.loadDialog.details.text(text)
}
XV.prototype.removeLoadBar = function(callback) {
    var self=this
    if (self.loadDialog){
        self.loadDialog.bar.animate({"opacity":1},500,"swing",function(){
            self.loadDialog.bar.progressbar("value",100)
            callback && callback()
        })
    }
    else {
        $('#loadBlock').hide()
        $('#loadDialog').hide()
        callback && callback()
    }
}

XV.prototype.getKGraphBBox = function(statusNodes, transitionEdges) {
    var self = this
    var statusNodes = statusNodes || self.statusNodes
    var transitionEdges = transitionEdges || self.transitionEdges
    var minX = statusNodes[0].kGraphNode.x, maxX = statusNodes[0].kGraphNode.x
    var minY = statusNodes[0].kGraphNode.y, maxY = statusNodes[0].kGraphNode.y
    statusNodes.forEach(function(node){
        minX = Math.min(minX,node.kGraphNode.x)
        maxX = Math.max(maxX,node.kGraphNode.x+node.kGraphNode.width)
        minY = Math.min(minY,node.kGraphNode.y)
        maxY = Math.max(maxY,node.kGraphNode.y+node.kGraphNode.height)
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
    return {character:String.fromCharCode(codepoint),fontFamily:fontFamily}
}
XV.prototype.getFont = function(id){
    var self = this
    var font = self.resources.font[id]
    var sourceType = font.sourceType
    var sourceData = font.sourceData
    if (!font.loaded) {
        if (sourceType === "FAMILY") {
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
            console.log("Adjusting font-size from " + fontSize + " to " + newFontSize + " for " + text + ".")
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
XV.prototype.zoomToKGraphBoundaries = function (positionX,positionY,scaleXY,callback) {
    return XV.zoomGraphToBoundaries(this.kGraphBBox,this.svgGNode,this.svgGZoom,positionX,positionY,scaleXY,callback)
}

/*
    Generates a grid storing pre-computed data used for highlighting
    transition edges on mouse-over.

    A grid spanning the entire graph is created with a pre-defined spacing
    between grid points. For each grid point, all transition edges within
    a pre-defined configurable radius are computed and saved.

    When the user moves the mouse, the nearest grid point is selected and
    all transition edges it contains are highlighted.

    This provides cross-browser compatibility and is fast.
*/ 
XV.prototype.createKGraphEdgeGrid = function() {
    // grid[y][x]
    var self = this
    var time = (new Date()).getTime()
    var grid = {}
    var gridPoints = []
    var bBox = self.kGraphBBox
    var radius = self.layout.diagram.spacing*self.layout.diagram.edgeSpacingFactor*0.45
    var accuracy = self.layout.diagram.mouseEdgeProximityAccuracy*radius
    var gridXMin = bBox.x1-radius
    var gridXMax = bBox.x2+radius
    var gridYMin = bBox.y1-radius
    var gridYMax = bBox.y2+radius
    var minGridSize = Math.sqrt(2)*accuracy
    var gridDivisionsX = Math.ceil((gridXMax-gridXMin) / minGridSize)
    var gridSizeX = (gridXMax-gridXMin) / gridDivisionsX
    var gridDivisionsY = Math.ceil((gridYMax-gridYMin) / minGridSize)
    var gridSizeY = (gridYMax-gridYMin) / gridDivisionsY
    var allEdges = _.map(self.transitionEdges,function(edge){return edge.edgeGNode})
    var allNodes = _.map(self.statusNodes,function(status){return status.svgGNode})
    var nullEntry = {
        within: d3.select(),
        outside: d3.selectAll(allEdges),
        sources: d3.select(),
        targets: d3.select(),
        notTargets: d3.selectAll(allNodes)
    }
    for (var j=0; j<=gridDivisionsY; j++){
        var y = gridYMin+j*gridSizeY
        var gridRow = []
        gridPoints.push(gridRow)
        for (var i=0; i<=gridDivisionsX; i++){
            var x = gridXMin+i*gridSizeX
            var within = []
            var outside = []
            var sources = []
            var targets = []
            var notTargets = []
            self.getAllEdgesWithin(x,y,radius,function(edge){
                within.push(edge.edgeGNode)
                sources.push(self.getStatusResource(edge.kGraphEdge.source).svgGNode)
                targets.push(self.getStatusResource(edge.kGraphEdge.target).svgGNode)
            }, function(edge){
                outside.push(edge.edgeGNode)
                notTargets.push(self.getStatusResource(edge.kGraphEdge.target).svgGNode)
            })
            targets = _.uniq(targets)
            var entry = {
                within:d3.selectAll(_.uniq(within)),
                outside:d3.selectAll(_.uniq(outside)),
                sources:d3.selectAll(_.uniq(sources)),
                targets:d3.selectAll(targets),
                notTargets:d3.selectAll(allNodes.filter(function(x){return targets.indexOf(x)===-1}))
            }
            gridRow.push(entry)
        }
    }
    var getGridCellAt = function(x,y){
        var i = Math.floor((x-this.minX) / this.gridSizeX + 0.5)
        var j = Math.floor((y-this.minY) / this.gridSizeY + 0.5)
        return (i<0 || i>this.divisionsX || j<0 || j>this.divisionsY) ? this.nullEntry : this.points[j][i]
    }
    grid.withinRadius = radius
    grid.accuracy = accuracy
    grid.points = gridPoints
    grid.minX = gridXMin
    grid.maxX = gridXMax
    grid.minY = gridYMin
    grid.maxY = gridYMax
    grid.gridSizeX = gridSizeX
    grid.gridSizeY = gridSizeY
    grid.divisionsX = gridDivisionsX
    grid.divisionsY = gridDivisionsY
    grid.nullEntry = nullEntry
    grid.getGridCellAt = getGridCellAt.bind(grid)
    self.kGraphEdgeProximityRadius = radius
    console.log("Edge grid generation took " + (new Date().getTime()-time)/1000 + "s.")
    return grid
}

/*
    Returns the closest transition edge to the given point (rx,ry).
    
    For speed, those edges whose bounding boxes are closest to the
    point get checked first.
*/
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

/* Returns all edges within a certain radius r of the point (rx,ry). */
XV.prototype.getAllEdgesWithin = function(rx,ry,r,callbackWithin,callbackOutside){
    var self = this
    var edges = _.map(self.transitionEdges,function(edge){
        var bBox = edge.bBox
        var distance = XV.getPointBBoxDistance(rx,ry,bBox.x1,bBox.y1,bBox.x2,bBox.y2)
        return {distanceBBox:distance,edge:edge}
    })
    var sortedEdges = _.sortBy(edges,function(edge){return edge.distanceBBox})
    sortedEdges.forEach(function(edge){
        if (edge.distanceBBox <= r){
            var lmin = _.min(edge.edge.lines,function(line){
                return XV.getPointLineDistance(rx,ry,line)
            })
            var dmin = XV.getPointLineDistance(rx,ry,lmin)
            dmin<r ? callbackWithin(edge.edge,dmin,lmin) : callbackOutside(edge.edge,dmin,lmin)
        }
        else {
            callbackOutside(edge.edge,edge.distanceBBox)
        }
    })
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
        $(self.edgeStatusGNode).append(par) // put edge in front
        XV.addClass(par,"is-mouseover") // highlight edge                    
    })
}

// Operation modes.
XV.prototype.modeChange = function(mode) {
    var self = this
    this.mode = mode
    switch (mode) {
        case XV.MODE_EDIT_MANUAL:
            self.statusNodes.forEach(function(node){
                node.statusToolbar.hide()
            })
            break;
    }
}
XV.prototype.modeAllowsEdgeHighlight = function(mode){
    return this.mode === XV.MODE_VIEW
}
XV.prototype.modeAllowsStatusToolbar = function(mode){
    return this.mode === XV.MODE_VIEW
}

/*
    Sets up callbacks for displaying tooltips and
    popups, dialogs etc. on mouseover.
    Uses jQueryUI.
 */
XV.prototype.setTooltipActionIcon = function(){
    var self = this
    var jTooltip = $('#actionTooltip').detach()
    var jDisplayName = jTooltip.find('.displayName')
    var jActions = jTooltip.find('.actions')    
    $('.text-action-active').tooltip({
        items: '.text-action-active',
        track: true,
        content: function(){
            var elD = d3.select(this)
            var d = elD.datum()
            var displayName = d.actions[0].ximaAction.properties["de.xima.fc.action.displayName"]
            jDisplayName.text(displayName)
            jActions.empty()
            d.actions.forEach(function(action){
                var ximaAction = action.ximaAction
                var li = document.createElement("li")
                var span1 = document.createElement("span")
                var span2 = document.createElement("span")
                var span3 = document.createElement("span")
                var cond = ximaAction.properties["de.xima.fc.action.condition"]
                var active = ximaAction.properties["de.xima.fc.action.active"]
                span1.classList.add("tooltip-action-status-name")
                span2.classList.add("tooltip-action-condition-display-name")
                span3.classList.add("tooltip-action-condition-active-status")                
                span1.textContent = ximaAction.properties["de.xima.fc.action.name"]
                span2.textContent = cond.type==="NONE" ? "" : (" (" + cond.displayName + ")")
                span3.textContent = active ? "" : (" (" + self.layout.status.displayNameActionDeactivated + ")")
                li.appendChild(span1)
                li.appendChild(span2)
                li.appendChild(span3)
                jActions.append(li)
            })
            return jTooltip
        }
    })
}
XV.prototype.setTooltipActionEllipsisIcon = function() {
    var self = this
    var jTooltip = $('#actionEllipsisTooltip').detach()
    var jActionType = jTooltip.find('.actionType')
    var jDisplayName = jTooltip.find('.displayName')
    var jActionList = jTooltip.find('.actionList')
    var jActionItem = jTooltip.find('.actionItem')
    var jActionName = jTooltip.find('.actionName')
    var jActionCondition = jTooltip.find('.actionCondition')
    var jActionStatus = jTooltip.find('.actionStatus')
    $('.text-action-ellipsis-active').tooltip({
        items: '.text-action-ellipsis-active',
        track: true,
        content: function() {
            var elD3 = d3.select(this)
            var d = elD3.datum()
            var actionsTypes = d.actions
            jTooltip.empty()
            actionsTypes.forEach(function(actionsType){
                var displayName = actionsType[0].ximaAction.properties["de.xima.fc.action.displayName"]
                jActionList.empty()
                jDisplayName.text(displayName)
                actionsType.forEach(function(action){
                    var cond = action.ximaAction.properties["de.xima.fc.action.condition"]
                    var active = action.ximaAction.properties["de.xima.fc.action.active"]
                    var displayNameDeactivated = self.layout.status.displayNameActionDeactivated
                    jActionName.text(action.ximaAction.properties["de.xima.fc.action.name"])
                    jActionCondition.text(cond.type==="NONE" ? "" : (" (" + cond.displayName + ")"))
                    jActionStatus.text(active ? "" : (" (" + displayNameDeactivated + ")"))
                    jActionList.append(jActionItem.clone(false,true))
                })
                jTooltip.append(jActionType.clone(false,true))
            })
            return jTooltip
        }
    })
}
XV.prototype.setTooltipTimedTransitionIcon = function(){
    var self = this
    var jTooltip = $('#transitionTimedTooltip').detach()
    var jDisplayName = jTooltip.find('.displayName')
    var jOnlyForUnread = jTooltip.find('.onlyForUnread')
    var jWeeks = jTooltip.find('.weeks')
    var jWeekdays = jTooltip.find('.weekdays')
    var jDays = jTooltip.find('.days')
    var jHours = jTooltip.find('.hours')
    var jMinutes = jTooltip.find('.minutes')
    var jSeconds = jTooltip.find('.seconds')
    var jSubseconds = jTooltip.find('.subseconds')
    self.statusNodes.forEach(function(statusNode){
        var portOutTimedMouseoverSelector = statusNode.classSelectors.portOutTimedMouseover
        var portOutTimedMouseoverNode = $(portOutTimedMouseoverSelector,statusNode.svgGNode)[0]
        var portOutTimedMouseoverIDSelector = XV.getElementIDSelector(portOutTimedMouseoverNode)
        $(portOutTimedMouseoverIDSelector).tooltip({
            items: portOutTimedMouseoverIDSelector,
            track: true,
            content: function(){
                var d = d3.select(this).datum()
                var displayName = self.layout.status.displayNameTimedTransition
                var transitionAfter = d[0].properties["de.xima.fc.transition.details"].transitionAfter
                var onlyForUnread = d[0].properties["de.xima.fc.transition.details"].onlyForUnread
                var displayNameOnlyForUnread = onlyForUnread ? self.layout.status.displayNameOnlyForUnread : ""
                var weeks = Math.floor(transitionAfter/604800)
                var weekdays = Math.floor((transitionAfter-weeks*604800)/86400)
                var days = Math.floor(transitionAfter/86400) ; transitionAfter -= days*86400
                var hours = Math.floor(transitionAfter/3600) ; transitionAfter -= hours*3600
                var minutes = Math.floor(transitionAfter/60) ; transitionAfter -= minutes*60
                var seconds = Math.floor(transitionAfter)    ; transitionAfter -= seconds
                var subseconds = transitionAfter

                jDisplayName.text(displayName)
                jOnlyForUnread.text(displayNameOnlyForUnread)
                jWeeks.text(weeks)
                jWeekdays.text(weekdays)
                jDays.text(days)
                jHours.text(hours)
                jMinutes.text(minutes)
                jSeconds.text(seconds)
                jSubseconds.text(subseconds)

                return jTooltip
            }
        })
    })
}
XV.prototype.setTooltipManualTransitionIcon = function(){
    var self = this
    var jTooltip = $('#transitionManualTooltip').detach()
    var jDisplayName = jTooltip.find('.displayName')
    var jUserGroups = jTooltip.find('.userGroups')
    self.statusNodes.forEach(function(statusNode){
        var portOutManualMouseoverSelector = statusNode.classSelectors.portOutManualMouseover
        var portOutManualMouseoverNode = $(portOutManualMouseoverSelector,statusNode.svgGNode)[0]
        var portOutManualMouseoverIDSelector = XV.getElementIDSelector(portOutManualMouseoverNode)        
        $(portOutManualMouseoverIDSelector).tooltip({
            items: portOutManualMouseoverIDSelector,
            track: true,
            content: function(){   
                var d = d3.select(this).datum()
                var displayName = self.layout.status.displayNameManualTransition
                jUserGroups.empty()                    
                d.forEach(function(transition){
                    var li = document.createElement("li")    
                    var span = document.createElement("span")
                    var ulSub = document.createElement("ul")
                    var details = transition.properties["de.xima.fc.transition.details"]
                    var target = self.getStatusResource(transition.target)
                    var nameTarget = target.ximaNode.properties["de.xima.fc.status.name"]

                    span.textContent = nameTarget
                    details.restrictToUserGroup.forEach(function(userGroupID){
                        var liSub = document.createElement("li")
                        var spanSub = document.createElement("span")
                        var userGroup = self.getUserGroupResource(userGroupID)
                        spanSub.textContent = userGroup.name
                        liSub.classList.add('tooltip-transition-timed-user-group-li')
                        spanSub.classList.add('tooltip-transition-timed-user-group-name')
                        liSub.appendChild(spanSub)
                        ulSub.appendChild(liSub)
                    })                

                    ulSub.classList.add('tooltip-transition-timed-user-groups-ul')
                    li.classList.add('tooltip-transition-timed-ul')
                    span.classList.add('tooltip-transition-timed-display-name-target')
                    li.appendChild(span)
                    li.appendChild(ulSub)
                    jUserGroups.append(li)
                })

                jDisplayName.text(displayName)
                return jTooltip
            }
        })
    })
}
XV.prototype.setTooltipAutoTransitionIcon = function(){
    var self = this
    var jTooltip = $('#transitionAutoTooltip').detach()
    var jDisplayName = jTooltip.find('.displayName')
    var jActionsContainer = jTooltip.find('.actionsContainer')
    var jActions = jTooltip.find('.actions').detach()
    
    self.statusNodes.forEach(function(statusNode){
        var portOutAutoMouseoverSelector = statusNode.classSelectors.portOutAutoMouseover
        var portOutAutoMouseoverNode = $(portOutAutoMouseoverSelector,statusNode.svgGNode)[0]
        var portOutAutoMouseoverIDSelector = XV.getElementIDSelector(portOutAutoMouseoverNode)
        $(portOutAutoMouseoverIDSelector).tooltip({
            items: portOutAutoMouseoverSelector,
            track: true,
            content: function(){        
                var d = d3.select(this).datum()       
                var displayName = self.layout.status.displayNameAutoTransition

                jActionsContainer.empty()
                d.forEach(function(transition){
                    var jAction = jActions.clone(false,true)
                    var jTarget = jAction.find('.target')
                    var jInitiatorDisplayName = jAction.find('.initiatorDisplayName')
                    var jInitiatorName = jAction.find('.initiatorName')
                    var initiator = self.getActionResource(transition.properties["de.xima.fc.transition.details"].initiator)
                    var target = self.getStatusResource(transition.target)
                    var initiatorName = initiator.ximaAction.properties["de.xima.fc.action.name"]
                    var initiatorDisplayName = initiator.ximaAction.properties["de.xima.fc.action.displayName"]
                    var targetName = target.ximaNode.properties["de.xima.fc.status.name"]
                    jTarget.text(targetName)
                    jInitiatorDisplayName.text(initiatorDisplayName)
                    jInitiatorName.text(initiatorName)                
                    jActionsContainer.append(jAction)
                })

                jDisplayName.text(displayName)
                return jTooltip
            }
        })
    })
}
XV.prototype.setTooltipStatusTitle = function(){
    var self = this
    var jTooltip = $('#statusTitleTooltip').detach()
    var jDisplayName = jTooltip.find('.displayName')
    var jDescription = jTooltip.find('.description')
    var jOnError = jTooltip.find('.onError')    
    var jDeletableTrue = jTooltip.find('.deletableTrue')
    var jDeletableFalse = jTooltip.find('.deletableFalse')

    self.statusNodes.forEach(function(statusNode){
        var statusTitleSelector = statusNode.classSelectors.textTitle
        var statusTitleNode = $(statusTitleSelector,statusNode.svgGNode)[0]
        var statusTitleIDSelector = XV.getElementIDSelector(statusTitleNode)
        var d = d3.select(statusNode.svgGNode).datum()
        
        statusNode.svgG.select(statusTitleSelector).data([d.ximaNode.properties])
        $(statusTitleIDSelector).tooltip({
            items: statusTitleIDSelector,
            track: true,
            content: function(){
                var data = d3.select(this).datum()
                var displayName = data["de.xima.fc.status.name"]
                var description = data["de.xima.fc.status.comments"] || self.layout.status.displayNameNoStatusDescriptionAvailable
                var onError = data["de.xima.fc.status.onErrorDisplayName"]
                var deletable = data["de.xima.fc.status.deletable"]
                jDisplayName.text(displayName)
                jDescription.text(description)
                jOnError.text(onError)
                deletable ? jDeletableFalse.hide() : jDeletableFalse.show()
                deletable ? jDeletableTrue.show() : jDeletableTrue.hide()
                return jTooltip
            }
        })
    })
}
XV.prototype.setTooltipDeletableIcon = function(){
    var self = this
    var jTooltip = $('#deleteableIconTooltip').detach()
    var jInfoText = jTooltip.find('.infoText')
    self.statusNodes.forEach(function(statusNode){
        var iconDeletableTrueSelector = statusNode.classSelectors.iconDeletableTrue
        var iconDeletableTrueNode = $(iconDeletableTrueSelector,statusNode.svgGNode)[0]
        var iconDeletableTrueIDSelector = XV.getElementIDSelector(iconDeletableTrueNode)
        $(iconDeletableTrueIDSelector,statusNode.svgGNode).tooltip({
            items: iconDeletableTrueIDSelector,
            track: true,
            content: function(){        
                var displayName = self.layout.status.displayNameDeletableIcon
                jInfoText.text(displayName)
                return jTooltip
            }
        })
    })
}
XV.prototype.setTooltipPortOutMismatch = function(){
    var self = this
    var layoutAction = self.layout.action

    // Tooltip elements.
    var jTooltip = $('#onMismatchTooltip').detach()
    var jOnMismatchStop = jTooltip.find('.onMismatchStop')
    var jOnMismatchProceed = jTooltip.find('.onMismatchProceed')
    var jOnMismatchProceedPrefix = jTooltip.find('.onMismatchProceedPrefix')
    var jOnMismatchProceedAction = jTooltip.find('.onMismatchProceedAction')
    var jDisplayName = jTooltip.find('.displayName')
    
    // Localized strings.
    var displayNameMismatchTransition = layoutAction.displayNameMismatchTransition
    
    self.statusNodes.forEach(function(statusNode){
        statusNode.actions.forEach(function(actionNode){
            // No port exists as no condition was set.
            if (actionNode.ximaAction.properties["de.xima.fc.action.condition"].type === "NONE"){return} 

            var actionMain = self.getActionNodeLayout(actionNode)
            // Elements to attach tooltip to.
            var portOutMismatchSelector = actionMain.classSelectors.ports.OUT.MISMATCH.attach

            var portOutMismatchMouseoverSelector = actionMain.classSelectors.ports.OUT.MISMATCH.mouseover
            var portOutMismatchMouseoverNode = $(portOutMismatchMouseoverSelector,actionNode.svgGNode)[0]
            var portOutMismatchMouseoverIDSelector = XV.getElementIDSelector(portOutMismatchMouseoverNode)
            var onMismatchStopSelector = actionMain.classSelectors.iconOnMismatchStop
            var onMismatchStopNode = $(onMismatchStopSelector,actionNode.svgGNode)[0]
            var onMismatchStopIDSelector = XV.getElementIDSelector(onMismatchStopNode)

            var selector = portOutMismatchMouseoverIDSelector

            actionNode.svgG.select(onMismatchStopSelector).data([actionNode])
            actionNode.svgG.select(portOutMismatchSelector).data([actionNode])
            actionNode.svgG.select(portOutMismatchMouseoverSelector).data([actionNode])

            if (!actionNode.nextActionMismatch){selector += "," + onMismatchStopIDSelector}
        
            $(selector).tooltip({
                items: selector,
                track: true,
                content: function(){
                    var d = d3.select(this).datum()
                    jDisplayName.text(displayNameMismatchTransition)
                    if (d.nextActionMismatch) {
                        var nextAction = self.getActionResource(d.nextActionMismatch)
                        jOnMismatchProceedPrefix.text(d.ximaAction.properties["de.xima.fc.action.condition"].nextActionDisplayName)
                        jOnMismatchProceedAction.text(nextAction.ximaAction.properties["de.xima.fc.action.name"])
                        jOnMismatchStop.hide()
                        jOnMismatchProceed.show()
                    }
                    else {                    
                        jOnMismatchStop.text(d.ximaAction.properties["de.xima.fc.action.condition"].nextActionDisplayName)
                        jOnMismatchStop.show()
                        jOnMismatchProceed.hide()
                    }
                    return jTooltip
                }
            })
        })
    })
}
XV.prototype.setTooltipPortOutError = function(){
    var self = this
    var layoutAction = self.layout.action

    // Tooltip elements.
    var jTooltip = $('#onErrorTooltip').detach()
    var jOnErrorStop = jTooltip.find('.onErrorStop')
    var jOnErrorProceed = jTooltip.find('.onErrorProceed')
    var jOnErrorProceedPrefix = jTooltip.find('.onErrorProceedPrefix')
    var jOnErrorProceedAction = jTooltip.find('.onErrorProceedAction')
    var jDisplayName = jTooltip.find('.displayName')
    
    // Localized strings.
    var displayNameErrorTransition = layoutAction.displayNameErrorTransition
    
    self.statusNodes.forEach(function(statusNode){
        statusNode.actions.forEach(function(actionNode){
            var actionMain = self.getActionNodeLayout(actionNode)
            
            // Elements to attach tooltip to.
            var portOutErrorSelector = actionMain.classSelectors.ports.OUT.ERROR.attach

            var portOutErrorMouseoverSelector = actionMain.classSelectors.ports.OUT.ERROR.mouseover
            var portOutErrorMouseoverNode = $(portOutErrorMouseoverSelector,actionNode.svgGNode)[0]
            var portOutErrorMouseoverIDSelector = XV.getElementIDSelector(portOutErrorMouseoverNode)

            var onErrorStopSelector = actionMain.classSelectors.iconOnErrorStop
            var onErrorStopNode = $(onErrorStopSelector,actionNode.svgGNode)[0]
            var onErrorStopIDSelector = XV.getElementIDSelector(onErrorStopNode)

            var selector = portOutErrorMouseoverIDSelector

            actionNode.svgG.select(onErrorStopSelector).data([actionNode])
            actionNode.svgG.select(portOutErrorSelector).data([actionNode])
            actionNode.svgG.select(portOutErrorMouseoverSelector).data([actionNode])

            if (!actionNode.nextActionError){selector += "," + onErrorStopIDSelector}

            $(selector).tooltip({
                items: selector,
                track: true,
                content: function(){
                    var d = d3.select(this).datum()
                    jDisplayName.text(displayNameErrorTransition)
                    if (d.nextActionError) {
                        var nextAction = self.getActionResource(d.nextActionError)
                        jOnErrorProceedPrefix.text(d.ximaAction.properties["de.xima.fc.action.onErrorDisplayName"])
                        jOnErrorProceedAction.text(nextAction.ximaAction.properties["de.xima.fc.action.name"])
                        jOnErrorStop.hide()
                        jOnErrorProceed.show()
                    }
                    else {
                        jOnErrorStop.text(d.ximaAction.properties["de.xima.fc.action.onErrorDisplayName"])
                        jOnErrorStop.show()
                        jOnErrorProceed.hide()
                    }
                    return jTooltip
                }
            })
        })
    })    
}
XV.prototype.setTooltipPortOutStandard = function(){
    var self = this
    var layoutAction = self.layout.action

    // Tooltip elements.
    var jTooltip = $('#onStandardTooltip').detach()
    var jOnStandardStop = jTooltip.find('.onStandardStop')
    var jOnStandardProceed = jTooltip.find('.onStandardProceed')
    var jOnStandardProceedPrefix = jTooltip.find('.onStandardProceedPrefix')
    var jOnStandardProceedAction = jTooltip.find('.onStandardProceedAction')
    var jDisplayName = jTooltip.find('.displayName')
    
    // Localized strings.
    var displayNameStandardTransition = layoutAction.displayNameStandardTransition
    var displayNameStandardTransitionProceed = layoutAction.displayNameStandardTransitionProceed
    var displayNameStandardTransitionStop = layoutAction.displayNameStandardTransitionStop
        
    self.statusNodes.forEach(function(statusNode){
        var actionNodesLength = statusNode.actions.length
        statusNode.actions.forEach(function(actionNode,actionNodeIdx){
            var actionMain = self.getActionNodeLayout(actionNode)
            
            // Elements to attach tooltip to.
            var portOutStandardSelector = actionMain.classSelectors.ports.OUT.STANDARD.attach

            var portOutStandardMouseoverSelector = actionMain.classSelectors.ports.OUT.STANDARD.mouseover
            var portOutStandardMouseoverNode = $(portOutStandardMouseoverSelector,actionNode.svgGNode)[0]
            var portOutStandardMouseoverIDSelector = XV.getElementIDSelector(portOutStandardMouseoverNode)

            var onStandardStopSelector = actionMain.classSelectors.iconOnStandardStop
            var onStandardStopNode = $(onStandardStopSelector,actionNode.svgGNode)[0]
            var onStandardStopIDSelector = XV.getElementIDSelector(onStandardStopNode)

            var selector = portOutStandardMouseoverIDSelector

            actionNode.svgG.select(onStandardStopSelector).data([actionNode])
            actionNode.svgG.select(portOutStandardSelector).data([actionNode])
            actionNode.svgG.select(portOutStandardMouseoverSelector).data([actionNode])

            if (actionNodeIdx===actionNodesLength-1 && !actionNode.ximaAction.properties["de.xima.fc.action.stopsWorkflow"]){return}
            if (!actionNode.nextActionStandard){selector += "," + onStandardStopIDSelector}

            $(selector).tooltip({
                items: selector,
                track: true,
                content: function(){
                    var d = d3.select(this).datum()
                    jDisplayName.text(displayNameStandardTransition)
                    if (d.nextActionStandard) {
                        var nextAction = self.getActionResource(d.nextActionStandard)
                        jOnStandardProceedPrefix.text(displayNameStandardTransitionProceed)
                        jOnStandardProceedAction.text(nextAction.ximaAction.properties["de.xima.fc.action.name"])
                        jOnStandardStop.hide()
                        jOnStandardProceed.show()
                    }
                    else {
                        jOnStandardStop.text(displayNameStandardTransitionStop)
                        jOnStandardStop.show()
                        jOnStandardProceed.hide()
                    }
                    return jTooltip
                }
            })
        })
    })    
}
XV.prototype.setTooltipActionCondition = function() {
    var self = this
    var layoutAction = self.layout.action

    // Tooltip elements.
    var jTooltip = $('#actionConditionTooltip').detach()
    var jDisplayName = jTooltip.find('.displayName')
    var jConditionForm = jTooltip.find('.conditionForm')
    var jConditionRegexp = jTooltip.find('.conditionRegexp')
    var jContainerRhs = jTooltip.find('.containerRhs')
    var jLhs = jTooltip.find('.lhs')
    var jOperator = jTooltip.find('.operator')
    var jRhs = jTooltip.find('.rhs')
    var jRegexp = jTooltip.find('.regexp')
    var jFormElementDisplayName = jTooltip.find('.formElementDisplayName')
    
    var conditionFormElementDisplayName = layoutAction.displayNameConditionFormElement
    
    self.statusNodes.forEach(function(statusNode){
        statusNode.actions.forEach(function(actionNode){
            if (actionNode.ximaAction.properties["de.xima.fc.action.condition"].type==="NONE"){return}
            
            var actionMain = self.getActionNodeLayout(actionNode)
            
            var containerConditionNodeMouseover = actionMain.classSelectors.containerConditionNodeMouseover
            var containerConditionNodeMouseoverNode = $(containerConditionNodeMouseover,actionNode.svgGNode)[0]
            var containerConditionNodeMouseoverIDSelector = XV.getElementIDSelector(containerConditionNodeMouseoverNode)
                        
            actionNode.svgG.select(containerConditionNodeMouseover).data([actionNode])
            
            $(containerConditionNodeMouseoverIDSelector).tooltip({
                items: containerConditionNodeMouseoverIDSelector,
                track: true,
                content: function(){
                    var d = d3.select(this).datum()
                    var ximaProps = d.ximaAction.properties
                    var cond = ximaProps["de.xima.fc.action.condition"]
                    jDisplayName.text(cond.displayName)
                    
                    switch (cond.type) {
                        case "FORM":
                            jConditionForm.show()
                            jConditionRegexp.hide()
                            jLhs.text(cond.details.conditionLHS)
                            jOperator.text(cond.details.displayNameConditionOperator)
                            jFormElementDisplayName.text(conditionFormElementDisplayName)
                            if (cond.details.hasRHS){
                                jContainerRhs.show()
                                jRhs.text(cond.details.conditionRHS)
                            }
                            else {
                                jContainerRhs.hide()
                            }
                            break;
                        case "REGEXP":
                            jConditionForm.hide()
                            jConditionRegexp.show()
                            jRegexp.text(cond.details.regexp)
                            break;
                    }
                    
                    return jTooltip
                }
            })
        })
    })
}
XV.prototype.setTooltipActionDetails = function() {
    var self = this
    var displayNames = self.layout.action.displayNames
    var actionDetailsTooltipDimensions = self.layout.action.actionDetailsTooltipDimensions
    
    // Tooltip element.
    var jTooltip = $('#actionDetailsTooltip').detach()

    var jDisplayName = jTooltip.find('.displayName')
    var jActionTypePrefix = jTooltip.find('.actionTypePrefix')
    var jActionTypeDisplayName = jTooltip.find('.actionTypeDisplayName')
    
    // Container for the action details for each action.
    var jDetails = jTooltip.find('.details')
    
    var jDetailsShowTemplate = jTooltip.find('.detailsShowTemplate')
    var jDetailsCallback = jTooltip.find('.detailsCallback')
    var jDetailsAttachFileToBatch = jTooltip.find('.detailsAttachFileToBatch')
    var jDetailsReturnFile = jTooltip.find('.detailsReturnFile')
    var jDetailsDbSqlStatement = jTooltip.find('.detailsDbSqlStatement')
    var jDetailsEMail = jTooltip.find('.detailsEMail')
    var jDetailsExportPersistence = jTooltip.find('.detailsExportPersistence')
    var jDetailsExportXml = jTooltip.find('.detailsExportXml')
    var jDetailsExternalResource= jTooltip.find('.detailsExternalResource')
    var jDetailsWriteToForm= jTooltip.find('.detailsWriteToForm')
    var jDetailsCompressAsZip = jTooltip.find('.detailsCompressAsZip')
    var jDetailsPdfFill = jTooltip.find('.detailsPdfFill')
    var jDetailsPostRequest = jTooltip.find('.detailsPostRequest')
    var jDetailsExecPlugin = jTooltip.find('.detailsExecPlugin')
    var jDetailsSaveToFileSystem = jTooltip.find('.detailsSaveToFileSystem')
    var jDetailsChangeStatus = jTooltip.find('.detailsChangeStatus')
    var jDetailsCreateTxt = jTooltip.find('.detailsCreateTxt')
    var jDetailsProvideUpload = jTooltip.find('.detailsProvideUpload')
    var jDetailsStopBatch = jTooltip.find('.detailsStopBatch')
    var jDetailsCopyStatus = jTooltip.find('.detailsCopyStatus')
    var jDetailsCopyToMailBox = jTooltip.find('.detailsCopyToMailBox')
    var jDetailsMoveToMailBox = jTooltip.find('.detailsMoveToMailBox')
    var jDetailsRenewProcessId = jTooltip.find('.detailsRenewProcessId')
    var jDetailsDeleteBatch = jTooltip.find('.detailsDeleteBatch')
    var jDetailsRedirect = jTooltip.find('.detailsRedirect')
    var jDetailsWordFill = jTooltip.find('.detailsWordFill')
    var jDetailsXmlToForm = jTooltip.find('.detailsXmlToForm')
    var jDetailsCallback = jTooltip.find('.detailsCallback')

    // Setup table.    
    XV.tableWidget.displayNames = displayNames
    var t = {}
    t.showTemplate = (new XV.tableWidget(jDetailsShowTemplate)).asTable()
    t.attachFileToBatch = (new XV.tableWidget(jDetailsAttachFileToBatch)).asTable()
    t.returnFile = (new XV.tableWidget(jDetailsReturnFile)).asDivSpan()
    t.dbSqlStatement = (new XV.tableWidget(jDetailsDbSqlStatement)).asDivDiv()
    t.eMail = (new XV.tableWidget(jDetailsEMail)).asDivDiv()
    t.exportPersistence = (new XV.tableWidget(jDetailsExportPersistence)).asTable()
    t.exportXml = (new XV.tableWidget(jDetailsExportXml)).asTable()
    t.externalResource = (new XV.tableWidget(jDetailsExternalResource)).asTable()
    t.writeToForm = (new XV.tableWidget(jDetailsWriteToForm)).asTable()
    t.compressAsZip = (new XV.tableWidget(jDetailsCompressAsZip)).asTable()
    t.pdfFill = (new XV.tableWidget(jDetailsPdfFill)).asTable()
    t.postRequest = (new XV.tableWidget(jDetailsPostRequest)).asTable()
    t.execPlugin = (new XV.tableWidget(jDetailsExecPlugin)).asTable()
    t.saveToFileSystem = (new XV.tableWidget(jDetailsSaveToFileSystem)).asTable()
    t.changeStatus = (new XV.tableWidget(jDetailsChangeStatus)).asTable()
    t.createTxt = (new XV.tableWidget(jDetailsCreateTxt)).asTable()
    t.provideUpload = (new XV.tableWidget(jDetailsProvideUpload)).asTable()
    t.stopBatch = (new XV.tableWidget(jDetailsStopBatch)).asTable()
    t.copyStatus = (new XV.tableWidget(jDetailsCopyStatus)).asTable()
    t.copyToMailBox = (new XV.tableWidget(jDetailsCopyToMailBox)).asTable()
    t.moveToMailBox = (new XV.tableWidget(jDetailsMoveToMailBox)).asTable()
    t.renewProcessId = (new XV.tableWidget(jDetailsRenewProcessId)).asTable()
    t.deleteBatch = (new XV.tableWidget(jDetailsDeleteBatch)).asTable()
    t.redirect = (new XV.tableWidget(jDetailsRedirect)).asTable()
    t.wordFill = (new XV.tableWidget(jDetailsWordFill)).asTable()
    t.xmlToForm = (new XV.tableWidget(jDetailsXmlToForm)).asTable()
    t.callback = (new XV.tableWidget(jDetailsCallback)).asTable()

    // Setup code syntax highlighting.
    var cmDbSqlStatement = CodeMirror(jDetailsDbSqlStatement.find('.dbSqlStatementEditor')[0], {
        value: "",
        mode: "text/x-mysql",
        theme: "eclipse",
        lineWrapping: true,
        lineNumbers: true,
        readOnly: true
    })
    var cmExportXml = CodeMirror(jDetailsExportXml.find('.exportXmlPreviewEditor')[0], {
        value: "",
        mode: "text/xml",
        theme: "eclipse",
        lineWrapping: true,
        lineNumbers: true,
        readOnly: true
    })
    var cmPostRequest = CodeMirror(jDetailsPostRequest.find('.postRequestPreviewEditor')[0], {
        value: "",
        mode: "text/xml",
        theme: "eclipse",
        lineWrapping: true,
        lineNumbers: true,
        readOnly: true
    })
    var cmCreateTxt = CodeMirror(jDetailsCreateTxt.find('.createTxtContentEditor')[0], {
        value: "",
        mode: "text/plain",
        theme: "eclipse",
        lineWrapping: true,
        lineNumbers: true,
        readOnly: true
    })
    var cmRedirect = CodeMirror(jDetailsRedirect.find('.redirectPreviewEditor')[0], {
        value: "",
        mode: "text/plain",
        theme: "eclipse",
        lineWrapping: true,
        lineNumbers: true,
        readOnly: true
    })
    var cmXmlToForm = CodeMirror(jDetailsXmlToForm.find('.xmlToFormPreviewEditor')[0], {
        value: "",
        mode: "text/xml",
        theme: "eclipse",
        lineWrapping: true,
        lineNumbers: true,
        readOnly: true
    })    
        
    // Allow only one active request at a time.
    var ajaxRequest = null

    function generateLoadFromList(tField,name,loadFrom){
        return generateItemsList(tField,name,_.map(loadFrom,function(actionID){
            var action = self.getActionResource(actionID)
            return action.ximaAction.properties["de.xima.fc.action.name"]
        }))
    }
    function generateItemsList(tField,name,items) {
        var none = name + "None"
        var list = name + "List"
        var item = name + "Item"
        var content = name + "Content"
        tField[list].empty()
        items.length===0 && tField[none].show() && tField[list].hide()
        items.length!==0 && tField[none].hide() && tField[list].show()
        items.forEach(function(itemName){
            tField[content].text(itemName)
            tField[list].append(tField[item].clone(false,true))
        })
    }
    function generateParameterTable(tField,name,parameters){
        var none = name + "None"
        var table = name + "Table"
        var row = name + "Row"
        var key = name + "Key"
        var value = name + "Value"
        var header = name + "Header"
        parameters.length===0 && tField[none].show() && tField[table].hide()
        parameters.length!==0 && tField[none].hide() && tField[table].show()
        tField[table].empty()
        tField[table].append(tField[header].clone(false,true))
        parameters.forEach(function(parameter){
            tField[key].text(parameter.key || "")
            tField[value].text(parameter.value || "")
            tField[table].append(tField[row].clone(false,true))
        })
    }
    function setOptionalText(tField,name,string) {
        var text = name + "Text"
        var none = name + "None"
        string===null && tField[none].show() && tField[text].hide()
        string!==null && tField[none].hide() && tField[text].show()
        tField[text].text(string||"")
    }
    
    // Set tooltip for each action node.
    self.statusNodes.forEach(function(statusNode){
        statusNode.actions.forEach(function(actionNode){        
            var actionMain = self.getActionNodeLayout(actionNode)

            var nodeBody = $(actionMain.classSelectors.nodeBody,actionNode.svgGNode)
            var nodeBodyNode = $(nodeBody,actionNode.svgGNode)[0]
            var nodeBodyIDSelector = XV.getElementIDSelector(nodeBodyNode)
            
            var containerActionNodeMouseover = actionMain.classSelectors.containerActionNodeMouseover
            var containerActionNodeMouseoverNode = $(containerActionNodeMouseover,actionNode.svgGNode)[0]
            var containerActionNodeMouseoverIDSelector = XV.getElementIDSelector(containerActionNodeMouseoverNode)
            var tooltipDimensions = actionDetailsTooltipDimensions[actionNode.ximaAction.properties["de.xima.fc.action.type"]]
            
            actionNode.svgG.select(containerActionNodeMouseover).data([actionNode])
            
            $(containerActionNodeMouseoverIDSelector).tooltip({
                items: containerActionNodeMouseoverIDSelector,
                close: function(event,ui){
                    ui.tooltip.hover(
                        function() {
                            $(this).stop(true).fadeTo(600, 1)
                        },
                        function() {
                            $(this).fadeOut(600, function() {
                                $(this).remove()
                                if (ajaxRequest){ajaxRequest.abort()}
                                ajaxRequest = null
                            })
                        }
                    )
                },
                position: {
                    my: "left top",
                    at: "right+10 top",
                    of: nodeBodyIDSelector,
                    collision: "none",
                    using: function(position,dimensions) {
                        var me = $(this)
                        me.css(tooltipDimensions)
                        dimensions.element.width = me.outerWidth()
                        dimensions.element.height = me.outerHeight()
                        screenW = window.innerWidth
                        screenH = window.innerHeight
                        var onTheFarRight = position.left+dimensions.element.width/2>screenW
                        var fitsLeftButNotRight = (position.left+dimensions.element.width>screenW) && (position.left>=0)
                        if (onTheFarRight || fitsLeftButNotRight) {
                            // put element to the left
                            position.left = dimensions.target.left-dimensions.element.width-10
                        }
                        else {
                            // no changes needed
                        }
                        if (position.top < 0) {
                            position.top = 0
                        }
                        else if (position.top+dimensions.element.height>screenH) {
                            position.top = screenH-dimensions.element.height
                        }
                        $(this).css(position)
                    }                    
                },
                open: function(event,ui){
                    // Prevent tooltip from closing on mouseover over tooltip content.
                    if (event.originalEvent === undefined) {
                        return false;
                    }
                    var $id = $(ui.tooltip).attr('id');
                    // close any lingering tooltips
                    $('div.ui-tooltip').not('#' + $id).remove();
                    
                    var d = d3.select(this).datum()
                    var ximaProps = d.ximaAction.properties
                    var actionDetails = ximaProps["de.xima.fc.action.details"]
                    
                    // Make tooltip draggable (useful for large tooltips).
                    ui.tooltip.draggable({
                        scroll: false,
                        cancel: "input,textarea,button,select,option,span,li"
                    })
                    
                    // Setup data and event handlers after the tooltip has been
                    // loaded to the DOM.
                    switch (ximaProps["de.xima.fc.action.type"]) {
                        case 0:
                            // Update iframe with content
                            t.showTemplate.update(function(){
                                var iFrame = this.showTemplatePreviewRight[0]
                                var iFrameDoc = XV.getIFrameContentDocument(iFrame).document
                                var htmlResource = self.getHtmlResource(actionDetails.targetTemplate)
                                iFrameDoc.open()
                                iFrameDoc.write(htmlResource.html)
                                iFrameDoc.close()
                            })
                            break;
                        case 4:
                            // Update text editor with the sql statement.
                            if (actionDetails.sqlStatement!==null){
                                cmDbSqlStatement.setValue(actionDetails.sqlStatement)
                                cmDbSqlStatement.refresh()
                            }
                            break;
                        case 5:
                            // Update iframe with content
                            t.eMail.update(function(){
                                var iFrame = this.eMailBodyRight[0]
                                var iFrameDoc = XV.getIFrameContentDocument(iFrame).document
                                iFrameDoc.open()
                                iFrameDoc.write(actionDetails.body)
                                iFrameDoc.close()
                            })
                            break;
                        case 7:
                            // Update text editor with the xsl statement.
                            if (actionDetails.xslTemplate!==null){
                                cmExportXml.setValue(self.getXslResource(actionDetails.xslTemplate).xsl)
                                cmExportXml.refresh()                            
                            }
                            break;
                        case 8:
                            t.externalResource.update(function(){
                                var iFrame = this.externalResourcePreviewRight[0]
                                var iFrameDoc = XV.getIFrameContentDocument(iFrame).document
                                ajaxRequest = $.ajax({
                                    async: true,
                                    error: function(jqXHR, textStatus, errorThrown){
                                        iFrameDoc.open()
                                        iFrameDoc.write('<h1>'+jqXHR.status+': '+textStatus+'</h1><pre>'+errorThrown+'</pre>')
                                        iFrameDoc.close()
                                    },
                                    method: 'GET',
                                    success: function(a,b,recData) {
                                        iFrameDoc.open()
                                        if (recData.responseJSON){
                                            iFrameDoc.write($("<pre>").text(recData.responseText)[0].outerHTML)
                                        }
                                        else {
                                            iFrameDoc.write(recData.responseText)
                                        }
                                        iFrameDoc.close()
                                    },
                                    url: actionDetails.resourceURL
                                })
                            })
                            break; 
                        case 12:
                            // Update text editor with the xsl statement.
                            if (actionDetails.xslTemplate !== null) {
                                cmPostRequest.setValue(self.getXslResource(actionDetails.xslTemplate).xsl)
                                cmPostRequest.refresh()                                                
                            }
                            break;
                        case 16:
                            // Update text editor with the text content.
                            if (actionDetails.textContent!==null){
                                cmCreateTxt.setValue(actionDetails.textContent)
                                cmCreateTxt.refresh()
                            }
                            break;
                        case 24:
                            var urlID = actionDetails.redirectTemplate
                            var url = self.getUrlResource(urlID)
                            if (url!==null){
                                cmRedirect.setValue(url.url)
                                cmRedirect.refresh()
                            }                            
                            break;
                        case 26:
                            var xslID = actionDetails.xslTemplate
                            if (xslID!==null){
                                var xsl = self.getXslResource(xslID)
                                cmXmlToForm.setValue(xsl.xsl)
                                cmXmlToForm.refresh()
                            }
                            break;
                    
                    }
                },
                content: function(){
                    var d = d3.select(this).datum()
                    var ximaProps = d.ximaAction.properties
                    var actionDetails = ximaProps["de.xima.fc.action.details"]
                    
                    jDisplayName.text(ximaProps["de.xima.fc.action.name"])
                    jActionTypePrefix.text(displayNames.actionDetailsTypeLeft)
                    jActionTypeDisplayName.text(ximaProps["de.xima.fc.action.displayName"])
                    jDetails.hide()
                    
                    switch (ximaProps["de.xima.fc.action.type"]) {
                        case 0:
                            t.showTemplate.show(function(){
                                this.showTemplateNameRight.text(self.getHtmlResource(actionDetails.targetTemplate).name)
                            })
                            break;
                            

                        case 1:
                            t.callback.show(function(){
                                this.callbackNameRight.text(actionDetails.callbackName)
                            })
                            break;
                            
                        case 2:
                            t.attachFileToBatch.show(function(){
                                this.attachFileToBatchLoadFromList.empty()
                                generateLoadFromList(this,"attachFileToBatchLoadFrom",actionDetails.loadFrom)                                
                            })
                            break;
                            
                        case 3:
                            t.returnFile.show(function(rows){
                                actionDetails.forceDownload && this.returnFileForceDownloadYes.show() && this.returnFileForceDownloadNo.hide()
                                !actionDetails.forceDownload && this.returnFileForceDownloadYes.hide() && this.returnFileForceDownloadNo.show()
                                generateLoadFromList(this,"returnFileLoadFrom",actionDetails.loadFrom)                                
                            })
                            break;
                            
                        case 4:
                            t.dbSqlStatement.show()
                            break;
                            
                        case 5:
                            t.eMail.show(function() {
                                this.eMailToRight.text(actionDetails.headerTo)
                                this.eMailFromRight.text(actionDetails.headerFrom)
                                this.eMailSubjectRight.text(actionDetails.headerSubject)
                                generateLoadFromList(this,"eMailLoadFrom",actionDetails.loadFrom)                                
                            })
                            break;
                            
                        case 6:
                            t.exportPersistence.show(function(){
                                this.exportPersistenceSaveAsRight.text(actionDetails.saveAs)
                            })
                            break;
                            
                        case 7:
                            t.exportXml.show(function(){
                                this.exportXmlSaveAsRight.text(actionDetails.saveAs)
                                this.exportXmlTemplateNameRight.text(self.getXslResource(actionDetails.xslTemplate).name)
                                actionDetails.sanitizeOutput && this.exportXmlCleanupYes.show() && this.exportXmlCleanupNo.hide()
                                !actionDetails.sanitizeOutput && this.exportXmlCleanupYes.hide() && this.exportXmlCleanupNo.show()
                            })
                            break;
                            
                        case 8:
                            t.externalResource.show(function(){
                              this.externalResourceUrlRight.text(actionDetails.resourceURL)
                              this.externalResourceSaveAsRight.text(actionDetails.saveAs)
                            })
                            break;
                            
                        case 9:
                            t.writeToForm.show(function(){
                                actionDetails.formChanges.length!==0 && this.writeToFormValuesTable.show() && this.writeToFormValuesNone.hide()
                                actionDetails.formChanges.length===0 && this.writeToFormValuesTable.hide() && this.writeToFormValuesNone.show()                              
                                generateParameterTable(this,"writeToFormValues",actionDetails.formChanges)                                
                            })
                            break;
                            
                        case 10:
                            t.compressAsZip.show(function(){
                                this.compressAsZipSaveAsRight.text(actionDetails.saveAs)
                                generateLoadFromList(this,"compressAsZipLoadFrom",actionDetails.loadFrom)                                
                            })
                            break;
                            
                        case 11:
                            t.pdfFill.show(function(){
                                this.pdfFillSourceRight.text(actionDetails.sourceTypeDisplayName)
                                this.pdfFillResourceNameRight.text(actionDetails.resourceName)
                                this.pdfFillSaveAsRight.text(actionDetails.saveAs)
                                actionDetails.sourceType === "EXTERNAL" && this.pdfFillResourceNameLeft.text(displayNames.pdfFillSourceExternalLeft)
                                actionDetails.sourceType === "TENANT" && this.pdfFillResourceNameLeft.text(displayNames.pdfFillSourceTenantLeft)
                                actionDetails.sourceType === "PROJECT" && this.pdfFillResourceNameLeft.text(displayNames.pdfFillSourceProjectLeft)
                                actionDetails.sourceType === "FORM" && this.pdfFillResourceNameLeft.text(displayNames.pdfFillSourceFormLeft)                                
                            })
                            break;
                            
                        case 12:
                            t.postRequest.show(function(){
                                this.postRequestTargetUrlRight.text(actionDetails.targetURL)
                                this.postRequestRequestEncodingRight.text(actionDetails.requestEncoding)
                                this.postRequestResponseEncodingRight.text(actionDetails.responseEncoding)
                                actionDetails.allValues && this.postRequestAllValuesYes.show() && this.postRequestAllValuesNo.hide()
                                !actionDetails.allValues && this.postRequestAllValuesYes.hide() && this.postRequestAllValuesNo.show()
                                actionDetails.noFiles && this.postRequestNoFilesYes.show() && this.postRequestNoFilesNo.hide()
                                !actionDetails.noFiles && this.postRequestNoFilesYes.hide() && this.postRequestNoFilesNo.show()
                                actionDetails.xslTemplate===null && this.postRequestPreviewNone.show() && this.postRequestPreviewEditor.hide()
                                actionDetails.xslTemplate!==null && this.postRequestPreviewNone.hide() && this.postRequestPreviewEditor.show()                                       
                                generateParameterTable(this,"postRequestUrlParameters",actionDetails.urlParameters)
                            })
                            break;
                            
                            
                        case 13:
                            t.execPlugin.show(function(){
                                this.execPluginNameRight.text(actionDetails.name)
                                generateParameterTable(this,"execPluginParameters",actionDetails.parameters)
                            })
                            break;
                                              
                        case 14:
                            t.saveToFileSystem.show(function(){
                                setOptionalText(this,"saveToFileSystemSaveAs",actionDetails.saveAs)
                                generateLoadFromList(this,"saveToFileSystemLoadFrom",actionDetails.loadFrom)
                                actionDetails.usePID && this.saveToFileSystemUsePidYes.show() && this.saveToFileSystemUsePidNo.hide()
                                !actionDetails.usePID && this.saveToFileSystemUsePidYes.hide() && this.saveToFileSystemUsePidNo.show()
                                actionDetails.useTimeStamp && this.saveToFileSystemUseTimeStampYes.show() && this.saveToFileSystemUseTimeStampNo.hide()
                                !actionDetails.useTimeStamp && this.saveToFileSystemUseTimeStampYes.hide() && this.saveToFileSystemUseTimeStampNo.show()
                            })
                            break;
                            
                        case 15:
                            t.changeStatus.show(function(){
                                var statusID = actionDetails.targetStatus
                                var status = self.getStatusResource(statusID)                                
                                this.changeStatusTargetRight.text(status.ximaNode.properties["de.xima.fc.status.name"])
                            })
                            break;
                            
                        case 16:
                            t.createTxt.show(function(){
                                this.createTxtSaveAsRight.text(actionDetails.saveAs)
                            })
                            break;
                            
                        case 17:
                            t.provideUpload.show(function(){
                                generateItemsList(this,"provideUploadElements",actionDetails.uploadElementNames)
                            })                            
                            break;
                            
                        case 18:
                            t.stopBatch.show()
                            break;
                            
                        case 19:
                            t.copyStatus.show(function(){
                                var statusID = actionDetails.targetStatus
                                var status = self.getStatusResource(statusID)
                                this.copyStatusTargetRight.text(status.ximaNode.properties["de.xima.fc.status.name"])
                            })                            
                            break;
                            
                        case 20:
                            t.renewProcessId.show()
                            break;
                            
                        case 21:
                            t.copyToMailBox.show(function(){
                                var mailboxID = actionDetails.targetMailBox
                                var mailbox = self.getMailBoxResource(mailboxID)
                                this.copyToMailBoxNameRight.text(mailbox.name)
                                this.copyToMailBoxDescriptionRight.text(mailbox.description || "")
                                mailbox.deletable && this.copyToMailBoxDeletableYes.show() && this.copyToMailBoxDeletableNo.hide()
                                !mailbox.deletable && this.copyToMailBoxDeletableYes.hide() && this.copyToMailBoxDeletableNo.show()
                                mailbox.keepStatus && this.copyToMailBoxKeepStatusYes.show() && this.copyToMailBoxKeepStatusNo.hide()
                                !mailbox.keepStatus && this.copyToMailBoxKeepStatusYes.hide() && this.copyToMailBoxKeepStatusNo.show()
                            })
                            break;
                            
                        case 22:
                            t.moveToMailBox.show(function(){
                                var mailboxID = actionDetails.targetMailBox
                                var mailbox = self.getMailBoxResource(mailboxID)
                                this.moveToMailBoxNameRight.text(mailbox.name)
                                this.moveToMailBoxDescriptionRight.text(mailbox.description || "")
                                mailbox.deletable && this.moveToMailBoxDeletableYes.show() && this.moveToMailBoxDeletableNo.hide()
                                !mailbox.deletable && this.moveToMailBoxDeletableYes.hide() && this.moveToMailBoxDeletableNo.show()
                            })                            
                            break;
                            
                        case 23:
                            t.deleteBatch.show()
                            break;
                            
                        case 24:
                            t.redirect.show(function(){
                                var urlID = actionDetails.redirectTemplate
                                var url = self.getUrlResource(urlID)
                                this.redirectUrlTemplateRight.text(url.name)
                                generateParameterTable(this,"redirectParameters",actionDetails.urlParameters)
                            })                            
                            
                            break;
                            
                        case 25:
                            t.wordFill.show(function(){
                                this.wordFillSourceRight.text(actionDetails.sourceTypeDisplayName)
                                this.wordFillResourceNameRight.text(actionDetails.resourceName)
                                this.wordFillSaveAsRight.text(actionDetails.saveAs)
                                actionDetails.sourceType === "EXTERNAL" && this.wordFillResourceNameLeft.text(displayNames.wordFillSourceExternalLeft)
                                actionDetails.sourceType === "TENANT" && this.wordFillResourceNameLeft.text(displayNames.wordFillSourceTenantLeft)
                                actionDetails.sourceType === "PROJECT" && this.wordFillResourceNameLeft.text(displayNames.wordFillSourceProjectLeft)
                                actionDetails.sourceType === "FORM" && this.wordFillResourceNameLeft.text(displayNames.wordFillSourceFormLeft)                                
                            })
                            break;
                            
                        case 26:
                            t.xmlToForm.show(function(){
                                var actionID = actionDetails.sourceAction
                                var xslTemplateID = actionDetails.xslTemplate
                                var action = self.getActionResource(actionID)
                                this.xmlToFormSourceNameRight.text(action.ximaAction.properties["de.xima.fc.action.name"])
                                generateParameterTable(this,"xmlToFormXPath",actionDetails.xPath)
                                xslTemplateID===null && this.xmlToFormTemplateNameNone.show() && this.xmlToFormTemplateNameText.hide()
                                xslTemplateID!==null && this.xmlToFormTemplateNameNone.hide() && this.xmlToFormTemplateNameText.show()
                                xslTemplateID===null && this.xmlToFormPreviewNone.show() && this.xmlToFormPreviewEditor.hide()
                                xslTemplateID!==null && this.xmlToFormPreviewNone.hide() && this.xmlToFormPreviewEditor.show()
                                if (xslTemplateID!==null) {
                                    xslTemplate = self.getXslResource(xslTemplateID)
                                    this.xmlToFormTemplateNameText.text(xslTemplate.name)
                                }
                            })
                            break;
                    }
                    
                    return jTooltip
                }
            })
        })
    })
    
}

XV.prototype.setDialogLegend = function() {
    var self = this
    var dialogLegend = $('#dialogLegend')
    var buttons = {}
    buttons[self.layout.toolbar.displayNameLegendClose] = function(){dialogLegend.dialog("close")}
    dialogLegend.dialog({
        autoOpen: false,
        modal: false,
        closeText: self.layout.toolbar.displayNameLegendClose,
        draggable: true,
        resizable: true,
        show: {
            effect: "fade",
            duration: self.layout.toolbar.legendFade
        },
        hide: {
            effect: "fade",
            duration: self.layout.toolbar.legendFade
        },        
        buttons: buttons
    })
}
XV.prototype.setMainToolbar = function() {
    // See http://paulkinzett.github.io/toolbar/
    var self = this
    var toolbarOpen = false
    var mainToolbarOpener = $("#mainToolbarOpener")
    var mainToolbarOpenerTitleOpened = mainToolbarOpener.attr("ui-title-opened")
    var mainToolbarOpenerTitleClosed = mainToolbarOpener.attr("ui-title-closed")
    var dialogLegend = $('#dialogLegend')
    
    // Main toolbar
    mainToolbarOpener.toolbar({
        content: "#mainToolbar",
        position: "right",
        style: 'success',
        animation: 'flip',
        event: 'click',
        hideOnClick: true,
        autoAdjust: true,
        adjustment: 0,
        adjustAgainst: self.viewportNode
    })
    .on("toolbarShown",function(){
        // Make the tooltip say "close menu"
        var span = $('.ui-tooltip-content>span.mainToolbarOpenerSpan').last()
        toolbarOpen = true
        $(span).text(mainToolbarOpenerTitleOpened)
    })
    .on("toolbarHidden",function(){
        // Make the tooltip say "open menu"
        var span = $('.ui-tooltip-content>span.mainToolbarOpenerSpan').last()
        toolbarOpen = false
        $(span).text(mainToolbarOpenerTitleClosed)
    })

    // Make the toolbar handler draggable.
    mainToolbarOpener.draggable({
        distance: 10,
        scroll: false,
        containment: '#viewport',
        start: function(){
            this.toolbarWasShown = mainToolbarOpener.toolbar("shown")
            mainToolbarOpener.toolbar("disable",true)
            mainToolbarOpener.toolbar("hide")
        },
        stop: function() {
            if (this.toolbarWasShown) {
                mainToolbarOpener.toolbar("show")
            }
            mainToolbarOpener.toolbar("disable",null)
        }
    })
    
    // Reposition the toolbar handler upon resize.
    self.onResize.push(function(){
        var offset = mainToolbarOpener.offset()
        if (offset.top+mainToolbarOpener.outerHeight() > window.innerHeight){
            mainToolbarOpener.css("top",window.innerHeight-mainToolbarOpener.outerHeight())
        }
        if (offset.left+mainToolbarOpener.outerWidth() > window.innerWidth){
            mainToolbarOpener.css("left",window.innerWidth-mainToolbarOpener.outerWidth())
        }        
    })
    
    // Tooltip on the toolbar button
    mainToolbarOpener.tooltip({
        items: '#mainToolbarOpener',
        track: true,
        show: {
            effect:"fade",
            duration: self.layout.toolbar.tooltipFade,
            delay: self.layout.toolbar.tooltipDelay
        },
        content: function(){
            return $('<span>').addClass('mainToolbarOpenerSpan').text(toolbarOpen ? mainToolbarOpenerTitleOpened : mainToolbarOpenerTitleClosed)
        }
    })    
    // Tooltip on items
    $('.tool-items>.mainToolbarItem').tooltip({
        items: '.tool-items>.tool-item',
        track: true,
        show: {
            effect:"fade",
            duration: self.layout.toolbar.tooltipFade,
            delay: self.layout.toolbar.tooltipDelay
        },
        position: {my: "left+20 center", at: "right center"},
        content: function(){
            return $('<span>').text($(this).attr('ui-title'))
        }
    })
    
    // Setup legend.
    self.setDialogLegend()
    
    // Event handlers when clicking an item
    $('a#toolbarZoomToKGraph').on("click",function(){
        self.zoomToKGraphBoundaries()
    })
    $('a#toolbarToggleEdgeNodeArrows').on("click",function(){
        var edgeNodeStatus = self.svgG.select('#containerEdgeNodeStatus')
        var opacity = parseInt(edgeNodeStatus.style("opacity"),10) > 0.5 ? 0 : 1
        edgeNodeStatus.transition()
            .duration(self.layout.toolbar.edgeNodeArrowsFade)
            .style({"opacity":opacity})
    })
    $('a#toolbarPrintGraph').on("click",function(){
        $('#mainToolbarOpener').hide()
        $('.tool-container').hide()
        window.print()
        $('#mainToolbarOpener').show()
        $('.tool-container').show()        
    })   
    $('a#toolbarToggleLegend').on("click",function(){
        dialogLegend.dialog(dialogLegend.dialog("isOpen") ? "close" : "open")
    })
    
}
XV.prototype.setStatusToolbar = function() {
    var self = this
    var toolbarFadeDuration = self.layout.status.toolbarFadeDuration
    var showToolbar = function() {
        this.transition()
            .duration(toolbarFadeDuration)
            .style({"opacity":"1.0"})
    }
    var hideToolbar = function() {
        this.transition()
            .duration(toolbarFadeDuration)
            .style({"opacity":"0.0"})
    }
    self.statusNodes.forEach(function(statusNode){
        var mainSelector = statusNode.classSelectors.MAIN
        var toolbarSelector = statusNode.classSelectors.containerToolbar
        var dMain = statusNode.svgG.select(mainSelector)
        var dToolbar = statusNode.svgG.select(toolbarSelector) || statusNode.svgG.filter(mainSelector)
        if (dMain.empty()){dMain = statusNode.svgG.filter(mainSelector)}
        if (dToolbar.empty()){dMain = statusNode.svgG.filter(toolbarSelector)}
        dMain.on("mouseenter",function(){
            if (self.modeAllowsStatusToolbar()) {
                showToolbar.call(dToolbar)
            }
        })
        dMain.on("mouseleave",function(){
            hideToolbar.call(dToolbar)
        })
        hideToolbar.call(dToolbar)
        statusNode.statusToolbar = {
            element: dToolbar,
            show: showToolbar.bind(dToolbar),
            hide: hideToolbar.bind(dToolbar),
        }
    })
}
XV.prototype.setupStatusNodeButtons = function() {
    var self = this
    self.statusNodes.forEach(function(node){
        var buttons = node.classSelectors.buttons
        var buttonsProps = self.layout.status.buttons
        for (var buttonName in buttons) {
            var button = buttons[buttonName]
            var buttonProps = buttonsProps[buttonName]
            var elButtonNormal = node.svgG.select(button.normal)
            var elButtonHover = node.svgG.select(button.hover)
            var data = {
                callback: XV.callbacksButton[buttonName],
                elNormal: elButtonNormal,
                elHover: elButtonHover,
                pointerEvents : buttonProps.pointerEvents,
                fadeDuration: buttonProps.fadeDuration,
                node: node
            }
            
            // Do not show hidden buttons.
            if ($(elButtonNormal.node()).css("visibility")==="hidden"){continue}
            
            elButtonNormal.style({"opacity":"1.0"})
                .attr("pointer-events", button.pointerEvents)
                .data([data])
                .on("mouseenter",function(d){
                    d.elHover.transition()
                        .duration(d.fadeDuration)
                        .style({"opacity":"1.0"})
                    d.elNormal.transition()
                        .duration(d.fadeDuration)
                        .style({"opacity":"0.0"})
                })
                .on("mouseleave",function(d){
                    d.elNormal.transition()
                        .duration(d.fadeDuration)
                        .style({"opacity":"1.0"})
                    d.elHover.transition()
                        .duration(d.fadeDuration)
                        .style({"opacity":"0.0"})
                })
                .on("click",function(d){
                    d.callback.call(self,d.node)
                })
            elButtonHover.style({"opacity":"0.0"})
                .attr("pointer-events", button.pointerEvents)
                .data([data])
                .on("mouseenter",function(d){
                    d.elHover.transition()
                        .duration(d.fadeDuration)
                        .style({"opacity":"1.0"})
                    d.elNormal.transition()
                        .duration(d.fadeDuration)
                        .style({"opacity":"0.0"})
                })
                .on("mouseleave",function(d){
                    d.elNormal.transition()
                        .duration(d.fadeDuration)
                        .style({"opacity":"1.0"})
                    d.elHover.transition()
                        .duration(d.fadeDuration)
                        .style({"opacity":"0.0"})
                })
                .on("click",function(d){
                    d.callback.call(self,d.node)
                })
        }
    })
}
XV.prototype.setupEdgeHighlight = function() {
    var self = this
    /* TO_BE_DELETED
    if (self.layout.edgeStatus.highlightMode==="TOPMOST") {
        self.svg.selectAll('.edge-path-mouseover').on("mouseenter",function(){
            var selfEl = this
            var par = selfEl.parentNode
            $(self.edgeStatusGNode).append(par) // put edge in front
            XV.addClass(par,"is-mouseover") // highlight edge
        })    
        .on("mouseleave",function(){        
            var selfEl = this            
            var par = selfEl.parentNode
            XV.removeClass(par,"is-mouseover") // remove highlight
        })        
    }
    else*/ if (self.layout.edgeStatus.highlightMode==="ALL") {
        // native browser support for checking multiple elements
        if (false && XV.browserSupport.elementsFromPoint && !XV.browserSupport.elementsFromPointFix) {
            /* TO_BE_DELETED
            // searching for edges with method GRID is much faster, albeit slighlty less accurate
            self.svg.selectAll('.edge-path-mouseover').on("mouseenter",function(){
                    var cX = d3.event.clientX
                    var cY = d3.event.clientY
                    var els = XV.allElementsAtMouse(cX,cY,"path.edge-path-mouseover")
                    self.triggerStatusEdgeHighlight(els)
                })
                .on("mouseleave",function(){
                    var cX = d3.event.clientX
                    var cY = d3.event.clientY
                    var els = XV.allElementsAtMouse(cX,cY,"path.edge-path-mouseover")
                    self.triggerStatusEdgeHighlight(els)                                      
                })
                .on("mousemove",function(){
                    var cX = d3.event.clientX
                    var cY = d3.event.clientY
                    var els = XV.allElementsAtMouse(cX,cY,"path.edge-path-mouseover")
                    self.triggerStatusEdgeHighlight(els)
                })*/
        }
        // if no native browser support, search for edges within a given radius
        else {
            self.svg.on("mousemove",function(){
                self.mousePageX = d3.event.pageX || -424242 // event.pageX being undefined
                self.mousePageY = d3.event.pageY || -424242 // happened once to me...
            })
            var oldMousePageX = self.mousePageX
            var oldMousePageY = self.mousePageY
            var radius = self.kGraphEdgeProximityRadius
            var dt = self.layout.diagram.edgeHighlightCheckInterval
            var recursiveCheck = recursiveCheck
            var highlightNodes = self.layout.diagram.highlightStatusNodesOnEdgeMouseover
            if (self.layout.diagram.edgeHighlightCheckIntervalAlgorithm == "GRID") {    
                // Create grid for computing all edges within a given radius quickly.
                self.kGraphEdgeGrid = self.createKGraphEdgeGrid()
                function recursiveCheck(){
                    window.setTimeout(function(){
                        if (self.modeAllowsEdgeHighlight() && (self.MousePageX!==oldMousePageX || self.mousePageY !== oldMousePageY)) {
                            var pos = self.getPositionFromMouse(self.mousePageX,self.mousePageY)                        
                            var edges = self.kGraphEdgeGrid.getGridCellAt(pos.x,pos.y)
                            edges.within.classed({"is-mouseover":true})
                            edges.outside.classed({"is-mouseover":false})
                            if (highlightNodes){
                                edges.targets.classed({"is-highlight":true})
                                edges.notTargets.classed({"is-highlight":false})
                            }
                            oldMousePageX = self.mousePageX
                            oldMousePageY = self.mousePageY
                        }
                        recursiveCheck()
                    }, dt)
                }
                recursiveCheck()
            }
            /* TO_BE_DELETED
            else if (self.layout.diagram.edgeHighlightCheckIntervalAlgorithm == "BBOX") {
                var callbackInside = function(edge){
                    edge.edgeG.classed({"is-mouseover":true})
                }
                var callbackOutside = function(edge){
                    edge.edgeG.classed({"is-mouseover":false})
                }                
                recursiveCheck = function(){
                    window.setTimeout(function(){
                        if (self.MousePageX!==oldMousePageX || self.mousePageY !== oldMousePageY){
                            var pos = self.getPositionFromMouse(self.mousePageX,self.mousePageY)
                            var edges = self.getAllEdgesWithin(pos.x,pos.y,radius,callbackInside,callbackOutside)
                            oldMousePageX = self.mousePageX
                            oldMousePageY = self.mousePageY
                        }
                        recursiveCheck()
                    }, dt)
                }
            }
            recursiveCheck()*/
        }
    }
}
XV.prototype.setupManualEditor = function() {
    var self = this
    var scale = XV.getScale(self.svgGNode)    
    self.statusNodes.forEach(function(node){
        var disableMaskEditManualSelector = node.classSelectors.disableMaskEditManual
        var disableMaskEditManual = node.svgG.select(disableMaskEditManualSelector)
        disableMaskEditManual.style({'display':'none'})
            .classed({'disable-mask-edit-manual':true})
            .on("click",function(){
                node.svgG.classed("is-highlight") ? node.svgG.classed({"is-highlight":false}) : node.svgG.classed({"is-highlight":true})
        })
        node.disableMaskEditManual = disableMaskEditManual
   }) 
}
XV.prototype.setupActionsDialog = function() {
    var self=this
    var minimizeTitle = self.layout.action.displayNameActionsGraphMinimize
    var maximizeTitle = self.layout.action.displayNameActionsGraphMaximize
    var restoreTitle = self.layout.action.displayNameActionsGraphRestore
    var collapseTitle = self.layout.action.displayNameActionsGraphCollapse
    
    self.statusNodes.forEach(function(statusNode){
        var actionSvg = statusNode.actionSvg
        var actionsDialog = statusNode.actionsDialog
        var initialWidth = window.innerWidth*0.25
        var initialHeight = window.innerHeight*0.50
        var onResize = function(event,ui){
            var width = actionsDialog.width()
            var height = actionsDialog.height()
            actionSvg.attr({
                "width": width < 0 ? 0 : width,
                "height": height < 0 ? 0 : height
            })
            XV.zoomGraphToBoundaries(statusNode.actionsKGraphBBox,statusNode.actionSvgGNode,statusNode.actionZoom,0.0,0.0,1,function(transform) {
                this.attr({transform: transform})
            })
        }
        actionSvg.attr({
            "width": initialWidth,
            "height": initialHeight
        })    
        statusNode.actionsDialogInitial = true
        actionsDialog.dialog({
            // properties
            appendTo: "body",
            autoOpen: false,
            buttons: [
                {
                    "text": self.layout.action.displayNameActionsGraphZoom,
                    "icon": "ui-icon-zoomin",
                    "click": function() {
                        XV.zoomGraphToBoundaries(statusNode.actionsKGraphBBox,statusNode.actionSvgGNode,statusNode.actionZoom)
                    }
                },                
                {
                    text: self.layout.action.displayNameActionsGraphClose,
                    icon: "ui-icon-close",
                    click: function(){
                        $(this).dialog("close")
                    }
                }
            ],
            closeOnEscape: true,
            closeText: self.layout.action.displayNameActionsGraphClose,
            draggable: true,
            height: initialHeight,
            hide: self.layout.action.effectOutActionsGraph,
            maxHeight: false,
            maxWidth: false,
            minHeight: 1,
            minWidth: 1,
            modal: false,
            position: {
                my: "center",
                at: "center",
                of: window 
            },
            resizable: true,
            show: self.layout.action.effectInActionsGraph,
            title: self.layout.action.displayNameTitleActionsGraph.replace('###STATUS###',statusNode.ximaNode.properties["de.xima.fc.status.name"]),
            width: initialWidth,
            // callbacks
            open: function(){
                if (statusNode.actionsDialogInitial){
                    statusNode.actionsDialogInitial = false
                    $(this).parent().promise().done(function(){
                        statusNode.actionsDialog.dialogExtend("maximize")
                        XV.zoomGraphToBoundaries(statusNode.actionsKGraphBBox,statusNode.actionSvgGNode,statusNode.actionZoom,0.5,0.5,null,function(transform){
                            this.attr({opacity: 0.0, transform: transform})
                                .transition()
                                .duration(400)
                                .attr("opacity",1.0)
                        })
                    })
                }
            },
            resizeStop: onResize
        })
        .dialogExtend({
            // options
            closable: true,
            collapsable: true,
            dblclick: "collapse",
            icons: {
                "maximize": "ui-icon-extlink",
                "close": "ui-icon-close",
                "minimize": "ui-icon-arrowstop-1-s",
                "restore": "ui-icon-newwin"
            },
            maximizable: true,
            minimizable: true,
            // locale
            minimizeTitle: minimizeTitle,
            maximizeTitle: maximizeTitle,
            restoreTitle: restoreTitle,
            collapseTitle: collapseTitle,            
            // callbacks
            maximize: onResize,
            collapse: onResize,
            minimize: onResize,
            restore: onResize
        })
    })
}

/* Unused
XV.prototype.readSvgFontAsGlyphs = function(data,name) {
    var self = this
    var glyphs = {}
    var selectors = new HashToken()
    selector.value = name
    var oldSelector = selector.toSource()
    var contentSelector = selector.toSource()
    var svg = self.readSvg(data,contentSelector,oldSelector)
    elGlyphs = svg.svgData.selectAll("glyph").each(function(d){
        var attrD = this.getAttribute("d")
        var unicode = this.getAttribute("codepoint")
        var codepoint = unicode.codePointAt(0)
        var path = document.createElement("path")
        path.setAttribute(attrD)
        gylphs[codepoint] = {codepoint:codepoint, unicode:unicode, svg: path}
    })
    
    return glyphs
}
*/

/*
    data - Contents of an svg file.
    contentSelector - The <svg> element is filtered by this selector and only these nodes are considered.
    oldSelectors - ID selectors which will be converted to class selectors.
    svgElement - Element which will contain the svg nodes.
*/
XV.prototype.readSvg = function(data,contentSelector,oldSelectors,svgElement) {
    var self = this
    var svg = {}
    var newSelectors = {}            
    var svgData = d3.select(data.documentElement)
    var svgDefs = $(svgData.node().childNodes).filter('defs')
    var svgContent = svgData.select(contentSelector)[0]
    var newG
    var translate0, scale0
    
    // Get view box from inkscape.
    var viewBox = svgData.attr("viewBox").trim(" ").match(/([0-9\-.]+) ([0-9\-.]+) ([0-9\-.]+) ([0-9\-.]+)/)
    var x0 = parseFloat(viewBox[1])
    var y0 = parseFloat(viewBox[2])
    var width = parseFloat(viewBox[3])
    var height = parseFloat(viewBox[4])

    // Get class selectors from id selectors.
    var newSelectors = XV.convertIdSelectorsToClassSelectors(oldSelectors,'id-')

    // Create unique ids and replace references.
    var newDefs = self.cleanupDefs(svgDefs,svgData.node())

    // Append defs from svg.
    //$(self.svgDefsNode).append(newDefs.childNodes)
    $(svgElement).append(newDefs.childNodes)
    
    //self.svgDefs.push(newDefs)

    // Wrap in g if not already wrapped.
    newG = svgContent[0]

    // Get zero transform
    translate0 = XV.getTranslate(newG),
    scale0 = XV.getScale(newG)

    svg.svgData = svgData
    svg.svgDefs = svgDefs
    svg.svgGNode = newG
    svg.viewBox = {xmin:x0,ymin:y0,xmax:x0+width,ymax:y0+height,width:width,height:height}
    svg.translate0 = translate0
    svg.scale0 = scale0
    svg.bBox = svg.viewBox // fixme...
    svg.classSelectors = newSelectors
    
    return svg
}

/*
    Returns the layout data for this kind of node.
    Some nodes (eg. submission, resubmission) have got
    a different svg image and corresponding metadata.
*/
XV.prototype.getStatusNodeLayout = function(node){
    var self = this
    var nodeLayout
    // In case the status on resubmission is identical to the status on
    // submission, prefer the former one. This is the default setting.
    if (node.id === self.data.properties["de.xima.fc.statusOnSubmission"]) {
        nodeLayout = self.layout.status.mainSubmission
    }
    else if (node.id === self.data.properties["de.xima.fc.statusOnResubmission"]) {
        nodeLayout = self.layout.status.mainResubmission
    }
    else {
        nodeLayout = self.layout.status.main
    }
    return nodeLayout
}
XV.prototype.getActionNodeLayout = function(node){
    var self = this
    var nodeLayout
    if (node.ximaAction.properties["de.xima.fc.action.condition"].type==="NONE"){
        nodeLayout = (node.index===0) ? self.layout.action.mainWithoutConditionFirst : self.layout.action.mainWithoutCondition
    }
    else {
        nodeLayout = (node.index===0) ? self.layout.action.mainWithConditionFirst : self.layout.action.mainWithCondition
    }
    return nodeLayout
}

// Get resource (template, font etc.) by id.
XV.prototype.getUserGroupResource = function(id) {
    return this.resources.userGroup[id]
}
XV.prototype.getStatusResource = function(id) {
    return this.statusNodesHash[id]
}
XV.prototype.getActionResource = function(id) {
    
    return this.actionsHash[id]
}
XV.prototype.getHtmlResource = function(id) {
    return this.resources.html[id]
}
XV.prototype.getXslResource = function(id) {
    return this.resources.xsl[id]
}
XV.prototype.getMailBoxResource = function(id) {
    return this.resources.mailbox[id]
}
XV.prototype.getUrlResource = function(id) {
    return this.resources.url[id]
}

/*
    Sets up callback for the buttons on each statusNode.
*/
XV.prototype.callbackButtonExpand = function(statusNode){
    if (statusNode.actionsDialog.dialog("isOpen")){
        statusNode.actionsDialog.dialogExtend("restore")
        statusNode.actionsDialog.dialog("moveToTop")
        statusNode.actionsDialog.parent().effect("shake", {
            direction: "left",
            distance: 20,
            times: 3
        })
    }
    else {
        if (statusNode.actionsDialogInitial){
            statusNode.actionsDialog.dialogExtend("maximize")
        }
        statusNode.actionsDialog.dialog("open")
    }
}
XV.prototype.callbackButtonEditManual = function(node) {
    var self = this
    self.modeChange(XV.MODE_EDIT_MANUAL)
    self.zoomToKGraphBoundaries()
    self.statusNodes.forEach(function(otherNode){
        if (otherNode.id!==node.id){
            otherNode.disableMaskEditManual.style({"display":"initial"})
            // Highlight all active nodes with at least one manual transition.
            if (node.allTargetsHash[otherNode.ximaNode.id]) {
                otherNode.svgG.classed({"is-highlight":true})
            }
        }
    })
}
XV.callbacksButton = {
    expand: XV.prototype.callbackButtonExpand,
    editManual: XV.prototype.callbackButtonEditManual
}

/*
    Main program rendering the diargram, organized into steps.

    Step 0 - Setup.

        === Main graph with status nodes. ===
    Step 1 - Read and preprocess svg graphics resource.
    Step 2 - Create html elements for each status node.
    Step 3 - Generate the data structure for the kGraph layouter.
    Step 4 - Run the kGraph layouter.
    Step 5 - Setup events. (eg. tooltips on mouseover)

        === Sub graphs with action nodes for each status node.    ===
        === These are the same steps as above for each sub graph. ===
    Step 6 - Create html elements for each action node.
    Step 7 - Generate the data structure for the kGraph layouter.
    Step 8 - Run the kGraph layouter.
    Step 9 - Setup events. (eg. tooltips on mouseover)

    Step 10 - Finalize, oom in to the graph and display it.

*/

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
            duration: 1000
        },
        resizable: false,
        width: Math.min(window.innerWidth*0.9,800)
    })
    loadBar.progressbar({
        value: 0,
        max: 100,
        change: function(){
            loadLabel.text((loadBar.progressbar("value").toFixed(1))+ "% abgeschlossen")
        },
        complete: function(){
            loadDialog.dialog("close")
            loadBlock.animate({"opacity":"0"},500,"swing",function(){$(this).hide()})
        }
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
    // Pattern defined in layout.json
    /* Line+Arrow:
        "patternPoints" : [{"x":0,"y":0},{"x":200,"y":0},{"x":200,"y":1.5},{"x":210,"y":0},{"x":200,"y":-1.5}],
        "patternDirection" : {"x":210,"y":0},
        "patternOrigin" : {"x":0,"y":0}
        var path = _.map(points,function(r){return r[0] + " " + r[1]}).join("L")
        var mpoints = _.map(points,function(r){return{x:r[0],y:r[1]}})
        LS.transformPoints(mpoints,pattern,0,LS.getBezier,function(pts){
            path += "M"
            path += pts[1].x + " " + pts[1].y + " L"
            path += pts[2].x + " " + pts[2].y + " " + pts[3].x + " " + pts[3].y + " " + pts[4].x + " " + pts[4].y + " Z "
        })
        return path
    */

    var patternPoints = self.layout.edgeStatus.patternPoints
    var patternDirection = self.layout.edgeStatus.patternDirection
    var patternOrigin = self.layout.edgeStatus.patternOrigin
    var pattern = LS.createPattern(patternPoints,patternDirection,patternOrigin)
    lineInterpolator = new d3.svg.line()
    lineInterpolator.x(function(d){return d.x})
    lineInterpolator.y(function(d){return d.y})
    lineInterpolator.interpolate(function(points){
        return path = _.map(points,function(r){return r[0] + " " + r[1]}).join("L")
    })

    self.loadDialog = {dialog:loadDialog,bar:loadBar,block:loadBlock,details:loadDetails,steps:5}
    self.lineInterpolator = lineInterpolator    
    self.svgGZoom = zoom
    self.readLayoutSVG()
}

// STEP 1: Read svg data from layout.json.
// Proceed to STEP 2 upon completion.
XV.prototype.readLayoutSVG = function() {
    var self = this
    var entries = [
        [self.layout.status.main,self.svgDefsNode],
        [self.layout.status.mainSubmission,self.svgDefsNode],
        [self.layout.status.mainResubmission,self.svgDefsNode],
        [self.layout.status.edgeNodeInboundNorth,self.svgDefsNode],
        [self.layout.status.edgeNodeInboundEast,self.svgDefsNode],
        [self.layout.status.edgeNodeInboundSouth,self.svgDefsNode],
        [self.layout.status.edgeNodeInboundWest,self.svgDefsNode],
        [self.layout.status.edgeNodeOutboundNorth,self.svgDefsNode],
        [self.layout.status.edgeNodeOutboundEast,self.svgDefsNode],
        [self.layout.status.edgeNodeOutboundSouth,self.svgDefsNode],
        [self.layout.status.edgeNodeOutboundWest,self.svgDefsNode],
        [self.layout.status.edgeNodeTwoboundNorth,self.svgDefsNode],
        [self.layout.status.edgeNodeTwoboundEast,self.svgDefsNode],
        [self.layout.status.edgeNodeTwoboundSouth,self.svgDefsNode],
        [self.layout.status.edgeNodeTwoboundWest,self.svgDefsNode],
        [self.layout.action.mainWithCondition,document.getElementById('actionsPaperSvgDefsTemplate')],
        [self.layout.action.mainWithoutCondition,document.getElementById('actionsPaperSvgDefsTemplate')],
        [self.layout.action.mainWithConditionFirst,document.getElementById('actionsPaperSvgDefsTemplate')],
        [self.layout.action.mainWithoutConditionFirst,document.getElementById('actionsPaperSvgDefsTemplate')]        
    ]
    var promises = []
    var time = (new Date()).getTime()

    self.setLoadBar("Lade Resourcen...",100/self.loadDialog.steps)
    
    // Read svg file and replace all selectors (eg. #button-expand => .id-button-expand).
    entries.forEach(function(entry,idx){
        var node = entry[0]
        var defs = entry[1]
        var url = self.resURL(node.svg)        
        var selectors = node.selectors
        var promise = $.get(url,"",$.noop,"xml").promise()
        promise.then(function(data){
            var oldSelectors = node.selectors
            var contentSelector = node.selectors.MAIN
            var svg = self.readSvg(data,contentSelector,oldSelectors,defs)
            node.classSelectors = svg.classSelectors
            node.svgData = svg.svgData
            node.svgGNode = svg.svgGNode
            node.viewBox = svg.viewBox
            node.bBox = svg.bBox
            node.translate0 = svg.translate0
            node.scale0 = svg.scale0            
        })
        promises.push(promise)
    })
    // Proceed to next step once all svg files are loaded.
    Promise.all(promises).then(function(){
        console.log("Loading all svg resources took " + ((new Date().getTime())-time)/1000 + "s.")
        self.loadNodesToDomLayered()
    }).catch(function(e){
        self.handleError(e)
    }) 
}

// Step 2: Bind data to status nodes and load to DOM.
// Proceed to step 3 upon completion.
XV.prototype.loadNodesToDomLayered = function(){
    var self = this 

    // Create status node data.
    var statusNodes = []
    var statusNodesHash = {}
    var actionsHash = {}
    
    self.data.children.forEach(function(node,idx){
        var statusMain = self.getStatusNodeLayout(node)
        var svgData = statusMain.svgData
        var svgGNode = statusMain.svgGNode
        
        var newStatusGNode = $(XV.clone(svgGNode))[0]
        var newStatusGNodeD3 = d3.select(newStatusGNode)
        var actions = _.map(node.children,function(xa,idx){return {ximaAction:xa, id:xa.id, index: idx}})
        var statusNode = {
            svgG : newStatusGNodeD3,
            svgGNode : newStatusGNode,
            ximaNode : node,
            selectors : statusMain.selectors,
            classSelectors : statusMain.classSelectors,
            actions : actions
        }       
        actions.forEach(function(action){
            actionsHash[action.id] = action
        })
        statusNodes.push(statusNode)
        statusNodesHash[node.id] = statusNode
    })

    // Bind data to status nodes and enter nodes.
    self.statusNodes = statusNodes
    self.statusNodesHash = statusNodesHash
    self.actionsHash = actionsHash
    
    self.newStatusNodes()

    // Proceed to next step.
    self.prepareLayoutLayered()
}

// Step 3: Generate kGraph and link data.
// Proceed to Step 4 upon completion.
XV.prototype.prepareLayoutLayered = function () {
    var self = this
    var data = self.data
    var layout = self.layout
    var status = layout.status
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
    var ximaAllPorts = {}
    var allTransitions = {}
    var allTargetsHashes = {}
    var allSourcesHashes = {}

    kGraph.properties["de.cau.cs.kieler.direction"] = layout.diagram.direction
    kGraph.properties["de.cau.cs.kieler.klay.layered.nodePlace"] = layout.diagram.nodePlace
    kGraph.properties["de.cau.cs.kieler.edgeRouting"] = layout.diagram.edgeRouting
    kGraph.properties["de.cau.cs.kieler.spacing"] = layout.diagram.spacing
    kGraph.properties["de.cau.cs.kieler.borderSpacing"] = layout.diagram.borderSpacing    
    kGraph.properties["de.cau.cs.kieler.klay.layered.edgeSpacingFactor"] = layout.diagram.edgeSpacingFactor
    kGraph.properties["de.cau.cs.kieler.klay.layered.nodeLayering"] = layout.diagram.nodeLayering
    kGraph.properties["de.cau.cs.kieler.klay.layered.thoroughness"] = layout.diagram.thoroughness
    kGraph.properties["de.cau.cs.kieler.klay.layered.interactiveReferencePoint"] = layout.diagram.interactiveReferencePoint
    
    // Parse transition edges and add to kGraph.
    // Also creates one port for each transition.
    data.edges.forEach(function(edge,idx){
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
            TIMED : svgGSource.select(classSelectorsSource.portOutTimed)
        }
        var portsIn = {
            AUTO: svgGTarget.select(classSelectorsTarget.portInAuto),
            MANUAL : svgGTarget.select(classSelectorsTarget.portInManual),
            TIMED : svgGTarget.select(classSelectorsTarget.portInTimed)
        }
        var portsOutBBox = {
            AUTO : self.getBBoxFix(portsOut.AUTO.node()),
            MANUAL : self.getBBoxFix(portsOut.MANUAL.node()),
            TIMED : self.getBBoxFix(portsOut.TIMED.node())
        }
        var portsInBBox = {
            AUTO : self.getBBoxFix(portsIn.AUTO.node()),
            MANUAL : self.getBBoxFix(portsIn.MANUAL.node()),
            TIMED : self.getBBoxFix(portsIn.TIMED.node())
        }        
        
        // Save references to sources and target nodes for each status node.
        allTargetsHashes[sourceID] = allTargetsHashes[sourceID] || {}
        allTargetsHashes[sourceID][targetID] = statusNodeTarget
        allSourcesHashes[targetID] = allSourcesHashes[targetID] || {}
        allSourcesHashes[targetID][sourceID] = statusNodeSource
        
        // Save a reference to all possible transitions for this node.
        allTransitions[sourceID] = allTransitions[sourceID] || {AUTO:[], MANUAL: [], TIMED:[], IN: []}
        allTransitions[targetID] = allTransitions[targetID] || {AUTO:[], MANUAL: [], TIMED:[], IN: []}
        allTransitions[sourceID][linkType].push(transitionEdge)
        allTransitions[targetID][linkType].push(transitionEdge)
        
        // Defaults.
        kGraphAllPorts[sourceID] = kGraphAllPorts[sourceID] || {MANUAL:[],AUTO:[],TIMED:[],IN:[]}
        kGraphAllPorts[targetID] = kGraphAllPorts[targetID] || {MANUAL:[],AUTO:[],TIMED:[],IN:[]}
        var kGraphPortsSource = kGraphAllPorts[sourceID]
        var kGraphPortsTarget = kGraphAllPorts[targetID]

        ximaAllPorts[sourceID] = ximaAllPorts[sourceID] || {MANUAL:[],AUTO:[],TIMED:[],IN:[]}
        ximaAllPorts[targetID] = ximaAllPorts[targetID] || {MANUAL:[],AUTO:[],TIMED:[],IN:[]}
        var ximaPortsSource = ximaAllPorts[sourceID]
        var ximaPortsTarget = ximaAllPorts[targetID]
        
        // Setup edge data.
        transitionEdge.kGraphEdge = kGraphEdge
        transitionEdge.ximaEdge = edge

        // Push reference to available transitions for each status node.
        ximaPortsSource[linkType].push(edge)
        ximaPortsTarget.IN.push(edge)
        
        // Set port properties (id,coordinates, width, height)
        // Source
        if (status.maxPortsOut[linkType] < 0 || kGraphPortsSource[linkType].length < status.maxPortsOut[linkType]) {
            portSourceID = "de.xima.fc.port-" + portID++   
            kGraphPortSource.id = portSourceID
            kGraphPortSource.x = portsOutBBox[linkType].xmin - statusNodeSourceBBox.xmin
            kGraphPortSource.y = portsOutBBox[linkType].ymin - statusNodeSourceBBox.ymin
            kGraphPortSource.width = portsOutBBox[linkType].width
            kGraphPortSource.height = portsOutBBox[linkType].height
            kGraphPortSource.properties = {}
            kGraphPortsSource[linkType].push(kGraphPortSource)
        }
        else {
            portSourceID = kGraphPortsSource[linkType][0].id
        }
        // Target
        if (status.maxPortsIn < 0 || kGraphPortsTarget.IN.length < status.maxPortsIn){
            portTargetID = "de.xima.fc.port-" + portID++            
            kGraphPortTarget.id = portTargetID
            kGraphPortTarget.x = portsInBBox[linkType].xmin - statusNodeTargetBBox.xmin
            kGraphPortTarget.y = portsInBBox[linkType].ymin - statusNodeTargetBBox.ymin
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
        // Defaults
        kGraphAllPorts[node.id] = kGraphAllPorts[node.id] || {MANUAL:[],AUTO:[],TIMED:[],IN:[]}
        ximaAllPorts[node.id] = ximaAllPorts[node.id] || {MANUAL:[],AUTO:[],TIMED:[],IN:[]}
        
        var kGraphNode = {}
        var allPorts = kGraphAllPorts[node.id]
        var allPortsArray = []
        var statusNode = self.statusNodesHash[node.id]
        var statusMain = self.getStatusNodeLayout(node)
        var statusMainBBox = statusMain.bBox
        
        // Setup node data.
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
                
        statusNode.ports = allPorts
        statusNode.allTargetsHash = allTargetsHashes[node.id] || {}
        statusNode.allSourcesHash = allSourcesHashes[node.id] || {}
        statusNode.transitions = allTransitions[node.id] || {}
        statusNode.id = node.id
        statusNode.ximaPorts = ximaAllPorts[node.id]
        
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

    var kGraph = self.kGraph
    var kGraphNodeHash = self.kGraphNodeHash
    var kGraphEdgeHash = self.kGraphEdgeHash
    var transitionEdges = self.transitionEdges
    var time = (new Date()).getTime()
    
    var onSuccess = function(layouted) {
        console.log("Klay layout computation for status nodes took "+ ((new Date().getTime())-time)/1000 + "s.")
        
        var statusNodes = self.statusNodes
        
        var nodeStatusD3 = self.nodeStatusG.selectAll('g.node-status')   
        var edgeStatusD3 = self.edgeStatusG.selectAll('g.edge-status')
        var edgeNodeStatusD3 = self.edgeNodeStatusG.selectAll('g.edge-node-status')
        
        statusNodes.forEach(function(node){
            var id = node.ximaNode.id        
            var kGraphNode = kGraphNodeHash[id]
            node.kGraphNode = kGraphNode
        })
                
        // Set bendingPoints to empty array in none were needed.
        transitionEdges.forEach(function(edge,idx){
            edge.kGraphEdge.bendPoints = edge.kGraphEdge.bendPoints || []
        })
        
        // Get graph boundaries.
        self.kGraphBBox = self.getKGraphBBox(statusNodes,transitionEdges)   
            
        // Generate lines from edge vertices.
        self.transitionEdges.forEach(function(edge){
            XV.generateTransitionLines(edge)            
        })
            
        // Compute edge intersections.
        self.transitionEdgesIntersections = XV.computeEdgeIntersections(self.transitionEdges)
        
        // Compute unique intersection points.
        self.transitionEdgesNodes = XV.computeEdgeNodes(self.transitionEdgesIntersections)
                    
        var nodeStatusData = nodeStatusD3.data(statusNodes)
        var edgeStatusData = edgeStatusD3.data(transitionEdges)
        var edgeNodeStatusData = edgeNodeStatusD3.data(self.transitionEdgesNodes)
        
        // Setup node position etc. and display them.
        self.unhideNodeStatusD3Layered(nodeStatusData)
        self.updateNodeStatusD3Layered(nodeStatusData)
        self.updateEdgeStatusD3Layered(edgeStatusData)
        self.updateEdgeNodeStatusD3Layered(edgeNodeStatusData)

        self.setupGlobalEventsLayered()
    }
    
    // Start layouter.
    self.setLoadBar("Berechne Statusknotenlayout...",2*100/self.loadDialog.steps)

    var layouter = $klay.layout({
        graph: kGraph,
        options : {},
        success : onSuccess,
        error : function(error){self.handleError(error)}
    })
}
// Status nodes
XV.prototype.unhideNodeStatusD3Layered = function(nodeD3){
    //nodeD3.style({"opacity":"1.0","visibility":"visible"})
    nodeD3.style({"opacity":"0.0","visibility":"visible"})
        .transition("node-unhide")
        .duration(500)
        .style({"opacity" : "1.0"})    
}
XV.prototype.updateNodeStatusD3Layered = function(nodeD3){
    var self = this
    var status = self.layout.status
    nodeD3.each(function(d){    
        var thisNode = this
        var jThisNode = $(thisNode)
        var dThisNode = d3.select(thisNode)
        var ximaProperties = d.ximaNode.properties
        var actionNodes = d.actions
        var statusMain = self.getStatusNodeLayout(d.ximaNode)        
        
        // Get properties.
        var deletable = ximaProperties["de.xima.fc.status.deletable"]
        var onError = ximaProperties["de.xima.fc.status.onError"]
        var name = ximaProperties["de.xima.fc.status.name"]
        var actions = { "GENERAL": []}
        var actionsUnique = {"GENERAL": []}
        var actionsUniqueHash = {"GENERAL": {}}
        actionNodes.forEach(function(actionNode){
            var ximaAction = actionNode.ximaAction
            var actionType = ximaAction.properties["de.xima.fc.action.type"]
            var actionClass = XV.actionClass[actionType] || "GENERAL"
            actionNode.actionClass = actionClass
            actions[actionClass].push(actionNode)
            if (!actionsUniqueHash[actionClass][actionType]){
                actionsUniqueHash[actionClass][actionType] = [actionNode]
                actionsUnique[actionClass].push(actionsUniqueHash[actionClass][actionType])
            }
            else {
                actionsUniqueHash[actionClass][actionType].push(actionNode)
            }
        })

        // Get DOM elements.
        var elText = d.svgG.select(d.classSelectors.textTitle)
        var elTextBBox = d.svgG.select(d.classSelectors.textTitleBBox)
        var elTextEllipsis = d.svgG.select(d.classSelectors.textTitleEllipsis)
        
        var elDeletableTrue = d.svgG.select(d.classSelectors.iconDeletableTrue)
        var elDeletableFalse = d.svgG.select(d.classSelectors.iconDeletableFalse)
        var elOnErrorNext = d.svgG.select(d.classSelectors.iconOnErrorNext)
        var elOnErrorStop = d.svgG.select(d.classSelectors.iconOnErrorStop) 

        var elActionsGeneralEllipsis = d.svgG.select(d.classSelectors.textActionGeneralEllipsis)    
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
            
        // Hide unused ports.
        var portIn = dThisNode.select(statusMain.selectors.portInAuto)
        var portOutAuto = dThisNode.select(d.classSelectors.portOutAuto)            
        var portOutTimed = dThisNode.select(d.classSelectors.portOutTimed)   
        var portOutManual = dThisNode.select(d.classSelectors.portOutManual)
        var portOutAutoIcon = dThisNode.select(d.classSelectors.portOutAutoIcon)
        var portOutManualIcon = dThisNode.select(d.classSelectors.portOutManualIcon)
        var portOutTimedIcon = dThisNode.select(d.classSelectors.portOutTimedIcon)
        var portOutAutoMouseover = dThisNode.select(d.classSelectors.portOutAutoMouseover)
        var portOutTimedMouseover = dThisNode.select(d.classSelectors.portOutTimedMouseover)
        var portOutManualMouseover = dThisNode.select(d.classSelectors.portOutManualMouseover)
        if (status.hideUnusedPorts) {
            if (d.ports.AUTO.length===0) {
                portOutAuto.classed({"port-out-auto-active":false}).style({"visibility":"hidden"})
                portOutAutoIcon.classed({"port-out-auto-icon-active":false}).style({"visibility":"hidden"})
                portOutAutoMouseover.classed({"port-out-auto-mouseover-active":false}).style({"visibility":"hidden"})
            }
            else {
                portOutAuto.classed({"port-out-auto-active":true})
                portOutAutoIcon.classed({"port-out-auto-icon-active":true})                
                portOutAutoMouseover.classed({"port-out-auto-mouseover-active":true})
            }

            if (d.ports.TIMED.length===0) {
                portOutTimed.classed({"port-out-timed-active":false}).style({"visibility":"hidden"})
                portOutTimedIcon.classed({"port-out-timed-icon-active":false}).style({"visibility":"hidden"})
                portOutTimedMouseover.classed({"port-out-timed-mouseover-active":false}).style({"visibility":"hidden"})
            }
            else {
                portOutTimed.classed({"port-out-timed-active":true})
                portOutTimedIcon.classed({"port-out-timed-icon-active":true})
                portOutTimedMouseover.classed({"port-out-timed-mouseover-active":true})
            }
            
            if (d.ports.MANUAL.length===0) {
                portOutManual.classed({"port-out-manual-active":false}).style({"visibility":"hidden"})
                portOutManualIcon.classed({"port-out-manual-icon-active":false}).style({"visibility":"hidden"})
                portOutManualMouseover.classed({"port-out-manual-mouseover-active":false}).style({"visibility":"hidden"})
            }
            else {
                portOutManual.classed({"port-out-manual-active":true})
                portOutManualIcon.classed({"port-out-manual-icon-active":true})                
                portOutManualMouseover.classed({"port-out-manual-mouseover-active":true})
            }

            if (d.ports.IN.length===0) {
                portIn.classed({"port-in-active":false}).style({"visibility":"hidden"})
            }
            else {
                portIn.classed({"port-in-active":true})
            }
        }
        
        // Bind data to ports
        portOutTimed.data([d.ximaPorts.TIMED])
        portOutTimedIcon.data([d.ximaPorts.TIMED])
        portOutTimedMouseover.data([d.ximaPorts.TIMED])

        portOutManual.data([d.ximaPorts.MANUAL])
        portOutManualIcon.data([d.ximaPorts.MANUAL])
        portOutManualMouseover.data([d.ximaPorts.MANUAL])
        portOutAuto.data([d.ximaPorts.AUTO])
        portOutAutoIcon.data([d.ximaPorts.AUTO])
        portOutAutoMouseover.data([d.ximaPorts.AUTO])
        portIn.data([d.ximaPorts.IN])
        
        // Flags
        if (deletable) {
            elDeletableTrue.style("visibility","visible")
            elDeletableFalse.style("visibility","hidden")
        }
        else {
            elDeletableTrue.style("visibility","hidden")
            elDeletableFalse.style("visibility","visible")
        }
        if (onError === "STOP") {
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
        var actionsDataEllipsis = []
        
        // Show large icons if there aren't many actions configured.
        if (actionsUnique.GENERAL.length > elActionsGeneralSub.length) {
            d.svgG.select(d.classSelectors.textActionGeneralSub).style({"visibility":"hidden"})
            elActionsGeneral = elActionsGeneralMain
        }
        else {
            d.svgG.select(d.classSelectors.textActionGeneralMain).style({"visibility":"hidden"})
            elActionsGeneral = elActionsGeneralSub
        }
        
        // Hide toolbar actions expand icon if there are no actions configured.
        if (actionNodes.length===0) {
            d.svgG.select(d.classSelectors.buttons.expand.normal).style({"visibility":"hidden"})
            d.svgG.select(d.classSelectors.buttons.expand.hover).style({"visibility":"hidden"})
        }

        // Add action icons.
        elActionsGeneral.forEach(function(elActionGeneral,idx){
            var actionGeneral = actionsUnique.GENERAL[idx]
            if (actionGeneral){
                var icons = actionGeneral[0].ximaAction.properties["de.xima.fc.action.icons"]
                var iconAction = self.getImageFont(icons.action)
                elActionGeneral.style({"visibility":"visible"})
                    .text(iconAction.character)
                    .style({"font-family":iconAction.fontFamily})
                var actionDataGeneral = {}
                actionDataGeneral.actions = actionGeneral
                actionDataGeneral.exists = true
                actionsDataGeneral.push(actionDataGeneral)
                XV.addClass(elActionGeneral.node(),"text-action-active")
                XV.addClass(elActionGeneral.node(),"text-action-general")
                if (_.find(actionDataGeneral.actions,function(action){return action.ximaAction.properties["de.xima.fc.action.active"]})) {
                    XV.addClass(elActionGeneral.node(),"text-action-status-activated")
                }
                else {
                    XV.addClass(elActionGeneral.node(),"text-action-status-deactivated")
                }
                if (_.find(actionDataGeneral.actions,function(action){return action.ximaAction.properties["de.xima.fc.action.onError"]!=="STOP"})) {
                    XV.addClass(elActionGeneral.node(),"text-action-on-error-next-action")
                }
                else {
                    XV.addClass(elActionGeneral.node(),"text-action-on-error-stop")
                }
                if (_.find(actionDataGeneral.actions,function(action){return action.ximaAction.properties["de.xima.fc.action.condition"]["type"] !=="NONE"})) {
                    XV.addClass(elActionGeneral.node(),"text-action-has-condition")
                }
                else {
                    XV.addClass(elActionGeneral.node(),"text-action-has-not-condition")
                }
            }
            else {
                // No more actions, hide icon.
                XV.addClass(elActionGeneral.node(),"text-action-inactive")
                XV.addClass(elActionGeneral.node(),"text-action-general")
                elActionGeneral.style({"visibility":"hidden"})
                actionsDataGeneral.push({exists:false,actions:[]})
            }
        })
        
        // Show ellipsis only if there are more action types than icons.
        if (actionsUnique.GENERAL.length>elActionsGeneral.length) {
            elActionsGeneralEllipsis.style("visibility","visible")
                .classed('text-action-ellipsis-active',true)
            actionsDataEllipsis = {
                exists: true,
                actions: _.slice(actionsUnique.GENERAL,elActionsGeneral.length)
            }
        }
        else {
            elActionsGeneralEllipsis.style("visibility","hidden")
                .classed('text-action-ellipsis-active',false)
            actionsDataEllipsis = {
                exists: false,
                actions: []
            }
        }

        d.actionsEllipsisD3 = elActionsGeneralEllipsis
        d.actionsD3 = d3.selectAll(_.flatten(elActionsGeneral,1))
        d.actionsEllipsisD3.data([actionsDataEllipsis])
        d.actionsD3.data(actionsDataGeneral)
    })
    
    nodeD3.attr("transform",function(d){
            var newX = d.kGraphNode.x
            var newY = d.kGraphNode.y
            var dx = newX - d.bBox0.xmin
            var dy = newY - d.bBox0.ymin
            var translate0 = d.translate0
            var scale0 = d.scale0
            var newTransform = XV.getNewTranslate(this,function(r){return Pt.addC(r,dx,dy)})
            return newTransform
        })
}
// Edges between status nodes.
XV.prototype.updateEdgeStatusD3Layered = function(edgeD3) {
    var self = this
    var nodeEnter = edgeD3.enter()
    var edgesOverlayWidth = self.layout.diagram.spacing*self.layout.diagram.edgeSpacingFactor*0.9
    
    var nodeEnterG = nodeEnter.append("g")
        .classed({"edge-status":true})
        .attr("id",function(d){return d.kGraphEdge.id})
        .each(function(d){
            d.edgeG = d3.select(this)
            d.edgeGNode = this
        })
    
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
        .attr({"transform":"scale(0)"})
    
   // Enter edges for detecting mouseover.
   var nodeEnterMouseover = nodeEnterG
        .append("path")
        .classed({"edge-path-mouseover":true})
        .style({"stroke-width":edgesOverlayWidth,"fill":"none","opacity":"0.0","stroke":"transparent"})
        .attr({"transform":"scale(0)"})
    
   // Update highlight edges.
   var nodeUpdatePath = edgeD3.select("path.edge-path-highlight").attr("d",function(d){
        var kGraphEdge = d.kGraphEdge
        var bendPoints = kGraphEdge.bendPoints
        var points = [kGraphEdge.sourcePoint].concat(bendPoints).concat([kGraphEdge.targetPoint])
        return self.lineInterpolator(points)
    })    
    .style({"opacity":"1.0"})
    .attr({"transform":"scale(1)"})  

   
    // Update edges.
    var nodeUpdatePath = edgeD3.select("path.edge-path").attr("d",function(d){
        var kGraphEdge = d.kGraphEdge
        var bendPoints = kGraphEdge.bendPoints
        var points = [kGraphEdge.sourcePoint].concat(bendPoints).concat([kGraphEdge.targetPoint])
        return self.lineInterpolator(points)
    })    
        .style({"opacity":"1.0"})
        .attr({"transform":"scale(1)"})  
    
    // Update invisible edges for mouseover.
    var nodeUpdateMouseover = edgeD3.select("path.edge-path-mouseover")
        .attr("d",function(d){
            var kGraphEdge = d.kGraphEdge
            var bendPoints = kGraphEdge.bendPoints
            var points = [kGraphEdge.sourcePoint].concat(bendPoints).concat([kGraphEdge.targetPoint])
            return self.lineInterpolator(points)
        })    
        .attr({"transform":"scale(1)"})
}
// Bend point of the edges.
XV.prototype.updateEdgeNodeStatusD3Layered = function(edgeNodeD3) {
    var self = this
    var nodeEnter = edgeNodeD3.enter()
    var directions = ["north", "south", "east", "west"]
    var layoutStatus = self.layout.status
    var svgsInbound = {
        north: layoutStatus.edgeNodeInboundNorth,
        east: layoutStatus.edgeNodeInboundEast,
        west: layoutStatus.edgeNodeInboundWest,
        south: layoutStatus.edgeNodeInboundSouth
    }
    var svgsOutbound = {
        north: layoutStatus.edgeNodeOutboundNorth,
        east: layoutStatus.edgeNodeOutboundEast,
        west: layoutStatus.edgeNodeOutboundWest,
        south: layoutStatus.edgeNodeOutboundSouth
    }
    var svgsTwobound = {
        north: layoutStatus.edgeNodeTwoboundNorth,
        east: layoutStatus.edgeNodeTwoboundEast,
        west: layoutStatus.edgeNodeTwoboundWest,
        south: layoutStatus.edgeNodeTwoboundSouth
    }        

    // Enter new edge nodes.
    var nodeEnterG = nodeEnter.append("g")
        .attr("id",function(d){return d.id})
        .each(function(d){
            d.edgeNodeG = d3.select(this)
            d.edgeNodeGNode = this
        })
    
    // Update new edge nodes.
    edgeNodeD3.each(function(d){
        var edgeNodeG = d.edgeNodeG
        var inbound = d.inbound
        var outbound = d.outbound
        var nodeX = d.x
        var nodeY = d.y
        var directionsIn = _.reduce(directions,function(s,dir){return s + XV.mathSign(inbound[dir].length)},0)
        var directionsOut = _.reduce(directions,function(s,dir){return s + XV.mathSign(outbound[dir].length)},0)
        if (directionsIn > 1 || directionsOut > 1) {
            directions.forEach(function(dir,idx){
                if (outbound[dir].length===0 && inbound[dir].length>0) {
                    // only inbound edges
                    var svg = svgsInbound[dir]
                    if (svg.active){
                        var el = XV.clone(svg.svgGNode)
                        XV.moveElementTo(edgeNodeG.node(),nodeX,nodeY-svg.bBox.height,{x:0,y:0})
                        edgeNodeG.append(function(){return el})
                    }
                }
                else if (inbound[dir].length===0 && outbound[dir].length>0) {
                    // only outbound edges
                    var svg = svgsOutbound[dir]
                    if (svg.active){                    
                        var el = XV.clone(svg.svgGNode)
                        XV.moveElementTo(edgeNodeG.node(),nodeX,nodeY-svg.bBox.height,{x:0,y:0})
                        edgeNodeG.append(function(){return el})
                    }
                }
                else if (inbound[dir].length>0 && outbound[dir].length>0) {
                    // both types of edges
                    var svg = svgsTwobound[dir]
                    if (svg.active){
                        var el = XV.clone(svg.svgGNode)
                        XV.moveElementTo(edgeNodeG.node(),nodeX,nodeY-svg.bBox.height,{x:0,y:0})
                        edgeNodeG.append(function(){return el})                    
                    }
                }
            })
        }
    })
    
}

// Step 5: Setup global triggers, events etc. for the main diagram.
// Proceed to step 6 upon completion.
XV.prototype.setupGlobalEventsLayered = function(){
    var self = this

    self.setTooltipStatusTitle()
    self.setTooltipActionIcon()
    self.setTooltipActionEllipsisIcon()
    self.setTooltipTimedTransitionIcon()
    self.setTooltipManualTransitionIcon()
    self.setTooltipAutoTransitionIcon()
    self.setTooltipDeletableIcon()
    
    self.setupManualEditor()
    self.setupStatusNodeButtons()
    self.setStatusToolbar()

    self.setupEdgeHighlight()
    self.setMainToolbar()
    
    $(window).on("resize",function(event){
        var dims = self.getDimensions()
        self.svg.attr({
            width: dims.width+"px",
            height: dims.height+"px"
        })
        self.onResize.forEach(function(handler){handler(event)})
    })
        
    // Proceed to next step.
    self.loadActionsNodesToDOMLayered()
}

// Step 6: Bind data to action nodes and load to DOM.
// Proceed to step 7 upon completion.
XV.prototype.loadActionsNodesToDOMLayered = function() {
    var self = this     
    var actionPaperTemplateNode = self.viewport.select('#actionsDialogTemplate').node()
    var oldDefs = $('defs',actionPaperTemplateNode).detach()

    self.statusNodes.forEach(function(statusNode){
        var actions = statusNode.actions

        var actionPaperNode = XV.clone(actionPaperTemplateNode)
        var actionPaper = d3.select(actionPaperNode)
        var actionSvg = actionPaper.select('.actions-paper-svg')
            .attr({
                width: 10,
                height: 10
            })

        var actionSvgG = actionSvg.select('.action-paper-g')
        var actionSvgNode = actionSvg.node()
        var actionSvgGNode = actionSvgG.node()

        // Add graph for these actions to the paper.
        self.paper.appendChild(actionPaperNode)
        
        // Add zooming behavior to each dialog.
        var zoomed = function() {
            actionSvgG.attr("transform", "translate(" + d3.event.translate + "),scale(" + d3.event.scale + ")")
        }
        var zoom = d3.behavior.zoom()
            .scaleExtent([self.layout.diagram.scaleMin,self.layout.diagram.scaleMax])
            .on("zoom",zoomed)
        actionSvg.call(zoom)
        
        statusNode.actionZoom = zoom
        statusNode.edgeActionG = actionSvgG.select("g.containerEdgeAction")
        statusNode.nodeActionG = actionSvgG.select("g.containerNodeAction")
        statusNode.actionPaper = actionPaper
        statusNode.actionsDialog = $(actionPaperNode)
        statusNode.actionPaperNode = actionPaperNode
        statusNode.actionSvg = actionSvg
        statusNode.actionSvgNode = actionSvgNode
        statusNode.actionSvgG = actionSvgG
        statusNode.actionSvgGNode = actionSvgGNode    
        
        // Clone action nodes.
        actions.forEach(function(actionNode,actionNodeIdx){
            var actionMain = self.getActionNodeLayout(actionNode)
            var svgData = actionMain.svgData
            var svgGNode = actionMain.svgGNode

            var newActionGNode = $(XV.clone(svgGNode))[0]
            var newActionGNodeD3 = d3.select(newActionGNode)
                        
            actionNode.svgG = newActionGNodeD3
            actionNode.svgGNode = newActionGNode
            actionNode.selectors = actionMain.selectors
            actionNode.classSelectors = actionMain.classSelectors

        })
        
        // Load nodes to DOM.
        self.newActionNodes(statusNode)    
        
        // Update IDs so that they reference to the cloned defs.
        var newDefs = self.cleanupDefs(oldDefs,actionSvgGNode)
        $(actionSvg.node()).prepend(newDefs)            
    })

    d3.select(actionPaperTemplateNode).style("display","none")

    // Proceed to next step.
    self.prepareLayoutActionsLayered()
}
                             
// Step 7: Generate the kGraph object for the action details.
// Proceed to step 8 upon completion.
XV.prototype.prepareLayoutActionsLayered = function(){
    var self = this    
    var layout = self.layout
    var transitionID = 0
    var portID = 0
    
    self.statusNodes.forEach(function(statusNode){
        var kGraph = {}
        var kGraphNodes = []
        var kGraphEdges = []
        var portsIn = {}
        var portsOut = {}
        var actions = statusNode.actions
        var portsInMax = layout.status.actionsGraphPortsInMax
        var transitionEdges = []
            
        function createPort(port,nodeBBox) {
            var portBBox = self.getBBoxFix(port.node())
            var port = {
                id: "de.xima.fc.port-" + portID++,
                width: portBBox.width,
                height: portBBox.height,
                x: portBBox.xmin - nodeBBox.xmin,
                y: portBBox.ymin - nodeBBox.ymin,
                properties: {}
            }            
            return port            
        }
        function createPortStandard(actionNode){
            var portSelector = actionNode.classSelectors.ports.OUT.STANDARD.attach
            var port = actionNode.svgG.select(portSelector)
            var kGraphPort = createPort(port,actionNode.bBox0)
            actionNode.ports.OUT.STANDARD = {D3: port, kGraphPort: kGraphPort}            
            return kGraphPort
        }
        function createPortError(actionNode) {
            var portSelector = actionNode.classSelectors.ports.OUT.ERROR.attach
            var port = actionNode.svgG.select(portSelector)
            var kGraphPort = createPort(port,actionNode.bBox0)
            actionNode.ports.OUT.ERROR = {D3: port, kGraphPort: kGraphPort} 
            return kGraphPort
        }
        function createPortMismatch(actionNode) {
            var portSelector = actionNode.classSelectors.ports.OUT.MISMATCH.attach
            var port = actionNode.svgG.select(portSelector)
            var kGraphPort = createPort(port,actionNode.bBox0)
            actionNode.ports.OUT.MISMATCH = {D3: port, kGraphPort: kGraphPort} 
            return kGraphPort
        }
        function createPortIn(actionNode) {
            portsIn[actionNode.id] = portsIn[actionNode.id] || []
            var pIn = portsIn[actionNode.id]
            var kGraphPort
            if (pIn.length >= portsInMax || (portsInMax<1 && pIn.length>0)) {
                kGraphPort = pIn[pIn.length-1]
            }
            else {
                var portSelector = actionNode.classSelectors.ports.IN.attach
                var port = actionNode.svgG.select(portSelector)
                kGraphPort = createPort(port,actionNode.bBox0)
                pIn.push(kGraphPort)
                actionNode.ports.IN.push({D3: port, kGraphPort: kGraphPort})
            }
            return kGraphPort
        }
        
        kGraph.id = statusNode.id + "-actions-workflow"
        kGraph.children = kGraphNodes
        kGraph.edges = kGraphEdges
        kGraph.properties = {}
        
        kGraph.properties["de.cau.cs.kieler.direction"] = layout.actionsDiagram.direction
        kGraph.properties["de.cau.cs.kieler.klay.layered.nodePlace"] = layout.actionsDiagram.nodePlace
        kGraph.properties["de.cau.cs.kieler.edgeRouting"] = layout.actionsDiagram.edgeRouting
        kGraph.properties["de.cau.cs.kieler.spacing"] = layout.actionsDiagram.spacing
        kGraph.properties["de.cau.cs.kieler.borderSpacing"] = layout.actionsDiagram.borderSpacing        
        kGraph.properties["de.cau.cs.kieler.klay.layered.edgeSpacingFactor"] = layout.actionsDiagram.edgeSpacingFactor
        kGraph.properties["de.cau.cs.kieler.klay.layered.nodeLayering"] = layout.actionsDiagram.nodeLayering
        kGraph.properties["de.cau.cs.kieler.klay.layered.thoroughness"] = layout.actionsDiagram.thoroughness
        kGraph.properties["de.cau.cs.kieler.klay.layered.interactiveReferencePoint"] = layout.actionsDiagram.interactiveReferencePoint        

        // Add ports object to each action node.
        actions.forEach(function(actionNode,actionNodeIdx){
            actionNode.ports = {
                OUT: {STANDARD:null, MISMATCH:null, ERROR: null},
                IN: []
            }
        })
        
        // Iterate over each status node and add the node and edge to the kGraph object.
        actions.forEach(function(actionNode,actionNodeIdx){
            portsOut[actionNode.id] = portsOut[actionNode.id] || []
            portsIn[actionNode.id] = portsIn[actionNode.id] || []
            
            var kGraphNode = {}
            var actionMain = self.getActionNodeLayout(actionNode)
            var ximaAction = actionNode.ximaAction
            var actionProps = ximaAction.properties
            var condition = actionProps["de.xima.fc.action.condition"]
            var nextActionID = null
            
            actionNode.nextActionMismatch = null
            actionNode.nextActionStandard = null
            actionNode.nextActionError = null

            kGraphNode.properties = {}
            kGraphNode.properties["de.cau.cs.kieler.portConstraints"] = "FIXED_POS"
            kGraphNode.properties["de.cau.cs.kieler.portSpacing"] = 1
            if (actionNodeIdx===0) {
                kGraphNode.properties["de.cau.cs.kieler.klay.layered.layerConstraint"] = "FIRST"
            }
            
            // Get id of next action, if present.
            if (actionNodeIdx<actions.length-1) { // check if next action exists
                nextActionID = actions[actionNodeIdx+1].id
            }
            
            // Add edges.
            // On condition mismatch.
            var onMismatchID = null
            switch (condition.details.nextAction) {
                case 'NEXT':
                    if (nextActionID) {
                        onMismatchID = nextActionID
                    }
                    break;
                case 'STOP':
                    break;
                default:
                    onMismatchID = condition.details.nextAction
                    break;
            }
            switch (condition.type) {
                case 'NONE':
                    break;
                case 'FORM':
                    if (onMismatchID) {
                        var port = createPortMismatch(actionNode)
                        var targetNode = self.getActionResource(onMismatchID)
                        var portIn = createPortIn(targetNode)
                        var edge = {
                            id: "de.xima.fc.transition-mismatch-" + transitionID++,
                            source: ximaAction.id,
                            target: onMismatchID,
                            sourcePort: port.id,
                            targetPort: portIn.id,
                            properties: {}
                        }
                        actionNode.ports.OUT.MISMATCH.edge = edge
                        targetNode.ports.IN[targetNode.ports.IN.length-1].edge = edge
                        actionNode.nextActionMismatch = onMismatchID
                        portsOut[actionNode.id].push(port)
                        kGraphEdges.push(edge)
                        transitionEdges.push({kGraphEdge: edge})
                    }
                    break;
                case 'REGEXP':                  
                    if (onMismatchID) {
                        var port = createPortMismatch(actionNode)
                        var targetNode = self.getActionResource(onMismatchID)
                        var portIn = createPortIn(targetNode)                        
                        var edge = {
                            id: "de.xima.fc.transition-mismatch-" + transitionID++,
                            source: ximaAction.id,
                            target: onMismatchID,
                            sourcePort: port.id,
                            targetPort: portIn.id,
                            properties: {}
                        }
                        actionNode.ports.OUT.MISMATCH.edge = edge
                        targetNode.ports.IN[targetNode.ports.IN.length-1].edge = edge
                        actionNode.nextActionMismatch = onMismatchID
                        portsOut[actionNode.id].push(port)
                        kGraphEdges.push(edge)   
                        transitionEdges.push({kGraphEdge: edge})
                    }
                    break;
            }
            
            // On error.
            switch (actionProps["de.xima.fc.action.onError"]) {
                case 'STOP':
                    break;
                default:                 
                    var port = createPortError(actionNode)
                    var targetNode = self.getActionResource(actionProps["de.xima.fc.action.onError"])
                    var portIn = createPortIn(targetNode)
                    var edge = {
                        id: "de.xima.fc.transition-error-" + transitionID++,
                        source: ximaAction.id,
                        target: actionProps["de.xima.fc.action.onError"],
                        sourcePort: port.id,
                        targetPort: portIn.id,
                        properties: {}
                    }
                    actionNode.ports.OUT.ERROR.edge = edge
                    targetNode.ports.IN[targetNode.ports.IN.length-1].edge = edge
                    actionNode.nextActionError = actionProps["de.xima.fc.action.onError"]
                    portsOut[actionNode.id].push(port)
                    kGraphEdges.push(edge)
                    transitionEdges.push({kGraphEdge: edge})                    
                    break;
            }
            
            // On standard.
            if (actionProps["de.xima.fc.action.stopsWorkflow"]) {            
            }
            else {
                if (actionNodeIdx<actions.length-1) { // check if next action exists
                    var port = createPortStandard(actionNode)
                    var targetNode = self.getActionResource(nextActionID)
                    var portIn = createPortIn(targetNode)                    
                    var edge = {
                        id: "de.xima.fc.transition-standard-" + transitionID++,
                        source: ximaAction.id,
                        target: nextActionID,
                        sourcePort: port.id,
                        targetPort: portIn.id,
                        properties: {}
                    }
                    actionNode.ports.OUT.STANDARD.edge = edge
                    targetNode.ports.IN[targetNode.ports.IN.length-1].edge = edge
                    actionNode.nextActionStandard = nextActionID 
                    portsOut[actionNode.id].push(port)                    
                    kGraphEdges.push(edge)
                    transitionEdges.push({kGraphEdge: edge})
                }
            }
                        
            // Add node.
            kGraphNode.id = ximaAction.id
            kGraphNode.labels = []
            kGraphNode.width = actionMain.bBox.width
            kGraphNode.height = actionMain.bBox.height
            kGraphNode.ports = portsOut[actionNode.id].concat(portsIn[actionNode.id])
                
            kGraphNodes.push(kGraphNode)
        })
        
        statusNode.actionTransitionEdges = transitionEdges
        statusNode.actionsKGraph = kGraph
    })

    // Proceed to next step.
    self.generateActionsGraphLayered()
}

// Step 8: Run the KLay layouter for each actions graph.
//         Bind node data and update nodes.
//         Create edge data, bind it and update edges.
// Proceed to step 9 upon completion.
XV.prototype.generateActionsGraphLayered = function() {
    var self = this
    var statusNodesLength = self.statusNodes.length
    var complete = 0
    
    // Proceed to next step if there are no actions configured at all.
    if (_.every(self.statusNodes,function(statusNode){return statusNode.actions.length===0})) {
        self.setupEventsActionsLayered()
        return
    }

    self.statusNodes.forEach(function(statusNode,statusNodeIdx){
        // Nothing to be done if there are no actions.
        if (statusNode.actions.length===0){
            complete++
            if (complete===statusNodesLength){
                self.setupEventsActionsLayered()
            }            
            return
        }
        
        var kGraph = statusNode.actionsKGraph
        var transitionEdges = statusNode.actionTransitionEdges
        var time = (new Date()).getTime()
            
        var onSuccess = function(layouted) {
            console.log("Klay layout computation for actions of status node " + statusNodeIdx + " took " + ((new Date().getTime())-time)/1000 + "s.")
            self.setLoadBar("Berechne Aktionsknodenlayout für Statusknoten " + statusNode.id + "...",(statusNodeIdx/(self.statusNodes.length-1))*100/self.loadDialog.steps+2*100/self.loadDialog.steps)

            var actionNodes = statusNode.actions
            var nodeActionD3 = statusNode.nodeActionG.selectAll('g.node-action')
            var edgeActionD3 = statusNode.edgeActionG.selectAll('g.edge-action')

            actionNodes.forEach(function(actionNode,actionNodeIdx){
                actionNode.kGraphNode = layouted.children[actionNodeIdx]
            })

            // Set bendingPoints to empty array in none were needed.

            transitionEdges.forEach(function(edge){
                edge.kGraphEdge.bendPoints = edge.kGraphEdge.bendPoints || []
            })

            // Get graph boundaries.
            statusNode.actionsKGraphBBox = self.getKGraphBBox(actionNodes,transitionEdges)

            // Generate lines from edge vertices.
            transitionEdges.forEach(function(edge){
                XV.generateTransitionLines(edge)
            })

            // Compute edge intersections.
            statusNode.actionsTransitionEdgesIntersections = XV.computeEdgeIntersections(transitionEdges)

            // Compute unique intersection points.
            self.transitionEdgesNodes = XV.computeEdgeNodes(statusNode.actionsTransitionEdgesIntersections)

            // Bind data to nodes.
            var nodeActionData = nodeActionD3.data(actionNodes)
            var edgeActionData = edgeActionD3.data(transitionEdges)

            // Setup node position etc. and display them.
            self.unhideNodeActionD3Layered(nodeActionData)
            self.updateNodeActionD3Layered(nodeActionData)
            self.updateEdgeActionD3Layered(edgeActionData)

            // Proceed to penultimate step upon completion of all Klay layouters.
            complete++
            if (complete===statusNodesLength){
                self.setupEventsActionsLayered()
            }
        }


        var layouter = $klay.layout({
            graph: kGraph,
            options : {},
            success : onSuccess,
            error : function(error){self.handleError(error)}
        })
    })
}
XV.prototype.unhideNodeActionD3Layered = function(nodeD3) {
    nodeD3.style({"opacity":"1.0","visibility":"visible"})
}
XV.prototype.updateNodeActionD3Layered = function(nodeD3) {
    var self = this
    var layoutAction = self.layout.action
    
    // Setup node content.
    nodeD3.each(function(d){    
        var thisNode = this
        var jThisNode = $(thisNode)
        var dThisNode = d3.select(thisNode)
        var ximaProperties = d.ximaAction.properties
        var actionMain = self.getActionNodeLayout(d)
        
        // Get properties.
        var actionName = ximaProperties["de.xima.fc.action.name"]
        var conditionType = ximaProperties["de.xima.fc.action.condition"].type
        var onStandardStop = ximaProperties["de.xima.fc.action.stopsWorkflow"]
        var onErrorStop = ximaProperties["de.xima.fc.action.onError"] === "STOP"
        var onMismatchStop = ximaProperties["de.xima.fc.action.condition"].details.nextAction === "STOP"
        var formConditionOperator = ximaProperties["de.xima.fc.action.condition"].details["conditionOperator"]
        var textActionIcon = self.getImageFont(ximaProperties["de.xima.fc.action.icons"].action)
        var portOutStandardHidden = d.ports.OUT.STANDARD === null && !d.ximaAction.properties["de.xima.fc.action.stopsWorkflow"]
        var activeStatus = ximaProperties["de.xima.fc.action.active"]
        
        // Get DOM elements.
        var elContainerBody = d.svgG.select(d.classSelectors.containerBody)
        var elTextTitle = d.svgG.select(d.classSelectors.textTitle)
        var elTextTitleBBox = d.svgG.select(d.classSelectors.textTitleBBox)
        var elTextTitleEllipsis = d.svgG.select(d.classSelectors.textTitleEllipsis)
        var elContainerCondition = d.svgG.select(d.classSelectors.containerCondition)
        var elContainerNoCondition = d.svgG.select(d.classSelectors.containerNoCondition)
        var elTextConditionTypeFormvalue = d.svgG.select(d.classSelectors.textConditionTypeFormvalue)
        var elTextConditionTypeRegexp = d.svgG.select(d.classSelectors.textConditionTypeRegexp)      
        var elTextAction = d.svgG.select(d.classSelectors.textAction)      
        var elIconsCondition = d.svgG.select(d.classSelectors.iconsCondition)
        var elIconOnStandardStop = d.svgG.select(d.classSelectors.iconOnStandardStop)
        var elIconOnMismatchStop = d.svgG.select(d.classSelectors.iconOnMismatchStop)
        var elIconOnErrorStop = d.svgG.select(d.classSelectors.iconOnErrorStop)
        var elPortInIcon = d.svgG.select(d.classSelectors.ports.IN.icon)
        var elPortInMouseover = d.svgG.select(d.classSelectors.ports.IN.mouseover)
        var elPortOutStandardIcon = d.svgG.select(d.classSelectors.ports.OUT.STANDARD.icon)
        var elPortOutStandardMouseover = d.svgG.select(d.classSelectors.ports.OUT.STANDARD.mouseover)
        var elPortOutMismatchIcon = d.svgG.select(d.classSelectors.ports.OUT.MISMATCH.icon)
        var elPortOutMismatchMouseover = d.svgG.select(d.classSelectors.ports.OUT.MISMATCH.mouseover)
        
        // Apply properties.    
        
        // Condition name.
        self.setWrappedText(elTextTitle.node(),elTextTitleBBox.node(),elTextTitleEllipsis.node(),actionName)

        // Condition type icon.
        elTextAction.style("font-family",textActionIcon.fontFamily)
        elTextAction.text(textActionIcon.character)
        
        // Gray out inactive actions.
        activeStatus ? elContainerBody.style("filter",null) : elContainerBody.style("filter",XV.getCssUrl(elContainerBody.attr("xima-filter-id")))
        
        // Hide unused ports.
        elPortInIcon.style("visibility", d.ports.IN.length === 0 ? "hidden" : "visible")
        elPortInMouseover.style("visibility", d.ports.IN.length === 0 ? "hidden" : "visible")

        elPortOutStandardIcon.style("visibility", portOutStandardHidden  ? "hidden" : "visible")
        elPortOutStandardMouseover.style("visibility", portOutStandardHidden ? "hidden" : "visible")
    
        if (conditionType!=="NONE" && ximaProperties["de.xima.fc.action.condition"].details.nextAction!=="STOP" && d.nextActionMismatch===null) {
            elPortOutMismatchIcon.style("visibility","hidden")
            elPortOutMismatchMouseover.style("visibility","hidden")
        }
        
        // Condition sub-node.
        switch (conditionType) {
            case "NONE":
                break;
            case "FORM":
                for (var key in d.classSelectors.iconCondition) {
                    var elConditionOperator = d.svgG.select(d.classSelectors.iconCondition[key])
                    if (key !== formConditionOperator) {
                        elConditionOperator.style("visibility","hidden")
                    }
                }              
                elTextConditionTypeRegexp.style("visibility","hidden")
                break;
            case "REGEXP":
                //elContainerNoCondition.style("visibility","hidden")
                elTextConditionTypeFormvalue.style("visibility","hidden")
                elIconsCondition.style("visibility","hidden")
                break;
        }

        elIconOnStandardStop.style("visibility",onStandardStop ? "visible" : "hidden")
        elIconOnMismatchStop.style("visibility",onMismatchStop ? "visible" : "hidden")
        elIconOnErrorStop.style("visibility",onErrorStop ? "visible" : "hidden")
        
    })
    
    // Setup node position.
    nodeD3.attr("transform",function(d){
            var newX = d.kGraphNode.x
            var newY = d.kGraphNode.y
            var dx = newX - d.bBox0.xmin
            var dy = newY - d.bBox0.ymin
            var translate0 = d.translate0
            var scale0 = d.scale0
            var newTransform = XV.getNewTranslate(this,function(r){return Pt.addC(r,dx,dy)})
            return newTransform
        })
}
XV.prototype.updateEdgeActionD3Layered = function(edgeD3) {
    var self = this
    var nodeEnter = edgeD3.enter()
    
    // Enter visible edges container.
    var nodeEnterG = nodeEnter.append("g")
        .classed({"edge-action":true})
        .attr("id",function(d){return d.kGraphEdge.id})
        .each(function(d){
            d.edgeG = d3.select(this)
            d.edgeGNode = this
        })
      
    // Enter visible edges.
    var nodeEnterPath = nodeEnterG
        .append("path")
        .classed({"edge-path":true})
        .style({"fill":"none","opacity":"1.0"})
          
    // Update visible edges.
    var nodeUpdatePath = edgeD3.select("path.edge-path").attr("d",function(d){
        var kGraphEdge = d.kGraphEdge
        var bendPoints = kGraphEdge.bendPoints
        var points = [kGraphEdge.sourcePoint].concat(bendPoints).concat([kGraphEdge.targetPoint])
        return self.lineInterpolator(points)
        })    
}

// Step 9: Setup events for each action dialog graph.
// Proceed to step 10 upon completion.
XV.prototype.setupEventsActionsLayered = function(){
    var self = this
    
    self.setupActionsDialog()
    self.setTooltipPortOutMismatch()
    self.setTooltipPortOutError()
    self.setTooltipPortOutStandard()
    self.setTooltipActionCondition()
    self.setTooltipActionDetails()
    
    // Proceed to final step.
    self.finalizeLayered()
}

// Step 10: Remove load bar, zoom to graph boundaries and display the graph.
// This is the last step.
XV.prototype.finalizeLayered = function() {
    var self = this
    self.setLoadBar("Schließe Ladevorgang ab...",100)
    self.svgG.attr("opacity",0)    
    self.removeLoadBar(function(){
        self.zoomToKGraphBoundaries(null,null,null,function(transform){
            this.transition()
                .duration(1000)
                .attr({opacity:1,transform:transform})
        })
    })
}


// Enter diagram mode.
$(document).on("ready",function(){
    XV.checkBrowserSupport()
    var folder = "./"
    var element = document.getElementById('viewport')
    var urlParams = XV.getJsonFromUrl()
    XV.setDefault(urlParams,"pid",parseInt,2300)
    XV.setDefault(urlParams,"lang",String,"de")
    var servlet = "http://naiad.formcloud.de/formcycle/flowchart.jsp?pid=" + urlParams.pid + "&lang=" + urlParams.lang
    console.log("Retrieving data from " + servlet)
    var xv = new XV(folder,servlet,element)
    
    //d3.select('#paper').on("mousemove",function(){k=D.getPositionFromMouse();$('#debug').text(k.x +" , " + k.y)})
})
