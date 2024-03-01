const carCanvas = document.getElementById('carCanvas')
carCanvas.width = 200

const networkCanvas = document.getElementById('networkCanvas')
networkCanvas.width = 300

const carCtx = carCanvas.getContext('2d')
const networkCtx = networkCanvas.getContext('2d')
const road = new Road(carCanvas.width / 2, carCanvas.width * 0.9)

const bestCarDisplay = document.getElementById('currentCar')
const aliveCarsDisplay = document.getElementById('carsAlive')
const generationDisplay = document.getElementById('generation')
const recordDisplay = document.getElementById('record')
const pointsDisplay = document.getElementById('points')

carCanvas.height = window.innerHeight
networkCanvas.height = window.innerHeight

let N = 300
let genMutation = 0.3
let aiTopSpeed = 3
let traffic, cars, bestCar, stopId
let count = 0
let startTime = null
let timeAtStop = 0
let maxTime = 200000
let paused = false
let currentBest = 3

start(true)

function createTraffic() {
  return
}

function reset() {
  cars = generateCars(N)
  //cars = [new Car(road.getLaneCenter(1), 300, 30, 50, 'KEYS', aiTopSpeed, 0)]
  traffic = [
    new Car(road.getLaneCenter(0), 500, 30, 50, 'DUMMY', 2.5),
    new Car(road.getLaneCenter(1), 500, 30, 50, 'DUMMY', 2.5),
    new Car(road.getLaneCenter(2), 500, 30, 50, 'DUMMY', 2.5),
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
    new Car(road.getLaneCenter(1), -1200, 30, 50, 'DUMMY', 2),
    new Car(road.getLaneCenter(0), -1300, 30, 50, 'DUMMY', 2),
    new Car(road.getLaneCenter(2), -1400, 30, 50, 'DUMMY', 2),
    new Car(road.getLaneCenter(0), -1400, 30, 50, 'DUMMY', 2),
    new Car(road.getLaneCenter(1), -1560, 30, 50, 'DUMMY', 2),
    new Car(road.getLaneCenter(0), -1560, 30, 50, 'DUMMY', 2),
    new Car(road.getLaneCenter(2), -1700, 30, 50, 'DUMMY', 2),
  ]
  // Set current best brain to all cars and mutate it
  if (localStorage.getItem('bestBrain')) {
    for (let i = 0; i < cars.length; i++) {
      cars[i].brain = JSON.parse(localStorage.getItem('bestBrain'))
      if (i < 50) {
        NeuralNetwork.mutate(cars[i].brain, genMutation / 10)
      }
      if (i >= 50) {
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
    count++
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

function updateCars() {
  carsToDelete = []
  for (let i = 0; i < cars.length; i++) {
    let isStalker = bestCar.points - 4 > cars[i].points
    let isDamaged = cars[i].damaged

    if (isDamaged || isStalker || cars[i].y < bestCar) {
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
  if (progress > maxTime || cars.length === 0) {
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

  updateCars()

  bestPossibleCar = cars.find(
    (car) => car.y === Math.min(...cars.map((car) => car.y))
  )
  if (bestPossibleCar && bestPossibleCar.points >= bestCar.points) {
    bestCar = bestPossibleCar
  }

  updateDisplays()
  clearCanvases()

  carCtx.save()
  carCtx.translate(0, -bestCar.y + carCanvas.height * 0.8)
  road.draw(carCtx)
  for (let i = 0; i < traffic.length; i++) {
    // Draw car with its index inside
    traffic[i].draw(carCtx, 'red', i)
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

function updateDisplays() {
  bestCarDisplay.innerHTML = `N°${bestCar.id}`
  aliveCarsDisplay.innerHTML = `${cars.length}`
  generationDisplay.innerHTML = `${count}`
  recordDisplay.innerHTML = `${currentBest}`
  pointsDisplay.innerHTML = `${bestCar.points}`
}

function clearCanvases() {
  carCtx.clearRect(0, 0, carCanvas.width, carCanvas.height)
  networkCtx.clearRect(0, 0, networkCanvas.width, networkCanvas.height)
}
