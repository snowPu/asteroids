
class Ship {
    position: p5.Vector
    velocity: p5.Vector
    width: number
    height: number
    img: p5.Image
    thrustImg: p5.Image
    maxVelocity: number
    rotation: number
    isAccelerating: boolean
    lasers: Laser[]

    constructor(x: number, y: number, width: number, height: number, img: p5.Image, thrustImg: p5.Image, velocity: p5.Vector = createVector(0, 0)) {
        this.position = createVector(x, y)
        this.width = width
        this.height = height
        this.img = img
        this.thrustImg = thrustImg
        this.velocity = velocity
        this.maxVelocity = 10
        this.rotation = 0
        this.isAccelerating = false
        this.lasers = []
    }

    public rotate_left() {
        this.rotation -= 0.1
    }

    public rotate_right() {
        this.rotation += 0.1
    }

    public setRotation(rotation: number) {
        this.rotation = rotation
    }

    public setVelocity(velocity: p5.Vector) {
        this.velocity = velocity.limit(this.maxVelocity)
    }

    public accelerate(d_velocity: number) {
        let force = p5.Vector.fromAngle(this.rotation - PI / 2)
        force.mult(d_velocity)
        this.setVelocity(this.velocity.add(force))
    }

    public decelerate() {
        this.velocity = this.velocity.mult(0.99)
    }

    public move() {
        push()
        // rotate(this.rotation)
        this.setPosition(this.position.add(this.velocity))
        pop()
    }

    public shoot() {
        laserSound.play()
        this.lasers.push(new Laser(
            p5.Vector.add(this.position.copy(), p5.Vector.fromAngle(this.rotation - PI / 2).mult(this.height / 2)),
            p5.Vector.fromAngle(this.rotation - PI / 2).mult(30)
        ))
    }

    public setPosition(position: p5.Vector) {
        this.position = position
        if (this.position.x > width + this.height) {
            this.position.x = -this.height
        }
        if (this.position.x < -this.height) {
            this.position.x = width + this.height
        }
        if (this.position.y > height + this.height) {
            this.position.y = -this.height
        }
        if (this.position.y < -this.height) {
            this.position.y = height + this.height
        }
    }


    public draw() {
        push()

        imageMode(CENTER)
        translate(this.position)
        rotate(this.rotation)
        if (this.isAccelerating) {
            image(this.thrustImg, 0, 0, this.width, this.height)
        } else {
            image(this.img, 0, 0, this.width, this.height)
        }
        pop()
    }
  }
  