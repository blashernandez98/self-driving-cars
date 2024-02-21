class Car {
  constructor(x, y, width, height, controlType, maxSpeed = 3, id = 4343) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height

    this.speed = 0
    this.acceleration = 0.2
    this.maxSpeed = maxSpeed
    this.friction = 0.05
    this.angle = 0
    this.id = id

    this.useBrain = controlType === 'AI'
    if (controlType !== 'DUMMY') {
      this.sensors = new Sensor(this)
      this.brain = new NeuralNetwork([this.sensors.rayCount, 6, 4])
    }
    this.controls = new Controls(controlType)
    this.damaged = false
  }

  update(roadBorders, traffic) {
    if (!this.damaged) {
      this.#move()
      this.polygon = this.#createPolygon()
      this.damaged = this.#assessDamage(roadBorders, traffic)
      this.points = 0
      for (let i = 0; i < traffic.length; i++) {
        if (this.y < traffic[i].y) {
          this.points += 1
        }
      }
    }
    if (this.sensors) {
      this.sensors.update(roadBorders, traffic)
      const offsets = this.sensors.readings.map((e) =>
        e == null ? 0 : 1 - e.offset
      )
      const output = NeuralNetwork.feedForward(offsets, this.brain)

      if (this.useBrain) {
        this.controls.forward = output[0]
        this.controls.left = output[1]
        this.controls.right = output[2]
        this.controls.backward = output[3]
      }
    }
  }

  #move() {
    if (this.controls.forward) {
      this.speed += this.acceleration
    }
    if (this.controls.backward) {
      this.speed -= this.acceleration
    }
    if (this.speed > this.maxSpeed) {
      this.speed = this.maxSpeed
    }
    if (this.speed < -this.maxSpeed / 2) {
      this.speed = -this.maxSpeed / 2
    }
    if (this.speed > 0) {
      this.speed -= this.friction
    }
    if (this.speed < 0) {
      this.speed += this.friction
    }
    if (Math.abs(this.speed) < this.friction) {
      this.speed = 0
    }
    if (this.speed != 0) {
      const flip = this.speed > 0 ? 1 : -1

      if (this.controls.left) {
        this.angle += 0.03 * flip
      }
      if (this.controls.right) {
        this.angle -= 0.03 * flip
      }
    }

    this.x -= this.speed * Math.sin(this.angle)
    this.y -= this.speed * Math.cos(this.angle)
  }

  draw(ctx, color, showSensors = false) {
    ctx.fillStyle = color
    if (this.damaged) {
      ctx.fillStyle = 'red'
    }

    ctx.beginPath()
    ctx.moveTo(this.polygon[0].x, this.polygon[0].y)
    for (let i = 1; i < this.polygon.length; i++) {
      ctx.lineTo(this.polygon[i].x, this.polygon[i].y)
    }
    ctx.fill()
    if (this.sensors && showSensors) {
      this.sensors.draw(ctx)
    }
  }

  #createPolygon() {
    const points = []
    const rad = Math.hypot(this.width, this.height) / 2
    const alpha = Math.atan2(this.width, this.height)

    points.push({
      x: this.x - Math.sin(this.angle - alpha) * rad,
      y: this.y - Math.cos(this.angle - alpha) * rad,
    })

    points.push({
      x: this.x - Math.sin(this.angle + alpha) * rad,
      y: this.y - Math.cos(this.angle + alpha) * rad,
    })

    points.push({
      x: this.x - Math.sin(Math.PI + this.angle - alpha) * rad,
      y: this.y - Math.cos(Math.PI + this.angle - alpha) * rad,
    })

    points.push({
      x: this.x - Math.sin(Math.PI + this.angle + alpha) * rad,
      y: this.y - Math.cos(Math.PI + this.angle + alpha) * rad,
    })
    return points
  }

  #assessDamage(roadBorders, traffic) {
    for (let i = 0; i < roadBorders.length; i++) {
      if (polyIntersect(this.polygon, roadBorders[i])) {
        return true
      }
    }
    for (let i = 0; i < traffic.length; i++) {
      if (polyIntersect(this.polygon, traffic[i].polygon)) {
        return true
      }
    }
    return false
  }
}
