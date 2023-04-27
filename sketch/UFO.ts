type UFOType = 'NORMAL' | 'UPGRADE'




class UFO {
    config: UFOConfig
    position: p5.Vector
    velocity: p5.Vector
    width: number
    height: number
    img: p5.Image
    maxVelocity: number
    rotation: number
    lasers: Laser[]
    type: UFOType
    lifeSeconds: number | undefined

    constructor(
        config: UFOConfig,
        width: number,
        height: number,
        type: UFOType,
        position: p5.Vector = createVector(random(0, width), random(0, height)),
        velocity: p5.Vector = createVector(random(-config.maxVelocity, config.maxVelocity), random(-config.maxVelocity, config.maxVelocity))
    ) {
        this.config = config
        this.position = position
        this.width = width
        this.height = height
        this.velocity = velocity
        this.maxVelocity = 10
        this.rotation = random(-0.5, 0.5)
        this.lasers = []
        this.type = type
        if (this.type == 'NORMAL') {
            this.img = ufoImage
            this.lifeSeconds = undefined
        } else {
            this.img = ufoUprageImage
            this.lifeSeconds = config.ufoUpgradeLifetimeSeconds
        }
    }

    public rotate_left() {
        this.rotation -= 0.05
    }

    public rotate_right() {
        this.rotation += 0.05
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

    private _rotate_random() {
        this.rotation += random(0, 0.05)
    }

    public move() {
        push()
        this._rotate_random()
        this.setPosition(this.position.add(this.velocity))
        pop()
    }

    public decrementLife() {
        if (this.lifeSeconds !== undefined && frameCount % 30 == 0) {
            this.lifeSeconds -= 1
        }
    }

    public shoot() {
        this.lasers.push(new Laser(
            p5.Vector.add(this.position.copy(), p5.Vector.fromAngle(this.rotation - PI / 2).mult(this.height / 2)),
            p5.Vector.fromAngle(this.rotation - PI / 2).mult(10),
            {
                r: 200,
                g: 0,
                b: 0,
            }
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
        image(this.img, 0, 0, this.width, this.height)
        if (this.lifeSeconds !== undefined) {
            translate(0, SHIP_HEIGHT * 0.7)
            noStroke()
            fill(255, 225, 117)
            circle(0, 0, 35)
            textAlign(CENTER, CENTER)
            textSize(24)
            fill(0, 0, 0)
            text(Math.ceil(this.lifeSeconds), 0, 0);
        }
        pop()
    }
  }
  