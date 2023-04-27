const FULL_RADIUS = 105
const HALF_RADIUS = 65
type AsteroidType = 'Full' | 'Half'
let types = ['Full', 'Half']

class Asteroid {
    position: p5.Vector
    velocity: p5.Vector
    radius: number
    rotation: number
    img: p5.Image
    type: AsteroidType

    constructor(img: p5.Image, velocity: p5.Vector, position: p5.Vector = createVector(random(0, width), random(0, height)), type: 'Full' | 'Half' = randomChoice(types)) {
        this.position = position
        this.type = type
        this.radius = this.type == 'Full' ? FULL_RADIUS : HALF_RADIUS
        this.img = img
        this.velocity = velocity
    }

    private _rotate_random() {
        this.rotation += random(0, 0.2)
    }

    public setPosition(position: p5.Vector) {
        this.position = position
        if (this.position.x > width + this.radius) {
            this.position.x = -this.radius
        }
        if (this.position.x < -this.radius) {
            this.position.x = width + this.radius
        }
        if (this.position.y > height + this.radius) {
            this.position.y = -this.radius
        }
        if (this.position.y < -this.radius) {
            this.position.y = height + this.radius
        }
    }

    public move() {
        push()
        this._rotate_random()
        rotate(this.rotation)
        this.setPosition(this.position.add(this.velocity))
        pop()
    }

    public draw() {
        push()
        imageMode(CENTER)
        translate(this.position)
        rotate(this.rotation)
        image(this.img, 0, 0, this.radius, this.radius)
        pop()
    }
  }
  

function randomChoice(arr: any[]): any {
    return arr[(Math.random() * arr.length) | 0]
}
