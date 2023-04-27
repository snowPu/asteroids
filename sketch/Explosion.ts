class Explosion {
    position: p5.Vector
    speed: number
    size: p5.Vector
    images: p5.Image[]
    private _index: number
    private _frame: number

    constructor(position: p5.Vector, speed: number, size: p5.Vector, images: p5.Image[]) {
        this.position = position
        this.speed = speed
        this.size = size
        this.images = images
        this._index = 0
        this._frame = 0
    }

    public animate() {
        this._frame += 1
        this._index += this.speed
    }

    public getFrame(): number {
        return this._frame
    }

    public draw() {
        push()
        imageMode(CENTER)
        translate(this.position)
        image(this.images[floor(this._index) % this.images.length], 0, 0, this.size.x, this.size.y)
        pop()
    }
  }
  