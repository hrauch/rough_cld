/*
 * rough_cld_steps.js
 * 
 * Author: Hans Rauch
 * License: MIT License
 * Created: 2022-08-30
 * Last modified: 2022-09-21
 * Version: 0.88
 *
 * Draws causal loop diagrams in rough mode.
*/
 

class RoughCld {
    
    URL_SNS = "http://www.w3.org/2000/svg"
    
    info = null
    svg = null      // canvas
    rc = null       // using the roughjs library
    popover = null  // popovers by bootstrap
    // styling
    font_family = "'Architects Daughter', sans-serif"
    plus_color = '#bfee3f'
    minus_color = '#f562a3'
    strength_fill_style = 'cross-hatch'

    r = 60        // radius for nodes
    nodes = []
    edges = []

    constructor(canvas_name) {
        this.info = document.getElementById(canvas_name + "_info")
        this.svg = document.getElementById(canvas_name)
        this.rc = rough.svg(this.svg)
    }

    get_popover(url, title, info) {
        // create bootstrap popover
        let link = document.createElementNS(this.URL_SNS, "a");
        link.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', url);
        link.setAttributeNS(null,"tabindex", "0")
        link.setAttributeNS(null,"class", "d-inline-block")
        link.setAttributeNS(null,"data-bs-custom-class", "custom-popover")
        link.setAttributeNS(null,"data-bs-placement", "top")
        link.setAttributeNS(null,"data-bs-toggle", "popover")
        link.setAttributeNS(null,"data-bs-trigger", "focus")
        link.setAttributeNS(null,"data-bs-title", title)
        link.setAttributeNS(null,"data-bs-content", info)
        this.popover = new bootstrap.Popover(link)
        return this.svg.appendChild(link)
    }

    create_node(node) {
        // create and draw node for causal diagram
        let link = null
        let svg_node = null
        
        if ((node.url != "" ) || (node.info != "")) {
            link = this.get_popover(node.url, node.title, node.info)
        } else {
            link = this.svg
        }

        // white background for popover-link
        svg_node = document.createElementNS(this.URL_SNS, 'circle')
        svg_node.setAttributeNS(null,"cx", node.x)     
        svg_node.setAttributeNS(null,"cy", node.y) 
        svg_node.setAttributeNS(null,"r", this.r) 
        svg_node.setAttributeNS(null, "fill", "white")
        link.appendChild(svg_node)
        
        // rough circle
        svg_node = this.rc.circle(node.x, node.y, 2 * this.r, {fill: node.color})
        link.appendChild(svg_node)
        
        // title
        svg_node = document.createElementNS(this.URL_SNS, 'text')
        svg_node.setAttributeNS(null,"x", node.x)     
        svg_node.setAttributeNS(null,"y", node.y) 
        svg_node.setAttributeNS(null,"dy", 24 / 4) 
        svg_node.setAttributeNS(null, "font-size", "24")
        svg_node.setAttributeNS(null, "font-family", this.font_family)
        svg_node.setAttributeNS(null, "text-anchor", "middle")
        svg_node.innerHTML = node.title
        link.appendChild(svg_node)
        return link
    }

    create_edge (edge) {
        // create and draw connection desscribed by edge
        let link = null
        let node = null
        let Cb = {}

        let from = edge.from
        let to = edge.to
        // some maths
        let A = {x: this.nodes[from].x, y: this.nodes[from].y}
        let C = {x: this.nodes[to].x, y: this.nodes[to].y}
        let dx = C.x - A.x
        let dy = C.y - A.y
        let w = Math.sqrt(dx*dx + dy*dy)
        let h = A.y - C.y
        // Base point for center perpendicular
        let Bac = {x: A.x + dx /2, y: A.y + dy / 2}
        // B is in the middle of A and C and is <bend> away from the connecting line
        let v = 0
        if (w != 0) {
            v = Math.asin(h / w)
            let v2 = Math.atan(dy / dx)
        }
        if (Bac.x <= A.x) {
            v += Math.PI / 2
        } else {
            if (Bac.y <= C.y) {
                if (Bac.y == C.y) {
                    v -= Math.PI / 2
                }
            } else {
                v += Math.PI
            }
        }

        let B = {x: 0, y: 0}
        
        let b_slope = 0
        if (dx != 0) {
            if (dy == 0) {
                if (dx > 0) {
                    b_slope = Math.PI / 2
                } else {
                    b_slope = -Math.PI / 2
                }
            } else {
                b_slope = -1 / (dy / dx)
            }
        } else {
            b_slope = 0
        }
        if (dy > 0) {
            B.x = Bac.x + edge.bend * Math.cos(b_slope)
            B.y = Bac.y + edge.bend * Math.sin(b_slope)
        } else {
            B.x = Bac.x - edge.bend * Math.cos(b_slope)
            B.y = Bac.y - edge.bend * Math.sin(b_slope)
        }
        // Angle between points C and B
        let vCB = Math.atan((C.y - B.y) / (C.x - B.x))
        // correct the angle
        if ((C.x > A.x) || ((C.x == A.x) && (C.y < A.y))) {
            vCB += Math.PI
        }
        // Cb is on the circle (this.r+5)
        if (edge.bend < 0) {
            vCB += Math.PI
            if (C.x == A.x){
                vCB -= Math.PI
            }
            Cb = {x: C.x - (this.r + 5) * Math.cos(vCB), y: C.y - (this.r + 5) * Math.sin(vCB)}
        } else {
            Cb = {x: C.x + (this.r + 5) * Math.cos(vCB), y: C.y + (this.r + 5) * Math.sin(vCB)}
        }

        // draw connecting line
        if (edge.url != "") {
            link = this.get_popover(edge.url, this.nodes[edge.from].title + " - " + this.nodes[edge.to].title , edge.info)
        } else {
            link = this.svg
        }

        // curved connecting line
        let points = [[A.x, A.y], [B.x, B.y], [Cb.x, Cb.y]]
        let b = this.rc.curve(points, {stroke: 'black', strokeWidth: Math.abs(edge.strength), roughness: 1.5})
        link.appendChild(b)

        // Arrow
        let a_left = 0
        let a_right = 0
        let aLength = 20
        let l = null
        if (edge.bend > 0) {
            a_left = vCB - 0.3 + Math.PI
            a_right = vCB + 0.6 + Math.PI
            l = this.rc.line(Cb.x, Cb.y, Cb.x - aLength * Math.cos(a_left), Cb.y - 20 * Math.sin(a_left), {strokeWidth: 2})
            b.appendChild(l)
            l = this.rc.line(Cb.x, Cb.y, Cb.x - aLength * Math.cos(a_right), Cb.y - 20 * Math.sin(a_right), {strokeWidth: 2})
            b.appendChild(l)
        } else {
            a_left = vCB - 0.6 + Math.PI
            a_right = vCB + 0.3 + Math.PI
            l = this.rc.line(Cb.x, Cb.y, Cb.x + aLength * Math.cos(a_left), Cb.y + 20 * Math.sin(a_left), {strokeWidth: 2})
            b.appendChild(l)
            l = this.rc.line(Cb.x, Cb.y, Cb.x + aLength * Math.cos(a_right), Cb.y + 20 * Math.sin(a_right), {strokeWidth: 2})
            b.appendChild(l)
        }
        // while developing and testing
        //l = this.rc.line(Bac.x, Bac.y, B.x, B.y, {strokeWidth: 1, stroke: 'red'})
        //b.appendChild(l)
        //l = this.rc.circle(B.x, B.y, 20, {strokeWidth: 1, stroke: 'purple'})
        //b.appendChild(l)

        // white background for popover-link
        node = document.createElementNS(this.URL_SNS, 'circle')
        node.setAttributeNS(null,"cx", B.x)     
        node.setAttributeNS(null,"cy", B.y) 
        node.setAttributeNS(null,"r", 20) 
        node.setAttributeNS(null, "fill", "white")
        link.appendChild(node);        
        // rough circle
        if (edge.strength > 0) {
            node = this.rc.circle(B.x, B.y, this.r-20, {fill: this.plus_color, fillStyle: this.strength_fill_style})
        } else {
            node = this.rc.circle(B.x, B.y, this.r - 20, {fill: this.minus_color, fillStyle: this.strength_fill_style})
        }
        link.appendChild(node)
        // + or -
        node = document.createElementNS(this.URL_SNS, 'text')
        node.setAttributeNS(null,"x", B.x)
        node.setAttributeNS(null,"y", B.y) 
        node.setAttributeNS(null,"dy", 28 / 4) 
        node.setAttributeNS(null, "font-size", "28")
        node.setAttributeNS(null, "font-family", this.font_family)
        node.setAttributeNS(null, "text-anchor", "middle")
        if (edge.strength > 0) {
            node.innerHTML = "+"
        } else {
            node.innerHTML = "-"
        }
        link.appendChild(node)
        return link
    }

    draw_cld(l_nodes, l_edges, complete) {
        // draw causal loop diagram
        let from = 0
        let to = 0
        let t = []
        let node = {}
        this.nodes = []
        for (let i=0; i < l_nodes.length; i++) {
            t = l_nodes[i]
            node = {id: t[0], x: t[1], y: t[2], color: t[3], url: t[4], title: t[5], info: t[6]}
            this.nodes.push(node)
        }
        let edge = {}
        this.edges = []
        for (let i=0; i < l_edges.length; i++) {
            t = l_edges[i]
            edge = {from: t[0], to: t[1], bend: t[2], strength: t[3], url: t[4], info: t[5]}
            this.edges.push(edge)
        }
        if (complete) {
            for (let i=0; i < this.edges.length; i++) {
                this.create_edge(this.edges[i])
            }
            for (let i=0; i < this.nodes.length; i++) {
                this.create_node(this.nodes[i])
            }
        } else {
            this.next_edge()
        }
    }

    // draw causal loop stepwise

    n_curr = 0
    obj_edges = []
    obj_nodes = []

    next_edge() {
        // draw causal loop stepwise forward
        let from = 0
        let to = 0
        let text = ""
        let curr = Math.floor(this.n_curr / 2)
        if (curr < this.edges.length) {
                this.obj_edges.push(this.create_edge(this.edges[curr]))
                this.obj_nodes.push(this.create_node(this.nodes[from]))
                text += "<h4>" + this.nodes[from].title + " &rarr; " + this.nodes[to].title + "</h4>\n"
                if (this.n_curr == 0) {
                    text += "<p>" + this.nodes[from].info + " &rarr; " + this.edges[curr].info + "</p>"
                } else {
                    text += "<p>" + this.edges[curr].info + "</p>\n"
                }
            } else {
                this.obj_nodes.push(this.create_node(this.nodes[to]))
                text += "<h3>" + this.nodes[to].title + "</h3>\n"
                text += "<p>" + this.nodes[to].info + "</p>"
            }
            this.info.innerHTML = text
            this.n_curr += 1
        }
    }

    prev_edge() {
        // draw causal loop stepwise backward    
        let from = 0
        let to = 0
        let obj = null
        let text = ""
        if (this.n_curr > 1) {
            this.n_curr -= 1
            let curr = Math.floor(this.n_curr / 2)
            from = this.edges[curr].from
            to = this.edges[curr].to
            if (this.n_curr % 2 == 0) {
                obj = this.obj_edges.pop()
                this.svg.removeChild(obj)
                obj = this.obj_nodes.pop()
                this.svg.removeChild(obj)
                if (this.n_curr > 0) {
                    text += "<h3>" + this.nodes[from].title + "</h3>\n"
                    text += "<p>" + this.nodes[from].info + "</p>"
                }
            } else {
                obj = this.obj_nodes.pop()
                this.svg.removeChild(obj)
                text += "<h4>" + this.nodes[from].title + " &rarr; " + this.nodes[to].title + "</h4>\n"
                text += "<p>" + this.edges[curr].info + "</p>\n"
            }
            this.info.innerHTML = text
        }
    }
}
