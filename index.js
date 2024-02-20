console.log('Hello, world!')

const carCanvas = document.getElementById('carCanvas')
carCanvas.width = 200

const networkCanvas = document.getElementById('networkCanvas')
networkCanvas.width = 300

const carCtx = carCanvas.getContext('2d')
const networkCtx = networkCanvas.getContext('2d')
const road = new Road(carCanvas.width / 2, carCanvas.width * 0.9)

const N = 200
const cars = generateCars(N)
const genMutation = 0.15
const traffic = [
  new Car(road.getLaneCenter(1), 100, 30, 50, 'DUMMY', 2),
  new Car(road.getLaneCenter(0), -100, 30, 50, 'DUMMY', 2),
  new Car(road.getLaneCenter(2), -100, 30, 50, 'DUMMY', 2),
  new Car(road.getLaneCenter(1), -200, 30, 50, 'DUMMY', 2),
  new Car(road.getLaneCenter(1), -400, 30, 50, 'DUMMY', 2),
  new Car(road.getLaneCenter(2), -400, 30, 50, 'DUMMY', 2),
  new Car(road.getLaneCenter(0), -500, 30, 50, 'DUMMY', 2),
  new Car(road.getLaneCenter(2), -600, 30, 50, 'DUMMY', 2),
  new Car(road.getLaneCenter(1), -600, 30, 50, 'DUMMY', 2),
  new Car(road.getLaneCenter(1), -700, 30, 50, 'DUMMY', 2),
  new Car(road.getLaneCenter(2), -700, 30, 50, 'DUMMY', 2),
]

// Set current best brain to all cars and mutate it
if (localStorage.getItem('bestBrain')) {
  for (let i = 0; i < cars.length; i++) {
    cars[i].brain = JSON.parse(localStorage.getItem('bestBrain'))
    if (i !== 0) {
      NeuralNetwork.mutate(cars[i].brain, genMutation)
    }
  }
  // Set car 0 with current best brain no mutation
  let bestCar = cars[0]
  bestCar.id = JSON.parse(localStorage.getItem('bestCar'))
}

animate()

function generateCars(N) {
  const cars = []
  for (i = 0; i < N; i++) {
    cars.push(new Car(road.getLaneCenter(1), 300, 30, 50, 'AI', 4, i))
  }
  return cars
}

function save() {
  localStorage.setItem('bestBrain', JSON.stringify(bestCar.brain))
  localStorage.setItem('bestCar', JSON.stringify(bestCar.id))
}

function discard() {
  localStorage.removeItem('bestBrain')
  localStorage.removeItem('bestCar')
}

function animate(time) {
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].update(road.borders, [])
  }
  for (let i = 0; i < cars.length; i++) {
    cars[i].update(road.borders, traffic)
  }

  bestCar = cars.find((car) => car.y === Math.min(...cars.map((car) => car.y)))
  const bestCarDisplay = document.getElementById('currentCar')
  bestCarDisplay.innerHTML = `Current best car: ${bestCar.id}`

  carCanvas.height = window.innerHeight
  networkCanvas.height = window.innerHeight

  carCtx.save()
  carCtx.translate(0, -bestCar.y + carCanvas.height * 0.8)
  road.draw(carCtx)
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].draw(carCtx, 'red')
  }
  carCtx.globalAlpha = 0.2
  for (let i = 0; i < cars.length; i++) {
    cars[i].draw(carCtx, 'blue')
  }
  carCtx.globalAlpha = 1
  bestCar.draw(carCtx, 'blue', true)

  carCtx.restore()

  networkCtx.lineDashOffset = -time / 50
  Visualizer.drawNetwork(networkCtx, bestCar.brain)
  requestAnimationFrame(animate)
}
