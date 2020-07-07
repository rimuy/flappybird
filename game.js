var playing
var lastPressed
var record = 0

const audio = {
    wing: new Audio('audio/wing.mp3'),
    point: new Audio('audio/point.mp3'),
    die: new Audio('audio/die.mp3')
}

function newElement(tagName, className) {
    const e = document.createElement(tagName)
    e.className = className

    return e
}

function checkCollision(a, b) {
    const eA = a.getBoundingClientRect()
    const eB = b.getBoundingClientRect()

    const horizontal = (eA.left + eA.width) >= eB.left
        && (eB.left + eB.width) >= eA.left

    const vertical = (eA.top + eA.height) >= eB.top
    && (eB.top + eB.height) >= eA.top

    return (horizontal && vertical)
}

function collision(bird, barriers) {
    let c = false

    barriers.pairs.forEach(pair => {
        if (!c) {
            const upper = pair.upper.element
            const lower = pair.lower.element
            c = checkCollision(bird.element, upper) || checkCollision(bird.element, lower)
        }
    })

    return c
}

class FlappyBird {
    constructor() {
        let score = 0

        const area = document.querySelector('[wm-flappy]')
        const gameHeight = area.clientHeight
        const gameWidth = area.clientWidth

        const progress = new Progress()
        const barriers = new Barriers(gameHeight, gameWidth, 330, 400, () => progress.updateScore(++score))
        const bird = new Bird(gameHeight)
        
        area.appendChild(progress.element)
        area.appendChild(bird.element)
        barriers.pairs.forEach(pair => area.appendChild(pair.element))

        this.start = () => {
            const timer = setInterval(() => {
                barriers.animate()
                bird.animate()

                // Death
                if (collision(bird, barriers) || bird.getY() <= 0) {
                    playing = false

                    if (bird.getY() < 0) bird.setY(0)
                    progress.element.style.display = 'none'
                    document.querySelector('.endgame').style.display = 'initial'

                    document.addEventListener("keydown", e => {
                        if (e.keyCode === 32) window.location.reload(false)
                    }, false);

                    clearInterval(timer)
                    audio.die.play()
                }
            }, 20)

            playing = true
        }
    }
}

class Barrier {
    constructor(reverse) {
        this.element = newElement('div', 'barrier')

        const border = newElement('div', 'border')
        const body = newElement('div', 'body')

        this.element.appendChild(reverse ? body : border)
        this.element.appendChild(reverse ? border : body)

        this.setHeight = height => body.style.height = `${height}px`
    }
}

class TwinBarriers {
    constructor(height, spacing, x) {
        this.element = newElement('div', 'twin-barriers')

        this.upper = new Barrier(true)
        this.lower = new Barrier(false)

        this.element.appendChild(this.upper.element)
        this.element.appendChild(this.lower.element)

        this.sortSpacing = () => {
            const upperHeight = Math.random() * (height - spacing)
            const lowerHeight = height - spacing - upperHeight

            this.upper.setHeight(upperHeight)
            this.lower.setHeight(lowerHeight)
        }

        this.getX = () => parseInt(this.element.style.left.split('px')[0])
        this.setX = x => this.element.style.left = `${x}px`
        this.getWidth = () => this.element.clientWidth

        this.sortSpacing()
        this.setX(x)
    }
}

class Barriers {
    constructor(height, width, spacing, space, score) {
        const generatedBarries = 5

        this.pairs = []

        for(let i = 0; i < generatedBarries; i++)
            this.pairs.push(new TwinBarriers(height, spacing, width + (space * i)));


        const gameSpeed = 4
        this.animate = () => {
            this.pairs.forEach(pair => {
                pair.setX(pair.getX() - gameSpeed)

                //
                if (pair.getX() < -pair.getWidth()) {
                    pair.setX(pair.getX() + space * this.pairs.length)
                    pair.sortSpacing()
                }

                const middle = (width / 2) - 130
                if (pair.getX() + gameSpeed >= middle && pair.getX() < middle) score()
            })
        }
    }
}

class Bird {
    constructor(gameHeight) {
        let flying = false
        const middle = (gameHeight / 2)
        
        lastPressed = Date.now()

        this.element = newElement('img', 'bird')
        this.element.src = 'imgs/bird.png'
        this.element.draggable = 'false'

        this.getY = () => parseInt(this.element.style.bottom.split('px')[0])
        this.setY = y => this.element.style.bottom = `${y}px`

        window.onmousedown = () => {
            if (!playing) return
            lastPressed = Date.now()
            flying = true
            audio.wing.play()
        }

        //window.onmouseup = () => flying = false

        this.animate = () => {
            const speedUp = (Date.now() - lastPressed) / 50

            const newY = this.getY() + (flying ? 15 : (-5 - speedUp))
            const maxHeight = gameHeight - this.element.clientHeight

            if (newY <= 0) {
                this.setY(0)
            } else if (newY >= maxHeight) {
                this.setY(maxHeight)
            } else this.setY(newY)

            if ((Date.now() - lastPressed) > 200) flying = false

            this.element.style['transform'] = `rotate(${(newY - middle) * -.1}deg)`
        }

        this.setY(middle)
    }
}

class Progress {
    constructor() {
        this.element = newElement('span', 'progress')
        this.updateScore = score => {
            this.element.innerHTML = score
            audio.point.play()

            record = record < score ? score : record
        }

        this.updateScore(0)
    }
}
new FlappyBird().start()