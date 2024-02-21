const carCanvas = document.getElementById('carCanvas')
carCanvas.width = 200

const networkCanvas = document.getElementById('networkCanvas')
networkCanvas.width = 300

const carCtx = carCanvas.getContext('2d')
const networkCtx = networkCanvas.getContext('2d')
const road = new Road(carCanvas.width / 2, carCanvas.width * 0.9)

let N = 300
let genMutation = 0.01
let aiTopSpeed = 3
let traffic, cars, bestCar, stopId
let count = 0
let startTime = null
let timeAtStop = 0
let maxTime = 200000
let paused = false
let currentBest = 12

start(true)

function reset() {
  cars = generateCars(N)
  //cars = [new Car(road.getLaneCenter(1), 300, 30, 50, 'KEYS', aiTopSpeed, 0)]
  traffic = [
    new Car(road.getLaneCenter(1), 100, 30, 50, 'DUMMY', 2),
    new Car(road.getLaneCenter(0), -100, 30, 50, 'DUMMY', 2),
    new Car(road.getLaneCenter(1), -200, 30, 50, 'DUMMY', 2),
    new Car(road.getLaneCenter(1), -400, 30, 50, 'DUMMY', 2),
    new Car(road.getLaneCenter(2), -400, 30, 50, 'DUMMY', 2),
    new Car(road.getLaneCenter(0), -500, 30, 50, 'DUMMY', 2),
    new Car(road.getLaneCenter(2), -600, 30, 50, 'DUMMY', 2),
    new Car(road.getLaneCenter(1), -600, 30, 50, 'DUMMY', 2),
    new Car(road.getLaneCenter(1), -700, 30, 50, 'DUMMY', 2),
    new Car(road.getLaneCenter(2), -700, 30, 50, 'DUMMY', 2),
    new Car(road.getLaneCenter(0), -900, 30, 50, 'DUMMY', 2),
    new Car(road.getLaneCenter(2), -900, 30, 50, 'DUMMY', 2),
    new Car(road.getLaneCenter(1), -1000, 30, 50, 'DUMMY', 2),
    new Car(road.getLaneCenter(1), -1100, 30, 50, 'DUMMY', 2),
  ]
  // Set current best brain to all cars and mutate it
  if (localStorage.getItem('bestBrain')) {
    for (let i = 0; i < cars.length; i++) {
      cars[i].brain = JSON.parse(localStorage.getItem('bestBrain'))
      if (i !== 0) {
        NeuralNetwork.mutate(cars[i].brain, genMutation)
      }
    }
  }
  // Set car 0 with current best brain no mutation
  bestCar = cars[0]
}

function generateCars(N) {
  const cars = []
  for (i = 0; i < N; i++) {
    cars.push(new Car(road.getLaneCenter(1), 300, 30, 50, 'AI', aiTopSpeed, i))
  }
  return cars
}

function save() {
  if (bestCar.points <= currentBest) {
    console.log(
      `Generation ${count++} No improvement. Record:${
        bestCar.points
      } Current Best:${currentBest}`
    )
    return
  }
  currentBest = bestCar.points
  const name = 'bestBrain'
  localStorage.setItem(name, JSON.stringify(bestCar.brain))
  localStorage.setItem(
    'bestCar',
    JSON.stringify({ id: bestCar.id, points: bestCar.points })
  )
  console.log(
    `Generation ${count++} Record:${bestCar.points} Current Best:${currentBest}`
  )
}

function discard() {
  localStorage.removeItem('bestBrain')
  localStorage.removeItem('bestCar')
}

function removeDeadCars() {
  carsToDelete = []
  for (let i = 0; i < cars.length; i++) {
    if (
      cars[i].id !== 0 &&
      ((bestCar.y > cars[i].y + 100 && bestCar.points > cars[i].points) ||
        bestCar.y < cars[i].y - 70 ||
        cars[i].damaged)
    ) {
      carsToDelete.push(i)
    }
    cars[i].update(road.borders, traffic)
  }
  for (let i = 0; i < carsToDelete.length; i++) {
    cars.splice(carsToDelete[i], 1)
  }
}

function animate(timeStep) {
  if (!startTime) {
    startTime = timeStep
  }
  const progress = timeStep - startTime
  if (progress > maxTime || (cars.length === 1 && bestCar.damaged)) {
    save()
    start()
    startTime = timeStep
    return
  }
  if (timeStep && timeStep > 12000) {
  }
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].update(road.borders, [])
  }

  removeDeadCars()

  bestPossibleCar = cars.find(
    (car) => car.y === Math.min(...cars.map((car) => car.y))
  )
  if (bestPossibleCar && bestPossibleCar.points > bestCar.points) {
    bestCar = bestPossibleCar
  }
  const bestCarDisplay = document.getElementById('currentCar')
  bestCarDisplay.innerHTML = `Car N°${bestCar.id}`
  const aliveCarsDisplay = document.getElementById('carsAlive')
  aliveCarsDisplay.innerHTML = `${cars.length}`
  const generationDisplay = document.getElementById('generation')
  generationDisplay.innerHTML = `${count}`
  const recordDisplay = document.getElementById('record')
  recordDisplay.innerHTML = `${currentBest}`

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

  networkCtx.lineDashOffset = -timeStep / 50
  Visualizer.drawNetwork(networkCtx, bestCar.brain)
  stopId = requestAnimationFrame(animate)
}

async function start(first = false) {
  if (!first) {
    startTime = null
    cancelAnimationFrame(stopId)
    await sleep(200)
  }
  reset()
  if (first && bestCar) {
    console.log(`Current best car ${bestCar.id}`)
  }

  requestAnimationFrame(animate)
}

function pause() {
  if (paused) {
    startTime += performance.now() - timeAtStop
    requestAnimationFrame(animate)
  } else {
    timeAtStop = performance.now()
    cancelAnimationFrame(stopId)
  }
  paused = !paused
}
