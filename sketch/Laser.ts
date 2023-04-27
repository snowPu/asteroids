

class Laser {
    position: p5.Vector
    velocity: p5.Vector
    radius: number
    color: Color

    constructor(position: p5.Vector, velocity: p5.Vector, color: Color = {
        r: random(100, 255),
        g: random(100, 255),
        b: random(100, 255),
    }) {
        this.position = position
        this.radius = 5
        this.velocity = velocity
        this.color = color
    }

    public setPosition(position: p5.Vector) {
        this.position = position
    }

    public offscreen() {
        return (this.position.x > width || this.position.x < 0 || this.position.y > height || this.position.y < 0)
    };

    public move() {
        push()
        this.setPosition(this.position.add(this.velocity))
        pop()
    }

    public draw() {
        push()
        imageMode(CENTER)
        translate(this.position)
        fill(this.color.r, this.color.g, this.color.b)
        circle(0, 0, this.radius * 2)
        pop()
    }
  }
  