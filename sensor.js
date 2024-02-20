class Sensor {
  constructor(car) {
    this.car = car
    this.rayCount = 5
    this.rayLength = 200
    this.raySpread = Math.PI / 2

    this.rays = []
    this.readings = []
  }

  update(roadBorders, traffic) {
    this.#castRays()
    this.readings = []
    for (let i = 0; i < this.rayCount; i++) {
      this.readings.push(
        this.#getRayReading(this.rays[i], roadBorders, traffic)
      )
    }
  }

  #getRayReading(ray, roadBorders, traffic) {
    let touches = []

    for (let i = 0; i < roadBorders.length; i++) {
      const touch = getIntersection(
        ray[0],
        ray[1],
        roadBorders[i][0],
        roadBorders[i][1]
      )
      if (touch) {
        touches.push(touch)
      }
      for (let i = 0; i < traffic.length; i++) {
        const poly = traffic[i].polygon
        for (let j = 0; j < poly.length; j++) {
          const touch = getIntersection(
            ray[0],
            ray[1],
            poly[j],
            poly[(j + 1) % poly.length]
          )
          if (touch) {
            touches.push(touch)
          }
        }
      }
    }
    if (touches.length === 0) {
      return null
    } else {
      const offsets = touches.map((e) => e.offset)
      const closest = Math.min(...offsets)
      return touches.find((e) => e.offset === closest)
    }
  }

  draw(ctx) {
    for (let i = 0; i < this.rayCount; i++) {
      let end = this.rays[i][1]
      if (this.readings[i]) {
        end = this.readings[i]
      }
      ctx.strokeStyle = 'yellow'
      ctx.beginPath()

      ctx.moveTo(this.rays[i][0].x, this.rays[i][0].y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()

      ctx.strokeStyle = 'grey'
      ctx.beginPath()
      ctx.moveTo(this.rays[i][1].x, this.rays[i][1].y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
    }
  }

  #castRays() {
    this.rays = []
    for (let i = 0; i < this.rayCount; i++) {
      const angle = lerp(
        this.raySpread / 2,
        -this.raySpread / 2,
        i / (this.rayCount - 1)
      )
      const start = { x: this.car.x, y: this.car.y }
      const end = {
        x: this.car.x - this.rayLength * Math.sin(this.car.angle + angle),
        y: this.car.y - this.rayLength * Math.cos(this.car.angle + angle),
      }
      this.rays.push([start, end])
    }
  }
}
